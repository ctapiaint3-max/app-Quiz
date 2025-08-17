import React from 'react';
import { Upload, FileText } from 'lucide-react';

const QuizSetup = ({ onFileUpload, onStartQuiz, fileName, error, userId }) => (
    <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
            <FileText className="mx-auto h-16 w-16 text-blue-400 mb-4" />
            <h1 className="text-4xl font-bold text-white">Prepara tu Quiz</h1>
            <p className="text-gray-400 mt-2">Sube tu archivo JSON para comenzar.</p>
            {userId && <p className="text-xs text-gray-500 mt-2">ID de Usuario: {userId}</p>}
        </div>
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}
        <div className="mb-6">
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-500 transition-colors">
                <Upload className="mr-3 h-6 w-6" />
                <span>{fileName || 'Seleccionar archivo JSON'}</span>
            </label>
            <input id="file-upload" type="file" accept=".json" onChange={onFileUpload} className="hidden" />
        </div>
        <button onClick={onStartQuiz} disabled={!fileName} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg transition-all transform hover:scale-105">
            Comenzar Quiz
        </button>
    </div>
);