import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Dashboard/Sidebar";
import { Menu } from "lucide-react";

const DashboardPage = () => {
  // Estado para controlar la visibilidad del sidebar en móviles
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  // Estado para controlar si el sidebar está colapsado o expandido en escritorio
  const [isCollapsed, setCollapsed] = useState(false);

  // Funciones para alternar los estados
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setCollapsed(!isCollapsed);

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      {/* Este div oscuro aparece detrás del menú en móviles para que el fondo 
        no sea interactivo cuando el menú está abierto.
      */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Componente del Menú Lateral (Sidebar) */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      {/* Botón de menú tipo "hamburguesa" para dispositivos móviles */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Contenedor principal para el contenido de la página. 
        El componente <Outlet /> es el que renderiza las rutas anidadas 
        (ej. /dashboard/crear-quiz, /dashboard/biblioteca, etc.).
      */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardPage;