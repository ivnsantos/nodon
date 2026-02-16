import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserPlus, faSearch, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faEdit,
  faEye, faTrash, faFilter, faChevronDown, faCheck,
  faChartBar, faTrophy, faDollarSign, faFileInvoiceDollar,
  faTimes, faMedkit
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Clientes.css'

const Clientes = () => {
  const navigate = useNavigate()
  const { selectedClinicData, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Hook para modal de alerta
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState({})
  const statusDropdownRefs = useRef({})
  
  // Estados para abas e analytics
  const [activeTab, setActiveTab] = useState('lista') // 'lista' ou 'analytics'
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('geral') // 'geral' ou 'mensal'
  const [dadosAnalyticsGeral, setDadosAnalyticsGeral] = useState(null)
  const [dadosAnalyticsMensal, setDadosAnalyticsMensal] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showClientesModal, setShowClientesModal] = useState(false)
  const [clientesModalData, setClientesModalData] = useState(null)
  const [clientesModalTitle, setClientesModalTitle] = useState('')

  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'avaliacao-realizada', label: 'Avaliação Realizada' },
    { value: 'em-andamento', label: 'Em Andamento' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'tratamento-concluido', label: 'Tratamento Concluído' },
    { value: 'perdido', label: 'Perdido' }
  ]

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Fechar dropdown de filtro
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      
      // Fechar todos os dropdowns de status
      Object.keys(statusDropdownOpen).forEach(clienteId => {
        const ref = statusDropdownRefs.current[clienteId]
        if (ref && !ref.contains(event.target)) {
          setStatusDropdownOpen(prev => {
            const newState = { ...prev }
            delete newState[clienteId]
            return newState
          })
        }
      })
    }
    
    // Adicionar listener com pequeno delay para não interferir com o clique que abriu o dropdown
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [statusDropdownOpen])

  useEffect(() => {
    if (selectedClinicData) {
      loadClientes()
    }
  }, [selectedClinicData])

  // Carregar dados de analytics quando selecionar aba analytics
  useEffect(() => {
    if (activeTab === 'analytics' && selectedClinicData) {
      if (activeAnalyticsTab === 'geral') {
        fetchAnalyticsGeral()
      } else if (activeAnalyticsTab === 'mensal') {
        fetchAnalyticsMensal(selectedMonth)
      }
    }
  }, [activeTab, activeAnalyticsTab, selectedClinicData, selectedMonth])

  const loadClientes = async () => {
    try {
      // Obter clienteMasterId do contexto (pode estar em diferentes lugares dependendo do tipo de usuário)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoading(false)
        return
      }

      // Fazer GET para listar pacientes
      const response = await api.get(`/pacientes?clienteMasterId=${clienteMasterId}`)
      const pacientes = response.data?.data || response.data || []
      
      // Normalizar dados dos pacientes para o formato esperado
      // A API agora retorna formato simplificado com apenas campos básicos
      const clientesNormalizados = pacientes.map(paciente => ({
        id: paciente.id,
        nome: paciente.nome || '',
        email: paciente.email || '',
        telefone: paciente.telefone || '',
        cpf: paciente.cpf || '',
        dataNascimento: paciente.dataNascimento || '',
        status: (() => {
          // Normalizar status do backend
          const statusRaw = paciente.status || 'avaliacao-realizada'
          // Normalizar valores comuns que podem vir do backend
          const statusNormalizado = String(statusRaw).toLowerCase().trim()
          
          // Mapear valores comuns para status válidos
          const statusMap = {
            'inativa': 'perdido',
            'inativo': 'perdido',
            'ativa': 'avaliacao-realizada',
            'ativo': 'avaliacao-realizada',
            'active': 'avaliacao-realizada',
            'inactive': 'perdido'
          }
          
          return statusMap[statusNormalizado] || statusRaw
        })(),
        // Campos não disponíveis no formato simplificado - serão carregados quando necessário
        necessidades: '',
        observacoes: '',
        endereco: {
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        createdAt: new Date().toISOString()
      }))
      
      setClientes(clientesNormalizados)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      alert('Erro ao carregar lista de pacientes. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatTelefone = (telefone) => {
    if (!telefone) return ''
    const cleaned = telefone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return telefone
  }

  const formatCPF = (cpf) => {
    if (!cpf) return ''
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  // Buscar dados de analytics geral
  const fetchAnalyticsGeral = async () => {
    try {
      setLoadingAnalytics(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoadingAnalytics(false)
        return
      }

      const response = await api.get('/orcamentos/analytics/clientes/geral', {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })
      
      setDadosAnalyticsGeral(response.data?.data || response.data)
    } catch (error) {
      console.error('Erro ao carregar analytics geral:', error)
      showError('Erro ao carregar dados de analytics. Tente novamente.')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Buscar dados de analytics mensal
  const fetchAnalyticsMensal = async (mes) => {
    try {
      setLoadingAnalytics(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoadingAnalytics(false)
        return
      }

      const [ano, mesNum] = mes.split('-')
      const response = await api.get(`/orcamentos/analytics/clientes/mes?mes=${mesNum}&ano=${ano}`, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })
      
      setDadosAnalyticsMensal(response.data?.data || response.data)
    } catch (error) {
      console.error('Erro ao carregar analytics mensal:', error)
      showError('Erro ao carregar dados de analytics mensal. Tente novamente.')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'avaliacao-realizada': 'Avaliação Realizada',
      'em-andamento': 'Em Andamento',
      'aprovado': 'Aprovado',
      'tratamento-concluido': 'Tratamento Concluído',
      'perdido': 'Perdido'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'avaliacao-realizada': '#3b82f6',
      'em-andamento': '#f59e0b',
      'aprovado': '#10b981',
      'tratamento-concluido': '#8b5cf6',
      'perdido': '#ef4444'
    }
    return colorMap[status] || '#6b7280'
  }

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return

    try {
      await api.delete(`/pacientes/${clienteToDelete.id}`)
      // Recarregar lista após deletar
      await loadClientes()
      setShowDeleteModal(false)
      setClienteToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir paciente:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao excluir paciente. Tente novamente.'
      showError(errorMessage)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setClienteToDelete(null)
  }

  const handleToggleStatusDropdown = (clienteId, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setStatusDropdownOpen(prev => {
      const isCurrentlyOpen = prev[clienteId]
      const newState = {}
      
      // Se o dropdown atual está fechado, abrir ele
      if (!isCurrentlyOpen) {
        newState[clienteId] = true
        console.log('Abrindo dropdown para cliente:', clienteId, newState)
      } else {
        console.log('Fechando dropdown para cliente:', clienteId)
      }
      // Se está aberto, newState vazio fecha todos
      
      return newState
    })
  }

  const handleUpdateStatus = async (clienteId, novoStatusValue) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente || !novoStatusValue || novoStatusValue === cliente.status) {
      setStatusDropdownOpen(prev => {
        const newState = { ...prev }
        delete newState[clienteId]
        return newState
      })
      return
    }

    // Fechar dropdown imediatamente para melhor UX
    setStatusDropdownOpen(prev => {
      const newState = { ...prev }
      delete newState[clienteId]
      return newState
    })

    try {
      const payload = {
        dadosPessoais: {
          status: novoStatusValue
        }
      }

      await api.put(`/pacientes/${clienteId}`, payload)
      
      // Se chegou aqui, a requisição foi bem-sucedida (axios só lança erro para status >= 400)
      // Atualizar estado local
      setClientes(clientes.map(c => 
        c.id === clienteId 
          ? { ...c, status: novoStatusValue }
          : c
      ))
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      
      // Só mostrar erro se realmente for um erro da API (status >= 400)
      if (error.response && error.response.status >= 400) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Erro ${error.response.status}: ${error.response.statusText}`
        showError(errorMessage)
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta
        showError('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        // Erro ao configurar a requisição
        const errorMessage = error.message || 'Erro ao atualizar status. Tente novamente.'
        showError(errorMessage)
      }
    }
  }

  if (!selectedClinicData) {
    return (
      <div className="clientes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do consultório...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="clientes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando clientes...</p>
      </div>
    )
  }

  return (
    <div className="clientes-page">
      {/* Tabs principais */}
      <div className="clientes-tabs">
        <button
          className={`tab-btn ${activeTab === 'lista' ? 'active' : ''}`}
          onClick={() => setActiveTab('lista')}
        >
          <FontAwesomeIcon icon={faUser} /> Lista
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FontAwesomeIcon icon={faChartBar} /> Analytics
        </button>
      </div>

      {/* Conteúdo baseado na aba ativa */}
      {activeTab === 'lista' ? (
        <>
          <div className="clientes-toolbar">
            <div className="clientes-filters">
              <div className="search-box">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-box custom-dropdown" ref={dropdownRef}>
                <button 
                  className="dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  type="button"
                >
                  <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                  <span>{statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
                  <FontAwesomeIcon icon={faChevronDown} className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`dropdown-item ${statusFilter === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setStatusFilter(option.value)
                          setDropdownOpen(false)
                        }}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button 
              className="btn-new-client"
              onClick={() => navigate('/app/clientes/novo')}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              Novo Cliente
            </button>
          </div>

          <div className="clientes-grid">
        {filteredClientes.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faUser} size="3x" />
            {clientes.length === 0 ? (
              <>
                <h3>Nenhum cliente cadastrado</h3>
                <p>Comece cadastrando seu primeiro cliente para gerenciar seus pacientes.</p>
                <button 
                  className="btn-modern-primary"
                  onClick={() => navigate('/app/clientes/novo')}
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Cadastrar Primeiro Cliente
                </button>
              </>
            ) : (
              <>
                <p>Nenhum cliente encontrado com os filtros aplicados</p>
                <button 
                  className="btn-modern-secondary"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                >
                  Limpar Filtros
                </button>
              </>
            )}
          </div>
        ) : (
          filteredClientes.map(cliente => (
            <div key={cliente.id} className="cliente-card">
              <div className="cliente-header">
                <div className="cliente-avatar">
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
                <div className="cliente-info-header">
                  <h3>{cliente.nome}</h3>
                  {isMaster ? (
                    <div 
                      className="status-dropdown-container" 
                      ref={el => statusDropdownRefs.current[cliente.id] = el}
                    >
                      <span 
                        className="status-badge status-badge-clickable"
                        style={{ backgroundColor: getStatusColor(cliente.status) }}
                        onClick={(e) => handleToggleStatusDropdown(cliente.id, e)}
                        title="Clique para alterar status"
                      >
                        {getStatusLabel(cliente.status)}
                        <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${statusDropdownOpen[cliente.id] ? 'open' : ''}`} />
                      </span>
                      {statusDropdownOpen[cliente.id] && (
                        <div 
                          className="status-dropdown-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {['avaliacao-realizada', 'em-andamento', 'aprovado', 'tratamento-concluido', 'perdido'].map((statusOption) => (
                            <div
                              key={statusOption}
                              className={`status-dropdown-item ${cliente.status === statusOption ? 'active' : ''}`}
                              style={{ backgroundColor: getStatusColor(statusOption) }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateStatus(cliente.id, statusOption)
                              }}
                            >
                              <span>{getStatusLabel(statusOption)}</span>
                              {cliente.status === statusOption && (
                                <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(cliente.status) }}
                    >
                      {getStatusLabel(cliente.status)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="cliente-details">
                <div className="detail-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>{cliente.email}</span>
                </div>
                <div className="detail-item">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{formatTelefone(cliente.telefone)}</span>
                </div>
                {cliente.dataNascimento && (
                  <div className="detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>
                      {new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="cliente-actions">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/app/clientes/${cliente.id}`)}
                >
                  <FontAwesomeIcon icon={faEye} />
                  Ver Ficha
                </button>
                {isMaster && (
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/app/clientes/${cliente.id}/editar`)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Editar
                  </button>
                )}
                {isMaster && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(cliente)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
          </div>
        </>
      ) : (
        <div className="analytics-section">
          {/* Tabs internas para analytics */}
          <div className="analytics-tabs-internas">
            <button
              className={`analytics-tab-btn ${activeAnalyticsTab === 'geral' ? 'active' : ''}`}
              onClick={() => setActiveAnalyticsTab('geral')}
            >
              <FontAwesomeIcon icon={faChartBar} /> Geral
            </button>
            <button
              className={`analytics-tab-btn ${activeAnalyticsTab === 'mensal' ? 'active' : ''}`}
              onClick={() => setActiveAnalyticsTab('mensal')}
            >
              <FontAwesomeIcon icon={faCalendarAlt} /> Mensal
            </button>
          </div>

          {/* Conteúdo da aba Geral */}
          {activeAnalyticsTab === 'geral' && (
            <div className="analytics-content">
              {loadingAnalytics ? (
                <div className="analytics-loading">
                  <div className="loading-spinner"></div>
                  <p>Carregando dados de analytics...</p>
                </div>
              ) : dadosAnalyticsGeral ? (
                <div className="analytics-cards-container">
                  {/* Top Clientes com Mais Orçamentos */}
                  {dadosAnalyticsGeral.topClientesMaisOrcamentos && dadosAnalyticsGeral.topClientesMaisOrcamentos.length > 0 && (
                    <div className="top-clientes-section">
                      <div className="top-clientes-header">
                        <div className="top-clientes-title-container">
                          <div className="cliente-analytics-icon" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
                            <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0ea5e9' }} />
                          </div>
                          <h3 className="top-clientes-title">Top Clientes com Mais Orçamentos</h3>
                        </div>
                        {dadosAnalyticsGeral.topClientesMaisOrcamentos.length > 3 && (
                          <button 
                            className="btn-ver-mais-clientes"
                            onClick={() => {
                              setClientesModalData(dadosAnalyticsGeral.topClientesMaisOrcamentos)
                              setClientesModalTitle('Top Clientes com Mais Orçamentos')
                              setShowClientesModal(true)
                            }}
                          >
                            Ver todos ({dadosAnalyticsGeral.topClientesMaisOrcamentos.length})
                          </button>
                        )}
                      </div>
                      <div className="top-clientes-list">
                        {dadosAnalyticsGeral.topClientesMaisOrcamentos.slice(0, 3).map((cliente, index) => (
                          <div key={cliente.id || index} className="top-cliente-item">
                            <div className="top-cliente-rank">
                              <span className="rank-number">{index + 1}</span>
                              <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                            </div>
                            <div className="top-cliente-info">
                              <div className="top-cliente-name">{cliente.nome}</div>
                              <div className="top-cliente-cpf">CPF: {formatCPF(cliente.cpf)}</div>
                              <div className="top-cliente-details">
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeOrcamentos} orçamentos
                                </span>
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeItensPagos} itens pagos
                                </span>
                                <span className="top-cliente-valor">
                                  {formatCurrency(cliente.valorTotalPago)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Clientes com Maior Valor */}
                  {dadosAnalyticsGeral.topClientesMaiorValor && dadosAnalyticsGeral.topClientesMaiorValor.length > 0 && (
                    <div className="top-clientes-section">
                      <div className="top-clientes-header">
                        <div className="top-clientes-title-container">
                          <div className="cliente-analytics-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                          </div>
                          <h3 className="top-clientes-title">Top Clientes com Maior Valor</h3>
                        </div>
                        {dadosAnalyticsGeral.topClientesMaiorValor.length > 3 && (
                          <button 
                            className="btn-ver-mais-clientes"
                            onClick={() => {
                              setClientesModalData(dadosAnalyticsGeral.topClientesMaiorValor)
                              setClientesModalTitle('Top Clientes com Maior Valor')
                              setShowClientesModal(true)
                            }}
                          >
                            Ver todos ({dadosAnalyticsGeral.topClientesMaiorValor.length})
                          </button>
                        )}
                      </div>
                      <div className="top-clientes-list">
                        {dadosAnalyticsGeral.topClientesMaiorValor.slice(0, 3).map((cliente, index) => (
                          <div key={cliente.id || index} className="top-cliente-item">
                            <div className="top-cliente-rank">
                              <span className="rank-number">{index + 1}</span>
                              <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                            </div>
                            <div className="top-cliente-info">
                              <div className="top-cliente-name">{cliente.nome}</div>
                              <div className="top-cliente-cpf">CPF: {formatCPF(cliente.cpf)}</div>
                              <div className="top-cliente-details">
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeOrcamentos} orçamentos
                                </span>
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeItensPagos} itens pagos
                                </span>
                                <span className="top-cliente-valor">
                                  {formatCurrency(cliente.valorTotalPago)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!dadosAnalyticsGeral.topClientesMaisOrcamentos || dadosAnalyticsGeral.topClientesMaisOrcamentos.length === 0) && 
                   (!dadosAnalyticsGeral.topClientesMaiorValor || dadosAnalyticsGeral.topClientesMaiorValor.length === 0) && (
                    <div className="analytics-empty-state">
                      <FontAwesomeIcon icon={faUser} size="3x" />
                      <p>Nenhum dado de analytics disponível</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="analytics-empty-state">
                  <FontAwesomeIcon icon={faChartBar} size="3x" />
                  <p>Nenhum dado encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da aba Mensal */}
          {activeAnalyticsTab === 'mensal' && (
            <div className="analytics-content">
              <div className="mes-selector-container">
                <div className="mes-selector">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mes-input"
                  />
                </div>
              </div>

              {loadingAnalytics ? (
                <div className="analytics-loading">
                  <div className="loading-spinner"></div>
                  <p>Carregando dados do mês...</p>
                </div>
              ) : dadosAnalyticsMensal ? (
                <div className="analytics-cards-container">
                  {/* Top Clientes com Mais Orçamentos do Mês */}
                  {dadosAnalyticsMensal.topClientesMaisOrcamentos && dadosAnalyticsMensal.topClientesMaisOrcamentos.length > 0 && (
                    <div className="top-clientes-section">
                      <div className="top-clientes-header">
                        <div className="top-clientes-title-container">
                          <div className="cliente-analytics-icon" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
                            <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0ea5e9' }} />
                          </div>
                          <h3 className="top-clientes-title">Top Clientes com Mais Orçamentos do Mês</h3>
                        </div>
                        {dadosAnalyticsMensal.topClientesMaisOrcamentos.length > 3 && (
                          <button 
                            className="btn-ver-mais-clientes"
                            onClick={() => {
                              setClientesModalData(dadosAnalyticsMensal.topClientesMaisOrcamentos)
                              setClientesModalTitle('Top Clientes com Mais Orçamentos do Mês')
                              setShowClientesModal(true)
                            }}
                          >
                            Ver todos ({dadosAnalyticsMensal.topClientesMaisOrcamentos.length})
                          </button>
                        )}
                      </div>
                      <div className="top-clientes-list">
                        {dadosAnalyticsMensal.topClientesMaisOrcamentos.slice(0, 3).map((cliente, index) => (
                          <div key={cliente.id || index} className="top-cliente-item">
                            <div className="top-cliente-rank">
                              <span className="rank-number">{index + 1}</span>
                              <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                            </div>
                            <div className="top-cliente-info">
                              <div className="top-cliente-name">{cliente.nome}</div>
                              <div className="top-cliente-cpf">CPF: {formatCPF(cliente.cpf)}</div>
                              <div className="top-cliente-details">
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeOrcamentos} orçamentos
                                </span>
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeItensPagos} itens pagos
                                </span>
                                <span className="top-cliente-valor">
                                  {formatCurrency(cliente.valorTotalPago)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Clientes com Maior Valor do Mês */}
                  {dadosAnalyticsMensal.topClientesMaiorValor && dadosAnalyticsMensal.topClientesMaiorValor.length > 0 && (
                    <div className="top-clientes-section">
                      <div className="top-clientes-header">
                        <div className="top-clientes-title-container">
                          <div className="cliente-analytics-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                            <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                          </div>
                          <h3 className="top-clientes-title">Top Clientes com Maior Valor do Mês</h3>
                        </div>
                        {dadosAnalyticsMensal.topClientesMaiorValor.length > 3 && (
                          <button 
                            className="btn-ver-mais-clientes"
                            onClick={() => {
                              setClientesModalData(dadosAnalyticsMensal.topClientesMaiorValor)
                              setClientesModalTitle('Top Clientes com Maior Valor do Mês')
                              setShowClientesModal(true)
                            }}
                          >
                            Ver todos ({dadosAnalyticsMensal.topClientesMaiorValor.length})
                          </button>
                        )}
                      </div>
                      <div className="top-clientes-list">
                        {dadosAnalyticsMensal.topClientesMaiorValor.slice(0, 3).map((cliente, index) => (
                          <div key={cliente.id || index} className="top-cliente-item">
                            <div className="top-cliente-rank">
                              <span className="rank-number">{index + 1}</span>
                              <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                            </div>
                            <div className="top-cliente-info">
                              <div className="top-cliente-name">{cliente.nome}</div>
                              <div className="top-cliente-cpf">CPF: {formatCPF(cliente.cpf)}</div>
                              <div className="top-cliente-details">
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeOrcamentos} orçamentos
                                </span>
                                <span className="top-cliente-stat">
                                  {cliente.quantidadeItensPagos} itens pagos
                                </span>
                                <span className="top-cliente-valor">
                                  {formatCurrency(cliente.valorTotalPago)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!dadosAnalyticsMensal.topClientesMaisOrcamentos || dadosAnalyticsMensal.topClientesMaisOrcamentos.length === 0) && 
                   (!dadosAnalyticsMensal.topClientesMaiorValor || dadosAnalyticsMensal.topClientesMaiorValor.length === 0) && (
                    <div className="analytics-empty-state">
                      <FontAwesomeIcon icon={faUser} size="3x" />
                      <p>Nenhum dado disponível para este mês</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="analytics-empty-state">
                  <FontAwesomeIcon icon={faCalendarAlt} size="3x" />
                  <p>Selecione um mês para visualizar os dados</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Paciente</h3>
            <p>
              Tem certeza que deseja excluir o paciente <strong>{clienteToDelete?.nome}</strong>?
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={handleConfirmDelete}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Todos os Clientes */}
      {showClientesModal && clientesModalData && clientesModalData.length > 0 && (
        <div className="modal-overlay" onClick={() => {
          setShowClientesModal(false)
          setClientesModalData(null)
          setClientesModalTitle('')
        }}>
          <div className="modal-clientes" onClick={(e) => e.stopPropagation()}>
            <div className="modal-clientes-header">
              <h3 className="modal-clientes-title">
                <FontAwesomeIcon icon={faUser} /> {clientesModalTitle}
              </h3>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowClientesModal(false)
                  setClientesModalData(null)
                  setClientesModalTitle('')
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-clientes-content">
              <div className="modal-clientes-list">
                {clientesModalData.map((cliente, index) => (
                  <div key={cliente.id || index} className="modal-cliente-item">
                    <div className="modal-cliente-rank">
                      <span className="rank-number">{index + 1}</span>
                      <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                    </div>
                    <div className="modal-cliente-info">
                      <div className="modal-cliente-name">{cliente.nome}</div>
                      <div className="modal-cliente-cpf">CPF: {formatCPF(cliente.cpf)}</div>
                      <div className="modal-cliente-details">
                        <span className="modal-cliente-stat">
                          {cliente.quantidadeOrcamentos} orçamentos
                        </span>
                        <span className="modal-cliente-stat">
                          {cliente.quantidadeItensPagos} itens pagos
                        </span>
                        <span className="modal-cliente-valor">
                          {formatCurrency(cliente.valorTotalPago)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Clientes

