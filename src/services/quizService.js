// src/services/quizService.js

/**
 * Guarda un nuevo quiz en la base de datos.
 * @param {object} quizData - El objeto del quiz a guardar.
 * @param {string} token - El token de autenticación del usuario.
 * @returns {Promise<object>} - La respuesta del servidor.
 */
export const createQuiz = async (quizData, token) => {
  const response = await fetch('/api/quizzes/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(quizData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear el quiz');
  }
  return response.json();
};

/**
 * Actualiza un quiz existente.
 * @param {number} quizId - El ID del quiz a actualizar.
 * @param {object} quizData - Los nuevos datos del quiz.
 * @param {string} token - El token de autenticación del usuario.
 * @returns {Promise<object>} - La respuesta del servidor.
 */
export const updateQuiz = async (quizId, quizData, token) => {
  const response = await fetch(`/api/quizzes/update/${quizId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(quizData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al actualizar el quiz');
  }
  return response.json();
};

/**
 * Guarda el resultado de un intento de quiz.
 * @param {object} resultData - Los datos del resultado.
 * @param {string} token - El token de autenticación.
 * @returns {Promise<object>}
 */
export const saveQuizResult = async (resultData, token) => {
    const response = await fetch('/api/results/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resultData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo guardar el resultado');
    }
    return response.json();
};