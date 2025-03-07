import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SignatureData } from '@/types';

interface SignatureCanvasProps {
  onSign: (signatureData: SignatureData) => void;
  onClear: () => void;
  signerName?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSign, 
  onClear,
  signerName
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      setContext(ctx);
    }
    
    // Make canvas responsive
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        const width = container.clientWidth;
        canvas.width = width;
        canvas.height = 150;
        
        // Restore context settings after resize
        if (ctx) {
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#000000';
        }
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);
  
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return;
    
    setIsDrawing(true);
    const coordinates = getCoordinates(e);
    context.beginPath();
    context.moveTo(coordinates.x, coordinates.y);
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;
    
    const coordinates = getCoordinates(e);
    context.lineTo(coordinates.x, coordinates.y);
    context.stroke();
    setHasSignature(true);
  };
  
  const endDrawing = () => {
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  };
  
  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasSignature(false);
      onClear();
    }
  };
  
  const saveSignature = () => {
    if (canvasRef.current && hasSignature) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSign({
        signature: dataUrl,
        signedAt: new Date().toISOString(),
        signerName: signerName || '',
        signerEmail: '', // This will be set by the parent component
        dataUrl,
        width: canvasRef.current.width,
        height: canvasRef.current.height
      });
    }
  };
  
  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in event) {
      // Touch event
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  };
  
  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-medium">Your signature</div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="signature-canvas w-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm">
            Sign here
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-4">
        <Button 
          size="sm" 
          onClick={saveSignature}
          disabled={!hasSignature}
          className="text-xs"
        >
          <Check className="h-3 w-3 mr-1" />
          Confirm Signature
        </Button>

        <Button 
          variant="outline" 
          size="icon"
          onClick={clearCanvas}
          className="h-7 w-7"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};

export default SignatureCanvas;
