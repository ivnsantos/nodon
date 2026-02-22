import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarAlt, faClock, faSpinner, faCheckCircle, faTimes, faMapMarkerAlt, faPhone, faGlobe, faIdCard, faBirthdayCake, faClipboardCheck, faChevronLeft, faInfoCircle
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import './ConfirmarAgendamento.css'

const ConfirmarAgendamento = () => {
  const { consultaId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [consulta, setConsulta] = useState(null)
  const [clienteMaster, setClienteMaster] = useState(null)
  const [dataNascimento, setDataNascimento] = useState('')
  const [cpfInicio, setCpfInicio] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [jaConfirmada, setJaConfirmada] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1 = informações da empresa, 2 = campos de confirmação

  useEffect(() => {
    if (consultaId) {
      fetchDadosBasicos()
    }
  }, [consultaId])

  const fetchDadosBasicos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/calendario/consultas/publica/${consultaId}/dados-basicos`)
      
      // Verificar se é erro (statusCode diferente de 200)
      if (response.data.statusCode !== 200) {
        const errorMsg = response.data?.message || 'Erro ao buscar dados da consulta'
        setError(errorMsg)
        setLoading(false)
        return
      }
      
      // A resposta tem estrutura aninhada: data.data.data.consulta e data.data.data.cliente_master
      const innerData = response.data?.data?.data || response.data?.data || {}
      
      if (innerData.consulta) {
        setConsulta(innerData.consulta)
        // Se o status já for confirmada ou se ja_confirmada for true
        if (innerData.consulta.status === 'confirmada' || innerData.ja_confirmada) {
          setConfirmado(true)
          setJaConfirmada(true)
          setCurrentStep(2) // Ir direto para step 2 se já confirmado
        }
      }
      
      if (innerData.cliente_master) {
        setClienteMaster(innerData.cliente_master)
      }
      
      // Verificar se já foi confirmada
      if (innerData.ja_confirmada) {
        setJaConfirmada(true)
        setConfirmado(true)
      }
      
      if (!innerData.consulta) {
        setError('Consulta não encontrada')
      }
    } catch (error) {
      console.error('Erro ao buscar dados da consulta:', error)
      const errorMsg = 
        error.response?.data?.message || 
        error.response?.data?.data?.message ||
        error.message ||
        'Erro ao buscar dados da consulta'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
  }

  const formatTime = (timeString) => {
    if (!timeString) return ''
    return timeString.substring(0, 5) // HH:MM
  }

  // Formatar data de nascimento para DD/MM/YYYY
  const formatDataNascimento = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  // Formatar CPF (apenas primeiros dígitos)
  const formatCpfInicio = (value) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 11) // Limitar a 11 dígitos
  }

  const handleDataNascimentoChange = (e) => {
    const formatted = formatDataNascimento(e.target.value)
    setDataNascimento(formatted)
  }

  const handleCpfInicioChange = (e) => {
    const formatted = formatCpfInicio(e.target.value)
    setCpfInicio(formatted)
  }

  const handleConfirmar = async (e) => {
    e.preventDefault()
    
    // Validar campos
    if (!dataNascimento || dataNascimento.length !== 10) {
      setError('Por favor, informe a data de nascimento completa (DD/MM/AAAA)')
      return
    }

    if (!cpfInicio || cpfInicio.length < 3) {
      setError('Por favor, informe pelo menos os 3 primeiros dígitos do CPF')
      return
    }

    try {
      setConfirmando(true)
      setError(null)

      const response = await api.post('/calendario/consultas/publica/confirmar-por-dados', {
        consultaId: consultaId,
        dataAniversario: dataNascimento,
        cpfInicio: cpfInicio
      })

      if (response.data.statusCode === 200) {
        setConfirmado(true)
        setCurrentStep(2) // Avançar para step 2 após confirmação
        // Atualizar status da consulta
        if (response.data?.data?.consulta) {
          setConsulta(prev => ({
            ...prev,
            status: response.data.data.consulta.status
          }))
        }
      } else {
        setError(response.data?.message || 'Erro ao confirmar agendamento')
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error)
      const errorMsg = 
        error.response?.data?.message || 
        error.response?.data?.data?.message ||
        error.message ||
        'Erro ao confirmar agendamento. Verifique os dados informados.'
      setError(errorMsg)
    } finally {
      setConfirmando(false)
    }
  }

  if (loading) {
    return (
      <div className="confirmar-agendamento-container">
        <div className="confirmar-agendamento-loading">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Carregando dados da consulta...</p>
        </div>
      </div>
    )
  }

  // Determinar step visual (para o indicador)
  const visualStep = confirmado ? 2 : currentStep

  return (
    <div className="confirmar-agendamento-container">
      <div className="confirmar-agendamento-content">
        {/* Header de Confirmação */}
        <div className="confirmar-agendamento-header">
          <div className="confirmar-agendamento-header-icon">
            <FontAwesomeIcon icon={faClipboardCheck} />
          </div>
          <h1 className="confirmar-agendamento-title">Confirmar Agendamento</h1>
          <p className="confirmar-agendamento-subtitle-header">
            Confirme seus dados para validar seu agendamento
          </p>
        </div>

        {/* Mensagem de Erro Global (não bloqueia a página) */}
        {error && !consulta && (
          <div className="confirmar-agendamento-error-banner">
            <FontAwesomeIcon icon={faTimes} />
            <div>
              <strong>Erro ao carregar dados</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null)
                fetchDadosBasicos()
              }}
              className="confirmar-agendamento-btn-retry"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Se não houver consulta e não estiver carregando, mostrar mensagem amigável */}
        {!loading && !consulta && !error && (
          <div className="confirmar-agendamento-info-message">
            <FontAwesomeIcon icon={faInfoCircle} />
            <p>Não foi possível carregar os dados da consulta. Por favor, verifique o link ou tente novamente mais tarde.</p>
          </div>
        )}

        {/* Steps Indicator */}
        <div className="confirmar-agendamento-steps">
          <div className={`confirmar-agendamento-step ${visualStep >= 1 ? 'active' : ''} ${visualStep > 1 ? 'completed' : ''}`}>
            <div className="confirmar-agendamento-step-number">
              {visualStep > 1 ? <FontAwesomeIcon icon={faCheckCircle} /> : '1'}
            </div>
            <div className="confirmar-agendamento-step-label">Informações</div>
          </div>
          <div className="confirmar-agendamento-step-line"></div>
          <div className={`confirmar-agendamento-step ${visualStep >= 2 ? 'active' : ''} ${visualStep > 2 ? 'completed' : ''}`}>
            <div className="confirmar-agendamento-step-number">
              {visualStep > 2 ? <FontAwesomeIcon icon={faCheckCircle} /> : '2'}
            </div>
            <div className="confirmar-agendamento-step-label">{confirmado ? 'Concluído' : 'Confirmar'}</div>
          </div>
        </div>

        {/* Step 1: Informações da Empresa e Consulta */}
        {currentStep === 1 && (
          <>
            {/* Header com Logo */}
            {clienteMaster?.logo && (
              <div className="confirmar-agendamento-logo">
                <img src={clienteMaster.logo} alt={clienteMaster.nome_empresa || 'Logo'} />
              </div>
            )}

            {/* Informações da Clínica */}
            {clienteMaster && (
              <div className="confirmar-agendamento-clinica">
                <h2>{clienteMaster.nome_empresa || 'Clínica'}</h2>
                {clienteMaster.endereco && (
                  <div className="confirmar-agendamento-info-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>{clienteMaster.endereco}</span>
                  </div>
                )}
                {clienteMaster.telefone_empresa && (
                  <div className="confirmar-agendamento-info-item">
                    <FontAwesomeIcon icon={faPhone} />
                    <span>{clienteMaster.telefone_empresa}</span>
                  </div>
                )}
                {clienteMaster.site && (
                  <div className="confirmar-agendamento-info-item">
                    <FontAwesomeIcon icon={faGlobe} />
                    <a href={clienteMaster.site} target="_blank" rel="noopener noreferrer">
                      {clienteMaster.site}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Informações da Consulta */}
            {consulta && (
              <div className="confirmar-agendamento-consulta">
                <h3>Detalhes do Agendamento</h3>
                
                {/* Tipo de Consulta */}
                {consulta.tipo_consulta && (
                  <div className="confirmar-agendamento-badge" style={{ backgroundColor: consulta.tipo_consulta.cor || '#0ea5e9' }}>
                    {consulta.tipo_consulta.nome || 'Consulta'}
                  </div>
                )}

                {/* Título */}
                {consulta.titulo && (
                  <div className="confirmar-agendamento-item">
                    <h4>{consulta.titulo}</h4>
                  </div>
                )}

                {/* Data e Hora */}
                <div className="confirmar-agendamento-datetime">
                  <div className="confirmar-agendamento-datetime-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <div>
                      <span className="label">Data:</span>
                      <span className="value">{formatDate(consulta.data_consulta)}</span>
                    </div>
                  </div>
                  <div className="confirmar-agendamento-datetime-item">
                    <FontAwesomeIcon icon={faClock} />
                    <div>
                      <span className="label">Hora:</span>
                      <span className="value">{formatTime(consulta.hora_consulta)}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                {consulta.status && (
                  <div className="confirmar-agendamento-status">
                    <span className="status-label">Status:</span>
                    <span className={`status-badge status-${consulta.status}`}>
                      {consulta.status === 'agendada' && 'Agendada'}
                      {consulta.status === 'confirmada' && 'Confirmada'}
                      {consulta.status === 'concluida' && 'Concluída'}
                      {consulta.status === 'cancelada' && 'Cancelada'}
                      {consulta.status === 'link' && 'Link'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botão para ir ao Step 2 */}
            {consulta && (consulta.status === 'agendada' || consulta.status === 'link') && !confirmado && !jaConfirmada && (
              <div className="confirmar-agendamento-step1-action">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="confirmar-agendamento-btn-step1"
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Confirmar Agendamento
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Formulário de Confirmação ou Mensagem de Sucesso */}
        {currentStep === 2 && consulta && (
          <>
            {!confirmado && !jaConfirmada && (consulta.status === 'agendada' || consulta.status === 'link') && (
              <div className="confirmar-agendamento-form">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="confirmar-agendamento-btn-voltar"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Voltar
                </button>
                
                <div className="confirmar-agendamento-form-header">
                  <FontAwesomeIcon icon={faClipboardCheck} />
                  <h2>Confirme seus dados</h2>
                </div>
                <p className="confirmar-agendamento-subtitle">
                  Para confirmar seu agendamento, informe sua data de nascimento e os primeiros dígitos do seu CPF:
                </p>
            
                {error && (
                  <div className="confirmar-agendamento-error-message">
                    <FontAwesomeIcon icon={faTimes} />
                    <span>{error}</span>
                  </div>
                )}

            <form onSubmit={handleConfirmar}>
              <div className="confirmar-agendamento-form-group">
                <label>
                  <FontAwesomeIcon icon={faBirthdayCake} />
                  Data de Nascimento *
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={dataNascimento}
                  onChange={handleDataNascimentoChange}
                  maxLength={10}
                  required
                  disabled={confirmando}
                />
              </div>

              <div className="confirmar-agendamento-form-group">
                <label>
                  <FontAwesomeIcon icon={faIdCard} />
                  CPF ( 3 primeiros dígitos ) *
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={cpfInicio}
                  onChange={handleCpfInicioChange}
                  maxLength={11}
                  required
                  disabled={confirmando}
                />
                <small>Informe pelo menos os 3 primeiros dígitos do seu CPF</small>
              </div>

              <button 
                type="submit" 
                className="confirmar-agendamento-btn-confirmar"
                disabled={confirmando || !dataNascimento || !cpfInicio}
              >
                {confirmando ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </form>
          </div>
            )}

            {/* Mensagem de Sucesso ou Já Confirmada - aparece no Step 2 */}
            {confirmado && (
              <div className="confirmar-agendamento-success">
                <div className="confirmar-agendamento-success-icon">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <h2>{jaConfirmada ? 'Agendamento Já Confirmado' : 'Agendamento Confirmado!'}</h2>
                <p>
                  {jaConfirmada 
                    ? 'Este agendamento já foi confirmado anteriormente. Aguardamos você na data e hora agendadas.'
                    : 'Seu agendamento foi confirmado com sucesso. Aguardamos você na data e hora agendadas.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ConfirmarAgendamento

