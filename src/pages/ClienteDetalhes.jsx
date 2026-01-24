import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faEdit, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faIdCard,
  faStethoscope, faHistory, faPlus, faFileMedical,
  faCheckCircle, faClock, faTimesCircle, faExclamationTriangle,
  faXRay, faEye, faCheck, faTrash, faSave, faTimes
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import exameImage from '../img/exame.jpg'
import './ClienteDetalhes.css'

const ClienteDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, selectedClinicData, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Hook para modal de alerta
  const { alertConfig, showError, hideAlert } = useAlert()
  
  const [cliente, setCliente] = useState(null)
  const [historico, setHistorico] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNecessidadesModal, setShowNecessidadesModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [novaNecessidade, setNovaNecessidade] = useState('')
  const [novoStatus, setNovoStatus] = useState('')
  const [necessidadesRadiografias, setNecessidadesRadiografias] = useState([])
  const [isEditingNecessidades, setIsEditingNecessidades] = useState(false)
  const [editedNecessidades, setEditedNecessidades] = useState([])
  const [radiografiasCompletas, setRadiografiasCompletas] = useState({})

  useEffect(() => {
    loadCliente()
    loadHistorico()
  }, [id])

  // Carregar radiografias quando o cliente for carregado
  useEffect(() => {
    if (cliente) {
      loadRadiografias(cliente)
    } else {
      // Tentar carregar mesmo sem cliente (pode ter radiografias por ID)
      loadRadiografias({ id: parseInt(id) })
    }
  }, [cliente, id])

  const loadCliente = async () => {
    try {
      // Fazer GET para buscar dados do paciente
      const response = await api.get(`/pacientes/${id}`)
      const paciente = response.data?.data || response.data
      
      if (paciente) {
        // Normalizar dados do paciente para o formato esperado
        // A API retorna os dados diretamente no objeto, não aninhados
        const clienteNormalizado = {
          id: paciente.id,
          nome: paciente.nome || '',
          email: paciente.email || '',
          telefone: paciente.telefone || '',
          cpf: paciente.cpf || '',
          dataNascimento: paciente.dataNascimento || '',
          endereco: {
            rua: paciente.rua || '',
            numero: paciente.numero || '',
            complemento: paciente.complemento || '',
            bairro: paciente.bairro || '',
            cidade: paciente.cidade || '',
            estado: paciente.estado || '',
            cep: paciente.cep || ''
          },
          status: paciente.status || 'avaliacao-realizada',
          necessidades: (() => {
            // Verificar se necessidades está em informacoesClinicas ou diretamente no paciente
            const necessidadesRaw = paciente.informacoesClinicas?.necessidades || paciente.necessidades
            
            if (!necessidadesRaw) return []
            
            // Se for array, normalizar cada item para string
            if (Array.isArray(necessidadesRaw)) {
              return necessidadesRaw.map(nec => {
                // Se o item já é uma string, retornar
                if (typeof nec === 'string') return nec
                // Se for um array, juntar com vírgula
                if (Array.isArray(nec)) return nec.join(', ')
                // Se for objeto, tentar converter para string
                if (typeof nec === 'object' && nec !== null) {
                  return JSON.stringify(nec)
                }
                // Caso contrário, converter para string
                return String(nec)
              })
            }
            
            // Se for string, retornar como array
            if (typeof necessidadesRaw === 'string' && necessidadesRaw.trim()) {
              // Tentar fazer parse se for JSON
              try {
                const parsed = JSON.parse(necessidadesRaw)
                if (Array.isArray(parsed)) {
                  return parsed.map(nec => typeof nec === 'string' ? nec : String(nec))
                }
              } catch (e) {
                // Não é JSON, retornar como string única
                return [necessidadesRaw]
              }
              return [necessidadesRaw]
            }
            
            return []
          })(),
          observacoes: paciente.observacoes || '',
          createdAt: paciente.createdAt || new Date().toISOString()
        }
        
        setCliente(clienteNormalizado)
      } else {
        showError('Paciente não encontrado')
        navigate('/app/clientes')
      }
    } catch (error) {
      console.error('Erro ao carregar paciente:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao carregar dados do paciente.'
      showError(errorMessage)
      navigate('/app/clientes')
    } finally {
      setLoading(false)
    }
  }

  const mapCampoAlteradoToTipo = (campoAlterado) => {
    const campoMap = {
      'status': 'status',
      'necessidades': 'necessidade',
      'informacoesClinicas.necessidades': 'necessidade',
      'observacoes': 'observacao',
      'informacoesClinicas.observacoes': 'observacao',
      'email': 'observacao',
      'telefone': 'observacao',
      'cpf': 'observacao',
      'dataNascimento': 'observacao',
      'nome': 'observacao',
      'endereco': 'observacao'
    }
    return campoMap[campoAlterado] || 'observacao'
  }

  // Função para limpar valores JSON e formatar de forma legível
  const limparValorJson = (valor) => {
    if (!valor) return ''
    
    // Se for string que parece JSON array, converter para lista legível
    let valorLimpo = valor.toString()
    
    // Remover aspas extras e colchetes de JSON
    valorLimpo = valorLimpo.replace(/^\[|\]$/g, '') // Remove [ e ] do início e fim
    valorLimpo = valorLimpo.replace(/^"|"$/g, '') // Remove aspas do início e fim
    valorLimpo = valorLimpo.replace(/","/g, ', ') // Substitui "," por ", "
    valorLimpo = valorLimpo.replace(/"/g, '') // Remove aspas restantes
    
    return valorLimpo.trim()
  }

  const formatarDescricaoHistorico = (item, clienteAtual) => {
    const descricao = item.descricaoAlteracao || ''
    const campoAlterado = item.campoAlterado || ''
    
    // Mapear nome do campo para português
    const nomeCampo = {
      'nome': 'Nome do paciente',
      'email': 'Email',
      'telefone': 'Telefone',
      'cpf': 'CPF',
      'status': 'Status',
      'necessidades': 'Necessidades',
      'informacoesClinicas.necessidades': 'Necessidades',
      'informacoesClinicas.observacoes': 'Observações',
      'dataNascimento': 'Data de nascimento',
      'endereco': 'Endereço'
    }[campoAlterado] || campoAlterado
    
    // Verificar se a descrição contém "alterado de" e "para"
    if (descricao.toLowerCase().includes('alterado de') && descricao.toLowerCase().includes('para')) {
      // Extrair valores antigo e novo
      const match = descricao.match(/alterado de\s+["']?(.+?)["']?\s+para\s+["']?(.+?)["']?$/i)
      if (match) {
        const valorAntigo = limparValorJson(match[1])
        const valorNovo = limparValorJson(match[2])
        
        // Se for necessidades, verificar se foi adição
        if (campoAlterado === 'necessidades' || campoAlterado === 'informacoesClinicas.necessidades') {
          const itensAntigos = valorAntigo.split(',').map(s => s.trim()).filter(s => s)
          const itensNovos = valorNovo.split(',').map(s => s.trim()).filter(s => s)
          
          if (itensNovos.length > itensAntigos.length) {
            const itensAdicionados = itensNovos.filter(itemNovo => 
              !itensAntigos.some(itemAntigo => itemAntigo === itemNovo)
            )
            if (itensAdicionados.length > 0) {
              return `Necessidade adicionada: "${itensAdicionados.join(', ')}"`
            }
          } else if (itensNovos.length < itensAntigos.length) {
            const itensRemovidos = itensAntigos.filter(itemAntigo => 
              !itensNovos.some(itemNovo => itemNovo === itemAntigo)
            )
            if (itensRemovidos.length > 0) {
              return `Necessidade removida: "${itensRemovidos.join(', ')}"`
            }
          }
        }
        
        // Formato padrão: "Campo alterado de X para Y"
        if (valorAntigo && valorNovo) {
          return `${nomeCampo} alterado de "${valorAntigo}" para "${valorNovo}"`
        } else if (valorNovo) {
          return `${nomeCampo} definido como "${valorNovo}"`
        }
      }
    }
    
    // Limpar a descrição original de possíveis JSONs
    return limparValorJson(descricao) || `${nomeCampo} atualizado`
  }

  const loadHistorico = async () => {
    try {
      // Fazer GET para buscar histórico do paciente
      const response = await api.get(`/pacientes/${id}/historico`)
      // A API pode retornar diretamente um array ou dentro de response.data
      const historicoData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || [])
      
      if (historicoData.length > 0) {
        // Mapear dados da API para o formato esperado pelo componente
        const historicoMapeado = historicoData.map(item => ({
          id: item.id,
          tipo: mapCampoAlteradoToTipo(item.campoAlterado),
          descricao: formatarDescricaoHistorico(item, cliente),
          data: item.dataFormatada || item.createdAt, // Usar dataFormatada se disponível
          dataOriginal: item.createdAt, // Manter createdAt para ordenação se necessário
          usuario: item.nomeAlterador || 'Usuário'
        }))
        
        setHistorico(historicoMapeado)
      } else {
        // Se não houver histórico, definir array vazio
        setHistorico([])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      // Em caso de erro, definir array vazio
      setHistorico([])
    }
  }

  const loadRadiografias = async (clienteData = null) => {
    try {
      // Obter clienteMasterId do contexto (pode estar em diferentes lugares dependendo do tipo de usuário)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.log('clienteMasterId não encontrado')
        setRadiografias([])
        return
      }

      // Buscar radiografias da API filtrando por pacienteId
      const pacienteId = id // O ID do paciente vem da URL
      const response = await api.get(`/radiografias?clienteMasterId=${clienteMasterId}&pacienteId=${pacienteId}`)
      
      const radiografiasData = response.data?.data || response.data || []
      
      // Filtrar radiografias que pertencem ao paciente atual (caso a API não filtre corretamente)
      const radiografiasFiltradas = (Array.isArray(radiografiasData) ? radiografiasData : []).filter(rad => {
        // Verificar se a radiografia pertence ao paciente atual
        const radPacienteId = rad.pacienteId || rad.paciente_id || rad.cliente_id
        // Se não tem pacienteId na radiografia, não mostrar (evitar mostrar radiografias de outros pacientes)
        if (!radPacienteId) return false
        return radPacienteId === pacienteId
      })
      
      // Normalizar dados das radiografias
      const radiografiasNormalizadas = radiografiasFiltradas.map(rad => ({
        id: rad.id,
        radiografia: rad.radiografia || rad.nome || '',
        data: rad.data || '',
        tipoExame: rad.tipoExame || '',
        imagem: rad.imagens?.[0]?.url || exameImage
      }))
      
      // Ordenar por data mais recente primeiro
      radiografiasNormalizadas.sort((a, b) => {
        const dateA = new Date(a.data || 0)
        const dateB = new Date(b.data || 0)
        return dateB - dateA
      })
      
      setRadiografias(radiografiasNormalizadas)
      
      // Buscar necessidades de cada radiografia
      const todasNecessidades = []
      const radiografiasDetalhes = {}
      
      for (const rad of radiografiasNormalizadas) {
        try {
          const radResponse = await api.get(`/radiografias/${rad.id}`)
          const radData = radResponse.data?.data || radResponse.data
          
          // Guardar dados completos da radiografia
          radiografiasDetalhes[rad.id] = radData
          
          if (radData?.necessidades && Array.isArray(radData.necessidades)) {
            radData.necessidades.forEach((nec, index) => {
              if (nec && typeof nec === 'string' && nec.trim()) {
                // Adicionar com referência à radiografia, índice e responsável
                todasNecessidades.push({
                  texto: nec.trim(),
                  origem: 'radiografia',
                  radiografiaId: rad.id,
                  radiografiaNome: rad.radiografia || 'Radiografia',
                  indexOriginal: index,
                  responsavelId: radData.responsavel || radData.responsavelId || null
                })
              }
            })
          }
        } catch (radError) {
          console.error(`Erro ao buscar detalhes da radiografia ${rad.id}:`, radError)
        }
      }
      
      setRadiografiasCompletas(radiografiasDetalhes)
      setNecessidadesRadiografias(todasNecessidades)
    } catch (error) {
      console.error('Erro ao carregar radiografias:', error)
      setRadiografias([])
      setNecessidadesRadiografias([])
    }
  }

  const formatTelefone = (telefone) => {
    if (!telefone) return ''
    const cleaned = telefone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return telefone
  }

  const formatCPF = (cpf) => {
    if (!cpf) return ''
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  const formatCEP = (cep) => {
    if (!cep) return ''
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return cep
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'avaliacao-realizada': 'Avaliação Realizada',
      'em-andamento': 'Em Andamento',
      'aprovado': 'Aprovado',
      'tratamento-concluido': 'Tratamento Concluído',
      'perdido': 'Perdido'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'avaliacao-realizada': '#3b82f6',
      'em-andamento': '#f59e0b',
      'aprovado': '#10b981',
      'tratamento-concluido': '#8b5cf6',
      'perdido': '#ef4444'
    }
    return colorMap[status] || '#6b7280'
  }

  const getStatusIcon = (status) => {
    const iconMap = {
      'avaliacao-realizada': faCheckCircle,
      'em-andamento': faClock,
      'aprovado': faCheckCircle,
      'tratamento-concluido': faCheckCircle,
      'perdido': faTimesCircle
    }
    return iconMap[status] || faExclamationTriangle
  }

  // Iniciar edição de necessidades
  const handleStartEditNecessidades = () => {
    // Criar lista de objetos com origem de cada necessidade
    const necessidadesPaciente = Array.isArray(cliente.necessidades) 
      ? cliente.necessidades.map((n, index) => ({
          texto: typeof n === 'string' ? n : String(n),
          origem: 'paciente',
          indexOriginal: index
        }))
      : []
    
    // Filtrar necessidades de radiografia que não estão no paciente
    const textosJaExistentes = new Set(necessidadesPaciente.map(n => n.texto.toLowerCase().trim()))
    
    const necessidadesRad = necessidadesRadiografias
      .filter(n => !textosJaExistentes.has(n.texto.toLowerCase().trim()))
      .map(n => ({
        texto: n.texto,
        origem: 'radiografia',
        radiografiaId: n.radiografiaId,
        radiografiaNome: n.radiografiaNome,
        indexOriginal: n.indexOriginal,
        responsavelId: n.responsavelId
      }))
    
    // Combinar todas as necessidades (sem duplicatas)
    setEditedNecessidades([...necessidadesPaciente, ...necessidadesRad])
    setIsEditingNecessidades(true)
  }

  // Cancelar edição de necessidades
  const handleCancelEditNecessidades = () => {
    setEditedNecessidades([])
    setIsEditingNecessidades(false)
  }

  // Adicionar nova necessidade (sempre do paciente)
  const handleAddNecessidadeInline = () => {
    setEditedNecessidades([...editedNecessidades, { texto: '', origem: 'paciente', indexOriginal: -1 }])
  }

  // Remover necessidade
  const handleRemoveNecessidade = (index) => {
    setEditedNecessidades(editedNecessidades.filter((_, i) => i !== index))
  }

  // Atualizar texto da necessidade
  const handleUpdateNecessidade = (index, value) => {
    const updated = [...editedNecessidades]
    updated[index] = { ...updated[index], texto: value }
    setEditedNecessidades(updated)
  }

  // Salvar necessidades
  const handleSaveNecessidades = async () => {
    try {
      // Separar necessidades por origem
      const necessidadesPaciente = editedNecessidades
        .filter(n => n.origem === 'paciente' && n.texto && n.texto.trim() !== '')
        .map(n => n.texto.trim())
      
      const necessidadesRadiografia = editedNecessidades
        .filter(n => n.origem === 'radiografia')
      
      // Atualizar necessidades do paciente
      const payload = {
        informacoesClinicas: {
          necessidades: necessidadesPaciente
        }
      }
      await api.put(`/pacientes/${id}`, payload)
      
      // Agrupar necessidades por radiografia
      const necessidadesPorRadiografia = {}
      necessidadesRadiografia.forEach(n => {
        if (!necessidadesPorRadiografia[n.radiografiaId]) {
          necessidadesPorRadiografia[n.radiografiaId] = []
        }
        if (n.texto && n.texto.trim() !== '') {
          necessidadesPorRadiografia[n.radiografiaId].push(n.texto.trim())
        }
      })
      
      // Atualizar cada radiografia que teve necessidades editadas
      for (const radiografiaId of Object.keys(necessidadesPorRadiografia)) {
        try {
          await api.put(`/radiografias/${radiografiaId}`, {
            necessidades: necessidadesPorRadiografia[radiografiaId]
          })
        } catch (radError) {
          console.error(`Erro ao atualizar radiografia ${radiografiaId}:`, radError)
        }
      }
      
      // Atualizar estado local
      setCliente({ ...cliente, necessidades: necessidadesPaciente })
      
      // Recarregar radiografias para atualizar necessidades
      await loadRadiografias()
      
      // Recarregar histórico
      await loadHistorico()
      
      setIsEditingNecessidades(false)
    } catch (error) {
      console.error('Erro ao salvar necessidades:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar necessidades. Tente novamente.'
      showError(errorMessage)
    }
  }

  // Função antiga para modal (mantida para compatibilidade)
  const handleAddNecessidade = async () => {
    if (!novaNecessidade.trim()) return

    try {
      const necessidadesAtuais = Array.isArray(cliente.necessidades) 
        ? cliente.necessidades 
        : (cliente.necessidades ? [cliente.necessidades] : [])
      
      const updatedNecessidades = [...necessidadesAtuais, novaNecessidade.trim()]
      
      const payload = {
        informacoesClinicas: {
          necessidades: updatedNecessidades
        }
      }

      await api.put(`/pacientes/${id}`, payload)
      
      setCliente({ ...cliente, necessidades: updatedNecessidades })
      await loadHistorico()
      
      setNovaNecessidade('')
      setShowNecessidadesModal(false)
    } catch (error) {
      console.error('Erro ao adicionar necessidade:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao adicionar necessidade. Tente novamente.'
      showError(errorMessage)
    }
  }

  const handleUpdateStatus = async () => {
    if (!novoStatus) return

    try {
      // Preparar payload para a API - status deve estar dentro de dadosPessoais
      const payload = {
        dadosPessoais: {
          status: novoStatus
        }
      }

      // Fazer PUT para atualizar o status do paciente
      await api.put(`/pacientes/${id}`, payload)
      
      // Atualizar estado local
      setCliente({ ...cliente, status: novoStatus })
      
      // Adicionar ao histórico
      const savedHistorico = JSON.parse(localStorage.getItem(`mockHistorico_${id}`) || '[]')
      savedHistorico.unshift({
        id: Date.now(),
        tipo: 'status',
        descricao: `Status alterado para ${getStatusLabel(novoStatus)}`,
        data: new Date().toISOString(),
        usuario: 'Dr. Usuário'
      })
      localStorage.setItem(`mockHistorico_${id}`, JSON.stringify(savedHistorico))
      
      setNovoStatus('')
      setShowStatusModal(false)
      loadHistorico()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar status. Tente novamente.'
      showError(errorMessage)
    }
  }

  const getHistoricoIcon = (tipo) => {
    const iconMap = {
      'status': faCheckCircle,
      'necessidade': faStethoscope,
      'avaliacao': faFileMedical,
      'observacao': faEdit
    }
    return iconMap[tipo] || faHistory
  }

  const getHistoricoColor = (tipo) => {
    const colorMap = {
      'status': '#3b82f6',
      'necessidade': '#10b981',
      'avaliacao': '#8b5cf6',
      'observacao': '#f59e0b'
    }
    return colorMap[tipo] || '#6b7280'
  }

  if (loading) {
    return (
      <div className="cliente-detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do cliente...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="cliente-detalhes-error">
        <p>Cliente não encontrado</p>
        <button onClick={() => navigate('/app/clientes')}>
          Voltar para Clientes
        </button>
      </div>
    )
  }

  return (
    <div className="cliente-detalhes-page">
      <div className="cliente-detalhes-header">
        <button className="btn-back" onClick={() => navigate('/app/clientes')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        {isMaster && (
          <div className="header-actions">
            <button
              className="btn-edit-header"
              onClick={() => navigate(`/app/clientes/${id}/editar`)}
            >
              <FontAwesomeIcon icon={faEdit} />
              Editar Cliente
            </button>
          </div>
        )}
      </div>

      <div className="cliente-detalhes-content">
        <div className="cliente-ficha">
          <div className="ficha-header">
            <div className="cliente-avatar-large">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            <div className="cliente-info-main">
              <h1>{cliente.nome}</h1>
              <div className="status-badge-large" style={{ backgroundColor: getStatusColor(cliente.status) }}>
                <FontAwesomeIcon icon={getStatusIcon(cliente.status)} />
                {getStatusLabel(cliente.status)}
              </div>
            </div>
          </div>

          <div className="ficha-sections">
            <div className="ficha-section">
              <h2>
                <FontAwesomeIcon icon={faUser} />
                Dados Pessoais
              </h2>
              <div className="ficha-grid">
                <div className="ficha-item">
                  <label>Nome Completo</label>
                  <p>{cliente.nome}</p>
                </div>
                {cliente.cpf && (
                  <div className="ficha-item">
                    <label>
                      <FontAwesomeIcon icon={faIdCard} /> CPF
                    </label>
                    <p>{formatCPF(cliente.cpf)}</p>
                  </div>
                )}
                {cliente.dataNascimento && (
                  <div className="ficha-item">
                    <label>
                      <FontAwesomeIcon icon={faCalendarAlt} /> Data de Nascimento
                    </label>
                    <p>{new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                <div className="ficha-item">
                  <label>
                    <FontAwesomeIcon icon={faEnvelope} /> E-mail
                  </label>
                  <p>{cliente.email}</p>
                </div>
                <div className="ficha-item">
                  <label>
                    <FontAwesomeIcon icon={faPhone} /> Telefone
                  </label>
                  <p>{formatTelefone(cliente.telefone)}</p>
                </div>
              </div>
            </div>

            {cliente.endereco && (
              <div className="ficha-section">
                <h2>
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  Endereço
                </h2>
                <div className="ficha-grid">
                  <div className="ficha-item">
                    <label>Rua</label>
                    <p>
                      {cliente.endereco.rua}
                      {cliente.endereco.numero && `, ${cliente.endereco.numero}`}
                      {cliente.endereco.complemento && ` - ${cliente.endereco.complemento}`}
                    </p>
                  </div>
                  {cliente.endereco.bairro && (
                    <div className="ficha-item">
                      <label>Bairro</label>
                      <p>{cliente.endereco.bairro}</p>
                    </div>
                  )}
                  <div className="ficha-item">
                    <label>Cidade</label>
                    <p>{cliente.endereco.cidade} - {cliente.endereco.estado}</p>
                  </div>
                  {cliente.endereco.cep && (
                    <div className="ficha-item">
                      <label>CEP</label>
                      <p>{formatCEP(cliente.endereco.cep)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="ficha-section necessidades-section">
              <div className="necessidades-section-header">
                <h3>
                  <FontAwesomeIcon icon={faStethoscope} /> Necessidades
                </h3>
                <div className="necessidades-header-actions">
                  {isEditingNecessidades ? (
                    <>
                      <button
                        className="btn-cancel-necessidades"
                        onClick={handleCancelEditNecessidades}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Cancelar
                      </button>
                      <button
                        className="btn-add-necessidade"
                        onClick={handleAddNecessidadeInline}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Adicionar
                      </button>
                      <button
                        className="btn-save-necessidades"
                        onClick={handleSaveNecessidades}
                      >
                        <FontAwesomeIcon icon={faSave} /> Salvar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-edit-necessidades"
                      onClick={handleStartEditNecessidades}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Editar
                    </button>
                  )}
                </div>
              </div>
              
              {isEditingNecessidades ? (
                <div className="necessidades-edit-list">
                  {editedNecessidades.length > 0 ? (
                    editedNecessidades.map((necessidade, index) => {
                      // Verificar se pode editar essa necessidade específica
                      // Necessidades do paciente: qualquer usuário pode editar
                      // Necessidades de radiografia: pode editar se for master OU se for o responsável da radiografia
                      const usuarioLogadoId = user?.id || selectedClinicData?.usuarioId || selectedClinicData?.perfil?.id
                      const podeEditarNecessidade = necessidade.origem === 'paciente' 
                        ? true 
                        : (isMaster || necessidade.responsavelId === usuarioLogadoId)
                      
                      return (
                        <div key={index} className={`necessidade-edit-item ${necessidade.origem === 'radiografia' ? 'necessidade-radiografia-item' : ''}`}>
                          <input
                            type="text"
                            className="necessidade-input"
                            value={necessidade.texto}
                            onChange={(e) => handleUpdateNecessidade(index, e.target.value)}
                            placeholder="Digite a necessidade..."
                            disabled={!podeEditarNecessidade}
                            style={!podeEditarNecessidade ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                          />
                          {necessidade.origem === 'radiografia' && (
                            <span className="necessidade-origem-badge" title={`Radiografia: ${necessidade.radiografiaNome}`}>
                              <FontAwesomeIcon icon={faXRay} />
                            </span>
                          )}
                          {podeEditarNecessidade && (
                            <button
                              className="btn-remove-necessidade"
                              onClick={() => handleRemoveNecessidade(index)}
                              title="Remover necessidade"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <p className="empty-text-necessidades">Nenhuma necessidade. Clique em "Adicionar" para incluir.</p>
                  )}
                </div>
              ) : (
                (() => {
                  // Filtrar duplicatas - necessidades de radiografia que não estão no paciente
                  const necessidadesPacienteTextos = new Set(
                    (Array.isArray(cliente.necessidades) ? cliente.necessidades : [])
                      .map(n => (typeof n === 'string' ? n : String(n)).toLowerCase().trim())
                  )
                  const necessidadesRadFiltradas = necessidadesRadiografias.filter(
                    n => !necessidadesPacienteTextos.has(n.texto.toLowerCase().trim())
                  )
                  
                  const temNecessidades = (Array.isArray(cliente.necessidades) && cliente.necessidades.length > 0) || necessidadesRadFiltradas.length > 0
                  
                  return temNecessidades ? (
                    <ul className="necessidades-detalhes-list">
                      {/* Necessidades do cadastro do paciente */}
                      {Array.isArray(cliente.necessidades) && cliente.necessidades.map((necessidade, index) => {
                        const necessidadeTexto = typeof necessidade === 'string' 
                          ? necessidade 
                          : (Array.isArray(necessidade) 
                              ? necessidade.join(', ') 
                              : String(necessidade))
                        
                        return (
                          <li key={`paciente-${index}`}>
                            <FontAwesomeIcon icon={faCheck} className="list-icon" />
                            {necessidadeTexto}
                          </li>
                        )
                      })}
                      {/* Necessidades das radiografias (sem duplicatas) */}
                      {necessidadesRadFiltradas.map((nec, index) => (
                        <li key={`radiografia-${index}`}>
                          <FontAwesomeIcon icon={faCheck} className="list-icon" />
                          {nec.texto}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text-necessidades">Nenhuma necessidade registrada.</p>
                  )
                })()
              )}
            </div>

            <div className="ficha-section">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Status do Tratamento
                </h2>
                <button
                  className="btn-change-status"
                  onClick={() => {
                    setNovoStatus(cliente.status)
                    setShowStatusModal(true)
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Alterar Status
                </button>
              </div>
              <div className="status-display">
                <div
                  className="status-badge-display"
                  style={{ backgroundColor: getStatusColor(cliente.status) }}
                >
                  <FontAwesomeIcon icon={getStatusIcon(cliente.status)} />
                  {getStatusLabel(cliente.status)}
                </div>
              </div>
            </div>

            {cliente.observacoes && (
              <div className="ficha-section">
                <h2>
                  <FontAwesomeIcon icon={faFileMedical} />
                  Observações
                </h2>
                <p className="observacoes-text">{cliente.observacoes}</p>
              </div>
            )}

            <div className="ficha-section">
              <h2>
                <FontAwesomeIcon icon={faXRay} />
                Radiografias
              </h2>
              {radiografias.length > 0 ? (
                <div className="radiografias-list">
                  {radiografias.map((radiografia) => (
                    <div 
                      key={radiografia.id} 
                      className="radiografia-item"
                      onClick={() => navigate(`/app/diagnosticos/${radiografia.id}`)}
                    >
                      <div className="radiografia-item-content">
                        <FontAwesomeIcon icon={faXRay} className="radiografia-item-icon" />
                        <span className="radiografia-item-nome">{radiografia.radiografia || 'Radiografia'}</span>
                      </div>
                      <button className="btn-view-radiografia-small">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">Nenhuma radiografia registrada</p>
              )}
            </div>
          </div>
        </div>

        <div className="cliente-historico">
          <h2>
            <FontAwesomeIcon icon={faHistory} />
            Histórico
          </h2>
          {historico.length > 0 ? (
            <div className="historico-timeline">
              {historico.map((item) => (
                <div key={item.id} className="historico-item">
                  <div
                    className="historico-icon"
                    style={{ backgroundColor: getHistoricoColor(item.tipo) }}
                  >
                    <FontAwesomeIcon icon={getHistoricoIcon(item.tipo)} />
                  </div>
                  <div className="historico-content">
                    <p className="historico-descricao">{item.descricao}</p>
                    <div className="historico-meta">
                      <span className="historico-usuario">{item.usuario}</span>
                      <span className="historico-data">
                        {item.data}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="historico-empty-state">
              <div className="historico-empty-icon">
                <FontAwesomeIcon icon={faHistory} />
              </div>
              <h3>Nenhum histórico registrado</h3>
              <p>As alterações feitas neste paciente aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Necessidade */}
      {showNecessidadesModal && (
        <div className="modal-overlay" onClick={() => setShowNecessidadesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Adicionar Necessidade</h3>
            <textarea
              value={novaNecessidade}
              onChange={(e) => setNovaNecessidade(e.target.value)}
              placeholder="Descreva a necessidade do cliente..."
              rows="4"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowNecessidadesModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleAddNecessidade}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar Status */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status</h3>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
            >
              <option value="">Selecione um status</option>
              <option value="avaliacao-realizada">Avaliação Realizada</option>
              <option value="em-andamento">Em Andamento</option>
              <option value="aprovado">Aprovado</option>
              <option value="tratamento-concluido">Tratamento Concluído</option>
              <option value="perdido">Perdido</option>
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowStatusModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleUpdateStatus}>
                Salvar
              </button>
            </div>
          </div>
        </div>
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

export default ClienteDetalhes

