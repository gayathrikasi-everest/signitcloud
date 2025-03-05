
import React, { useState, useRef } from 'react';
import { Upload, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDocuStore } from '@/lib/docuStore';

const FileUpload: React.FC = () => {
  const { addDocument } = useDocuStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file || !file.type.includes('pdf') && !file.type.includes('image/')) {
      toast.error('Please upload a PDF or image file');
      return;
    }

    setIsUploading(true);
    
    // Simulate uploading progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    // Generate preview URL
    const previewUrl = await readFileAsDataURL(file);
    
    // Add document with slight delay to show progress
    setTimeout(() => {
      addDocument(file, previewUrl);
      setIsUploading(false);
      setUploadProgress(0);
    }, 2200);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  return (
    <Card 
      className={`
        p-10 border-2 border-dashed transition-all duration-300
        hover:border-primary/50 flex flex-col items-center justify-center 
        animate-fade-in hover-lift
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      <div className="flex flex-col items-center text-center">
        {isUploading ? (
          <div className="w-full max-w-xs">
            <div className="flex items-center space-x-2 mb-2">
              <File className="h-6 w-6 text-primary animate-pulse" />
              <div className="text-sm font-medium">Uploading document...</div>
            </div>
            <Progress value={uploadProgress} className="h-2 w-full" />
          </div>
        ) : (
          <>
            <div className="h-16 w-16 bg-secondary/80 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Upload a document</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Drag and drop your PDF or image file here, or click the button below
            </p>
            <Button 
              onClick={handleButtonClick} 
              className="relative overflow-hidden group"
            >
              <span className="relative z-10">Upload Document</span>
              <span className="absolute inset-0 bg-primary/10 w-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;
