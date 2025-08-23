import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  Bot,
  Edit3,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/dashboard/crear-quiz", label: "Crear Quiz", icon: <FilePlus2 size={20} /> },
    { to: "/dashboard/asistente", label: "Asistente", icon: <Bot size={20} /> },
    { to: "/dashboard/tomar-quiz", label: "Tomar Quiz", icon: <Edit3 size={20} /> },
    { to: "/dashboard/biblioteca", label: "Biblioteca", icon: <BookOpen size={20} /> },
    { to: "/dashboard/perfil", label: "Perfil", icon: <User size={20} /> },
  ];

  return (
    <>
      {/* Sidebar escritorio */}
      <aside
        className={`
          hidden md:flex flex-col bg-gray-800 text-white h-screen
          transition-all duration-300 relative
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Botón colapsar */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-4 bg-gray-700 p-1 rounded-full shadow-md hover:bg-gray-600"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <nav className="mt-16 space-y-2">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              className="flex items-center gap-3 p-2 hover:bg-gray-700 transition-colors"
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Sidebar móvil */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Fondo oscuro */}
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={toggleSidebar}
          ></div>

          {/* Panel lateral */}
          <div className="w-64 bg-gray-800 text-white h-full p-4 relative">
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-700"
            >
              <X size={20} />
            </button>
            <nav className="mt-12 space-y-2">
              {menuItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  onClick={toggleSidebar}
                  className="flex items-center gap-3 p-2 hover:bg-gray-700 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
