import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, faEnvelope, faIdCard, faCreditCard, faCrown,
  faCoins, faChartLine, faCalendar, faShieldAlt, faEdit,
  faCheckCircle, faUsers, faSpinner, faFileAlt, faHeadset
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import './Perfil.css'

const Perfil = () => {
  const { user, selectedClinicData, isClienteMaster, getRelacionamento, planoAcesso } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

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
          {isMaster && (
            <button 
              className="btn-edit-perfil"
              onClick={() => navigate('/complete-master-data')}
            >
              <FontAwesomeIcon icon={faEdit} /> Editar Perfil
            </button>
          )}
        </div>
      </div>

      <div className="perfil-content">
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

        {/* Usuários - Apenas para ClienteMaster, quando acesso não for "chat" e limitePlano > 0 */}
        {isClienteMaster() && !isPlanoChat && analises.limitePlano > 0 && usuarios !== null && (
          <div className="perfil-card usuarios-card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faUsers} /> Usuários
              </h2>
            </div>
            <div className="card-body">
              <div className="clientes-info">
                <div className="clientes-stat">
                  <div className="clientes-icon">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="clientes-data">
                    <div className="clientes-value">{usuarios.quantidade}</div>
                    <div className="clientes-label">Usuários Cadastrados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
}

export default Perfil

