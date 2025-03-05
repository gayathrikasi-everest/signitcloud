
import { create } from 'zustand';
import { Document, Notification, SignatureData } from './types';
import { toast } from 'sonner';

// Simulate a unique ID generation
const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// Get current host for document links
const getHost = () => {
  return window.location.origin;
};

interface DocuStore {
  documents: Document[];
  notifications: Notification[];
  currentDocument: Document | null;
  
  // Document actions
  addDocument: (file: File, previewUrl: string) => Document;
  shareDocument: (documentId: string, email: string) => string;
  getDocumentById: (documentId: string) => Document | undefined;
  setCurrentDocument: (documentId: string) => void;
  signDocument: (documentId: string, signatureData: SignatureData) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadCount: () => number;
}

export const useDocuStore = create<DocuStore>((set, get) => ({
  documents: [],
  notifications: [],
  currentDocument: null,
  
  addDocument: (file, previewUrl) => {
    const newDocument: Document = {
      id: generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: new Date(),
      previewUrl,
      signatureStatus: 'unsigned',
    };
    
    set((state) => ({
      documents: [newDocument, ...state.documents],
      currentDocument: newDocument,
    }));
    
    toast(`Document "${file.name}" uploaded successfully`);
    return newDocument;
  },
  
  shareDocument: (documentId, email) => {
    const signLink = `${getHost()}/sign/${documentId}`;
    
    set((state) => ({
      documents: state.documents.map((doc) => 
        doc.id === documentId ? { ...doc, recipientEmail: email } : doc
      ),
    }));
    
    // Add a notification about sharing
    get().addNotification({
      type: 'info',
      message: `Document shared with ${email}`,
      documentId,
      documentName: get().documents.find(d => d.id === documentId)?.name,
    });
    
    return signLink;
  },
  
  getDocumentById: (documentId) => {
    return get().documents.find((doc) => doc.id === documentId);
  },
  
  setCurrentDocument: (documentId) => {
    const document = get().getDocumentById(documentId);
    
    if (document) {
      set({ currentDocument: document });
    }
  },
  
  signDocument: (documentId, signatureData) => {
    set((state) => ({
      documents: state.documents.map((doc) => 
        doc.id === documentId 
          ? { 
              ...doc, 
              signatureStatus: 'signed', 
              signedBy: signatureData.signerName || 'Anonymous', 
              signedAt: signatureData.date 
            } 
          : doc
      ),
    }));
    
    // Add a notification about signing
    const document = get().getDocumentById(documentId);
    if (document) {
      get().addNotification({
        type: 'success',
        message: `Document "${document.name}" has been signed and is ready to download`,
        documentId,
        documentName: document.name,
      });
    }
  },
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      id: generateId(),
      read: false,
      createdAt: new Date(),
      ...notification,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },
  
  markNotificationAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notif) => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
    }));
  },
  
  getUnreadCount: () => {
    return get().notifications.filter((notif) => !notif.read).length;
  },
}));
