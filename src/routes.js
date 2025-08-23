// -----------------------------------------------------------------------------
// ARCHIVO 3: src/routes.js (¡VERSIÓN ACTUALIZADA!)
// -----------------------------------------------------------------------------
// Actualizamos la ruta de la biblioteca para que use el nuevo componente.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuizGeneratorPage from './pages/QuizGeneratorPage';
import AiAssistantPage from './pages/AiAssistantPage';
import QuizTakerPage from './pages/QuizTakerPage';
import BibliotecaPage from './pages/BibliotecaPage'; // <-- 1. Importamos la nueva página

const ProtectedRoute = ({ children }) => {
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<h1 className="text-4xl font-bold">Bienvenido a tu Dashboard</h1>} />
          <Route path="crear-quiz" element={<QuizGeneratorPage />} />
          <Route path="asistente" element={<AiAssistantPage />} />
          <Route path="tomar-quiz" element={<QuizTakerPage />} />
          <Route path="biblioteca" element={<BibliotecaPage />} /> {/* <-- 2. Usamos el nuevo componente */}
          <Route path="perfil" element={<h1 className="text-4xl font-bold">Mi Perfil</h1>} />
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
