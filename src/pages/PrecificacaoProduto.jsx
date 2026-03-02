import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faTrash, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import { useAuth } from '../context/useAuth'
import UnitTypeSelect from '../components/UnitTypeSelect'
import './PrecificacaoForm.css'

const PrecificacaoProduto = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showSuccess, showError, hideAlert } = useAlert()

  const normalizeUnitType = (val) => {
    if (!val) return 'Unitário'
    if (val === 'Unidade') return 'Unitário'
    if (val === 'Metro') return 'Centímetro'
    return val
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!!id)
  const [categorias, setCategorias] = useState([])
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    unitCost: 0,
    unitType: 'Unitário',
    stockQuantity: null
  })

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

      // Se estiver editando, carregar dados do produto
      if (id) {
        try {
          setLoadingData(true)
          const response = await api.get(`/products/${id}`)
          const produto = response.data?.data || response.data
          
          setFormData({
            name: produto.name,
            categoryId: produto.categoryId,
            unitCost: produto.unitCost || '',
            unitType: normalizeUnitType(produto.unitType) || 'Unitário',
            stockQuantity: produto.stockQuantity || null
          })
        } catch (error) {
          console.error('Erro ao carregar produto:', error)
          showError('Erro ao carregar produto')
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadData()
  }, [id, selectedClinicData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      const payload = {
        name: formData.name,
        categoryId: formData.categoryId,
        unitCost: parseFloat(formData.unitCost) || 0,
        unitType: normalizeUnitType(formData.unitType) || null,
        stockQuantity: formData.stockQuantity !== null && formData.stockQuantity !== '' ? parseFloat(formData.stockQuantity) : null
      }

      if (id) {
        await api.patch(`/products/${id}`, payload)
        showSuccess('Produto atualizado com sucesso!')
      } else {
        await api.post('/products', payload)
        showSuccess('Produto criado com sucesso!')
      }

      navigate('/app/precificacao')
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      showError(error.response?.data?.message || 'Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      setLoading(true)
      await api.delete(`/products/${id}`)
      showSuccess('Produto excluído com sucesso!')
      navigate('/app/precificacao')
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      showError(error.response?.data?.message || 'Erro ao excluir produto')
    } finally {
      setLoading(false)
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
        <h1>{id ? 'Editar Produto' : 'Novo Produto'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="precificacao-form">
        <div className="form-section">
          <h2>Informações do Produto</h2>
          
          <div className="form-group">
            <label>Nome do Produto *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Gel Clareador"
              required
            />
          </div>

          <div className="form-group">
            <label>Categoria *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'DIRECT' ? 'Direto' : 'Indireto'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label>Custo (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                  setFormData({ ...formData, unitCost: value })
                }}
                min="0"
                required
              />
            </div>
            <div className="form-group">
              <label>Tipo de Unidade</label>
              <UnitTypeSelect
                value={formData.unitType}
                onChange={(unitType) => setFormData({ ...formData, unitType })}
              />
            </div>

            <div className="form-group">
              <label>Tamanho / Quantidade</label>
              <input
                type="number"
                step="0.01"
                value={formData.stockQuantity || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value) || null
                  setFormData({ ...formData, stockQuantity: value })
                }}
                min="0"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="unit-preview">
            <div className="unit-preview-title">Preview</div>
            <div className="unit-preview-row">
              <div className="unit-preview-item">
                <span className="unit-preview-label">Custo</span>
                <span className="unit-preview-value">{formatCurrency(Number(formData.unitCost) || 0)}</span>
              </div>
              <div className="unit-preview-item">
                <span className="unit-preview-label">Quantidade/Unidade</span>
                <span className="unit-preview-value">
                  {(formData.stockQuantity === null || formData.stockQuantity === '' ? '—' : Number(formData.stockQuantity))}/{normalizeUnitType(formData.unitType)}
                </span>
              </div>
            </div>
          </div>
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

export default PrecificacaoProduto

