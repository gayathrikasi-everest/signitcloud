import { create } from 'zustand';
import { Document, Notification, SignatureData } from './types';
import { toast } from 'sonner';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Get current host for document links
const getHost = () => {
  return window.location.origin;
};

// Database record types
interface DatabaseDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  preview_url: string;
  signature_status: 'unsigned' | 'signed';
  recipient_email?: string;
  signed_by?: string;
  signed_at?: string;
}

interface DatabaseNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  document_id?: string;
  document_name?: string;
  read: boolean;
  created_at: string;
}

interface DocuStore {
  documents: Document[];
  notifications: Notification[];
  currentDocument: Document | null;
  isLoading: boolean;
  
  // Document actions
  addDocument: (file: File, previewUrl: string) => Promise<Document>;
  shareDocument: (documentId: string, email: string) => Promise<string>;
  getDocumentById: (documentId: string) => Document | undefined;
  setCurrentDocument: (documentId: string) => void;
  signDocument: (documentId: string, signatureData: { signerName: string; date: Date }) => Promise<void>;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getUnreadCount: () => number;
  
  // Data loading
  loadData: () => Promise<void>;
}

// Helper function to transform database document to our Document type
const transformDocument = (doc: DatabaseDocument): Document => ({
  id: doc.id,
  name: doc.name,
  type: doc.type,
  size: doc.size,
  createdAt: new Date(doc.created_at),
  previewUrl: doc.preview_url,
  signatureStatus: doc.signature_status,
  recipientEmail: doc.recipient_email,
  signedBy: doc.signed_by,
  signedAt: doc.signed_at ? new Date(doc.signed_at) : undefined,
});

// Helper function to transform database notification to our Notification type
const transformNotification = (notif: DatabaseNotification): Notification => ({
  id: notif.id,
  type: notif.type,
  message: notif.message,
  documentId: notif.document_id,
  documentName: notif.document_name,
  read: notif.read,
  createdAt: new Date(notif.created_at),
});

export const useDocuStore = create<DocuStore>((set, get) => ({
  documents: [],
  notifications: [],
  currentDocument: null,
  isLoading: true,
  
  loadData: async () => {
    try {
      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

      // Transform the data to match our types
      const documents = (documentsData as DatabaseDocument[]).map(transformDocument);
      const notifications = (notificationsData as DatabaseNotification[]).map(transformNotification);

      set({ documents, notifications, isLoading: false });

      // Set up real-time subscriptions
      const documentsChannel = supabase
        .channel('documents')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'documents' },
          (payload: RealtimePostgresChangesPayload<DatabaseDocument>) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const documents = get().documents;

            switch (eventType) {
              case 'INSERT':
                if (newRecord) {
                  set({ documents: [transformDocument(newRecord), ...documents] });
                }
                break;
              case 'UPDATE':
                if (newRecord) {
                  set({ documents: documents.map(doc => 
                    doc.id === newRecord.id ? transformDocument(newRecord) : doc
                  ) });
                }
                break;
              case 'DELETE':
                if (oldRecord) {
                  set({ documents: documents.filter(doc => doc.id !== oldRecord.id) });
                }
                break;
            }
          }
        )
        .subscribe();

      const notificationsChannel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload: RealtimePostgresChangesPayload<DatabaseNotification>) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const notifications = get().notifications;

            switch (eventType) {
              case 'INSERT':
                if (newRecord) {
                  set({ notifications: [transformNotification(newRecord), ...notifications] });
                }
                break;
              case 'UPDATE':
                if (newRecord) {
                  set({ notifications: notifications.map(notif => 
                    notif.id === newRecord.id ? transformNotification(newRecord) : notif
                  ) });
                }
                break;
              case 'DELETE':
                if (oldRecord) {
                  set({ notifications: notifications.filter(notif => notif.id !== oldRecord.id) });
                }
                break;
            }
          }
        )
        .subscribe();

      // Store channel references for cleanup
      set((state) => ({
        ...state,
        _channels: { documents: documentsChannel, notifications: notificationsChannel },
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
      set({ isLoading: false });
    }
  },
  
  addDocument: async (file, previewUrl) => {
    try {
      const newDocument: DatabaseDocument = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        preview_url: previewUrl,
        signature_status: 'unsigned',
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('documents')
        .insert([newDocument]);

      if (error) throw error;

      const transformedDocument = transformDocument(newDocument);
      set((state) => ({
        documents: [transformedDocument, ...state.documents],
        currentDocument: transformedDocument,
      }));
      
      toast(`Document "${file.name}" uploaded successfully`);
      return transformedDocument;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to upload document');
      throw error;
    }
  },
  
  shareDocument: async (documentId, email) => {
    try {
      const signLink = `${getHost()}/sign/${documentId}`;
      
      const { error } = await supabase
        .from('documents')
        .update({ recipient_email: email })
        .eq('id', documentId);

      if (error) throw error;
      
      set((state) => ({
        documents: state.documents.map((doc) => 
          doc.id === documentId ? { ...doc, recipientEmail: email } : doc
        ),
      }));
      
      // Add a notification about sharing
      await get().addNotification({
        type: 'info',
        message: `Document shared with ${email}`,
        documentId,
        documentName: get().documents.find(d => d.id === documentId)?.name,
      });
      
      return signLink;
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to share document');
      throw error;
    }
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
  
  signDocument: async (documentId, signatureData) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          signature_status: 'signed',
          signed_by: signatureData.signerName || 'Anonymous',
          signed_at: signatureData.date.toISOString(),
        })
        .eq('id', documentId);

      if (error) throw error;
      
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
        await get().addNotification({
          type: 'success',
          message: `Document "${document.name}" has been signed and is ready to download`,
          documentId,
          documentName: document.name,
        });
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document');
      throw error;
    }
  },
  
  addNotification: async (notification) => {
    try {
      const newNotification: DatabaseNotification = {
        id: uuidv4(),
        type: notification.type,
        message: notification.message,
        document_id: notification.documentId,
        document_name: notification.documentName,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('notifications')
        .insert([newNotification]);

      if (error) throw error;
      
      const transformedNotification = transformNotification(newNotification);
      set((state) => ({
        notifications: [transformedNotification, ...state.notifications],
      }));
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Failed to add notification');
      throw error;
    }
  },
  
  markNotificationAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      set((state) => ({
        notifications: state.notifications.map((notif) => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        ),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
      throw error;
    }
  },
  
  getUnreadCount: () => {
    return get().notifications.filter((notif) => !notif.read).length;
  },
}));
