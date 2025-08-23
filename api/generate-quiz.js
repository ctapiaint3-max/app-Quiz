// FILE: /api/generate-quiz.js

// --- NUEVA FUNCIÓN DE VALIDACIÓN ---
// Esta función revisa si el JSON generado por la IA cumple con la estructura requerida.
const isValidQuizFormat = (quiz) => {
  if (!Array.isArray(quiz) || quiz.length === 0) return false;

  for (const question of quiz) {
    if (
      typeof question.pregunta !== 'string' ||
      typeof question.tema !== 'string' ||
      !Array.isArray(question.respuestas) ||
      question.respuestas.length === 0
    ) {
      return false;
    }

    let correctCount = 0;
    for (const answer of question.respuestas) {
      if (
        typeof answer.respuesta !== 'string' ||
        typeof answer.correcta !== 'boolean'
      ) {
        return false;
      }
      if (answer.correcta) {
        correctCount++;
      }
    }
    // Debe haber exactamente una respuesta correcta por pregunta
    if (correctCount !== 1) {
      return false;
    }
  }
  return true;
};


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { sourceText, numQuestions } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Asegúrate de tener esta variable en tu .env

    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }
    
    if (!sourceText || !numQuestions) {
        return res.status(400).json({ error: 'Faltan el texto fuente o el número de preguntas.' });
    }

    const prompt = `
      Basado en el siguiente texto, genera un cuestionario de ${numQuestions} preguntas en formato JSON.
      El JSON debe ser un array de objetos. Cada objeto debe tener:
      - "pregunta": una cadena de texto con la pregunta.
      - "tema": una cadena de texto con el tema principal de la pregunta.
      - "respuestas": un array de objetos, donde cada objeto tiene:
        - "respuesta": una cadena de texto con la opción.
        - "correcta": un booleano (true si es la correcta, false si no lo es).
      
      Asegúrate de que solo una respuesta por pregunta sea la correcta.
      
      Texto fuente:
      """
      ${sourceText}
      """
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error("Error de la API de Gemini:", errorData);
        throw new Error('La API de Gemini devolvió un error.');
    }

    const result = await geminiResponse.json();

    // --- PASO DE VALIDACIÓN AÑADIDO ---
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
        const jsonText = result.candidates[0].content.parts[0].text;
        // Limpiamos el texto por si la IA añade ```json y ``` al principio y al final
        const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '');
        const parsedJson = JSON.parse(cleanedJsonText);

        if (!isValidQuizFormat(parsedJson)) {
            // Si el formato no es válido, lanzamos un error.
            throw new Error('El formato del JSON generado por la IA no es válido.');
        }
    } else {
        throw new Error("La respuesta de la IA no tuvo el formato esperado.");
    }
    
    res.status(200).json(result);

  } catch (error) {
    console.error('Error en /api/generate-quiz:', error);
    res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
  }
}
