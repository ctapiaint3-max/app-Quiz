import { db } from '@vercel/postgres';
import withAuth from '../middleware/auth';

/**
 * Manejador para obtener los quizzes de un usuario autenticado.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
  // Ya no necesitamos verificar el token aquí, el middleware `withAuth` se encarga de eso.

  if (req.method !== 'GET') {
    // Es una buena práctica mantener la validación del método HTTP.
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // El middleware `withAuth` ha verificado el token y añadido `req.user`.
    const { userId } = req.user;

    const client = await db.connect();
    const { rows } = await client.sql`
        SELECT id, title, created_at, is_public, quiz_data 
        FROM quizzes 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
    `;
    client.release();

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error en /api/quizzes/my-quizzes:', error);
    // Usamos una respuesta de error estandarizada.
    res.status(500).json({ error: 'Error interno del servidor al obtener los quizzes.' });
  }
}

// Envolvemos nuestro manejador con el middleware de autenticación.
// Cualquier petición a esta ruta deberá tener un token válido.
export default withAuth(handler);
