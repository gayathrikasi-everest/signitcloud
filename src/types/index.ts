export interface SignatureData {
  signature: string;
  signedAt: string;
  signerName: string;
  signerEmail: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  previewUrl: string;
  signatureStatus: string;
  recipientEmail?: string;
  signedBy?: string;
  signedAt?: Date;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  documentId?: string;
  documentName?: string;
  read: boolean;
  createdAt: Date;
} 