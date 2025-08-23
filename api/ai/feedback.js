import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // 1. Verificación robusta de Variables de Entorno
    const { JWT_SECRET, GEMINI_API_KEY, POSTGRES_URL } = process.env;
    if (!JWT_SECRET || !GEMINI_API_KEY || !POSTGRES_URL) {
        console.error("CRITICAL ERROR: Faltan variables de entorno esenciales.");
        return res.status(500).json({ message: "Error de configuración en el servidor. Revisa las variables de entorno en Vercel." });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // 2. Obtener resultados de la base de datos
        const client = await db.connect();
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
            return res.status(200).json({ feedback: "¡Hola! Soy Kai. Aún no tienes suficientes resultados para un análisis detallado. ¡Completa al menos 3 quizzes!" });
        }

        // 3. Construir el Prompt para la IA
        const prompt = `
            Eres Kai, un asistente de estudio amigable. Analiza los siguientes resultados de quizzes de un usuario para ayudarle a mejorar.
            Datos: ${JSON.stringify(results, null, 2)}
            Basado en estos datos, responde en no más de 150 palabras con:
            1.  **Fortalezas**: Menciona temas donde obtiene buenas calificaciones consistentemente.
            2.  **Áreas de Oportunidad**: Identifica temas con calificaciones más bajas.
            3.  **Sugerencia Concreta**: Ofrece una recomendación clara y accionable.
            Mantén un tono positivo.
        `;

        // 4. Llamar a la API de Gemini
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
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
        res.status(500).json({ message: error.message || 'Error interno del servidor.' });
    }
}