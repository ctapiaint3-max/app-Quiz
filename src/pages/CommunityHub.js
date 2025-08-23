import React, { useState, useEffect, useCallback } from 'react';
import { Globe } from 'lucide-react';
import PublicQuizCard from '../Components/Community/PublicQuizCard';
import { useAuth } from '../hooks/useAuth';
import { getPublicQuizzes } from '../services/quizService';

const CommunityHub = () => {
    const { token } = useAuth();
    const [publicQuizzes, setPublicQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPublicQuizzes = useCallback(async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const data = await getPublicQuizzes(token);
            setPublicQuizzes(data);
        } catch (err) {
            setError('No se pudieron cargar los quizzes de la comunidad.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPublicQuizzes();
    }, [fetchPublicQuizzes]);

    if (isLoading) {
        return <div className="text-center text-gray-400">Cargando comunidad...</div>;
    }
    
    return (
        <div className="w-full">
            <div className="flex items-center mb-8">
                <Globe className="h-10 w-10 mr-4 text-green-400" />
                <h1 className="text-4xl font-bold text-white">Comunidad de Quizzes</h1>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}

            {publicQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publicQuizzes.map(quiz => (
                        <PublicQuizCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
                    <p className="text-xl text-gray-400">Aún no hay quizzes públicos.</p>
                    <p className="text-gray-500 mt-2">¡Sé el primero en compartir uno desde tu biblioteca!</p>
                </div>
            )}
        </div>
    );
};

export default CommunityHub;