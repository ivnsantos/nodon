import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope, 
  faPhone, 
  faKey, 
  faArrowRight, 
  faArrowLeft,
  faCheckCircle,
  faXRay,
  faFileMedical,
  faSearch,
  faShieldAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import './Auth.css'

const ForgotPasswordPhone = () => {
  const navigate = useNavigate()
  
  // Estado da etapa atual (1, 2 ou 3)
  const [step, setStep] = useState(1)
  
  // Etapa 1: Solicitar recuperação
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  
  // Etapa 2: Validar código
  const [code, setCode] = useState('')
  const [codeValidated, setCodeValidated] = useState(false)
  
  // Etapa 3: Redefinir senha
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Estados gerais
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Formatar telefone com máscara +55 (XX) XXXXX-XXXX
  const formatPhoneDisplay = (phone) => {
    if (!phone || phone.length === 0) {
      return ''
    }
    
    // Remove tudo exceto números
    const numbers = phone.replace(/\D/g, '')
    
    // Se começar com 55, remove para não duplicar
    let cleaned = numbers.startsWith('55') ? numbers.slice(2) : numbers
    
    // Limita a 11 dígitos (DDD + número)
    cleaned = cleaned.slice(0, 11)
    
    // Aplica máscara
    if (cleaned.length === 0) {
      return ''
    } else if (cleaned.length <= 2) {
      return `+55 (${cleaned}`
    } else if (cleaned.length <= 7) {
      return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    } else {
      return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
  }

  // Formatar telefone para envio (apenas números com +55)
  const formatPhoneForAPI = (phone) => {
    const numbers = phone.replace(/\D/g, '')
    // Se já começar com 55, mantém; senão adiciona
    if (numbers.startsWith('55')) {
      return numbers
    }
    return '55' + numbers
  }

  // Validação de telefone brasileiro
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    // Remove o 55 se estiver no início para validar apenas DDD + número
    const withoutCountryCode = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned
    // Telefone brasileiro: 10 ou 11 dígitos (com DDD)
    return withoutCountryCode.length >= 10 && withoutCountryCode.length <= 11
  }

  // Etapa 1: Solicitar recuperação
  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const emailTrimmed = email.trim()
    const phoneCleaned = formatPhoneForAPI(telefone)
    
    // Validações
    if (!emailTrimmed) {
      setError('Por favor, digite seu email')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      setError('Por favor, digite um email válido')
      return
    }
    
    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
      setError('Por favor, digite seu telefone')
      return
    }
    
    if (!validatePhone(telefone)) {
      setError('Por favor, digite um telefone válido (com DDD)')
      return
    }
    
    setLoading(true)

    try {
      const response = await api.post('/auth/forgot-password-phone', {
        email: emailTrimmed,
        telefone: phoneCleaned
      })

      if (response.data?.statusCode === 200 || response.data?.statusCode === 201 || response.status === 200 || response.status === 201) {
        setSuccess('Código enviado!. Verifique sua mensagem.')
        setStep(2)
        setCountdown(900) // 15 minutos em segundos
        startCountdown()
      } else {
        setError(response.data?.message || 'Erro ao enviar código')
      }
    } catch (err) {
      console.error('Erro ao solicitar recuperação:', err)
      // Por segurança, sempre mostrar mensagem genérica
      setSuccess('Se o email e telefone estiverem cadastrados, você receberá um código via WhatsApp.')
      setStep(2)
      setCountdown(900)
      startCountdown()
    } finally {
      setLoading(false)
    }
  }

  // Contador regressivo
  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Etapa 2: Validar código
  const handleValidateCode = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!code || code.length !== 6) {
      setError('Por favor, digite o código de 6 dígitos')
      return
    }
    
    const phoneCleaned = formatPhoneForAPI(telefone)
    
    setLoading(true)

    try {
      const response = await api.post('/auth/validate-password-reset-code', {
        code: code.trim(),
        telefone: phoneCleaned
      })

      if ((response.data?.statusCode === 200 || response.data?.statusCode === 201 || response.status === 200 || response.status === 201) && response.data?.data?.valid) {
        setCodeValidated(true)
        setSuccess('Código válido! Agora você pode redefinir sua senha.')
        setTimeout(() => {
          setStep(3)
          setSuccess('')
        }, 1500)
      } else {
        setError(response.data?.message || 'Código inválido')
      }
    } catch (err) {
      console.error('Erro ao validar código:', err)
      const errorMessage = err.response?.data?.message || 'Código inválido ou expirado'
      setError(errorMessage)
      
      if (errorMessage.includes('expirado')) {
        setCountdown(0)
      }
    } finally {
      setLoading(false)
    }
  }

  // Etapa 3: Redefinir senha
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!newPassword) {
      setError('Por favor, digite a nova senha')
      return
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    const phoneCleaned = formatPhoneForAPI(telefone)
    
    setLoading(true)

    try {
      const response = await api.post('/auth/reset-password-with-code', {
        code: code.trim(),
        telefone: phoneCleaned,
        newPassword: newPassword
      })

      if (response.data?.statusCode === 200 || response.data?.statusCode === 201 || response.status === 200 || response.status === 201) {
        setSuccess('Senha redefinida com sucesso! Redirecionando para o login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(response.data?.message || 'Erro ao redefinir senha')
      }
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      const errorMessage = err.response?.data?.message || 'Erro ao redefinir senha. Tente novamente.'
      setError(errorMessage)
      
      if (errorMessage.includes('inválido') || errorMessage.includes('expirado')) {
        setStep(2)
        setCodeValidated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setCode('')
      setCodeValidated(false)
      setCountdown(0)
    } else if (step === 3) {
      setStep(2)
      setNewPassword('')
      setConfirmPassword('')
    }
    setError('')
    setSuccess('')
  }

  const handleResendCode = async () => {
    if (countdown > 0) return
    
    setError('')
    setLoading(true)
    
    try {
      const phoneCleaned = formatPhoneForAPI(telefone)
      const emailTrimmed = email.trim()
      
      await api.post('/auth/forgot-password-phone', {
        email: emailTrimmed,
        telefone: phoneCleaned
      })
      
      setSuccess('Novo código enviado via WhatsApp!')
      setCountdown(900)
      startCountdown()
    } catch (err) {
      setError('Erro ao reenviar código. Tente novamente.')
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
            Recuperação de senha via WhatsApp
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <span>Segurança garantida</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faPhone} />
              </div>
              <span>Código via WhatsApp</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <span>Código válido por 15 minutos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="auth-logo-right">
            <img src={nodoLogo} alt="NODON" className="auth-logo-animated" />
          </div>

          {/* Indicador de etapas */}
          <div className="steps-indicator">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">{step > 1 ? <FontAwesomeIcon icon={faCheckCircle} /> : '1'}</div>
              <span>Solicitar</span>
            </div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">{step > 2 ? <FontAwesomeIcon icon={faCheckCircle} /> : '2'}</div>
              <span>Validar</span>
            </div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>Redefinir</span>
            </div>
          </div>

          <div className="auth-header-modern">
            {step === 1 && (
              <>
                <h2>Recuperar Senha</h2>
                <p>Informe seu email e telefone para receber o código</p>
              </>
            )}
            {step === 2 && (
              <>
                <h2>Validar Código</h2>
                <p>Digite o código recebido via WhatsApp</p>
              </>
            )}
            {step === 3 && (
              <>
                <h2>Nova Senha</h2>
                <p>Digite sua nova senha</p>
              </>
            )}
          </div>

          {error && <div className="error-message-modern">{error}</div>}
          {success && <div className="success-message-modern">{success}</div>}

          {/* Etapa 1: Solicitar recuperação */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="auth-form-modern">
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
                  disabled={loading}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="telefone">
                  <FontAwesomeIcon icon={faPhone} /> Telefone (com DDD)
                </label>
                <input
                  type="tel"
                  id="telefone"
                  value={formatPhoneDisplay(telefone)}
                  onChange={(e) => {
                    // Remove a máscara para armazenar apenas números
                    const numbers = e.target.value.replace(/\D/g, '')
                    // Remove o 55 se estiver no início (será adicionado na formatação)
                    const withoutCountryCode = numbers.startsWith('55') ? numbers.slice(2) : numbers
                    // Limita a 11 dígitos (DDD + número)
                    setTelefone(withoutCountryCode.slice(0, 11))
                  }}
                  required
                  placeholder="+55 (11) 99999-9999"
                  disabled={loading}
                  maxLength={18}
                />
                <small className="form-hint">O código +55 será adicionado automaticamente</small>
              </div>

              <button 
                type="submit" 
                className="btn-primary-modern"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Código
                    <FontAwesomeIcon icon={faArrowRight} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Etapa 2: Validar código */}
          {step === 2 && (
            <form onSubmit={handleValidateCode} className="auth-form-modern">
              <div className="form-group-modern">
                <label htmlFor="code">
                  <FontAwesomeIcon icon={faKey} /> Código de 6 dígitos
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(value)
                  }}
                  required
                  placeholder="123456"
                  disabled={loading || codeValidated}
                  maxLength={6}
                  className="code-input"
                  autoFocus
                />
                {countdown > 0 && (
                  <div className="countdown-timer">
                    <FontAwesomeIcon icon={faClock} />
                    Código expira em: {formatCountdown(countdown)}
                  </div>
                )}
                {countdown === 0 && !codeValidated && (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="resend-code-btn"
                    disabled={loading}
                  >
                    Reenviar código
                  </button>
                )}
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary-modern"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Voltar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-modern"
                  disabled={loading || codeValidated}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Validando...
                    </>
                  ) : codeValidated ? (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Válido
                    </>
                  ) : (
                    <>
                      Validar Código
                      <FontAwesomeIcon icon={faArrowRight} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Etapa 3: Redefinir senha */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="auth-form-modern">
              <div className="form-group-modern">
                <label htmlFor="newPassword">
                  <FontAwesomeIcon icon={faKey} /> Nova Senha
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="form-group-modern">
                <label htmlFor="confirmPassword">
                  <FontAwesomeIcon icon={faKey} /> Confirmar Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Digite a senha novamente"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary-modern"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Voltar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary-modern"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      Redefinir Senha
                      <FontAwesomeIcon icon={faArrowRight} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer-modern">
            <Link to="/login" className="back-to-login-link">
              <FontAwesomeIcon icon={faArrowLeft} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPhone

