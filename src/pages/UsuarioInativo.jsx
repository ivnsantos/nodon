import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserSlash, faLock, faArrowLeft, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './UsuarioInativo.css'

const UsuarioInativo = () => {
  const { user, selectedClinicData, selectedClinicId, loading: authLoading, logout, setSelectedClinicId, clearUserComumId } = useAuth()
  const navigate = useNavigate()
  const hasCheckedRef = useRef(false)
  const hasNavigatedRef = useRef(false)

  // Mostrar loading enquanto autenticação carrega
  if (authLoading) {
    return (
      <div className="usuario-inativo-page">
        <div style={{ 
          color: '#ffffff', 
          textAlign: 'center',
          padding: '2rem'
        }}>
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p style={{ marginTop: '1rem' }}>Carregando...</p>
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

  // Verificar relacionamento
  const relacionamento = selectedClinicData?.relacionamento
  const isInativo = relacionamento?.status === 'inativo'

  // Verificar periodicamente se o status mudou
  useEffect(() => {
    if (hasCheckedRef.current || hasNavigatedRef.current || !selectedClinicId) {
      return
    }

    const checkStatus = async () => {
      try {
        // Buscar dados atualizados do cliente master via POST com ID no header
        const response = await api.post('/clientes-master/complete', {}, {
          headers: {
            'X-Cliente-Master-Id': selectedClinicId
          }
        })
        const clinicData = response.data?.data || response.data
        
        if (clinicData?.relacionamento) {
          const newStatus = clinicData.relacionamento.status
          
          // Se o status mudou para ativo, redirecionar para o app
          if (newStatus === 'ativo') {
            hasNavigatedRef.current = true
            // Atualizar dados no contexto passando os dados já obtidos para evitar chamada duplicada
            // O setSelectedClinicId já cuida de salvar o relacionamento corretamente
            await setSelectedClinicId(selectedClinicId, clinicData)
            navigate('/app', { replace: true })
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }

    // Verificar a cada 10 segundos
    const interval = setInterval(() => {
      if (!hasNavigatedRef.current) {
        checkStatus()
      }
    }, 10000)

    // Primeira verificação após 5 segundos
    setTimeout(checkStatus, 5000)

    return () => {
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId])

  // Se não estiver inativo, redirecionar
  useEffect(() => {
    if (!isInativo && selectedClinicData && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      navigate('/app', { replace: true })
    }
  }, [isInativo, selectedClinicData, navigate])

  const handleVoltar = () => {
    clearUserComumId()
    navigate('/select-clinic', { replace: true })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="usuario-inativo-page">
      <div className="usuario-inativo-container">
        <div className="usuario-inativo-icon">
          <FontAwesomeIcon icon={faUserSlash} size="4x" />
        </div>
        
        <h1 className="usuario-inativo-title">Acesso Restrito</h1>
        
        <div className="usuario-inativo-message">
          <p className="message-primary">
            Seu acesso à plataforma está <strong>inativo</strong> no momento.
          </p>
          <p className="message-secondary">
            Entre em contato com o administrador da clínica para solicitar a ativação da sua conta.
          </p>
        </div>

        <div className="usuario-inativo-info">
          <div className="info-item">
            <FontAwesomeIcon icon={faLock} />
            <div>
              <strong>Status da Conta:</strong>
              <span className="status-badge-inativo">Inativo</span>
            </div>
          </div>
        </div>

        <div className="usuario-inativo-actions">
          <button 
            className="btn-voltar"
            onClick={handleVoltar}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Voltar para Seleção de Clínicas
          </button>
          <button 
            className="btn-logout"
            onClick={handleLogout}
          >
            Fazer Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default UsuarioInativo

