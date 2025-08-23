// FILE: src/Components/Auth/LoginForm.js

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Llama a la función de login del AuthContext
      const response = await login({ email, password });
      
      // Si la respuesta tiene un token, el login fue exitoso
      if (response.token) {
        navigate('/dashboard'); // Redirige al dashboard
      } else {
        // Si no, muestra el mensaje de error que viene del backend
        setError(response.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setError('No se pudo conectar al servidor. Inténtalo más tarde.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {/* Muestra el mensaje de error si existe */}
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
      
      <div>
        <label htmlFor="email-login" className="block text-sm font-medium text-gray-300">Email</label>
        <input 
          id="email-login" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required 
        />
      </div>
      
      <div>
        <label htmlFor="password-login" className="block text-sm font-medium text-gray-300">Contraseña</label>
        <input 
          id="password-login" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required 
        />
      </div>
      
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
        Iniciar Sesión
      </button>
    </form>
  );
};

export default LoginForm;
