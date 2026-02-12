import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCheckCircle, faSpinner, faArrowLeft, faArrowRight, 
  faChevronLeft, faChevronRight, faComment 
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import './ResponderQuestionario.css'

const ResponderQuestionarioForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [respostaQuestionario, setRespostaQuestionario] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState('next')

  const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  useEffect(() => {
    if (id) {
      loadQuestionario()
    }
  }, [id])

  const loadQuestionario = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await publicApi.get(`/questionarios/resposta/${id}`)
      const data = response.data?.data || response.data

      if (data.concluida === true) {
        setError('Este questionário já foi respondido.')
        setLoading(false)
        return
      }

      if (!data.questionario?.ativa) {
        setError('Este questionário não está ativo no momento. Entre em contato com o consultório.')
        setLoading(false)
        return
      }

      setRespostaQuestionario(data)

      const respostasIniciais = {}
      if (data.respostasPerguntas && data.respostasPerguntas.length > 0) {
        data.respostasPerguntas.forEach(rp => {
          respostasIniciais[rp.perguntaId] = rp.valor || ''
        })
      }
      if (data.questionario?.perguntas) {
        data.questionario.perguntas.forEach(pergunta => {
          if (!respostasIniciais[pergunta.id]) {
            respostasIniciais[pergunta.id] = ''
          }
        })
      }
      setRespostas(respostasIniciais)
    } catch (err) {
      console.error('Erro ao carregar questionário:', err)
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
  }

  const perguntas = respostaQuestionario?.questionario?.perguntas || []
  const totalPerguntas = perguntas.length

  const nextStep = () => {
    if (currentStep < totalPerguntas - 1) {
      setDirection('next')
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection('prev')
      setCurrentStep(currentStep - 1)
    }
  }

  const validateForm = () => {
    for (const pergunta of perguntas) {
      if (pergunta.obrigatoria) {
        const resposta = respostas[pergunta.id]
        if (!resposta || resposta.toString().trim() === '') {
          return false
        }
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

      const respostasArray = Object.keys(respostas)
        .filter(perguntaId => respostas[perguntaId] !== '' && respostas[perguntaId] !== null)
        .map(perguntaId => ({
          perguntaId,
          valor: respostas[perguntaId]?.toString() || ''
        }))

      await publicApi.post('/questionarios/responder', {
        respostaQuestionarioId: id,
        respostas: respostasArray
      })

      setSuccess(true)
    } catch (err) {
      console.error('Erro ao enviar respostas:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao enviar as respostas. Tente novamente.'
      
      if (err.response?.status === 400) {
        setError('Este questionário não está ativo. Entre em contato com o consultório.')
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
            rows="5"
            required={pergunta.obrigatoria}
            className="resposta-input resposta-textarea"
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
            className="resposta-input"
          />
        )

      case 'booleano':
        return (
          <div className="resposta-booleano">
            <label className={`opcao-booleano ${respostaAtual === 'true' ? 'selected' : ''}`}>
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
            <label className={`opcao-booleano ${respostaAtual === 'false' ? 'selected' : ''}`}>
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
        return (
          <div className="resposta-multipla-escolha">
            {pergunta.opcoes && pergunta.opcoes.length > 0 ? (
              pergunta.opcoes.map((opcao, index) => (
                <label
                  key={index}
                  className={`opcao-multipla ${respostaAtual === opcao ? 'selected' : ''}`}
                >
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
              ))
            ) : (
              <p className="erro-opcoes">Nenhuma opção disponível</p>
            )}
          </div>
        )

      case 'data':
        return (
          <input
            type="date"
            value={respostaAtual}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            required={pergunta.obrigatoria}
            className="resposta-input"
          />
        )

      case 'escala':
        return (
          <div className="resposta-escala">
            {pergunta.opcoes && pergunta.opcoes.length > 0 ? (
              pergunta.opcoes.map((opcao, index) => (
                <label
                  key={index}
                  className={`opcao-escala ${respostaAtual === opcao ? 'selected' : ''}`}
                >
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
              ))
            ) : (
              <p className="erro-opcoes">Nenhuma opção disponível</p>
            )}
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={respostaAtual}
            onChange={(e) => handleRespostaChange(pergunta.id, e.target.value)}
            placeholder="Digite sua resposta..."
            required={pergunta.obrigatoria}
            className="resposta-input"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="questionario-form-container">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p>Carregando questionário...</p>
        </div>
      </div>
    )
  }

  if (error && !respostaQuestionario) {
    return (
      <div className="questionario-form-container">
        <div className="error-container">
          <FontAwesomeIcon icon={faComment} />
          <p>{error}</p>
          <button className="btn-voltar" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="questionario-form-container">
        <div className="success-container">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2>Questionário Enviado!</h2>
          <p>Obrigado por responder o questionário. Suas respostas foram registradas com sucesso.</p>
        </div>
      </div>
    )
  }

  if (!respostaQuestionario || perguntas.length === 0) {
    return (
      <div className="questionario-form-container">
        <div className="error-container">
          <FontAwesomeIcon icon={faComment} />
          <p>Questionário não encontrado ou sem perguntas.</p>
          <button className="btn-voltar" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const perguntaAtual = perguntas[currentStep]
  const progresso = ((currentStep + 1) / totalPerguntas) * 100

  return (
    <div className="questionario-form-container">
      <div className="questionario-form-card">
        <div className="questionario-form-header">
          <button className="btn-voltar-header" onClick={() => navigate(`/responder-questionario/${id}`)}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="header-info">
            <h2>{respostaQuestionario.questionario?.titulo || 'Questionário'}</h2>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progresso}%` }}></div>
            </div>
            <p className="progress-text">
              Pergunta {currentStep + 1} de {totalPerguntas}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="questionario-form">
          <div className={`pergunta-container ${direction}`}>
            <div className="pergunta-header">
              <div className="pergunta-header-left">
                <span className="pergunta-label">PERGUNTA</span>
                <span className="pergunta-number">{currentStep + 1}</span>
              </div>
              {perguntaAtual.obrigatoria && (
                <span className="pergunta-obrigatoria">* Obrigatória</span>
              )}
            </div>
            <h3 className="pergunta-texto">{perguntaAtual.texto}</h3>
            <div className="pergunta-resposta">
              {renderPergunta(perguntaAtual)}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-navigation">
            <button
              type="button"
              className="btn-nav btn-prev"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Anterior
            </button>

            {currentStep === totalPerguntas - 1 ? (
              <button
                type="submit"
                className="btn-nav btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Respostas
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn-nav btn-next"
                onClick={nextStep}
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

export default ResponderQuestionarioForm

