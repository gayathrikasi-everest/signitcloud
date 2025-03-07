import React, { useState, useRef } from 'react';
import { Upload, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDocuStore } from '@/lib/docuStore';
import { uploadFile, getFileUrl } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const FileUpload: React.FC = () => {
  const {
    addDocument
  } = useDocuStore();
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

    try {
      // Generate a unique file path
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const filePath = `${fileId}.${fileExtension}`;

      console.log('Starting file upload:', filePath);

      // Upload to Supabase
      const uploadResult = await uploadFile(file, filePath);
      console.log('Upload result:', uploadResult);

      // Get the public URL
      const previewUrl = getFileUrl(filePath);
      console.log('File uploaded successfully:', previewUrl);

      // Verify the URL is accessible
      try {
        const response = await fetch(previewUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`URL verification failed: ${response.status}`);
        }
      } catch (error) {
        console.error('URL verification error:', error);
        throw new Error('Failed to verify file URL');
      }

      // Add document to store
      addDocument(file, previewUrl);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to upload file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
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

  return (
    <Card onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="bg-transparent border-0">
      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileInputChange} />
      
      <div className="flex flex-col items-center text-center py-[56px] rounded-lg backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
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
            <h3 className="font-medium mb-2 text-2xl">Upload a document</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Drag and drop your PDF or image file here, or click the button below
            </p>
            <Button 
              onClick={handleButtonClick} 
              className="h-24 w-24 rounded-full flex items-center justify-center bg-[#222222] hover:bg-[#444] transition-colors [&_svg]:!h-20 [&_svg]:!w-10
              "
            >
              <Upload className="text-white" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;