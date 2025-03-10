import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { PostgrestClient } from '@supabase/postgrest-js';


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    mimeTypes: {
      'application/javascript': ['js', 'jsx', 'ts', 'tsx'],
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    commonjs(),
    resolve(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react-pdf', 'pdfjs-dist/build/pdf.worker.min.js'],
  },
  build: {
    commonjsOptions: {
      include: [/react-pdf/, /pdfjs-dist/],
    },
  },
}));
