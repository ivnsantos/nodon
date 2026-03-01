import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
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
  faIdCard,
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faBars,
  faTimes,
  faImage,
  faPalette,
  faUpload,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
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
  const [userPhoto, setUserPhoto] = useState(null)
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
  const [menuOpen, setMenuOpen] = useState(false)

  // Modal editar dados do consultório (cliente master)
  const [editingClinic, setEditingClinic] = useState(null)
  const [masterFormData, setMasterFormData] = useState({
    nomeEmpresa: '',
    cnpj: '',
    logo: '',
    cor: '#0ea5e9',
    corSecundaria: '#020827',
    telefoneEmpresa: '',
    endereco: ''
  })
  const [masterLogoFile, setMasterLogoFile] = useState(null)
  const [masterLogoPreview, setMasterLogoPreview] = useState(null)
  const [masterFormLoading, setMasterFormLoading] = useState(false)
  const [masterFormLoadingData, setMasterFormLoadingData] = useState(false)
  const [masterFormError, setMasterFormError] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  const { user, getClinicsByEmail, setSelectedClinicId, logout, setUser, refreshUser, clearUserComumId } = useAuth()
  const hasFetchedRef = useRef(false)

  // Buscar foto do perfil do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/auth/me')
        const userData = response.data?.data || response.data
        if (userData?.foto) {
          setUserPhoto(userData.foto)
        }
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error)
      }
    }

    fetchUserProfile()
  }, [])

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
            // Se há apenas um consultório, já selecionar para o botão "Entrar" ficar habilitado
            if (clinics.length === 1) {
              setSelectedClinic(clinics[0])
            }
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

  // Função para abrir WhatsApp de suporte
  const handleSuporteWhatsApp = () => {
    const phoneNumber = '5511932589622' // Número com código do país (55 = Brasil)
    const message = encodeURIComponent('Olá! Preciso de suporte da NODON.')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic)
  }

  // ID do Plano Estudante (double check além do nome)
  const PLANO_ESTUDANTE_ID = '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7'

  // Cores: só aceitamos hexadecimal (#RGB ou #RRGGBB). Retorna 6 dígitos ou null.
  const normalizeHex = (val) => {
    if (!val || typeof val !== 'string') return null
    const s = val.trim()
    if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s
    if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
      const r = s[1] + s[1], g = s[2] + s[2], b = s[3] + s[3]
      return `#${r}${g}${b}`
    }
    return null
  }

  const hexToRgba = (hex, a) => {
    const h = normalizeHex(hex) || '#1e293b'
    const r = parseInt(h.slice(1, 3), 16)
    const g = parseInt(h.slice(3, 5), 16)
    const b = parseInt(h.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }

  // Só quem é cliente master do consultório pode editar (get-client-token pode retornar tipo: "master" no item do consultório)
  const isClienteMasterDoConsultorio = (clinic) => {
    if (!clinic) return false
    const tipoRel = clinic.relacionamento?.tipo ?? clinic.tipo
    if (tipoRel === 'clienteMaster' || tipoRel === 'master' || clinic.ehClienteMaster === true) return true
    // Usuário é master e este consultório é o dele (ex.: /auth/me retorna tipo: "master", clienteMasterId: "...")
    const userMasterId = user?.clienteMasterId || user?.cliente_master_id
    return user?.tipo === 'master' && userMasterId && clinic.id === userMasterId
  }

  // Regra: plano diferente de "Plano Estudante" e nome da empresa é "Empresa" → precisa editar dados antes de entrar
  const clinicPrecisaEditar = (clinic) => {
    if (!clinic) return false
    const plano = clinic.assinatura?.plano
    const planId = (plano?.id || '').trim().toLowerCase()
    const planName = (plano?.nome || '').trim()
    const isPlanoEstudante = planId === PLANO_ESTUDANTE_ID.toLowerCase() || planName === 'Plano Estudante'
    const nome = (clinic.nomeEmpresa || clinic.nome || '').trim()
    return !isPlanoEstudante && nome === 'Empresa'
  }

  const selectedClinicPrecisaEditar = clinicPrecisaEditar(selectedClinic)

  // Telefone: armazenar só dígitos (máx. 11). Exibir com máscara. API recebe com prefixo 55.
  const normalizeTelefoneInput = (value) => {
    const digits = (value || '').replace(/\D/g, '')
    const sem55 = digits.startsWith('55') ? digits.slice(2) : digits
    return sem55.slice(0, 11)
  }
  const formatTelefoneDisplay = (digits) => {
    const d = (digits || '').replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d ? `(${d}` : ''
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }
  const getTelefoneEmpresaParaApi = () => {
    const digits = (masterFormData.telefoneEmpresa || '').replace(/\D/g, '').slice(0, 11)
    return digits ? `55${digits}` : ''
  }

  // Preenche o formulário a partir de um objeto cliente master (API ou card).
  const fillMasterFormFromData = (data) => {
    const c = data || {}
    const telRaw = (c.telefoneEmpresa || c.telefone_empresa || '').replace(/\D/g, '')
    const telNormalized = telRaw.startsWith('55') ? telRaw.slice(2).slice(0, 11) : telRaw.slice(0, 11)
    const corVal = normalizeHex(c.cor) || c.cor || '#0ea5e9'
    const corSecVal = c.corSecundaria ? (normalizeHex(c.corSecundaria) || c.corSecundaria) : '#020827'
    setMasterFormData({
      nomeEmpresa: c.nomeEmpresa || c.nome || '',
      cnpj: c.cnpj || c.documento || '',
      logo: c.logo || '',
      cor: corVal,
      corSecundaria: corSecVal,
      telefoneEmpresa: telNormalized,
      endereco: c.endereco || c.endereco_empresa || ''
    })
    setMasterLogoPreview(c.logo || null)
  }

  // Abre o painel de edição: preenche com dados do card e busca dados atuais via GET /clientes-master/:id.
  const openEditClinicPanel = async (clinic, e) => {
    if (e) e.stopPropagation()
    if (!clinic?.id) return
    setEditingClinic(clinic)
    setMasterFormError('')
    setMasterLogoFile(null)
    setMasterLogoPreview(clinic.logo || null)
    fillMasterFormFromData(clinic)
    setMasterFormLoadingData(true)
    try {
      const response = await api.get(`/clientes-master/${clinic.id}`, { headers: { 'Content-Type': 'application/json' } })
      const data = response.data?.data ?? response.data
      if (data) fillMasterFormFromData(data)
    } catch (err) {
      console.error('Erro ao carregar dados do consultório:', err)
      // Mantém os dados do card já preenchidos
    } finally {
      setMasterFormLoadingData(false)
    }
  }

  const closeEditClinicPanel = () => {
    setEditingClinic(null)
    setMasterLogoFile(null)
    setMasterLogoPreview(null)
    setMasterFormError('')
  }

  const handleMasterFormChange = (e) => {
    const { name, value } = e.target
    if (name === 'cnpj') {
      const numbers = value.replace(/\D/g, '')
      let formatted
      if (numbers.length <= 11) {
        formatted = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (m, p1, p2, p3, p4) =>
          p4 ? `${p1}.${p2}.${p3}-${p4}` : p3 ? `${p1}.${p2}.${p3}` : p2 ? `${p1}.${p2}` : p1)
      } else {
        formatted = numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (m, p1, p2, p3, p4, p5) =>
          p5 ? `${p1}.${p2}.${p3}/${p4}-${p5}` : p4 ? `${p1}.${p2}.${p3}/${p4}` : p3 ? `${p1}.${p2}.${p3}` : p2 ? `${p1}.${p2}` : p1)
      }
      setMasterFormData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'telefoneEmpresa') {
      setMasterFormData(prev => ({ ...prev, [name]: normalizeTelefoneInput(value) }))
    } else if (name === 'logo') {
      setMasterFormData(prev => ({ ...prev, [name]: value }))
      if (value.startsWith('http')) {
        setMasterLogoPreview(value)
        setMasterLogoFile(null)
      }
    } else {
      setMasterFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleMasterLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMasterFormError('Selecione um arquivo de imagem (PNG, JPG, etc.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMasterFormError('O arquivo deve ter no máximo 5MB')
      return
    }
    setMasterLogoFile(file)
    setMasterFormData(prev => ({ ...prev, logo: '' }))
    const reader = new FileReader()
    reader.onloadend = () => setMasterLogoPreview(reader.result)
    reader.readAsDataURL(file)
    setMasterFormError('')
  }

  const handleRemoveMasterLogo = () => {
    setMasterLogoFile(null)
    setMasterLogoPreview(null)
    setMasterFormData(prev => ({ ...prev, logo: '' }))
  }

  const refetchClinics = async () => {
    try {
      const response = await api.get('/auth/get-client-token')
      if (response.data?.statusCode === 200 && response.data?.data?.clientesMaster) {
        setClinics(response.data.data.clientesMaster)
      }
    } catch (err) {
      console.error('Erro ao atualizar lista de consultórios:', err)
    }
  }

  const handleSaveMasterData = async (e) => {
    e.preventDefault()
    if (!editingClinic?.id) return
    if (!masterFormData.nomeEmpresa.trim()) {
      setMasterFormError('Informe o nome da empresa.')
      return
    }
    const corHex = normalizeHex(masterFormData.cor)
    const corSecundariaHex = masterFormData.corSecundaria ? normalizeHex(masterFormData.corSecundaria) : null
    if (!corHex) {
      setMasterFormError('Cor principal deve ser um hexadecimal válido (ex: #001c29).')
      return
    }
    if (masterFormData.corSecundaria && !corSecundariaHex) {
      setMasterFormError('Cor secundária deve ser um hexadecimal válido (ex: #ff5722).')
      return
    }
    setMasterFormLoading(true)
    setMasterFormError('')
    try {
      if (masterLogoFile) {
        const fd = new FormData()
        fd.append('file', masterLogoFile)
        fd.append('nomeEmpresa', masterFormData.nomeEmpresa.trim())
        if (masterFormData.cnpj.trim()) fd.append('cnpj', masterFormData.cnpj.trim())
        fd.append('cor', corHex)
        if (corSecundariaHex) fd.append('corSecundaria', corSecundariaHex)
        if (getTelefoneEmpresaParaApi()) fd.append('telefoneEmpresa', getTelefoneEmpresaParaApi())
        if (masterFormData.endereco.trim()) fd.append('endereco', masterFormData.endereco.trim())
        await api.post('/clientes-master/meus-dados', fd, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-Cliente-Master-Id': editingClinic.id }
        })
      } else {
        await api.put(`/clientes-master/${editingClinic.id}`, {
          nomeEmpresa: masterFormData.nomeEmpresa.trim(),
          cnpj: masterFormData.cnpj.trim() || undefined,
          logo: masterFormData.logo.trim() || undefined,
          cor: corHex,
          corSecundaria: corSecundariaHex || undefined,
          telefoneEmpresa: getTelefoneEmpresaParaApi() || undefined,
          endereco: masterFormData.endereco.trim() || undefined
        }, { headers: { 'Content-Type': 'application/json' } })
      }
      await refetchClinics()
      if (editingClinic.id === selectedClinic?.id) {
        setSelectedClinic(prev => prev ? {
          ...prev,
          nomeEmpresa: masterFormData.nomeEmpresa.trim(),
          cnpj: masterFormData.cnpj.trim() || prev.cnpj,
          logo: masterLogoPreview || prev.logo,
          cor: corHex,
          corSecundaria: corSecundariaHex ?? prev.corSecundaria,
          telefoneEmpresa: getTelefoneEmpresaParaApi() || prev.telefoneEmpresa,
          endereco: masterFormData.endereco.trim() || prev.endereco
        } : null)
      }
      closeEditClinicPanel()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setMasterFormError(err.response?.data?.message || err.response?.data?.data?.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setMasterFormLoading(false)
    }
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
        {/* Header Mobile com Menu Hambúrguer */}
        <div className="mobile-header">
          <div className="mobile-header-left">
            <div className="mobile-user-avatar">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt={user?.nome || 'Usuário'} 
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <span className="user-avatar-initial" style={{ display: userPhoto ? 'none' : 'flex' }}>
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="mobile-header-info">
              <h1 className="mobile-logo">NODON</h1>
              <span className="mobile-user-name">{user?.nome || 'Usuário'}</span>
            </div>
          </div>
          <button 
            className="hamburger-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
        </div>

        {/* Overlay para fechar menu no mobile */}
        {menuOpen && (
          <div 
            className="menu-overlay"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Sidebar com Perfil do Usuário */}
        <div className={`select-clinic-sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-header-left">
              <div className="user-avatar-small">
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt={user?.nome || 'Usuário'} 
                    className="user-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <span className="user-avatar-initial" style={{ display: userPhoto ? 'none' : 'flex' }}>
                  {user?.nome?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="sidebar-header-info">
                <h1 className="sidebar-logo">NODON</h1>
                <span className="sidebar-user-name">{user?.nome || 'Usuário'}</span>
              </div>
            </div>
            <button 
              className="sidebar-close-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="user-profile-section">
            <div className="user-avatar-large">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt={user?.nome || 'Usuário'} 
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <span className="user-avatar-initial" style={{ display: userPhoto ? 'none' : 'flex' }}>
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </span>
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

            <button 
              className="suporte-whatsapp-btn"
              onClick={handleSuporteWhatsApp}
            >
              <FontAwesomeIcon icon={faWhatsapp} />
              <span>Suporte</span>
            </button>

            <button 
              className="logout-btn-menu"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Sair</span>
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

        {/* Área Principal com Consultórios ou Painel de Edição */}
        <div className="select-clinic-main">
          {editingClinic ? (
            /* Painel de edição do consultório */
            <div className="select-clinic-edit-panel">
              <div className="select-clinic-edit-panel-header">
                <button type="button" className="select-clinic-edit-back" onClick={closeEditClinicPanel}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Voltar à lista
                </button>
                <h2>Editar dados do consultório</h2>
                <p>{editingClinic.nomeEmpresa || editingClinic.nome || 'Consultório'}</p>
              </div>
              {masterFormLoadingData ? (
                <div className="select-clinic-edit-loading">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <p>Carregando dados do consultório...</p>
                </div>
              ) : (
              <form onSubmit={handleSaveMasterData} className="select-clinic-master-form select-clinic-master-form-panel">
                {masterFormError && <div className="select-clinic-master-form-error">{masterFormError}</div>}
                <div className="form-group">
                  <label>Nome da empresa *</label>
                  <input name="nomeEmpresa" value={masterFormData.nomeEmpresa} onChange={handleMasterFormChange} placeholder="Ex: Clínica Odontológica" required />
                </div>
                <div className="form-group">
                  <label>CPF/CNPJ</label>
                  <input name="cnpj" value={masterFormData.cnpj} onChange={handleMasterFormChange} placeholder="00.000.000/0000-00" maxLength={18} />
                </div>
                <div className="form-group">
                  <label>Logo</label>
                  {masterLogoPreview ? (
                    <div className="master-logo-preview-wrap">
                      <img src={masterLogoPreview} alt="Logo" className="master-logo-preview-img" />
                      <button type="button" className="master-logo-remove" onClick={handleRemoveMasterLogo}><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                  ) : (
                    <>
                      <label className="master-file-label">
                        <FontAwesomeIcon icon={faUpload} /> {masterLogoFile ? masterLogoFile.name : 'Enviar imagem'}
                        <input type="file" accept="image/*" onChange={handleMasterLogoFileChange} className="master-file-input" />
                      </label>
                      <span className="master-form-or">ou</span>
                      <input name="logo" type="url" value={masterFormData.logo} onChange={handleMasterFormChange} placeholder="https://exemplo.com/logo.png" />
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label>Cor principal (Cor predominante)</label>
                  <div className="master-cor-row">
                    <input name="cor" type="color" value={masterFormData.cor} onChange={handleMasterFormChange} className="master-cor-picker" />
                    <input type="text" value={masterFormData.cor} onChange={(e) => { const v = e.target.value; if (v === '' || /^#[0-9A-Fa-f]{0,6}$/.test(v)) setMasterFormData(prev => ({ ...prev, cor: v || '#' })) }} placeholder="#001c29 (somente hex)" className="master-cor-text" maxLength={7} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Cor secundária (Cor para textos)</label>
                  <div className="master-cor-row">
                    <input name="corSecundaria" type="color" value={masterFormData.corSecundaria} onChange={handleMasterFormChange} className="master-cor-picker" />
                    <input type="text" value={masterFormData.corSecundaria} onChange={(e) => { const v = e.target.value; if (v === '' || /^#[0-9A-Fa-f]{0,6}$/.test(v)) setMasterFormData(prev => ({ ...prev, corSecundaria: v || '#' })) }} placeholder="#ff5722 (somente hex)" className="master-cor-text" maxLength={7} />
                  </div>
                </div>
                {(() => {
                  const previewCor = normalizeHex(masterFormData.cor) || '#1e293b'
                  const previewSec = normalizeHex(masterFormData.corSecundaria) || '#e2e8f0'
                  return (
                    <div className="form-group master-cor-preview-wrap">
                      <label>Preview da página</label>
                      <div
                        className="master-cor-preview"
                        style={{
                          background: previewCor,
                          border: `1px solid ${hexToRgba(previewCor, 0.6)}`
                        }}
                      >
                        <div className="master-cor-preview-header" style={{ background: hexToRgba(previewCor, 0.6), borderBottom: `1px solid ${hexToRgba(previewSec, 0.2)}` }}>
                          {(masterLogoPreview || masterFormData.logo) ? (
                            <img src={masterLogoPreview || masterFormData.logo} alt="" className="master-cor-preview-logo master-cor-preview-logo-img" />
                          ) : (
                            <span className="master-cor-preview-logo" style={{ background: previewSec }} />
                          )}
                          <span className="master-cor-preview-title" style={{ color: previewSec }}>{masterFormData.nomeEmpresa.trim() || 'Nome da empresa'}</span>
                        </div>
                        <div className="master-cor-preview-body">
                          <h3 className="master-cor-preview-h3" style={{ color: previewSec }}>Título da página</h3>
                          <div className="master-cor-preview-card" style={{ background: hexToRgba(previewCor, 0.15), borderColor: '#ffffff52' }}>
                            <span className="master-cor-preview-label" style={{ color: previewSec }}>Campo</span>
                            <span className="master-cor-preview-value" style={{ color: previewSec, opacity: 0.9 }}>Valor do campo</span>
                          </div>
                          <button type="button" className="master-cor-preview-btn" style={{ background: previewCor, color: previewSec, borderColor: previewCor }} disabled>Botão</button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faPhone} /> Telefone da empresa</label>
                  <input name="telefoneEmpresa" type="tel" value={formatTelefoneDisplay(masterFormData.telefoneEmpresa)} onChange={handleMasterFormChange} placeholder="(11) 99999-9999" />
                </div>
                <div className="form-group">
                  <label><FontAwesomeIcon icon={faMapMarkerAlt} /> Endereço</label>
                  <input name="endereco" type="text" value={masterFormData.endereco} onChange={handleMasterFormChange} placeholder="Rua, número, bairro, cidade..." />
                </div>
                <div className="select-clinic-modal-actions">
                  <button type="button" className="btn-cancel-master" onClick={closeEditClinicPanel}>Cancelar</button>
                  <button type="submit" className="btn-save-master" disabled={masterFormLoading}>
                    {masterFormLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Salvando...</> : <><FontAwesomeIcon icon={faSave} /> Salvar</>}
                  </button>
                </div>
              </form>
              )}
            </div>
          ) : (
            <>
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
                    {isClienteMasterDoConsultorio(clinic) && (
                      <button
                        type="button"
                        className="clinic-card-edit-btn"
                        onClick={(e) => openEditClinicPanel(clinic, e)}
                        title="Editar dados do consultório"
                        aria-label="Editar dados do consultório"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        Editar
                      </button>
                    )}
                    <div 
                      className="clinic-icon"
                      style={{
                        background: 'rgba(14, 165, 233, 0.2)',
                        color: '#0ea5e9'
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
                      <h3>
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

              <div className="select-clinic-entrar-area">
              {selectedClinicPrecisaEditar && (
                <div className="select-clinic-precisa-editar-aviso">
                  <FontAwesomeIcon icon={faEdit} />
                  <span>Para iniciar precisa editar os dados do seu consultório.</span>
                </div>
              )}

              <button 
                type="submit" 
                className={`submit-btn ${selectedClinicPrecisaEditar ? 'submit-btn-disabled-rule' : ''}`}
                disabled={!selectedClinic || submitting || selectedClinicPrecisaEditar}
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
              </div>
            </form>
              )}
            </>
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
