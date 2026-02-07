import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGraduationCap, faCheckCircle, faUsers, faShieldAlt,
  faCloud, faMobileAlt, faRobot, faStar, faArrowRight,
  faBars, faTimes, faBolt, faXRay, faBookOpen, faRocket,
  faComments, faMessage, faBrain, faAward, faLightbulb,
  faChartLine, faHandHoldingHeart
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faYoutube, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import { trackButtonClick, trackFormSubmission, trackEvent } from '../utils/gtag'
import nodoLogo from '../img/nodo.png'
import estudanteImg from '../img/especializacao-em-odontologia-1.jpg'
import './LPEstudante.css'

const LPEstudante = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)

  useEffect(() => {
    loadPlanos()
    
    const handleScroll = () => {
      const navbar = document.querySelector('.lp-header')
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled')
        } else {
          navbar.classList.remove('scrolled')
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const response = await api.get('/planos')
      const planosBackend = response.data?.data || response.data || []
      
      // IDs dos planos específicos para estudantes
      const planosIdsPermitidos = [
        '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7',
        '3521d057-f3b3-4ae5-9966-a5bdeddc38f2'
      ]
      
      const planosIniciais = planosBackend.filter(plano => {
        return planosIdsPermitidos.includes(plano.id)
      })

      const planosMapeados = planosIniciais.map((plano) => {
        let features = []
        let featured = false
        let badge = null

        // Captura valores com diferentes possíveis nomes de propriedades e converte para número
        const valorOriginalRaw = plano.valorOriginal || plano.valor_original || plano.valor || 0
        const valorPromocionalRaw = plano.valorPromocional || plano.valor_promocional || plano.valorPromo || plano.valor_promo || null
        
        // Converte strings para números
        const valorOriginal = typeof valorOriginalRaw === 'string' ? parseFloat(valorOriginalRaw) : (valorOriginalRaw || 0)
        const valorPromocional = valorPromocionalRaw ? (typeof valorPromocionalRaw === 'string' ? parseFloat(valorPromocionalRaw) : valorPromocionalRaw) : null

        // Identifica o plano pelo ID ou nome
        const isPlanoChat = plano.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' || plano.nome?.toLowerCase().includes('chat')
        const isPlanoInicial = plano.id === '3521d057-f3b3-4ae5-9966-a5bdeddc38f2' || plano.nome?.toLowerCase().includes('inicial')

        if (isPlanoChat) {
          // Plano Chat - Ideal para Estudantes
          badge = 'Ideal para Estudantes'
          features = [
            'Chat especializado em odontologia 24/7',
            'IA treinada especificamente para odontologia',
            'Tire dúvidas sobre diagnósticos e tratamentos',
            'Suporte para técnicas odontológicas',
            'Respostas instantâneas e precisas',
            'Acesso mobile completo',
            'Sem fidelidade - cancele quando quiser'
          ]
        } else if (isPlanoInicial) {
          // Plano Inicial - Ideal para Recém-Formados
          badge = 'Ideal para Recém-Formados'
          features = [
            'Análise de radiografias com IA',
            'Até 12 análises por mês',
            'Relatórios detalhados e didáticos',
            'Suporte por email',
            'Armazenamento ilimitado na nuvem',
            '1 milhão de tokens no chat IA',
            'Acesso mobile completo',
            'Sem fidelidade - cancele quando quiser'
          ]
        }

        return {
          id: plano.id,
          nome: plano.nome,
          valorOriginal: Number(valorOriginal) || 0,
          valorPromocional: valorPromocional !== null ? Number(valorPromocional) : null,
          limiteAnalises: plano.limiteAnalises || plano.limite_analises,
          tokenChat: plano.tokenChat || plano.token_chat || plano.tokensChat || null,
          features,
          featured,
          badge
        }
      })

      setPlanos(planosMapeados)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoadingPlanos(false)
    }
  }

  const handleCtaClick = () => {
    trackButtonClick('cta_header', 'lp_estudante_header')
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePlanSelect = (planoNome, planoId) => {
    trackButtonClick('assinar_plano', `lp_estudante_plano_${planoNome}`)
    trackEvent('select_content', {
      content_type: 'plan',
      content_id: planoId,
      content_name: planoNome
    })
    navigate(`/checkout?plano=${encodeURIComponent(planoNome)}&planoId=${planoId}&origem=estudante`)
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarTokens = (tokens) => {
    const numTokens = parseInt(tokens) || 0
    if (numTokens >= 1000000) {
      return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`
    } else if (numTokens >= 1000) {
      return `${(numTokens / 1000).toFixed(0)} mil`
    }
    return numTokens.toString()
  }

  return (
    <div className="lp-estudante">
      {/* Header Minimalista */}
      <header className="lp-header">
        <div className="lp-container">
          <div className="header-content">
            <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={nodoLogo} alt="NODON" />
            </div>
            <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
              <a href="#planos" onClick={(e) => { e.preventDefault(); scrollToSection('planos') }}>Planos</a>
              <a href="#beneficios" onClick={(e) => { e.preventDefault(); scrollToSection('beneficios') }}>Benefícios</a>
              <button className="btn-cta-header" onClick={handleCtaClick}>
                Começar
              </button>
            </nav>
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero - Layout Diagonal e Criativo */}
      <section className="hero-section">
        <div className="hero-bg-pattern"></div>
        <div className="lp-container">
          <div className="hero-wrapper">
            <div className="hero-main">
              <div className="hero-label">
                <span>ESTUDANTES & RECÉM-FORMADOS</span>
              </div>
              <h1 className="hero-title">
                <span className="title-line-1">Transforme sua</span>
                <span className="title-line-2">carreira odontológica</span>
                <span className="title-line-3">com IA</span>
              </h1>
              <p className="hero-description">
                Seu auxiliar nos estudos que ira te acompanhar por toda sua jornada profissional.
              </p>
              <div className="hero-chat-highlight">
                <div className="chat-badge">
                  <FontAwesomeIcon icon={faComments} />
                  <div className="chat-text">
                    <strong>Chat Especializado em Odontologia</strong>
                    <span>Tire suas dúvidas com IA treinada especificamente para odontologia</span>
                  </div>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-hero-main" onClick={handleCtaClick}>
                  Começar Agora
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                <button className="btn-hero-secondary" onClick={() => {
                  trackButtonClick('ver_planos', 'lp_estudante_hero')
                  scrollToSection('planos')
                }}>
                  Ver Planos
                </button>
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-image-wrapper">
                <img src={estudanteImg} alt="Estudantes de Odontologia" className="hero-image" />
                <div className="image-overlay"></div>
              </div>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <div className="metric-value">+850</div>
              <div className="metric-label">Estudantes e Recém-Formados</div>
            </div>
            <div className="metric">
              <div className="metric-value">98%</div>
              <div className="metric-label">Satisfação</div>
            </div>
            <div className="metric">
              <div className="metric-value">24/7</div>
              <div className="metric-label">Disponível</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits - Layout em Zigzag */}
      <section className="benefits-section" id="beneficios">
        <div className="lp-container">
          <div className="section-label">
            <span>BENEFÍCIOS</span>
          </div>
          <h2 className="section-title">Por que escolher a NODON?</h2>
          
          <div className="benefits-list">
            <div className="benefit-row benefit-row-left">
              <div className="benefit-content">
                <div className="benefit-number">01</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                  <h3>IA Avançada</h3>
                  <p>Análise precisa de radiografias com inteligência artificial de última geração</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-right">
              <div className="benefit-content">
                <div className="benefit-number">02</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faBookOpen} />
                  </div>
                  <h3>Aprenda na Prática</h3>
                  <p>Relatórios detalhados e didáticos que ajudam você a entender cada diagnóstico</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-left">
              <div className="benefit-content">
                <div className="benefit-number">03</div>
                <div className="benefit-info">
                  <div className="benefit-icons-group">
                    <div className="benefit-icon">
                      <FontAwesomeIcon icon={faMobileAlt} />
                    </div>
                    <div className="benefit-icon benefit-icon-chat">
                      <FontAwesomeIcon icon={faComments} />
                    </div>
                  </div>
                  <h3>Acesso Mobile + Chat Especializado</h3>
                  <p>Use em qualquer lugar, a qualquer momento, do seu celular ou tablet. Acesse nosso <strong>chat especializado em odontologia 24/7</strong>, com IA treinada especificamente para tirar suas dúvidas sobre diagnósticos, tratamentos e técnicas odontológicas.</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-right">
              <div className="benefit-content">
                <div className="benefit-number">04</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faCloud} />
                  </div>
                  <h3>Armazenamento Ilimitado</h3>
                  <p>Todos os seus exames seguros na nuvem, sem limite de espaço</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-left">
              <div className="benefit-content">
                <div className="benefit-number">05</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <h3>Comunidade Ativa</h3>
                  <p>Conecte-se com outros estudantes e profissionais em nossa comunidade</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-right">
              <div className="benefit-content">
                <div className="benefit-number">06</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faShieldAlt} />
                  </div>
                  <h3>Sem Fidelidade</h3>
                  <p>Cancele quando quiser, sem multas ou taxas adicionais</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Especializado - Novo Formato */}
          <div className="chat-section-new">
            <div className="chat-section-left">
              <div className="chat-icon-wrapper">
                <FontAwesomeIcon icon={faBrain} className="chat-main-icon" />
                <div className="chat-icon-glow"></div>
              </div>
            </div>
            <div className="chat-section-right">
              <div className="chat-label">IA ESPECIALIZADA</div>
              <h2 className="chat-title">Seu Professor Particular de Odontologia</h2>
              <p className="chat-subtitle">
                Uma IA treinada especificamente para odontologia, disponível 24/7 para te ajudar nos estudos e na sua formação profissional.
              </p>
              <div className="chat-benefits-grid">
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faGraduationCap} />
                  <h4>Aprenda Enquanto Estuda</h4>
                  <p>Explicações didáticas sobre qualquer tema odontológico</p>
                </div>
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faBookOpen} />
                  <h4>Suporte Completo</h4>
                  <p>Diagnósticos, tratamentos e técnicas odontológicas</p>
                </div>
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faBolt} />
                  <h4>Disponível 24/7</h4>
                  <p>Estude no seu ritmo, quando e onde quiser</p>
                </div>
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faRocket} />
                  <h4>1 Milhão de Tokens</h4>
                  <p>Pergunte quantas vezes precisar durante sua formação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans - Layout Horizontal com Destaque */}
      <section className="plans-section" id="planos">
        <div className="plans-bg"></div>
        <div className="lp-container">
          <div className="section-label">
            <span>PLANOS</span>
          </div>
          <h2 className="section-title">Escolha seu plano</h2>
          
          {loadingPlanos ? (
            <div className="plans-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="plans-container">
              {planos.map((plano, index) => {
                // Converte valores para número se necessário
                const valorOriginal = typeof plano.valorOriginal === 'string' ? parseFloat(plano.valorOriginal) : (plano.valorOriginal || 0)
                const valorPromocional = plano.valorPromocional ? (typeof plano.valorPromocional === 'string' ? parseFloat(plano.valorPromocional) : plano.valorPromocional) : null
                
                // Verifica se tem promoção: valor promocional existe, é válido e menor que o original
                const temPromocao = valorPromocional !== null && 
                                    !isNaN(valorPromocional) &&
                                    valorPromocional > 0 && 
                                    valorOriginal > 0 &&
                                    valorPromocional < valorOriginal
                const valorExibir = temPromocao ? valorPromocional : valorOriginal
                
                return (
                  <div key={plano.id} className={`plan-item ${plano.featured ? 'featured' : ''}`}>
                    {plano.badge && (
                      <div className="plan-badge">{plano.badge}</div>
                    )}
                    <div className="plan-header">
                      <h3 className="plan-name">{plano.nome}</h3>
                      <div className="plan-price-section">
                        {temPromocao && (
                          <div className="old-price">{formatarValor(plano.valorOriginal)}</div>
                        )}
                        <div className="price-main">
                          <span className="price-value">{formatarValor(valorExibir)}</span>
                          <span className="price-period">/mês</span>
                        </div>
                      </div>
                      {plano.limiteAnalises && (
                        <div className="plan-limit">{plano.limiteAnalises} análises/mês</div>
                      )}
                      {plano.tokenChat && (
                        <div className="plan-tokens">{formatarTokens(plano.tokenChat)} de tokens</div>
                      )}
                    </div>
                    <div className="plan-features-list">
                      {plano.features.map((feature, idx) => (
                        <div key={idx} className="feature-item">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className={`btn-plan ${plano.featured ? 'featured' : ''}`}
                      onClick={() => handlePlanSelect(plano.nome, plano.id)}
                    >
                      Assinar Agora
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Form - Layout Dividido Moderno */}
      <section className="cta-section" id="form-section">
        <div className="lp-container">
          <div className="cta-wrapper">
            <div className="cta-left">
              <div className="section-label">
                <span>COMEÇAR AGORA</span>
              </div>
              <h2>Pronto para transformar sua carreira?</h2>
              <p>Preencha o formulário e comece a usar a melhor plataforma de análise odontológica com preços especiais para estudantes!</p>
              <div className="cta-points">
                <div className="cta-point">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Sem compromisso</span>
                </div>
                <div className="cta-point">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Ativação imediata</span>
                </div>
                <div className="cta-point">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Suporte dedicado</span>
                </div>
              </div>
            </div>
            <div className="cta-right">
              <form className="form-modern" onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const nome = formData.get('nome')
                const email = formData.get('email')
                const telefone = formData.get('telefone')
                const plano = formData.get('plano')
                
                // Evento gtag - Submissão de formulário
                trackFormSubmission('lp_estudante_form', {
                  plano: plano || 'nenhum',
                  origem: 'estudante'
                })
                trackEvent('generate_lead', {
                  form_type: 'lp_estudante',
                  plano: plano || 'nenhum'
                })
                
                if (plano) {
                  navigate(`/checkout?plano=${encodeURIComponent(plano)}&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}&origem=estudante`)
                } else {
                  navigate(`/checkout?nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}&origem=estudante`)
                }
              }}>
                <div className="form-field">
                  <input type="text" name="nome" required placeholder="Nome completo" />
                </div>
                <div className="form-field">
                  <input type="email" name="email" required placeholder="E-mail" />
                </div>
                <div className="form-field">
                  <input type="tel" name="telefone" required placeholder="Telefone" />
                </div>
                <div className="form-field">
                  <select name="plano">
                    <option value="">Selecione um plano</option>
                    {planos.map(plano => (
                      <option key={plano.id} value={plano.nome}>{plano.nome}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-form-submit">
                  Continuar para Checkout
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="footer-top">
            <div className="footer-logo">
              <img src={nodoLogo} alt="NODON" />
            </div>
            <div className="footer-nav">
              <a href="#planos" onClick={(e) => { e.preventDefault(); scrollToSection('planos') }}>Planos</a>
              <a href="#beneficios" onClick={(e) => { e.preventDefault(); scrollToSection('beneficios') }}>Benefícios</a>
            </div>
            <div className="footer-social">
              <a href="#" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faYoutube} />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faWhatsapp} />
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 NODON. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LPEstudante
