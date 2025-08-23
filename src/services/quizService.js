/**
 * Realiza una solicitud fetch a la API con manejo de errores y autenticación.
 * @param {string} url - La URL del endpoint de la API.
 * @param {object} options - Las opciones para la solicitud fetch (método, headers, body).
 * @param {string} [token] - El token de autenticación del usuario.
 * @returns {Promise<any>} - La respuesta JSON del servidor.
 */
const fetchApi = async (url, options = {}, token) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Ocurrió un error en la API');
    }

    return response.json();
};

// --- Funciones para la Biblioteca y Edición ---

/**
 * Obtiene todos los quizzes del usuario autenticado.
 * @param {string} token - El token de autenticación.
 * @returns {Promise<Array>}
 */
export const getMyQuizzes = (token) => {
    return fetchApi('/api/quizzes/my-quizzes', {}, token);
};

/**
 * Obtiene los datos completos de un solo quiz por su ID.
 * @param {number} quizId - El ID del quiz.
 * @param {string} token - El token de autenticación.
 * @returns {Promise<object>}
 */
export const getQuizById = (quizId, token) => {
    return fetchApi(`/api/quizzes/${quizId}`, {}, token);
};


/**
 * Crea un nuevo quiz en la base de datos.
 * @param {object} quizData - { title, quiz_data, is_public }
 * @param {string} token - El token de autenticación.
 * @returns {Promise<object>}
 */
export const createQuiz = (quizData, token) => {
    return fetchApi('/api/quizzes/create', {
        method: 'POST',
        body: JSON.stringify(quizData),
    }, token);
};

/**
 * Actualiza un quiz existente.
 * @param {number} quizId - El ID del quiz.
 * @param {object} quizData - Los nuevos datos del quiz.
 * @param {string} token - El token de autenticación.
 * @returns {Promise<object>}
 */
export const updateQuiz = (quizId, quizData, token) => {
    return fetchApi(`/api/quizzes/update/${quizId}`, {
        method: 'PUT',
        body: JSON.stringify(quizData),
    }, token);
};

/**
 * Elimina un quiz.
 * @param {number} quizId - El ID del quiz a eliminar.
 * @param {string} token - El token de autenticación.
 * @returns {Promise<object>}
 */
export const deleteQuiz = (quizId, token) => {
    return fetchApi(`/api/quizzes/delete/${quizId}`, {
        method: 'DELETE',
    }, token);
};


// --- Funciones para Resultados ---

/**
 * Guarda el resultado de un intento de quiz.
 * @param {object} resultData - { quizId, score, details }
 * @param {string} token - El token de autenticación.
 * @returns {Promise<object>}
 */
export const saveQuizResult = (resultData, token) => {
    return fetchApi('/api/results/save', {
        method: 'POST',
        body: JSON.stringify(resultData),
    }, token);
};

/**
 * Obtiene el historial de resultados para un quiz específico.
 * @param {number} quizId - El ID del quiz.
 * @param {string} token - El token de autenticación.
 * @returns {Promise<Array>}
 */
export const getQuizHistory = (quizId, token) => {
    if (!quizId) return Promise.resolve([]);
    return fetchApi(`/api/results/${quizId}`, {}, token);
};