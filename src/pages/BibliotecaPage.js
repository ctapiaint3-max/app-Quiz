import React, { useState, useEffect, useCallback } from 'react';
import { BookCopy, PlusCircle, Frown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../Components/Biblioteca/QuizCard';
import { useAuth } from '../hooks/useAuth';
import { getMyQuizzes, deleteQuiz } from '../services/quizService';

const BibliotecaPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchQuizzes = useCallback(async () => {
        if (!token) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const data = await getMyQuizzes(token);
            const parsedQuizzes = data.map(q => ({
                ...q,
                questions: typeof q.quiz_data === 'string' ? JSON.parse(q.quiz_data).questions : q.quiz_data.questions
            }));
            setQuizzes(parsedQuizzes);
        } catch (err) {
            setError('No se pudieron cargar tus quizzes. Intenta recargar la página.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleDelete = async (quizId) => {
        const originalQuizzes = quizzes;
        setQuizzes(currentQuizzes => currentQuizzes.filter(q => q.id !== quizId));
        try {
            await deleteQuiz(quizId, token);
        } catch (err) {
            setError('No se pudo eliminar el quiz. Inténtalo de nuevo.');
            setQuizzes(originalQuizzes);
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="text-center text-gray-400">Cargando tu biblioteca...</div>;
    }

    if (error) {
        return <div className="text-center text-red-400">{error}</div>;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <BookCopy className="h-10 w-10 mr-4 text-blue-400" />
                    <h1 className="text-4xl font-bold text-white">Mi Biblioteca</h1>
                </div>
                <button
                    onClick={() => navigate('/dashboard/crear-quiz')}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition-transform transform hover:scale-105"
                >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Crear Nuevo Quiz
                </button>
            </div>

            {quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <QuizCard 
                            key={quiz.id} 
                            quiz={quiz} 
                            onDelete={handleDelete} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-8 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
                    <Frown className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-xl text-gray-400">Tu biblioteca está vacía.</p>
                    <p className="text-gray-500 mt-2 mb-6">¡Comienza a aprender creando tu primer cuestionario!</p>
                    <button
                        onClick={() => navigate('/dashboard/crear-quiz')}
                        className="flex items-center mx-auto px-5 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition-transform transform hover:scale-105"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Crear mi Primer Quiz
                    </button>
                </div>
            )}
        </div>
    );
};

export default BibliotecaPage;