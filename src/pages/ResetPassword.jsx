import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faArrowRight, faXRay, faFileMedical, faSearch, faArrowLeft, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import './Auth.css'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const navigate = useNavigate()

  // Validar token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token de recuperação inválido ou ausente')
        setValidatingToken(false)
        return
      }

      try {
        const response = await api.get(`/auth/validate-reset-token/${token}`)
        
        if (response.data?.valid === true || response.data?.statusCode === 200) {
          setTokenValid(true)
        } else {
          setError(response.data?.message || 'Token inválido ou expirado')
          setTokenValid(false)
        }
      } catch (err) {
        console.error('Erro ao validar token:', err)
        // Se a API de validação não existir ou retornar erro, ainda permitir tentar redefinir
        // A validação final será feita na API de reset-password
        if (err.response?.status === 404) {
          // API de validação não existe, continuar sem validação prévia
          setTokenValid(true)
        } else {
          setError(err.response?.data?.message || 'Erro ao validar token')
          setTokenValid(false)
        }
      } finally {
        setValidatingToken(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token de recuperação inválido')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: password
      })

      // A API retorna { message: "Senha redefinida com sucesso!" }
      if (response.data?.message || response.status === 200 || response.data?.statusCode === 200) {
        setSuccess(true)
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data?.message || 'Erro ao redefinir senha')
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      const errorMessage = err.response?.data?.message || 'Erro ao redefinir senha. O token pode ter expirado.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (validatingToken) {
    return (
      <div className="auth-container-modern">
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinning" />
              <p>Validando token...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!token || !tokenValid) {
    return (
      <div className="auth-container-modern">
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="error-message-container">
              <h2>Token inválido</h2>
              <p>{error || 'O link de recuperação é inválido ou expirou.'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <Link to="/forgot-password" className="auth-link">
                  Solicitar novo link
                </Link>
                <Link to="/login" className="auth-link">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Voltar para o login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
          
          {!success ? (
            <>
              <div className="auth-header-modern">
                <h2>Redefinir senha</h2>
                <p>Digite sua nova senha</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form-modern">
                {error && <div className="error-message-modern">{error}</div>}
                
                <div className="form-group-modern">
                  <label htmlFor="password">
                    <FontAwesomeIcon icon={faLock} /> Nova Senha
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    autoFocus
                  />
                </div>

                <div className="form-group-modern">
                  <label htmlFor="confirmPassword">
                    <FontAwesomeIcon icon={faLock} /> Confirmar Senha
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Digite a senha novamente"
                    minLength={6}
                  />
                </div>

                <button type="submit" className="auth-button-modern" disabled={loading}>
                  {loading ? 'Redefinindo...' : (
                    <>
                      Redefinir senha
                      <FontAwesomeIcon icon={faArrowRight} />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-footer-modern">
                <Link to="/login" className="auth-link">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Voltar para o login
                </Link>
              </p>
            </>
          ) : (
            <div className="success-message-container">
              <div className="success-icon success">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <h2>Senha redefinida!</h2>
              <p>
                Sua senha foi redefinida com sucesso.
              </p>
              <p className="success-subtitle">
                Você será redirecionado para a página de login em instantes...
              </p>
              <Link to="/login" className="auth-link">
                <FontAwesomeIcon icon={faArrowLeft} />
                Ir para o login agora
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

