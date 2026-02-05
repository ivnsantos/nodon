import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faEdit, faClipboardQuestion, faCheckCircle, faTimesCircle,
  faGripVertical, faTrash
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './AnamneseDetalhes.css'

const AnamneseDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Hook para modal de alerta
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [anamnese, setAnamnese] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadAnamnese()
    }
  }, [id])

  const loadAnamnese = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/anamneses/${id}`)
      const data = response.data?.data || response.data
      setAnamnese(data)
    } catch (error) {
      console.error('Erro ao carregar anamnese:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao carregar anamnese. Tente novamente.'
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/anamneses/${id}`)
      showSuccess('Anamnese deletada com sucesso!')
      navigate('/app/anamneses')
    } catch (error) {
      console.error('Erro ao deletar anamnese:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao deletar anamnese. Tente novamente.'
      showError(errorMessage)
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  if (loading) {
    return (
      <div className="anamnese-detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando anamnese...</p>
      </div>
    )
  }

  if (!anamnese) {
    return (
      <div className="anamnese-detalhes-error">
        <p>Anamnese não encontrada.</p>
        <button className="btn-modern-primary" onClick={() => navigate('/app/anamneses')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
      </div>
    )
  }

  const perguntasOrdenadas = anamnese.perguntas?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) || []

  return (
    <div className="anamnese-detalhes-page">
      <div className="anamnese-detalhes-header">
        <button className="btn-back" onClick={() => navigate('/app/anamneses')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        {isMaster && (
          <div className="header-actions">
            <button
              className="btn-edit"
              onClick={() => navigate(`/app/anamneses/${id}/editar`)}
            >
              <FontAwesomeIcon icon={faEdit} />
              Editar
            </button>
            <button
              className="btn-delete"
              onClick={handleDeleteClick}
            >
              <FontAwesomeIcon icon={faTrash} />
              Excluir
            </button>
          </div>
        )}
      </div>

      <div className="anamnese-detalhes-content">
        <div className="anamnese-info-card">
          <div className="anamnese-title-section">
            <div className="anamnese-icon-large">
              <FontAwesomeIcon icon={faClipboardQuestion} />
            </div>
            <div className="anamnese-title-info">
              <h1>{anamnese.titulo}</h1>
              <div className="anamnese-status-badge">
                <span className={`status-badge ${anamnese.ativa ? 'active' : 'inactive'}`}>
                  <FontAwesomeIcon icon={anamnese.ativa ? faCheckCircle : faTimesCircle} />
                  {anamnese.ativa ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          </div>

          {anamnese.descricao && (
            <div className="anamnese-description-section">
              <p>{anamnese.descricao}</p>
            </div>
          )}

          <div className="anamnese-meta-info">
            <div className="meta-item">
              <span className="meta-label">Perguntas:</span>
              <span className="meta-value">{perguntasOrdenadas.length}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Criada em:</span>
              <span className="meta-value">
                {new Date(anamnese.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {anamnese.updatedAt && anamnese.updatedAt !== anamnese.createdAt && (
              <div className="meta-item">
                <span className="meta-label">Atualizada em:</span>
                <span className="meta-value">
                  {new Date(anamnese.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="perguntas-section">
          <h2>Perguntas ({perguntasOrdenadas.length})</h2>
          {perguntasOrdenadas.length === 0 ? (
            <div className="empty-perguntas">
              <p>Nenhuma pergunta cadastrada nesta anamnese.</p>
            </div>
          ) : (
            <div className="perguntas-list">
              {perguntasOrdenadas.map((pergunta, index) => (
                <div key={pergunta.id} className="pergunta-item">
                  <div className="pergunta-header">
                    <div className="pergunta-number">
                      <FontAwesomeIcon icon={faGripVertical} />
                      <span>{index + 1}</span>
                    </div>
                    <div className="pergunta-info">
                      <h3>
                        {pergunta.texto}
                        {pergunta.obrigatoria && <span className="required-mark">*</span>}
                      </h3>
                      <div className="pergunta-details">
                        <span className="tipo-resposta">Tipo: {getTipoRespostaLabel(pergunta.tipoResposta)}</span>
                        {pergunta.opcoes && pergunta.opcoes.length > 0 && (
                          <span className="opcoes-count">
                            {pergunta.opcoes.length} opção(ões)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {pergunta.opcoes && pergunta.opcoes.length > 0 && (
                    <div className="pergunta-opcoes">
                      <strong>Opções:</strong>
                      <ul>
                        {pergunta.opcoes.map((opcao, idx) => (
                          <li key={idx}>{opcao}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir a anamnese <strong>"{anamnese.titulo}"</strong>?</p>
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

const getTipoRespostaLabel = (tipo) => {
  const tipos = {
    'texto': 'Texto',
    'numero': 'Número',
    'booleano': 'Sim/Não',
    'multipla_escolha': 'Múltipla Escolha',
    'data': 'Data'
  }
  return tipos[tipo] || tipo
}

export default AnamneseDetalhes

