// ARCHIVO 1: src/pages/QuizEditorPage.js (versión corregida)
import React, { useState, useEffect } from 'react';

const QuizEditorPage = () => {
    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        questions: []
    });

    // Cargar quiz para editar si hay un ID en la URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('quizId');
        
        if (quizId) {
            const storedQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
            const quizToEdit = storedQuizzes.find(q => q.id === parseInt(quizId));
            
            if (quizToEdit) {
                setQuiz(quizToEdit);
            }
        }
    }, []);

    const handleSaveQuiz = () => {
        // Lógica para guardar el quiz
        const storedQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
        
        if (quiz.id) {
            // Editar quiz existente
            const updatedQuizzes = storedQuizzes.map(q => 
                q.id === quiz.id ? quiz : q
            );
            localStorage.setItem('myQuizzes', JSON.stringify(updatedQuizzes));
        } else {
            // Crear nuevo quiz
            const newQuiz = {
                ...quiz,
                id: Date.now(),
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('myQuizzes', JSON.stringify([...storedQuizzes, newQuiz]));
        }
        
        alert('Quiz guardado correctamente');
    };

    const addQuestion = () => {
        setQuiz({
            ...quiz,
            questions: [
                ...quiz.questions,
                {
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    tema: ''
                }
            ]
        });
    };

    const updateQuestion = (index, field, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[index][field] = value;
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const updateOption = (questionIndex, optionIndex, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[questionIndex].options[optionIndex] = value;
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-6">Editor de Quiz</h1>
            
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold mb-4">Información del Quiz</h2>
                    
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-2">Título del Quiz</label>
                        <input
                            type="text"
                            value={quiz.title}
                            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                            className="w-full p-3 bg-gray-700 rounded-lg text-white"
                            placeholder="Ingresa el título del quiz"
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-2">Descripción</label>
                        <textarea
                            value={quiz.description}
                            onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                            className="w-full p-3 bg-gray-700 rounded-lg text-white"
                            placeholder="Describe el quiz"
                            rows="3"
                        />
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Preguntas</h2>
                        <button
                            onClick={addQuestion}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                        >
                            + Añadir Pregunta
                        </button>
                    </div>

                    {quiz.questions.map((question, qIndex) => (
                        <div key={qIndex} className="mb-6 p-4 bg-gray-700 rounded-lg">
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Pregunta {qIndex + 1}</label>
                                <input
                                    type="text"
                                    value={question.question}
                                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                    className="w-full p-3 bg-gray-600 rounded-lg text-white"
                                    placeholder="Escribe la pregunta"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Tema</label>
                                <input
                                    type="text"
                                    value={question.tema}
                                    onChange={(e) => updateQuestion(qIndex, 'tema', e.target.value)}
                                    className="w-full p-3 bg-gray-600 rounded-lg text-white"
                                    placeholder="Ej: Matemáticas, Historia, etc."
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">Opciones de respuesta</label>
                                {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center mb-2">
                                        <input
                                            type="radio"
                                            name={`correctAnswer-${qIndex}`}
                                            checked={question.correctAnswer === oIndex}
                                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                            className="mr-3"
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            className="flex-1 p-2 bg-gray-600 rounded-lg text-white"
                                            placeholder={`Opción ${oIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSaveQuiz}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-semibold"
                >
                    Guardar Quiz
                </button>
            </div>
        </div>
    );
};

export default QuizEditorPage;