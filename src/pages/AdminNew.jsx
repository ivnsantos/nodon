import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, 
  faCreditCard, 
  faSync, 
  faSignOutAlt,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'
import AdminLogin from './AdminLogin'
import './Admin.css'

const AdminNew = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [assinaturas, setAssinaturas] = useState([])
  const [recorrencias, setRecorrencias] = useState([])

  // Verificar se já está logado
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      setIsLoggedIn(true)
      loadData()
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsLoggedIn(false)
    setUsers([])
    setAssinaturas([])
    setRecorrencias([])
  }

  const loadData = async () => {
    const token = localStorage.getItem('admin_token')
    console.log('AdminNew - Token encontrado:', token ? 'SIM' : 'NÃO')
    console.log('AdminNew - Token valor:', token?.substring(0, 20) + '...')
    
    if (!token) return

    try {
      // Carregar usuários com fetch direto
      console.log('AdminNew - Carregando usuários...')
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('AdminNew - Status usuários:', usersResponse.status)
      
      if (!usersResponse.ok) {
        const errorText = await usersResponse.text()
        console.error('AdminNew - Erro usuários:', errorText)
        return
      }
      
      const usersData = await usersResponse.json()
      setUsers(usersData || [])
      console.log('AdminNew - Usuários carregados:', usersData?.length || 0)

      // Carregar assinaturas com fetch direto
      const assinaturasResponse = await fetch('http://localhost:5000/api/admin/assinaturas', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const assinaturasData = await assinaturasResponse.json()
      setAssinaturas(assinaturasData || [])

      // Carregar recorrências com fetch direto
      const recorrenciasResponse = await fetch('http://localhost:5000/api/admin/recorrencias', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const recorrenciasData = await recorrenciasResponse.json()
      setRecorrencias(recorrenciasData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={() => {
      setIsLoggedIn(true)
      loadData()
    }} />
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>Painel Administrativo</h1>
          <div className="admin-actions">
            <button onClick={loadData} className="refresh-btn">
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
                      <td>{user.isVerified ? '✅' : '❌'}</td>
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
          </div>
        )}

        {activeTab === 'assinaturas' && (
          <div className="admin-section">
            <h2>Assinaturas Ativas</h2>
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
                      <td>{assinatura.status}</td>
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
          </div>
        )}

        {activeTab === 'recorrencias' && (
          <div className="admin-section">
            <h2>Recorrências de Pagamento</h2>
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
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminNew
