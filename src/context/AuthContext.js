import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as loginService, register as registerService } from '../services/userService';

// **CORRECCIÓN AQUÍ**: Añade "export" para que el contexto pueda ser importado
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = useCallback(() => {
        try {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                const decoded = jwtDecode(storedToken);
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser({ id: decoded.userId, name: decoded.name, email: decoded.email });
                } else {
                    localStorage.removeItem('token');
                }
            }
        } catch (error) {
            console.error("Token inválido o expirado:", error);
            localStorage.removeItem('token');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        const { token } = await loginService(email, password);
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({ id: decoded.userId, name: decoded.name, email: decoded.email });
        setToken(token);
    };

    const register = async (name, email, password) => {
        const { token } = await registerService(name, email, password);
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({ id: decoded.userId, name: decoded.name, email: decoded.email });
        setToken(token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};