import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faClock, faCheckCircle, faSpinner, faCreditCard,
  faExclamationTriangle, faArrowRight, faArrowLeft
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import './AssinaturaPendente.css'

const AssinaturaPendente = () => {
  const { user, refreshUser, loading: authLoading, selectedClinicId, selectedClinicData } = useAuth()
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(false)
  const [checkAttempt, setCheckAttempt] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Aguardando confirmação do pagamento...')
  const hasCheckedRef = useRef(false)
  const hasNavigatedRef = useRef(false)

  // Obter assinatura do selectedClinicData ou do user
  const assinatura = selectedClinicData?.assinatura || user?.assinatura
  const plano = assinatura?.plano

  // Mostrar loading enquanto autenticação carrega
  if (authLoading) {
    return (
      <div className="assinatura-pendente-page">
        <div style={{ 
          color: '#ffffff', 
          textAlign: 'center',
          padding: '2rem'
        }}>
          Carregando...
        </div>
      </div>
    )
  }

  // Se não houver usuário, redirecionar
  if (!user) {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      navigate('/login', { replace: true })
    }
    return null
  }

  useEffect(() => {
    // Evitar múltiplas verificações
    if (hasCheckedRef.current || hasNavigatedRef.current) {
      return
    }

    // Verificar se realmente está pendente
    if (!selectedClinicId) {
      // Se não tiver cliente master selecionado, redirecionar para seleção
      hasNavigatedRef.current = true
      navigate('/select-clinic', { replace: true })
      return
    }

    // Verificar status da assinatura
    const assinaturaStatus = assinatura?.status
    
    // Se a assinatura estiver ativa, redirecionar para o app
    if (assinaturaStatus === 'ACTIVE') {
      hasCheckedRef.current = true
      hasNavigatedRef.current = true
      navigate('/app', { replace: true })
      return
    }

    // Se não estiver pendente e não estiver ativa, manter na página
    // Iniciar verificação automática apenas uma vez
    if (!isChecking && assinaturaStatus === 'PENDING') {
      hasCheckedRef.current = true
      checkPaymentStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId])

  const checkPaymentStatus = async () => {
    setIsChecking(true)
    setCheckAttempt(0)
    setStatusMessage('Verificando status do pagamento...')

    const maxAttempts = 2 // 2 tentativas
    const interval = 5000 // 5 segundos entre tentativas
    let attempts = 0

    const check = async () => {
      attempts++
      setCheckAttempt(attempts)
      setStatusMessage(`Verificando pagamento... (Tentativa ${attempts}/${maxAttempts})`)

      try {
        // Primeiro verificar na Asaas e atualizar o banco, depois buscar do banco
        // Endpoint que verifica na Asaas primeiro e atualiza o banco
        const response = await api.get('/assinaturas/minha?sync=true')
        const assinatura = response.data

        // Verificar status da assinatura (já atualizado pela Asaas)
        if (assinatura?.status === 'ACTIVE') {
          setStatusMessage('Pagamento confirmado! Redirecionando...')
          
          // Atualizar usuário no contexto
          await refreshUser()
          
          // Marcar como navegado para evitar loops
          hasNavigatedRef.current = true
          
          // Aguardar um pouco antes de redirecionar
          setTimeout(() => {
            navigate('/app', { replace: true })
          }, 2000)
          return
        }

        if (attempts >= maxAttempts) {
          setStatusMessage('Aguardando confirmação do pagamento. Você pode fechar esta página e retornar mais tarde.')
          setIsChecking(false)
          return
        }

        // Continuar verificando
        setTimeout(check, interval)
      } catch (error) {
        console.error('Erro ao verificar status:', error)
        
        if (attempts >= maxAttempts) {
          setStatusMessage('Erro ao verificar pagamento. Tente fazer login novamente mais tarde.')
          setIsChecking(false)
          return
        }

        // Continuar mesmo com erro
        setTimeout(check, interval)
      }
    }

    // Primeira verificação após 5 segundos
    setTimeout(check, interval)
  }

  const handleManualCheck = () => {
    checkPaymentStatus()
  }


  return (
    <div className="assinatura-pendente-page">
      <button
        onClick={() => navigate('/select-clinic')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
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
        <FontAwesomeIcon icon={faArrowLeft} />
        Voltar
      </button>
      <div className="assinatura-pendente-container">
        <div className="assinatura-pendente-header">
          <img src={nodoLogo} alt="NODON" className="assinatura-pendente-logo" />
          <h1>NODON</h1>
        </div>

        <div className="assinatura-pendente-card">
          <div className="assinatura-pendente-icon">
            <FontAwesomeIcon icon={faClock} />
          </div>

          <h2>Assinatura Pendente</h2>
          
          <p className="assinatura-pendente-description">
            Estamos aguardando a confirmação do seu pagamento. 
            Assim que o pagamento for confirmado, você terá acesso completo à plataforma.
          </p>

          {plano ? (
            <div className="assinatura-pendente-plano-info">
              <div className="plano-info-item">
                <span className="plano-info-label">Plano:</span>
                <span className="plano-info-value">{plano.nome || 'N/A'}</span>
              </div>
              <div className="plano-info-item">
                <span className="plano-info-label">Valor:</span>
                <span className="plano-info-value">
                  R$ {plano.valorPromocional || plano.valorOriginal || '0,00'}
                  {plano.valorPromocional && (
                    <span className="plano-info-old-price"> (De: R$ {plano.valorOriginal})</span>
                  )}
                </span>
              </div>
              {plano.descricao && (
                <div className="plano-info-item">
                  <span className="plano-info-label">Descrição:</span>
                  <span className="plano-info-value">{plano.descricao}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="assinatura-pendente-plano-info">
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                Informações do plano serão exibidas em breve.
              </p>
            </div>
          )}

          {isChecking && (
            <div className="assinatura-pendente-checking">
              <div className="checking-loader">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
              <p className="checking-status">{statusMessage}</p>
              {checkAttempt > 0 && (
                <div className="checking-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(checkAttempt / 2) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">Tentativa {checkAttempt} de 2</span>
                </div>
              )}
            </div>
          )}

          {!isChecking && (
            <div className="assinatura-pendente-actions">
              <button 
                className="btn-check-again"
                onClick={handleManualCheck}
              >
                <FontAwesomeIcon icon={faCreditCard} />
                Verificar Novamente
              </button>
             
            </div>
          )}

          <div className="assinatura-pendente-info">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <p>
              Esta página será atualizada automaticamente quando o pagamento for confirmado. 
              Você pode fechar esta página e retornar mais tarde.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssinaturaPendente

