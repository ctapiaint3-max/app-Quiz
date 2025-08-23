import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // Importamos el hook de autenticación
import {
  LayoutDashboard,
  FilePlus2,
  Bot,
  Edit3,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Globe,   // Icono para Comunidad
  LogOut,  // Icono para Logout
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Centralizamos los items del menú en un array para que sea fácil modificarlos
  const menuItems = [
    { to: "/dashboard/biblioteca", label: "Biblioteca", icon: <BookOpen size={20} /> },
    { to: "/dashboard/comunidad", label: "Comunidad", icon: <Globe size={20} /> },
    { to: "/dashboard/crear-quiz", label: "Crear Quiz", icon: <FilePlus2 size={20} /> },
    { to: "/dashboard/tomar-quiz", label: "Tomar Quiz", icon: <Edit3 size={20} /> },
    { to: "/dashboard/asistente", label: "Asistente IA", icon: <Bot size={20} /> },
    { to: "/dashboard/perfil", label: "Perfil", icon: <User size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirigimos al login después de cerrar sesión
  };

  // Componente interno para no repetir el código de los enlaces
  const NavLink = ({ to, icon, label, isCollapsed, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
    >
      {icon}
      {!isCollapsed && <span className="font-medium">{label}</span>}
    </Link>
  );

  return (
    <>
      {/* --- Sidebar para Escritorio (visible en md y superior) --- */}
      <aside
        className={`
          hidden md:flex flex-col bg-gray-800 text-white h-screen p-2
          transition-all duration-300 ease-in-out relative
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        <div className="flex-grow">
          <nav className="mt-10 space-y-2">
            {menuItems.map((item) => (
              <NavLink key={item.to} {...item} isCollapsed={isCollapsed} />
            ))}
          </nav>
        </div>

        {/* Botón de Logout para Escritorio */}
        <div className="border-t border-gray-700 pt-2">
           <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-4 p-3 rounded-lg text-red-400 hover:bg-red-900/50 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
           >
              <LogOut size={20} />
              {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
           </button>
        </div>

        {/* Botón para colapsar/expandir */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 bg-gray-700 p-1.5 rounded-full shadow-lg hover:bg-gray-600 focus:outline-none"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      {/* --- Sidebar para Móvil (se muestra como un overlay) --- */}
      <div className={`fixed inset-0 z-50 flex md:hidden transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="w-64 bg-gray-800 text-white h-full p-4 flex flex-col">
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:bg-gray-700"
            >
              <X size={24} />
            </button>
            <div className="flex-grow mt-16">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <NavLink key={item.to} {...item} isCollapsed={false} onClick={toggleSidebar} />
                ))}
              </nav>
            </div>
             <div className="border-t border-gray-700 pt-2">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-3 rounded-lg text-red-400 hover:bg-red-900/50 hover:text-white transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
             </div>
          </div>
          {/* Fondo oscuro para el overlay */}
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={toggleSidebar}
          ></div>
      </div>
    </>
  );
};

export default Sidebar;