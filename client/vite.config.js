import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const devPort = Number(env.VITE_DEV_PORT) || 5173;
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (
              id.includes('/react/') ||
              id.includes('react-dom') ||
              id.includes('scheduler') ||
              id.includes('react-router-dom') ||
              id.includes('@remix-run')
            ) {
              return 'react-core';
            }

            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts';
            }

            if (id.includes('react-player') || id.includes('hls.js') || id.includes('dashjs')) {
              return 'media';
            }

            if (id.includes('react-quill') || id.includes('/quill/')) {
              return 'editor';
            }

            if (id.includes('socket.io-client') || id.includes('zego-express-engine-webrtc')) {
              return 'realtime';
            }

            if (id.includes('@react-oauth') || id.includes('@google-pay')) {
              return 'payments-auth';
            }

            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons';
            }

            return 'vendor';
          }
        }
      }
    },
    server: {
      host: true,
      port: devPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
