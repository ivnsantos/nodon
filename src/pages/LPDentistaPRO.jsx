import { useState, useEffect } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
  faTimes,
  faArrowRight,
  faQuoteLeft,
  faCheckCircle,
  faXRay,
  faChartLine,
  faCalendarAlt,
  faChevronDown,
  faCalendarCheck,
  faPlay,
  faRocket,
  faShieldAlt,
  faTag,
  faGift,
  faChevronUp,
  faUsers,
  faRobot
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'

import nodoLogo from '../img/nodo.png'

import xldentistaImg from '../img/xldentista.jpeg'

import exameImg from '../img/exame.jpg'

import agendaImg from '../img/agenda.jpeg'

import octttttImg from '../img/octtttt_8.jpg'

import videoExplicativo from '../video/explicatico.mp4'

import headerVideo from '../video/header.mp4'

import didaticaVideo from '../video/didatica.mp4'

import preci from '../img/preci.jpeg'

import './LPDentistaPRO.css'
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

const LPDentistaPRO = () => {

  const navigate = useNavigate()

  const [searchParams] = useSearchParams()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [emailOrPhone, setEmailOrPhone] = useState('')

  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

  const [isValid, setIsValid] = useState(false)

  const [cupomCode, setCupomCode] = useState('')
  const [cupomValido, setCupomValido] = useState(false)
  const [cupomData, setCupomData] = useState(null)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState('')



  const validateInput = (value) => {

    const v = (value || '').trim()

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

    const isPhone = /^[\d\s()\-+]{10,20}$/.test(v.replace(/\D/g, '') ? v : '')

    return v.length >= 5 && (isEmail || (v.replace(/\D/g, '').length >= 10))

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
  };

  const handleCtaClick = () => {
    const message = encodeURIComponent("Gostaria de entender melhor a NODON.");
    const whatsappNumber = "5511932589622";
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handlePlanSelect = (planoNome, planoId) => {
    const cupomParam = cupomCode ? `&cupom=${encodeURIComponent(cupomCode)}` : '';
    navigate(`/checkout?plano=${encodeURIComponent(planoNome)}&planoId=${planoId}&origem=dentista-pro${cupomParam}`);
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarTokens = (tokens) => {
    const numTokens = parseInt(tokens) || 0;
    if (numTokens >= 1000000) {
      return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`;
    } else if (numTokens >= 1000) {
      return `${(numTokens / 1000).toFixed(0)} mil`;
    }
    return numTokens.toString();
  };

  const handleFooterSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitStatus('success')
    setEmailOrPhone('')
  }



  const handleVideoClick = (videoSrc) => {

    setCurrentVideo(videoSrc)

    setVideoModalOpen(true)

  }



  const closeModal = () => {

    setVideoModalOpen(false)

    setCurrentVideo('')

  }



  return (

    <div className="lp-pro">

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



      <header className="lp-pro-header">

        <div className="lp-pro-header-inner">

          <a href="/" className="lp-pro-logo">

            <img src={nodoLogo} alt="NODON" width="120" height="40" loading="lazy" />

          </a>

          <nav className={`lp-pro-nav ${mobileMenuOpen ? 'open' : ''}`}>

            <a href="#dores">Dores</a>

            <a href="#funcionalidades">Funcionalidades</a>

            <a href="#fluxo">Fluxo</a>

            <a href="#prova-social">Depoimentos</a>

            <button type="button" className="lp-pro-cta-nav" onClick={handleCtaClick}>

              QUERO DOMINAR 

            </button>

          </nav>

          <button

            type="button"

            className="lp-pro-menu-btn"

            aria-label="Menu"

            onClick={() => setMobileMenuOpen((o) => !o)}

          >

            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />

          </button>

        </div>

      </header>



      {/* 1. HERO */}

      <section className="lp-pro-hero">
        <div className="lp-pro-hero-bg" style={{ backgroundImage: `url(${octttttImg})` }} aria-hidden="true" />
        <div className="lp-pro-hero-mesh" aria-hidden="true" />
        <div className="lp-pro-hero-glow" aria-hidden="true" />
        
        {/* Partículas sutis */}
        <div className="lp-pro-hero-particles" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="particle" style={{ '--i': i }} />
          ))}
        </div>
        
        <div className="lp-pro-container lp-pro-hero-inner">
          <div className="lp-pro-hero-center">
            <div className="lp-pro-hero-badge">
              <FontAwesomeIcon icon={faRocket} />
              <span>PLATAFORMA COMPROVADA</span>
            </div>
            
            <h1 className="lp-pro-hero-title">
              Transforme sua carreira<br />
              <span className="lp-pro-highlight">Organize seu tempo</span>
            </h1>
            
            <p className="lp-pro-hero-sub">
              Diagnósticos precisos em segundos. Orçamentos automáticos.<br />
              Agenda sempre cheia. Tudo em uma plataforma inteligente.
            </p>
            
            <div className="lp-pro-hero-stats-mini">
              <div className="stat-mini">
                <span className="stat-mini-number">+1.200</span>
                <span className="stat-mini-label">Dentistas</span>
              </div>
              <div className="stat-mini-divider"></div>
              <div className="stat-mini">
                <span className="stat-mini-number">30%</span>
                <span className="stat-mini-label">Mais Lucro</span>
              </div>
              <div className="stat-mini-divider"></div>
              <div className="stat-mini">
                <span className="stat-mini-number">24/7</span>
                <span className="stat-mini-label">IA Ativa</span>
              </div>
            </div>

            <button type="button" className="lp-pro-cta-glow" onClick={handleCtaClick}>
              <span>QUERO AUMENTAR MEU LUCRO</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          
          </div>
        </div>

        <a href="#dores" className="lp-pro-hero-scroll" aria-label="Rolar para baixo">
          <FontAwesomeIcon icon={faChevronDown} />
        </a>
      </section>



      {/* 2. SEÇÃO DE DORES */}

      <section id="dores" className="lp-pro-dores">

        <div className="lp-pro-container">

          <h2 className="lp-pro-section-title">Você ainda perde tempo (e dinheiro) com isso?</h2>

          <div className="lp-pro-dores-grid">

            <div className="lp-pro-dor-card">

              <span className="lp-pro-dor-icon">📋</span>

              <h3>Papéis e planilhas que ninguém acha</h3>

              <p>Prontuários perdidos, orçamentos em Excel e zero visão do fluxo real.</p>

            </div>

            <div className="lp-pro-dor-card">

              <span className="lp-pro-dor-icon">⏱️</span>

              <h3>Relógio correndo contra você</h3>

              <p>Consultas atrasadas, agenda cheia de buracos e burnout à vista.</p>

            </div>

            <div className="lp-pro-dor-card">

              <span className="lp-pro-dor-icon">💰</span>

              <h3>Precificação no chute</h3>

              <p>Lucro que some no fim do mês porque o preço não cobre custo real.</p>

            </div>

          </div>

        </div>

      </section>



      {/* 3. CHAOS VS ORDER */}

      <section className="lp-pro-chaos-order">

        <div className="lp-pro-container lp-pro-chaos-inner">

          <div className="lp-pro-chaos-side lp-pro-chaos-left">

            <h3>O caos do dia a dia</h3>

            <ul>

              <li>Papéis empilhados</li>

              <li>Relógio correndo</li>

              <li>Moedas sumindo</li>

              <li>Agenda desorganizada</li>

            </ul>

          </div>

          <div className="lp-pro-chaos-arrow">

            <FontAwesomeIcon icon={faArrowRight} />

          </div>

          <div className="lp-pro-chaos-side lp-pro-chaos-right">

            <h3>A ordem NODON</h3>

            <div className="lp-pro-chaos-preview">

              <img src={nodoLogo} alt="Interface NODON" width="160" height="80" loading="lazy" />

              <p>Diagnóstico · Precificação · Agenda</p>

            </div>

          </div>

        </div>

      </section>



      {/* 4. SEÇÃO DE DEMONSTRAÇÃO */}

      <section id="funcionalidades" className="lp-pro-bento">

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

                  poster={agendaImg}

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

            <button className="demo-cta-btn" onClick={handleCtaClick}>

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



      {/* 5. FLUXO 360º */}

      <section className="lp-pro-demo">

        <div className="lp-pro-container">

          <h2 className="lp-pro-section-title">Veja o fluxo na prática</h2>

          <div className="lp-pro-demo-wrap">

            <div className="lp-pro-demo-prints">

              <img src={xldentistaImg} alt="Tela da NODON - consultório" loading="lazy" />

              <img src={exameImg} alt="Diagnóstico com IA" loading="lazy" />

            </div>

            <div className="lp-pro-demo-video-wrap">

              <video

                src={videoExplicativo}

                controls

                playsInline

                poster={xldentistaImg}

                className="lp-pro-demo-video"

              >

                Seu navegador não suporta vídeo.

              </video>

              <p className="lp-pro-demo-caption">Vídeo explicativo do fluxo NODON</p>

            </div>

          </div>

        </div>

      </section>



      {/* 6. FLUXO 360º */}

      <section id="fluxo" className="lp-pro-fluxo">

        <div className="lp-pro-container">

          <h2 className="lp-pro-section-title">
            O fluxo <span className="highlight-gradient">360º</span> do seu paciente
          </h2>

          <div className="lp-pro-fluxo-timeline">

            <div className="lp-pro-fluxo-line" aria-hidden="true" />

            <div className="lp-pro-fluxo-items">

              <div className="lp-pro-fluxo-item">

                <div className="lp-pro-fluxo-dot-wrapper">
                  <span className="lp-pro-fluxo-dot">
                    <FontAwesomeIcon icon={faUsers} />
                  </span>
                  <div className="dot-pulse"></div>
                </div>

                <div className="lp-pro-fluxo-content">

                  <h4>Captação</h4>

                  <p>Paciente chega. Cadastro automático. Tudo começa aqui.</p>

                </div>

              </div>

              <div className="lp-pro-fluxo-item">

                <div className="lp-pro-fluxo-dot-wrapper">
                  <span className="lp-pro-fluxo-dot">
                    <FontAwesomeIcon icon={faXRay} />
                  </span>
                  <div className="dot-pulse"></div>
                </div>

                <div className="lp-pro-fluxo-content">

                  <h4>Diagnóstico</h4>

                  <p>Análise inteligente. Orçamento preciso na hora.</p>

                </div>

              </div>

              <div className="lp-pro-fluxo-item">

                <div className="lp-pro-fluxo-dot-wrapper">
                  <span className="lp-pro-fluxo-dot">
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </span>
                  <div className="dot-pulse"></div>
                </div>

                <div className="lp-pro-fluxo-content">

                  <h4>Pagamento</h4>

                  <p>Precificação estratégica. Lucro maximizado.</p>

                </div>

              </div>

              <div className="lp-pro-fluxo-item">

                <div className="lp-pro-fluxo-dot-wrapper">
                  <span className="lp-pro-fluxo-dot">
                    <FontAwesomeIcon icon={faCalendarCheck} />
                  </span>
                  <div className="dot-pulse"></div>
                </div>

                <div className="lp-pro-fluxo-content">

                  <h4>Fidelização</h4>

                  <p>Agenda otimizada. Lembretes automáticos. Paciente volta.</p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* 7. PROVA SOCIAL */}

      <section id="prova-social" className="lp-pro-social">

        <div className="lp-pro-container">

          <h2 className="lp-pro-section-title">O que dizem quem saiu do modo caos para gestão de elite</h2>

          <div className="lp-pro-social-grid">

            <div className="lp-pro-social-card">

              <FontAwesomeIcon icon={faQuoteLeft} className="lp-pro-quote" />

              <p>Com a NODON, fechei orçamentos no mesmo dia da radiografia. O retorno veio nos primeiros diagnósticos.</p>

              <div className="lp-pro-social-author">

                <span className="lp-pro-social-cro">CRO-SP 123456</span>

              </div>

            </div>

            <div className="lp-pro-social-card">

              <FontAwesomeIcon icon={faQuoteLeft} className="lp-pro-quote" />

              <p>Precificação baseada em dados reais. Finalmente sei quanto cobrar e quanto lucro tenho.</p>

              <div className="lp-pro-social-author">

                <span className="lp-pro-social-cro">CRO-MG 78901</span>

              </div>

            </div>

            <div className="lp-pro-social-card">

              <FontAwesomeIcon icon={faQuoteLeft} className="lp-pro-quote" />

              <p>Agenda que se organiza sozinha. Menos estresse, mais produtividade. A NODON se paga sozinha.</p>

              <div className="lp-pro-social-author">

                <span className="lp-pro-social-cro">CRO-RJ 45678</span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 8. SEÇÃO DE PLANOS */}
      <section className="plans-section" id="planos">
        <div className="plans-bg"></div>
        <div className="lp-pro-container">
          <div className="section-label">
            <span>PLANOS</span>
          </div>
          <h2 className="lp-pro-section-title">Escolha seu plano</h2>
          
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

      {/* 9. FOOTER CONVERSÃO */}

      <footer className="lp-pro-footer">

        <div className="lp-pro-container">

          <h2 className="lp-pro-footer-title">O futuro não espera. Sua clínica também não deveria.</h2>

          <p className="lp-pro-footer-sub">Um único campo. WhatsApp. Nós entramos em contato.</p>

          <form className="lp-pro-footer-form" onSubmit={handleFooterSubmit}>

            <input

              type="text"

              placeholder="WhatsApp"

              value={emailOrPhone}

              onChange={(e) => setEmailOrPhone(e.target.value)}

              className="lp-pro-footer-input"

              aria-label="WhatsApp"

            />

            <button type="submit" className="lp-pro-footer-btn" disabled={!isValid}>

              Quero 

            </button>

          </form>

          {submitStatus === 'success' && (

            <p className="lp-pro-footer-success">

              <FontAwesomeIcon icon={faCheckCircle} /> Recebemos seu contato. Em breve entraremos em touch.

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



export default LPDentistaPRO

