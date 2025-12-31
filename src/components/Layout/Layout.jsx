import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartBar, faUsers, faFileAlt, faComments, faSignOutAlt, faUserFriends,
  faBars, faTimes, faUserMd, faChevronLeft, faChevronRight, faUserCircle
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import nodoLogo from '../../img/nodo.png'
import './Layout.css'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)

  const menuItems = [
    { path: '/app', label: 'Dashboard', icon: faChartBar },
    { path: '/app/clientes', label: 'Clientes', icon: faUsers },
    { path: '/app/diagnosticos', label: 'Diagnósticos', icon: faFileAlt },
    { path: '/app/chat', label: 'Chat IA', icon: faComments },
    { path: '/app/perfil', label: 'Perfil', icon: faUserCircle },
    { path: '/app/dentistas', label: 'Usuário', icon: faUserMd },
  ]

  const handleLogout = () => {
    logout()
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

  // Fechar sidebar ao mudar de rota em mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

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
                <img src={nodoLogo} alt="NODON" className="logo-image" />
                <h1 className="logo-text">NODON</h1>
              </div>
            </>
          )}
          {sidebarMinimized && (
            <div className="logo-minimized">
              <img src={nodoLogo} alt="NODON" className="logo-image-minimized" />
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
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.nome || 'Usuário'}</p>
                <p className="user-role">{user?.tipo || 'Usuário'}</p>
              </div>
            </div>
          )}
          {sidebarMinimized && (
            <div className="user-avatar-minimized">
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
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

