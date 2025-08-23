// ARCHIVO 3: src/Components/Biblioteca/QuizCard.js (versión simplificada)
import React, { useState } from 'react';
import { Trash2, Play, Edit, BarChart2, Calendar, Tag } from 'lucide-react';

const QuizCard = ({ quiz, onDelete, onEdit, onPlay }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const getQuizThemes = () => {
        if (quiz.temas && quiz.temas.length > 0) {
            return quiz.temas;
        }
        
        if (quiz.questions && quiz.questions.length > 0) {
            const themes = new Set();
            quiz.questions.forEach(q => {
                if (q.tema) themes.add(q.tema);
            });
            return Array.from(themes);
        }
        
        return ['Sin temas'];
    };
    
    const themes = getQuizThemes();
    
    const handleDelete = () => {
        onDelete(quiz.id);
        setShowDeleteConfirm(false);
    };
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-700">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white truncate">{quiz.title}</h3>
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                
                {quiz.description && (
                    <p className="text-gray-400 mb-4 line-clamp-2">{quiz.description}</p>
                )}
                
                <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Calendar size={16} className="mr-1" />
                    <span>Creado: {formatDate(quiz.createdAt)}</span>
                </div>
                
                <div className="mb-4">
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                        <Tag size={16} className="mr-1" />
                        <span>Temas:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {themes.slice(0, 3).map((tema, index) => (
                            <span 
                                key={index} 
                                className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full"
                            >
                                {tema}
                            </span>
                        ))}
                        {themes.length > 3 && (
                            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                                +{themes.length - 3}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">
                        <BarChart2 size={16} className="inline mr-1" />
                        {quiz.questions ? quiz.questions.length : 0} preguntas
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-900 px-6 py-4 flex justify-between">
                <button 
                    onClick={() => onPlay(quiz.id)}
                    className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                    <Play size={18} className="mr-1" />
                    Jugar
                </button>
                <button 
                    onClick={() => onEdit(quiz.id)}
                    className="text-green-400 hover:text-green-300 flex items-center"
                >
                    <Edit size={18} className="mr-1" />
                    Editar
                </button>
            </div>
            
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">Confirmar eliminación</h3>
                        <p className="text-gray-400 mb-6">
                            ¿Estás seguro de que quieres eliminar el quiz "{quiz.title}"? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizCard;