import pool from '../../lib/db'; // La ruta sube un nivel
import withAuth from '../middleware/auth'; // La ruta sube un nivel
const db = pool();

/**
 * Manejador para obtener el historial de resultados de un quiz para el usuario autenticado.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const { quizId } = req.query;
        const { userId } = req.user; // userId viene de forma segura del middleware

        const client = await pool.connect();
        const { rows } = await client.sql`
            SELECT id, score, completed_at FROM results
            WHERE user_id = ${userId} AND quiz_id = ${quizId}
            ORDER BY completed_at DESC LIMIT 10;
        `;
        client.release();

        res.status(200).json(rows);

    } catch (error) {
        console.error(`Error en /api/results/${req.query.quizId}:`, error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el historial.' });
    }
}

// Envolvemos el manejador con el middleware para proteger la ruta.
export default withAuth(handler);
