import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBars, faTimes, faRocket, faCheckCircle, faArrowRight,
  faClock, faUserMd, faChartBar, faUsers, faStar,
  faQuoteLeft, faEnvelope, faPhone, faXRay, faRobot,
  faBolt, faSearch, faShieldAlt, faCloud, faFileMedical,
  faPlayCircle, faChevronDown, faBrain, faMagic
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import nodoLogo from '../img/nodo.png'
import './LPDentista.css'

const LPDentista = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  })

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.lp-navbar')
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitting(false)
    setSubmitted(true)
    setFormData({ nome: '', email: '', telefone: '', mensagem: '' })
    setTimeout(() => {
      setSubmitted(false)
      setShowContactForm(false)
    }, 3000)
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="lp-dentista">
      {/* Cursor Glow Effect */}
      <div 
        className="lp-cursor-glow"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`
        }}
      />

      {/* Navigation */}
      <nav className="lp-navbar">
        <div className="lp-nav-container">
          <div className="lp-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="lp-logo-glow"></div>
            <img src={nodoLogo} alt="NODON" />
            <span>NODON</span>
          </div>
          <button 
            className="lp-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
          </button>
          <div className={`lp-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#produtos" onClick={(e) => { e.preventDefault(); scrollToSection('produtos') }}>Produtos</a>
            <a href="#beneficios" onClick={(e) => { e.preventDefault(); scrollToSection('beneficios') }}>Benefícios</a>
            <a href="#depoimentos" onClick={(e) => { e.preventDefault(); scrollToSection('depoimentos') }}>Depoimentos</a>
            <button 
              className="lp-nav-cta"
              onClick={() => {
                setShowContactForm(true)
                setTimeout(() => scrollToSection('contato'), 100)
              }}
            >
              <span>Começar Agora</span>
              <div className="lp-btn-glow"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-bg">
          <div className="lp-hero-grid"></div>
          <div className="lp-hero-orbs">
            <div className="lp-orb lp-orb-1"></div>
            <div className="lp-orb lp-orb-2"></div>
            <div className="lp-orb lp-orb-3"></div>
          </div>
          <div className="lp-hero-lines">
            <div className="lp-line lp-line-1"></div>
            <div className="lp-line lp-line-2"></div>
            <div className="lp-line lp-line-3"></div>
          </div>
        </div>
        <div className="lp-container">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <FontAwesomeIcon icon={faMagic} />
              <span>Revolucione sua prática odontológica</span>
              <div className="lp-badge-glow"></div>
            </div>
            <h1 className="lp-hero-title">
              <span className="lp-title-line">Facilitando seu atendimento,</span>
              <span className="lp-gradient-text"> conquistando seus clientes</span>
            </h1>
            <p className="lp-hero-description">
              Use inteligência artificial de última geração para analisar radiografias e responder 
              dúvidas dos pacientes instantaneamente. Economize tempo, aumente a precisão e ofereça 
              um atendimento excepcional.
            </p>
            <div className="lp-hero-ctas">
              <button 
                className="lp-btn-primary lp-btn-hero"
                onClick={() => {
                  setShowContactForm(true)
                  setTimeout(() => scrollToSection('contato'), 100)
                }}
              >
                <span>Teste Grátis por 7 Dias</span>
                <FontAwesomeIcon icon={faRocket} />
                <div className="lp-btn-glow"></div>
              </button>
              <button 
                className="lp-btn-secondary lp-btn-hero"
                onClick={() => scrollToSection('produtos')}
              >
                <FontAwesomeIcon icon={faPlayCircle} />
                <span>Ver Demonstração</span>
              </button>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-stat">
                <div className="lp-stat-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div className="lp-stat-content">
                  <div className="lp-stat-number">500+</div>
                  <div className="lp-stat-label">Profissionais</div>
                </div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-icon">
                  <FontAwesomeIcon icon={faFileMedical} />
                </div>
                <div className="lp-stat-content">
                  <div className="lp-stat-number">10k+</div>
                  <div className="lp-stat-label">Análises</div>
                </div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-icon">
                  <FontAwesomeIcon icon={faStar} />
                </div>
                <div className="lp-stat-content">
                  <div className="lp-stat-number">4.9/5</div>
                  <div className="lp-stat-label">Avaliação</div>
                </div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-icon">
                  <FontAwesomeIcon icon={faBolt} />
                </div>
                <div className="lp-stat-content">
                  <div className="lp-stat-number">80%</div>
                  <div className="lp-stat-label">Economia</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-hero-scroll">
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </section>

      {/* Problems Section */}
      <section className="lp-problems">
        <div className="lp-container">
          <h2 className="lp-section-title">
            <span className="lp-title-accent">Cansado</span> de perder tempo?
          </h2>
          <p className="lp-section-subtitle">
            Você não está sozinho. Muitos profissionais enfrentam os mesmos desafios
          </p>
          <div className="lp-problems-grid">
            {[
              { icon: faClock, title: 'Horas Analisando', text: 'Gastando muito tempo analisando cada radiografia manualmente' },
              { icon: faUserMd, title: 'Dúvidas Constantes', text: 'Pacientes com perguntas que interrompem seu fluxo de trabalho' },
              { icon: faChartBar, title: 'Risco de Erros', text: 'Possibilidade de passar despercebido algum detalhe importante' },
              { icon: faUsers, title: 'Atendimento Limitado', text: 'Dificuldade em escalar sem perder qualidade' }
            ].map((problem, index) => (
              <div key={index} className="lp-problem-item">
                <div className="lp-problem-icon">
                  <FontAwesomeIcon icon={problem.icon} />
                  <div className="lp-icon-glow"></div>
                </div>
                <h3>{problem.title}</h3>
                <p>{problem.text}</p>
                <div className="lp-card-shine"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="lp-solution">
        <div className="lp-container">
          <div className="lp-solution-content">
            <div className="lp-solution-glow"></div>
            <h2 className="lp-section-title">
              A <span className="lp-highlight">Solução</span> que você precisa
            </h2>
            <p className="lp-solution-text">
              A NODON combina análise inteligente de imagens com assistente de IA especializado 
              para transformar completamente sua prática odontológica. Trabalhe mais rápido, 
              com mais precisão e ofereça um atendimento excepcional aos seus pacientes.
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="produtos" className="lp-products">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">
              Duas <span className="lp-title-accent">Ferramentas</span> Poderosas
            </h2>
            <p className="lp-section-subtitle">
              Tudo que você precisa para transformar sua prática odontológica
            </p>
          </div>

          {/* Product 1 */}
          <div className="lp-product">
            <div className="lp-product-image">
              <div className="lp-product-icon">
                <FontAwesomeIcon icon={faXRay} />
                <div className="lp-icon-ring lp-ring-1"></div>
                <div className="lp-icon-ring lp-ring-2"></div>
                <div className="lp-icon-ring lp-ring-3"></div>
              </div>
              <div className="lp-product-particles"></div>
            </div>
            <div className="lp-product-content">
              <div className="lp-product-badge">
                <span>Produto 1</span>
                <div className="lp-badge-glow"></div>
              </div>
              <h3 className="lp-product-title">Análises de Diagnósticos</h3>
              <p className="lp-product-description">
                Analise radiografias panorâmicas e periapicais em segundos com precisão cirúrgica. 
                Nossa IA identifica automaticamente cáries, problemas periodontais e outras condições.
              </p>
              <ul className="lp-product-list">
                {[
                  'Análise automática em segundos',
                  'Detecção precisa de problemas',
                  'Relatórios profissionais completos',
                  'Histórico completo do paciente',
                  'Armazenamento seguro na nuvem'
                ].map((item, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                className="lp-product-btn"
                onClick={() => {
                  setShowContactForm(true)
                  setTimeout(() => scrollToSection('contato'), 100)
                }}
              >
                <span>Quero Análises Inteligentes</span>
                <FontAwesomeIcon icon={faArrowRight} />
                <div className="lp-btn-glow"></div>
              </button>
            </div>
          </div>

          {/* Product 2 */}
          <div className="lp-product lp-product-reverse">
            <div className="lp-product-image">
              <div className="lp-product-icon">
                <FontAwesomeIcon icon={faRobot} />
                <div className="lp-icon-ring lp-ring-1"></div>
                <div className="lp-icon-ring lp-ring-2"></div>
                <div className="lp-icon-ring lp-ring-3"></div>
              </div>
              <div className="lp-product-particles"></div>
            </div>
            <div className="lp-product-content">
              <div className="lp-product-badge">
                <span>Produto 2</span>
                <div className="lp-badge-glow"></div>
              </div>
              <h3 className="lp-product-title">Chat de IA Especializado</h3>
              <p className="lp-product-description">
                Tenha um assistente especializado em Odontologia disponível 24/7. Responda dúvidas 
                de pacientes instantaneamente e melhore significativamente seu atendimento.
              </p>
              <ul className="lp-product-list">
                {[
                  'Assistente especializado em Odontologia',
                  'Respostas instantâneas e precisas',
                  'Orientações sobre procedimentos',
                  'Explicações técnicas para pacientes',
                  'Disponível 24 horas por dia'
                ].map((item, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                className="lp-product-btn"
                onClick={() => {
                  setShowContactForm(true)
                  setTimeout(() => scrollToSection('contato'), 100)
                }}
              >
                <span>Quero o Chat de IA</span>
                <FontAwesomeIcon icon={faArrowRight} />
                <div className="lp-btn-glow"></div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="lp-benefits">
        <div className="lp-container">
          <h2 className="lp-section-title">
            Por que escolher a <span className="lp-title-accent">NODON</span>?
          </h2>
          <div className="lp-benefits-grid">
            {[
              { icon: faBolt, title: 'Economia de Tempo', text: 'Reduza em até 80% o tempo gasto com análises manuais' },
              { icon: faSearch, title: 'Precisão Superior', text: 'IA treinada com milhares de casos reais' },
              { icon: faShieldAlt, title: 'Segurança Total', text: 'Dados protegidos com criptografia de ponta' },
              { icon: faCloud, title: 'Acesso Ilimitado', text: 'Use de qualquer dispositivo, a qualquer momento' },
              { icon: faChartBar, title: 'Relatórios Profissionais', text: 'Gere relatórios detalhados prontos para usar' },
              { icon: faUsers, title: 'Melhor Atendimento', text: 'Respostas rápidas e precisas para seus pacientes' }
            ].map((benefit, index) => (
              <div key={index} className="lp-benefit-card">
                <div className="lp-benefit-icon">
                  <FontAwesomeIcon icon={benefit.icon} />
                  <div className="lp-icon-glow"></div>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
                <div className="lp-card-shine"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="lp-testimonials">
        <div className="lp-container">
          <h2 className="lp-section-title">
            O que nossos <span className="lp-title-accent">clientes</span> dizem
          </h2>
          <div className="lp-testimonials-grid">
            {[
              {
                text: "A NODON transformou completamente minha prática. Agora consigo analisar radiografias em minutos ao invés de horas. A precisão é impressionante!",
                author: "Dr. Carlos Silva",
                role: "Ortodontista - São Paulo",
                initials: "CS"
              },
              {
                text: "O chat de IA é incrível! Meus pacientes adoram as respostas rápidas e eu economizo muito tempo. Recomendo para todos os colegas.",
                author: "Dra. Maria Santos",
                role: "Clínica Geral - Rio de Janeiro",
                initials: "MS"
              },
              {
                text: "A plataforma é intuitiva e os resultados são precisos. Melhor investimento que fiz para minha clínica nos últimos anos.",
                author: "Dr. João Oliveira",
                role: "Implantodontista - Belo Horizonte",
                initials: "JO"
              }
            ].map((testimonial, index) => (
              <div key={index} className="lp-testimonial">
                <div className="lp-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon key={i} icon={faStar} />
                  ))}
                </div>
                <FontAwesomeIcon icon={faQuoteLeft} className="lp-quote-icon" />
                <p className="lp-testimonial-text">{testimonial.text}</p>
                <div className="lp-testimonial-author">
                  <div className="lp-author-avatar">{testimonial.initials}</div>
                  <div>
                    <h4>{testimonial.author}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
                <div className="lp-card-shine"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contato" className="lp-cta">
        <div className="lp-cta-bg">
          <div className="lp-cta-grid"></div>
          <div className="lp-cta-orbs">
            <div className="lp-orb lp-orb-1"></div>
            <div className="lp-orb lp-orb-2"></div>
          </div>
        </div>
        <div className="lp-container">
          <div className="lp-cta-content">
            {!showContactForm ? (
              <>
                <h2 className="lp-cta-title">
                  Pronto para <span className="lp-title-accent">transformar</span> sua prática?
                </h2>
                <p className="lp-cta-subtitle">
                  Comece hoje mesmo e veja a diferença que a IA pode fazer na sua clínica
                </p>
                <div className="lp-cta-buttons">
                  <button 
                    className="lp-btn-primary lp-btn-large"
                    onClick={() => setShowContactForm(true)}
                  >
                    <span>Solicitar Demonstração Grátis</span>
                    <FontAwesomeIcon icon={faRocket} />
                    <div className="lp-btn-glow"></div>
                  </button>
                  <a 
                    href="https://wa.me/5511999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="lp-btn-whatsapp lp-btn-large"
                  >
                    <FontAwesomeIcon icon={faWhatsapp} />
                    <span>Falar no WhatsApp</span>
                  </a>
                </div>
                <p className="lp-cta-note">
                  ✓ Teste grátis por 7 dias • ✓ Sem compromisso • ✓ Cancele quando quiser
                </p>
              </>
            ) : (
              <div className="lp-contact-form">
                <h3>Preencha seus dados</h3>
                {submitted && (
                  <div className="lp-form-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Mensagem enviada! Entraremos em contato em breve.
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="lp-form-group">
                    <label>
                      <FontAwesomeIcon icon={faUserMd} />
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>
                      <FontAwesomeIcon icon={faEnvelope} />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>
                      <FontAwesomeIcon icon={faPhone} />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      required
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="lp-form-group">
                    <label>
                      <FontAwesomeIcon icon={faEnvelope} />
                      Mensagem (opcional)
                    </label>
                    <textarea
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      placeholder="Conte-nos sobre suas necessidades..."
                      rows="4"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="lp-btn-primary lp-btn-large"
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : (
                      <>
                        <span>Enviar Solicitação</span>
                        <FontAwesomeIcon icon={faRocket} />
                        <div className="lp-btn-glow"></div>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="lp-btn-link"
                    onClick={() => setShowContactForm(false)}
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-content">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">
                <img src={nodoLogo} alt="NODON" />
                <span>NODON</span>
              </div>
              <p>Transformando práticas odontológicas com inteligência artificial</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-column">
                <h4>Produtos</h4>
                <a href="#produtos" onClick={(e) => { e.preventDefault(); scrollToSection('produtos') }}>Análises</a>
                <a href="#produtos" onClick={(e) => { e.preventDefault(); scrollToSection('produtos') }}>Chat IA</a>
              </div>
              <div className="lp-footer-column">
                <h4>Empresa</h4>
                <a href="#beneficios" onClick={(e) => { e.preventDefault(); scrollToSection('beneficios') }}>Benefícios</a>
                <a href="#depoimentos" onClick={(e) => { e.preventDefault(); scrollToSection('depoimentos') }}>Depoimentos</a>
              </div>
              <div className="lp-footer-column">
                <h4>Contato</h4>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faWhatsapp} />
                  WhatsApp
                </a>
                <a href="mailto:contato@nodon.com.br">
                  <FontAwesomeIcon icon={faEnvelope} />
                  contato@nodon.com.br
                </a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>&copy; 2024 NODON. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LPDentista
