// FILE: src/pages/DashboardPage.js

import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet es donde se renderizarán las sub-rutas
import Sidebar from '../Components/Dashboard/Sidebar';

const DashboardPage = () => {
  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* El contenido de /dashboard, /dashboard/crear-quiz, etc., se mostrará aquí */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default DashboardPage;