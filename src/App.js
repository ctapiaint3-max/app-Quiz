import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes'; // Importamos nuestro nuevo sistema de rutas

function App() {
  return (
    <AuthProvider>
      <main className="bg-gray-900 min-h-screen w-full flex flex-col items-center font-sans p-4 text-white">
        <AppRoutes />
      </main>
    </AuthProvider>
  );
}

export default App;