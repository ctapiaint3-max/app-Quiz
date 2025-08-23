// src/services/api.js
class ApiService {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Verificar el tipo de contenido
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Si es error, intentar parsear como JSON o texto
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
        
        throw new Error(
          errorData.message || errorData || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Si la respuesta es exitosa, verificar que sea JSON
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Si no es JSON, devolver texto
        return await response.text();
      }
    } catch (error) {
      console.error('API Request failed:', error);
      throw new Error(error.message || 'Error de conexión');
    }
  }

  // Métodos HTTP helpers
  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();