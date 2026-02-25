import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Garantir que .env seja carregado (resolve token não encontrado pelo loadEnv em alguns contextos)
dotenv.config()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Usar env do loadEnv e process.env (dotenv acima preenche process.env)
  const asaasToken = env.VITE_ASAAS_TOKEN || env.VITE_ASAAS_TOKEN_DEV
    || process.env.VITE_ASAAS_TOKEN || process.env.VITE_ASAAS_TOKEN_DEV

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
        target: env.VITE_ASAAS_API_URL || process.env.VITE_ASAAS_API_URL || 'https://api-sandbox.asaas.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/asaas-proxy/, '/v3'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (!asaasToken) {
              console.warn('[Vite proxy Asaas] Token não configurado. Adicione VITE_ASAAS_TOKEN_DEV ou VITE_ASAAS_TOKEN no .env e reinicie o servidor.')
            } else {
              proxyReq.setHeader('access_token', asaasToken)
            }
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

