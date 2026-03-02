import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminNew from './pages/AdminNew'
import './index.css'

// Carrega apenas o admin, sem nada mais
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <AdminNew />
  </React.StrictMode>
)
