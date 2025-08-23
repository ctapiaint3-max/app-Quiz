// -----------------------------------------------------------------------------
// ARCHIVO 1: src/pages/QuizEditorPage.js (¡NUEVO ARCHIVO!)
// -----------------------------------------------------------------------------
// Esta página carga un quiz existente y te permite modificarlo.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';

const QuizEditorPage = () => {
    const { quizId } = useParams(); // Obtiene el ID del quiz de la URL
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Carga el quiz específico desde localStorage
        const storedQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
        const quizToEdit = storedQuizzes.find(q => q.id.toString() === quizId);
        
        if (quizToEdit) {
            setQuiz(quizToEdit);
        }
        setIsLoading(false);
    }, [quizId]);

    const handleTitleChange = (e) => {
        setQuiz({ ...quiz, title: e.target.value });
    };

    const handleQuestionChange = (qIndex, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[qIndex].pregunta = value;
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const handleAnswerChange = (qIndex, aIndex, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[qIndex].respuestas[aIndex].respuesta = value;
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const handleCorrectAnswerChange = (qIndex, aIndex) => {
        const updatedQuestions = [...quiz.questions];
        // Pone todas las respuestas en 'false' primero
        updatedQuestions[qIndex].respuestas.forEach(ans => ans.correcta = false);
        // Pone la seleccionada en 'true'
        updatedQuestions[qIndex].respuestas[aIndex].correcta = true;
        setQuiz({ ...quiz, questions: updatedQuestions });
    };
    
    const handleDeleteQuestion = (qIndex) => {
        const updatedQuestions = quiz.questions.filter((_, index) => index !== qIndex);
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            pregunta: "Nueva pregunta",
            tema: "General",
            respuestas: [
                { respuesta: "Opción 1", correcta: true },
                { respuesta: "Opción 2", correcta: false },
            ]
        };
        setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    };

    const handleSaveChanges = () => {
        const storedQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
        const updatedQuizzes = storedQuizzes.map(q => 
            q.id.toString() === quizId ? quiz : q
        );
        localStorage.setItem('myQuizzes', JSON.stringify(updatedQuizzes));
        navigate('/dashboard/biblioteca'); // Vuelve a la biblioteca después de guardar
    };

    if (isLoading) {
        return <div className="text-center text-white">Cargando editor...</div>;
    }

    if (!quiz) {
        return <div className="text-center text-red-400">Quiz no encontrado.</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Editar Quiz</h1>
                <button onClick={() => navigate('/dashboard/biblioteca')} className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Volver a la Biblioteca
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg space-y-6">
                <div>
                    <label htmlFor="quiz-title" className="block text-lg font-medium text-gray-300 mb-2">Título del Quiz</label>
                    <input
                        id="quiz-title"
                        type="text"
                        value={quiz.title}
                        onChange={handleTitleChange}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200"
                    />
                </div>

                {quiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Pregunta {qIndex + 1}</h3>
                            <button onClick={() => handleDeleteQuestion(qIndex)} className="p-2 text-red-400 hover:bg-red-900/50 rounded-full">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                        <textarea
                            value={q.pregunta}
                            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 mb-4"
                            rows="2"
                        />
                        <div className="space-y-2">
                            {q.respuestas.map((ans, aIndex) => (
                                <div key={aIndex} className="flex items-center">
                                    <input
                                        type="radio"
                                        name={`correct-answer-${qIndex}`}
                                        checked={ans.correcta}
                                        onChange={() => handleCorrectAnswerChange(qIndex, aIndex)}
                                        className="h-5 w-5 text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-600"
                                    />
                                    <input
                                        type="text"
                                        value={ans.respuesta}
                                        onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                                        className="w-full ml-3 p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                
                <button onClick={handleAddQuestion} className="flex items-center justify-center w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Añadir Pregunta
                </button>
            </div>

            <div className="mt-8 text-right">
                <button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg flex items-center ml-auto">
                    <Save className="mr-2 h-5 w-5" />
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default QuizEditorPage;
