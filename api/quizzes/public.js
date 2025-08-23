import pool from '../lib/db';
import withAuth from '../middleware/auth'; // La ruta sube un nivel

/**
 * Manejador para obtener todos los quizzes marcados como públicos.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // La autenticación ya fue manejada por el middleware `withAuth`.
    // No necesitamos acceder a `req.user` aquí, pero sabemos que la petición es de un usuario válido.

    try {
        const client = await pool.connect();
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
        res.status(500).json({ error: 'Error interno del servidor al cargar la comunidad.' });
    }
}

// Envolvemos el manejador con el middleware para asegurar que solo usuarios
// autenticados puedan ver los quizzes de la comunidad.
export default withAuth(handler);