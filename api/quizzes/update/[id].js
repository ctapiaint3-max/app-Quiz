import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id } = req.query; // El ID viene de la URL
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { title, quiz_data, is_public } = req.body;

        const client = await db.connect();
        
        // Primero, verificamos que el quiz pertenezca al usuario que intenta editarlo
        const { rows: ownerCheck } = await client.sql`
            SELECT user_id FROM quizzes WHERE id = ${id};
        `;

        if (ownerCheck.length === 0 || ownerCheck[0].user_id !== userId) {
            client.release();
            return res.status(403).json({ message: 'No tienes permiso para editar este quiz.' });
        }
        
        // Si la verificación es exitosa, actualizamos el quiz
        await client.sql`
            UPDATE quizzes 
            SET 
                title = ${title}, 
                quiz_data = ${JSON.stringify(quiz_data)}, 
                is_public = ${is_public},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id};
        `;
        client.release();

        res.status(200).json({ message: 'Quiz actualizado correctamente.' });
    } catch (error) {
        console.error('Error actualizando el quiz:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}