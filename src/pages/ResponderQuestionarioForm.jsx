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
      // API pode retornar data, data.data ou data.data.data (duplo aninhamento)
      const data = response.data?.data?.data || response.data?.data || response.data

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

  const empresa = respostaQuestionario?.questionario?.clienteMaster || respostaQuestionario?.paciente?.masterClient || null
  const corEmpresa = empresa?.cor || '#0ea5e9'
  const corSecundaria = empresa?.corSecundaria || '#06b6d4'
  const coresStyle = { '--cor-empresa': corEmpresa, '--cor-empresa-secundaria': corSecundaria }

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
      <div className="questionario-form-container" style={coresStyle}>
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p className="loading-text">Carregando questionário...</p>
        </div>
      </div>
    )
  }

  if (error && !respostaQuestionario) {
    return (
      <div className="questionario-form-container" style={coresStyle}>
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
      <div className="questionario-form-container" style={coresStyle}>
        <div className="success-container">
          <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
          <h2 style={{ color: corSecundaria }}>Questionário Enviado!</h2>
          <p style={{ color: corSecundaria }}>Obrigado por responder o questionário. Suas respostas foram registradas com sucesso.</p>
        </div>
      </div>
    )
  }

  if (!respostaQuestionario || perguntas.length === 0) {
    return (
      <div className="questionario-form-container" style={coresStyle}>
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

  const progressBarStyle = { background: `rgba(0,0,0,0.1)`, border: `1px solid ${corSecundaria}40` }
  const progressFillStyle = { width: `${progresso}%`, background: corSecundaria }
  const labelStyle = { color: corSecundaria }
  const btnPrevStyle = { color: corSecundaria, borderColor: `${corEmpresa}60`, background: `${corEmpresa}15` }
  const btnSubmitStyle = { background: corEmpresa, color: '#fff' }

  return (
    <div className="questionario-form-container" style={coresStyle}>
      <div className="questionario-form-card">
        <div className="questionario-form-header">
          <button className="btn-voltar-header" onClick={() => navigate(`/responder-questionario/${id}`)}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="header-info">
            <h2 style={labelStyle}>{respostaQuestionario.questionario?.titulo || 'Questionário'}</h2>
            <div className="progress-bar" style={progressBarStyle}>
              <div className="progress-fill" style={progressFillStyle}></div>
            </div>
            <p className="progress-text" style={labelStyle}>
              Pergunta {currentStep + 1} de {totalPerguntas}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="questionario-form">
          <div className={`pergunta-container ${direction}`}>
            <div className="pergunta-header">
              <div className="pergunta-header-left">
                <span className="pergunta-label" style={labelStyle}>PERGUNTA</span>
                <span className="pergunta-number" style={labelStyle}>{currentStep + 1}</span>
              </div>
              {perguntaAtual.obrigatoria && (
                <span className="pergunta-obrigatoria">* Obrigatória</span>
              )}
            </div>
            <h3 className="pergunta-texto" style={labelStyle}>{perguntaAtual.texto}</h3>
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
              style={btnPrevStyle}
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
                style={btnSubmitStyle}
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
                style={btnSubmitStyle}
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

