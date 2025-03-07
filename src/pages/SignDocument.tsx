import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuStore } from '@/lib/docuStore';
import SignatureCanvas from '@/components/SignatureCanvas';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignatureData } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PDFDocument } from 'pdf-lib';
import ShareLinkModal from '@/components/ShareLinkModal';

const SignDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocumentById, signDocument, loadData } = useDocuStore();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return;
      
      try {
        console.log('Loading document with ID:', id);
        
        // First try to fetch directly from Supabase
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();
          
        console.log('Supabase response:', { data, error });
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        if (data) {
          console.log('Found document in Supabase:', data);
          setDocument({
            id: data.id,
            name: data.name,
            type: data.type,
            size: data.size,
            createdAt: new Date(data.created_at),
            previewUrl: data.preview_url,
            signatureStatus: data.signature_status,
            recipientEmail: data.recipient_email,
            signedBy: data.signed_by,
            signedAt: data.signed_at ? new Date(data.signed_at) : undefined,
          });

          // Load the PDF document
          const response = await fetch(data.preview_url);
          const pdfBytes = await response.arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfBytes);
          setPdfDoc(pdfDoc);
        } else {
          console.log('No document found in Supabase');
          toast.error('Document not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast.error('Failed to load document');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [id, navigate]);

  const handleSignaturePlacement = (e: React.MouseEvent) => {
    if (!isPlacingSignature) return;

    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Get the actual scale of the canvas
    const scale = canvas.width / rect.width;
    
    // Calculate position relative to the container
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    console.log('Signature placement:', { x, y, scale, rectWidth: rect.width, canvasWidth: canvas.width });

    setSignaturePosition({ x, y });
    setIsPlacingSignature(false);
    
    // Place the signature immediately after clicking
    if (signature) {
      placeSignatureOnPdf(signature);
    }
  };

  const placeSignatureOnPdf = async (signatureData: SignatureData) => {
    if (!document || !pdfDoc || !signature) return;

    try {
      // Convert signature data URL to image
      const signatureImage = await fetch(signature.dataUrl);
      const signatureImageBytes = await signatureImage.arrayBuffer();

      // Get the current page of the PDF
      const page = pdfDoc.getPages()[currentPage - 1];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Calculate signature dimensions (50% of original size)
      const signatureWidth = signature.width * 0.5;
      const signatureHeight = signature.height * 0.5;

      // Place signature in bottom right corner with padding
      const padding = pageHeight * 0.05; // 5% of page height for padding
      const x = pageWidth - signatureWidth - padding; // Right align with padding
      const y = padding; // Bottom padding

      console.log('Placing signature:', { x, y, pageWidth, pageHeight, signatureWidth, signatureHeight });

      // Embed the signature image
      const signatureImageEmbed = await pdfDoc.embedPng(signatureImageBytes);
      page.drawImage(signatureImageEmbed, {
        x,
        y,
        width: signatureWidth,
        height: signatureHeight,
      });

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Update the document's preview URL
      setDocument(prev => ({
        ...prev,
        previewUrl: url
      }));

      setShowPreview(true);
    } catch (error) {
      console.error('Error placing signature:', error);
      toast.error('Failed to place signature on document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document || !signature || !pdfDoc) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const signedPdfBytes = await pdfDoc.save();
      const fileName = `signed_${document.id}.pdf`;
      const pdfFile = new File([signedPdfBytes], fileName, { type: 'application/pdf' });
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfFile, {
          contentType: 'application/pdf',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        if (uploadError.message.includes('File size limit')) {
          toast.error('File size too large. Please try again.');
        } else if (uploadError.message.includes('Unauthorized')) {
          toast.error('You do not have permission to upload documents.');
        } else {
          toast.error(`Failed to upload document: ${uploadError.message}`);
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = await supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          signature_status: 'signed',
          signed_at: new Date().toISOString(),
          preview_url: publicUrl
        })
        .eq('id', document.id);

      if (updateError) {
        throw updateError;
      }

      // Update local document state
      const updatedDocument = {
        ...document,
        preview_url: publicUrl,
        signature_status: 'signed',
        signed_at: new Date().toISOString()
      };
      
      // Update document in store
      await signDocument(document.id, {
        signerName: 'Anonymous',
        date: new Date()
      });
      
      // Update local state
      setDocument(updatedDocument);

      toast.success('Document signed successfully!');
      
      // Reload data in store to ensure it's up to date
      await loadData();
      
      setShowShareModal(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Failed to submit signed document. Please try again.');
    }
  };

  // Helper function to decode base64
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!document) {
    return <div>Document not found</div>;
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-20 w-20">
              <img 
                alt="DocuSign Logo" 
                src="/lovable-uploads/6a377da9-77be-4c97-8b61-87978d3fe20d.png" 
                className="h-full w-full object-contain" 
              />
            </div>
            <p className="text-xl font-bold">Sign the Document</p>
          </div>
          
          
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card className="p-4">
                <SignatureCanvas
                  onSign={(signatureData) => {
                    setSignature(signatureData);
                    placeSignatureOnPdf(signatureData);
                  }}
                  onClear={() => {
                    setSignature(null);
                    setShowPreview(false);
                    setIsPlacingSignature(false);
                  }}
                />
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="p-4 overflow-hidden">
                <h2 className="text-lg font-semibold mb-2">Document Preview</h2>
                <div className="relative w-full overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    <PDFViewer
                      key={document.previewUrl}
                      file={document.previewUrl}
                      onLoadComplete={(numPages) => {
                        console.log(`PDF loaded with ${numPages} pages`);
                      }}
                      className="w-full"
                    />
                  </div>
                  {showPreview && (
                    <div className="mt-4">
                      <h3 className="text-md font-medium mb-2">Signature Preview</h3>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSignature(null);
                            setShowPreview(false);
                            setIsPlacingSignature(false);
                          }}
                        >
                          Try Again
                        </Button>
                        <Button onClick={handleSubmit}>
                          Submit Signed Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          // Only navigate if the document was successfully signed
          if (document?.signature_status === 'signed') {
            navigate(`/documents/${document.id}/confirmation`);
          }
        }}
        documentId={document?.id || ''}
      />
    </>
  );
};

export default SignDocument;
