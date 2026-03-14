import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBars,
  faTimes,
  faArrowRight,
  faCheckCircle,
  faPlay,
  faRocket,
  faShieldAlt,
  faGraduationCap,
  faBrain,
  faChartLine,
  faUsers,
  faCalendarCheck,
  faXRay,
  faChevronDown,
  faChevronUp,
  faGift,
  faTimes as faTimesCircle,
  faComments,
  faMicrophone,
  faImage,
  faBolt,
  faPencil,
  faHeadset,
  faClock,
  faLightbulb,
  faCode,
  faVideo,
  faStar,
  faQuoteLeft,
  faHeartbeat,
  faStethoscope,
  faNotesMedical,
  faSyringe
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import nodoLogo from '../img/nodo.png'
import octttttImg from '../img/octtttt_8.jpg'
import chatMilaVideo from '../video/cht-mila.mp4'
import chatExplicaVideo from '../video/chat-explica.mp4'
import chatNodonVideo from '../video/chat-nodon.MP4?url'
import './LPEstudantePRO.css'
import './LPDentistaPRO_plans.css'

const LPEstudantePROSaude = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [planos, setPlanos] = useState([])
  const [planoEstudante, setPlanoEstudante] = useState(null)
  const [cupomCodigo, setCupomCodigo] = useState('MILAFAZODONTO')
  const [cupomValido, setCupomValido] = useState(false)
  const [cupomData, setCupomData] = useState(null)
  const [cupomMensagem, setCupomMensagem] = useState('')
  const [expandedPlan, setExpandedPlan] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    fetchPlanos()
    validarCupom('MILAFAZODONTO')
  }, [])

  const fetchPlanos = async () => {
    try {
      const response = await api.get('/planos')
      console.log('Response completa:', response)
      const todosPlanos = response.data.data || response.data
      console.log('Todos os planos:', todosPlanos)
      const estudante = todosPlanos.find(p => p.nome?.toLowerCase().includes('estudante'))
      console.log('Plano estudante encontrado:', estudante)
      setPlanos(todosPlanos)
      setPlanoEstudante(estudante)
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    }
  }

  const validarCupom = async (codigo) => {
    if (!codigo || codigo.trim() === '') {
      setCupomValido(false)
      setCupomData(null)
      setCupomMensagem('')
      return
    }

    try {
      const response = await api.get(`/cupons/name/${codigo.trim()}`)
      console.log('Resposta do cupom:', response.data)
      
      if (response.data.statusCode === 200 && response.data.data && response.data.data.active) {
        const cupomInfo = response.data.data
        setCupomValido(true)
        setCupomData({
          desconto: parseFloat(cupomInfo.discountValue),
          nome: cupomInfo.name,
          campanha: cupomInfo.campaignName
        })
        setCupomMensagem(`Cupom aplicado! ${cupomInfo.discountValue}% de desconto`)
      } else {
        setCupomValido(false)
        setCupomData(null)
        setCupomMensagem('Cupom inválido ou expirado')
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error)
      setCupomValido(false)
      setCupomData(null)
      setCupomMensagem('Erro ao validar cupom')
    }
  }

  const handleVideoClick = (videoSrc) => {
    setCurrentVideo(videoSrc)
    setVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setVideoModalOpen(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setCurrentVideo(null)
  }

  const handleCtaClick = () => {
    if (planoEstudante) {
      const planoId = planoEstudante.id
      const cupomCode = 'MILAFAZODONTO'
      navigate(`/checkout?plano=${planoId}&cupom=${cupomCode}`)
    } else {
      navigate('/checkout?coupon=MILAFAZODONTO')
    }
  }

  const handleScrollToPlano = () => {
    const planoSection = document.getElementById('planos')
    if (planoSection) {
      planoSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = '5511932589622'
    const message = encodeURIComponent('Olá, gostaria de saber mais sobre o plano estudante para área da saúde.')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return 'R$ 0,00'
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`
  }

  const formatarTokens = (tokens) => {
    if (!tokens) return '0'
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}k`
    return tokens.toString()
  }

  const calcularValorComDesconto = (valorOriginal) => {
    if (!cupomData || !cupomData.desconto) return valorOriginal
    const valorNum = parseFloat(valorOriginal)
    const descontoPercent = parseFloat(cupomData.desconto)
    const valorComDesconto = valorNum * (1 - descontoPercent / 100)
    return valorComDesconto.toFixed(2)
  }

  return (
    <div className="lp-estudante-pro">
      {/* HEADER */}
      <header className="lp-est-pro-header">
        <div className="lp-est-pro-container">
          <div className="lp-est-pro-header-content">
            <img src={nodoLogo} alt="NODON Logo" className="lp-est-pro-logo" />
          </div>
        </div>
      </header>

      {/* VÍDEO EVIDÊNCIA */}
      <section className="lp-est-pro-video-destaque">
        <div className="lp-est-pro-container">
          <div className="video-destaque-wrapper">
            <div className="video-destaque-content">
              <h2 className="video-destaque-title">Veja o Chat NODON em Ação</h2>
              <p className="video-destaque-sub">Converse por texto, áudio e imagem com a IA especializada em saúde</p>
              <button type="button" className="lp-est-pro-cta-glow video-cta" onClick={handleScrollToPlano}>
                <span>COMEÇAR AGORA</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
            <div className="video-destaque-player" onClick={() => handleVideoClick(chatMilaVideo)}>
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                className="video-destaque-main"
              >
                <source src={chatMilaVideo} type="video/mp4" />
                Seu navegador não suporta vídeo.
              </video>
              <div className="video-destaque-overlay">
                <FontAwesomeIcon icon={faPlay} className="play-icon-large" />
                <span>Clique para assistir em tela cheia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERO SECTION */}
      <section className="lp-est-pro-hero">
        <div className="lp-est-pro-hero-video-bg" aria-hidden="true">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="hero-bg-video"
          >
            <source src={chatMilaVideo} type="video/mp4" />
          </video>
          <div className="hero-video-overlay"></div>
        </div>
        
        <div className="lp-est-pro-hero-particles" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="particle" style={{ '--i': i }} />
          ))}
        </div>
        
        <div className="lp-est-pro-container lp-est-pro-hero-inner">
          <div className="lp-est-pro-hero-center">
            <div className="lp-est-pro-hero-badge">
              <FontAwesomeIcon icon={faBolt} />
              <span>CHAT DE IA PARA ÁREA DA SAÚDE</span>
            </div>
            
            <h1 className="lp-est-pro-hero-title">
              IA especializada em SAÚDE <br/>
             <span className="lp-est-pro-highlight">texto, voz e imagens</span><br />
              — tudo em um só chat
            </h1>
            
            <p className="lp-est-pro-hero-sub">
              Converse por texto, envie áudios ou imagens e receba respostas inteligentes instantâneas.<br />
              <strong>Seu assistente pessoal de saúde disponível 24 horas por dia.</strong>
            </p>
            
            <div className="lp-est-pro-hero-features">
              <div className="hero-feature">
                <FontAwesomeIcon icon={faComments} />
                <span>Chat por Texto</span>
              </div>
              <div className="hero-feature">
                <FontAwesomeIcon icon={faMicrophone} />
                <span>Envio de Áudio</span>
              </div>
              <div className="hero-feature">
                <FontAwesomeIcon icon={faImage} />
                <span>Análise de Imagens</span>
              </div>
            </div>

            <button type="button" className="lp-est-pro-cta-glow" onClick={handleCtaClick}>
              <span>COMEÇAR AGORA</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            
            <p className="hero-trust">• ✓ Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* PROBLEMA + SOLUÇÃO */}
      <section className="lp-est-pro-problema">
        <div className="lp-est-pro-container">
          <div className="problema-grid">
            <div className="problema-lado">
              <h3 className="problema-titulo">Você está perdendo tempo...</h3>
              <div className="problema-lista">
                <div className="problema-item">
                  <span className="problema-x">✗</span>
                  <p>Pesquisando por horas sem encontrar respostas claras</p>
                </div>
                <div className="problema-item">
                  <span className="problema-x">✗</span>
                  <p>Dificuldade para estudar casos clínicos complexos</p>
                </div>
                <div className="problema-item">
                  <span className="problema-x">✗</span>
                  <p>Falta de respostas rápidas quando mais precisa</p>
                </div>
                <div className="problema-item">
                  <span className="problema-x">✗</span>
                  <p>Sem suporte 24h para tirar dúvidas urgentes</p>
                </div>
              </div>
            </div>

            <div className="solucao-lado">
              <h3 className="solucao-titulo">Com o Chat NODON você tem...</h3>
              <div className="solucao-lista">
                <div className="solucao-item">
                  <span className="solucao-check">✓</span>
                  <p>Respostas instantâneas e precisas sobre saúde</p>
                </div>
                <div className="solucao-item">
                  <span className="solucao-check">✓</span>
                  <p>Análise de exames e casos clínicos</p>
                </div>
                <div className="solucao-item">
                  <span className="solucao-check">✓</span>
                  <p>Assistente inteligente disponível a qualquer momento</p>
                </div>
                <div className="solucao-item">
                  <span className="solucao-check">✓</span>
                  <p>Suporte completo por texto, áudio e imagem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMONSTRAÇÃO DO CHAT */}
      <section id="como-funciona" className="lp-est-pro-demo">
        <div className="lp-est-pro-container">
          <h2 className="lp-est-pro-section-title">
            Veja o <span className="highlight-gradient">Chat NODON</span> em ação
          </h2>
          <p className="lp-est-pro-section-sub">
            Envie texto, áudio ou imagens e receba respostas inteligentes instantâneas.
          </p>

          <div className="demo-grid">
            <div className="demo-card">
              <div className="demo-video-container" onClick={() => handleVideoClick(chatMilaVideo)}>
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="demo-video"
                >
                  <source src={chatMilaVideo} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
                <div className="demo-overlay">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
              <div className="demo-content">
                <div className="demo-badge">
                  <FontAwesomeIcon icon={faComments} />
                  <span>TEXTO</span>
                </div>
                <h3>Converse naturalmente</h3>
                <p>Faça perguntas, tire dúvidas e receba respostas completas e precisas sobre medicina, enfermagem e todas as áreas da saúde.</p>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-video-container" onClick={() => handleVideoClick(chatExplicaVideo)}>
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="demo-video"
                >
                  <source src={chatExplicaVideo} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
                <div className="demo-overlay">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
              <div className="demo-content">
                <div className="demo-badge">
                  <FontAwesomeIcon icon={faMicrophone} />
                  <span>ÁUDIO</span>
                </div>
                <h3>Envie mensagens de voz</h3>
                <p>Grave áudios com suas dúvidas e receba explicações detalhadas como se fosse um professor particular.</p>
              </div>
            </div>

            <div className="demo-card">
              <div className="demo-video-container" onClick={() => handleVideoClick(chatNodonVideo)}>
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="demo-video"
                >
                  <source src={chatNodonVideo} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
                <div className="demo-overlay">
                  <FontAwesomeIcon icon={faPlay} className="play-icon" />
                </div>
              </div>
              <div className="demo-content">
                <div className="demo-badge">
                  <FontAwesomeIcon icon={faImage} />
                  <span>IMAGEM</span>
                </div>
                <h3>Analise exames e imagens</h3>
                <p>Envie imagens de exames, radiografias e casos clínicos e receba análises detalhadas e sugestões.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-est-pro-features">
        <div className="lp-est-pro-container">
          <h2 className="lp-est-pro-section-title">Tudo que você precisa em um só lugar</h2>
          <p className="lp-est-pro-section-sub">
            Recursos poderosos para acelerar seus estudos e prática profissional na área da saúde.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faComments} />
              </div>
              <h3>Chat Inteligente</h3>
              <p>Converse naturalmente sobre qualquer tema de saúde e receba respostas precisas.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faMicrophone} />
              </div>
              <h3>Envio de Áudio</h3>
              <p>Grave mensagens de voz e receba transcrições e respostas detalhadas.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faImage} />
              </div>
              <h3>Análise de Imagens</h3>
              <p>Envie exames, radiografias e imagens clínicas para análise assistida.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faBolt} />
              </div>
              <h3>Respostas Instantâneas</h3>
              <p>Receba respostas em segundos, sem esperar por professores ou colegas.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faPencil} />
              </div>
              <h3>Criação de Conteúdo</h3>
              <p>Gere resumos, planos de cuidado e material de estudo automaticamente.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <h3>Disponível 24/7</h3>
              <p>Seu assistente pessoal está sempre disponível, a qualquer hora do dia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="lp-est-pro-publico">
        <div className="lp-est-pro-container">
          <h2 className="lp-est-pro-section-title">Para quem é o Chat NODON?</h2>
          
          <div className="publico-grid">
            <div className="publico-card">
              <FontAwesomeIcon icon={faGraduationCap} className="publico-icon" />
              <h3>Estudantes de Medicina</h3>
              <p>Tire dúvidas, estude casos clínicos e prepare-se para provas e residência.</p>
            </div>

            <div className="publico-card">
              <FontAwesomeIcon icon={faStethoscope} className="publico-icon" />
              <h3>Estudantes de Enfermagem</h3>
              <p>Consulte protocolos, aprenda procedimentos e ganhe confiança na prática.</p>
            </div>

            <div className="publico-card">
              <FontAwesomeIcon icon={faHeartbeat} className="publico-icon" />
              <h3>Profissionais da Saúde</h3>
              <p>Otimize diagnósticos, consulte guidelines e melhore o atendimento.</p>
            </div>

            <div className="publico-card">
              <FontAwesomeIcon icon={faNotesMedical} className="publico-icon" />
              <h3>Outras Áreas da Saúde</h3>
              <p>Fisioterapia, Nutrição, Farmácia e todas as profissões de saúde.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="lp-est-pro-depoimentos">
        <div className="lp-est-pro-container">
          <h2 className="lp-est-pro-section-title">O que os estudantes estão dizendo</h2>
          
          <div className="depoimentos-grid">
            <div className="depoimento-card">
              <div className="depoimento-stars">
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="depoimento-texto">
                "O Chat NODON me ajudou a entender fisiopatologias complexas que eu não conseguia resolver sozinha. Economizei horas de pesquisa!"
              </p>
              <div className="depoimento-autor">
                <strong>Maria Eduarda</strong>
                <span>Estudante de Medicina - 4º ano</span>
              </div>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-stars">
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="depoimento-texto">
                "Incrível poder enviar áudios e imagens! O Chat NODON analisa exames e me dá insights que eu não tinha pensado."
              </p>
              <div className="depoimento-autor">
                <strong>Lucas Oliveira</strong>
                <span>Estudante de Enfermagem</span>
              </div>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-stars">
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="depoimento-texto">
                "Uso o Chat NODON todos os dias para estudar para a residência. Minha produtividade e compreensão triplicaram!"
              </p>
              <div className="depoimento-autor">
                <strong>Fernanda Costa</strong>
                <span>Médica Recém-formada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="lp-est-pro-plano">
        <div className="lp-est-pro-container">
          <h2 className="lp-est-pro-section-title">No Preço que cabe no seu bolso</h2>
          <p className="lp-est-pro-section-sub">
            Comece agora e tenha acesso completo ao Chat NODON. Cancele quando quiser.
          </p>

          {cupomValido && cupomData && (
            <div className="cupom-aplicado-banner">
              <FontAwesomeIcon icon={faGift} />
              <span>Cupom MILAFAZODONTO aplicado! {cupomData.desconto}% de desconto</span>
            </div>
          )}

          {planoEstudante && (
            <div className="plano-estudante-card">
              <div className="plano-badge-top">
                <FontAwesomeIcon icon={faGraduationCap} />
                <span>PLANO ESTUDANTE</span>
              </div>

              <div className="plano-destaque-preco">
                {cupomValido && cupomData ? (
                  <>
                    <div className="preco-riscado">
                      <span className="de">De R$</span>
                      <span className="valor-antigo">{planoEstudante.valorPromocional || '49,89'}</span>
                    </div>
                    <div className="preco-principal">
                      <span className="cifrao">R$</span>
                      <span className="valor-grande">{calcularValorComDesconto(planoEstudante.valorPromocional || '49.89')}</span>
                      <span className="por-mes">/mês</span>
                    </div>
                    <div className="economia-badge">
                      <FontAwesomeIcon icon={faGift} />
                      <span>Economize {cupomData.desconto}% com {cupomData.nome}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="preco-riscado">
                      <span className="de">De R$</span>
                      <span className="valor-antigo">{planoEstudante.valorOriginal || '70,00'}</span>
                    </div>
                    <div className="preco-principal">
                      <span className="cifrao">R$</span>
                      <span className="valor-grande">{planoEstudante.valorPromocional || '49,89'}</span>
                      <span className="por-mes">/mês</span>
                    </div>
                    <div className="cupom-info">
                      <FontAwesomeIcon icon={faGift} />
                      <span>Use o cupom <strong>MILAFAZODONTO</strong> para desconto adicional</span>
                    </div>
                  </>
                )}
              </div>

              <div className="plano-beneficios-destaque">
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span><strong>300 mil tokens</strong> por mês para conversas ilimitadas</span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Análise de <strong>exames e imagens clínicas</strong></span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Envio de <strong>mensagens de áudio</strong> para respostas rápidas</span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Criação de <strong>planos de cuidado</strong> personalizados</span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Consulta de <strong>protocolos clínicos</strong></span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Ajuda com <strong>diagnósticos diferenciais</strong></span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Explicações sobre <strong>procedimentos e técnicas</strong></span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Criação de <strong>resumos e mapas mentais</strong></span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Preparação para <strong>provas e residência</strong></span>
                </div>
                <div className="beneficio-item">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Suporte <strong>24/7</strong> sempre disponível</span>
                </div>
              </div>

              <div className="plano-estudante-features-wrapper">
                {expandedPlan && planoEstudante.features && (
                  <div className="plano-estudante-features-list">
                    {planoEstudante.features.map((feature, idx) => (
                      <div key={idx} className="feature-item">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="plano-estudante-cta" onClick={handleCtaClick}>
                <span>COMEÇAR AGORA</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>

              <div className="plano-estudante-trust">
                <FontAwesomeIcon icon={faShieldAlt} />
                <span>Cancele quando quiser • Sem compromisso</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-est-pro-faq">
        <div className="lp-est-pro-container">
          <h2 className="lp-est-pro-section-title">Perguntas Frequentes</h2>
          <p className="lp-est-pro-section-sub">
            Tire suas dúvidas sobre o Chat NODON e o Plano Estudante
          </p>

          <div className="faq-grid">
            <div className="faq-item">
              <h3>O que é o Chat NODON?</h3>
              <p>
                O Chat NODON é uma inteligência artificial especializada em saúde que funciona 24/7. 
                Você pode conversar por texto, enviar áudios ou imagens de exames e receber respostas 
                precisas e instantâneas sobre diagnósticos, tratamentos, protocolos clínicos e muito mais.
              </p>
            </div>

            <div className="faq-item">
              <h3>Como funciona o envio de imagens e áudios?</h3>
              <p>
                É muito simples! Você pode enviar fotos de exames, imagens clínicas ou gravar mensagens 
                de áudio diretamente no chat. A IA analisa as imagens e transcreve os áudios, respondendo 
                de forma contextualizada e precisa.
              </p>
            </div>

            <div className="faq-item">
              <h3>O que são tokens e quanto eu preciso?</h3>
              <p>
                Tokens são unidades de processamento da IA. Com 500 mil tokens por mês, você tem conversas 
                ilimitadas para uso diário. É o equivalente a milhares de perguntas e respostas completas, 
                suficiente para estudar, tirar dúvidas e criar conteúdo sem preocupação.
              </p>
            </div>

            <div className="faq-item">
              <h3>O plano estudante é só para estudantes?</h3>
              <p>
                O Plano Estudante foi criado pensando em estudantes da área da saúde, mas qualquer pessoa 
                pode assinar. É ideal para quem quer acesso ao chat de IA especializado em saúde.
              </p>
            </div>

            <div className="faq-item">
              <h3>Posso cancelar quando quiser?</h3>
              <p>
                Sim! Não há fidelidade ou multa por cancelamento. Você pode cancelar sua assinatura a 
                qualquer momento diretamente na plataforma e continua tendo acesso até o fim do período pago.
              </p>
            </div>

            <div className="faq-item">
              <h3>Como funciona o cupom MILAFAZODONTO?</h3>
              <p>
                O cupom MILAFAZODONTO oferece desconto especial no Plano Estudante. Basta inserir o código 
                no checkout e o desconto será aplicado automaticamente no valor da sua assinatura mensal.
              </p>
            </div>

            <div className="faq-item">
              <h3>A IA substitui um professor ou médico?</h3>
              <p>
                Não! O Chat NODON é uma ferramenta de apoio ao estudo e trabalho. Ele ajuda com dúvidas, 
                sugestões e informações, mas não substitui a orientação de professores, supervisores ou 
                a avaliação clínica presencial de um profissional de saúde.
              </p>
            </div>

            <div className="faq-item">
              <h3>Funciona no celular?</h3>
              <p>
                Sim! O Chat NODON funciona perfeitamente em qualquer dispositivo: celular, tablet ou 
                computador. Você pode acessar de onde estiver, a qualquer hora, e todas as suas conversas 
                ficam sincronizadas.
              </p>
            </div>

            <div className="faq-item">
              <h3>Meus dados estão seguros?</h3>
              <p>
                Absolutamente! Todas as suas conversas e dados são criptografados e armazenados com 
                segurança. Seguimos rigorosamente a LGPD e não compartilhamos suas informações com terceiros.
              </p>
            </div>

            <div className="faq-item">
              <h3>Serve para todas as áreas da saúde?</h3>
              <p>
                Sim! O Chat NODON atende medicina, enfermagem, fisioterapia, nutrição, farmácia, 
                biomedicina e todas as profissões da área da saúde. A IA é treinada para responder 
                sobre diversos temas e especialidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-est-pro-cta-final">
        <div className="lp-est-pro-container">
          <div className="cta-final-content">
            <h2>Tenha uma IA que trabalha para você 24h por dia</h2>
            <p>Comece agora e transforme sua forma de estudar e trabalhar na área da saúde.</p>
            <button type="button" className="lp-est-pro-cta-glow" onClick={handleCtaClick}>
              <span>COMEÇAR AGORA</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <p className="cta-final-trust">• ✓ Cancele quando quiser • ✓ Suporte 24/7</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-est-pro-footer">
        <div className="lp-est-pro-container">
          <p>&copy; 2024 NODON. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* VIDEO MODAL */}
      {videoModalOpen && currentVideo && (
        <div className="video-modal-overlay" onClick={closeVideoModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="video-modal-close" onClick={closeVideoModal}>
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
            <video
              ref={videoRef}
              controls
              autoPlay
              className="video-modal-player"
            >
              <source src={currentVideo} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
          </div>
        </div>
      )}

      {/* WHATSAPP FLUTUANTE */}
      <button 
        type="button" 
        className="whatsapp-float" 
        onClick={handleWhatsAppClick}
        aria-label="Falar no WhatsApp"
      >
        <FontAwesomeIcon icon={faWhatsapp} />
      </button>
    </div>
  )
}

export default LPEstudantePROSaude
