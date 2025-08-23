// src/pages/QuizGeneratorPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Bot, Clipboard, Download, Pencil, Save } from 'lucide-react';

// Esta función ahora es más inteligente para encontrar el array de preguntas
const getQuestionsArrayFromAiJson = (jsonString) => {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
        return parsed; // El JSON ya es el array de preguntas
    }
    if (Array.isArray(parsed.questions)) {
        return parsed.questions; // El array está dentro de una propiedad "questions"
    }
    // Si no encuentra un array, lanza un error claro.
    throw new Error("El JSON generado no contiene un array de preguntas válido.");
};


const QuizGeneratorPage = () => {
    const [sourceText, setSourceText] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [fileName, setFileName] = useState('');
    const [fileProcessing, setFileProcessing] = useState(false);
    const [generatedJson, setGeneratedJson] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // ... (El resto de tus funciones como useEffect, processFile, etc., no necesitan cambios)
    useEffect(() => {
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
                const text = await file.text();
                setSourceText(text);
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
        setSaveSuccess('');

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
                // **CORRECCIÓN**: Extraemos solo el JSON válido por si la IA añade texto extra.
                const validJsonMatch = jsonText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
                if (!validJsonMatch) {
                    throw new Error("La respuesta de la IA no es un JSON reconocible.");
                }
                const cleanedJson = validJsonMatch[0];
                const parsedJson = JSON.parse(cleanedJson);
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
    
    // **FUNCIÓN CORREGIDA Y MEJORADA**
    const handleSaveToLibrary = () => {
        if (!generatedJson) return;
        try {
            setError('');
            // Usamos la nueva función para obtener el array de preguntas de forma segura
            const questionsArray = getQuestionsArrayFromAiJson(generatedJson);

            const existingQuizzes = JSON.parse(localStorage.getItem('myQuizzes')) || [];
            const newQuiz = {
                id: Date.now(),
                title: fileName.replace(/\.[^/.]+$/, "") || "Nuevo Quiz de IA",
                createdAt: new Date().toISOString(),
                questions: questionsArray // Usamos el array extraído
            };
            
            existingQuizzes.push(newQuiz);
            localStorage.setItem('myQuizzes', JSON.stringify(existingQuizzes));

            setSaveSuccess('¡Guardado en tu biblioteca!');
            setTimeout(() => setSaveSuccess(''), 2000);
        } catch (err) {
            setError(`No se pudo guardar: ${err.message}`);
            console.error("Error saving to localStorage", err);
        }
    };
    const handleCopyToClipboard = () => {
        if (!generatedJson) return;
        navigator.clipboard.writeText(generatedJson).then(() => {
            setCopySuccess('¡Copiado!');
            setTimeout(() => setCopySuccess(''), 2000);
        }).catch(() => setCopySuccess('Error al copiar.'));
    };
    
    const handleDownloadJson = () => {
        if (!generatedJson) return;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || "quiz";
        const downloadName = `cuestionario_${baseName}.json`;
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

    // ... (el JSX no necesita cambios)
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
                            <div className="absolute top-2 right-2 flex flex-col space-y-2">
                                <button onClick={handleCopyToClipboard} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Copiar"><Clipboard className="h-5 w-5 text-gray-300" /></button>
                                <button onClick={handleDownloadJson} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg" title="Descargar"><Download className="h-5 w-5 text-gray-300" /></button>
                                <button onClick={handleSaveToLibrary} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg" title="Guardar en Biblioteca"><Save className="h-5 w-5 text-white" /></button>
                            </div>
                        </div>
                        {copySuccess && <p className="text-green-400 mt-2 text-center">{copySuccess}</p>}
                                            {saveSuccess && <p className="text-green-400 mt-2 text-center">{saveSuccess}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    };
                    
                    export default QuizGeneratorPage;