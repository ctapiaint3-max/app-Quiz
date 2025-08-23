import pool from '../lib/db'; // Ajusta la ruta según tu estructura de proyecto
import fetch from 'node-fetch'; // Asegúrate de tener node-fetch instalado
import withAuth from './middleware/auth'; // La ruta sube un nivel

/**
 * Manejador para el asistente de IA general.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { question, history, context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL ERROR: La variable de entorno GEMINI_API_KEY no está configurada.");
    return res.status(500).json({ error: 'Error de configuración en el servidor. El servicio de IA no está disponible.' });
  }

  // El userId se obtiene del middleware de autenticación.
  const { userId } = req.user;

  let systemInstructionText = "Tu nombre es Kai. Eres un asistente de IA amigable, servicial y experto en una amplia gama de temas. Tu propósito es ayudar a los usuarios a aprender y resolver sus dudas de manera clara y concisa. Siempre responde en español.";

  if (context && context.trim() !== '') {
    systemInstructionText = `Tu nombre es Kai. Eres un asistente experto, eres el asistente de aprendizaje del usuario, tu lo ayudaras a resolver dudas, y si te sube un documento lo ayudaras con la peticion que te haga relacionada a es documento.\n\nDOCUMENTO:\n---\n${context}\n---`;
  }
  
  const contents = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.text }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const payload = {
    contents: [{ role: 'user', parts: [{ text: systemInstructionText }] }, { role: 'model', parts: [{ text: "Entendido. Procederé como Kai." }] }, ...contents],
  };

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Respuesta no válida de la API de IA.' }}));
      throw new Error(errorData.error.message || 'Error en la API de IA');
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0]) {
        throw new Error("La respuesta de la IA no tuvo el formato esperado o fue bloqueada.");
    }

    const reply = result.candidates[0].content.parts[0].text;
    
    // --- Lógica de Base de Datos ---
    // Guardamos la interacción en la base de datos para llevar un historial.
    let client;
    try {
      // 1. Conectar a la base de datos
      client = await db.connect();
      // 2. Guardar la interacción (asumimos que existe una tabla 'ai_chat_history')
      await client.sql`
        INSERT INTO ai_chat_history (user_id, question, reply, context)
        VALUES (${userId}, ${question}, ${reply}, ${context || null});
      `;
    } catch (dbError) {
      // Si falla el guardado en la BD, no interrumpimos la respuesta al usuario.
      // Simplemente lo registramos en el log del servidor para futura depuración.
      console.error('Error al guardar el historial del chat en la base de datos:', dbError);
    } finally {
      // 3. Desconectar (liberar el cliente) para devolverlo al pool de conexiones.
      if (client) {
        client.release();
      }
    }
    // --- Fin de la lógica de base de datos ---

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Error en /api/assistant-general:', error);
    res.status(500).json({ error: error.message });
  }
}

// Envolvemos el manejador con el middleware de autenticación.
export default withAuth(handler);
