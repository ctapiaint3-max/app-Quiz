import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, FileText, Clock, CheckCircle, XCircle, BarChart2, Repeat, Shuffle, Bot, Clipboard, Download, BookOpen, Pencil, Send } from 'lucide-react';

// --- Función para barajar un array ---
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

// --- Componente: Creador de Quiz con IA ---
const QuizGenerator = () => {
    const [sourceText, setSourceText] = React.useState('');
    const [numQuestions, setNumQuestions] = React.useState(5);
    const [fileName, setFileName] = React.useState('');
    const [fileProcessing, setFileProcessing] = React.useState(false);
    const [generatedJson, setGeneratedJson] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [copySuccess, setCopySuccess] = React.useState('');
    const [isDragging, setIsDragging] = React.useState(false);

    React.useEffect(() => {
        const pdfjsScriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js";
        const mammothScriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.18/mammoth.browser.min.js";
        const loadScript = (src) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Error al cargar script ${src}`));
            document.body.appendChild(script);
        });
        loadScript(pdfjsScriptUrl).then(() => {
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
            }
        }).catch(console.error);
        loadScript(mammothScriptUrl).catch(console.error);
    }, []);

    const processFile = async (file) => {
        if (!file) return;
        setFileProcessing(true);
        setError('');
        setSourceText('');
        setFileName(file.name);
        setGeneratedJson('');
        try {
            if (file.type === 'text/plain') {
                setSourceText(await file.text());
                setFileProcessing(false);
            } else if (file.type === 'application/pdf') {
                if (!window.pdfjsLib) throw new Error('PDF.js no cargado. Refresca la página.');
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const typedarray = new Uint8Array(e.target.result);
                        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
                        let fullText = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                        }
                        setSourceText(fullText);
                    } catch (err) { setError(`Error procesando PDF: ${err.message}`); }
                    finally { setFileProcessing(false); }
                };
                reader.readAsArrayBuffer(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                if (!window.mammoth) throw new Error('Mammoth.js no cargado. Refresca la página.');
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const result = await window.mammoth.extractRawText({ arrayBuffer: e.target.result });
                        setSourceText(result.value);
                    } catch (err) { setError(`Error procesando DOCX: ${err.message}`); }
                    finally { setFileProcessing(false); }
                };
                reader.readAsArrayBuffer(file);
            } else {
                setFileProcessing(false);
                throw new Error('Formato no soportado. Sube .txt, .pdf o .docx');
            }
        } catch (err) {
            setError(err.message);
            setFileName('');
            setFileProcessing(false);
        }
    };

    const handleFileChange = (event) => processFile(event.target.files[0]);
    const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };
    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        processFile(event.dataTransfer.files[0]);
    };

    const handleGenerateQuiz = async () => {
        if (!sourceText.trim()) {
            setError('Por favor, sube un archivo antes de generar.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedJson('');
        setCopySuccess('');

        try {
            const response = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceText, numQuestions })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText);
                setGeneratedJson(JSON.stringify(parsedJson, null, 2));
            } else {
                throw new Error("La respuesta de la IA no tuvo el formato esperado.");
            }
        } catch (err) {
            setError(`No se pudo generar: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        if (!generatedJson) return;
        const textArea = document.createElement('textarea');
        textArea.value = generatedJson;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopySuccess('¡Copiado!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess('Error al copiar.');
        }
        document.body.removeChild(textArea);
    };
    
    const handleDownloadJson = () => {
        if (!generatedJson) return;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const downloadName = `cuestionario ${baseName}.json`;
        const blob = new Blob([generatedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
                <Pencil className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Crear Quiz con IA</h1>
                <p className="text-gray-400 mt-2">Sube un archivo (.pdf, .docx, .txt) para generar un cuestionario.</p>
            </div>
            <div className="space-y-6">
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <label htmlFor="file-upload-ai" className="block text-lg font-medium text-gray-300 mb-2">1. Sube o arrastra tu archivo:</label>
                    <label htmlFor="file-upload-ai" className={`cursor-pointer bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg flex items-center justify-center border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-gray-600' : 'border-gray-500'}`}>
                        <Upload className="mr-3 h-6 w-6" />
                        <span>{fileName || 'Seleccionar o arrastrar archivo'}</span>
                    </label>
                    <input id="file-upload-ai" type="file" accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="hidden" />
                    {fileProcessing && <p className="text-blue-400 mt-2 text-center animate-pulse">Procesando archivo...</p>}
                </div>
                <div>
                    <label htmlFor="num-questions" className="block text-lg font-medium text-gray-300 mb-2">2. ¿Cuántas preguntas quieres generar?</label>
                    <input type="number" id="num-questions" min="1" max="50" className="w-40 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))} />
                </div>
                <button onClick={handleGenerateQuiz} disabled={isLoading || fileProcessing || !sourceText} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center">
                    {isLoading ? (<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>) : (<><Bot className="mr-3" />Generar Cuestionario</>)}
                </button>
                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center">{error}</div>}
                {generatedJson && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">JSON Generado:</h3>
                        <div className="relative">
                            <pre className="bg-gray-900 text-white p-4 rounded-lg max-h-96 overflow-y-auto"><code>{generatedJson}</code></pre>
                            <div className="absolute top-2 right-2 flex space-x-2">
                                <button onClick={handleCopyToClipboard} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Copiar"><Clipboard className="h-5 w-5 text-gray-300" /></button>
                                <button onClick={handleDownloadJson} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Descargar"><Download className="h-5 w-5 text-gray-300" /></button>
                            </div>
                        </div>
                        {copySuccess && <p className="text-green-400 mt-2 text-center">{copySuccess}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Componente: Tomador de Quiz ---
const QuizTaker = () => {
    const [appState, setAppState] = React.useState('setup');
    const [quizData, setQuizData] = React.useState(null);
    const [shuffledQuestions, setShuffledQuestions] = React.useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [userAnswers, setUserAnswers] = React.useState({});
    const [timeLeft, setTimeLeft] = React.useState(0);
    const [results, setResults] = React.useState(null);
    const [error, setError] = React.useState('');
    const [fileName, setFileName] = React.useState('');
    const [isDragging, setIsDragging] = React.useState(false);

    const finishQuiz = React.useCallback(() => {
        if (!quizData) return;
        const topicResults = {};
        let totalCorrect = 0;
        shuffledQuestions.forEach((q, index) => {
            const theme = q.theme || 'General';
            if (!topicResults[theme]) {
                topicResults[theme] = { correctas: 0, incorrectas: 0, total: 0 };
            }
            topicResults[theme].total++;
            if (userAnswers[index] === q.answer) {
                topicResults[theme].correctas++;
                totalCorrect++;
            } else {
                topicResults[theme].incorrectas++;
            }
        });
        const chartData = Object.keys(topicResults).map(theme => ({ name: theme, correctas: topicResults[theme].correctas, incorrectas: topicResults[theme].incorrectas }));
        const totalQuestions = shuffledQuestions.length;
        const totalIncorrect = totalQuestions - totalCorrect;
        const score10 = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 10 : 0;
        const incorrectQuestions = shuffledQuestions.map((q, index) => ({ ...q, originalIndex: index })).filter(q => userAnswers[q.originalIndex] !== q.answer).map(q => ({ question: q.question, yourAnswer: userAnswers[q.originalIndex] || "No respondida", correctAnswer: q.answer, theme: q.theme }));
        setResults({ score: score10.toFixed(1), correct: totalCorrect, incorrect: totalIncorrect, total: totalQuestions, incorrectQuestions, chartData });
        setAppState('results');
    }, [quizData, userAnswers, shuffledQuestions]);

    React.useEffect(() => {
        if (appState !== 'quiz' || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        if (timeLeft === 1) setTimeout(finishQuiz, 1000);
        return () => clearInterval(timerId);
    }, [appState, timeLeft, finishQuiz]);

    const processQuizFile = (file) => {
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedJson = JSON.parse(e.target.result);
                    if (!Array.isArray(loadedJson) || loadedJson.length === 0) throw new Error("El JSON debe ser un array de preguntas.");
                    const transformedQuestions = loadedJson.map(q => {
                        const correctAnswerObj = q.respuestas.find(r => r.correcta === true);
                        if (!q.pregunta || !Array.isArray(q.respuestas) || !correctAnswerObj || !q.tema) {
                            throw new Error("Cada pregunta debe tener 'pregunta', 'respuestas', 'tema' y una respuesta correcta.");
                        }
                        return { question: q.pregunta, options: q.respuestas.map(r => r.respuesta), answer: correctAnswerObj.respuesta, theme: q.tema };
                    });
                    setQuizData({ title: file.name.replace('.json', ''), questions: transformedQuestions });
                    setError('');
                    setFileName(file.name);
                } catch (err) {
                    setError(`Error al procesar JSON: ${err.message}`);
                    setQuizData(null);
                    setFileName('');
                }
            };
            reader.readAsText(file);
        } else {
            setError("Por favor, sube un archivo .json");
        }
    };

    const handleFileChange = (event) => processQuizFile(event.target.files[0]);
    const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };
    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        processQuizFile(event.dataTransfer.files[0]);
    };

    const startQuiz = () => {
        if (quizData) {
            setShuffledQuestions(shuffleArray([...quizData.questions]));
            setTimeLeft(quizData.questions.length * 30);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setResults(null);
            setAppState('quiz');
        }
    };

    const handleAnswerSelect = (questionIndex, selectedOption) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: selectedOption }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };
    
    const resetApp = () => {
        setQuizData(null);
        setFileName('');
        setError('');
        setAppState('setup');
    };

    const QuizSetup = () => (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="text-center mb-8">
                <FileText className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Prepara tu Quiz</h1>
                <p className="text-gray-400 mt-2">Sube o arrastra tu archivo JSON para comenzar.</p>
            </div>
            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</div>}
            <div className="mb-6">
                <label htmlFor="file-upload" className={`cursor-pointer bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg flex items-center justify-center border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-gray-600' : 'border-gray-500'}`}>
                    <Upload className="mr-3 h-6 w-6" />
                    <span>{fileName || 'Seleccionar o arrastrar archivo JSON'}</span>
                </label>
                <input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </div>
            <button onClick={startQuiz} disabled={!fileName} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg transition-all transform hover:scale-105">
                <Shuffle className="inline mr-2" /> Comenzar Quiz al Azar
            </button>
        </div>
    );

    const QuizScreen = () => {
        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
        const isAnswerSelected = userAnswers[currentQuestionIndex] !== undefined;
        return (
            <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{quizData.title}</h2>
                    <div className="flex items-center bg-gray-700 px-4 py-2 rounded-lg"><Clock className="h-6 w-6 mr-2 text-blue-400" /><span className="text-xl font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span></div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                <div className="bg-gray-900 p-6 rounded-lg mb-6"><p className="text-blue-400 font-semibold mb-2">Tema: {currentQuestion.theme}</p><h3 className="text-2xl font-semibold mb-2">Pregunta {currentQuestionIndex + 1} de {shuffledQuestions.length}</h3><p className="text-xl">{currentQuestion.question}</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{currentQuestion.options.map((option, index) => (<button key={index} onClick={() => handleAnswerSelect(currentQuestionIndex, option)} className={`p-4 rounded-lg text-left text-lg border-2 transition-all ${userAnswers[currentQuestionIndex] === option ? 'bg-blue-500 border-blue-400 scale-105' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>{option}</button>))}</div>
                <div className="mt-8 text-right">
                    <button onClick={handleNextQuestion} disabled={!isAnswerSelected} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
                        {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </button>
                </div>
            </div>
        );
    };

    const ResultsScreen = () => (
        <div className="w-full max-w-5xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-white">
            <h1 className="text-4xl font-bold text-center mb-2">Resultados del Quiz</h1>
            <h2 className="text-2xl text-gray-400 text-center mb-8">{quizData.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
                <div className="bg-gray-700 p-6 rounded-lg"><h3 className="text-lg text-gray-400">Calificación (1-10)</h3><p className={`text-5xl font-bold ${results.score >= 6 ? 'text-green-400' : 'text-red-400'}`}>{results.score}</p></div>
                <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><CheckCircle className="h-8 w-8 text-green-400 mr-2"/><p className="text-3xl font-bold">{results.correct}</p></div><h3 className="text-lg text-gray-400 mt-1">Correctas</h3></div>
                <div className="bg-gray-700 p-6 rounded-lg"><div className="flex items-center justify-center"><XCircle className="h-8 w-8 text-red-400 mr-2"/><p className="text-3xl font-bold">{results.incorrect}</p></div><h3 className="text-lg text-gray-400 mt-1">Incorrectas</h3></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><BarChart2 className="mr-2"/>Desempeño por Tema</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={results.chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#A0AEC0' }} width={120} />
                                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                <Legend wrapperStyle={{ color: '#A0AEC0' }} />
                                <Bar dataKey="correctas" stackId="a" fill="#48BB78" name="Correctas" />
                                <Bar dataKey="incorrectas" stackId="a" fill="#F56565" name="Incorrectas" />
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
                                    <p className="text-sm text-yellow-400">Tema: {item.theme}</p>
                                    <p className="text-sm text-red-400">Tu respuesta: {item.yourAnswer}</p>
                                    <p className="text-sm text-green-400">Correcta: {item.correctAnswer}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-green-400 text-center py-10">¡Felicidades! No tuviste errores.</p>}
                </div>
            </div>
            <div className="mt-8 text-center">
                <button onClick={resetApp} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg flex items-center mx-auto transition-transform transform hover:scale-105">
                    <Repeat className="mr-2"/> Intentar otro Quiz
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (appState) {
            case 'setup': return <QuizSetup />;
            case 'quiz': return <QuizScreen />;
            case 'results': return <ResultsScreen />;
            default: return <QuizSetup />;
        }
    };
    
    return renderContent();
};

// --- Componente: Asistente General con IA ---
const AiAssistant = () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState([{ role: 'assistant', text: '¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte hoy?' }]);
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
                body: JSON.stringify({ question: userInput, history: chatHistory }) // Enviamos el historial para tener contexto
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
                <h1 className="text-4xl font-bold text-white">Asistente General IA</h1>
                <p className="text-gray-400 mt-2">Haz cualquier pregunta y te ayudaré a resolverla.</p>
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


// --- Componente Principal con Navegación ---
export default function App() {
    const [activeTab, setActiveTab] = React.useState('assistant');

    return (
        <main className="bg-gray-900 min-h-screen w-full flex flex-col items-center font-sans p-4">
            <div className="w-full max-w-5xl">
                <div className="mb-8 flex justify-center border-b border-gray-700">
                    <button onClick={() => setActiveTab('assistant')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'assistant' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <Bot className="mr-2 h-5 w-5" /> Asistente IA
                    </button>
                    <button onClick={() => setActiveTab('create')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'create' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <Pencil className="mr-2 h-5 w-5" /> Crear Quiz
                    </button>
                    <button onClick={() => setActiveTab('take')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'take' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <BookOpen className="mr-2 h-5 w-5" /> Tomar Quiz
                    </button>
                </div>
                <div className="w-full">
                    {activeTab === 'assistant' && <AiAssistant />}
                    {activeTab === 'create' && <QuizGenerator />}
                    {activeTab === 'take' && <QuizTaker />}
                </div>
            </div>
        </main>
    );
}
