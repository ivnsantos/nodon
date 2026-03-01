import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import xldentistaImg from '../img/xldentista.jpeg'
import exameImg from '../img/exame.jpg'
import videoExplicativo from '../video/explicatico.mp4'
import './LPDentistaPRO.css'

const LPDentistaPRO = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null
  const [isValid, setIsValid] = useState(false)

  const validateInput = (value) => {
    const v = (value || '').trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    const isPhone = /^[\d\s()\-+]{10,20}$/.test(v.replace(/\D/g, '') ? v : '')
    return v.length >= 5 && (isEmail || (v.replace(/\D/g, '').length >= 10))
  }

  useEffect(() => {
    setIsValid(validateInput(emailOrPhone))
  }, [emailOrPhone])

  const handleCtaClick = () => {
    navigate('/register')
  }

  const handleFooterSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitStatus('success')
    setEmailOrPhone('')
  }

  return (
    <div className="lp-pro">
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
              QUERO DOMINAR MINHA CLÍNICA
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
        <div className="lp-pro-hero-mesh" aria-hidden="true" />
        <div className="lp-pro-hero-glow" aria-hidden="true" />
        <div className="lp-pro-container lp-pro-hero-inner">
          <div className="lp-pro-hero-content">
            <h1 className="lp-pro-hero-title">
              Aumente em 30% o lucro dos seus tratamentos com a NODON.
            </h1>
            <p className="lp-pro-hero-sub">
              Domine o fluxo total da sua clínica com a NODON. Diagnósticos em segundos, precificação cirúrgica e uma agenda que trabalha para você, não o contrário.
            </p>
            <button type="button" className="lp-pro-cta-glow" onClick={handleCtaClick}>
              QUERO DOMINAR MINHA CLÍNICA
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="lp-pro-hero-visual">
            <div className="lp-pro-hero-3d">
              <img src={nodoLogo} alt="" width="200" height="200" loading="lazy" />
            </div>
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

      {/* 4. BENTO GRID */}
      <section id="funcionalidades" className="lp-pro-bento">
        <div className="lp-pro-container">
          <h2 className="lp-pro-section-title">Tudo que sua clínica precisa em um só lugar</h2>
          <div className="lp-pro-bento-grid">
            <article className="lp-pro-bento-card lp-pro-bento-1">
              <div className="lp-pro-bento-media">
                <video
                  src={videoExplicativo}
                  muted
                  loop
                  playsInline
                  autoPlay
                  poster={exameImg}
                  className="lp-pro-bento-video"
                />
              </div>
              <div className="lp-pro-bento-body">
                <span className="lp-pro-bento-label"><FontAwesomeIcon icon={faXRay} /> Diagnóstico</span>
                <p>Diagnósticos que encantam e fecham orçamentos na hora.</p>
              </div>
            </article>
            <article className="lp-pro-bento-card lp-pro-bento-2">
              <div className="lp-pro-bento-media lp-pro-bento-chart">
                <div className="lp-pro-chart-bar" style={{ height: '70%' }} />
                <div className="lp-pro-chart-bar" style={{ height: '45%' }} />
                <div className="lp-pro-chart-bar" style={{ height: '90%' }} />
                <div className="lp-pro-chart-bar" style={{ height: '60%' }} />
                <div className="lp-pro-chart-bar" style={{ height: '85%' }} />
              </div>
              <div className="lp-pro-bento-body">
                <span className="lp-pro-bento-label"><FontAwesomeIcon icon={faChartLine} /> Precificação</span>
                <p>Chega de chutar seu lucro. Precificação baseada em dados reais de mercado e custos fixos.</p>
              </div>
            </article>
            <article className="lp-pro-bento-card lp-pro-bento-3">
              <div className="lp-pro-bento-media lp-pro-bento-calendar">
                <FontAwesomeIcon icon={faCalendarAlt} className="lp-pro-cal-icon" />
              </div>
              <div className="lp-pro-bento-body">
                <span className="lp-pro-bento-label"><FontAwesomeIcon icon={faCalendarCheck} /> Agenda</span>
                <p>Sua agenda otimizada para máxima performance, sem burnout.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. DEMONSTRAÇÃO VISUAL */}
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
          <h2 className="lp-pro-section-title">O fluxo 360º do seu paciente</h2>
          <div className="lp-pro-fluxo-timeline">
            <div className="lp-pro-fluxo-line" aria-hidden="true" />
            <div className="lp-pro-fluxo-items">
              <div className="lp-pro-fluxo-item">
                <span className="lp-pro-fluxo-dot" />
                <div className="lp-pro-fluxo-content">
                  <h4>Captação</h4>
                  <p>Paciente chega. Tudo começa aqui.</p>
                </div>
              </div>
              <div className="lp-pro-fluxo-item">
                <span className="lp-pro-fluxo-dot" />
                <div className="lp-pro-fluxo-content">
                  <h4>Diagnóstico</h4>
                  <p>IA analisa. Orçamento na hora.</p>
                </div>
              </div>
              <div className="lp-pro-fluxo-item">
                <span className="lp-pro-fluxo-dot" />
                <div className="lp-pro-fluxo-content">
                  <h4>Pagamento</h4>
                  <p>Precificação certa. Lucro real.</p>
                </div>
              </div>
              <div className="lp-pro-fluxo-item">
                <span className="lp-pro-fluxo-dot" />
                <div className="lp-pro-fluxo-content">
                  <h4>Fidelização</h4>
                  <p>Agenda organizada. Paciente volta.</p>
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

      {/* 8. FOOTER CONVERSÃO */}
      <footer className="lp-pro-footer">
        <div className="lp-pro-container">
          <h2 className="lp-pro-footer-title">O futuro não espera. Sua clínica também não deveria.</h2>
          <p className="lp-pro-footer-sub">Um único campo. E-mail ou WhatsApp. Nós entramos em contato.</p>
          <form className="lp-pro-footer-form" onSubmit={handleFooterSubmit}>
            <input
              type="text"
              placeholder="E-mail ou WhatsApp"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="lp-pro-footer-input"
              aria-label="E-mail ou WhatsApp"
            />
            <button type="submit" className="lp-pro-footer-btn" disabled={!isValid}>
              Quero dominar minha clínica
            </button>
          </form>
          {submitStatus === 'success' && (
            <p className="lp-pro-footer-success">
              <FontAwesomeIcon icon={faCheckCircle} /> Recebemos seu contato. Em breve entraremos em touch.
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}

export default LPDentistaPRO
