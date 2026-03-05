import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faTrash, faPlus, faSpinner, faTimes, faCheck, faSearch, faLink, faCalculator, faExchangeAlt, faBox, faDollarSign
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import { useAuth } from '../context/useAuth'
import './PrecificacaoForm.css'
import './PrecificacaoTratamento.css'

const PrecificacaoTratamento = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showSuccess, showError, hideAlert } = useAlert()
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!!id)
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  // Estados para criação rápida
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showProdutoModal, setShowProdutoModal] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState({ name: '', type: 'DIRECT' })
  const [novoProduto, setNovoProduto] = useState({ name: '', categoryId: '', unitCost: '', unitType: 'Unitário', stockQuantity: null })
  
  // Opções para tipo de unidade
  const unitTypes = [
    'Grama',
    'Quilograma',
    'Miligrama',
    'Litro',
    'Mililitro',
    'Centímetro',
    'Milímetro',
    'Unitário'
  ]
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    averageDurationMinutes: '',
    price: '',
    products: []
  })
  const [produtosVinculados, setProdutosVinculados] = useState(new Set())
  const [showConverter, setShowConverter] = useState(null) // index do produto que tem a calculadora aberta
  const [converterData, setConverterData] = useState({
    fromUnit: '',
    toUnit: '',
    value: '',
    result: ''
  })
  const [valorHora, setValorHora] = useState(0)
  const [autoCalculatePrice, setAutoCalculatePrice] = useState(true)

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Função para carregar produtos com busca
  const loadProducts = useCallback(async (clienteMasterId, nome = '') => {
    try {
      setLoadingProducts(true)
      let url = `/products?clienteMasterId=${clienteMasterId}`
      if (nome && nome.trim()) {
        url += `&nome=${encodeURIComponent(nome.trim())}`
      }
      const response = await api.get(url)
      setProdutos(response.data?.data || response.data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      showError('Erro ao carregar produtos')
    } finally {
      setLoadingProducts(false)
    }
  }, [showError])

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      const clienteMasterId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      if (!clienteMasterId) return

      // Carregar produtos inicialmente (sem busca)
      await loadProducts(clienteMasterId, '')

      // Carregar valor hora
      try {
        const response = await api.get(`/pricing/hourly-rate/${clienteMasterId}`)
        setValorHora(response.data?.hourlyRate || 0)
      } catch (error) {
        console.error('Erro ao carregar valor hora:', error)
      }

      // Se estiver editando, carregar dados do tratamento
      if (id) {
        try {
          setLoadingData(true)
          const response = await api.get(`/treatments/${id}`)
          const tratamento = response.data?.data || response.data
          
          const produtosDoTratamento = tratamento.treatmentProducts?.map(tp => ({
            productId: tp.productId,
            quantityUsed: tp.quantityUsed || ''
          })) || []
          
          setFormData({
            name: tratamento.name,
            description: tratamento.description || '',
            averageDurationMinutes: tratamento.averageDurationMinutes || '',
            price: tratamento.price || '',
            products: produtosDoTratamento
          })
          
          // Marcar todos os produtos como vinculados ao carregar tratamento existente
          const novosVinculados = new Set()
          produtosDoTratamento.forEach((_, index) => novosVinculados.add(index))
          setProdutosVinculados(novosVinculados)
        } catch (error) {
          console.error('Erro ao carregar tratamento:', error)
          showError('Erro ao carregar tratamento')
          navigate('/app/precificacao')
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadData()
  }, [id, selectedClinicData, loadProducts, showError, navigate])

  // Calcular preço automaticamente quando tempo mudar
  useEffect(() => {
    if (autoCalculatePrice && valorHora && formData.averageDurationMinutes) {
      const suggestedPrice = (valorHora / 60) * (Number(formData.averageDurationMinutes) || 0)
      setFormData(prev => ({ ...prev, price: suggestedPrice.toFixed(2) }))
    }
  }, [formData.averageDurationMinutes, valorHora, autoCalculatePrice])

  // Função para normalizar tipo de unidade
  const normalizeUnitType = (unitType) => {
    if (!unitType) return 'Unitário'
    
    const unitMap = {
      'grama': 'Grama',
      'gramas': 'Grama',
      'g': 'Grama',
      'quilograma': 'Quilograma',
      'quilogramas': 'Quilograma',
      'kg': 'Quilograma',
      'miligrama': 'Miligrama',
      'miligramas': 'Miligrama',
      'mg': 'Miligrama',
      'litro': 'Litro',
      'litros': 'Litro',
      'l': 'Litro',
      'mililitro': 'Mililitro',
      'mililitros': 'Mililitro',
      'ml': 'Mililitro',
      'centímetro': 'Centímetro',
      'centimetros': 'Centímetro',
      'cm': 'Centímetro',
      'milímetro': 'Milímetro',
      'milimetros': 'Milímetro',
      'mm': 'Milímetro',
      'unitário': 'Unitário',
      'unitario': 'Unitário',
      'unidade': 'Unitário',
      'unidades': 'Unitário'
    }
    
    return unitMap[unitType.toLowerCase()] || unitType
  }

  // Função de conversão de medidas
  const convertUnit = (value, fromUnit, toUnit) => {
    if (!value || !fromUnit || !toUnit || fromUnit === toUnit) return value
    
    // Fatores de conversão para grama (base)
    const conversionFactors = {
      'Grama': 1,
      'Quilograma': 1000,
      'Miligrama': 0.001,
      'Litro': 1000, // assumindo densidade da água
      'Mililitro': 1,
      'Centímetro': 1, // assumindo 1cm³ = 1g
      'Milímetro': 0.001,
      'Unitário': 1
    }
    
    const fromFactor = conversionFactors[fromUnit] || 1
    const toFactor = conversionFactors[toUnit] || 1
    
    // Converter para base (grama) e depois para unidade alvo
    const baseValue = value * fromFactor
    const result = baseValue / toFactor
    
    return result
  }

  // Obter grupos de unidades relacionadas
  const getRelatedUnitGroups = (unitType) => {
    const massUnits = ['Grama', 'Quilograma', 'Miligrama']
    const volumeUnits = ['Litro', 'Mililitro']
    const lengthUnits = ['Centímetro', 'Milímetro']
    const unitaryUnits = ['Unitário']
    
    if (massUnits.includes(unitType)) return massUnits
    if (volumeUnits.includes(unitType)) return volumeUnits
    if (lengthUnits.includes(unitType)) return lengthUnits
    if (unitaryUnits.includes(unitType)) return unitaryUnits
    
    return [unitType] // Retorna apenas a unidade atual se não encontrar grupo
  }

  // Calcular custo total do tratamento (todos os produtos com dados válidos)
  const calcularCustoTotal = () => {
    const total = formData.products.reduce((acc, product, index) => {
      // Calcular se o produto tem ID e quantidade válidos
      if (product.productId && product.quantityUsed) {
        const selectedProduct = produtos.find(p => p.id === product.productId)
        if (selectedProduct) {
          const quantityUsed = parseFloat(product.quantityUsed) || 0
          const stockQuantity = parseFloat(selectedProduct.stockQuantity) || 1
          const totalCost = parseFloat(selectedProduct.unitCost) || 0
          const unitPrice = stockQuantity > 0 ? totalCost / stockQuantity : 0
          const calculatedCost = quantityUsed * unitPrice
          return acc + calculatedCost
        }
      }
      return acc
    }, 0)
    
    return total
  }

  // Salvar tratamento
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showError('Nome do tratamento é obrigatório')
      return
    }
    
    if (!formData.averageDurationMinutes || formData.averageDurationMinutes <= 0) {
      showError('Duração média deve ser maior que zero')
      return
    }
    
    if (!formData.price || formData.price <= 0) {
      showError('Preço deve ser maior que zero')
      return
    }

    const clienteMasterId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
    if (!clienteMasterId) {
      showError('Cliente Master não encontrado')
      return
    }

    // Validar produtos
    const produtosValidos = formData.products.filter(p => p.productId && p.quantityUsed)
    if (produtosValidos.length === 0) {
      showError('Adicione pelo menos um produto com quantidade válida')
      return
    }

    // Calcular custo total
    const custoFinal = calcularCustoTotal()
    
    try {
      setLoading(true)
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        averageDurationMinutes: parseInt(formData.averageDurationMinutes) || 0,
        price: parseFloat(formData.price) || 0,
        custo: custoFinal,
        products: formData.products.map(p => {
          const selectedProduct = produtos.find(prod => prod.id === p.productId)
          const quantityUsed = parseFloat(p.quantityUsed) || 0
          const stockQuantity = selectedProduct ? parseFloat(selectedProduct.stockQuantity) || 1 : 1
          const totalCost = selectedProduct ? parseFloat(selectedProduct.unitCost) || 0 : 0
          const unitPrice = stockQuantity > 0 ? totalCost / stockQuantity : 0
          const calculatedCost = quantityUsed * unitPrice
          
          return {
            productId: p.productId,
            quantityUsed: quantityUsed,
            costInReais: calculatedCost
          }
        })
      }

      if (id) {
        await api.patch(`/treatments/${id}`, payload)
        showSuccess('Tratamento atualizado com sucesso!')
      } else {
        await api.post('/treatments', payload)
        showSuccess('Tratamento criado com sucesso!')
      }
      
      navigate('/app/precificacao')
    } catch (error) {
      console.error('Erro ao salvar tratamento:', error)
      showError(error.response?.data?.message || 'Erro ao salvar tratamento')
    } finally {
      setLoading(false)
    }
  }

  // Excluir tratamento
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este tratamento?')) return
    
    try {
      setLoading(true)
      await api.delete(`/treatments/${id}`)
      showSuccess('Tratamento excluído com sucesso!')
      navigate('/app/precificacao')
    } catch (error) {
      console.error('Erro ao excluir tratamento:', error)
      showError(error.response?.data?.message || 'Erro ao excluir tratamento')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { productId: '', quantityUsed: '' }]
    })
  }

  const handleRemoveProduct = (index) => {
    // Remover também dos produtos vinculados
    const novosVinculados = new Set(produtosVinculados)
    novosVinculados.delete(index)
    // Ajustar índices dos produtos vinculados após a remoção
    const ajustados = new Set()
    novosVinculados.forEach(idx => {
      if (idx > index) {
        ajustados.add(idx - 1)
      } else if (idx < index) {
        ajustados.add(idx)
      }
    })
    setProdutosVinculados(ajustados)
    
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index)
    })
  }

  const handleUpdateProduct = (index, field, value) => {
    const updatedProducts = [...formData.products]
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    }
    setFormData({
      ...formData,
      products: updatedProducts
    })
  }

  // Adicionar produto diretamente da lista
  const handleAddProductToList = (productId) => {
    // Verificar se o produto já está adicionado
    if (formData.products.some(p => p.productId === productId)) {
      showError('Este produto já foi adicionado ao tratamento')
      return
    }

    setFormData({
      ...formData,
      products: [...formData.products, { productId, quantityUsed: '' }]
    })
  }

  // Verificar se produto já está adicionado
  const isProductAdded = (productId) => {
    return formData.products.some(p => p.productId === productId)
  }

  // Funções para criação rápida de categoria
  const handleCreateCategoriaRapida = async () => {
    if (!novaCategoria.name.trim()) {
      showError('Nome da categoria é obrigatório')
      return
    }

    const clienteMasterId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
    if (!clienteMasterId) {
      showError('Cliente Master não encontrado')
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: novaCategoria.name,
        type: novaCategoria.type,
        clienteMasterId
      }

      const response = await api.post('/categories', payload)
      const categoriaCriada = response.data?.data || response.data
      
      // Atualizar lista de categorias
      setCategorias([...categorias, categoriaCriada])
      
      // Limpar formulário e fechar modal
      setNovaCategoria({ name: '', type: 'DIRECT' })
      setShowCategoriaModal(false)
      showSuccess('Categoria criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      showError(error.response?.data?.message || 'Erro ao criar categoria')
    } finally {
      setLoading(false)
    }
  }

  // Funções para criação rápida de produto
  const handleCreateProdutoRapido = async () => {
    if (!novoProduto.name.trim()) {
      showError('Nome do produto é obrigatório')
      return
    }
    
    if (!novoProduto.categoryId) {
      showError('Selecione uma categoria')
      return
    }
    
    if (!novoProduto.unitCost || novoProduto.unitCost <= 0) {
      showError('Custo unitário deve ser maior que zero')
      return
    }

    const clienteMasterId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
    if (!clienteMasterId) {
      showError('Cliente Master não encontrado')
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: novoProduto.name,
        categoryId: novoProduto.categoryId,
        unitCost: parseFloat(novoProduto.unitCost),
        unitType: novoProduto.unitType,
        stockQuantity: novoProduto.stockQuantity !== null && novoProduto.stockQuantity !== '' ? parseFloat(novoProduto.stockQuantity) : null,
        clienteMasterId
      }

      const response = await api.post('/products', payload)
      const produtoCriado = response.data?.data || response.data
      
      // Atualizar lista de produtos
      setProdutos([...produtos, produtoCriado])
      
      // Adicionar o produto recém-criado automaticamente ao tratamento
      const novoProdutoNoTratamento = {
        productId: produtoCriado.id,
        quantityUsed: ''
      }
      setFormData({
        ...formData,
        products: [...formData.products, novoProdutoNoTratamento]
      })
      
      // Limpar formulário e fechar seção
      setNovoProduto({ name: '', categoryId: '', unitCost: '', unitType: 'Unitário', stockQuantity: null })
      setShowProdutoModal(false)
      showSuccess('Produto criado e adicionado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      showError(error.response?.data?.message || 'Erro ao criar produto')
    } finally {
      setLoading(false)
    }
  }

  // Buscar produtos com debounce
  useEffect(() => {
    const clienteMasterId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
    if (!clienteMasterId) return

    const timeoutId = setTimeout(() => {
      loadProducts(clienteMasterId, searchTerm)
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedClinicData, loadProducts])

  if (loadingData) {
    return (
      <div className="form-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Carregando dados do tratamento...</p>
      </div>
    )
  }

  return (
    <div className="precificacao-form-container">
      <div className="form-header">
        <button 
          type="button" 
          className="btn-back" 
          onClick={() => navigate('/app/precificacao')}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <h1>{id ? 'Editar Tratamento' : 'Novo Tratamento'}</h1>
        {id && (
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTrash} />
            Excluir
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="precificacao-form">
        {/* Informações Básicas */}
        <div className="form-section">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faBox} />
            Informações Básicas
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Nome do Tratamento *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Clareamento Dental"
                required
              />
            </div>

            <div className="form-group">
              <label>Duração Média (minutos) *</label>
              <input
                type="number"
                value={formData.averageDurationMinutes}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, averageDurationMinutes: value })
                  setAutoCalculatePrice(true) // Reativar cálculo automático ao mudar tempo
                }}
                placeholder="Ex: 60"
                min="1"
                required
              />
              {valorHora > 0 && (
                <small className="form-help">
                  {autoCalculatePrice ? (
                    <>
                      <strong>Valor calculado automaticamente:</strong> {formatCurrency((valorHora / 60) * (Number(formData.averageDurationMinutes) || 0))}
                    </>
                  ) : (
                    <>
                      Valor sugerido: {formatCurrency((valorHora / 60) * (Number(formData.averageDurationMinutes) || 0))}
                    </>
                  )}
                </small>
              )}
              {!valorHora && (
                <small className="form-help" style={{ color: '#f59e0b' }}>
                  Configure o valor da mão de obra na página de precificação para cálculo automático
                </small>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o tratamento..."
              rows={3}
            />
          </div>
        </div>

        {/* Informações de Preço */}
        <div className="form-section">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faDollarSign} />
            Informações de Preço
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Preço que você cobra (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                  setFormData({ ...formData, price: value })
                  // Desativa cálculo automático quando usuário edita manualmente
                  setAutoCalculatePrice(false)
                }}
                onWheel={(e) => e.target.blur()}
                placeholder="Ex: 500.00"
                min="0.01"
                required
              />
            </div>
          </div>

          {/* Custo Total do Tratamento */}
          {formData.products.length > 0 && (
            <div className="cost-summary">
              <div className="cost-summary-content">
                <span className="cost-label">Custo Total dos Produtos:</span>
                <span className="cost-value">{formatCurrency(calcularCustoTotal())}</span>
              </div>
            </div>
          )}
        </div>

        {/* Produtos do Tratamento */}
        <div className="form-section">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faBox} />
            Produtos do Tratamento
          </h3>
          
          {/* Lista de Produtos Disponíveis */}
          <div className="available-products-section">
            <div className="products-section-header">
              <h4>Produtos Disponíveis</h4>
              <div className="search-products-wrapper">
                <div className="search-input-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    className="search-products-input"
                    placeholder="Buscar produtos por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {loadingProducts && (
                    <FontAwesomeIcon icon={faSpinner} spin className="search-loading-icon" />
                  )}
                </div>
              </div>
            </div>
          
          {loadingProducts && produtos.length === 0 ? (
            <div className="loading-products">
              <FontAwesomeIcon icon={faSpinner} spin />
              <p>Carregando produtos...</p>
            </div>
          ) : produtos.length > 0 ? (
            <div className="available-products-grid">
              {produtos.filter(p => searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : !isProductAdded(p.id)).map((produto) => (
                <div key={produto.id} className="available-product-card">
                  <div className="product-card-info">
                    <h4>{produto.name}</h4>
                    <p className="product-category">{produto.category?.name || 'Sem categoria'}</p>
                    <div className="product-details">
                      <span className="product-cost">{formatCurrency(produto.unitCost)}</span>
                      <span className="product-unit">{produto.unitType || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="product-card-actions">
                    <button
                      type="button"
                      className="btn-add-product"
                      onClick={() => handleAddProductToList(produto.id)}
                      disabled={isProductAdded(produto.id)}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      {isProductAdded(produto.id) ? 'Adicionado' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-search-message">
              {loadingProducts ? (
                <p>Buscando produtos...</p>
              ) : searchTerm ? (
                <p>Nenhum produto encontrado com o termo "{searchTerm}"</p>
              ) : (
                <p>Nenhum produto disponível. Crie um produto primeiro.</p>
              )}
            </div>
          )}
        </div>

        {/* Produtos Adicionados ao Tratamento */}
        {formData.products.length === 0 && !showProdutoModal ? (
          <div className="empty-message">
            <p>Nenhum produto adicionado. Selecione um produto da lista acima e clique em "Adicionar" ou "Criar Produto" para criar um novo.</p>
          </div>
        ) : formData.products.length > 0 ? (
          <div className="products-list">
            {formData.products.map((product, index) => (
              <div key={index} className="product-item">
                <div className="form-group product-field">
                  <label>Produto *</label>
                  <select
                    value={product.productId}
                    onChange={(e) => handleUpdateProduct(index, 'productId', e.target.value)}
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.unitCost)}
                      </option>
                    ))}
                  </select>
                  {product.productId && (() => {
                    const selectedProduct = produtos.find(p => p.id === product.productId)
                    if (selectedProduct) {
                      return (
                        <div className="product-info-display">
                          <div className="product-info-item">
                            <span className="product-info-label">Tipo de Unidade:</span>
                            <span className="product-info-value">{selectedProduct.unitType || 'N/A'}</span>
                          </div>
                          {selectedProduct.stockQuantity !== null && selectedProduct.stockQuantity !== undefined && (
                            <div className="product-info-item">
                              <span className="product-info-label">Quantidade do produto:</span>
                              <span className="product-info-value">{parseFloat(selectedProduct.stockQuantity).toFixed(2)} {selectedProduct.unitType || ''}</span>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
                <div className="product-item-bottom">
                  <div className="form-group quantity-field">
                    <label>Quanto você utiliza deste produto? *</label>
                    <div className="quantity-input-wrapper">
                      <input
                        type="number"
                        step="0.01"
                        value={product.quantityUsed || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                          handleUpdateProduct(index, 'quantityUsed', value)
                        }}
                        min="0.01"
                        required
                        className={product.productId ? 'has-unit-type' : ''}
                        placeholder={product.productId ? (() => {
                          const selectedProduct = produtos.find(p => p.id === product.productId)
                          return selectedProduct?.stockQuantity ? `Ex: ${parseFloat(selectedProduct.stockQuantity).toFixed(2)}` : ''
                        })() : ''}
                      />
                      {product.productId && (() => {
                        const selectedProduct = produtos.find(p => p.id === product.productId)
                        const unitType = normalizeUnitType(selectedProduct?.unitType)
                        return unitType ? (
                          <span className="unit-type-badge">{unitType}</span>
                        ) : null
                      })()}
                      {product.productId && (() => {
                        const selectedProduct = produtos.find(p => p.id === product.productId)
                        const unitType = normalizeUnitType(selectedProduct?.unitType)
                        if (unitType && unitType !== 'Unitário') {
                          return (
                            <button
                              type="button"
                              className="btn-converter"
                              onClick={() => {
                                const selectedProduct = produtos.find(p => p.id === product.productId)
                                if (selectedProduct) {
                                  const unitType = normalizeUnitType(selectedProduct.unitType)
                                  setShowConverter(showConverter === index ? null : index)
                                  setConverterData({
                                    fromUnit: unitType,
                                    toUnit: unitType, // Sempre converte para a unidade do produto
                                    value: '',
                                    result: ''
                                  })
                                }
                              }}
                              title="Conversor de medidas"
                            >
                              <FontAwesomeIcon icon={faCalculator} />
                            </button>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                  <div className="form-group cost-field">
                    <label>Custo em Reais (R$) *</label>
                    <div className="cost-calculated-display">
                      {(() => {
                        const selectedProduct = produtos.find(p => p.id === product.productId)
                        const quantityUsed = parseFloat(product.quantityUsed) || 0
                        const stockQuantity = selectedProduct ? parseFloat(selectedProduct.stockQuantity) || 1 : 1
                        const totalCost = selectedProduct ? parseFloat(selectedProduct.unitCost) || 0 : 0
                        const unitPrice = stockQuantity > 0 ? totalCost / stockQuantity : 0
                        const calculatedCost = quantityUsed * unitPrice
                        
                        return (
                          <>
                            <input
                              type="text"
                              value={formatCurrency(calculatedCost)}
                              readOnly
                              className="cost-calculated"
                              placeholder="R$ 0,00"
                            />
                            <small className="form-help">
                              Cálculo: {quantityUsed} {normalizeUnitType(selectedProduct?.unitType)} × {formatCurrency(unitPrice)} = {formatCurrency(calculatedCost)}
                              <br />
                              <small>({totalCost > 0 ? `Preço total: ${formatCurrency(totalCost)} ÷ ${stockQuantity} ${normalizeUnitType(selectedProduct?.unitType)} = ${formatCurrency(unitPrice)} por unidade` : ''})</small>
                            </small>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
                {showConverter === index && (() => {
                  const selectedProduct = produtos.find(p => p.id === product.productId)
                  if (!selectedProduct) return null
                  const unitType = normalizeUnitType(selectedProduct.unitType)
                  const relatedUnitGroups = getRelatedUnitGroups(unitType)
                  return (
                    <div className="unit-converter">
                      <div className="converter-header">
                        <h4>Conversor de Medidas</h4>
                        <button
                          type="button"
                          className="btn-close-converter"
                          onClick={() => setShowConverter(null)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                      <div className="converter-content">
                        <div className="converter-input-group">
                          <label>Converter de:</label>
                          <select
                            value={converterData.fromUnit}
                            onChange={(e) => setConverterData({ ...converterData, fromUnit: e.target.value })}
                          >
                            {relatedUnitGroups.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div className="converter-input-group">
                          <label>Para:</label>
                          <select
                            value={converterData.toUnit}
                            onChange={(e) => setConverterData({ ...converterData, toUnit: e.target.value })}
                          >
                            {relatedUnitGroups.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div className="converter-input-group">
                          <label>Valor:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={converterData.value}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              const result = convertUnit(value, converterData.fromUnit, converterData.toUnit)
                              setConverterData({ ...converterData, value, result })
                            }}
                            placeholder="Digite o valor a converter"
                          />
                        </div>
                        {converterData.result && (
                          <div className="converter-result">
                            <strong>Resultado:</strong> {converterData.result.toFixed(4)} {converterData.toUnit}
                            <button
                              type="button"
                              className="btn-use-result"
                              onClick={() => {
                                handleUpdateProduct(index, 'quantityUsed', converterData.result)
                                setShowConverter(null)
                              }}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                              Usar este valor
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
                <div className="product-item-actions">
                  {product.productId && product.quantityUsed && (
                    <button
                      type="button"
                      className={`btn-icon ${produtosVinculados.has(index) ? 'btn-linked' : 'btn-link'}`}
                      onClick={() => {
                        const selectedProduct = produtos.find(p => p.id === product.productId)
                        if (selectedProduct) {
                          const novosVinculados = new Set(produtosVinculados)
                          if (novosVinculados.has(index)) {
                            novosVinculados.delete(index)
                          } else {
                            novosVinculados.add(index)
                          }
                          setProdutosVinculados(novosVinculados)
                        }
                      }}
                      title={produtosVinculados.has(index) ? "Desvincular produto" : "Vincular produto"}
                    >
                      <FontAwesomeIcon icon={faLink} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    onClick={() => handleRemoveProduct(index)}
                    title="Remover"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Botão para adicionar mais produtos */}
        {formData.products.length > 0 && (
          <div className="add-product-section">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddProduct}
            >
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Outro Produto
            </button>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/app/precificacao')}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                {id ? 'Atualizando...' : 'Salvando...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                {id ? 'Atualizar Tratamento' : 'Salvar Tratamento'}
              </>
            )}
          </button>
        </div>
        </div>
      </form>

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
    </div>
  )
}

export default PrecificacaoTratamento
