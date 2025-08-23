// src/pages/CommunityHub.js
import React, { useState, useEffect } from 'react';
import PublicQuizCard from '../Components/Community/PublicQuizCard';
import { Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const CommunityHub = () => {
    const [publicQuizzes, setPublicQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchPublicQuizzes = async () => {
            try {
                const response = await fetch('/api/quizzes/public', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setPublicQuizzes(data);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (token) {
            fetchPublicQuizzes();
        }
    }, [token]);

    return (
        <div className="w-full">
            <div className="flex items-center mb-8">
                <Globe className="h-10 w-10 mr-4 text-green-400" />
                <h1 className="text-4xl font-bold text-white">Comunidad</h1>
            </div>
            {isLoading ? (
                <p>Cargando quizzes públicos...</p>
            ) : publicQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publicQuizzes.map(quiz => (
                        <PublicQuizCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            ) : (
                <p>No hay quizzes públicos en este momento.</p>
            )}
        </div>
    );
};

export default CommunityHub;