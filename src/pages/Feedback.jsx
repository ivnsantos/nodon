import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus, faEdit, faTrash, faPaperPlane, faEye, faCheckCircle,
  faTimes, faSpinner, faComment, faQuestionCircle, faList,
  faUsers, faChartBar, faCalendarAlt, faToggleOn, faToggleOff, faClock,
  faSearch, faCopy, faLink
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Feedback.css'

const Feedback = () => {
  const navigate = useNavigate()
  const { alertConfig, showSuccess, showError, hideAlert } = useAlert()
  
  const [questionarios, setQuestionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEnviarModal, setShowEnviarModal] = useState(false)
  const [selectedQuestionario, setSelectedQuestionario] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [selectedPacientes, setSelectedPacientes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [publicLink, setPublicLink] = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(false)

  useEffect(() => {
    loadQuestionarios()
  }, [])

  useEffect(() => {
    if (!showEnviarModal) {
      setSearchTerm('')
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    if (!searchTerm || searchTerm.length < 3) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, showEnviarModal])

  const loadQuestionarios = async () => {
    try {
      setLoading(true)
      const response = await api.get('/questionarios')
      const data = response.data?.data || response.data || []
      setQuestionarios(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar questionários:', error)
      showError('Erro ao carregar questionários')
    } finally {
      setLoading(false)
    }
  }

  const loadPacientes = async () => {
    try {
      const response = await api.get('/clientes')
      const data = response.data?.data || response.data || []
      setPacientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    }
  }


  const handleCreate = () => {
    navigate('/app/feedback/novo')
  }

  const handleEdit = (questionario) => {
    navigate(`/app/feedback/${questionario.id}/editar`)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este questionário?')) return
    
    try {
      await api.delete(`/questionarios/${id}`)
      showSuccess('Questionário excluído com sucesso!')
      loadQuestionarios()
    } catch (error) {
      console.error('Erro ao excluir questionário:', error)
      showError('Erro ao excluir questionário')
    }
  }

  const handleEnviar = async () => {
    try {
      let payload = {
        questionarioId: selectedQuestionario.id
      }

      // Se houver pacientes selecionados, incluir no payload
      if (selectedPacientes.length > 0) {
        payload.pacienteIds = selectedPacientes
      }

      const response = await api.post('/questionarios/enviar', payload)
      const responseData = response.data?.data || response.data
      
      // A API retorna um array de respostas criadas
      const respostas = Array.isArray(responseData) ? responseData : [responseData]
      
      // Sempre pegar a primeira resposta para gerar o link
      if (respostas.length > 0 && respostas[0].id) {
        const linkPublico = `${window.location.origin}/responder-questionario/${respostas[0].id}`
        setPublicLink(linkPublico)
        setShowEnviarModal(false)
        setShowLinkModal(true)
      } else {
        // Se não houver resposta, apenas fechar o modal
        setShowEnviarModal(false)
      }
      
      setSelectedPacientes([])
      setSearchTerm('')
      loadQuestionarios()
    } catch (error) {
      console.error('Erro ao enviar questionário:', error)
      showError(error.response?.data?.message || 'Erro ao enviar questionário')
    }
  }

  const handleCopyLink = async () => {
    if (!publicLink) return
    
    try {
      await navigator.clipboard.writeText(publicLink)
      showSuccess('Link copiado')
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = publicLink
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showSuccess('Link copiado')
      } catch (err) {
        showError('Erro ao copiar link. Tente copiar manualmente.')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleCloseLinkModal = () => {
    setShowLinkModal(false)
    setPublicLink(null)
    setShowEnviarModal(false)
  }

  const handleOpenEnviarModal = async (questionario) => {
    if (!questionario.ativa) {
      showError('Questionário inativo não pode ser enviado')
      return
    }
    setSelectedQuestionario(questionario)
    setSelectedPacientes([])
    setShowEnviarModal(true)
    // Carregar pacientes apenas quando abrir o modal
    await loadPacientes()
  }

  const handleOpenRespostasModal = async (questionario) => {
    navigate(`/app/feedback/${questionario.id}/respostas`)
  }

  const handleSearch = async (term) => {
    if (!term || term.length < 3) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    
    setSearching(true)
    setShowSearchResults(true)
    
    try {
      const cpfOnly = term.replace(/\D/g, '')
      let url = '/pacientes/buscar'
      
      const isOnlyNumbers = /^\d+$/.test(term.replace(/\s/g, ''))
      
      if (isOnlyNumbers && cpfOnly.length >= 3) {
        url += `?cpf=${cpfOnly}`
      } else {
        url += `?nome=${encodeURIComponent(term.trim())}`
      }
      
      const response = await api.get(url)
      
      let pacientes = []
      if (Array.isArray(response.data)) {
        pacientes = response.data
      } else if (response.data?.statusCode === 200) {
        pacientes = response.data.data?.data?.pacientes || 
                   response.data.data?.pacientes || 
                   response.data.pacientes || 
                   []
      } else if (response.data?.data) {
        pacientes = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data.pacientes || [])
      } else if (response.data) {
        pacientes = Array.isArray(response.data) ? response.data : []
      }
      
      setSearchResults(pacientes)
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const formatCPF = (cpf) => {
    if (!cpf) return ''
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  const handleSelectPaciente = (paciente) => {
    if (!selectedPacientes.includes(paciente.id)) {
      setSelectedPacientes([...selectedPacientes, paciente.id])
      // Adicionar à lista de pacientes se não estiver
      if (!pacientes.find(p => p.id === paciente.id)) {
        setPacientes([...pacientes, paciente])
      }
    }
    setSearchTerm('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  const togglePaciente = (pacienteId) => {
    if (selectedPacientes.includes(pacienteId)) {
      setSelectedPacientes(selectedPacientes.filter(id => id !== pacienteId))
    } else {
      setSelectedPacientes([...selectedPacientes, pacienteId])
    }
  }


  if (loading) {
    return (
      <div className="feedback-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Carregando questionários...</p>
      </div>
    )
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <div className="feedback-header-content">
          <h1>
            <FontAwesomeIcon icon={faComment} />
            Feedback
          </h1>
          <p>Gerencie questionários e colete feedback dos pacientes</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <FontAwesomeIcon icon={faPlus} />
          Novo Questionário
        </button>
      </div>

      {questionarios.length === 0 ? (
        <div className="feedback-empty">
          <FontAwesomeIcon icon={faComment} size="3x" />
          <h2>Nenhum questionário criado</h2>
          <p>Crie seu primeiro questionário para começar a coletar feedback</p>
          <button className="btn-primary" onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            Criar Questionário
          </button>
        </div>
      ) : (
        <div className="feedback-grid">
          {questionarios.map((questionario) => (
            <div key={questionario.id} className="feedback-card">
              <div className="feedback-card-header">
                <div className="feedback-card-title">
                  <h3>{questionario.titulo}</h3>
                  <span className={`feedback-status ${questionario.ativa ? 'ativa' : 'inativa'}`}>
                    {questionario.ativa ? (
                      <>
                        <FontAwesomeIcon icon={faToggleOn} />
                        Ativa
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faToggleOff} />
                        Inativa
                      </>
                    )}
                  </span>
                </div>
                <div className="feedback-card-actions">
                  <button
                    className="btn-icon"
                    onClick={() => navigate(`/app/feedback/${questionario.id}/respostas`)}
                    title="Ver gráficos e respostas"
                  >
                    <FontAwesomeIcon icon={faChartBar} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleOpenEnviarModal(questionario)}
                    title="Enviar para pacientes"
                    disabled={!questionario.ativa}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(questionario)}
                    title="Editar"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(questionario.id)}
                    title="Excluir"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              
              {questionario.descricao && (
                <p className="feedback-card-description">{questionario.descricao}</p>
              )}
              
              <div className="feedback-card-info">
                <div className="info-item">
                  <FontAwesomeIcon icon={faQuestionCircle} />
                  <span>{questionario.perguntas?.length || 0} pergunta(s)</span>
                </div>
                <div className="info-item">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>
                    {new Date(questionario.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Enviar para Pacientes */}
      {showEnviarModal && selectedQuestionario && (
        <div className="modal-overlay" onClick={() => setShowEnviarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enviar Questionário</h2>
              <button className="btn-close" onClick={() => setShowEnviarModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Selecione os pacientes que receberão o questionário: <strong>{selectedQuestionario.titulo}</strong>
              </p>

              <div className="paciente-search-container">
                <div className="paciente-search-input-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    className="paciente-search-input"
                    placeholder="Buscar por CPF ou nome do paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0 || searching) {
                        setShowSearchResults(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSearchResults(false)
                      }, 200)
                    }}
                  />
                  {searching && (
                    <div className="search-spinner">
                      <FontAwesomeIcon icon={faSpinner} spin />
                    </div>
                  )}
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="paciente-search-results">
                    <div className="search-results-header">
                      {searchResults.length} paciente(s) encontrado(s)
                    </div>
                    {searchResults.map((paciente) => {
                      const isSelected = selectedPacientes.includes(paciente.id)
                      return (
                        <div
                          key={paciente.id}
                          className={`search-result-item ${isSelected ? 'selected' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            if (!isSelected) {
                              handleSelectPaciente(paciente)
                            }
                          }}
                        >
                          <div className="search-result-info">
                            <span className="search-result-nome">{paciente.nome}</span>
                            <div className="search-result-details">
                              {paciente.cpf && (
                                <span className="search-result-cpf">CPF: {formatCPF(paciente.cpf)}</span>
                              )}
                              {paciente.email && (
                                <span className="search-result-email">{paciente.email}</span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="search-result-check">
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-add-paciente"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectPaciente(paciente)
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && !searching && searchTerm.length >= 3 && (
                  <div className="paciente-search-results">
                    <div className="search-no-results">
                      <FontAwesomeIcon icon={faUsers} />
                      <p>Nenhum paciente encontrado</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedPacientes.length > 0 && (
                <div className="selected-pacientes-section">
                  <h3>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Pacientes Selecionados ({selectedPacientes.length})
                  </h3>
                  <div className="selected-pacientes-list">
                    {pacientes
                      .filter(p => selectedPacientes.includes(p.id))
                      .map((paciente) => (
                        <div key={paciente.id} className="selected-paciente-item">
                          <div className="selected-paciente-info">
                            <span className="selected-paciente-nome">{paciente.nome}</span>
                            <div className="selected-paciente-details">
                              {paciente.cpf && (
                                <span className="selected-paciente-cpf">CPF: {formatCPF(paciente.cpf)}</span>
                              )}
                              {paciente.email && (
                                <span className="selected-paciente-email">{paciente.email}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-remove-paciente"
                            onClick={() => togglePaciente(paciente.id)}
                            title="Remover"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedPacientes.length === 0 && (!searchTerm || searchTerm.length < 3) && (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faSearch} />
                  <p>Digite pelo menos 3 caracteres para buscar pacientes ou envie sem selecionar para criar uma resposta pública</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEnviarModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleEnviar}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Link Público */}
      {showLinkModal && publicLink && (
        <div className="modal-overlay" onClick={handleCloseLinkModal}>
          <div className="modal-content modal-link" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faLink} />
                Link Público Gerado
              </h2>
              <button className="btn-close" onClick={handleCloseLinkModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="link-publico-container">
                <p className="link-description">
                  O link público foi gerado com sucesso! Compartilhe este link para que qualquer pessoa possa responder o questionário.
                </p>
                
                <div className="link-input-container">
                  <input
                    type="text"
                    value={publicLink}
                    readOnly
                    className="link-input"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    className="btn-copy-link"
                    onClick={handleCopyLink}
                    title="Copiar link"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                    Copiar
                  </button>
                </div>

                <div className="link-info">
                  <FontAwesomeIcon icon={faComment} />
                  <p>Qualquer pessoa com este link poderá responder o questionário de forma anônima.</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={handleCloseLinkModal}>
                Fechar
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

export default Feedback

