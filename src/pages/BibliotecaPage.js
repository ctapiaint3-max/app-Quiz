import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookCopy, PlusCircle, Frown, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../Components/Biblioteca/QuizCard';
import { useAuth } from '../hooks/useAuth';
import { getMyQuizzes, deleteQuiz, createQuiz } from '../services/quizService';
import { validateQuizFormat } from '../utils/quizValidator';

const BibliotecaPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth(); // Corregido para obtener el token del hook
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const fetchQuizzes = useCallback(async () => {
        if (!token) {
            setIsLoading(false); // Si no hay token, no hay nada que cargar
            return;
        }
        try {
            setIsLoading(true);
            setError('');
            const data = await getMyQuizzes(token);
            // La API devuelve el JSON como un string, necesitamos parsearlo
            const parsedQuizzes = data.map(q => ({
                ...q,
                questions: typeof q.quiz_data === 'string' 
                    ? JSON.parse(q.quiz_data).questions 
                    : q.quiz_data.questions
            }));
            setQuizzes(parsedQuizzes);
        } catch (err) {
            setError('No se pudieron cargar tus quizzes. Intenta recargar la página.');
            console.error(err);
        } finally {
            setIsLoading(false); // Aseguramos que el loading termine siempre
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
    
    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = JSON.parse(e.target.result);
                validateQuizFormat(content);

                const newQuizPayload = {
                    title: file.name.replace(/\.json$/i, ''),
                    quiz_data: { questions: content },
                    is_public: false,
                };
                
                await createQuiz(newQuizPayload, token);
                await fetchQuizzes();
            } catch (err) {
                setError(`Error al importar: ${err.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-xl text-gray-400">Cargando tu biblioteca...</p>
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                <div className="flex items-center">
                    <BookCopy className="h-10 w-10 mr-4 text-blue-400" />
                    <h1 className="text-4xl font-bold text-white">Mi Biblioteca</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-bold">
                        <Upload className="mr-2 h-5 w-5" />
                        Importar Quiz
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" style={{ display: 'none' }} />
                    <button onClick={() => navigate('/dashboard/crear-quiz')} className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Crear Nuevo Quiz
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}

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
                    <p className="text-gray-500 mt-2 mb-6">¡Comienza a aprender creando o importando un cuestionario!</p>
                </div>
            )}
        </div>
    );
};

export default BibliotecaPage;