import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faUsers, faCheckCircle, faClock,
  faChartBar, faUser, faEnvelope, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './FeedbackRespostas.css'

const FeedbackRespostas = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { alertConfig, showError, hideAlert } = useAlert()
  
  const [questionario, setQuestionario] = useState(null)
  const [respostas, setRespostas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar questionário
      const questionarioResponse = await api.get(`/questionarios/${id}`)
      const questionarioData = questionarioResponse.data?.data || questionarioResponse.data
      setQuestionario(questionarioData)
      
      // Carregar respostas
      const respostasResponse = await api.get(`/questionarios/${id}/respostas`)
      const respostasData = respostasResponse.data?.data || respostasResponse.data || []
      setRespostas(Array.isArray(respostasData) ? respostasData : [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showError('Erro ao carregar respostas do questionário')
    } finally {
      setLoading(false)
    }
  }

  const formatarResposta = (valor, tipoResposta) => {
    if (!valor) return '-'
    
    switch (tipoResposta) {
      case 'booleano':
        return valor === 'true' || valor === true ? 'Sim' : 'Não'
      case 'data':
        return new Date(valor).toLocaleDateString('pt-BR')
      case 'multipla_escolha':
      case 'escala':
      case 'texto':
      case 'numero':
      default:
        return valor.toString()
    }
  }

  // Calcular estatísticas para cada pergunta
  const calcularEstatisticas = (pergunta) => {
    const respostasConcluidas = respostas.filter(r => r.concluida && r.respostasPerguntas)
    const respostasPergunta = respostasConcluidas
      .flatMap(r => r.respostasPerguntas.filter(rp => rp.perguntaId === pergunta.id))
      .map(rp => rp.valor)

    if (respostasPergunta.length === 0) {
      return { total: 0, distribuicao: {}, media: null }
    }

    let distribuicao = {}
    let soma = 0
    let countNumerico = 0

    respostasPergunta.forEach(valor => {
      // Contar distribuição
      const key = valor?.toString() || 'Sem resposta'
      distribuicao[key] = (distribuicao[key] || 0) + 1

      // Calcular média para números
      if (pergunta.tipoResposta === 'numero' || pergunta.tipoResposta === 'escala') {
        const num = parseFloat(valor)
        if (!isNaN(num)) {
          soma += num
          countNumerico++
        }
      }
    })

    const media = countNumerico > 0 ? (soma / countNumerico).toFixed(2) : null

    return {
      total: respostasPergunta.length,
      distribuicao,
      media
    }
  }

  // Renderizar gráfico baseado no tipo de pergunta
  const renderGrafico = (pergunta, estatisticas) => {
    if (estatisticas.total === 0) {
      return (
        <div className="grafico-empty">
          <p>Nenhuma resposta ainda</p>
        </div>
      )
    }

    switch (pergunta.tipoResposta) {
      case 'multipla_escolha':
      case 'escala':
      case 'booleano':
        return renderGraficoBarras(estatisticas.distribuicao, pergunta.opcoes)
      
      case 'numero':
        return renderGraficoNumero(estatisticas)
      
      case 'texto':
      case 'data':
        return renderGraficoTexto(estatisticas)
      
      default:
        return renderGraficoBarras(estatisticas.distribuicao)
    }
  }

  const renderGraficoBarras = (distribuicao, opcoes = null) => {
    const valores = Object.values(distribuicao)
    if (valores.length === 0) {
      return (
        <div className="grafico-empty">
          <p>Nenhuma resposta ainda</p>
        </div>
      )
    }
    
    const maxValue = Math.max(...valores)
    const total = valores.reduce((a, b) => a + b, 0)
    
    // Ordenar por opções se disponível
    const items = opcoes 
      ? opcoes.map(op => ({ label: op, value: distribuicao[op] || 0 }))
      : Object.entries(distribuicao).map(([label, value]) => ({ label, value }))

    return (
      <div className="grafico-barras">
        {items.map((item, index) => {
          const porcentagem = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          const porcentagemTotal = total > 0 ? (item.value / total) * 100 : 0
          
          return (
            <div key={index} className="barra-item">
              <div className="barra-label">
                <span className="barra-label-text">{item.label}</span>
                <span className="barra-valor">{item.value} ({porcentagemTotal.toFixed(1)}%)</span>
              </div>
              <div className="barra-container">
                <div 
                  className="barra-fill" 
                  style={{ width: `${porcentagem}%` }}
                >
                  {porcentagem > 15 && `${item.value}`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderGraficoNumero = (estatisticas) => {
    return (
      <div className="grafico-numero">
        <div className="stat-card">
          <div className="stat-value">{estatisticas.media}</div>
          <div className="stat-label">Média</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{estatisticas.total}</div>
          <div className="stat-label">Total de Respostas</div>
        </div>
      </div>
    )
  }

  const renderGraficoTexto = (estatisticas) => {
    return (
      <div className="grafico-texto">
        <div className="stat-card">
          <div className="stat-value">{estatisticas.total}</div>
          <div className="stat-label">Total de Respostas</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="feedback-respostas-page">
        <div className="loading-container">
          <FontAwesomeIcon icon={faChartBar} spin size="3x" />
          <p>Carregando respostas...</p>
        </div>
      </div>
    )
  }

  if (!questionario) {
    return (
      <div className="feedback-respostas-page">
        <div className="error-container">
          <p>Questionário não encontrado</p>
          <button onClick={() => navigate('/app/feedback')} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} />
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const respostasConcluidas = respostas.filter(r => r.concluida)
  const respostasPendentes = respostas.filter(r => !r.concluida)

  return (
    <div className="feedback-respostas-page">
      <div className="feedback-respostas-header">
        <button onClick={() => navigate('/app/feedback')} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <div className="header-content">
          <h1>
            <FontAwesomeIcon icon={faChartBar} />
            Respostas: {questionario.titulo}
          </h1>
          <div className="header-stats">
            <div className="stat-badge">
              <FontAwesomeIcon icon={faCheckCircle} />
              {respostasConcluidas.length} Concluídas
            </div>
            <div className="stat-badge">
              <FontAwesomeIcon icon={faClock} />
              {respostasPendentes.length} Pendentes
            </div>
            <div className="stat-badge">
              <FontAwesomeIcon icon={faUsers} />
              {respostas.length} Total
            </div>
          </div>
        </div>
      </div>

      <div className="feedback-respostas-content">
        {/* Gráficos por Pergunta */}
        <section className="graficos-section">
          <h2>
            <FontAwesomeIcon icon={faChartBar} />
            Análise Geral por Pergunta
          </h2>
          {questionario.perguntas && questionario.perguntas.length > 0 ? (
            <div className="graficos-grid">
              {questionario.perguntas.map((pergunta, index) => {
                const estatisticas = calcularEstatisticas(pergunta)
                return (
                  <div key={pergunta.id || index} className="grafico-card">
                    <div className="grafico-header">
                      <h3>
                        Pergunta {index + 1}: {pergunta.texto}
                      </h3>
                      <span className="grafico-tipo">{pergunta.tipoResposta}</span>
                    </div>
                    <div className="grafico-content">
                      {renderGrafico(pergunta, estatisticas)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma pergunta encontrada</p>
            </div>
          )}
        </section>

        {/* Respostas Individuais */}
        <section className="respostas-section">
          <h2>Respostas Individuais</h2>
          {respostas.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faUsers} size="3x" />
              <p>Nenhuma resposta recebida ainda</p>
            </div>
          ) : (
            <div className="respostas-list">
              {respostas.map((resposta) => (
                <div key={resposta.id} className="resposta-item">
                  <div className="resposta-header">
                    <div className="resposta-paciente">
                      <FontAwesomeIcon icon={faUser} />
                      <div>
                        <strong>
                          {resposta.paciente?.nome || 'Resposta Anônima'}
                        </strong>
                        {resposta.paciente?.email && (
                          <span className="resposta-email">
                            <FontAwesomeIcon icon={faEnvelope} />
                            {resposta.paciente.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="resposta-status">
                      {resposta.concluida ? (
                        <span className="status-concluida">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          Concluída
                        </span>
                      ) : (
                        <span className="status-pendente">
                          <FontAwesomeIcon icon={faClock} />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {resposta.concluida && resposta.respostasPerguntas && resposta.respostasPerguntas.length > 0 && (
                    <div className="resposta-content">
                      {resposta.respostasPerguntas.map((respostaPergunta) => {
                        const pergunta = questionario.perguntas?.find(p => p.id === respostaPergunta.perguntaId)
                        return (
                          <div key={respostaPergunta.id} className="resposta-pergunta">
                            <div className="pergunta-texto">
                              {pergunta?.texto || 'Pergunta'}
                            </div>
                            <div className="resposta-valor">
                              {formatarResposta(respostaPergunta.valor, pergunta?.tipoResposta)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="resposta-footer">
                    <span>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Enviada em: {new Date(resposta.createdAt).toLocaleString('pt-BR')}
                    </span>
                    {resposta.updatedAt && resposta.updatedAt !== resposta.createdAt && (
                      <span>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Respondida em: {new Date(resposta.updatedAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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

export default FeedbackRespostas

