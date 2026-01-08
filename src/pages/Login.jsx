import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faArrowRight, faXRay, faFileMedical, faSearch } from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import nodoImage from '../img/nodo.png'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        // Verificar se o email está validado
        // A API retorna isEmailVerified, mas normalizamos para emailVerified no AuthContext
        const emailVerified = result.user?.emailVerified || false
        
        if (!emailVerified) {
          // Email não verificado, redirecionar para verificação
          navigate(`/verify-email?email=${encodeURIComponent(email)}`)
        } else {
          // Email verificado, verificar se é master e precisa completar dados
          if (result.user?.tipo === 'master') {
            // Verificar se já existe pelo menos um cliente master com dados completos
            try {
              // Buscar dados do cliente master (userBaseId vem do token JWT)
              const clinicsResult = await api.get(`/auth/get-client-token`)
              const clinics = clinicsResult.data?.data?.clientesMaster || []
              
              // Sempre redirecionar para seleção de consultório
              navigate('/select-clinic')
            } catch (error) {
              console.error('Erro ao verificar dados do cliente master:', error)
              // Em caso de erro, ir para seleção de consultório
              navigate('/select-clinic')
            }
          } else {
            // Se não for master, ir para seleção de consultório
            navigate('/select-clinic')
          }
        }
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
            Não tem uma conta? <a href="/register">Cadastre-se aqui</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
