import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faComments, faRobot, faPaperPlane, faUser, faMagic, faShieldAlt,
  faHistory, faBars, faTimes, faPlus
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import './Chat.css'

// Função para gerar respostas mockadas
const generateMockResponse = (message) => {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('cárie') || lowerMessage.includes('carie')) {
    return 'Cáries são lesões causadas por bactérias que destroem o esmalte dentário. O tratamento geralmente envolve remoção da parte afetada e restauração com resina ou amálgama. É importante manter boa higiene bucal e visitas regulares ao dentista para prevenção.'
  }
  
  if (lowerMessage.includes('canal') || lowerMessage.includes('endodontia')) {
    return 'O tratamento de canal (endodontia) é realizado quando a polpa dentária está infectada ou danificada. O procedimento remove o tecido infectado, limpa e desinfeta o interior do dente, e depois o sela. Após o tratamento, geralmente é necessário uma coroa para proteger o dente.'
  }
  
  if (lowerMessage.includes('ortodontia') || lowerMessage.includes('aparelho')) {
    return 'A ortodontia corrige o alinhamento dos dentes e a mordida. Pode ser feita com aparelhos fixos ou móveis, dependendo do caso. O tratamento geralmente leva de 1 a 3 anos e requer manutenção periódica. É importante seguir as orientações do ortodontista para obter os melhores resultados.'
  }
  
  if (lowerMessage.includes('limpeza') || lowerMessage.includes('profilaxia')) {
    return 'A limpeza dental (profilaxia) remove placa bacteriana e tártaro que não podem ser removidos apenas com escovação. É recomendada a cada 6 meses para manter a saúde bucal. Durante o procedimento, o dentista também pode aplicar flúor para fortalecer os dentes.'
  }
  
  if (lowerMessage.includes('implante') || lowerMessage.includes('implante')) {
    return 'Implantes dentários são uma solução permanente para substituir dentes perdidos. Consistem em uma raiz artificial de titânio que é inserida no osso maxilar, sobre a qual é colocada uma coroa. O processo pode levar alguns meses e requer boa saúde bucal e óssea.'
  }
  
  if (lowerMessage.includes('clareamento') || lowerMessage.includes('clarear')) {
    return 'O clareamento dental pode ser feito no consultório ou em casa com acompanhamento profissional. O procedimento usa agentes clareadores como peróxido de hidrogênio. É importante ter cuidado com sensibilidade e seguir as orientações do dentista. Resultados variam de pessoa para pessoa.'
  }
  
  // Resposta genérica
  return 'Entendo sua dúvida sobre odontologia. Para uma resposta mais específica, você poderia detalhar melhor sua pergunta? Estou aqui para ajudar com informações sobre tratamentos, procedimentos, prevenção e cuidados com a saúde bucal. Lembre-se: o NODON serve como apoio ao profissional. A decisão final deve ser sempre do responsável.'
}

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoadingHistory(true)
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar histórico do localStorage
      const savedHistory = JSON.parse(localStorage.getItem('mockChatHistory') || '[]')
      
      // Agrupar conversas por data
      const grouped = savedHistory.reduce((acc, conv) => {
        const date = new Date(conv.created_at).toLocaleDateString('pt-BR')
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(conv)
        return acc
      }, {})
      
      setConversations(grouped)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadConversation = async (conversationId) => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar do histórico do localStorage
      const savedHistory = JSON.parse(localStorage.getItem('mockChatHistory') || '[]')
      const conv = savedHistory.find(c => c.id === conversationId)
      
      if (conv) {
        setMessages([
          { role: 'user', content: conv.mensagem },
          { role: 'assistant', content: conv.resposta, isTyping: false }
        ])
        setCurrentConversationId(conversationId)
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setCurrentConversationId(null)
    setShowHistory(false)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)
    setIsTyping(value.length > 0)
    
    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Se o usuário parar de digitar por 1 segundo, esconder indicador
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    const userMessage = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = input
    setInput('')
    setLoading(true)
    setIsThinking(true)

    try {
      // Simular delay de pensamento
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Gerar resposta mockada baseada na mensagem
      const aiResponse = generateMockResponse(messageToSend)
      
      setIsThinking(false)
      
      // Simular digitação da IA palavra por palavra com velocidade variável
      const words = aiResponse.split(' ')
      let currentText = ''
      
      // Adicionar mensagem vazia inicial
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        isTyping: true
      }])

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        // Velocidade variável: mais rápido para palavras curtas, mais lento para pontuação
        const delay = word.length < 4 ? 15 : word.match(/[.,!?;:]/) ? 60 : 25
        
        await new Promise(resolve => setTimeout(resolve, delay))
        currentText += (i > 0 ? ' ' : '') + word
        
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content: currentText,
              isTyping: true
            }
          }
          return newMessages
        })
        
        // Scroll suave apenas a cada 5 palavras para melhor performance
        if (i % 5 === 0) {
          scrollToBottom()
        }
      }
      
      // Scroll final
      scrollToBottom()
      
      // Marcar mensagem como completa
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            isTyping: false
          }
        }
        return newMessages
      })
      
      // Salvar no histórico
      const savedHistory = JSON.parse(localStorage.getItem('mockChatHistory') || '[]')
      const newConversation = {
        id: Date.now(),
        mensagem: messageToSend,
        resposta: aiResponse,
        created_at: new Date().toISOString()
      }
      savedHistory.unshift(newConversation)
      localStorage.setItem('mockChatHistory', JSON.stringify(savedHistory))
      
      // Recarregar histórico após nova mensagem
      loadConversations()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setIsThinking(false)
      const errorMessage = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        isTyping: false
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="chat-modern">
      <div className="chat-container-modern">
        <div className="chat-header-modern">
          <div className="chat-header-content">
            <button 
              className="history-toggle-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              <FontAwesomeIcon icon={faHistory} />
            </button>
            <div className="chat-ai-avatar">
              <img src={nodoLogo} alt="NODON" className="nodo-chat-logo" />
            </div>
            <div>
              <h2>IA NODON</h2>
              <p>Converse sobre casos odontológicos e obtenha insights inteligentes</p>
            </div>
          </div>
          <div className="chat-status">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>

        <div className="chat-content-wrapper">
          {/* Sidebar de Histórico */}
          {showHistory && (
            <div className="chat-history-sidebar">
              <div className="history-header">
                <h3>
                  <FontAwesomeIcon icon={faHistory} />
                  Histórico de Conversas
                </h3>
                <button 
                  className="close-history-btn"
                  onClick={() => setShowHistory(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <button 
                className="new-conversation-btn"
                onClick={startNewConversation}
              >
                <FontAwesomeIcon icon={faPlus} />
                Nova Conversa
              </button>
              <div className="history-list">
                {loadingHistory ? (
                  <div className="history-loading">
                    <div className="loading-spinner-small"></div>
                    <p>Carregando...</p>
                  </div>
                ) : Object.keys(conversations).length === 0 ? (
                  <div className="history-empty">
                    <p>Nenhuma conversa anterior</p>
                  </div>
                ) : (
                  Object.entries(conversations).map(([date, convs]) => (
                    <div key={date} className="history-date-group">
                      <div className="history-date-label">{date}</div>
                      {convs.map((conv) => (
                        <button
                          key={conv.id}
                          className={`history-item ${currentConversationId === conv.id ? 'active' : ''}`}
                          onClick={() => loadConversation(conv.id)}
                        >
                          <div className="history-item-preview">
                            <strong>{conv.mensagem.substring(0, 50)}...</strong>
                          </div>
                          <div className="history-item-time">
                            {new Date(conv.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="chat-messages-modern">
            {/* Aviso dentro da área de mensagens */}
            <div className="chat-disclaimer-message">
              <div className="disclaimer-icon">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <div className="disclaimer-text">
                <strong>Importante:</strong> O NODON deve servir como apoio ao profissional. A decisão final deve ser sempre do responsável.
              </div>
            </div>
          {messages.length === 0 ? (
            <div className="chat-welcome-modern">
              <div className="welcome-icon-modern">
                <FontAwesomeIcon icon={faMagic} />
              </div>
              <h3>Olá! Sou sua assistente de IA</h3>
              <p>Como posso ajudá-lo hoje com questões odontológicas?</p>
              <div className="suggestions">
                <button 
                  className="suggestion-btn"
                  onClick={() => setInput('Como analisar uma radiografia panorâmica?')}
                >
                  Como analisar uma radiografia panorâmica?
                </button>
                <button 
                  className="suggestion-btn"
                  onClick={() => setInput('Quais são os principais achados radiográficos?')}
                >
                  Quais são os principais achados radiográficos?
                </button>
                <button 
                  className="suggestion-btn"
                  onClick={() => setInput('Explique sobre cáries em radiografias')}
                >
                  Explique sobre cáries em radiografias
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message-modern ${msg.role} message-enter ${msg.isTyping ? 'typing' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <FontAwesomeIcon icon={faUser} />
                  ) : (
                    <img src={nodoLogo} alt="NODON" className="nodo-message-avatar" />
                  )}
                </div>
                <div className="message-content-modern">
                  <div className="message-bubble">
                    {msg.content}
                    {msg.isTyping && (
                      <span className="typing-cursor">|</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isThinking && (
            <div className="message-modern assistant thinking">
              <div className="message-avatar">
                <img src={nodoLogo} alt="NODON" className="nodo-message-avatar" />
              </div>
              <div className="message-content-modern">
                <div className="message-bubble thinking-bubble">
                  <div className="thinking-indicator">
                    <span className="thinking-text">Pensando</span>
                    <div className="thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {loading && !isThinking && (
            <div className="message-modern assistant">
              <div className="message-avatar">
                <img src={nodoLogo} alt="NODON" className="nodo-message-avatar" />
              </div>
              <div className="message-content-modern">
                <div className="message-bubble">
                  <div className="typing-indicator-modern">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSend} className="chat-input-modern">
          {isTyping && (
            <div className="user-typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Digite sua mensagem..."
              className="chat-input-field"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="chat-send-btn-modern" 
              disabled={loading || !input.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chat
