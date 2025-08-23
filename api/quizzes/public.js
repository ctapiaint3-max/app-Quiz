// api/quizzes/public.js
import { db } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    try {
        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT q.id, q.title, q.created_at, u.name as author, (SELECT COUNT(*) FROM results r WHERE r.quiz_id = q.id) as attempts
            FROM quizzes q
            JOIN users u ON q.user_id = u.id
            WHERE q.is_public = TRUE
            ORDER BY attempts DESC;
        `;
        client.release();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching public quizzes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}