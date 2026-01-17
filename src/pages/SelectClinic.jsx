import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBuilding, 
  faCheckCircle, 
  faSpinner, 
  faPlus, 
  faSignOutAlt,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faEdit,
  faArrowRight,
  faCrown,
  faIdCard
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import './SelectClinic.css'

const SelectClinic = () => {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editFormData, setEditFormData] = useState({
    nome: '',
    telefone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, getClinicsByEmail, setSelectedClinicId, logout, setUser, refreshUser, clearUserComumId } = useAuth()
  const hasFetchedRef = useRef(false)

  // Limpar relacionamento quando entrar na página de seleção de clínicas
  useEffect(() => {
    // Limpar relacionamento e userComumId ao entrar na página
    sessionStorage.removeItem('relacionamento')
    sessionStorage.removeItem('userComumId')
    clearUserComumId()
  }, [clearUserComumId])

  useEffect(() => {
    // Evitar múltiplas chamadas
    if (hasFetchedRef.current) return
    
    const fetchClinics = async () => {
      hasFetchedRef.current = true
      setLoading(true)
      setError('')

      try {
        // Buscar dados completos incluindo o perfil do usuário (userBaseId vem do token JWT)
        const response = await api.get(`/auth/get-client-token`)
        
        if (response.data.statusCode === 200) {
          const data = response.data.data
          const clinics = data?.clientesMaster || []
          const userData = data?.user

          // Atualizar dados do usuário se vierem na resposta
          if (userData) {
            // Normalizar campo de verificação de email
            const normalizedUser = {
              ...userData,
              emailVerified: userData.isVerified || userData.emailVerified || userData.email_verified || false
            }
            // Verificar se os dados são diferentes antes de atualizar
            const currentUserStr = sessionStorage.getItem('user')
            const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
            const userChanged = !currentUser || JSON.stringify(currentUser) !== JSON.stringify(normalizedUser)
            
            if (userChanged) {
              // Atualizar no sessionStorage
              sessionStorage.setItem('user', JSON.stringify(normalizedUser))
              // Atualizar o estado do usuário no contexto
              setUser(normalizedUser)
            }
          }

          if (clinics.length > 0) {
            setClinics(clinics)
          } else {
            setError('Nenhum consultório encontrado para este email.')
          }
        } else {
          setError('Erro ao buscar dados.')
        }
      } catch (error) {
        console.error('Erro ao buscar consultórios:', error)
        setError('Erro ao carregar consultórios. Tente novamente.')
        hasFetchedRef.current = false // Permitir nova tentativa em caso de erro
      } finally {
        setLoading(false)
      }
    }

    fetchClinics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez ao montar

  useEffect(() => {
    if (user) {
      // Sempre manter os dados do formulário atualizados com os dados do usuário
      setEditFormData({
        nome: user.nome || '',
        telefone: user.telefone || '',
        postalCode: user.postalCode || '',
        address: user.address || '',
        addressNumber: user.addressNumber || '',
        complement: user.complement || '',
        province: user.province || '',
        city: user.city || '',
        state: user.state || ''
      })
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic)
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    setEditSuccess(false)

    try {
      const response = await api.put('/users/me', editFormData)

      if (response.data.statusCode === 200 || response.status === 200) {
        setEditSuccess(true)
        await refreshUser()
        setTimeout(() => {
          setShowEditProfile(false)
          setEditSuccess(false)
        }, 1500)
      } else {
        setEditError(response.data.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      setEditError(error.response?.data?.message || 'Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedClinic) {
      setError('Por favor, selecione um consultório')
      return
    }

    setSubmitting(true)
    setError('')
    setLoadingMessage('Conectando ao consultório...')
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      let clinicCompleteData = null
      try {
        setLoadingMessage('Carregando dados do consultório...')
        await new Promise(resolve => setTimeout(resolve, 600))
        // Chamar API via POST com o ID no header ao invés da URL
        const response = await api.post('/clientes-master/complete', {}, {
          headers: {
            'X-Cliente-Master-Id': selectedClinic.id
          }
        })
        clinicCompleteData = response.data?.data || response.data
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Erro ao buscar dados completos do cliente master:', error)
        setError('Erro ao buscar dados do consultório. Tente novamente.')
        setSubmitting(false)
        setLoadingMessage('')
        return
      }
      
      if (!clinicCompleteData) {
        setError('Dados do consultório não encontrados.')
        setSubmitting(false)
        setLoadingMessage('')
        return
      }
      
      const clienteMaster = clinicCompleteData.clienteMaster || clinicCompleteData
      const assinatura = clinicCompleteData.assinatura
      
      const clienteMasterInativo = 
        clienteMaster?.ativo === false || 
        clienteMaster?.status === 'INACTIVE'
      
      const assinaturaStatus = assinatura?.status
      const assinaturaInativa = assinaturaStatus !== 'ACTIVE'
      
      // Passar os dados já obtidos para setSelectedClinicId para evitar chamada duplicada da API
      if (clienteMasterInativo || assinaturaInativa) {
        setLoadingMessage('Redirecionando...')
        await new Promise(resolve => setTimeout(resolve, 500))
        await setSelectedClinicId(selectedClinic.id, clinicCompleteData)
        await new Promise(resolve => setTimeout(resolve, 400))
        navigate('/assinatura-pendente')
        return
      }
      
      setLoadingMessage('Preparando ambiente...')
      await new Promise(resolve => setTimeout(resolve, 800))
      await setSelectedClinicId(selectedClinic.id, clinicCompleteData)
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setLoadingMessage('Entrando na plataforma...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      navigate('/app')
    } catch (error) {
      console.error('Erro ao selecionar consultório:', error)
      setError('Erro ao processar seleção. Tente novamente.')
      setSubmitting(false)
      setLoadingMessage('')
    }
  }

  if (loading) {
    return (
      <div className="select-clinic-page">
        <div className="select-clinic-loading">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Carregando consultórios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="select-clinic-page">
      <div className="select-clinic-container">
        {/* Sidebar com Perfil do Usuário */}
        <div className="select-clinic-sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-logo">NODON</h1>
            <button className="logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Sair</span>
            </button>
          </div>

          <div className="user-profile-section">
            <div className="user-avatar-large">
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 className="user-name">{user?.nome || 'Usuário'}</h2>
            <p className="user-email">
              <FontAwesomeIcon icon={faEnvelope} />
              {user?.email || 'Email não informado'}
            </p>

            <div className="user-info-grid">
              {user?.telefone && (
                <div className="user-info-item">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{user.telefone}</span>
                </div>
              )}
              {user?.cpf && (
                <div className="user-info-item">
                  <FontAwesomeIcon icon={faIdCard} />
                  <span>{user.cpf}</span>
                </div>
              )}
              {user?.address && (
                <div className="user-info-item full-width">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>
                    {user.address}
                    {user.addressNumber && `, ${user.addressNumber}`}
                    {user.complement && ` - ${user.complement}`}
                    {user.province && `, ${user.province}`}
                    {user.city && ` - ${user.city}`}
                    {user.state && `/${user.state}`}
                  </span>
                </div>
              )}
            </div>

            <button 
              className="edit-profile-btn"
              onClick={() => setShowEditProfile(!showEditProfile)}
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>{showEditProfile ? 'Cancelar Edição' : 'Editar Perfil'}</span>
            </button>

            {/* Formulário de Edição */}
            {showEditProfile && (
              <form className="edit-profile-form" onSubmit={handleSaveProfile}>
                {editError && <div className="form-error">{editError}</div>}
                {editSuccess && <div className="form-success">Perfil atualizado com sucesso!</div>}

                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    name="nome"
                    value={editFormData.nome}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={editFormData.telefone}
                    onChange={handleEditInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>CEP</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={editFormData.postalCode}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Endereço</label>
                    <input
                      type="text"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Número</label>
                    <input
                      type="text"
                      name="addressNumber"
                      value={editFormData.addressNumber}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Complemento</label>
                    <input
                      type="text"
                      name="complement"
                      value={editFormData.complement}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Bairro</label>
                    <input
                      type="text"
                      name="province"
                      value={editFormData.province}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cidade</label>
                    <input
                      type="text"
                      name="city"
                      value={editFormData.city}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <input
                      type="text"
                      name="state"
                      value={editFormData.state}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>

                <button type="submit" className="save-profile-btn" disabled={editLoading}>
                  {editLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Área Principal com Consultórios */}
        <div className="select-clinic-main">
          <div className="main-header">
            <div>
              <h2>Selecione seu Consultório</h2>
              <p>Escolha o consultório que deseja acessar</p>
            </div>
          </div>

          {error && !loading && (
            <div className="error-message">{error}</div>
          )}

          {clinics.length === 0 && !loading && !error && (
            <div className="error-message">
              Nenhum consultório encontrado. Entre em contato com o suporte.
            </div>
          )}

          {clinics.length > 0 && (
            <form onSubmit={handleSubmit} className="clinics-form">
              <div className="clinics-grid">
                {/* Card para adicionar novo consultório */}
                <div
                  className="clinic-card add-clinic-card"
                  onClick={() => navigate('/add-clinic')}
                >
                  <div className="clinic-icon add-icon">
                    <FontAwesomeIcon icon={faPlus} />
                  </div>
                  <h3>Adicionar Novo Consultório</h3>
                  <p>Criar uma nova assinatura e adicionar outro escritório</p>
                </div>

                {/* Cards de consultórios */}
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className={`clinic-card ${selectedClinic?.id === clinic.id ? 'selected' : ''}`}
                    onClick={() => handleSelectClinic(clinic)}
                  >
                    <div 
                      className="clinic-icon"
                      style={{
                        background: clinic.cor ? `${clinic.cor}20` : 'rgba(14, 165, 233, 0.2)',
                        color: clinic.cor || '#0ea5e9'
                      }}
                    >
                      {clinic.logo ? (
                        <img 
                          src={clinic.logo} 
                          alt={clinic.nomeEmpresa || clinic.nome || 'Consultório'}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = '<i class="fa fa-building"></i>'
                          }}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faBuilding} />
                      )}
                    </div>
                    <div className="clinic-info">
                      <h3 style={{ color: clinic.cor || '#ffffff' }}>
                        {clinic.nomeEmpresa || clinic.nome || 'Consultório'}
                      </h3>
                      <p className="clinic-email">{clinic.email || 'Email não informado'}</p>
                      
                      {clinic.assinatura && (
                        <div className="clinic-subscription">
                          {clinic.assinatura.plano?.nome && (
                            <div className="plan-name">
                              <FontAwesomeIcon icon={faCrown} />
                              {clinic.assinatura.plano.nome}
                            </div>
                          )}
                          <span 
                            className={`status-badge ${
                              clinic.assinatura.status === 'ACTIVE' ? 'active' :
                              clinic.assinatura.status === 'PENDING' ? 'pending' : 'inactive'
                            }`}
                          >
                            {clinic.assinatura.status === 'ACTIVE' ? 'Ativo' :
                             clinic.assinatura.status === 'PENDING' ? 'Pendente' :
                             clinic.assinatura.status || 'Desconhecido'}
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedClinic?.id === clinic.id && (
                      <div className="selected-indicator">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={!selectedClinic || submitting}
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar no Consultório
                    <FontAwesomeIcon icon={faArrowRight} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {submitting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner-wrapper">
              <div className="loading-spinner"></div>
            </div>
            <p className="loading-message">{loadingMessage || 'Carregando...'}</p>
            <div className="loading-progress">
              <div className="loading-progress-bar"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectClinic
