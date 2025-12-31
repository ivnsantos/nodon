import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, faEnvelope, faIdCard, faCreditCard, faCrown,
  faCoins, faChartLine, faCalendar, faShieldAlt, faEdit,
  faCheckCircle, faTrendingUp, faUsers
} from '@fortawesome/free-solid-svg-icons'
import './Perfil.css'

const Perfil = () => {
  const { user } = useAuth()
  const [tokenUsage, setTokenUsage] = useState(0)
  const [assinatura, setAssinatura] = useState(null)
  const [cartao, setCartao] = useState(null)
  const [totalClientes, setTotalClientes] = useState(0)

  useEffect(() => {
    loadPerfilData()
  }, [])

  const getLimiteClientes = (plano) => {
    const limites = {
      'Básico': 50,
      'Premium': 200,
      'Enterprise': 1000
    }
    return limites[plano] || 50
  }

  const loadPerfilData = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar dados do localStorage
      const savedTokenUsage = localStorage.getItem('tokenUsage')
      const savedAssinatura = localStorage.getItem('assinatura')
      const savedCartao = localStorage.getItem('cartao')
      
      // Contar clientes
      const savedClientes = JSON.parse(localStorage.getItem('mockClientesCompletos') || '[]')
      setTotalClientes(savedClientes.length)
      
      if (savedTokenUsage) {
        setTokenUsage(parseInt(savedTokenUsage))
      } else {
        // Valor mockado inicial
        setTokenUsage(1250)
      }
      
      if (savedAssinatura) {
        setAssinatura(JSON.parse(savedAssinatura))
      } else {
        // Assinatura mockada
        setAssinatura({
          plano: 'Premium',
          valor: 99.90,
          dataInicio: '2024-01-15',
          dataRenovacao: '2024-02-15',
          status: 'ativa',
          limiteClientes: 200
        })
      }
      
      if (savedCartao) {
        setCartao(JSON.parse(savedCartao))
      } else {
        // Cartão mockado
        setCartao({
          ultimosDigitos: '4242',
          bandeira: 'Visa',
          nome: user?.nome || 'Usuário',
          vencimento: '12/25'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error)
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
          <span className="user-type-badge-large">{user?.tipo || 'Usuário'}</span>
        </div>
        <button className="btn-edit-perfil">
          <FontAwesomeIcon icon={faEdit} /> Editar Perfil
        </button>
      </div>

      <div className="perfil-content">
        {/* Informações Pessoais */}
        <div className="perfil-card">
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
                  <div className="token-value">{tokenUsage.toLocaleString('pt-BR')}</div>
                  <div className="token-label">Tokens Utilizados</div>
                </div>
              </div>
              <div className="token-details">
                <div className="token-detail-item">
                  <FontAwesomeIcon icon={faTrendingUp} />
                  <span>Este mês: {Math.floor(tokenUsage * 0.3).toLocaleString('pt-BR')} tokens</span>
                </div>
                <div className="token-detail-item">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>Última atualização: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              {/* Barra de Progresso */}
              <div className="token-progress-section">
                <div className="token-progress-header">
                  <span className="progress-label">Uso deste mês</span>
                  <span className="progress-value">{Math.floor(tokenUsage * 0.3).toLocaleString('pt-BR')} / 10.000</span>
                </div>
                <div className="token-progress-bar">
                  <div 
                    className="token-progress-fill" 
                    style={{ width: `${Math.min((Math.floor(tokenUsage * 0.3) / 10000) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="token-progress-percent">{Math.round(Math.min((Math.floor(tokenUsage * 0.3) / 10000) * 100, 100))}% utilizado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assinatura */}
        <div className="perfil-card">
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
                    <span>{assinatura.plano}</span>
                  </div>
                  <div className="plan-status active">
                    {assinatura.status === 'ativa' ? 'Ativa' : 'Inativa'}
                  </div>
                </div>
                <div className="assinatura-details">
                  <div className="detail-row">
                    <span className="detail-label">Valor Mensal:</span>
                    <span className="detail-value">R$ {assinatura.valor.toFixed(2)}</span>
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
                      {new Date(assinatura.dataRenovacao).toLocaleDateString('pt-BR')}
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

        {/* Clientes */}
        <div className="perfil-card">
          <div className="card-header">
            <h2>
              <FontAwesomeIcon icon={faUsers} /> Clientes
            </h2>
          </div>
          <div className="card-body">
            <div className="clientes-info">
              <div className="clientes-stat">
                <div className="clientes-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div className="clientes-data">
                  <div className="clientes-value">{totalClientes}</div>
                  <div className="clientes-label">Clientes Cadastrados</div>
                </div>
              </div>
              {assinatura && (
                <div className="clientes-limit">
                  <div className="clientes-limit-info">
                    <span className="clientes-limit-label">Limite do Plano:</span>
                    <span className="clientes-limit-value">{getLimiteClientes(assinatura.plano)} clientes</span>
                  </div>
                  <div className="clientes-progress-bar">
                    <div 
                      className="clientes-progress-fill" 
                      style={{ width: `${Math.min((totalClientes / getLimiteClientes(assinatura.plano)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="clientes-progress-text">
                    {Math.round((totalClientes / getLimiteClientes(assinatura.plano)) * 100)}% utilizado
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cartão Vinculado */}
        <div className="perfil-card">
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
                      <span className="cartao-hidden">•••• •••• ••••</span>
                      <span className="cartao-digits">{cartao.ultimosDigitos}</span>
                    </div>
                    <div className="cartao-footer">
                      <div className="cartao-nome">{cartao.nome}</div>
                      <div className="cartao-vencimento">{cartao.vencimento}</div>
                    </div>
                  </div>
                </div>
                <div className="cartao-actions">
                  <button className="btn-secondary">
                    <FontAwesomeIcon icon={faShieldAlt} /> Alterar Cartão
                  </button>
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
      </div>
    </div>
  )
}

export default Perfil

