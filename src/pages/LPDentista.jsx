import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle, faUsers, faShieldAlt,
  faCloud, faMobileAlt, faRobot, faArrowRight,
  faBars, faTimes, faBolt, faXRay, faBookOpen, faRocket,
  faComments, faMessage, faBrain, faAward, faLightbulb,
  faChartLine, faHandHoldingHeart, faTag, faUserMd, faStethoscope, faCoins,
  faFileMedical, faCalendarAlt, faClipboardList, faChevronDown, faChevronUp,
  faCalendarCheck, faQuestionCircle, faComments as faCommentsAlt, faPercent,
  faChartBar, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faYoutube, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import { trackButtonClick, trackFormSubmission, trackEvent } from '../utils/gtag'
import nodoLogo from '../img/nodo.png'
import dentistaImg from '../img/especializacao-em-odontologia-1.jpg'
import xldentistaImg from '../img/xldentista.jpeg'
import './LPDentista.css'

// Componente individual para cada card de plano - gerencia seu próprio estado
const PricingCard = ({ 
  plano, 
  index, 
  cupomValido, 
  cupomData, 
  cupomCode, 
  formatarValor, 
  formatarTokens, 
  handlePlanSelect 
}) => {
  // Cada card tem seu próprio estado interno de expansão
  const [isExpanded, setIsExpanded] = useState(false)

  // Calcula os valores do plano
  const valorOriginal = Number(plano.valorOriginal) || 0
  const valorPromocional = plano.valorPromocional !== null && plano.valorPromocional !== undefined 
    ? Number(plano.valorPromocional) 
    : null
  
  const valorBase = valorOriginal > 0 ? valorOriginal : (valorPromocional || 0)
  
  const temPromocao = valorPromocional !== null && 
                      !isNaN(valorPromocional) &&
                      valorPromocional > 0 && 
                      valorOriginal > 0 &&
                      valorPromocional < valorOriginal
  
  let valorExibir = temPromocao ? valorPromocional : valorBase
  let temDescontoCupom = false
  let valorBaseParaDesconto = temPromocao ? valorPromocional : valorBase
  
  if (cupomValido && cupomData && valorBaseParaDesconto > 0) {
    const discountPercent = Number(cupomData.discountValue) || 0
    if (discountPercent > 0) {
      const valorComDesconto = valorBaseParaDesconto * (1 - discountPercent / 100)
      valorExibir = valorComDesconto
      temDescontoCupom = true
    }
  }

  // ID único para o card
  const planId = plano.id || `plan-${index}`

  // Handler interno para toggle - cada card controla seu próprio estado
  const toggleFeatures = (e) => {
    e.preventDefault()
    e.stopPropagation() // Impede que o evento afete outros componentes
    setIsExpanded(prev => {
      const newState = !prev
      // Debug: descomente para verificar se o estado está mudando
      // console.log(`Card ${plano.nome} - Estado mudou de ${prev} para ${newState}`)
      return newState
    })
  }

  return (
    <div className={`plan-item ${plano.featured ? 'featured' : ''} ${isExpanded ? 'active' : ''}`}>
      {plano.badge && (
        <div className="plan-badge">{plano.badge}</div>
      )}
      <div className="plan-header">
        <h3 className="plan-name">{plano.nome}</h3>
        {cupomValido && cupomData && (
          <div className="cupom-badge-plan">
            <FontAwesomeIcon icon={faTag} />
            <span>Cupom {cupomCode} aplicado!</span>
          </div>
        )}
        <div className="plan-price-section">
          {temPromocao && valorOriginal > 0 && (
            <div className="old-price">{formatarValor(valorOriginal)}</div>
          )}
          {temDescontoCupom && temPromocao && valorPromocional > 0 && (
            <div className="old-price">{formatarValor(valorPromocional)}</div>
          )}
          {temDescontoCupom && !temPromocao && valorBase > 0 && (
            <div className="old-price">{formatarValor(valorBase)}</div>
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
      <div className="plan-features-wrapper">
        <button
          type="button"
          className="plan-features-toggle"
          onClick={toggleFeatures}
        >
          <span>{isExpanded ? 'Ocultar recursos' : 'Ver recursos'}</span>
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
          />
        </button>
        {/* Renderização condicional RESTRITA - só renderiza se isExpanded for true */}
        {isExpanded && plano.features && Array.isArray(plano.features) && plano.features.length > 0 && (
          <div className="plan-features-list">
            {plano.features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
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
}

const LPDentista = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [cupomCode, setCupomCode] = useState(null)
  const [cupomValido, setCupomValido] = useState(false)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [cupomData, setCupomData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há cupom na URL
    const cupom = searchParams.get('cupom')
    if (cupom) {
      setCupomCode(cupom.toUpperCase())
      validarCupom(cupom.toUpperCase())
    } else {
      // Se não há cupom, marca como não validando
      setValidandoCupom(false)
    }
    
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
  }, [searchParams])

  // Loading geral - só desaparece quando planos e cupom terminarem
  useEffect(() => {
    if (!loadingPlanos && !validandoCupom) {
      setLoading(false)
    }
  }, [loadingPlanos, validandoCupom])


  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const response = await api.get('/planos')
      const planosBackend = response.data?.data || response.data || []
      
      // IDs dos planos que devem ser excluídos (apenas planos de teste)
      const planosExcluidos = [
        'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0'  // Plano Teste
      ]
      
      // Filtra todos os planos ativos, exceto os planos excluídos
      // Agora mostra TODOS os planos, incluindo o Plano Chat
      const planosIniciais = planosBackend.filter(plano => {
        return plano.ativo && !planosExcluidos.includes(plano.id)
      })

      // Função auxiliar para formatar tokens
      const formatarTokensAux = (tokens) => {
        const numTokens = parseInt(tokens) || 0
        if (numTokens >= 1000000) {
          return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`
        } else if (numTokens >= 1000) {
          return `${(numTokens / 1000).toFixed(0)} mil`
        }
        return numTokens.toString()
      }

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
        const isPlanoInicial = plano.id === '3521d057-f3b3-4ae5-9966-a5bdeddc38f2' || plano.nome?.toLowerCase().includes('inicial')
        const isPlanoChat = plano.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' || plano.nome?.toLowerCase().includes('chat')

        if (isPlanoChat) {
          // Plano Chat - Apenas Chat
          badge = 'Ideal para Estudantes'
          features = [
            'Chat especializado em odontologia 24/7',
            'IA treinada especificamente para odontologia',
            'Tire dúvidas sobre diagnósticos e tratamentos',
            'Suporte para técnicas odontológicas',
            plano.tokenChat ? `${formatarTokensAux(plano.tokenChat)} de tokens` : '1 milhão de tokens',
            'Acesso mobile',
            'Sem fidelidade - cancele quando quiser'
          ]
        } else if (isPlanoInicial) {
          // Plano Inicial - Ideal para Dentistas Iniciantes
          badge = 'Ideal para Dentistas Iniciantes'
          features = [
            'Diagnósticos com IA avançada',
            `Até ${plano.limiteAnalises || 12} análises por mês`,
            'Agendamento de consultas',
            'Anamneses personalizadas',
            'Chat especializado em odontologia 24/7',
            'Precificação de tratamentos',
            'Feedbacks e avaliações',
            'Gráficos customizados para melhor entendimento',
            'Gestão completa de pacientes',
            'Relatórios detalhados e profissionais',
            'Armazenamento ilimitado na nuvem',
            plano.tokenChat ? `${formatarTokensAux(plano.tokenChat)} de tokens` : '1 milhão de tokens',
            'Acesso mobile completo',
            'Sem fidelidade - cancele quando quiser'
          ]
        } else {
          // Features completas para outros planos
          features = [
            'Diagnósticos com IA avançada',
            plano.limiteAnalises ? `Até ${plano.limiteAnalises} análises por mês` : 'Análises ilimitadas',
            'Agendamento de consultas',
            'Anamneses personalizadas',
            'Chat especializado em odontologia 24/7',
            'Precificação de tratamentos',
            'Feedbacks e avaliações',
            'Gráficos customizados para melhor entendimento',
            'Gestão completa de pacientes',
            'Relatórios detalhados e profissionais',
            'Armazenamento ilimitado na nuvem',
            plano.tokenChat ? `${formatarTokensAux(plano.tokenChat)} de tokens` : '1 milhão de tokens',
            'Acesso mobile completo',
            'Sem fidelidade - cancele quando quiser'
          ]
        }

        return {
          id: plano.id,
          nome: plano.nome,
          valorOriginal: valorOriginal,
          valorPromocional: valorPromocional,
          limiteAnalises: plano.limiteAnalises || plano.limite_analises,
          tokenChat: plano.tokenChat || plano.token_chat || plano.tokensChat || null,
          features,
          featured,
          badge
        }
      })

      // Ordena os planos por preço (do menor para o maior)
      // Usa valorPromocional se existir, senão usa valorOriginal
      const planosOrdenados = planosMapeados.sort((a, b) => {
        const valorA = a.valorPromocional > 0 ? a.valorPromocional : (a.valorOriginal || 0)
        const valorB = b.valorPromocional > 0 ? b.valorPromocional : (b.valorOriginal || 0)
        return valorA - valorB
      })

      setPlanos(planosOrdenados)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    } finally {
      setLoadingPlanos(false)
    }
  }

  const validarCupom = async (codigo) => {
    if (!codigo || !codigo.trim()) {
      setCupomValido(false)
      setCupomData(null)
      setValidandoCupom(false)
      return
    }

    setValidandoCupom(true)
    try {
      const response = await api.get(`/cupons/name/${codigo.toUpperCase().trim()}`)
      const cupom = response.data?.data || response.data

      if (cupom && cupom.active) {
        setCupomValido(true)
        setCupomData(cupom)
      } else {
        setCupomValido(false)
        setCupomData(null)
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error)
      setCupomValido(false)
      setCupomData(null)
    } finally {
      setValidandoCupom(false)
    }
  }

  const handleCtaClick = () => {
    trackButtonClick('cta_header', 'lp_dentista_header')
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePlanSelect = (planoNome, planoId) => {
    trackButtonClick('assinar_plano', `lp_dentista_plano_${planoNome}`)
    trackEvent('select_content', {
      content_type: 'plan',
      content_id: planoId,
      content_name: planoNome
    })
    const cupomParam = cupomCode ? `&cupom=${encodeURIComponent(cupomCode)}` : ''
    navigate(`/checkout?plano=${encodeURIComponent(planoNome)}&planoId=${planoId}&origem=dentista${cupomParam}`)
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

  // Determina qual imagem usar - igual ao esquema da LP de estudante
  const getHeroImage = () => {
    // Verifica se o cupom é XL20 ou XLDENTISTA (já vem em maiúsculas do useEffect)
    if ((cupomCode === 'XL20' || cupomCode === 'XLDENTISTA') && cupomValido) {
      return xldentistaImg
    }
    return dentistaImg
  }

  const getHeroImageAlt = () => {
    if ((cupomCode === 'XL20' || cupomCode === 'XLDENTISTA') && cupomValido) {
      return `Cupom ${cupomCode}`
    }
    return "Dentistas"
  }

  if (loading) {
    return (
      <div className="lp-loading-overlay">
        <div className="lp-loading-container">
          <div className="lp-loading-logo">
            <img src={nodoLogo} alt="NODON" />
          </div>
          <div className="lp-loading-spinner-modern">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p className="lp-loading-text">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lp-dentista">
      {/* Tag de Cupom Ativo */}
      {cupomCode && (
        <div className={`cupom-banner ${cupomValido ? 'valid' : validandoCupom ? 'validating' : 'invalid'}`}>
          <div className="cupom-banner-content">
            {(cupomCode === 'XL20' || cupomCode === 'XLDENTISTA') && cupomValido && (
              <img src={xldentistaImg} alt={`Cupom ${cupomCode}`} className="cupom-image" />
            )}
            <FontAwesomeIcon icon={faTag} />
            {validandoCupom ? (
              <span>Validando cupom <strong>{cupomCode}</strong>...</span>
            ) : cupomValido ? (
              <span>Cupom <strong>{cupomCode}</strong> ativo! Desconto aplicado</span>
            ) : (
              <span>Cupom <strong>{cupomCode}</strong> inválido ou inativo</span>
            )}
          </div>
        </div>
      )}
      
      {/* Header Minimalista */}
      <header className="lp-header">
        <div className="lp-container">
          <div className="header-content">
            <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={nodoLogo} alt="NODON" />
            </div>
            <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
              <a href="#produtos" onClick={(e) => { e.preventDefault(); scrollToSection('produtos') }}>Produtos</a>
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
                <span>DENTISTAS</span>
              </div>
              <h1 className="hero-title">
                <span className="title-line-1">Aumente a aceitação dos</span>
                <span className="title-line-2">tratamentos</span>
                <span className="title-line-3">Seu paciente mais confiante ele escolhe você!</span>
              </h1>
              <p className="hero-description">
                A ferramenta completa para dentistas que estão começando e já possuem seus primeiros clientes. Organize, analise e gerencie tudo em um só lugar.
              </p>
              <div className="hero-chat-highlight">
                <div className="chat-badge">
                  <FontAwesomeIcon icon={faComments} />
                  <div className="chat-text">
                    <strong>IA Especializada em Odontologia</strong>
                    <span>Suporte completo para diagnósticos, tratamentos e gestão de pacientes</span>
                  </div>
                </div>
                <div className="chat-badge" style={{ marginTop: '1rem', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', padding: '1rem 1.5rem' }}>
                  <FontAwesomeIcon icon={faCoins} style={{ color: '#f59e0b', fontSize: '1.5rem' }} />
                  <div className="chat-text">
                    <strong style={{ fontSize: '1rem' }}>Precificação Inteligente de Tratamentos</strong>
                    <span style={{ fontSize: '0.875rem' }}>Calcule custos, margens de lucro e defina preços competitivos com gráficos e análises detalhadas</span>
                  </div>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-hero-main" onClick={handleCtaClick}>
                  Começar Agora
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                <button className="btn-hero-secondary" onClick={() => {
                  trackButtonClick('ver_planos', 'lp_dentista_hero')
                  scrollToSection('planos')
                }}>
                  Ver Planos
                </button>
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-image-wrapper">
                <img 
                  key={`hero-img-${cupomCode}-${cupomValido}`}
                  src={getHeroImage()} 
                  alt={getHeroImageAlt()} 
                  className="hero-image" 
                />
                <div className="image-overlay"></div>
              </div>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <div className="metric-value">+1.200</div>
              <div className="metric-label">Dentistas Ativos</div>
            </div>
            <div className="metric">
              <div className="metric-value">95%</div>
              <div className="metric-label">Satisfação</div>
            </div>
            <div className="metric">
              <div className="metric-value">24/7</div>
              <div className="metric-label">Disponível</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Todos os Produtos */}
      <section className="products-section" id="produtos">
        <div className="lp-container">
          <div className="section-label">
            <span>PRODUTOS</span>
          </div>
          <h2 className="section-title">Tudo que você precisa em um só lugar</h2>
          <p className="section-subtitle">Ferramentas completas para gestão do seu consultório odontológico</p>
          
          <div className="products-grid">
            <div className="product-card">
              <div className="product-icon">
                <FontAwesomeIcon icon={faXRay} />
              </div>
              <h3>Diagnósticos</h3>
              <p>Análise precisa de radiografias com IA avançada. Receba diagnósticos detalhados e profissionais em segundos.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> Análise de radiografias panorâmicas</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Relatórios detalhados</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Desenho interativo</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Histórico completo</li>
              </ul>
            </div>

            <div className="product-card">
              <div className="product-icon">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>
              <h3>Agendamento</h3>
              <p>Gerencie seus agendamentos de forma simples e eficiente. Calendário completo com lembretes automáticos.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> Calendário visual</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Lembretes automáticos</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Gestão de horários</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Sincronização mobile</li>
              </ul>
            </div>

            <div className="product-card">
              <div className="product-icon">
                <FontAwesomeIcon icon={faQuestionCircle} />
              </div>
              <h3>Anamneses</h3>
              <p>Crie questionários personalizados para seus pacientes e receba as respostas automaticamente organizadas.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> Questionários personalizados</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Respostas automáticas</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Histórico de anamneses</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Compartilhamento fácil</li>
              </ul>
            </div>

            <div className="product-card">
              <div className="product-icon">
                <FontAwesomeIcon icon={faCommentsAlt} />
              </div>
              <h3>Chat IA</h3>
              <p>Assistente virtual especializado em odontologia disponível 24/7 para tirar suas dúvidas sobre diagnósticos e tratamentos.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> IA especializada em odontologia</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Disponível 24/7</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Respostas instantâneas</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Suporte completo</li>
              </ul>
            </div>

            <div className="product-card">
              <div className="product-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <h3>Gestão de Pacientes</h3>
              <p>Organize todos os seus pacientes, histórico, tratamentos e documentos em um só lugar seguro na nuvem.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> Cadastro completo</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Histórico de tratamentos</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Documentos organizados</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Busca avançada</li>
              </ul>
            </div>

            <div className="product-card">
              <div className="product-icon">
                <FontAwesomeIcon icon={faCloud} />
              </div>
              <h3>Armazenamento na Nuvem</h3>
              <p>Todos os seus exames, documentos e dados seguros na nuvem com acesso de qualquer lugar e dispositivo.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> Armazenamento ilimitado</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Backup automático</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Acesso multiplataforma</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Segurança total</li>
              </ul>
            </div>

            <div className="product-card" style={{ border: '2px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.05)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#f59e0b', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Novo
              </div>
              <div className="product-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <FontAwesomeIcon icon={faCoins} />
              </div>
              <h3 style={{ color: '#f59e0b', fontWeight: '700', fontSize: '1.125rem' }}>Precificação de Tratamentos</h3>
              <p style={{ fontSize: '0.9375rem' }}><strong style={{ color: '#fff', fontSize: '0.9375rem' }}>A NODON oferece ajuda completa para precificação de seus tratamentos!</strong> Calcule custos, margens de lucro e defina preços competitivos com precisão através de gráficos e análises detalhadas.</p>
              <ul className="product-features">
                <li><FontAwesomeIcon icon={faCheckCircle} /> Cálculo automático de custos diretos e indiretos</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Análise de margem de lucro em tempo real</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Gráficos e relatórios detalhados</li>
                <li><FontAwesomeIcon icon={faCheckCircle} /> Alertas visuais para lucro baixo ou sem lucro</li>
              </ul>
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
                  <h3>Análise com IA</h3>
                  <p>Diagnósticos precisos e rápidos com inteligência artificial especializada em odontologia</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-right">
              <div className="benefit-content">
                <div className="benefit-number">02</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faCoins} />
                  </div>
                  <h3>Precificação de Tratamentos</h3>
                  <p style={{ fontSize: '0.9375rem' }}><strong style={{ fontSize: '0.9375rem' }}>A NODON oferece ajuda completa para precificação dos seus tratamentos!</strong> Calcule custos, margens de lucro e defina preços competitivos com gráficos e análises detalhadas em tempo real.</p>
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
                  <h3>Acesso Mobile + Chat IA</h3>
                  <p>Use em qualquer lugar, a qualquer momento, do seu celular ou tablet. Acesse nosso <strong>chat especializado 24/7</strong> para tirar dúvidas sobre diagnósticos e tratamentos.</p>
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
                  <p>Todos os exames e documentos dos seus pacientes seguros na nuvem, sem limite de espaço</p>
                </div>
              </div>
            </div>

            <div className="benefit-row benefit-row-left">
              <div className="benefit-content">
                <div className="benefit-number">05</div>
                <div className="benefit-info">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faFileMedical} />
                  </div>
                  <h3>Anamneses Personalizadas</h3>
                  <p>Crie questionários personalizados para seus pacientes e receba as respostas automaticamente</p>
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
          
          {/* Chat Especializado */}
          <div className="chat-section-new">
            <div className="chat-section-left">
              <div className="chat-icon-wrapper">
                <FontAwesomeIcon icon={faBrain} className="chat-main-icon" />
                <div className="chat-icon-glow"></div>
              </div>
            </div>
            <div className="chat-section-right">
              <div className="chat-label">IA ESPECIALIZADA</div>
              <h2 className="chat-title">Seu Assistente Profissional de Odontologia</h2>
              <p className="chat-subtitle">
                Uma IA treinada especificamente para odontologia, disponível 24/7 para te ajudar em diagnósticos, planejamento de tratamentos e gestão do seu consultório.
              </p>
              <div className="chat-benefits-grid">
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faStethoscope} />
                  <h4>Suporte em Diagnósticos</h4>
                  <p>Análise precisa de radiografias e suporte para diagnósticos complexos</p>
                </div>
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faClipboardList} />
                  <h4>Planejamento de Tratamentos</h4>
                  <p>Orientações sobre protocolos e técnicas odontológicas</p>
                </div>
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faBolt} />
                  <h4>Disponível 24/7</h4>
                  <p>Atendimento imediato quando você precisar, a qualquer hora</p>
                </div>
                <div className="chat-benefit-box">
                  <FontAwesomeIcon icon={faRocket} />
                  <h4>1 Milhão de Tokens</h4>
                  <p>Pergunte quantas vezes precisar durante sua prática clínica</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precificação Section */}
      <section className="precificacao-highlight-section">
        <div className="lp-container">
          <div className="precificacao-highlight-content">
            <div className="precificacao-highlight-left">
              <div className="precificacao-icon-wrapper">
                <FontAwesomeIcon icon={faCoins} className="precificacao-main-icon" />
                <div className="precificacao-icon-glow"></div>
              </div>
            </div>
            <div className="precificacao-highlight-right">
              <div className="precificacao-label">PRECIFICAÇÃO INTELIGENTE</div>
              <h2 className="precificacao-title">A NODON oferece ajuda completa para precificação de seus tratamentos!</h2>
              <p className="precificacao-subtitle">
                Calcule custos, margens de lucro e defina preços competitivos com precisão através de gráficos e análises detalhadas em tempo real.
              </p>
              <div className="precificacao-benefits-grid">
                <div className="precificacao-benefit-box">
                  <FontAwesomeIcon icon={faChartLine} />
                  <h4>Cálculo Automático</h4>
                  <p>Custos diretos e indiretos calculados automaticamente</p>
                </div>
                <div className="precificacao-benefit-box">
                  <FontAwesomeIcon icon={faPercent} />
                  <h4>Análise de Margem</h4>
                  <p>Visualize margens de lucro em tempo real com gráficos</p>
                </div>
                <div className="precificacao-benefit-box">
                  <FontAwesomeIcon icon={faChartBar} />
                  <h4>Gráficos Detalhados</h4>
                  <p>Análises visuais completas para tomada de decisão</p>
                </div>
                <div className="precificacao-benefit-box">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <h4>Alertas Inteligentes</h4>
                  <p>Receba avisos quando o lucro estiver baixo ou ausente</p>
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
              {planos.map((plano, index) => (
                <PricingCard
                  key={plano.id || `plan-${index}`}
                  plano={plano}
                  index={index}
                  cupomValido={cupomValido}
                  cupomData={cupomData}
                  cupomCode={cupomCode}
                  formatarValor={formatarValor}
                  formatarTokens={formatarTokens}
                  handlePlanSelect={handlePlanSelect}
                />
              ))}
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
              <h2>Pronto para transformar seu consultório?</h2>
              <p>Preencha o formulário e comece a usar a melhor plataforma de gestão odontológica com IA!</p>
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
                
                // Evento GTM - Submissão de formulário
                trackFormSubmission('lp_dentista_form', {
                  plano: plano || 'nenhum',
                  origem: 'dentista'
                })
                trackEvent('generate_lead', {
                  form_type: 'lp_dentista',
                  plano: plano || 'nenhum'
                })
                
                const cupomParam = cupomCode ? `&cupom=${encodeURIComponent(cupomCode)}` : ''
                
                if (plano) {
                  navigate(`/checkout?plano=${encodeURIComponent(plano)}&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}&origem=dentista${cupomParam}`)
                } else {
                  navigate(`/checkout?nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}&origem=dentista${cupomParam}`)
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
              <a href="#produtos" onClick={(e) => { e.preventDefault(); scrollToSection('produtos') }}>Produtos</a>
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

export default LPDentista
