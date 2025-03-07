import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  return data;
};

export const getFileUrl = (path: string) => {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(path);
  
  // Ensure we have a valid URL
  if (!data.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  // Log the URL for debugging
  console.log('Generated URL:', data.publicUrl);
  return data.publicUrl;
};

export const deleteFile = async (path: string) => {
  const { error } = await supabase.storage
    .from('documents')
    .remove([path]);
  if (error) throw error;
}; 