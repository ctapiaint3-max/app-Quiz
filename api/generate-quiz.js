// FILE: /api/generate-quiz.js

// --- Función de Validación ---
// Revisa si el JSON generado por la IA tiene la estructura correcta.
const isValidQuizFormat = (quiz) => {
  if (!Array.isArray(quiz) || quiz.length === 0) return false;

  for (const question of quiz) {
    if (
      typeof question.pregunta !== 'string' ||
      typeof question.tema !== 'string' ||
      !Array.isArray(question.respuestas) ||
      question.respuestas.length < 2 // Debe tener al menos 2 opciones
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
    // Valida que haya exactamente una respuesta correcta por pregunta.
    if (correctCount !== 1) {
      return false;
    }
  }
  return true;
};

export default async function handler(req, res) {
  // 1. Aceptar solo peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Extraer datos del cuerpo de la petición
    const { sourceText, numQuestions } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 3. Validar que la clave de API exista (causa común de error 500)
    if (!apiKey) {
      console.error("Error: La variable de entorno GEMINI_API_KEY no está configurada.");
      throw new Error("La clave de API del servidor no está configurada.");
    }
    
    // 4. Validar que los datos necesarios fueron enviados
    if (!sourceText || !numQuestions) {
        return res.status(400).json({ error: 'Faltan el texto fuente o el número de preguntas.' });
    }

    // 5. Construir el prompt para la IA, siendo muy específico con el formato
    const prompt = `
      Basado en el siguiente texto, genera un cuestionario de ${numQuestions} preguntas en formato JSON.
      El JSON debe ser un array de objetos. Cada objeto debe tener estas claves exactas:
      - "pregunta": una cadena de texto con la pregunta.
      - "tema": una cadena de texto con el tema principal de la pregunta.
      - "respuestas": un array de objetos, donde cada objeto tiene:
        - "respuesta": una cadena de texto con la opción.
        - "correcta": un booleano (true si es la correcta, false si no lo es).
      
      Es crucial que solo una respuesta por pregunta tenga el valor "correcta" en true.
      No incluyas saltos de línea ni caracteres extraños en el JSON.
      
      Texto fuente:
      """
      ${sourceText}
      """
    `;

    // 6. Realizar la llamada a la API de Gemini con el nombre del modelo corregido
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    // --- MANEJO DE ERRORES MEJORADO ---
    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.json().catch(() => geminiResponse.text());
        const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
        console.error("Error de la API de Gemini:", errorMessage);
        throw new Error(`La API de Gemini devolvió un error: ${errorMessage}`);
    }

    const result = await geminiResponse.json();

    // 7. Extraer, limpiar y validar el JSON de la respuesta
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const cleanedJsonText = jsonText.replace(/^```json\s*|```\s*$/g, '');
        const parsedJson = JSON.parse(cleanedJsonText);

        if (!isValidQuizFormat(parsedJson)) {
            console.error("Validación fallida. Formato de la IA:", cleanedJsonText);
            throw new Error('El formato del JSON generado por la IA no es válido.');
        }
        
        // --- CORRECCIÓN APLICADA AQUÍ ---
        // Modificamos el objeto de respuesta para que contenga el JSON ya limpio.
        // Esto evita que el frontend tenga que lidiar con el texto sucio.
        result.candidates[0].content.parts[0].text = JSON.stringify(parsedJson);
        
        res.status(200).json(result);

    } else {
        console.error("Respuesta inesperada de la IA:", result);
        throw new Error("La respuesta de la IA no tuvo el formato esperado.");
    }
    
  } catch (error) {
    // 8. Manejo de errores centralizado
    console.error('Error en /api/generate-quiz:', error);
    res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
  }
}
