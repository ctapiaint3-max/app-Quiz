import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).end();
    
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const { quizId, score, details } = req.body;

        if (!quizId || score === undefined) {
            return res.status(400).json({ message: 'Faltan datos del resultado.' });
        }

        const client = await db.connect();
        
        // 1. Guardar resultado (sin cambios)
        await client.sql`
            INSERT INTO results (quiz_id, user_id, score, details)
            VALUES (${userId}, ${quizId}, ${score}, ${JSON.stringify(details || {})});
        `;
        
        // 2. Lógica de Gamificación (Rachas y Logros)
        let earnedAchievements = [];
        
        // --- Otorgar Logro: 'Primeros Pasos' ---
        const { rows: userResults } = await client.sql`SELECT id FROM results WHERE user_id = ${userId};`;
        if (userResults.length === 1) {
            await client.sql`INSERT INTO user_achievements (user_id, achievement_id) VALUES (${userId}, 1) ON CONFLICT DO NOTHING;`;
            earnedAchievements.push('Primeros Pasos');
        }

        // --- Otorgar Logro: 'Perfeccionista' ---
        if (parseFloat(score) === 100) {
            await client.sql`INSERT INTO user_achievements (user_id, achievement_id) VALUES (${userId}, 2) ON CONFLICT DO NOTHING;`;
            earnedAchievements.push('Perfeccionista');
        }

        // --- Lógica de Rachas y Logro 'Estudiante Constante' ---
        const today = new Date().toISOString().split('T')[0];
        const { rows: streakData } = await client.sql`SELECT current_streak, last_completed_date FROM streaks WHERE user_id = ${userId};`;
        let currentStreak = 0;

        if (streakData.length === 0) {
            await client.sql`INSERT INTO streaks (user_id, current_streak, last_completed_date) VALUES (${userId}, 1, ${today});`;
            currentStreak = 1;
        } else {
            const lastDate = new Date(streakData[0].last_completed_date);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                await client.sql`UPDATE streaks SET current_streak = current_streak + 1, last_completed_date = ${today} WHERE user_id = ${userId};`;
                currentStreak = streakData[0].current_streak + 1;
            } else if (lastDate.toISOString().split('T')[0] !== today) {
                await client.sql`UPDATE streaks SET current_streak = 1, last_completed_date = ${today} WHERE user_id = ${userId};`;
                currentStreak = 1;
            } else {
                currentStreak = streakData[0].current_streak;
            }
        }
        
        if (currentStreak >= 5) {
            await client.sql`INSERT INTO user_achievements (user_id, achievement_id) VALUES (${userId}, 3) ON CONFLICT DO NOTHING;`;
            earnedAchievements.push('Estudiante Constante');
        }

        client.release();
        res.status(201).json({ message: 'Resultado guardado.', newAchievements: earnedAchievements });

    } catch (error) {
        console.error('Error al guardar resultado:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}