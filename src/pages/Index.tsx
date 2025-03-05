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
  return <div className="min-h-screen bg-[F9EFDF] bg-[#faefe4]">
      <div className="container max-w-screen-lg py-8">
        <header className="flex justify-between items-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg">
            <h1 className="text-3xl font-semibold font-poppins">DocuSign Clone</h1>
            <p className="text-muted-foreground mt-1 font-poppins">Upload, share, and sign documents effortlessly</p>
          </div>
          
          <div>
            <NotificationBell />
          </div>
        </header>
        
        <main className="space-y-8 animate-fade-in">
          {documents.length === 0 || !currentDocument ? <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
              <FileUpload />
            </div> : <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
                <DocumentPreview document={currentDocument} />
              </div>
              
              {documents.length > 1 && <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 font-poppins">Recent Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {documents.slice(0, 3).map(doc => <div key={doc.id} className="file-card p-4 border rounded-lg cursor-pointer bg-white hover:bg-accent/50" onClick={() => useDocuStore.getState().setCurrentDocument(doc.id)}>
                        <p className="font-medium truncate font-poppins">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-poppins">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>)}
                  </div>
                </div>}
            </div>}
        </main>
      </div>
      <Toaster />
    </div>;
};
export default Index;