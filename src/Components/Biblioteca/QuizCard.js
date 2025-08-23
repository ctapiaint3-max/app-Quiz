import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Edit, Trash2, Clock, HelpCircle, Globe, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toggleQuizPublicStatus } from '../../services/quizService';

// Componente de interruptor (Switch) para reutilizar
const ToggleSwitch = ({ isPublic, onToggle, disabled }) => (
    <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none disabled:opacity-50 ${isPublic ? 'bg-green-500' : 'bg-gray-600'}`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isPublic ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const QuizCard = ({ quiz, onDelete }) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [isPublic, setIsPublic] = useState(quiz.is_public);
    const [isToggling, setIsToggling] = useState(false);
    const [error, setError] = useState('');

    const questionCount = quiz.questions ? quiz.questions.length : 0;
    const formattedDate = new Date(quiz.created_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const handleTogglePublic = async (e) => {
        e.stopPropagation(); // Evita que el clic se propague a otros elementos
        setIsToggling(true);
        setError('');
        try {
            const response = await toggleQuizPublicStatus(quiz.id, token);
            setIsPublic(response.isPublic); // Sincronizamos con la respuesta real del servidor
        } catch (err) {
            setError('No se pudo cambiar la visibilidad.');
            // Revertimos en caso de error después de un momento para que el usuario vea el cambio
            setTimeout(() => setIsPublic(quiz.is_public), 1000);
        } finally {
            setIsToggling(false);
        }
    };

    const handleStartQuiz = () => navigate('/dashboard/tomar-quiz', { state: { quizToLoad: quiz } });
    const handleEditQuiz = () => navigate(`/dashboard/editar-quiz/${quiz.id}`);

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between border border-gray-700 hover:border-blue-500 transition-colors">
            <div>
                <h3 className="text-2xl font-bold text-white mb-2 truncate">{quiz.title}</h3>
                <div className="flex items-center text-sm text-gray-400 mb-2">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <span>{questionCount} preguntas</span>
                </div>
                <div className="flex items-center text-sm text-gray-400 mb-6">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Creado el {formattedDate}</span>
                </div>
            </div>

            {/* Nueva sección para el interruptor de visibilidad */}
            <div className="border-t border-b border-gray-700 my-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    {isPublic ? <Globe size={16} className="text-green-400" /> : <Lock size={16} />}
                    <span>{isPublic ? 'Público' : 'Privado'}</span>
                </div>
                <ToggleSwitch isPublic={isPublic} onToggle={handleTogglePublic} disabled={isToggling} />
            </div>
            {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
            
            <div className="flex space-x-2">
                <button onClick={handleStartQuiz} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 mr-2" /> Iniciar
                </button>
                <button onClick={handleEditQuiz} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Editar">
                    <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(quiz.id)} className="p-2 bg-red-800 hover:bg-red-700 rounded-lg" title="Eliminar">
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default QuizCard;