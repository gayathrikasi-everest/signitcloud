
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  previewUrl: string;
  signatureStatus: 'unsigned' | 'signed';
  recipientEmail?: string;
  signedBy?: string;
  signedAt?: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  documentId?: string;
  documentName?: string;
  read: boolean;
  createdAt: Date;
}

export interface SignatureData {
  dataUrl: string;
  date: Date;
  signerName?: string;
}
