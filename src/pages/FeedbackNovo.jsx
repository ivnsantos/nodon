import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faComment, faPlus, faTrash, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './FeedbackNovo.css'

const FeedbackNovo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { alertConfig, showSuccess, showError, hideAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    ativa: true,
    perguntas: []
  })

  useEffect(() => {
    if (isEditMode && id) {
      loadQuestionarioData()
    }
  }, [id, isEditMode])

  const loadQuestionarioData = async () => {
    try {
      setLoadingData(true)
      const response = await api.get(`/questionarios/${id}`)
      const data = response.data?.data || response.data || {}
      
      setFormData({
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        ativa: data.ativa !== undefined ? data.ativa : true,
        perguntas: Array.isArray(data.perguntas) ? data.perguntas : []
      })
    } catch (error) {
      console.error('Erro ao carregar questionário:', error)
      showError(error.response?.data?.message || 'Erro ao carregar questionário')
      navigate('/app/feedback')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addPergunta = () => {
    setFormData({
      ...formData,
      perguntas: [
        ...formData.perguntas,
        {
          texto: '',
          tipoResposta: 'texto',
          opcoes: [],
          obrigatoria: false,
          ordem: formData.perguntas.length
        }
      ]
    })
  }

  const removePergunta = (index) => {
    const novasPerguntas = formData.perguntas.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      perguntas: novasPerguntas.map((p, i) => ({ ...p, ordem: i }))
    })
  }

  const updatePergunta = (index, field, value) => {
    const novasPerguntas = [...formData.perguntas]
    novasPerguntas[index] = {
      ...novasPerguntas[index],
      [field]: value
    }
    
    // Se mudar para tipo que precisa de opções, garantir que tem opções
    if (field === 'tipoResposta' && (value === 'multipla_escolha' || value === 'escala')) {
      if (!novasPerguntas[index].opcoes || novasPerguntas[index].opcoes.length === 0) {
        novasPerguntas[index].opcoes = value === 'escala' ? ['1', '2', '3', '4', '5'] : []
      }
    }
    
    setFormData({
      ...formData,
      perguntas: novasPerguntas
    })
  }

  const updateOpcoes = (index, opcoesStr) => {
    const opcoes = opcoesStr.split(',').map(o => o.trim()).filter(o => o)
    updatePergunta(index, 'opcoes', opcoes)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo.trim()) {
      showError('Por favor, preencha o título do questionário')
      return
    }

    try {
      setLoading(true)
      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        ativa: formData.ativa,
        perguntas: formData.perguntas.map((p, index) => ({
          texto: p.texto,
          tipoResposta: p.tipoResposta,
          opcoes: p.opcoes || [],
          obrigatoria: p.obrigatoria !== undefined ? p.obrigatoria : false,
          ordem: p.ordem !== undefined ? p.ordem : index
        }))
      }

      if (isEditMode) {
        await api.patch(`/questionarios/${id}`, payload)
        showSuccess('Questionário atualizado com sucesso!')
      } else {
        await api.post('/questionarios', payload)
        showSuccess('Questionário criado com sucesso!')
      }
      
      setTimeout(() => {
        navigate('/app/feedback')
      }, 1000)
    } catch (error) {
      console.error('Erro ao salvar questionário:', error)
      showError(error.response?.data?.message || 'Erro ao salvar questionário')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="feedback-novo-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Carregando dados do questionário...</p>
      </div>
    )
  }

  return (
    <div className="feedback-novo-page">
      <div className="feedback-novo-header">
        <button className="btn-back" onClick={() => navigate('/app/feedback')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <h1>
          <FontAwesomeIcon icon={faComment} />
          {isEditMode ? 'Editar Questionário' : 'Novo Questionário'}
        </h1>
      </div>

      <form className="feedback-novo-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Informações do Questionário</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Título *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                placeholder="Ex: Pesquisa de Satisfação"
              />
            </div>
            <div className="form-group full-width">
              <label>Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descreva o objetivo deste questionário"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="ativa"
                  checked={formData.ativa}
                  onChange={handleInputChange}
                />
                <span>Questionário ativo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Perguntas</h2>
            <button type="button" className="btn-secondary" onClick={addPergunta}>
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Pergunta
            </button>
          </div>

          {formData.perguntas.map((pergunta, index) => (
            <div key={index} className="pergunta-item">
              <div className="pergunta-header">
                <div className="pergunta-title-section">
                  <span className="pergunta-label">Pergunta</span>
                  <span className="pergunta-number">{index + 1}</span>
                </div>
                <button
                  type="button"
                  className="btn-icon btn-danger"
                  onClick={() => removePergunta(index)}
                  title="Remover pergunta"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>

              <div className="form-group">
                <label>Texto da Pergunta *</label>
                <input
                  type="text"
                  value={pergunta.texto}
                  onChange={(e) => updatePergunta(index, 'texto', e.target.value)}
                  required
                  placeholder="Ex: Como você avalia o atendimento?"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Resposta *</label>
                  <select
                    value={pergunta.tipoResposta}
                    onChange={(e) => updatePergunta(index, 'tipoResposta', e.target.value)}
                    required
                  >
                    <option value="texto">Texto</option>
                    <option value="numero">Número</option>
                    <option value="booleano">Sim/Não</option>
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="data">Data</option>
                    <option value="escala">Escala</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={pergunta.obrigatoria}
                      onChange={(e) => updatePergunta(index, 'obrigatoria', e.target.checked)}
                    />
                    <span>Obrigatória</span>
                  </label>
                </div>
              </div>

              {(pergunta.tipoResposta === 'multipla_escolha' || pergunta.tipoResposta === 'escala') && (
                <div className="form-group">
                  <label>
                    Opções {pergunta.tipoResposta === 'escala' ? '(separadas por vírgula)' : '(uma por linha ou separadas por vírgula)'}
                  </label>
                  {pergunta.tipoResposta === 'escala' ? (
                    <input
                      type="text"
                      value={pergunta.opcoes?.join(', ') || ''}
                      onChange={(e) => updateOpcoes(index, e.target.value)}
                      placeholder="Ex: 1, 2, 3, 4, 5"
                    />
                  ) : (
                    <textarea
                      value={pergunta.opcoes?.join('\n') || ''}
                      onChange={(e) => {
                        const opcoes = e.target.value.split('\n').map(o => o.trim()).filter(o => o)
                        updatePergunta(index, 'opcoes', opcoes)
                      }}
                      rows="4"
                      placeholder="Ex: Opção 1&#10;Opção 2&#10;Opção 3"
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {formData.perguntas.length === 0 && (
            <div className="empty-state">
              <FontAwesomeIcon icon={faComment} />
              <p>Nenhuma pergunta adicionada. Use o botão abaixo para adicionar a primeira pergunta.</p>
            </div>
          )}

          <div className="perguntas-add-footer">
            <button type="button" className="btn-add-pergunta" onClick={addPergunta}>
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Pergunta
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/app/feedback')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Salvando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                {isEditMode ? 'Atualizar' : 'Criar'} Questionário
              </>
            )}
          </button>
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

export default FeedbackNovo

