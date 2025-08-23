import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).end();

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT a.name, a.description, a.icon, ua.earned_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ${userId}
            ORDER BY ua.earned_at DESC;
        `;
        client.release();
        
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener logros.' });
    }
}