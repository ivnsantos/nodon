import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, 
  faCreditCard, 
  faSync, 
  faSignOutAlt,
  faSpinner,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faCalendar,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons'
import './Admin.css'

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [expandedUsers, setExpandedUsers] = useState({})
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    codigo: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      setIsLoggedIn(true)
      loadDashboardData()
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      })
      
      const result = await response.json()
      
      if (result.data?.access_token || result.access_token) {
        const token = result.data?.access_token || result.access_token
        localStorage.setItem('admin_token', token)
        setIsLoggedIn(true)
        loadDashboardData()
      } else {
        alert('Erro ao fazer login. Verifique suas credenciais.')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      alert('Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result.data) // Pegar os dados de result.data
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsLoggedIn(false)
    setData(null)
    setExpandedUsers({})
  }

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    // Se for formato YYYY-MM-DD (sem hora), tratar como data local
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Para datas completas com hora, usar timezone local
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="admin-login-container">
          <div className="admin-login-header">
            <h1>Painel Administrativo</h1>
            <p>Acesso restrito a administradores</p>
          </div>
          
          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label>Email Administrativo</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="admin@seudominio.com.br"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Sua senha de administrador"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Código de Acesso</label>
              <input
                type="text"
                value={loginForm.codigo}
                onChange={(e) => setLoginForm({ ...loginForm, codigo: e.target.value })}
                placeholder="Código de verificação"
                required
              />
            </div>
            
            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Autenticando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUsers} />
                  Entrar no Painel
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Painel Administrativo</h1>
        <button onClick={handleLogout} className="logout-btn">
          <FontAwesomeIcon icon={faSignOutAlt} />
          Sair
        </button>
      </div>

      {data?.summary && (
        <div className="admin-summary">
          <div className="summary-card">
            <FontAwesomeIcon icon={faUsers} />
            <div>
              <h3>{data.summary.totalUsers}</h3>
              <p>Usuários</p>
            </div>
          </div>
          <div className="summary-card">
            <FontAwesomeIcon icon={faCreditCard} />
            <div>
              <h3>{data.summary.totalAssinaturas}</h3>
              <p>Assinaturas</p>
            </div>
          </div>
          <div className="summary-card">
            <FontAwesomeIcon icon={faCalendar} />
            <div>
              <h3>{data.summary.totalRecorrencias}</h3>
              <p>Recorrências</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">
        <div className="users-section">
          <h2>
            <FontAwesomeIcon icon={faUsers} />
            Usuários
          </h2>
          
          {data?.users?.length === 0 ? (
            <p className="empty-message">Nenhum usuário encontrado.</p>
          ) : (
            <div className="users-list">
              {data?.users?.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-header" onClick={() => toggleUserExpansion(user.id)}>
                    <div className="user-info">
                      <h3>{user.nome}</h3>
                      <p>
                        <FontAwesomeIcon icon={faEnvelope} />
                        {user.email}
                      </p>
                      {user.cpf && (
                        <p>
                          <strong>CPF:</strong> {user.cpf}
                        </p>
                      )}
                      {user.telefone && (
                        <p>
                          <strong>Telefone:</strong> {user.telefone}
                        </p>
                      )}
                      {user.cro && (
                        <p>
                          <strong>CRO:</strong> {user.cro}
                        </p>
                      )}
                      {user.isVerified !== undefined && (
                        <p>
                          <strong>Verificado:</strong> {user.isVerified ? '✅ Sim' : '❌ Não'}
                        </p>
                      )}
                      {user.address && (
                        <p>
                          <strong>Endereço:</strong> {user.address}, {user.addressNumber} {user.complement && `- ${user.complement}`}
                        </p>
                      )}
                      {user.city && (
                        <p>
                          <strong>Cidade:</strong> {user.city}/{user.state}
                        </p>
                      )}
                    </div>
                    <FontAwesomeIcon 
                      icon={expandedUsers[user.id] ? faChevronUp : faChevronDown}
                      className="expand-icon"
                    />
                  </div>
                  
                  {expandedUsers[user.id] && (
                    <div className="user-details">
                      <div className="detail-item">
                        <strong>ID:</strong> {user.id}
                      </div>
                      <div className="detail-item">
                        <strong>CPF:</strong> {user.cpf || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Telefone:</strong> {user.telefone || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>CRO:</strong> {user.cro || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Verificado:</strong> {user.isVerified ? '✅ Sim' : '❌ Não'}
                      </div>
                      <div className="detail-item">
                        <strong>Endereço:</strong> {user.address || 'N/A'}, {user.addressNumber || 'N/A'} {user.complement && `- ${user.complement}`}
                      </div>
                      <div className="detail-item">
                        <strong>Cidade:</strong> {user.city || 'N/A'}/{user.state || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>CEP:</strong> {user.postalCode || 'N/A'}
                      </div>
                      <div className="detail-item">
                        <strong>Criado em:</strong> {formatDate(user.createdAt)}
                      </div>
                      <div className="detail-item">
                        <strong>Atualizado em:</strong> {formatDate(user.updatedAt)}
                      </div>
                      
                      {/* Clientes Master do usuário */}
                      {user.clientesMaster && user.clientesMaster.length > 0 && (
                        <div className="user-clients">
                          <h4>
                            <FontAwesomeIcon icon={faUsers} />
                            Clíicas
                          </h4>
                          {user.clientesMaster.map(cliente => (
                            <div key={cliente.id} className="client-card">
                              <p>
                                <strong>Empresa:</strong> {cliente.nomeEmpresa}
                              </p>
                              <p>
                                <strong>Criada em:</strong> {formatDate(cliente.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Assinaturas do usuário */}
                      <div className="user-subscriptions">
                        <h4>
                          <FontAwesomeIcon icon={faCreditCard} />
                          Assinaturas
                        </h4>
                        {user.assinaturas?.length === 0 ? (
                          <p className="empty-message small">Nenhuma assinatura encontrada.</p>
                        ) : (
                          user.assinaturas?.map(assinatura => (
                            <div key={assinatura.id} className="subscription-card">
                              <div className="subscription-header">
                                <h5>{assinatura.plano?.nome || 'Plano'}</h5>
                                <span className={`status ${assinatura.status.toLowerCase()}`}>
                                  {assinatura.status}
                                </span>
                              </div>
                              <div className="subscription-details">
                                <p>
                                  <FontAwesomeIcon icon={faDollarSign} />
                                  {formatCurrency(assinatura.value)}
                                </p>
                                <p>
                                  <FontAwesomeIcon icon={faEnvelope} />
                                  {assinatura.clienteMaster?.nomeEmpresa || 'Clínica'}
                                </p>
                                {assinatura.nextDueDate && (
                                  <p>
                                    <strong>Próximo vencimento:</strong> {formatDate(assinatura.nextDueDate)}
                                  </p>
                                )}
                                {assinatura.cupom && (
                                  <p>
                                    <strong>Cupom:</strong> {assinatura.cupom.name} (-{formatCurrency(assinatura.cupom.discountValue)})
                                  </p>
                                )}
                                <p>Criado em: {formatDate(assinatura.createdAt)}</p>
                              </div>
                              
                              {/* Recorrências da assinatura */}
                              <div className="subscription-recurrences">
                                <h6>
                                  <FontAwesomeIcon icon={faCalendar} />
                                  Recorrências
                                </h6>
                                {user.recorrencias?.filter(rec => rec.assinaturaId === assinatura.id).length === 0 ? (
                                  <p className="empty-message small">Nenhuma recorrência encontrada.</p>
                                ) : (
                                  user.recorrencias?.filter(rec => rec.assinaturaId === assinatura.id).map(recorrencia => (
                                    <div key={recorrencia.id} className="recurrence-card">
                                      <p>
                                        <strong>Próximo vencimento:</strong> {formatDate(recorrencia.nextDueDate)}
                                      </p>
                                      <p>
                                        <strong>Valor:</strong> {formatCurrency(recorrencia.valor)}
                                      </p>
                                      <p>
                                        <strong>Plano:</strong> {recorrencia.assinatura?.plano?.nome || 'N/A'}
                                      </p>
                                      <p>
                                        <strong>Clínica:</strong> {recorrencia.assinatura?.clienteMaster?.nomeEmpresa || 'N/A'}
                                      </p>
                                      {recorrencia.assinatura?.cupom && (
                                        <p>
                                          <strong>Cupom:</strong> {recorrencia.assinatura.cupom.name} (-{formatCurrency(recorrencia.assinatura.cupom.discountValue)})
                                        </p>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
