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
  const isNavigatingRef = useRef(false)

  // Obter assinatura do cliente master selecionado ou do usuário
  const clienteMaster = selectedClinicData?.clienteMaster || selectedClinicData
  const assinatura = selectedClinicData?.assinatura || user?.assinatura
  const plano = assinatura?.plano || selectedClinicData?.plano

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
    if (!isNavigatingRef.current) {
      isNavigatingRef.current = true
      navigate('/login', { replace: true })
    }
    return null
  }

  useEffect(() => {
    // Evitar múltiplas verificações
    if (hasCheckedRef.current || isNavigatingRef.current) {
      return
    }

    // Se não tiver cliente master selecionado, não verificar
    if (!selectedClinicId) {
      return
    }

    // Verificar se realmente está pendente
    const assinaturaStatus = assinatura?.status
    
    // Se a assinatura estiver ativa, redirecionar para o app
    if (assinaturaStatus === 'ACTIVE') {
      hasCheckedRef.current = true
      isNavigatingRef.current = true
      navigate('/app', { replace: true })
      return
    }

    // Se não estiver pendente e não estiver ativa, manter na página
    if (assinaturaStatus !== 'PENDING') {
      return
    }

    // Iniciar verificação automática apenas uma vez
    if (!isChecking && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      checkPaymentStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId, assinatura?.status])

  const checkPaymentStatus = async () => {
    if (isNavigatingRef.current) {
      return
    }

    setIsChecking(true)
    setCheckAttempt(0)
    setStatusMessage('Verificando status do pagamento...')

    const maxAttempts = 2 // 2 tentativas
    const interval = 5000 // 5 segundos entre tentativas
    let attempts = 0

    const check = async () => {
      if (isNavigatingRef.current) {
        return
      }

      attempts++
      setCheckAttempt(attempts)
      setStatusMessage(`Verificando pagamento... (Tentativa ${attempts}/${maxAttempts})`)

      try {
        // Buscar dados completos do cliente master para verificar assinatura atualizada
        if (!selectedClinicId) {
          setIsChecking(false)
          return
        }

        const response = await api.get(`/clientes-master/${selectedClinicId}/complete`)
        const clinicCompleteData = response.data?.data || response.data
        
        if (!clinicCompleteData) {
          setIsChecking(false)
          return
        }

        // Verificar assinatura do cliente master
        const assinaturaStatus = clinicCompleteData?.assinatura?.status
        const clienteMaster = clinicCompleteData.clienteMaster || clinicCompleteData
        const clienteMasterAtivo = clienteMaster?.ativo !== false && clienteMaster?.status !== 'INACTIVE'

        // Se assinatura estiver ativa e cliente master estiver ativo, redirecionar
        if (assinaturaStatus === 'ACTIVE' && clienteMasterAtivo) {
          setStatusMessage('Pagamento confirmado! Redirecionando...')
          
          // Atualizar usuário no contexto
          await refreshUser()
          
          // Marcar que está navegando para evitar loops
          isNavigatingRef.current = true
          
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
    // Resetar flags para permitir nova verificação manual
    hasCheckedRef.current = false
    isNavigatingRef.current = false
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

