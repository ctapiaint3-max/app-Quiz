// api/generate-quiz.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { sourceText, numQuestions } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // ¡La clave se lee de forma segura!

  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada en el servidor.' });
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
                    id: { type: "NUMBER", description: "Identificador numérico único para la pregunta." },
                    pregunta: { type: "STRING", description: "El texto de la pregunta." },
                    tema: { type: "STRING", description: "El tema principal de la pregunta." },
                    respuestas: {
                        type: "ARRAY",
                        description: "Una lista de posibles respuestas.",
                        items: {
                            type: "OBJECT",
                            properties: {
                                id: { type: "NUMBER", description: "Identificador numérico único para la respuesta." },
                                respuesta: { type: "STRING", description: "El texto de la respuesta." },
                                correcta: { type: "BOOLEAN", description: "Indica si esta es la respuesta correcta." }
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
      throw new Error(errorData.error.message || `Error de la API: ${response.statusText}`);
    }

    const result = await response.json();
    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
