import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), ...(command === 'serve' ? [basicSsl()] : [])],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('react-router')
          ) {
            return 'vendor-react';
          }
          if (id.includes('axios')) return 'vendor-http';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: true,
    port: 5173,
    https: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}));
