import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  assetsInclude: ['**/*.PNG', '**/*.png', '**/*.JPG', '**/*.jpg', '**/*.JPEG', '**/*.jpeg'],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/asaas-proxy': {
        target: env.VITE_ASAAS_API_URL || 'https://api-sandbox.asaas.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/asaas-proxy/, '/v3'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Adicionar headers necessários para a Asaas
            const asaasToken = env.VITE_ASAAS_TOKEN || VITE_ASAAS_TOKEN_DEV
            proxyReq.setHeader('access_token', asaasToken)
            proxyReq.setHeader('User-Agent', 'Checkout assas.com')
          })
        }
      }
    },
    fs: {
      strict: false
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    exclude: ['webpage_content_reporter']
  },
  // Ignorar erros de extensões do navegador durante o build
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
  }
})

