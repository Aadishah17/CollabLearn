import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const devPort = Number(env.VITE_DEV_PORT) || 5173;
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5001';
  const getPackageName = (id) => {
    const normalized = String(id || '').replace(/\\/g, '/');
    const nodeModulesSegment = normalized.split('/node_modules/').pop();

    if (!nodeModulesSegment) {
      return null;
    }

    const directSegment = nodeModulesSegment.includes('/node_modules/')
      ? nodeModulesSegment.split('/node_modules/').pop()
      : nodeModulesSegment;

    const parts = directSegment.split('/');
    if (!parts.length) {
      return null;
    }

    if (parts[0].startsWith('@') && parts.length > 1) {
      return `${parts[0]}/${parts[1]}`;
    }

    return parts[0];
  };

  const toChunkName = (packageName) =>
    `vendor-${String(packageName || 'misc')
      .replace(/^@/, '')
      .replace(/[/.]/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')}`;

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            const packageName = getPackageName(id);
            if (!packageName) {
              return 'vendor-misc';
            }

            if (
              ['react', 'react-dom', 'scheduler', 'react-router-dom', '@remix-run/router'].includes(
                packageName
              )
            ) {
              return 'react-core';
            }

            if (['chart.js', 'react-chartjs-2'].includes(packageName)) {
              return 'charts';
            }

            if (packageName === 'react-player') {
              return 'react-player';
            }

            if (packageName === 'hls.js') {
              return 'hls';
            }

            if (packageName === 'dashjs') {
              return 'dashjs';
            }

            if (
              ['socket.io-client', 'socket.io-parser', 'engine.io-client'].includes(packageName)
            ) {
              return 'realtime';
            }

            if (['@react-oauth/google', '@google-pay/button-react'].includes(packageName)) {
              return 'payments-auth';
            }

            if (['lucide-react', 'react-icons'].includes(packageName)) {
              return 'icons';
            }

            if (packageName === 'date-fns') {
              return 'dates';
            }

            if (packageName === 'react-hot-toast') {
              return 'toast';
            }

            if (packageName === 'axios') {
              return 'requests';
            }

            if (['cookie', 'set-cookie-parser'].includes(packageName)) {
              return;
            }

            return toChunkName(packageName);
          },
        },
      },
    },
    server: {
      host: true,
      port: devPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
