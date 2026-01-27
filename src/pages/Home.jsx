import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBars, faTimes, faMessage, faRocket, 
  faChartBar, faSearch, faBolt, faMapMarkerAlt,
  faCamera, faRobot, faClipboardList, faLaptop,
  faMobileAlt, faTv, faDesktop, faUserMd, faUsers,
  faCheckCircle, faComments, faShieldAlt, faCloud,
  faChevronDown, faTrophy, faStar
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import nodoLogo from '../img/nodo.png'
import nodoImage from '../img/nodo.png'
import exameImage from '../img/exame.jpg'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const { alertConfig, showSuccess, hideAlert } = useAlert()
  const [showContactForm, setShowContactForm] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [isChatVisible, setIsChatVisible] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const chatSectionRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  
  // Função para obter o horário atual
  const getCurrentTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const [chatMessages, setChatMessages] = useState([
    { 
      type: 'user', 
      text: 'No que você pode me ajudar?', 
      time: getCurrentTime(),
      visible: false
    },
    { 
      type: 'ai', 
      text: 'Posso te ajudar com assuntos do seu dia a dia sobre Odontologia! Desde dúvidas sobre procedimentos, explicações para pacientes, até orientações sobre materiais e técnicas. Estou aqui para facilitar seu trabalho! 😊', 
      time: getCurrentTime(),
      visible: false
    },
    { 
      type: 'user', 
      text: 'Que bacana! E quando posso começar?', 
      time: getCurrentTime(),
      visible: false
    },
    { 
      type: 'ai', 
      text: 'É fácil! É só você nos contratar que iniciaremos juntos. Você terá acesso imediato a diagnticos e realtorios precisos e auxilio personlaizado 🚀', 
      time: getCurrentTime(),
      visible: false
    }
  ])

  const handlePlanToggle = (planId) => {
    setExpandedPlan(prev => {
      // Se o plano clicado já está expandido, colapsa
      if (prev === planId) {
        return null;
      }
      // Caso contrário, expande apenas o plano clicado
      return planId;
    });
  }

  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      // Garantir que sempre usamos /api/planos
      // Se o baseURL já termina com /api, usar apenas /planos, senão usar /api/planos
      const baseURL = api.defaults.baseURL || ''
      const endpoint = baseURL.endsWith('/api') ? '/planos' : '/api/planos'
      console.log('Base URL:', baseURL)
      console.log('Endpoint usado:', endpoint)
      const response = await api.get(endpoint)
      console.log('URL completa:', response.config?.baseURL + response.config?.url)
      const data = response.data?.data || response.data
      
      // A estrutura pode variar, então vamos tratar diferentes formatos
      let planosList = []
      if (Array.isArray(data)) {
        planosList = data
      } else if (data?.planos) {
        planosList = data.planos
      } else if (data?.plans) {
        planosList = data.plans
      }
      
      // Filtrar apenas planos ativos e ordenar por ordem ou valor
      planosList = planosList
        .filter(plano => plano.ativo !== false)
        .sort((a, b) => {
          // Ordenar por valor promocional ou original
          const valorA = parseFloat(a.valorPromocional || a.valorOriginal || a.valor || 0)
          const valorB = parseFloat(b.valorPromocional || b.valorOriginal || b.valor || 0)
          return valorA - valorB
        })
      
      setPlanos(planosList)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      // Em caso de erro, manter array vazio ou usar planos padrão
      setPlanos([])
    } finally {
      setLoadingPlanos(false)
    }
  }

  useEffect(() => {
    loadPlanos()
  }, [])

  useEffect(() => {
    let rafId = null
    let lastScrollTime = 0
    const throttleDelay = 16 // ~60fps

    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime < throttleDelay) {
        return
      }
      lastScrollTime = now

      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        if (!chatSectionRef.current) return

        const section = chatSectionRef.current
        const rect = section.getBoundingClientRect()
        const windowHeight = window.innerHeight
        
        // Verifica se a seção está visível
        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsChatVisible(true)
          
          // Calcula o progresso do scroll dentro da seção de forma mais suave
          const sectionTop = rect.top
          const sectionHeight = rect.height
          const triggerPoint = windowHeight * 0.7 // Inicia quando 70% da viewport
          
          // Progresso suave baseado na posição da seção
          let progress = 0
          if (sectionTop <= triggerPoint) {
            // Seção passou do ponto de trigger
            const scrolled = triggerPoint - sectionTop
            const scrollRange = sectionHeight * 0.6 // 60% da altura da seção para completar
            progress = Math.min(1, scrolled / scrollRange)
          }
          
          progress = Math.min(1, Math.max(0, progress))
          setScrollProgress(progress)
          
          // Mostra mensagens baseado no progresso de forma mais fluida
          const currentTime = getCurrentTime()
          const totalMessages = chatMessages.length
          
          // Cada mensagem aparece em incrementos suaves
          // Progresso de 0 a 1 mapeado para 0 a totalMessages
          const messagesToShow = progress * totalMessages
          
          setChatMessages((prev) => {
            const updated = prev.map((msg, index) => {
              // Usa um threshold mais suave para cada mensagem
              const messageThreshold = (index + 0.3) / totalMessages
              
              if (progress >= messageThreshold && !msg.visible) {
                // Atualizar horário quando a mensagem aparecer
                let messageTime = currentTime
                if (index > 0) {
                  const timeParts = currentTime.split(':')
                  const minutes = parseInt(timeParts[1]) + index
                  const hours = parseInt(timeParts[0]) + Math.floor(minutes / 60)
                  const finalMinutes = minutes % 60
                  messageTime = `${String(hours % 24).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`
                }
                
                return {
                  ...msg,
                  visible: true,
                  time: messageTime
                }
              }
              return msg
            })
            return updated
          })
          
          // Mostrar indicador de digitação quando a penúltima mensagem está prestes a aparecer
          const penultimateThreshold = (chatMessages.length - 1.5) / chatMessages.length
          if (progress >= penultimateThreshold && progress < 0.95) {
            setIsTyping(true)
          } else if (progress >= 0.95) {
            setIsTyping(false)
          }
        } else {
          setIsChatVisible(false)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Chama uma vez para verificar o estado inicial

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [chatMessages])
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

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="top-navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <img src={nodoLogo} alt="NODON" className="logo-icon" />
            <span className="logo-text">NODON</span>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} size="lg" />
          </button>
          <div className="nav-links">
            <a href="#solucao">Solução</a>
            <a href="#diagnosticos">Diagnósticos</a>
            <a href="#chat">Chat</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#planos">Planos</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="nav-actions">
            <button className="nav-btn-secondary" onClick={() => navigate('/login')}>
              Área do Assinante
            </button>
            <button className="nav-btn-primary" onClick={() => setShowContactForm(true)}>
              Fale com um especialista
            </button>
          </div>
          <div 
            className={`mobile-menu-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`mobile-menu-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="mobile-menu-header">
              <h2 className="mobile-menu-title">Menu</h2>
              <button 
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <div className="mobile-menu-content">
              <nav className="mobile-nav-links">
                <a href="#solucao" onClick={() => setMobileMenuOpen(false)}>Solução</a>
                <a href="#diagnosticos" onClick={() => setMobileMenuOpen(false)}>Diagnósticos</a>
                <a href="#chat" onClick={() => setMobileMenuOpen(false)}>Chat</a>
                <a href="#depoimentos" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
                <a href="#planos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
                <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>
              </nav>
              <div className="mobile-menu-actions">
                <button className="nav-btn-secondary" onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}>
                  Área do Assinante
                </button>
                <button className="nav-btn-primary" onClick={() => {
                  setShowContactForm(true)
                  setMobileMenuOpen(false)
                }}>
                  Fale com um especialista
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="hero-section" 
        id="inicio"
      >
        {/* Spotlight overlays - circular lanterns moving across the image */}
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Online</span>
            </div>
            <h1 className="hero-title">
              Consiga mais tratamentos, deixando a comunicação com os clientes mais <span className="highlight">SIMPLES e INTUITIVA.</span>
            </h1>
            <p className="hero-subtitle">
              Não fique para trás, conquiste a confiança dos seus pacientes e aumente a sua produtividade com a IA NODON.
            </p>
            <div className="hero-buttons">
              <button className="btn-hero-primary" onClick={() => setShowContactForm(true)}>
                <FontAwesomeIcon icon={faMessage} style={{ marginRight: '0.5rem' }} />
                Fale com um especialista
              </button>
              <button className="btn-hero-secondary" onClick={() => navigate('/login')}>
                <FontAwesomeIcon icon={faRocket} style={{ marginRight: '0.5rem' }} />
                Faça um Tour
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-container">
              <div className="floating-card card-1">
                <div className="card-icon">
                  <FontAwesomeIcon icon={faChartBar} size="2x" />
                </div>
                <div className="card-text">Análise Inteligente</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">
                  <FontAwesomeIcon icon={faSearch} size="2x" />
                </div>
                <div className="card-text">Detecção Precisa</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">
                  <FontAwesomeIcon icon={faBolt} size="2x" />
                </div>
                <div className="card-text">Resultados Rápidos</div>
              </div>
              <div className="floating-card card-4">
                <div className="card-icon">
                  <FontAwesomeIcon icon={faMessage} size="2x" />
                </div>
                <div className="card-text">Chat Especializado</div>
              </div>
              <div className="nodo-hero-circle">
                <div className="nodo-hero">
                  <img src={nodoImage} alt="NODON" className="nodo-hero-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="what-we-do-section" id="diagnosticos">
        <div className="section-container">
          <div className="what-we-do-content">
            <div className="what-we-do-header">
              <h2 className="what-we-do-title">O que fazemos ?</h2>
              <p className="what-we-do-description">
                Utilizamos inteligência artificial avançada para analisar radiografias odontológicas, 
                detectando mais de 50 achados radiográficos de forma precisa e detalhada.
              </p>
            </div>
            <div className="what-we-do-image-wrapper">
              <img src={exameImage} alt="Análise de radiografia odontológica com IA" className="what-we-do-image" />
              <div className="image-overlay">
                <div className="overlay-content">
                  <FontAwesomeIcon icon={faRobot} className="overlay-icon" />
                  <p className="overlay-text">Análise e demonstrativo com desenhos</p>
                </div>
              </div>
            </div>
            <div className="what-we-do-features">
              <div className="what-we-do-feature">
                <FontAwesomeIcon icon={faSearch} className="feature-icon" />
                <h3>Detecção Precisa</h3>
                <p>Identifica mais de 50 achados radiográficos automaticamente</p>
              </div>
              <div className="what-we-do-feature">
                <FontAwesomeIcon icon={faClipboardList} className="feature-icon" />
                <h3>Relatórios Detalhados</h3>
                <p>Gera relatórios completos e profissionais para seus pacientes</p>
              </div>
              <div className="what-we-do-feature">
                <FontAwesomeIcon icon={faBolt} className="feature-icon" />
                <h3>Resultados Rápidos</h3>
                <p>Análise completa em poucos segundos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section className="chat-highlight-section" ref={chatSectionRef} id="chat">
        <div className="section-container">
          <div className="chat-highlight-content">
            <div className="award-badge">
              <FontAwesomeIcon icon={faTrophy} className="award-icon" />
              <span className="award-text">Prêmio de Excelência</span>
            </div>
            <div className="chat-highlight-header">
              <div className="chat-highlight-icon-wrapper">
                <div className="chat-highlight-icon-orb"></div>
                <div className="chat-highlight-icon-ring"></div>
                <div className="stars-decoration">
                  <FontAwesomeIcon icon={faStar} className="star star-1" />
                  <FontAwesomeIcon icon={faStar} className="star star-2" />
                  <FontAwesomeIcon icon={faStar} className="star star-3" />
                </div>
                <FontAwesomeIcon icon={faMessage} className="chat-highlight-icon" />
              </div>
              <h2 className="chat-highlight-title">
                O melhor chat Inteligente para Odontologia
              </h2>
            </div>
            
            {/* Chat Simulation */}
            <div className={`chat-simulation ${isChatVisible ? 'visible' : ''}`}>
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`chat-message ${msg.type} ${msg.visible ? 'show' : ''}`}
                    style={{ animationDelay: `${index * 0.8}s` }}
                  >
                    <div className="message-avatar">
                      {msg.type === 'user' ? (
                        <FontAwesomeIcon icon={faUserMd} />
                      ) : (
                        <img src={nodoLogo} alt="NODON" className="chat-avatar-logo" />
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{msg.time}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-message ai typing">
                    <div className="message-avatar">
                      <img src={nodoLogo} alt="NODON" className="chat-avatar-logo" />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="chat-disclaimer">
              <div className="disclaimer-icon">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <p className="disclaimer-text">
                O NODON deve servir como <strong>apoio ao profissional</strong>. A decisão final deve ser sempre do <strong>responsável</strong>.
              </p>
            </div>

            <div className="chat-highlight-features">
              <div className="chat-feature-item">
                <div className="chat-feature-icon">
                  <FontAwesomeIcon icon={faBolt} />
                </div>
                <span>Respostas instantâneas</span>
              </div>
              <div className="chat-feature-item">
                <div className="chat-feature-icon">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <span>IA especializada</span>
              </div>
              <div className="chat-feature-item">
                <div className="chat-feature-icon">
                  <FontAwesomeIcon icon={faSearch} />
                </div>
                <span>Explicações precisas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number" data-count="0">+ 50000</div>
            <div className="stat-label">Radiografias analisadas</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number" data-count="0">+ 50M</div>
            <div className="stat-label">Tokens no chat</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-map">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="map-icon" size="lg" />
            <div className="map-text">Presença em todo Brasil</div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-section" id="solucao">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Como Funciona?</h2>
            <p className="section-description">
              Acreditamos em uma <strong>odontologia onde o paciente compreende</strong> o diagnóstico e o plano de tratamento com clareza.
            </p>
          </div>

          <div className="solution-grid">
            <div className="solution-card">
              <div className="solution-icon">
                <FontAwesomeIcon icon={faCamera} size="3x" />
              </div>
              <h3>1. Envie a Radiografia</h3>
              <p>Faça upload da radiografia do paciente através da nossa plataforma segura e intuitiva.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <FontAwesomeIcon icon={faRobot} size="3x" />
              </div>
              <h3>2. IA Analisa</h3>
              <p>Nossa inteligência artificial processa a imagem em segundos, identificando mais de 50 achados diferentes.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon">
                <FontAwesomeIcon icon={faClipboardList} size="3x" />
              </div>
              <h3>3. Receba o Relatório</h3>
              <p>Obtenha um relatório detalhado e interativo que facilita a explicação para o paciente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="depoimentos">
        <div className="section-container">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">
                Acreditamos em uma odontologia onde o paciente compreende o diagnóstico e o plano de tratamento com clareza.
              </p>
              <div className="testimonial-author">
                <div className="author-info">
                  <div className="author-name">Dr. Rafael Oliveira</div>
                  <div className="author-role">Murai Odontologia</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section className="access-section">
        <div className="section-container">
          <div className="access-content">
            <div className="access-text">
              <h2>É fácil acessar</h2>
            <div className="access-feature">
              <div className="feature-icon-large">
                <FontAwesomeIcon icon={faLaptop} size="4x" />
              </div>
              <h3>100% Online</h3>
              <p>
                Acesse as radiografias dos seus pacientes de <strong>qualquer dispositivo</strong> com acesso à internet: tablet, celular, smart TV ou computador.
              </p>
            </div>
          </div>
          <div className="access-devices">
            <div className="device device-1">
              <FontAwesomeIcon icon={faMobileAlt} size="3x" />
            </div>
            <div className="device device-2">
              <FontAwesomeIcon icon={faLaptop} size="3x" />
            </div>
            <div className="device device-3">
              <FontAwesomeIcon icon={faTv} size="3x" />
            </div>
            <div className="device device-4">
              <FontAwesomeIcon icon={faDesktop} size="3x" />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Leaders Section */}
      <section className="leaders-section">
        <div className="section-container">
          <h2 className="leaders-title">Junte-se aos líderes em Odontologia do Brasil</h2>
          <div className="leaders-grid">
            <div className="leader-card">
              <div className="leader-avatar">
                <FontAwesomeIcon icon={faUserMd} size="3x" />
              </div>
              <div className="leader-name">Dr. Lucas Ferreira</div>
              <div className="leader-clinic">Clínica OdontoPlus</div>
            </div>
            <div className="leader-card">
              <div className="leader-avatar">
                <FontAwesomeIcon icon={faUserMd} size="3x" />
              </div>
              <div className="leader-name">Dra. Mariana Alves</div>
              <div className="leader-clinic">Smile Dental</div>
            </div>
            <div className="leader-card">
              <div className="leader-avatar">
                <FontAwesomeIcon icon={faUserMd} size="3x" />
              </div>
              <div className="leader-name">Dr. Gabriel Martins</div>
              <div className="leader-clinic">Odonto Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="plans-section" id="planos">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Escolha o plano mais adequado para a sua clínica.</h2>
          </div>
          {loadingPlanos ? (
            <div className="plans-loading">
              <div className="loading-spinner"></div>
              <p>Carregando planos...</p>
            </div>
          ) : planos.length === 0 ? (
            <div className="plans-empty">
              <p>Nenhum plano disponível no momento.</p>
            </div>
          ) : (
            <div className="plans-grid">
              {planos.map((plano, index) => {
                const planoId = plano.id || plano.nome?.toLowerCase().replace(/\s+/g, '-') || `plano-${index}`
                const nomePlano = plano.nome || 'Plano'
                const valorOriginal = parseFloat(plano.valorOriginal || plano.valor || 0)
                const valorPromocional = parseFloat(plano.valorPromocional || 0)
                const limiteAnalises = plano.limiteAnalises || plano.limite_analises || 0
                const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat || '0'
                const temPromocao = valorPromocional > 0 && valorPromocional < valorOriginal
                const badge = plano.badge || plano.label || null
                const featured = plano.featured || plano.destaque || false
                const acesso = plano.acesso || null
                const isPlanoChat = acesso === 'chat' || nomePlano.toLowerCase().includes('chat')
                
                // Formatar valores monetários
                const formatarValor = (valor) => {
                  return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(valor)
                }
                
                // Formatar tokens
                const formatarTokens = (tokens) => {
                  const numTokens = parseInt(tokens) || 0
                  if (numTokens >= 1000000) {
                    return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`
                  } else if (numTokens >= 1000) {
                    return `${(numTokens / 1000).toFixed(0)} mil`
                  }
                  return numTokens.toString()
                }
                
                // Construir features baseadas nos dados do plano
                const featuresList = []
                
                // Se for Plano Chat, mostrar apenas features específicas
                if (isPlanoChat) {
                  if (tokenChat && parseInt(tokenChat) > 0) {
                    featuresList.push(`${formatarTokens(tokenChat)} de tokens no chat da NODON`)
                  }
                  featuresList.push('Suporte por email')
                  featuresList.push('Armazenamento na nuvem')
                } else {
                  // Para outros planos, adicionar features padrão
                  featuresList.push('Análise de radiografias')
                  featuresList.push('Relatórios detalhados')
                  
                  // Usar descricao da API se disponível, senão construir baseado em limiteAnalises
                  if (plano.descricao) {
                    featuresList.push(plano.descricao)
                  } else if (limiteAnalises > 0) {
                    featuresList.push(`Até ${limiteAnalises} análises por mês`)
                  } else {
                    featuresList.push('Análises ilimitadas')
                  }
                  
                  if (tokenChat && parseInt(tokenChat) > 0) {
                    featuresList.push(`${formatarTokens(tokenChat)} de tokens no chat da NODON`)
                  }
                  
                  featuresList.push('Suporte por email')
                  featuresList.push('Armazenamento na nuvem')
                  
                  // Se houver features adicionais da API, adicionar
                  if (plano.features && Array.isArray(plano.features)) {
                    featuresList.push(...plano.features)
                  } else if (plano.caracteristicas && Array.isArray(plano.caracteristicas)) {
                    featuresList.push(...plano.caracteristicas)
                  }
                }
                
                return (
                  <div key={planoId} className={`plan-card ${featured ? 'featured' : ''}`}>
                    {badge && (
                      <div className="plan-badge-new">{badge}</div>
                    )}
                    <div className="plan-header-card">
                      <h3>{nomePlano}</h3>
                      <div className="plan-price">
                        {temPromocao ? (
                          <>
                            <span className="price-old">De: {formatarValor(valorOriginal)}/mês*</span>
                            <span className="price-new">Por: {formatarValor(valorPromocional)}/mês*</span>
                          </>
                        ) : (
                          <span className="price-single">{formatarValor(valorOriginal || valorPromocional)}/mês*</span>
                        )}
                      </div>
                      <div className="plan-feature-count">
                        {plano.descricao || (limiteAnalises > 0 ? `Até ${limiteAnalises} análises por mês` : 'Análises ilimitadas')}
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="plan-details-btn" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePlanToggle(planoId);
                      }}
                    >
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`plan-chevron ${expandedPlan === planoId ? 'expanded' : ''}`}
                      />
                    </button>
                    <div className={expandedPlan === planoId ? 'plan-details expanded' : 'plan-details'}>
                      <ul className="plan-features">
                        {featuresList.length > 0 ? (
                          // Usar features da API
                          featuresList.map((feature, idx) => (
                            <li key={idx}>
                              <FontAwesomeIcon icon={faCheckCircle} /> {feature}
                            </li>
                          ))
                        ) : (
                          // Fallback para features padrão se não houver dados da API
                          <>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Análise de radiografias</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Relatórios detalhados</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Suporte por email</li>
                            <li><FontAwesomeIcon icon={faCheckCircle} /> Armazenamento na nuvem</li>
                            {tokenChat && (
                              <li><FontAwesomeIcon icon={faCheckCircle} /> {formatarTokens(tokenChat)} de tokens no chat da NODON</li>
                            )}
                          </>
                        )}
                      </ul>
                    </div>
                    <button 
                      className={`btn-plan ${featured ? 'featured' : ''}`} 
                      onClick={() => navigate(`/checkout?plano=${encodeURIComponent(nomePlano)}&planoId=${planoId}`)}
                    >
                      Assine Agora
                    </button>
                    <p className="plan-note">*Plano mensal . Cobrança recorrente com renovação automática.</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Important Info Section */}
      <section className="important-info">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">O que é importante saber?</h2>
          </div>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon-wrapper">
                <FontAwesomeIcon icon={faComments} className="info-icon" size="2x" />
              </div>
              <h3>Suporte humanizado</h3>
              <p>Equipe de especialistas disponível via WhatsApp.</p>
            </div>
            <div className="info-card">
              <div className="info-icon-wrapper">
                <FontAwesomeIcon icon={faShieldAlt} className="info-icon" size="2x" />
              </div>
              <h3>Confiável</h3>
              <p>Dados criptografados e em conformidade com a LGPD.</p>
            </div>
            <div className="info-card">
              <div className="info-icon-wrapper">
                <FontAwesomeIcon icon={faUsers} className="info-icon" size="2x" />
              </div>
              <h3>Profissionais ilimitados</h3>
              <p>Adicione quantos profissionais quiser sem custo adicional.</p>
            </div>
            <div className="info-card">
              <div className="info-icon-wrapper">
                <FontAwesomeIcon icon={faCloud} className="info-icon" size="2x" />
              </div>
              <h3>Armazenamento ilimitado</h3>
              <p>Nuvem com espaço ilimitado para seus dados.</p>
            </div>
            <div className="info-card">
              <div className="info-icon-wrapper">
                <FontAwesomeIcon icon={faMessage} className="info-icon" size="2x" />
              </div>
              <h3>Chat especializado</h3>
              <p>IA especializada em odontologia disponível 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">FAQ</h2>
          </div>
          <div className="faq-list">
            <div className={`faq-item ${expandedFaq === 0 ? 'expanded' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 0 ? null : 0)}
              >
                <h3>Como funciona a análise de radiografias?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="faq-icon"
                />
              </button>
              <div className="faq-answer">
                <p>Nossa IA analisa radiografias em segundos, detectando mais de 50 achados radiográficos diferentes de forma precisa e detalhada. O sistema identifica problemas, anomalias e fornece relatórios completos.</p>
              </div>
            </div>
            <div className={`faq-item ${expandedFaq === 1 ? 'expanded' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
              >
                <h3>Os dados dos pacientes são seguros?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="faq-icon"
                />
              </button>
              <div className="faq-answer">
                <p>Sim, todos os dados são criptografados e armazenados em conformidade com a LGPD. Temos registro na ANVISA (Nº: 82937060001) e seguimos os mais altos padrões de segurança.</p>
              </div>
            </div>
            <div className={`faq-item ${expandedFaq === 2 ? 'expanded' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
              >
                <h3>Posso adicionar múltiplos profissionais?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="faq-icon"
                />
              </button>
              <div className="faq-answer">
                <p>Sim, você pode adicionar quantos profissionais quiser na conta da sua clínica, sem custo adicional. Cada profissional terá acesso individualizado à plataforma.</p>
              </div>
            </div>
            <div className={`faq-item ${expandedFaq === 3 ? 'expanded' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 3 ? null : 3)}
              >
                <h3>Preciso de equipamento especial?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="faq-icon"
                />
              </button>
              <div className="faq-answer">
                <p>Não, a plataforma é 100% online e pode ser acessada de qualquer dispositivo com internet: computador, tablet, celular ou smart TV.</p>
              </div>
            </div>
            <div className={`faq-item ${expandedFaq === 4 ? 'expanded' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
              >
                <h3>Como faço para começar?</h3>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className="faq-icon"
                />
              </button>
              <div className="faq-answer">
                <p>É simples! Basta se cadastrar, escolher um plano e começar a usar. Nossa equipe está pronta para ajudar você a aproveitar ao máximo a plataforma.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contato">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Fale conosco</h2>
            <p className="section-description">
              Olá, quer saber como você pode mudar a experiência do seu paciente no consultório usando inteligência artificial?
            </p>
          </div>
          {!showContactForm ? (
            <div className="contact-cta">
            <button className="btn-contact-primary" onClick={() => setShowContactForm(true)}>
              <FontAwesomeIcon icon={faMessage} style={{ marginRight: '0.5rem' }} />
              Iniciar conversa
            </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>E-mail *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
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

              <div className="form-row">
                <div className="form-group">
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

                <div className="form-group">
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

              <div className="form-row">
                <div className="form-group">
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

                <div className="form-group">
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

              <div className="form-group full-width">
                <label>Informações adicionais (opcional)</label>
                <textarea 
                  value={formData.informacoes} 
                  onChange={(e) => setFormData({...formData, informacoes: e.target.value})}
                  rows="4"
                  placeholder="Conte-nos mais sobre suas necessidades..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Enviar
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowContactForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo-section">
            <div className="footer-logo">
              <img src={nodoLogo} alt="NODON" className="footer-logo-icon" />
              <span className="footer-logo-text">NODON</span>
            </div>
          </div>
          <div className="footer-section">
            <h4>Institucional</h4>
            <ul>
              <li><a href="#inicio">Home</a></li>
              <li><a href="#solucao">Solução</a></li>
              <li><a href="#diagnosticos">Diagnósticos</a></li>
              <li><a href="#chat">Chat</a></li>
              <li><a href="#depoimentos">Depoimentos</a></li>
              <li><a href="#planos">Planos</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Fale Conosco</h4>
            <p>Av. Indianópolis, 153<br />Moema, São Paulo - SP</p>
          </div>
          <div className="footer-section">
            <h4>Redes sociais</h4>
            <div className="social-links">
              <a href="#" className="social-link">
                <FontAwesomeIcon icon={faInstagram} style={{ marginRight: '0.5rem' }} />
                Instagram
              </a>
              <a href="#" className="social-link">
                <FontAwesomeIcon icon={faYoutube} style={{ marginRight: '0.5rem' }} />
                YouTube
              </a>
            </div>
          </div>
          <div className="footer-bottom">
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
