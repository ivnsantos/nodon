import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faEdit, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faIdCard,
  faStethoscope, faHistory, faPlus, faFileMedical,
  faCheckCircle, faClock, faTimesCircle, faExclamationTriangle,
  faXRay, faEye
} from '@fortawesome/free-solid-svg-icons'
// Removido import de axios - usando dados mockados
import './ClienteDetalhes.css'

const ClienteDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [historico, setHistorico] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNecessidadesModal, setShowNecessidadesModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [novaNecessidade, setNovaNecessidade] = useState('')
  const [novoStatus, setNovoStatus] = useState('')

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
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar cliente do localStorage
      const savedClientes = JSON.parse(localStorage.getItem('mockClientesCompletos') || '[]')
      const cliente = savedClientes.find(c => c.id === parseInt(id))
      
      if (cliente) {
        // Garantir que necessidades seja sempre um array
        const clienteComNecessidades = {
          ...cliente,
          necessidades: Array.isArray(cliente.necessidades) 
            ? cliente.necessidades 
            : (cliente.necessidades ? [cliente.necessidades] : [])
        }
        setCliente(clienteComNecessidades)
      } else {
        // Dados mockados padrão
        setCliente({
          id: parseInt(id),
          nome: 'João Silva',
          email: 'joao@email.com',
          telefone: '(11) 99999-9999',
          cpf: '123.456.789-00',
          dataNascimento: '1985-05-15',
          endereco: {
            rua: 'Rua das Flores, 123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567'
          },
          status: 'em-andamento',
          necessidades: [
            'Tratamento de canal no dente 36',
            'Limpeza e profilaxia',
            'Avaliação ortodôntica'
          ],
          observacoes: 'Paciente com histórico de sensibilidade dentária.',
          createdAt: '2024-01-10'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistorico = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar histórico do localStorage
      const savedHistorico = JSON.parse(localStorage.getItem(`mockHistorico_${id}`) || '[]')
      if (savedHistorico.length > 0) {
        setHistorico(savedHistorico)
      } else {
        // Dados mockados padrão
        const mockHistorico = [
          {
            id: 1,
            tipo: 'status',
            descricao: 'Status alterado para Em Andamento',
            data: '2024-01-15T10:30:00',
            usuario: 'Dr. Silva'
          },
          {
            id: 2,
            tipo: 'necessidade',
            descricao: 'Necessidade adicionada: Tratamento de canal no dente 36',
            data: '2024-01-12T14:20:00',
            usuario: 'Dr. Silva'
          },
          {
            id: 3,
            tipo: 'avaliacao',
            descricao: 'Avaliação realizada',
            data: '2024-01-10T09:00:00',
            usuario: 'Dr. Silva'
          }
        ]
        setHistorico(mockHistorico)
        localStorage.setItem(`mockHistorico_${id}`, JSON.stringify(mockHistorico))
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const loadRadiografias = async (clienteData = null) => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar radiografias do localStorage filtradas por cliente_id
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      const clienteId = parseInt(id)
      const clienteInfo = clienteData || cliente
      
      // Filtrar radiografias do cliente
      let radiografiasCliente = []
      
      if (clienteInfo) {
        radiografiasCliente = savedDiagnosticos.filter(d => 
          d.cliente_id === clienteId || 
          (d.cliente_nome && d.cliente_nome === clienteInfo.nome)
        )
      } else {
        // Se não tiver cliente, buscar por ID apenas
        radiografiasCliente = savedDiagnosticos.filter(d => d.cliente_id === clienteId)
      }
      
      // Ordenar por data mais recente primeiro
      radiografiasCliente.sort((a, b) => {
        const dateA = new Date(a.data || a.created_at || 0)
        const dateB = new Date(b.data || b.created_at || 0)
        return dateB - dateA
      })
      
      setRadiografias(radiografiasCliente)
    } catch (error) {
      console.error('Erro ao carregar radiografias:', error)
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

  const handleAddNecessidade = async () => {
    if (!novaNecessidade.trim()) return

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Atualizar cliente no localStorage
      const savedClientes = JSON.parse(localStorage.getItem('mockClientesCompletos') || '[]')
      const clienteIndex = savedClientes.findIndex(c => c.id === parseInt(id))
      
      if (clienteIndex !== -1) {
        const updatedNecessidades = [...(savedClientes[clienteIndex].necessidades || []), novaNecessidade]
        savedClientes[clienteIndex].necessidades = updatedNecessidades
        localStorage.setItem('mockClientesCompletos', JSON.stringify(savedClientes))
        setCliente({ ...cliente, necessidades: updatedNecessidades })
      }
      
      // Adicionar ao histórico
      const savedHistorico = JSON.parse(localStorage.getItem(`mockHistorico_${id}`) || '[]')
      savedHistorico.unshift({
        id: Date.now(),
        tipo: 'necessidade',
        descricao: `Necessidade adicionada: ${novaNecessidade}`,
        data: new Date().toISOString(),
        usuario: 'Dr. Usuário'
      })
      localStorage.setItem(`mockHistorico_${id}`, JSON.stringify(savedHistorico))
      
      setNovaNecessidade('')
      setShowNecessidadesModal(false)
      loadHistorico()
    } catch (error) {
      console.error('Erro ao adicionar necessidade:', error)
    }
  }

  const handleUpdateStatus = async () => {
    if (!novoStatus) return

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Atualizar cliente no localStorage
      const savedClientes = JSON.parse(localStorage.getItem('mockClientesCompletos') || '[]')
      const clienteIndex = savedClientes.findIndex(c => c.id === parseInt(id))
      
      if (clienteIndex !== -1) {
        savedClientes[clienteIndex].status = novoStatus
        localStorage.setItem('mockClientesCompletos', JSON.stringify(savedClientes))
        setCliente({ ...cliente, status: novoStatus })
      }
      
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
        <div className="header-actions">
          <button
            className="btn-edit-header"
            onClick={() => navigate(`/app/clientes/${id}/editar`)}
          >
            <FontAwesomeIcon icon={faEdit} />
            Editar Cliente
          </button>
        </div>
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
                    <p>{cliente.cpf}</p>
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
                  <p>{cliente.telefone}</p>
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
                    <p>{cliente.endereco.rua}</p>
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
                      <p>{cliente.endereco.cep}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="ficha-section">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faStethoscope} />
                  Necessidades
                </h2>
                <button
                  className="btn-add"
                  onClick={() => setShowNecessidadesModal(true)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Adicionar
                </button>
              </div>
              {Array.isArray(cliente.necessidades) && cliente.necessidades.length > 0 ? (
                <ul className="necessidades-list">
                  {cliente.necessidades.map((necessidade, index) => (
                    <li key={index}>
                      <FontAwesomeIcon icon={faStethoscope} />
                      {necessidade}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-text">Nenhuma necessidade registrada</p>
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
                  onClick={() => setShowStatusModal(true)}
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
                <div className="radiografias-grid">
                  {radiografias.map((radiografia) => (
                    <div 
                      key={radiografia.id} 
                      className="radiografia-card"
                      onClick={() => navigate(`/app/diagnosticos/${radiografia.id}`)}
                    >
                      <div className="radiografia-card-image">
                        <img 
                          src={radiografia.imagem && radiografia.imagem.startsWith('data:image') 
                            ? radiografia.imagem 
                            : exameImage} 
                          alt={radiografia.paciente}
                          onError={(e) => {
                            e.target.src = exameImage
                          }}
                        />
                        <div className="radiografia-card-overlay">
                          <button className="btn-view-radiografia">
                            <FontAwesomeIcon icon={faEye} /> Ver Detalhes
                          </button>
                        </div>
                      </div>
                      <div className="radiografia-card-info">
                        <h3>{radiografia.paciente || 'Radiografia'}</h3>
                        <p className="radiografia-card-date">
                          {new Date(radiografia.data || radiografia.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {radiografia.tipoExame && (
                          <p className="radiografia-card-type">{radiografia.tipoExame}</p>
                        )}
                      </div>
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
                        {new Date(item.data).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Nenhum histórico registrado</p>
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
    </div>
  )
}

export default ClienteDetalhes

