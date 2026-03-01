import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarAlt, faClock, faSpinner, faCheckCircle, faTimes, faInfoCircle
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import './ConfirmarAgendamento.css'

const ConfirmarAgendamento = () => {
  const { consultaId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [consulta, setConsulta] = useState(null)
  const [clienteMaster, setClienteMaster] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [jaConfirmada, setJaConfirmada] = useState(false)

  // Cores somente da API (cor = principal, corSecundaria = textos/destaques). Sem fallback para não usar outra cor.
  const corEmpresa = clienteMaster?.cor ?? clienteMaster?.cor_empresa ?? null
  const corSecundaria = clienteMaster?.corSecundaria ?? clienteMaster?.cor_secundaria ?? null
  const corPrincipal = corEmpresa || '#0f172a'
  const corTexto = corSecundaria || '#e2e8f0'
  const coresStyle = {
    '--cor-empresa': corPrincipal,
    '--cor-empresa-secundaria': corTexto
  }
  const nomeEmpresa = clienteMaster?.nomeEmpresa || clienteMaster?.nome_empresa || 'Clínica'

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
      if (response.data.statusCode !== 200) {
        setError(response.data?.message || 'Erro ao buscar dados da consulta')
        setLoading(false)
        return
      }
      const innerData = response.data?.data?.data || response.data?.data || {}
      const consultaData = innerData.consulta
      if (consultaData) {
        setConsulta(consultaData)
        if (consultaData.status === 'confirmada' || innerData.ja_confirmada) {
          setConfirmado(true)
          setJaConfirmada(true)
        }
        // Cores vêm da API: pegar cliente_master da resposta ou aninhado em consulta
        const master = innerData.cliente_master || innerData.clienteMaster || consultaData.cliente_master || consultaData.clienteMaster
        if (master) setClienteMaster(master)
      }
      if (innerData.cliente_master && !consultaData) setClienteMaster(innerData.cliente_master)
      if (innerData.clienteMaster && !consultaData) setClienteMaster(innerData.clienteMaster)
      if (innerData.ja_confirmada) {
        setJaConfirmada(true)
        setConfirmado(true)
      }
      if (!innerData.consulta) setError('Consulta não encontrada')
    } catch (err) {
      console.error('Erro ao buscar dados da consulta:', err)
      setError(
        err.response?.data?.message ||
        err.response?.data?.data?.message ||
        err.message ||
        'Erro ao buscar dados da consulta'
      )
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
    return timeString.substring(0, 5)
  }

  const handleConfirmar = async (e) => {
    if (e) e.preventDefault()
    if (!consultaId) return
    try {
      setConfirmando(true)
      setError(null)
      const response = await api.post('/calendario/consultas/publica/confirmar-por-dados', {
        consultaId,
        confirmar: true
      })
      if (response.data?.statusCode === 200) {
        setConfirmado(true)
        const updated = response.data?.data?.consulta || response.data?.data
        if (updated?.status) {
          setConsulta(prev => (prev ? { ...prev, status: updated.status } : null))
        }
      } else {
        setError(response.data?.message || 'Erro ao confirmar agendamento')
      }
    } catch (err) {
      console.error('Erro ao confirmar agendamento:', err)
      setError(
        err.response?.data?.message ||
        err.response?.data?.data?.message ||
        err.message ||
        'Erro ao confirmar agendamento. Tente novamente.'
      )
    } finally {
      setConfirmando(false)
    }
  }

  const Header = () => (
    <header className="nodon-header">
      <div className="nodon-header-content">
        {clienteMaster?.logo ? (
          <img src={clienteMaster.logo} alt={nomeEmpresa} className="nodon-icon confirmar-header-logo" style={{ border: `2px solid ${corTexto}` }} />
        ) : (
          <img src={nodoLogo} alt="Logo" className="nodon-icon confirmar-header-logo" style={{ border: `2px solid ${corTexto}` }} />
        )}
        <h1 className="nodon-logo">
          {nomeEmpresa}
        </h1>
      </div>
    </header>
  )

  const Footer = () => (
    <footer className="nodon-footer">
      <div className="nodon-footer-content">
        <p style={{ color: corTexto }}>&copy; {new Date().getFullYear()} {nomeEmpresa}. Todos os direitos reservados.</p>
      </div>
    </footer>
  )

  if (loading) {
    return (
      <div className="confirmar-agendamento-page" style={coresStyle}>
        <Header />
        <div className="loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Carregando...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error && !consulta) {
    return (
      <div className="confirmar-agendamento-page" style={coresStyle}>
        <Header />
        <div className="error">
          <div className="error-icon">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          <h2>Erro</h2>
          <p>{error}</p>
          <button type="button" onClick={() => { setError(null); fetchDadosBasicos() }} className="btn-main" style={{ marginTop: '1rem', maxWidth: 280, background: corPrincipal, color: corTexto }}>
            Tentar novamente
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  if (!consulta) {
    return (
      <div className="confirmar-agendamento-page" style={coresStyle}>
        <Header />
        <div className="error">
          <div className="error-icon">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          <h2>Consulta não encontrada</h2>
          <p>O link pode estar incorreto ou a consulta não está mais disponível.</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (confirmado) {
    return (
      <div className="confirmar-agendamento-page" style={coresStyle}>
        <Header />
        <div className="success-box">
          <div className="success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <h2>{jaConfirmada ? 'Já confirmado' : 'Confirmado!'}</h2>
          <p>
            {jaConfirmada
              ? 'Esta consulta já estava confirmada. Aguardamos você na data e hora agendadas.'
              : 'Sua consulta foi confirmada. Aguardamos você na data e hora agendadas.'
            }
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="confirmar-agendamento-page" style={coresStyle}>
      <Header />
      <div className="container confirmar-container">
        <div className="header confirmar-header">
          <h1 style={{ color: corTexto }}>Confirmar Consulta</h1>
          <p className="clinic-name" style={{ color: corTexto }}>{nomeEmpresa}</p>
        </div>

        <div className="info-box confirmar-info-box">
          <div className="confirmar-info-grid">
            <div className="info-row full">
              <span className="info-label">Endereço</span>
              <span className="info-value">{clienteMaster?.endereco || 'a definir'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Telefone</span>
              <span className="info-value">{clienteMaster?.telefone_empresa || 'a definir'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tipo</span>
              <span className="info-value">{consulta.tipo_consulta?.nome || 'a definir'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Data</span>
              <span className="info-value">{formatDate(consulta.data_consulta) || 'a definir'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Horário</span>
              <span className="info-value">{formatTime(consulta.hora_consulta) || 'a definir'}</span>
            </div>
            <div className="info-row full">
              <span className="info-label">Título</span>
              <span className="info-value">{consulta.titulo || 'a definir'}</span>
            </div>
          </div>
        </div>

        <div className="action-box confirmar-action-box">
          {error && (
            <div className="info-banner" style={{ background: `${corPrincipal}25`, borderColor: `${corPrincipal}60`, color: corTexto }}>
              <FontAwesomeIcon icon={faTimes} style={{ color: corPrincipal }} />
              <span>{error}</span>
            </div>
          )}
          <div className="info-banner" style={{ background: `${corPrincipal}25`, borderColor: `${corPrincipal}50`, color: corTexto }}>
            <FontAwesomeIcon icon={faInfoCircle} style={{ color: corPrincipal }} />
            <span>Confira os dados acima e confirme sua consulta</span>
          </div>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={confirmando}
            className="btn-main"
            style={{ background: corPrincipal, color: corTexto }}
          >
            {confirmando ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Confirmando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheckCircle} />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ConfirmarAgendamento