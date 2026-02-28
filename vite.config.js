import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Garantir que .env seja carregado (resolve token não encontrado pelo loadEnv em alguns contextos)
dotenv.config()

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

