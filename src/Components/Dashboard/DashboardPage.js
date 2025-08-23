import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import { Menu } from "lucide-react";

const DashboardPage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false); // móvil
  const [isCollapsed, setCollapsed] = useState(false);     // escritorio

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setCollapsed(!isCollapsed);

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      {/* Overlay móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      {/* Botón hamburguesa móvil */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardPage;
