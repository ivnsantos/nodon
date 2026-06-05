import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComments,
  faMicrophone,
  faImage,
  faBolt,
  faGraduationCap,
  faStethoscope,
  faHeartbeat,
  faNotesMedical,
  faUserMd,
  faPills,
  faTooth,
  faBrain,
  faCheckCircle,
  faRocket,
  faClock,
  faShieldAlt,
  faStar,
  faQuoteLeft,
  faChevronDown,
  faTag
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { NODON_LOGO_LIGHT_BG, NODON_LOGO_DARK_BG } from '../utils/nodonLogos'
import home1Img from '../img/home1.PNG'
import home2Img from '../img/home2.PNG'
import home3Img from '../img/home3.PNG'
import home4Img from '../img/home4.PNG'
import chatMilaVideo from '../video/cht-mila.mp4'
import chatExplicaVideo from '../video/chat-explica.mp4'
import chatNodonVideo from '../video/chat-nodon.MP4?url'
import { getCicloFromPlano } from '../utils/planoCiclo'
import { filterPlanosSaude, resolvePlanoBadge, resolvePlanoFeatured } from '../utils/planosSaude'
import './ChatHome.css'

const CUPOM_SAUDE = 'SAUDE'

const parsePrice = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim().replace(',', '.'))
    return isNaN(parsed) ? null : parsed
  }
  return null
}

const arredondarMoeda = (valor) => Math.round((Number(valor) || 0) * 100) / 100

const formatarValor = (valor) => {
  if (valor === null || valor === undefined || isNaN(Number(valor))) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(arredondarMoeda(valor))
}

const formatarTokens = (tokens) => {
  const numTokens = parseInt(tokens) || 0
  if (numTokens >= 1000000) {
    return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`
  }
  if (numTokens >= 1000) {
    return `${(numTokens / 1000).toFixed(0)} mil`
  }
  return numTokens.toString()
}

const buildFeaturesSaude = (plano) => {
  const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat
  const nome = (plano.nome || '').toLowerCase()
  const features = []

  if (tokenChat && parseInt(tokenChat) > 0) {
    features.push(`${formatarTokens(tokenChat)} de tokens no chat`)
  }
  features.push('Chat por texto, voz e imagem')
  features.push('IA para profissionais e estudantes de saúde')
  features.push('Medicina, enfermagem, odonto e demais áreas')
  features.push('Disponível 24 horas, 7 dias por semana')
  features.push('Acesso mobile')
  features.push('Sem fidelidade — cancele quando quiser')

  if (plano.features && Array.isArray(plano.features)) {
    features.push(...plano.features)
  } else if (plano.caracteristicas && Array.isArray(plano.caracteristicas)) {
    features.push(...plano.caracteristicas)
  }

  if (nome.includes('pro')) {
    features.unshift('Mais tokens e uso intensivo')
  }

  return features
}

const SHOWCASE_BLOCKS = [
  {
    image: home2Img,
    alt: 'Estudantes de saúde estudando em biblioteca',
    label: 'Formação',
    title: 'Do vestibular à residência',
    text: 'Revise conteúdos, anatomia e casos clínicos com uma IA que acompanha sua jornada acadêmica em qualquer curso da saúde.',
    reverse: false
  },
  {
    image: home3Img,
    alt: 'Equipe de estudantes de medicina em biblioteca médica',
    label: 'Colaboração',
    title: 'Estudo em equipe, respostas na hora',
    text: 'Tire dúvidas entre aulas e plantões — por texto, voz ou imagem — com linguagem técnica e didática.',
    reverse: true
  },
  {
    image: home4Img,
    alt: 'Médica utilizando tecnologia no consultório',
    label: 'Prática clínica',
    title: 'Apoio no consultório e no plantão',
    text: 'Profissionais de todas as áreas usam a NODON para consultas rápidas, exames e decisões com mais segurança.',
    reverse: false
  }
]

const ChatHome = () => {
  const navigate = useNavigate()
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [expandedPlans, setExpandedPlans] = useState({})
  const [cupomValido, setCupomValido] = useState(false)
  const [cupomData, setCupomData] = useState(null)
  const [validandoCupom, setValidandoCupom] = useState(true)
  const [headerScrolled, setHeaderScrolled] = useState(false)

  const handleVideoClick = (videoSrc) => {
    setCurrentVideo(videoSrc)
    setVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setVideoModalOpen(false)
    setCurrentVideo(null)
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = '5511932589622'
    const message = encodeURIComponent('Olá! Sou da área da saúde e quero saber mais sobre a IA NODON.')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true)
      const response = await api.get('/planos')
      const planosBackend = response.data?.data || response.data || []
      const lista = Array.isArray(planosBackend) ? planosBackend : []

      const filtrados = filterPlanosSaude(lista)

      const mapeados = filtrados
        .map((plano) => {
          const valorOriginal = parsePrice(plano.valorOriginal ?? plano.valor_original ?? plano.valor) ?? 0
          const valorPromocional = parsePrice(plano.valorPromocional ?? plano.valor_promocional)
          const nome = plano.nome || 'Plano'

          return {
            ...plano,
            valorOriginal,
            valorPromocional,
            featured: resolvePlanoFeatured(plano),
            badge: resolvePlanoBadge(plano)
          }
        })
        .sort((a, b) => {
          const va = a.valorPromocional ?? a.valorOriginal ?? 0
          const vb = b.valorPromocional ?? b.valorOriginal ?? 0
          return va - vb
        })

      setPlanos(mapeados)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      setPlanos([])
    } finally {
      setLoadingPlanos(false)
    }
  }

  const validarCupom = async (codigo) => {
    const codigoNormalizado = codigo?.toString().toUpperCase().trim()
    if (!codigoNormalizado) {
      setCupomValido(false)
      setCupomData(null)
      setValidandoCupom(false)
      return
    }
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

  useEffect(() => {
    loadPlanos()
    validarCupom(CUPOM_SAUDE)
  }, [])

  useEffect(() => {
    if (planos.length === 0) return
    const abertos = {}
    planos.forEach((plano, index) => {
      const id = plano.id || `plano-${index}`
      abertos[id] = true
    })
    setExpandedPlans(abertos)
  }, [planos])

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handlePlanToggle = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !(prev[planId] ?? true)
    }))
  }

  const handlePlanSelect = (nomePlano, planoId) => {
    const cupomParam = cupomValido ? `&cupom=${encodeURIComponent(CUPOM_SAUDE)}` : ''
    navigate(
      `/checkout?plano=${encodeURIComponent(nomePlano)}&planoId=${planoId}&origem=saude${cupomParam}`
    )
  }

  return (
    <div className="chat-home chat-home--elite">
      {/* HEADER */}
      <header className={`chat-home-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="chat-home-container">
          <div className="chat-home-header-content">
            <img src={NODON_LOGO_LIGHT_BG} alt="NODON Logo" className="chat-home-logo" onClick={() => navigate('/')} />
            <nav className="chat-home-nav-links">
              <button type="button" onClick={() => scrollToSection('galeria')}>Galeria</button>
              <button type="button" onClick={() => scrollToSection('como-funciona')}>Como funciona</button>
              <button type="button" onClick={() => scrollToSection('para-quem')}>Para quem é</button>
              <button type="button" onClick={() => scrollToSection('planos')}>Planos</button>
              <button type="button" onClick={() => scrollToSection('depoimentos')}>Depoimentos</button>
            </nav>
            <div className="chat-home-header-actions">
              <button className="chat-home-btn-secondary" onClick={() => navigate('/login')}>
                Entrar
              </button>
              <button className="chat-home-btn-primary" onClick={() => navigate('/register')}>
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="chat-home-hero">
        <div className="chat-home-container chat-home-hero-grid">
          <div className="chat-home-hero-copy">
            <p className="chat-home-eyebrow">
              <FontAwesomeIcon icon={faHeartbeat} />
              Inteligência artificial · Área da saúde
            </p>
            <h1 className="chat-home-title">
              A <span className="highlight">NODON</span> para quem estuda e trabalha com saúde
            </h1>
            <p className="chat-home-subtitle">
              Uma plataforma elegante e precisa para profissionais e estudantes de medicina, enfermagem,
              odontologia, fisioterapia, nutrição, farmácia e todas as formações do setor.
            </p>
            <div className="chat-home-hero-pills">
              <span>Texto</span>
              <span>Voz</span>
              <span>Imagem</span>
              <span>24/7</span>
            </div>
            <div className="chat-home-cta-buttons">
              <button type="button" className="chat-home-btn-hero" onClick={() => navigate('/register')}>
                <FontAwesomeIcon icon={faRocket} />
                Começar Agora
              </button>
              <button type="button" className="chat-home-btn-secondary-hero" onClick={() => scrollToSection('planos')}>
                Ver planos
              </button>
            </div>
          </div>
          <div className="chat-home-hero-visual">
            <div className="chat-home-hero-frame">
              <img src={home1Img} alt="Equipe multiprofissional de saúde em hospital" />
              <div className="chat-home-hero-caption">
                <span>Equipes de saúde</span>
                <strong>Colaboração com tecnologia</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALERIA BENTO */}
      <section className="chat-home-gallery" id="galeria">
        <div className="chat-home-container">
          <div className="chat-home-section-head">
            <p className="chat-home-eyebrow center">Quem usa a NODON</p>
            <h2 className="chat-home-section-title">Saúde em cada etapa da sua carreira</h2>
            <p className="chat-home-section-description center">
              Da sala de aula ao consultório — imagens que representam quem confia na nossa IA.
            </p>
          </div>
          <div className="chat-home-bento">
            <figure className="bento-item bento-main">
              <img src={home1Img} alt="Profissionais de saúde no hospital" />
              <figcaption>Hospital · Equipe multiprofissional</figcaption>
            </figure>
            <figure className="bento-item">
              <img src={home2Img} alt="Estudantes em biblioteca" />
              <figcaption>Estudantes · Biblioteca</figcaption>
            </figure>
            <figure className="bento-item">
              <img src={home3Img} alt="Estudantes de medicina colaborando" />
              <figcaption>Medicina · Estudo em grupo</figcaption>
            </figure>
            <figure className="bento-item bento-tall">
              <img src={home4Img} alt="Médica no consultório com laptop" />
              <figcaption>Consultório · Prática clínica</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* BLOCOS COM IMAGENS */}
      {SHOWCASE_BLOCKS.map((block) => (
        <section
          key={block.title}
          className={`chat-home-showcase ${block.reverse ? 'reverse' : ''}`}
        >
          <div className="chat-home-container chat-home-showcase-grid">
            <div className="chat-home-showcase-media">
              <img src={block.image} alt={block.alt} loading="lazy" />
            </div>
            <div className="chat-home-showcase-copy">
              <span className="chat-home-showcase-label">{block.label}</span>
              <h2>{block.title}</h2>
              <p>{block.text}</p>
              <button
                type="button"
                className="chat-home-link-btn"
                onClick={() => navigate('/register')}
              >
                Experimentar a IA
                <FontAwesomeIcon icon={faCheckCircle} />
              </button>
            </div>
          </div>
        </section>
      ))}

      {/* O QUE É A IA */}
      <section className="chat-home-about" id="sobre">
        <div className="chat-home-container chat-home-about-row">
          <div className="chat-home-about-copy">
            <p className="chat-home-eyebrow">
              <FontAwesomeIcon icon={faBrain} />
              Sobre a IA
            </p>
            <h2 className="chat-home-section-title left">
              Especializada para quem vive a saúde
            </h2>
            <p className="chat-home-section-description left">
              Protocolos, exames, casos clínicos e rotina profissional — com respostas baseadas em evidência,
              sempre como apoio ao profissional responsável.
            </p>
          </div>
          <ul className="chat-home-about-list">
            <li>
              <FontAwesomeIcon icon={faCheckCircle} />
              Todas as profissões e cursos da saúde
            </li>
            <li>
              <FontAwesomeIcon icon={faCheckCircle} />
              Casos clínicos e materiais de formação
            </li>
            <li>
              <FontAwesomeIcon icon={faCheckCircle} />
              Evidência científica e linguagem técnica
            </li>
          </ul>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="chat-home-how-it-works" id="como-funciona">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Como Funciona?</h2>
          <p className="chat-home-section-description">
            Três formas de usar no estudo, na prática e no plantão. Escolha a que preferir.
          </p>

          <div className="chat-home-demo-grid" id="demonstracao">
            <div className="demo-card" onClick={() => handleVideoClick(chatMilaVideo)}>
              <div className="demo-video-wrapper">
                <video autoPlay muted loop playsInline className="demo-video">
                  <source src={chatMilaVideo} type="video/mp4" />
                </video>
                <div className="demo-overlay">
                  <div className="play-button">▶</div>
                </div>
              </div>
              <div className="demo-info">
                <div className="demo-badge">
                  <FontAwesomeIcon icon={faComments} />
                  <span>TEXTO</span>
                </div>
                <h3>Converse Naturalmente</h3>
                <p>Dúvidas de anatomia, farmacologia, protocolos ou conduta — respostas completas para sua área.</p>
              </div>
            </div>

            <div className="demo-card" onClick={() => handleVideoClick(chatExplicaVideo)}>
              <div className="demo-video-wrapper">
                <video autoPlay muted loop playsInline className="demo-video">
                  <source src={chatExplicaVideo} type="video/mp4" />
                </video>
                <div className="demo-overlay">
                  <div className="play-button">▶</div>
                </div>
              </div>
              <div className="demo-info">
                <div className="demo-badge">
                  <FontAwesomeIcon icon={faMicrophone} />
                  <span>ÁUDIO</span>
                </div>
                <h3>Envie Mensagens de Voz</h3>
                <p>Ideal entre aulas e plantões: grave a dúvida e receba explicação didática na hora.</p>
              </div>
            </div>

            <div className="demo-card" onClick={() => handleVideoClick(chatNodonVideo)}>
              <div className="demo-video-wrapper">
                <video autoPlay muted loop playsInline className="demo-video">
                  <source src={chatNodonVideo} type="video/mp4" />
                </video>
                <div className="demo-overlay">
                  <div className="play-button">▶</div>
                </div>
              </div>
              <div className="demo-info">
                <div className="demo-badge">
                  <FontAwesomeIcon icon={faImage} />
                  <span>IMAGEM</span>
                </div>
                <h3>Analise Exames e Imagens</h3>
                <p>Radiografias, laudos, fotos clínicas e exames — análise e orientações para apoio ao seu raciocínio.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="chat-home-audience" id="para-quem">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Para toda a área da saúde</h2>
          <p className="chat-home-section-description">
            Estudantes e profissionais de qualquer formação — a NODON fala a sua língua.
          </p>

          <div className="chat-home-audience-grid">
            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faUserMd} />
              </div>
              <h3>Medicina e residência</h3>
              <p>Casos clínicos, diagnósticos diferenciais, provas e preparação para plantões.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faStethoscope} />
              </div>
              <h3>Enfermagem e técnicos</h3>
              <p>Protocolos, procedimentos, medicações e segurança do paciente no dia a dia.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faTooth} />
              </div>
              <h3>Odontologia</h3>
              <p>Procedimentos, radiografias, materiais e dúvidas de graduação ou especialização.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faHeartbeat} />
              </div>
              <h3>Fisioterapia e fonoaudiologia</h3>
              <p>Condutas, reabilitação, avaliações e fundamentação para a prática.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faPills} />
              </div>
              <h3>Farmácia e nutrição</h3>
              <p>Fármacos, interações, dietas terapêuticas e orientações baseadas em evidência.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
              <h3>Demais cursos de saúde</h3>
              <p>Psicologia, biomedicina, educação física, veterinária e todas as formações do setor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="chat-home-benefits">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Por que profissionais e estudantes escolhem a NODON?</h2>
          
          <div className="chat-home-benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faBolt} />
              </div>
              <h3>Agilidade no estudo e na prática</h3>
              <p>Respostas em segundos para dúvidas entre aulas, estágios e atendimentos.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <h3>24 horas, todos os dias</h3>
              <p>Plantão, prova ou TCC — a IA acompanha sua rotina de saúde quando você precisar.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <h3>Apoio com responsabilidade</h3>
              <p>Evidência científica e linguagem técnica, sem substituir o profissional de saúde.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faNotesMedical} />
              </div>
              <h3>Uma IA, várias especialidades</h3>
              <p>Do primeiro semestre ao consultório — adaptada a diferentes áreas da saúde.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="chat-home-plans" id="planos">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Planos para a área da saúde</h2>
          <p className="chat-home-section-description">
            Escolha o plano ideal para estudar, praticar e evoluir na sua profissão.
          </p>

          {cupomValido && cupomData && (
            <div className="chat-home-cupom-banner">
              <FontAwesomeIcon icon={faTag} />
              <span>
                Cupom <strong>{CUPOM_SAUDE}</strong> aplicado —{' '}
                <strong>
                  {Number(cupomData.discountValue || 0).toLocaleString('pt-BR', {
                    maximumFractionDigits: 0
                  })}% de desconto
                </strong>{' '}
                nos planos abaixo
              </span>
            </div>
          )}
          {validandoCupom && !cupomValido && (
            <p className="chat-home-cupom-loading">Aplicando cupom {CUPOM_SAUDE}...</p>
          )}

          {loadingPlanos ? (
            <div className="chat-home-plans-loading">
              <div className="chat-home-plans-spinner" />
              <p>Carregando planos...</p>
            </div>
          ) : planos.length === 0 ? (
            <div className="chat-home-plans-empty">
              <p>Nenhum plano disponível no momento.</p>
            </div>
          ) : (
            <div className="chat-home-plans-grid">
              {planos.map((plano, index) => {
                const planoId = plano.id || `plano-${index}`
                const nomePlano = plano.nome || 'Plano'
                const valorOriginal = Number(plano.valorOriginal) || 0
                const valorPromocional =
                  plano.valorPromocional !== null && plano.valorPromocional !== undefined
                    ? Number(plano.valorPromocional)
                    : null
                const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat
                const temPromocao =
                  valorPromocional !== null &&
                  !isNaN(valorPromocional) &&
                  valorPromocional > 0 &&
                  valorOriginal > 0 &&
                  valorPromocional < valorOriginal
                const valorBase = temPromocao ? valorPromocional : valorOriginal
                let valorExibir = valorBase
                let temDescontoCupom = false
                if (cupomValido && cupomData && valorBase > 0) {
                  const discountPercent = Number(cupomData.discountValue) || 0
                  if (discountPercent > 0) {
                    valorExibir = arredondarMoeda(valorBase * (1 - discountPercent / 100))
                    temDescontoCupom = true
                  }
                }
                const featuresList = buildFeaturesSaude(plano)
                const expanded = expandedPlans[planoId] ?? true
                const cicloInfo = getCicloFromPlano(plano)

                return (
                  <div
                    key={planoId}
                    className={`chat-home-plan-card ${plano.featured ? 'featured' : ''} ${expanded ? 'features-open' : ''}`}
                  >
                    {plano.badge && <div className="chat-home-plan-badge">{plano.badge}</div>}
                    <div className="chat-home-plan-header">
                      <h3>{nomePlano}</h3>
                      {cupomValido && cupomData && (
                        <div className="chat-home-cupom-badge-plan">
                          <FontAwesomeIcon icon={faTag} />
                          <span>Cupom {CUPOM_SAUDE} aplicado</span>
                        </div>
                      )}
                      <div className="chat-home-plan-price">
                        {(temPromocao || temDescontoCupom) && valorOriginal > 0 && (
                          <span className="chat-home-price-old">
                            {formatarValor(valorOriginal)}{cicloInfo.periodoCurto}
                          </span>
                        )}
                        {temDescontoCupom && temPromocao && valorPromocional > 0 && (
                          <span className="chat-home-price-old">
                            {formatarValor(valorPromocional)}{cicloInfo.periodoCurto}
                          </span>
                        )}
                        {temDescontoCupom && !temPromocao && valorOriginal > 0 && (
                          <span className="chat-home-price-old">
                            {formatarValor(valorOriginal)}{cicloInfo.periodoCurto}
                          </span>
                        )}
                        <span className="chat-home-price-current">
                          {formatarValor(valorExibir)}{cicloInfo.periodoCurto}
                        </span>
                      </div>
                      {tokenChat && parseInt(tokenChat) > 0 && (
                        <p className="chat-home-plan-tokens">
                          {formatarTokens(tokenChat)} de tokens
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="chat-home-plan-toggle"
                      onClick={() => handlePlanToggle(planoId)}
                    >
                      {expanded ? 'Ocultar recursos' : 'Ver recursos'}
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={expanded ? 'expanded' : ''}
                      />
                    </button>
                    {expanded && (
                      <ul className="chat-home-plan-features">
                        {featuresList.map((feature, idx) => (
                          <li key={idx}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      className={`chat-home-plan-btn ${plano.featured ? 'featured' : ''}`}
                      onClick={() => handlePlanSelect(nomePlano, planoId)}
                    >
                      Assinar Agora
                    </button>
                    <p className="chat-home-plan-note">{cicloInfo.notaPlano}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="chat-home-testimonials" id="depoimentos">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Quem trabalha e estuda saúde recomenda</h2>
          
          <div className="chat-home-testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} />
                ))}
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="testimonial-text">
                "Uso na faculdade de medicina para revisar casos e fisiopatologias. Economizo horas que antes gastava em livros e fóruns."
              </p>
              <div className="testimonial-author">
                <strong>Maria Eduarda</strong>
                <span>Estudante de Medicina — 4º ano</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} />
                ))}
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="testimonial-text">
                "Na enfermagem, mando áudio sobre protocolos e recebo resposta na hora. Virou meu apoio entre os plantões."
              </p>
              <div className="testimonial-author">
                <strong>Lucas Oliveira</strong>
                <span>Técnico em Enfermagem</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} />
                ))}
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="testimonial-text">
                "Na odontologia, envio radiografias e discussões de conduta. A IA entende o contexto clínico que preciso."
              </p>
              <div className="testimonial-author">
                <strong>Fernanda Costa</strong>
                <span>Cirurgiã-dentista</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="chat-home-cta-final">
        <div className="chat-home-container">
          <div className="chat-home-cta-content">
            <h2>Sua área da saúde merece uma IA à altura</h2>
            <p>Junte-se a estudantes e profissionais que já usam a NODON no dia a dia.</p>
            <button className="chat-home-btn-cta-final" onClick={() => navigate('/register')}>
              <FontAwesomeIcon icon={faRocket} />
              <span>Começar Agora</span>
            </button>
            <p className="chat-home-cta-note">• Teste grátis • Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="chat-home-footer">
        <div className="chat-home-container">
          <div className="chat-home-footer-content">
            <div className="footer-logo">
              <img src={NODON_LOGO_DARK_BG} alt="NODON" />
              <span>NODON</span>
            </div>
            <p className="chat-home-footer-tagline">Inteligência artificial para profissionais e estudantes de saúde.</p>
            <p>&copy; {new Date().getFullYear()} NODON. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* VIDEO MODAL */}
      {videoModalOpen && currentVideo && (
        <div className="chat-home-video-modal" onClick={closeVideoModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeVideoModal}>
              ✕
            </button>
            <video controls autoPlay className="video-modal-player">
              <source src={currentVideo} type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      {/* WHATSAPP FLUTUANTE */}
      <button className="chat-home-whatsapp-float" onClick={handleWhatsAppClick}>
        <FontAwesomeIcon icon={faWhatsapp} />
      </button>
    </div>
  )
}

export default ChatHome
