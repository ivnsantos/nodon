import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileInvoiceDollar, faPlus, faSearch, faFilter,
  faEye, faEdit, faTrash, faChevronDown, faCheck,
  faTimes, faCalendarAlt, faUser, faDollarSign
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Orcamentos.css'

const Orcamentos = () => {
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orcamentoToDelete, setOrcamentoToDelete] = useState(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef(null)
  const [orcamentoStatusDropdowns, setOrcamentoStatusDropdowns] = useState({})
  const [itemStatusDropdowns, setItemStatusDropdowns] = useState({})
  const [showStatusModal, setShowStatusModal] = useState(null) // null ou orcamentoId
  const [showItemStatusModal, setShowItemStatusModal] = useState(null) // null ou {orcamentoId, itemIndex}
  const orcamentoStatusRefs = useRef({})
  const itemStatusRefs = useRef({})

  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const statusOptions = [
    { value: 'all', label: 'Todos os Status', color: '#9ca3af' },
    { value: 'RASCUNHO', label: 'Rascunho', color: '#6b7280' },
    { value: 'ENVIADO', label: 'Enviado', color: '#0ea5e9' },
    { value: 'ACEITO', label: 'Aceito', color: '#10b981' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#f59e0b' },
    { value: 'FINALIZADO', label: 'Finalizado', color: '#8b5cf6' },
    { value: 'RECUSADO', label: 'Recusado', color: '#ef4444' },
    { value: 'CANCELADO', label: 'Cancelado', color: '#6b7280' }
  ]

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Não fechar se algum modal estiver aberto
      if (showStatusModal !== null || showItemStatusModal !== null) return
      
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false)
      }
      
      // Fechar dropdowns de status de orçamento
      Object.keys(orcamentoStatusDropdowns).forEach(orcamentoId => {
        const ref = orcamentoStatusRefs.current[orcamentoId]
        if (ref && !ref.contains(event.target)) {
          setOrcamentoStatusDropdowns(prev => {
            const newState = { ...prev }
            delete newState[orcamentoId]
            return newState
          })
        }
      })
      
      // Fechar dropdowns de status de itens
      Object.keys(itemStatusDropdowns).forEach(key => {
        const ref = itemStatusRefs.current[key]
        if (ref && !ref.contains(event.target)) {
          setItemStatusDropdowns(prev => {
            const newState = { ...prev }
            delete newState[key]
            return newState
          })
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [orcamentoStatusDropdowns, itemStatusDropdowns, showStatusModal, showItemStatusModal])

  // Carregar orçamentos
  const fetchOrcamentos = async () => {
    try {
      setLoading(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setOrcamentos([])
        setLoading(false)
        return
      }

      const params = new URLSearchParams({ clienteMasterId })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await api.get(`/orcamentos?${params.toString()}`)
      const data = response.data?.data || response.data || []
      
      setOrcamentos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      showError('Erro ao carregar orçamentos. Tente novamente.')
      setOrcamentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClinicData) {
      fetchOrcamentos()
    }
  }, [selectedClinicData, statusFilter])

  // Filtrar orçamentos por busca
  const filteredOrcamentos = orcamentos.filter(orcamento => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    const pacienteNome = orcamento.paciente?.nome?.toLowerCase() || ''
    const observacoes = orcamento.observacoes?.toLowerCase() || ''
    
    return pacienteNome.includes(searchLower) || observacoes.includes(searchLower)
  })

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Obter cor do status
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.color || '#9ca3af'
  }

  // Obter label do status
  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.label || status
  }

  // Funções para status dos itens
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

  // Deletar orçamento
  const handleDeleteClick = (orcamento) => {
    setOrcamentoToDelete(orcamento)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!orcamentoToDelete) return

    try {
      await api.delete(`/orcamentos/${orcamentoToDelete.id}`)
      showSuccess('Orçamento excluído com sucesso!')
      setShowDeleteModal(false)
      setOrcamentoToDelete(null)
      fetchOrcamentos()
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao excluir orçamento. Tente novamente.')
      setShowDeleteModal(false)
      setOrcamentoToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setOrcamentoToDelete(null)
  }

  const handleUpdateOrcamentoStatus = async (orcamentoId, newStatus) => {
    // Fechar dropdown e modal imediatamente
    setOrcamentoStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[orcamentoId]
      return newState
    })
    setShowStatusModal(null)

    try {
      const orcamento = orcamentos.find(o => o.id === orcamentoId)
      if (!orcamento || orcamento.status === newStatus) return

      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      const payload = {
        status: newStatus
      }

      await api.patch(`/orcamentos/${orcamentoId}`, payload, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamentos(prev => prev.map(o => 
        o.id === orcamentoId 
          ? { ...o, status: newStatus }
          : o
      ))

      showSuccess('Status do orçamento atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status do orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do orçamento. Tente novamente.')
    }
  }

  const handleUpdateItemStatus = async (orcamentoId, itemIndex, newStatus) => {
    const key = `${orcamentoId}-${itemIndex}`
    // Fechar dropdown e modal imediatamente
    setItemStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
    setShowItemStatusModal(null)

    try {
      const orcamento = orcamentos.find(o => o.id === orcamentoId)
      if (!orcamento || !orcamento.itens) return

      const item = orcamento.itens[itemIndex]
      if (!item || item.status === newStatus) return

      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      // Criar novo array de itens com o status atualizado
      const updatedItens = orcamento.itens.map((it, idx) => 
        idx === itemIndex ? { ...it, status: newStatus } : it
      )

      const payload = {
        itens: updatedItens
      }

      await api.patch(`/orcamentos/${orcamentoId}`, payload, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamentos(prev => prev.map(o => 
        o.id === orcamentoId 
          ? { ...o, itens: updatedItens }
          : o
      ))

      showSuccess('Status do item atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do item. Tente novamente.')
    }
  }

  const itemStatusOptions = [
    { value: 'EM_ANALISE', label: 'Em Análise' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'RECUSADO', label: 'Recusado' },
    { value: 'PERDIDO', label: 'Perdido' }
  ]

  if (loading) {
    return (
      <div className="orcamentos-loading">
        <div className="loading-spinner"></div>
        <p>Carregando orçamentos...</p>
      </div>
    )
  }

  return (
    <div className="orcamentos-modern">
      <AlertModal {...alertConfig} onClose={hideAlert} />

      {/* Header */}
      <div className="orcamentos-header">
        <div>
          <h2>
            <FontAwesomeIcon icon={faFileInvoiceDollar} /> Orçamentos
          </h2>
          <p>Gerencie orçamentos de tratamentos para seus pacientes</p>
        </div>
        <button 
          className="btn-orcamentos-primary"
          onClick={() => navigate('/app/orcamentos/novo')}
        >
          <FontAwesomeIcon icon={faPlus} /> Novo Orçamento
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="orcamentos-filters">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por paciente ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className="filter-dropdown-wrapper" ref={statusDropdownRef}>
          <button
            className="filter-dropdown-btn"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>{statusOptions.find(opt => opt.value === statusFilter)?.label || 'Todos os Status'}</span>
            <FontAwesomeIcon icon={faChevronDown} className={`chevron ${statusDropdownOpen ? 'open' : ''}`} />
          </button>
          {statusDropdownOpen && (
            <div className="filter-dropdown-menu">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={`filter-dropdown-item ${statusFilter === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(option.value)
                    setStatusDropdownOpen(false)
                  }}
                >
                  <span className="status-dot" style={{ backgroundColor: option.color }}></span>
                  {option.label}
                  {statusFilter === option.value && (
                    <FontAwesomeIcon icon={faCheck} className="check-icon" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Orçamentos */}
      {filteredOrcamentos.length === 0 ? (
        <div className="empty-state-orcamentos">
          <FontAwesomeIcon icon={faFileInvoiceDollar} size="4x" />
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? 'Nenhum orçamento encontrado' 
              : 'Nenhum orçamento cadastrado'}
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro orçamento'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button 
              className="btn-empty-state"
              onClick={() => navigate('/app/orcamentos/novo')}
            >
              <FontAwesomeIcon icon={faPlus} /> Criar Primeiro Orçamento
            </button>
          )}
        </div>
      ) : (
        <div className="orcamentos-grid">
          {filteredOrcamentos.map((orcamento) => (
            <div key={orcamento.id} className="orcamento-card">
              <div className="orcamento-card-header">
                <div 
                  className="status-dropdown-container" 
                  ref={el => orcamentoStatusRefs.current[orcamento.id] = el}
                >
                  <span 
                    className="orcamento-status-badge status-badge-clickable"
                    style={{ backgroundColor: getStatusColor(orcamento.status) }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const isMobileDevice = window.innerWidth <= 768
                      if (isMobileDevice) {
                        setShowStatusModal(orcamento.id)
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
                        setShowStatusModal(null)
                      }
                    }}
                    title="Clique para alterar status"
                  >
                    {getStatusLabel(orcamento.status)}
                    <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${orcamentoStatusDropdowns[orcamento.id] ? 'open' : ''}`} />
                  </span>
                  {!isMobile && orcamentoStatusDropdowns[orcamento.id] && (
                    <div className="status-dropdown-menu">
                      {statusOptions.filter(opt => opt.value !== 'all').map((option) => (
                        <div
                          key={option.value}
                          className={`status-dropdown-item ${orcamento.status === option.value ? 'active' : ''}`}
                          style={{ backgroundColor: getStatusColor(option.value) }}
                          onClick={() => handleUpdateOrcamentoStatus(orcamento.id, option.value)}
                        >
                          <span>{option.label}</span>
                          {orcamento.status === option.value && (
                            <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="orcamento-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => navigate(`/app/orcamentos/${orcamento.id}`)}
                    title="Ver detalhes"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => navigate(`/app/orcamentos/${orcamento.id}/editar`)}
                    title="Editar"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteClick(orcamento)}
                    title="Excluir"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className="orcamento-card-body">
                <div className="orcamento-paciente">
                  <FontAwesomeIcon icon={faUser} />
                  <span>{orcamento.paciente?.nome || 'Paciente não informado'}</span>
                </div>

                <div className="orcamento-valor">
                  <FontAwesomeIcon icon={faDollarSign} />
                  <span className="valor-total">{formatCurrency(orcamento.valorTotal)}</span>
                </div>

                {orcamento.observacoes && (
                  <div className="orcamento-observacoes">
                    <p>{orcamento.observacoes}</p>
                  </div>
                )}

                {/* Itens do Orçamento */}
                {orcamento.itens && orcamento.itens.length > 0 && (
                  <div className="orcamento-itens-preview">
                    {orcamento.itens.map((item, idx) => (
                      <div key={idx} className="orcamento-item-preview">
                        <div className="item-preview-info">
                          <div className="item-preview-descricao">
                            {item.descricao || item.nome}
                          </div>
                          <div className="item-preview-valor">
                            {formatCurrency(item.preco * (item.quantidade || 1))}
                          </div>
                        </div>
                        <div 
                          className="status-dropdown-container" 
                          ref={el => itemStatusRefs.current[`${orcamento.id}-${idx}`] = el}
                        >
                          <span 
                            className="item-preview-status status-badge-clickable"
                            style={{ backgroundColor: getItemStatusColor(item.status) }}
                            onClick={(e) => {
                              e.stopPropagation()
                              const isMobileDevice = window.innerWidth <= 768
                              if (isMobileDevice) {
                                setShowItemStatusModal({ orcamentoId: orcamento.id, itemIndex: idx })
                                setItemStatusDropdowns(prev => {
                                  const newState = { ...prev }
                                  delete newState[`${orcamento.id}-${idx}`]
                                  return newState
                                })
                              } else {
                                setItemStatusDropdowns(prev => ({
                                  ...prev,
                                  [`${orcamento.id}-${idx}`]: !prev[`${orcamento.id}-${idx}`]
                                }))
                                setShowItemStatusModal(null)
                              }
                            }}
                            title="Clique para alterar status"
                          >
                            {getItemStatusLabel(item.status)}
                            <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${itemStatusDropdowns[`${orcamento.id}-${idx}`] ? 'open' : ''}`} />
                          </span>
                          {!isMobile && itemStatusDropdowns[`${orcamento.id}-${idx}`] && (
                            <div className="status-dropdown-menu">
                              {itemStatusOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`status-dropdown-item ${item.status === option.value ? 'active' : ''}`}
                                  style={{ backgroundColor: getItemStatusColor(option.value) }}
                                  onClick={() => handleUpdateItemStatus(orcamento.id, idx, option.value)}
                                >
                                  <span>{option.label}</span>
                                  {item.status === option.value && (
                                    <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="orcamento-info">
                  <div className="info-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>Criado em: {formatDate(orcamento.createdAt)}</span>
                  </div>
                  {orcamento.itens && orcamento.itens.length > 0 && (
                    <div className="info-item">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} />
                      <span>{orcamento.itens.length} {orcamento.itens.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Orçamento</h3>
            <p>
              Tem certeza que deseja excluir o orçamento de <strong>{orcamentoToDelete?.paciente?.nome}</strong>?
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

      {/* Modal de Seleção de Status do Orçamento (Mobile) */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(null)}>
          <div className="modal-status-select" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status do Orçamento</h3>
            <div className="modal-status-list">
              {statusOptions.filter(opt => opt.value !== 'all').map((option) => {
                const orcamento = orcamentos.find(o => o.id === showStatusModal)
                return (
                  <button
                    key={option.value}
                    className={`modal-status-item ${orcamento?.status === option.value ? 'active' : ''}`}
                    style={{ backgroundColor: getStatusColor(option.value) }}
                    onClick={() => handleUpdateOrcamentoStatus(showStatusModal, option.value)}
                  >
                    <span>{option.label}</span>
                    {orcamento?.status === option.value && (
                      <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowStatusModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Status do Item (Mobile) */}
      {showItemStatusModal && (
        <div className="modal-overlay" onClick={() => setShowItemStatusModal(null)}>
          <div className="modal-status-select" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status do Item</h3>
            <div className="modal-status-list">
              {itemStatusOptions.map((option) => {
                const orcamento = orcamentos.find(o => o.id === showItemStatusModal.orcamentoId)
                const item = orcamento?.itens?.[showItemStatusModal.itemIndex]
                return (
                  <button
                    key={option.value}
                    className={`modal-status-item ${item?.status === option.value ? 'active' : ''}`}
                    style={{ backgroundColor: getItemStatusColor(option.value) }}
                    onClick={() => handleUpdateItemStatus(showItemStatusModal.orcamentoId, showItemStatusModal.itemIndex, option.value)}
                  >
                    <span>{option.label}</span>
                    {item?.status === option.value && (
                      <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowItemStatusModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orcamentos

