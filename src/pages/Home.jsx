import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBars, faTimes, faMessage, faRocket, 
  faChartBar, faSearch, faBolt, faUsers,
  faCamera, faRobot, faClipboardList, faLaptop,
  faMobileAlt, faTv, faDesktop, faUserMd,
  faCheckCircle, faComments, faShieldAlt, faCloud,
  faChevronDown, faTrophy, faStar, faDollarSign, 
  faFileInvoiceDollar, faCalendarAlt, faComment,
  faStickyNote, faFileAlt, faClipboardQuestion,
  faArrowRight, faCheck, faXmark, faChartLine, faGift
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import nodoLogo from '../img/nodo.png'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { alertConfig, showSuccess, hideAlert } = useAlert()
  const [showContactForm, setShowContactForm] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  
  const handlePlanToggle = (planId) => {
    setExpandedPlan(prev => prev === planId ? null : planId)
  }

  const getDefaultPrices = (nomePlano) => {
    switch (nomePlano) {
      case 'Plano Inicial':
        return { original: 159, promocional: 98 }
      case 'Plano Básico':
        return { original: 299, promocional: 179 }
      case 'Plano Premium':
        return { original: 299, promocional: null }
      case 'Plano Essencial':
        return { original: 399, promocional: null }
      case 'Plano Enterprise':
        return { original: 499, promocional: null }
      case 'Plano Chat':
        return { original: 49, promocional: 39 }
      default:
        return { original: 0, promocional: null }
    }
  }

  const parsePrice = (value) => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.trim().replace(',', '.')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const response = await api.get('/planos')
      const data = response.data?.data || response.data
      
      let planosList = []
      if (Array.isArray(data)) {
        planosList = data
      } else if (data?.planos) {
        planosList = data.planos
      } else if (data?.plans) {
        planosList = data.plans
      }
      
      planosList = planosList
        .filter(plano => plano.ativo === true)
        .map(plano => {
          const valorOriginalRaw = plano.valorOriginal ?? plano.valor_original ?? plano.valor ?? null
          const valorPromocionalRaw = plano.valorPromocional ?? plano.valor_promocional ?? null
          
          let valorOriginal = parsePrice(valorOriginalRaw)
          let valorPromocional = parsePrice(valorPromocionalRaw)
          
          if (valorOriginal === null && valorPromocional === null) {
            const defaultPrices = getDefaultPrices(plano.nome)
            valorOriginal = defaultPrices.original
            valorPromocional = defaultPrices.promocional
          } else if (valorOriginal === null && valorPromocional !== null) {
            valorOriginal = valorPromocional
          }
          
          return {
            ...plano,
            valorOriginal: valorOriginal,
            valorPromocional: valorPromocional
          }
        })
        .sort((a, b) => {
          const valorA = a.valorPromocional ?? a.valorOriginal ?? 0
          const valorB = b.valorPromocional ?? b.valorOriginal ?? 0
          return valorA - valorB
        })
      
      setPlanos(planosList)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      setPlanos([])
    } finally {
      setLoadingPlanos(false)
    }
  }

  useEffect(() => {
    loadPlanos()
  }, [])

  const [formData, setFormData] = useState({
    email: '',
    telefone: '',
    raioX: '',
    radiografias: '',
    cargo: '',
    pacientes: '',
    informacoes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    showSuccess('Obrigado! Nossa equipe entrará em contato em breve.')
    setShowContactForm(false)
    setFormData({
      email: '',
      telefone: '',
      raioX: '',
      radiografias: '',
      cargo: '',
      pacientes: '',
      informacoes: ''
    })
  }

  // Função para abrir WhatsApp da Nodon
  const handleWhatsApp = () => {
    const phoneNumber = '5511932589622' // Número com código do país (55 = Brasil)
    const message = encodeURIComponent('Olá! Gostaria de falar com um especialista da NODON.')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  // Funcionalidades do sistema
  const funcionalidades = [
    {
      icon: faDollarSign,
      title: 'Precificação de Tratamentos',
      description: 'Calcule custos, margens de lucro e defina preços competitivos com gráficos detalhados',
      color: '#8b5cf6'
    },
    {
      icon: faFileAlt,
      title: 'Diagnósticos com IA',
      description: 'Análise automática de radiografias com detecção de mais de 50 achados radiográficos',
      color: '#0ea5e9'
    },
    {
      icon: faUsers,
      title: 'Gestão de Clientes',
      description: 'Cadastro completo de pacientes com histórico, anamneses e prontuários digitais',
      color: '#10b981'
    },
    {
      icon: faFileInvoiceDollar,
      title: 'Orçamentos Inteligentes',
      description: 'Crie e gerencie orçamentos profissionais com cálculos automáticos e relatórios',
      color: '#f59e0b'
    },
    {
      icon: faCalendarAlt,
      title: 'Agenda e Agendamentos',
      description: 'Gerencie sua agenda, agendamentos e consultas com links públicos para pacientes',
      color: '#ec4899'
    },
    {
      icon: faClipboardQuestion,
      title: 'Anamneses Digitais',
      description: 'Crie questionários personalizados e colete informações dos pacientes de forma digital',
      color: '#06b6d4'
    },
    {
      icon: faComments,
      title: 'Chat IA Especializado',
      description: 'Assistente virtual especializado em odontologia disponível 24/7 para suas dúvidas',
      color: '#14b8a6'
    },
    {
      icon: faComment,
      title: 'Feedback e Avaliações',
      description: 'Colete feedback dos pacientes e gerencie avaliações para melhorar seus serviços',
      color: '#f97316'
    },
    {
      icon: faStickyNote,
      title: 'Anotações Rápidas',
      description: 'Sistema de anotações para registrar informações importantes sobre pacientes e tratamentos',
      color: '#6366f1'
    },
    {
      icon: faChartBar,
      title: 'Dashboard e Analytics',
      description: 'Visualize estatísticas, gráficos e relatórios detalhados sobre sua clínica',
      color: '#3b82f6'
    }
  ]

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="home-navbar">
        <div className="home-nav-container">
          <div className="home-nav-logo">
            <img src={nodoLogo} alt="NODON" className="home-logo-icon" />
            <span className="home-logo-text">NODON</span>
          </div>
          <button 
            className="home-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} size="lg" />
          </button>
          <div className="home-nav-links">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#precificacao">Precificação</a>
            <a href="#diagnosticos">Diagnósticos</a>
            <a href="#chat">Chat IA</a>
            <a href="#planos">Planos</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="home-nav-actions">
            <button className="home-nav-btn-secondary" onClick={() => navigate('/login')}>
              Entrar
            </button>
            <button className="home-nav-btn-primary" onClick={handleWhatsApp}>
              Fale Conosco
            </button>
          </div>
          <div 
            className={`home-mobile-menu-overlay ${mobileMenuOpen ? 'home-mobile-open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`home-mobile-menu-sidebar ${mobileMenuOpen ? 'home-mobile-open' : ''}`}>
            <div className="home-mobile-menu-header">
              <h2 className="home-mobile-menu-title">Menu</h2>
              <button 
                className="home-mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <div className="home-mobile-menu-content">
              <nav className="home-mobile-nav-links">
                <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
                <a href="#precificacao" onClick={() => setMobileMenuOpen(false)}>Precificação</a>
                <a href="#diagnosticos" onClick={() => setMobileMenuOpen(false)}>Diagnósticos</a>
                <a href="#chat" onClick={() => setMobileMenuOpen(false)}>Chat IA</a>
                <a href="#planos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
                <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>
              </nav>
              <div className="home-mobile-menu-actions">
                <button className="home-nav-btn-secondary" onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}>
                  Entrar
                </button>
                <button className="home-nav-btn-primary" onClick={() => {
                  handleWhatsApp()
                  setMobileMenuOpen(false)
                }}>
                  Fale Conosco
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-container">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <span className="home-badge-dot"></span>
              <span>Sistema Completo de Gestão Odontológica</span>
            </div>
            <h1 className="home-hero-title">
              Transforme sua carreira com <span className="home-highlight">Inteligência Artificial</span>
            </h1>
            <p className="home-hero-subtitle">
              Plataforma completa para gestão odontológica com IA avançada para diagnósticos, 
              gestão de pacientes, orçamentos, precificação, agendamentos e muito mais.
            </p>
            <div className="home-hero-buttons">
              <button className="home-btn-hero-primary" onClick={() => navigate('/login')}>
                <FontAwesomeIcon icon={faRocket} style={{ marginRight: '0.5rem' }} />
                Começar Agora
              </button>
              <button className="home-btn-hero-secondary" onClick={handleWhatsApp}>
                <FontAwesomeIcon icon={faMessage} style={{ marginRight: '0.5rem' }} />
                Falar com Especialista
              </button>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="home-nodo-hero-circle">
              <img src={nodoLogo} alt="NODON" className="home-nodo-hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section className="home-funcionalidades-section" id="funcionalidades">
        <div className="home-section-container">
          <div className="home-section-header">
            <h2 className="home-section-title">Todas as Funcionalidades</h2>
            <p className="home-section-description">
              Uma plataforma completa com tudo que você precisa para gerenciar sua clínica odontológica
            </p>
          </div>
          <div className="home-funcionalidades-grid">
            {funcionalidades.map((func, index) => (
              <div key={index} className="home-funcionalidade-card">
                <div className="home-funcionalidade-icon" style={{ color: func.color }}>
                  <FontAwesomeIcon icon={func.icon} size="2x" />
                </div>
                <h3 className="home-funcionalidade-title">{func.title}</h3>
                <p className="home-funcionalidade-description">{func.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precificação Section */}
      <section className="home-precificacao-section" id="precificacao">
        <div className="home-section-container">
          <div className="home-precificacao-content">
            <div className="home-precificacao-header">
              <div className="home-precificacao-icon-wrapper">
                <FontAwesomeIcon icon={faDollarSign} className="home-precificacao-icon" />
              </div>
              <h2 className="home-section-title">Precificação Inteligente de Tratamentos</h2>
              <p className="home-section-description">
                Sistema completo para calcular custos, definir margens de lucro e precificar 
                seus tratamentos de forma profissional e competitiva.
              </p>
            </div>
            <div className="home-precificacao-features">
              <div className="home-precificacao-feature-item">
                <FontAwesomeIcon icon={faChartBar} />
                <h3>Cálculo Automático</h3>
                <p>Calcule automaticamente custos de produtos, materiais e mão de obra</p>
              </div>
              <div className="home-precificacao-feature-item">
                <FontAwesomeIcon icon={faDollarSign} />
                <h3>Margem de Lucro</h3>
                <p>Defina margens de lucro personalizadas e visualize o impacto nos preços</p>
              </div>
              <div className="home-precificacao-feature-item">
                <FontAwesomeIcon icon={faChartLine} />
                <h3>Gráficos e Análises</h3>
                <p>Visualize gráficos detalhados de custos, lucros e rentabilidade</p>
              </div>
              <div className="home-precificacao-feature-item">
                <FontAwesomeIcon icon={faClipboardList} />
                <h3>Gestão Completa</h3>
                <p>Gerencie produtos, categorias e tratamentos em um só lugar</p>
              </div>
            </div>
            <div className="home-precificacao-benefits">
              <div className="home-precificacao-benefit">
                <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                <span>Controle total sobre custos e preços</span>
              </div>
              <div className="home-precificacao-benefit">
                <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                <span>Precificação baseada em dados reais</span>
              </div>
              <div className="home-precificacao-benefit">
                <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                <span>Aumente sua rentabilidade com preços competitivos</span>
              </div>
              <div className="home-precificacao-benefit">
                <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                <span>Relatórios detalhados para tomada de decisão</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosticos Section */}
      <section className="home-diagnosticos-section" id="diagnosticos">
        <div className="home-section-container">
          <div className="home-diagnosticos-content">
            <div className="home-diagnosticos-text">
              <h2 className="home-section-title">Diagnósticos com IA Avançada</h2>
              <p className="home-section-description">
                Nossa inteligência artificial analisa radiografias odontológicas detectando 
                mais de 50 achados radiográficos de forma precisa e detalhada.
              </p>
              <div className="home-diagnosticos-features">
                <div className="home-diagnosticos-feature">
                  <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                  <span>Detecção automática de mais de 50 achados</span>
                </div>
                <div className="home-diagnosticos-feature">
                  <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                  <span>Relatórios detalhados e profissionais</span>
                </div>
                <div className="home-diagnosticos-feature">
                  <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                  <span>Análise em poucos segundos</span>
                </div>
                <div className="home-diagnosticos-feature">
                  <FontAwesomeIcon icon={faCheckCircle} className="home-feature-check" />
                  <span>Demonstrativos com desenhos explicativos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section className="home-chat-section" id="chat">
        <div className="home-section-container">
          <div className="home-chat-content">
            <div className="home-chat-header">
              <div className="home-chat-icon-wrapper">
                <FontAwesomeIcon icon={faComments} className="home-chat-icon" />
              </div>
              <h2 className="home-section-title">Chat IA Especializado em Odontologia</h2>
              <p className="home-section-description">
                Assistente virtual disponível 24/7 para tirar dúvidas sobre procedimentos, 
                técnicas, materiais e muito mais.
              </p>
            </div>
            <div className="home-chat-features">
              <div className="home-chat-feature-item">
                <FontAwesomeIcon icon={faBolt} />
                <span>Respostas instantâneas</span>
              </div>
              <div className="home-chat-feature-item">
                <FontAwesomeIcon icon={faRobot} />
                <span>IA especializada em odontologia</span>
              </div>
              <div className="home-chat-feature-item">
                <FontAwesomeIcon icon={faSearch} />
                <span>Explicações precisas e detalhadas</span>
              </div>
            </div>
            <div className="home-chat-disclaimer">
              <FontAwesomeIcon icon={faShieldAlt} />
              <p>
                O NODON deve servir como <strong>apoio ao profissional</strong>. 
                A decisão final deve ser sempre do <strong>responsável</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="home-stats-section">
        <div className="home-stats-container">
          <div className="home-stat-item">
            <div className="home-stat-number">+ 50.000</div>
            <div className="home-stat-label">Radiografias analisadas</div>
          </div>
          <div className="home-stat-divider"></div>
          <div className="home-stat-item">
            <div className="home-stat-number">+ 50M</div>
            <div className="home-stat-label">Tokens no chat</div>
          </div>
          <div className="home-stat-divider"></div>
          <div className="home-stat-item">
            <div className="home-stat-number">100%</div>
            <div className="home-stat-label">Online e acessível</div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="home-plans-section" id="planos">
        <div className="home-section-container">
          <div className="home-section-header">
            <h2 className="home-section-title">Escolha o plano ideal para sua clínica</h2>
            <p className="home-section-description">
              Planos flexíveis que se adaptam às necessidades da sua clínica
            </p>
          </div>
          {loadingPlanos ? (
            <div className="home-plans-loading">
              <div className="home-loading-spinner"></div>
              <p>Carregando planos...</p>
            </div>
          ) : planos.length === 0 ? (
            <div className="home-plans-empty">
              <p>Nenhum plano disponível no momento.</p>
            </div>
          ) : (
            <div className="home-plans-grid">
              {planos.map((plano, index) => {
                const planoId = plano.id || plano.nome?.toLowerCase().replace(/\s+/g, '-') || `plano-${index}`
                const nomePlano = plano.nome || 'Plano'
                const valorOriginal = plano.valorOriginal !== null && plano.valorOriginal !== undefined ? plano.valorOriginal : null
                const valorPromocional = plano.valorPromocional !== null && plano.valorPromocional !== undefined ? plano.valorPromocional : null
                const limiteAnalises = plano.limiteAnalises || plano.limite_analises || 0
                const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat || '0'
                const temPromocao = valorPromocional !== null && valorPromocional > 0 && valorOriginal !== null && valorPromocional < valorOriginal
                const badge = plano.badge || plano.label || null
                const featured = plano.featured || plano.destaque || false
                const acesso = plano.acesso || null
                const isPlanoChat = acesso === 'chat' || nomePlano.toLowerCase().includes('chat')
                const isPlanoInicial = nomePlano.toLowerCase().includes('inicial')
                
                const formatarValor = (valor) => {
                  return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(valor)
                }
                
                const formatarTokens = (tokens) => {
                  const numTokens = parseInt(tokens) || 0
                  if (numTokens >= 1000000) {
                    return `${(numTokens / 1000000).toFixed(1)} Milhõe ${numTokens > 1000000 ? 's' : ''}`
                  } else if (numTokens >= 1000) {
                    return `${(numTokens / 1000).toFixed(0)} mil`
                  }
                  return numTokens.toString()
                }
                
                const featuresList = []
                
                if (isPlanoChat) {
                  if (tokenChat && parseInt(tokenChat) > 0) {
                    featuresList.push(`${formatarTokens(tokenChat)} de tokens`)
                  }
                  featuresList.push('Chat especializado em odontologia 24/7')
                  featuresList.push('IA treinada especificamente para odontologia')
                  featuresList.push('Tire dúvidas sobre diagnósticos e tratamentos')
                  featuresList.push('Suporte para técnicas odontológicas')
                  featuresList.push('Acesso mobile')
                  featuresList.push('Sem fidelidade - cancele quando quiser')
                } else if (isPlanoInicial) {
                  featuresList.push('Diagnósticos com IA avançada')
                  featuresList.push(`Até ${limiteAnalises || 12} análises por mês`)
                  featuresList.push('Agendamento de consultas')
                  featuresList.push('Anamneses personalizadas')
                  featuresList.push('Chat especializado em odontologia 24/7')
                  featuresList.push('Precificação de tratamentos')
                  featuresList.push('Feedbacks e avaliações')
                  featuresList.push('Gráficos customizados')
                  featuresList.push('Gestão completa de pacientes')
                  featuresList.push('Relatórios detalhados')
                  featuresList.push('Armazenamento ilimitado na nuvem')
                  if (tokenChat && parseInt(tokenChat) > 0) {
                    featuresList.push(`${formatarTokens(tokenChat)} de tokens`)
                  }
                  featuresList.push('Acesso mobile completo')
                  featuresList.push('Sem fidelidade - cancele quando quiser')
                } else {
                  featuresList.push('Diagnósticos com IA avançada')
                  if (limiteAnalises > 0) {
                    featuresList.push(`Até ${limiteAnalises} análises por mês`)
                  } else {
                    featuresList.push('Análises ilimitadas')
                  }
                  featuresList.push('Agendamento de consultas')
                  featuresList.push('Anamneses personalizadas')
                  featuresList.push('Chat especializado em odontologia 24/7')
                  featuresList.push('Precificação de tratamentos')
                  featuresList.push('Feedbacks e avaliações')
                  featuresList.push('Gráficos customizados')
                  featuresList.push('Gestão completa de pacientes')
                  featuresList.push('Relatórios detalhados')
                  featuresList.push('Armazenamento ilimitado na nuvem')
                  if (tokenChat && parseInt(tokenChat) > 0) {
                    featuresList.push(`${formatarTokens(tokenChat)} de tokens`)
                  }
                  featuresList.push('Acesso mobile completo')
                  featuresList.push('Sem fidelidade - cancele quando quiser')
                  
                  if (plano.features && Array.isArray(plano.features)) {
                    featuresList.push(...plano.features)
                  } else if (plano.caracteristicas && Array.isArray(plano.caracteristicas)) {
                    featuresList.push(...plano.caracteristicas)
                  }
                }
                
                return (
                  <div key={planoId} className={`home-plan-card ${featured ? 'home-featured' : ''}`}>
                    {badge && (
                      <div className="home-plan-badge">{badge}</div>
                    )}
                    <div className="home-plan-header">
                      <h3>{nomePlano}</h3>
                      <div className="home-plan-price">
                        {temPromocao && valorPromocional && valorOriginal ? (
                          <>
                            <span className="home-price-old">De: {formatarValor(valorOriginal)}/mês*</span>
                            <span className="home-price-new">Por: {formatarValor(valorPromocional)}/mês*</span>
                          </>
                        ) : valorPromocional !== null && valorPromocional > 0 ? (
                          <span className="home-price-single">{formatarValor(valorPromocional)}/mês*</span>
                        ) : valorOriginal !== null && valorOriginal > 0 ? (
                          <span className="home-price-single">{formatarValor(valorOriginal)}/mês*</span>
                        ) : (
                          <span className="home-price-single">{formatarValor(valorOriginal || 0)}/mês*</span>
                        )}
                      </div>
                      <div className="home-plan-feature-count">
                        {plano.descricao || (limiteAnalises > 0 ? `Até ${limiteAnalises} análises por mês` : 'Análises ilimitadas')}
                      </div>
                      <div className="home-plan-free-trial">
                        <FontAwesomeIcon icon={faGift} />
                        <span>7 dias grátis para você</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="home-plan-details-btn" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePlanToggle(planoId)
                      }}
                    >
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`home-plan-chevron ${expandedPlan === planoId ? 'home-expanded' : ''}`}
                      />
                    </button>
                    <div className={expandedPlan === planoId ? 'home-plan-details home-expanded' : 'home-plan-details'}>
                      <ul className="home-plan-features">
                        {featuresList.length > 0 ? (
                          featuresList.map((feature, idx) => (
                            <li key={idx}>
                              <FontAwesomeIcon icon={faCheckCircle} /> {feature}
                            </li>
                          ))
                        ) : (
                          <>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Análise de radiografias</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Relatórios detalhados</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Suporte por email</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Armazenamento na nuvem</li>
                            {tokenChat && (
                              <li><FontAwesomeIcon icon={faCheckCircle} /> {formatarTokens(tokenChat)} de tokens no chat</li>
                            )}
                          </>
                        )}
                      </ul>
                    </div>
                    <button 
                      className={`home-btn-plan ${featured ? 'home-featured' : ''}`} 
                      onClick={() => navigate(`/checkout?plano=${encodeURIComponent(nomePlano)}&planoId=${planoId}`)}
                    >
                      Assine Agora
                    </button>
                    <p className="home-plan-note">*Plano mensal. Cobrança recorrente com renovação automática.</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Important Info Section */}
      <section className="home-important-info">
        <div className="home-section-container">
          <div className="home-section-header">
            <h2 className="home-section-title">O que é importante saber?</h2>
          </div>
          <div className="home-info-grid">
            <div className="home-info-card">
              <div className="home-info-icon-wrapper">
                <FontAwesomeIcon icon={faComments} className="home-info-icon" size="2x" />
              </div>
              <h3>Suporte humanizado</h3>
              <p>Equipe de especialistas disponível via WhatsApp.</p>
            </div>
            <div className="home-info-card">
              <div className="home-info-icon-wrapper">
                <FontAwesomeIcon icon={faShieldAlt} className="home-info-icon" size="2x" />
              </div>
              <h3>Confiável</h3>
              <p>Dados criptografados e em conformidade com a LGPD.</p>
            </div>
            <div className="home-info-card">
              <div className="home-info-icon-wrapper">
                <FontAwesomeIcon icon={faUsers} className="home-info-icon" size="2x" />
              </div>
              <h3>Profissionais ilimitados</h3>
              <p>Adicione quantos profissionais quiser sem custo adicional.</p>
            </div>
            <div className="home-info-card">
              <div className="home-info-icon-wrapper">
                <FontAwesomeIcon icon={faCloud} className="home-info-icon" size="2x" />
              </div>
              <h3>Armazenamento ilimitado</h3>
              <p>Nuvem com espaço ilimitado para seus dados.</p>
            </div>
            <div className="home-info-card">
              <div className="home-info-icon-wrapper">
                <FontAwesomeIcon icon={faMessage} className="home-info-icon" size="2x" />
              </div>
              <h3>Chat especializado</h3>
              <p>IA especializada em odontologia disponível 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="home-faq-section">
        <div className="home-section-container">
          <div className="home-section-header">
            <h2 className="home-section-title">Perguntas Frequentes</h2>
          </div>
          <div className="home-faq-list">
            <div className={`home-faq-item ${expandedFaq === 0 ? 'home-expanded' : ''}`}>
              <button 
                className="home-faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 0 ? null : 0)}
              >
                <h3>Como funciona a análise de radiografias?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="home-faq-icon"
                />
              </button>
              <div className="home-faq-answer">
                <p>Nossa IA analisa radiografias em segundos, detectando mais de 50 achados radiográficos diferentes de forma precisa e detalhada. O sistema identifica problemas, anomalias e fornece relatórios completos.</p>
              </div>
            </div>
            <div className={`home-faq-item ${expandedFaq === 1 ? 'home-expanded' : ''}`}>
              <button 
                className="home-faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
              >
                <h3>Os dados dos pacientes são seguros?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="home-faq-icon"
                />
              </button>
              <div className="home-faq-answer">
                <p>Sim, todos os dados são criptografados e armazenados em conformidade com a LGPD. Temos registro na ANVISA e seguimos os mais altos padrões de segurança.</p>
              </div>
            </div>
            <div className={`home-faq-item ${expandedFaq === 2 ? 'home-expanded' : ''}`}>
              <button 
                className="home-faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
              >
                <h3>Posso adicionar múltiplos profissionais?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="home-faq-icon"
                />
              </button>
              <div className="home-faq-answer">
                <p>Sim, você pode adicionar quantos profissionais quiser na conta da sua clínica, sem custo adicional. Cada profissional terá acesso individualizado à plataforma.</p>
              </div>
            </div>
            <div className={`home-faq-item ${expandedFaq === 3 ? 'home-expanded' : ''}`}>
              <button 
                className="home-faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 3 ? null : 3)}
              >
                <h3>Preciso de equipamento especial?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="home-faq-icon"
                />
              </button>
              <div className="home-faq-answer">
                <p>Não, a plataforma é 100% online e pode ser acessada de qualquer dispositivo com internet: computador, tablet, celular ou smart TV.</p>
              </div>
            </div>
            <div className={`home-faq-item ${expandedFaq === 4 ? 'home-expanded' : ''}`}>
              <button 
                className="home-faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
              >
                <h3>Como faço para começar?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="home-faq-icon"
                />
              </button>
              <div className="home-faq-answer">
                <p>É simples! Basta se cadastrar, escolher um plano e começar a usar. Nossa equipe está pronta para ajudar você a aproveitar ao máximo a plataforma.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="home-contact-section" id="contato">
        <div className="home-section-container">
          <div className="home-section-header">
            <h2 className="home-section-title">Fale conosco</h2>
            <p className="home-section-description">
              Quer saber como você pode transformar sua clínica usando inteligência artificial?
            </p>
          </div>
          {!showContactForm ? (
            <div className="home-contact-cta">
              <button className="home-btn-contact-primary" onClick={() => setShowContactForm(true)}>
                <FontAwesomeIcon icon={faMessage} style={{ marginRight: '0.5rem' }} />
                Iniciar conversa
              </button>
            </div>
          ) : (
            <form className="home-contact-form" onSubmit={handleSubmit}>
              <div className="home-form-row">
                <div className="home-form-group">
                  <label>E-mail *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="home-form-group">
                  <label>Telefone *</label>
                  <input 
                    type="tel" 
                    value={formData.telefone} 
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
              <div className="home-form-row">
                <div className="home-form-group">
                  <label>Você possui aparelho de raio-X em sua clínica?</label>
                  <select 
                    value={formData.raioX} 
                    onChange={(e) => setFormData({...formData, raioX: e.target.value})}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="nao">Não</option>
                    <option value="sensor">Somente sensor digital</option>
                    <option value="panoramico">Somente aparelho de raio-X panorâmico</option>
                    <option value="ambos">Sensor digital e aparelho de raio-X panorâmico</option>
                  </select>
                </div>
                <div className="home-form-group">
                  <label>Você pede radiografias panorâmicas ou periapicais na avaliação inicial?</label>
                  <select 
                    value={formData.radiografias} 
                    onChange={(e) => setFormData({...formData, radiografias: e.target.value})}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="nao">Não</option>
                    <option value="periapical">Sim, periapical</option>
                    <option value="panoramica">Sim, panorâmica</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
              </div>
              <div className="home-form-row">
                <div className="home-form-group">
                  <label>Qual seu cargo?</label>
                  <select 
                    value={formData.cargo} 
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="clinico">Clínico Geral</option>
                    <option value="avaliador">Avaliador</option>
                    <option value="gestor">Gestor</option>
                    <option value="radiologista">Radiologista</option>
                    <option value="estudante">Estudante</option>
                  </select>
                </div>
                <div className="home-form-group">
                  <label>Quantos novos pacientes você atende por mês?</label>
                  <select 
                    value={formData.pacientes} 
                    onChange={(e) => setFormData({...formData, pacientes: e.target.value})}
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="ate10">Até 10 novos pacientes</option>
                    <option value="10-25">de 10 a 25 novos pacientes</option>
                    <option value="25-50">de 25 a 50 novos pacientes</option>
                    <option value="50-100">de 50 a 100 novos pacientes</option>
                    <option value="100-200">de 100 a 200 novos pacientes</option>
                    <option value="mais200">mais de 200 novos pacientes</option>
                  </select>
                </div>
              </div>
              <div className="home-form-group home-full-width">
                <label>Informações adicionais (opcional)</label>
                <textarea 
                  value={formData.informacoes} 
                  onChange={(e) => setFormData({...formData, informacoes: e.target.value})}
                  rows="4"
                  placeholder="Conte-nos mais sobre suas necessidades..."
                />
              </div>
              <div className="home-form-actions">
                <button type="submit" className="home-btn-submit">
                  Enviar
                </button>
                <button type="button" className="home-btn-cancel" onClick={() => setShowContactForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-container">
          <div className="home-footer-logo-section">
            <div className="home-footer-logo">
              <img src={nodoLogo} alt="NODON" className="home-footer-logo-icon" />
              <span className="home-footer-logo-text">NODON</span>
            </div>
          </div>
          <div className="home-footer-section">
            <h4>Institucional</h4>
            <ul>
              <li><a href="#funcionalidades">Funcionalidades</a></li>
              <li><a href="#precificacao">Precificação</a></li>
              <li><a href="#diagnosticos">Diagnósticos</a></li>
              <li><a href="#chat">Chat IA</a></li>
              <li><a href="#planos">Planos</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </div>
          <div className="home-footer-section">
            <h4>Fale Conosco</h4>
            <p>Av. Paulista, 2173<br />São Paulo - SP</p>
          </div>
          <div className="home-footer-section">
            <h4>Redes sociais</h4>
            <div className="home-social-links">
              <a href="#" className="home-social-link">
                <FontAwesomeIcon icon={faInstagram} style={{ marginRight: '0.5rem' }} />
                Instagram
              </a>
              <a href="#" className="home-social-link">
                <FontAwesomeIcon icon={faYoutube} style={{ marginRight: '0.5rem' }} />
                YouTube
              </a>
            </div>
          </div>
          <div className="home-footer-bottom">
            <p>NODON DIAGNOSTICO POR IMAGEM LTDA - ME - CNPJ 41.300.720/0001-50</p>
            <p><a href="#">Termos de Uso e Política de Privacidade</a></p>
          </div>
        </div>
      </footer>

      {/* Modal de Alerta */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  )
}

export default Home
