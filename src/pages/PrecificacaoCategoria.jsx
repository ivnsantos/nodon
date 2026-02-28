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
import './PrecificacaoForm.css'

const PrecificacaoCategoria = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showSuccess, showError, hideAlert } = useAlert()
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!!id)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'DIRECT'
  })

  useEffect(() => {
    if (id) {
      const loadCategoria = async () => {
        try {
          setLoadingData(true)
          const response = await api.get(`/cost-categories/${id}`)
          const categoria = response.data?.data || response.data
          
          setFormData({
            name: categoria.name,
            type: categoria.type
          })
        } catch (error) {
          console.error('Erro ao carregar categoria:', error)
          showError('Erro ao carregar categoria')
        } finally {
          setLoadingData(false)
        }
      }

      loadCategoria()
    }
  }, [id])

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
        type: formData.type
      }

      if (id) {
        await api.patch(`/cost-categories/${id}`, payload)
        showSuccess('Categoria atualizada com sucesso!')
      } else {
        await api.post('/cost-categories', payload)
        showSuccess('Categoria criada com sucesso!')
      }

      navigate('/app/precificacao')
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      showError(error.response?.data?.message || 'Erro ao salvar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    
    if (!window.confirm('Tem certeza que deseja excluir esta categoria? Produtos vinculados também serão afetados.')) return

    try {
      setLoading(true)
      await api.delete(`/cost-categories/${id}`)
      showSuccess('Categoria excluída com sucesso!')
      navigate('/app/precificacao')
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      showError(error.response?.data?.message || 'Erro ao excluir categoria')
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
        <h1>{id ? 'Editar Categoria' : 'Nova Categoria'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="precificacao-form">
        <div className="form-section">
          <h2>Informações da Categoria</h2>
          
          <div className="form-group">
            <label>Nome da Categoria *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Material, Laboratório, etc."
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Custo *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="DIRECT">Custo Direto</option>
              <option value="INDIRECT">Custo Indireto</option>
            </select>
            <small className="form-help">
              {formData.type === 'DIRECT' 
                ? 'Custos diretos são vinculados diretamente ao tratamento (Material, Laboratório, Comissão, Taxa Cartão, Descartáveis)'
                : 'Custos indiretos são compartilhados entre tratamentos (Aluguel, Energia, Internet, Funcionários, Marketing)'}
            </small>
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

export default PrecificacaoCategoria

