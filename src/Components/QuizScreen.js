import React from 'react';
import { Clock } from 'lucide-react';

const QuizScreen = ({ quizData, currentQuestionIndex, timeLeft, userAnswers, onAnswerSelect, onNextQuestion }) => {
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    
    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{quizData.title}</h2>
                <div className="flex items-center bg-gray-700 px-4 py-2 rounded-lg">
                    <Clock className="h-6 w-6 mr-2 text-blue-400" />
                    <span className="text-xl font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
            <div className="bg-gray-900 p-6 rounded-lg mb-6">
                <h3 className="text-2xl font-semibold mb-2">Pregunta {currentQuestionIndex + 1} de {quizData.questions.length}</h3>
                <p className="text-xl">{currentQuestion.question}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                    <button key={index} onClick={() => onAnswerSelect(currentQuestionIndex, option)} className={`p-4 rounded-lg text-left text-lg border-2 transition-all ${userAnswers[currentQuestionIndex] === option ? 'bg-blue-500 border-blue-400 scale-105' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                        {option}
                    </button>
                ))}
            </div>
            <div className="mt-8 text-right">
                <button onClick={onNextQuestion} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
                    {currentQuestionIndex < quizData.questions.length - 1 ? 'Siguiente' : 'Finalizar'}
                </button>
            </div>
        </div>
    );
};