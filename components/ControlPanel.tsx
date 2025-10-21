import React, { useState, useCallback, useRef } from 'react';
import { EditorTask } from '../types';
import LoadingSpinner from './icons/LoadingSpinner';
import UploadIcon from './icons/UploadIcon';

// Declare external libraries
declare const mammoth: any;
declare const pdfjsLib: any;

interface ControlPanelProps {
  onSubmit: (task: EditorTask, input: string, options?: { [key: string]: any }) => void;
  isLoading: boolean;
  libraryStatus: 'loading' | 'ready' | 'error';
  setInputText: (text: string) => void;
  inputText: string;
  // FIX: Add task and setTask to props to lift state to parent component.
  task: EditorTask;
  setTask: (task: EditorTask) => void;
}

const taskLabels: { [key in EditorTask]: string } = {
  [EditorTask.GENERATE_CONTENT]: "Generar Contenido",
  [EditorTask.SUMMARIZE]: "Resumir Texto",
  [EditorTask.EXPAND]: "Expandir Texto",
  [EditorTask.PROOFREAD]: "Corregir Texto",
  [EditorTask.GENERATE_STRUCTURE]: "Crear Estructura",
  [EditorTask.FIND_VERSES]: "Buscar Versículos",
  [EditorTask.GENERATE_QUIZ]: "Generar Cuestionario",
};

const ControlPanel: React.FC<ControlPanelProps> = ({ onSubmit, isLoading, libraryStatus, setInputText, inputText, task, setTask }) => {
  // FIX: Remove local state for task, as it is now managed by the parent component.
  // const [task, setTask] = useState<EditorTask>(EditorTask.GENERATE_CONTENT);
  const [quizQuestions, setQuizQuestions] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      const options = task === EditorTask.GENERATE_QUIZ ? { quizQuestions } : {};
      onSubmit(task, inputText, options);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setInputText(`Leyendo archivo: ${file.name}...`);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        if (typeof pdfjsLib === 'undefined') throw new Error("Librería PDF no cargada.");
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          setInputText(fullText);
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (typeof mammoth === 'undefined') throw new Error("Librería de Word no cargada.");
        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result;
            const result = await mammoth.extractRawText({ arrayBuffer });
            setInputText(result.value);
        };
        reader.readAsArrayBuffer(file);
      } else { // txt
        const reader = new FileReader();
        reader.onload = (e) => setInputText(e.target?.result as string);
        reader.readAsText(file);
      }
    } catch (error) {
        console.error("Error al leer archivo:", error);
        setInputText(`Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const getPlaceholderText = () => {
    switch (task) {
      case EditorTask.GENERATE_CONTENT: return "Ej: La doctrina de la Trinidad en el Nuevo Testamento...";
      case EditorTask.SUMMARIZE:
      case EditorTask.EXPAND:
      case EditorTask.PROOFREAD: return "Pega aquí el texto que quieres procesar o sube un archivo...";
      case EditorTask.GENERATE_STRUCTURE: return "Ej: Un manual de discipulado para nuevos creyentes...";
      case EditorTask.FIND_VERSES: return "Ej: Versículos sobre el perdón y la reconciliación...";
      case EditorTask.GENERATE_QUIZ: return "Ej: Los viajes misioneros del apóstol Pablo...";
      default: return "Escribe tu solicitud aquí...";
    }
  };
  
  const getFileButtonText = () => {
    if (libraryStatus === 'loading') return 'Inicializando lector...';
    if (libraryStatus === 'error') return 'Error en lector. Recargue.';
    return 'Cargar Archivo...';
  }

  return (
    <div className="w-full md:w-1/4 lg:w-1/5 p-6 bg-white border-r border-stone-200 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Asistente Teológico</h1>
        <p className="text-stone-500 mt-1">Tu compañero de IA para la escritura y la investigación.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
        <div className="mb-4">
          <label htmlFor="task-select" className="block text-sm font-medium text-stone-700 mb-2">Acción a Realizar</label>
          <select id="task-select" value={task} onChange={(e) => setTask(e.target.value as EditorTask)} className="w-full p-2 border border-stone-300 rounded-md bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition">
            {Object.entries(taskLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
          </select>
        </div>
        
        {task === EditorTask.GENERATE_QUIZ && (
            <div className="mb-4">
                <label htmlFor="quiz-questions" className="block text-sm font-medium text-stone-700 mb-2">Número de Preguntas</label>
                <input type="number" id="quiz-questions" value={quizQuestions} onChange={(e) => setQuizQuestions(Math.max(1, Math.min(100, parseInt(e.target.value, 10))))} min="1" max="100" className="w-full p-2 border border-stone-300 rounded-md bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"/>
            </div>
        )}

        <div className="mb-4 flex-grow flex flex-col min-h-0">
          <label htmlFor="main-input" className="block text-sm font-medium text-stone-700 mb-2">Tema o Texto</label>
          <textarea id="main-input" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={getPlaceholderText()} className="w-full h-full flex-grow p-3 border border-stone-300 rounded-md resize-none bg-stone-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition" rows={10}/>
        </div>
        
        <div className="mb-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden"/>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={libraryStatus !== 'ready'} className="w-full flex justify-center items-center gap-2 bg-stone-100 text-stone-700 font-bold py-3 px-4 rounded-md hover:bg-stone-200 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors duration-200">
                <UploadIcon className="w-5 h-5" />
                {getFileButtonText()}
            </button>
        </div>

        <button type="submit" disabled={isLoading || !inputText.trim()} className="w-full flex justify-center items-center gap-2 bg-amber-600 text-white font-bold py-3 px-4 rounded-md hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors duration-200">
          {isLoading ? <LoadingSpinner /> : null}
          {isLoading ? 'Procesando...' : `Ejecutar Acción`}
        </button>
      </form>
    </div>
  );
};

export default ControlPanel;