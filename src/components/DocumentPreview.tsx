import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Download, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocuStore } from '@/lib/docuStore';
import ShareLinkModal from './ShareLinkModal';
import { Document } from '@/lib/types';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

interface DocumentPreviewProps {
  document: Document;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize the options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/standard_fonts/',
  }), []);

  useEffect(() => {
    // Clean up any previous errors when document changes
    setError(null);
  }, [document]);

  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleDownload = () => {
    // Create an anchor element and trigger download
    const link = window.document.createElement('a');
    link.href = document.previewUrl;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };
  
  const renderPages = () => {
    if (document.type.includes('pdf')) {
      return (
        <div className="space-y-4">
          <PDFDocument
            file={document.previewUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="flex flex-col items-center"
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-500">
                {error || 'Failed to load PDF. Please try again.'}
              </div>
            }
            options={pdfOptions}
          >
            <Page 
              pageNumber={pageNumber} 
              width={Math.min(window.innerWidth - 64, 800)}
              className="shadow-lg"
            />
            {numPages && numPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={pageNumber >= numPages}
                >
                  Next
                </Button>
              </div>
            )}
          </PDFDocument>
        </div>
      );
    } else {
      return (
        <img 
          src={document.previewUrl} 
          alt={document.name} 
          className="w-full h-auto rounded object-contain"
        />
      );
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium font-poppins">{document.name}</h2>
          <div className="flex items-center mt-1 text-sm text-muted-foreground font-poppins">
            <Clock className="h-4 w-4 mr-1" />
            <span>Uploaded {formatDate(document.createdAt)}</span>
            
            {document.signatureStatus === 'signed' && (
              <Badge variant="outline" className="ml-3 bg-green-50 text-green-600 border-green-200 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="font-poppins">Signed</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          {document.signatureStatus === 'signed' ? (
            <Button onClick={handleDownload} className="hover-lift font-poppins">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          ) : (
            <Button onClick={openShareModal} className="hover-lift font-poppins">
              <ExternalLink className="h-4 w-4 mr-2" />
              Share for Signature
            </Button>
          )}
        </div>
      </div>
      
      <Card className="p-6 relative overflow-hidden">
        <div className="space-y-4">
          {renderPages()}
        </div>
      </Card>
      
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        documentId={document.id}
      />
    </div>
  );
};

export default DocumentPreview;
