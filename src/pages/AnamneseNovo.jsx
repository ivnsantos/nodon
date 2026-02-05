import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faClipboardQuestion, faPlus, faTimes,
  faGripVertical, faTrash, faEdit
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './AnamneseNovo.css'

const TIPOS_RESPOSTA = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'booleano', label: 'Sim/Não' },
  { value: 'multipla_escolha', label: 'Múltipla Escolha' },
  { value: 'data', label: 'Data' }
]

const AnamneseNovo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showError, showWarning, showSuccess, hideAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const isEditMode = !!id
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    ativa: true
  })
  
  const [perguntas, setPerguntas] = useState([])

  useEffect(() => {
    if (isEditMode && id) {
      loadAnamneseData()
    }
  }, [id, isEditMode])

  const loadAnamneseData = async () => {
    setLoadingData(true)
    try {
      const response = await api.get(`/anamneses/${id}`)
      // A API retorna os dados diretamente em response.data
      const anamnese = response.data || {}
      
      setFormData({
        titulo: anamnese.titulo || '',
        descricao: anamnese.descricao || '',
        ativa: anamnese.ativa !== undefined ? anamnese.ativa : true
      })
      
      // Garantir que perguntas seja um array
      const perguntasData = Array.isArray(anamnese.perguntas) ? anamnese.perguntas : []
      setPerguntas(perguntasData)
    } catch (error) {
      console.error('Erro ao carregar anamnese:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao carregar anamnese. Tente novamente.'
      showError(errorMessage)
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

  const handleAddPergunta = () => {
    const novaPergunta = {
      id: `temp-${Date.now()}`,
      texto: '',
      tipoResposta: 'texto',
      opcoes: [],
      obrigatoria: false,
      ordem: perguntas.length
    }
    setPerguntas([...perguntas, novaPergunta])
  }

  const handleRemovePergunta = (index) => {
    setPerguntas(perguntas.filter((_, i) => i !== index))
  }

  const handlePerguntaChange = (index, field, value) => {
    const updatedPerguntas = [...perguntas]
    updatedPerguntas[index] = {
      ...updatedPerguntas[index],
      [field]: value
    }
    
    // Se mudou o tipo para múltipla escolha, garantir que tenha opções
    if (field === 'tipoResposta' && value === 'multipla_escolha' && !updatedPerguntas[index].opcoes?.length) {
      updatedPerguntas[index].opcoes = ['']
    }
    
    // Se mudou para outro tipo que não seja múltipla escolha, limpar opções
    if (field === 'tipoResposta' && value !== 'multipla_escolha') {
      updatedPerguntas[index].opcoes = []
    }
    
    setPerguntas(updatedPerguntas)
  }

  const handleOpcaoChange = (perguntaIndex, opcaoIndex, value) => {
    const updatedPerguntas = [...perguntas]
    updatedPerguntas[perguntaIndex].opcoes[opcaoIndex] = value
    setPerguntas(updatedPerguntas)
  }

  const handleAddOpcao = (perguntaIndex) => {
    const updatedPerguntas = [...perguntas]
    updatedPerguntas[perguntaIndex].opcoes.push('')
    setPerguntas(updatedPerguntas)
  }

  const handleRemoveOpcao = (perguntaIndex, opcaoIndex) => {
    const updatedPerguntas = [...perguntas]
    updatedPerguntas[perguntaIndex].opcoes = updatedPerguntas[perguntaIndex].opcoes.filter((_, i) => i !== opcaoIndex)
    setPerguntas(updatedPerguntas)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validação básica
      if (!formData.titulo || !formData.titulo.trim()) {
        showWarning('Por favor, preencha o título da anamnese.')
        setLoading(false)
        return
      }

      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Erro: Dados do cliente master não encontrados.')
        setLoading(false)
        return
      }

      // Validar perguntas antes de enviar
      for (let i = 0; i < perguntas.length; i++) {
        const pergunta = perguntas[i]
        if (!pergunta.texto || !pergunta.texto.trim()) {
          showWarning(`A pergunta ${i + 1} está sem texto. Por favor, preencha ou remova-a.`)
          setLoading(false)
          return
        }
        
        if (pergunta.tipoResposta === 'multipla_escolha') {
          const opcoesValidas = pergunta.opcoes?.filter(op => op && op.trim()) || []
          if (opcoesValidas.length === 0) {
            showWarning(`A pergunta "${pergunta.texto}" é do tipo múltipla escolha mas não possui opções. Por favor, adicione pelo menos uma opção.`)
            setLoading(false)
            return
          }
        }
      }

      // Preparar perguntas para envio (remover IDs temporários e ordenar)
      const perguntasParaEnvio = perguntas
        .filter(pergunta => pergunta.texto && pergunta.texto.trim()) // Remover perguntas vazias primeiro
        .map((pergunta, index) => {
          const perguntaEnvio = {
            texto: pergunta.texto.trim(),
            tipoResposta: pergunta.tipoResposta,
            obrigatoria: pergunta.obrigatoria || false,
            ordem: index
          }
          
          // Adicionar opcoes apenas se for múltipla escolha e tiver opções válidas
          if (pergunta.tipoResposta === 'multipla_escolha' && pergunta.opcoes && pergunta.opcoes.length > 0) {
            const opcoesValidas = pergunta.opcoes.filter(op => op && op.trim()).map(op => op.trim())
            if (opcoesValidas.length > 0) {
              perguntaEnvio.opcoes = opcoesValidas
            }
          }
          
          return perguntaEnvio
        })

      const payload = {
        clienteMasterId,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao?.trim() || undefined,
        ativa: formData.ativa,
        perguntas: perguntasParaEnvio
      }

      let response
      if (isEditMode) {
        response = await api.put(`/anamneses/${id}`, payload)
      } else {
        response = await api.post('/anamneses', payload)
      }

      // A API retorna os dados diretamente em response.data
      const anamneseCriada = response.data
      
      showSuccess(isEditMode ? 'Anamnese atualizada com sucesso!' : 'Anamnese criada com sucesso!')
      setTimeout(() => {
        navigate('/app/anamneses')
      }, 1000)
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error)
      console.error('Detalhes do erro:', error.response?.data)
      
      let errorMessage = 'Erro ao salvar anamnese. Tente novamente.'
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showError(errorMessage)
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="anamnese-novo-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados da anamnese...</p>
      </div>
    )
  }

  return (
    <div className="anamnese-novo-page">
      <div className="anamnese-novo-header">
        <button className="btn-back" onClick={() => navigate('/app/anamneses')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <h1>{isEditMode ? 'Editar Anamnese' : 'Nova Anamnese'}</h1>
      </div>

      <form className="anamnese-novo-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>
            <FontAwesomeIcon icon={faClipboardQuestion} /> Informações da Anamnese
          </h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>
                Título da Anamnese *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                placeholder="Ex: Anamnese Geral, Anamnese Pré-Cirúrgica, etc."
              />
            </div>
            <div className="form-group full-width">
              <label>
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descreva o propósito desta anamnese..."
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
                <span>Anamnese ativa</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>
              <FontAwesomeIcon icon={faClipboardQuestion} /> Perguntas
            </h2>
            <button
              type="button"
              className="btn-add-pergunta"
              onClick={handleAddPergunta}
            >
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Pergunta
            </button>
          </div>

          {perguntas.length === 0 ? (
            <div className="empty-perguntas">
              <p>Nenhuma pergunta adicionada ainda.</p>
              <p className="hint">Clique em "Adicionar Pergunta" para começar.</p>
            </div>
          ) : (
            <div className="perguntas-list">
              {perguntas.map((pergunta, index) => (
                <div key={pergunta.id || index} className="pergunta-card">
                  <div className="pergunta-header">
                    <div className="pergunta-number">
                      <FontAwesomeIcon icon={faGripVertical} />
                      <span>Pergunta {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-pergunta"
                      onClick={() => handleRemovePergunta(index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>

                  <div className="pergunta-body">
                    <div className="form-group full-width">
                      <label>Texto da Pergunta *</label>
                      <input
                        type="text"
                        value={pergunta.texto}
                        onChange={(e) => handlePerguntaChange(index, 'texto', e.target.value)}
                        placeholder="Ex: Você possui alguma alergia?"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Tipo de Resposta *</label>
                      <select
                        value={pergunta.tipoResposta}
                        onChange={(e) => handlePerguntaChange(index, 'tipoResposta', e.target.value)}
                      >
                        {TIPOS_RESPOSTA.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={pergunta.obrigatoria || false}
                          onChange={(e) => handlePerguntaChange(index, 'obrigatoria', e.target.checked)}
                        />
                        <span>Pergunta obrigatória</span>
                      </label>
                    </div>

                    {pergunta.tipoResposta === 'multipla_escolha' && (
                      <div className="form-group full-width">
                        <label>Opções de Resposta *</label>
                        <div className="opcoes-list">
                          {pergunta.opcoes?.map((opcao, opcaoIndex) => (
                            <div key={opcaoIndex} className="opcao-item">
                              <input
                                type="text"
                                value={opcao}
                                onChange={(e) => handleOpcaoChange(index, opcaoIndex, e.target.value)}
                                placeholder={`Opção ${opcaoIndex + 1}`}
                              />
                              {pergunta.opcoes.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-opcao"
                                  onClick={() => handleRemoveOpcao(index, opcaoIndex)}
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn-add-opcao"
                            onClick={() => handleAddOpcao(index)}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Adicionar Opção
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/app/anamneses')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSave} />
            {loading ? 'Salvando...' : isEditMode ? 'Atualizar Anamnese' : 'Criar Anamnese'}
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

export default AnamneseNovo

