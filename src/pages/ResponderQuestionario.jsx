import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSpinner, faArrowRight, faBuilding, faUser, faComment, 
  faCheckCircle, faArrowLeft, faChevronLeft, faChevronRight 
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import './ResponderQuestionario.css'

const ResponderQuestionario = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [concluida, setConcluida] = useState(false)

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
      const responseData = response.data?.data?.data || response.data?.data || response.data

      if (responseData.concluida === true) {
        setConcluida(true)
        setData(responseData)
        setLoading(false)
        return
      }

      if (!responseData.questionario?.ativa) {
        setError('Este questionário não está ativo no momento. Entre em contato com o consultório.')
        setLoading(false)
        return
      }

      setData(responseData)
    } catch (err) {
      console.error('Erro ao carregar questionário:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao carregar o questionário. Verifique se o link está correto.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleIniciar = () => {
    const base = location.pathname.startsWith('/questionarios/resposta') ? '/questionarios/resposta' : '/responder-questionario'
    navigate(`${base}/${id}/iniciar`)
  }

  const defaultCores = { '--cor-empresa': '#0ea5e9', '--cor-empresa-secundaria': '#06b6d4' }

  if (loading) {
    return (
      <div className="questionario-entrada-container" style={defaultCores}>
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p className="loading-text">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="questionario-entrada-container" style={defaultCores}>
        <div className="error-container">
          <FontAwesomeIcon icon={faComment} />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="questionario-entrada-container" style={defaultCores}>
        <div className="error-container">
          <FontAwesomeIcon icon={faComment} />
          <p>Questionário não encontrado.</p>
        </div>
      </div>
    )
  }

  const empresa = data.paciente?.masterClient || data.questionario?.clienteMaster || data.clienteMaster
  const paciente = data.paciente || null
  const questionario = data.questionario
  const corEmpresa = empresa?.cor || '#0ea5e9'
  const corSecundaria = empresa?.corSecundaria || '#06b6d4'
  const nomeEmpresa = empresa?.nomeEmpresa || 'Consultório'
  const coresStyle = { '--cor-empresa': corEmpresa, '--cor-empresa-secundaria': corSecundaria }

  return (
    <div className="questionario-entrada-container" style={coresStyle}>
      <div className="questionario-entrada-card">
        <div className="empresa-header questionario-empresa-header" style={{ background: corEmpresa }}>
          {empresa?.logo ? (
            <img src={empresa.logo} alt={nomeEmpresa} className="empresa-logo" />
          ) : (
            <div className="empresa-logo-placeholder">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
          )}
          <h1 className="questionario-empresa-nome" style={{ color: corSecundaria }}>{nomeEmpresa}</h1>
        </div>

        <div className="questionario-entrada-content">
          {concluida ? (
            <div className="concluida-container">
              <div className="concluida-icon-box" style={{ background: corEmpresa }}>
                <FontAwesomeIcon icon={faCheckCircle} className="check-icon" />
              </div>
              <h2 style={{ color: corSecundaria }}>Questionário Respondido</h2>
              <p style={{ color: corSecundaria }}>Você já respondeu este questionário. Obrigado pela sua participação!</p>
            </div>
          ) : (
            <>
              <div className="questionario-info">
                <div className="info-icon">
                  <FontAwesomeIcon icon={faComment} />
                </div>
                <h2 className="questionario-titulo" style={{ color: corSecundaria }}>{questionario?.titulo || 'Questionário'}</h2>
                {questionario?.descricao && (
                  <p className="questionario-descricao" style={{ color: corSecundaria }}>{questionario.descricao}</p>
                )}
              </div>

              {paciente ? (
                <div className="paciente-info">
                  <FontAwesomeIcon icon={faUser} />
                  <div>
                    <p className="paciente-label" style={{ color: corSecundaria }}>Paciente</p>
                    <p className="paciente-nome" style={{ color: corSecundaria }}>{paciente.nome}</p>
                  </div>
                </div>
              ) : (
                <div className="paciente-info">
                  <FontAwesomeIcon icon={faUser} />
                  <div>
                    <p className="paciente-label" style={{ color: corSecundaria }}>Questionário Público</p>
                    <p className="paciente-nome" style={{ color: corSecundaria }}>Resposta anônima</p>
                  </div>
                </div>
              )}

              <div className="questionario-stats">
                <div className="stat-item" style={{ color: corSecundaria }}>
                  <FontAwesomeIcon icon={faComment} />
                  <span>{questionario?.perguntas?.length || 0} pergunta(s)</span>
                </div>
              </div>

              <button className="btn-iniciar" style={{ background: corEmpresa }} onClick={handleIniciar}>
                Iniciar Questionário
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResponderQuestionario

