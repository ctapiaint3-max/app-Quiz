// src/components/Community/PublicQuizCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, BarChart2 } from 'lucide-react';

const PublicQuizCard = ({ quiz }) => {
    const navigate = useNavigate();

    const handleStartQuiz = () => {
        // La lógica para tomar un quiz público puede necesitar ajustes
        // dependiendo de si quieres cargar los datos completos del quiz aquí
        // o en la página de QuizTaker.
        navigate('/dashboard/tomar-quiz', { state: { quizToLoad: quiz } });
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between border border-gray-700 hover:border-green-500 transition-colors">
            <div>
                <h3 className="text-2xl font-bold text-white mb-2">{quiz.title}</h3>
                <div className="flex items-center text-sm text-gray-400 mb-2">
                    <User className="h-4 w-4 mr-2" />
                    <span>Creado por: {quiz.author}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 mb-6">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    <span>{quiz.attempts} intentos</span>
                </div>
            </div>
            <button 
                onClick={handleStartQuiz}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
            >
                <BookOpen className="h-5 w-5 mr-2" />
                Tomar Quiz
            </button>
        </div>
    );
};

export default PublicQuizCard;  