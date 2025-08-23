import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { quizId } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (!quizId) {
            return res.status(400).json({ message: 'Falta el ID del quiz.' });
        }

        const client = await db.connect();
        const { rows: history } = await client.sql`
            SELECT id, score, completed_at
            FROM results
            WHERE user_id = ${userId} AND quiz_id = ${quizId}
            ORDER BY completed_at DESC
            LIMIT 10; -- Mostramos los últimos 10 intentos
        `;
        client.release();

        res.status(200).json(history);

    } catch (error) {
        console.error('Error fetching quiz history:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}