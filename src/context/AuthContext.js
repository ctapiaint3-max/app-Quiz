import React, { createContext, useState } from 'react';

// Se crea el contexto y se exporta para que `useAuth` pueda usarlo.
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // --- MODO DESARROLLO: Inicia sesión automáticamente ---
    const [user, setUser] = useState({ id: 1, name: 'Usuario Dev', email: 'dev@example.com' });
    const [token, setToken] = useState('fake-token-for-development');
    const [isLoading, setIsLoading] = useState(false); // Falso para no ver la pantalla de carga

    // Las funciones de login/register se dejan vacías y con un aviso.
    const login = async () => {
        alert("El login está deshabilitado en modo desarrollo.");
    };

    const register = async () => {
        alert("El registro está deshabilitado en modo desarrollo.");
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        alert("Sesión cerrada. Refresca la página para volver a entrar en modo desarrollo.");
    };

    // El valor `isAuthenticated` se calcula directamente de la existencia del objeto `user`.
    // Si `user` no es nulo, `isAuthenticated` será `true`.
    const value = {
        isAuthenticated: !!user,
        user,
        token,
        isLoading,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};