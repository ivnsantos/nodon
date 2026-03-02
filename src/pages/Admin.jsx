import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, 
  faCreditCard, 
  faSync, 
  faSignOutAlt,
  faEye,
  faSpinner,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons'
import './Admin.css'

const Admin = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  
  // Estado para login
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    codigo: ''
  })
  
  // Estado para dados
  const [users, setUsers] = useState([])
  const [assinaturas, setAssinaturas] = useState([])
  const [recorrencias, setRecorrencias] = useState([])
  const [dataLoading, setDataLoading] = useState({
    users: false,
    assinaturas: false,
    recorrencias: false
  })

  // Token de admin salvo no localStorage
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'))

  useEffect(() => {
    if (adminToken) {
      setIsAuthenticated(true)
      loadAllData()
    }
  }, [adminToken])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/admin/login', loginForm)
      
      if (response.data.access_token) {
        const token = response.data.access_token
        localStorage.setItem('admin_token', token)
        // Forçar reload da página para atualizar o estado
        window.location.reload()
      }
    } catch (error) {
      console.error('Erro no login admin:', error)
      alert('Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setAdminToken(null)
    setIsAuthenticated(false)
    setUsers([])
    setAssinaturas([])
    setRecorrencias([])
  }

  const loadAllData = async () => {
    if (!adminToken) return
    
    await Promise.all([
      loadUsers(),
      loadAssinaturas(),
      loadRecorrencias()
    ])
  }

  const loadUsers = async () => {
    if (!adminToken) return
    
    setDataLoading(prev => ({ ...prev, users: true }))
    try {
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      setUsers(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setDataLoading(prev => ({ ...prev, users: false }))
    }
  }

  const loadAssinaturas = async () => {
    if (!adminToken) return
    
    setDataLoading(prev => ({ ...prev, assinaturas: true }))
    try {
      const response = await api.get('/admin/assinaturas', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      setAssinaturas(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    } finally {
      setDataLoading(prev => ({ ...prev, assinaturas: false }))
    }
  }

  const loadRecorrencias = async () => {
    if (!adminToken) return
    
    setDataLoading(prev => ({ ...prev, recorrencias: true }))
    try {
      const response = await api.get('/admin/recorrencias', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      setRecorrencias(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar recorrências:', error)
    } finally {
      setDataLoading(prev => ({ ...prev, recorrencias: false }))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  if (!isAuthenticated) {
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
                  <FontAwesomeIcon icon={faEye} />
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
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>Painel Administrativo</h1>
          <div className="admin-actions">
            <button onClick={loadAllData} className="refresh-btn">
              <FontAwesomeIcon icon={faSync} />
              Atualizar Dados
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <FontAwesomeIcon icon={faSignOutAlt} />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FontAwesomeIcon icon={faUsers} />
          Usuários ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'assinaturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('assinaturas')}
        >
          <FontAwesomeIcon icon={faCreditCard} />
          Assinaturas ({assinaturas.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recorrencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('recorrencias')}
        >
          <FontAwesomeIcon icon={faSync} />
          Recorrências ({recorrencias.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>Usuários Cadastrados</h2>
            {dataLoading.users ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                Carregando usuários...
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>CPF</th>
                      <th>Telefone</th>
                      <th>CRO</th>
                      <th>Verificado</th>
                      <th>Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.nome}</td>
                        <td>{user.email}</td>
                        <td>{user.cpf}</td>
                        <td>{user.telefone}</td>
                        <td>{user.cro}</td>
                        <td>
                          <FontAwesomeIcon 
                            icon={user.isVerified ? faCheckCircle : faTimesCircle}
                            className={user.isVerified ? 'verified' : 'unverified'}
                          />
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="empty-state">
                    <p>Nenhum usuário encontrado.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assinaturas' && (
          <div className="admin-section">
            <h2>Assinaturas Ativas</h2>
            {dataLoading.assinaturas ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                Carregando assinaturas...
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>CPF</th>
                      <th>Plano</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Próximo Vencimento</th>
                      <th>Clinica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assinaturas.map(assinatura => (
                      <tr key={assinatura.id}>
                        <td>{assinatura.name}</td>
                        <td>{assinatura.email}</td>
                        <td>{assinatura.cpf}</td>
                        <td>{assinatura.plano?.name}</td>
                        <td>{formatCurrency(assinatura.value)}</td>
                        <td>
                          <span className={`status ${assinatura.status}`}>
                            {assinatura.status}
                          </span>
                        </td>
                        <td>{formatDate(assinatura.nextDueDate)}</td>
                        <td>{assinatura.clienteMaster?.nomeFantasia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {assinaturas.length === 0 && (
                  <div className="empty-state">
                    <p>Nenhuma assinatura encontrada.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recorrencias' && (
          <div className="admin-section">
            <h2>Recorrências de Pagamento</h2>
            {dataLoading.recorrencias ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                Carregando recorrências...
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Plano</th>
                      <th>Valor</th>
                      <th>Próximo Pagamento</th>
                      <th>Clinica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recorrencias.map(recorrencia => (
                      <tr key={recorrencia.id}>
                        <td>{recorrencia.assinatura?.name}</td>
                        <td>{recorrencia.assinatura?.plano?.name}</td>
                        <td>{formatCurrency(recorrencia.valor)}</td>
                        <td>{formatDate(recorrencia.nextDueDate)}</td>
                        <td>{recorrencia.assinatura?.clienteMaster?.nomeFantasia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recorrencias.length === 0 && (
                  <div className="empty-state">
                    <p>Nenhuma recorrência encontrada.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
