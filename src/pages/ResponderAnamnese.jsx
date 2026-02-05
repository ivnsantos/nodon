import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faSpinner, faArrowLeft, faArrowRight, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import './ResponderAnamnese.css'

const ResponderAnamnese = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [respostaAnamnese, setRespostaAnamnese] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState('next')

  // Criar instância do axios sem autenticação para rotas públicas
  const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  useEffect(() => {
    if (id) {
      loadAnamnese()
    }
  }, [id])

  const loadAnamnese = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await publicApi.get(`/anamneses/publica/${id}`)
      // A API retorna { statusCode, message, data: { ... } }
      const data = response.data?.data || response.data

      console.log('Dados recebidos da API:', data)
      console.log('Status ativa:', data.ativa)

      // Verificar se a anamnese está ativa
      if (data.ativa === false) {
        setError('Esta anamnese não está ativa no momento. Entre em contato com o consultório.')
        setLoading(false)
        return
      }

      // Verificar se já está concluída
      if (data.concluida) {
        setError('Este questionário já foi respondido.')
        setLoading(false)
        return
      }

      setRespostaAnamnese(data)

      // Inicializar respostas com valores existentes ou vazios
      const respostasIniciais = {}
      if (data.respostasPerguntas && data.respostasPerguntas.length > 0) {
        data.respostasPerguntas.forEach(rp => {
          respostasIniciais[rp.perguntaId] = rp.valor || ''
        })
      }
      // Inicializar perguntas sem resposta
      if (data.anamnese && data.anamnese.perguntas) {
        data.anamnese.perguntas.forEach(pergunta => {
          if (!respostasIniciais[pergunta.id]) {
            respostasIniciais[pergunta.id] = ''
          }
        })
      }
      setRespostas(respostasIniciais)
    } catch (err) {
      console.error('Erro ao carregar anamnese:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao carregar o questionário. Verifique se o link está correto.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRespostaChange = (perguntaId, valor) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: valor
    }))
    
    // Limpar erro quando começar a responder
    if (error) {
      setError('')
    }
    
    // Auto-avançar para próxima pergunta se for booleano ou múltipla escolha e tiver resposta válida
    const anamnese = respostaAnamnese?.anamnese
    if (anamnese && anamnese.perguntas && valor) {
      const perguntasOrdenadas = [...anamnese.perguntas].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      const currentPergunta = perguntasOrdenadas[currentStep]
      if (currentPergunta && currentPergunta.id === perguntaId) {
        const tipo = currentPergunta.tipoResposta
        // Auto-avançar apenas para booleano ou múltipla escolha, e se não for obrigatória ou já tiver resposta
        if ((tipo === 'booleano' || tipo === 'multipla_escolha') && 
            (!currentPergunta.obrigatoria || valor.trim() !== '') &&
            currentStep < perguntasOrdenadas.length - 1) {
          setTimeout(() => {
            setCurrentStep(prev => prev + 1)
            setDirection('next')
          }, 400)
        }
      }
    }
  }

  const handleNext = () => {
    const anamnese = respostaAnamnese?.anamnese
    if (anamnese && anamnese.perguntas) {
      const perguntasOrdenadas = [...anamnese.perguntas].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      const currentPergunta = perguntasOrdenadas[currentStep]
      
      // Validar se pergunta obrigatória foi respondida
      if (currentPergunta && currentPergunta.obrigatoria) {
        const resposta = respostas[currentPergunta.id]
        if (!resposta || resposta.trim() === '') {
          setError('Por favor, responda esta pergunta antes de continuar.')
          return
        }
      }
      
      setError('')
      if (currentStep < perguntasOrdenadas.length - 1) {
        setDirection('next')
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection('prev')
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleStepClick = (stepIndex) => {
    const anamnese = respostaAnamnese?.anamnese
    if (anamnese && anamnese.perguntas) {
      const perguntasOrdenadas = [...anamnese.perguntas].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      
      // Se tentar avançar para um step futuro, validar perguntas anteriores obrigatórias
      if (stepIndex > currentStep) {
        for (let i = currentStep; i < stepIndex; i++) {
          const pergunta = perguntasOrdenadas[i]
          if (pergunta && pergunta.obrigatoria) {
            const resposta = respostas[pergunta.id]
            if (!resposta || resposta.trim() === '') {
              setError(`Por favor, responda a pergunta ${i + 1} antes de continuar.`)
              return
            }
          }
        }
      }
      
      setError('')
      if (stepIndex < currentStep) {
        setDirection('prev')
      } else {
        setDirection('next')
      }
      setCurrentStep(stepIndex)
    }
  }

  const validateForm = () => {
    if (!respostaAnamnese || !respostaAnamnese.anamnese) return false

    const perguntasObrigatorias = respostaAnamnese.anamnese.perguntas.filter(p => p.obrigatoria)
    
    for (const pergunta of perguntasObrigatorias) {
      const resposta = respostas[pergunta.id]
      if (!resposta || resposta.trim() === '') {
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setError('Por favor, responda todas as perguntas obrigatórias.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const respostasArray = Object.keys(respostas).map(perguntaId => ({
        perguntaId,
        valor: respostas[perguntaId] || null
      }))

      await publicApi.put(`/anamneses/publica/responder`, {
        respostaAnamneseId: id,
        concluida: true,
        respostas: respostasArray
      })

      setSuccess(true)
    } catch (err) {
      console.error('Erro ao enviar respostas:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao enviar as respostas. Tente novamente.'
      
      // Mensagem específica se a anamnese não estiver ativa
      if (err.response?.status === 400) {
        setError('Esta anamnese não está ativa. Entre em contato com o consultório.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderPergunta = (pergunta) => {
    const respostaAtual = respostas[pergunta.id] || ''

    switch (pergunta.tipoResposta) {
      case 'texto':
        return (
          <textarea
            value={respostaAtual}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={4}
            required={pergunta.obrigatoria}
          />
        )

      case 'numero':
        return (
          <input
            type="number"
            value={respostaAtual}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            placeholder="Digite um número..."
            required={pergunta.obrigatoria}
          />
        )

      case 'booleano':
        return (
          <div className="boolean-options">
            <label className={`boolean-option ${respostaAtual === 'true' ? 'checked' : ''}`}>
              <input
                type="radio"
                name={`pergunta-${pergunta.id}`}
                value="true"
                checked={respostaAtual === 'true'}
                onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
                required={pergunta.obrigatoria}
              />
              <span>Sim</span>
            </label>
            <label className={`boolean-option ${respostaAtual === 'false' ? 'checked' : ''}`}>
              <input
                type="radio"
                name={`pergunta-${pergunta.id}`}
                value="false"
                checked={respostaAtual === 'false'}
                onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
                required={pergunta.obrigatoria}
              />
              <span>Não</span>
            </label>
          </div>
        )

      case 'multipla_escolha':
        const opcoes = pergunta.opcoes || []
        return (
          <div className="multiple-choice-options">
            {opcoes.map((opcao, index) => (
              <label key={index} className={`multiple-choice-option ${respostaAtual === opcao ? 'checked' : ''}`}>
                <input
                  type="radio"
                  name={`pergunta-${pergunta.id}`}
                  value={opcao}
                  checked={respostaAtual === opcao}
                  onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
                  required={pergunta.obrigatoria}
                />
                <span>{opcao}</span>
              </label>
            ))}
          </div>
        )

      case 'data':
        return (
          <input
            type="date"
            value={respostaAtual}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            required={pergunta.obrigatoria}
          />
        )

      default:
        return (
          <input
            type="text"
            value={respostaAtual}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            placeholder="Digite sua resposta..."
            required={pergunta.obrigatoria}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="responder-anamnese-container">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p>Carregando questionário...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="responder-anamnese-container">
        <div className="success-container">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2>Questionário Respondido com Sucesso!</h2>
          <p>Obrigado por responder o questionário. Suas respostas foram salvas.</p>
        </div>
      </div>
    )
  }

  if (!respostaAnamnese || !respostaAnamnese.anamnese) {
    return (
      <div className="responder-anamnese-container">
        <div className="error-container">
          <p>{error || 'Questionário não encontrado.'}</p>
        </div>
      </div>
    )
  }

  // Verificar se já está concluída (verificar primeiro)
  if (respostaAnamnese.concluida === true) {
    return (
      <div className="responder-anamnese-container">
        <div className="success-container">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2>Questionário Já Respondido</h2>
          <p>Este questionário já foi respondido anteriormente. Não é possível responder novamente.</p>
        </div>
      </div>
    )
  }

  // Verificar novamente se está ativa antes de renderizar o formulário
  if (!respostaAnamnese.ativa) {
    return (
      <div className="responder-anamnese-container">
        <div className="error-container">
          <p>Esta anamnese não está ativa no momento. Entre em contato com o consultório.</p>
        </div>
      </div>
    )
  }

  const anamnese = respostaAnamnese.anamnese
  const perguntasOrdenadas = [...(anamnese.perguntas || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  const currentPergunta = perguntasOrdenadas[currentStep]
  const totalSteps = perguntasOrdenadas.length
  const progress = ((currentStep + 1) / totalSteps) * 100
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="responder-anamnese-container">
      <div className="responder-anamnese-content">
        <div className="anamnese-header">
          <h1 className="anamnese-title">{anamnese.titulo}</h1>
          {anamnese.descricao && (
            <p className="anamnese-description">{anamnese.descricao}</p>
          )}
          <div className="step-counter">
            <span className="step-text">Pergunta {currentStep + 1} de {totalSteps}</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="steps-indicator">
          {perguntasOrdenadas.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => handleStepClick(index)}
              title={`Pergunta ${index + 1}`}
            >
              {index < currentStep && <FontAwesomeIcon icon={faCheckCircle} />}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="anamnese-form">
          <div className="perguntas-wrapper">
            <div 
              className="perguntas-slider"
              style={{
                transform: `translateX(-${currentStep * 100}%)`,
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {perguntasOrdenadas.map((pergunta, index) => (
                <div key={pergunta.id} className="pergunta-slide">
                  <div className="pergunta-item">
                    <label className="pergunta-label">
                      {index + 1}. {pergunta.texto}
                      {pergunta.obrigatoria && <span className="required-mark"> *</span>}
                    </label>
                    <div className="pergunta-input">
                      {renderPergunta(pergunta)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-nav btn-prev"
              onClick={handlePrevious}
              disabled={isFirstStep}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Anterior
            </button>
            
            {isLastStep ? (
              <button
                type="submit"
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Enviando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} /> Enviar Respostas
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn-nav btn-next"
                onClick={handleNext}
              >
                Próxima
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResponderAnamnese

