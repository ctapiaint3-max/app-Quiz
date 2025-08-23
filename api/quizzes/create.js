import { db } from '@vercel/postgres';
import withAuth from '../middleware/auth';

/**
 * Manejador para crear un nuevo quiz para el usuario autenticado.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // El userId ahora viene de forma segura desde el middleware.
    const { userId } = req.user;
    const { title, quiz_data, is_public } = req.body;

    if (!title || !quiz_data || !quiz_data.questions) {
      return res.status(400).json({ error: 'Faltan datos para crear el quiz.' });
    }

    const client = await db.connect();
    
    // Pasamos el objeto `quiz_data` directamente. 
    // La librería de Vercel Postgres se encarga de serializarlo a JSONB.
    const { rows } = await client.sql`
        INSERT INTO quizzes (user_id, title, quiz_data, is_public)
        VALUES (${userId}, ${title}, ${quiz_data}, ${is_public || false})
        RETURNING id, title;
    `;
    client.release();

    res.status(201).json({ message: 'Quiz creado exitosamente', quiz: rows[0] });
  } catch (error) {
    console.error('Error al crear el quiz:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// Envolvemos el manejador con el middleware para asegurar que solo usuarios
// autenticados puedan crear quizzes.
export default withAuth(handler);
