import { db } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 1. Verificación de Autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    // 2. Verificación de la Clave API de Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Error: La variable de entorno GEMINI_API_KEY no está configurada.');
        return res.status(500).json({ message: 'La configuración del servidor de IA es incorrecta.' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 3. Obtener el historial de resultados del usuario
        const client = await db.connect();
        const { rows: results } = await client.sql`
            SELECT q.title, r.score, r.completed_at 
            FROM results r
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE r.user_id = ${userId}
            ORDER BY r.completed_at DESC
            LIMIT 20; -- Limitamos a los últimos 20 para no sobrecargar el prompt
        `;
        client.release();

        if (results.length < 3) { // Necesitamos un mínimo de datos para un buen análisis
            return res.status(200).json({ feedback: "¡Hola! Soy Kai. Aún no tienes suficientes resultados para un análisis detallado. ¡Completa al menos 3 quizzes para que pueda ayudarte a mejorar!" });
        }

        // 4. Construir el Prompt para la IA
        const prompt = `
            Eres Kai, un asistente de estudio amigable y motivador.
            Analiza los siguientes resultados de quizzes de un usuario. Tu objetivo es identificar patrones para ayudarle a mejorar.

            Datos de los últimos quizzes:
            ${JSON.stringify(results, null, 2)}

            Basado en estos datos, responde en no más de 150 palabras y sigue esta estructura:
            1.  **Fortalezas**: Menciona 1 o 2 temas o quizzes donde el usuario consistentemente obtiene buenas calificaciones (más de 80).
            2.  **Áreas de Oportunidad**: Identifica 1 o 2 temas o quizzes donde las calificaciones son más bajas (menos de 70) o inconsistentes.
            3.  **Sugerencia Concreta**: Ofrece una recomendación clara y accionable. Por ejemplo: "Te sugiero repasar [Tema Específico]" o "Enfócate en las preguntas de [Tipo de Quiz]".
            
            Mantén un tono positivo y alentador.
        `;

        // 5. Llamar a la API de Gemini
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Error en la respuesta de la API de IA:', errorBody);
            throw new Error('La IA no pudo procesar la solicitud.');
        }

        const data = await geminiResponse.json();

        // 6. Enviar la respuesta al Frontend
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