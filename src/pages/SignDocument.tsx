
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuStore } from '@/lib/docuStore';
import { SignatureData } from '@/lib/types';
import SignatureCanvas from '@/components/SignatureCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const SignDocument = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { getDocumentById, signDocument } = useDocuStore();
  const [document, setDocument] = useState(documentId ? getDocumentById(documentId) : undefined);
  const [signerName, setSignerName] = useState('');
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (documentId) {
      const doc = getDocumentById(documentId);
      setDocument(doc);
      
      if (!doc) {
        toast.error("Document not found");
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [documentId, getDocumentById, navigate]);

  const handleSignatureCreate = (signatureData: SignatureData) => {
    setSignature({ ...signatureData, signerName });
  };

  const handleSignatureClear = () => {
    setSignature(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentId || !signature) {
      toast.error("Please provide your signature");
      return;
    }
    
    setIsSigning(true);
    
    // Simulate signing process
    setTimeout(() => {
      signDocument(documentId, signature);
      setIsSigning(false);
      setIsSuccess(true);
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }, 1500);
  };

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <div className="loading-dots">
            <span>•</span><span>•</span><span>•</span>
          </div>
          <p className="mt-4 text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center max-w-md animate-scale-in">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Document Signed Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for signing "{document.name}". The sender has been notified.
          </p>
          <Button onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container max-w-screen-md py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        
        <div className="bg-card rounded-lg shadow-elegant p-6 border border-border">
          <h1 className="text-2xl font-semibold mb-6">Sign Document: {document.name}</h1>
          
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
              {document.type.includes('image') ? (
                <img 
                  src={document.previewUrl} 
                  alt={document.name} 
                  className="w-full h-auto"
                />
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Document Preview</p>
                  <p className="font-medium mt-2">{document.name}</p>
                </div>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="signerName">Your Name</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Type your full name"
                required
              />
            </div>
            
            <SignatureCanvas 
              onSign={handleSignatureCreate}
              onClear={handleSignatureClear}
              signerName={signerName}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!signature || isSigning}
            >
              {isSigning ? 'Submitting Signature...' : 'Complete Signing'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignDocument;
