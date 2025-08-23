import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de autenticación no proporcionado.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const client = await db.connect();
        // Esta consulta asume que tus tablas se llaman 'quizzes' y 'users'
        const { rows } = await client.sql`
            SELECT id, title, created_at, is_public, quiz_data 
            FROM quizzes 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC;
        `;
        client.release();

        res.status(200).json(rows);

    } catch (error) {
        console.error('Error en /api/quizzes/my-quizzes:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los quizzes.' });
    }
}