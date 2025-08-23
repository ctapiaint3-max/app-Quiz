import React, { createContext, useState, useEffect } from 'react';
import { login as loginService, register as registerService } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Para saber si aún está cargando la sesión

  // Este efecto se ejecuta solo una vez cuando la app carga
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Si encuentra un token y un usuario en el almacenamiento local,
    // asume que la sesión sigue activa.
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false); // Termina de cargar
  }, []);

  // Función de login que usarán los componentes
  const login = async (credentials) => {
    const data = await loginService(credentials);
    if (data.token) {
      // Si el login es exitoso, guarda los datos en el estado y en el localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data; // Devuelve la respuesta para manejar errores en el formulario
  };

  // Función de registro
  const register = async (userData) => {
     return await registerService(userData);
  };

  // Función de logout
  const logout = () => {
    // Limpia el estado y el localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;