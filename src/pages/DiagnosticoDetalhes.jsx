import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faXRay, faArrowLeft, faFileMedical, faCalendar, faUser,
  faCheck, faStethoscope, faFileAlt, faEnvelope, faPencil,
  faEdit, faSave, faTrash, faPlus, faTimes, faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
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
  const { selectedClinicData } = useAuth()
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

  useEffect(() => {
    loadDiagnostico()
  }, [id])

  useEffect(() => {
    if (id && diagnostico) {
      loadDesenhosProfissionais()
    }
  }, [id, diagnostico])

  const buscarPacienteId = async (nomePaciente, emailPaciente, masterClientId) => {
    if ((!nomePaciente && !emailPaciente) || !masterClientId) {
      return
    }

    try {
      // Buscar lista de pacientes do masterClientId
      const response = await api.get(`/pacientes?masterClientId=${masterClientId}`)
      const pacientes = response.data?.data || response.data || []
      
      // Procurar paciente pelo nome ou email
      const paciente = pacientes.find(p => {
        const nomeMatch = nomePaciente && p.nomePaciente === nomePaciente
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

  const loadProfissionalNome = async (userId, masterClientId) => {
    if (!userId) return
    
    try {
      // Primeiro tentar usar dados do contexto ou sessionStorage
      const userFromStorage = sessionStorage.getItem('user')
      if (userFromStorage) {
        const user = JSON.parse(userFromStorage)
        if (user.id === userId) {
          setProfissionalNome(user.nome || '')
          return
        }
      }
      
      // Se o usuário do contexto corresponder
      if (selectedClinicData?.user?.id === userId) {
        setProfissionalNome(selectedClinicData.user.nome || '')
        return
      }
      
      // Tentar buscar pela API de usuários do cliente master
      if (masterClientId) {
        try {
          const response = await api.get(`/clientes-master/${masterClientId}/usuarios`)
          const usuarios = response.data?.data?.usuarios || response.data?.usuarios || []
          const usuario = usuarios.find(u => u.id === userId || u.userId === userId)
          if (usuario) {
            setProfissionalNome(usuario.nome || '')
            return
          }
        } catch (apiError) {
          console.error('Erro ao buscar usuários do cliente master:', apiError)
        }
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
            // Buscar nome do profissional responsável usando userId do masterClient
            let nomeProfissional = ''
            const userId = radiografia.masterClient?.userId
            
            if (userId) {
              try {
                // Tentar buscar o usuário pela API ou usar dados do contexto
                if (selectedClinicData?.user?.id === userId) {
                  nomeProfissional = selectedClinicData.user.nome || ''
                } else {
                  // Se não estiver no contexto, tentar buscar pela API
                  // Por enquanto, usar o nome do usuário logado se o ID corresponder
                  const userFromStorage = sessionStorage.getItem('user')
                  if (userFromStorage) {
                    const user = JSON.parse(userFromStorage)
                    if (user.id === userId) {
                      nomeProfissional = user.nome || ''
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
            
            // Converter necessidades para array se necessário
            let necessidadesNormalizadas = []
            if (radiografia.necessidades) {
              if (Array.isArray(radiografia.necessidades)) {
                necessidadesNormalizadas = radiografia.necessidades
              } else if (typeof radiografia.necessidades === 'string') {
                necessidadesNormalizadas = radiografia.necessidades.split('\n').filter(line => line.trim())
              }
            }
            
            const diagnosticoCompleto = {
              id: radiografia.id,
              paciente: radiografia.nomePaciente || radiografia.nome || '',
              radiografia: radiografia.radiografia || '',
              tipoExame: radiografia.tipoExame || '',
              descricao: radiografia.descricaoExame || radiografia.tipoExame || '',
              tratamento: radiografia.tratamento || '',
              data: radiografia.data || '',
              cliente_id: radiografia.pacienteId || null,
              cliente_nome: radiografia.nomePaciente || '',
              cliente_email: radiografia.emailPaciente || '',
              imagem: radiografia.imagens && radiografia.imagens.length > 0 
                ? radiografia.imagens[0]?.url || exameImage
                : exameImage,
              imagens: radiografia.imagens && Array.isArray(radiografia.imagens) && radiografia.imagens.length > 0
                ? radiografia.imagens.map(img => img.url || img).filter(Boolean)
                : [],
              achados: achadosNormalizados,
              recomendacoes: radiografia.recomendacoes || [],
              necessidades: necessidadesNormalizadas,
              created_at: radiografia.createdAt || new Date().toISOString(),
              userId: userId
            }
            
            setDiagnostico(diagnosticoCompleto)
            setProfissionalNome(nomeProfissional)
            setEditedDescricao(diagnosticoCompleto.descricao || '')
            setEditedAchados(diagnosticoCompleto.achados || [])
            setEditedNecessidades(diagnosticoCompleto.necessidades || diagnosticoCompleto.recomendacoes || [])
            setEditedTitulo(diagnosticoCompleto.paciente || '')
            
            // Buscar ID do paciente pelo nome ou email
            await buscarPacienteId(radiografia.nomePaciente, radiografia.emailPaciente, radiografia.masterClient?.id || radiografia.masterClientId)
            
            // Se não encontrou o nome ainda, tentar buscar pela API
            const masterClientId = radiografia.masterClient?.id || radiografia.masterClientId
            if (!nomeProfissional && userId) {
              loadProfissionalNome(userId, masterClientId)
            } else if (nomeProfissional) {
              setProfissionalNome(nomeProfissional)
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
    // Preparar dados para a API - converter para array de strings
    const necessidadesArray = editedNecessidades
      .filter(nec => {
        // Filtrar apenas necessidades válidas (não vazias)
        if (typeof nec === 'string') {
          return nec.trim() !== ''
        }
        if (typeof nec === 'object' && nec !== null) {
          const procedimento = nec.procedimento || ''
          const anotacoes = nec.anotacoes || ''
          return procedimento.trim() !== '' || anotacoes.trim() !== ''
        }
        return false
      })
      .map(nec => {
        // Converter para string no formato "procedimento - anotacao"
        if (typeof nec === 'string') {
          return nec.trim()
        }
        if (typeof nec === 'object' && nec !== null) {
          const partes = []
          if (nec.procedimento) partes.push(nec.procedimento.trim())
          if (nec.anotacoes) partes.push(nec.anotacoes.trim())
          return partes.join(' - ')
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
    setEditedNecessidades([...editedNecessidades, ''])
  }

  const handleRemoveNecessidade = (index) => {
    setEditedNecessidades(editedNecessidades.filter((_, i) => i !== index))
  }

  const handleUpdateNecessidade = (index, value) => {
    const updated = [...editedNecessidades]
    updated[index] = value
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
      alert('Erro ao carregar desenho. Tente novamente.')
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

          <button 
            className="btn-desenho-detalhes"
            onClick={() => {
              if (diagnostico?.imagens && diagnostico.imagens.length > 1) {
                setShowImageSelector(true)
              } else {
                const imagemUrl = diagnostico?.imagens?.[0] || diagnostico?.imagem || ''
                navigate(`/app/diagnosticos/${id}/desenho`, { state: { imagemUrl } })
              }
            }}
          >
            <FontAwesomeIcon icon={faPencil} /> Ir para Desenho
          </button>
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
                  <button 
                    className="detalhamento-card-delete-btn"
                    onClick={(e) => handleDeleteDesenhoClick(desenho.id, e)}
                    title="Excluir detalhamento"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
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
                    {desenho.nomePaciente && (
                      <div className="detalhamento-card-paciente">
                        <span>{desenho.nomePaciente}</span>
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
              <button 
                className="btn-link-desenho"
                onClick={() => navigate(`/app/diagnosticos/${id}/desenho`)}
              >
                Clique aqui para adicionar desenhos e observações
              </button>
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="detalhes-section">
          <div className="detalhes-section-header">
            <h3>
              <FontAwesomeIcon icon={faFileAlt} /> Descrição do Exame
            </h3>
            {isEditingDescricao ? (
              <button 
                className="btn-save-section"
                onClick={handleSave}
              >
                <FontAwesomeIcon icon={faSave} /> Salvar
              </button>
            ) : (
              <button 
                className="btn-edit-section"
                onClick={() => setIsEditingDescricao(true)}
              >
                <FontAwesomeIcon icon={faEdit} /> Editar
              </button>
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
              {isEditingAchados ? (
                <>
                  <button 
                    className="btn-add-achado"
                    onClick={handleAddAchado}
                    title="Adicionar achado"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Adicionar
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
              {isEditingNecessidades ? (
                <>
                  <button 
                    className="btn-add-achado"
                    onClick={handleAddNecessidade}
                    title="Adicionar necessidade"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Adicionar
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
              )}
            </div>
          </div>
          {isEditingNecessidades ? (
            <div className="detalhes-achados-edit">
              {editedNecessidades.length > 0 ? (
                editedNecessidades.map((necessidade, index) => {
                  let necessidadeValue = ''
                  if (typeof necessidade === 'object' && necessidade !== null) {
                    // Mostrar procedimento primeiro, depois anotação
                    const partes = []
                    if (necessidade.procedimento) partes.push(necessidade.procedimento)
                    if (necessidade.anotacoes) partes.push(necessidade.anotacoes)
                    necessidadeValue = partes.join(' - ') || ''
                  } else if (typeof necessidade === 'string') {
                    necessidadeValue = necessidade
                  }
                  
                  return (
                  <div key={index} className="achado-item-edit">
                    <input
                      type="text"
                      className="achado-input"
                        value={necessidadeValue}
                      onChange={(e) => handleUpdateNecessidade(index, e.target.value)}
                      placeholder="Digite a necessidade..."
                    />
                    <button
                      className="btn-remove-achado"
                      onClick={() => handleRemoveNecessidade(index)}
                      title="Remover necessidade"
                    >
                      <FontAwesomeIcon icon={faTrash} />
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
              <ul className="detalhes-list">
                {editedNecessidades.map((necessidade, index) => {
                  let necessidadeValue = ''
                  if (typeof necessidade === 'object' && necessidade !== null) {
                    // Mostrar procedimento primeiro, depois anotação
                    const partes = []
                    if (necessidade.procedimento) partes.push(necessidade.procedimento)
                    if (necessidade.anotacoes) partes.push(necessidade.anotacoes)
                    necessidadeValue = partes.join(' - ') || 'Nenhuma informação'
                  } else if (typeof necessidade === 'string') {
                    necessidadeValue = necessidade || 'Nenhuma informação'
                  } else {
                    necessidadeValue = 'Nenhuma informação'
                  }
                  
                  return (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheck} className="list-icon" />
                      {necessidadeValue}
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
                    navigate(`/app/diagnosticos/${id}/desenho`, { state: { imagemUrl: img } })
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
    </div>
  )
}

export default DiagnosticoDetalhes

