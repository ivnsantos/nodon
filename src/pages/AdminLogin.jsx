import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faSpinner } from '@fortawesome/free-solid-svg-icons'
import './Admin.css'

const AdminLogin = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    codigo: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Usar fetch direto para evitar interceptors
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      })
      
      const data = await response.json()
      console.log('AdminLogin - Status response:', response.status)
      console.log('AdminLogin - Resposta completa:', data)
      console.log('AdminLogin - Estrutura:', Object.keys(data))
      
      // Tentar diferentes caminhos para o token
      let token = null
      if (data.data?.access_token) {
        token = data.data.access_token
        console.log('AdminLogin - Token encontrado em data.data.access_token')
      } else if (data.access_token) {
        token = data.access_token
        console.log('AdminLogin - Token encontrado em data.access_token')
      } else if (data.token) {
        token = data.token
        console.log('AdminLogin - Token encontrado em data.token')
      } else if (data.result?.access_token) {
        token = data.result.access_token
        console.log('AdminLogin - Token encontrado em data.result.access_token')
      } else if (data.result?.token) {
        token = data.result.token
        console.log('AdminLogin - Token encontrado em data.result.token')
      } else if (data.admin?.access_token) {
        token = data.admin.access_token
        console.log('AdminLogin - Token encontrado em data.admin.access_token')
      } else if (data.admin?.token) {
        token = data.admin.token
        console.log('AdminLogin - Token encontrado em data.admin.token')
      }
      
      if (token) {
        console.log('AdminLogin - Token recebido (completo):', token)
        console.log('AdminLogin - Token recebido (primeiros 50):', token.substring(0, 50) + '...')
        console.log('AdminLogin - Token recebido (últimos 50):', '...' + token.substring(token.length - 50))
        localStorage.setItem('admin_token', token)
        console.log('AdminLogin - Token salvo no localStorage')
        onLoginSuccess()
      } else {
        console.log('AdminLogin - Token não encontrado na resposta:', data)
        alert('Erro ao fazer login. Token não encontrado na resposta.')
      }
    } catch (error) {
      console.error('Erro no login admin:', error)
      alert('Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>Painel Administrativo</h1>
          <p>Acesso restrito a administradores</p>
        </div>
        
        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label>Email Administrativo</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              placeholder="admin@seudominio.com.br"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="Sua senha de administrador"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Código de Acesso</label>
            <input
              type="text"
              value={loginForm.codigo}
              onChange={(e) => setLoginForm({ ...loginForm, codigo: e.target.value })}
              placeholder="Código de verificação"
              required
            />
          </div>
          
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Autenticando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEye} />
                Entrar no Painel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
