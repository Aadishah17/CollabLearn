import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const devPort = Number(env.VITE_DEV_PORT) || 5173;
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001';
  const matchesAny = (id, patterns) => patterns.some((pattern) => id.includes(pattern));

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (matchesAny(id, ['/react/', 'react-dom', 'scheduler', 'react-router-dom', '@remix-run'])) {
              return 'react-core';
            }

            if (matchesAny(id, ['chart.js', 'react-chartjs-2'])) {
              return 'charts';
            }

            if (matchesAny(id, ['react-player', 'hls.js', 'dashjs'])) {
              return 'media';
            }

            if (matchesAny(id, ['react-quill', '/quill/'])) {
              return 'editor';
            }

            if (matchesAny(id, ['socket.io-client', 'socket.io-parser', 'engine.io-client', 'zego-express-engine-webrtc'])) {
              return 'realtime';
            }

            if (matchesAny(id, ['@react-oauth', '@google-pay'])) {
              return 'payments-auth';
            }

            if (matchesAny(id, ['lucide-react', 'react-icons'])) {
              return 'icons';
            }

            if (matchesAny(id, ['date-fns'])) {
              return 'dates';
            }

            if (matchesAny(id, ['react-hot-toast'])) {
              return 'toast';
            }

            if (matchesAny(id, ['axios'])) {
              return 'requests';
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
