import pool from '../../lib/db';
import withAuth from '../../middleware/auth'; // La ruta sube dos niveles

/**
 * Manejador para actualizar un quiz existente.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { id: quizId } = req.query;
    const { userId } = req.user; // userId viene del middleware
    const { title, quiz_data, is_public } = req.body;

    // Validación de los datos de entrada
    if (!title || !quiz_data || !quiz_data.questions) {
      return res.status(400).json({ error: 'Faltan datos para actualizar el quiz.' });
    }

    const client = await db.connect();

    // --- Lógica de Autorización ---
    // 1. Verificamos si el quiz existe y obtenemos el ID de su propietario.
    const { rows: ownerCheck } = await client.sql`
        SELECT user_id FROM quizzes WHERE id = ${quizId};
    `;

    // 2. Si no se encuentra el quiz, devolvemos un error 404.
    if (ownerCheck.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Quiz no encontrado.' });
    }

    // 3. Comparamos el propietario del quiz con el usuario que hace la petición.
    if (ownerCheck[0].user_id !== userId) {
      client.release();
      return res.status(403).json({ error: 'No tienes permiso para editar este quiz.' });
    }
    
    // Si la autorización es exitosa, procedemos a actualizar.
    await client.sql`
        UPDATE quizzes 
        SET 
            title = ${title}, 
            quiz_data = ${quiz_data}, 
            is_public = ${is_public},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${quizId};
    `;
    client.release();

    res.status(200).json({ message: 'Quiz actualizado correctamente.' });
  } catch (error) {
    console.error('Error actualizando el quiz:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// Envolvemos el manejador con el middleware para proteger la ruta.
export default withAuth(handler);
