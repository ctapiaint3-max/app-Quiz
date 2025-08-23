// -----------------------------------------------------------------------------
// ARCHIVO 2: src/Components/Biblioteca/QuizCard.js (VERSIÓN ACTUALIZADA)
// -----------------------------------------------------------------------------
// El botón "Editar" ahora navega a la nueva página de edición.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Edit, Trash2, Clock, HelpCircle } from 'lucide-react';

const QuizCard = ({ quiz, onDelete }) => {
    const navigate = useNavigate();

    const questionCount = quiz.questions ? quiz.questions.length : 0;
    const formattedDate = new Date(quiz.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const handleStartQuiz = () => {
        navigate('/dashboard/tomar-quiz', { 
            state: { quizToLoad: quiz } 
        });
    };

    // --- NUEVA FUNCIÓN ---
    const handleEditQuiz = () => {
        // Navega a la ruta del editor, pasando el ID del quiz en la URL
        navigate(`/dashboard/editar-quiz/${quiz.id}`);
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between border border-gray-700 hover:border-blue-500 transition-colors">
            <div>
                <h3 className="text-2xl font-bold text-white mb-2">{quiz.title}</h3>
                <div className="flex items-center text-sm text-gray-400 mb-4">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <span>{questionCount} preguntas</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 mb-6">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Creado el {formattedDate}</span>
                </div>
            </div>
            <div className="flex space-x-2">
                <button 
                    onClick={handleStartQuiz}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
                >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Iniciar
                </button>
                <button 
                    onClick={handleEditQuiz} // <-- Asignamos la nueva función
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" 
                    title="Editar"
                >
                    <Edit className="h-5 w-5 text-gray-300" />
                </button>
                <button 
                    onClick={() => onDelete(quiz.id)}
                    className="p-2 bg-red-800 hover:bg-red-700 rounded-lg" 
                    title="Eliminar"
                >
                    <Trash2 className="h-5 w-5 text-white" />
                </button>
            </div>
        </div>
    );
};

export default QuizCard;

