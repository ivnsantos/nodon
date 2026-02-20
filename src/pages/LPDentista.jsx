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
  faChartBar, faExclamationTriangle, faDollarSign, faFileInvoiceDollar, faClock,
  faFire, faTrophy, faUserCheck, faArrowUp, faHeartbeat
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faYoutube, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import { trackButtonClick, trackFormSubmission, trackEvent } from '../utils/gtag'
import nodoLogo from '../img/nodo.png'
import dentistaImg from '../img/especializacao-em-odontologia-1.jpg'
import xldentistaImg from '../img/xldentista.jpeg'
import draisadentistaImg from '../img/DRAISADENTISTA.JPEG'
import julia20Img from '../img/JULIA20.jpeg'
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
      
      // IDs dos planos que devem ser excluídos (planos de teste e Plano Chat)
      const planosExcluidos = [
        'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0',  // Plano Teste
        '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7'   // Plano Chat
      ]
      
      // Filtra todos os planos ativos, exceto os planos excluídos
      // Exclui o Plano Chat da landing page de dentista
      const planosIniciais = planosBackend.filter(plano => {
        const isPlanoChat = plano.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' || plano.nome?.toLowerCase().includes('chat')
        return plano.ativo && !planosExcluidos.includes(plano.id) && !isPlanoChat
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

    // Garantir que o código do cupom sempre seja enviado em maiúsculas
    const codigoNormalizado = codigo.toString().toUpperCase().trim()

    setValidandoCupom(true)
    try {
      const response = await api.get(`/cupons/name/${codigoNormalizado}`)
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
      const headerHeight = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
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
    const cupomUpper = cupomCode?.toUpperCase() || ''
    
    if (cupomUpper === 'DRAISADENTISTA' && cupomValido) {
      return draisadentistaImg
    }
    if (cupomUpper === 'JULIA20' && cupomValido) {
      return julia20Img
    }
    if ((cupomUpper === 'XL20' || cupomUpper === 'XLDENTISTA') && cupomValido) {
      return xldentistaImg
    }
    return dentistaImg
  }

  const getHeroImageAlt = () => {
    const cupomUpper = cupomCode?.toUpperCase() || ''
    
    if (cupomUpper === 'DRAISADENTISTA' && cupomValido) {
      return "Cupom DRAISADENTISTA"
    }
    if (cupomUpper === 'JULIA20' && cupomValido) {
      return "Cupom JULIA20"
    }
    if ((cupomUpper === 'XL20' || cupomUpper === 'XLDENTISTA') && cupomValido) {
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
            {cupomCode?.toUpperCase() === 'DRAISADENTISTA' && cupomValido && (
              <img src={draisadentistaImg} alt="Cupom DRAISADENTISTA" className="cupom-image" />
            )}
            {cupomCode?.toUpperCase() === 'JULIA20' && cupomValido && (
              <img src={julia20Img} alt="Cupom JULIA20" className="cupom-image" />
            )}
            {(cupomCode?.toUpperCase() === 'XL20' || cupomCode?.toUpperCase() === 'XLDENTISTA') && cupomValido && (
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
            <div className="logo-wrapper">
              <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={nodoLogo} alt="NODON" />
              </div>
            </div>
            <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="nav-links">
                <a href="#sobre" onClick={(e) => { e.preventDefault(); scrollToSection('sobre') }}>Sobre</a>
                <a href="#planos" onClick={(e) => { e.preventDefault(); scrollToSection('planos') }}>Planos</a>
                <a href="#contato" onClick={(e) => { e.preventDefault(); scrollToSection('contato') }}>Contato</a>
              </div>
              <button className="btn-cta-header" onClick={handleCtaClick}>
                Começar Agora
              </button>
            </nav>
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero - Layout Minimalista */}
      <section className="hero-section">
        <div className="lp-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
              Mais Tratamentos e Mais Lucro.
              </h1>
              <p className="hero-description">
                Aumente sua receita, economize tempo e alcance a liberdade financeira. Tudo em uma plataforma completa feita para dentistas.
              </p>
              <div className="hero-features">
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Diagnósticos em segundos</span>
                </div>
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>+30% na receita</span>
                </div>
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Assistente IA 24/7</span>
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
            <div className="hero-image-container">
              <img 
                key={`hero-img-${cupomCode}-${cupomValido}`}
                src={getHeroImage()} 
                alt={getHeroImageAlt()} 
                className="hero-image" 
              />
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <div className="metric-value">+1.200</div>
              <div className="metric-label">Dentistas</div>
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

      {/* Seção: Por que você precisa da NODON - Versão Ultra Persuasiva */}
      <section className="why-nodon-section" id="sobre">
        <div className="lp-container">
          {/* Abertura Impactante */}
          <div className="why-nodon-opener">
            <div className="opener-badge">
              <FontAwesomeIcon icon={faFire} />
              <span>FEITA ESPECIFICAMENTE PARA VOCÊ</span>
            </div>
            <h1 className="opener-title">
              Pare de perder <span className="highlight-red">dinheiro</span>, <span className="highlight-red">tempo</span> e <span className="highlight-red">pacientes</span>.
              <br />
              Comece a <span className="highlight-blue">ganhar mais</span>, <span className="highlight-blue">trabalhar menos</span> e <span className="highlight-blue">crescer</span>.
            </h1>
            <p className="opener-subtitle">
              A NODON não é apenas uma ferramenta. É sua <strong>vantagem competitiva</strong> para transformar seu tempo e sua carreia e alcançar a liberdade financeira que você merece.
            </p>
          </div>

          {/* Comparação Visual: Antes vs Depois */}
          <div className="before-after-comparison">
            <div className="comparison-header">
              <h2>Sua Realidade Atual vs Com a NODON</h2>
              <p>Veja a diferença que faz na sua prática clínica</p>
            </div>
            
            <div className="comparison-grid">
              <div className="comparison-column before">
                <div className="comparison-label">
                  <FontAwesomeIcon icon={faTimes} />
                  <span>SEM A NODON</span>
                </div>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="item-content">
                      <h4>3-5 horas por dia</h4>
                      <p>Analisando, contando gastos, fazendo orçamentos manualmente, perdendo tempo precioso</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faDollarSign} />
                    </div>
                    <div className="item-content">
                      <h4>Precificação no "achismo"</h4>
                      <p>Deixando dinheiro na mesa por não saber o custo real</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div className="item-content">
                      <h4>Pacientes perdidos</h4>
                      <p>Falta de follow-up e organização resulta em vendas perdidas</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </div>
                    <div className="item-content">
                      <h4>Dúvidas sem resposta</h4>
                      <p>Sem suporte quando você mais precisa, especialmente fora do horário</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faFileMedical} />
                    </div>
                    <div className="item-content">
                      <h4>Documentos desorganizados</h4>
                      <p>Informações espalhadas, difícil de encontrar quando precisa</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="comparison-column after">
                <div className="comparison-label good">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>COM A NODON</span>
                </div>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faBolt} />
                    </div>
                    <div className="item-content">
                      <h4>Diagnósticos em segundos</h4>
                      <p>IA especializada analisa radiografias instantaneamente, liberando horas do seu dia</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <div className="item-content">
                      <h4>Precificação inteligente</h4>
                      <p>Cálculo automático de custos e margens. Maximize lucros com dados reais</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faTrophy} />
                    </div>
                    <div className="item-content">
                      <h4>Gestão completa</h4>
                      <p>Orçamentos, pacientes e follow-ups organizados. Nunca mais perca uma venda</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faBrain} />
                    </div>
                    <div className="item-content">
                      <h4>Assistente IA 24/7</h4>
                      <p>1 milhão de tokens para tirar dúvidas a qualquer hora, sobre qualquer assunto</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faCloud} />
                    </div>
                    <div className="item-content">
                      <h4>Tudo na nuvem</h4>
                      <p>Acesso seguro de qualquer lugar, em qualquer dispositivo, sempre organizado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Números que Impactam */}
          <div className="why-nodon-stats">
            <div className="stats-header">
              <h2>Resultados Reais. Transformação Imediata.</h2>
              <p>Veja o impacto que a NODON tem na prática clínica de dentistas como você</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card mega">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div className="stat-number">10+</div>
                <div className="stat-unit">horas/semana</div>
                <div className="stat-label">Economizadas</div>
              </div>

              <div className="stat-card mega">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="stat-number">30%+</div>
                <div className="stat-unit">aumento</div>
                <div className="stat-label">Na Receita</div>
              </div>

              <div className="stat-card mega">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <div className="stat-number">1M</div>
                <div className="stat-unit">tokens</div>
                <div className="stat-label">De IA Disponível</div>
              </div>

              <div className="stat-card mega">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faUserCheck} />
                </div>
                <div className="stat-number">100%</div>
                <div className="stat-unit">organizado</div>
                <div className="stat-label">Tudo na Nuvem</div>
              </div>
            </div>
          </div>

          {/* Transformação Completa */}
          <div className="transformation-section">
            <div className="transformation-header">
              <div className="section-label">
                <span>SUA TRANSFORMAÇÃO</span>
              </div>
              <h2>De sobrecarregado para livre. De inseguro para confiante.</h2>
              <p>A NODON não é apenas software. É sua jornada para a excelência profissional e liberdade financeira.</p>
            </div>

            <div className="transformation-grid">
              <div className="transformation-card">
                <div className="transformation-number">01</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faXRay} />
                </div>
                <h3>Diagnósticos Instantâneos</h3>
                <p>IA especializada analisa radiografias em <strong>segundos</strong>. O que antes levava horas, agora leva instantes. Mais precisão, menos tempo.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Resultados em tempo real</span>
                </div>
              </div>

              <div className="transformation-card">
                <div className="transformation-number">02</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faCoins} />
                </div>
                <h3>Precificação que Gera Lucro</h3>
                <p>Cálculo automático de custos diretos, indiretos e margens. <strong>Não deixe dinheiro na mesa</strong> por falta de informação.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Gráficos e alertas visuais</span>
                </div>
              </div>

              <div className="transformation-card">
                <div className="transformation-number">03</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                </div>
                <h3>Orçamentos que Convertem</h3>
                <p>Crie orçamentos profissionais em <strong>minutos</strong>. Gerencie status, acompanhe aprovações e feche mais vendas.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Gestão completa de itens</span>
                </div>
              </div>

              <div className="transformation-card">
                <div className="transformation-number">04</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faBrain} />
                </div>
                <h3>Assistente IA Sempre Disponível</h3>
                <p>1 milhão de tokens para tirar dúvidas sobre diagnósticos, tratamentos e gestão. <strong>24/7, sempre disponível</strong>.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Especializada em odontologia</span>
                </div>
              </div>

              <div className="transformation-card">
                <div className="transformation-number">05</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <h3>Gestão Total de Pacientes</h3>
                <p>Todos os seus pacientes, histórico, tratamentos e documentos <strong>organizados e seguros</strong> na nuvem.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Busca avançada e filtros</span>
                </div>
              </div>

              <div className="transformation-card">
                <div className="transformation-number">06</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faDollarSign} />
                </div>
                <h3>Liberdade Financeira</h3>
                <p>Controle total sobre receitas, despesas e planejamento. <strong>Relatórios detalhados</strong> para decisões estratégicas.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Análise em tempo real</span>
                </div>
              </div>
            </div>
          </div>

          {/* Urgência e CTA Final */}
          <div className="why-nodon-urgency">
            <div className="urgency-content">
              <div className="urgency-badge">
                <FontAwesomeIcon icon={faFire} />
                <span>NÃO PERCA MAIS TEMPO</span>
              </div>
              <h2 className="urgency-title">
                Enquanto você espera, seus concorrentes estão <span className="highlight">ganhando mais</span> e <span className="highlight">trabalhando menos</span>
              </h2>
              <p className="urgency-subtitle">
                Dentistas que já usam a NODON estão transformando suas práticas clínicas AGORA. Não fique para trás.
              </p>

              <div className="urgency-comparison">
                <div className="urgency-item">
                  <div className="urgency-icon">
                    <FontAwesomeIcon icon={faTrophy} />
                  </div>
                  <div className="urgency-text">
                    <strong>Aumentando receita</strong> com precificação inteligente
                  </div>
                </div>
                <div className="urgency-item">
                  <div className="urgency-icon">
                    <FontAwesomeIcon icon={faUserCheck} />
                  </div>
                  <div className="urgency-text">
                    <strong>Ganando mais pacientes</strong> com diagnósticos rápidos
                  </div>
                </div>
                <div className="urgency-item">
                  <div className="urgency-icon">
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <div className="urgency-text">
                    <strong>Economizando tempo</strong> para focar no essencial
                  </div>
                </div>
                <div className="urgency-item">
                  <div className="urgency-icon">
                    <FontAwesomeIcon icon={faRocket} />
                  </div>
                  <div className="urgency-text">
                    <strong>Diferencial competitivo</strong> que atrai e fideliza
                  </div>
                </div>
              </div>

              <div className="urgency-cta-box">
                <div className="cta-box-content">
                  <h3>Pronto para transformar sua carreira?</h3>
                  <p>Junte-se a centenas de dentistas que já estão usando a NODON para alcançar a liberdade financeira e profissional que merecem.</p>
                  <div className="cta-benefits">
                    <div className="cta-benefit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Comece hoje</span>
                    </div>
                    <div className="cta-benefit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Sem fidelidade</span>
                    </div>
                    <div className="cta-benefit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Resultados imediatos</span>
                    </div>
                  </div>
                  <button className="btn-hero-main urgency-btn" onClick={handleCtaClick}>
                    Começar Agora
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
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
      <section className="cta-section" id="contato">
        <div className="lp-container">
          <div className="cta-wrapper">
            <div className="cta-left">
              <div className="section-label">
                <span>COMEÇAR AGORA</span>
              </div>
              <h2>Pronto para transformar sua carreira?</h2>
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
              <a href="#sobre" onClick={(e) => { e.preventDefault(); scrollToSection('sobre') }}>Sobre</a>
              <a href="#planos" onClick={(e) => { e.preventDefault(); scrollToSection('planos') }}>Planos</a>
              <a href="#contato" onClick={(e) => { e.preventDefault(); scrollToSection('contato') }}>Contato</a>
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

