import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No autorizado' });
    
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { quizId, score, details } = req.body;
        if (!quizId || score === undefined) {
            return res.status(400).json({ message: 'Faltan datos (quizId, score).' });
        }

        const client = await db.connect();
        await client.sql`
            INSERT INTO results (quiz_id, user_id, score, details)
            VALUES (${quizId}, ${userId}, ${score}, ${JSON.stringify(details || {})});
        `;
        
        // Aquí puedes añadir la lógica de gamificación (rachas, logros) si lo deseas
        
        client.release();
        res.status(201).json({ message: 'Resultado guardado.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar resultado.' });
    }
}