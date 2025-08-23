// src/utils/quizValidator.js

export const validateQuizFormat = (quizData) => {
    if (!Array.isArray(quizData)) {
        throw new Error("El archivo JSON debe contener un array (una lista) de preguntas.");
    }
    if (quizData.length === 0) {
        throw new Error("El quiz no contiene ninguna pregunta.");
    }
    for (const question of quizData) {
        if (typeof question.pregunta !== 'string') {
            throw new Error("Una de las preguntas no tiene un texto válido en la propiedad 'pregunta'.");
        }
        if (!Array.isArray(question.respuestas) || question.respuestas.length === 0) {
            throw new Error(`La pregunta "${question.pregunta.substring(0, 20)}..." no tiene un array de respuestas.`);
        }
        const hasCorrect = question.respuestas.some(r => r.correcta === true);
        if (!hasCorrect) {
            throw new Error(`La pregunta "${question.pregunta.substring(0, 20)}..." no tiene ninguna respuesta marcada como correcta.`);
        }
    }
    return true;
};