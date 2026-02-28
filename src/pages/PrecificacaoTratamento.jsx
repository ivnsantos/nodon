import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faTrash, faPlus, faSpinner, faTimes, faCheck, faSearch, faLink, faCalculator, faExchangeAlt
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import { useAuth } from '../context/useAuth'
import './PrecificacaoForm.css'

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
  const [novoProduto, setNovoProduto] = useState({ name: '', categoryId: '', unitCost: '', unitType: 'Unidade', stockQuantity: null })
  
  // Opções para tipo de unidade
  const unitTypes = ['Litro', 'Metro', 'Grama', 'Unitário']
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    averageDurationMinutes: '',
    price: '',
    products: []
  })
  const [produtosVinculados, setProdutosVinculados] = useState(new Set())
  const [showConverter, setShowConverter] = useState(null) // index do produto que tem a calculadora aberta
  const [converterData, setConverterData] = useState({ fromUnit: '', toUnit: '', value: '', result: '' })
  const [valorHora, setValorHora] = useState(null)
  const [autoCalculatePrice, setAutoCalculatePrice] = useState(true)

  // Função para carregar produtos com busca
  const loadProducts = useCallback(async (clienteMasterId, nome = '') => {
    try {
      setLoadingProducts(true)
      let url = `/products?clienteMasterId=${clienteMasterId}`
      if (nome && nome.trim()) {
        url += `&nome=${encodeURIComponent(nome.trim())}`
      }
      
      const produtosResponse = await api.get(url)
      const produtosData = produtosResponse.data?.data || produtosResponse.data || []
      setProdutos(Array.isArray(produtosData) ? produtosData : [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      showError('Erro ao carregar produtos')
    } finally {
      setLoadingProducts(false)
    }
  }, [showError])

  useEffect(() => {
    const loadData = async () => {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      // Carregar categorias
      try {
        const categoriasResponse = await api.get(`/cost-categories?clienteMasterId=${clienteMasterId}`)
        const categoriasData = categoriasResponse.data?.data || categoriasResponse.data || []
        setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        showError('Erro ao carregar categorias')
      }

      // Carregar produtos inicialmente (sem busca)
      loadProducts(clienteMasterId, '')

      // Carregar valor hora
      try {
        const valorHoraResponse = await api.get(`/clientes-master/${clienteMasterId}/valorhora`)
        const valorHoraData = valorHoraResponse.data?.data
        if (valorHoraData?.valorhora) {
          setValorHora(valorHoraData.valorhora)
        }
      } catch (error) {
        // Se não encontrar, valorHora fica null (não é erro crítico)
        if (error.response?.status !== 404) {
          console.error('Erro ao carregar valor hora:', error)
        }
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
          setProdutosVinculados(new Set(produtosDoTratamento.map((_, index) => index)))
          
          // Desativar cálculo automático ao editar (já tem preço definido)
          setAutoCalculatePrice(false)
        } catch (error) {
          console.error('Erro ao carregar tratamento:', error)
          showError('Erro ao carregar tratamento')
        } finally {
          setLoadingData(false)
        }
      } else {
        // Se for novo tratamento, garantir que cálculo automático está ativo
        setAutoCalculatePrice(true)
      }
    }

    loadData()
  }, [id, selectedClinicData, loadProducts, showError])

  // Calcular preço automaticamente quando tempo mudar
  useEffect(() => {
    // Sempre calcular automaticamente se tiver valorHora e duração
    if (valorHora && formData.averageDurationMinutes && autoCalculatePrice) {
      const minutos = Number(formData.averageDurationMinutes)
      if (!isNaN(minutos) && minutos > 0) {
        const valorCalculado = (valorHora / 60) * minutos
        setFormData(prev => ({
          ...prev,
          price: valorCalculado.toFixed(2)
        }))
      } else if (minutos === 0 || minutos === '') {
        // Limpar preço se duração for 0 ou vazia
        setFormData(prev => ({
          ...prev,
          price: ''
        }))
      }
    }
  }, [formData.averageDurationMinutes, valorHora, autoCalculatePrice])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validações básicas
    if (!formData.name || !formData.name.trim()) {
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
    
    try {
      setLoading(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      // Calcular custo total dos produtos vinculados
      const custoTotal = calcularCustoTotal()
      
      // Garantir que seja um número decimal válido
      let custoFinal = 0.00
      const custoNum = Number(custoTotal)
      if (!isNaN(custoNum) && isFinite(custoNum) && custoNum >= 0) {
        custoFinal = Math.round(custoNum * 100) / 100
      }
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        averageDurationMinutes: parseInt(formData.averageDurationMinutes) || 0,
        price: parseFloat(formData.price) || 0,
        custo: custoFinal,
        products: formData.products.map(p => ({
          productId: p.productId,
          quantityUsed: parseFloat(p.quantityUsed) || 0
        }))
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

  const handleDelete = async () => {
    if (!id) return
    
    if (!window.confirm('Tem certeza que deseja excluir este tratamento?')) return

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
      } else {
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  // Calcular custo total do tratamento (todos os produtos com dados válidos)
  const calcularCustoTotal = () => {
    const total = formData.products.reduce((acc, product, index) => {
      // Calcular se o produto tem ID e quantidade válidos
      if (product.productId && product.quantityUsed) {
        const produto = produtos.find(p => p.id === product.productId)
        if (produto && produto.unitCost !== null && produto.unitCost !== undefined) {
          // Se há estoque, calcular preço unitário real
          let precoUnitario = Number(produto.unitCost) || 0
          if (produto.stockQuantity !== null && produto.stockQuantity !== undefined && Number(produto.stockQuantity) > 0) {
            precoUnitario = Number(produto.unitCost) / Number(produto.stockQuantity)
          }
          const quantidade = Number(product.quantityUsed) || 0
          const custoProduto = precoUnitario * quantidade
          return acc + (isNaN(custoProduto) || !isFinite(custoProduto) ? 0 : custoProduto)
        }
      }
      return acc
    }, 0)
    
    // Garantir que retorne sempre um número válido
    return isNaN(total) || !isFinite(total) ? 0 : total
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

  // Função de conversão de medidas
  const convertUnit = (value, fromUnit, toUnit) => {
    if (!value || isNaN(value)) return ''
    
    const conversions = {
      // Massa (Grama)
      'Grama': {
        'Grama': 1,
        'Quilograma': 0.001,
        'Miligrama': 1000,
        'Tonelada': 0.000001
      },
      'Quilograma': {
        'Grama': 1000,
        'Quilograma': 1,
        'Miligrama': 1000000,
        'Tonelada': 0.001
      },
      'Miligrama': {
        'Grama': 0.001,
        'Quilograma': 0.000001,
        'Miligrama': 1,
        'Tonelada': 0.000000001
      },
      'Tonelada': {
        'Grama': 1000000,
        'Quilograma': 1000,
        'Miligrama': 1000000000,
        'Tonelada': 1
      },
      // Volume (Litro)
      'Litro': {
        'Litro': 1,
        'Mililitro': 1000,
        'Centilitro': 100,
        'Decilitro': 10
      },
      'Mililitro': {
        'Litro': 0.001,
        'Mililitro': 1,
        'Centilitro': 0.1,
        'Decilitro': 0.01
      },
      'Centilitro': {
        'Litro': 0.01,
        'Mililitro': 10,
        'Centilitro': 1,
        'Decilitro': 0.1
      },
      'Decilitro': {
        'Litro': 0.1,
        'Mililitro': 100,
        'Centilitro': 10,
        'Decilitro': 1
      },
      // Comprimento (Metro)
      'Metro': {
        'Metro': 1,
        'Centímetro': 100,
        'Milímetro': 1000,
        'Quilômetro': 0.001,
        'Decímetro': 10
      },
      'Centímetro': {
        'Metro': 0.01,
        'Centímetro': 1,
        'Milímetro': 10,
        'Quilômetro': 0.00001,
        'Decímetro': 0.1
      },
      'Milímetro': {
        'Metro': 0.001,
        'Centímetro': 0.1,
        'Milímetro': 1,
        'Quilômetro': 0.000001,
        'Decímetro': 0.01
      },
      'Quilômetro': {
        'Metro': 1000,
        'Centímetro': 100000,
        'Milímetro': 1000000,
        'Quilômetro': 1,
        'Decímetro': 10000
      },
      'Decímetro': {
        'Metro': 0.1,
        'Centímetro': 10,
        'Milímetro': 100,
        'Quilômetro': 0.0001,
        'Decímetro': 1
      },
      // Unitário (sem conversão)
      'Unitário': {
        'Unitário': 1
      }
    }

    // Verificar se as unidades são compatíveis
    if (fromUnit === toUnit) {
      return parseFloat(value).toFixed(2)
    }

    // Verificar se há conversão direta
    if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
      const result = parseFloat(value) * conversions[fromUnit][toUnit]
      return result.toFixed(2)
    }

    // Tentar encontrar conversão através de unidade base
    const baseUnits = {
      'Grama': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Quilograma': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Miligrama': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Tonelada': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Litro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Mililitro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Centilitro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Decilitro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Metro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Centímetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Milímetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Quilômetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Decímetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Unitário': ['Unitário']
    }

    const fromGroup = Object.keys(baseUnits).find(group => baseUnits[group].includes(fromUnit))
    const toGroup = Object.keys(baseUnits).find(group => baseUnits[group].includes(toUnit))

    if (fromGroup && toGroup && fromGroup === toGroup) {
      // Converter através da unidade base
      const baseUnit = baseUnits[fromGroup][0]
      const toBase = conversions[fromUnit]?.[baseUnit] || 1
      const fromBase = conversions[baseUnit]?.[toUnit] || 1
      const result = parseFloat(value) * toBase * fromBase
      return result.toFixed(2)
    }

    return 'Conversão não disponível'
  }

  // Obter unidades relacionadas para conversão
  const getRelatedUnits = (unit) => {
    const unitGroups = {
      'Grama': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Quilograma': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Miligrama': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Tonelada': ['Grama', 'Quilograma', 'Miligrama', 'Tonelada'],
      'Litro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Mililitro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Centilitro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Decilitro': ['Litro', 'Mililitro', 'Centilitro', 'Decilitro'],
      'Metro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Centímetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Milímetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Quilômetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Decímetro': ['Metro', 'Centímetro', 'Milímetro', 'Quilômetro', 'Decímetro'],
      'Unitário': ['Unitário']
    }

    // Encontrar o grupo da unidade
    for (const [baseUnit, units] of Object.entries(unitGroups)) {
      if (units.includes(unit)) {
        return units
      }
    }
    return [unit]
  }

  // Debounce para busca de produtos
  useEffect(() => {
    const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
    
    if (!clienteMasterId) return

    const timeoutId = setTimeout(() => {
      loadProducts(clienteMasterId, searchTerm)
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedClinicData, loadProducts])

  // Funções para criação rápida de categoria
  const handleCreateCategoriaRapida = async () => {
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      if (!novaCategoria.name.trim()) {
        showError('Nome da categoria é obrigatório')
        return
      }

      const payload = {
        name: novaCategoria.name,
        type: novaCategoria.type
      }

      const response = await api.post('/cost-categories', payload)
      const categoriaCriada = response.data?.data || response.data
      
      // Atualizar lista de categorias
      setCategorias([...categorias, categoriaCriada])
      
      // Se estiver criando produto, atualizar o select de categoria
      if (showProdutoModal) {
        setNovoProduto({ ...novoProduto, categoryId: categoriaCriada.id })
      }
      
      // Limpar formulário e fechar modal
      setNovaCategoria({ name: '', type: 'DIRECT' })
      setShowCategoriaModal(false)
      
      showSuccess('Categoria criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      showError(error.response?.data?.message || 'Erro ao criar categoria')
    }
  }

  // Funções para criação rápida de produto
  const handleCreateProdutoRapido = async () => {
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      if (!novoProduto.name.trim()) {
        showError('Nome do produto é obrigatório')
        return
      }

      if (!novoProduto.categoryId) {
        showError('Categoria é obrigatória')
        return
      }

      const payload = {
        name: novoProduto.name,
        categoryId: novoProduto.categoryId,
        unitCost: parseFloat(novoProduto.unitCost) || 0,
        unitType: novoProduto.unitType || null,
        stockQuantity: novoProduto.stockQuantity !== null && novoProduto.stockQuantity !== '' ? parseFloat(novoProduto.stockQuantity) : null
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
      setNovoProduto({ name: '', categoryId: '', unitCost: '', unitType: 'Unidade', stockQuantity: null })
      setShowProdutoModal(false)
      
      showSuccess('Produto criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      showError(error.response?.data?.message || 'Erro ao criar produto')
    }
  }

  if (loadingData) {
    return (
      <div className="precificacao-form-page">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="precificacao-form-page">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate('/app/precificacao')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <h1>{id ? 'Editar Tratamento' : 'Novo Tratamento'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="precificacao-form">
        <div className="form-section">
          <h2>Informações Básicas</h2>
          
          <div className="form-group">
            <label>Nome do Tratamento *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Limpeza Profissional"
              required
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do tratamento..."
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duração Média (minutos) *</label>
              <input
                type="number"
                value={formData.averageDurationMinutes || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseInt(e.target.value) || 0
                  setFormData({ ...formData, averageDurationMinutes: value })
                  // Reativar cálculo automático quando duração mudar
                  setAutoCalculatePrice(true)
                }}
                onWheel={(e) => e.target.blur()}
                min="1"
                required
              />
              {valorHora && formData.averageDurationMinutes && (
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
            <div className="form-group">
              <label>Preço (R$) *</label>
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
                min="0"
                required
              />
              {valorHora && (
                <small className="form-help">
                  {autoCalculatePrice 
                    ? 'Calculado automaticamente baseado na duração e valor da mão de obra' 
                    : 'Edite manualmente ou altere a duração para recalcular automaticamente'}
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Produtos Utilizados</h2>
            <div className="section-header-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowProdutoModal(!showProdutoModal)}
              >
                <FontAwesomeIcon icon={faPlus} />
                {showProdutoModal ? 'Cancelar Criação' : 'Criar Produto'}
              </button>
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

          {/* Lista de Produtos Disponíveis */}
          <div className="available-products-section">
            <div className="products-section-header">
              <h3>Produtos Disponíveis</h3>
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
            {(() => {
              // Se há busca, mostrar todos os produtos encontrados (mesmo os adicionados)
              // Se não há busca, filtrar apenas os produtos disponíveis (não adicionados)
              const produtosDisponiveis = searchTerm.trim() 
                ? produtos // Com busca: mostrar todos
                : produtos.filter(p => !isProductAdded(p.id)) // Sem busca: apenas não adicionados
              
              return produtosDisponiveis.length > 0 ? (
              <div className="available-products-grid">
                {produtosDisponiveis.map((produto) => (
                  <div key={produto.id} className="available-product-card">
                    <div className="product-card-info">
                      <h4>{produto.name}</h4>
                      <div className="product-card-details">
                        {produto.stockQuantity !== null && produto.stockQuantity !== undefined && produto.stockQuantity > 0 ? (
                          <>
                            <span className="product-cost">{formatCurrency(produto.unitCost)}</span>
                            <span className="product-unit"> / {produto.stockQuantity} {produto.unitType || ''}</span>
                            <div className="product-unit-price">
                              ({formatCurrency(produto.unitCost / produto.stockQuantity)} por {produto.unitType || 'unidade'})
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="product-cost">{formatCurrency(produto.unitCost)}</span>
                            {produto.unitType && (
                              <span className="product-unit">/{produto.unitType}</span>
                            )}
                          </>
                        )}
                      </div>
                     
                    </div>
                    <button
                      type="button"
                      className={`btn-add-product ${isProductAdded(produto.id) ? 'added' : ''}`}
                      onClick={() => handleAddProductToList(produto.id)}
                      disabled={isProductAdded(produto.id)}
                    >
                      {isProductAdded(produto.id) ? (
                        <>
                          <FontAwesomeIcon icon={faCheck} />
                          Adicionado
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPlus} />
                          Adicionar
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-search-message">
                {loadingProducts ? (
                  <p>Buscando produtos...</p>
                ) : searchTerm ? (
                  <p>Nenhum produto encontrado com o termo "{searchTerm}"</p>
                ) : produtos.length === 0 ? (
                  <p>Nenhum produto cadastrado ainda. Crie um novo produto para começar.</p>
                ) : (
                  <p>Todos os produtos disponíveis já foram adicionados ao tratamento.</p>
                )}
              </div>
            )
            })()}
          </div>

          {/* Formulário de criação rápida de produto */}
          {showProdutoModal && (
            <div className="quick-create-form">
              <h3>Criar Novo Produto</h3>
              <div className="quick-create-grid">
                <div className="form-group">
                  <label>Nome do Produto *</label>
                  <input
                    type="text"
                    value={novoProduto.name}
                    onChange={(e) => setNovoProduto({ ...novoProduto, name: e.target.value })}
                    placeholder="Ex: Gel Clareador"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Categoria *</label>
                  <div className="select-with-action">
                    <select
                      value={novoProduto.categoryId}
                      onChange={(e) => setNovoProduto({ ...novoProduto, categoryId: e.target.value })}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.type === 'DIRECT' ? 'Direto' : 'Indireto'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-quick-add"
                      onClick={() => setShowCategoriaModal(true)}
                      title="Criar nova categoria"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoProduto.unitCost || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                      setNovoProduto({ ...novoProduto, unitCost: value })
                    }}
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Unidade *</label>
                  <select
                    value={novoProduto.unitType}
                    onChange={(e) => setNovoProduto({ ...novoProduto, unitType: e.target.value })}
                  >
                    {unitTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantidade do Produto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoProduto.stockQuantity || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseFloat(e.target.value) || null
                      setNovoProduto({ ...novoProduto, stockQuantity: value })
                    }}
                    min="0"
                    placeholder="Opcional"
                  />
                  <small className="form-help">Deixe em branco se não quiser controlar o estoque deste produto</small>
                </div>

                <div className="form-group quick-create-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCreateProdutoRapido}
                  >
                    <FontAwesomeIcon icon={faSave} />
                    Criar Produto
                  </button>
                </div>
              </div>
            </div>
          )}

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
                          return selectedProduct?.unitType ? (
                            <span className="unit-type-badge">{selectedProduct.unitType}</span>
                          ) : null
                        })()}
                        {product.productId && (() => {
                          const selectedProduct = produtos.find(p => p.id === product.productId)
                          if (selectedProduct?.unitType && selectedProduct.unitType !== 'Unitário') {
                            return (
                              <button
                                type="button"
                                className="btn-converter"
                                onClick={() => {
                                  const selectedProduct = produtos.find(p => p.id === product.productId)
                                  if (selectedProduct) {
                                    setShowConverter(showConverter === index ? null : index)
                                    setConverterData({
                                      fromUnit: selectedProduct.unitType,
                                      toUnit: selectedProduct.unitType, // Sempre converte para a unidade do produto
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
                      {showConverter === index && (() => {
                        const selectedProduct = produtos.find(p => p.id === product.productId)
                        if (!selectedProduct) return null
                        const relatedUnits = getRelatedUnits(selectedProduct.unitType)
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
                              <div className="converter-row">
                                <div className="converter-input-group">
                                  <label>De</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={converterData.value}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      const toUnit = selectedProduct.unitType // Sempre converte para a unidade do produto
                                      setConverterData({
                                        ...converterData,
                                        value,
                                        toUnit: toUnit,
                                        result: value && converterData.fromUnit && toUnit
                                          ? convertUnit(value, converterData.fromUnit, toUnit)
                                          : ''
                                      })
                                    }}
                                    placeholder="0.00"
                                  />
                                  <select
                                    value={converterData.fromUnit}
                                    onChange={(e) => {
                                      const toUnit = selectedProduct.unitType // Sempre converte para a unidade do produto
                                      setConverterData({
                                        ...converterData,
                                        fromUnit: e.target.value,
                                        toUnit: toUnit,
                                        result: converterData.value && e.target.value && toUnit
                                          ? convertUnit(converterData.value, e.target.value, toUnit)
                                          : ''
                                      })
                                    }}
                                  >
                                    {relatedUnits.map(unit => (
                                      <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="converter-arrow">
                                  <FontAwesomeIcon icon={faExchangeAlt} />
                                </div>
                                <div className="converter-input-group">
                                  <label>Para</label>
                                  <input
                                    type="text"
                                    value={converterData.result || ''}
                                    readOnly
                                    placeholder="0.00"
                                    className="converter-result"
                                  />
                                  <select
                                    value={selectedProduct.unitType}
                                    disabled
                                    className="converter-unit-disabled"
                                  >
                                    <option value={selectedProduct.unitType}>{selectedProduct.unitType}</option>
                                  </select>
                                </div>
                              </div>
                              {converterData.result && converterData.result !== 'Conversão não disponível' && (
                                <button
                                  type="button"
                                  className="btn-apply-conversion"
                                  onClick={() => {
                                    if (converterData.result && converterData.result !== 'Conversão não disponível') {
                                      handleUpdateProduct(index, 'quantityUsed', parseFloat(converterData.result))
                                      setShowConverter(null)
                                    }
                                  }}
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                  Usar este valor
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
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
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="form-actions">
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
          <div className="actions-right">
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
      </form>

      {/* Modal de Criação Rápida de Categoria */}
      {showCategoriaModal && (
        <div className="modal-overlay" onClick={() => setShowCategoriaModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar Categoria Rápida</h2>
              <button className="btn-close" onClick={() => setShowCategoriaModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Categoria *</label>
                <input
                  type="text"
                  value={novaCategoria.name}
                  onChange={(e) => setNovaCategoria({ ...novaCategoria, name: e.target.value })}
                  placeholder="Ex: Material, Laboratório, etc."
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Tipo de Custo *</label>
                <select
                  value={novaCategoria.type}
                  onChange={(e) => setNovaCategoria({ ...novaCategoria, type: e.target.value })}
                >
                  <option value="DIRECT">Custo Direto</option>
                  <option value="INDIRECT">Custo Indireto</option>
                </select>
                <small className="form-help">
                  {novaCategoria.type === 'DIRECT' 
                    ? 'Custos diretos são vinculados diretamente ao tratamento (Material, Laboratório, Comissão, Taxa Cartão, Descartáveis)'
                    : 'Custos indiretos são compartilhados entre tratamentos (Aluguel, Energia, Internet, Funcionários, Marketing)'}
                </small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCategoriaModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleCreateCategoriaRapida}>
                <FontAwesomeIcon icon={faSave} />
                Criar
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
    </div>
  )
}

export default PrecificacaoTratamento

