import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Importación de Páginas y Componentes
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BibliotecaPage from './pages/BibliotecaPage';
import QuizGeneratorPage from './pages/QuizGeneratorPage';
import QuizTakerPage from './pages/QuizTakerPage';
import AiAssistantPage from './pages/AiAssistantPage';
import QuizEditorPage from './pages/QuizEditorPage';
import CommunityHub from './pages/CommunityHub';
import ProfilePage from './pages/ProfilePage';
import LoadingScreen from './Components/LoadingScreen';

/**
 * Componente de Ruta Protegida
 * Verifica si el usuario está autenticado. Si no, lo redirige a la página de login.
 * Mientras verifica, muestra una pantalla de carga.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Si está autenticado, renderiza el contenido anidado (Outlet). Si no, redirige a login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

/**
 * Componente Principal de Rutas de la Aplicación
 */
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Ruta principal protegida que contiene el layout del Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            {/* Rutas Anidadas (se renderizan dentro de DashboardPage) */}
            <Route index element={<Navigate to="biblioteca" replace />} />
            <Route path="biblioteca" element={<BibliotecaPage />} />
            <Route path="comunidad" element={<CommunityHub />} />
            <Route path="crear-quiz" element={<QuizGeneratorPage />} />
            <Route path="tomar-quiz" element={<QuizTakerPage />} />
            <Route path="asistente" element={<AiAssistantPage />} />
            <Route path="editar-quiz/:quizId" element={<QuizEditorPage />} />
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
        </Route>
        
        {/* Redirección para la ruta raíz y cualquier otra ruta no encontrada */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;