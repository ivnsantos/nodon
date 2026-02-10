import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faArrowRight, faXRay, faFileMedical, faSearch, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import './Auth.css'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validação básica de email
    const emailTrimmed = email.trim()
    if (!emailTrimmed) {
      setError('Por favor, digite um email válido')
      return
    }
    
    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      setError('Por favor, digite um email válido')
      return
    }
    
    setLoading(true)

    try {
      const requestBody = {
        email: emailTrimmed
      }
      
      const response = await api.post('/auth/forgot-password', requestBody)

      // A API pode retornar { message: "..." } ou { statusCode: 200, message: "..." }
      if (response.data?.message || response.status === 200 || response.data?.statusCode === 200) {
        setSuccess(true)
      } else {
        setError(response.data?.message || 'Erro ao enviar email de recuperação')
      }
    } catch (err) {
      console.error('Erro completo ao solicitar recuperação de senha:', err)
      console.error('Status HTTP:', err.response?.status)
      console.error('Dados da resposta:', err.response?.data)
      console.error('URL completa:', err.config?.baseURL + err.config?.url)
      console.error('Método:', err.config?.method?.toUpperCase())
      console.error('Body enviado:', err.config?.data)
      console.error('Headers enviados:', err.config?.headers)
      
      // Tratar diferentes tipos de erro
      if (err.response?.status === 400) {
        // Erro 400: Bad Request - provavelmente erro no envio do email
        const errorMessage = err.response?.data?.message || 'Erro ao enviar email de recuperação. Tente novamente mais tarde.'
        setError(errorMessage)
      } else if (err.response?.status === 404) {
        // Erro 404: Rota não encontrada
        setError('Rota não encontrada. Verifique se a API está configurada corretamente.')
      } else if (err.response?.status === 500) {
        // Erro 500: Erro interno do servidor
        setError('Erro interno do servidor. Tente novamente mais tarde.')
      } else if (!err.response) {
        // Erro de rede (sem resposta do servidor)
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        // Outros erros
        const errorMessage = err.response?.data?.message || 'Erro ao enviar email de recuperação. Tente novamente.'
        setError(errorMessage)
      }
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
          
          {!success ? (
            <>
              <div className="auth-header-modern">
                <h2>Esqueceu sua senha?</h2>
                <p>Digite seu email e enviaremos um link para redefinir sua senha</p>
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
                    autoFocus
                  />
                </div>

                <button type="submit" className="auth-button-modern" disabled={loading}>
                  {loading ? 'Enviando...' : (
                    <>
                      Enviar link de recuperação
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
              <div className="success-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <h2>Email enviado!</h2>
              <p>
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
              <p className="success-subtitle">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <p className="success-note">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
              </p>
              <div className="success-actions">
                <button 
                  className="auth-button-modern secondary" 
                  onClick={() => setSuccess(false)}
                >
                  Enviar novamente
                </button>
                <Link to="/login" className="auth-link">
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Voltar para o login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

