import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faEdit, faTrash, faUser, faCalendarAlt,
  faFileInvoiceDollar, faDollarSign, faCheckCircle, faTimesCircle,
  faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './OrcamentoDetalhes.css'

const OrcamentoDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [loading, setLoading] = useState(true)
  const [orcamento, setOrcamento] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orcamentoStatusDropdownOpen, setOrcamentoStatusDropdownOpen] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showItemStatusModal, setShowItemStatusModal] = useState(null) // null ou index do item
  const [itemStatusDropdowns, setItemStatusDropdowns] = useState({})
  
  const orcamentoStatusRef = useRef(null)
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

  useEffect(() => {
    if (id) {
      loadOrcamento()
    }
  }, [id])

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Não fechar se algum modal estiver aberto
      if (showStatusModal || showItemStatusModal !== null) return
      
      if (orcamentoStatusRef.current && !orcamentoStatusRef.current.contains(event.target)) {
        setOrcamentoStatusDropdownOpen(false)
      }
      
      Object.keys(itemStatusRefs.current).forEach((key) => {
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
  }, [showStatusModal, showItemStatusModal])

  const loadOrcamento = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/orcamentos/${id}`)
      const data = response.data?.data || response.data
      setOrcamento(data)
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error)
      showError('Erro ao carregar dados do orçamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/orcamentos/${id}`)
      showSuccess('Orçamento excluído com sucesso!')
      setTimeout(() => {
        navigate('/app/orcamentos')
      }, 1500)
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao excluir orçamento. Tente novamente.')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'RASCUNHO': '#6b7280',
      'ENVIADO': '#0ea5e9',
      'EM_ANDAMENTO': '#f59e0b',
      'ACEITO': '#10b981',
      'RECUSADO': '#ef4444',
      'CANCELADO': '#6b7280',
      'FINALIZADO': '#8b5cf6'
    }
    return colors[status] || '#9ca3af'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'RASCUNHO': 'Rascunho',
      'ENVIADO': 'Enviado',
      'EM_ANDAMENTO': 'Em Andamento',
      'ACEITO': 'Aceito',
      'RECUSADO': 'Recusado',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado'
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

  const calcularValorTotal = () => {
    if (!orcamento?.itens) return 0
    return orcamento.itens
      .filter(item => item.status === 'EM_ANALISE' || item.status === 'PAGO')
      .reduce((total, item) => total + (item.preco * (item.quantidade || 1)), 0)
  }

  const handleUpdateOrcamentoStatus = async (newStatus) => {
    setOrcamentoStatusDropdownOpen(false)
    setShowStatusModal(false)
    
    if (!orcamento || orcamento.status === newStatus) return

    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      const payload = {
        status: newStatus
      }

      await api.patch(`/orcamentos/${id}`, payload, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamento(prev => ({
        ...prev,
        status: newStatus
      }))

      showSuccess('Status do orçamento atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status do orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do orçamento. Tente novamente.')
    }
  }

  const handleUpdateItemStatus = async (itemIndex, newStatus) => {
    setItemStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[itemIndex]
      return newState
    })
    setShowItemStatusModal(null)
    
    if (!orcamento || !orcamento.itens) return

    const item = orcamento.itens[itemIndex]
    if (!item || item.status === newStatus) return

    try {
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

      await api.patch(`/orcamentos/${id}`, payload, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamento(prev => ({
        ...prev,
        itens: updatedItens
      }))

      showSuccess('Status do item atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do item. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="orcamento-detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando orçamento...</p>
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="orcamento-detalhes-error">
        <p>Orçamento não encontrado</p>
        <button onClick={() => navigate('/app/orcamentos')}>
          Voltar para Orçamentos
        </button>
      </div>
    )
  }

  return (
    <div className="orcamento-detalhes-modern">
      <AlertModal {...alertConfig} onClose={hideAlert} />

      <div className="orcamento-detalhes-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/app/orcamentos')}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </button>
        <div className="header-actions">
          <button
            className="btn-edit"
            onClick={() => navigate(`/app/orcamentos/${id}/editar`)}
          >
            <FontAwesomeIcon icon={faEdit} /> Editar
          </button>
          <button
            className="btn-delete"
            onClick={() => setShowDeleteModal(true)}
          >
            <FontAwesomeIcon icon={faTrash} /> Excluir
          </button>
        </div>
      </div>

      <div className="orcamento-detalhes-content">
        {/* Informações Principais */}
        <div className="info-card">
          <div className="info-header">
            <h2>
              <FontAwesomeIcon icon={faFileInvoiceDollar} />
              Orçamento #{orcamento.id?.substring(0, 8)}
            </h2>
            <div 
              className="status-dropdown-container" 
              ref={orcamentoStatusRef}
            >
              <span 
                className="status-badge-large status-badge-clickable"
                style={{ backgroundColor: getStatusColor(orcamento.status) }}
                onClick={(e) => {
                  e.stopPropagation()
                  const isMobileDevice = window.innerWidth <= 768
                  // Sempre abrir modal no mobile, dropdown no desktop
                  if (isMobileDevice) {
                    setShowStatusModal(true)
                    setOrcamentoStatusDropdownOpen(false)
                  } else {
                    // No desktop, manter dropdown
                    setOrcamentoStatusDropdownOpen(!orcamentoStatusDropdownOpen)
                    setShowStatusModal(false)
                  }
                }}
                title="Clique para alterar status"
              >
                {getStatusLabel(orcamento.status)}
                <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${orcamentoStatusDropdownOpen ? 'open' : ''}`} />
              </span>
              {!isMobile && orcamentoStatusDropdownOpen && (
                <div className="status-dropdown-menu">
                  {['RASCUNHO', 'ENVIADO', 'ACEITO', 'EM_ANDAMENTO', 'FINALIZADO', 'RECUSADO', 'CANCELADO'].map((statusOption) => (
                    <div
                      key={statusOption}
                      className={`status-dropdown-item ${orcamento.status === statusOption ? 'active' : ''}`}
                      style={{ backgroundColor: getStatusColor(statusOption) }}
                      onClick={() => handleUpdateOrcamentoStatus(statusOption)}
                    >
                      <span>{getStatusLabel(statusOption)}</span>
                      {orcamento.status === statusOption && (
                        <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <FontAwesomeIcon icon={faUser} />
              <div>
                <label>Paciente</label>
                <span>{orcamento.paciente?.nome || 'Não informado'}</span>
              </div>
            </div>
            <div className="info-item">
              <FontAwesomeIcon icon={faCalendarAlt} />
              <div>
                <label>Criado em</label>
                <span>{formatDate(orcamento.createdAt)}</span>
              </div>
            </div>
            {orcamento.updatedAt && orcamento.updatedAt !== orcamento.createdAt && (
              <div className="info-item">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <div>
                  <label>Atualizado em</label>
                  <span>{formatDate(orcamento.updatedAt)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Itens do Orçamento */}
        <div className="itens-card">
          <h3>Itens do Orçamento</h3>
          {orcamento.itens && orcamento.itens.length > 0 ? (
            <div className="itens-list">
              {orcamento.itens.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-details">
                    <div className="item-title-row">
                      <div className="item-nome">{item.nome}</div>
                      <div 
                        className="status-dropdown-container" 
                        ref={el => itemStatusRefs.current[index] = el}
                      >
                        <span 
                          className="item-status-badge status-badge-clickable"
                          style={{ backgroundColor: getItemStatusColor(item.status) }}
                          onClick={(e) => {
                            e.stopPropagation()
                            const isMobileDevice = window.innerWidth <= 768
                            if (isMobileDevice) {
                              setShowItemStatusModal(index)
                              setItemStatusDropdowns(prev => {
                                const newState = { ...prev }
                                delete newState[index]
                                return newState
                              })
                            } else {
                              setItemStatusDropdowns(prev => ({
                                ...prev,
                                [index]: !prev[index]
                              }))
                              setShowItemStatusModal(null)
                            }
                          }}
                          title="Clique para alterar status"
                        >
                          {getItemStatusLabel(item.status)}
                          <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${itemStatusDropdowns[index] ? 'open' : ''}`} />
                        </span>
                        {!isMobile && itemStatusDropdowns[index] && (
                          <div className="status-dropdown-menu">
                            {['EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO'].map((statusOption) => (
                              <div
                                key={statusOption}
                                className={`status-dropdown-item ${item.status === statusOption ? 'active' : ''}`}
                                style={{ backgroundColor: getItemStatusColor(statusOption) }}
                                onClick={() => handleUpdateItemStatus(index, statusOption)}
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
                    </div>
                    {item.descricao && (
                      <div className="item-descricao">{item.descricao}</div>
                    )}
                    {item.tratamentoId && (
                      <div className="item-tratamento">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Vinculado a tratamento
                      </div>
                    )}
                  </div>
                  <div className="item-valor">
                    <div className="item-preco">
                      {formatCurrency(item.preco)} × {item.quantidade || 1}
                    </div>
                    <div className={`item-total ${item.status === 'RECUSADO' || item.status === 'PERDIDO' ? 'item-excluded' : ''}`}>
                      {formatCurrency(item.preco * (item.quantidade || 1))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items">Nenhum item cadastrado</p>
          )}

          {/* Valor Total */}
          <div className="valor-total-section">
            <div className="valor-total-label">Valor Total:</div>
            <div className="valor-total-value">{formatCurrency(calcularValorTotal())}</div>
          </div>
        </div>

        {/* Observações */}
        {orcamento.observacoes && (
          <div className="observacoes-card">
            <h3>Observações</h3>
            <p>{orcamento.observacoes}</p>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Orçamento</h3>
            <p>
              Tem certeza que deseja excluir este orçamento?
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={handleDelete}
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
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-status-select" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status do Orçamento</h3>
            <div className="modal-status-list">
              {['RASCUNHO', 'ENVIADO', 'ACEITO', 'EM_ANDAMENTO', 'FINALIZADO', 'RECUSADO', 'CANCELADO'].map((statusOption) => (
                <button
                  key={statusOption}
                  className={`modal-status-item ${orcamento.status === statusOption ? 'active' : ''}`}
                  style={{ backgroundColor: getStatusColor(statusOption) }}
                  onClick={() => handleUpdateOrcamentoStatus(statusOption)}
                >
                  <span>{getStatusLabel(statusOption)}</span>
                  {orcamento.status === statusOption && (
                    <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                  )}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowStatusModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Status do Item (Mobile) */}
      {showItemStatusModal !== null && orcamento?.itens && (
        <div className="modal-overlay" onClick={() => setShowItemStatusModal(null)}>
          <div className="modal-status-select" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status do Item</h3>
            <div className="modal-status-list">
              {['EM_ANALISE', 'PAGO', 'RECUSADO', 'PERDIDO'].map((statusOption) => (
                <button
                  key={statusOption}
                  className={`modal-status-item ${orcamento.itens[showItemStatusModal]?.status === statusOption ? 'active' : ''}`}
                  style={{ backgroundColor: getItemStatusColor(statusOption) }}
                  onClick={() => handleUpdateItemStatus(showItemStatusModal, statusOption)}
                >
                  <span>{getItemStatusLabel(statusOption)}</span>
                  {orcamento.itens[showItemStatusModal]?.status === statusOption && (
                    <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                  )}
                </button>
              ))}
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

export default OrcamentoDetalhes

