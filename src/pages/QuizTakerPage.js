// -----------------------------------------------------------------------------
// ARCHIVO 2: src/pages/QuizTakerPage.js (VERSIÓN ACTUALIZADA)
// -----------------------------------------------------------------------------
// Ahora, esta página puede recibir un quiz para iniciarlo automáticamente.

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // 1. Importamos useLocation
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, FileText, Clock, CheckCircle, XCircle, BarChart2, Repeat, Shuffle } from 'lucide-react';

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
    const location = useLocation(); // 2. Inicializamos el hook para acceder al 'state'

    const [appState, setAppState] = useState('setup');
    const [quizData, setQuizData] = useState(null);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // 3. Creamos una función reutilizable para iniciar el quiz
    const startQuiz = useCallback((quiz) => {
        if (quiz && quiz.questions) {
            // Transformamos las preguntas al formato que necesita el componente
            const transformedQuestions = quiz.questions.map(q => {
                const correctAnswerObj = q.respuestas.find(r => r.correcta === true);
                return { 
                    question: q.pregunta, 
                    options: q.respuestas.map(r => r.respuesta), 
                    answer: correctAnswerObj.respuesta, 
                    theme: q.tema 
                };
            });

            setQuizData({ title: quiz.title, questions: transformedQuestions });
            setShuffledQuestions(shuffleArray([...transformedQuestions]));
            setTimeLeft(transformedQuestions.length * 30);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setResults(null);
            setAppState('quiz');
        }
    }, []);

    // 4. useEffect para comprobar si se ha pasado un quiz desde la biblioteca
    useEffect(() => {
        // Si hay un quiz en location.state, lo iniciamos
        if (location.state && location.state.quizToLoad) {
            startQuiz(location.state.quizToLoad);
        }
    }, [location.state, startQuiz]);


    const finishQuiz = useCallback(() => {
        if (!quizData) return;
        // ... (el resto de la función finishQuiz no cambia)
        const topicResults = {};
        let totalCorrect = 0;
        shuffledQuestions.forEach((q, index) => {
            const theme = q.theme || 'General';
            if (!topicResults[theme]) {
                topicResults[theme] = { correctas: 0, incorrectas: 0, total: 0 };
            }
            topicResults[theme].total++;
            if (userAnswers[index] === q.answer) {
                topicResults[theme].correctas++;
                totalCorrect++;
            } else {
                topicResults[theme].incorrectas++;
            }
        });
        const chartData = Object.keys(topicResults).map(theme => ({ name: theme, correctas: topicResults[theme].correctas, incorrectas: topicResults[theme].incorrectas }));
        const totalQuestions = shuffledQuestions.length;
        const totalIncorrect = totalQuestions - totalCorrect;
        const score10 = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 10 : 0;
        const incorrectQuestions = shuffledQuestions.map((q, index) => ({ ...q, originalIndex: index })).filter(q => userAnswers[q.originalIndex] !== q.answer).map(q => ({ question: q.question, yourAnswer: userAnswers[q.originalIndex] || "No respondida", correctAnswer: q.answer, theme: q.theme }));
        setResults({ score: score10.toFixed(1), correct: totalCorrect, incorrect: totalIncorrect, total: totalQuestions, incorrectQuestions, chartData });
        setAppState('results');
    }, [quizData, userAnswers, shuffledQuestions]);

    useEffect(() => {
        if (appState !== 'quiz' || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        if (timeLeft === 1) setTimeout(finishQuiz, 1000);
        return () => clearInterval(timerId);
    }, [appState, timeLeft, finishQuiz]);

    const processQuizFile = (file) => {
        if (file && file.type === "application/json") {
            setError('');
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedJson = JSON.parse(e.target.result);
                    // Usamos la misma función startQuiz para mantener la lógica centralizada
                    startQuiz({ title: file.name.replace('.json', ''), questions: loadedJson });
                } catch (err) {
                    setError(`Error al procesar JSON: ${err.message}`);
                    setQuizData(null);
                    setFileName('');
                }
            };
            reader.readAsText(file);
        } else {
            setError("Por favor, sube un archivo .json");
            setFileName('');
            setQuizData(null);
        }
    };

    const handleFileChange = (event) => processQuizFile(event.target.files[0]);
    const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };
    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        processQuizFile(event.dataTransfer.files[0]);
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
    };

    const QuizSetup = () => (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="text-center mb-8">
                <FileText className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Prepara tu Quiz</h1>
                <p className="text-gray-400 mt-2">Sube o arrastra tu archivo JSON para comenzar.</p>
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

    const QuizScreen = () => {
        // ... (el resto del componente QuizScreen no cambia)
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
                <div className="bg-gray-900 p-6 rounded-lg mb-6"><p className="text-blue-400 font-semibold mb-2">Tema: {currentQuestion.theme}</p><h3 className="text-2xl font-semibold mb-2">Pregunta {currentQuestionIndex + 1} de {shuffledQuestions.length}</h3><p className="text-xl">{currentQuestion.question}</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{currentQuestion.options.map((option, index) => (<button key={index} onClick={() => handleAnswerSelect(currentQuestionIndex, option)} className={`p-4 rounded-lg text-left text-lg border-2 transition-all ${userAnswers[currentQuestionIndex] === option ? 'bg-blue-500 border-blue-400 scale-105' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>{option}</button>))}</div>
                <div className="mt-8 text-right">
                    <button onClick={handleNextQuestion} disabled={!isAnswerSelected} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
                        {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </button>
                </div>
            </div>
        );
    };

    const ResultsScreen = () => (
        // ... (el resto del componente ResultsScreen no cambia)
        <div className="w-full max-w-5xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
            <h1 className="text-4xl font-bold text-center mb-2">Resultados del Quiz</h1>
            <h2 className="text-2xl text-gray-400 text-center mb-8">{quizData.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
                <div className="bg-gray-700 p-6 rounded-lg"><h3 className="text-lg text-gray-400">Calificación (1-10)</h3><p className={`text-5xl font-bold ${results.score >= 6 ? 'text-green-400' : 'text-red-400'}`}>{results.score}</p></div>
                <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><CheckCircle className="h-8 w-8 text-green-400 mr-2"/><p className="text-3xl font-bold">{results.correct}</p></div><h3 className="text-lg text-gray-400 mt-1">Correctas</h3></div>
                <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><XCircle className="h-8 w-8 text-red-400 mr-2"/><p className="text-3xl font-bold">{results.incorrect}</p></div><h3 className="text-lg text-gray-400 mt-1">Incorrectas</h3></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><BarChart2 className="mr-2"/>Desempeño por Tema</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={results.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#A0AEC0' }} width={120} />
                                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                <Legend wrapperStyle={{ color: '#A0AEC0' }} />
                                <Bar dataKey="correctas" stackId="a" fill="#48BB78" name="Correctas" />
                                <Bar dataKey="incorrectas" stackId="a" fill="#F56565" name="Incorrectas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold mb-4">Repaso de Errores</h3>
                    {results.incorrectQuestions.length > 0 ? (
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            {results.incorrectQuestions.map((item, index) => (
                                <div key={index} className="bg-gray-800 p-4 rounded-md border-l-4 border-red-500">
                                    <p className="font-semibold">{item.question}</p>
                                    <p className="text-sm text-yellow-400">Tema: {item.theme}</p>
                                    <p className="text-sm text-red-400">Tu respuesta: {item.yourAnswer}</p>
                                    <p className="text-sm text-green-400">Correcta: {item.correctAnswer}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-green-400 text-center py-10">¡Felicidades! No tuviste errores.</p>}
                </div>
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
            case 'setup': return <QuizSetup />;
            case 'quiz': return <QuizScreen />;
            case 'results': return <ResultsScreen />;
            default: return <QuizSetup />;
        }
    };
    
    return renderContent();
};

export default QuizTakerPage;
