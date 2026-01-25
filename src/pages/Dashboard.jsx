import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarAlt, faBrain, faFileMedical, faUsers,
  faCheckCircle, faArrowRight, faPlus, faEye,
  faSpinner, faClock
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const { isUsuario } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/dashboard')
      
      // A API retorna { statusCode, message, data: { diagnosticos, conversas, consultas, clientes } }
      if (response.data?.statusCode === 200 && response.data?.data) {
        setDashboardData(response.data.data)
      } else {
        throw new Error('Resposta inválida da API')
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError(err.response?.data?.message || 'Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas a partir dos arrays
  const calculateStats = () => {
    if (!dashboardData) return null

    const { diagnosticos = [], conversas = [], consultas = [], clientes = [] } = dashboardData

    // Diagnósticos
    const totalDiagnosticos = diagnosticos.length
    const hoje = new Date()
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const diagnosticosEsteMes = diagnosticos.filter(diag => {
      if (!diag.data && !diag.createdAt && !diag.created_at) return false
      const dataDiag = new Date(diag.data || diag.createdAt || diag.created_at)
      return dataDiag >= primeiroDiaMes
    }).length

    // Conversas
    const totalConversas = conversas.length
    // Calcular tokens usados a partir das conversas
    const tokensUtilizados = conversas.reduce((total, conv) => {
      return total + (conv.tokensUsados || conv.tokens_usados || 0)
    }, 0)
    // Limite de tokens (pode vir de uma conversa ou ser um valor padrão)
    const limiteTokens = conversas[0]?.limiteTokens || conversas[0]?.limite_tokens || 500000
    const tokenPercentage = limiteTokens > 0 ? (tokensUtilizados / limiteTokens) * 100 : 0

    // Consultas
    const hojeStr = hoje.toISOString().split('T')[0]
    const consultasHoje = consultas.filter(cons => {
      const dataCons = cons.data || cons.data_consulta || cons.dataConsulta
      return dataCons === hojeStr
    }).length

    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    const consultasEstaSemana = consultas.filter(cons => {
      const dataCons = cons.data || cons.data_consulta || cons.dataConsulta
      if (!dataCons) return false
      const data = new Date(dataCons)
      return data >= inicioSemana
    }).length

    // Clientes
    const totalClientes = clientes.length
    const clientesAtivos = clientes.filter(cli => {
      return cli.ativo !== false && cli.status !== 'inativo' && cli.status !== 'inativo'
    }).length

    return {
      diagnosticos: {
        total: totalDiagnosticos,
        esteMes: diagnosticosEsteMes
      },
      conversas: {
        total: totalConversas,
        tokensUtilizados,
        limiteTokens,
        tokenPercentage
      },
      consultas: {
        hoje: consultasHoje,
        estaSemana: consultasEstaSemana
      },
      clientes: {
        total: totalClientes,
        ativos: clientesAtivos
      }
    }
  }

  // Obter próximas consultas (ordenadas por data e hora)
  const getProximasConsultas = () => {
    if (!dashboardData?.consultas) return []
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    return dashboardData.consultas
      .filter(cons => {
        const dataCons = cons.data || cons.data_consulta || cons.dataConsulta
        if (!dataCons) return false
        const data = new Date(dataCons)
        data.setHours(0, 0, 0, 0)
        return data >= hoje
      })
      .sort((a, b) => {
        const dataA = new Date(a.data || a.data_consulta || a.dataConsulta)
        const dataB = new Date(b.data || b.data_consulta || b.dataConsulta)
        if (dataA.getTime() !== dataB.getTime()) {
          return dataA - dataB
        }
        const horaA = (a.hora || a.hora_consulta || a.horaConsulta || '00:00').split(':')
        const horaB = (b.hora || b.hora_consulta || b.horaConsulta || '00:00').split(':')
        const minutosA = parseInt(horaA[0]) * 60 + parseInt(horaA[1])
        const minutosB = parseInt(horaB[0]) * 60 + parseInt(horaB[1])
        return minutosA - minutosB
      })
      .slice(0, 5) // Limitar a 5 próximas consultas
  }

  // Obter diagnósticos recentes (ordenados por data)
  const getDiagnosticosRecentes = () => {
    if (!dashboardData?.diagnosticos) return []
    
    return [...dashboardData.diagnosticos]
      .sort((a, b) => {
        const dataA = new Date(a.data || a.createdAt || a.created_at || 0)
        const dataB = new Date(b.data || b.createdAt || b.created_at || 0)
        return dataB - dataA
      })
      .slice(0, 5) // Limitar a 5 diagnósticos recentes
  }

  // Formatar data relativa (Hoje, Amanhã, ou data formatada)
  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateToCompare = new Date(date)
      dateToCompare.setHours(0, 0, 0, 0)
      
      if (dateToCompare.getTime() === today.getTime()) {
        return 'Hoje'
      } else if (dateToCompare.getTime() === tomorrow.getTime()) {
        return 'Amanhã'
      } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }
    } catch (error) {
      return dateString
    }
  }

  // Formatar data para exibição (dd/mm)
  const formatDateShort = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    } catch (error) {
      return dateString
    }
  }

  // Mapear status da API para o formato usado no componente
  const mapStatus = (status) => {
    if (status === 'completo' || status === 'concluido' || status === 'concluído') return 'concluido'
    if (status === 'processando' || status === 'pendente' || status === 'em_processamento') return 'processando'
    return 'concluido'
  }

  if (loading) {
    return (
      <div className="simple-dashboard">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} className="spinning" />
          <p>Carregando dados do dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="simple-dashboard">
        <div className="error-state">
          <p>Erro: {error}</p>
          <button className="btn-retry" onClick={loadDashboardData}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="simple-dashboard">
        <div className="error-state">
          <p>Nenhum dado disponível</p>
          <button className="btn-retry" onClick={loadDashboardData}>
            Recarregar
          </button>
        </div>
      </div>
    )
  }

  const stats = calculateStats()
  const proximasConsultas = getProximasConsultas()
  const diagnosticosRecentes = getDiagnosticosRecentes()

  if (!stats) {
    return (
      <div className="simple-dashboard">
        <div className="error-state">
          <p>Erro ao processar dados</p>
          <button className="btn-retry" onClick={loadDashboardData}>
            Recarregar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="simple-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Visão geral das suas atividades</p>
        </div>
        <button className="btn-new-analysis" onClick={() => navigate('/app/diagnosticos')}>
          <FontAwesomeIcon icon={faPlus} />
          Nova Análise
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/app/diagnosticos')}>
          <div className="stat-icon">
            <FontAwesomeIcon icon={faFileMedical} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.diagnosticos.total}</div>
            <div className="stat-label">Diagnósticos</div>
            <div className="stat-extra">{stats.diagnosticos.esteMes} este mês</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/app/chat')}>
          <div className="stat-icon">
            <FontAwesomeIcon icon={faBrain} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.conversas.total}</div>
            <div className="stat-label">Conversas com IA</div>
            <div className="stat-extra">{stats.conversas.tokenPercentage.toFixed(1)}% tokens usados</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/app/calendario')}>
          <div className="stat-icon">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.consultas.hoje}</div>
            <div className="stat-label">Consultas Hoje</div>
            <div className="stat-extra">{stats.consultas.estaSemana} esta semana</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/app/clientes')}>
          <div className="stat-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="stat-info">
            <div className="stat-number">{stats.clientes.total}</div>
            <div className="stat-label">Clientes</div>
            <div className="stat-extra">{stats.clientes.ativos} ativos</div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="dashboard-content">
        {/* Coluna Esquerda */}
        <div className="content-column">
          {/* Próximas Consultas */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Próximas Consultas</h2>
              <button className="section-link" onClick={() => navigate('/app/calendario')}>
                Ver agenda <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
            <div className="appointments-list">
              {proximasConsultas.length > 0 ? (
                proximasConsultas.map((consulta) => {
                  const dataCons = consulta.data || consulta.data_consulta || consulta.dataConsulta
                  const horaCons = consulta.hora || consulta.hora_consulta || consulta.horaConsulta || '--:--'
                  const pacienteNome = consulta.paciente || consulta.paciente_nome || consulta.pacienteNome || 'N/A'
                  const tipoCons = consulta.tipo || consulta.tipo_consulta || consulta.tipoConsulta || 'Consulta'
                  
                  return (
                    <div key={consulta.id} className="appointment-item">
                      <div className="appointment-time">
                        <div className="appointment-hour">{horaCons}</div>
                        <div className="appointment-date">{formatDate(dataCons)}</div>
                      </div>
                      <div className="appointment-details">
                        <div className="appointment-patient">{pacienteNome}</div>
                        <div className="appointment-type">{tipoCons}</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <p>Nenhuma consulta agendada</p>
                </div>
              )}
            </div>
          </div>

          {/* Diagnósticos Recentes */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Diagnósticos Recentes</h2>
              <button className="section-link" onClick={() => navigate('/app/diagnosticos')}>
                Ver todos <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
            <div className="diagnosticos-list">
              {diagnosticosRecentes.length > 0 ? (
                diagnosticosRecentes.map((diag) => {
                  const status = mapStatus(diag.status || diag.statusAnalise)
                  const pacienteNome = diag.paciente || diag.paciente_nome || diag.pacienteNome || diag.nome || 'N/A'
                  const tipoExame = diag.tipoExame || diag.tipo_exame || diag.tipo || diag.descricao || 'N/A'
                  const dataDiag = diag.data || diag.createdAt || diag.created_at
                  const achados = diag.achados || diag.numeroAchados || diag.numero_achados
                  
                  return (
                    <div key={diag.id} className="diagnostico-item" onClick={() => navigate(`/app/diagnosticos/${diag.id}`)}>
                      <div className={`diagnostico-status ${status}`}>
                        {status === 'concluido' ? (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        ) : (
                          <FontAwesomeIcon icon={faSpinner} className="spinning" />
                        )}
                      </div>
                      <div className="diagnostico-info">
                        <div className="diagnostico-patient">{pacienteNome}</div>
                        <div className="diagnostico-meta">
                          {tipoExame} • {formatDateShort(dataDiag)}
                        </div>
                        {status === 'concluido' && achados !== null && achados !== undefined && (
                          <div className="diagnostico-achados">{achados} achados encontrados</div>
                        )}
                      </div>
                      <button className="btn-view" onClick={(e) => { e.stopPropagation(); navigate(`/app/diagnosticos/${diag.id}`) }}>
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <p>Nenhum diagnóstico recente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="content-column">
          {/* Uso de Tokens */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Uso de Tokens</h2>
            </div>
            <div className="tokens-section">
              <div className="tokens-display">
                <div className="tokens-used">{stats.conversas.tokensUtilizados.toLocaleString('pt-BR')}</div>
                <div className="tokens-total">de {stats.conversas.limiteTokens.toLocaleString('pt-BR')}</div>
              </div>
              <div className="tokens-progress">
                <div 
                  className="tokens-progress-bar" 
                  style={{ width: `${stats.conversas.tokenPercentage}%` }}
                ></div>
              </div>
              <div className="tokens-percentage">{stats.conversas.tokenPercentage.toFixed(1)}% utilizado</div>
              <button className="btn-tokens" onClick={() => navigate('/app/chat')}>
                Abrir Chat IA
              </button>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Ações Rápidas</h2>
            </div>
            <div className="quick-actions">
              <button className="quick-action-btn" onClick={() => navigate('/app/diagnosticos')}>
                <FontAwesomeIcon icon={faFileMedical} />
                <span>Nova Análise</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/app/chat')}>
                <FontAwesomeIcon icon={faBrain} />
                <span>Abrir Chat</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/app/calendario')}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>Ver Agenda</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/app/clientes')}>
                <FontAwesomeIcon icon={faUsers} />
                <span>Clientes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
