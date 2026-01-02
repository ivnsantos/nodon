import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faXRay, faArrowLeft, faFileMedical, faCalendar, faUser,
  faCheck, faStethoscope, faFileAlt, faEnvelope, faPencil,
  faEdit, faSave, faTrash, faPlus, faTimes, faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons'
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
  const [diagnostico, setDiagnostico] = useState(null)
  const [loading, setLoading] = useState(true)
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
  const [drawingData, setDrawingData] = useState(null)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadDiagnostico()
    loadDrawingData()
  }, [id])

  const loadDrawingData = () => {
    try {
      const saved = localStorage.getItem(`drawing_${id}`)
      if (saved) {
        setDrawingData(JSON.parse(saved))
      } else {
        // Dados mockados para exemplo
        setDrawingData({
          observacoes: 'Radiografia panorâmica apresentando arcada dentária completa. Observa-se presença de restaurações em alguns elementos dentários. Estruturas ósseas preservadas, sem evidências de lesões periapicais ou outras patologias aparentes.',
          selectedDentes: [
            {
              numero: 36,
              descricao: 'Dente 36 (primeiro molar inferior direito) - Presença de restauração em resina composta na face oclusal. Raiz completa, espaço periodontal preservado.'
            }
          ]
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do desenho:', error)
      // Em caso de erro, usar dados mockados
      setDrawingData({
        observacoes: 'Radiografia panorâmica apresentando arcada dentária completa. Observa-se presença de restaurações em alguns elementos dentários. Estruturas ósseas preservadas, sem evidências de lesões periapicais ou outras patologias aparentes.',
        selectedDentes: [
          {
            numero: 36,
            descricao: 'Dente 36 (primeiro molar inferior direito) - Presença de restauração em resina composta na face oclusal. Raiz completa, espaço periodontal preservado.'
          }
        ]
      })
    }
  }

      const loadDiagnostico = async () => {
        try {
          // Simular delay de API
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Buscar diagnóstico do localStorage
          const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
          const diagnostico = savedDiagnosticos.find(d => d.id === parseInt(id))
          
          if (diagnostico) {
            // Adicionar dados mockados aos dados reais
            const mockDetalhes = getMockDetalhes(parseInt(id))
            const diagnosticoCompleto = {
              ...mockDetalhes,
              ...diagnostico,
              // Manter dados reais se existirem, mas priorizar dados salvos
              paciente: diagnostico.paciente || mockDetalhes.paciente,
              descricao: diagnostico.descricao || mockDetalhes.descricao,
              tratamento: diagnostico.tratamento || mockDetalhes.tratamento,
              data: diagnostico.data || mockDetalhes.data,
              cliente_id: diagnostico.cliente_id || mockDetalhes.cliente_id,
              cliente_nome: diagnostico.cliente_nome || mockDetalhes.cliente_nome,
              cliente_email: diagnostico.cliente_email || mockDetalhes.cliente_email,
              // Sempre usar exameImage se não for base64 válido
              imagem: (diagnostico.imagem && typeof diagnostico.imagem === 'string' && diagnostico.imagem.startsWith('data:image')) 
                ? diagnostico.imagem 
                : exameImage
            }
            setDiagnostico(diagnosticoCompleto)
            setEditedDescricao(diagnosticoCompleto.descricao || '')
            setEditedAchados(diagnosticoCompleto.achados || [])
            setEditedNecessidades(diagnosticoCompleto.recomendacoes || diagnosticoCompleto.necessidades || [])
            setEditedTitulo(diagnosticoCompleto.paciente || '')
          } else {
            // Se não encontrar, usar dados mockados
            const mockDetalhes = getMockDetalhes(parseInt(id))
            setDiagnostico(mockDetalhes)
            setEditedDescricao(mockDetalhes.descricao || '')
            setEditedAchados(mockDetalhes.achados || [])
            setEditedNecessidades(mockDetalhes.recomendacoes || mockDetalhes.necessidades || [])
            setEditedTitulo(mockDetalhes.paciente || '')
          }
        } catch (error) {
          console.error('Erro ao carregar diagnóstico:', error)
          // Se não encontrar, usar dados mockados
          const mockDetalhes = getMockDetalhes(parseInt(id))
          setDiagnostico(mockDetalhes)
          setEditedDescricao(mockDetalhes.descricao || '')
          setEditedAchados(mockDetalhes.achados || [])
        } finally {
          setLoading(false)
        }
      }

  const handleSave = () => {
    // Atualizar diagnóstico local
    const updatedDiagnostico = {
      ...diagnostico,
      descricao: editedDescricao,
      achados: editedAchados
    }
    setDiagnostico(updatedDiagnostico)
    
    // Salvar no localStorage
    const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
    const index = savedDiagnosticos.findIndex(d => d.id === parseInt(id))
    
    if (index !== -1) {
      savedDiagnosticos[index] = {
        ...savedDiagnosticos[index],
        descricao: editedDescricao,
        achados: editedAchados
      }
    } else {
      // Se não existir, criar novo
      savedDiagnosticos.push({
        id: parseInt(id),
        descricao: editedDescricao,
        achados: editedAchados
      })
    }
    
    localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
    setIsEditingDescricao(false)
  }

  const handleSaveAchados = () => {
    // Atualizar diagnóstico local
    const updatedDiagnostico = {
      ...diagnostico,
      achados: editedAchados
    }
    setDiagnostico(updatedDiagnostico)
    
    // Salvar no localStorage
    const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
    const index = savedDiagnosticos.findIndex(d => d.id === parseInt(id))
    
    if (index !== -1) {
      savedDiagnosticos[index] = {
        ...savedDiagnosticos[index],
        achados: editedAchados
      }
    } else {
      // Se não existir, criar novo
      savedDiagnosticos.push({
        id: parseInt(id),
        achados: editedAchados
      })
    }
    
    localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
    setIsEditingAchados(false)
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

  const handleSaveNecessidades = () => {
    // Atualizar diagnóstico local
    const updatedDiagnostico = {
      ...diagnostico,
      recomendacoes: editedNecessidades,
      necessidades: editedNecessidades
    }
    setDiagnostico(updatedDiagnostico)
    
    // Salvar no localStorage
    const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
    const index = savedDiagnosticos.findIndex(d => d.id === parseInt(id))
    
    if (index !== -1) {
      savedDiagnosticos[index] = {
        ...savedDiagnosticos[index],
        recomendacoes: editedNecessidades,
        necessidades: editedNecessidades
      }
    } else {
      // Se não existir, criar novo
      savedDiagnosticos.push({
        id: parseInt(id),
        recomendacoes: editedNecessidades,
        necessidades: editedNecessidades
      })
    }
    
    localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
    setIsEditingNecessidades(false)
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

  const handleDeleteDetalhamento = (e) => {
    e.stopPropagation() // Prevenir navegação ao clicar no botão
    setShowDeleteConfirm(true)
  }

  const confirmDeleteDetalhamento = () => {
    try {
      // Remover dados do detalhamento do localStorage
      localStorage.removeItem(`drawing_${id}`)
      
      // Atualizar estado
      setDrawingData(null)
      
      setShowDeleteConfirm(false)
      showAlert('Detalhamento profissional excluído com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao excluir detalhamento:', error)
      setShowDeleteConfirm(false)
      showAlert('Erro ao excluir detalhamento', 'error')
    }
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

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este detalhamento profissional?</p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-confirm"
                onClick={confirmDeleteDetalhamento}
              >
                Excluir
              </button>
            </div>
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
            onClick={() => navigate(`/app/diagnosticos/${id}/desenho`)}
          >
            <FontAwesomeIcon icon={faPencil} /> Ir para Desenho
          </button>
        </div>
      </div>

      <div className="detalhes-content">
            {/* Imagem da Radiografia */}
            <div className="detalhes-imagem-section">
              <img 
                src={exameImage}
                alt={diagnostico.paciente}
                className="detalhes-imagem"
              />
            </div>

        {/* Informações Principais */}
        <div className="detalhes-info-grid">
          <div className="detalhes-info-card">
            <div className="detalhes-info-card-header">
              <h3>
                <FontAwesomeIcon icon={faUser} /> Informações do Paciente
              </h3>
              {(diagnostico.cliente_id || diagnostico.cliente_nome) && (
                <button 
                  className="btn-ver-perfil"
                  onClick={() => {
                    if (diagnostico.cliente_id) {
                      navigate(`/app/clientes/${diagnostico.cliente_id}`)
                    } else if (diagnostico.cliente_nome) {
                      // Tentar encontrar o cliente pelo nome
                      const savedClientes = JSON.parse(localStorage.getItem('mockClientes') || '[]')
                      const cliente = savedClientes.find(c => c.nome === diagnostico.cliente_nome)
                      if (cliente) {
                        navigate(`/app/clientes/${cliente.id}`)
                      }
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
              <span>{diagnostico.paciente}</span>
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
            <div className="info-item">
              <strong>Data do Exame:</strong>
              <span>{new Date(diagnostico.data).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="info-item">
              <strong>Tipo de Exame:</strong>
              <span>{diagnostico.tipoExame || 'Radiografia Odontológica'}</span>
            </div>
          </div>

          <div className="detalhes-info-card">
            <h3>
              <FontAwesomeIcon icon={faUser} /> Profissional Responsável
            </h3>
            <div className="info-item">
              <strong>Nome:</strong>
              <span>{diagnostico.profissional || 'Dr. Carlos Mendes'}</span>
            </div>
            <div className="info-item">
              <strong>Registro:</strong>
              <span>{diagnostico.crm || 'CRO-SP 12345'}</span>
            </div>
            <div className="info-item">
              <strong>Data da Análise:</strong>
              <span>{new Date(diagnostico.dataAnalise || diagnostico.data).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Detalhamento Profissional */}
        <div className="detalhes-section">
          <div className="detalhes-section-header">
            <h3>
              <FontAwesomeIcon icon={faPencil} /> Detalhamento Profissional
            </h3>
          </div>
          
          {drawingData && (drawingData.observacoes || (drawingData.selectedDentes && drawingData.selectedDentes.length > 0)) ? (
            <div 
              className="detalhamento-card"
              onClick={() => navigate(`/app/diagnosticos/${id}/detalhamento-profissional`)}
            >
              <button 
                className="detalhamento-card-delete-btn"
                onClick={handleDeleteDetalhamento}
                title="Excluir detalhamento"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
              <div className="detalhamento-card-image">
                <img 
                  src={exameImage}
                  alt="Radiografia"
                  className="detalhamento-card-img"
                />
              </div>
              <div className="detalhamento-card-content" onClick={(e) => e.stopPropagation()}>
                <div className="detalhamento-card-subtitle-wrapper">
                      <p className="detalhamento-card-subtitle">
                        {diagnostico.paciente || 'Radiografia Odontológica'}
                      </p>
                </div>
                <div className="detalhamento-card-profissional">
                  <FontAwesomeIcon icon={faUser} />
                  <span>{diagnostico.profissional || 'Dr. Carlos Mendes'}</span>
                  <span className="detalhamento-card-cro">{diagnostico.crm || 'CRO-SP 12345'}</span>
                </div>
              </div>
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
              {diagnostico.descricao.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
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
                editedNecessidades.map((necessidade, index) => (
                  <div key={index} className="achado-item-edit">
                    <input
                      type="text"
                      className="achado-input"
                      value={necessidade}
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
                ))
              ) : (
                <p className="detalhes-empty-message">Nenhuma necessidade adicionada. Clique em "Adicionar" para incluir.</p>
              )}
            </div>
          ) : (
            editedNecessidades && editedNecessidades.length > 0 ? (
              <ul className="detalhes-list">
                {editedNecessidades.map((necessidade, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheck} className="list-icon" />
                    {necessidade}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detalhes-empty-message">Nenhuma necessidade registrada.</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default DiagnosticoDetalhes

