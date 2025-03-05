import React, { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocuStore } from '@/lib/docuStore';
import { toast } from 'sonner';
import { sendEmail } from '@/lib/resend';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, documentId }) => {
  const { shareDocument, getDocumentById } = useDocuStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signLink, setSignLink] = useState('');
  const [copied, setCopied] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async () => {
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const link = shareDocument(documentId, email);
      setSignLink(link);
      
      const document = getDocumentById(documentId);
      
      if (!document) {
        throw new Error("Document not found");
      }
      
      await sendEmail({
        to: email,
        subject: `Document Ready for Signature: ${document.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Document Ready for Signature</h2>
            <p>You have received a document that requires your signature.</p>
            <p><strong>Document name:</strong> ${document.name}</p>
            <p>Please click the link below to view and sign the document:</p>
            <a href="${link}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              View and Sign Document
            </a>
            <p>If you're unable to click the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #666;">${link}</p>
            <p>Thank you!</p>
          </div>
        `
      });
      
      toast.success(`Email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(signLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setSignLink('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-sm bg-background/95 border-border animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl">Share for Signature</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {!signLink ? (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient's email address</Label>
                <div className="flex items-center border border-input rounded-md focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                  <div className="p-2 bg-muted/50">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    autoFocus
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll send an email with a link to sign the document
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Signature link</Label>
                <div className="flex items-center">
                  <div className="flex-1 border border-input rounded-l-md p-2 bg-secondary/50 text-sm truncate">
                    {signLink}
                  </div>
                  <Button
                    className="rounded-l-none"
                    variant="secondary"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Link has been sent to {email}. You can also copy and share this link manually.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-end">
          {!signLink ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={!email || isLoading}
                className="relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {isLoading ? 'Sending...' : 'Send'}
                </span>
                <span className="absolute inset-0 bg-primary/10 w-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
