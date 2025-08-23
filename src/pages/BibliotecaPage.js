// ARCHIVO 2: src/pages/BibliotecaPage.js (versión adaptada)
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCard from '../Components/Biblioteca/QuizCard';
import { Library, Upload, Filter, Search, Plus } from 'lucide-react';

const BibliotecaPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [activeTheme, setActiveTheme] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Carga los quizzes desde localStorage
    const loadQuizzes = () => {
        const storedQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
        setQuizzes(storedQuizzes);
    };

    useEffect(() => {
        loadQuizzes();
    }, []);

    // Extrae todos los temas únicos de los quizzes
    const allThemes = useMemo(() => {
        const themes = new Set(['Todos']);
        quizzes.forEach(quiz => {
            if (quiz.temas && quiz.temas.length > 0) {
                quiz.temas.forEach(tema => themes.add(tema));
            } else if (quiz.questions && quiz.questions.length > 0) {
                quiz.questions.forEach(q => {
                    if (q.tema) themes.add(q.tema);
                });
            }
        });
        return Array.from(themes);
    }, [quizzes]);

    // Filtra los quizzes según el tema activo y término de búsqueda
    const filteredQuizzes = useMemo(() => {
        let result = quizzes;
        
        if (activeTheme !== 'Todos') {
            result = result.filter(quiz => {
                if (quiz.temas && quiz.temas.includes(activeTheme)) return true;
                if (quiz.questions && quiz.questions.some(q => q.tema === activeTheme)) return true;
                return false;
            });
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(quiz => 
                quiz.title.toLowerCase().includes(term) || 
                (quiz.description && quiz.description.toLowerCase().includes(term)) ||
                (quiz.temas && quiz.temas.some(t => t.toLowerCase().includes(term)))
            );
        }
        
        return result;
    }, [quizzes, activeTheme, searchTerm]);

    const handleDeleteQuiz = (quizId) => {
        const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
        setQuizzes(updatedQuizzes);
        localStorage.setItem('myQuizzes', JSON.stringify(updatedQuizzes));
    };

    const handleEditQuiz = (quizId) => {
        navigate(`/editar-quiz?quizId=${quizId}`);
    };

    const handlePlayQuiz = (quizId) => {
        const quizToPlay = quizzes.find(q => q.id === quizId);
        localStorage.setItem('currentQuiz', JSON.stringify(quizToPlay));
        navigate('/tomar-quiz');
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const quizData = JSON.parse(e.target.result);
                    
                    if (!quizData.title || !quizData.questions) {
                        throw new Error("Formato de quiz inválido");
                    }
                    
                    const newQuiz = {
                        id: Date.now(),
                        title: quizData.title,
                        description: quizData.description || "",
                        temas: quizData.temas || [],
                        createdAt: new Date().toISOString(),
                        questions: quizData.questions
                    };
                    
                    const existingQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
                    localStorage.setItem('myQuizzes', JSON.stringify([...existingQuizzes, newQuiz]));
                    loadQuizzes();
                    
                    alert(`Quiz "${newQuiz.title}" subido correctamente`);
                } catch (err) {
                    alert("Error: El archivo JSON no tiene un formato válido.");
                }
            };
            reader.readAsText(file);
        } else {
            alert("Por favor, sube un archivo .json válido.");
        }
        event.target.value = null; 
    };

    return (
        <div className="w-full p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center mb-4 md:mb-0">
                    <Library className="h-10 w-10 mr-4 text-blue-400" />
                    <h1 className="text-4xl font-bold text-white">Mi Biblioteca</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                        <Upload className="h-5 w-5 mr-2" />
                        Subir Quiz
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button 
                        onClick={() => navigate('/generar-quiz')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo Quiz
                    </button>
                </div>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar quizzes por título, descripción o tema..."
                    className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <Filter className="h-5 w-5 mr-2 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-300">Filtrar por tema:</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {allThemes.map(theme => (
                        <button 
                            key={theme}
                            onClick={() => setActiveTheme(theme)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                activeTheme === theme 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {theme}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm">Total de Quizzes</h3>
                    <p className="text-2xl font-bold text-white">{quizzes.length}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm">Temas diferentes</h3>
                    <p className="text-2xl font-bold text-white">{allThemes.length - 1}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm">Filtrados</h3>
                    <p className="text-2xl font-bold text-white">{filteredQuizzes.length}</p>
                </div>
            </div>

            {filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.map(quiz => (
                        <QuizCard 
                            key={quiz.id} 
                            quiz={quiz} 
                            onDelete={handleDeleteQuiz}
                            onEdit={handleEditQuiz}
                            onPlay={handlePlayQuiz}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-8 bg-gray-800 rounded-lg">
                    <Library className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-xl text-gray-400 mb-2">
                        {searchTerm || activeTheme !== 'Todos' 
                            ? 'No se encontraron quizzes con los filtros seleccionados.' 
                            : 'Tu biblioteca está vacía.'}
                    </p>
                    <p className="text-gray-500">
                        {searchTerm || activeTheme !== 'Todos' 
                            ? 'Intenta con otros filtros o añade un nuevo quiz.' 
                            : 'Ve a "Generar Quiz" o sube un archivo para empezar.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BibliotecaPage;