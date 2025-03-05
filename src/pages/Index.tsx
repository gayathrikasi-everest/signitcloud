
import React, { useState } from 'react';
import { useDocuStore } from '@/lib/docuStore';
import FileUpload from '@/components/FileUpload';
import DocumentPreview from '@/components/DocumentPreview';
import NotificationBell from '@/components/NotificationBell';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const { documents, currentDocument } = useDocuStore();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container max-w-screen-lg py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold">DocuSign Clone</h1>
            <p className="text-muted-foreground mt-1">Upload, share, and sign documents effortlessly</p>
          </div>
          
          <div>
            <NotificationBell />
          </div>
        </header>
        
        <main className="space-y-8 animate-fade-in">
          {documents.length === 0 || !currentDocument ? (
            <FileUpload />
          ) : (
            <div className="space-y-8">
              <DocumentPreview document={currentDocument} />
              
              {documents.length > 1 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Recent Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {documents.slice(0, 3).map((doc) => (
                      <div 
                        key={doc.id}
                        className="file-card p-4 border rounded-lg cursor-pointer bg-card hover:bg-accent/50"
                        onClick={() => useDocuStore.getState().setCurrentDocument(doc.id)}
                      >
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
