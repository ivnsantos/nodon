import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faEdit, faTrash, faDollarSign, faTags, faBox,
  faSpinner, faTimes, faClock, faLayerGroup, faShoppingCart,
  faChevronDown, faChevronUp, faCoins, faChartLine, faPercent,
  faExclamationTriangle, faCheckCircle, faSearch, faBuilding,
  faChartBar, faChartPie, faWrench, faSave
} from '@fortawesome/free-solid-svg-icons'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import { useAuth } from '../context/AuthContext'
import './Precificacao.css'

const Precificacao = () => {
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showSuccess, showError, hideAlert } = useAlert()
  
  const [activeTab, setActiveTab] = useState('tratamentos') // 'tratamentos', 'categorias', 'produtos', 'custos-indiretos', 'graficos'
  const [loading, setLoading] = useState(true)
  
  // Estados para Tratamentos
  const [tratamentos, setTratamentos] = useState([])
  const [searchTratamento, setSearchTratamento] = useState('')
  
  // Estados para Categorias
  const [categorias, setCategorias] = useState([])
  
  // Estados para Produtos
  const [produtos, setProdutos] = useState([])
  
  // Estado para produtos expandidos
  const [expandedProducts, setExpandedProducts] = useState(new Set())
  
  // Estado para categorias indiretas expandidas
  const [expandedCategorias, setExpandedCategorias] = useState(new Set())
  
  // Estados para modais de confirmação
  const [showDeleteTratamentoModal, setShowDeleteTratamentoModal] = useState(false)
  const [showDeleteCategoriaModal, setShowDeleteCategoriaModal] = useState(false)
  const [showDeleteProdutoModal, setShowDeleteProdutoModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState({ type: null, id: null, name: null })
  
  // Estados para Valor Mão de Obra
  const [showValorHoraModal, setShowValorHoraModal] = useState(false)
  const [valorHora, setValorHora] = useState(null)
  const [loadingValorHora, setLoadingValorHora] = useState(false)
  const [valorHoraInput, setValorHoraInput] = useState('')
  const [valorHoraLoaded, setValorHoraLoaded] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Carregar valor da mão de obra quando selectedClinicData estiver disponível
  useEffect(() => {
    const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
    
    // Carregar sempre que selectedClinicData mudar e tiver clienteMasterId
    if (clienteMasterId) {
      loadValorHoraOnMount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicData])

  const loadData = async () => {
    try {
      setLoading(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      if (activeTab === 'tratamentos') {
        await loadTratamentos(clienteMasterId)
      } else if (activeTab === 'categorias') {
        await loadCategorias(clienteMasterId)
      } else if (activeTab === 'produtos') {
        await loadProdutos(clienteMasterId)
        await loadCategorias(clienteMasterId) // Carregar categorias para o select
      } else if (activeTab === 'custos-indiretos') {
        await loadCategorias(clienteMasterId)
        await loadProdutos(clienteMasterId)
      } else if (activeTab === 'graficos') {
        // Não precisa carregar tratamentos aqui, será feito no componente de gráficos
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadTratamentos = async (clienteMasterId) => {
    try {
      const response = await api.get(`/treatments?clienteMasterId=${clienteMasterId}`)
      const data = response.data?.data || response.data || []
      setTratamentos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar tratamentos:', error)
      showError('Erro ao carregar tratamentos')
    }
  }

  const loadCategorias = async (clienteMasterId) => {
    try {
      const response = await api.get(`/cost-categories?clienteMasterId=${clienteMasterId}`)
      const data = response.data?.data || response.data || []
      setCategorias(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      showError('Erro ao carregar categorias')
    }
  }

  const loadProdutos = async (clienteMasterId) => {
    try {
      const response = await api.get(`/products?clienteMasterId=${clienteMasterId}`)
      const data = response.data?.data || response.data || []
      setProdutos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      showError('Erro ao carregar produtos')
    }
  }

  // Funções para Tratamentos
  const handleCreateTratamento = () => {
    navigate('/app/precificacao/tratamento/novo')
  }

  const handleEditTratamento = (tratamento) => {
    navigate(`/app/precificacao/tratamento/${tratamento.id}/editar`)
  }

  const handleDeleteTratamento = (tratamento) => {
    setItemToDelete({ type: 'tratamento', id: tratamento.id, name: tratamento.name })
    setShowDeleteTratamentoModal(true)
  }

  const confirmDeleteTratamento = async () => {
    try {
      await api.delete(`/treatments/${itemToDelete.id}`)
      showSuccess('Tratamento excluído com sucesso!')
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      await loadTratamentos(clienteMasterId)
      setShowDeleteTratamentoModal(false)
      setItemToDelete({ type: null, id: null, name: null })
    } catch (error) {
      console.error('Erro ao excluir tratamento:', error)
      showError(error.response?.data?.message || 'Erro ao excluir tratamento')
    }
  }

  // Funções para Categorias
  const handleCreateCategoria = () => {
    navigate('/app/precificacao/categoria/novo')
  }

  const handleEditCategoria = (categoria) => {
    navigate(`/app/precificacao/categoria/${categoria.id}/editar`)
  }

  const handleDeleteCategoria = (categoria) => {
    setItemToDelete({ type: 'categoria', id: categoria.id, name: categoria.name })
    setShowDeleteCategoriaModal(true)
  }

  const confirmDeleteCategoria = async () => {
    try {
      await api.delete(`/cost-categories/${itemToDelete.id}`)
      showSuccess('Categoria excluída com sucesso!')
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      await loadCategorias(clienteMasterId)
      if (activeTab === 'produtos') {
        await loadProdutos(clienteMasterId)
      }
      setShowDeleteCategoriaModal(false)
      setItemToDelete({ type: null, id: null, name: null })
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      showError(error.response?.data?.message || 'Erro ao excluir categoria')
    }
  }

  // Funções para Produtos
  const handleCreateProduto = () => {
    navigate('/app/precificacao/produto/novo')
  }

  const handleEditProduto = (produto) => {
    navigate(`/app/precificacao/produto/${produto.id}/editar`)
  }

  const handleDeleteProduto = (produto) => {
    setItemToDelete({ type: 'produto', id: produto.id, name: produto.name })
    setShowDeleteProdutoModal(true)
  }

  const confirmDeleteProduto = async () => {
    try {
      await api.delete(`/products/${itemToDelete.id}`)
      showSuccess('Produto excluído com sucesso!')
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      await loadProdutos(clienteMasterId)
      setShowDeleteProdutoModal(false)
      setItemToDelete({ type: null, id: null, name: null })
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      showError(error.response?.data?.message || 'Erro ao excluir produto')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  // Funções para Valor Mão de Obra
  const loadValorHora = async () => {
    try {
      setLoadingValorHora(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      const response = await api.get(`/clientes-master/${clienteMasterId}/valorhora`)
      
      // A estrutura é: response.data.data.data.valorhora (aninhada)
      let valor = null
      
      // Forma 1: response.data.data.data.valorhora (estrutura real da API)
      if (response.data?.data?.data?.valorhora !== undefined) {
        valor = response.data.data.data.valorhora
      }
      // Forma 2: response.data.data.data.valorHora
      else if (response.data?.data?.data?.valorHora !== undefined) {
        valor = response.data.data.data.valorHora
      }
      // Forma 3: response.data.data.valorhora
      else if (response.data?.data?.valorhora !== undefined) {
        valor = response.data.data.valorhora
      }
      // Forma 4: response.data.data.valorHora
      else if (response.data?.data?.valorHora !== undefined) {
        valor = response.data.data.valorHora
      }
      // Forma 5: response.data.valorhora
      else if (response.data?.valorhora !== undefined) {
        valor = response.data.valorhora
      }
      // Forma 6: response.data.valorHora
      else if (response.data?.valorHora !== undefined) {
        valor = response.data.valorHora
      }
      
      // Converter para número e validar (o valor vem como string "500.50")
      if (valor !== null && valor !== undefined && valor !== '' && !isNaN(Number(valor)) && Number(valor) >= 0) {
        const valorNumerico = Number(valor)
        setValorHora(valorNumerico)
        setValorHoraInput(valorNumerico.toString())
      } else {
        setValorHora(null)
        setValorHoraInput('')
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setValorHora(null)
        setValorHoraInput('')
      } else {
        console.error('Erro ao carregar valor hora:', error)
        showError('Erro ao carregar valor da mão de obra')
      }
    } finally {
      setLoadingValorHora(false)
    }
  }

  const saveValorHora = async () => {
    try {
      setLoadingValorHora(true)
      
      // Limpar espaços e validar se está vazio
      const valorInput = valorHoraInput.trim()
      if (!valorInput) {
        showError('Por favor, informe um valor')
        setLoadingValorHora(false)
        return
      }

      // Converter para número
      const valor = Number(valorInput)
      
      // Validar se é um número válido e >= 0 (backend aceita 0 ou maior)
      if (isNaN(valor) || valor < 0) {
        showError('Por favor, informe um valor válido maior ou igual a zero')
        setLoadingValorHora(false)
        return
      }

      // Enviar como número válido usando camelCase (backend aceita ambos)
      await api.post('/clientes-master/meus-dados', {
        valorHora: valor
      })
      
      setValorHora(valor)
      showSuccess('Valor da mão de obra salvo com sucesso!')
      setShowValorHoraModal(false)
      
      // Mostrar loading e recarregar os dados da página
      setLoading(true)
      await loadData()
      setLoading(false)
    } catch (error) {
      console.error('Erro ao salvar valor hora:', error)
      showError(error.response?.data?.message || 'Erro ao salvar valor da mão de obra')
    } finally {
      setLoadingValorHora(false)
    }
  }

  const handleOpenValorHoraModal = async () => {
    setShowValorHoraModal(true)
    // Carregar o valor antes de abrir o modal para garantir que está atualizado
    await loadValorHora()
  }

  // Carregar valor da mão de obra ao montar (sem abrir modal automaticamente)
  const loadValorHoraOnMount = async () => {
    try {
      setLoadingValorHora(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        return
      }

      const response = await api.get(`/clientes-master/${clienteMasterId}/valorhora`)
      
      // A estrutura é: response.data.data.data.valorhora (aninhada)
      let valor = null
      
      // Forma 1: response.data.data.data.valorhora (estrutura real da API)
      if (response.data?.data?.data?.valorhora !== undefined) {
        valor = response.data.data.data.valorhora
      }
      // Forma 2: response.data.data.data.valorHora
      else if (response.data?.data?.data?.valorHora !== undefined) {
        valor = response.data.data.data.valorHora
      }
      // Forma 3: response.data.data.valorhora
      else if (response.data?.data?.valorhora !== undefined) {
        valor = response.data.data.valorhora
      }
      // Forma 4: response.data.data.valorHora
      else if (response.data?.data?.valorHora !== undefined) {
        valor = response.data.data.valorHora
      }
      // Forma 5: response.data.valorhora
      else if (response.data?.valorhora !== undefined) {
        valor = response.data.valorhora
      }
      // Forma 6: response.data.valorHora
      else if (response.data?.valorHora !== undefined) {
        valor = response.data.valorHora
      }
      
      // Converter para número e validar (o valor vem como string "500.50")
      if (valor !== null && valor !== undefined && valor !== '' && !isNaN(Number(valor)) && Number(valor) >= 0) {
        const valorNumerico = Number(valor)
        setValorHora(valorNumerico)
        setValorHoraInput(valorNumerico.toString())
      } else {
        setValorHora(null)
        setValorHoraInput('')
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Se não encontrar (404), não tem valor configurado
        setValorHora(null)
        setValorHoraInput('')
        // Não abrir modal automaticamente - deixar o usuário abrir quando quiser
      } else {
        console.error('Erro ao carregar valor hora:', error)
        setValorHora(null)
        setValorHoraInput('')
      }
    } finally {
      setLoadingValorHora(false)
    }
  }

  if (loading && tratamentos.length === 0 && categorias.length === 0 && produtos.length === 0) {
    return (
      <div className="precificacao-page">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="precificacao-page">
      <AlertModal {...alertConfig} onClose={hideAlert} />

      {/* Botão Valor Mão de Obra */}
      <div className="precificacao-header-actions">
        <button 
          className="btn-valor-hora"
          onClick={handleOpenValorHoraModal}
          title="Gerenciar Valor Mão de Obra"
        >
          <FontAwesomeIcon icon={faWrench} />
          <span>Valor Mão de Obra</span>
          {valorHora !== null && valorHora !== undefined && !isNaN(Number(valorHora)) && Number(valorHora) >= 0 && (
            <span className="valor-hora-badge">{formatCurrency(Number(valorHora))}/hora</span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="precificacao-tabs">
        <button
          className={`tab-button ${activeTab === 'tratamentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('tratamentos')}
        >
          <FontAwesomeIcon icon={faBox} />
          <span>Tratamentos</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          <FontAwesomeIcon icon={faTags} />
          <span>Categorias</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'produtos' ? 'active' : ''}`}
          onClick={() => setActiveTab('produtos')}
        >
          <FontAwesomeIcon icon={faBox} />
          <span>Produtos</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'custos-indiretos' ? 'active' : ''}`}
          onClick={() => setActiveTab('custos-indiretos')}
        >
          <FontAwesomeIcon icon={faBuilding} />
          <span>Custos Indiretos</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'graficos' ? 'active' : ''}`}
          onClick={() => setActiveTab('graficos')}
        >
          <FontAwesomeIcon icon={faChartBar} />
          <span>Gráficos</span>
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="precificacao-content">
        {/* Tab Tratamentos */}
        {activeTab === 'tratamentos' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Tratamentos</h2>
              <button className="btn-primary" onClick={handleCreateTratamento}>
                <FontAwesomeIcon icon={faPlus} />
                Novo Tratamento
              </button>
            </div>

            {/* Campo de busca */}
            {tratamentos.length > 0 && (
              <div className="search-container">
                <div className="search-input-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar tratamento por nome..."
                    value={searchTratamento}
                    onChange={(e) => setSearchTratamento(e.target.value)}
                  />
                  {searchTratamento && (
                    <button
                      className="search-clear"
                      onClick={() => setSearchTratamento('')}
                      title="Limpar busca"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {(() => {
              // Filtrar tratamentos baseado na busca
              const filteredTratamentos = tratamentos.filter(tratamento => {
                if (!searchTratamento.trim()) return true
                const searchTerm = searchTratamento.toLowerCase().trim()
                return tratamento.name?.toLowerCase().includes(searchTerm) ||
                       tratamento.description?.toLowerCase().includes(searchTerm)
              })

              return filteredTratamentos.length === 0 ? (
                tratamentos.length === 0 ? (
                  <div className="empty-state">
                    <FontAwesomeIcon icon={faBox} size="3x" />
                    <p>Nenhum tratamento cadastrado</p>
                    <button className="btn-primary" onClick={handleCreateTratamento}>
                      <FontAwesomeIcon icon={faPlus} />
                      Criar Primeiro Tratamento
                    </button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <FontAwesomeIcon icon={faSearch} size="3x" />
                    <p>Nenhum tratamento encontrado para "{searchTratamento}"</p>
                    <button className="btn-secondary" onClick={() => setSearchTratamento('')}>
                      Limpar busca
                    </button>
                  </div>
                )
              ) : (
                <div className="tratamentos-grid">
                  {filteredTratamentos.map((tratamento) => {
                  const lucro = tratamento.lucro || 0
                  const price = tratamento.price || 0
                  const profitPercentage = price > 0 ? (lucro / price * 100) : 0
                  let profitStatus = 'excellent' // 'attention', 'low', 'reasonable', 'good', 'excellent'
                  let profitWarning = null
                  
                  if (profitPercentage <= 10) {
                    profitStatus = 'attention'
                    profitWarning = 'Atenção (Procure meios de ser mais lucrativo)'
                  } else if (profitPercentage <= 20) {
                    profitStatus = 'low'
                    profitWarning = 'Lucro Baixo'
                  } else if (profitPercentage <= 30) {
                    profitStatus = 'reasonable'
                    profitWarning = 'Lucro Bruto Razoável'
                  } else if (profitPercentage <= 40) {
                    profitStatus = 'good'
                    profitWarning = 'Bom Lucro'
                  } else {
                    profitStatus = 'excellent'
                    profitWarning = 'Ótimo Lucro Bruto'
                  }
                  
                  return (
                  <div key={tratamento.id} className={`tratamento-card profit-card-${profitStatus}`}>
                    {/* Barra de status no topo */}
                    <div className={`profit-status-bar profit-bar-${profitStatus}`}></div>
                    
                    {/* Indicador de status */}
                    <div className={`profit-status-indicator profit-indicator-${profitStatus}`}>
                      {profitStatus === 'excellent' || profitStatus === 'good' ? (
                        <FontAwesomeIcon icon={faCheckCircle} />
                      ) : (
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                      )}
                    </div>
                    
                    {profitWarning && (
                      <div className={`profit-warning-badge profit-warning-${profitStatus}`}>
                        <span>{profitWarning}</span>
                      </div>
                    )}
                    <div className="card-header">
                      <div className="card-title-section">
                        <h3>{tratamento.name}</h3>
                        {tratamento.description && (
                          <p className="card-subtitle">{tratamento.description}</p>
                        )}
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEditTratamento(tratamento)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteTratamento(tratamento)}
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    <div className="card-info-grid">
                      <div className="info-item-compact">
                        <FontAwesomeIcon icon={faDollarSign} className="info-icon-compact price" />
                        <div className="info-text-compact">
                          <span className="info-label-compact">Preço</span>
                          <span className="info-value-compact">{formatCurrency(tratamento.price || 0)}</span>
                        </div>
                      </div>
                      <div className="info-item-compact">
                        <FontAwesomeIcon icon={faCoins} className="info-icon-compact cost" />
                        <div className="info-text-compact">
                          <span className="info-label-compact">Custo</span>
                          <span className="info-value-compact">{formatCurrency(tratamento.custo || 0)}</span>
                        </div>
                      </div>
                      <div className={`profit-group profit-status-${profitStatus}`}>
                        <div className="info-item-compact profit-card">
                          <FontAwesomeIcon icon={faChartLine} className={`info-icon-compact profit profit-${profitStatus}`} />
                          <div className="info-text-compact">
                            <span className="info-label-compact">Lucro</span>
                            <span className={`info-value-compact profit-value-${profitStatus}`}>
                              {formatCurrency(lucro)}
                            </span>
                          </div>
                        </div>
                        {price > 0 && (
                          <div className="info-item-compact percentage-card">
                            <FontAwesomeIcon icon={faPercent} className={`info-icon-compact percentage percentage-${profitStatus}`} />
                            <div className="info-text-compact">
                              <span className="info-label-compact">Lucro %</span>
                              <span className={`info-value-compact percentage-value-${profitStatus}`}>
                                {profitPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="info-item-compact">
                        <FontAwesomeIcon icon={faClock} className="info-icon-compact duration" />
                        <div className="info-text-compact">
                          <span className="info-label-compact">Duração</span>
                          <span className="info-value-compact">{formatMinutes(tratamento.averageDurationMinutes || 0)}</span>
                        </div>
                      </div>
                      <div className="info-item-compact">
                        <FontAwesomeIcon icon={faBox} className="info-icon-compact products" />
                        <div className="info-text-compact">
                          <span className="info-label-compact">Produtos</span>
                          <span className="info-value-compact">{tratamento.treatmentProducts?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {tratamento.treatmentProducts && tratamento.treatmentProducts.length > 0 && (
                      <div className="card-products">
                        <button
                          className="products-header-btn"
                          onClick={() => {
                            const newExpanded = new Set(expandedProducts)
                            if (newExpanded.has(tratamento.id)) {
                              newExpanded.delete(tratamento.id)
                            } else {
                              newExpanded.add(tratamento.id)
                            }
                            setExpandedProducts(newExpanded)
                          }}
                        >
                          <div className="products-header">
                            <FontAwesomeIcon icon={faLayerGroup} />
                            <strong>Produtos utilizados ({tratamento.treatmentProducts.length})</strong>
                          </div>
                          <FontAwesomeIcon 
                            icon={expandedProducts.has(tratamento.id) ? faChevronUp : faChevronDown}
                            className="expand-icon"
                          />
                        </button>
                        {expandedProducts.has(tratamento.id) && (
                          <div className="products-list">
                            {tratamento.treatmentProducts.map((tp) => (
                              <div key={tp.id} className="product-tag">
                                <span className="product-name">{tp.product?.name || 'Produto'}</span>
                                <span className="product-quantity">Qtd: {tp.quantityUsed}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* Tab Categorias */}
        {activeTab === 'categorias' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Categorias de Custo</h2>
              <button className="btn-primary" onClick={handleCreateCategoria}>
                <FontAwesomeIcon icon={faPlus} />
                Nova Categoria
              </button>
            </div>

            {categorias.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faTags} size="3x" />
                <p>Nenhuma categoria cadastrada</p>
                <button className="btn-primary" onClick={handleCreateCategoria}>
                  <FontAwesomeIcon icon={faPlus} />
                  Criar Primeira Categoria
                </button>
              </div>
            ) : (
              <div className="categorias-grid">
                {categorias.map((categoria) => (
                  <div key={categoria.id} className="categoria-card">
                    <div className="card-header">
                      <h3>{categoria.name}</h3>
                      <div className="card-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEditCategoria(categoria)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteCategoria(categoria)}
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    <div className="categoria-info-section">
                      <div className={`type-badge-large ${categoria.type === 'DIRECT' ? 'direct' : 'indirect'}`}>
                        <div className="badge-icon">
                          {categoria.type === 'DIRECT' ? (
                            <FontAwesomeIcon icon={faTags} />
                          ) : (
                            <FontAwesomeIcon icon={faLayerGroup} />
                          )}
                        </div>
                        <span className="badge-text">
                          {categoria.type === 'DIRECT' ? 'Custo Direto' : 'Custo Indireto'}
                        </span>
                      </div>
                      <div className="categoria-products-info">
                        <FontAwesomeIcon icon={faBox} />
                        <span>{categoria.products?.length || 0} produto(s)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Produtos */}
        {activeTab === 'produtos' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Produtos</h2>
              <button className="btn-primary" onClick={handleCreateProduto}>
                <FontAwesomeIcon icon={faPlus} />
                Novo Produto
              </button>
            </div>

            {produtos.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faBox} size="3x" />
                <p>Nenhum produto cadastrado</p>
                <button className="btn-primary" onClick={handleCreateProduto}>
                  <FontAwesomeIcon icon={faPlus} />
                  Criar Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="produtos-grid">
                {produtos.map((produto) => (
                  <div key={produto.id} className="produto-card">
                    <div className="card-header">
                      <h3>{produto.name}</h3>
                      <div className="card-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEditProduto(produto)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteProduto(produto)}
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    <div className="produto-info-grid">
                      <div className="produto-info-card">
                        <div className="produto-info-icon cost">
                          <FontAwesomeIcon icon={faDollarSign} />
                        </div>
                        <div className="produto-info-content">
                          <span className="produto-info-label">Custo Unitário</span>
                          <span className="produto-info-value">{formatCurrency(produto.unitCost || 0)}</span>
                        </div>
                      </div>
                      <div className="produto-info-card">
                        <div className="produto-info-icon category">
                          <FontAwesomeIcon icon={faTags} />
                        </div>
                        <div className="produto-info-content">
                          <span className="produto-info-label">Categoria</span>
                          <span className="produto-info-value">{produto.category?.name || 'Sem categoria'}</span>
                        </div>
                      </div>
                      {produto.unitType && (
                        <div className="produto-info-card">
                          <div className="produto-info-icon type">
                            <FontAwesomeIcon icon={faLayerGroup} />
                          </div>
                          <div className="produto-info-content">
                            <span className="produto-info-label">Tipo</span>
                            <span className="produto-info-value">{produto.unitType}</span>
                          </div>
                        </div>
                      )}
                      {produto.stockQuantity !== null && produto.stockQuantity !== undefined && (
                        <div className="produto-info-card">
                          <div className="produto-info-icon stock">
                            <FontAwesomeIcon icon={faShoppingCart} />
                          </div>
                          <div className="produto-info-content">
                            <span className="produto-info-label">Estoque</span>
                            <span className="produto-info-value">{produto.stockQuantity} {produto.unitType || ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Custos Indiretos */}
        {activeTab === 'custos-indiretos' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Custos Indiretos</h2>
              <button className="btn-primary" onClick={handleCreateCategoria}>
                <FontAwesomeIcon icon={faPlus} />
                Nova Categoria
              </button>
            </div>

            {(() => {
              const categoriasIndiretas = categorias.filter(cat => cat.type === 'INDIRECT')
              const produtosIndiretos = produtos.filter(prod => prod.category?.type === 'INDIRECT')
              const totalCustoIndireto = produtosIndiretos.reduce((acc, prod) => {
                return acc + (Number(prod.unitCost) || 0)
              }, 0)

              return (
                <>
                  {/* Resumo dos Custos Indiretos */}
                  <div className="indirect-costs-summary">
                    <div className="summary-card">
                      <div className="summary-icon indirect">
                        <FontAwesomeIcon icon={faBuilding} />
                      </div>
                      <div className="summary-content">
                        <span className="summary-label">Categorias Indiretas</span>
                        <span className="summary-value">{categoriasIndiretas.length}</span>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon products">
                        <FontAwesomeIcon icon={faBox} />
                      </div>
                      <div className="summary-content">
                        <span className="summary-label">Produtos Indiretos</span>
                        <span className="summary-value">{produtosIndiretos.length}</span>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon cost">
                        <FontAwesomeIcon icon={faCoins} />
                      </div>
                      <div className="summary-content">
                        <span className="summary-label">Custo Total</span>
                        <span className="summary-value">{formatCurrency(totalCustoIndireto)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Categorias Indiretas */}
                  <div className="section-divider">
                    <h3>Categorias de Custo Indireto</h3>
                  </div>

                  {categoriasIndiretas.length === 0 ? (
                    <div className="empty-state">
                      <FontAwesomeIcon icon={faBuilding} size="3x" />
                      <p>Nenhuma categoria de custo indireto cadastrada</p>
                      <button className="btn-primary" onClick={handleCreateCategoria}>
                        <FontAwesomeIcon icon={faPlus} />
                        Criar Primeira Categoria
                      </button>
                    </div>
                  ) : (
                    <div className="categorias-grid">
                      {categoriasIndiretas.map((categoria) => {
                        const isExpanded = expandedCategorias.has(categoria.id)
                        return (
                          <div key={categoria.id} className="categoria-card indirect-card">
                            <div 
                              className="card-header"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                // Não expandir se clicar nos botões de ação
                                if (e.target.closest('.card-actions')) return
                                
                                const newExpanded = new Set(expandedCategorias)
                                if (isExpanded) {
                                  newExpanded.delete(categoria.id)
                                } else {
                                  newExpanded.add(categoria.id)
                                }
                                setExpandedCategorias(newExpanded)
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                <FontAwesomeIcon 
                                  icon={isExpanded ? faChevronUp : faChevronDown} 
                                  style={{ fontSize: '0.875rem', opacity: 0.7 }}
                                />
                                <h3>{categoria.name}</h3>
                              </div>
                              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="btn-icon"
                                  onClick={() => handleEditCategoria(categoria)}
                                  title="Editar"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className="btn-icon btn-danger"
                                  onClick={() => handleDeleteCategoria(categoria)}
                                  title="Excluir"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="categoria-info-section">
                                <div className="type-badge-large indirect">
                                  <div className="badge-icon">
                                    <FontAwesomeIcon icon={faLayerGroup} />
                                  </div>
                                  <span className="badge-text">Custo Indireto</span>
                                </div>
                                <div className="categoria-products-info">
                                  <FontAwesomeIcon icon={faBox} />
                                  <span>{categoria.products?.length || 0} produto(s)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Produtos Indiretos */}
                  <div className="section-divider">
                    <h3>Produtos de Custo Indireto</h3>
                  </div>

                  {produtosIndiretos.length === 0 ? (
                    <div className="empty-state">
                      <FontAwesomeIcon icon={faBox} size="3x" />
                      <p>Nenhum produto de custo indireto cadastrado</p>
                      <button className="btn-primary" onClick={handleCreateProduto}>
                        <FontAwesomeIcon icon={faPlus} />
                        Criar Primeiro Produto
                      </button>
                    </div>
                  ) : (
                    <div className="produtos-grid">
                      {produtosIndiretos.map((produto) => (
                        <div key={produto.id} className="produto-card indirect-product-card">
                          <div className="card-header">
                            <h3>{produto.name}</h3>
                            <div className="card-actions">
                              <button
                                className="btn-icon"
                                onClick={() => handleEditProduto(produto)}
                                title="Editar"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                className="btn-icon btn-danger"
                                onClick={() => handleDeleteProduto(produto)}
                                title="Excluir"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>

                          <div className="produto-info-grid">
                            <div className="produto-info-card">
                              <div className="produto-info-icon cost">
                                <FontAwesomeIcon icon={faDollarSign} />
                              </div>
                              <div className="produto-info-content">
                                <span className="produto-info-label">Custo Unitário</span>
                                <span className="produto-info-value">{formatCurrency(produto.unitCost || 0)}</span>
                              </div>
                            </div>
                            <div className="produto-info-card">
                              <div className="produto-info-icon category">
                                <FontAwesomeIcon icon={faTags} />
                              </div>
                              <div className="produto-info-content">
                                <span className="produto-info-label">Categoria</span>
                                <span className="produto-info-value">{produto.category?.name || 'Sem categoria'}</span>
                              </div>
                            </div>
                            {produto.unitType && (
                              <div className="produto-info-card">
                                <div className="produto-info-icon type">
                                  <FontAwesomeIcon icon={faLayerGroup} />
                                </div>
                                <div className="produto-info-content">
                                  <span className="produto-info-label">Tipo</span>
                                  <span className="produto-info-value">{produto.unitType}</span>
                                </div>
                              </div>
                            )}
                            {produto.stockQuantity !== null && produto.stockQuantity !== undefined && (
                              <div className="produto-info-card">
                                <div className="produto-info-icon stock">
                                  <FontAwesomeIcon icon={faShoppingCart} />
                                </div>
                                <div className="produto-info-content">
                                  <span className="produto-info-label">Estoque</span>
                                  <span className="produto-info-value">{produto.stockQuantity} {produto.unitType || ''}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Tab Gráficos */}
        {activeTab === 'graficos' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Análises e Gráficos</h2>
            </div>

            <GraficosSection 
              selectedClinicData={selectedClinicData}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão de Tratamento */}
      {showDeleteTratamentoModal && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteTratamentoModal(false)
          setItemToDelete({ type: null, id: null, name: null })
        }}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Tratamento</h3>
            <p>
              Tem certeza que deseja excluir o tratamento <strong>{itemToDelete.name}</strong>?
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => {
                  setShowDeleteTratamentoModal(false)
                  setItemToDelete({ type: null, id: null, name: null })
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={confirmDeleteTratamento}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Categoria */}
      {showDeleteCategoriaModal && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteCategoriaModal(false)
          setItemToDelete({ type: null, id: null, name: null })
        }}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Categoria</h3>
            <p>
              Tem certeza que deseja excluir a categoria <strong>{itemToDelete.name}</strong>?
            </p>
            <p className="modal-warning">
              Produtos vinculados também serão afetados. Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => {
                  setShowDeleteCategoriaModal(false)
                  setItemToDelete({ type: null, id: null, name: null })
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={confirmDeleteCategoria}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Produto */}
      {showDeleteProdutoModal && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteProdutoModal(false)
          setItemToDelete({ type: null, id: null, name: null })
        }}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Produto</h3>
            <p>
              Tem certeza que deseja excluir o produto <strong>{itemToDelete.name}</strong>?
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => {
                  setShowDeleteProdutoModal(false)
                  setItemToDelete({ type: null, id: null, name: null })
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={confirmDeleteProduto}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Modal Valor Mão de Obra */}
      {showValorHoraModal && (
        <div className="modal-overlay" onClick={() => setShowValorHoraModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FontAwesomeIcon icon={faWrench} />
                Valor Mão de Obra
              </h3>
              <button 
                className="btn-close-modal"
                onClick={() => setShowValorHoraModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Valor por Hora (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorHoraInput}
                  onChange={(e) => setValorHoraInput(e.target.value)}
                  placeholder="Ex: 200.50"
                  disabled={loadingValorHora}
                />
                <small className="form-help">
                  Este valor será usado para calcular automaticamente o preço dos tratamentos baseado no tempo de duração.
                </small>
              </div>
              
              {valorHora !== null && valorHora !== undefined && !isNaN(Number(valorHora)) && Number(valorHora) >= 0 && (
                <div className="valor-hora-info">
                  <p>
                    <strong>Valor atual:</strong> {formatCurrency(Number(valorHora))}/hora
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowValorHoraModal(false)}
                disabled={loadingValorHora}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={saveValorHora}
                disabled={loadingValorHora}
              >
                {loadingValorHora ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Salvando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de Gráficos
const GraficosSection = ({ selectedClinicData, formatCurrency }) => {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [indirectCostsData, setIndirectCostsData] = useState(null)
  const [comparativeData, setComparativeData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        setError('Cliente Master não encontrado')
        return
      }

      // Carregar dados de analytics de tratamentos (sem groupBy para evitar erro 400)
      try {
        const tratamentosResponse = await api.get(`/treatments/analytics/tratamentos?clienteMasterId=${clienteMasterId}`)
        setAnalyticsData(tratamentosResponse.data?.data || null)
      } catch (err) {
        console.warn('Erro ao carregar analytics de tratamentos:', err)
        setAnalyticsData(null)
      }

      // Carregar dados de custos indiretos
      try {
        const indirectResponse = await api.get(`/treatments/analytics/custos-indiretos?clienteMasterId=${clienteMasterId}`)
        setIndirectCostsData(indirectResponse.data?.data || null)
      } catch (err) {
        console.warn('Erro ao carregar custos indiretos:', err)
        setIndirectCostsData(null)
      }

      // Carregar dados comparativos
      try {
        const comparativeResponse = await api.get(`/treatments/analytics/comparativo?clienteMasterId=${clienteMasterId}`)
        setComparativeData(comparativeResponse.data?.data || null)
      } catch (err) {
        console.warn('Erro ao carregar dados comparativos:', err)
        setComparativeData(null)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error)
      setError('Erro ao carregar dados de analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Carregando análises...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
        <p>{error}</p>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="empty-state">
        <FontAwesomeIcon icon={faChartBar} size="3x" />
        <p>Nenhum dado disponível</p>
        <p className="empty-state-subtitle">Cadastre tratamentos para visualizar análises e gráficos</p>
      </div>
    )
  }

  const resumo = analyticsData?.resumo || {}
  const topTratamentos = analyticsData?.topTratamentosPorLucro || []
  const distribuicaoCustosLucros = analyticsData?.distribuicaoCustosLucros || null
  const evolucaoTemporal = analyticsData?.evolucaoTemporal || null

  // Preparar dados para gráficos
  const topTratamentosChartData = Array.isArray(topTratamentos) ? topTratamentos.map(t => ({
    name: t?.name && t.name.length > 15 ? t.name.substring(0, 15) + '...' : (t?.name || 'Sem nome'),
    fullName: t?.name || 'Sem nome',
    preco: t?.price || 0,
    custo: t?.custo || 0,
    lucro: t?.lucro || 0,
    lucroPercentual: t?.margem || 0
  })) : []

  // Dados para gráfico de pizza - Distribuição Custos vs Lucros
  const pieDataCustosLucros = distribuicaoCustosLucros && distribuicaoCustosLucros.labels && Array.isArray(distribuicaoCustosLucros.labels) && distribuicaoCustosLucros.datasets && distribuicaoCustosLucros.datasets[0] 
    ? distribuicaoCustosLucros.labels.map((label, index) => ({
        name: label || 'Sem nome',
        value: distribuicaoCustosLucros.datasets[0].data?.[index] || 0,
        color: distribuicaoCustosLucros.datasets[0].backgroundColor?.[index] || '#8884d8'
      })) 
    : []

  // Dados para evolução temporal
  const evolucaoChartData = evolucaoTemporal && evolucaoTemporal.labels && Array.isArray(evolucaoTemporal.labels) && evolucaoTemporal.datasets && Array.isArray(evolucaoTemporal.datasets)
    ? evolucaoTemporal.labels.map((label, index) => {
        const dataPoint = {
          name: label || 'Sem nome',
          fullName: label || 'Sem nome'
        }
        evolucaoTemporal.datasets.forEach(dataset => {
          if (dataset && dataset.label && Array.isArray(dataset.data)) {
            dataPoint[dataset.label] = dataset.data[index] || 0
          }
        })
        return dataPoint
      })
    : []

  // Cores para os gráficos
  const COLORS = {
    preco: '#0ea5e9',
    custo: '#f59e0b',
    lucro: '#10b981',
    lucroNegativo: '#ef4444'
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].payload.fullName || payload[0].payload.name}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('%') || entry.name.includes('Margem')
                ? `${entry.value}%` 
                : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="graficos-container">
      {/* Cards de Estatísticas */}
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
            <FontAwesomeIcon icon={faPercent} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Margem Média</span>
            <span className="stat-value">{(resumo.margemMedia || 0).toFixed(1)}%</span>
          </div>
        </div>
        {comparativeData?.resumo && (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255, 99, 132, 0.2)', color: '#ff6384' }}>
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Custos Indiretos</span>
              <span className="stat-value">{formatCurrency(comparativeData.resumo.custosIndiretos || 0)}</span>
            </div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
            <FontAwesomeIcon icon={faCoins} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Custo Total dos Tratamentos</span>
            <span className="stat-value">{formatCurrency(resumo.totalCusto || 0)}</span>
          </div>
        </div>
      </div>

      {/* Primeira Dupla: Top Tratamentos por Lucro + Preço vs Custo */}
      {topTratamentosChartData.length > 0 && (
        <div className="charts-grid">
          {/* Gráfico de Barras - Top Tratamentos por Lucro */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>
                <FontAwesomeIcon icon={faChartBar} />
                Top Tratamentos por Lucro
              </h3>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTratamentosChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255, 255, 255, 0.6)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.6)"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="lucro" 
                    name="Lucro (R$)" 
                    fill={COLORS.lucro}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Linha - Preço vs Custo (Top Tratamentos) */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>
                <FontAwesomeIcon icon={faChartLine} />
                Preço vs Custo - Top Tratamentos
              </h3>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={topTratamentosChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255, 255, 255, 0.6)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.6)"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="preco" 
                    name="Preço (R$)" 
                    stroke={COLORS.preco} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="custo" 
                    name="Custo (R$)" 
                    stroke={COLORS.custo} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Segunda Dupla: Margem de Lucro (%) + Distribuição Custos vs Lucros */}
      {(topTratamentosChartData.length > 0 || pieDataCustosLucros.length > 0) && (
        <div className="charts-grid">
          {/* Gráfico de Barras Horizontais - Margem de Lucro (%) */}
          {topTratamentosChartData.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <FontAwesomeIcon icon={faPercent} />
                  Margem de Lucro (%) - Top Tratamentos
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topTratamentosChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      type="number"
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="lucroPercentual" 
                      name="Margem (%)" 
                      fill={COLORS.lucro}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico de Pizza - Distribuição Custos vs Lucros */}
          {pieDataCustosLucros.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <FontAwesomeIcon icon={faChartPie} />
                  Distribuição: Custos vs Lucros
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieDataCustosLucros}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieDataCustosLucros.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terceira Dupla: Evolução Temporal + Distribuição de Custos Indiretos */}
      {(evolucaoChartData.length > 0 || (indirectCostsData?.distribuicaoCustosPorCategoria && indirectCostsData.distribuicaoCustosPorCategoria.labels && Array.isArray(indirectCostsData.distribuicaoCustosPorCategoria.labels) && indirectCostsData.distribuicaoCustosPorCategoria.labels.length > 0)) && (
        <div className="charts-grid">
          {/* Gráfico de Linha - Evolução Temporal */}
          {evolucaoChartData.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <FontAwesomeIcon icon={faChartLine} />
                  Evolução Temporal
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolucaoChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {evolucaoTemporal && evolucaoTemporal.datasets && Array.isArray(evolucaoTemporal.datasets) && evolucaoTemporal.datasets.map((dataset, index) => (
                      <Line 
                        key={index}
                        type="monotone" 
                        dataKey={dataset?.label} 
                        name={dataset?.label} 
                        stroke={dataset?.backgroundColor || '#8884d8'} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico de Pizza - Distribuição de Custos por Categoria */}
          {indirectCostsData?.distribuicaoCustosPorCategoria && indirectCostsData.distribuicaoCustosPorCategoria.labels && Array.isArray(indirectCostsData.distribuicaoCustosPorCategoria.labels) && indirectCostsData.distribuicaoCustosPorCategoria.labels.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <FontAwesomeIcon icon={faChartPie} />
                  Distribuição de Custos Indiretos por Categoria
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={indirectCostsData.distribuicaoCustosPorCategoria.labels.map((label, index) => ({
                        name: label || 'Sem nome',
                        value: indirectCostsData.distribuicaoCustosPorCategoria.datasets?.[0]?.data?.[index] || 0
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {indirectCostsData.distribuicaoCustosPorCategoria.datasets?.[0]?.backgroundColor && Array.isArray(indirectCostsData.distribuicaoCustosPorCategoria.datasets[0].backgroundColor) && indirectCostsData.distribuicaoCustosPorCategoria.datasets[0].backgroundColor.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quarta Dupla: Custos Indiretos por Categoria + Comparativo Receita vs Custos */}
      {((indirectCostsData?.custosPorCategoriaBarras && indirectCostsData.custosPorCategoriaBarras.labels && Array.isArray(indirectCostsData.custosPorCategoriaBarras.labels) && indirectCostsData.custosPorCategoriaBarras.labels.length > 0) || (comparativeData?.comparativoReceitaCustos && comparativeData.comparativoReceitaCustos.labels && Array.isArray(comparativeData.comparativoReceitaCustos.labels) && comparativeData.comparativoReceitaCustos.labels.length > 0)) && (
        <div className="charts-grid">
          {/* Gráfico de Barras - Custos por Categoria */}
          {indirectCostsData?.custosPorCategoriaBarras && indirectCostsData.custosPorCategoriaBarras.labels && Array.isArray(indirectCostsData.custosPorCategoriaBarras.labels) && indirectCostsData.custosPorCategoriaBarras.labels.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <FontAwesomeIcon icon={faChartBar} />
                  Custos Indiretos por Categoria
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={indirectCostsData.custosPorCategoriaBarras.labels.map((label, index) => ({
                    name: label || 'Sem nome',
                    custo: indirectCostsData.custosPorCategoriaBarras.datasets?.[0]?.data?.[index] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar 
                      dataKey="custo" 
                      name="Custo (R$)" 
                      fill={indirectCostsData.custosPorCategoriaBarras.datasets?.[0]?.backgroundColor || '#8884d8'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico Comparativo - Receita vs Custos */}
          {comparativeData?.comparativoReceitaCustos && comparativeData.comparativoReceitaCustos.labels && Array.isArray(comparativeData.comparativoReceitaCustos.labels) && comparativeData.comparativoReceitaCustos.labels.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <FontAwesomeIcon icon={faChartBar} />
                  Comparativo: Receita vs Custos
                </h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparativeData.comparativoReceitaCustos.labels.map((label, index) => ({
                    name: label || 'Sem nome',
                    valor: comparativeData.comparativoReceitaCustos.datasets?.[0]?.data?.[index] || 0,
                    color: comparativeData.comparativoReceitaCustos.datasets?.[0]?.backgroundColor?.[index] || '#8884d8'
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255, 255, 255, 0.6)"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar 
                      dataKey="valor" 
                      name="Valor (R$)" 
                      radius={[4, 4, 0, 0]}
                    >
                      {comparativeData.comparativoReceitaCustos.labels.map((label, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={comparativeData.comparativoReceitaCustos.datasets?.[0]?.backgroundColor?.[index] || '#8884d8'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações Adicionais */}
      {Array.isArray(topTratamentos) && topTratamentos.length > 0 && (
        <div className="info-cards-grid">
          {topTratamentos[0] && (
            <div className="info-card-highlight success">
              <div className="info-card-header">
                <FontAwesomeIcon icon={faCheckCircle} />
                <h4>Melhor Performance</h4>
              </div>
              <div className="info-card-body">
                <p className="info-card-title">{topTratamentos[0]?.name || 'Sem nome'}</p>
                <div className="info-card-stats">
                  <span>Lucro: {formatCurrency(topTratamentos[0]?.lucro || 0)}</span>
                  <span>Margem: {(topTratamentos[0]?.margem || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
          {topTratamentos.length > 1 && topTratamentos[topTratamentos.length - 1] && (topTratamentos[topTratamentos.length - 1]?.margem || 0) < 45 && (
            <div className="info-card-highlight warning">
              <div className="info-card-header">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <h4>Atenção Necessária</h4>
              </div>
              <div className="info-card-body">
                <p className="info-card-title">{topTratamentos[topTratamentos.length - 1]?.name || 'Sem nome'}</p>
                <div className="info-card-stats">
                  <span>Lucro: {formatCurrency(topTratamentos[topTratamentos.length - 1]?.lucro || 0)}</span>
                  <span>Margem: {(topTratamentos[topTratamentos.length - 1]?.margem || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Precificacao


