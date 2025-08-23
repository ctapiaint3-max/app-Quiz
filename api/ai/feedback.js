import pool from '../lib/db';
import withAuth from '../middleware/auth'; // La ruta sube un nivel

/**
 * Manejador para generar feedback personalizado para el usuario autenticado.
 * @param {import('http').IncomingMessage} req - La solicitud entrante.
 * @param {import('http').ServerResponse} res - La respuesta del servidor.
 */
async function handler(req, res) {
    // 1. Verificación de Variables de Entorno (solo la necesaria para esta API)
    const { GOOGLE_GENERATIVE_AI_API_KEY } = process.env;
    if (!GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("CRITICAL ERROR: La variable de entorno GEMINI_API_KEY no está configurada.");
        return res.status(500).json({ error: "Error de configuración en el servidor. El servicio de IA no está disponible." });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    try {
        const { userId } = req.user; // userId viene del middleware

        // 2. Obtener resultados de la base de datos
        const client = await pool.connect();
        const { rows: results } = await client.sql`
            SELECT q.title, r.score, r.completed_at 
            FROM results r
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE r.user_id = ${userId}
            ORDER BY r.completed_at DESC
            LIMIT 20;
        `;
        client.release();

        if (results.length < 3) {
            return res.status(200).json({ feedback: "¡Hola! Soy Kai. Aún no tienes suficientes resultados para un análisis detallado. ¡Completa al menos 3 quizzes para empezar!" });
        }

        // 3. Construir el Prompt para la IA
        const prompt = `
            Eres Kai, un asistente de estudio amigable y motivador. Analiza los siguientes resultados de quizzes de un usuario para ayudarle a mejorar.
            Datos de los últimos quizzes: ${JSON.stringify(results, null, 2)}
            
            Basado en estos datos, responde en no más de 150 palabras con el siguiente formato Markdown:
            - Un título amigable como "### ¡Aquí está tu análisis de rendimiento!".
            - **Fortalezas**: Menciona 1 o 2 temas donde obtiene buenas calificaciones consistentemente.
            - **Áreas de Oportunidad**: Identifica 1 o 2 temas con calificaciones más bajas o inconsistentes.
            - **Sugerencia Concreta**: Ofrece una recomendación clara y accionable para mejorar.
            
            Mantén un tono positivo y alentador. Siempre responde en español.
        `;

        // 4. Llamar a la API de Gemini
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_GENERATIVE_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json().catch(() => ({ error: { message: 'Respuesta no válida de la API de IA.' }}));
            console.error('Error en la respuesta de la API de IA:', errorBody);
            throw new Error(errorBody.error.message || 'La IA no pudo procesar la solicitud.');
        }

        const data = await geminiResponse.json();
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!feedback) {
            throw new Error("La respuesta de la IA no tuvo el formato esperado.");
        }

        res.status(200).json({ feedback });

    } catch (error) {
        console.error('Error en /api/ai/feedback:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor.' });
    }
}

// Envolvemos el manejador con el middleware de autenticación.
export default withAuth(handler);
