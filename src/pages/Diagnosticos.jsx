import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faXRay, faPlus, faImage, faFileMedical, faCalendar, faUser,
  faSearch, faCheck, faTimes, faEnvelope, faIdCard,
  faExclamationTriangle, faEye, faTrash, faUserMd, faUsers
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import exameImage from '../img/exame.jpg'
import './Diagnosticos.css'

// Dados mockados de exemplo - TODOS usam exameImage como exemplo
const getMockDiagnosticos = () => {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const semanaPassada = new Date(Date.now() - 604800000).toISOString().split('T')[0]
  
  // IMPORTANTE: Todos os diagnósticos mockados usam exameImage como exemplo
  return [
    {
      id: 1,
      paciente: 'Radiografia Panorâmica - Exemplo',
      descricao: 'Radiografia panorâmica de exemplo demonstrando a análise de estruturas dentárias. Observa-se arcada dentária completa superior e inferior, com dentição mista. Estruturas ósseas preservadas, seios maxilares aéreos, articulação temporomandibular (ATM) bilateralmente preservada. Presença de restaurações em alguns elementos dentários. Não há evidências de lesões periapicais, cistos ou outras patologias ósseas aparentes.',
      tratamento: 'Este é um exemplo de radiografia panorâmica. Para casos reais, recomenda-se:\n\n1. Análise detalhada das estruturas ósseas maxilares e mandibulares\n2. Verificação de integridade dentária e presença de restaurações\n3. Avaliação de possíveis patologias periapicais\n4. Análise dos seios maxilares e ATM\n5. Identificação de dentes inclusos ou impactados\n6. Acompanhamento periódico conforme protocolo clínico',
      data: hoje,
      imagem: exameImage, // Imagem de exemplo
      cliente_nome: 'João Silva',
      cliente_email: 'joao.silva@email.com',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      paciente: 'Radiografia Periapical - Elemento 36',
      descricao: 'Radiografia periapical do elemento 36 (primeiro molar inferior direito). Observa-se raiz completa, espaço periodontal preservado, sem evidências de lesões periapicais. Presença de restauração em resina composta na face oclusal.',
      tratamento: 'Tratamento recomendado:\n\n1. Manutenção da restauração existente\n2. Controle periódico a cada 6 meses\n3. Orientação sobre higiene bucal\n4. Avaliação clínica complementar',
      data: ontem,
      imagem: exameImage, // Imagem de exemplo
      cliente_nome: 'Maria Santos',
      cliente_email: 'maria.santos@email.com',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      paciente: 'Radiografia Interproximal - Região Anterior',
      descricao: 'Radiografia interproximal da região anterior superior e inferior. Avaliação de cáries interproximais e contatos dentários. Observa-se boa relação de contato entre os elementos dentários, sem evidências de cáries ou lesões cariosas.',
      tratamento: 'Tratamento:\n\n1. Manutenção preventiva\n2. Aplicação de flúor tópico\n3. Orientação sobre uso de fio dental\n4. Retorno em 6 meses para controle',
      data: semanaPassada,
      imagem: exameImage, // Imagem de exemplo
      cliente_nome: 'Pedro Oliveira',
      cliente_email: 'pedro.oliveira@email.com',
      created_at: new Date(Date.now() - 604800000).toISOString()
    }
  ]
}

const Diagnosticos = () => {
  const navigate = useNavigate()
  const { selectedClinicData, user, isClienteMaster, getRelacionamento } = useAuth()
  
  // Verificar se é cliente master
  const relacionamento = getRelacionamento()
  const isMaster = relacionamento?.tipo === 'clienteMaster' || isClienteMaster()
  const [diagnosticos, setDiagnosticos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  
  // Estados para busca de cliente
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [showNewClienteForm, setShowNewClienteForm] = useState(false)
  const [searching, setSearching] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [allPacientes, setAllPacientes] = useState([]) // Armazenar todos os pacientes carregados
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [diagnosticoToDelete, setDiagnosticoToDelete] = useState(null)
  const [savingRadiografia, setSavingRadiografia] = useState(false)
  
  // Estados para modal de seleção de responsável
  const [showResponsavelModal, setShowResponsavelModal] = useState(false)
  const [responsaveis, setResponsaveis] = useState([])
  const [selectedResponsavel, setSelectedResponsavel] = useState(null)
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false)
  const [pendingFormData, setPendingFormData] = useState(null)
  
  // Formulário de radiografia
  const [formData, setFormData] = useState({
    radiografica: '',
    descricao: '',
    tratamento: '',
    data: new Date().toISOString().split('T')[0],
    imagem: [],
    cliente_id: null
  })
  
  // Formulário de novo cliente (rápido)
  const [newClienteData, setNewClienteData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: ''
  })

  // Carregar responsáveis (usuarios do clienteMaster)
  const loadResponsaveis = async () => {
    try {
      setLoadingResponsaveis(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      let todosResponsaveis = []

      // Buscar usuarios do clienteMaster
      if (clienteMasterId) {
        try {
          const response = await api.get(`/users?clienteMasterId=${clienteMasterId}`)
          // A resposta pode estar aninhada: data.data.data ou data.data ou data
          const usuarios = response.data?.data?.data || response.data?.data || response.data || []
          
          // Normalizar usuarios
          const usuariosNormalizados = (Array.isArray(usuarios) ? usuarios : []).map(usuario => ({
            id: usuario.id,
            nome: usuario.nome || usuario.name || usuario.email,
            email: usuario.email || '',
            tipo: usuario.tipo || 'usuario',
            label: usuario.tipo === 'master' ? 'Cliente Master' : 'Usuário'
          }))

          todosResponsaveis = usuariosNormalizados
        } catch (usuariosError) {
          console.log('Erro ao buscar usuarios:', usuariosError)
        }
      }

      // Se não conseguiu carregar nenhum, adicionar pelo menos o usuário logado
      if (todosResponsaveis.length === 0) {
        const usuarioLogado = user || selectedClinicData?.perfil
        if (usuarioLogado && usuarioLogado.id) {
          todosResponsaveis.push({
            id: usuarioLogado.id,
            nome: usuarioLogado.nome || usuarioLogado.name || usuarioLogado.email,
            email: usuarioLogado.email || '',
            tipo: 'user',
            label: 'Usuário Logado'
          })
        }
      }

      setResponsaveis(todosResponsaveis)
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error)
      setResponsaveis([])
    } finally {
      setLoadingResponsaveis(false)
    }
  }

  // Carregar todos os pacientes do clienteMasterId
  const loadPacientes = async () => {
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        return
      }

      const response = await api.get(`/pacientes?clienteMasterId=${clienteMasterId}`)
      const pacientes = response.data?.data || response.data || []
      
      // Normalizar dados dos pacientes para o formato esperado
      const pacientesNormalizados = pacientes.map(paciente => ({
        id: paciente.id,
        nome: paciente.nome || '',
        email: paciente.email || '',
        cpf: paciente.cpf || '',
        telefone: paciente.telefone || ''
      }))
      
      setAllPacientes(pacientesNormalizados)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setAllPacientes([])
    }
  }

  useEffect(() => {
    if (selectedClinicData) {
      fetchDiagnosticos()
    }
  }, [selectedClinicData])

  useEffect(() => {
    if (selectedClinicData) {
      loadPacientes()
    }
  }, [selectedClinicData])

  // Função para formatar CPF
  const formatCPF = (cpf) => {
    if (!cpf) return ''
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  // Buscar clientes na lista carregada
  useEffect(() => {
    // Limpar resultados se não houver termo de busca ou se for muito curto
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    const searchClientes = () => {
      setSearching(true)
      
      try {
        const searchLower = searchTerm.trim().toLowerCase()
        const searchTermClean = searchTerm.trim().replace(/\D/g, '')
        
        // Filtrar pacientes por nome, email ou CPF
        const filtered = allPacientes.filter(paciente => {
          // Busca por nome
          const nomeMatch = paciente.nome?.toLowerCase().includes(searchLower) || false
          
          // Busca por email
          const emailMatch = paciente.email?.toLowerCase().includes(searchLower) || false
          
          // Busca por CPF (remove formatação para comparação)
          const cpfClean = paciente.cpf?.replace(/\D/g, '') || ''
          const cpfMatch = cpfClean.includes(searchTermClean) && searchTermClean.length >= 3
          
          return nomeMatch || emailMatch || cpfMatch
        })
        
        setSearchResults(filtered)
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    const timeoutId = setTimeout(searchClientes, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, allPacientes])

  const fetchDiagnosticos = async () => {
    try {
      setLoading(true)
      
      // Obter clienteMasterId do contexto (pode estar em diferentes lugares dependendo do tipo de usuário)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setDiagnosticos([])
        setLoading(false)
        return
      }

      // Fazer GET para buscar radiografias
      const response = await api.get(`/radiografias?clienteMasterId=${clienteMasterId}`)
      const radiografias = response.data?.data || response.data || []
      
      // Normalizar dados das radiografias para o formato esperado
      const diagnosticosNormalizados = radiografias.map(radiografia => ({
        id: radiografia.id,
        paciente: radiografia.nome || radiografia.nome || '',
        descricao: radiografia.tipoExame || '',
        tratamento: radiografia.tratamento || '',
        data: radiografia.data || '',
        imagem: radiografia.imagens && radiografia.imagens.length > 0 
          ? radiografia.imagens[0]?.url || null
          : null,
        imagens: radiografia.imagens && Array.isArray(radiografia.imagens) && radiografia.imagens.length > 0
          ? radiografia.imagens.map(img => img.url || img).filter(Boolean)
          : [],
        cliente_id: radiografia.pacienteId || null,
        cliente_nome: radiografia.nome || '',
        cliente_email: radiografia.emailPaciente || '',
        responsavel: radiografia.responsavel || radiografia.responsavelId || null,
        created_at: radiografia.createdAt || new Date().toISOString()
      }))
      
      setDiagnosticos(diagnosticosNormalizados)
    } catch (error) {
      console.error('Erro ao buscar radiografias:', error)
      setDiagnosticos([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const remainingSlots = 4 - selectedImages.length
    
    if (remainingSlots <= 0) {
      showAlert('Você pode adicionar no máximo 4 imagens', 'error')
      return
    }
    
    const filesToAdd = files.slice(0, remainingSlots)
    
    if (files.length > remainingSlots) {
      showAlert(`Apenas ${remainingSlots} imagem(ns) foram adicionadas. Limite de 4 imagens.`, 'error')
    }
    
    filesToAdd.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newImage = reader.result
        setSelectedImages(prev => [...prev, newImage])
        setFormData(prev => ({ 
          ...prev, 
          imagem: [...prev.imagem, newImage] 
        }))
      }
      reader.readAsDataURL(file)
    })
    
    // Resetar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }
  
  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      imagem: prev.imagem.filter((_, i) => i !== index)
    }))
  }

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente)
    setFormData({ ...formData, cliente_id: cliente.id, radiografica: '' })
    setSearchTerm('')
    setSearchResults([])
  }

  const showAlert = (message, type = 'error') => {
    setCustomAlert({ show: true, message, type })
    setTimeout(() => {
      setCustomAlert({ show: false, message: '', type: 'error' })
    }, 5000)
  }

  const handleCreateCliente = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Buscar clientes existentes
      const savedClientes = JSON.parse(localStorage.getItem('mockClientes') || '[]')
      const mockClientes = savedClientes.length > 0 ? savedClientes : [
        { id: 1, nome: 'João Silva', email: 'joao@email.com', cpf: '123.456.789-00' },
        { id: 2, nome: 'Maria Santos', email: 'maria@email.com', cpf: '987.654.321-00' },
        { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', cpf: '111.222.333-44' }
      ]
      
      // Criar novo cliente
      const novoCliente = {
        id: Math.max(...mockClientes.map(c => c.id), 0) + 1,
        nome: newClienteData.nome,
        email: newClienteData.email,
        cpf: newClienteData.cpf,
        telefone: newClienteData.telefone
      }
      
      mockClientes.push(novoCliente)
      localStorage.setItem('mockClientes', JSON.stringify(mockClientes))
      
      handleSelectCliente({ id: novoCliente.id, nome: novoCliente.nome, email: novoCliente.email, cpf: novoCliente.cpf })
      setShowNewClienteForm(false)
      setNewClienteData({ nome: '', email: '', cpf: '', telefone: '' })
      showAlert('Cliente cadastrado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      showAlert('Erro ao criar cliente. Tente novamente.')
    }
  }

  // Abre o modal de seleção de responsável
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCliente) {
      showAlert('Por favor, selecione ou cadastre um cliente primeiro')
      return
    }

    // Validações
    if (!formData.radiografica || !formData.radiografica.trim()) {
      showAlert('Por favor, preencha o nome da radiografia')
      return
    }

    if (!formData.descricao || !formData.descricao.trim()) {
      showAlert('Por favor, preencha o tipo de exame')
      return
    }

    if (!formData.tratamento || !formData.tratamento.trim()) {
      showAlert('Por favor, preencha o tratamento')
      return
    }

    if (!formData.data) {
      showAlert('Por favor, selecione a data')
      return
    }

    // Salvar dados do formulário e abrir modal de responsável
    setPendingFormData({ ...formData })
    setSelectedResponsavel(null)
    loadResponsaveis()
    setShowResponsavelModal(true)
  }

  // Função que realmente envia os dados após selecionar responsável
  const handleConfirmCadastro = async () => {
    if (!selectedResponsavel) {
      showAlert('Por favor, selecione um responsável')
      return
    }

    setShowResponsavelModal(false)

    try {
      // Obter clienteMasterId do contexto (pode estar em diferentes lugares dependendo do tipo de usuário)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showAlert('Erro: Dados do cliente master não encontrados. Por favor, selecione um consultório.')
        return
      }

      // Usar pendingFormData que foi salvo antes de abrir o modal
      const formDataToUse = pendingFormData || formData

      // Preparar imagens - usar selectedImages ou formData.imagem
      const imagensArray = selectedImages.length > 0 ? selectedImages : (formDataToUse.imagem || [])
      const imagens = Array.isArray(imagensArray) && imagensArray.length > 0
        ? imagensArray
            .filter(img => img && typeof img === 'string' && img.length > 0 && (img.startsWith('data:image') || img.startsWith('http')))
            .map(img => ({
              url: img
            }))
        : []
      
      // Preparar payload para a API - incluindo responsavel e pacienteId
      const payload = {
        nome: selectedCliente.nome,
        emailPaciente: selectedCliente.email || '',
        radiografia: formDataToUse.radiografica?.trim() || '',
        data: formDataToUse.data,
        tipoExame: formDataToUse.descricao?.trim() || '',
        tratamento: formDataToUse.tratamento?.trim() || '',
        imagens: imagens,
        pacienteId: selectedCliente.id, // ID do paciente selecionado
        responsavel: selectedResponsavel.id // ID do responsável selecionado
      }

      // Log detalhado para debug
      console.log('=== DEBUG POST RADIOGRAFIA ===')
      console.log('Payload completo:', JSON.stringify(payload, null, 2))
      console.log('clienteMasterId:', clienteMasterId)
      console.log('Paciente selecionado:', selectedCliente)
      console.log('Responsável selecionado:', selectedResponsavel)
      console.log('URL:', `/radiografias?clienteMasterId=${clienteMasterId}`)
      console.log('Número de imagens:', imagens.length)
      if (imagens.length > 0) {
        console.log('Primeira imagem (primeiros 100 chars):', imagens[0].url.substring(0, 100))
      }
      console.log('================================')

      // Ativar loading
      setSavingRadiografia(true)

      // Fazer POST para criar radiografia
      const response = await api.post(`/radiografias?clienteMasterId=${clienteMasterId}`, payload)
      
      console.log('Resposta da API:', response.data)
      
      // Limpar formulário
      setShowForm(false)
      setFormData({
        radiografica: '',
        descricao: '',
        tratamento: '',
        data: new Date().toISOString().split('T')[0],
        imagem: [],
        cliente_id: null
      })
      setSelectedImages([])
      setSelectedCliente(null)
      setSearchTerm('')
      setSearchResults([])
      setPendingFormData(null)
      setSelectedResponsavel(null)
      
      // Recarregar lista de radiografias
      await fetchDiagnosticos()
      showAlert('Radiografia cadastrada com sucesso!', 'success')
      
      // Desativar loading após sucesso
      setSavingRadiografia(false)
    } catch (error) {
      // Desativar loading em caso de erro
      setSavingRadiografia(false)
      
      console.error('=== ERRO AO CADASTRAR RADIOGRAFIA ===')
      console.error('Erro completo:', error)
      console.error('Mensagem:', error.message)
      console.error('Status:', error.response?.status)
      console.error('Status Text:', error.response?.statusText)
      console.error('Response Data:', error.response?.data)
      console.error('=====================================')
      
      let errorMessage = 'Erro ao cadastrar radiografia. Tente novamente.'
      
      // Verificar se é erro de limite mensal excedido
      if (error.response?.status === 400 && error.response?.data?.message) {
        // Usar a mensagem da API diretamente para erros de limite
        errorMessage = error.response.data.message
      } else if (error.response?.data) {
        const responseData = error.response.data
        
        if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.error) {
          errorMessage = typeof responseData.error === 'string' 
            ? responseData.error 
            : JSON.stringify(responseData.error)
        } else if (responseData.statusCode === 500) {
          errorMessage = 'Erro interno do servidor. Verifique os logs do backend ou tente novamente.'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showAlert(errorMessage)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setSelectedCliente(null)
    setSearchTerm('')
    setSearchResults([])
    setShowNewClienteForm(false)
    setFormData({
      radiografica: '',
      descricao: '',
      tratamento: '',
      data: new Date().toISOString().split('T')[0],
      imagem: [],
      cliente_id: null
    })
    setSelectedImages([])
    setNewClienteData({ nome: '', email: '', cpf: '', telefone: '' })
  }

  const handleViewDetails = (diagnostico) => {
    navigate(`/app/diagnosticos/${diagnostico.id}`)
  }

  const handleDeleteClick = (diagnostico, e) => {
    if (e) {
      e.stopPropagation() // Prevenir navegação ao clicar no botão
      e.preventDefault() // Prevenir comportamento padrão
    }
    setDiagnosticoToDelete(diagnostico)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!diagnosticoToDelete) return

    try {
      // Fazer DELETE para deletar radiografia
      await api.delete(`/radiografias/${diagnosticoToDelete.id}`)
      
      // Recarregar lista de radiografias
      await fetchDiagnosticos()
      
      // Também remover dados de desenho associados se existirem
      localStorage.removeItem(`drawing_${diagnosticoToDelete.id}`)
      
      setShowDeleteModal(false)
      setDiagnosticoToDelete(null)
      showAlert('Radiografia excluída com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao excluir radiografia:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao excluir radiografia. Tente novamente.'
      showAlert(errorMessage)
      setShowDeleteModal(false)
      setDiagnosticoToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setDiagnosticoToDelete(null)
  }

  if (loading) {
    return (
      <div className="diagnosticos-loading">
        <div className="loading-spinner"></div>
        <p>Carregando radiografias...</p>
      </div>
    )
  }

  return (
    <div className="diagnosticos-modern">
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
      
      <div className="diagnosticos-header">
        <div>
          <h2>
            <FontAwesomeIcon icon={faXRay} /> Galeria de Radiografias
          </h2>
          <p>Gerencie e analise radiografias odontológicas</p>
        </div>
        <button className="btn-diagnosticos-primary" onClick={() => setShowForm(!showForm)}>
          <FontAwesomeIcon icon={faPlus} /> {showForm ? 'Cancelar' : 'Nova Radiografia'}
        </button>
      </div>

      {showForm && (
        <div className="form-card-modern">
          <h3>Nova Radiografia</h3>
          
          {/* Busca de Cliente */}
          {!selectedCliente && (
            <div className="cliente-search-section">
              <h4>Vincular a um Cliente</h4>
              <p className="search-hint">Busque por nome, email ou CPF</p>
              
              <div className="search-input-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  className="cliente-search-input"
                  placeholder="Digite nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {searchTerm.trim().length > 0 && (
                  <button 
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchTerm('')
                      setSearchResults([])
                      setSearching(false)
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>

              {/* Resultados da busca */}
              {searching && searchTerm.trim().length >= 2 && (
                <div className="search-loading">
                  <div className="loading-spinner-small"></div>
                  <span>Buscando...</span>
                </div>
              )}

              {!searching && searchTerm.trim().length >= 2 && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((cliente) => (
                    <div 
                      key={cliente.id} 
                      className="search-result-item"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      <div className="result-info">
                        <div className="result-name">{cliente.nome}</div>
                        <div className="result-details">
                          {cliente.email && <span><FontAwesomeIcon icon={faEnvelope} /> {cliente.email}</span>}
                          {cliente.cpf && <span><FontAwesomeIcon icon={faIdCard} /> {formatCPF(cliente.cpf)}</span>}
                        </div>
                      </div>
                      <FontAwesomeIcon icon={faCheck} className="select-icon" />
                    </div>
                  ))}
                </div>
              )}

              {!searching && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
                <div className="no-results">
                  <p>Nenhum cliente encontrado</p>
                  <button 
                    type="button"
                    className="btn-create-cliente"
                    onClick={() => setShowNewClienteForm(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Cadastrar Novo Cliente
                  </button>
                </div>
              )}

              {/* Formulário de cadastro rápido */}
              {showNewClienteForm && (
                <div className="new-cliente-form-quick">
                  <h5>Cadastro Rápido</h5>
                  <div className="form-grid-quick">
                    <div className="form-group-quick">
                      <label>Nome *</label>
                      <input
                        type="text"
                        value={newClienteData.nome}
                        onChange={(e) => setNewClienteData({ ...newClienteData, nome: e.target.value })}
                        required
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="form-group-quick">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={newClienteData.email}
                        onChange={(e) => setNewClienteData({ ...newClienteData, email: e.target.value })}
                        required
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="form-group-quick">
                      <label>CPF</label>
                      <input
                        type="text"
                        value={newClienteData.cpf}
                        onChange={(e) => setNewClienteData({ ...newClienteData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="form-group-quick">
                      <label>Telefone</label>
                      <input
                        type="text"
                        value={newClienteData.telefone}
                        onChange={(e) => setNewClienteData({ ...newClienteData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="form-actions-quick">
                    <button 
                      type="button"
                      className="btn-cancel-quick"
                      onClick={() => {
                        setShowNewClienteForm(false)
                        setNewClienteData({ nome: '', email: '', cpf: '', telefone: '' })
                      }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      className="btn-save-quick"
                      onClick={handleCreateCliente}
                      disabled={!newClienteData.nome || !newClienteData.email}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Cadastrar e Continuar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cliente Selecionado */}
          {selectedCliente && (
            <div className="selected-cliente-info">
              <div className="selected-cliente-card">
                <div className="selected-cliente-details">
                  <FontAwesomeIcon icon={faCheck} className="check-icon" />
                  <div>
                    <strong>{selectedCliente.nome}</strong>
                    {selectedCliente.email && <span>{selectedCliente.email}</span>}
                  </div>
                </div>
                <button 
                  type="button"
                  className="btn-change-cliente"
                  onClick={() => {
                    setSelectedCliente(null)
                    setFormData({ ...formData, cliente_id: null })
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} /> Trocar
                </button>
              </div>
            </div>
          )}

          {/* Formulário de Radiografia */}
          {selectedCliente && (
            <form onSubmit={handleSubmit} className="radiografia-form">
              <div className="form-grid-modern">
                <div className="form-group-modern">
                  <label>
                    <FontAwesomeIcon icon={faUser} /> Nome da radiografia
                  </label>
                  <input
                    type="text"
                    value={formData.radiografica}
                    onChange={(e) => setFormData({ ...formData, radiografica: e.target.value })}
                    required
                    placeholder="Digite o nome da radiografia"
                  />
                </div>
                <div className="form-group-modern">
                  <label>
                    <FontAwesomeIcon icon={faCalendar} /> Data
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label>
                  <FontAwesomeIcon icon={faImage} /> Imagem da Radiografia
                  {selectedImages.length > 0 && (
                    <span className="image-count-badge">({selectedImages.length}/4)</span>
                  )}
                </label>
                <div className="images-upload-container">
                  {selectedImages.length > 0 && (
                    <div className="images-preview-grid">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={image} alt={`Preview ${index + 1}`} />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(index)}
                            title="Remover imagem"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedImages.length < 4 && (
                    <label className="upload-label">
                      <FontAwesomeIcon icon={faImage} size="3x" />
                      <span>Clique para fazer upload</span>
                      <span className="upload-hint">Máximo 4 imagens</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group-modern form-group-tipo-exame">
                <label>
                  <FontAwesomeIcon icon={faFileMedical} /> Tipo de Exame
                </label>
                <textarea
                  rows="4"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  placeholder="Ex: Panorâmica, Periapical, Interproximal, etc..."
                />
              </div>

              <div className="form-group-modern form-group-tratamento">
                <label>
                  <FontAwesomeIcon icon={faFileMedical} /> Tratamento
                </label>
                <textarea
                  rows="4"
                  value={formData.tratamento}
                  onChange={(e) => setFormData({ ...formData, tratamento: e.target.value })}
                  required
                  placeholder="Descreva o tratamento recomendado..."
                />
              </div>

              <div className="form-actions-radiografia">
                <button 
                  type="button"
                  className="btn-cancel-radiografia"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-submit-modern"
                  disabled={savingRadiografia}
                >
                  {savingRadiografia ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} /> Cadastrar Radiografia
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="diagnosticos-grid">
        {diagnosticos.length === 0 ? (
          <div className="empty-state-diagnosticos">
            <FontAwesomeIcon icon={faXRay} size="4x" />
            <h3>Nenhuma radiografia cadastrada</h3>
            <p>Comece adicionando uma nova radiografia</p>
          </div>
        ) : (
          diagnosticos.map((diagnostico) => (
            <div key={diagnostico.id} className="diagnostico-card">
              {(isMaster || diagnostico.responsavel === user?.id || diagnostico.responsavel === selectedClinicData?.usuarioId || diagnostico.responsavel === selectedClinicData?.perfil?.id) && (
                <button 
                  className="diagnostico-delete-btn"
                  onClick={(e) => handleDeleteClick(diagnostico, e)}
                  title="Excluir radiografia"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
              <div className={`diagnostico-image-container ${diagnostico.imagens && diagnostico.imagens.length === 4 ? 'has-four-images' : ''}`} onClick={() => handleViewDetails(diagnostico)}>
                {diagnostico.imagens && diagnostico.imagens.length > 0 ? (
                  <div className={`diagnostico-images-grid ${
                    diagnostico.imagens.length === 1 ? 'single' 
                    : diagnostico.imagens.length === 2 ? 'two-columns' 
                    : diagnostico.imagens.length === 3 ? 'three-grid'
                    : 'four-grid'
                  }`}>
                    {diagnostico.imagens.map((img, index) => (
                      <div key={index} className="diagnostico-image-item">
                        <img 
                          src={img || exameImage}
                          alt={`${diagnostico.paciente} - Imagem ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="diagnostico-image">
                    <img 
                      src={diagnostico.imagem || exameImage}
                      alt={diagnostico.paciente}
                    />
                  </div>
                )}
                <div className="diagnostico-overlay">
                  <button 
                    className="view-btn"
                    onClick={() => handleViewDetails(diagnostico)}
                  >
                    <FontAwesomeIcon icon={faEye} /> Ver Detalhes
                  </button>
                </div>
              </div>
              <div className="diagnostico-info">
                <h4>
                  {diagnostico.paciente}
                </h4>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Radiografia</h3>
            <p>
              Tem certeza que deseja excluir a radiografia de <strong>{diagnosticoToDelete?.paciente}</strong>?
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={handleConfirmDelete}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Responsável */}
      {showResponsavelModal && (
        <div className="modal-overlay" onClick={() => setShowResponsavelModal(false)}>
          <div className="modal-responsavel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-responsavel-header">
              <div className="modal-responsavel-icon">
                <FontAwesomeIcon icon={faUserMd} />
              </div>
              <h3>Selecione o Responsável</h3>
              <p>Escolha o profissional responsável por esta radiografia</p>
              <button 
                className="modal-close-btn"
                onClick={() => setShowResponsavelModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-responsavel-content">
              {loadingResponsaveis ? (
                <div className="loading-responsaveis">
                  <div className="loading-spinner"></div>
                  <p>Carregando responsáveis...</p>
                </div>
              ) : responsaveis.length === 0 ? (
                <div className="empty-responsaveis">
                  <FontAwesomeIcon icon={faUsers} />
                  <p>Nenhum responsável encontrado</p>
                </div>
              ) : (
                <div className="responsaveis-list">
                  {responsaveis.map((responsavel) => (
                    <div
                      key={`${responsavel.tipo}-${responsavel.id}`}
                      className={`responsavel-item ${selectedResponsavel?.id === responsavel.id ? 'selected' : ''}`}
                      onClick={() => setSelectedResponsavel(responsavel)}
                    >
                      <div className="responsavel-avatar">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div className="responsavel-info">
                        <span className="responsavel-nome">{responsavel.nome}</span>
                        <span className="responsavel-email">{responsavel.email}</span>
                        <span className={`responsavel-tipo ${responsavel.tipo}`}>{responsavel.label}</span>
                      </div>
                      {selectedResponsavel?.id === responsavel.id && (
                        <div className="responsavel-check">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-responsavel-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowResponsavelModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-confirm"
                onClick={handleConfirmCadastro}
                disabled={!selectedResponsavel || savingRadiografia}
              >
                {savingRadiografia ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    Cadastrar Radiografia
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

export default Diagnosticos
