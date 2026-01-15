import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserPlus, faSearch, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faEdit,
  faEye, faTrash, faFilter
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import './Clientes.css'

const Clientes = () => {
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState(null)

  useEffect(() => {
    if (selectedClinicData) {
      loadClientes()
    }
  }, [selectedClinicData])

  const loadClientes = async () => {
    try {
      // Obter masterClientId do contexto
      const masterClientId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!masterClientId) {
        console.error('masterClientId não encontrado')
        setLoading(false)
        return
      }

      // Fazer GET para listar pacientes
      const response = await api.get(`/pacientes?masterClientId=${masterClientId}`)
      const pacientes = response.data?.data || response.data || []
      
      // Normalizar dados dos pacientes para o formato esperado
      // A API retorna os dados diretamente no objeto, não aninhados
      const clientesNormalizados = pacientes.map(paciente => ({
        id: paciente.id,
        nome: paciente.nomePaciente || '',
        email: paciente.email || '',
        telefone: paciente.telefone || '',
        cpf: paciente.cpf || '',
        dataNascimento: paciente.dataNascimento || '',
        status: paciente.status || 'avaliacao-realizada',
        necessidades: paciente.necessidades || '',
        observacoes: paciente.observacoes || '',
        endereco: {
          rua: paciente.rua || '',
          numero: paciente.numero || '',
          complemento: paciente.complemento || '',
          bairro: paciente.bairro || '',
          cidade: paciente.cidade || '',
          estado: paciente.estado || '',
          cep: paciente.cep || ''
        },
        createdAt: paciente.createdAt || new Date().toISOString()
      }))
      
      setClientes(clientesNormalizados)
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      alert('Erro ao carregar lista de pacientes. Tente novamente.')
    } finally {
      setLoading(false)
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

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return

    try {
      await api.delete(`/pacientes/${clienteToDelete.id}`)
      // Recarregar lista após deletar
      await loadClientes()
      setShowDeleteModal(false)
      setClienteToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir paciente:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao excluir paciente. Tente novamente.'
      alert(errorMessage)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setClienteToDelete(null)
  }

  if (!selectedClinicData) {
    return (
      <div className="clientes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do consultório...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="clientes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando clientes...</p>
      </div>
    )
  }

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <div className="header-content">
          <h1>
            <FontAwesomeIcon icon={faUser} /> Clientes
          </h1>
          <button 
            className="btn-new-client"
            onClick={() => navigate('/app/clientes/novo')}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="clientes-filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="avaliacao-realizada">Avaliação Realizada</option>
            <option value="em-andamento">Em Andamento</option>
            <option value="aprovado">Aprovado</option>
            <option value="tratamento-concluido">Tratamento Concluído</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
      </div>

      <div className="clientes-grid">
        {filteredClientes.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faUser} size="3x" />
            {clientes.length === 0 ? (
              <>
                <h3>Nenhum cliente cadastrado</h3>
                <p>Comece cadastrando seu primeiro cliente para gerenciar seus pacientes.</p>
                <button 
                  className="btn-modern-primary"
                  onClick={() => navigate('/app/clientes/novo')}
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Cadastrar Primeiro Cliente
                </button>
              </>
            ) : (
              <>
                <p>Nenhum cliente encontrado com os filtros aplicados</p>
                <button 
                  className="btn-modern-secondary"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                >
                  Limpar Filtros
                </button>
              </>
            )}
          </div>
        ) : (
          filteredClientes.map(cliente => (
            <div key={cliente.id} className="cliente-card">
              <div className="cliente-header">
                <div className="cliente-avatar">
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
                <div className="cliente-info-header">
                  <h3>{cliente.nome}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(cliente.status) }}
                  >
                    {getStatusLabel(cliente.status)}
                  </span>
                </div>
              </div>
              
              <div className="cliente-details">
                <div className="detail-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>{cliente.email}</span>
                </div>
                <div className="detail-item">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{formatTelefone(cliente.telefone)}</span>
                </div>
                {cliente.dataNascimento && (
                  <div className="detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>
                      {new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {cliente.necessidades && (Array.isArray(cliente.necessidades) ? cliente.necessidades.length > 0 : cliente.necessidades.trim()) && (
                  <div className="detail-item necessidades">
                    <strong>Necessidades:</strong>
                    <span>
                      {Array.isArray(cliente.necessidades) 
                        ? cliente.necessidades.join(', ') 
                        : cliente.necessidades}
                    </span>
                  </div>
                )}
              </div>

              <div className="cliente-actions">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/app/clientes/${cliente.id}`)}
                >
                  <FontAwesomeIcon icon={faEye} />
                  Ver Ficha
                </button>
                <button
                  className="btn-edit"
                  onClick={() => navigate(`/app/clientes/${cliente.id}/editar`)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Editar
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteClick(cliente)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
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
            <h3>Excluir Paciente</h3>
            <p>
              Tem certeza que deseja excluir o paciente <strong>{clienteToDelete?.nome}</strong>?
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
    </div>
  )
}

export default Clientes

