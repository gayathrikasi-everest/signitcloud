import React, { useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string;
  onLoadComplete?: (numPages: number) => void;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onLoadComplete,
  className,
  onClick,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);

  useEffect(() => {
    if (!file) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(file);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        if (onLoadComplete) {
          onLoadComplete(pdf.numPages);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [file, onLoadComplete]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale]);

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Cannot get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setError('Failed to render PDF page.');
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.6));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div 
        className="relative w-full h-full"
        onClick={onClick}
      >
        <canvas 
          ref={canvasRef} 
          className="mx-auto" 
        />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className="px-2 py-1 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {numPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="px-2 py-1 text-sm disabled:opacity-50"
        >
          Next
        </button>
        <div className="h-4 w-px bg-gray-300 mx-2" />
        <button
          onClick={zoomOut}
          disabled={scale <= 0.6}
          className="px-2 py-1 text-sm disabled:opacity-50"
        >
          Zoom Out
        </button>
        <span className="text-sm">{Math.round(scale * 100)}%</span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="px-2 py-1 text-sm disabled:opacity-50"
        >
          Zoom In
        </button>
      </div>
    </div>
  );
}; 