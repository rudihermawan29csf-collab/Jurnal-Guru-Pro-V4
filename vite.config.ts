
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: './', 
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      'process.env.VITE_FB_API_KEY': JSON.stringify(env.VITE_FB_API_KEY || ""),
      'process.env.VITE_FB_AUTH_DOMAIN': JSON.stringify(env.VITE_FB_AUTH_DOMAIN || ""),
      'process.env.VITE_FB_DATABASE_URL': JSON.stringify(env.VITE_FB_DATABASE_URL || ""),
      'process.env.VITE_FB_PROJECT_ID': JSON.stringify(env.VITE_FB_PROJECT_ID || ""),
      'process.env.VITE_FB_STORAGE_BUCKET': JSON.stringify(env.VITE_FB_STORAGE_BUCKET || ""),
      'process.env.VITE_FB_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FB_MESSAGING_SENDER_ID || ""),
      'process.env.VITE_FB_APP_ID': JSON.stringify(env.VITE_FB_APP_ID || "")
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});
