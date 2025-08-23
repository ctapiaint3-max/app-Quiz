import React from 'react';

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400"></div>
        <p className="mt-4 text-lg">Cargando y autenticando...</p>
    </div>
);

// Añade esta línea al final del archivo
export default LoadingScreen;