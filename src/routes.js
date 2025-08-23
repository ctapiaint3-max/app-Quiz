// FILE: src/routes.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Layouts y Páginas Principales ---
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// --- Páginas del Dashboard ---
import QuizGeneratorPage from './pages/QuizGeneratorPage';
import AiAssistantPage from './pages/AiAssistantPage';
import QuizTakerPage from './pages/QuizTakerPage'; // <-- 1. Importamos la nueva página

// Componente para proteger rutas (actualmente desactivado para desarrollo)
const ProtectedRoute = ({ children }) => {
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* --- Rutas Públicas --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- Ruta Principal Protegida que usa el Layout del Dashboard --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        >
          {/* --- Rutas Anidadas (Se renderizan dentro del <Outlet> de DashboardPage) --- */}
          <Route 
            index 
            element={<h1 className="text-4xl font-bold">Bienvenido a tu Dashboard</h1>} 
          />
          <Route path="crear-quiz" element={<QuizGeneratorPage />} />
          <Route path="asistente" element={<AiAssistantPage />} />
          <Route path="tomar-quiz" element={<QuizTakerPage />} /> {/* <-- 2. Añadimos la ruta */}
          <Route path="biblioteca" element={<h1 className="text-4xl font-bold">Mi Biblioteca de Quizzes</h1>} />
          <Route path="perfil" element={<h1 className="text-4xl font-bold">Mi Perfil</h1>} />
        </Route>
        
        {/* --- Redirección por Defecto --- */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
