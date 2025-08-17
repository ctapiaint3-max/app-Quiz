export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { sourceText, numQuestions } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clave API de Gemini no está configurada en el servidor.' });
  }

  const prompt = `Basado en el siguiente texto, genera ${numQuestions} preguntas de opción múltiple. Cada pregunta debe tener entre 2 y 4 respuestas, donde solo una es correcta. Identifica y asigna un tema relevante a cada pregunta basándote en el contenido. Formatea la salida completa como un único array de objetos JSON que se ajuste estrictamente al esquema proporcionado. El texto es: \n\n"${sourceText}"`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "NUMBER" },
                    pregunta: { type: "STRING" },
                    tema: { type: "STRING" },
                    respuestas: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                id: { type: "NUMBER" },
                                respuesta: { type: "STRING" },
                                correcta: { type: "BOOLEAN" }
                            },
                            required: ["id", "respuesta", "correcta"]
                        }
                    }
                },
                required: ["id", "pregunta", "tema", "respuestas"]
            }
        }
    }
  };

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de la API de Gemini:', errorData);
      throw new Error(errorData.error.message || `Error de la API: ${response.statusText}`);
    }

    const result = await response.json();
    res.status(200).json(result);

  } catch (error) {
    console.error('Error en la función serverless:', error);
    res.status(500).json({ error: error.message });
  }
}