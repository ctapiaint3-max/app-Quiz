/**
 * Función centralizada para realizar solicitudes a la API.
 * Maneja la autenticación, los errores y la conversión de datos.
 * @param {string} url - El endpoint de la API al que se llamará.
 * @param {object} options - Opciones para la solicitud fetch (método, cuerpo, etc.).
 * @param {string} [token] - El token de autenticación del usuario.
 * @returns {Promise<any>} La respuesta JSON del servidor.
 * @throws {Error} Si la respuesta de la red no es exitosa.
 */
const fetchApi = async (url, options = {}, token) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        // Intenta obtener un mensaje de error del cuerpo de la respuesta
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Ocurrió un error en la comunicación con la API');
    }

    // Algunas respuestas (como DELETE) pueden no tener cuerpo
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// --- API para la Biblioteca y Edición de Quizzes ---

/**
 * Obtiene todos los quizzes del usuario autenticado desde la base de datos.
 */
export const getMyQuizzes = (token) => {
    return fetchApi('/api/quizzes/my-quizzes', {}, token);
};

/**
 * Obtiene los datos completos de un solo quiz por su ID.
 */
export const getQuizById = (quizId, token) => {
    return fetchApi(`/api/quizzes/${quizId}`, {}, token);
};

/**
 * Crea un nuevo quiz en la base de datos.
 */
export const createQuiz = (quizData, token) => {
    return fetchApi('/api/quizzes/create', {
        method: 'POST',
        body: JSON.stringify(quizData),
    }, token);
};

/**
 * Actualiza un quiz existente.
 */
export const updateQuiz = (quizId, quizData, token) => {
    return fetchApi(`/api/quizzes/update/${quizId}`, {
        method: 'PUT',
        body: JSON.stringify(quizData),
    }, token);
};

/**
 * Elimina un quiz de la base de datos.
 */
export const deleteQuiz = (quizId, token) => {
    return fetchApi(`/api/quizzes/delete/${quizId}`, {
        method: 'DELETE',
    }, token);
};

// --- API para la Comunidad ---

/**
 * Obtiene todos los quizzes marcados como públicos.
 */
export const getPublicQuizzes = (token) => {
    return fetchApi('/api/quizzes/public', {}, token);
};

/**
 * Cambia el estado de visibilidad (público/privado) de un quiz.
 */
export const toggleQuizPublicStatus = (quizId, token) => {
    return fetchApi(`/api/quizzes/togglePublic/${quizId}`, {
        method: 'PATCH',
    }, token);
};

// --- API para Resultados y Gamificación ---

/**
 * Guarda el resultado de un intento de quiz.
 */
export const saveQuizResult = (resultData, token) => {
    return fetchApi('/api/results/save', {
        method: 'POST',
        body: JSON.stringify(resultData),
    }, token);
};

/**
 * Obtiene el historial de resultados para un quiz específico.
 */
export const getQuizHistory = (quizId, token) => {
    if (!quizId) return Promise.resolve([]);
    return fetchApi(`/api/results/${quizId}`, {}, token);
};