import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimeline, faPlus, faEdit, faTrash, faSave, faTimes,
  faSpinner, faCalendarAlt, faUser, faFileAlt, faTags,
  faStethoscope, faProcedures, faClipboardList, faNotesMedical,
  faArrowRotateRight, faImage, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import './TimelinePaciente.css'

const TIPOS_EVOLUCAO = [
  { value: 'observacao', label: 'Observação', icon: faFileAlt, color: '#3b82f6' },
  { value: 'procedimento', label: 'Procedimento', icon: faProcedures, color: '#10b981' },
  { value: 'diagnostico', label: 'Diagnóstico', icon: faStethoscope, color: '#f59e0b' },
  { value: 'anamnese', label: 'Anamnese', icon: faClipboardList, color: '#8b5cf6' },
  { value: 'retorno', label: 'Retorno', icon: faArrowRotateRight, color: '#06b6d4' },
  { value: 'exame', label: 'Exame', icon: faImage, color: '#ec4899' },
  { value: 'prescricao', label: 'Prescrição', icon: faNotesMedical, color: '#ef4444' },
  { value: 'orientacao', label: 'Orientação', icon: faFileAlt, color: '#6366f1' }
]

const TimelinePaciente = ({ pacienteId, profissionalId }) => {
  const [evolucoes, setEvolucoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNovaEvolucao, setShowNovaEvolucao] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [expandidoId, setExpandidoId] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [loadingConsultas, setLoadingConsultas] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    observacao: '',
    tipoEvolucao: 'observacao',
    tags: '',
    consultaId: ''
  })

  useEffect(() => {
    if (pacienteId) {
      loadTimeline()
      loadConsultas()
    }
  }, [pacienteId])

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/evolucao-paciente/paciente/${pacienteId}`)
      const data = response.data?.data || response.data || []
      setEvolucoes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar timeline:', error)
      // Se a API não existir (404), apenas não mostra erro para o usuário
      if (error.response?.status === 404) {
        console.warn('API de evolução do paciente não está disponível ainda')
      }
      setEvolucoes([])
    } finally {
      setLoading(false)
    }
  }

  const loadConsultas = async () => {
    setLoadingConsultas(true)
    try {
      const response = await api.get(`/calendario/consultas?paciente_id=${pacienteId}`)
      const data = response.data?.data || response.data || []
      setConsultas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
      setConsultas([])
    } finally {
      setLoadingConsultas(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo.trim() || !formData.observacao.trim()) {
      alert('Preencha o título e a observação')
      return
    }

    try {
      const payload = {
        pacienteId,
        profissionalId,
        titulo: formData.titulo,
        observacao: formData.observacao,
        tipoEvolucao: formData.tipoEvolucao,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      }

      // Adicionar consultaId se foi selecionada
      if (formData.consultaId) {
        payload.consultaId = formData.consultaId
      }

      if (editandoId) {
        await api.put(`/evolucao-paciente/${editandoId}`, payload)
      } else {
        await api.post('/evolucao-paciente', payload)
      }

      setFormData({ titulo: '', observacao: '', tipoEvolucao: 'observacao', tags: '', consultaId: '' })
      setShowNovaEvolucao(false)
      setEditandoId(null)
      loadTimeline()
    } catch (error) {
      console.error('Erro ao salvar evolução:', error)
      if (error.response?.status === 404) {
        alert('A API de evolução do paciente ainda não está disponível no backend. Entre em contato com o suporte.')
      } else {
        alert('Erro ao salvar evolução: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleEditar = (evolucao) => {
    setFormData({
      titulo: evolucao.titulo,
      observacao: evolucao.observacao,
      tipoEvolucao: evolucao.tipoEvolucao,
      tags: Array.isArray(evolucao.tags) ? evolucao.tags.join(', ') : 
            (typeof evolucao.tags === 'string' ? JSON.parse(evolucao.tags || '[]').join(', ') : ''),
      consultaId: evolucao.consultaId || ''
    })
    setEditandoId(evolucao.id)
    setShowNovaEvolucao(true)
  }

  const handleDeletar = async (id) => {
    if (!confirm('Deseja realmente deletar esta evolução?')) return

    try {
      await api.delete(`/evolucao-paciente/${id}`)
      loadTimeline()
    } catch (error) {
      console.error('Erro ao deletar evolução:', error)
      alert('Erro ao deletar evolução')
    }
  }

  const handleCancelar = () => {
    setFormData({ titulo: '', observacao: '', tipoEvolucao: 'observacao', tags: '', consultaId: '' })
    setShowNovaEvolucao(false)
    setEditandoId(null)
  }

  const getTipoConfig = (tipo) => {
    return TIPOS_EVOLUCAO.find(t => t.value === tipo) || TIPOS_EVOLUCAO[0]
  }

  const formatarData = (data) => {
    const date = new Date(data)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseTags = (tags) => {
    if (Array.isArray(tags)) return tags
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags)
      } catch {
        return []
      }
    }
    return []
  }

  return (
    <div className="">
      <div className="timeline-header">
        <h2>
          <FontAwesomeIcon icon={faTimeline} />
          Timeline do Paciente
        </h2>
        <button 
          className="btn-nova-evolucao"
          onClick={() => setShowNovaEvolucao(!showNovaEvolucao)}
        >
          <FontAwesomeIcon icon={showNovaEvolucao ? faTimes : faPlus} />
          {showNovaEvolucao ? 'Cancelar' : 'Nova Evolução'}
        </button>
      </div>

      {showNovaEvolucao && (
        <form className="" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group form-group-half">
              <label>Tipo</label>
              <select
                value={formData.tipoEvolucao}
                onChange={(e) => setFormData({ ...formData, tipoEvolucao: e.target.value })}
                className="form-select"
              >
                {TIPOS_EVOLUCAO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-group-half">
              <label>Título</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Primeira consulta"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Vincular a Consulta (opcional)</label>
            <select
              value={formData.consultaId}
              onChange={(e) => setFormData({ ...formData, consultaId: e.target.value })}
              className="form-select"
            >
              <option value="">Sem vínculo com consulta</option>
              {loadingConsultas ? (
                <option disabled>Carregando consultas...</option>
              ) : (
                consultas.map(consulta => (
                  <option key={consulta.id} value={consulta.id}>
                    {new Date(consulta.data).toLocaleDateString('pt-BR')} às {consulta.horario} - {consulta.profissional?.nome || 'Profissional'}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Observação</label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Descreva os detalhes..."
              className="form-textarea"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Tags (opcional)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Ex: sensibilidade, dente-16"
              className="form-input"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={handleCancelar}>
              <FontAwesomeIcon icon={faTimes} />
              Cancelar
            </button>
            <button type="submit" className="btn-salvar">
              <FontAwesomeIcon icon={faSave} />
              {editandoId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="timeline-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Carregando timeline...</p>
        </div>
      ) : evolucoes.length === 0 ? (
        <div className="timeline-vazia">
          <FontAwesomeIcon icon={faTimeline} />
          <p>Nenhuma evolução registrada ainda</p>
          <small>Clique em "Nova Evolução" para começar</small>
        </div>
      ) : (
        <div className="timeline-lista">
          {evolucoes.map((evolucao) => {
            const tipoConfig = getTipoConfig(evolucao.tipoEvolucao)
            const isExpandido = expandidoId === evolucao.id
            const tags = parseTags(evolucao.tags)

            return (
              <div key={evolucao.id} className="timeline-item">
                <div 
                  className="timeline-item-marker" 
                  style={{ backgroundColor: tipoConfig.color }}
                >
                  <FontAwesomeIcon icon={tipoConfig.icon} />
                </div>
                
                <div className="timeline-item-content">
                  <div className="timeline-item-header">
                    <div className="timeline-item-tipo" style={{ color: tipoConfig.color }}>
                      <FontAwesomeIcon icon={tipoConfig.icon} />
                      {tipoConfig.label}
                    </div>
                    <div className="timeline-item-data">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {formatarData(evolucao.createdAt)}
                    </div>
                  </div>

                  <h3 className="timeline-item-titulo">{evolucao.titulo}</h3>

                  <div className={`timeline-item-observacao ${isExpandido ? 'expandido' : ''}`}>
                    {evolucao.observacao}
                  </div>

                  {evolucao.observacao.length > 150 && (
                    <button 
                      className="btn-expandir"
                      onClick={() => setExpandidoId(isExpandido ? null : evolucao.id)}
                    >
                      <FontAwesomeIcon icon={isExpandido ? faChevronUp : faChevronDown} />
                      {isExpandido ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}

                  {evolucao.consulta && (
                    <div className="timeline-item-consulta">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Consulta: {new Date(evolucao.consulta.data).toLocaleDateString('pt-BR')} às {evolucao.consulta.horario}
                    </div>
                  )}

                  {tags.length > 0 && (
                    <div className="timeline-item-tags">
                      <FontAwesomeIcon icon={faTags} />
                      {tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  {evolucao.profissional && (
                    <div className="timeline-item-profissional">
                      <FontAwesomeIcon icon={faUser} />
                      {evolucao.profissional.nome || 'Profissional'}
                    </div>
                  )}

                  <div className="timeline-item-actions">
                    <button 
                      className="btn-editar-evolucao"
                      onClick={() => handleEditar(evolucao)}
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="btn-deletar-evolucao"
                      onClick={() => handleDeletar(evolucao.id)}
                      title="Deletar"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimelinePaciente
