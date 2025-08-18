// api/assistant-general.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { question, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clave API de Gemini no está configurada.' });
  }

  // Instrucción del sistema para definir la personalidad de la IA
  const systemInstruction = {
    role: 'system',
    parts: [{ text: "Tu nombre es Kai. Eres un asistente de IA amigable y servicial. Tu propósito es ayudar a los usuarios a aprender y resolver sus dudas de manera clara y concisa."}]
  };
  
  // Preparamos el historial para la IA, asegurando el formato correcto
  const contents = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.text }]
  }));
  
  // Añadimos la nueva pregunta del usuario
  contents.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const payload = {
    contents: [systemInstruction, ...contents], // Añadimos la instrucción del sistema al inicio
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
      throw new Error(errorData.error.message || 'Error en la API');
    }

    const result = await response.json();
    const reply = result.candidates[0].content.parts[0].text;
    
    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
