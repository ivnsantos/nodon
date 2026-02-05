import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faSearch, faClipboardQuestion, faEdit,
  faTrash, faEye, faCheckCircle, faTimesCircle
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Anamneses.css'

const Anamneses = () => {
  const navigate = useNavigate()
  const { selectedClinicData, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Hook para modal de alerta
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [anamneses, setAnamneses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [anamneseToDelete, setAnamneseToDelete] = useState(null)

  useEffect(() => {
    if (selectedClinicData) {
      loadAnamneses()
    }
  }, [selectedClinicData])

  const loadAnamneses = async () => {
    try {
      setLoading(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoading(false)
        return
      }

      const response = await api.get(`/anamneses?clienteMasterId=${clienteMasterId}`)
      
      // Tratar diferentes formatos de resposta da API
      let anamnesesData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          anamnesesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          anamnesesData = response.data.data
        } else if (typeof response.data === 'object') {
          // Se for um objeto único, converter para array
          anamnesesData = [response.data]
        }
      }
      
      setAnamneses(anamnesesData)
    } catch (error) {
      console.error('Erro ao carregar anamneses:', error)
      showError('Erro ao carregar anamneses. Tente novamente.')
      setAnamneses([]) // Garantir que seja array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (anamnese) => {
    setAnamneseToDelete(anamnese)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!anamneseToDelete) return

    try {
      await api.delete(`/anamneses/${anamneseToDelete.id}`)
      showSuccess('Anamnese deletada com sucesso!')
      setShowDeleteModal(false)
      setAnamneseToDelete(null)
      loadAnamneses()
    } catch (error) {
      console.error('Erro ao deletar anamnese:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao deletar anamnese. Tente novamente.'
      showError(errorMessage)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setAnamneseToDelete(null)
  }

  const filteredAnamneses = Array.isArray(anamneses) 
    ? anamneses.filter(anamnese => {
        const searchLower = searchTerm.toLowerCase()
        return (
          anamnese.titulo?.toLowerCase().includes(searchLower) ||
          anamnese.descricao?.toLowerCase().includes(searchLower)
        )
      })
    : []

  if (!selectedClinicData) {
    return (
      <div className="anamneses-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do consultório...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="anamneses-loading">
        <div className="loading-spinner"></div>
        <p>Carregando anamneses...</p>
      </div>
    )
  }

  return (
    <div className="anamneses-page">
      <div className="anamneses-toolbar">
        <div className="anamneses-filters">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar anamnese por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {isMaster && (
          <button
            className="btn-modern-primary"
            onClick={() => navigate('/app/anamneses/novo')}
          >
            <FontAwesomeIcon icon={faPlus} />
            Nova Anamnese
          </button>
        )}
      </div>

      <div className="anamneses-grid">
        {filteredAnamneses.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faClipboardQuestion} size="3x" />
            {anamneses.length === 0 ? (
              <>
                <h3>Nenhuma anamnese cadastrada</h3>
                <p>Comece criando sua primeira anamnese para coletar informações dos pacientes.</p>
                {isMaster && (
                  <button 
                    className="btn-modern-primary"
                    onClick={() => navigate('/app/anamneses/novo')}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Criar Primeira Anamnese
                  </button>
                )}
              </>
            ) : (
              <>
                <p>Nenhuma anamnese encontrada com os filtros aplicados</p>
                <button 
                  className="btn-modern-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  Limpar Filtros
                </button>
              </>
            )}
          </div>
        ) : (
          filteredAnamneses.map(anamnese => (
            <div key={anamnese.id} className="anamnese-card">
              <div className="anamnese-header">
                <div className="anamnese-icon">
                  <FontAwesomeIcon icon={faClipboardQuestion} />
                </div>
                <div className="anamnese-info-header">
                  <h3>{anamnese.titulo}</h3>
                  <span 
                    className={`status-badge ${anamnese.ativa ? 'active' : 'inactive'}`}
                  >
                    <FontAwesomeIcon icon={anamnese.ativa ? faCheckCircle : faTimesCircle} />
                    {anamnese.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
              
              {anamnese.descricao && (
                <div className="anamnese-description">
                  <p>{anamnese.descricao}</p>
                </div>
              )}

              <div className="anamnese-details">
                <div className="detail-item">
                  <span className="detail-label">Perguntas:</span>
                  <span className="detail-value">{anamnese.perguntas?.length || 0}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Criada em:</span>
                  <span className="detail-value">
                    {new Date(anamnese.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="anamnese-actions">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/app/anamneses/${anamnese.id}`)}
                >
                  <FontAwesomeIcon icon={faEye} />
                  Ver Detalhes
                </button>
                {isMaster && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/app/anamneses/${anamnese.id}/editar`)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteClick(anamnese)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir a anamnese <strong>"{anamneseToDelete?.titulo}"</strong>?</p>
            <p className="warning-text">Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn-modern-secondary" onClick={handleCancelDelete}>
                Cancelar
              </button>
              <button className="btn-modern-danger" onClick={handleConfirmDelete}>
                Excluir
              </button>
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

export default Anamneses

