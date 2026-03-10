import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
  faTimes,
  faArrowRight,
  faQuoteLeft,
  faCheckCircle,
  faChevronDown,
  faPlay,
  faRocket,
  faShieldAlt,
  faTag,
  faGift,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import xldentistaImg from '../img/xldentista.jpeg'
import exameImg from '../img/exame.jpg'
import agendaImg from '../img/agenda.jpeg'
import preci from '../img/preci.jpeg'
import videoExplicativo from '../video/explicatico.mp4'
import headerVideo from '../video/header.mp4'
import didaticaVideo from '../video/didatica.mp4'
import precificacaoVideo from '../video/precificacao.mp4'
import './LPDentistaPROv2.css'
import './LPDentistaPRO_plans.css'

// Componente individual para cada card de plano
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
  const [isExpanded, setIsExpanded] = useState(false)

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

  const planId = plano.id || `plan-${index}`

  const toggleFeatures = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(prev => !prev)
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
        {!plano.nome?.toLowerCase().includes('estudante') && (
          <div className="plan-free-trial">
            <FontAwesomeIcon icon={faGift} />
            <span>5 dias de teste grátis</span>
          </div>
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

const LPDentistaPROv2 = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [submitStatus, setSubmitStatus] = useState(null)
  const [isValid, setIsValid] = useState(false)
  const [metricsVisible, setMetricsVisible] = useState(false)
  const [counts, setCounts] = useState({ conv: 0, tempo: 0, aceite: 0 })
  const [ripple, setRipple] = useState({ x: 0, y: 0, show: false })
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 })
  const [cupomCode, setCupomCode] = useState('')
  const [cupomValido, setCupomValido] = useState(false)
  const [cupomData, setCupomData] = useState(null)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [currentVideo, setCurrentVideo] = useState('')
  const doresRef = useRef(null)
  const demoRef = useRef(null)
  const socialRef = useRef(null)
  const ctaRef = useRef(null)
  const metricsRef = useRef(null)

  const validateInput = (v) => {
    const val = (v || '').trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    const hasPhone = val.replace(/\D/g, '').length >= 10
    return val.length >= 5 && (isEmail || hasPhone)
  }

  useEffect(() => {
    setIsValid(validateInput(emailOrPhone))
  }, [emailOrPhone])

  // Processar cupom da URL e carregar planos
  useEffect(() => {
    const cupom = searchParams.get('cupom')
    if (cupom) {
      setCupomCode(cupom.toUpperCase())
      validarCupom(cupom.toUpperCase())
    } else {
      setValidandoCupom(false)
    }
    
    loadPlanos()
  }, [searchParams])

  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const response = await api.get('/planos')
      const planosBackend = response.data?.data || response.data || []
      
      const planosExcluidos = [
        'ca772fbf-d9c7-4ef7-9f6c-84e535c393f0',
        '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7'
      ]
      
      const planosIniciais = planosBackend.filter(plano => {
        const isPlanoChat = plano.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' || plano.nome?.toLowerCase().includes('estudante') || plano.nome?.toLowerCase().includes('chat')
        return plano.ativo && !planosExcluidos.includes(plano.id) && !isPlanoChat
      })

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

        const valorOriginalRaw = plano.valorOriginal || plano.valor_original || plano.valor || 0
        const valorPromocionalRaw = plano.valorPromocional || plano.valor_promocional || plano.valorPromo || plano.valor_promo || null
        
        const valorOriginal = typeof valorOriginalRaw === 'string' ? parseFloat(valorOriginalRaw) : (valorOriginalRaw || 0)
        const valorPromocional = valorPromocionalRaw ? (typeof valorPromocionalRaw === 'string' ? parseFloat(valorPromocionalRaw) : valorPromocionalRaw) : null

        const isPlanoInicial = plano.id === '3521d057-f3b3-4ae5-9966-a5bdeddc38f2' || plano.nome?.toLowerCase().includes('inicial')

        if (isPlanoInicial) {
          badge = 'Ideal para Dentistas em crescimento'
          features = [
            'Diagnósticos com IA avançada',
            `Até ${plano.limiteAnalises || 12} análises por mês`,
            'Agendamento de consultas',
            'Anamneses personalizadas',
            'Chat especializado em odontologia 24/7',
            'Precificação de tratamentos',
            'Feedbacks e avaliações',
            'Gráficos customizados',
            'Gestão completa de pacientes',
            'Relatórios detalhados',
            'Armazenamento ilimitado na nuvem',
            plano.tokenChat ? `${formatarTokensAux(plano.tokenChat)} de tokens` : '1 milhão de tokens',
            'Acesso mobile completo',
            'Sem fidelidade - cancele quando quiser'
          ]
        } else {
          features = [
            'Diagnósticos com IA avançada',
            plano.limiteAnalises ? `Até ${plano.limiteAnalises} análises por mês` : 'Análises ilimitadas',
            'Agendamento de consultas',
            'Anamneses personalizadas',
            'Chat especializado em odontologia 24/7',
            'Precificação de tratamentos',
            'Feedbacks e avaliações',
            'Gráficos customizados',
            'Gestão completa de pacientes',
            'Relatórios detalhados',
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

  // Scroll reveal: adiciona .visible na seção DORES quando entra na view
  useEffect(() => {
    const el = doresRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.classList.add('visible')
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Count-up quando prova social entra na view
  useEffect(() => {
    const el = metricsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setMetricsVisible(true)
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!metricsVisible) return
    const duration = 1500
    const steps = 40
    const stepMs = duration / steps
    const targets = { conv: 34, tempo: 42, aceite: 28 }
    let step = 0
    const t = setInterval(() => {
      step++
      const progress = step / steps
      setCounts({
        conv: Math.round(targets.conv * progress),
        tempo: Math.round(targets.tempo * progress),
        aceite: Math.round(targets.aceite * progress)
      })
      if (step >= steps) clearInterval(t)
    }, stepMs)
    return () => clearInterval(t)
  }, [metricsVisible])

  const handleCtaClick = () => {
    setTimeout(() => setRipple((p) => ({ ...p, show: false })), 600)
    const message = encodeURIComponent("Gostaria de entender melhor a NODON.")
    const whatsappNumber = "5511932589622"
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
  }

  const handlePlanSelect = (planoNome, planoId) => {
    const cupomParam = cupomCode ? `&cupom=${encodeURIComponent(cupomCode)}` : ''
    navigate(`/checkout?plano=${encodeURIComponent(planoNome)}&planoId=${planoId}&origem=dentista-pro-v2${cupomParam}`)
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

  const handleCtaMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15
    setBtnPos({ x, y })
  }

  const handleVideoClick = (videoSrc) => {
    setCurrentVideo(videoSrc)
    setVideoModalOpen(true)
  }

  const closeModal = () => {
    setVideoModalOpen(false)
    setCurrentVideo('')
  }

  const handleCtaMouseLeave = () => setBtnPos({ x: 0, y: 0 })

  const handleFooterSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitStatus('success')
    setEmailOrPhone('')
  }

  return (
    <div className="lp-dentista-pro-v2">
      {/* Banner de Cupom */}
      {cupomCode && (
        <div className={`cupom-banner ${cupomValido ? 'valid' : 'invalid'}`}>
          <div className="cupom-banner-content">
            {cupomCode?.toUpperCase() === 'XL20' && cupomValido && (
              <img src={xldentistaImg} alt="Cupom XL20" className="cupom-image" />
            )}
            <FontAwesomeIcon icon={faRocket} />
            <span>
              Cupom <strong>{cupomCode}</strong> {cupomValido ? 'ativo!' : 'inválido'}
            </span>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <header className="lp-v2-header">
        <div className="lp-v2-header-inner">
          <a href="/" className="lp-v2-logo">
            <img src={nodoLogo} alt="NODON" width="120" height="40" loading="lazy" />
          </a>
          <nav className={`lp-v2-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#dores">Dores</a>
            <a href="#demo">Demonstração</a>
            <a href="#prova-social">Resultados</a>
            <button type="button" className="lp-v2-cta-nav" onClick={() => navigate('/register')}>
              Transformar minha renda
            </button>
          </nav>
          <button type="button" className="lp-v2-menu-btn" aria-label="Menu" onClick={() => setMobileMenuOpen((o) => !o)}>
            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-v2-hero">
        <video
          src={headerVideo}
          className="lp-v2-hero-video"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="lp-v2-hero-video-overlay" aria-hidden="true" />
        <div className="lp-v2-hero-bg" aria-hidden="true" />
        <div className="lp-v2-container lp-v2-hero-inner">
          <img src={nodoLogo} alt="NODON" className="lp-v2-hero-logo" width="160" height="160" />
          <h1 className="lp-v2-hero-title">
            Nodon: otimiza e organiza<span className="lp-v2-highlight"> gerando mais resultados</span>
          </h1>
          <p className="lp-v2-hero-sub">
            A NODON une diagnóstico com IA, precificação cirúrgica e agenda inteligente. Healthtech para quem quer liderar.
          </p>
          <button type="button" className="lp-v2-hero-cta" onClick={() => navigate('/register')}>
            QUERO CONHECER A NODON
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
        <a href="#dores" className="lp-v2-hero-scroll" aria-label="Rolar">
          <FontAwesomeIcon icon={faChevronDown} />
        </a>
      </section>

      {/* 1. DORES */}
      <section id="dores" className="lp-v2-dores" ref={doresRef}>
        <div className="lp-v2-dores-parallax-bg" aria-hidden="true" />
        <div className="lp-v2-container lp-v2-dores-inner">
          <div className="lp-v2-dores-head">
            <p className="lp-v2-dores-label lp-v2-reveal">As dores do consultório</p>
            <h2 className="lp-v2-dores-title lp-v2-reveal">
              O paciente fecha com quem inspira confiança<br className="lp-v2-br-desktop" />  e é mais rapido.
            </h2>
            <span className="lp-v2-dores-line lp-v2-reveal" aria-hidden="true" />
          </div>
          <div className="lp-v2-dores-cards">
            <div className="lp-v2-dor-card lp-v2-stagger-1">
              <div className="lp-v2-dor-shape lp-v2-shape-1" aria-hidden="true" />
              <span className="lp-v2-dor-icon lp-v2-icon-loop">?</span>
              <h3>Seu paciente não entende o tratamento.</h3>
              <p>Falta de clareza gera adiamento e desconfiança.</p>
            </div>
            <div className="lp-v2-dor-card lp-v2-stagger-2">
              <div className="lp-v2-dor-shape lp-v2-shape-2" aria-hidden="true" />
              <span className="lp-v2-dor-icon lp-v2-icon-loop">⏱</span>
              <h3>Agendamentos lentos e confirmação no papel.</h3>
              <p>Agenda que depende de ligação e WhatsApp. O paciente confirma (ou não) e a cadeira fica vazia.</p>
            </div>
            <div className="lp-v2-dor-card lp-v2-stagger-3">
              <div className="lp-v2-dor-shape lp-v2-shape-3" aria-hidden="true" />
              <span className="lp-v2-dor-icon lp-v2-icon-loop">📋</span>
              <h3>Decisões são adiadas por falta de clareza.</h3>
              <p>Sem visão do plano e do valor, o paciente não fecha.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEMONSTRAÇÃO VISUAL */}
      <section id="demo" className="lp-pro-bento" ref={demoRef}>
        <div className="lp-pro-container">
          <h2 className="lp-pro-section-title">Veja a NODON em Ação</h2>
          <p className="lp-pro-section-sub">Transforme sua clínica com IA que realmente funciona. Assista aos vídeos e descubra o poder da automação odontológica.</p>
          
          {/* Grid de Vídeos */}
          <div className="demo-grid">
            <div className="demo-card">
              <div className="demo-video-container" onClick={() => handleVideoClick(headerVideo)}>
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="demo-video"
                  poster={xldentistaImg}
                >
                  <source src={headerVideo} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
                <div className="demo-overlay">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
              <div className="demo-content">
                <h3>Dashboard Principal</h3>
                <p>Interface completa com todos os recursos em um só lugar. Controle total da sua clínica.</p>
                <ul className="demo-features">
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Visão geral em tempo real</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Métricas e analytics</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Acesso rápido aos pacientes</li>
                </ul>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-video-container">
                <img 
                  src={agendaImg}
                  className="demo-video"
                  alt="Agendamento Inteligente"
                />
                <div className="demo-overlay">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
              <div className="demo-content">
                <h3>Agendamento Inteligente</h3>
                <p>Gestão de consultas automatizada com IA que otimiza seu tempo e maximiza agenda.</p>
                <ul className="demo-features">
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Agendamento automático</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Lembretes inteligentes</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Otimização de horários</li>
                </ul>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-video-container" onClick={() => handleVideoClick(didaticaVideo)}>
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="demo-video"
                >
                  <source src={didaticaVideo} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
                <div className="demo-overlay">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
              <div className="demo-content">
                <h3>Aumente a aceitação dos tratamentos pelos clientes</h3>
                <p>Transforme a experiência dos pacientes com comunicação clara e profissional. Mostre o valor dos seus tratamentos de forma transparente.</p>
                <ul className="demo-features">
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Comunicação clara</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Transparência nos valores</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Confiança aumentada</li>
                </ul>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-video-container">
                <img 
                  src={preci}
                  className="demo-video"
                  alt="Precificação"
                />
              </div>
              <div className="demo-content">
                <h3>Precificação Automática</h3>
                <p>Cálculo inteligente de valores com base em procedimentos, materiais e mercado.</p>
                <ul className="demo-features">
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Preços dinâmicos</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Relatórios financeiros</li>
                  <li><FontAwesomeIcon icon={faCheckCircle} /> Integração com planos</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="demo-cta">
            <button className="demo-cta-btn" onClick={() => navigate('/register')}>
              <span>Começar Agora</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <div className="demo-trust">
              <FontAwesomeIcon icon={faShieldAlt} />
              <span>Teste grátis por 7 dias • Sem compromisso</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROVA SOCIAL */}
      <section id="prova-social" className="lp-v2-social" ref={socialRef}>
        <div className="lp-v2-container">
          <h2 className="lp-v2-section-title">O que mudou para quem usa a NODON</h2>
          <div className="lp-v2-metrics" ref={metricsRef}>
            <div className="lp-v2-metric">
              <span className="lp-v2-metric-value">+{counts.conv}%</span>
              <span className="lp-v2-metric-label">conversão</span>
            </div>
            <div className="lp-v2-metric">
              <span className="lp-v2-metric-value">{counts.tempo}%</span>
              <span className="lp-v2-metric-label">Aumento no lucro</span>
            </div>
            <div className="lp-v2-metric">
              <span className="lp-v2-metric-value">+{counts.aceite}%</span>
              <span className="lp-v2-metric-label">aceitação de tratamentos</span>
            </div>
          </div>
          <div className="lp-v2-carousel-wrap">
            <div className="lp-v2-carousel">
              {[1, 2, 3].map((i) => (
                <div key={i} className="lp-v2-social-card">
                  <div className="lp-v2-card-reflection" aria-hidden="true" />
                  <FontAwesomeIcon icon={faQuoteLeft} className="lp-v2-quote" />
                  <p>Com a NODON, o paciente vê o plano na hora. Menos dúvida, mais fechamento.</p>
                  <span className="lp-v2-cro">CRO-SP</span>
                </div>
              ))}
              {[1, 2, 3].map((i) => (
                <div key={`dup-${i}`} className="lp-v2-social-card">
                  <div className="lp-v2-card-reflection" aria-hidden="true" />
                  <FontAwesomeIcon icon={faQuoteLeft} className="lp-v2-quote" />
                  <p>Precificação e agenda em um lugar. Aumente seu lucro e organize seu tempo.</p>
                  <span className="lp-v2-cro">CRO-MG</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE PLANOS */}
      <section className="plans-section" id="planos">
        <div className="plans-bg"></div>
        <div className="lp-v2-container">
          <div className="section-label">
            <span>PLANOS</span>
          </div>
          <h2 className="lp-v2-section-title">Escolha seu plano</h2>
          
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

      {/* 5. CTA PRINCIPAL */}
      <section className="lp-v2-cta-final" ref={ctaRef}>
        <div className="lp-v2-particles" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="lp-v2-particle" style={{ '--i': i }} />
          ))}
        </div>
        <div className="lp-v2-container lp-v2-cta-inner">
          <h2 className="lp-v2-cta-headline">Transforme seu tempo com tecnologia de verdade.</h2>
          <p className="lp-v2-cta-sub">Mais clareza. Mais confiança. Mais tratamentos fechados.</p>
          <button
            type="button"
            className="lp-v2-cta-btn"
            onClick={handleCtaClick}
            onMouseMove={handleCtaMouseMove}
            onMouseLeave={handleCtaMouseLeave}
            style={{ transform: `translate(${btnPos.x}px, ${btnPos.y}px)` }}
          >
            {ripple.show && (
              <span
                className="lp-v2-ripple"
                style={{ left: ripple.x, top: ripple.y }}
              />
            )}
            Quero transformar minha vida
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </section>

      {/* FOOTER LEVE */}
      <footer className="lp-v2-footer">
        <div className="lp-v2-container">
          <p className="lp-v2-footer-sub"> WhatsApp. Nós entramos em contato.</p>
          <form className="lp-v2-footer-form" onSubmit={handleFooterSubmit}>
            <input
              type="text"
              placeholder="WhatsApp"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="lp-v2-footer-input"
              aria-label="WhatsApp"
            />
            <button type="submit" className="lp-v2-footer-btn" disabled={!isValid}>
              Enviar
            </button>
          </form>
          {submitStatus === 'success' && (
            <p className="lp-v2-footer-success">
              <FontAwesomeIcon icon={faCheckCircle} /> Recebemos seu contato.
            </p>
          )}
        </div>
      </footer>

      {/* Modal de Vídeo */}
      {videoModalOpen && (
        <div className="video-modal" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <video 
              controls
              autoPlay
              playsInline
              className="video-modal-video"
            >
              <source src={currentVideo} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
          </div>
        </div>
      )}
    </div>
  )
}

export default LPDentistaPROv2
