// src/pages/AiAssistantPage.js
import React, { useState } from 'react';
import { Bot, Send, BarChart, BrainCircuit } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ReactMarkdown from 'react-markdown'; // Importamos para formatear la respuesta

const AiAssistantPage = () => {
    // ... (El estado y las funciones del chat general no cambian)
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState([{ role: 'assistant', text: '¡Hola! Soy Kai, tu asistente IA. ¿En qué puedo ayudarte hoy?' }]);
    const [userInput, setUserInput] = React.useState('');

    const [activeTab, setActiveTab] = useState('chat');
    const [feedback, setFeedback] = useState('');
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const { token } = useAuth();
    
     const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newHistory = [...chatHistory, { role: 'user', text: userInput }];
        setChatHistory(newHistory);
        setUserInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/assistant-general', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userInput, history: chatHistory })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error del servidor');
            }
            const result = await response.json();
            setChatHistory([...newHistory, { role: 'assistant', text: result.reply }]);
        } catch (err) {
            setError(`No se pudo obtener respuesta: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    const getAiFeedback = async () => {
        setIsFeedbackLoading(true);
        setFeedback('');
        setFeedbackError('');
        try {
            const response = await fetch('/api/ai/feedback', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener el análisis.');
            }
            
            setFeedback(data.feedback);
        } catch (err) {
            setFeedbackError(err.message);
            console.error(err);
        } finally {
            setIsFeedbackLoading(false);
        }
    };

    const renderFeedback = () => {
        if (isFeedbackLoading) {
            return (
                <div className="text-center p-10">
                    <BrainCircuit className="h-12 w-12 text-blue-400 mx-auto animate-pulse" />
                    <p className="mt-4 text-gray-400">Analizando tu rendimiento...</p>
                </div>
            );
        }
        if (feedbackError) {
            return (
                <div className="bg-red-500/10 text-red-300 p-4 rounded-lg text-center">
                    <p><strong>Oops! Hubo un problema</strong></p>
                    <p>{feedbackError}</p>
                </div>
            );
        }
        if (feedback) {
            return (
                <div className="bg-gray-900 p-6 rounded-lg prose prose-invert prose-p:text-gray-300 prose-headings:text-white">
                    <ReactMarkdown>{feedback}</ReactMarkdown>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
             <div className="text-center mb-8">
                <Bot className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Kai AI, tu asistente de estudio</h1>
                <p className="text-gray-400 mt-2">Haz preguntas, pide resúmenes o analiza tu rendimiento.</p>
            </div>
            
            <div className="flex border-b border-gray-700 mb-6">
                <button onClick={() => setActiveTab('chat')} className={`py-2 px-4 transition-colors ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Chat General</button>
                <button onClick={() => setActiveTab('feedback')} className={`py-2 px-4 transition-colors ${activeTab === 'feedback' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Análisis de Rendimiento</button>
            </div>

            {activeTab === 'chat' && (
               <div className="flex flex-col h-[60vh]">
                    <div className="flex-grow bg-gray-900 rounded-t-lg p-4 overflow-y-auto space-y-4">
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center p-2 bg-gray-700 rounded-b-lg border-t border-gray-600">
                        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Escribe tu pregunta aquí..." className="flex-grow bg-transparent text-white focus:outline-none px-4" />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full disabled:bg-gray-500">
                            <Send className="h-5 w-5 text-white" />
                        </button>
                    </form>
                    {error && <div className="bg-red-500/20 text-red-300 p-2 mt-2 rounded-lg text-center">{error}</div>}
                </div>
            )}

            {activeTab === 'feedback' && (
                <div>
                    {!feedback && !isFeedbackLoading && !feedbackError && (
                        <button onClick={getAiFeedback} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-transform transform hover:scale-105">
                            <BarChart className="mr-2" />
                            Generar mi Análisis de Rendimiento
                        </button>
                    )}
                    <div className="mt-6">
                        {renderFeedback()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistantPage;