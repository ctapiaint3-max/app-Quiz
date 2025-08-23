import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 1. Verificación de Autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de autenticación no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verificación del Token y obtención del ID de usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 3. Conexión y Consulta a la Base de Datos
        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT id, title, created_at, is_public, quiz_data 
            FROM quizzes 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC;
        `;
        client.release();

        // 4. Envío de la respuesta exitosa
        res.status(200).json(rows);

    } catch (error) {
        // 5. Manejo de Errores Detallado
        console.error('Error en /api/quizzes/my-quizzes:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido o expirado.' });
        }
        
        // Este mensaje es genérico, pero el error específico se mostrará en los logs de Vercel
        res.status(500).json({ message: 'Error interno del servidor al obtener los quizzes.' });
    }
}