import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faXRay, faArrowLeft, faFileMedical, faCalendar, faUser,
  faCheck, faStethoscope, faFileAlt, faEnvelope, faPencil,
  faEdit, faSave, faTrash, faPlus, faTimes, faExclamationTriangle,
  faEye, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import {
  NECESSIDADES_STATUS_LABELS,
  NECESSIDADES_STATUS_OPCOES_NOVA,
  NECESSIDADES_STATUS_PADRAO_NOVA,
  necessidadesApi
} from '../utils/necessidades'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import exameImage from '../img/exame.jpg'
import './DiagnosticoDetalhes.css'

// Importar todos os SVGs dos dentes
import dente11 from '../img/dentes/11.svg'
import dente12 from '../img/dentes/12.svg'
import dente13 from '../img/dentes/13.svg'
import dente14 from '../img/dentes/14.svg'
import dente15 from '../img/dentes/15.svg'
import dente16 from '../img/dentes/16.svg'
import dente17 from '../img/dentes/17.svg'
import dente18 from '../img/dentes/18.svg'
import dente21 from '../img/dentes/21.svg'
import dente22 from '../img/dentes/22.svg'
import dente23 from '../img/dentes/23.svg'
import dente24 from '../img/dentes/24.svg'
import dente25 from '../img/dentes/25.svg'
import dente26 from '../img/dentes/26.svg'
import dente27 from '../img/dentes/27.svg'
import dente28 from '../img/dentes/28.svg'
import dente31 from '../img/dentes/31.svg'
import dente32 from '../img/dentes/32.svg'
import dente33 from '../img/dentes/33.svg'
import dente34 from '../img/dentes/34.svg'
import dente35 from '../img/dentes/35.svg'
import dente36 from '../img/dentes/36.svg'
import dente37 from '../img/dentes/37.svg'
import dente38 from '../img/dentes/38.svg'
import dente41 from '../img/dentes/41.svg'
import dente42 from '../img/dentes/42.svg'
import dente43 from '../img/dentes/43.svg'
import dente44 from '../img/dentes/44.svg'
import dente45 from '../img/dentes/45.svg'
import dente46 from '../img/dentes/46.svg'
import dente47 from '../img/dentes/47.svg'
import dente48 from '../img/dentes/48.svg'

// Criar objeto com todos os SVGs dos dentes
const dentesSVGs = {
  11: dente11, 12: dente12, 13: dente13, 14: dente14,
  15: dente15, 16: dente16, 17: dente17, 18: dente18,
  21: dente21, 22: dente22, 23: dente23, 24: dente24,
  25: dente25, 26: dente26, 27: dente27, 28: dente28,
  31: dente31, 32: dente32, 33: dente33, 34: dente34,
  35: dente35, 36: dente36, 37: dente37, 38: dente38,
  41: dente41, 42: dente42, 43: dente43, 44: dente44,
  45: dente45, 46: dente46, 47: dente47, 48: dente48
}

// Dados mockados para detalhes
const getMockDetalhes = (diagnosticoId) => {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const semanaPassada = new Date(Date.now() - 604800000).toISOString().split('T')[0]
  
  const mockData = {
    1: {
      id: 1,
      paciente: 'Radiografia Panorâmica - Exemplo',
      descricao: 'Radiografia panorâmica de exemplo demonstrando a análise de estruturas dentárias. Observa-se arcada dentária completa superior e inferior, com dentição mista. Estruturas ósseas preservadas, seios maxilares aéreos, articulação temporomandibular (ATM) bilateralmente preservada. Presença de restaurações em alguns elementos dentários. Não há evidências de lesões periapicais, cistos ou outras patologias ósseas aparentes.',
      tratamento: 'Este é um exemplo de radiografia panorâmica. Para casos reais, recomenda-se:\n\n1. Análise detalhada das estruturas ósseas maxilares e mandibulares\n2. Verificação de integridade dentária e presença de restaurações\n3. Avaliação de possíveis patologias periapicais\n4. Análise dos seios maxilares e ATM\n5. Identificação de dentes inclusos ou impactados\n6. Acompanhamento periódico conforme protocolo clínico',
      data: hoje,
      imagem: exameImage,
      cliente_id: 1,
      cliente_nome: 'João Silva',
      cliente_email: 'joao.silva@email.com',
      achados: [
        'Arcada dentária completa superior e inferior',
        'Estruturas ósseas preservadas',
        'Seios maxilares aéreos',
        'ATM bilateralmente preservada',
        'Presença de restaurações em alguns elementos',
        'Ausência de lesões periapicais aparentes'
      ],
      recomendacoes: [
        'Controle periódico a cada 6 meses',
        'Manutenção da higiene bucal',
        'Acompanhamento das restaurações existentes',
        'Avaliação clínica complementar quando necessário'
      ],
      profissional: 'Dr. Carlos Mendes',
      crm: 'CRO-SP 12345',
      tipoExame: 'Panorâmica'
    },
    2: {
      id: 2,
      paciente: 'Radiografia Periapical - Elemento 36',
      descricao: 'Radiografia periapical do elemento 36 (primeiro molar inferior direito). Observa-se raiz completa, espaço periodontal preservado, sem evidências de lesões periapicais. Presença de restauração em resina composta na face oclusal.',
      tratamento: 'Tratamento recomendado:\n\n1. Manutenção da restauração existente\n2. Controle periódico a cada 6 meses\n3. Orientação sobre higiene bucal\n4. Avaliação clínica complementar',
      data: ontem,
      imagem: exameImage,
      cliente_id: 2,
      cliente_nome: 'Maria Santos',
      cliente_email: 'maria.santos@email.com',
      achados: [
        'Raiz completa do elemento 36',
        'Espaço periodontal preservado',
        'Ausência de lesões periapicais',
        'Restauração em resina composta presente'
      ],
      recomendacoes: [
        'Manutenção da restauração',
        'Controle periódico',
        'Orientação sobre higiene bucal'
      ],
      profissional: 'Dra. Ana Paula',
      crm: 'CRO-SP 67890',
      tipoExame: 'Periapical'
    },
    3: {
      id: 3,
      paciente: 'Radiografia Interproximal - Região Anterior',
      descricao: 'Radiografia interproximal da região anterior superior e inferior. Avaliação de cáries interproximais e contatos dentários. Observa-se boa relação de contato entre os elementos dentários, sem evidências de cáries ou lesões cariosas.',
      tratamento: 'Tratamento:\n\n1. Manutenção preventiva\n2. Aplicação de flúor tópico\n3. Orientação sobre uso de fio dental\n4. Retorno em 6 meses para controle',
      data: semanaPassada,
      imagem: exameImage,
      cliente_id: 3,
      cliente_nome: 'Pedro Oliveira',
      cliente_email: 'pedro.oliveira@email.com',
      achados: [
        'Boa relação de contato entre elementos',
        'Ausência de cáries interproximais',
        'Estruturas dentárias preservadas'
      ],
      recomendacoes: [
        'Manutenção preventiva',
        'Aplicação de flúor tópico',
        'Uso regular de fio dental'
      ],
      profissional: 'Dr. Roberto Lima',
      crm: 'CRO-SP 11111',
      tipoExame: 'Interproximal'
    }
  }
  
  return mockData[diagnosticoId] || mockData[1]
}

const DiagnosticoDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData, user, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  
  // Hook para modal de alerta
  const { alertConfig, showError, hideAlert } = useAlert()
  
  const [diagnostico, setDiagnostico] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profissionalNome, setProfissionalNome] = useState('')
  const [pacienteId, setPacienteId] = useState(null)
  const [isEditingDescricao, setIsEditingDescricao] = useState(false)
  const [isEditingAchados, setIsEditingAchados] = useState(false)
  const [isEditingNecessidades, setIsEditingNecessidades] = useState(false)
  const [isEditingTitulo, setIsEditingTitulo] = useState(false)
  const [isEditingTituloCard, setIsEditingTituloCard] = useState(false)
  const [editedDescricao, setEditedDescricao] = useState('')
  const [editedAchados, setEditedAchados] = useState([])
  const [editedNecessidades, setEditedNecessidades] = useState([])
  const [editedTitulo, setEditedTitulo] = useState('')
  const [editedTituloCard, setEditedTituloCard] = useState('Detalhamento Profissional')
  const [desenhosProfissionais, setDesenhosProfissionais] = useState([])
  const [loadingDesenhos, setLoadingDesenhos] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [showDeleteDesenhoModal, setShowDeleteDesenhoModal] = useState(false)
  const [desenhoToDelete, setDesenhoToDelete] = useState(null)
  const [loadingStatusNecessidadeId, setLoadingStatusNecessidadeId] = useState(null)
  const [openStatusDropdownKey, setOpenStatusDropdownKey] = useState(null)
  const [removingNecessidadeId, setRemovingNecessidadeId] = useState(null)

  useEffect(() => {
    loadDiagnostico()
  }, [id])

  // Fechar dropdown de status ao clicar fora
  useEffect(() => {
    const closeDropdown = (e) => {
      if (openStatusDropdownKey && !e.target.closest('.necessidade-status-dropdown')) {
        setOpenStatusDropdownKey(null)
      }
    }
    document.addEventListener('mousedown', closeDropdown)
    return () => document.removeEventListener('mousedown', closeDropdown)
  }, [openStatusDropdownKey])

  useEffect(() => {
    if (id && diagnostico) {
      loadDesenhosProfissionais()
    }
  }, [id, diagnostico])

  const buscarPacienteId = async (nome, emailPaciente, clienteMasterId) => {
    if ((!nome && !emailPaciente) || !clienteMasterId) {
      return
    }

    try {
      // Buscar lista de pacientes do clienteMasterId
      const response = await api.get(`/pacientes?clienteMasterId=${clienteMasterId}`)
      const pacientes = response.data?.data || response.data || []
      
      // Procurar paciente pelo nome ou email
      const paciente = pacientes.find(p => {
        const nomeMatch = nome && p.nome === nome
        const emailMatch = emailPaciente && p.emailPaciente === emailPaciente
        return nomeMatch || emailMatch
      })
      
      if (paciente && paciente.id) {
        setPacienteId(paciente.id)
      }
    } catch (error) {
      console.error('Erro ao buscar ID do paciente:', error)
    }
  }

  const loadProfissionalNome = async (responsavelId) => {
    if (!responsavelId) return
    
    try {
      // Primeiro tentar usar dados do contexto ou sessionStorage
      const userFromStorage = sessionStorage.getItem('user')
      if (userFromStorage) {
        const userParsed = JSON.parse(userFromStorage)
        if (userParsed.id === responsavelId) {
          setProfissionalNome(userParsed.nome || userParsed.name || '')
          return
        }
      }
      
      // Se o usuário do contexto corresponder
      if (user?.id === responsavelId) {
        setProfissionalNome(user.nome || user.name || '')
        return
      }

      // Verificar se o perfil no selectedClinicData corresponde
      if (selectedClinicData?.perfil?.id === responsavelId) {
        setProfissionalNome(selectedClinicData.perfil.nome || '')
        return
      }

      // Buscar usuário pelo ID usando a rota /users/base/{id}
      try {
        const userResponse = await api.get(`/users/base/${responsavelId}`)
        const userData = userResponse.data?.data || userResponse.data
        
        if (userData && (userData.nome || userData.name || userData.email)) {
          setProfissionalNome(userData.nome || userData.name || userData.email || '')
          return
        }
      } catch (userError) {
      }
    } catch (error) {
      console.error('Erro ao buscar nome do profissional:', error)
    }
  }

  const loadDesenhosProfissionais = async () => {
    try {
      setLoadingDesenhos(true)
      
      if (!id) {
        console.error('ID da radiografia não encontrado')
        setLoadingDesenhos(false)
        return
      }

      // Fazer GET para listar desenhos profissionais da radiografia
      const response = await api.get(`/desenhos-profissionais?radiografiaId=${id}`)
      const desenhos = response.data?.data || response.data || []
      
      setDesenhosProfissionais(desenhos)
      
      // Combinar necessidades dos desenhos profissionais com as necessidades da radiografia
      const necessidadesDosDesenhos = []
      desenhos.forEach(desenho => {
        if (desenho.necessidades && Array.isArray(desenho.necessidades)) {
          desenho.necessidades.forEach(nec => {
            // Adicionar apenas se não for duplicado
            const getNecValue = (n) => {
              if (typeof n === 'object' && n !== null) {
                const partes = []
                if (n.procedimento) partes.push(n.procedimento)
                if (n.anotacoes) partes.push(n.anotacoes)
                if (n.descricao) partes.push(n.descricao)
                if (n.observacao) partes.push(n.observacao)
                return partes.join(' - ') || ''
              }
              return typeof n === 'string' ? n : ''
            }
            
            const necValue = getNecValue(nec)
            
            if (necValue && !necessidadesDosDesenhos.some(n => {
              const nValue = getNecValue(n)
              return nValue === necValue
            })) {
              necessidadesDosDesenhos.push(nec)
            }
          })
        }
      })
      
      // Combinar com as necessidades da radiografia (usar o estado atual do diagnostico)
      const necessidadesRadiografia = diagnostico?.necessidades || []
      const todasNecessidades = [...necessidadesRadiografia, ...necessidadesDosDesenhos]
      
      // Remover duplicatas baseado no valor
      const necessidadesUnicas = []
      const valoresVistos = new Set()
      
      const getNecValue = (nec) => {
        if (typeof nec === 'object' && nec !== null) {
          const partes = []
          if (nec.procedimento) partes.push(nec.procedimento)
          if (nec.anotacoes) partes.push(nec.anotacoes)
          if (nec.descricao) partes.push(nec.descricao)
          if (nec.observacao) partes.push(nec.observacao)
          return partes.join(' - ') || ''
        }
        return typeof nec === 'string' ? nec : ''
      }

      todasNecessidades.forEach(nec => {
        const necValue = getNecValue(nec)
        
        if (necValue && !valoresVistos.has(necValue)) {
          valoresVistos.add(necValue)
          necessidadesUnicas.push(nec)
        }
      })
      
      // Atualizar apenas se houver mudanças para evitar loops infinitos
      setEditedNecessidades(prev => {
        // Comparar se as necessidades são diferentes
        const getNecValue = (n) => {
          if (typeof n === 'object' && n !== null) {
            const partes = []
            if (n.procedimento) partes.push(n.procedimento)
            if (n.anotacoes) partes.push(n.anotacoes)
            if (n.descricao) partes.push(n.descricao)
            if (n.observacao) partes.push(n.observacao)
            return partes.join(' - ') || ''
          }
          return typeof n === 'string' ? n : ''
        }

        const prevValues = prev.map(n => getNecValue(n)).sort().join('|')
        const newValues = necessidadesUnicas.map(n => getNecValue(n)).sort().join('|')
        
        if (prevValues !== newValues) {
          return necessidadesUnicas
        }
        return prev
      })
    } catch (error) {
      console.error('Erro ao carregar desenhos profissionais:', error)
      setDesenhosProfissionais([])
    } finally {
      setLoadingDesenhos(false)
    }
  }


      const loadDiagnostico = async () => {
        try {
          // Fazer GET para buscar detalhes da radiografia
          const response = await api.get(`/radiografias/${id}`)
          const radiografia = response.data?.data || response.data
          
          if (radiografia) {
            // Buscar nome do profissional responsável
            let nomeProfissional = ''
            // O responsavel pode ser um ID (string) ou um objeto
            const responsavelId = radiografia.responsavelId || 
              (typeof radiografia.responsavel === 'string' ? radiografia.responsavel : radiografia.responsavel?.id) || 
              radiografia.masterClient?.userId
            
            // Primeiro verificar se a API já retorna o nome do responsável diretamente
            // Pode vir em vários campos diferentes dependendo da estrutura da API
            if (radiografia.nomeResponsavel) {
              nomeProfissional = radiografia.nomeResponsavel
            } else if (radiografia.responsavelNome) {
              nomeProfissional = radiografia.responsavelNome
            } else if (radiografia.nomeUsuario) {
              nomeProfissional = radiografia.nomeUsuario
            } else if (radiografia.responsavelData?.nome) {
              nomeProfissional = radiografia.responsavelData.nome
            } else if (radiografia.usuario?.nome) {
              nomeProfissional = radiografia.usuario.nome
            } else if (radiografia.user?.nome) {
              nomeProfissional = radiografia.user.nome
            } else if (typeof radiografia.responsavel === 'object' && radiografia.responsavel?.nome) {
              nomeProfissional = radiografia.responsavel.nome
            }
            
            if (!nomeProfissional && responsavelId) {
              try {
                // Verificar se o user do contexto é o responsável
                if (user?.id === responsavelId) {
                  nomeProfissional = user.nome || user.name || ''
                }
                // Verificar se o perfil no selectedClinicData é o responsável
                else if (selectedClinicData?.perfil?.id === responsavelId) {
                  nomeProfissional = selectedClinicData.perfil.nome || ''
                }
                // Verificar selectedClinicData.user
                else if (selectedClinicData?.user?.id === responsavelId) {
                  nomeProfissional = selectedClinicData.user.nome || ''
                } 
                // Tentar do sessionStorage
                else {
                  const userFromStorage = sessionStorage.getItem('user')
                  if (userFromStorage) {
                    const userParsed = JSON.parse(userFromStorage)
                    if (userParsed.id === responsavelId) {
                      nomeProfissional = userParsed.nome || ''
                    }
                  }
                }
              } catch (error) {
                console.error('Erro ao buscar nome do profissional:', error)
              }
            }
            
            // Normalizar dados da radiografia para o formato esperado
            // Converter achadosRadiograficos para array se necessário
            let achadosNormalizados = []
            if (radiografia.achadosRadiograficos) {
              if (Array.isArray(radiografia.achadosRadiograficos)) {
                achadosNormalizados = radiografia.achadosRadiograficos
              } else if (typeof radiografia.achadosRadiograficos === 'string') {
                achadosNormalizados = radiografia.achadosRadiograficos.split('\n').filter(line => line.trim())
              }
            } else if (radiografia.achados && Array.isArray(radiografia.achados)) {
              achadosNormalizados = radiografia.achados
            }
            
            // API retorna necessidades como array de objetos { id, descricao, status, ... }; manter objetos para exibir/alterar status
            let necessidadesRaw = []
            if (radiografia.necessidades && Array.isArray(radiografia.necessidades)) {
              necessidadesRaw = radiografia.necessidades
            } else if (radiografia.necessidades && typeof radiografia.necessidades === 'string') {
              necessidadesRaw = radiografia.necessidades.split('\n').filter(line => line.trim()).map(texto => ({ descricao: texto, status: 'analisado_ia' }))
            }
            
            const diagnosticoCompleto = {
              id: radiografia.id,
              paciente: radiografia.nome || radiografia.nome || '',
              radiografia: radiografia.radiografia || '',
              tipoExame: radiografia.tipoExame || '',
              descricao: radiografia.descricaoExame || radiografia.tipoExame || '',
              tratamento: radiografia.tratamento || '',
              data: radiografia.data || '',
              cliente_id: radiografia.pacienteId || null,
              cliente_nome: radiografia.nome || '',
              cliente_email: radiografia.emailPaciente || '',
              imagem: radiografia.imagens && radiografia.imagens.length > 0 
                ? radiografia.imagens[0]?.url || exameImage
                : exameImage,
              imagens: radiografia.imagens && Array.isArray(radiografia.imagens) && radiografia.imagens.length > 0
                ? radiografia.imagens.map(img => img.url || img).filter(Boolean)
                : [],
              achados: achadosNormalizados,
              recomendacoes: radiografia.recomendacoes || [],
              necessidades: necessidadesRaw,
              created_at: radiografia.createdAt || new Date().toISOString(),
              responsavelId: responsavelId
            }
            
            setDiagnostico(diagnosticoCompleto)
            setProfissionalNome(nomeProfissional)
            setEditedDescricao(diagnosticoCompleto.descricao || '')
            setEditedAchados(diagnosticoCompleto.achados || [])
            setEditedNecessidades(diagnosticoCompleto.necessidades || diagnosticoCompleto.recomendacoes || [])
            setEditedTitulo(diagnosticoCompleto.paciente || '')
            
            // Buscar ID do paciente pelo nome ou email
            await buscarPacienteId(radiografia.nome, radiografia.emailPaciente, radiografia.masterClient?.id || radiografia.clienteMasterId)
            
            if (nomeProfissional) {
              setProfissionalNome(nomeProfissional)
            } else if (responsavelId) {
              // Sempre tentar buscar o nome do responsável se tiver o ID
              loadProfissionalNome(responsavelId)
            }
          } else {
            // Se não encontrar, usar dados mockados como fallback
            const mockDetalhes = getMockDetalhes(parseInt(id))
            const mockComImagens = {
              ...mockDetalhes,
              imagens: mockDetalhes.imagem ? [mockDetalhes.imagem] : []
            }
            setDiagnostico(mockComImagens)
            setEditedDescricao(mockComImagens.descricao || '')
            setEditedAchados(mockComImagens.achados || [])
            setEditedNecessidades(mockComImagens.recomendacoes || mockComImagens.necessidades || [])
            setEditedTitulo(mockComImagens.paciente || '')
          }
        } catch (error) {
          console.error('Erro ao carregar radiografia:', error)
          // Se não encontrar, usar dados mockados como fallback
          const mockDetalhes = getMockDetalhes(parseInt(id))
          const mockComImagens = {
            ...mockDetalhes,
            imagens: mockDetalhes.imagem ? [mockDetalhes.imagem] : []
          }
          setDiagnostico(mockComImagens)
          setEditedDescricao(mockComImagens.descricao || '')
          setEditedAchados(mockComImagens.achados || [])
        } finally {
          setLoading(false)
        }
      }

  const updateRadiografiaAPI = async (dataToUpdate) => {
    try {
      await api.put(`/radiografias/${id}`, dataToUpdate)
      // Mostrar mensagem de sucesso
      setCustomAlert({ show: true, message: 'Alterações salvas com sucesso!', type: 'success' })
      setTimeout(() => {
        setCustomAlert({ show: false, message: '', type: 'error' })
      }, 3000)
      return true
    } catch (error) {
      console.error('Erro ao atualizar radiografia:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar alterações. Tente novamente.'
      setCustomAlert({ show: true, message: errorMessage, type: 'error' })
      setTimeout(() => {
        setCustomAlert({ show: false, message: '', type: 'error' })
      }, 3000)
      return false
    }
  }

  const handleSave = async () => {
    // Preparar dados para a API
    const payload = {
      descricaoExame: editedDescricao || ''
    }
    
    // Chamar API PUT
    const success = await updateRadiografiaAPI(payload)
    
    if (success) {
      // Atualizar diagnóstico local apenas se a API foi bem-sucedida
      const updatedDiagnostico = {
        ...diagnostico,
        descricao: editedDescricao
      }
      setDiagnostico(updatedDiagnostico)
      setIsEditingDescricao(false)
    }
  }

  const handleSaveAchados = async () => {
    // Preparar dados para a API - converter para array de strings
    const achadosArray = editedAchados.filter(achado => achado && achado.trim() !== '')
    
    const payload = {
      achadosRadiograficos: achadosArray
    }
    
    // Chamar API PUT
    const success = await updateRadiografiaAPI(payload)
    
    if (success) {
      // Atualizar diagnóstico local apenas se a API foi bem-sucedida
      const updatedDiagnostico = {
        ...diagnostico,
        achados: achadosArray
      }
      setDiagnostico(updatedDiagnostico)
      setIsEditingAchados(false)
    }
  }

  const handleAddAchado = () => {
    setEditedAchados([...editedAchados, ''])
  }

  const handleRemoveAchado = (index) => {
    setEditedAchados(editedAchados.filter((_, i) => i !== index))
  }

  const handleUpdateAchado = (index, value) => {
    const updated = [...editedAchados]
    updated[index] = value
    setEditedAchados(updated)
  }

  const handleSaveNecessidades = async () => {
    // Preparar dados para a API - extrair descrição (strings) para PUT radiografias
    const necessidadesArray = editedNecessidades
      .filter(nec => {
        if (typeof nec === 'string') return nec.trim() !== ''
        if (typeof nec === 'object' && nec !== null) {
          const d = nec.descricao || nec.procedimento || ''
          const a = nec.anotacoes || nec.observacao || ''
          return d.trim() !== '' || a.trim() !== ''
        }
        return false
      })
      .map(nec => {
        if (typeof nec === 'string') return nec.trim()
        if (typeof nec === 'object' && nec !== null) {
          const partes = []
          if (nec.descricao) partes.push(nec.descricao.trim())
          if (nec.procedimento) partes.push(nec.procedimento.trim())
          if (nec.anotacoes) partes.push(nec.anotacoes.trim())
          if (nec.observacao) partes.push(nec.observacao.trim())
          return partes.filter(Boolean).join(' - ')
        }
        return ''
      })
      .filter(nec => nec !== '')
    
    const payload = {
      necessidades: necessidadesArray
    }
    
    // Chamar API PUT
    const success = await updateRadiografiaAPI(payload)
    
    if (success) {
      // Atualizar diagnóstico local apenas se a API foi bem-sucedida
      const updatedDiagnostico = {
        ...diagnostico,
        necessidades: editedNecessidades
      }
      setDiagnostico(updatedDiagnostico)
      setIsEditingNecessidades(false)
    }
  }

  const handleAddNecessidade = () => {
    setEditedNecessidades([...editedNecessidades, { descricao: '', status: NECESSIDADES_STATUS_PADRAO_NOVA }])
  }

  const handleRemoveNecessidade = async (necessidadeOrIndex, indexOrUndefined) => {
    // Suporta handleRemoveNecessidade(index) ou handleRemoveNecessidade(necessidade, index)
    const index = typeof necessidadeOrIndex === 'number' ? necessidadeOrIndex : indexOrUndefined
    const necessidade = typeof necessidadeOrIndex === 'object' && necessidadeOrIndex !== null
      ? necessidadeOrIndex
      : editedNecessidades[index]
    const id = necessidade?.id
    if (id) {
      setRemovingNecessidadeId(id)
      try {
        await necessidadesApi(api).remover(id)
        setEditedNecessidades(prev => prev.filter((_, i) => i !== index))
        setDiagnostico(prev => ({
          ...prev,
          necessidades: (prev.necessidades || []).filter(n => n?.id !== id)
        }))
      } catch (err) {
        console.error('Erro ao remover necessidade:', err)
        showError(err.response?.data?.message || 'Não foi possível remover a necessidade.')
      } finally {
        setRemovingNecessidadeId(null)
      }
    } else {
      setEditedNecessidades(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleNecessidadeStatusChange = async (nec, newStatus, index) => {
    if (nec?.id) {
      setOpenStatusDropdownKey(null)
      setLoadingStatusNecessidadeId(nec.id)
      try {
        await necessidadesApi(api).atualizar(nec.id, { status: newStatus })
        setDiagnostico(prev => ({
          ...prev,
          necessidades: (prev.necessidades || []).map(n => (n?.id === nec.id ? { ...n, status: newStatus } : n))
        }))
        setEditedNecessidades(prev => prev.map(n => (n?.id === nec.id ? { ...n, status: newStatus } : n)))
      } catch (err) {
        console.error('Erro ao atualizar status da necessidade:', err)
        showError(err.response?.data?.message || 'Não foi possível atualizar o status.')
      } finally {
        setLoadingStatusNecessidadeId(null)
      }
    } else {
      setEditedNecessidades(prev => prev.map((n, i) => (i === index && typeof n === 'object' ? { ...n, status: newStatus } : n)))
    }
    setOpenStatusDropdownKey(null)
  }

  const handleUpdateNecessidade = (index, value) => {
    const updated = [...editedNecessidades]
    const current = updated[index]
    if (typeof current === 'object' && current !== null) {
      updated[index] = { ...current, descricao: value }
    } else {
      updated[index] = value
    }
    setEditedNecessidades(updated)
  }

  const handleSaveTitulo = () => {
    // Atualizar diagnóstico local
    const updatedDiagnostico = {
      ...diagnostico,
      paciente: editedTitulo
    }
    setDiagnostico(updatedDiagnostico)
    
    // Salvar no localStorage
    const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
    const index = savedDiagnosticos.findIndex(d => d.id === parseInt(id))
    
    if (index !== -1) {
      savedDiagnosticos[index] = {
        ...savedDiagnosticos[index],
        paciente: editedTitulo
      }
    } else {
      // Se não existir, criar novo
      savedDiagnosticos.push({
        id: parseInt(id),
        paciente: editedTitulo
      })
    }
    
    localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
    setIsEditingTitulo(false)
  }

  const handleViewDesenho = async (desenhoId) => {
    try {
      // Fazer GET para buscar detalhes do desenho
      const response = await api.get(`/desenhos-profissionais/${desenhoId}`)
      const desenho = response.data?.data || response.data
      
      if (desenho) {
        // Navegar para a tela de detalhamento profissional com os dados do desenho
        navigate(`/app/diagnosticos/${id}/detalhamento-profissional`, { 
          state: { 
            desenhoData: {
              imagemDesenhada: desenho.imagemDesenhada?.url,
              dentesAnotacoes: desenho.dentesAnotacoes || [],
              necessidades: desenho.necessidades || [],
              observacoes: desenho.observacoes || '',
              tituloDesenho: desenho.tituloDesenho || ''
            }
          } 
        })
      }
    } catch (error) {
      console.error('Erro ao carregar desenho:', error)
      showError('Erro ao carregar desenho. Tente novamente.')
    }
  }

  const handleDeleteDesenhoClick = (desenhoId, e) => {
    if (e) {
      e.stopPropagation()
    }
    setDesenhoToDelete(desenhoId)
    setShowDeleteDesenhoModal(true)
  }

  const handleConfirmDeleteDesenho = async () => {
    if (!desenhoToDelete) return

    try {
      await api.delete(`/desenhos-profissionais/${desenhoToDelete}`)
      // Recarregar lista de desenhos
      await loadDesenhosProfissionais()
      setShowDeleteDesenhoModal(false)
      setDesenhoToDelete(null)
      setCustomAlert({ show: true, message: 'Desenho excluído com sucesso!', type: 'success' })
      setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 3000)
    } catch (error) {
      console.error('Erro ao excluir desenho:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao excluir desenho. Tente novamente.'
      setCustomAlert({ show: true, message: errorMessage, type: 'error' })
      setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 3000)
    }
  }

  const handleCancelDeleteDesenho = () => {
    setShowDeleteDesenhoModal(false)
    setDesenhoToDelete(null)
  }


  const showAlert = (message, type = 'error') => {
    setCustomAlert({ show: true, message, type })
    setTimeout(() => {
      setCustomAlert({ show: false, message: '', type: 'error' })
    }, 5000)
  }

  if (loading) {
    return (
      <div className="diagnostico-detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando detalhes da radiografia...</p>
      </div>
    )
  }

  if (!diagnostico) {
    return (
      <div className="diagnostico-detalhes-error">
        <h2>Radiografia não encontrada</h2>
        <button onClick={() => navigate('/app/diagnosticos')}>
          Voltar para Diagnósticos
        </button>
      </div>
    )
  }

  return (
    <div className="diagnostico-detalhes-page">
      {/* Custom Alert */}
      {customAlert.show && (
        <div className={`custom-alert ${customAlert.type}`}>
          <div className="alert-content">
            <div className="alert-icon">
              {customAlert.type === 'success' ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : (
                <FontAwesomeIcon icon={faExclamationTriangle} />
              )}
            </div>
            <div className="alert-message">{customAlert.message}</div>
            <button 
              className="alert-close"
              onClick={() => setCustomAlert({ show: false, message: '', type: 'error' })}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      <div className="detalhes-header">
        <div className="header-left-detalhes">
          <button className="btn-back-detalhes" onClick={() => navigate('/app/diagnosticos')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar
          </button>
          <h1>
            <FontAwesomeIcon icon={faFileMedical} /> Detalhes da Radiografia
          </h1>
        </div>
        <div className="header-right-detalhes">
          {(isMaster || diagnostico?.responsavelId === user?.id) && (
            <button 
              className="btn-desenho-detalhes"
              onClick={() => {
                if (diagnostico?.imagens && diagnostico.imagens.length > 1) {
                  setShowImageSelector(true)
                } else {
                  // Mesma imagem exibida nos detalhes: primeira da lista ou imagem principal
                  const first = diagnostico?.imagens?.[0]
                  const imagemUrl = (typeof first === 'string' ? first : first?.url) || diagnostico?.imagem || ''
                  navigate(`/app/diagnosticos/${id}/desenho`, { state: { imagemUrl } })
                }
              }}
            >
              <FontAwesomeIcon icon={faPencil} /> Ir para Desenho
            </button>
          )}
        </div>
      </div>

      <div className="detalhes-content">
            {/* Imagem da Radiografia */}
            <div className={`detalhes-imagem-section ${diagnostico.imagens && diagnostico.imagens.length === 4 ? 'has-four-images' : ''}`}>
              {diagnostico.imagens && diagnostico.imagens.length > 0 ? (
                <div className={`detalhes-imagens-grid ${
                  diagnostico.imagens.length === 1 ? 'single' 
                  : diagnostico.imagens.length === 2 ? 'two-columns' 
                  : diagnostico.imagens.length === 4 ? 'four-grid'
                  : 'three-grid'
                }`}>
                  {diagnostico.imagens.map((img, index) => (
                    <div key={index} className="detalhes-imagem-item">
                      <img 
                        src={img || exameImage}
                        alt={`${diagnostico.paciente} - Imagem ${index + 1}`}
                        className="detalhes-imagem"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <img 
                  src={diagnostico.imagem || exameImage}
                  alt={diagnostico.paciente}
                  className="detalhes-imagem"
                />
              )}
            </div>

        {/* Informações Principais */}
        <div className="detalhes-info-grid">
          <div className="detalhes-info-card">
            <div className="detalhes-info-card-header">
              <h3>
                <FontAwesomeIcon icon={faUser} /> Informações do Paciente
              </h3>
              {(pacienteId || diagnostico.cliente_id || diagnostico.cliente_nome) && (
                <button 
                  className="btn-ver-perfil"
                  onClick={() => {
                    const idParaNavegar = pacienteId || diagnostico.cliente_id
                    if (idParaNavegar) {
                      navigate(`/app/clientes/${idParaNavegar}`)
                    }
                  }}
                  title="Ver perfil do paciente"
                >
                  <FontAwesomeIcon icon={faEye} /> Ver Perfil
                </button>
              )}
            </div>
            <div className="info-item">
              <strong>Radiografia:</strong>
              <span>{diagnostico.radiografia || diagnostico.paciente}</span>
            </div>
            {diagnostico.cliente_nome && (
              <div className="info-item">
                <strong>Cliente:</strong>
                <span>{diagnostico.cliente_nome}</span>
              </div>
            )}
            {diagnostico.cliente_email && (
              <div className="info-item">
                <strong>Email:</strong>
                <span>{diagnostico.cliente_email}</span>
              </div>
            )}
            {diagnostico.data && (
              <div className="info-item">
                <strong>Data do Exame:</strong>
                <span>{new Date(diagnostico.data).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {diagnostico.tipoExame && (
              <div className="info-item">
                <strong>Tipo de Exame:</strong>
                <span>{diagnostico.tipoExame}</span>
              </div>
            )}
          </div>

          <div className="detalhes-info-card">
            <h3>
              <FontAwesomeIcon icon={faUser} /> Profissional Responsável
            </h3>
            {profissionalNome && (
              <div className="info-item">
                <strong>Nome:</strong>
                <span>{profissionalNome}</span>
              </div>
            )}
            {diagnostico.created_at && (
              <div className="info-item">
                <strong>Data da Análise:</strong>
                <span>{new Date(diagnostico.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tratamento */}
        {diagnostico.tratamento && (
          <div className="detalhes-section tratamento-section">
            <div className="detalhes-section-header">
              <h3>
                <FontAwesomeIcon icon={faStethoscope} /> Tratamento
              </h3>
            </div>
            <div className="tratamento-content">
              <p>{diagnostico.tratamento}</p>
            </div>
          </div>
        )}

        {/* Detalhamento Profissional */}
        <div className="detalhes-section">
          <div className="detalhes-section-header">
            <h3>
              <FontAwesomeIcon icon={faPencil} /> Detalhamento Profissional
            </h3>
          </div>
          
          {loadingDesenhos ? (
            <p className="detalhes-empty-message">Carregando desenhos...</p>
          ) : desenhosProfissionais.length > 0 ? (
            <div className="detalhamento-cards-grid">
              {desenhosProfissionais.map((desenho) => (
                <div 
                  key={desenho.id}
                  className="detalhamento-card"
                  onClick={() => handleViewDesenho(desenho.id)}
                >
                  {(isMaster || diagnostico?.responsavelId === user?.id) && (
                    <button 
                      className="detalhamento-card-delete-btn"
                      onClick={(e) => handleDeleteDesenhoClick(desenho.id, e)}
                      title="Excluir detalhamento"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                  <div className="detalhamento-card-image">
                    <img 
                      src={desenho.imagemDesenhada?.url || exameImage}
                      alt={desenho.tituloDesenho || 'Desenho Profissional'}
                      className="detalhamento-card-img"
                    />
                  </div>
                  <div className="detalhamento-card-content" onClick={(e) => e.stopPropagation()}>
                    <div className="detalhamento-card-subtitle-wrapper">
                      <p className="detalhamento-card-subtitle">
                        {desenho.tituloDesenho || 'Desenho Profissional'}
                      </p>
                    </div>
                    {desenho.nome && (
                      <div className="detalhamento-card-paciente">
                        <span>{desenho.nome}</span>
                      </div>
                    )}
                    {desenho.nomeUsuario && (
                      <div className="detalhamento-card-profissional">
                        <FontAwesomeIcon icon={faUser} />
                        <span>{desenho.nomeUsuario}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="detalhes-empty-message">
              Nenhum detalhamento profissional registrado.
              {(isMaster || diagnostico?.responsavelId === user?.id) && (
                <>
                  {' '}
                  <button 
                    className="btn-link-desenho"
                    onClick={() => navigate(`/app/diagnosticos/${id}/desenho`)}
                  >
                    Clique aqui para adicionar desenhos e observações
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="detalhes-section">
          <div className="detalhes-section-header">
            <h3>
              <FontAwesomeIcon icon={faFileAlt} /> Descrição do Exame
            </h3>
            {(isMaster || diagnostico?.responsavelId === user?.id) && (
              <div className="section-header-actions">
                {isEditingDescricao ? (
                  <>
                    <button 
                      className="btn-cancel-section"
                      onClick={() => {
                        setIsEditingDescricao(false)
                        setEditedDescricao(diagnostico.descricao || '')
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Cancelar
                    </button>
                    <button 
                      className="btn-save-section"
                      onClick={handleSave}
                    >
                      <FontAwesomeIcon icon={faSave} /> Salvar
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn-edit-section"
                    onClick={() => setIsEditingDescricao(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Editar
                  </button>
                )}
              </div>
            )}
          </div>
          {isEditingDescricao ? (
            <textarea
              className="detalhes-textarea"
              value={editedDescricao}
              onChange={(e) => setEditedDescricao(e.target.value)}
              placeholder="Digite a descrição do exame..."
              rows={8}
            />
          ) : (
            <div className="detalhes-text-content">
              {diagnostico.descricao ? (
                diagnostico.descricao.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))
              ) : (
                <p className="detalhes-empty-message">Nenhuma descrição registrada.</p>
              )}
            </div>
          )}
        </div>

        {/* Achados */}
        <div className="detalhes-section">
          <div className="detalhes-section-header">
            <h3>
              <FontAwesomeIcon icon={faCheck} /> Achados Radiográficos
            </h3>
            <div className="section-header-actions">
              {(isMaster || diagnostico?.responsavelId === user?.id) && (
                isEditingAchados ? (
                  <>
                    <button 
                      className="btn-add-achado"
                      onClick={handleAddAchado}
                      title="Adicionar achado"
                    >
                      <FontAwesomeIcon icon={faPlus} /> Adicionar
                    </button>
                    <button 
                      className="btn-cancel-section"
                      onClick={() => {
                        setIsEditingAchados(false)
                        setEditedAchados(diagnostico.achados || [])
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Cancelar
                    </button>
                    <button 
                      className="btn-save-section"
                      onClick={handleSaveAchados}
                    >
                      <FontAwesomeIcon icon={faSave} /> Salvar
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn-edit-section"
                    onClick={() => setIsEditingAchados(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Editar
                  </button>
                )
              )}
            </div>
          </div>
          {isEditingAchados ? (
            <div className="detalhes-achados-edit">
              {editedAchados.length > 0 ? (
                editedAchados.map((achado, index) => (
                  <div key={index} className="achado-item-edit">
                    <input
                      type="text"
                      className="achado-input"
                      value={achado}
                      onChange={(e) => handleUpdateAchado(index, e.target.value)}
                      placeholder="Digite o achado..."
                    />
                    <button
                      className="btn-remove-achado"
                      onClick={() => handleRemoveAchado(index)}
                      title="Remover achado"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="detalhes-empty-message">Nenhum achado adicionado. Clique em "Adicionar" para incluir.</p>
              )}
            </div>
          ) : (
            diagnostico.achados && diagnostico.achados.length > 0 ? (
              <ul className="detalhes-list">
                {diagnostico.achados.map((achado, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheck} className="list-icon" />
                    {achado}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detalhes-empty-message">Nenhum achado registrado.</p>
            )
          )}
        </div>


        {/* Necessidades */}
        <div className="detalhes-section">
          <div className="detalhes-section-header">
            <h3>
              <FontAwesomeIcon icon={faStethoscope} /> Necessidades
            </h3>
            <div className="section-header-actions">
              {(isMaster || diagnostico?.responsavelId === user?.id) && (
                isEditingNecessidades ? (
                  <>
                    <button 
                      className="btn-add-achado"
                      onClick={handleAddNecessidade}
                      title="Adicionar necessidade"
                    >
                      <FontAwesomeIcon icon={faPlus} /> Adicionar
                    </button>
                    <button 
                      className="btn-cancel-section"
                      onClick={() => {
                        setIsEditingNecessidades(false)
                        setEditedNecessidades(diagnostico.necessidades || [])
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Cancelar
                    </button>
                    <button 
                      className="btn-save-section"
                      onClick={handleSaveNecessidades}
                    >
                      <FontAwesomeIcon icon={faSave} /> Salvar
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn-edit-section"
                    onClick={() => setIsEditingNecessidades(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Editar
                  </button>
                )
              )}
            </div>
          </div>
          {isEditingNecessidades ? (
            <div className="detalhes-achados-edit">
              {editedNecessidades.length > 0 ? (
                editedNecessidades.map((necessidade, index) => {
                  let necessidadeValue = ''
                  const isObj = typeof necessidade === 'object' && necessidade !== null
                  const hasId = isObj && necessidade.id
                  if (isObj) {
                    const partes = []
                    if (necessidade.procedimento) partes.push(necessidade.procedimento)
                    if (necessidade.anotacoes) partes.push(necessidade.anotacoes)
                    if (necessidade.descricao) partes.push(necessidade.descricao)
                    if (necessidade.observacao) partes.push(necessidade.observacao)
                    necessidadeValue = partes.join(' - ') || ''
                  } else if (typeof necessidade === 'string') {
                    necessidadeValue = necessidade
                  }
                  const statusEdit = isObj ? (necessidade.status || (hasId ? 'analisado_ia' : NECESSIDADES_STATUS_PADRAO_NOVA)) : null
                  const opcoesEdit = NECESSIDADES_STATUS_OPCOES_NOVA
                  const keyEdit = hasId ? necessidade.id : `edit-new-${index}`
                  return (
                  <div key={index} className="achado-item-edit achado-item-edit-com-status">
                    <input
                      type="text"
                      className="achado-input"
                      value={necessidadeValue}
                      onChange={(e) => handleUpdateNecessidade(index, e.target.value)}
                      placeholder="Digite a necessidade..."
                    />
                    {isObj && (
                      <div className="necessidade-status-wrapper necessidade-status-dropdown">
                        {hasId && loadingStatusNecessidadeId === necessidade.id ? (
                          <span className="necessidade-status-loading" title="Salvando...">
                            <span className="necessidade-status-spinner" aria-hidden />
                            <span className="necessidade-status-loading-text">Salvando...</span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={`necessidade-status-trigger trigger-status-${statusEdit || 'concluido'}`}
                              onClick={(e) => { e.stopPropagation(); setOpenStatusDropdownKey(k => (k === keyEdit ? null : keyEdit)) }}
                            >
                              <span className="necessidade-status-trigger-label">{(NECESSIDADES_STATUS_LABELS[statusEdit] || statusEdit).toUpperCase()}</span>
                              <FontAwesomeIcon icon={openStatusDropdownKey === keyEdit ? faChevronUp : faChevronDown} className="necessidade-status-chevron" />
                            </button>
                            {openStatusDropdownKey === keyEdit && (
                              <div className="necessidade-status-menu" role="listbox">
                                {opcoesEdit.map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    role="option"
                                    className={`necessidade-status-option option-status-${s} ${s === statusEdit ? 'active' : ''}`}
                                    onClick={() => handleNecessidadeStatusChange(necessidade, s, index)}
                                  >
                                    <span>{NECESSIDADES_STATUS_LABELS[s] || s}</span>
                                    {s === statusEdit && <FontAwesomeIcon icon={faCheck} className="necessidade-status-option-check" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <button
                      className="btn-remove-achado"
                      onClick={() => handleRemoveNecessidade(necessidade, index)}
                      title="Remover necessidade"
                      disabled={hasId && removingNecessidadeId === necessidade.id}
                    >
                      {hasId && removingNecessidadeId === necessidade.id ? (
                        <span className="necessidade-status-spinner" aria-hidden />
                      ) : (
                        <FontAwesomeIcon icon={faTrash} />
                      )}
                    </button>
                  </div>
                  )
                })
              ) : (
                <p className="detalhes-empty-message">Nenhuma necessidade adicionada. Clique em "Adicionar" para incluir.</p>
              )}
            </div>
          ) : (
            editedNecessidades && editedNecessidades.length > 0 ? (
              <ul className="detalhes-list detalhes-list-necessidades">
                {editedNecessidades.map((necessidade, index) => {
                  let necessidadeValue = ''
                  const isObject = typeof necessidade === 'object' && necessidade !== null
                  const hasId = isObject && necessidade.id
                  if (isObject) {
                    const partes = []
                    if (necessidade.procedimento) partes.push(necessidade.procedimento)
                    if (necessidade.anotacoes) partes.push(necessidade.anotacoes)
                    if (necessidade.descricao) partes.push(necessidade.descricao)
                    if (necessidade.observacao) partes.push(necessidade.observacao)
                    necessidadeValue = partes.join(' - ') || 'Nenhuma informação'
                  } else if (typeof necessidade === 'string') {
                    necessidadeValue = necessidade || 'Nenhuma informação'
                  } else {
                    necessidadeValue = 'Nenhuma informação'
                  }
                  const statusAtual = isObject
                    ? (necessidade.status || (hasId ? 'analisado_ia' : NECESSIDADES_STATUS_PADRAO_NOVA))
                    : null
                  const opcoesStatus = NECESSIDADES_STATUS_OPCOES_NOVA
                  const dropdownKey = hasId ? necessidade.id : `new-${index}`
                  const canEditStatus = (isMaster || diagnostico?.responsavelId === user?.id) && isObject
                  return (
                    <li key={hasId ? necessidade.id : index} className="detalhes-list-item-necessidade">
                      <FontAwesomeIcon icon={faCheck} className="list-icon" />
                      <span className="necessidade-texto">{necessidadeValue}</span>
                      {canEditStatus && (
                        <div className="necessidade-list-actions">
                          <div className="necessidade-status-wrapper necessidade-status-dropdown">
                            {loadingStatusNecessidadeId === necessidade.id ? (
                              <span className="necessidade-status-loading" title="Salvando...">
                                <span className="necessidade-status-spinner" aria-hidden />
                                <span className="necessidade-status-loading-text">Salvando...</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={`necessidade-status-trigger trigger-status-${statusAtual || 'concluido'}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenStatusDropdownKey(k => (k === dropdownKey ? null : dropdownKey))
                                  }}
                                  title="Alterar status"
                                >
                                  <span className="necessidade-status-trigger-label">
                                    {(NECESSIDADES_STATUS_LABELS[statusAtual] || statusAtual).toUpperCase()}
                                  </span>
                                  <FontAwesomeIcon icon={openStatusDropdownKey === dropdownKey ? faChevronUp : faChevronDown} className="necessidade-status-chevron" />
                                </button>
                                {openStatusDropdownKey === dropdownKey && (
                                  <div className="necessidade-status-menu" role="listbox">
                                    {opcoesStatus.map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        role="option"
                                        aria-selected={s === statusAtual}
                                        className={`necessidade-status-option option-status-${s} ${s === statusAtual ? 'active' : ''}`}
                                        onClick={() => handleNecessidadeStatusChange(necessidade, s, index)}
                                      >
                                        <span>{NECESSIDADES_STATUS_LABELS[s] || s}</span>
                                        {s === statusAtual && <FontAwesomeIcon icon={faCheck} className="necessidade-status-option-check" />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-remove-achado btn-remove-necessidade-view"
                            onClick={(e) => { e.stopPropagation(); handleRemoveNecessidade(necessidade, index) }}
                            title="Remover necessidade"
                            disabled={hasId && removingNecessidadeId === necessidade.id}
                          >
                            {hasId && removingNecessidadeId === necessidade.id ? (
                              <span className="necessidade-status-spinner" aria-hidden />
                            ) : (
                              <FontAwesomeIcon icon={faTrash} />
                            )}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="detalhes-empty-message">Nenhuma necessidade registrada.</p>
            )
          )}
        </div>
      </div>

      {/* Modal de Seleção de Imagem */}
      {showImageSelector && (
        <div className="modal-overlay" onClick={() => setShowImageSelector(false)}>
          <div className="modal-image-selector" onClick={(e) => e.stopPropagation()}>
            <div className="modal-image-selector-header">
              <h3>Selecione a Imagem para Desenho</h3>
              <button 
                className="btn-close-modal"
                onClick={() => setShowImageSelector(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-image-selector-grid">
              {diagnostico?.imagens && diagnostico.imagens.map((img, index) => (
                <div 
                  key={index}
                  className="modal-image-selector-item"
                  onClick={() => {
                    // Garantir URL string (mesma exibida no detalhe)
                    const imagemUrl = typeof img === 'string' ? img : img?.url || ''
                    navigate(`/app/diagnosticos/${id}/desenho`, { state: { imagemUrl } })
                    setShowImageSelector(false)
                  }}
                >
                  <img src={img || exameImage} alt={`Imagem ${index + 1}`} />
                  <div className="modal-image-selector-overlay">
                    <span>Selecionar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Desenho */}
      {showDeleteDesenhoModal && (
        <div className="modal-overlay" onClick={handleCancelDeleteDesenho}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Desenho Profissional</h3>
            <p>
              Tem certeza que deseja excluir este desenho profissional?
            </p>
            <p className="modal-warning">
              <FontAwesomeIcon icon={faExclamationTriangle} /> Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={handleCancelDeleteDesenho}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={handleConfirmDeleteDesenho}
              >
                Excluir
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

export default DiagnosticoDetalhes

