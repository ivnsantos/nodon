import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faComments,
  faMicrophone,
  faImage,
  faBolt,
  faGraduationCap,
  faStethoscope,
  faHeartbeat,
  faNotesMedical,
  faBrain,
  faCheckCircle,
  faRocket,
  faClock,
  faShieldAlt,
  faLightbulb,
  faStar,
  faQuoteLeft
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import nodoLogo from '../img/nodo.png'
import chatMilaVideo from '../video/cht-mila.mp4'
import chatExplicaVideo from '../video/chat-explica.mp4'
import chatNodonVideo from '../video/chat-nodon.MP4?url'
import './ChatHome.css'

const ChatHome = () => {
  const navigate = useNavigate()
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState(null)

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
    const message = encodeURIComponent('Olá, gostaria de saber mais sobre a IA para saúde.')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  return (
    <div className="chat-home">
      {/* HEADER */}
      <header className="chat-home-header">
        <div className="chat-home-container">
          <div className="chat-home-header-content">
            <img src={nodoLogo} alt="NODON Logo" className="chat-home-logo" onClick={() => navigate('/')} />
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

      {/* HERO SECTION */}
      <section className="chat-home-hero">
        <div className="chat-home-hero-bg">
          <div className="chat-home-particles">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="particle" style={{ '--i': i }} />
            ))}
          </div>
        </div>
        
        <div className="chat-home-container">
          <div className="chat-home-hero-content">
            <div className="chat-home-badge">
              <FontAwesomeIcon icon={faBolt} />
              <span>IA ESPECIALIZADA EM SAÚDE</span>
            </div>
            
            <h1 className="chat-home-title">
              Sua Assistente de <span className="highlight">Inteligência Artificial</span> para Saúde
            </h1>
            
            <p className="chat-home-subtitle">
              Converse por texto, áudio ou imagem com a IA mais avançada para profissionais e estudantes da área da saúde. Disponível 24 horas por dia, 7 dias por semana.
            </p>
            
            <div className="chat-home-features-quick">
              <div className="feature-quick">
                <FontAwesomeIcon icon={faComments} />
                <span>Chat por Texto</span>
              </div>
              <div className="feature-quick">
                <FontAwesomeIcon icon={faMicrophone} />
                <span>Mensagens de Voz</span>
              </div>
              <div className="feature-quick">
                <FontAwesomeIcon icon={faImage} />
                <span>Análise de Imagens</span>
              </div>
            </div>

            <div className="chat-home-cta-buttons">
              <button className="chat-home-btn-hero" onClick={() => navigate('/checkout?plano=3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7')}>
                <FontAwesomeIcon icon={faRocket} />
                <span>Começe Agora</span>
              </button>
              <button className="chat-home-btn-secondary-hero" onClick={handleWhatsAppClick}>
                <FontAwesomeIcon icon={faWhatsapp} />
                <span>Falar com Especialista</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE É A IA */}
      <section className="chat-home-about">
        <div className="chat-home-container">
          <div className="chat-home-about-content">
            <div className="chat-home-about-icon">
              <FontAwesomeIcon icon={faBrain} />
            </div>
            <h2 className="chat-home-section-title">
              O que é a IA NODON?
            </h2>
            <p className="chat-home-section-description">
              A IA NODON é uma inteligência artificial especializada e treinada especificamente para a área da saúde. 
              Ela entende medicina, enfermagem, odontologia, fisioterapia, nutrição e todas as profissões de saúde.
            </p>
            <div className="chat-home-about-highlights">
              <div className="about-highlight">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Treinada com milhares de casos clínicos reais</span>
              </div>
              <div className="about-highlight">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Atualizada constantemente com novos conhecimentos</span>
              </div>
              <div className="about-highlight">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Respostas baseadas em evidências científicas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="chat-home-how-it-works">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Como Funciona?</h2>
          <p className="chat-home-section-description">
            Três formas de interagir com a IA. Escolha a que preferir.
          </p>

          <div className="chat-home-demo-grid">
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
                <p>Digite suas perguntas e receba respostas completas e precisas sobre qualquer tema de saúde.</p>
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
                <p>Grave áudios com suas dúvidas e receba explicações detalhadas como um professor particular.</p>
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
                <p>Envie radiografias, exames e imagens clínicas para análise detalhada e sugestões.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="chat-home-audience">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Para Quem é a IA NODON?</h2>
          <p className="chat-home-section-description">
            Profissionais e estudantes de todas as áreas da saúde
          </p>

          <div className="chat-home-audience-grid">
            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
              <h3>Estudantes de Medicina</h3>
              <p>Tire dúvidas, estude casos clínicos e prepare-se para provas e residência médica.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faStethoscope} />
              </div>
              <h3>Estudantes de Enfermagem</h3>
              <p>Consulte protocolos, aprenda procedimentos e ganhe confiança na prática clínica.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faHeartbeat} />
              </div>
              <h3>Profissionais da Saúde</h3>
              <p>Otimize diagnósticos, consulte guidelines e melhore o atendimento aos pacientes.</p>
            </div>

            <div className="audience-card">
              <div className="audience-icon">
                <FontAwesomeIcon icon={faNotesMedical} />
              </div>
              <h3>Outras Áreas</h3>
              <p>Fisioterapia, Nutrição, Farmácia, Odontologia e todas as profissões de saúde.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="chat-home-benefits">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">Por que usar a IA NODON?</h2>
          
          <div className="chat-home-benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faBolt} />
              </div>
              <h3>Respostas Instantâneas</h3>
              <p>Receba respostas em segundos, sem esperar por professores ou colegas.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <h3>Disponível 24/7</h3>
              <p>Seu assistente pessoal está sempre disponível, a qualquer hora do dia ou da noite.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <h3>Confiável e Seguro</h3>
              <p>Respostas baseadas em evidências científicas e dados criptografados.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <FontAwesomeIcon icon={faLightbulb} />
              </div>
              <h3>Aprenda Mais Rápido</h3>
              <p>Explicações claras e didáticas que facilitam o aprendizado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="chat-home-testimonials">
        <div className="chat-home-container">
          <h2 className="chat-home-section-title">O que dizem sobre a IA</h2>
          
          <div className="chat-home-testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} />
                ))}
              </div>
              <FontAwesomeIcon icon={faQuoteLeft} className="quote-icon" />
              <p className="testimonial-text">
                "A IA NODON me ajudou a entender fisiopatologias complexas que eu não conseguia resolver sozinha. Economizei horas de pesquisa!"
              </p>
              <div className="testimonial-author">
                <strong>Maria Eduarda</strong>
                <span>Estudante de Medicina - 4º ano</span>
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
                "Incrível poder enviar áudios e imagens! A IA analisa exames e me dá insights que eu não tinha pensado."
              </p>
              <div className="testimonial-author">
                <strong>Lucas Oliveira</strong>
                <span>Estudante de Enfermagem</span>
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
                "Uso a IA todos os dias para estudar para a residência. Minha produtividade e compreensão triplicaram!"
              </p>
              <div className="testimonial-author">
                <strong>Fernanda Costa</strong>
                <span>Médica Recém-formada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="chat-home-cta-final">
        <div className="chat-home-container">
          <div className="chat-home-cta-content">
            <h2>Comece a usar a IA NODON agora</h2>
            <p>Transforme sua forma de estudar e trabalhar na área da saúde</p>
            <button className="chat-home-btn-cta-final" onClick={() => navigate('/checkout?plano=3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7')}>
              <FontAwesomeIcon icon={faRocket} />
              <span>Começe Agora</span>
            </button>
            <p className="chat-home-cta-note">• Sem cartão de crédito • Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="chat-home-footer">
        <div className="chat-home-container">
          <div className="chat-home-footer-content">
            <div className="footer-logo">
              <img src={nodoLogo} alt="NODON" />
              <span>NODON</span>
            </div>
            <p>&copy; 2024 NODON. Todos os direitos reservados.</p>
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
