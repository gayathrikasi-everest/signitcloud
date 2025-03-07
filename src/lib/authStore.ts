import { create } from 'zustand';
import { supabase } from './supabase';
import { toast } from 'sonner';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  loadUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, isLoading: false });
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user ?? null });
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in');
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Check your email to confirm your account');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Failed to sign up');
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  },
})); 