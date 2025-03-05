
import React, { useEffect, useState } from 'react';
import { ExternalLink, Download, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocuStore } from '@/lib/docuStore';
import EmailModal from './EmailModal';
import { Document } from '@/lib/types';

interface DocumentPreviewProps {
  document: Document;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [numPages, setNumPages] = useState(3); // Simulate multiple pages
  
  const openEmailModal = () => setIsEmailModalOpen(true);
  const closeEmailModal = () => setIsEmailModalOpen(false);

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
    const link = document.createElement('a');
    link.href = document.previewUrl;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Generate mock document pages for preview
  const renderPages = () => {
    const pages = [];
    const maxPages = showFullPreview ? numPages : 2; // Only show 2 pages initially
    
    for (let i = 0; i < maxPages; i++) {
      pages.push(
        <div 
          key={i} 
          className="document-page w-full p-4 rounded animate-scale-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {document.type.includes('pdf') ? (
            <div className="p-6">
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
              <div className="h-4 w-4/5 bg-gray-100 rounded mb-6"></div>
              <div className="h-20 w-full bg-gray-50 rounded border border-gray-200 mb-4"></div>
              <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
            </div>
          ) : (
            <img 
              src={document.previewUrl} 
              alt={document.name} 
              className="w-full h-auto rounded object-contain"
            />
          )}
          {i === maxPages - 1 && maxPages < numPages && (
            <div 
              className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-b from-transparent to-background/80"
            >
              <Button
                variant="secondary"
                onClick={() => setShowFullPreview(true)}
                className="hover-lift"
              >
                Show Full Document
              </Button>
            </div>
          )}
        </div>
      );
    }
    
    return pages;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium">{document.name}</h2>
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>Uploaded {formatDate(document.createdAt)}</span>
            
            {document.signatureStatus === 'signed' && (
              <Badge variant="outline" className="ml-3 bg-green-50 text-green-600 border-green-200 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Signed
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          {document.signatureStatus === 'signed' ? (
            <Button onClick={handleDownload} className="hover-lift">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          ) : (
            <Button onClick={openEmailModal} className="hover-lift">
              <ExternalLink className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
          )}
        </div>
      </div>
      
      <Card className="p-6 relative overflow-hidden">
        <div className="space-y-4">
          {renderPages()}
        </div>
      </Card>
      
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={closeEmailModal}
        documentId={document.id}
      />
    </div>
  );
};

export default DocumentPreview;
