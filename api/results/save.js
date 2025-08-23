import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { quizId, score, details } = req.body;

        if (!quizId || score === undefined) {
            return res.status(400).json({ message: 'Faltan datos del resultado (quizId, score).' });
        }

        const client = await db.connect();
        await client.sql`
            INSERT INTO results (quiz_id, user_id, score, details)
            VALUES (${quizId}, ${userId}, ${score}, ${JSON.stringify(details || {})});
        `;
        
        // Lógica de Gamificación (Rachas)
        const today = new Date().toISOString().split('T')[0];
        const { rows: streakData } = await client.sql`
            SELECT current_streak, last_completed_date FROM streaks WHERE user_id = ${userId};
        `;

        if (streakData.length === 0) {
            // Si no hay racha, crea una nueva
            await client.sql`INSERT INTO streaks (user_id, current_streak, last_completed_date) VALUES (${userId}, 1, ${today});`;
        } else {
            const lastDate = new Date(streakData[0].last_completed_date);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                // Si completó un quiz ayer, incrementa la racha
                await client.sql`UPDATE streaks SET current_streak = current_streak + 1, last_completed_date = ${today} WHERE user_id = ${userId};`;
            } else if (lastDate.toISOString().split('T')[0] !== today) {
                // Si rompió la racha (no completó ayer), la reinicia a 1
                await client.sql`UPDATE streaks SET current_streak = 1, last_completed_date = ${today} WHERE user_id = ${userId};`;
            }
            // Si ya completó uno hoy, no se hace nada
        }

        client.release();
        res.status(201).json({ message: 'Resultado guardado.' });

    } catch (error) {
        console.error('Error al guardar el resultado:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}