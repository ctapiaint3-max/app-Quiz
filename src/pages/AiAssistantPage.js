import React from 'react';
import { Bot, Send } from 'lucide-react';

const AiAssistantPage = () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState([{ role: 'assistant', text: '¡Hola! Soy Kai, tu asistente IA. ¿En qué puedo ayudarte hoy?' }]);
    const [userInput, setUserInput] = React.useState('');

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

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
                <Bot className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Kai AI, tu asistente de estudio.</h1>
                <p className="text-gray-400 mt-2">Kai es un asistente de estudio, potenciado por inteligencia artificial.</p>
            </div>
            
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
        </div>
    );
};

export default AiAssistantPage;