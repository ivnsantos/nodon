import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCalendarAlt, faChevronLeft, faChevronRight, faPlus,
  faClock, faUser, faMapMarkerAlt, faCog, faTrash, faEdit, faPalette, faTimes, faStickyNote, faUserCircle, faUserMd,
  faSpinner, faIdCard, faEnvelope, faCheckCircle, faLink, faInfoCircle, faPhone, faComment, faBell
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/useAuth'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Calendario.css'

const Calendario = () => {
  const { user, selectedClinicId, isClienteMaster, isUsuario, userComumId, selectedClinicData } = useAuth()
  
  // Hook para modal de alerta
  const { alertConfig, showError, showWarning, showSuccess, hideAlert } = useAlert()
  
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
  const [viewMode, setViewMode] = useState('month') // 'month' ou 'week'
  const [showTypesModal, setShowTypesModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [isGerarLink, setIsGerarLink] = useState(false)
  const [eventTypes, setEventTypes] = useState([])
  const [editingType, setEditingType] = useState(null)
  const [events, setEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [clientes, setClientes] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [filterProfessionalId, setFilterProfessionalId] = useState(null) // null = todos
  const [loading, setLoading] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [clienteMasterInfo, setClienteMasterInfo] = useState(null) // Info do cliente master para o filtro
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkGerado, setLinkGerado] = useState('')
  const [consultaGeradaData, setConsultaGeradaData] = useState(null)
  const [solicitandoConfirmacaoId, setSolicitandoConfirmacaoId] = useState(null)
  const [smsNomeModal, setSmsNomeModal] = useState('')
  const [smsTelefoneModal, setSmsTelefoneModal] = useState('')

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
    if (!selectedClinicId) {
      setLoadingEvents(false)
      return
    }
    fetchConsultas()
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
              notes: consulta.observacoes || '',
              status: consulta.status || 'agendada'
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
        showError('Por favor, selecione um tipo de consulta.')
        return
      }
      
      // Só validar paciente se não for gerar link (patientId não é null)
      // Se patient é null, significa que é gerar link, então não validar
      if (eventData.patient !== null && !eventData.patientId) {
        showError('Por favor, selecione um paciente.')
        return
      }

      // Normalizar hora para formato HH:MM (aceitar HH:MM:SS e converter)
      let normalizedTime = eventData.time
      if (normalizedTime && normalizedTime.includes(':')) {
        const timeParts = normalizedTime.split(':')
        if (timeParts.length >= 2) {
          // Pegar apenas horas e minutos, ignorar segundos se existirem
          normalizedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`
        }
      }
      
      // Validar formato HH:MM
      if (!normalizedTime || !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(normalizedTime)) {
        showError('Por favor, informe uma hora válida no formato HH:MM.')
        return
      }
      
      // Usar hora normalizada
      eventData.time = normalizedTime

      // Determinar profissionalId corretamente conforme regras
      // A lógica já foi aplicada no handleSubmit do formulário, apenas usar o valor
      const profissionalId = eventData.professionalId // Já vem correto do formulário

      // Preparar dados para a API (usando camelCase conforme esperado); API exige hora em HH:MM
      const horaConsulta = (eventData.time && eventData.time.includes(':'))
        ? `${String(eventData.time.split(':')[0]).padStart(2, '0')}:${String(eventData.time.split(':')[1]).padStart(2, '0')}`
        : eventData.time
      const payload = {
        tipoConsultaId: eventData.typeId,
        // Só incluir pacienteId se não for null (gerar link)
        ...(eventData.patientId !== null && { pacienteId: eventData.patientId }),
        profissionalId: profissionalId, // null se for cliente master, ou UUID do usuário comum
        titulo: eventData.title || null, // Será gerado automaticamente se null
        dataConsulta: dateStr,
        horaConsulta: horaConsulta,
        observacoes: eventData.notes || null,
        status: eventData.status || 'agendada'
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
        // Se for gerar link (sem paciente), mostrar o link gerado
        if (isGerarLink && !editingEvent) {
          // Tentar várias formas de extrair o ID da consulta
          const consultaId = 
            response.data?.data?.consulta?.id || 
            response.data?.data?.id || 
            response.data?.consulta?.id ||
            response.data?.id ||
            response.data?.data?.data?.consulta?.id
          
          console.log('Gerando link - Response completo:', response.data)
          console.log('Consulta ID encontrado:', consultaId)
          
          if (consultaId) {
            const link = `${window.location.origin}/agendamento/${consultaId}`
            console.log('Link gerado:', link)
            
            // Armazenar dados da consulta para possível envio de SMS
            const dateStr = eventData.date instanceof Date
              ? `${eventData.date.getFullYear()}-${String(eventData.date.getMonth() + 1).padStart(2, '0')}-${String(eventData.date.getDate()).padStart(2, '0')}`
              : eventData.date.split('T')[0]
            
            let horaConsulta = eventData.time
            if (horaConsulta && horaConsulta.includes(':') && horaConsulta.split(':').length === 3) {
              const [hours, minutes] = horaConsulta.split(':')
              horaConsulta = `${hours}:${minutes}`
            }
            
            setConsultaGeradaData({
              telefone: null, // Não tem paciente quando gera link
              nome: null,
              typeId: eventData.typeId,
              dataConsulta: dateStr,
              horaConsulta: horaConsulta,
              consultaId: consultaId,
              link: link
            })
            
            // Fechar o modal de gerar link primeiro
            setShowEventModal(false)
            setEditingEvent(null)
            setIsGerarLink(false)
            
            // Recarregar consultas
            await fetchConsultas()
            
            // Pequeno delay para garantir que o modal anterior foi fechado
            setTimeout(() => {
              console.log('Abrindo modal com link:', link)
              setLinkGerado(link)
              setShowLinkModal(true)
            }, 500) // Delay para garantir que o modal anterior foi fechado
            return // Sair da função para não executar o código abaixo
          } else {
            console.error('ERRO: Consulta ID não encontrado na resposta')
            console.error('Estrutura da resposta:', JSON.stringify(response.data, null, 2))
            showError('Erro ao gerar link: ID da consulta não encontrado')
          }
        }
        
        // Recarregar consultas após salvar
        await fetchConsultas()
        setShowEventModal(false)
        setEditingEvent(null)
        setIsGerarLink(false)
      }
    } catch (error) {
      console.error('Erro ao salvar consulta:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar consulta. Tente novamente.'
      showError(errorMessage)
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

  // Função para formatar telefone para envio (apenas números com 55, sem +)
  const formatPhoneForAPI = (phone) => {
    // Remove tudo que não é número
    let numbers = phone.replace(/\D/g, '')
    
    // Se não começar com 55, adicionar
    if (!numbers.startsWith('55')) {
      // Remover zeros à esquerda se houver
      numbers = numbers.replace(/^0+/, '')
      numbers = '55' + numbers
    }
    
    // Retornar apenas números (sem o +) - formato esperado pela API: "5511965899998"
    return numbers
  }

  // Função para enviar SMS do modal de link gerado
  const handleSendSMSFromModal = async () => {
    if (!smsTelefoneModal.trim()) {
      showError('Por favor, informe o telefone para enviar SMS')
      return
    }

    if (!smsNomeModal.trim()) {
      showError('Por favor, informe o nome do paciente para enviar SMS')
      return
    }

    if (!consultaGeradaData) {
      showError('Erro: dados da consulta não encontrados')
      return
    }

    try {
      // Formatar telefone para envio (com +55)
      const telefoneFormatado = formatPhoneForAPI(smsTelefoneModal)
      
      await handleSendSMS({
        ...consultaGeradaData,
        telefone: telefoneFormatado,
        nome: smsNomeModal.trim(),
        consultaId: consultaGeradaData.consultaId,
        link: linkGerado
      })
      
      // Limpar os campos após envio bem-sucedido
      setSmsTelefoneModal('')
      setSmsNomeModal('')
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
      // O erro já é tratado na função handleSendSMS
    }
  }

  // Função para verificar se a consulta é hoje ou amanhã (day ou day + 1)
  const isTodayOrTomorrow = (eventDate) => {
    if (!eventDate) return false
    
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)
      
      // Converter a data do evento para Date se necessário
      let dataConsulta
      if (eventDate instanceof Date) {
        dataConsulta = new Date(eventDate)
      } else if (typeof eventDate === 'string') {
        // Se for string, pode ser formato ISO ou outro formato
        dataConsulta = new Date(eventDate)
      } else {
        dataConsulta = new Date(eventDate)
      }
      
      // Verificar se a data é válida
      if (isNaN(dataConsulta.getTime())) {
        console.error('Data inválida:', eventDate)
        return false
      }
      
      dataConsulta.setHours(0, 0, 0, 0)
      
      // Retorna true APENAS se a consulta é hoje ou amanhã
      const isToday = dataConsulta.getTime() === hoje.getTime()
      const isTomorrow = dataConsulta.getTime() === amanha.getTime()
      
      return isToday || isTomorrow
    } catch (error) {
      console.error('Erro ao verificar data:', error, eventDate)
      return false
    }
  }

  // Função para solicitar confirmação do paciente
  const handleSolicitarConfirmacao = async (consultaId) => {
    if (!consultaId) {
      showError('ID da consulta não encontrado')
      return
    }
    setSolicitandoConfirmacaoId(consultaId)
    try {
      await api.post('/calendario/consultas/solicitar-confirmacao', {
        consultaId: consultaId
      })
      showSuccess('Solicitação de confirmação enviada com sucesso!')
      await fetchConsultas()
    } catch (error) {
      console.error('Erro ao solicitar confirmação:', error)
      showError(error.response?.data?.message || 'Erro ao solicitar confirmação. Tente novamente.')
    } finally {
      setSolicitandoConfirmacaoId(null)
    }
  }

  // Função para enviar SMS de agendamento
  const handleSendSMS = async (consultaData) => {
    try {
      // Validar se tem telefone
      if (!consultaData.telefone) {
        showError('Telefone do paciente não encontrado. Não é possível enviar SMS.')
        return
      }

      // Preparar dados para a API
      const dateStr = consultaData.date instanceof Date
        ? `${consultaData.date.getFullYear()}-${String(consultaData.date.getMonth() + 1).padStart(2, '0')}-${String(consultaData.date.getDate()).padStart(2, '0')}`
        : consultaData.date ? consultaData.date.split('T')[0] : consultaData.dataConsulta

      // Normalizar hora para HH:MM
      let horaConsulta = consultaData.time || consultaData.horaConsulta
      if (horaConsulta && horaConsulta.includes(':') && horaConsulta.split(':').length === 3) {
        const [hours, minutes] = horaConsulta.split(':')
        horaConsulta = `${hours}:${minutes}`
      }

      // Formatar telefone para envio (apenas números com 55, sem +)
      // Se o telefone já estiver formatado (vindo de formatPhoneForAPI), usar direto
      // Caso contrário, formatar agora
      let telefoneFormatado = consultaData.telefone
      // Se contém caracteres não numéricos (exceto +), precisa formatar
      if (telefoneFormatado.includes('+') || telefoneFormatado.includes('(') || telefoneFormatado.includes(')') || telefoneFormatado.includes('-') || telefoneFormatado.includes(' ')) {
        telefoneFormatado = formatPhoneForAPI(telefoneFormatado)
      } else if (!telefoneFormatado.startsWith('55')) {
        // Se não tem código 55, adicionar
        telefoneFormatado = formatPhoneForAPI(telefoneFormatado)
      }

      const payload = {
        telefone: telefoneFormatado, // Formato: "5511965899998" (apenas números)
        nome: consultaData.nome || 'Paciente',
        tipoConsultaId: consultaData.typeId,
        dataConsulta: dateStr,
        horaConsulta: horaConsulta
      }

      // Se for status "link", incluir o link do agendamento
      if (consultaData.consultaId || consultaData.link) {
        const link = consultaData.link || `${window.location.origin}/agendamento/${consultaData.consultaId}`
        payload.link = link
        payload.consultaId = consultaData.consultaId
      }

      await api.post('/calendario/consultas/enviar-sms-agendamento', payload)
      showSuccess('SMS enviado com sucesso!')
      await fetchConsultas()
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
      showError(error.response?.data?.message || 'Erro ao enviar SMS. Tente novamente.')
    }
  }

  // Função para obter os dias da semana
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day // Domingo como primeiro dia
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek)
      dayDate.setDate(startOfWeek.getDate() + i)
      weekDays.push({
        date: dayDate,
        isCurrentMonth: true
      })
    }
    return weekDays
  }

  // Navegação semanal
  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate)
  const selectedDateEvents = getEventsForDate(selectedDate)

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <div className="calendario-title">
          <FontAwesomeIcon icon={faCalendarAlt} />
          <h2>Agenda</h2>
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
              setIsGerarLink(false)
              setShowEventModal(true)
            }}
          >
            <FontAwesomeIcon icon={faPlus} />
            Nova Consulta
          </button>
          <button 
            className="btn-calendario btn-secondary"
            onClick={() => {
              setEditingEvent(null)
              setIsGerarLink(true)
              setShowEventModal(true)
            }}
          >
            <FontAwesomeIcon icon={faLink} />
            Gerar Link
          </button>
        </div>
      </div>

      <div className="calendario-controls">
        <div className="view-mode-selector">
          <button 
            className={`view-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mês
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
        </div>
        <div className="month-navigation">
          <button className="nav-btn" onClick={viewMode === 'month' ? previousMonth : previousWeek}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h3 className="current-month">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : (() => {
                  const weekStart = getWeekDays(currentDate)[0].date
                  const weekEnd = getWeekDays(currentDate)[6].date
                  if (weekStart.getMonth() === weekEnd.getMonth()) {
                    return `${weekStart.getDate()} - ${weekEnd.getDate()} de ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`
                  } else {
                    return `${weekStart.getDate()} de ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} de ${monthNames[weekEnd.getMonth()]} ${weekStart.getFullYear()}`
                  }
                })()
            }
          </h3>
          <button className="nav-btn" onClick={viewMode === 'month' ? nextMonth : nextWeek}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <button className="nav-btn today-btn" onClick={goToToday}>
            Hoje
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
        {loadingEvents ? (
          <div className="calendario-loading">
            <FontAwesomeIcon icon={faSpinner} spin className="calendario-loading-spinner" />
            <p className="calendario-loading-text">Carregando consultas...</p>
          </div>
        ) : (
        <>
        <div className="calendario-grid">
          <div className="weekdays-header">
            {weekDays.map((day, index) => (
              <div key={index} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className={`days-grid ${viewMode === 'week' ? 'week-view' : ''}`}>
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
                        console.log('Resposta completa da API consulta:', response.data)
                        
                        // A estrutura é aninhada: response.data.data.data.consulta
                        let consulta = null
                        if (response.data?.data?.data?.consulta) {
                          consulta = response.data.data.data.consulta
                          console.log('Consulta encontrada em response.data.data.data.consulta')
                        } else if (response.data?.data?.consulta) {
                          consulta = response.data.data.consulta
                          console.log('Consulta encontrada em response.data.data.consulta')
                        } else if (response.data?.consulta) {
                          consulta = response.data.consulta
                          console.log('Consulta encontrada em response.data.consulta')
                        }
                        
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
                            // Incluir objeto completo do paciente para visualização (preservar todos os campos)
                            patientData: consulta.paciente ? {
                              ...consulta.paciente,
                              id: consulta.paciente.id,
                              nome: consulta.paciente.nome,
                              email: consulta.paciente.email,
                              telefone: consulta.paciente.telefone,
                              cpf: consulta.paciente.cpf || consulta.paciente.CPF
                            } : null,
                            professional: consulta.profissional?.nome || null,
                            professionalId: consulta.profissional?.id || null,
                            professionalType: consulta.profissional_id ? 'professional' : 'self',
                            notes: consulta.observacoes || '',
                            status: consulta.status || 'agendada'
                          }
                          console.log('EventData criado:', eventData)
                          setEditingEvent(eventData)
                          setShowEventModal(true)
                          console.log('Modal deve estar aberto agora')
                        } else {
                          console.log('Consulta não encontrada na resposta, usando dados básicos')
                          // Se não encontrar consulta, usar dados básicos do evento
                          setEditingEvent(event)
                          setShowEventModal(true)
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
                    <div className="event-header-badges">
                      <div 
                        className="event-type-badge" 
                        style={{ backgroundColor: eventType.color }}
                      >
                        {eventType.name}
                      </div>
                      {event.status && (
                        <div 
                          className={`event-status-badge agenda-status-${event.status}`}
                        >
                          {event.status === 'confirmada' && <FontAwesomeIcon icon={faCheckCircle} />}
                          {event.status === 'agendada' && <FontAwesomeIcon icon={faCalendarAlt} />}
                          {event.status === 'cancelada' && <FontAwesomeIcon icon={faTimes} />}
                          {event.status === 'concluida' && <FontAwesomeIcon icon={faCheckCircle} />}
                          {event.status === 'link' && <FontAwesomeIcon icon={faLink} />}
                          <span>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                        </div>
                      )}
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
        </>
        )}
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

      {/* Modal de Nova Consulta / Gerar Link */}
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
          showError={showError}
          showSuccess={showSuccess}
          isGerarLink={isGerarLink}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
            setIsGerarLink(false)
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onReload={fetchConsultas}
          onEventUpdated={(updatedEvent) => {
            if (updatedEvent && updatedEvent.id) {
              setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))
            }
          }}
          setEditingEvent={setEditingEvent}
          onSendSMS={handleSendSMS}
          onSolicitarConfirmacao={handleSolicitarConfirmacao}
          solicitandoConfirmacaoId={solicitandoConfirmacaoId}
          isTodayOrTomorrow={isTodayOrTomorrow}
          selectedClinicData={selectedClinicData}
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

      {/* Modal de Link Gerado */}
      {showLinkModal && linkGerado && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-link-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-link-header">
              <div className="link-success-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <h2>Link Gerado com Sucesso!</h2>
              <p>Compartilhe este link com o paciente para que ele possa se cadastrar e confirmar o agendamento.</p>
            </div>
            <div className="modal-link-body">
              <label>Link do Agendamento:</label>
              <div className="link-display-wrapper">
                <input 
                  type="text" 
                  value={linkGerado} 
                  readOnly 
                  className="link-input"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(linkGerado)
                    showSuccess('Link copiado')
                  }}
                  className="btn-copy-link"
                >
                  <FontAwesomeIcon icon={faIdCard} />
                  Copiar
                </button>
              </div>
              
              {/* Campo para nome, telefone e botão de enviar SMS */}
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                  <FontAwesomeIcon icon={faPhone} style={{ marginRight: '0.5rem' }} />
                  Enviar SMS (opcional)
                </label>
                
                {/* Campo de Nome */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Nome do paciente"
                    className="link-input"
                    value={smsNomeModal}
                    onChange={(e) => setSmsNomeModal(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                {/* Campo de Telefone com máscara */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <input
                    type="tel"
                    placeholder="+55 (11) 99999-9999"
                    className="link-input"
                    value={smsTelefoneModal}
                    onChange={(e) => {
                      const value = e.target.value
                      // Formatar telefone com máscara +55 (XX) XXXXX-XXXX
                      const numbers = value.replace(/\D/g, '')
                      
                      // Se começar com 55, remove para não duplicar
                      let cleaned = numbers.startsWith('55') ? numbers.slice(2) : numbers
                      
                      // Limita a 11 dígitos (DDD + número)
                      cleaned = cleaned.slice(0, 11)
                      
                      // Aplica máscara
                      let formatted = ''
                      if (cleaned.length === 0) {
                        formatted = ''
                      } else if (cleaned.length <= 2) {
                        formatted = `+55 (${cleaned}`
                      } else if (cleaned.length <= 7) {
                        formatted = `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
                      } else {
                        formatted = `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
                      }
                      
                      setSmsTelefoneModal(formatted)
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && smsTelefoneModal.trim() && smsNomeModal.trim() && consultaGeradaData) {
                        handleSendSMSFromModal()
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={handleSendSMSFromModal}
                    className="btn-send-sms"
                    style={{ whiteSpace: 'nowrap' }}
                    disabled={!smsTelefoneModal.trim() || !smsNomeModal.trim()}
                  >
                    <FontAwesomeIcon icon={faComment} />
                    Enviar SMS
                  </button>
                </div>
                <small style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Digite o nome e telefone do paciente para enviar o link por SMS
                </small>
              </div>
            </div>
            <div className="modal-link-footer">
              <button onClick={() => {
                setShowLinkModal(false)
                setLinkGerado('')
                setConsultaGeradaData(null)
                setSmsNomeModal('')
                setSmsTelefoneModal('')
              }} className="btn-close-link">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
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
const NewEventModal = ({ eventTypes, selectedDate, events, editingEvent, setEditingEvent, clientes, setClientes, profissionais, currentUser, showError, showSuccess, isGerarLink = false, onClose, onSave, onDelete, onReload, onEventUpdated, onSendSMS, onSolicitarConfirmacao, solicitandoConfirmacaoId, isTodayOrTomorrow, selectedClinicData }) => {
  
  // Estado para controlar se está em modo edição ou visualização
  const [isEditing, setIsEditing] = useState(!editingEvent)
  
  // Estado para telefone e nome quando for enviar SMS de link
  const [smsTelefoneLink, setSmsTelefoneLink] = useState('')
  const [smsNomeLink, setSmsNomeLink] = useState('')
  const [sendingSMSLink, setSendingSMSLink] = useState(false)
  
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
    notes: editingEvent ? editingEvent.notes || '' : '',
    status: editingEvent ? editingEvent.status || 'agendada' : 'agendada'
  })
  
  // Função para formatar data em português
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Função para formatar hora
  const formatTime = (timeString) => {
    if (!timeString) return '-'
    // Se vier no formato HH:MM:SS, pegar apenas HH:MM
    const time = timeString.split(':').slice(0, 2).join(':')
    return time
  }
  
  // Função para obter label do status
  const getStatusLabel = (status) => {
    const statusMap = {
      'agendada': 'Agendada',
      'confirmada': 'Confirmada',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada',
      'link': 'Link'
    }
    return statusMap[status] || status
  }
  
  // Função para obter cor do status
  const getStatusColor = (status) => {
    const colorMap = {
      'agendada': '#3b82f6',
      'confirmada': '#10b981',
      'concluida': '#8b5cf6',
      'cancelada': '#ef4444',
      'link': '#f59e0b'
    }
    return colorMap[status] || '#6b7280'
  }
  
  // Estados para busca dinâmica de pacientes
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const isModalJustOpened = useRef(false)
  
  // Atualizar formData quando editingEvent mudar
  useEffect(() => {
    if (editingEvent) {
      // Normalizar hora para formato HH:MM (remover segundos se existirem)
      let normalizedTime = editingEvent.time || '09:00'
      if (normalizedTime.includes(':') && normalizedTime.split(':').length === 3) {
        // Se tem segundos (HH:MM:SS), remover
        const [hours, minutes] = normalizedTime.split(':')
        normalizedTime = `${hours}:${minutes}`
      }
      
      setFormData({
        title: editingEvent.title || '',
        date: editingEvent.date 
          ? new Date(editingEvent.date).toISOString().split('T')[0]
          : selectedDate.toISOString().split('T')[0],
        time: normalizedTime,
        typeId: editingEvent.typeId || (eventTypes[0]?.id || ''),
        patientId: editingEvent.patientId || null,
        professionalId: editingEvent.professionalId || null,
        professionalType: editingEvent.professionalType || 'self',
        notes: editingEvent.notes || '',
        status: editingEvent.status || 'agendada'
      })
      // Quando carregar evento existente, começar em modo visualização
      setIsEditing(false)
    } else {
      // Resetar quando não há editingEvent
      setFormData({
        title: '',
        date: selectedDate.toISOString().split('T')[0],
        time: '09:00',
        typeId: eventTypes[0]?.id || '',
        patientId: null,
        professionalId: null,
        professionalType: 'self',
        notes: '',
        status: 'agendada'
      })
      // Quando não há editingEvent, resetar para modo edição (criar novo)
      setIsEditing(true)
    }
  }, [editingEvent, selectedDate, eventTypes])
  
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
      // Normalizar hora para formato HH:MM (remover segundos se existirem)
      let normalizedTime = editingEvent.time || '09:00'
      if (normalizedTime.includes(':') && normalizedTime.split(':').length === 3) {
        // Se tem segundos (HH:MM:SS), remover
        const [hours, minutes] = normalizedTime.split(':')
        normalizedTime = `${hours}:${minutes}`
      }
      
      setFormData({
        title: editingEvent.title || '',
        date: new Date(editingEvent.date).toISOString().split('T')[0],
        time: normalizedTime,
        typeId: editingEvent.typeId || (eventTypes[0]?.id || ''),
        patientId: editingEvent.patientId || null,
        professionalId: editingEvent.professionalId || null,
        professionalType: editingEvent.professionalType || 'self',
        notes: editingEvent.notes || '',
        status: editingEvent.status || 'agendada'
      })
      
      // Preencher searchTerm com o nome do paciente se estiver editando
      if (editingEvent.patientId) {
        // Primeiro tentar encontrar na lista de clientes
        let paciente = clientes.find(c => c.id === editingEvent.patientId || String(c.id) === String(editingEvent.patientId))
        
        // Se não encontrou e tem patientData no editingEvent, usar ele e adicionar à lista
        if (!paciente && editingEvent.patientData) {
          paciente = editingEvent.patientData
          // Adicionar à lista de clientes se não estiver lá
          if (!clientes.find(c => c.id === paciente.id || String(c.id) === String(paciente.id))) {
            setClientes(prev => [...prev, paciente])
          }
        }
        
        if (paciente) {
          setSearchTerm(paciente.nome + (paciente.cpf ? ` (${paciente.cpf})` : ''))
        } else {
          // Se não encontrou, usar apenas o ID ou nome genérico
          setSearchTerm('Paciente selecionado')
        }
      } else {
        setSearchTerm('')
      }
      // Resetar flag quando está editando
      isModalJustOpened.current = false
    } else {
      // Quando não está editando (criando novo evento), limpar apenas na primeira vez que o modal abre
      if (!isModalJustOpened.current) {
        isModalJustOpened.current = true
        setSearchTerm('')
        setSearchResults([])
        setShowSearchResults(false)
      }
    }
  }, [editingEvent, eventTypes])
  
  // Resetar flag quando o componente é desmontado (modal fecha)
  useEffect(() => {
    return () => {
      isModalJustOpened.current = false
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validar todos os campos obrigatórios
    if (!formData.typeId || formData.typeId.trim() === '') {
      showError('Selecione um tipo de consulta/tratamento')
      return
    }

    // Só validar paciente se não for gerar link
    if (!isGerarLink && !formData.patientId) {
      showError('Selecione um paciente')
      return
    }
    
    if (!formData.date || formData.date.trim() === '') {
      showError('Selecione uma data')
      return
    }
    
    if (!formData.time || formData.time.trim() === '') {
      showError('Informe a hora da consulta')
      return
    }
    
    // Validar formato da hora
    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      showError('Informe uma hora válida no formato HH:MM (ex: 09:00)')
      return
    }
    
    // Validar se selecionou profissional quando escolheu "Outro Profissional"
    if (formData.professionalType === 'professional' && !formData.professionalId) {
      showError('Selecione um profissional ou escolha "Eu" como responsável')
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

    // Normalizar hora para formato HH:MM (remover segundos se existirem)
    let normalizedTime = formData.time || '09:00'
    if (normalizedTime.includes(':') && normalizedTime.split(':').length === 3) {
      // Se tem segundos (HH:MM:SS), remover
      const [hours, minutes] = normalizedTime.split(':')
      normalizedTime = `${hours}:${minutes}`
    }
    
    const eventData = {
      title: formData.title || `${eventTypes.find(t => t.id === formData.typeId || t.id === String(formData.typeId))?.name || 'Consulta'}${!isGerarLink ? ` - ${patientName}` : ''}`,
      date: eventDate,
      time: normalizedTime,
      typeId: formData.typeId, // UUID, não precisa de parseInt
      patient: !isGerarLink ? patientName : null,
      patientId: !isGerarLink ? formData.patientId : null, // UUID, não precisa de parseInt - null quando gerar link
      professional: professionalName,
      professionalId: professionalId,
      professionalType: formData.professionalType,
      notes: formData.notes,
      status: isGerarLink ? 'link' : (formData.status || 'agendada')
    }

    
    try {
      onSave(eventData)
    } catch (error) {
      console.error('Erro ao chamar onSave:', error)
      showError('Erro ao processar formulário. Verifique o console.')
    }
  }

  // Estado para status em edição rápida
  const [quickStatusEdit, setQuickStatusEdit] = useState(null)
  const [savingStatus, setSavingStatus] = useState(false)

  // Obter dados do evento para visualização
  const getEventType = () => {
    if (!editingEvent) return null
    return eventTypes.find(t => t.id === editingEvent.typeId || t.id === String(editingEvent.typeId))
  }
  
  const getPatient = () => {
    if (!editingEvent || !editingEvent.patientId) return null
    // Priorizar dados do paciente que vêm diretamente da API (mais completos)
    if (editingEvent.patientData) {
      return editingEvent.patientData
    }
    // Fallback: buscar na lista de clientes
    return clientes.find(c => c.id === editingEvent.patientId || c.id === String(editingEvent.patientId))
  }
  
  const getProfessional = () => {
    if (!editingEvent) return null
    if (editingEvent.professionalId) {
      return profissionais.find(p => p.id === editingEvent.professionalId || p.id === String(editingEvent.professionalId))
    }
    return { nome: currentUser?.name || currentUser?.email || 'Você' }
  }

  // Função para formatar telefone para envio (apenas números com 55, sem +)
  const formatPhoneForAPI = (phone) => {
    // Remove tudo que não é número
    let numbers = phone.replace(/\D/g, '')
    
    // Se não começar com 55, adicionar
    if (!numbers.startsWith('55')) {
      // Remover zeros à esquerda se houver
      numbers = numbers.replace(/^0+/, '')
      numbers = '55' + numbers
    }
    
    // Retornar apenas números (sem o +) - formato esperado pela API: "5511965899998"
    return numbers
  }

  // Função para enviar SMS quando status for "link"
  const handleSendSMSLink = async () => {
    if (!smsTelefoneLink.trim()) {
      showError('Por favor, informe o telefone para enviar SMS')
      return
    }

    if (!smsNomeLink.trim()) {
      showError('Por favor, informe o nome do paciente para enviar SMS')
      return
    }

    if (!editingEvent) {
      showError('Erro: dados da consulta não encontrados')
      return
    }

    try {
      setSendingSMSLink(true)
      
      // Preparar dados para a API
      const dateStr = editingEvent.date instanceof Date
        ? `${editingEvent.date.getFullYear()}-${String(editingEvent.date.getMonth() + 1).padStart(2, '0')}-${String(editingEvent.date.getDate()).padStart(2, '0')}`
        : editingEvent.date.split('T')[0]

      // Normalizar hora para HH:MM
      let horaConsulta = editingEvent.time
      if (horaConsulta && horaConsulta.includes(':') && horaConsulta.split(':').length === 3) {
        const [hours, minutes] = horaConsulta.split(':')
        horaConsulta = `${hours}:${minutes}`
      }

      // Formatar telefone para envio (com +55)
      const telefoneFormatado = formatPhoneForAPI(smsTelefoneLink)
      const link = `${window.location.origin}/agendamento/${editingEvent.id}`
      
      const consultaData = {
        telefone: telefoneFormatado,
        nome: smsNomeLink.trim(),
        typeId: editingEvent.typeId,
        date: dateStr,
        time: horaConsulta,
        consultaId: editingEvent.id,
        link: link
      }

      await onSendSMS(consultaData)
      
      // Limpar os campos após envio bem-sucedido
      setSmsTelefoneLink('')
      setSmsNomeLink('')
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
      // O erro já é tratado na função onSendSMS
    } finally {
      setSendingSMSLink(false)
    }
  }

  // Normaliza hora para HH:MM (API exige esse formato)
  const toHHMM = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return '09:00'
    const parts = timeStr.trim().split(':')
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0')
      const m = parts[1].padStart(2, '0')
      return `${h}:${m}`
    }
    return '09:00'
  }

  // Função para atualizar apenas o status
  const handleQuickStatusUpdate = async (newStatus) => {
    if (!editingEvent || savingStatus) return
    
    try {
      setSavingStatus(true)
      
      // Preparar dados para atualizar apenas o status
      const dateStr = editingEvent.date instanceof Date
        ? `${editingEvent.date.getFullYear()}-${String(editingEvent.date.getMonth() + 1).padStart(2, '0')}-${String(editingEvent.date.getDate()).padStart(2, '0')}`
        : editingEvent.date.split('T')[0]
      
      const payload = {
        tipoConsultaId: editingEvent.typeId,
        ...(editingEvent.patientId !== null && { pacienteId: editingEvent.patientId }),
        profissionalId: editingEvent.professionalId || null,
        titulo: editingEvent.title || null,
        dataConsulta: dateStr,
        horaConsulta: toHHMM(editingEvent.time),
        observacoes: editingEvent.notes || null,
        status: newStatus
      }

      const response = await api.put(`/calendario/consultas/alterar/${editingEvent.id}`, payload)
      
      // Atualizar estado com o retorno da API (status e demais campos)
      const consulta = response?.data?.data?.data?.consulta || response?.data?.data?.consulta || response?.data?.consulta
      if (consulta) {
        const [y, m, d] = (consulta.data_consulta || '').split('-').map(Number)
        const tipo = consulta.tipo_consulta || {}
        const updatedEvent = {
          id: consulta.id,
          title: consulta.titulo || editingEvent.title,
          date: y && m && d ? new Date(y, m - 1, d) : editingEvent.date,
          time: consulta.hora_consulta || editingEvent.time,
          typeId: tipo.id || consulta.tipo_consulta_id || editingEvent.typeId,
          patient: (consulta.paciente && consulta.paciente.nome) || consulta.paciente_nome || editingEvent.patient,
          patientId: ((consulta.paciente && consulta.paciente.id) || consulta.paciente_id) ?? editingEvent.patientId,
          professional: (consulta.profissional && consulta.profissional.nome) || consulta.profissional_nome || editingEvent.professional,
          professionalId: ((consulta.profissional && consulta.profissional.id) || consulta.profissional_id) ?? editingEvent.professionalId,
          professionalType: editingEvent.professionalType,
          notes: consulta.observacoes ?? editingEvent.notes,
          status: consulta.status ?? newStatus
        }
        setEditingEvent(updatedEvent)
        if (onEventUpdated) onEventUpdated(updatedEvent)
      } else {
        setEditingEvent(prev => prev ? { ...prev, status: newStatus } : null)
        if (onEventUpdated) onEventUpdated({ ...editingEvent, status: newStatus })
      }
      setQuickStatusEdit(null)
      showSuccess('Status atualizado com sucesso!')
      
      if (onReload) {
        await onReload()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status. Tente novamente.')
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content-event ${isGerarLink ? 'modal-gerar-link' : ''} ${editingEvent && !isEditing ? 'modal-view-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-event">
          <div className="modal-header-content">
            <div className="modal-header-icon">
              <FontAwesomeIcon icon={isGerarLink ? faLink : faCalendarAlt} />
            </div>
            <div className="modal-header-text">
              <h2>
                {editingEvent && !isEditing ? 'Detalhes da Consulta' : (editingEvent ? 'Editar Consulta' : (isGerarLink ? 'Gerar Link de Agendamento' : 'Nova Consulta'))}
              </h2>
              {isGerarLink && (
                <p className="modal-subtitle">Crie um link para que pacientes possam agendar esta consulta</p>
              )}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Modo Visualização - quando editingEvent existe e não está editando */}
        {editingEvent && !isEditing ? (
          <div className="event-view-mode">
            <div className="event-view-header">
              <div className="event-view-type-badge" style={{ backgroundColor: getEventType()?.color || '#6b7280' }}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>{getEventType()?.name || 'Consulta'}</span>
              </div>
              <div className="event-view-status-selector">
                {quickStatusEdit === editingEvent.id ? (
                  <select
                    value={editingEvent.status || 'agendada'}
                    onChange={(e) => handleQuickStatusUpdate(e.target.value)}
                    onBlur={() => setQuickStatusEdit(null)}
                    disabled={savingStatus}
                    className="event-view-status-select"
                    style={{ backgroundColor: getStatusColor(editingEvent.status || 'agendada') }}
                    autoFocus
                  >
                    <option value="agendada">Agendada</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="link">Link</option>
                  </select>
                ) : (
                  <div 
                    className="event-view-status-badge" 
                    style={{ backgroundColor: getStatusColor(editingEvent.status || 'agendada') }}
                    onClick={() => setQuickStatusEdit(editingEvent.id)}
                    title="Clique para alterar o status"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{getStatusLabel(editingEvent.status || 'agendada')}</span>
                    <FontAwesomeIcon icon={faEdit} style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }} />
                  </div>
                )}
              </div>
            </div>

            <div className="event-view-content">
              <div className="event-view-section">
                {/* Data e Hora agrupadas */}
                <div className="event-view-item event-view-item-grouped">
                  <div className="event-view-label">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>Data e Hora</span>
                  </div>
                  <div className="event-view-value-grouped">
                    <div className="event-view-value-item">
                      <span className="event-view-value-label">Data:</span>
                      <span className="event-view-value-text">{formatDate(editingEvent.date)}</span>
                    </div>
                    <div className="event-view-value-item">
                      <span className="event-view-value-label">Hora:</span>
                      <span className="event-view-value-text">{formatTime(editingEvent.time)}</span>
                    </div>
                  </div>
                </div>

                {/* Informações do Paciente agrupadas */}
                {editingEvent.patientId && getPatient() && (
                  <div className="event-view-item event-view-item-grouped">
                    <div className="event-view-label">
                      <FontAwesomeIcon icon={faUser} />
                      <span>Paciente</span>
                    </div>
                    <div className="event-view-value-grouped">
                      <div className="event-view-value-item">
                        <span className="event-view-value-label">Nome:</span>
                        <span className="event-view-value-text">
                          {getPatient()?.nome || 'Não informado'}
                          {getPatient()?.cpf && (
                            <span className="event-view-subvalue"> ({getPatient().cpf})</span>
                          )}
                        </span>
                      </div>
                      {getPatient()?.email && (
                        <div className="event-view-value-item">
                          <span className="event-view-value-label">Email:</span>
                          <span className="event-view-value-text">{getPatient().email}</span>
                        </div>
                      )}
                      {getPatient()?.telefone && (
                        <div className="event-view-value-item">
                          <span className="event-view-value-label">Telefone:</span>
                          <span className="event-view-value-text">{getPatient().telefone}</span>
                        </div>
                      )}
                      {/* Botão Enviar SMS - aparece quando status é "link" */}
                      {editingEvent.status === 'link' && getPatient()?.telefone && onSendSMS && (
                        <div className="event-view-value-item" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <button
                            type="button"
                            onClick={async () => {
                              const consultaData = {
                                telefone: getPatient().telefone,
                                nome: getPatient().nome,
                                typeId: editingEvent.typeId,
                                date: editingEvent.date,
                                time: editingEvent.time,
                                consultaId: editingEvent.id,
                                link: `${window.location.origin}/agendamento/${editingEvent.id}`
                              }
                              await onSendSMS(consultaData)
                            }}
                            className="btn-send-sms"
                          >
                            <FontAwesomeIcon icon={faComment} />
                            Enviar SMS
                          </button>
                        </div>
                      )}
                      
                      {/* Botão Pedir Confirmação - aparece quando status é "agendada" e data é hoje ou amanhã */}
                      {editingEvent.patientId && 
                       editingEvent.status === 'agendada' &&
                       onSolicitarConfirmacao && 
                       isTodayOrTomorrow(editingEvent.date) && (
                        <div className="event-view-value-item" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <button
                            type="button"
                            onClick={() => onSolicitarConfirmacao(editingEvent.id)}
                            className="btn-solicitar-confirmacao"
                            disabled={solicitandoConfirmacaoId === editingEvent.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.625rem 1rem',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: solicitandoConfirmacaoId === editingEvent.id ? 'wait' : 'pointer',
                              opacity: solicitandoConfirmacaoId === editingEvent.id ? 0.85 : 1,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {solicitandoConfirmacaoId === editingEvent.id ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faBell} />
                                Pedir Confirmação
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {getProfessional() && (
                  <div className="event-view-item">
                    <div className="event-view-label">
                      <FontAwesomeIcon icon={faUserMd} />
                      <span>Profissional</span>
                    </div>
                    <div className="event-view-value">
                      {getProfessional()?.nome || getProfessional()?.name || getProfessional()?.user?.nome || currentUser?.name || currentUser?.email || 'Não informado'}
                    </div>
                  </div>
                )}

                {editingEvent.title && (
                  <div className="event-view-item">
                    <div className="event-view-label">
                      <FontAwesomeIcon icon={faStickyNote} />
                      <span>Título</span>
                    </div>
                    <div className="event-view-value">
                      {editingEvent.title}
                    </div>
                  </div>
                )}

                {editingEvent.notes && (
                  <div className="event-view-item event-view-item-full">
                    <div className="event-view-label">
                      <FontAwesomeIcon icon={faStickyNote} />
                      <span>Observações</span>
                    </div>
                    <div className="event-view-value">
                      {editingEvent.notes}
                    </div>
                  </div>
                )}

                {!editingEvent.patientId && (
                  <div className="event-view-item event-view-item-full">
                    <div className="event-view-label">
                      <FontAwesomeIcon icon={faLink} />
                      <span>Link do Agendamento</span>
                    </div>
                    <div className="event-view-link-wrapper">
                      <input 
                        type="text" 
                        value={`${window.location.origin}/agendamento/${editingEvent.id}`} 
                        readOnly 
                        className="event-view-link-input"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const link = `${window.location.origin}/agendamento/${editingEvent.id}`
                          navigator.clipboard.writeText(link)
                          showSuccess('Link copiado')
                        }}
                        className="event-view-link-btn"
                      >
                        <FontAwesomeIcon icon={faIdCard} />
                        Copiar
                      </button>
                    </div>
                    
                    {/* Opção de enviar SMS quando status for "link" */}
                    {editingEvent.status === 'link' && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                          <FontAwesomeIcon icon={faPhone} style={{ marginRight: '0.5rem' }} />
                          Enviar Link por SMS
                        </label>
                        
                        {/* Campo de Nome */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <input
                            type="text"
                            placeholder="Nome do paciente"
                            className="event-view-link-input"
                            value={smsNomeLink}
                            onChange={(e) => setSmsNomeLink(e.target.value)}
                            style={{ width: '100%' }}
                            disabled={sendingSMSLink}
                          />
                        </div>
                        
                        {/* Campo de Telefone com máscara */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <input
                            type="tel"
                            placeholder="+55 (11) 99999-9999"
                            className="event-view-link-input"
                            value={smsTelefoneLink}
                            onChange={(e) => {
                              const value = e.target.value
                              // Formatar telefone com máscara +55 (XX) XXXXX-XXXX
                              const numbers = value.replace(/\D/g, '')
                              
                              // Se começar com 55, remove para não duplicar
                              let cleaned = numbers.startsWith('55') ? numbers.slice(2) : numbers
                              
                              // Limita a 11 dígitos (DDD + número)
                              cleaned = cleaned.slice(0, 11)
                              
                              // Aplica máscara
                              let formatted = ''
                              if (cleaned.length === 0) {
                                formatted = ''
                              } else if (cleaned.length <= 2) {
                                formatted = `+55 (${cleaned}`
                              } else if (cleaned.length <= 7) {
                                formatted = `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
                              } else {
                                formatted = `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
                              }
                              
                              setSmsTelefoneLink(formatted)
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && smsTelefoneLink.trim() && smsNomeLink.trim()) {
                                handleSendSMSLink()
                              }
                            }}
                            style={{ flex: 1 }}
                            disabled={sendingSMSLink}
                          />
                          <button
                            type="button"
                            onClick={handleSendSMSLink}
                            className="btn-send-sms"
                            disabled={sendingSMSLink || !smsTelefoneLink.trim() || !smsNomeLink.trim()}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            {sendingSMSLink ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faComment} />
                                Enviar SMS
                              </>
                            )}
                          </button>
                        </div>
                        <small style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Digite o nome e telefone do paciente para enviar o link por SMS
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="event-view-actions">
              <button 
                type="button" 
                className="btn-cancel-view" 
                onClick={onClose}
              >
                <FontAwesomeIcon icon={faTimes} />
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-edit-event" 
                onClick={() => setIsEditing(true)}
              >
                <FontAwesomeIcon icon={faEdit} />
                Editar
              </button>
              <button 
                type="button" 
                className="btn-delete-event" 
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
                    onDelete(editingEvent.id)
                  }
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        ) : (
          /* Modo Edição/Criação - formulário */
          <form className="event-form" onSubmit={handleSubmit}>
          {isGerarLink && (
            <div className="form-info-banner">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>O paciente poderá se cadastrar através do link gerado</span>
            </div>
          )}
          
          <div className="form-section-title">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Informações da Consulta</span>
          </div>
          
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faStickyNote} />
              Tipo de Consulta/Tratamento *
            </label>
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
              <label>
                <FontAwesomeIcon icon={faCalendarAlt} />
                Data *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faClock} />
                Hora *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="form-input"
              />
            </div>
          </div>

          {!isGerarLink && (
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faUser} />
              Paciente/Cliente *
            </label>
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
              // Primeiro tentar encontrar na lista de clientes
              let selectedPatient = clientes.find(c => 
                c.id === formData.patientId || 
                String(c.id) === String(formData.patientId)
              )
              
              // Se não encontrou na lista, tentar buscar no editingEvent.patientData
              if (!selectedPatient && editingEvent?.patientData) {
                // Verificar se o ID do patientData corresponde ao patientId
                if (editingEvent.patientData.id === formData.patientId || 
                    String(editingEvent.patientData.id) === String(formData.patientId)) {
                  selectedPatient = editingEvent.patientData
                }
              }
              
              // Se ainda não encontrou, tentar buscar nos resultados da busca
              if (!selectedPatient && searchResults.length > 0) {
                selectedPatient = searchResults.find(p => 
                  p.id === formData.patientId || 
                  String(p.id) === String(formData.patientId)
                )
              }
              
              // Se ainda não encontrou, tentar extrair do searchTerm
              if (!selectedPatient && searchTerm) {
                const match = searchTerm.match(/^([^(]+)/)
                const patientName = match ? match[1].trim() : searchTerm
                
                return (
                  <div className="selected-patient-info">
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                    <span>Paciente selecionado: {patientName || 'Paciente'}</span>
                  </div>
                )
              }
              
              // Se encontrou o paciente, mostrar dados completos
              if (selectedPatient) {
                return (
                  <div className="selected-patient-info">
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>
                        {selectedPatient.nome || 'Paciente'}
                        {selectedPatient.cpf && (
                          <span style={{ marginLeft: '0.5rem', opacity: 0.8, fontSize: '0.875rem' }}>
                            ({selectedPatient.cpf})
                          </span>
                        )}
                      </span>
                      {(selectedPatient.email || selectedPatient.telefone) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', fontSize: '0.8125rem', opacity: 0.9 }}>
                          {selectedPatient.email && (
                            <span>
                              <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '0.375rem', fontSize: '0.75rem' }} />
                              {selectedPatient.email}
                            </span>
                          )}
                          {selectedPatient.telefone && (
                            <span>
                              <FontAwesomeIcon icon={faPhone} style={{ marginRight: '0.375rem', fontSize: '0.75rem' }} />
                              {selectedPatient.telefone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              
              // Fallback final
              return (
                <div className="selected-patient-info">
                  <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                  <span>Paciente selecionado</span>
                </div>
              )
            })()}
          </div>
          )}

          <div className="form-section-title">
            <FontAwesomeIcon icon={faUserMd} />
            <span>Profissional Responsável</span>
          </div>
          
          <div className="form-group">
            <label>Selecione o profissional responsável</label>
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

          <div className="form-section-title">
            <FontAwesomeIcon icon={faStickyNote} />
            <span>Informações Adicionais</span>
          </div>
          
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faEdit} />
              Título da Consulta
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Deixe em branco para gerar automaticamente"
              className="form-input"
            />
          </div>

          {editingEvent && (
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faCheckCircle} />
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="form-select"
              >
                <option value="agendada">Agendada</option>
                <option value="confirmada">Confirmada</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faStickyNote} />
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre a consulta..."
              rows="4"
              className="form-textarea"
            />
          </div>

          {editingEvent && !editingEvent.patientId && (
            <div className="link-display-section">
              <div className="link-display-content">
                <label>
                  <FontAwesomeIcon icon={faLink} />
                  Link do Agendamento
                </label>
                <div className="link-display-wrapper">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/agendamento/${editingEvent.id}`} 
                    readOnly 
                    className="link-input"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/agendamento/${editingEvent.id}`
                      navigator.clipboard.writeText(link)
                      showSuccess('Link copiado')
                    }}
                    className="btn-copy-link"
                  >
                    <FontAwesomeIcon icon={faIdCard} />
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          )}

            <div className="form-actions">
              {editingEvent && (
                <button 
                  type="button" 
                  className="btn-delete-event" 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
                      onDelete(editingEvent.id)
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Excluir
                </button>
              )}
              <button type="button" className="btn-cancel" onClick={() => {
                if (editingEvent) {
                  setIsEditing(false)
                } else {
                  onClose()
                }
              }}>
                {editingEvent ? 'Cancelar Edição' : 'Cancelar'}
              </button>
              <button type="submit" className="btn-save">
                {editingEvent ? 'Salvar Alterações' : (isGerarLink ? 'Gerar Link' : 'Criar Consulta')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Calendario
