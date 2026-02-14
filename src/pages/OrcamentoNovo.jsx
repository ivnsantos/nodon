import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faUser, faPlus, faTimes,
  faFileInvoiceDollar, faDollarSign, faTrash, faEdit,
  faFileMedical, faSearch, faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './OrcamentoNovo.css'

const OrcamentoNovo = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const isEditMode = !!id
  const pacienteIdFromQuery = new URLSearchParams(location.search).get('pacienteId')
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [pacientes, setPacientes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [showPacienteSearch, setShowPacienteSearch] = useState(false)
  const [searchingPacientes, setSearchingPacientes] = useState(false)
  
  const [formData, setFormData] = useState({
    pacienteId: pacienteIdFromQuery || '',
    status: 'RASCUNHO',
    observacoes: '',
    itens: []
  })

  const [itemForm, setItemForm] = useState({
    tratamentoId: '',
    nome: '',
    descricao: '',
    preco: '',
    quantidade: 1,
    status: 'EM_ANALISE'
  })

  const itemStatusOptions = [
    { value: 'EM_ANALISE', label: 'Em Análise' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'RECUSADO', label: 'Recusado' },
    { value: 'PERDIDO', label: 'Perdido' }
  ]

  const [tratamentoSearchTerm, setTratamentoSearchTerm] = useState('')
  const [tratamentoSearchResults, setTratamentoSearchResults] = useState([])
  const [showTratamentoSearch, setShowTratamentoSearch] = useState(false)
  const [searchingTratamentos, setSearchingTratamentos] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemStatusDropdowns, setItemStatusDropdowns] = useState({})
  const itemStatusRefs = useRef({})

  const statusOptions = [
    { value: 'RASCUNHO', label: 'Rascunho' },
    { value: 'ENVIADO', label: 'Enviado' },
    { value: 'ACEITO', label: 'Aceito' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'RECUSADO', label: 'Recusado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ]

  // Carregar pacientes
  useEffect(() => {
    if (selectedClinicData) {
      loadPacientes()
    }
  }, [selectedClinicData])

  // Carregar dados do orçamento se estiver editando
  useEffect(() => {
    if (isEditMode && id) {
      loadOrcamentoData()
    } else if (pacienteIdFromQuery) {
      // Se veio da página do cliente, selecionar o paciente automaticamente
      const paciente = pacientes.find(p => p.id === pacienteIdFromQuery)
      if (paciente) {
        setSelectedPaciente(paciente)
        setFormData(prev => ({ ...prev, pacienteId: pacienteIdFromQuery }))
      }
    }
  }, [id, isEditMode, pacienteIdFromQuery, pacientes])

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(itemStatusDropdowns).forEach(key => {
        const ref = itemStatusRefs.current[key]
        if (ref && !ref.contains(event.target)) {
          setItemStatusDropdowns(prev => {
            const newState = { ...prev }
            delete newState[key]
            return newState
          })
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [itemStatusDropdowns])

  const loadPacientes = async () => {
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        return
      }

      const response = await api.get(`/pacientes?clienteMasterId=${clienteMasterId}`)
      const pacientesData = response.data?.data || response.data || []
      
      setPacientes(pacientesData)
      
      // Se tiver pacienteId na query, selecionar automaticamente
      if (pacienteIdFromQuery) {
        const paciente = pacientesData.find(p => p.id === pacienteIdFromQuery)
        if (paciente) {
          setSelectedPaciente(paciente)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setPacientes([])
    }
  }

  const loadOrcamentoData = async () => {
    setLoadingData(true)
    try {
      const response = await api.get(`/orcamentos/${id}`)
      const data = response.data?.data || response.data
      
      if (data) {
        setFormData({
          pacienteId: data.pacienteId || '',
          status: data.status || 'RASCUNHO',
          observacoes: data.observacoes || '',
          itens: (data.itens || []).map(item => ({
            ...item,
            status: item.status || 'EM_ANALISE'
          }))
        })
        
        // Buscar dados do paciente
        if (data.pacienteId) {
          const paciente = pacientes.find(p => p.id === data.pacienteId)
          if (paciente) {
            setSelectedPaciente(paciente)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error)
      showError('Erro ao carregar dados do orçamento. Tente novamente.')
    } finally {
      setLoadingData(false)
    }
  }

  // Buscar pacientes na API
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([])
      setShowPacienteSearch(false)
      return
    }

    const searchPacientes = async () => {
      setSearchingPacientes(true)
      try {
        const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
        
        if (!clienteMasterId) {
          setSearchResults([])
          setSearchingPacientes(false)
          return
        }

        // Detectar se é CPF (apenas números) ou nome
        const searchValue = searchTerm.trim()
        const isOnlyNumbers = /^\d+$/.test(searchValue)
        const cpfOnly = searchValue.replace(/\D/g, '')
        
        // Montar parâmetros da busca
        const params = {
          clienteMasterId: clienteMasterId
        }
        
        if (isOnlyNumbers && cpfOnly.length >= 3) {
          // Se for apenas números, buscar por CPF
          params.cpf = cpfOnly
        } else {
          // Caso contrário, buscar por nome
          params.nome = searchValue
          
          // Se tiver números também, adicionar CPF na busca
          if (cpfOnly.length >= 3) {
            params.cpf = cpfOnly
          }
        }

        const response = await api.get(`/pacientes/buscar`, { params })
        
        console.log('Resposta da API:', response.data)
        
        // A API pode retornar { statusCode, message, data: [...] } ou array direto
        let pacientesData = []
        if (response.data?.data && Array.isArray(response.data.data)) {
          pacientesData = response.data.data
        } else if (Array.isArray(response.data)) {
          pacientesData = response.data
        } else if (response.data?.statusCode === 200 && Array.isArray(response.data.data)) {
          pacientesData = response.data.data
        }
        
        console.log('Pacientes encontrados:', pacientesData)
        setSearchResults(pacientesData)
        setShowPacienteSearch(pacientesData.length > 0)
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error)
        // Se a rota /pacientes/buscar não existir, fazer busca local como fallback
        const searchLower = searchTerm.toLowerCase()
        const cpfOnly = searchTerm.replace(/\D/g, '')
        const filtered = pacientes.filter(p => 
          p.nome?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          (cpfOnly.length >= 3 && p.cpf?.replace(/\D/g, '').includes(cpfOnly))
        )
        setSearchResults(filtered)
        setShowPacienteSearch(filtered.length > 0)
      } finally {
        setSearchingPacientes(false)
      }
    }

    const timeoutId = setTimeout(searchPacientes, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedClinicData, pacientes])

  // Buscar tratamentos
  useEffect(() => {
    if (!tratamentoSearchTerm || tratamentoSearchTerm.trim().length < 2) {
      setTratamentoSearchResults([])
      setShowTratamentoSearch(false)
      return
    }

    const searchTratamentos = async () => {
      setSearchingTratamentos(true)
      try {
        const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
        
        if (!clienteMasterId) {
          setTratamentoSearchResults([])
          setSearchingTratamentos(false)
          return
        }

        const response = await api.get(`/treatments/buscar`, {
          params: {
            nome: tratamentoSearchTerm.trim(),
            clienteMasterId: clienteMasterId
          }
        })
        
        // A API retorna { statusCode, message, data: [...] }
        let tratamentos = []
        if (response.data?.data && Array.isArray(response.data.data)) {
          tratamentos = response.data.data
        } else if (Array.isArray(response.data)) {
          tratamentos = response.data
        }
        
        setTratamentoSearchResults(tratamentos)
        setShowTratamentoSearch(true)
      } catch (error) {
        console.error('Erro ao buscar tratamentos:', error)
        setTratamentoSearchResults([])
      } finally {
        setSearchingTratamentos(false)
      }
    }

    const timeoutId = setTimeout(searchTratamentos, 300)
    return () => clearTimeout(timeoutId)
  }, [tratamentoSearchTerm, selectedClinicData])

  const handleSelectPaciente = (paciente) => {
    setSelectedPaciente(paciente)
    setFormData(prev => ({ ...prev, pacienteId: paciente.id }))
    setSearchTerm('')
    setSearchResults([])
    setShowPacienteSearch(false)
  }

  const handleSelectTratamento = (tratamento) => {
    const precoValue = tratamento.price || tratamento.preco || tratamento.valor || ''
    setItemForm(prev => ({
      ...prev,
      tratamentoId: tratamento.id,
      nome: tratamento.name || tratamento.nome || '',
      descricao: tratamento.description || tratamento.descricao || tratamento.observacoes || '',
      preco: precoValue ? parseFloat(precoValue) : ''
    }))
    setTratamentoSearchTerm('')
    setTratamentoSearchResults([])
    setShowTratamentoSearch(false)
  }

  const handleAddItem = () => {
    if (!itemForm.nome || !itemForm.preco) {
      showError('Preencha pelo menos o nome e o preço do item')
      return
    }

    const newItem = {
      tratamentoId: itemForm.tratamentoId || null,
      nome: itemForm.nome,
      descricao: itemForm.descricao || '',
      preco: parseFloat(itemForm.preco),
      quantidade: parseInt(itemForm.quantidade) || 1,
      status: itemForm.status || 'EM_ANALISE',
      ordem: formData.itens.length
    }

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }))

    // Limpar formulário de item
    setItemForm({
      tratamentoId: '',
      nome: '',
      descricao: '',
      preco: '',
      quantidade: 1,
      status: 'EM_ANALISE'
    })
    setTratamentoSearchTerm('')
    setTratamentoSearchResults([])
    setShowTratamentoSearch(false)
    
    // Fechar o formulário após adicionar
    setShowItemForm(false)
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const calcularValorTotal = () => {
    return formData.itens
      .filter(item => item.status === 'EM_ANALISE' || item.status === 'PAGO')
      .reduce((total, item) => total + (item.preco * item.quantidade), 0)
  }

  const getItemStatusColor = (status) => {
    const colors = {
      'EM_ANALISE': '#0ea5e9',
      'PAGO': '#10b981',
      'RECUSADO': '#ef4444',
      'PERDIDO': '#6b7280'
    }
    return colors[status] || '#9ca3af'
  }

  const getItemStatusLabel = (status) => {
    const option = itemStatusOptions.find(opt => opt.value === status)
    return option ? option.label : status
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.pacienteId) {
      showError('Selecione um paciente')
      return
    }

    if (formData.itens.length === 0) {
      showError('Adicione pelo menos um item ao orçamento')
      return
    }

    setLoading(true)
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        setLoading(false)
        return
      }

      const payload = {
        pacienteId: formData.pacienteId,
        status: formData.status,
        observacoes: formData.observacoes,
        itens: formData.itens
      }

      let response
      if (isEditMode) {
        response = await api.patch(`/orcamentos/${id}`, payload, {
          headers: {
            'X-Cliente-Master-Id': clienteMasterId
          }
        })
      } else {
        response = await api.post(`/orcamentos`, payload, {
          headers: {
            'X-Cliente-Master-Id': clienteMasterId
          }
        })
      }

      showSuccess(isEditMode ? 'Orçamento atualizado com sucesso!' : 'Orçamento criado com sucesso!')
      
      setTimeout(() => {
        navigate('/app/orcamentos')
      }, 1500)
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao salvar orçamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="orcamento-novo-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do orçamento...</p>
      </div>
    )
  }

  return (
    <div className="orcamento-novo-modern">
      <AlertModal {...alertConfig} onClose={hideAlert} />

      <div className="orcamento-novo-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/app/orcamentos')}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <h2>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          {isEditMode ? 'Editar Orçamento' : 'Novo Orçamento'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="orcamento-form">
        {/* Seleção de Paciente */}
        <div className="form-section">
          <label className="section-label">
            <FontAwesomeIcon icon={faUser} /> Paciente
          </label>
          {selectedPaciente ? (
            <div className="selected-paciente-card">
              <div className="paciente-info">
                <strong>{selectedPaciente.nome}</strong>
                {selectedPaciente.email && <span>{selectedPaciente.email}</span>}
              </div>
              <button
                type="button"
                className="btn-change-paciente"
                onClick={() => {
                  setSelectedPaciente(null)
                  setFormData(prev => ({ ...prev, pacienteId: '' }))
                  setShowPacienteSearch(true)
                }}
              >
                <FontAwesomeIcon icon={faEdit} /> Trocar
              </button>
            </div>
          ) : (
            <div className={`paciente-search-card ${searchResults.length > 0 ? 'expanded' : ''}`}>
              <div className="paciente-search-input-container">
                <input
                  type="text"
                  className="paciente-search-input-simple"
                  placeholder="Buscar paciente por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowPacienteSearch(true)
                    }
                  }}
                />
                {searchingPacientes && (
                  <div className="paciente-search-spinner">
                    <div className="loading-spinner-small"></div>
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="paciente-search-results-expanded">
                  {searchResults.map(paciente => (
                    <div
                      key={paciente.id}
                      className="paciente-result-item"
                      onClick={() => handleSelectPaciente(paciente)}
                    >
                      <div className="paciente-result-name">{paciente.nome}</div>
                      {paciente.email && (
                        <div className="paciente-result-email">{paciente.email}</div>
                      )}
                      {paciente.cpf && (
                        <div className="paciente-result-cpf">CPF: {paciente.cpf}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!searchingPacientes && searchTerm.length >= 2 && searchResults.length === 0 && (
                <div className="paciente-search-empty">
                  Nenhum paciente encontrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="form-section">
          <label className="section-label">Status do Orçamento</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Itens do Orçamento */}
        <div className="form-section">
          <div className="section-header-with-button">
            <label className="section-label">Itens do Orçamento</label>
            {!showItemForm && (
              <button
                type="button"
                className="btn-open-item-form"
                onClick={() => setShowItemForm(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Adicionar Item
              </button>
            )}
          </div>
          
          {/* Formulário de Novo Item */}
          {showItemForm && (
            <div className="item-form-card">
            {/* Busca de Tratamento */}
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faFileMedical} /> Buscar Tratamento (opcional)
              </label>
              <div className="tratamento-search-wrapper">
                <input
                  type="text"
                  className="tratamento-search-input"
                  placeholder="Buscar tratamento por nome..."
                  value={tratamentoSearchTerm}
                  onChange={(e) => {
                    setTratamentoSearchTerm(e.target.value)
                    setShowTratamentoSearch(true)
                  }}
                  onFocus={() => {
                    if (tratamentoSearchResults.length > 0) {
                      setShowTratamentoSearch(true)
                    }
                  }}
                />
                {tratamentoSearchTerm && (
                  <button
                    type="button"
                    className="clear-tratamento-search"
                    onClick={() => {
                      setTratamentoSearchTerm('')
                      setTratamentoSearchResults([])
                      setShowTratamentoSearch(false)
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
                {searchingTratamentos && (
                  <div className="tratamento-search-loading">
                    <div className="loading-spinner-small"></div>
                  </div>
                )}
                {showTratamentoSearch && tratamentoSearchResults.length > 0 && (
                  <div className="tratamento-search-results">
                    {tratamentoSearchResults.map(tratamento => {
                      const precoValue = tratamento.price || tratamento.preco
                      return (
                        <div
                          key={tratamento.id}
                          className="tratamento-search-item"
                          onClick={() => handleSelectTratamento(tratamento)}
                        >
                          <div>
                            <strong>{tratamento.name || tratamento.nome}</strong>
                            {precoValue && (
                              <span>{formatCurrency(parseFloat(precoValue))}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {showTratamentoSearch && !searchingTratamentos && tratamentoSearchTerm.length >= 2 && tratamentoSearchResults.length === 0 && (
                  <div className="tratamento-search-no-results">
                    <span>Nenhum tratamento encontrado</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nome do Item *</label>
                <input
                  type="text"
                  value={itemForm.nome}
                  onChange={(e) => setItemForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Tratamento de Canal"
                  required
                />
              </div>
              <div className="form-group">
                <label>Preço *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.preco}
                  onChange={(e) => setItemForm(prev => ({ ...prev, preco: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={itemForm.quantidade}
                  onChange={(e) => setItemForm(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea
                value={itemForm.descricao}
                onChange={(e) => setItemForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição detalhada do item..."
                rows="2"
              />
            </div>
            <div className="form-group">
              <label>Status do Item</label>
              <select
                value={itemForm.status}
                onChange={(e) => setItemForm(prev => ({ ...prev, status: e.target.value }))}
              >
                {itemStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="item-form-actions">
              <button
                type="button"
                className="btn-cancel-item"
                onClick={() => {
                  setShowItemForm(false)
                  setItemForm({
                    tratamentoId: '',
                    nome: '',
                    descricao: '',
                    preco: '',
                    quantidade: 1,
                    status: 'EM_ANALISE'
                  })
                  setTratamentoSearchTerm('')
                  setTratamentoSearchResults([])
                  setShowTratamentoSearch(false)
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-add-item"
                onClick={handleAddItem}
              >
                <FontAwesomeIcon icon={faPlus} /> Adicionar
              </button>
            </div>
          </div>
          )}

          {/* Lista de Itens */}
          {formData.itens.length > 0 && (
            <div className="itens-list">
              {formData.itens.map((item, index) => (
                <div key={index} className="item-card">
                  <div className="item-header">
                    <div className="item-info">
                      <div className="item-title-row">
                        <strong>{item.nome}</strong>
                        <div 
                          className="status-dropdown-container" 
                          ref={el => itemStatusRefs.current[index] = el}
                        >
                          <span 
                            className="item-status-badge status-badge-clickable"
                            style={{ backgroundColor: getItemStatusColor(item.status) }}
                            onClick={() => setItemStatusDropdowns(prev => ({
                              ...prev,
                              [index]: !prev[index]
                            }))}
                            title="Clique para alterar status"
                          >
                            {getItemStatusLabel(item.status)}
                            <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${itemStatusDropdowns[index] ? 'open' : ''}`} />
                          </span>
                          {itemStatusDropdowns[index] && (
                            <div className="status-dropdown-menu">
                              {itemStatusOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`status-dropdown-item ${item.status === option.value ? 'active' : ''}`}
                                  style={{ backgroundColor: getItemStatusColor(option.value) }}
                                  onClick={() => {
                                    const updatedItens = formData.itens.map((it, idx) => 
                                      idx === index ? { ...it, status: option.value } : it
                                    )
                                    setFormData(prev => ({ ...prev, itens: updatedItens }))
                                    setItemStatusDropdowns(prev => {
                                      const newState = { ...prev }
                                      delete newState[index]
                                      return newState
                                    })
                                  }}
                                >
                                  <span>{option.label}</span>
                                  {item.status === option.value && (
                                    <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span>{formatCurrency(item.preco)} × {item.quantidade} = {formatCurrency(item.preco * item.quantidade)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  {item.descricao && (
                    <p className="item-descricao">{item.descricao}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Valor Total */}
          {formData.itens.length > 0 && (
            <div className="valor-total-card">
              <div className="valor-total-label">Valor Total:</div>
              <div className="valor-total-value">{formatCurrency(calcularValorTotal())}</div>
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="form-section">
          <label className="section-label">Observações</label>
          <textarea
            className="form-textarea"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações sobre o orçamento..."
            rows="3"
          />
        </div>

        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/app/orcamentos')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner-small"></div>
                Salvando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                {isEditMode ? 'Atualizar' : 'Criar'} Orçamento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OrcamentoNovo

