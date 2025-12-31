import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faXRay, faPlus, faImage, faFileMedical, faCalendar, faUser,
  faSearch, faCheck, faTimes, faEnvelope, faIdCard,
  faExclamationTriangle, faEye
} from '@fortawesome/free-solid-svg-icons'
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
  const [diagnosticos, setDiagnosticos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  
  // Estados para busca de cliente
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [showNewClienteForm, setShowNewClienteForm] = useState(false)
  const [searching, setSearching] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  
  // Formulário de radiografia
  const [formData, setFormData] = useState({
    radiografica: '',
    descricao: '',
    tratamento: '',
    data: new Date().toISOString().split('T')[0],
    imagem: null,
    cliente_id: null
  })
  
  // Formulário de novo cliente (rápido)
  const [newClienteData, setNewClienteData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: ''
  })

  useEffect(() => {
    fetchDiagnosticos()
  }, [])

  // Buscar clientes (mockado)
  useEffect(() => {
    const searchClientes = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      try {
        // Buscar clientes do localStorage ou usar dados mockados
        const savedClientes = JSON.parse(localStorage.getItem('mockClientes') || '[]')
        const mockClientes = savedClientes.length > 0 ? savedClientes : [
          { id: 1, nome: 'João Silva', email: 'joao@email.com', cpf: '123.456.789-00' },
          { id: 2, nome: 'Maria Santos', email: 'maria@email.com', cpf: '987.654.321-00' },
          { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', cpf: '111.222.333-44' }
        ]
        
        const filtered = mockClientes.filter(cliente => 
          cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.cpf?.includes(searchTerm)
        )
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
  }, [searchTerm])

  const fetchDiagnosticos = async () => {
    try {
      // Buscar diagnósticos do localStorage ou usar dados mockados
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      if (savedDiagnosticos.length > 0) {
        // Garantir que todos os diagnósticos tenham exameImage se não tiverem base64
        const diagnosticosComImagem = savedDiagnosticos.map(d => ({
          ...d,
          // Manter base64 se existir, caso contrário será substituído por exameImage no render
          imagem: (d.imagem && typeof d.imagem === 'string' && d.imagem.startsWith('data:image')) 
            ? d.imagem 
            : null // null será substituído por exameImage no render
        }))
        setDiagnosticos(diagnosticosComImagem)
      } else {
        const mockData = getMockDiagnosticos()
        // Garantir que todos os dados mockados tenham a referência correta
        setDiagnosticos(mockData)
        // Salvar sem a imagem (será substituída por exameImage no render)
        const dataToSave = mockData.map(d => ({
          ...d,
          imagem: null // Não salvar, sempre usar exameImage no render
        }))
        localStorage.setItem('mockDiagnosticos', JSON.stringify(dataToSave))
      }
    } catch (error) {
      console.error('Erro ao buscar diagnósticos:', error)
      setDiagnosticos(getMockDiagnosticos())
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, imagem: reader.result })
        setSelectedImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSelectCliente = (cliente) => {
    setSelectedCliente(cliente)
    setFormData({ ...formData, cliente_id: cliente.id, radiografica: cliente.nome })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCliente) {
      showAlert('Por favor, selecione ou cadastre um cliente primeiro')
      return
    }

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Buscar diagnósticos existentes
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      const mockDiagnosticos = savedDiagnosticos.length > 0 ? savedDiagnosticos : getMockDiagnosticos()
      
      // Criar novo diagnóstico
      const novoDiagnostico = {
        id: Math.max(...mockDiagnosticos.map(d => d.id), 0) + 1,
        paciente: formData.radiografica || selectedCliente.nome,
        descricao: formData.descricao || 'Radiografia cadastrada',
        tratamento: formData.tratamento || '',
        data: formData.data || new Date().toISOString().split('T')[0],
        // Se tiver imagem base64 do upload, usar. Senão, usar exameImage como exemplo
        imagem: formData.imagem && formData.imagem.startsWith('data:') ? formData.imagem : null,
        cliente_id: selectedCliente.id,
        cliente_nome: selectedCliente.nome,
        cliente_email: selectedCliente.email,
        created_at: new Date().toISOString()
      }
      
      mockDiagnosticos.unshift(novoDiagnostico) // Adicionar no início
      // Salvar no localStorage (imagem será substituída por exameImage no render se não for base64)
      localStorage.setItem('mockDiagnosticos', JSON.stringify(mockDiagnosticos))
      
      setShowForm(false)
      setFormData({
        radiografica: '',
        descricao: '',
        tratamento: '',
        data: new Date().toISOString().split('T')[0],
        imagem: null,
        cliente_id: null
      })
      setSelectedImage(null)
      setSelectedCliente(null)
      setSearchTerm('')
      setSearchResults([])
      fetchDiagnosticos()
      showAlert('Radiografia cadastrada com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao cadastrar diagnóstico:', error)
      showAlert('Erro ao cadastrar diagnóstico')
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
      imagem: null,
      cliente_id: null
    })
    setSelectedImage(null)
    setNewClienteData({ nome: '', email: '', cpf: '', telefone: '' })
  }

  const handleViewDetails = (diagnostico) => {
    navigate(`/app/diagnosticos/${diagnostico.id}`)
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
                {searchTerm && (
                  <button 
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchTerm('')
                      setSearchResults([])
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>

              {/* Resultados da busca */}
              {searching && (
                <div className="search-loading">
                  <div className="loading-spinner-small"></div>
                  <span>Buscando...</span>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
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
                          {cliente.cpf && <span><FontAwesomeIcon icon={faIdCard} /> {cliente.cpf}</span>}
                        </div>
                      </div>
                      <FontAwesomeIcon icon={faCheck} className="select-icon" />
                    </div>
                  ))}
                </div>
              )}

              {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
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
                    <FontAwesomeIcon icon={faUser} /> Radiográfica
                  </label>
                  <input
                    type="text"
                    value={formData.radiografica}
                    onChange={(e) => setFormData({ ...formData, radiografica: e.target.value })}
                    required
                    placeholder="Nome da radiográfica"
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
                </label>
                <div className="image-upload-area">
                  {selectedImage ? (
                    <div className="image-preview">
                      <img src={selectedImage} alt="Preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => {
                          setSelectedImage(null)
                          setFormData({ ...formData, imagem: null })
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <FontAwesomeIcon icon={faImage} size="3x" />
                      <span>Clique para fazer upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group-modern">
                <label>
                  <FontAwesomeIcon icon={faFileMedical} /> Descrição
                </label>
                <textarea
                  rows="4"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  placeholder="Descreva o caso..."
                />
              </div>

              <div className="form-group-modern">
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
                <button type="submit" className="btn-submit-modern">
                  <FontAwesomeIcon icon={faPlus} /> Cadastrar Radiografia
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
              <div className="diagnostico-image">
                <img 
                  src={exameImage}
                  alt={diagnostico.paciente}
                />
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
                  <FontAwesomeIcon icon={faUser} /> {diagnostico.paciente}
                </h4>
                {diagnostico.cliente_nome && (
                  <p className="cliente-link">
                    Cliente: {diagnostico.cliente_nome}
                  </p>
                )}
                <p className="diagnostico-date">
                  <FontAwesomeIcon icon={faCalendar} /> {new Date(diagnostico.data).toLocaleDateString('pt-BR')}
                </p>
                <p className="diagnostico-desc">{diagnostico.descricao}</p>
                <div className="diagnostico-tags">
                  <span className="tag">Análise IA</span>
                  <span className="tag">Relatório</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Diagnosticos
