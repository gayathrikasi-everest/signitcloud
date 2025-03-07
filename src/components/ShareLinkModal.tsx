import React, { useState, useEffect } from 'react';
import { Link, Download, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDocuStore } from '@/lib/docuStore';
import { toast } from 'sonner';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ isOpen, onClose, documentId }) => {
  const { shareDocument, getDocumentById, loadData } = useDocuStore();
  const [isLoading, setIsLoading] = useState(false);
  const [signLink, setSignLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [document, setDocument] = useState<any>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSignLink('');
      setCopied(false);
      setIsLoading(true);
      // Reload data when modal opens
      loadData().then(() => {
        const doc = getDocumentById(documentId);
        setDocument(doc);
        if (doc?.signatureStatus === 'signed' && doc?.previewUrl) {
          setSignLink(doc.previewUrl);
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, documentId, getDocumentById, loadData]);

  const handleGenerateLink = async () => {
    if (!documentId) {
      toast.error('No document selected');
      return;
    }

    setIsLoading(true);
    
    try {
      // Reload data before getting document
      await loadData();
      
      const document = getDocumentById(documentId);
      console.log('Found document:', document); // Debug log
      
      if (!document) {
        throw new Error("Document not found");
      }

      const link = await shareDocument(documentId, '');
      console.log('Generated link:', link); // Debug log
      
      if (!link) {
        throw new Error("Failed to generate link");
      }
      
      setSignLink(link);
      toast.success('Signature link generated successfully');
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (signLink && document?.signatureStatus === 'signed') {
      window.open(signLink, '_blank');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleClose = () => {
    setSignLink('');
    setCopied(false);
    onClose();
  };

  const isSignedDocument = document?.signatureStatus === 'signed';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl bg-white border-border animate-scale-in font-poppins">
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins">
            {isSignedDocument ? 'Download Signed Document' : 'Share for Signature'}
          </DialogTitle>
          <DialogDescription>
            {isSignedDocument 
              ? 'Your document has been signed successfully. You can now download it or copy the link.'
              : 'Generate a link to share this document for signature'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {isLoading ? (
            <div className="text-center">Loading document...</div>
          ) : !signLink ? (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-muted-foreground font-poppins">
                Click the button below to generate a shareable signature link
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="border border-input rounded-md p-2 bg-secondary/50 break-all text-sm font-poppins">
                      {signLink}
                    </div>
                  </div>
                  <Button
                    className="shrink-0 w-full sm:w-auto"
                    variant="secondary"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-poppins">
                {isSignedDocument 
                  ? 'Share this link to allow others to download the signed document'
                  : 'Share this link with anyone who needs to sign the document'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-end">
          {!signLink ? (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto font-poppins bg-white text-foreground hover:bg-gray-100">
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateLink} 
                disabled={isLoading}
                className="w-full sm:w-auto relative overflow-hidden group font-poppins"
              >
                <span className="relative z-10">
                  {isLoading ? 'Generating...' : 'Generate Link'}
                </span>
                <span className="absolute inset-0 bg-primary/10 w-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto font-poppins bg-white text-foreground hover:bg-gray-100">
                {isSignedDocument ? 'Close' : 'Done'}
              </Button>
              {isSignedDocument && (
                <Button 
                  onClick={handleDownload}
                  className="w-full sm:w-auto relative overflow-hidden group font-poppins"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLinkModal;
