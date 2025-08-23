import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes'; // Asegúrate de que la importación sea correcta

function App() {
  return (
    <AuthProvider>
      <main className="bg-gray-900 min-h-screen w-full flex flex-col items-center font-sans p-4 text-white">
        {/* AppRoutes debe ser un componente válido */}
        <AppRoutes /> 
      </main>
    </AuthProvider>
  );
}

export default App;