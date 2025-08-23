// Este archivo ya estaba bien, pero asegúrate de que tu función getAiFeedback
// maneje los errores correctamente como se muestra aquí.

import React, { useState } from 'react';

// Este archivo ya estaba bien, pero asegúrate de que tu función getAiFeedback
// maneje los errores correctamente como se muestra aquí.

const AiAssistantPage = () => {
    const [feedback, setFeedback] = useState('');
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const token = ""; // Define your token here or get it from context/state

    const getAiFeedback = async () => {
        setIsFeedbackLoading(true);
        setFeedback('');
        setFeedbackError('');
        try {
            const response = await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Siempre intentamos leer el cuerpo como JSON
            const data = await response.json();

            // Si la respuesta no fue exitosa (ej. 500, 401), usamos el mensaje del JSON
            if (!response.ok) {
                throw new Error(data.message || 'Error desconocido al obtener el análisis.');
            }
            
            setFeedback(data.feedback);
        } catch (err) {
            // Mostramos el mensaje de error específico que nos envió la API
            setFeedbackError(err.message);
            console.error(err);
        } finally {
            setIsFeedbackLoading(false);
        }
    };

    // Render logic here...
    return (
        <div>
            {/* Your component JSX */}
        </div>
    );
};

export default AiAssistantPage;