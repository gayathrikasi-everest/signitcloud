import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { cn } from '@/lib/utils';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFRendererProps {
  file?: File | string;
  currentPage: number;
  scale: number;
  onLoadComplete?: (numPages: number) => void;
  className?: string;
}

export const PDFRenderer: React.FC<PDFRendererProps> = ({
  file,
  currentPage,
  scale,
  onLoadComplete,
  className,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
    }
  }, [pdfUrl]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle file changes
  useEffect(() => {
    if (!file) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    cleanup();
    setCanvasKey(prev => prev + 1); // Force new canvas on file change

    try {
      if (typeof file === 'string') {
        setPdfUrl(file);
        loadPDF(file);
      } else {
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        loadPDF(url);
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. Please try again.');
      setLoading(false);
    }
  }, [file, cleanup]);

  // Handle page rendering
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  const loadPDF = async (url: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
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

  const renderPage = async () => {
    if (!pdfDoc || !containerRef.current) return;

    try {
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      // Create a new canvas element
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', {
        willReadFrequently: true
      });

      if (!context) {
        throw new Error('Cannot get canvas context');
      }

      // Set dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      // Store the new render task
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // Clear previous canvas and add new one
      const container = containerRef.current;
      container.innerHTML = '';
      container.appendChild(canvas);
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setError('Failed to render PDF page.');
    }
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
    <div className={cn("relative w-full", className)}>
      <div ref={containerRef} className="mx-auto" />
    </div>
  );
}; 