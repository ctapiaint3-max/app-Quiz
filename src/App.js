import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { Upload, FileText, Clock, CheckCircle, XCircle, BarChart2, Repeat, Shuffle, Bot, Clipboard, Download, BookOpen, Pencil, Send, History } from 'lucide-react';

// --- Configuración e Inicialización de Firebase ---
// eslint-disable-next-line no-undef
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
    
    const handleCopyToClipboard = () => { /* ... (código sin cambios) ... */ };
    const handleDownloadJson = () => { /* ... (código sin cambios) ... */ };

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
const QuizTaker = ({ userId, appId }) => {
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

    const finishQuiz = React.useCallback(async () => {
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
        
        const finalResults = { 
            score: score10.toFixed(1), 
            correct: totalCorrect, 
            incorrect: totalIncorrect, 
            total: totalQuestions, 
            incorrectQuestions, 
            chartData, 
            quizTitle: quizData.title, 
            timestamp: serverTimestamp() 
        };
        setResults(finalResults);
        setAppState('results');

        if (userId) {
            try {
                const historyCollectionPath = `/artifacts/${appId}/users/${userId}/quizHistory`;
                await addDoc(collection(db, historyCollectionPath), finalResults);
            } catch (err) {
                console.error("Error guardando el historial:", err);
            }
        }
    }, [quizData, userAnswers, shuffledQuestions, userId, appId]);

    React.useEffect(() => {
        if (appState !== 'quiz' || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        if (timeLeft === 1) setTimeout(finishQuiz, 1000);
        return () => clearInterval(timerId);
    }, [appState, timeLeft, finishQuiz]);

    const processQuizFile = (file) => { /* ... (código sin cambios) ... */ };
    const handleFileChange = (event) => processQuizFile(event.target.files[0]);
    const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };
    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        processQuizFile(event.dataTransfer.files[0]);
    };
    const startQuiz = () => { /* ... (código sin cambios) ... */ };
    const handleAnswerSelect = (questionIndex, selectedOption) => { /* ... (código sin cambios) ... */ };
    const handleNextQuestion = () => { /* ... (código sin cambios) ... */ };
    const resetApp = () => { /* ... (código sin cambios) ... */ };

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
    const QuizScreen = () => { /* ... (código sin cambios) ... */ };
    const ResultsScreen = () => { /* ... (código sin cambios) ... */ };

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

// --- Componente: Asistente de Estudio con IA ---
const AiAssistant = () => { /* ... (código sin cambios) ... */ };

// --- Componente: Historial de Quizzes ---
const QuizHistory = ({ userId, appId }) => {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        const historyCollectionPath = `/artifacts/${appId}/users/${userId}/quizHistory`;
        const q = query(collection(db, historyCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
            })).sort((a, b) => b.timestamp - a.timestamp);
            setHistory(historyData);
            setLoading(false);
        }, (err) => {
            console.error("Error al obtener historial:", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId, appId]);

    if (loading) {
        return <div className="text-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div></div>;
    }

    if (history.length === 0) {
        return (
            <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-2xl">
                <History className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h2 className="text-2xl text-white">Aún no hay historial</h2>
                <p>Completa un quiz en la pestaña "Tomar Quiz" para ver tus resultados aquí.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
                <History className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h1 className="text-4xl font-bold text-white">Historial de Quizzes</h1>
            </div>
            <div className="space-y-4">
                {history.map(item => (
                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white text-lg">{item.quizTitle}</p>
                            <p className="text-gray-400 text-sm">{item.date}</p>
                        </div>
                        <div className="text-right">
                             <p className={`font-bold text-2xl ${item.score >= 6 ? 'text-green-400' : 'text-red-400'}`}>{item.score}</p>
                             <p className="text-gray-400 text-sm">{item.correct} / {item.total} correctas</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Componente Principal con Navegación ---
export default function App() {
    const [activeTab, setActiveTab] = React.useState('assistant');
    const [userId, setUserId] = React.useState(null);
    // eslint-disable-next-line no-undef
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-quiz-app';

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    // eslint-disable-next-line no-undef
                    if (typeof __initial_auth_token !== 'undefined') {
                        // eslint-disable-next-line no-undef
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Error de autenticación:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <main className="bg-gray-900 min-h-screen w-full flex flex-col items-center font-sans p-4">
            <div className="w-full max-w-5xl">
                <div className="mb-8 flex justify-center border-b border-gray-700">
                    <button onClick={() => setActiveTab('assistant')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'assistant' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <Bot className="mr-2 h-5 w-5" /> Asistente Kai
                    </button>
                    <button onClick={() => setActiveTab('create')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'create' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <Pencil className="mr-2 h-5 w-5" /> Crear Quiz
                    </button>
                    <button onClick={() => setActiveTab('take')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'take' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <BookOpen className="mr-2 h-5 w-5" /> Tomar Quiz
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex items-center px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <History className="mr-2 h-5 w-5" /> Historial
                    </button>
                </div>
                <div className="w-full">
                    {activeTab === 'assistant' && <AiAssistant />}
                    {activeTab === 'create' && <QuizGenerator />}
                    {activeTab === 'take' && <QuizTaker userId={userId} appId={appId} />}
                    {activeTab === 'history' && <QuizHistory userId={userId} appId={appId} />}
                </div>
            </div>
        </main>
    );
}
