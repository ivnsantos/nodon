import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGraduationCap, faCheckCircle, faUsers, faShieldAlt,
  faCloud, faMobileAlt, faRobot, faStar, faArrowRight,
  faBars, faTimes, faBolt, faXRay, faBookOpen, faRocket,
  faComments, faMessage, faBrain, faAward, faLightbulb,
  faChartLine, faHandHoldingHeart, faTag, faCoins,
  faFileAlt, faFileMedical, faClipboardList, faPen,
  faClock, faFire, faTrophy, faUserCheck, faArrowUp,
  faChartBar, faHeartbeat, faGift
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faYoutube, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '../utils/api'
import { trackButtonClick, trackFormSubmission, trackEvent } from '../utils/gtag'
import nodoLogo from '../img/nodo.png'
import estudanteImg from '../img/especializacao-em-odontologia-1.jpg'
import xl20Img from '../img/xl20.jpeg'
import julia20Img from '../img/JULIA20.jpeg'
import draisadentistaImg from '../img/DRAISADENTISTA.JPEG'
import milafazodontoEstudanteImg from '../img/MILAFAZODONTO_ESTU.jpeg'
import './LPEstudante.css'

const LPEstudante = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [cupomCode, setCupomCode] = useState(null)
  const [cupomValido, setCupomValido] = useState(false)
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [cupomData, setCupomData] = useState(null) // Armazena dados do cupom (discountValue, etc)
  const [loading, setLoading] = useState(true) // Loading geral

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
      
      // IDs dos planos específicos para estudantes
      const planosIdsPermitidos = [
        '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7',
        '3521d057-f3b3-4ae5-9966-a5bdeddc38f2'
      ]
      
      const planosIniciais = planosBackend.filter(plano => {
        return planosIdsPermitidos.includes(plano.id) && plano.ativo !== false
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
        const isPlanoChat = plano.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' || plano.nome?.toLowerCase().includes('estudante') || plano.nome?.toLowerCase().includes('chat')
        const isPlanoInicial = plano.id === '3521d057-f3b3-4ae5-9966-a5bdeddc38f2' || plano.nome?.toLowerCase().includes('inicial')

        if (isPlanoChat) {
          // Plano Estudante - Ideal para Estudantes
          badge = 'Ideal para Estudantes'
          features = [
            'Chat especializado em odontologia 24/7',
            'IA treinada especificamente para odontologia',
            'Tire dúvidas sobre diagnósticos e tratamentos',
            'Suporte para técnicas odontológicas',
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
            'Precificação de tratamentos',
            'Feedbacks e avaliações',
            'Gráficos customizados para melhor entendimento',
            'Suporte por email',
            'Armazenamento ilimitado na nuvem',
            '1 Milhõe  de tokens no chat IA',
            'Acesso mobile completo',
            'Sem fidelidade - cancele quando quiser'
          ]
        }

        return {
          id: plano.id,
          nome: plano.nome,
          valorOriginal: valorOriginal, // Já convertido para número acima
          valorPromocional: valorPromocional, // Já convertido para número acima (ou null)
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
        setCupomData(cupom) // Armazena os dados do cupom (discountValue, name, etc)
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
    trackButtonClick('cta_header', 'lp_estudante_header')
    scrollToSection('contato')
  }

  const handlePlanSelect = (planoNome, planoId) => {
    trackButtonClick('assinar_plano', `lp_estudante_plano_${planoNome}`)
    trackEvent('select_content', {
      content_type: 'plan',
      content_id: planoId,
      content_name: planoNome
    })
    const cupomParam = cupomCode ? `&cupom=${encodeURIComponent(cupomCode)}` : ''
    navigate(`/checkout?plano=${encodeURIComponent(planoNome)}&planoId=${planoId}&origem=estudante${cupomParam}`)
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
      return `${(numTokens / 1000000).toFixed(1)} Milhõe ${numTokens > 1000000 ? 's' : ''}`
    } else if (numTokens >= 1000) {
      return `${(numTokens / 1000).toFixed(0)} mil`
    }
    return numTokens.toString()
  }

  // Determina qual imagem usar
  const getHeroImage = () => {
    if (cupomCode === 'DRAISADENTISTA' && cupomValido) {
      return draisadentistaImg
    }
    if (cupomCode === 'JULIA20' && cupomValido) {
      return julia20Img
    }
    if (cupomCode === 'XL20' && cupomValido) {
      return xl20Img
    }
    if (cupomCode === 'MILAFAZODONTO' && cupomValido) {
      return milafazodontoEstudanteImg
    }
    return estudanteImg
  }

  const getHeroImageAlt = () => {
    if (cupomCode === 'DRAISADENTISTA' && cupomValido) {
      return "Cupom DRAISADENTISTA"
    }
    if (cupomCode === 'JULIA20' && cupomValido) {
      return "Cupom JULIA20"
    }
    if (cupomCode === 'XL20' && cupomValido) {
      return "Cupom XL20"
    }
    if (cupomCode === 'MILAFAZODONTO' && cupomValido) {
      return "Cupom MILAFAZODONTO"
    }
    return "Estudantes de Odontologia"
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
    <div className="lp-estudante">
      {/* Tag de Cupom Ativo */}
      {cupomCode && (
        <div className={`cupom-banner ${cupomValido ? 'valid' : validandoCupom ? 'validating' : 'invalid'}`}>
          <div className="cupom-banner-content">
            {cupomCode === 'DRAISADENTISTA' && cupomValido && (
              <img src={draisadentistaImg} alt="Cupom DRAISADENTISTA" className="cupom-image" />
            )}
            {cupomCode === 'JULIA20' && cupomValido && (
              <img src={julia20Img} alt="Cupom JULIA20" className="cupom-image" />
            )}
            {cupomCode === 'XL20' && cupomValido && (
              <img src={xl20Img} alt="Cupom XL20" className="cupom-image" />
            )}
            <FontAwesomeIcon icon={faTag} />
            {validandoCupom ? (
              <span>Validando cupom <strong>{cupomCode}</strong>...</span>
            ) : cupomValido && cupomData ? (
              <span>
                Cupom <strong>{cupomCode}</strong> ativo!{' '}
                <strong>
                  {Number(cupomData.discountValue || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}% de desconto
                </strong>{' '}
                aplicado.
              </span>
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

      {/* Hero - Layout Minimalista e Persuasivo */}
      <section className="hero-section">
        <div className="lp-container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-label">
                <FontAwesomeIcon icon={faFire} />
                <span>IA Especializada em Odontologia</span>
              </div>
              <h1 className="hero-title">
                NODON
                <br />
                 <span className="gradient-text">seu </span> melhor assistente nos estudos.
              </h1>
              <p className="hero-description">
                A NODON não é apenas uma ferramenta. É seu <strong>assistente pessoal de estudos</strong> que vai te ajudar a fazer trabalhos, artigos e estudos com IA especializada em odontologia.
              </p>
              <div className="hero-features">
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>IA para trabalhos e artigos acadêmicos</span>
                </div>
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Estude mais rápido e aprenda melhor</span>
                </div>
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Professor particular 24/7</span>
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
              <div className="metric-value">+850</div>
              <div className="metric-label">Estudantes</div>
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

      {/* Seção: Por que você precisa da NODON - Versão Ultra Persuasiva para Estudantes */}
      <section className="why-nodon-section" id="sobre">
        <div className="lp-container">
          {/* Abertura Impactante */}
          <div className="why-nodon-opener">
            <div className="opener-badge">
              <FontAwesomeIcon icon={faFire} />
              <span>FEITA ESPECIFICAMENTE PARA ESTUDANTES</span>
            </div>
            <h2 className="opener-title">
              Pare de <span className="highlight-red">perder noites</span> fazendo trabalhos e artigos e não entendendo o conteúdo.
              <br />
              Use IA e <span className="highlight-blue">seja mais produtivo e consiga resumir o conteúdo.</span>
            </h2>
            <p className="opener-subtitle">
              A NODON não é apenas uma ferramenta. É seu <strong>assistente pessoal de estudos</strong> para transformar sua jornada acadêmica e alcançar o sucesso que você merece.
            </p>
          </div>

          {/* Comparação Visual: Antes vs Depois */}
          <div className="before-after-comparison">
            <div className="comparison-header">
              <h2>Antes vs. Depois da NODON</h2>
              <p>Veja a diferença que a IA faz na sua vida acadêmica</p>
            </div>
            <div className="comparison-grid">
              <div className="comparison-column before">
                <div className="comparison-label">
                  <FontAwesomeIcon icon={faTimes} />
                  <span>SEM NODON</span>
                </div>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="item-content">
                      <h4>Noites sem dormir</h4>
                      <p>Fazendo trabalhos e artigos até de madrugada</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faTimes} />
                    </div>
                    <div className="item-content">
                      <h4>Dúvidas sem resposta</h4>
                      <p>Professores indisponíveis, livros confusos</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faTimes} />
                    </div>
                    <div className="item-content">
                      <h4>Notas medianas</h4>
                      <p>Trabalhos sem profundidade, artigos superficiais</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon bad">
                      <FontAwesomeIcon icon={faTimes} />
                    </div>
                    <div className="item-content">
                      <h4>Estresse constante</h4>
                      <p>Prazos apertados, conteúdo difícil de entender</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="comparison-column after">
                <div className="comparison-label good">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>COM NODON</span>
                </div>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <div className="item-content">
                      <h4>Trabalhos em minutos</h4>
                      <p>IA escreve e estrutura seus trabalhos e artigos</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <div className="item-content">
                      <h4>Professor 24/7</h4>
                      <p>IA especializada responde todas suas dúvidas</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <div className="item-content">
                      <h4>Notas excelentes</h4>
                      <p>Trabalhos profundos, artigos científicos de qualidade</p>
                    </div>
                  </div>
                  <div className="comparison-item">
                    <div className="item-icon good">
                      <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <div className="item-content">
                      <h4>Estude tranquilo</h4>
                      <p>Mais tempo livre, menos estresse, melhor aprendizado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Números que Impactam */}
          <div className="why-nodon-stats">
            <div className="stats-header">
              <h2>O Impacto Real na Sua Vida Acadêmica</h2>
              <p>Números que fazem a diferença</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card mega">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div className="stat-number">10+</div>
                <div className="stat-unit">horas</div>
                <div className="stat-label">Economizadas por semana</div>
                <p>Mais tempo para estudar o que realmente importa</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <div className="stat-number">100%</div>
                <div className="stat-unit">dos trabalhos</div>
                <div className="stat-label">Com IA especializada</div>
                <p>Trabalhos e artigos com qualidade profissional</p>
              </div>
              <div className="stat-card mega">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <div className="stat-number">1M</div>
                <div className="stat-unit">tokens</div>
                <div className="stat-label">Para estudos</div>
                <p>Pergunte quantas vezes precisar</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faTrophy} />
                </div>
                <div className="stat-number">98%</div>
                <div className="stat-unit">satisfação</div>
                <div className="stat-label">Dos estudantes</div>
                <p>Melhorias reais nas notas e aprendizado</p>
              </div>
            </div>
          </div>

          {/* Transformação Completa */}
          <div className="transformation-section">
            <div className="transformation-header">
              <h2>Sua Jornada de Sucesso em 6 Passos</h2>
              <p>Como a NODON transforma sua vida acadêmica</p>
            </div>
            <div className="transformation-grid">
              <div className="transformation-card">
                <div className="transformation-number">01</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <h3>Trabalhos Perfeitos</h3>
                <p>IA escreve e estrutura seus trabalhos acadêmicos com <strong>qualidade profissional</strong>. Pare de perder noites fazendo trabalhos.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Economize 10+ horas por semana</span>
                </div>
              </div>
              <div className="transformation-card">
                <div className="transformation-number">02</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faFileMedical} />
                </div>
                <h3>Artigos Científicos</h3>
                <p>Crie artigos científicos <strong>com referências e metodologia correta</strong>. IA especializada em odontologia te ajuda em cada etapa.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Qualidade de publicação</span>
                </div>
              </div>
              <div className="transformation-card">
                <div className="transformation-number">03</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faBrain} />
                </div>
                <h3>Estudos Inteligentes</h3>
                <p>Professor particular 24/7 para <strong>tirar dúvidas sobre qualquer tema</strong>. Aprenda mais rápido e melhor.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Compreensão profunda</span>
                </div>
              </div>
              <div className="transformation-card">
                <div className="transformation-number">04</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faXRay} />
                </div>
                <h3>Análise de Radiografias</h3>
                <p>Analise radiografias com IA e <strong>entenda cada achado</strong>. Perfeito para estudos práticos e trabalhos.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Diagnósticos precisos</span>
                </div>
              </div>
              <div className="transformation-card">
                <div className="transformation-number">05</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faMobileAlt} />
                </div>
                <h3>Estude em Qualquer Lugar</h3>
                <p>Acesse do celular, tablet ou computador. <strong>Estude quando e onde quiser</strong>, sem limitações.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Máxima flexibilidade</span>
                </div>
              </div>
              <div className="transformation-card">
                <div className="transformation-number">06</div>
                <div className="transformation-icon">
                  <FontAwesomeIcon icon={faTrophy} />
                </div>
                <h3>Seja o Melhor</h3>
                <p>Com trabalhos e artigos de qualidade, <strong>suas notas vão disparar</strong>. Destaque-se na turma.</p>
                <div className="transformation-benefit">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Sucesso garantido</span>
                </div>
              </div>
            </div>
          </div>

          {/* Urgência e CTA Final */}
          <div className="why-nodon-urgency">
            <div className="urgency-content">
              <div className="urgency-badge">
                <FontAwesomeIcon icon={faFire} />
                <span>OPORTUNIDADE ÚNICA</span>
              </div>
              <h2 className="urgency-title">
                Não fique para trás enquanto seus colegas <span className="highlight">já estão usando IA</span>
              </h2>
              <p className="urgency-subtitle">
                Enquanto você perde noites fazendo trabalhos, outros estudantes já estão usando IA e se destacando. Não seja o último a descobrir essa vantagem competitiva.
              </p>
              <div className="urgency-comparison">
                <div className="urgency-item">
                  <div className="urgency-icon">
                    <FontAwesomeIcon icon={faTrophy} />
                  </div>
                  <div className="urgency-text">
                    <strong>Seus colegas com NODON:</strong> Trabalhos prontos em minutos, notas altas, tempo livre
                  </div>
                </div>
                <div className="urgency-item">
                  <div className="urgency-icon">
                    <FontAwesomeIcon icon={faUserCheck} />
                  </div>
                  <div className="urgency-text">
                    <strong>Você sem NODON:</strong> Noites sem dormir, trabalhos medianos, estresse constante
                  </div>
                </div>
              </div>
              <div className="urgency-cta-box">
                  <h3>Pronto para transformar sua vida acadêmica?</h3>
                  <p>Comece agora e veja a diferença na sua próxima nota</p>
                  <div className="cta-benefits">
                    <div className="cta-benefit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Trabalhos em minutos</span>
                    </div>
                    <div className="cta-benefit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Artigos científicos</span>
                    </div>
                    <div className="cta-benefit">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Professor 24/7</span>
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
                // Os valores já vêm convertidos de loadPlanos
                const valorOriginal = Number(plano.valorOriginal) || 0
                const valorPromocional = plano.valorPromocional !== null && plano.valorPromocional !== undefined 
                  ? Number(plano.valorPromocional) 
                  : null
                
                // Verifica se tem promoção: valor promocional existe, é válido e menor que o original
                const temPromocao = valorPromocional !== null && 
                                    !isNaN(valorPromocional) &&
                                    valorPromocional > 0 && 
                                    valorOriginal > 0 &&
                                    valorPromocional < valorOriginal
                
                // Aplica desconto do cupom se estiver ativo
                let valorExibir = temPromocao ? valorPromocional : valorOriginal
                let temDescontoCupom = false
                // Valor base para aplicar desconto do cupom (promocional se existir, senão original)
                let valorBaseParaDesconto = temPromocao ? valorPromocional : valorOriginal
                
                if (cupomValido && cupomData && valorOriginal > 0) {
                  const discountPercent = Number(cupomData.discountValue) || 0
                  if (discountPercent > 0) {
                    // Aplica desconto sobre o valor promocional (se existir) ou sobre o original
                    const valorComDesconto = valorBaseParaDesconto * (1 - discountPercent / 100)
                    valorExibir = valorComDesconto
                    temDescontoCupom = true
                  }
                }
                
                return (
                  <div key={plano.id} className={`plan-item ${plano.featured ? 'featured' : ''}`}>
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
                        {/* Sempre mostra o original riscado quando tem promoção ou cupom */}
                        {(temPromocao || temDescontoCupom) && (
                          <div className="old-price">{formatarValor(valorOriginal)}</div>
                        )}
                        {/* Mostra o promocional riscado quando tem cupom aplicado */}
                        {temDescontoCupom && temPromocao && (
                          <div className="old-price">{formatarValor(valorPromocional)}</div>
                        )}
                        {/* Preço final */}
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
                      <div className="plan-free-trial">
                        <FontAwesomeIcon icon={faGift} />
                        <span>{plano.nome?.toLowerCase().includes('estudante') ? '2 dias de teste grátis para você' : '7 dias de teste grátis para você'}</span>
                      </div>
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
      <section className="cta-section" id="contato">
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
                
                // Evento GTM - Submissão de formulário
                trackFormSubmission('lp_estudante_form', {
                  plano: plano || 'nenhum',
                  origem: 'estudante'
                })
                trackEvent('generate_lead', {
                  form_type: 'lp_estudante',
                  plano: plano || 'nenhum'
                })
                
                const cupomParam = cupomCode ? `&cupom=${encodeURIComponent(cupomCode)}` : ''
                
                if (plano) {
                  navigate(`/checkout?plano=${encodeURIComponent(plano)}&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}&origem=estudante${cupomParam}`)
                } else {
                  navigate(`/checkout?nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}&origem=estudante${cupomParam}`)
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
