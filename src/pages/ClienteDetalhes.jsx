import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faEdit, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faIdCard,
  faStethoscope, faHistory, faPlus, faFileMedical,
  faCheckCircle, faClock, faTimesCircle, faExclamationTriangle,
  faXRay, faEye, faCheck, faTrash, faSave, faTimes,
  faClipboardQuestion, faPowerOff, faToggleOn, faToggleOff,
  faCopy, faShareAlt, faSpinner, faComment, faChevronDown, faChevronUp,
  faFileInvoiceDollar, faBirthdayCake, faFolder, faFolderPlus, faFile, faUpload, faFilePdf,
  faFileWord, faFileExcel, faDownload
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import exameImage from '../img/exame.jpg'
import './ClienteDetalhes.css'

// Preview de imagem com loading até a imagem carregar
const ImagemPreviewComLoading = ({ src, className }) => {
  const [carregado, setCarregado] = useState(false)
  return (
    <div className="arquivo-card-preview-wrap">
      {!carregado && (
        <div className="arquivo-card-preview-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      )}
      <img
        src={src}
        alt=""
        className={className}
        onLoad={() => setCarregado(true)}
        onError={() => setCarregado(true)}
        style={{ opacity: carregado ? 1 : 0 }}
      />
    </div>
  )
}

const ClienteDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, selectedClinicData, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Hook para modal de alerta
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [cliente, setCliente] = useState(null)
  const [historico, setHistorico] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNecessidadesModal, setShowNecessidadesModal] = useState(false)
  const [novaNecessidade, setNovaNecessidade] = useState('')
  const [necessidadesRadiografias, setNecessidadesRadiografias] = useState([])
  const [isEditingNecessidades, setIsEditingNecessidades] = useState(false)
  const [editedNecessidades, setEditedNecessidades] = useState([])
  const [radiografiasCompletas, setRadiografiasCompletas] = useState({})
  const [anamnesesVinculadas, setAnamnesesVinculadas] = useState([])
  const [anamnesesDisponiveis, setAnamnesesDisponiveis] = useState([])
  const [showVincularAnamneseModal, setShowVincularAnamneseModal] = useState(false)
  const [anamneseParaVincular, setAnamneseParaVincular] = useState('')
  const [loadingAnamneses, setLoadingAnamneses] = useState(false)
  const [showRespostasModal, setShowRespostasModal] = useState(false)
  const [respostasAnamnese, setRespostasAnamnese] = useState(null)
  const [loadingRespostas, setLoadingRespostas] = useState(false)
  const [questionarios, setQuestionarios] = useState([])
  const [temFeedback, setTemFeedback] = useState(false)
  const [totalQuestionarios, setTotalQuestionarios] = useState(0)
  const [questionariosPendentes, setQuestionariosPendentes] = useState(0)
  const [questionariosConcluidos, setQuestionariosConcluidos] = useState(0)
  const [enderecoExpandido, setEnderecoExpandido] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef(null)
  const [orcamentos, setOrcamentos] = useState([])
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [orcamentoStatusDropdowns, setOrcamentoStatusDropdowns] = useState({})
  const [itemStatusDropdowns, setItemStatusDropdowns] = useState({})
  const [showOrcamentoStatusModal, setShowOrcamentoStatusModal] = useState(null) // null ou orcamentoId
  const [showItemStatusModal, setShowItemStatusModal] = useState(null) // null ou { orcamentoId, itemIndex }
  const orcamentoStatusRefs = useRef({})
  const itemStatusRefs = useRef({})
  
  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Modal WhatsApp - Questionários
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsAppQuestionarioId, setWhatsAppQuestionarioId] = useState(null)
  const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState('')
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  
  // Modal WhatsApp - Anamneses
  const [showWhatsAppAnamneseModal, setShowWhatsAppAnamneseModal] = useState(false)
  const [whatsAppAnamneseId, setWhatsAppAnamneseId] = useState(null)
  const [whatsAppAnamnesePhoneNumber, setWhatsAppAnamnesePhoneNumber] = useState('')
  const [sendingWhatsAppAnamnese, setSendingWhatsAppAnamnese] = useState(false)

  // Pastas e arquivos do cliente (integração com API)
  const [pastas, setPastas] = useState([]) // { id, nome } (nome = titulo da API)
  const [pastaSelecionada, setPastaSelecionada] = useState(null)
  const [telaPastaAberta, setTelaPastaAberta] = useState(false)
  const [arquivosPorPasta, setArquivosPorPasta] = useState({}) // { [pastaId]: [{ id, nome, tamanho?, tipo?, url? }] }
  const [isCriandoPasta, setIsCriandoPasta] = useState(false)
  const [nomeNovaPasta, setNomeNovaPasta] = useState('')
  const [loadingPastas, setLoadingPastas] = useState(false)
  const [loadingArquivos, setLoadingArquivos] = useState(false)
  const [importandoArquivos, setImportandoArquivos] = useState(false)
  const [editandoPastaId, setEditandoPastaId] = useState(null)
  const [editandoPastaNome, setEditandoPastaNome] = useState('')
  const [showConfirmExcluirModal, setShowConfirmExcluirModal] = useState(false)
  const [confirmExcluirPayload, setConfirmExcluirPayload] = useState(null) // { tipo: 'pasta'|'arquivo', id, nome }
  const [arquivoVisualizador, setArquivoVisualizador] = useState(null) // { arq } ao abrir visualização
  const [visualizadorUrl, setVisualizadorUrl] = useState(null) // blob ou url para exibir (quando vem da API sem url)
  const fileInputRef = useRef(null)
  const novaPastaInputRef = useRef(null)

  useEffect(() => {
    loadCliente()
    loadHistorico()
    loadAnamnesesVinculadas()
    loadAnamnesesDisponiveis()
    loadOrcamentos()
    loadPastasPaciente()
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

  // Fechar dropdown de status ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false)
      }
    }

    if (statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [statusDropdownOpen])

  const loadCliente = async () => {
    try {
      // Fazer GET para buscar dados completos do paciente
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      if (!clienteMasterId) {
        setError('Cliente Master não encontrado')
        return
      }
      const response = await api.get(`/pacientes/${id}/completo?clienteMasterId=${clienteMasterId}`)
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
          status: (() => {
            // Normalizar status do backend
            const statusRaw = paciente.status || paciente.dadosPessoais?.status || 'avaliacao-realizada'
            // Normalizar valores comuns que podem vir do backend
            const statusNormalizado = String(statusRaw).toLowerCase().trim()
            
            // Mapear valores comuns para status válidos
            const statusMap = {
              'inativa': 'perdido',
              'inativo': 'perdido',
              'ativa': 'avaliacao-realizada',
              'ativo': 'avaliacao-realizada',
              'active': 'avaliacao-realizada',
              'inactive': 'perdido'
            }
            
            return statusMap[statusNormalizado] || statusRaw
          })(),
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
        
        // Salvar dados de feedback/questionários
        setTemFeedback(paciente.temFeedback || false)
        setQuestionarios(paciente.questionarios || [])
        setTotalQuestionarios(paciente.totalQuestionarios || 0)
        setQuestionariosPendentes(paciente.questionariosPendentes || 0)
        setQuestionariosConcluidos(paciente.questionariosConcluidos || 0)
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
    if (!telefone) return 'Número não informado'
    // Remove todos os caracteres não numéricos, exceto +
    let cleaned = telefone.replace(/[^\d+]/g, '')
    
    // Se começa com +, mantém
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
      // Formata: +55 (11) 99999-9999
      if (cleaned.length === 13 && cleaned.startsWith('55')) {
        // +55 (11) 99999-9999
        return `+${cleaned.substring(0, 2)} (${cleaned.substring(2, 4)}) ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`
      } else if (cleaned.length === 12 && cleaned.startsWith('55')) {
        // +55 (11) 9999-9999
        return `+${cleaned.substring(0, 2)} (${cleaned.substring(2, 4)}) ${cleaned.substring(4, 8)}-${cleaned.substring(8)}`
      } else if (cleaned.length === 11) {
        // (11) 99999-9999
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
      } else if (cleaned.length === 10) {
        // (11) 9999-9999
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
      }
      return `+${cleaned}`
    } else {
      // Sem +, assume Brasil
      if (cleaned.length === 13 && cleaned.startsWith('55')) {
        // 55 (11) 99999-9999
        return `+${cleaned.substring(0, 2)} (${cleaned.substring(2, 4)}) ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`
      } else if (cleaned.length === 12 && cleaned.startsWith('55')) {
        // 55 (11) 9999-9999
        return `+${cleaned.substring(0, 2)} (${cleaned.substring(2, 4)}) ${cleaned.substring(4, 8)}-${cleaned.substring(8)}`
      } else if (cleaned.length === 11) {
        // (11) 99999-9999
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
      } else if (cleaned.length === 10) {
        // (11) 9999-9999
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
      }
      return cleaned || 'Número não informado'
    }
  }

  const formatCPF = (cpf) => {
    if (!cpf) return ''
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  // Função para formatar data de nascimento sem problemas de timezone
  const formatarDataNascimento = (dataString) => {
    if (!dataString) return ''
    // Se já está no formato DD/MM/YYYY, retornar como está
    if (dataString.includes('/')) return dataString
    // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY
    if (dataString.includes('-')) {
      const [year, month, day] = dataString.split('-')
      return `${day}/${month}/${year}`
    }
    return dataString
  }

  const formatCEP = (cep) => {
    if (!cep) return ''
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return cep
  }

  // Função para verificar se o aniversário está próximo (15 dias antes ou depois)
  const verificarAniversarioProximo = (dataNascimento) => {
    if (!dataNascimento) return null

    try {
      let diaNasc, mesNasc
      
      // Extrair dia e mês de diferentes formatos
      if (dataNascimento.includes('/')) {
        // Formato DD/MM/YYYY
        const partes = dataNascimento.split('/')
        diaNasc = parseInt(partes[0], 10)
        mesNasc = parseInt(partes[1], 10) - 1 // Mês começa em 0
      } else if (dataNascimento.includes('-')) {
        // Formato YYYY-MM-DD
        const partes = dataNascimento.split('-')
        diaNasc = parseInt(partes[2], 10)
        mesNasc = parseInt(partes[1], 10) - 1 // Mês começa em 0
      } else {
        return null
      }

      if (isNaN(diaNasc) || isNaN(mesNasc) || mesNasc < 0 || mesNasc > 11 || diaNasc < 1 || diaNasc > 31) {
        return null
      }

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const anoAtual = hoje.getFullYear()
      const diaHoje = hoje.getDate()
      const mesHoje = hoje.getMonth()
      
      // Verificar se é o mesmo dia (mês e dia iguais)
      if (mesHoje === mesNasc && diaHoje === diaNasc) {
        return {
          proximo: true,
          dias: 0,
          data: new Date(anoAtual, mesNasc, diaNasc)
        }
      }
      
      // Criar data do aniversário no ano atual
      const aniversarioAnoAtual = new Date(anoAtual, mesNasc, diaNasc)
      aniversarioAnoAtual.setHours(0, 0, 0, 0)
      
      // Calcular diferença em dias (positivo = futuro, negativo = passado)
      let diffDias = Math.round((aniversarioAnoAtual - hoje) / (1000 * 60 * 60 * 24))
      
      // Se o aniversário do ano atual já passou há mais de 15 dias, verificar o próximo ano
      if (diffDias < -15) {
        const aniversarioProximoAno = new Date(anoAtual + 1, mesNasc, diaNasc)
        aniversarioProximoAno.setHours(0, 0, 0, 0)
        diffDias = Math.round((aniversarioProximoAno - hoje) / (1000 * 60 * 60 * 24))
      }
      
      // Verificar se está no range de -15 a +15 dias
      if (diffDias >= -15 && diffDias <= 15) {
        return {
          proximo: true,
          dias: diffDias,
          data: diffDias >= 0 ? aniversarioAnoAtual : new Date(anoAtual + (diffDias < -15 ? 1 : 0), mesNasc, diaNasc)
        }
      }
      
      return null
    } catch (error) {
      console.error('Erro ao verificar aniversário:', error)
      return null
    }
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

  const loadAnamnesesVinculadas = async () => {
    try {
      const response = await api.get(`/anamneses/paciente/${id}`)
      // A API retorna { statusCode, message, data: [...] }
      let anamnesesData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          anamnesesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          anamnesesData = response.data.data
        } else if (Array.isArray(response.data)) {
          anamnesesData = response.data
        }
      }
      setAnamnesesVinculadas(anamnesesData || [])
    } catch (error) {
      console.error('Erro ao carregar anamneses vinculadas:', error)
      setAnamnesesVinculadas([])
    }
  }

  const loadAnamnesesDisponiveis = async () => {
    try {
      setLoadingAnamneses(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        setLoadingAnamneses(false)
        return
      }

      const response = await api.get(`/anamneses?clienteMasterId=${clienteMasterId}`)
      let anamnesesData = []
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          anamnesesData = response.data.filter(a => a.ativa)
        } else if (response.data.data && Array.isArray(response.data.data)) {
          anamnesesData = response.data.data.filter(a => a.ativa)
        }
      }
      
      // Filtrar anamneses já vinculadas
      const idsVinculadas = anamnesesVinculadas.map(a => a.anamneseId || a.anamnese?.id)
      const disponiveis = anamnesesData.filter(a => !idsVinculadas.includes(a.id))
      
      setAnamnesesDisponiveis(disponiveis)
    } catch (error) {
      console.error('Erro ao carregar anamneses disponíveis:', error)
      setAnamnesesDisponiveis([])
    } finally {
      setLoadingAnamneses(false)
    }
  }

  const loadOrcamentos = async () => {
    try {
      setLoadingOrcamentos(true)
      const response = await api.get(`/orcamentos/paciente/${id}`)
      
      let orcamentosData = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          orcamentosData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          orcamentosData = response.data.data
        }
      }
      
      setOrcamentos(orcamentosData || [])
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      setOrcamentos([])
    } finally {
      setLoadingOrcamentos(false)
    }
  }

  const loadPastasPaciente = async () => {
    if (!id) return
    try {
      setLoadingPastas(true)
      const response = await api.get(`/pastas-paciente?pacienteId=${id}`)
      const data = response.data?.data ?? response.data
      const lista = Array.isArray(data) ? data : []
      setPastas(lista.map((p) => ({ id: p.id, nome: p.titulo || p.nome || '' })))
    } catch (error) {
      console.error('Erro ao carregar pastas do paciente:', error)
      setPastas([])
    } finally {
      setLoadingPastas(false)
    }
  }

  const loadArquivosPasta = async (pastaId) => {
    if (!pastaId) return
    try {
      setLoadingArquivos(true)
      const response = await api.get(`/pastas-paciente/${pastaId}/arquivos`)
      const data = response.data?.data ?? response.data
      const lista = Array.isArray(data) ? data : []
      setArquivosPorPasta((prev) => ({
        ...prev,
        [pastaId]: lista.map((a) => ({
          id: a.id,
          nome: a.nomeOriginal || a.nome || a.titulo || a.filename || '',
          tamanho: a.tamanho ?? a.size,
          tipo: a.tipo || a.mimetype || a.contentType,
          url: a.url || null
        }))
      }))
    } catch (error) {
      console.error('Erro ao carregar arquivos da pasta:', error)
      setArquivosPorPasta((prev) => ({ ...prev, [pastaId]: [] }))
    } finally {
      setLoadingArquivos(false)
    }
  }

  const handleVincularAnamnese = async () => {
    if (!anamneseParaVincular) {
      showError('Por favor, selecione uma anamnese para vincular.')
      return
    }

    try {
      // Vincular anamnese ao paciente
      const vincularResponse = await api.post('/anamneses/vincular-paciente', {
        anamneseId: anamneseParaVincular,
        pacienteId: id
      })
      
      // Obter o ID da respostaAnamnese criada
      const respostaAnamneseId = vincularResponse.data?.id || vincularResponse.data?.data?.id
      
      // Se conseguiu o ID, ativar automaticamente
      if (respostaAnamneseId) {
        try {
          await api.put(`/anamneses/ativar/${respostaAnamneseId}`)
        } catch (ativarError) {
          console.warn('Erro ao ativar anamnese automaticamente:', ativarError)
          // Não falhar o processo se a ativação falhar, apenas avisar
        }
      }
      
      setShowVincularAnamneseModal(false)
      setAnamneseParaVincular('')
      await loadAnamnesesVinculadas()
      // Recarregar disponíveis após vincular
      await loadAnamnesesDisponiveis()
      showSuccess('Anamnese vinculada e ativada com sucesso!')
    } catch (error) {
      console.error('Erro ao vincular anamnese:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao vincular anamnese. Tente novamente.'
      showError(errorMessage)
    }
  }

  const handleAtivarAnamnese = async (respostaAnamneseId) => {
    try {
      await api.put(`/anamneses/ativar/${respostaAnamneseId}`)
      await loadAnamnesesVinculadas()
      showSuccess('Anamnese ativada com sucesso!')
    } catch (error) {
      console.error('Erro ao ativar anamnese:', error)
      console.error('Detalhes do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao ativar anamnese. Tente novamente.'
      showError(errorMessage)
    }
  }

  const handleDesativarAnamnese = async (respostaAnamneseId) => {
    try {
      await api.put(`/anamneses/desativar/${respostaAnamneseId}`)
      await loadAnamnesesVinculadas()
      showSuccess('Anamnese desativada com sucesso!')
    } catch (error) {
      console.error('Erro ao desativar anamnese:', error)
      console.error('Detalhes do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao desativar anamnese. Tente novamente.'
      showError(errorMessage)
    }
  }

  const handleCopiarLink = async (respostaAnamneseId) => {
    try {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/responder-anamnese/${respostaAnamneseId}`
      
      await navigator.clipboard.writeText(link)
      showSuccess('Link copiado')
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      // Fallback para navegadores que não suportam clipboard API
      const baseUrl = window.location.origin
      const link = `${baseUrl}/responder-anamnese/${respostaAnamneseId}`
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showSuccess('Link copiado')
      } catch (err) {
        showError('Não foi possível copiar o link. Por favor, copie manualmente: ' + link)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleCompartilharLink = async (respostaAnamneseId) => {
    try {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/responder-anamnese/${respostaAnamneseId}`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Questionário de Anamnese',
          text: 'Por favor, responda este questionário de anamnese',
          url: link
        })
      } else {
        // Fallback: copiar link
        await handleCopiarLink(respostaAnamneseId)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar link:', error)
        // Se falhar, tentar copiar
        await handleCopiarLink(respostaAnamneseId)
      }
    }
  }

  const handleCopiarLinkQuestionario = async (respostaQuestionarioId) => {
    try {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/responder-questionario/${respostaQuestionarioId}`
      
      await navigator.clipboard.writeText(link)
      showSuccess('Link copiado')
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      // Fallback para navegadores que não suportam clipboard API
      const baseUrl = window.location.origin
      const link = `${baseUrl}/responder-questionario/${respostaQuestionarioId}`
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showSuccess('Link copiado')
      } catch (err) {
        showError('Não foi possível copiar o link. Por favor, copie manualmente: ' + link)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleCompartilharLinkQuestionario = async (respostaQuestionarioId) => {
    try {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/responder-questionario/${respostaQuestionarioId}`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Questionário de Feedback',
          text: 'Por favor, responda este questionário',
          url: link
        })
      } else {
        // Fallback: copiar link
        await handleCopiarLinkQuestionario(respostaQuestionarioId)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar link:', error)
        // Se falhar, tentar copiar
        await handleCopiarLinkQuestionario(respostaQuestionarioId)
      }
    }
  }

  const handleVerRespostas = async (respostaAnamneseId) => {
    try {
      setLoadingRespostas(true)
      
      // Primeiro, tentar buscar da lista já carregada
      const anamneseExistente = anamnesesVinculadas.find(a => a.id === respostaAnamneseId)
      
      // Se já tiver as respostas carregadas e a anamnese estiver concluída, usar esses dados
      if (anamneseExistente && anamneseExistente.concluida && anamneseExistente.respostasPerguntas) {
        setRespostasAnamnese(anamneseExistente)
        setShowRespostasModal(true)
        setLoadingRespostas(false)
        return
      }
      
      // Caso contrário, buscar da API
      const response = await api.get(`/anamneses/resposta/${respostaAnamneseId}`)
      const data = response.data?.data || response.data
      setRespostasAnamnese(data)
      setShowRespostasModal(true)
    } catch (error) {
      console.error('Erro ao carregar respostas:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao carregar as respostas. Tente novamente.'
      showError(errorMessage)
    } finally {
      setLoadingRespostas(false)
    }
  }

  const formatarResposta = (valor, tipoResposta) => {
    if (!valor || valor === 'null') return 'Não respondido'
    
    if (tipoResposta === 'booleano') {
      return valor === 'true' ? 'Sim' : 'Não'
    }
    
    if (tipoResposta === 'data') {
      return new Date(valor).toLocaleDateString('pt-BR')
    }
    
    return valor
  }

  const handleUpdateStatus = async (novoStatusValue) => {
    if (!novoStatusValue || novoStatusValue === cliente.status) {
      setStatusDropdownOpen(false)
      return
    }

    // Fechar dropdown imediatamente para melhor UX
    setStatusDropdownOpen(false)

    try {
      // Preparar payload para a API - status deve estar dentro de dadosPessoais
      const payload = {
        dadosPessoais: {
          status: novoStatusValue
        }
      }

      // Fazer PUT para atualizar o status do paciente
      await api.put(`/pacientes/${id}`, payload)
      
      // Se chegou aqui, a requisição foi bem-sucedida (axios só lança erro para status >= 400)
      // Atualizar estado local
      if (cliente) {
        setCliente({ ...cliente, status: novoStatusValue })
      }
      
      // Recarregar histórico da API (sem bloquear em caso de erro)
      // Não usar await para não bloquear o fluxo de sucesso
      loadHistorico().catch(histError => {
        console.warn('Erro ao recarregar histórico (não crítico):', histError)
        // Não mostrar erro se o histórico falhar, pois o status já foi atualizado
      })
    } catch (error) {
      // Só mostrar erro se realmente for um erro da API (status >= 400)
      // Verificar se é um erro de resposta da API
      if (error.response && error.response.status >= 400) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Erro ${error.response.status}: ${error.response.statusText}`
        showError(errorMessage)
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta
        showError('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        // Erro ao configurar a requisição
        const errorMessage = error.message || 'Erro ao atualizar status. Tente novamente.'
        showError(errorMessage)
      }
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

  // Funções para orçamentos
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDateOrcamento = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getOrcamentoStatusColor = (status) => {
    const colors = {
      'RASCUNHO': '#6b7280',
      'ENVIADO': '#0ea5e9',
      'ACEITO': '#10b981',
      'EM_ANDAMENTO': '#f59e0b',
      'FINALIZADO': '#8b5cf6',
      'RECUSADO': '#ef4444',
      'CANCELADO': '#6b7280'
    }
    return colors[status] || '#9ca3af'
  }

  const getOrcamentoStatusLabel = (status) => {
    const labels = {
      'RASCUNHO': 'Rascunho',
      'ENVIADO': 'Enviado',
      'ACEITO': 'Aceito',
      'EM_ANDAMENTO': 'Em Andamento',
      'FINALIZADO': 'Finalizado',
      'RECUSADO': 'Recusado',
      'CANCELADO': 'Cancelado'
    }
    return labels[status] || status
  }

  const getItemStatusColor = (status) => {
    const colors = {
      'EM_ANALISE': '#0ea5e9',
      'PAGO': '#10b981',
      'RECUSADO': '#ef4444',
      'PERDIDO': '#6b7280'
    }
    return colors[status] || '#9ca3af'
  }

  const getItemStatusLabel = (status) => {
    const labels = {
      'EM_ANALISE': 'Em Análise',
      'PAGO': 'Pago',
      'RECUSADO': 'Recusado',
      'PERDIDO': 'Perdido'
    }
    return labels[status] || status
  }


  const handleUpdateOrcamentoStatus = async (orcamentoId, newStatus) => {
    setOrcamentoStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[orcamentoId]
      return newState
    })
    setShowOrcamentoStatusModal(null)
    
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      await api.patch(`/orcamentos/${orcamentoId}`, {
        status: newStatus
      }, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamentos(prev => prev.map(orc => 
        orc.id === orcamentoId ? { ...orc, status: newStatus } : orc
      ))
    } catch (error) {
      console.error('Erro ao atualizar status do orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do orçamento. Tente novamente.')
    }
  }

  const handleUpdateItemStatus = async (orcamentoId, itemId, itemIndex, newStatus) => {
    const key = `${orcamentoId}_${itemIndex}`
    setItemStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
    setShowItemStatusModal(null)
    
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      await api.patch(`/orcamentos/${orcamentoId}/itens/${itemId}/status`, {
        status: newStatus
      }, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamentos(prev => prev.map(orc => {
        if (orc.id === orcamentoId && orc.itens) {
          return {
            ...orc,
            itens: orc.itens.map((item, idx) => 
              idx === itemIndex ? { ...item, status: newStatus } : item
            )
          }
        }
        return orc
      }))
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do item. Tente novamente.')
    }
  }

  const handleEnviarWhatsApp = async () => {
    if (!whatsAppPhoneNumber || !whatsAppPhoneNumber.trim()) {
      showError('Por favor, informe o número de telefone')
      return
    }

    if (!whatsAppQuestionarioId) {
      showError('ID do questionário não encontrado')
      return
    }

    setSendingWhatsApp(true)
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      // Limpar o número de telefone (remover caracteres não numéricos, exceto +)
      let phoneNumber = whatsAppPhoneNumber.trim().replace(/\s/g, '')
      
      // Se não começar com +, adicionar código do Brasil (55)
      if (!phoneNumber.startsWith('+')) {
        // Remover zeros à esquerda se houver
        phoneNumber = phoneNumber.replace(/^0+/, '')
        // Se não começar com 55, adicionar
        if (!phoneNumber.startsWith('55')) {
          phoneNumber = '55' + phoneNumber
        }
        phoneNumber = '+' + phoneNumber
      }

      const response = await api.post('/questionarios/enviar-whatsapp', {
        respostaQuestionarioId: whatsAppQuestionarioId,
        phoneNumber: phoneNumber
      }, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      showSuccess(response.data?.data?.message || 'Link de feedback enviado via WhatsApp com sucesso!')
      setShowWhatsAppModal(false)
      setWhatsAppPhoneNumber('')
      setWhatsAppQuestionarioId(null)
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
      showError(error.response?.data?.message || 'Erro ao enviar link via WhatsApp. Tente novamente.')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  const handleEnviarWhatsAppAnamnese = async () => {
    if (!whatsAppAnamnesePhoneNumber || !whatsAppAnamnesePhoneNumber.trim()) {
      showError('Por favor, informe o número de telefone')
      return
    }

    if (!whatsAppAnamneseId) {
      showError('ID da anamnese não encontrado')
      return
    }

    setSendingWhatsAppAnamnese(true)
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      // Limpar o número de telefone (remover caracteres não numéricos, exceto +)
      let phoneNumber = whatsAppAnamnesePhoneNumber.trim().replace(/\s/g, '')
      
      // Se não começar com +, adicionar código do Brasil (55)
      if (!phoneNumber.startsWith('+')) {
        // Remover zeros à esquerda se houver
        phoneNumber = phoneNumber.replace(/^0+/, '')
        // Se não começar com 55, adicionar
        if (!phoneNumber.startsWith('55')) {
          phoneNumber = '55' + phoneNumber
        }
        phoneNumber = '+' + phoneNumber
      }

      const response = await api.post('/anamneses/enviar-whatsapp', {
        respostaAnamneseId: whatsAppAnamneseId,
        phoneNumber: phoneNumber
      }, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      showSuccess(response.data?.data?.message || 'Link da anamnese enviado via WhatsApp com sucesso!')
      setShowWhatsAppAnamneseModal(false)
      setWhatsAppAnamnesePhoneNumber('')
      setWhatsAppAnamneseId(null)
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
      showError(error.response?.data?.message || 'Erro ao enviar link via WhatsApp. Tente novamente.')
    } finally {
      setSendingWhatsAppAnamnese(false)
    }
  }

  // Criar nova pasta (API POST)
  const handleCriarPasta = async () => {
    const titulo = nomeNovaPasta.trim()
    if (!titulo || !id) return
    try {
      const response = await api.post('/pastas-paciente', { titulo, pacienteId: id })
      const created = response.data?.data ?? response.data
      const novaPasta = { id: created.id, nome: created.titulo || titulo }
      setPastas((prev) => [...prev, novaPasta])
      setNomeNovaPasta('')
      setIsCriandoPasta(false)
      setPastaSelecionada(novaPasta.id)
      setTelaPastaAberta(true)
      await loadArquivosPasta(novaPasta.id)
      showSuccess('Pasta criada.')
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao criar pasta.')
    }
  }

  // Ao mostrar inline da nova pasta: Enter ou blur com texto = salvar; vazio = cancelar
  const confirmarOuCancelarNovaPasta = () => {
    if (nomeNovaPasta.trim()) {
      handleCriarPasta()
    } else {
      setIsCriandoPasta(false)
      setNomeNovaPasta('')
    }
  }

  // Abrir tela dedicada da pasta (GET arquivos)
  const abrirTelaPasta = (pastaId) => {
    setPastaSelecionada(pastaId)
    setTelaPastaAberta(true)
    loadArquivosPasta(pastaId)
  }

  // Voltar da tela da pasta para os detalhes do cliente
  const voltarParaDetalhes = () => {
    setTelaPastaAberta(false)
  }

  const handleSalvarNomePasta = async (pastaId) => {
    const titulo = editandoPastaNome.trim()
    if (!titulo) {
      setEditandoPastaId(null)
      setEditandoPastaNome('')
      return
    }
    const nomeAtual = pastas.find((p) => p.id === pastaId)?.nome || ''
    if (titulo === nomeAtual.trim()) {
      setEditandoPastaId(null)
      setEditandoPastaNome('')
      return
    }
    try {
      await api.put(`/pastas-paciente/${pastaId}`, { titulo })
      setPastas((prev) => prev.map((p) => (p.id === pastaId ? { ...p, nome: titulo } : p)))
      setEditandoPastaId(null)
      setEditandoPastaNome('')
      showSuccess('Pasta atualizada.')
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao atualizar pasta.')
    }
  }

  const handleExcluirPasta = async (pastaId) => {
    try {
      await api.delete(`/pastas-paciente/${pastaId}`)
      setPastas((prev) => prev.filter((p) => p.id !== pastaId))
      setArquivosPorPasta((prev) => {
        const next = { ...prev }
        delete next[pastaId]
        return next
      })
      if (pastaSelecionada === pastaId) {
        setPastaSelecionada(null)
        setTelaPastaAberta(false)
      }
      showSuccess('Pasta excluída.')
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao excluir pasta.')
    }
  }

  const abrirModalExcluirPasta = (pastaId) => {
    const pasta = pastas.find((p) => p.id === pastaId)
    setConfirmExcluirPayload({ tipo: 'pasta', id: pastaId, nome: pasta?.nome || 'esta pasta' })
    setShowConfirmExcluirModal(true)
  }

  const abrirModalExcluirArquivo = (arquivoId, nomeArquivo) => {
    setConfirmExcluirPayload({ tipo: 'arquivo', id: arquivoId, nome: nomeArquivo || 'este arquivo' })
    setShowConfirmExcluirModal(true)
  }

  const confirmarExclusao = async () => {
    if (!confirmExcluirPayload) return
    const { tipo, id } = confirmExcluirPayload
    setShowConfirmExcluirModal(false)
    setConfirmExcluirPayload(null)
    if (tipo === 'pasta') await handleExcluirPasta(id)
    if (tipo === 'arquivo') await handleExcluirArquivo(id)
  }

  const fecharModalConfirmarExcluir = () => {
    setShowConfirmExcluirModal(false)
    setConfirmExcluirPayload(null)
  }

  useEffect(() => {
    if (isCriandoPasta) novaPastaInputRef.current?.focus()
  }, [isCriandoPasta])

  // Importar arquivos na pasta (API POST multipart)
  const handleImportarArquivos = async (e) => {
    const files = e.target.files
    if (!files?.length || !pastaSelecionada) return
    setImportandoArquivos(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        await api.post(`/pastas-paciente/${pastaSelecionada}/arquivos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      await loadArquivosPasta(pastaSelecionada)
      showSuccess('Arquivo(s) importado(s).')
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao importar arquivo(s).')
    } finally {
      setImportandoArquivos(false)
    }
    e.target.value = ''
  }

  // Abrir visualização do arquivo na mesma tela (modal)
  const abrirVisualizadorArquivo = (arq) => {
    setArquivoVisualizador({ arq })
    setVisualizadorUrl(null)
    if (!arq.url) {
      api.get(`/pastas-paciente/arquivos/${arq.id}`, { responseType: 'blob' })
        .then((response) => {
          const url = URL.createObjectURL(response.data)
          setVisualizadorUrl(url)
        })
        .catch(() => showError('Erro ao carregar o arquivo para visualização.'))
    }
  }

  const fecharVisualizadorArquivo = () => {
    if (visualizadorUrl && visualizadorUrl.startsWith('blob:')) URL.revokeObjectURL(visualizadorUrl)
    setArquivoVisualizador(null)
    setVisualizadorUrl(null)
  }

  const handleDownloadArquivo = async (arq) => {
    const nomeOriginal = arq.nome || 'arquivo'
    try {
      const response = await api.get(`/pastas-paciente/arquivos/${arq.id}`, { responseType: 'blob' })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeOriginal
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('Download iniciado.')
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao fazer download.')
    }
  }

  const handleExcluirArquivo = async (arquivoId) => {
    try {
      await api.delete(`/pastas-paciente/arquivos/${arquivoId}`)
      setArquivosPorPasta((prev) => ({
        ...prev,
        [pastaSelecionada]: (prev[pastaSelecionada] || []).filter((a) => a.id !== arquivoId)
      }))
      showSuccess('Arquivo excluído.')
    } catch (error) {
      showError(error.response?.data?.message || 'Erro ao excluir arquivo.')
    }
  }

  const arquivosPorPastaRef = useRef(arquivosPorPasta)
  arquivosPorPastaRef.current = arquivosPorPasta
  useEffect(() => {
    return () => {
      Object.values(arquivosPorPastaRef.current).flat().forEach((arq) => {
        if (arq.url && arq.url.startsWith('blob:')) URL.revokeObjectURL(arq.url)
      })
    }
  }, [])

  // Helper: formata tamanho do arquivo
  const formatarTamanhoArquivo = (tamanho) => {
    if (tamanho == null) return ''
    if (tamanho < 1024) return `${tamanho} B`
    if (tamanho < 1024 * 1024) return `${(tamanho / 1024).toFixed(1)} KB`
    return `${(tamanho / 1024 / 1024).toFixed(1)} MB`
  }

  // Renderizar um card de arquivo (quadrado com preview ou ícone por tipo)
  // Tipo do arquivo: extensão após o último . em nomeOriginal (arq.nome)
  const renderArquivoCard = (arq) => {
    const nomeOriginal = arq.nome || ''
    const ext = nomeOriginal.includes('.') ? nomeOriginal.toLowerCase().split('.').pop() : ''
    const isPdf = (arq.tipo && arq.tipo.includes('pdf')) || ext === 'pdf'
    const isWord = ['doc', 'docx'].includes(ext) || (arq.tipo && arq.tipo.includes('word'))
    const isExcel = ['xls', 'xlsx'].includes(ext) || (arq.tipo && arq.tipo.includes('sheet'))
    const isImage = (arq.tipo && arq.tipo.startsWith('image/')) || /^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext)
    let iconBlock = (
      <div className="arquivo-card-icon arquivo-card-icon-file">
        <FontAwesomeIcon icon={faFile} />
      </div>
    )
    if (arq.url && isImage) {
      iconBlock = <ImagemPreviewComLoading src={arq.url} className="arquivo-card-preview" />
    } else if (isPdf) {
      iconBlock = (
        <div className="arquivo-card-icon arquivo-card-icon-pdf">
          <FontAwesomeIcon icon={faFilePdf} />
        </div>
      )
    } else if (isWord) {
      iconBlock = (
        <div className="arquivo-card-icon arquivo-card-icon-word">
          <FontAwesomeIcon icon={faFileWord} />
        </div>
      )
    } else if (isExcel) {
      iconBlock = (
        <div className="arquivo-card-icon arquivo-card-icon-excel">
          <FontAwesomeIcon icon={faFileExcel} />
        </div>
      )
    }
    return (
      <div
        key={arq.id}
        className="arquivo-card arquivo-card-clicavel"
        role="button"
        tabIndex={0}
        onClick={() => abrirVisualizadorArquivo(arq)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirVisualizadorArquivo(arq) } }}
        title={`Visualizar ${nomeOriginal}`}
      >
        <div className="arquivo-card-quadrado">
          {iconBlock}
        </div>
        <span className="arquivo-card-nome" title={nomeOriginal}>{nomeOriginal}</span>
        <span className="arquivo-card-tamanho">{formatarTamanhoArquivo(arq.tamanho)}</span>
        <button
          type="button"
          className="arquivo-card-excluir"
          onClick={(e) => { e.stopPropagation(); abrirModalExcluirArquivo(arq.id, nomeOriginal) }}
          title="Excluir arquivo"
          aria-label="Excluir arquivo"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    )
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
      {!(telaPastaAberta && pastaSelecionada) && (
        <div className="cliente-detalhes-header">
          <div className="header-actions">
            <button className="btn-back" onClick={() => navigate('/app/clientes')}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Voltar
            </button>
            {isMaster && (
              <>
                <button
                  className="btn-orcamento-header"
                  onClick={() => navigate(`/app/orcamentos/novo?pacienteId=${id}`)}
                >
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  Novo Orçamento
                </button>
                <button
                  className="btn-edit-header"
                  onClick={() => navigate(`/app/clientes/${id}/editar`)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Editar Cliente
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="cliente-detalhes-content">
        {/* Tela dedicada da pasta (ao clicar numa pasta) */}
        {telaPastaAberta && pastaSelecionada ? (
          <div className="tela-pasta">
            <div className="tela-pasta-header">
              <button type="button" className="btn-voltar-pasta" onClick={voltarParaDetalhes}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span className="btn-voltar-pasta-text">Voltar</span>
              </button>
              {editandoPastaId === pastaSelecionada ? (
                <div className="tela-pasta-titulo-edit">
                  <input
                    type="text"
                    value={editandoPastaNome}
                    onChange={(e) => setEditandoPastaNome(e.target.value)}
                    onBlur={() => handleSalvarNomePasta(pastaSelecionada)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSalvarNomePasta(pastaSelecionada)
                      if (e.key === 'Escape') { setEditandoPastaId(null); setEditandoPastaNome('') }
                    }}
                    className="input-edit-pasta-titulo"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="tela-pasta-titulo-wrap">
                  <h1 className="tela-pasta-titulo">
                    <FontAwesomeIcon icon={faFolder} />
                    <span className="tela-pasta-titulo-nome">{pastas.find((p) => p.id === pastaSelecionada)?.nome}</span>
                  </h1>
                  <button type="button" className="btn-edit-pasta" onClick={() => { setEditandoPastaId(pastaSelecionada); setEditandoPastaNome(pastas.find((p) => p.id === pastaSelecionada)?.nome || '') }} title="Editar nome">
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button type="button" className="btn-delete-pasta" onClick={() => abrirModalExcluirPasta(pastaSelecionada)} title="Excluir pasta">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              )}
            </div>
            <div className="tela-pasta-body">
              {loadingArquivos ? (
                <div className="pasta-loading-arquivos">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <p>Carregando arquivos...</p>
                </div>
              ) : (
              <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                className="input-file-hidden"
                onChange={handleImportarArquivos}
                aria-label="Importar arquivos"
              />
              {(arquivosPorPasta[pastaSelecionada] || []).length === 0 ? (
                <div className="pasta-vazia-layout">
                  <div className="pasta-vazia-icon">
                    <FontAwesomeIcon icon={faFolder} />
                  </div>
                  <p className="pasta-vazia-titulo">Esta pasta está vazia</p>
                  <p className="pasta-vazia-desc">Importe documentos, imagens ou qualquer arquivo para organizar as informações do cliente.</p>
                  <button
                    type="button"
                    className="btn-importar-arquivos-grande"
                    onClick={() => !importandoArquivos && fileInputRef.current?.click()}
                    disabled={importandoArquivos}
                  >
                    {importandoArquivos ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Importando...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} />
                        Importar arquivos
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pasta-com-arquivos">
                  <div className="pasta-com-arquivos-header">
                    <button
                      type="button"
                      className="btn-adicionar-mais"
                      onClick={() => !importandoArquivos && fileInputRef.current?.click()}
                      disabled={importandoArquivos}
                    >
                      {importandoArquivos ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          Importando...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPlus} />
                          Adicionar mais arquivos
                        </>
                      )}
                    </button>
                  </div>
                  <div className="arquivos-grid tela-pasta-lista">
                    {(arquivosPorPasta[pastaSelecionada] || []).map((arq) => renderArquivoCard(arq))}
                  </div>
                </div>
              )}
            </>
              )}
            </div>
          </div>
        ) : (
        <>
        <div className="cliente-ficha">
          <div className="ficha-header">
            <div className="cliente-avatar-large">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            <div className="cliente-info-main">
              <h1>{cliente.nome}</h1>
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
                {cliente.dataNascimento && (() => {
                  const infoAniversario = verificarAniversarioProximo(cliente.dataNascimento)
                  return (
                    <div className="ficha-item">
                      <label>
                        <FontAwesomeIcon icon={faCalendarAlt} /> Data de Nascimento
                        {infoAniversario && (
                          <span className="aniversario-badge" title={`Aniversário em ${Math.abs(infoAniversario.dias)} ${Math.abs(infoAniversario.dias) === 1 ? 'dia' : 'dias'}`}>
                            <FontAwesomeIcon icon={faBirthdayCake} />
                            {infoAniversario.dias === 0 
                              ? 'Aniversário hoje!' 
                              : infoAniversario.dias < 0
                              ? `Aniversário há ${Math.abs(infoAniversario.dias)} ${Math.abs(infoAniversario.dias) === 1 ? 'dia' : 'dias'}`
                              : `Aniversário em ${infoAniversario.dias} ${infoAniversario.dias === 1 ? 'dia' : 'dias'}`
                            }
                          </span>
                        )}
                      </label>
                      <p>{formatarDataNascimento(cliente.dataNascimento)}</p>
                    </div>
                  )
                })()}
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
                <div className="ficha-item">
                  <label>
                    <FontAwesomeIcon icon={getStatusIcon(cliente.status)} /> Status
                  </label>
                  {isMaster ? (
                    <div className="status-dropdown-container" ref={statusDropdownRef}>
                      <span 
                        className="status-badge-large status-badge-clickable"
                        style={{ backgroundColor: getStatusColor(cliente.status) }}
                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                        title="Clique para alterar status"
                      >
                        <FontAwesomeIcon icon={getStatusIcon(cliente.status)} />
                        {getStatusLabel(cliente.status)}
                        <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${statusDropdownOpen ? 'open' : ''}`} />
                      </span>
                      {statusDropdownOpen && (
                        <div className="status-dropdown-menu">
                          {['avaliacao-realizada', 'em-andamento', 'aprovado', 'tratamento-concluido', 'perdido'].map((statusOption) => (
                            <div
                              key={statusOption}
                              className={`status-dropdown-item ${cliente.status === statusOption ? 'active' : ''}`}
                              style={{ backgroundColor: getStatusColor(statusOption) }}
                              onClick={() => handleUpdateStatus(statusOption)}
                            >
                              <FontAwesomeIcon icon={getStatusIcon(statusOption)} />
                              <span>{getStatusLabel(statusOption)}</span>
                              {cliente.status === statusOption && (
                                <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>
                      <span 
                        className="status-badge-large"
                        style={{ backgroundColor: getStatusColor(cliente.status) }}
                      >
                        <FontAwesomeIcon icon={getStatusIcon(cliente.status)} />
                        {getStatusLabel(cliente.status)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {cliente.endereco && (
              <div className="ficha-section">
                <div className="section-header-actions">
                  <h2>
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    Endereço
                  </h2>
                  <button
                    className="btn-expand-endereco"
                    onClick={() => setEnderecoExpandido(!enderecoExpandido)}
                    title={enderecoExpandido ? 'Minimizar' : 'Expandir'}
                  >
                    <FontAwesomeIcon icon={enderecoExpandido ? faChevronUp : faChevronDown} />
                  </button>
                </div>
                {enderecoExpandido && (
                  <div className="ficha-grid">
                    {cliente.endereco.rua && (
                      <div className="ficha-item">
                        <label>Rua</label>
                        <p>
                          {cliente.endereco.rua}
                          {cliente.endereco.numero && `, ${cliente.endereco.numero}`}
                          {cliente.endereco.complemento && ` - ${cliente.endereco.complemento}`}
                        </p>
                      </div>
                    )}
                    {cliente.endereco.bairro && (
                      <div className="ficha-item">
                        <label>Bairro</label>
                        <p>{cliente.endereco.bairro}</p>
                      </div>
                    )}
                    {(cliente.endereco.cidade || cliente.endereco.estado) && (
                      <div className="ficha-item">
                        <label>Cidade</label>
                        <p>
                          {cliente.endereco.cidade}
                          {cliente.endereco.estado && ` - ${cliente.endereco.estado}`}
                        </p>
                      </div>
                    )}
                    {cliente.endereco.cep && (
                      <div className="ficha-item">
                        <label>CEP</label>
                        <p>{formatCEP(cliente.endereco.cep)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pastas e Arquivos - abaixo de Endereço; botão à direita, verde */}
            <div className="ficha-section ficha-section-pastas">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faFolder} />
                  Documentos
                </h2>
                <button
                  type="button"
                  className="btn-nova-pasta"
                  onClick={() => setIsCriandoPasta(true)}
                  disabled={isCriandoPasta}
                >
                  <FontAwesomeIcon icon={faFolderPlus} />
                  Nova pasta
                </button>
              </div>
              <div className="pastas-arquivos-wrap">
                <div className="pastas-lista">
                  {loadingPastas ? (
                    <p className="pastas-loading"><FontAwesomeIcon icon={faSpinner} spin /> Carregando pastas...</p>
                  ) : (
                  <>
                  {pastas.map((pasta) => (
                    <button
                      key={pasta.id}
                      type="button"
                      className="pasta-item"
                      onClick={() => abrirTelaPasta(pasta.id)}
                    >
                      <FontAwesomeIcon icon={faFolder} />
                      <span>{pasta.nome}</span>
                    </button>
                  ))}
                  {isCriandoPasta && (
                    <div className="pasta-item pasta-item-input-wrap">
                      <FontAwesomeIcon icon={faFolder} className="pasta-item-input-icon" />
                      <input
                        ref={novaPastaInputRef}
                        type="text"
                        value={nomeNovaPasta}
                        onChange={(e) => setNomeNovaPasta(e.target.value)}
                        onBlur={confirmarOuCancelarNovaPasta}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmarOuCancelarNovaPasta()
                          if (e.key === 'Escape') { setIsCriandoPasta(false); setNomeNovaPasta(''); e.target.blur() }
                        }}
                        placeholder="Nome da pasta"
                        className="input-nova-pasta-inline"
                      />
                    </div>
                  )}
                  {pastas.length === 0 && !isCriandoPasta && (
                    <p className="pastas-empty">Nenhuma pasta ainda. Clique em &quot;Nova pasta&quot; para criar.</p>
                  )}
                  </>
                  )}
                </div>
              </div>
            </div>

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
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faClipboardQuestion} />
                  Anamneses
                </h2>
                {isMaster && (
                  <button
                    className="btn-add-anamnese"
                    onClick={() => {
                      setShowVincularAnamneseModal(true)
                      loadAnamnesesDisponiveis()
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Vincular Anamnese
                  </button>
                )}
              </div>

              {anamnesesVinculadas.length === 0 ? (
                <p className="empty-text">Nenhuma anamnese vinculada ainda.</p>
              ) : (
                <div className="anamneses-list">
                  {anamnesesVinculadas.map((respostaAnamnese) => (
                    <div key={respostaAnamnese.id} className={`anamnese-item ${respostaAnamnese.ativa ? 'ativa' : ''}`}>
                      <div className="anamnese-item-header">
                        <div className="anamnese-info">
                          <div className="anamnese-title-row">
                            <h4>{respostaAnamnese.anamnese?.titulo || 'Anamnese'}</h4>
                            <div className="anamnese-status-header">

                              {respostaAnamnese.concluida && (
                                <span className="status-badge-concluida">
                                  <FontAwesomeIcon icon={faCheck} />
                                  Concluída
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isMaster && (
                          <div className="anamnese-actions">
                            {respostaAnamnese.concluida && (
                              <button
                                className="btn-ver-respostas"
                                onClick={() => handleVerRespostas(respostaAnamnese.id)}
                                title="Ver respostas do paciente"
                              >
                                <FontAwesomeIcon icon={faEye} />
                                <span>Ver Respostas</span>
                              </button>
                            )}
                            {!respostaAnamnese.ativa ? (
                              <button
                                className="btn-ativar-anamnese"
                                onClick={() => handleAtivarAnamnese(respostaAnamnese.id)}
                                title="Ativar anamnese"
                              >
                                <FontAwesomeIcon icon={faToggleOn} />
                                <span>Ativar</span>
                              </button>
                            ) : (
                              <button
                                className="btn-desativar-anamnese"
                                onClick={() => handleDesativarAnamnese(respostaAnamnese.id)}
                                title="Desativar anamnese"
                              >
                                <FontAwesomeIcon icon={faToggleOff} />
                                <span>Desativar</span>
                              </button>
                            )}
                            {!respostaAnamnese.concluida && (
                              <>
                                <button
                                  className="btn-whatsapp-anamnese"
                                  onClick={() => {
                                    setWhatsAppAnamneseId(respostaAnamnese.id)
                                    setWhatsAppAnamnesePhoneNumber(cliente.telefone || '')
                                    setShowWhatsAppAnamneseModal(true)
                                  }}
                                  title="Enviar via WhatsApp"
                                >
                                  <FontAwesomeIcon icon={faWhatsapp} />
                                </button>
                                <button
                                  className="btn-compartilhar-anamnese"
                                  onClick={() => handleCompartilharLink(respostaAnamnese.id)}
                                  title="Compartilhar link para responder"
                                >
                                  <FontAwesomeIcon icon={faShareAlt} />
                                </button>
                                <button
                                  className="btn-copiar-link-anamnese"
                                  onClick={() => handleCopiarLink(respostaAnamnese.id)}
                                  title="Copiar link para responder"
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {respostaAnamnese.anamnese?.descricao && (
                        <p className="anamnese-descricao">{respostaAnamnese.anamnese.descricao}</p>
                      )}
                      <div className="anamnese-meta">
                        <span>Perguntas: {respostaAnamnese.anamnese?.perguntas?.length || 0}</span>
                        <span>Criada em: {new Date(respostaAnamnese.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ficha-section">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faComment} />
                  Feedback
                </h2>
                {isMaster && (
                  <button
                    className="btn-add-anamnese"
                    onClick={() => navigate('/app/feedback')}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Gerenciar Questionários
                  </button>
                )}
              </div>

              {questionarios.length === 0 ? (
                <p className="empty-text">Nenhum questionário enviado para este paciente ainda.</p>
              ) : (
                <div className="questionarios-list">
                  {questionarios.map((questionarioResposta) => (
                    <div 
                      key={questionarioResposta.id} 
                      className={`questionario-item ${questionarioResposta.concluida ? 'concluida' : ''}`}
                    >
                      <div className="questionario-item-header">
                        <div className="questionario-info">
                          <div className="questionario-title-row">
                            <h4>{questionarioResposta.questionario?.titulo || 'Questionário'}</h4>
                            <div className="questionario-status-header">
                              {questionarioResposta.concluida ? (
                                <span className="status-badge-concluida">
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                  Concluído
                                </span>
                              ) : (
                                <span className="status-badge-pendente">
                                  <FontAwesomeIcon icon={faClock} />
                                  Pendente
                                </span>
                              )}
                            </div>
                          </div>
                          {questionarioResposta.questionario?.descricao && (
                            <p className="questionario-descricao">{questionarioResposta.questionario.descricao}</p>
                          )}
                        </div>
                        {isMaster && !questionarioResposta.concluida && (
                          <div className="questionario-actions">
                            <button
                              className="btn-whatsapp-questionario"
                              onClick={() => {
                                setWhatsAppQuestionarioId(questionarioResposta.id)
                                setWhatsAppPhoneNumber(cliente.telefone || '')
                                setShowWhatsAppModal(true)
                              }}
                              title="Enviar via WhatsApp"
                            >
                              <FontAwesomeIcon icon={faWhatsapp} />
                            </button>
                            <button
                              className="btn-compartilhar-anamnese"
                              onClick={() => handleCompartilharLinkQuestionario(questionarioResposta.id)}
                              title="Compartilhar link"
                            >
                              <FontAwesomeIcon icon={faShareAlt} />
                            </button>
                            <button
                              className="btn-copiar-link-anamnese"
                              onClick={() => handleCopiarLinkQuestionario(questionarioResposta.id)}
                              title="Copiar link"
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="questionario-meta">
                        <span>Enviado em: {new Date(questionarioResposta.createdAt).toLocaleDateString('pt-BR')}</span>
                        {questionarioResposta.concluida && questionarioResposta.updatedAt && (
                          <span>Concluído em: {new Date(questionarioResposta.updatedAt).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ficha-section">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  Orçamentos
                </h2>
                {isMaster && (
                  <button
                    className="btn-add-anamnese"
                    onClick={() => navigate(`/app/orcamentos/novo?pacienteId=${id}`)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Novo Orçamento
                  </button>
                )}
              </div>
              {loadingOrcamentos ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                </div>
              ) : orcamentos.length > 0 ? (
                <div className="orcamentos-list-cliente">
                  {orcamentos.map((orcamento) => (
                    <div key={orcamento.id} className="orcamento-item-cliente">
                      <div className="orcamento-item-header-cliente">
                        <div className="orcamento-item-info-cliente">
                          <div className="orcamento-item-title-cliente">
                            <span className="orcamento-id-cliente">
                              Orçamento #{orcamento.id?.substring(0, 8)}
                            </span>
                            {isMaster ? (
                              <div 
                                className="status-dropdown-container" 
                                ref={el => orcamentoStatusRefs.current[orcamento.id] = el}
                              >
                                <span 
                                  className="orcamento-status-badge-cliente status-badge-clickable"
                                  style={{ backgroundColor: getOrcamentoStatusColor(orcamento.status) }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const isMobileDevice = window.innerWidth <= 768
                                    if (isMobileDevice) {
                                      setShowOrcamentoStatusModal(orcamento.id)
                                      setOrcamentoStatusDropdowns(prev => {
                                        const newState = { ...prev }
                                        delete newState[orcamento.id]
                                        return newState
                                      })
                                    } else {
                                      setOrcamentoStatusDropdowns(prev => ({
                                        ...prev,
                                        [orcamento.id]: !prev[orcamento.id]
                                      }))
                                      setShowOrcamentoStatusModal(null)
                                    }
                                  }}
                                  title="Clique para alterar status"
                                >
                                  {getOrcamentoStatusLabel(orcamento.status)}
                                  <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${orcamentoStatusDropdowns[orcamento.id] ? 'open' : ''}`} />
                                </span>
                                {!isMobile && orcamentoStatusDropdowns[orcamento.id] && (
                                  <div className="status-dropdown-menu">
                                    {['RASCUNHO', 'ENVIADO', 'ACEITO', 'EM_ANDAMENTO', 'FINALIZADO', 'RECUSADO', 'CANCELADO'].map((statusOption) => (
                                      <div
                                        key={statusOption}
                                        className={`status-dropdown-item ${orcamento.status === statusOption ? 'active' : ''}`}
                                        style={{ backgroundColor: getOrcamentoStatusColor(statusOption) }}
                                        onClick={() => handleUpdateOrcamentoStatus(orcamento.id, statusOption)}
                                      >
                                        <span>{getOrcamentoStatusLabel(statusOption)}</span>
                                        {orcamento.status === statusOption && (
                                          <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span 
                                className="orcamento-status-badge-cliente"
                                style={{ backgroundColor: getOrcamentoStatusColor(orcamento.status) }}
                              >
                                {getOrcamentoStatusLabel(orcamento.status)}
                              </span>
                            )}
                          </div>
                          <div className="orcamento-item-meta-cliente">
                            <span className="orcamento-valor-cliente">
                              {formatCurrency(orcamento.valorTotal || 0)}
                            </span>
                            <span className="orcamento-data-cliente">
                              {formatDateOrcamento(orcamento.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn-view-orcamento"
                          onClick={() => navigate(`/app/orcamentos/${orcamento.id}`)}
                          title="Ver detalhes"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                      {orcamento.itens && orcamento.itens.length > 0 && (
                        <div className="orcamento-itens-cliente">
                          {orcamento.itens.map((item, idx) => (
                            <div key={idx} className="orcamento-item-item-cliente">
                              <div className="item-info-cliente">
                                <span className="item-nome-cliente">{item.nome || item.descricao}</span>
                                <span className="item-valor-cliente">{formatCurrency((item.preco || 0) * (item.quantidade || 1))}</span>
                              </div>
                              {isMaster ? (
                                <div 
                                  className="status-dropdown-container" 
                                  ref={el => itemStatusRefs.current[`${orcamento.id}_${idx}`] = el}
                                >
                                  <span 
                                    className="item-status-badge-cliente status-badge-clickable"
                                    style={{ backgroundColor: getItemStatusColor(item.status) }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const key = `${orcamento.id}_${idx}`
                                      const isMobileDevice = window.innerWidth <= 768
                                      if (isMobileDevice) {
                                        setShowItemStatusModal({ orcamentoId: orcamento.id, itemIndex: idx, itemId: item.id })
                                        setItemStatusDropdowns(prev => {
                                          const newState = { ...prev }
                                          delete newState[key]
                                          return newState
                                        })
                                      } else {
                                        setItemStatusDropdowns(prev => ({
                                          ...prev,
                                          [key]: !prev[key]
                                        }))
                                        setShowItemStatusModal(null)
                                      }
                                    }}
                                    title="Clique para alterar status"
                                  >
                                    {getItemStatusLabel(item.status)}
                                    <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${itemStatusDropdowns[`${orcamento.id}_${idx}`] ? 'open' : ''}`} />
                                  </span>
                                  {!isMobile && itemStatusDropdowns[`${orcamento.id}_${idx}`] && (
                                    <div className="status-dropdown-menu">
                                      {['EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO'].map((statusOption) => (
                                        <div
                                          key={statusOption}
                                          className={`status-dropdown-item ${item.status === statusOption ? 'active' : ''}`}
                                          style={{ backgroundColor: getItemStatusColor(statusOption) }}
                                          onClick={() => handleUpdateItemStatus(orcamento.id, item.id, idx, statusOption)}
                                        >
                                          <span>{getItemStatusLabel(statusOption)}</span>
                                          {item.status === statusOption && (
                                            <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span 
                                  className="item-status-badge-cliente"
                                  style={{ backgroundColor: getItemStatusColor(item.status) }}
                                >
                                  {getItemStatusLabel(item.status)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">Nenhum orçamento cadastrado para este paciente.</p>
              )}
            </div>

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
        </>
        )}
      </div>

      {/* Modal de confirmação de exclusão (pasta ou arquivo) */}
      {showConfirmExcluirModal && confirmExcluirPayload && (
        <div className="modal-overlay" onClick={fecharModalConfirmarExcluir}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>
              {confirmExcluirPayload.tipo === 'pasta' ? 'Excluir pasta' : 'Excluir arquivo'}
            </h3>
            <p>
              {confirmExcluirPayload.tipo === 'pasta'
                ? <>Tem certeza que deseja excluir a pasta <strong>{confirmExcluirPayload.nome}</strong> e todos os arquivos?</>
                : <>Tem certeza que deseja excluir o arquivo <strong>{confirmExcluirPayload.nome}</strong>?</>
              }
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={fecharModalConfirmarExcluir}>
                Cancelar
              </button>
              <button type="button" className="btn-modal-delete" onClick={confirmarExclusao}>
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização do arquivo */}
      {arquivoVisualizador && (
        <div className="modal-overlay" onClick={fecharVisualizadorArquivo}>
          <div className="modal-visualizador-arquivo" onClick={(e) => e.stopPropagation()}>
            <div className="modal-visualizador-header">
              <span className="modal-visualizador-titulo" title={arquivoVisualizador.arq.nome}>
                {arquivoVisualizador.arq.nome}
              </span>
              <button type="button" className="modal-visualizador-fechar" onClick={fecharVisualizadorArquivo} title="Fechar">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-visualizador-body">
              {(() => {
                const arq = arquivoVisualizador.arq
                const urlParaExibir = arq.url || visualizadorUrl
                const nomeOriginal = arq.nome || ''
                const ext = nomeOriginal.includes('.') ? nomeOriginal.toLowerCase().split('.').pop() : ''
                const isImage = /^(jpg|jpeg|png|gif|webp|bmp)$/i.test(ext) || (arq.tipo && arq.tipo.startsWith('image/'))
                const isPdf = ext === 'pdf' || (arq.tipo && arq.tipo.includes('pdf'))
                if (!urlParaExibir && !arq.url) {
                  return (
                    <div className="modal-visualizador-loading">
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <p>Carregando visualização...</p>
                    </div>
                  )
                }
                if (isImage && urlParaExibir) {
                  return <img src={urlParaExibir} alt="" className="modal-visualizador-img" />
                }
                if (isPdf && urlParaExibir) {
                  return <iframe src={urlParaExibir} title={nomeOriginal} className="modal-visualizador-iframe" />
                }
                return (
                  <div className="modal-visualizador-outro">
                    <FontAwesomeIcon icon={faFile} />
                    <p>Pré-visualização não disponível para este tipo de arquivo.</p>
                    <p className="modal-visualizador-download-hint">Use o botão &quot;Fazer download&quot; para abrir o arquivo.</p>
                  </div>
                )
              })()}
            </div>
            <div className="modal-visualizador-footer">
              <button type="button" className="btn-download-arquivo" onClick={() => handleDownloadArquivo(arquivoVisualizador.arq)}>
                <FontAwesomeIcon icon={faDownload} />
                Fazer download
              </button>
              <button type="button" className="btn-fechar-visualizador" onClick={fecharVisualizadorArquivo}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal Vincular Anamnese */}
      {showVincularAnamneseModal && (
        <div className="modal-overlay" onClick={() => setShowVincularAnamneseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Vincular Anamnese</h3>
            {loadingAnamneses ? (
              <p>Carregando anamneses...</p>
            ) : (
              <>
                <select
                  value={anamneseParaVincular}
                  onChange={(e) => setAnamneseParaVincular(e.target.value)}
                  style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem' }}
                >
                  <option value="">Selecione uma anamnese</option>
                  {anamnesesDisponiveis.map((anamnese) => (
                    <option key={anamnese.id} value={anamnese.id}>
                      {anamnese.titulo}
                    </option>
                  ))}
                </select>
                {anamnesesDisponiveis.length === 0 && (
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Todas as anamneses já estão vinculadas ou não há anamneses disponíveis.
                  </p>
                )}
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => {
                    setShowVincularAnamneseModal(false)
                    setAnamneseParaVincular('')
                  }}>
                    Cancelar
                  </button>
                  <button 
                    className="btn-save" 
                    onClick={handleVincularAnamnese}
                    disabled={!anamneseParaVincular || anamnesesDisponiveis.length === 0}
                  >
                    Vincular
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Respostas da Anamnese */}
      {showRespostasModal && respostasAnamnese && (
        <div className="modal-overlay" onClick={() => setShowRespostasModal(false)}>
          <div className="modal-content modal-respostas" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Respostas da Anamnese</h3>
              <button 
                className="btn-close-modal" 
                onClick={() => setShowRespostasModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {loadingRespostas ? (
              <div className="loading-respostas">
                <FontAwesomeIcon icon={faSpinner} spin />
                <p>Carregando respostas...</p>
              </div>
            ) : (
              <div className="respostas-content">
                <div className="respostas-header-info">
                  <h4>{respostasAnamnese.anamnese?.titulo || 'Anamnese'}</h4>
                  {respostasAnamnese.anamnese?.descricao && (
                    <p className="respostas-descricao">{respostasAnamnese.anamnese.descricao}</p>
                  )}
                  <div className="respostas-meta">
                    <span>Respondida em: {new Date(respostasAnamnese.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>

                <div className="respostas-list">
                  {respostasAnamnese.respostasPerguntas && respostasAnamnese.respostasPerguntas.length > 0 ? (
                    respostasAnamnese.respostasPerguntas
                      .sort((a, b) => {
                        const ordemA = a.pergunta?.ordem ?? 999
                        const ordemB = b.pergunta?.ordem ?? 999
                        return ordemA - ordemB
                      })
                      .map((respostaPergunta, index) => {
                        const pergunta = respostaPergunta.pergunta
                        if (!pergunta) return null
                        
                        return (
                          <div key={respostaPergunta.id || index} className="resposta-item">
                            <div className="resposta-pergunta">
                              <span className="resposta-numero">{index + 1}</span>
                              <div style={{ flex: 1 }}>
                                <span className="resposta-texto">
                                  {pergunta.texto}
                                  {pergunta.obrigatoria && <span className="required-mark">*</span>}
                                </span>
                              </div>
                            </div>
                            <div className="resposta-valor">
                              {formatarResposta(respostaPergunta.valor, pergunta.tipoResposta)}
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <p className="empty-respostas">Nenhuma resposta encontrada.</p>
                  )}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn-close" 
                onClick={() => setShowRespostasModal(false)}
              >
                Fechar
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

      {/* Modal de status do orçamento (mobile) */}
      {showOrcamentoStatusModal && (
        <div className="modal-overlay" onClick={() => setShowOrcamentoStatusModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Status do Orçamento</h3>
              <button className="modal-close" onClick={() => setShowOrcamentoStatusModal(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {['RASCUNHO', 'ENVIADO', 'ACEITO', 'EM_ANDAMENTO', 'FINALIZADO', 'RECUSADO', 'CANCELADO'].map((statusOption) => {
                const orcamento = orcamentos.find(o => o.id === showOrcamentoStatusModal)
                return (
                  <div
                    key={statusOption}
                    className={`modal-status-item ${orcamento?.status === statusOption ? 'active' : ''}`}
                    style={{ backgroundColor: getOrcamentoStatusColor(statusOption) }}
                    onClick={() => handleUpdateOrcamentoStatus(showOrcamentoStatusModal, statusOption)}
                  >
                    <span>{getOrcamentoStatusLabel(statusOption)}</span>
                    {orcamento?.status === statusOption && (
                      <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowOrcamentoStatusModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de status do item (mobile) */}
      {showItemStatusModal && (
        <div className="modal-overlay" onClick={() => setShowItemStatusModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Status do Item</h3>
              <button className="modal-close" onClick={() => setShowItemStatusModal(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              {['EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO'].map((statusOption) => {
                const orcamento = orcamentos.find(o => o.id === showItemStatusModal.orcamentoId)
                const item = orcamento?.itens?.[showItemStatusModal.itemIndex]
                return (
                  <div
                    key={statusOption}
                    className={`modal-status-item ${item?.status === statusOption ? 'active' : ''}`}
                    style={{ backgroundColor: getItemStatusColor(statusOption) }}
                    onClick={() => handleUpdateItemStatus(
                      showItemStatusModal.orcamentoId,
                      showItemStatusModal.itemId,
                      showItemStatusModal.itemIndex,
                      statusOption
                    )}
                  >
                    <span>{getItemStatusLabel(statusOption)}</span>
                    {item?.status === statusOption && (
                      <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowItemStatusModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envio via WhatsApp */}
      {showWhatsAppModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppModal(false)}>
          <div className="modal-content modal-whatsapp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FontAwesomeIcon icon={faWhatsapp} style={{ color: '#25D366', marginRight: '0.5rem' }} />
                Enviar via WhatsApp
              </h3>
              <button className="modal-close" onClick={() => setShowWhatsAppModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.625rem', fontSize: '0.8125rem' }}>
                O link será enviado para:
              </p>
              <div style={{ 
                padding: '0.625rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem'
              }}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                  {cliente?.nome || 'Nome não informado'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {formatTelefone(whatsAppPhoneNumber)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowWhatsAppModal(false)
                  setWhatsAppPhoneNumber('')
                  setWhatsAppQuestionarioId(null)
                }}
                disabled={sendingWhatsApp}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleEnviarWhatsApp}
                disabled={sendingWhatsApp || !whatsAppPhoneNumber.trim()}
                style={{
                  background: sendingWhatsApp ? 'rgba(37, 211, 102, 0.5)' : '#25D366',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {sendingWhatsApp ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWhatsapp} />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envio via WhatsApp - Anamnese */}
      {showWhatsAppAnamneseModal && (
        <div className="modal-overlay" onClick={() => setShowWhatsAppAnamneseModal(false)}>
          <div className="modal-content modal-whatsapp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FontAwesomeIcon icon={faWhatsapp} style={{ color: '#25D366', marginRight: '0.5rem' }} />
                Enviar via WhatsApp
              </h3>
              <button className="modal-close" onClick={() => setShowWhatsAppAnamneseModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.625rem', fontSize: '0.8125rem' }}>
                O link será enviado para:
              </p>
              <div style={{ 
                padding: '0.625rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem'
              }}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                  {cliente?.nome || 'Nome não informado'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {formatTelefone(whatsAppAnamnesePhoneNumber)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowWhatsAppAnamneseModal(false)
                  setWhatsAppAnamnesePhoneNumber('')
                  setWhatsAppAnamneseId(null)
                }}
                disabled={sendingWhatsAppAnamnese}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleEnviarWhatsAppAnamnese}
                disabled={sendingWhatsAppAnamnese || !whatsAppAnamnesePhoneNumber.trim()}
                style={{
                  background: sendingWhatsAppAnamnese ? 'rgba(37, 211, 102, 0.5)' : '#25D366',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {sendingWhatsAppAnamnese ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faWhatsapp} />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClienteDetalhes

