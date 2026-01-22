import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faArrowRight, faSpinner, faCheckCircle, faXRay, faFileMedical, faSearch, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Auth.css'

const VerifyEmail = () => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const inputRefs = useRef([])
  const { verifyEmail, resendVerificationCode, logout } = useAuth()
  const { alertConfig, showSuccess, hideAlert } = useAlert()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    // Pegar email da query string ou do location state
    const emailFromQuery = new URLSearchParams(location.search).get('email')
    const emailFromState = location.state?.email
    
    if (emailFromQuery) {
      setEmail(emailFromQuery)
    } else if (emailFromState) {
      setEmail(emailFromState)
    } else {
      // Se não tiver email, redirecionar para login
      navigate('/login')
    }
  }, [location, navigate])

  // Enviar código automaticamente quando a página carregar
  useEffect(() => {
    const sendCodeAutomatically = async () => {
      if (!email) return

      try {
        await resendVerificationCode(email)
        // Não mostrar alerta, apenas enviar silenciosamente
      } catch (error) {
        console.error('Erro ao enviar código automaticamente:', error)
        // Não mostrar erro para o usuário, apenas logar
      }
    }

    // Aguardar um pouco para garantir que o email foi definido
    if (email) {
      const timer = setTimeout(() => {
        sendCodeAutomatically()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [email, resendVerificationCode])

  const handleCodeChange = (index, value) => {
    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus no próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Backspace: voltar para o input anterior se estiver vazio
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Paste: colar código completo
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        if (digits.length === 6) {
          const newCode = [...code]
          digits.forEach((digit, i) => {
            newCode[i] = digit
          })
          setCode(newCode)
          inputRefs.current[5]?.focus()
        }
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const codeString = code.join('')
    if (codeString.length !== 6) {
      setError('Por favor, preencha todos os 6 dígitos')
      return
    }

    setLoading(true)

    try {
      const result = await verifyEmail(email, codeString)

      if (result.success) {
        setSuccess(true)
        // Aguardar 2 segundos e verificar se precisa completar dados
        setTimeout(async () => {
          try {
            // Verificar se já existe pelo menos um cliente master com dados completos
            // userBaseId vem do token JWT
            const clinicsResult = await api.get(`/auth/get-client-token`)
            const clinics = clinicsResult.data?.data?.clientesMaster || []
            
            // Sempre redirecionar para seleção de consultório
            navigate('/select-clinic')
          } catch (error) {
            console.error('Erro ao verificar dados do cliente master:', error)
            // Em caso de erro, ir para seleção de consultório
            navigate('/select-clinic')
          }
        }, 2000)
      } else {
        setError(result.message || 'Código inválido. Tente novamente.')
        // Limpar código em caso de erro
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('Erro ao verificar email:', error)
      setError('Erro ao verificar código. Tente novamente.')
      // Limpar código em caso de erro
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setResending(true)

    try {
      const result = await resendVerificationCode(email)

      if (result.success) {
        setError('')
        showSuccess('Código reenviado com sucesso! Verifique seu e-mail.')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(result.message || 'Erro ao reenviar código. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao reenviar código:', error)
      setError('Erro ao reenviar código. Tente novamente.')
    } finally {
      setResending(false)
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
        <div className="auth-form-container" style={{ position: 'relative' }}>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Sair
          </button>
          <div className="auth-logo-right">
            <img src={nodoLogo} alt="NODON" className="auth-logo-animated" />
          </div>
          
          {success ? (
            <div className="auth-header-modern">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <FontAwesomeIcon 
                  icon={faCheckCircle} 
                  size="3x" 
                  style={{ color: '#10b981', marginBottom: '1rem' }} 
                />
                <h2>E-mail verificado com sucesso!</h2>
                <p>Redirecionando para a plataforma...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-header-modern">
                <h2>Verifique seu e-mail</h2>
                <p>Enviamos um código de 6 dígitos para <strong>{email}</strong></p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form-modern">
                {error && <div className="error-message-modern">{error}</div>}
                
                <div className="form-group-modern">
                  <label>Código de verificação</label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    justifyContent: 'center',
                    marginTop: '0.5rem'
                  }}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="code-input"
                        style={{
                          width: '50px',
                          height: '60px',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: '600',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#ffffff',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0ea5e9'
                          e.target.style.background = 'rgba(14, 165, 233, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="auth-button-modern" 
                  disabled={loading || code.join('').length !== 6}
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Verificar
                      <FontAwesomeIcon icon={faArrowRight} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                  Não recebeu o código?
                </p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0ea5e9',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                    fontSize: '0.875rem',
                    padding: '0.5rem'
                  }}
                >
                  {resending ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }} />
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar código'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Alerta */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  )
}

export default VerifyEmail

