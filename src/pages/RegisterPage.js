import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../Components/Auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Crear Cuenta</h1>
      <RegisterForm />
      <p className="mt-4 text-gray-400">
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" className="text-blue-400 hover:underline">
          Inicia sesión aquí
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;