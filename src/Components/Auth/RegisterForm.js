import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await register({ name, email, password });
      if (response.user) {
        setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
        setTimeout(() => {
          navigate('/login'); // Redirige al login después de 2 segundos
        }, 2000);
      } else {
        setError(response.message || 'Error en el registro.');
      }
    } catch (err) {
      setError('No se pudo conectar al servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-center">{error}</p>}
      {success && <p className="text-green-400 bg-green-900/50 p-3 rounded-lg text-center">{success}</p>}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre</label>
        <input 
          id="name" 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          required 
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          required 
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña</label>
        <input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          required 
        />
      </div>
      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
        Crear Cuenta
      </button>
    </form>
  );
};

export default RegisterForm;