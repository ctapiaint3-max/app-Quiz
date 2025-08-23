import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Dashboard/Sidebar';

const DashboardPage = () => {
  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* El contenido de las rutas anidadas se mostrará aquí */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default DashboardPage;