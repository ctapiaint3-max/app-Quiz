// api/assistant.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { context, question } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clave API de Gemini no está configurada.' });
  }

  const prompt = `Eres un asistente experto y tu única fuente de conocimiento es el siguiente documento. Responde la pregunta del usuario basándote exclusivamente en la información contenida en este texto. Si la respuesta no se encuentra en el texto, indica amablemente que no tienes esa información en el documento proporcionado.\n\nDOCUMENTO:\n---\n${context}\n---\n\nPREGUNTA DEL USUARIO: ${question}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
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
      throw new Error(errorData.error.message || 'Error en la API de Gemini');
    }

    const result = await response.json();
    const reply = result.candidates[0].content.parts[0].text;
    
    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
