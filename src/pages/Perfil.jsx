import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, faEnvelope, faIdCard, faCreditCard, faCrown,
  faCoins, faChartLine, faCalendar, faShieldAlt, faEdit,
  faCheckCircle, faUsers, faSpinner, faFileAlt
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import './Perfil.css'

const Perfil = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
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
  }, [])

  const loadPerfilData = async () => {
    try {
      setLoading(true)
      
      // Buscar dados do dashboard da API
      const response = await api.get('/assinaturas/dashboard')
      // A API retorna os dados em response.data.data
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
        setAnalises({
          analisesFeitas: data.analises.analisesFeitas || 0,
          analisesFeitasMes: data.analises.analisesFeitasMes || 0,
          analisesRestantes: data.analises.analisesRestantes || 0,
          limitePlano: data.analises.limitePlano || 0,
          porcentagemUso: data.analises.porcentagemUso || 0
        })
      }

      // Mapear dados de assinatura
      if (data.assinatura) {
        setAssinatura({
          status: data.assinatura.status,
          valorMensal: data.assinatura.valorMensal,
          dataInicio: data.assinatura.dataInicio,
          proximaRenovacao: data.assinatura.proximaRenovacao
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
          <span className="user-type-badge-large">{user?.tipo || 'Usuário'}</span>
        </div>
        <button className="btn-edit-perfil">
          <FontAwesomeIcon icon={faEdit} /> Editar Perfil
        </button>
      </div>

      <div className="perfil-content">
        {/* Uso de Tokens */}
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
                  <div className="token-value">{tokensChat.tokensUtilizados.toLocaleString('pt-BR')}</div>
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
                    <span className="progress-label">Uso deste mês</span>
                    <span className="progress-value">
                      {tokensChat.tokensUtilizadosMes.toLocaleString('pt-BR')} / {tokensChat.limitePlano.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="token-progress-bar">
                    <div 
                      className="token-progress-fill" 
                      style={{ width: `${Math.min(tokensChat.porcentagemUso, 100)}%` }}
                    ></div>
                  </div>
                  <div className="token-progress-percent">
                    {tokensChat.porcentagemUso.toFixed(1)}% utilizado
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Análises */}
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
                  <div className="token-value">{analises.analisesFeitas.toLocaleString('pt-BR')}</div>
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
                    <span className="progress-label">Uso deste mês</span>
                    <span className="progress-value">
                      {analises.analisesFeitasMes.toLocaleString('pt-BR')} / {analises.limitePlano.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="token-progress-bar">
                    <div 
                      className="token-progress-fill" 
                      style={{ width: `${Math.min(analises.porcentagemUso, 100)}%` }}
                    ></div>
                  </div>
                  <div className="token-progress-percent">
                    {analises.porcentagemUso.toFixed(1)}% utilizado
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações Pessoais */}
        <div className="perfil-card info-pessoais-card">
          <div className="card-header">
            <h2>
              <FontAwesomeIcon icon={faUser} /> Informações Pessoais
            </h2>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faUser} /> Nome Completo
                </div>
                <div className="info-value">{user?.nome || 'Não informado'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faEnvelope} /> Email
                </div>
                <div className="info-value">{user?.email || 'Não informado'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faIdCard} /> Tipo de Usuário
                </div>
                <div className="info-value">
                  <span className="user-type-badge">{user?.tipo || 'Usuário'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usuários - Apenas para Master */}
        {user?.tipo === 'master' && usuarios !== null && (
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

        {/* Assinatura - Apenas para Master */}
        {user?.tipo === 'master' && (
          <div className="perfil-card assinatura-card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faCrown} /> Assinatura
              </h2>
            </div>
            <div className="card-body">
              {assinatura ? (
                <div className="assinatura-info">
                  <div className="assinatura-plan">
                    <div className="plan-badge">
                      <FontAwesomeIcon icon={faCrown} />
                      <span>Plano Ativo</span>
                    </div>
                    <div className={`plan-status ${assinatura.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {assinatura.status === 'ACTIVE' ? 'Ativa' : 
                       assinatura.status === 'PENDING' ? 'Pendente' : 'Inativa'}
                    </div>
                  </div>
                  <div className="assinatura-details">
                    <div className="detail-row">
                      <span className="detail-label">Valor Mensal:</span>
                      <span className="detail-value">R$ {assinatura.valorMensal?.toFixed(2) || '0,00'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Data de Início:</span>
                      <span className="detail-value">
                        {new Date(assinatura.dataInicio).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Próxima Renovação:</span>
                      <span className="detail-value">
                        {new Date(assinatura.proximaRenovacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-assinatura">
                  <p>Nenhuma assinatura ativa</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cartão Vinculado - Apenas para Master */}
        {user?.tipo === 'master' && (
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
                      <div className="cartao-bandeira">{cartao.bandeira}</div>
                      <div className="cartao-numero">
                        {cartao.numeroMascarado || `•••• •••• •••• ${cartao.ultimosDigitos}`}
                      </div>
                      <div className="cartao-footer">
                        <div className="cartao-nome">{user?.nome || 'Usuário'}</div>
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

