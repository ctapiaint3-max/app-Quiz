import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const { title, quiz_data, is_public } = req.body;

        if (!title || !quiz_data || !quiz_data.questions) {
            return res.status(400).json({ message: 'Faltan datos para crear el quiz.' });
        }

        const client = await db.connect();
        // **CORRECCIÓN CLAVE**: Se pasa el objeto `quiz_data` directamente.
        // La librería de Vercel Postgres se encarga de convertirlo a JSONB.
        const { rows } = await client.sql`
            INSERT INTO quizzes (user_id, title, quiz_data, is_public)
            VALUES (${userId}, ${title}, ${quiz_data}, ${is_public || false})
            RETURNING id, title;
        `;
        client.release();

        res.status(201).json({ message: 'Quiz creado exitosamente', quiz: rows[0] });
    } catch (error) {
        console.error('Error al crear el quiz:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}