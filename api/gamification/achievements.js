import pool from '../lib/db';
import withAuth from '../middleware/auth'; // La ruta sube un nivel

/**
 * Manejador para obtener los logros de un usuario autenticado.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        // El userId se obtiene de forma segura del token verificado por el middleware.
        const { userId } = req.user;

        const client = await pool.connect();
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
        console.error('Error en /api/gamification/achievements:', error);
        res.status(500).json({ error: 'Error al obtener los logros.' });
    }
}

// Envolvemos el manejador con el middleware de autenticación.
export default withAuth(handler);
