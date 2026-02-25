import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faClipboardQuestion, faPlus, faTimes,
  faTrash
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

const PerguntaCard = memo(function PerguntaCard ({
  pergunta,
  index,
  onPerguntaChange,
  onRemovePergunta,
  onOpcaoChange,
  onAddOpcao,
  onRemoveOpcao
}) {
  return (
    <article className="pergunta-card">
      <header className="pergunta-header">
        <span className="pergunta-badge" aria-hidden="true">{index + 1}</span>
        <span className="pergunta-header-label">Pergunta</span>
        <button
          type="button"
          className="btn-remove-pergunta"
          onClick={() => onRemovePergunta(index)}
          aria-label="Remover pergunta"
          title="Remover pergunta"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </header>

      <div className="pergunta-body">
        <div className="pergunta-row pergunta-row-texto">
          <label className="form-label">Texto da pergunta *</label>
          <input
            type="text"
            value={pergunta.texto}
            onChange={(e) => onPerguntaChange(index, 'texto', e.target.value)}
            placeholder="Ex: Você possui alguma alergia?"
            required
            className="pergunta-input-texto"
          />
        </div>

        <div className="pergunta-row pergunta-row-opcoes">
          <div className="form-group form-group-tipo">
            <label className="form-label">Tipo de resposta *</label>
            <select
              value={pergunta.tipoResposta}
              onChange={(e) => onPerguntaChange(index, 'tipoResposta', e.target.value)}
              aria-label="Tipo de resposta"
            >
              {TIPOS_RESPOSTA.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          <label className="checkbox-wrap">
            <input
              type="checkbox"
              checked={pergunta.obrigatoria || false}
              onChange={(e) => onPerguntaChange(index, 'obrigatoria', e.target.checked)}
              aria-label="Pergunta obrigatória"
            />
            <span>Obrigatória</span>
          </label>
        </div>

        {pergunta.tipoResposta === 'multipla_escolha' && (
          <div className="pergunta-row pergunta-row-multipla">
            <label className="form-label">Opções de resposta *</label>
            <div className="opcoes-list">
              {(pergunta.opcoes || []).map((opcao, opcaoIndex) => (
                <div key={opcaoIndex} className="opcao-item">
                  <span className="opcao-numero">{opcaoIndex + 1}.</span>
                  <input
                    type="text"
                    value={opcao}
                    onChange={(e) => onOpcaoChange(index, opcaoIndex, e.target.value)}
                    placeholder={`Opção ${opcaoIndex + 1}`}
                    aria-label={`Opção ${opcaoIndex + 1}`}
                  />
                  {(pergunta.opcoes?.length || 0) > 1 && (
                    <button
                      type="button"
                      className="btn-remove-opcao"
                      onClick={() => onRemoveOpcao(index, opcaoIndex)}
                      aria-label="Remover opção"
                      title="Remover opção"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-add-opcao"
                onClick={() => onAddOpcao(index)}
              >
                <FontAwesomeIcon icon={faPlus} />
                Adicionar opção
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
})

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
      // A API pode retornar { statusCode, message, data: {...} } ou diretamente os dados
      const anamnese = response.data?.data || response.data || {}
      
      console.log('Dados recebidos da API:', anamnese)
      
      setFormData({
        titulo: anamnese.titulo || '',
        descricao: anamnese.descricao || '',
        ativa: anamnese.ativa !== undefined ? anamnese.ativa : true
      })
      
      // Garantir que perguntas seja um array e processar opcoes
      let perguntasData = Array.isArray(anamnese.perguntas) ? anamnese.perguntas : []
      
      // Processar perguntas: garantir que opcoes seja array (não null) e ordenar por ordem
      perguntasData = perguntasData
        .map(pergunta => ({
          ...pergunta,
          opcoes: pergunta.opcoes === null ? [] : (Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [])
        }))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      
      console.log('Perguntas processadas:', perguntasData)
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

  const handleAddPergunta = useCallback(() => {
    setPerguntas(prev => {
      const novaPergunta = {
        id: `temp-${Date.now()}`,
        texto: '',
        tipoResposta: 'texto',
        opcoes: [],
        obrigatoria: false,
        ordem: prev.length
      }
      return [...prev, novaPergunta]
    })
  }, [])

  const handleRemovePergunta = useCallback((index) => {
    setPerguntas(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handlePerguntaChange = useCallback((index, field, value) => {
    setPerguntas(prev => {
      const next = prev.map((p, i) => i !== index ? p : { ...p, [field]: value })
      const item = next[index]
      if (field === 'tipoResposta' && value === 'multipla_escolha' && !item.opcoes?.length) {
        next[index] = { ...item, opcoes: [''] }
      } else if (field === 'tipoResposta' && value !== 'multipla_escolha') {
        next[index] = { ...item, opcoes: [] }
      }
      return next
    })
  }, [])

  const handleOpcaoChange = useCallback((perguntaIndex, opcaoIndex, value) => {
    setPerguntas(prev => {
      const next = [...prev]
      const opcoes = [...(next[perguntaIndex].opcoes || [])]
      opcoes[opcaoIndex] = value
      next[perguntaIndex] = { ...next[perguntaIndex], opcoes }
      return next
    })
  }, [])

  const handleAddOpcao = useCallback((perguntaIndex) => {
    setPerguntas(prev => {
      const next = [...prev]
      const opcoes = [...(next[perguntaIndex].opcoes || []), '']
      next[perguntaIndex] = { ...next[perguntaIndex], opcoes }
      return next
    })
  }, [])

  const handleRemoveOpcao = useCallback((perguntaIndex, opcaoIndex) => {
    setPerguntas(prev => {
      const next = [...prev]
      const opcoes = (next[perguntaIndex].opcoes || []).filter((_, i) => i !== opcaoIndex)
      next[perguntaIndex] = { ...next[perguntaIndex], opcoes }
      return next
    })
  }, [])

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

      // O backend espera o clienteMasterId apenas no header X-Cliente-Master-Id (interceptor em api.js),
      // então o body deve conter apenas os campos de criação/atualização da anamnese.
      const payload = {
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

      // A API pode retornar { statusCode, message, data: {...} } ou diretamente os dados
      const anamneseCriada = response.data?.data || response.data
      
      console.log('Anamnese salva:', anamneseCriada)
      
      // Se estiver editando, atualizar os dados locais com a resposta do servidor
      if (isEditMode && anamneseCriada) {
        setFormData({
          titulo: anamneseCriada.titulo || formData.titulo,
          descricao: anamneseCriada.descricao || formData.descricao,
          ativa: anamneseCriada.ativa !== undefined ? anamneseCriada.ativa : formData.ativa
        })
        
        // Atualizar perguntas com os dados retornados do servidor
        if (Array.isArray(anamneseCriada.perguntas)) {
          const perguntasAtualizadas = anamneseCriada.perguntas
            .map(pergunta => ({
              ...pergunta,
              opcoes: pergunta.opcoes === null ? [] : (Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [])
            }))
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
          setPerguntas(perguntasAtualizadas)
        }
      }
      
      showSuccess(isEditMode ? 'Anamnese atualizada com sucesso!' : 'Anamnese criada com sucesso!')
      setLoading(false)
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

        <div className="form-section form-section-perguntas">
          <h2 className="section-title-perguntas">
            <FontAwesomeIcon icon={faClipboardQuestion} /> Perguntas
          </h2>

          {perguntas.length === 0 ? (
            <div className="empty-perguntas">
              <p>Nenhuma pergunta adicionada ainda.</p>
              <p className="hint">Use o botão abaixo para adicionar a primeira pergunta.</p>
            </div>
          ) : (
            <div className="perguntas-list">
              {perguntas.map((pergunta, index) => (
                <PerguntaCard
                  key={pergunta.id}
                  pergunta={pergunta}
                  index={index}
                  onPerguntaChange={handlePerguntaChange}
                  onRemovePergunta={handleRemovePergunta}
                  onOpcaoChange={handleOpcaoChange}
                  onAddOpcao={handleAddOpcao}
                  onRemoveOpcao={handleRemoveOpcao}
                />
              ))}
            </div>
          )}

          <div className="perguntas-add-footer">
            <button
              type="button"
              className="btn-add-pergunta"
              onClick={handleAddPergunta}
            >
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Pergunta
            </button>
          </div>
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

