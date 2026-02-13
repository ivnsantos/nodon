import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faArrowRight, faXRay, faFileMedical, faSearch } from '@fortawesome/free-solid-svg-icons'
import { faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import nodoImage from '../img/nodo.png'
import './Auth.css'

// URL base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Handler do login com Google - redireciona para o backend
  const handleGoogleClick = () => {
    // Redirecionar para o endpoint do backend que inicia o fluxo OAuth
    window.location.href = `${API_BASE_URL}/auth/google`
  }

  // Handler do login com Facebook - redireciona para o backend
  const handleFacebookClick = () => {
    window.location.href = `${API_BASE_URL}/auth/facebook`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Após login bem-sucedido, deixar o ProtectedRoute cuidar do redirecionamento
        // Ele vai verificar se precisa verificar telefone, selecionar consultório, etc.
        // Por padrão, redirecionar para /app que será protegido pelo ProtectedRoute
        navigate('/app')
      } else {
        setError(result.message || 'Erro ao fazer login. Verifique suas credenciais.')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container-modern">
      <div className="auth-left-panel">
        <div className="auth-branding">
          <h1 className="auth-brand-title">NODON</h1>
          <p className="auth-brand-subtitle">
            Plataforma inteligente para análise de radiografias odontológicas
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faXRay} />
              </div>
              <span>Análise de Radiografias</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faFileMedical} />
              </div>
              <span>Relatórios Detalhados</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faSearch} />
              </div>
              <span>Detecção Inteligente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="auth-logo-right">
            <img src={nodoLogo} alt="NODON" className="auth-logo-animated" />
          </div>
          <div className="auth-header-modern">
            <h2>Bem-vindo de volta</h2>
            <p>Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-modern">
            {error && <div className="error-message-modern">{error}</div>}
            
            <div className="form-group-modern">
              <label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} /> Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="password">
                <FontAwesomeIcon icon={faLock} /> Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link to="/forgot-password-phone" className="forgot-password-link">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <div className="social-login-buttons">
              <button 
                type="button" 
                className="social-btn google-btn"
                onClick={handleGoogleClick}
              >
                <FontAwesomeIcon icon={faGoogle} />
                Entrar com Google
              </button>
              <button 
                type="button" 
                className="social-btn facebook-btn"
                onClick={handleFacebookClick}
              >
                <FontAwesomeIcon icon={faFacebook} />
                Entrar com Facebook
              </button>
            </div>

            <div className="social-divider">
              <span>ou</span>
            </div>

            <button type="submit" className="auth-button-modern" disabled={loading}>
              {loading ? 'Entrando...' : (
                <>
                  Entrar
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-modern">
            Não tem uma conta? <Link to="/checkout">Cadastre-se aqui</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
