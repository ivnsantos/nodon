import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartBar, faUsers, faFileAlt, faComments, faSignOutAlt, faUserFriends,
  faBars, faTimes, faUserMd, faChevronLeft, faChevronRight, faUserCircle, faBuilding,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import nodoLogo from '../../img/nodo.png'
import './Layout.css'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, selectedClinicData, selectedClinicId, setSelectedClinicId, isUsuario, clearUserComumId } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  
  // Recarregar dados do cliente master ao entrar no app apenas se não houver dados carregados
  useEffect(() => {
    let isMounted = true
    
    const loadClinicData = async () => {
      if (selectedClinicId && location.pathname.startsWith('/app') && !selectedClinicData) {
        try {
          // Buscar dados apenas se não estiverem carregados
          if (isMounted) {
            await setSelectedClinicId(selectedClinicId)
          }
        } catch (error) {
          console.error('Erro ao carregar dados do cliente master:', error)
        }
      }
    }
    
    // Executar apenas quando entrar na rota /app e não houver dados
    loadClinicData()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId, location.pathname])
  
  // Usar APENAS os atributos: nomeEmpresa, logo, cor, documento
  const clinicLogo = (selectedClinicData?.logo && selectedClinicData.logo !== null) ? selectedClinicData.logo : nodoLogo
  const clinicName = (selectedClinicData?.nomeEmpresa && selectedClinicData.nomeEmpresa !== null) ? selectedClinicData.nomeEmpresa : 'NODON'
  const clinicColor = (selectedClinicData?.cor && selectedClinicData.cor !== null) ? selectedClinicData.cor : '#0ea5e9'
  const clinicDocumento = (selectedClinicData?.documento && selectedClinicData.documento !== null) ? selectedClinicData.documento : null
  

  const allMenuItems = [
    { path: '/app', label: 'Dashboard', icon: faChartBar },
    { path: '/app/clientes', label: 'Clientes', icon: faUsers },
    { path: '/app/diagnosticos', label: 'Diagnósticos', icon: faFileAlt },
    { path: '/app/calendario', label: 'Calendário', icon: faCalendarAlt },
    { path: '/app/chat', label: 'Chat IA', icon: faComments },
    { path: '/app/perfil', label: 'Perfil', icon: faUserCircle },
    { path: '/app/dentistas', label: 'Usuário', icon: faUserMd },
  ]

  // Filtrar menu items baseado no tipo de relacionamento
  // Se for tipo "usuario", não mostrar a aba "Usuário"
  const menuItems = isUsuario() 
    ? allMenuItems.filter(item => item.path !== '/app/dentistas')
    : allMenuItems

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const toggleMinimize = () => {
    setSidebarMinimized(!sidebarMinimized)
  }

  // Carregar dados do cliente master quando o Layout carregar (apenas se necessário)
  // Este useEffect foi removido pois já temos outro que faz isso de forma mais eficiente

  // Fechar sidebar ao mudar de rota em mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Aplicar cor do cliente master como variável CSS
  useEffect(() => {
    if (clinicColor) {
      document.documentElement.style.setProperty('--clinic-primary-color', clinicColor)
    }
  }, [clinicColor])

  return (
    <div className="layout">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Botão hambúrguer para mobile */}
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarMinimized ? 'minimized' : ''}`}>
        <div className="sidebar-header">
          {!sidebarMinimized && (
            <>
              <div className="logo">
                <img src={clinicLogo} alt={clinicName} className="logo-image" />
                <h1 className="logo-text" style={{ color: clinicColor }}>{clinicName}</h1>
                {clinicDocumento && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    marginTop: '0.25rem'
                  }}>
                    {clinicDocumento}
                  </p>
                )}
              </div>
            </>
          )}
          {sidebarMinimized && (
            <div className="logo-minimized">
              <img src={clinicLogo} alt={clinicName} className="logo-image-minimized" />
            </div>
          )}
          <button className="minimize-btn" onClick={toggleMinimize} title={sidebarMinimized ? 'Expandir menu' : 'Minimizar menu'}>
            <FontAwesomeIcon icon={sidebarMinimized ? faChevronRight : faChevronLeft} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path === '/app' && location.pathname.startsWith('/app') && location.pathname === '/app')
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path)
                  closeSidebar()
                }}
                title={sidebarMinimized ? item.label : ''}
              >
                <span className="nav-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                {!sidebarMinimized && <span className="nav-label">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {!sidebarMinimized && (
            <div className="user-info">
              <div className="user-avatar">
                {clinicName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{clinicName}</p>
                {clinicDocumento && (
                  <p className="user-role">{clinicDocumento}</p>
                )}
              </div>
            </div>
          )}
          {sidebarMinimized && (
            <div className="user-avatar-minimized">
              {clinicName.charAt(0).toUpperCase()}
            </div>
          )}
          <button 
            className="clinic-btn" 
            onClick={() => {
              clearUserComumId()
              navigate('/select-clinic')
              closeSidebar()
            }}
            title={sidebarMinimized ? 'Voltar para Clínicas' : ''}
          >
            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: sidebarMinimized ? '0' : '0.5rem' }} />
            {!sidebarMinimized && 'Voltar para Clínicas'}
          </button>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title={sidebarMinimized ? 'Sair' : ''}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: sidebarMinimized ? '0' : '0.5rem' }} />
            {!sidebarMinimized && 'Sair'}
          </button>
        </div>
      </aside>

      <main className={`main-content ${sidebarMinimized ? 'sidebar-minimized' : ''}`}>
        <header className="topbar">
          <h2 className="page-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout

