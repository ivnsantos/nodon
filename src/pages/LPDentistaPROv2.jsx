import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
  faTimes,
  faArrowRight,
  faQuoteLeft,
  faCheckCircle,
  faChevronDown,
  faPlay
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import xldentistaImg from '../img/xldentista.jpeg'
import exameImg from '../img/exame.jpg'
import videoExplicativo from '../video/explicatico.mp4'
import headerVideo from '../video/header.mp4'
import './LPDentistaPROv2.css'

const LPDentistaPROv2 = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [submitStatus, setSubmitStatus] = useState(null)
  const [isValid, setIsValid] = useState(false)
  const [metricsVisible, setMetricsVisible] = useState(false)
  const [counts, setCounts] = useState({ conv: 0, tempo: 0, aceite: 0 })
  const [ripple, setRipple] = useState({ x: 0, y: 0, show: false })
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 })
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

  const handleCtaClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      show: true
    })
    setTimeout(() => setRipple((p) => ({ ...p, show: false })), 600)
    navigate('/register')
  }

  const handleCtaMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15
    setBtnPos({ x, y })
  }

  const handleCtaMouseLeave = () => setBtnPos({ x: 0, y: 0 })

  const handleFooterSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitStatus('success')
    setEmailOrPhone('')
  }

  return (
    <div className="lp-pro-v2">
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
            Quem ganha bem otimiza seu tempo<span className="lp-v2-highlight"> gerando mais resultados</span>
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
      <section id="demo" className="lp-v2-demo" ref={demoRef}>
        <div className="lp-v2-demo-parallax-wrap">
          <div className="lp-v2-demo-head">
            <p className="lp-v2-demo-label">Auemntando sua Renda</p>
            <h2 className="lp-v2-section-title">Ferramentas que te organizam & inspiram confiança</h2>
            <p className="lp-v2-demo-sub">Diagnóstico, agenda e precificação em um só lugar. Menos caos, mais resultado.</p>
          </div>
          <div className="lp-v2-demo-floating">
            <div className="lp-v2-demo-layer lp-v2-demo-layer-1">
              <img src={xldentistaImg} alt="Interface NODON" loading="lazy" />
            </div>
            <div className="lp-v2-demo-layer lp-v2-demo-layer-2">
              <img src={exameImg} alt="Diagnóstico IA" loading="lazy" />
            </div>
            <div className="lp-v2-demo-video-trigger" onClick={() => setVideoModalOpen(true)}>
              <video src={videoExplicativo} muted loop playsInline autoPlay className="lp-v2-demo-video-thumb" />
              <span className="lp-v2-demo-play">
                <FontAwesomeIcon icon={faPlay} />
              </span>
            </div>
          </div>
        </div>
        {videoModalOpen && (
          <div className="lp-v2-modal-overlay" onClick={() => setVideoModalOpen(false)}>
            <div className="lp-v2-modal-inner lp-v2-modal-elastic" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="lp-v2-modal-close" onClick={() => setVideoModalOpen(false)} aria-label="Fechar">
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <video src={videoExplicativo} controls autoPlay playsInline className="lp-v2-modal-video" />
            </div>
          </div>
        )}
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

      {/* 4. CTA PRINCIPAL */}
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
          <p className="lp-v2-footer-sub">E-mail ou WhatsApp. Nós entramos em contato.</p>
          <form className="lp-v2-footer-form" onSubmit={handleFooterSubmit}>
            <input
              type="text"
              placeholder="E-mail ou WhatsApp"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="lp-v2-footer-input"
              aria-label="E-mail ou WhatsApp"
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
    </div>
  )
}

export default LPDentistaPROv2
