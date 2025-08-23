// src/pages/QuizTakerPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, FileText, Clock, CheckCircle, XCircle, BarChart2, Repeat } from 'lucide-react';

// Hooks y Servicios
import { useAuth } from '../hooks/useAuth';
import { saveQuizResult } from '../services/quizService'; // Servicio para guardar resultados

// Función para barajar las preguntas
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const QuizTakerPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token, isAuthenticated } = useAuth();

    const [appState, setAppState] = useState('setup'); // setup, quiz, results
    const [quizData, setQuizData] = useState(null);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const startQuiz = useCallback((quiz) => {
        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            setError('El quiz seleccionado no es válido o no tiene preguntas.');
            navigate('/dashboard/biblioteca'); // Redirige si el quiz es inválido
            return;
        }

        // Transforma las preguntas al formato unificado que necesita el componente
        const transformedQuestions = quiz.questions.map(q => ({
            question: q.pregunta,
            options: q.respuestas.map(r => r.respuesta),
            answer: q.respuestas.find(r => r.correcta)?.respuesta || '',
            theme: q.tema || 'General'
        }));

        setQuizData({
            id: quiz.id, // Guardamos el ID para el envío de resultados
            title: quiz.title,
            questions: transformedQuestions
        });
        setShuffledQuestions(shuffleArray([...transformedQuestions]));
        setTimeLeft(transformedQuestions.length * 30); // 30 segundos por pregunta
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setResults(null);
        setError('');
        setAppState('quiz');
    }, [navigate]);

    // Efecto para iniciar un quiz cargado desde la biblioteca
    useEffect(() => {
        if (location.state?.quizToLoad) {
            startQuiz(location.state.quizToLoad);
            // Limpia el estado para no recargar el mismo quiz si la página se refresca
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, startQuiz, navigate]);


    // Lógica para finalizar el quiz y guardar el resultado
    const finishQuiz = useCallback(async () => {
        if (!quizData) return;

        let totalCorrect = 0;
        shuffledQuestions.forEach((q, index) => {
            if (userAnswers[index] === q.answer) {
                totalCorrect++;
            }
        });

        const totalQuestions = shuffledQuestions.length;
        const score = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        // Prepara los datos para la pantalla de resultados
        const resultDetails = {
            score: score.toFixed(1),
            correct: totalCorrect,
            incorrect: totalQuestions - totalCorrect,
            total: totalQuestions,
            // ... (podrías añadir más detalles como el desglose por tema)
        };
        setResults(resultDetails);
        setAppState('results');

        // **NUEVA LÓGICA: Guardar el resultado en el backend**
        // Solo guarda si el usuario está autenticado y el quiz tiene un ID (no es un JSON local)
        if (isAuthenticated && quizData.id) {
            const resultToSave = {
                quizId: quizData.id,
                userId: user.id,
                score: parseFloat(score.toFixed(2)),
                details: {
                    correct: totalCorrect,
                    incorrect: totalQuestions - totalCorrect,
                }
            };
            try {
                await saveQuizResult(resultToSave, token);
                // Opcional: mostrar una notificación de éxito
            } catch (err) {
                console.error("Error al guardar el resultado:", err);
                // Opcional: informar al usuario que el resultado no se pudo guardar
                setError('No se pudo guardar tu resultado, pero puedes ver tus estadísticas aquí.');
            }
        }
    }, [quizData, userAnswers, shuffledQuestions, isAuthenticated, user, token]);

    // Temporizador del quiz
    useEffect(() => {
        if (appState !== 'quiz' || timeLeft <= 0) return;

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        
        if (timeLeft === 1) {
            setTimeout(finishQuiz, 1000);
        }

        return () => clearInterval(timerId);
    }, [appState, timeLeft, finishQuiz]);

    // Función para procesar un archivo JSON subido por el usuario
    const processQuizFile = (file) => {
        if (file && file.type === "application/json") {
            setError('');
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedJson = JSON.parse(e.target.result);
                    // Inicia el quiz con el contenido del JSON. No tendrá ID.
                    startQuiz({
                        id: null, // No hay ID para quizzes locales
                        title: file.name.replace(/\.json$/i, ''),
                        questions: loadedJson
                    });
                } catch (err) {
                    setError(`Error al procesar el archivo JSON: ${err.message}`);
                    setFileName('');
                }
            };
            reader.readAsText(file);
        } else {
            setError("Por favor, sube un archivo con formato .json");
            setFileName('');
        }
    };

    // Handlers para eventos
    const handleFileChange = (event) => processQuizFile(event.target.files[0]);
    const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };
    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            processQuizFile(event.dataTransfer.files[0]);
        }
    };

    const handleAnswerSelect = (questionIndex, selectedOption) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: selectedOption }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };
    
    const resetApp = () => {
        setQuizData(null);
        setFileName('');
        setError('');
        setAppState('setup');
        setCurrentQuestionIndex(0);
        setUserAnswers({});
    };

    // Renderizado condicional de componentes
    
    const QuizSetupComponent = () => (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="text-center mb-8">
                <FileText className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Tomar un Quiz</h1>
                <p className="text-gray-400 mt-2">Arrastra un archivo JSON o selecciónalo para comenzar.</p>
            </div>
            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}
            <div className="mb-6">
                <label htmlFor="file-upload" className={`cursor-pointer bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg flex items-center justify-center border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-gray-600' : 'border-gray-500'}`}>
                    <Upload className="mr-3 h-6 w-6" />
                    <span>{fileName || 'Seleccionar o arrastrar archivo JSON'}</span>
                </label>
                <input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </div>
        </div>
    );

    const QuizScreenComponent = () => {
        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
        const isAnswerSelected = userAnswers[currentQuestionIndex] !== undefined;
        return (
            <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{quizData.title}</h2>
                    <div className="flex items-center bg-gray-700 px-4 py-2 rounded-lg"><Clock className="h-6 w-6 mr-2 text-blue-400" /><span className="text-xl font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span></div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                <div className="bg-gray-900 p-6 rounded-lg mb-6">
                    <p className="text-blue-400 font-semibold mb-2">Tema: {currentQuestion.theme}</p>
                    <h3 className="text-2xl font-semibold mb-2">Pregunta {currentQuestionIndex + 1} de {shuffledQuestions.length}</h3>
                    <p className="text-xl">{currentQuestion.question}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                        <button key={index} onClick={() => handleAnswerSelect(currentQuestionIndex, option)} className={`p-4 rounded-lg text-left text-lg border-2 transition-all ${userAnswers[currentQuestionIndex] === option ? 'bg-blue-500 border-blue-400 scale-105' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>{option}</button>
                    ))}
                </div>
                <div className="mt-8 text-right">
                    <button onClick={handleNextQuestion} disabled={!isAnswerSelected} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
                        {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </button>
                </div>
            </div>
        );
    };

    const ResultsScreenComponent = () => (
        <div className="w-full max-w-5xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
            <h1 className="text-4xl font-bold text-center mb-2">Resultados del Quiz</h1>
            <h2 className="text-2xl text-gray-400 text-center mb-8">{quizData.title}</h2>
             {error && <div className="bg-yellow-500/20 text-yellow-300 p-3 rounded-lg mb-6 text-center">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
                <div className="bg-gray-700 p-6 rounded-lg"><h3 className="text-lg text-gray-400">Calificación</h3><p className={`text-5xl font-bold ${results.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>{results.score}%</p></div>
                <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><CheckCircle className="h-8 w-8 text-green-400 mr-2"/><p className="text-3xl font-bold">{results.correct}</p></div><h3 className="text-lg text-gray-400 mt-1">Correctas</h3></div>
                <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><XCircle className="h-8 w-8 text-red-400 mr-2"/><p className="text-3xl font-bold">{results.incorrect}</p></div><h3 className="text-lg text-gray-400 mt-1">Incorrectas</h3></div>
            </div>
            <div className="mt-8 text-center">
                <button onClick={resetApp} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg flex items-center mx-auto transition-transform transform hover:scale-105">
                    <Repeat className="mr-2"/> Intentar otro Quiz
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (appState) {
            case 'quiz': return <QuizScreenComponent />;
            case 'results': return <ResultsScreenComponent />;
            case 'setup':
            default:
                return <QuizSetupComponent />;
        }
    };
    
    return renderContent();
};

export default QuizTakerPage;