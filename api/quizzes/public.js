import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);

        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT 
                q.id, 
                q.title, 
                q.created_at, 
                u.name as author, 
                (SELECT COUNT(*) FROM results r WHERE r.quiz_id = q.id) as attempts
            FROM quizzes q
            JOIN users u ON q.user_id = u.id
            WHERE q.is_public = TRUE
            ORDER BY attempts DESC, q.created_at DESC;
        `;
        client.release();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener quizzes públicos:', error);
        res.status(500).json({ message: 'Error interno del servidor al cargar la comunidad.' });
    }
}