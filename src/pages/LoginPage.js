import React from 'react';
import { Link } from 'react-router-dom'; // <--- 1. IMPORTAMOS LINK
import LoginForm from '../Components/Auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Iniciar Sesión</h1>
      <LoginForm />
      <p className="mt-4 text-gray-400">
        ¿No tienes una cuenta?{' '}
        <Link to="/register" className="text-blue-400 hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;