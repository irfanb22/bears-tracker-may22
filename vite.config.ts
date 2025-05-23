import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // Needed for proper WebContainer support
    port: 5173,
    strictPort: true, // Ensure exact port is used
    hmr: {
      clientPort: 443 // Fix HMR in WebContainer environment
    },
    cors: true, // Enable CORS for development
  },
  base: process.env.NODE_ENV === 'production' 
    ? 'https://bearsprediction.com/'
    : '/',
});