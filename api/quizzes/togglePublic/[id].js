import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const client = await db.connect();
        const { rows: quizData } = await client.sql`
            SELECT user_id, is_public FROM quizzes WHERE id = ${id};
        `;

        if (quizData.length === 0 || quizData[0].user_id !== userId) {
            client.release();
            return res.status(403).json({ message: 'No tienes permiso para modificar este quiz.' });
        }

        const newIsPublic = !quizData[0].is_public;
        
        await client.sql`
            UPDATE quizzes SET is_public = ${newIsPublic} WHERE id = ${id};
        `;
        client.release();

        res.status(200).json({ message: 'Visibilidad actualizada.', isPublic: newIsPublic });

    } catch (error) {
        console.error('Error toggling public status:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}