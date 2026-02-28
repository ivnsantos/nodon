import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { initAnalytics } from './utils/analytics'
import './index.css'

// GTM e Meta Pixel só em produção
initAnalytics()

// Ignorar erros de scripts externos (extensões do navegador)
window.addEventListener('error', (event) => {
  // Ignorar erros de extensões do Chrome
  if (event.filename && (
    event.filename.includes('webpage_content_reporter') ||
    event.filename.includes('chrome-extension://') ||
    event.filename.includes('moz-extension://') ||
    event.filename.includes('safari-extension://')
  )) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  // Ignorar erros 404 de recursos que não são críticos
  if (event.target && event.target.tagName) {
    const tagName = event.target.tagName.toLowerCase()
    if ((tagName === 'link' || tagName === 'script' || tagName === 'img') && 
        event.target.src && event.target.src.includes('app:')) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }
  }
}, true)

// Ignorar erros de sintaxe de scripts externos
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('webpage_content_reporter') ||
    event.message.includes('chrome-extension://') ||
    event.message.includes('Unexpected token \'export\'')
  )) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
}, true)

// Ignorar erros de recursos não encontrados (404)
window.addEventListener('error', (event) => {
  if (event.target && event.target.tagName) {
    const tagName = event.target.tagName.toLowerCase()
    // Ignorar 404 de imagens, links e scripts que não são críticos
    if ((tagName === 'img' || tagName === 'link' || tagName === 'script') && 
        (event.target.src?.includes('app:') || event.target.href?.includes('app:'))) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }
  }
  
  // Ignorar erros 404 de requisições fetch/XMLHttpRequest para rotas do React Router
  if (event.message && (
    event.message.includes('404') || 
    event.message.includes('Failed to fetch') ||
    (event.filename && event.filename.includes('/app'))
  )) {
    // Não prevenir completamente, apenas logar como aviso
    console.warn('Erro de recurso ignorado:', event.message)
  }
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)


