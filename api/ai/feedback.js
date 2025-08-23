// api/ai/feedback.js
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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'La clave API de Gemini no está configurada.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const client = await db.connect();
        const { rows: results } = await client.sql`
            SELECT q.title, r.score, r.completed_at 
            FROM results r
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE r.user_id = ${userId}
            ORDER BY r.completed_at DESC
            LIMIT 20; -- Limita a los últimos 20 resultados para no sobrecargar el prompt
        `;
        client.release();

        if (results.length === 0) {
            return res.status(200).json({ feedback: "Aún no tienes suficientes datos para un análisis. ¡Sigue practicando!" });
        }

        const prompt = `
            Analiza los siguientes resultados de quizzes de un usuario. 
            Identifica sus posibles fortalezas y debilidades.
            Ofrece 2-3 sugerencias concretas sobre qué temas podría repasar o en qué podría mejorar.
            Sé amigable y motivador. Tu nombre es Kai.
            
            Datos de los últimos quizzes:
            ${JSON.stringify(results, null, 2)}
        `;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        if (!geminiResponse.ok) {
            throw new Error('Error al contactar la API de IA.');
        }

        const data = await geminiResponse.json();
        const feedback = data.candidates[0].content.parts[0].text;

        res.status(200).json({ feedback });

    } catch (error) {
        console.error('Error in AI feedback:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}