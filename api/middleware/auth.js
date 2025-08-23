import jwt from 'jsonwebtoken';

/**
 * Middleware para proteger rutas de la API.
 * Verifica el token JWT y adjunta los datos del usuario a la petición.
 *
 * @param {function} handler - El manejador de la API que se ejecutará si la autenticación es exitosa.
 * @returns {function} Un nuevo manejador que primero valida la autenticación.
 */
const withAuth = (handler) => {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado: Token no proporcionado.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Adjuntamos los datos decodificados del usuario a la petición
      req.user = { userId: decoded.userId, name: decoded.name, email: decoded.email };

      // Si el token es válido, continuamos con el manejador original
      return handler(req, res);
    } catch (error) {
      console.error('Error de autenticación:', error.name);
      let errorMessage = 'Token inválido.';
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'El token ha expirado.';
      }
      return res.status(401).json({ error: `No autorizado: ${errorMessage}` });
    }
  };
};

export default withAuth;
