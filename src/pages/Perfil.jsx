import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, faEnvelope, faIdCard, faCreditCard, faCrown,
  faCoins, faChartLine, faCalendar, faShieldAlt, faEdit,
  faCheckCircle, faUsers, faSpinner, faFileAlt, faHeadset,
  faUserMd, faCopy, faLink, faToggleOn, faToggleOff, faGraduationCap, faPhone, faImage, faPlus
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Perfil.css'

const Perfil = () => {
  const { user, selectedClinicData, selectedClinicId, isClienteMaster, getRelacionamento, planoAcesso } = useAuth()
  const navigate = useNavigate()
  const { alertConfig, showError, hideAlert } = useAlert()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('perfil') // 'perfil' ou 'usuarios'
  
  // Estados para aba de Usuários
  const [usuariosList, setUsuariosList] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [errorUsuarios, setErrorUsuarios] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [copied, setCopied] = useState(false)

  // Função auxiliar para formatar data sem problemas de fuso horário
  const formatarDataLocal = (dateString) => {
    if (!dateString) return ''
    
    try {
      // Se a data vem no formato YYYY-MM-DD, parsear diretamente
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
        // Criar data local (sem conversão de timezone)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
      
      // Fallback para outros formatos
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return ''
    }
  }

  // Função para abrir WhatsApp de suporte
  const handleSuporteWhatsApp = () => {
    const phoneNumber = '5511932589622' // Número com código do país (55 = Brasil)
    const message = encodeURIComponent('Olá! Preciso de suporte da NODON.')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  // Verificar se tokens estão em 100% (vermelho)
  const isTokensAtLimit = () => {
    return tokensChat.porcentagemUso >= 100
  }

  // Verificar se tokens estão acima de 85% mas abaixo de 100% (laranja)
  const isTokensCritical = () => {
    return tokensChat.porcentagemUso >= 85 && tokensChat.porcentagemUso < 100
  }

  // Verificar se tokens estão acima de 95% (para animação de piscar)
  const isTokensPulsing = () => {
    return tokensChat.porcentagemUso >= 95
  }

  // Verificar se análises estão em 100% (vermelho)
  const isAnalisesAtLimit = () => {
    return analises.porcentagemUso >= 100
  }

  // Verificar se análises estão acima de 85% mas abaixo de 100% (laranja)
  const isAnalisesCritical = () => {
    return analises.porcentagemUso >= 85 && analises.porcentagemUso < 100
  }

  // Verificar se análises estão acima de 95% (para animação de piscar)
  const isAnalisesPulsing = () => {
    return analises.porcentagemUso >= 95
  }
  const [tokensChat, setTokensChat] = useState({
    tokensUtilizados: 0,
    tokensUtilizadosMes: 0,
    limitePlano: 0,
    porcentagemUso: 0,
    ultimaAtualizacao: null
  })
  const [analises, setAnalises] = useState({
    analisesFeitas: 0,
    analisesFeitasMes: 0,
    analisesRestantes: 0,
    limitePlano: 0,
    porcentagemUso: 0
  })
  const [assinatura, setAssinatura] = useState(null)
  const [cartao, setCartao] = useState(null)
  const [usuarios, setUsuarios] = useState(null)

  useEffect(() => {
    loadPerfilData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicData])

  useEffect(() => {
    if (activeTab === 'usuarios' && selectedClinicId && isMaster) {
      fetchUsuarios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedClinicId])

  const loadPerfilData = async () => {
    try {
      setLoading(true)
      
      let assinaturaFromClinic = null
      
      // Buscar dados do dashboard da API (sempre usar API para dados atualizados)
      const response = await api.get('/assinaturas/dashboard')
      // A API retorna { statusCode: 200, message: "Success", data: { ... } }
      // Os dados estão em response.data.data
      const data = response.data?.data || response.data

      // Mapear dados de tokens
      if (data.tokensChat) {
        setTokensChat({
          tokensUtilizados: data.tokensChat.tokensUtilizados || 0,
          tokensUtilizadosMes: data.tokensChat.tokensUtilizadosMes || 0,
          limitePlano: data.tokensChat.limitePlano || 0,
          porcentagemUso: data.tokensChat.porcentagemUso || 0,
          ultimaAtualizacao: data.tokensChat.ultimaAtualizacao
        })
      }

      // Mapear dados de análises
      if (data.analises) {
        const limitePlano = Number(data.analises.limitePlano) || 0
        const analisesFeitasMes = Number(data.analises.analisesFeitasMes) || 0
        // Calcular porcentagem localmente baseado em analisesFeitasMes / limitePlano
        const porcentagemUso = limitePlano > 0 
          ? Math.round((analisesFeitasMes / limitePlano) * 100 * 10) / 10
          : 0
        
        console.log('=== ANÁLISES DEBUG ===')
        console.log('limitePlano:', limitePlano)
        console.log('analisesFeitasMes:', analisesFeitasMes)
        console.log('porcentagemUso calculada:', porcentagemUso)
        console.log('isAnalisesAtLimit:', porcentagemUso >= 100)
        console.log('isAnalisesCritical:', porcentagemUso >= 85 && porcentagemUso < 100)
        console.log('isAnalisesPulsing:', porcentagemUso >= 95)
        
        setAnalises({
          analisesFeitas: data.analises.analisesFeitas || 0,
          analisesFeitasMes: analisesFeitasMes,
          analisesRestantes: data.analises.analisesRestantes || 0,
          limitePlano: limitePlano,
          porcentagemUso: porcentagemUso
        })
      }

      // Mapear dados de assinatura (sempre usar dados da API que são mais atualizados)
      // A API retorna: { status, valorMensal, dataInicio, proximaRenovacao, nextDueDate }
      // Estrutura: response.data.data.assinatura
      if (data?.assinatura) {
        const assinaturaFromAPI = data.assinatura
        setAssinatura({
          status: assinaturaFromAPI.status,
          valorMensal: assinaturaFromAPI.valorMensal,
          proximaRenovacao: assinaturaFromAPI.proximaRenovacao,
          nextDueDate: assinaturaFromAPI.nextDueDate
        })
      } else if (isClienteMaster() && selectedClinicData?.assinatura) {
        // Fallback: usar dados do selectedClinicData se API não retornar
        const assinaturaData = selectedClinicData.assinatura
        const planoData = selectedClinicData.plano
        
        setAssinatura({
          status: assinaturaData.status,
          valorMensal: assinaturaData.valorMensal || assinaturaData.value || planoData?.valorPromocional || planoData?.valorOriginal || 0,
          proximaRenovacao: assinaturaData.proximaRenovacao,
          nextDueDate: assinaturaData.nextDueDate
        })
      } else {
        setAssinatura(null)
      }

      // Mapear dados de cartão
      if (data.cartao) {
        setCartao({
          bandeira: data.cartao.bandeira,
          ultimosDigitos: data.cartao.ultimos4Digitos,
          numeroMascarado: data.cartao.numeroMascarado
        })
      } else {
        setCartao(null)
      }

      // Mapear dados de usuários (apenas para master)
      if (data.usuarios) {
        setUsuarios({
          quantidade: data.usuarios.quantidade || 0
        })
      } else {
        setUsuarios(null)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error)
      // Em caso de erro, manter valores padrão
      setTokensChat({
        tokensUtilizados: 0,
        tokensUtilizadosMes: 0,
        limitePlano: 0,
        porcentagemUso: 0,
        ultimaAtualizacao: null
      })
      setAnalises({
        analisesFeitas: 0,
        analisesFeitasMes: 0,
        analisesRestantes: 0,
        limitePlano: 0,
        porcentagemUso: 0
      })
      setAssinatura(null)
      setCartao(null)
      setUsuarios(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="perfil-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: '#ffffff'
        }}>
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        </div>
      </div>
    )
  }

  // Buscar relacionamento para determinar o tipo
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Verificar se o acesso do plano é "chat" - se for, não mostrar análises
  const acessoPlano = planoAcesso || selectedClinicData?.relacionamento?.acesso || selectedClinicData?.plano?.acesso || null
  const isPlanoChat = acessoPlano === 'chat'

  // Obter hash do cliente master para link de convite
  const clienteMaster = selectedClinicData?.clienteMaster || selectedClinicData
  const hash = clienteMaster?.hash
  const inviteUrl = hash ? `${window.location.origin}/profissional/${hash}` : null

  // Funções para aba de Usuários
  const fetchUsuarios = async () => {
    if (!selectedClinicId) {
      setErrorUsuarios('Cliente Master não selecionado')
      setLoadingUsuarios(false)
      return
    }

    try {
      setLoadingUsuarios(true)
      setErrorUsuarios('')
      const response = await api.get(`/clientes-master/${selectedClinicId}/usuarios`)
      
      if (response.data.statusCode === 200) {
        const usuariosData = response.data.data?.usuarios || response.data.usuarios || []
        setUsuariosList(usuariosData)
      } else {
        setErrorUsuarios('Erro ao buscar usuários')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setErrorUsuarios(error.response?.data?.message || 'Erro ao buscar usuários. Tente novamente.')
    } finally {
      setLoadingUsuarios(false)
    }
  }

  const handleToggleStatus = async (usuarioId, currentStatus) => {
    if (!usuarioId) return

    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo'

    setUpdatingStatus(prev => ({ ...prev, [usuarioId]: true }))

    try {
      const response = await api.patch(`/clientes-master/usuarios/${usuarioId}/status`, {
        status: newStatus
      })

      if (response.data.statusCode === 200 || response.status === 200) {
        const updatedUsuario = response.data.usuario || response.data.data?.usuario
        setUsuariosList(prev => prev.map(usuario => 
          usuario.id === usuarioId 
            ? { 
                ...usuario, 
                status: updatedUsuario?.status || newStatus,
                ativo: updatedUsuario?.ativo !== undefined ? updatedUsuario.ativo : (newStatus === 'ativo')
              }
            : usuario
        ))
      } else {
        setErrorUsuarios('Erro ao alterar status do usuário')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      setErrorUsuarios(error.response?.data?.message || 'Erro ao alterar status. Tente novamente.')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [usuarioId]: false }))
    }
  }

  const handleCopyUrl = async () => {
    if (!inviteUrl) return
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar URL:', error)
      const textArea = document.createElement('textarea')
      textArea.value = inviteUrl
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Erro ao copiar:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="perfil-page">
      {/* Header com Avatar */}
      <div className="perfil-header-section">
        <div className="perfil-avatar-container">
          <div className="perfil-avatar">
            {user?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="avatar-badge">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
        </div>
        <div className="perfil-header-info">
          <h1>{user?.nome || 'Usuário'}</h1>
          <p className="perfil-email">{user?.email || 'Não informado'}</p>
          <span className="user-type-badge-large">
            {relacionamento?.tipo === 'clienteMaster' ? 'Cliente Master' : 
             relacionamento?.tipo === 'usuario' ? 'Usuário' : 
             user?.tipo === 'master' ? 'Cliente Master' : 'Usuário'}
          </span>
        </div>
        <div className="perfil-header-actions">
          {isMaster && selectedClinicData?.assinatura?.status === 'ACTIVE' && (
            <button className="perfil-plan-badge-btn">
              <FontAwesomeIcon icon={faCrown} />
              PLANO ATIVO
            </button>
          )}
          <button 
            className="btn-suporte-whatsapp"
            onClick={handleSuporteWhatsApp}
            title="Falar com suporte via WhatsApp"
          >
            <FontAwesomeIcon icon={faWhatsapp} /> Suporte
          </button>
          {/* {isMaster && (
            <button 
              className="btn-edit-perfil"
              onClick={() => navigate('/complete-master-data')}
            >
              <FontAwesomeIcon icon={faEdit} /> Editar Perfil
            </button>
          )} */}
        </div>
      </div>

      {/* Tabs */}
      {isMaster && (
        <div className="perfil-tabs">
          <button
            className={`perfil-tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Perfil</span>
          </button>
          <button
            className={`perfil-tab-button ${activeTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            <FontAwesomeIcon icon={faUsers} />
            <span>Usuários</span>
          </button>
        </div>
      )}

      <div className="perfil-content">
        {activeTab === 'perfil' ? (
          <>
        {/* Uso de Tokens - Apenas para ClienteMaster */}
        {isMaster && (
        <div className="perfil-card token-card">
          <div className="card-header">
            <h2>
              <FontAwesomeIcon icon={faCoins} /> Uso de Tokens do Chat
            </h2>
          </div>
          <div className="card-body">
            <div className="token-stats">
              <div className="token-main-stat">
                <div className="token-icon">
                  <FontAwesomeIcon icon={faCoins} />
                </div>
                <div className="token-info">
                  <div className={`token-value ${isTokensAtLimit() ? 'at-limit' : isTokensCritical() ? 'critical' : ''} ${isTokensPulsing() ? 'pulsing' : ''}`}>
                    {tokensChat.tokensUtilizadosMes.toLocaleString('pt-BR')}
                  </div>
                  <div className="token-label">Tokens Utilizados</div>
                </div>
              </div>
              <div className="token-details">
                <div className="token-detail-item">
                  <FontAwesomeIcon icon={faChartLine} />
                  <span>Este mês: {tokensChat.tokensUtilizadosMes.toLocaleString('pt-BR')} tokens</span>
                </div>
                <div className="token-detail-item">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>
                    Última atualização: {
                      tokensChat.ultimaAtualizacao 
                        ? new Date(tokensChat.ultimaAtualizacao).toLocaleDateString('pt-BR')
                        : 'Nunca'
                    }
                  </span>
                </div>
              </div>
              
              {/* Barra de Progresso */}
              {tokensChat.limitePlano > 0 && (
                <div className="token-progress-section">
                  <div className="token-progress-header">
                    <span className="progress-label">Uso no período</span>
                    <span className="progress-value">
                      {tokensChat.tokensUtilizadosMes.toLocaleString('pt-BR')} / {tokensChat.limitePlano.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="token-progress-bar">
                    <div 
                      className={`token-progress-fill ${isTokensAtLimit() ? 'at-limit' : isTokensCritical() ? 'critical' : ''} ${isTokensPulsing() ? 'pulsing' : ''}`}
                      style={{ width: `${Math.min(tokensChat.porcentagemUso, 100)}%` }}
                    ></div>
                  </div>
                  <div className={`token-progress-percent ${isTokensAtLimit() ? 'at-limit' : isTokensCritical() ? 'critical' : ''} ${isTokensPulsing() ? 'pulsing' : ''}`}>
                    {tokensChat.porcentagemUso.toFixed(1)}% utilizado
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Análises - Apenas para ClienteMaster, quando acesso não for "chat" e limitePlano > 0 */}
        {isMaster && !isPlanoChat && analises.limitePlano > 0 && (
          <div className="perfil-card analises-card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faFileAlt} /> Análises
              </h2>
            </div>
            <div className="card-body">
              <div className="token-stats">
                <div className="token-main-stat">
                  <div className="token-icon">
                    <FontAwesomeIcon icon={faFileAlt} />
                  </div>
                  <div className="token-info">
                    <div className={`token-value ${isAnalisesAtLimit() ? 'at-limit' : isAnalisesCritical() ? 'critical' : ''} ${isAnalisesPulsing() ? 'pulsing' : ''}`}>{analises.analisesFeitas.toLocaleString('pt-BR')}</div>
                    <div className="token-label">Análises Realizadas</div>
                  </div>
                </div>
                <div className="token-details">
                  <div className="token-detail-item">
                    <FontAwesomeIcon icon={faChartLine} />
                    <span>Este mês: {analises.analisesFeitasMes.toLocaleString('pt-BR')} análises</span>
                  </div>
                  <div className="token-detail-item">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Restantes: {analises.analisesRestantes.toLocaleString('pt-BR')} análises</span>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                {analises.limitePlano > 0 && (
                  <div className="token-progress-section">
                    <div className="token-progress-header">
                      <span className="progress-label">Uso no período</span>
                      <span className="progress-value">
                        {analises.analisesFeitasMes.toLocaleString('pt-BR')} / {analises.limitePlano.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="token-progress-bar">
                      <div 
                        className={`token-progress-fill ${isAnalisesAtLimit() ? 'at-limit' : isAnalisesCritical() ? 'critical' : ''} ${isAnalisesPulsing() ? 'pulsing' : ''}`}
                        style={{ 
                          width: `${Math.min(Math.max(analises.porcentagemUso || 0, 0), 100)}%`,
                          minWidth: analises.porcentagemUso > 0 ? '2px' : '0px'
                        }}
                      ></div>
                    </div>
                    <div className={`token-progress-percent ${isAnalisesAtLimit() ? 'at-limit' : isAnalisesCritical() ? 'critical' : ''} ${isAnalisesPulsing() ? 'pulsing' : ''}`}>
                      {analises.porcentagemUso ? analises.porcentagemUso.toFixed(1) : '0.0'}% utilizado
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informações Pessoais */}
        <div className="perfil-card info-pessoais-card">
          <div className="card-header">
            <h2>
              <FontAwesomeIcon icon={faUser} /> Informações Pessoais
            </h2>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-row">
                <div className="info-label">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Nome Completo</span>
                </div>
                <div className="info-value">{user?.nome || 'Não informado'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Email</span>
                </div>
                <div className="info-value">{user?.email || 'Não informado'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">
                  <FontAwesomeIcon icon={faIdCard} />
                  <span>Tipo de Usuário</span>
                </div>
                <div className="info-value">
                  <span className="user-type-badge">
                    {relacionamento?.tipo === 'clienteMaster' ? 'Cliente Master' : 
                     relacionamento?.tipo === 'usuario' ? 'Usuário' : 
                     isClienteMaster() ? 'Cliente Master' : 'Usuário'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assinatura - Apenas para ClienteMaster */}
        {isClienteMaster() && (
          <div className="perfil-card assinatura-card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faCrown} /> Assinatura
              </h2>
            </div>
            <div className="card-body">
              {assinatura ? (
                <div className="assinatura-info">
                  <div className="assinatura-status-section">
                    <div className="assinatura-status-badge">
                      <span className={`status-indicator ${assinatura.status === 'ACTIVE' ? 'active' : 'inactive'}`}></span>
                      <span className="status-text">
                        {assinatura.status === 'ACTIVE' ? 'Ativa' : 
                         assinatura.status === 'PENDING' ? 'Pendente' : 
                         'Inativa'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="assinatura-details">
                    <div className="assinatura-detail-item">
                      <div className="detail-label">
                        <FontAwesomeIcon icon={faCoins} /> Valor Mensal
                      </div>
                      <div className="detail-value">
                        R$ {assinatura.valorMensal?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                      </div>
                    </div>
                    
                    {assinatura.dataInicio && (
                      <div className="assinatura-detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faCalendar} /> Data de Início
                        </div>
                        <div className="detail-value">
                          {formatarDataLocal(assinatura.dataInicio)}
                        </div>
                      </div>
                    )}
                    
                    {assinatura.proximaRenovacao && (
                      <div className="assinatura-detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faCalendar} /> Próxima Renovação
                        </div>
                        <div className="detail-value">
                          {formatarDataLocal(assinatura.proximaRenovacao)}
                        </div>
                      </div>
                    )}
                    
                    {assinatura.nextDueDate && (
                      <div className="assinatura-detail-item">
                        <div className="detail-label">
                          <FontAwesomeIcon icon={faCalendar} /> Data de Inicio
                        </div>
                        <div className="detail-value">
                          {formatarDataLocal(assinatura.nextDueDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-assinatura">
                  <p>Nenhuma assinatura encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cartão Vinculado - Apenas para ClienteMaster */}
        {isClienteMaster() && (
          <div className="perfil-card cartao-card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faCreditCard} /> Cartão Vinculado
              </h2>
            </div>
            <div className="card-body">
              {cartao ? (
                <div className="cartao-info">
                  <div className="cartao-display">
                    <div className="cartao-front">
                      <div className="cartao-bandeira">{cartao.bandeira || 'CARTÃO'}</div>
                      <div className="cartao-numero">
                        {cartao.numeroMascarado 
                          ? cartao.numeroMascarado.replace(/\s/g, ' ').replace(/(.{4})/g, '$1 ').trim()
                          : `•••• •••• •••• ${cartao.ultimosDigitos || '0000'}`}
                      </div>
                      <div className="cartao-footer">
                        <div className="cartao-nome">{(user?.nome || 'USUÁRIO').toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-cartao">
                  <p>Nenhum cartão vinculado</p>
                  <button className="btn-primary">
                    <FontAwesomeIcon icon={faCreditCard} /> Vincular Cartão
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
          </>
        ) : activeTab === 'usuarios' && isMaster ? (
          <div className="perfil-usuarios-tab">
            {inviteUrl && (
              <div className="invite-link-card">
                <div className="invite-link-header">
                  <FontAwesomeIcon icon={faLink} />
                  <h3>Link de Convite Para Seu Time</h3>
                </div>
                <p className="invite-link-description">
                  Compartilhe este link com as pessoas do seu time para ter uma gestão completa. 
                  Eles poderão se cadastrar ou vincular sua conta existente através deste link.
                </p>
                <div className="invite-link-container">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="invite-link-input"
                    onClick={(e) => e.target.select()}
                  />
                  <button 
                    className="btn-copy-link"
                    onClick={handleCopyUrl}
                    title="Copiar link"
                  >
                    {copied ? (
                      <>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCopy} />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {errorUsuarios && (
              <div className="error-message-dentistas">
                <FontAwesomeIcon icon={faEnvelope} />
                <span>{errorUsuarios}</span>
              </div>
            )}

            {loadingUsuarios ? (
              <div className="dentistas-loading">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Carregando usuários...</p>
              </div>
            ) : (
              <div className="dentistas-grid">
                {usuariosList.length === 0 ? (
                  <div className="empty-state-dentistas">
                    <FontAwesomeIcon icon={faUsers} size="4x" />
                    <h3>Nenhum usuário vinculado</h3>
                    <p>Compartilhe o link de convite para adicionar profissionais à sua clínica</p>
                  </div>
                ) : (
                  usuariosList.map((usuario) => {
                    const userData = usuario.user || {}
                    const isAtivo = usuario.status === 'ativo'
                    const isUpdating = updatingStatus[usuario.id]

                    return (
                      <div key={usuario.id} className={`dentista-card ${!isAtivo ? 'inactive' : ''}`}>
                        <div className="dentista-image">
                          <div className="dentista-image-placeholder">
                            {(userData.nome || 'U').charAt(0).toUpperCase()}
                          </div>
                          {!isAtivo && (
                            <div className="status-badge-inactive">
                              Inativo
                            </div>
                          )}
                        </div>
                        <div className="dentista-info">
                          <div className="dentista-header">
                            <h4>{userData.nome || 'Nome não informado'}</h4>
                            {isAtivo && (
                              <span className="status-badge-active">
                                <FontAwesomeIcon icon={faCheckCircle} /> Ativo
                              </span>
                            )}
                          </div>
                          {userData.cro && (
                            <p className="dentista-crm">
                              <FontAwesomeIcon icon={faIdCard} /> CRO: {userData.cro}
                            </p>
                          )}
                          <div className="dentista-contact">
                            <p>
                              <FontAwesomeIcon icon={faEnvelope} /> {userData.email || 'Email não informado'}
                            </p>
                            {userData.telefone && (
                              <p>
                                <FontAwesomeIcon icon={faPhone} /> {userData.telefone}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="dentista-actions">
                          <button 
                            className={`status-toggle-btn ${isAtivo ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                            disabled={isUpdating}
                            title={isAtivo ? 'Desativar usuário' : 'Ativar usuário'}
                          >
                            {isUpdating ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : isAtivo ? (
                              <>
                                <FontAwesomeIcon icon={faToggleOn} />
                                Desativar
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faToggleOff} />
                                Ativar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        ) : null}
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

export default Perfil

