import React from 'react';
import { useDocuStore } from '@/lib/docuStore';
import FileUpload from '@/components/FileUpload';
import DocumentPreview from '@/components/DocumentPreview';
import NotificationBell from '@/components/NotificationBell';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const {
    documents,
    currentDocument
  } = useDocuStore();
  return (
    <div className="min-h-screen">
      <div className="container max-w-screen-lg py-8">
        <header className="flex justify-between items-center mb-8">
          <div className="h-20 w-20">
            <img alt="DocuSign Logo" src="/lovable-uploads/6a377da9-77be-4c97-8b61-87978d3fe20d.png" className="h-full w-full object-contain" />
          </div>
          
      
        </header>
        
        <main className="space-y-8 animate-fade-in">
          {documents.length === 0 || !currentDocument ? (
            <div className="backdrop-blur-md bg-white/30 border border-white/40 shadow-xl p-6 rounded-lg py-[38px] mx-0">
              <FileUpload />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="backdrop-blur-md bg-white/30 border border-white/40 shadow-xl p-6 rounded-lg">
                <DocumentPreview document={currentDocument} />
              </div>
              
              {documents.length > 1 && (
                <div className="backdrop-blur-md bg-white/30 border border-white/40 shadow-xl p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 font-poppins">Recent Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {documents.slice(0, 3).map(doc => (
                      <div 
                        key={doc.id} 
                        className="file-card p-4 border border-white/40 rounded-lg cursor-pointer backdrop-blur-md bg-white/30 hover:bg-white/40 transition-all duration-300 shadow-lg" 
                        onClick={() => useDocuStore.getState().setCurrentDocument(doc.id)}
                      >
                        <p className="font-medium truncate font-poppins">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-poppins">
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