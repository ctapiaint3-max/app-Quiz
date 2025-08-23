import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookCopy, PlusCircle, Frown, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../Components/Biblioteca/QuizCard';
import { useAuth } from '../hooks/useAuth';
import { getMyQuizzes, deleteQuiz, createQuiz } from '../services/quizService';
import { validateQuizFormat } from '../utils/quizValidator'; // Importaremos un validador

const BibliotecaPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null); // Referencia para el input de archivo

    const fetchQuizzes = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await getMyQuizzes(token);
            const parsedQuizzes = data.map(q => ({
                ...q,
                questions: typeof q.quiz_data === 'string' ? JSON.parse(q.quiz_data).questions : q.quiz_data.questions
            }));
            setQuizzes(parsedQuizzes);
        } catch (err) {
            setError('No se pudieron cargar tus quizzes.');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleDelete = async (quizId) => {
        // ... (esta función no cambia)
    };
    
    const handleImportClick = () => {
        // Simula un clic en el input de archivo oculto
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
                validateQuizFormat(content); // Validamos el formato del JSON

                const newQuizPayload = {
                    title: file.name.replace(/\.json$/i, ''),
                    quiz_data: { questions: content },
                    is_public: false,
                };
                
                await createQuiz(newQuizPayload, token);
                await fetchQuizzes(); // Recargamos la lista de quizzes
            } catch (err) {
                setError(`Error al importar: ${err.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Resetea el input para poder subir el mismo archivo otra vez
    };

    if (isLoading) return <div className="text-center text-gray-400">Cargando tu biblioteca...</div>;
    
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
                quizzes.map((quiz) => (
                    <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onDelete={handleDelete}
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
                    <Frown className="h-16 w-16 mb-4" />
                    <p className="text-xl">No tienes quizzes en tu biblioteca.</p>
                </div>
            )}
        </div>
    );
};

export default BibliotecaPage;