import { db } from '@vercel/postgres';
import withAuth from '../../middleware/auth'; // La ruta sube dos niveles

/**
 * Manejador para cambiar el estado de visibilidad (público/privado) de un quiz.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const { id: quizId } = req.query;
        const { userId } = req.user; // userId viene del middleware

        const client = await db.connect();

        // --- Lógica de Autorización ---
        // 1. Obtenemos el quiz para verificar su propietario y estado actual.
        const { rows: quizData } = await client.sql`
            SELECT user_id, is_public FROM quizzes WHERE id = ${quizId};
        `;

        // 2. Si no se encuentra, devolvemos un 404.
        if (quizData.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Quiz no encontrado.' });
        }

        // 3. Verificamos que el usuario actual sea el propietario.
        if (quizData[0].user_id !== userId) {
            client.release();
            return res.status(403).json({ error: 'No tienes permiso para modificar este quiz.' });
        }

        // Si la autorización es correcta, procedemos a cambiar el estado.
        const newIsPublic = !quizData[0].is_public;
        
        await client.sql`
            UPDATE quizzes SET is_public = ${newIsPublic} WHERE id = ${quizId};
        `;
        client.release();

        res.status(200).json({ message: 'Visibilidad actualizada.', isPublic: newIsPublic });

    } catch (error) {
        console.error('Error al cambiar el estado de visibilidad:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Envolvemos el manejador con el middleware para proteger la ruta.
export default withAuth(handler);
