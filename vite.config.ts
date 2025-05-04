import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {  // 👈 Add this new block
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Your Flask backend port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')  // Optional: removes '/api' when forwarding
      }
    }
  }
});