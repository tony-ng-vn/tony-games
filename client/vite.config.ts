import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  // Emit to repo-root dist so Vercel’s default outputDirectory works
  // even when the project Root Directory is left as ".".
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
