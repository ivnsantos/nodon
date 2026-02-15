import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartBar, faUsers, faFileAlt, faComments, faSignOutAlt, faUserFriends,
  faBars, faTimes, faUserMd, faChevronLeft, faChevronRight, faUserCircle, faBuilding,
  faCalendarAlt, faClipboardQuestion, faComment, faDollarSign, faStickyNote,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'
import nodoLogo from '../../img/nodo.png'
import './Layout.css'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, selectedClinicData, selectedClinicId, setSelectedClinicId, isUsuario, clearUserComumId, planoAcesso } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  const [expandedSubmenu, setExpandedSubmenu] = useState(null)
  
  // Carregar dados completos do cliente master ao acessar /app
  // Isso garante que sempre temos os dados atualizados do plano, incluindo limiteAnalises
  // A API /api/clientes-master/complete retorna: { clienteMaster, user, assinatura, plano, usuarios, relacionamento }
  useEffect(() => {
    let isMounted = true
    
    const loadClinicData = async () => {
      // Carregar dados quando:
      // 1. Tiver selectedClinicId
      // 2. Estiver na rota /app
      // 3. Não tiver selectedClinicData OU não tiver plano (para garantir dados atualizados)
      const hasPlanoData = selectedClinicData?.plano && selectedClinicData.plano.limiteAnalises !== undefined
      const needsData = !selectedClinicData || !hasPlanoData
      
      if (selectedClinicId && location.pathname.startsWith('/app') && needsData) {
        try {
          if (isMounted) {
            // setSelectedClinicId chama a API /api/clientes-master/complete
            // que retorna todos os dados incluindo plano.limiteAnalises
            await setSelectedClinicId(selectedClinicId)
          }
        } catch (error) {
          console.error('Erro ao carregar dados do cliente master:', error)
        }
      }
    }
    
    loadClinicData()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId, location.pathname])
  
  // Usar APENAS os atributos: nomeEmpresa, logo, cor, documento
  const clinicLogo = (selectedClinicData?.logo && selectedClinicData.logo !== null) ? selectedClinicData.logo : nodoLogo
  const clinicName = (selectedClinicData?.nomeEmpresa && selectedClinicData.nomeEmpresa !== null) ? selectedClinicData.nomeEmpresa : 'NODON'
  const userName = (user?.nome || 'Usuário').split(' ')[0]
  const clinicColor = (selectedClinicData?.cor && selectedClinicData.cor !== null) ? selectedClinicData.cor : '#0ea5e9'
  const clinicDocumento = (selectedClinicData?.documento && selectedClinicData.documento !== null) ? selectedClinicData.documento : null
  

  const allMenuItems = [
    { path: '/app', label: 'Dashboard', icon: faChartBar },
    { path: '/app/clientes', label: 'Clientes', icon: faUsers },
    { path: '/app/anamneses', label: 'Anamnese', icon: faClipboardQuestion },
    { path: '/app/diagnosticos', label: 'Diagnósticos', icon: faFileAlt },
    { path: '/app/orcamentos', label: 'Orçamentos', icon: faFileInvoiceDollar },
    { path: '/app/precificacao', label: 'Precificação', icon: faDollarSign },
    { path: '/app/calendario', label: 'Calendário', icon: faCalendarAlt },
    { path: '/app/feedback', label: 'Feedback', icon: faComment },
    { path: '/app/chat', label: 'Chat IA', icon: faComments },
    { path: '/app/anotacoes', label: 'Anotações', icon: faStickyNote },
    { 
      path: '/app/perfil', 
      label: 'Perfil', 
      icon: faUserCircle,
      submenu: [
        { path: '/app/perfil', label: 'Perfil', icon: faUserCircle },
        { path: '/app/dentistas', label: 'Usuários', icon: faUserMd },
      ]
    },
  ]

  // Obter limiteAnalises do plano retornado pela API /api/clientes-master/complete
  // A estrutura é: selectedClinicData.plano.limiteAnalises
  const limiteAnalises = selectedClinicData?.plano?.limiteAnalises ?? null

  // Filtrar menu items baseado no tipo de relacionamento e acesso do plano
  let menuItems = allMenuItems
  
  /**
   * REGRA PRINCIPAL DE FILTRO DO MENU:
   * 
   * Se limiteAnalises === 0 (plano sem análises):
   *   - Mostrar APENAS: Chat IA e Perfil
   *   - Dashboard NÃO deve aparecer
   *   - Redirecionar /app para /app/chat automaticamente
   * 
   * Caso contrário (limiteAnalises > 0 ou null):
   *   - Aplicar filtros normais (tipo de usuário, planoAcesso, etc.)
   */
  if (limiteAnalises === 0) {
    // Plano sem análises: Chat IA, Anotações e Perfil (sem Dashboard)
    menuItems = menuItems.filter(item => 
      (item.path === '/app/chat' || item.path === '/app/anotacoes' || item.path === '/app/perfil') &&
      item.path !== '/app' // Excluir Dashboard
    )
  } else {
    // Se for tipo "usuario", não mostrar a aba "Usuários" no submenu de Perfil e "Anamneses"
    if (isUsuario()) {
      menuItems = menuItems.map(item => {
        if (item.submenu) {
          return {
            ...item,
            submenu: item.submenu.filter(subItem => subItem.path !== '/app/dentistas')
          }
        }
        return item
      }).filter(item => item.path !== '/app/anamneses')
    }
    
    // Filtrar baseado no acesso do plano
    if (planoAcesso === 'chat') {
      // Se acesso for "chat", mostrar apenas Chat e Perfil
      menuItems = menuItems.filter(item => 
        item.path === '/app/chat' || 
        item.path === '/app/perfil'
      )
    } else if (planoAcesso === 'all') {
      // Se acesso for "all", mostrar todos (já filtrado acima se for usuário comum)
      // Não precisa fazer nada, já tem todos os itens
    }
    // Se planoAcesso for null ou undefined, mostrar todos (compatibilidade)
    
    // Anamneses só aparece se Diagnósticos também aparecer
    const diagnosticosVisivel = menuItems.some(item => item.path === '/app/diagnosticos')
    if (!diagnosticosVisivel) {
      menuItems = menuItems.filter(item => item.path !== '/app/anamneses')
    }
  }

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

  // Função para obter o título da página atual
  const getPageTitle = () => {
    const path = location.pathname
    
    // Verificar rotas específicas primeiro
    if (path === '/app/clientes/novo') return 'Novo Cliente'
    if (path.startsWith('/app/clientes/') && path.includes('/editar')) return 'Editar Cliente'
    if (path.startsWith('/app/clientes/') && path !== '/app/clientes') return 'Detalhes do Cliente'
    if (path === '/app/anamneses/novo') return 'Nova Anamnese'
    if (path.startsWith('/app/anamneses/') && path.includes('/editar')) return 'Editar Anamnese'
    if (path.startsWith('/app/anamneses/') && path !== '/app/anamneses') return 'Detalhes da Anamnese'
    if (path.startsWith('/app/diagnosticos/') && path.includes('/desenho')) return 'Desenho Profissional'
    if (path.startsWith('/app/diagnosticos/') && path !== '/app/diagnosticos') return 'Detalhes da Radiografia'
    if (path === '/app/orcamentos/novo') return 'Novo Orçamento'
    if (path.startsWith('/app/orcamentos/') && path.includes('/editar')) return 'Editar Orçamento'
    if (path.startsWith('/app/orcamentos/') && path !== '/app/orcamentos') return 'Detalhes do Orçamento'
    
    // Se limiteAnalises === 0 e estiver em /app, retornar "Chat IA" (será redirecionado)
    if (limiteAnalises === 0 && path === '/app') {
      return 'Chat IA'
    }
    
    // Procurar no menu
    return menuItems.find(item => item.path === path)?.label || 'Dashboard'
  }

  // Carregar dados do cliente master quando o Layout carregar (apenas se necessário)
  // Este useEffect foi removido pois já temos outro que faz isso de forma mais eficiente

  // Fechar sidebar ao mudar de rota em mobile e expandir submenu se necessário
  useEffect(() => {
    setSidebarOpen(false)
    
    // Expandir submenu automaticamente se a rota atual estiver dentro de um submenu
    const currentItem = allMenuItems.find(item => 
      item.submenu && item.submenu.some(subItem => location.pathname === subItem.path)
    )
    if (currentItem) {
      setExpandedSubmenu(currentItem.path)
    } else if (location.pathname === '/app/perfil' || location.pathname === '/app/dentistas') {
      // Se estiver em uma rota do submenu de Perfil, expandir o submenu
      setExpandedSubmenu('/app/perfil')
    }
  }, [location.pathname])

  // Redirecionar /app para /app/chat quando limiteAnalises === 0
  useEffect(() => {
    if (limiteAnalises === 0 && location.pathname === '/app') {
      navigate('/app/chat', { replace: true })
    }
  }, [limiteAnalises, location.pathname, navigate])

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

      {/* Header mobile com menu e título */}
      <div className="mobile-header">
        <button className="mobile-menu-toggle" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
        </button>
        <h2 className="mobile-page-title">{getPageTitle()}</h2>
      </div>

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
                <button className="minimize-btn" onClick={toggleMinimize} title={sidebarMinimized ? 'Expandir menu' : 'Minimizar menu'}>
                  <FontAwesomeIcon icon={sidebarMinimized ? faChevronRight : faChevronLeft} />
                </button>
              </div>
            </>
          )}
          {sidebarMinimized && (
            <div className="logo-minimized">
              <img src={clinicLogo} alt={clinicName} className="logo-image-minimized" />
              <button className="minimize-btn" onClick={toggleMinimize} title={sidebarMinimized ? 'Expandir menu' : 'Minimizar menu'}>
                <FontAwesomeIcon icon={sidebarMinimized ? faChevronRight : faChevronLeft} />
              </button>
            </div>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isSubmenuExpanded = expandedSubmenu === item.path
            const isActive = location.pathname === item.path || 
                           (item.path === '/app' && location.pathname.startsWith('/app') && location.pathname === '/app') ||
                           (hasSubmenu && item.submenu.some(subItem => location.pathname === subItem.path))
            
            return (
              <div key={item.path} className="nav-item-wrapper">
                <button
                  className={`nav-item ${isActive ? 'active' : ''} ${hasSubmenu ? 'has-submenu' : ''}`}
                  onClick={() => {
                    if (hasSubmenu) {
                      setExpandedSubmenu(isSubmenuExpanded ? null : item.path)
                    } else {
                      navigate(item.path)
                      closeSidebar()
                    }
                  }}
                  title={sidebarMinimized ? item.label : ''}
                >
                  <span className="nav-icon">
                    <FontAwesomeIcon icon={item.icon} />
                  </span>
                  {!sidebarMinimized && <span className="nav-label">{item.label}</span>}
                  {!sidebarMinimized && hasSubmenu && (
                    <FontAwesomeIcon 
                      icon={faChevronRight} 
                      className={`submenu-arrow ${isSubmenuExpanded ? 'expanded' : ''}`}
                    />
                  )}
                </button>
                {hasSubmenu && isSubmenuExpanded && !sidebarMinimized && (
                  <div className="submenu">
                    {item.submenu.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path
                      return (
                        <button
                          key={subItem.path}
                          className={`submenu-item ${isSubActive ? 'active' : ''}`}
                          onClick={() => {
                            navigate(subItem.path)
                            closeSidebar()
                          }}
                        >
                          <span className="nav-icon">
                            <FontAwesomeIcon icon={subItem.icon} />
                          </span>
                          <span className="nav-label">{subItem.label}</span>
                        </button>
                      )}
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {!sidebarMinimized && (
            <div className="user-info">
              <div className="user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{userName}</p>
                {clinicDocumento && (
                  <p className="user-role">{clinicDocumento}</p>
                )}
              </div>
            </div>
          )}
          {sidebarMinimized && (
            <div className="user-avatar-minimized">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <button 
            className="clinic-btn" 
            onClick={() => {
              clearUserComumId()
              navigate('/select-clinic')
              closeSidebar()
            }}
            title={sidebarMinimized ? 'Voltar para o Inicio' : ''}
          >
            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: sidebarMinimized ? '0' : '0.5rem' }} />
            {!sidebarMinimized && 'Voltar para o Inicio'}
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
          <h2 className="page-title">{getPageTitle()}</h2>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout

