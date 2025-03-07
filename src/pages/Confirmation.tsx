import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useDocuments } from '@/context/DocumentContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Home, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Confirmation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents } = useDocuments();
  const [document, setDocument] = useState(documents.find(doc => doc.id === id));

  useEffect(() => {
    if (!id || !document) {
      navigate('/');
    }
  }, [id, document, navigate]);

  if (!document) {
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <Card className="bg-white shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-primary">
              <CheckCircle className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-poppins">Document Signed Successfully!</CardTitle>
            <CardDescription className="text-muted-foreground font-poppins">
              Your document has been signed and saved.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted rounded-lg p-4 w-32 h-40 flex items-center justify-center">
                <FileIcon className="text-primary w-16 h-16" />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-center space-x-2">
                <Button variant="outline" asChild>
                  <Link to={document.preview_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Signed Document
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Confirmation; 