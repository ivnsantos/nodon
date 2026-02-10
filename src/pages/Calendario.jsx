import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarAlt, faChevronLeft, faChevronRight, faPlus,
  faClock, faUser, faMapMarkerAlt, faCog, faTrash, faEdit, faPalette, faTimes, faStickyNote, faUserCircle, faUserMd,
  faSpinner, faIdCard, faEnvelope, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Calendario.css'

const Calendario = () => {
  const { user, selectedClinicId, isClienteMaster, isUsuario, userComumId, selectedClinicData } = useAuth()
  
  // Hook para modal de alerta
  const { alertConfig, showError, showWarning, hideAlert } = useAlert()
  
  // Verificar se as funções existem (fallback caso não estejam disponíveis)
  const checkIsClienteMaster = () => {
    try {
      return isClienteMaster ? isClienteMaster() : false
    } catch {
      return false
    }
  }
  
  const checkIsUsuario = () => {
    try {
      return isUsuario ? isUsuario() : false
    } catch {
      return false
    }
  }
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTypesModal, setShowTypesModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventTypes, setEventTypes] = useState([])
  const [editingType, setEditingType] = useState(null)
  const [events, setEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [clientes, setClientes] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [filterProfessionalId, setFilterProfessionalId] = useState(null) // null = todos
  const [loading, setLoading] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [clienteMasterInfo, setClienteMasterInfo] = useState(null) // Info do cliente master para o filtro

  // Carregar tipos da API
  useEffect(() => {
    if (selectedClinicId) {
      fetchTiposConsulta()
    }
  }, [selectedClinicId])

  // Recarregar tipos quando o modal de tipos for aberto
  useEffect(() => {
    if (showTypesModal && selectedClinicId) {
      fetchTiposConsulta()
    }
  }, [showTypesModal, selectedClinicId])

  const fetchTiposConsulta = async () => {
    if (!selectedClinicId) {
      console.warn('selectedClinicId não está definido, não é possível carregar tipos')
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/calendario/tipos')
      
      if (response.data.statusCode === 200) {
        // A resposta pode ter estrutura aninhada: data.data.tipos ou data.tipos
        const tipos = response.data.data?.data?.tipos || 
                     response.data.data?.tipos || 
                     response.data.tipos || 
                     []
        
        // Mapear para o formato esperado pelo componente
        const mappedTypes = tipos
          .filter(tipo => tipo.ativo !== false)
          .map(tipo => ({
            id: tipo.id,
            name: tipo.nome,
            color: tipo.cor
          }))
        
        setEventTypes(mappedTypes)
      } else {
        setEventTypes([])
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de consulta:', error)
      console.error('Detalhes do erro:', error.response?.data)
      setEventTypes([])
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar clientes da API (não é chamada automaticamente)
  const fetchClientes = async () => {
    if (!selectedClinicId) return

    try {
      const response = await api.get('/pacientes')
      if (response.data.statusCode === 200) {
        const pacientesData = response.data.data?.pacientes || []
        setClientes(pacientesData)
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setClientes([])
    }
  }

  // Carregar profissionais/usuários da API
  useEffect(() => {
    if (selectedClinicId) {
      fetchProfissionais()
    }
  }, [selectedClinicId])

  const fetchProfissionais = async () => {
    if (!selectedClinicId) return

    try {
      const response = await api.get('/users/usuarios-comum/listar', {
        params: {
          cliente_master_id: selectedClinicId
        }
      })
      if (response.data.statusCode === 200) {
        // A resposta pode ter estrutura aninhada: response.data.data.data.usuarios
        let usuariosData = []
        if (response.data.data?.data?.usuarios) {
          usuariosData = response.data.data.data.usuarios
        } else if (response.data.data?.usuarios) {
          usuariosData = response.data.data.usuarios
        } else if (response.data.usuarios) {
          usuariosData = response.data.usuarios
        }
        
        
        // Extrair informações do cliente master da resposta
        // A estrutura é: response.data.data.data.cliente_master
        let clienteMaster = null
        if (response.data.data?.data?.cliente_master) {
          clienteMaster = response.data.data.data.cliente_master
        } else if (response.data.data?.cliente_master) {
          clienteMaster = response.data.data.cliente_master
        } else if (response.data.cliente_master) {
          clienteMaster = response.data.cliente_master
        }
        
        if (clienteMaster) {
          const clienteMasterData = {
            id: clienteMaster.id,
            nome: clienteMaster.nome || clienteMaster.nome_empresa || 'Cliente Master',
            email: clienteMaster.email || '',
            isClienteMaster: true
          }
          setClienteMasterInfo(clienteMasterData)
        } else {
          setClienteMasterInfo(null)
        }
        
        // Mapear para o formato esperado
        // A API pode retornar nome/email diretamente ou dentro de user
        const mappedProfissionais = usuariosData.map(usuario => ({
          id: usuario.id,
          nome: usuario.nome || usuario.user?.nome || usuario.user?.name || 'Profissional',
          email: usuario.email || usuario.user?.email || '',
          user_base_id: usuario.user_id || usuario.user?.id,
          ativo: usuario.ativo !== false,
          isClienteMaster: false
        }))
        setProfissionais(mappedProfissionais)
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error)
      setProfissionais([])
    }
  }

  // Carregar eventos da API quando mudar o mês ou filtro
  useEffect(() => {
    if (selectedClinicId) {
      fetchConsultas()
    }
  }, [currentDate, selectedClinicId, filterProfessionalId])

  const fetchConsultas = async () => {
    if (!selectedClinicId) {
      return
    }

    try {
      setLoadingEvents(true)
      const ano = currentDate.getFullYear()
      const mes = currentDate.getMonth() + 1
      
      // Montar URL com query params (seguindo padrão do projeto)
      let url = `/calendario/consultas/periodo/geral?ano=${ano}&mes=${mes}`
      
      // Se for 'self' (próprio usuário), passar profissional_id=null
      if (filterProfessionalId === 'self') {
        // Se o usuário logado é usuário comum, passar o userComumId
        // Se for cliente master, passar null
        if (checkIsUsuario() && userComumId) {
          url += `&profissional_id=${userComumId}`
        } else {
          url += `&profissional_id=null`
        }
      } else if (filterProfessionalId && filterProfessionalId !== 'all') {
        // Verificar se é o cliente master (formato: cliente-master-{id})
        if (filterProfessionalId.startsWith('cliente-master-')) {
          url += `&profissional_id=null`
        } else {
          // Se for um profissional específico (usuário comum), passar o UUID
          url += `&profissional_id=${filterProfessionalId}`
        }
      }
      // Se for 'all' ou null, não passar profissional_id (backend retornará todas)

      
      const response = await api.get(url)
      
      
      if (response.data.statusCode === 200) {
        // Verificar diferentes estruturas possíveis da resposta
        let consultas = []
        if (response.data.data?.data?.consultas) {
          consultas = response.data.data.data.consultas
        } else if (response.data.data?.consultas) {
          consultas = response.data.data.consultas
        } else if (response.data.consultas) {
          consultas = response.data.consultas
        }
        
        // Mapear para o formato esperado pelo componente
        const mappedEvents = consultas.map(consulta => {
          try {
            const [year, month, day] = consulta.data_consulta.split('-').map(Number)
            // Buscar tipo de consulta
            const tipo = eventTypes.find(t => t.id === consulta.tipo_consulta_id) || { name: 'Consulta' }
            const titulo = consulta.titulo || `${tipo.name} - ${consulta.paciente_nome || 'Paciente'}`
            
            return {
              id: consulta.id,
              title: titulo,
              date: new Date(year, month - 1, day),
              time: consulta.hora_consulta,
              typeId: consulta.tipo_consulta_id,
              patient: consulta.paciente_nome || 'Paciente',
              patientId: consulta.paciente_id || null,
              professional: consulta.profissional_nome || null,
              professionalId: consulta.profissional_id || null,
              professionalType: consulta.profissional_id ? 'professional' : 'self',
              notes: consulta.observacoes || ''
            }
          } catch (err) {
            return null
          }
        }).filter(Boolean) // Remove nulls
        
        setEvents(mappedEvents)
      } else {
        setEvents([])
      }
    } catch (error) {
      setEvents([])
      
      // Mostrar erro detalhado ao usuário
      if (error.response?.status >= 500) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro interno do servidor'
        showError(`Erro ao carregar consultas: ${errorMessage}`)
      } else if (error.response?.status === 404) {
        showWarning('Endpoint não encontrado. Verifique se a rota está implementada no backend.')
      } else if (error.response?.status === 401) {
        showError('Não autorizado. Faça login novamente.')
      } else if (error.response?.status === 403) {
        showError('Acesso negado. Verifique suas permissões.')
      } else if (error.response?.data?.message) {
        showError(`Erro: ${error.response.data.message}`)
      }
    } finally {
      setLoadingEvents(false)
    }
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Dias do mês anterior para preencher a primeira semana
    const prevMonth = new Date(year, month - 1, 0)
    const daysInPrevMonth = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      })
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      })
    }

    // Dias do próximo mês para completar a última semana
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      })
    }

    return days
  }

  const getEventsForDate = (date) => {
    // O filtro já é aplicado na API, então apenas filtrar por data
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getTypeById = (typeId) => {
    return eventTypes.find(type => type.id === typeId) || { name: 'Desconhecido', color: '#6b7280' }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleAddType = async (name, color) => {
    try {
      const response = await api.post('/calendario/tipos', { nome: name, cor: color })
      if (response.data.statusCode === 201) {
        // A resposta pode ter estrutura aninhada: data.data.tipo ou data.tipo
        const newType = response.data.data?.data?.tipo || response.data.data?.tipo || response.data.tipo
        
        if (newType) {
          const mappedType = {
            id: newType.id,
            name: newType.nome,
            color: newType.cor
          }
          
          // Adicionar o novo tipo à lista
          setEventTypes(prev => {
            // Verificar se já existe para evitar duplicatas
            const exists = prev.find(t => t.id === mappedType.id)
            if (exists) {
              return prev
            }
            return [...prev, mappedType]
          })
          
          // Recarregar a lista completa para garantir sincronização
          await fetchTiposConsulta()
        } else {
          // Se não veio o tipo na resposta, recarregar tudo
          await fetchTiposConsulta()
        }
      }
    } catch (error) {
      console.error('Erro ao criar tipo de consulta:', error)
      console.error('Detalhes do erro:', error.response?.data)
      showError('Erro ao criar tipo de consulta. Tente novamente.')
    }
  }

  const handleEditType = async (id, name, color) => {
    try {
      const response = await api.put(`/calendario/tipos/${id}`, { nome: name, cor: color })
      if (response.data.statusCode === 200) {
        const updatedType = response.data.data?.tipo
        if (updatedType) {
          setEventTypes(prev => prev.map(type => 
            type.id === id ? {
              id: updatedType.id,
              name: updatedType.nome,
              color: updatedType.cor
            } : type
          ))
        }
        setEditingType(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar tipo de consulta:', error)
      showError('Erro ao atualizar tipo de consulta. Tente novamente.')
    }
  }

  const handleDeleteType = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo?')) {
      return
    }

    try {
      const response = await api.delete(`/calendario/tipos/${id}`)
      if (response.data.statusCode === 200) {
        setEventTypes(prev => prev.filter(type => type.id !== id))
      }
    } catch (error) {
      console.error('Erro ao excluir tipo de consulta:', error)
      if (error.response?.data?.message) {
        showError(error.response.data.message)
      } else {
        showError('Erro ao excluir tipo de consulta. Tente novamente.')
      }
    }
  }

  const handleSaveEvent = async (eventData) => {
    try {
      // Formatar data para YYYY-MM-DD (ISO 8601)
      // IMPORTANTE: Não usar toISOString() pois pode mudar o dia devido ao timezone
      let dateStr
      if (eventData.date instanceof Date) {
        // Usar métodos locais para evitar problemas de timezone
        const year = eventData.date.getFullYear()
        const month = String(eventData.date.getMonth() + 1).padStart(2, '0')
        const day = String(eventData.date.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
      } else if (typeof eventData.date === 'string') {
        // Se já é string, garantir formato YYYY-MM-DD
        dateStr = eventData.date.split('T')[0]
      } else {
        throw new Error('Data inválida')
      }
      

      // Validar campos obrigatórios
      if (!eventData.typeId) {
        setCustomAlert({ show: true, message: 'Por favor, selecione um tipo de consulta.', type: 'error' })
        setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
        return
      }
      
      if (!eventData.patientId) {
        setCustomAlert({ show: true, message: 'Por favor, selecione um paciente.', type: 'error' })
        setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
        return
      }

      if (!eventData.time || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(eventData.time)) {
        setCustomAlert({ show: true, message: 'Por favor, informe uma hora válida no formato HH:MM.', type: 'error' })
        setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
        return
      }

      // Determinar profissionalId corretamente conforme regras
      // A lógica já foi aplicada no handleSubmit do formulário, apenas usar o valor
      const profissionalId = eventData.professionalId // Já vem correto do formulário

      // Preparar dados para a API (usando camelCase conforme esperado)
      const payload = {
        tipoConsultaId: eventData.typeId,
        pacienteId: eventData.patientId,
        profissionalId: profissionalId, // null se for cliente master, ou UUID do usuário comum
        titulo: eventData.title || null, // Será gerado automaticamente se null
        dataConsulta: dateStr,
        horaConsulta: eventData.time,
        observacoes: eventData.notes || null
      }


      let response
      if (editingEvent) {
        // Atualizar consulta existente
        response = await api.put(`/calendario/consultas/alterar/${editingEvent.id}`, payload)
      } else {
        // Criar nova consulta
        response = await api.post('/calendario/consultas/create', payload)
      }

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        // Recarregar consultas após salvar
        await fetchConsultas()
        setShowEventModal(false)
        setEditingEvent(null)
      }
    } catch (error) {
      console.error('Erro ao salvar consulta:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar consulta. Tente novamente.'
      setCustomAlert({ show: true, message: errorMessage, type: 'error' })
      setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta?')) {
      return
    }

    try {
      const response = await api.delete(`/calendario/consultas/${eventId}`)
      if (response.data.statusCode === 200) {
        // Recarregar consultas após deletar
        await fetchConsultas()
        setShowEventModal(false)
        setEditingEvent(null)
      }
    } catch (error) {
      console.error('Erro ao excluir consulta:', error)
      if (error.response?.data?.message) {
        showError(error.response.data.message)
      } else {
        showError('Erro ao excluir consulta. Tente novamente.')
      }
    }
  }

  const days = getDaysInMonth(currentDate)
  const selectedDateEvents = getEventsForDate(selectedDate)

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <div className="calendario-title">
          <FontAwesomeIcon icon={faCalendarAlt} />
          <h2>Calendário</h2>
        </div>
        <div className="calendario-actions">
          <button 
            className="btn-calendario btn-secondary" 
            onClick={() => setShowTypesModal(true)}
            title="Gerenciar tipos de consulta/tratamento"
          >
            <FontAwesomeIcon icon={faCog} />
            Tipos
          </button>
          <button className="btn-calendario btn-secondary" onClick={goToToday}>
            Hoje
          </button>
          <button 
            className="btn-calendario btn-primary"
            onClick={() => {
              setEditingEvent(null)
              setShowEventModal(true)
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Nova Consulta
          </button>
        </div>
      </div>

      <div className="calendario-controls">
        <div className="month-navigation">
          <button className="nav-btn" onClick={previousMonth}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h3 className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button className="nav-btn" onClick={nextMonth}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        <select
          value={filterProfessionalId === null ? 'all' : (filterProfessionalId === 'self' ? 'self' : filterProfessionalId)}
          onChange={(e) => {
            const value = e.target.value
            if (value === 'all') {
              setFilterProfessionalId(null)
            } else if (value === 'self') {
              setFilterProfessionalId('self')
            } else {
              setFilterProfessionalId(value) // UUID, não precisa de parseInt
            }
          }}
          className="filter-select"
        >
          <option value="all">Todos</option>
          <option value="self">Eu ({user?.name || user?.email || 'Eu'})</option>
          {/* Se for usuário comum, mostrar também o cliente master */}
          {!checkIsClienteMaster() && clienteMasterInfo && (
            <option value={`cliente-master-${clienteMasterInfo.id}`}>
              {clienteMasterInfo.nome} {clienteMasterInfo.email ? `(${clienteMasterInfo.email})` : ''}
            </option>
          )}
          {profissionais && profissionais.length > 0 ? (
            profissionais.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nome || prof.name || prof.email || 'Profissional'}
              </option>
            ))
          ) : (
            <option disabled>Carregando profissionais...</option>
          )}
        </select>
      </div>

      <div className="calendario-content">
        <div className="calendario-grid">
          <div className="weekdays-header">
            {weekDays.map((day, index) => (
              <div key={index} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="days-grid">
            {days.map((dayObj, index) => {
              const dayEvents = getEventsForDate(dayObj.date)
              const isCurrentDay = isToday(dayObj.date)
              const isSelectedDay = isSelected(dayObj.date)

              return (
                <div
                  key={index}
                  className={`calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''} ${isSelectedDay ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dayObj.date)}
                >
                  <div className="day-number">{dayObj.date.getDate()}</div>
                  <div className="day-events">
                    {dayEvents.slice(0, 3).map((event) => {
                      const eventType = getTypeById(event.typeId)
                      return (
                        <div 
                          key={event.id} 
                          className="event-color-dot" 
                          style={{ backgroundColor: eventType.color }}
                          title={`${eventType.name}: ${event.title}`}
                        />
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="more-events-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="calendario-sidebar">
          <div className="selected-date-info">
            <h3>Consultas do Dia</h3>
            <p className="selected-date-text">
              {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="events-list">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => {
                const eventType = getTypeById(event.typeId)
                return (
                  <div 
                    key={event.id} 
                    className="event-card"
                    onClick={async () => {
                      // Buscar detalhes completos da consulta
                      try {
                        const response = await api.get(`/calendario/consultas/${event.id}`)
                        if (response.data.statusCode === 200) {
                          const consulta = response.data.data?.consulta
                          if (consulta) {
                            const [year, month, day] = consulta.data_consulta.split('-').map(Number)
                            const eventData = {
                              id: consulta.id,
                              title: consulta.titulo,
                              date: new Date(year, month - 1, day),
                              time: consulta.hora_consulta,
                              typeId: consulta.tipo_consulta?.id || consulta.tipo_consulta_id,
                              patient: consulta.paciente?.nome || consulta.paciente_nome,
                              patientId: consulta.paciente?.id || consulta.paciente_id,
                              professional: consulta.profissional?.nome || null,
                              professionalId: consulta.profissional?.id || null,
                              professionalType: consulta.profissional_id ? 'professional' : 'self',
                              notes: consulta.observacoes || ''
                            }
                            setEditingEvent(eventData)
                            setShowEventModal(true)
                          }
                        }
                      } catch (error) {
                        console.error('Erro ao buscar detalhes da consulta:', error)
                        // Usar dados básicos se falhar
                        setEditingEvent(event)
                        setShowEventModal(true)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      className="event-type-badge" 
                      style={{ backgroundColor: eventType.color }}
                    >
                      {eventType.name}
                    </div>
                    <h4 className="event-title">{event.title}</h4>
                    <div className="event-details">
                      <span className="event-time">
                        <FontAwesomeIcon icon={faClock} />
                        {event.time}
                      </span>
                    {event.patient && (
                      <span className="event-patient">
                        <FontAwesomeIcon icon={faUser} />
                        {event.patient}
                      </span>
                    )}
                    {event.professional && (
                      <span className="event-professional">
                        <FontAwesomeIcon icon={faUserMd} />
                        {event.professional}
                      </span>
                    )}
                    </div>
                    {event.notes && (
                      <div className="event-notes">
                        <FontAwesomeIcon icon={faStickyNote} />
                        {event.notes}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="no-events">
                <FontAwesomeIcon icon={faCalendarAlt} size="2x" />
                <p>Nenhuma consulta agendada para este dia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Gerenciamento de Tipos */}
      {showTypesModal && (
        <EventTypesModal
          eventTypes={eventTypes}
          onClose={() => {
            setShowTypesModal(false)
            setEditingType(null)
          }}
          onAdd={handleAddType}
          onEdit={handleEditType}
          onDelete={handleDeleteType}
          editingType={editingType}
          setEditingType={setEditingType}
        />
      )}

      {/* Modal de Nova Consulta */}
      {showEventModal && (
        <NewEventModal
          eventTypes={eventTypes}
          selectedDate={selectedDate}
          events={events}
          editingEvent={editingEvent}
          clientes={clientes}
          setClientes={setClientes}
          profissionais={profissionais}
          currentUser={user}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Modal de Alerta */}
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

// Componente Modal de Tipos
const EventTypesModal = ({ eventTypes, onClose, onAdd, onEdit, onDelete, editingType, setEditingType }) => {
  const [formData, setFormData] = useState({ name: '', color: '#0ea5e9' })
  const [showForm, setShowForm] = useState(false)

  const colors = [
    '#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#10b981', '#6366f1', '#f97316'
  ]

  useEffect(() => {
    if (editingType) {
      setFormData({ name: editingType.name, color: editingType.color })
      setShowForm(true)
    }
  }, [editingType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingType) {
      await onEdit(editingType.id, formData.name, formData.color)
    } else {
      await onAdd(formData.name, formData.color)
    }
    setFormData({ name: '', color: '#0ea5e9' })
    setShowForm(false)
    setEditingType(null)
  }

  const handleCancel = () => {
    setFormData({ name: '', color: '#0ea5e9' })
    setShowForm(false)
    setEditingType(null)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-types" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-types">
          <h2>
            <FontAwesomeIcon icon={faPalette} />
            Gerenciar Tipos de Consulta/Tratamento
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-body-types">
          {!showForm ? (
            <>
              <div className="types-list">
                {eventTypes && eventTypes.length > 0 ? (
                  eventTypes.map((type) => (
                    <div key={type.id} className="type-item">
                      <div className="type-color-preview" style={{ backgroundColor: type.color }}></div>
                      <span className="type-name">{type.name}</span>
                      <div className="type-actions">
                        <button 
                          className="btn-edit-type" 
                          onClick={() => setEditingType(type)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="btn-delete-type" 
                          onClick={() => onDelete(type.id)}
                          title="Excluir"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-types-message">
                    <p>Nenhum tipo cadastrado ainda.</p>
                    <p>Clique em "Adicionar Novo Tipo" para começar.</p>
                  </div>
                )}
              </div>
              <button 
                className="btn-add-type" 
                onClick={() => setShowForm(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                Adicionar Novo Tipo
              </button>
            </>
          ) : (
            <form className="type-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome do Tipo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Consulta, Tratamento, Revisão..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Cor</label>
                <div className="color-picker">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="color-input"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingType ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Nova Consulta
const NewEventModal = ({ eventTypes, selectedDate, events, editingEvent, clientes, setClientes, profissionais, currentUser, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: editingEvent 
      ? new Date(editingEvent.date).toISOString().split('T')[0]
      : selectedDate.toISOString().split('T')[0],
    time: editingEvent ? editingEvent.time : '09:00',
    typeId: editingEvent ? editingEvent.typeId : (eventTypes[0]?.id || ''),
    patientId: editingEvent ? editingEvent.patientId || null : null,
    professionalId: editingEvent ? editingEvent.professionalId || null : null,
    professionalType: editingEvent ? editingEvent.professionalType || 'self' : 'self',
    notes: editingEvent ? editingEvent.notes || '' : ''
  })
  
  // Estados para busca dinâmica de pacientes
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)
  
  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 3) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300) // Aguarda 300ms após parar de digitar
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm])
  
  const handleSearch = async (term) => {
    if (!term || term.length < 3) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    
    setSearching(true)
    setShowSearchResults(true)
    
    try {
      // Verificar se é CPF (apenas números, 11 dígitos) ou nome
      const cpfOnly = term.replace(/\D/g, '')
      let url = '/pacientes/buscar'
      
      // Verificar se é CPF (apenas números) ou nome
      const isOnlyNumbers = /^\d+$/.test(term.replace(/\s/g, ''))
      
      if (isOnlyNumbers && cpfOnly.length >= 3) {
        // Buscar por CPF (aceita CPF parcial ou completo)
        url += `?cpf=${cpfOnly}`
      } else {
        // Buscar por nome
        url += `?nome=${encodeURIComponent(term.trim())}`
      }
      
      const response = await api.get(url)
      
      // A resposta pode ter diferentes estruturas
      let pacientes = []
      
      // Verificar se é um array direto (resposta mais comum)
      if (Array.isArray(response.data)) {
        pacientes = response.data
      } 
      // Verificar estrutura com statusCode
      else if (response.data?.statusCode === 200) {
        // A estrutura pode ser: response.data.data.data.pacientes ou response.data.data.pacientes
        pacientes = response.data.data?.data?.pacientes || 
                   response.data.data?.pacientes || 
                   response.data.pacientes || 
                   []
      }
      // Verificar se há data direto (sem statusCode)
      else if (response.data?.data) {
        pacientes = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data.pacientes || [])
      }
      // Fallback: tentar pegar diretamente se não houver estrutura conhecida
      else if (response.data) {
        pacientes = Array.isArray(response.data) ? response.data : []
      }
      
      // Sempre mostrar dropdown após busca, mesmo se não houver resultados
      setShowSearchResults(true)
      
      if (pacientes.length > 0) {
        setSearchResults(pacientes)
        
        // Adicionar novos pacientes à lista de clientes
        pacientes.forEach(paciente => {
          if (!clientes.find(c => c.id === paciente.id)) {
            setClientes(prev => [...prev, paciente])
          }
        })
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title || '',
        date: new Date(editingEvent.date).toISOString().split('T')[0],
        time: editingEvent.time || '09:00',
        typeId: editingEvent.typeId || (eventTypes[0]?.id || ''),
        patientId: editingEvent.patientId || null,
        professionalId: editingEvent.professionalId || null,
        professionalType: editingEvent.professionalType || 'self',
        notes: editingEvent.notes || ''
      })
      
      // Preencher searchTerm com o nome do paciente se estiver editando
      if (editingEvent.patientId) {
        const paciente = clientes.find(c => c.id === editingEvent.patientId)
        if (paciente) {
          setSearchTerm(paciente.nome + (paciente.cpf ? ` (${paciente.cpf})` : ''))
        }
      }
    } else {
      // Limpar busca ao criar novo evento
      setSearchTerm('')
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [editingEvent, eventTypes, clientes])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.typeId) {
      setCustomAlert({ show: true, message: 'Selecione um tipo de consulta/tratamento', type: 'error' })
      setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
      return
    }

    if (!formData.patientId) {
      setCustomAlert({ show: true, message: 'Selecione um paciente', type: 'error' })
      setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
      return
    }

    // Criar data sem problemas de timezone
    // formData.date já vem no formato YYYY-MM-DD
    const [year, month, day] = formData.date.split('-').map(Number)
    const [hours, minutes] = formData.time.split(':').map(Number)
    
    // Criar data local (sem conversão de timezone)
    const eventDate = new Date(year, month - 1, day, hours, minutes)
    

    // Buscar nome do paciente
    const selectedCliente = clientes.find(c => c.id === formData.patientId || c.id === String(formData.patientId))
    const patientName = selectedCliente?.nome || 'Paciente'

    // Buscar nome do profissional e determinar profissionalId conforme regras
    let professionalName = ''
    let professionalId = null
    
    let usuarioLogadoEhClienteMaster = false
    let usuarioLogadoEhUsuarioComum = false
    
    try {
      usuarioLogadoEhClienteMaster = checkIsClienteMaster()
      usuarioLogadoEhUsuarioComum = checkIsUsuario()
    } catch (error) {
      console.warn('Erro ao verificar tipo de usuário:', error)
      // Se houver erro, assumir que é cliente master por padrão
      usuarioLogadoEhClienteMaster = true
    }
    
    if (formData.professionalType === 'self') {
      // Usuário selecionou "Eu"
      professionalName = currentUser?.name || currentUser?.email || 'Eu'
      
      if (usuarioLogadoEhClienteMaster) {
        // Se o usuário logado é cliente master, profissionalId = null
        professionalId = null
      } else if (usuarioLogadoEhUsuarioComum && userComumId) {
        // Se o usuário logado é usuário comum, profissionalId = id do próprio usuário comum
        professionalId = userComumId
      }
    } else if (formData.professionalType === 'professional' && formData.professionalId) {
      // Usuário selecionou outro profissional (sempre será usuário comum, não cliente master)
      const selectedProf = profissionais.find(p => p.id === formData.professionalId || p.id === String(formData.professionalId))
      professionalName = selectedProf?.nome || selectedProf?.name || selectedProf?.user?.nome || 'Profissional'
      
      // Os profissionais na lista são sempre usuários comum (vêm de /users/usuarios-comum/listar)
      // Então sempre enviar o ID do usuário comum selecionado
      professionalId = formData.professionalId
    }

    const eventData = {
      title: formData.title || `${eventTypes.find(t => t.id === formData.typeId || t.id === String(formData.typeId))?.name || 'Consulta'} - ${patientName}`,
      date: eventDate,
      time: formData.time,
      typeId: formData.typeId, // UUID, não precisa de parseInt
      patient: patientName,
      patientId: formData.patientId, // UUID, não precisa de parseInt
      professional: professionalName,
      professionalId: professionalId,
      professionalType: formData.professionalType,
      notes: formData.notes
    }

    
    try {
      onSave(eventData)
    } catch (error) {
      console.error('Erro ao chamar onSave:', error)
      setCustomAlert({ show: true, message: 'Erro ao processar formulário. Verifique o console.', type: 'error' })
      setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 4000)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-event" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-event">
          <h2>
            <FontAwesomeIcon icon={faCalendarAlt} />
            {editingEvent ? 'Editar Consulta' : 'Nova Consulta'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form className="event-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de Consulta/Tratamento *</label>
            <select
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              required
              className="form-select"
            >
              <option value="">Selecione um tipo</option>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {formData.typeId && (
              <div className="type-preview">
                <div 
                  className="type-color-preview-small" 
                  style={{ backgroundColor: eventTypes.find(t => t.id === formData.typeId || t.id === String(formData.typeId))?.color }}
                ></div>
                <span>{eventTypes.find(t => t.id === formData.typeId || t.id === String(formData.typeId))?.name}</span>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Hora *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Paciente/Cliente *</label>
            <div className="patient-search-container">
              <div className="patient-search-input-wrapper">
                <input
                  type="text"
                  placeholder="Digite o CPF ou nome do paciente..."
                  className="form-input patient-search-input"
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchTerm(value)
                    
                    // Se o usuário apagar tudo ou mudar o texto, limpar seleção
                    if (!value || value.length < 3) {
                      setFormData({ ...formData, patientId: null })
                      setSearchResults([])
                      setShowSearchResults(false)
                    } else if (value.length >= 3 && searchResults.length > 0) {
                      // Mostrar resultados se já houver busca anterior
                      setShowSearchResults(true)
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0 || searching) {
                      setShowSearchResults(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay para permitir clique nos resultados
                    setTimeout(() => {
                      // Só esconder se não houver paciente selecionado
                      if (!formData.patientId) {
                        setShowSearchResults(false)
                      }
                    }, 200)
                  }}
                />
                {searching && (
                  <div className="search-spinner">
                    <FontAwesomeIcon icon={faSpinner} spin />
                  </div>
                )}
              </div>
              
              {/* Dropdown de resultados - só mostrar se não tiver paciente selecionado ou estiver buscando */}
              {!formData.patientId && (showSearchResults || searching) && (
                <div className="patient-search-results">
                  {searching ? (
                    <div className="search-loading">
                      <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }} />
                      Buscando pacientes...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="search-results-header">
                        {searchResults.length} paciente(s) encontrado(s)
                      </div>
                      {searchResults.map((paciente) => (
                        <div
                          key={paciente.id}
                          className="search-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault() // Prevenir blur do input
                          const patientName = paciente.nome + (paciente.cpf ? ` (${paciente.cpf})` : '')
                          setFormData({ ...formData, patientId: paciente.id })
                          setSearchTerm(patientName)
                          setSearchResults([]) // Limpar resultados
                          setShowSearchResults(false) // Esconder dropdown
                          
                          // Adicionar à lista se não estiver
                          if (!clientes.find(c => c.id === paciente.id)) {
                            setClientes(prev => [...prev, paciente])
                          }
                        }}
                        >
                          <div className="result-main">
                            <div className="result-name">
                              <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.5rem', opacity: 0.7 }} />
                              {paciente.nome}
                            </div>
                            {paciente.cpf && (
                              <div className="result-cpf">
                                <FontAwesomeIcon icon={faIdCard} style={{ marginRight: '0.25rem', fontSize: '0.75rem', opacity: 0.6 }} />
                                {paciente.cpf}
                              </div>
                            )}
                          </div>
                          {paciente.email && (
                            <div className="result-email">
                              <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '0.25rem', fontSize: '0.75rem', opacity: 0.6 }} />
                              {paciente.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="search-no-results">
                      <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                      Nenhum paciente encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Indicador de paciente selecionado */}
            {formData.patientId && (() => {
              const selectedPatient = clientes.find(c => 
                c.id === formData.patientId || 
                String(c.id) === String(formData.patientId)
              )
              // Usar o nome do paciente encontrado, ou extrair do searchTerm
              let patientName = selectedPatient?.nome
              
              // Se não encontrou na lista, tentar extrair do searchTerm (formato: "Nome (CPF)")
              if (!patientName && searchTerm) {
                const match = searchTerm.match(/^([^(]+)/)
                patientName = match ? match[1].trim() : searchTerm
              }
              
              // Fallback final
              patientName = patientName || 'Paciente selecionado'
              
              return (
                <div className="selected-patient-info">
                  <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                  <span>Paciente selecionado: {patientName}</span>
                </div>
              )
            })()}
          </div>

          <div className="form-group">
            <label>Profissional Responsável</label>
            <div className="professional-type-selector">
              <button
                type="button"
                className={`professional-type-btn ${formData.professionalType === 'self' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, professionalType: 'self', professionalId: null })}
              >
                <FontAwesomeIcon icon={faUserCircle} />
                {currentUser?.name || currentUser?.email || 'Eu'}
              </button>
              <button
                type="button"
                className={`professional-type-btn ${formData.professionalType === 'professional' ? 'active' : ''}`}
                onClick={() => {
                  // Ao clicar em "Outro Profissional", limpar a seleção anterior
                  setFormData({ ...formData, professionalType: 'professional', professionalId: null })
                }}
              >
                <FontAwesomeIcon icon={faUserMd} />
                Outro Profissional
              </button>
            </div>
            
            {formData.professionalType === 'professional' && (
              <>
                <select
                  value={formData.professionalId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value || null
                  setFormData({ 
                    ...formData, 
                    professionalId: selectedId
                  })
                }}
                  className="form-select"
                >
                  <option value="">Selecione um profissional</option>
                  {profissionais.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nome || prof.name || prof.user?.nome || prof.email}
                    </option>
                  ))}
                </select>
                
                {formData.professionalId && (() => {
                  const selectedProf = profissionais.find(p => 
                    p.id === formData.professionalId || 
                    String(p.id) === String(formData.professionalId)
                  )
                  const profName = selectedProf?.nome || 
                                   selectedProf?.name || 
                                   selectedProf?.user?.nome || 
                                   selectedProf?.email || 
                                   'Carregando...'
                  
                  return (
                    <div className="selected-professional-info">
                      <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                      <span>Profissional selecionado: {profName}</span>
                    </div>
                  )
                })()}
              </>
            )}
            
            {formData.professionalType === 'self' && (
              <div className="selected-professional-info">
                <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                <span>Profissional: {currentUser?.name || currentUser?.email || 'Você'}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Título da Consulta</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Deixe em branco para gerar automaticamente"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre a consulta..."
              rows="4"
              className="form-textarea"
            />
          </div>

          <div className="form-actions">
            {editingEvent && (
              <button 
                type="button" 
                className="btn-delete-event" 
                onClick={() => onDelete(editingEvent.id)}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            )}
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {editingEvent ? 'Salvar Alterações' : 'Criar Consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Calendario
