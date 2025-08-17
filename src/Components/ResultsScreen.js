import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, BarChart2, Repeat } from 'lucide-react';

const ResultsScreen = ({ results, quizData, onResetApp }) => (
    <div className="w-full max-w-5xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
        <h1 className="text-4xl font-bold text-center mb-2">Resultados del Quiz</h1>
        <h2 className="text-2xl text-gray-400 text-center mb-8">{quizData.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
            <div className="bg-gray-700 p-6 rounded-lg"><h3 className="text-lg text-gray-400">Calificación</h3><p className={`text-5xl font-bold ${results.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{results.score}%</p></div>
            <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><CheckCircle className="h-8 w-8 text-green-400 mr-2"/><p className="text-3xl font-bold">{results.correct}</p></div><h3 className="text-lg text-gray-400 mt-1">Correctas</h3></div>
            <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><XCircle className="h-8 w-8 text-red-400 mr-2"/><p className="text-3xl font-bold">{results.incorrect}</p></div><h3 className="text-lg text-gray-400 mt-1">Incorrectas</h3></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center"><BarChart2 className="mr-2"/>Desempeño Visual</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={results.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                            <Legend wrapperStyle={{ color: '#A0AEC0' }} />
                            <Bar dataKey="correctas" fill="#48BB78" name="Correctas" />
                            <Bar dataKey="incorrectas" fill="#F56565" name="Incorrectas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Repaso de Errores</h3>
                {results.incorrectQuestions.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                        {results.incorrectQuestions.map((item, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-md border-l-4 border-red-500">
                                <p className="font-semibold">{item.question}</p>
                                <p className="text-sm text-red-400">Tu respuesta: {item.yourAnswer}</p>
                                <p className="text-sm text-green-400">Correcta: {item.correctAnswer}</p>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-green-400 text-center py-10">¡Felicidades! No tuviste errores.</p>}
            </div>
        </div>
        <div className="mt-8 text-center">
            <button onClick={onResetApp} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg flex items-center mx-auto transition-transform transform hover:scale-105">
                <Repeat className="mr-2"/> Intentar otro Quiz
            </button>
        </div>
    </div>
);