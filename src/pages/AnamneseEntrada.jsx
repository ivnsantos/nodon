import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faArrowRight, faBuilding, faUser, faClipboardQuestion, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import './AnamneseEntrada.css'

const AnamneseEntrada = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [concluida, setConcluida] = useState(false)

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
      const responseData = response.data?.data || response.data

      // Verificar se já está concluída (verificar primeiro)
      if (responseData.concluida === true) {
        setConcluida(true)
        setData(responseData) // Manter dados para mostrar informações
        setLoading(false)
        return
      }

      // Verificar se a anamnese está ativa
      if (responseData.ativa === false) {
        setError('Esta anamnese não está ativa no momento. Entre em contato com o consultório.')
        setLoading(false)
        return
      }

      setData(responseData)
    } catch (err) {
      console.error('Erro ao carregar anamnese:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao carregar o questionário. Verifique se o link está correto.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleIniciar = () => {
    navigate(`/responder-anamnese/${id}/iniciar`)
  }

  if (loading) {
    return (
      <div className="anamnese-entrada-container">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p>Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="anamnese-entrada-container">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="anamnese-entrada-container">
        <div className="error-container">
          <p>Questionário não encontrado.</p>
        </div>
      </div>
    )
  }

  const empresa = data.paciente?.masterClient || data.anamnese?.clienteMaster
  const paciente = data.paciente
  const anamnese = data.anamnese
  const corEmpresa = empresa?.cor || '#0ea5e9'

  // Se estiver concluída, mostrar mensagem de sucesso
  if (concluida) {
    return (
      <div className="anamnese-entrada-container">
        <div className="anamnese-entrada-content">
          {/* Header com logo/nome da empresa */}
          <div className="empresa-header" style={{ '--cor-empresa': corEmpresa }}>
            {empresa?.logo ? (
              <img src={empresa.logo} alt={empresa.nomeEmpresa} className="empresa-logo" />
            ) : (
              <div className="empresa-logo-placeholder">
                <FontAwesomeIcon icon={faBuilding} />
              </div>
            )}
            <h1 className="empresa-nome">{empresa?.nomeEmpresa || 'Consultório'}</h1>
          </div>

          {/* Mensagem de Concluída */}
          <div className="concluida-container">
            <div className="concluida-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h2 className="concluida-titulo">Questionário Já Respondido</h2>
            <p className="concluida-mensagem">
              Este questionário já foi respondido anteriormente. 
              Obrigado por sua participação!
            </p>
            {anamnese?.titulo && (
              <div className="concluida-info">
                <p><strong>Questionário:</strong> {anamnese.titulo}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="anamnese-entrada-container">
      <div className="anamnese-entrada-content">
        {/* Header com logo/nome da empresa */}
        <div className="empresa-header" style={{ '--cor-empresa': corEmpresa }}>
          {empresa?.logo ? (
            <img src={empresa.logo} alt={empresa.nomeEmpresa} className="empresa-logo" />
          ) : (
            <div className="empresa-logo-placeholder">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
          )}
          <h1 className="empresa-nome">{empresa?.nomeEmpresa || 'Consultório'}</h1>
        </div>

        {/* Informações do Questionário */}
        <div className="anamnese-info-card">
          <div className="card-icon">
            <FontAwesomeIcon icon={faClipboardQuestion} />
          </div>
          <div className="card-content">
            <h2 className="anamnese-titulo">{anamnese?.titulo || 'Questionário'}</h2>
            {anamnese?.descricao && (
              <p className="anamnese-descricao">{anamnese.descricao}</p>
            )}
            <div className="anamnese-stats">
              <span className="stat-item">
                <strong>{anamnese?.perguntas?.length || 0}</strong> perguntas
              </span>
              <span className="stat-item">
                <strong>{anamnese?.perguntas?.filter(p => p.obrigatoria).length || 0}</strong> obrigatórias
              </span>
            </div>
          </div>
        </div>

        {/* Informações do Paciente */}
        {paciente && (
          <div className="paciente-info-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="card-content">
              <h3 className="paciente-nome">{paciente.nome}</h3>
              <div className="paciente-detalhes">
                {paciente.email && (
                  <div className="detalhe-item">
                    <span className="detalhe-label">Email:</span>
                    <span className="detalhe-value">{paciente.email}</span>
                  </div>
                )}
                {paciente.telefone && (
                  <div className="detalhe-item">
                    <span className="detalhe-label">Telefone:</span>
                    <span className="detalhe-value">{paciente.telefone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instruções Simplificadas */}
        <div className="instrucoes-simples">
          <p>Responda todas as perguntas obrigatórias <span className="required-mark">*</span> e navegue usando os botões</p>
        </div>

        {/* Botão para iniciar */}
        <button
          onClick={handleIniciar}
          className="btn-iniciar"
          style={{ '--cor-empresa': corEmpresa }}
        >
          Iniciar Questionário
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  )
}

export default AnamneseEntrada

