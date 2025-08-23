import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Importaciones de Páginas y Componentes
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QuizGeneratorPage from './pages/QuizGeneratorPage';
import AiAssistantPage from './pages/AiAssistantPage';
import QuizTakerPage from './pages/QuizTakerPage';
import BibliotecaPage from './pages/BibliotecaPage';
import QuizEditorPage from './pages/QuizEditorPage';
import CommunityHub from './pages/CommunityHub';
import LoadingScreen from './Components/LoadingScreen'; // Importación clave

// Importación del Hook de Autenticación
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }
  // Si está autenticado, renderiza el contenido anidado (Outlet). Si no, redirige a login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Todas las rutas del dashboard están protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route index element={<Navigate to="biblioteca" replace />} />
            <Route path="biblioteca" element={<BibliotecaPage />} />
            <Route path="crear-quiz" element={<QuizGeneratorPage />} />
            <Route path="asistente" element={<AiAssistantPage />} />
            <Route path="tomar-quiz" element={<QuizTakerPage />} />
            <Route path="comunidad" element={<CommunityHub />} />
            <Route path="editar-quiz/:quizId" element={<QuizEditorPage />} />
            <Route path="perfil" element={<h1 className="text-4xl font-bold">Mi Perfil</h1>} />
          </Route>
        </Route>
        
        {/* Redirección para la ruta raíz y cualquier otra no encontrada */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;