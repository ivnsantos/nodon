import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Ignorar erros de scripts externos (extensões do navegador)
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('webpage_content_reporter')) {
    event.preventDefault()
    return false
  }
})

// Ignorar erros de sintaxe de scripts externos
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('webpage_content_reporter')) {
    event.preventDefault()
    return false
  }
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

