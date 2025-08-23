// api/assistant-general.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { question, history, context } = req.body;
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clave API de Gemini no está configurada.' });
  }

  // Instrucción del sistema para definir la personalidad de la IA
  let systemInstructionText = "Tu nombre es Kai. Eres un asistente de IA amigable, servicial y experto en una amplia gama de temas. Tu propósito es ayudar a los usuarios a aprender y resolver sus dudas de manera clara y concisa. Siempre responde en español.";

  // Si se proporciona un contexto (texto de un archivo), cambiamos la instrucción
  if (context && context.trim() !== '') {
    systemInstructionText = `Tu nombre es Kai. Eres un asistente experto, eres el asistente de aprendizaje del usuario, tu lo ayudaras a resolver dudas, y si te sube un documento lo ayudaras con la peticion que te haga relacionada a es documento.\n\nDOCUMENTO:\n---\n${context}\n---`;
  }
  
  // Preparamos el historial para la IA, traduciendo 'assistant' a 'model'
  const contents = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user', // <-- ESTA ES LA CORRECCIÓN
    parts: [{ text: h.text }]
  }));
  
  // Añadimos la nueva pregunta del usuario
  contents.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const payload = {
    contents: [{ role: 'user', parts: [{ text: systemInstructionText }] }, { role: 'model', parts: [{ text: "Entendido. Procederé como Kai." }] }, ...contents],
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
    
    if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0]) {
        throw new Error("La respuesta de la IA no tuvo el formato esperado o fue bloqueada.");
    }

    const reply = result.candidates[0].content.parts[0].text;
    
    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
