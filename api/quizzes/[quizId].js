import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { quizId } = req.query;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);

        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT id, title, quiz_data, is_public FROM quizzes WHERE id = ${quizId};
        `;
        client.release();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Quiz no encontrado.' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el quiz.' });
    }
}