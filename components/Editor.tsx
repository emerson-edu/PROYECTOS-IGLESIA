import React, { useRef, useState } from 'react';
import LoadingSpinner from './icons/LoadingSpinner';
import DownloadIcon from './icons/DownloadIcon';

// Declare external libraries
declare const saveAs: any;
declare const jspdf: any;
declare const htmlToDocx: any;

interface EditorProps {
  content: string;
  isLoading: boolean;
  onClear: () => void;
  setContent: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, isLoading, onClear, setContent }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    if (textareaRef.current && navigator.clipboard) {
      navigator.clipboard.writeText(textareaRef.current.value).then(() => {
        setCopySuccess('¡Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
      }, () => {
        setCopySuccess('Error al copiar');
        setTimeout(() => setCopySuccess(''), 2000);
      });
    }
  };

  const handleDownload = async (format: 'txt' | 'pdf' | 'docx') => {
    setIsDownloadOpen(false);
    if (!content) return;

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, 'contenido.txt');
    } else if (format === 'pdf') {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      doc.text(content, 10, 10);
      doc.save('contenido.pdf');
    } else if (format === 'docx') {
      const contentHtml = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
      const fileBuffer = await htmlToDocx(contentHtml);
      saveAs(fileBuffer, 'contenido.docx');
    }
  };

  return (
    <div className="w-full md:w-3/4 lg:w-4/5 p-6 bg-stone-50 flex flex-col relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-stone-700">Editor de Contenido</h2>
        <div className="flex items-center gap-4">
          {copySuccess && <span className="text-sm text-green-600 transition-opacity">{copySuccess}</span>}
          
          <div className="relative">
            <button
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              disabled={!content || isLoading}
              className="flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-amber-600 disabled:text-stone-400 transition"
            >
              <DownloadIcon className="w-4 h-4" />
              Descargar
            </button>
            {isDownloadOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-20 border border-stone-200">
                <button onClick={() => handleDownload('docx')} className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">Word (.docx)</button>
                <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">PDF (.pdf)</button>
                <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">Texto (.txt)</button>
              </div>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={!content || isLoading}
            className="text-sm font-semibold text-stone-600 hover:text-amber-600 disabled:text-stone-400 transition"
          >
            Copiar
          </button>
          <button
            onClick={onClear}
            disabled={!content || isLoading}
            className="text-sm font-semibold text-stone-600 hover:text-red-600 disabled:text-stone-400 transition"
          >
            Limpiar
          </button>
        </div>
      </div>
      <div className="flex-grow w-full h-full relative bg-white border border-stone-200 rounded-md shadow-inner">
        {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col justify-center items-center z-10 rounded-md">
                <LoadingSpinner className="w-12 h-12 text-amber-600" />
                <p className="mt-4 text-stone-600">El asistente está pensando...</p>
            </div>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="El contenido generado aparecerá aquí..."
          className="w-full h-full p-4 resize-none border-none rounded-md focus:ring-0 bg-transparent leading-relaxed text-stone-800"
          readOnly={isLoading}
        />
      </div>
    </div>
  );
};

export default Editor;