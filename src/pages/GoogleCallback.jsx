import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const GoogleCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Pegar parâmetros da URL
        const token = searchParams.get('token')
        const isNewUser = searchParams.get('isNewUser') === 'true'
        const userDataParam = searchParams.get('user')
        const errorParam = searchParams.get('error')

        // Verificar se houve erro
        if (errorParam) {
          setError(decodeURIComponent(errorParam))
          setProcessing(false)
          return
        }

        // Se é um novo usuário, redirecionar para registro (NÃO precisa de token)
        if (isNewUser) {
          // Passar dados do Google/Facebook para a página de registro via URL params
          const socialEmail = searchParams.get('email') || ''
          const socialName = searchParams.get('nome') || ''
          const googleId = searchParams.get('googleId') || ''
          const facebookId = searchParams.get('facebookId') || ''
          const socialFoto = searchParams.get('foto') || ''

          // Determinar se é Google ou Facebook
          const socialData = googleId 
            ? {
                googleData: {
                  googleId,
                  email: socialEmail,
                  nome: socialName,
                  foto: socialFoto
                }
              }
            : {
                facebookData: {
                  facebookId,
                  email: socialEmail,
                  nome: socialName,
                  foto: socialFoto
                }
              }

          navigate('/register', { state: socialData })
          return
        }

        // Verificar se tem token (só para usuários existentes)
        if (!token) {
          setError('Token não encontrado. Tente fazer login novamente.')
          setProcessing(false)
          return
        }

        // Usuário já existe - salvar token e dados do usuário
        sessionStorage.setItem('token', token)

        // Se veio dados do usuário na URL, usar
        if (userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam))
            sessionStorage.setItem('user', JSON.stringify(userData))
            setUser(userData)
          } catch (e) {
            console.error('Erro ao parsear dados do usuário:', e)
          }
        }

        // Redirecionar para seleção de clínica
        navigate('/select-clinic')
      } catch (err) {
        console.error('Erro no callback do Google:', err)
        setError('Erro ao processar login. Tente novamente.')
        setProcessing(false)
      }
    }

    processCallback()
  }, [searchParams, navigate, setUser])

  // Tela de loading/erro
  return (
    <div className="auth-container-modern">
      <div className="auth-right-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="auth-form-container">
          <div className="auth-header-modern">
            {processing ? (
              <>
                <h2>Processando login...</h2>
                <p>Aguarde enquanto validamos suas credenciais</p>
                <div style={{ 
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(14, 165, 233, 0.3)',
                    borderTopColor: '#0ea5e9',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </>
            ) : (
              <>
                <h2>Erro no login</h2>
                <div className="error-message-modern" style={{ marginTop: '1rem' }}>
                  {error}
                </div>
                <button 
                  className="auth-button-modern" 
                  style={{ marginTop: '2rem' }}
                  onClick={() => navigate('/login')}
                >
                  Voltar para o login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleCallback

