import { db } from '@vercel/postgres';
import withAuth from '../middleware/auth'; // La ruta sube un nivel

/**
 * Manejador para obtener un quiz específico por su ID.
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
        const { userId } = req.user; // userId viene del middleware

        const client = await db.connect();
        const { rows } = await client.sql`
            SELECT id, title, quiz_data, is_public, user_id FROM quizzes WHERE id = ${quizId};
        `;
        client.release();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Quiz no encontrado.' });
        }

        const quiz = rows[0];

        // --- Lógica de Autorización ---
        // Un usuario puede ver el quiz si es público, O si es el propietario.
        if (!quiz.is_public && quiz.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para ver este quiz.' });
        }

        // Por seguridad, no enviamos el user_id del propietario al cliente.
        const { user_id, ...quizDataToSend } = quiz;

        res.status(200).json(quizDataToSend);

    } catch (error) {
        console.error(`Error en /api/quizzes/${req.query.quizId}:`, error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Envolvemos el manejador con el middleware para asegurar que solo usuarios
// autenticados puedan intentar acceder a los quizzes.
export default withAuth(handler);
