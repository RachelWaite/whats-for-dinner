import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/spoonacular': {
        target: 'https://api.spoonacular.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/spoonacular/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const apiKey = req.headers['x-api-key'];
            if (apiKey) {
              const url = new URL(proxyReq.path, 'https://api.spoonacular.com');
              url.searchParams.set('apiKey', apiKey);
              proxyReq.path = url.pathname + url.search;
            }
          });
        },
      },
    },
  },
})
