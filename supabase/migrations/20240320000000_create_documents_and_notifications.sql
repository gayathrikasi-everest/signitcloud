-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    preview_url TEXT NOT NULL,
    signature_status TEXT NOT NULL CHECK (signature_status IN ('unsigned', 'signed')),
    recipient_email TEXT,
    signed_by TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    message TEXT NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    document_name TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we're not using authentication)
CREATE POLICY "Allow all operations on documents" ON documents
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on notifications" ON notifications
    FOR ALL USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;