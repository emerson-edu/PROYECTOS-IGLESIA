import React, { useState, useCallback, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import Editor from './components/Editor';
import { generateContent } from './services/geminiService';
import { EditorTask } from './types';

// Declare global variables for external libraries
declare const mammoth: any;
declare const pdfjsLib: any;

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [libraryStatus, setLibraryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // FIX: Lift state up from ControlPanel to avoid direct DOM manipulation.
  const [task, setTask] = useState<EditorTask>(EditorTask.GENERATE_CONTENT);

  useEffect(() => {
    const checkLibraries = () => {
      if (typeof mammoth !== 'undefined' && typeof pdfjsLib !== 'undefined') {
        setLibraryStatus('ready');
        return true;
      }
      return false;
    };
    
    if (checkLibraries()) return;

    const interval = setInterval(() => {
        if (checkLibraries()) {
            clearInterval(interval);
        }
    }, 100);

    const timeout = setTimeout(() => {
        clearInterval(interval);
        if (libraryStatus === 'loading') {
            setLibraryStatus('error');
        }
    }, 15000);

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
  }, [libraryStatus]);

  const handleRequest = useCallback(async (task: EditorTask, input: string, options?: { [key: string]: any }) => {
    setIsLoading(true);
    setError(null);
    // Use input from state which might have been set by file upload
    const currentInput = task === EditorTask.SUMMARIZE || task === EditorTask.EXPAND || task === EditorTask.PROOFREAD ? content || input : input;

    try {
      const result = await generateContent(task, currentInput, options);
      setContent(result);
    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      setError(errorMessage);
      setContent(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [content]);
  
  const handleClear = useCallback(() => {
    setContent('');
  }, []);

  const handleInputText = (text: string) => {
    setInputText(text);
    // FIX: Replaced direct DOM access with state-driven logic for better React practice and to fix the type error.
    if (
        [EditorTask.SUMMARIZE, EditorTask.EXPAND, EditorTask.PROOFREAD].includes(task)
    ) {
        setContent(text);
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-stone-100">
      <ControlPanel 
        onSubmit={handleRequest} 
        isLoading={isLoading}
        libraryStatus={libraryStatus}
        setInputText={handleInputText}
        inputText={inputText}
        task={task}
        setTask={setTask}
      />
      <Editor 
        content={content} 
        isLoading={isLoading} 
        setContent={setContent}
        onClear={handleClear}
      />
      {error && (
        <div 
          className="absolute bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse"
          onClick={() => setError(null)}
        >
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
    </main>
  );
}

export default App;
