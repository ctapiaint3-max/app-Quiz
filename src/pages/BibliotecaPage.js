// -----------------------------------------------------------------------------
// ARCHIVO 1: src/pages/BibliotecaPage.js (¡NUEVO ARCHIVO!)
// -----------------------------------------------------------------------------
// Esta página carga los quizzes desde localStorage y los muestra.

import React, { useState, useEffect } from 'react';
import QuizCard from '../Components/Biblioteca/QuizCard';
import { Library } from 'lucide-react';

const BibliotecaPage = () => {
    const [quizzes, setQuizzes] = useState([]);

    // Carga los quizzes desde localStorage cuando el componente se monta
    useEffect(() => {
        const storedQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
        setQuizzes(storedQuizzes);
    }, []);

    // Función para eliminar un quiz, que se pasará al componente QuizCard
    const handleDeleteQuiz = (quizId) => {
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
        setQuizzes(updatedQuizzes);
        localStorage.setItem('myQuizzes', JSON.stringify(updatedQuizzes));
    };

    return (
        <div className="w-full">
            <div className="flex items-center mb-8">
                <Library className="h-10 w-10 mr-4 text-blue-400" />
                <h1 className="text-4xl font-bold text-white">Mi Biblioteca de Quizzes</h1>
            </div>

            {quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <QuizCard 
                            key={quiz.id} 
                            quiz={quiz} 
                            onDelete={handleDeleteQuiz} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
                    <p className="text-xl text-gray-400">Tu biblioteca está vacía.</p>
                    <p className="text-gray-500 mt-2">Ve a "Crear Quiz" para generar y guardar tu primer cuestionario.</p>
                </div>
            )}
        </div>
    );
};

export default BibliotecaPage;
