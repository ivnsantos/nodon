import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserPlus, faSearch, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faEdit,
  faEye, faTrash, faFilter
} from '@fortawesome/free-solid-svg-icons'
// Removido import de axios - usando dados mockados
import './Clientes.css'

const Clientes = () => {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar clientes do localStorage ou usar dados mockados
      const savedClientes = JSON.parse(localStorage.getItem('mockClientesCompletos') || '[]')
      if (savedClientes.length > 0) {
        setClientes(savedClientes)
      } else {
        // Dados mockados iniciais
        const mockData = [
          {
            id: 1,
            nome: 'João Silva',
            email: 'joao@email.com',
            telefone: '(11) 99999-9999',
            dataNascimento: '1985-05-15',
            status: 'em-andamento',
            necessidades: 'Tratamento de canal e limpeza',
            createdAt: '2024-01-10'
          },
          {
            id: 2,
            nome: 'Maria Santos',
            email: 'maria@email.com',
            telefone: '(11) 88888-8888',
            dataNascimento: '1990-08-20',
            status: 'avaliacao-realizada',
            necessidades: 'Ortodontia e clareamento',
            createdAt: '2024-01-15'
          }
        ]
        setClientes(mockData)
        localStorage.setItem('mockClientesCompletos', JSON.stringify(mockData))
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
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

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Remover do localStorage
        const savedClientes = JSON.parse(localStorage.getItem('mockClientesCompletos') || '[]')
        const updatedClientes = savedClientes.filter(c => c.id !== id)
        localStorage.setItem('mockClientesCompletos', JSON.stringify(updatedClientes))
        
        loadClientes()
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
        alert('Erro ao excluir cliente')
      }
    }
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
            <p>Nenhum cliente encontrado</p>
            <button 
              className="btn-modern-primary"
              onClick={() => navigate('/app/clientes/novo')}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              Cadastrar Primeiro Cliente
            </button>
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
                  <span>{cliente.telefone}</span>
                </div>
                {cliente.dataNascimento && (
                  <div className="detail-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>
                      {new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {cliente.necessidades && (
                  <div className="detail-item necessidades">
                    <strong>Necessidades:</strong>
                    <span>{cliente.necessidades}</span>
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
                  onClick={() => handleDelete(cliente.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Clientes

