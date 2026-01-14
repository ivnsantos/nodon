import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faComments, faRobot, faPaperPlane, faUser, faMagic, faShieldAlt,
  faHistory, faBars, faTimes, faPlus, faExclamationTriangle, faLock
} from '@fortawesome/free-solid-svg-icons'
import ReactMarkdown from 'react-markdown'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import './Chat.css'

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
  const [tokensInfo, setTokensInfo] = useState(null)
  const [tokensBlocked, setTokensBlocked] = useState(false)
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
    checkTokens()
  }, [])

  const checkTokens = async () => {
    try {
      const response = await api.get('/assinaturas/dashboard')
      const tokensChat = response.data.tokensChat
      
      if (tokensChat) {
        setTokensInfo(tokensChat)
        // Verificar se tokensUtilizados >= limitePlano
        // Pode vir tokensUtilizados (total) ou tokensUtilizadosMes (do mês)
        const tokensUtilizados = tokensChat.tokensUtilizadosMes !== undefined 
          ? tokensChat.tokensUtilizadosMes 
          : (tokensChat.tokensUtilizados || 0)
        const limitePlano = tokensChat.limitePlano || 0
        
        if (limitePlano > 0 && tokensUtilizados >= limitePlano) {
          setTokensBlocked(true)
        } else {
          setTokensBlocked(false)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar tokens:', error)
      // Em caso de erro, não bloquear o chat
      setTokensBlocked(false)
    }
  }

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
    if (!input.trim() || loading || tokensBlocked) return

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
      // Preparar histórico de conversa para enviar à API
      // O histórico são as mensagens anteriores (excluindo a mensagem atual que acabou de ser adicionada)
      const currentMessages = [...messages]
      const history = currentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Montar payload da API
      const payload = {
        message: messageToSend
      }

      // Adicionar histórico apenas se houver mensagens anteriores
      if (history.length > 0) {
        payload.history = history
      }

      // Obter token de autenticação
      const token = sessionStorage.getItem('token')
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      
      // Fazer requisição POST com streaming
      const response = await fetch(`${baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setIsThinking(false)
      
      // Adicionar mensagem vazia inicial para o assistente
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        isTyping: true
      }])

      let chatText = ''
      let tokensUsed = 0
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        // Decodificar chunk e adicionar ao buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Processar linhas completas (SSE format: "data: {...}\n\n")
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Manter última linha incompleta no buffer

        for (const line of lines) {
          if (!line.trim()) continue
          
          // Remover prefixo "data: " se presente
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line
          
          try {
            const data = JSON.parse(dataLine)
            
            if (data.type === 'chunk') {
              // Adicionar chunk ao texto visível
              chatText += data.content
              
              // Atualizar UI com o texto acumulado
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: chatText,
                    isTyping: true
                  }
                }
                return newMessages
              })
              
              // Scroll suave a cada atualização
              scrollToBottom()
            } else if (data.type === 'done') {
              // Resposta completa
              tokensUsed = data.tokensUsed || 0
              console.log('Tokens usados:', tokensUsed)
              
              // Marcar mensagem como completa
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: chatText,
                    isTyping: false
                  }
                }
                return newMessages
              })
              
              break
            } else if (data.type === 'error') {
              console.error('Erro:', data.message)
              throw new Error(data.message || 'Erro ao processar resposta')
            }
          } catch (parseError) {
            // Ignorar erros de parsing de linhas incompletas
            if (dataLine.trim()) {
              console.warn('Erro ao parsear linha:', dataLine, parseError)
            }
          }
        }
      }
      
      // Scroll final
      scrollToBottom()
      
      // Salvar no histórico local
      const savedHistory = JSON.parse(localStorage.getItem('mockChatHistory') || '[]')
      const newConversation = {
        id: Date.now(),
        mensagem: messageToSend,
        resposta: chatText,
        created_at: new Date().toISOString()
      }
      savedHistory.unshift(newConversation)
      localStorage.setItem('mockChatHistory', JSON.stringify(savedHistory))
      
      // Recarregar histórico após nova mensagem
      loadConversations()
      
      // Verificar tokens após enviar mensagem
      await checkTokens()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setIsThinking(false)
      
      // Mensagem de erro mais detalhada
      let errorContent = 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorContent = 'Sua sessão expirou. Por favor, faça login novamente.'
      } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
        errorContent = 'Erro no servidor. Tente novamente em alguns instantes.'
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorContent = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      }
      
      const errorMessage = {
        role: 'assistant',
        content: errorContent,
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
            
            {/* Mensagem de bloqueio por tokens */}
            {tokensBlocked && (
              <div className="tokens-blocked-message">
                <div className="tokens-blocked-icon">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <div className="tokens-blocked-content">
                  <h3>Limite de Tokens Atingido</h3>
                  <p>
                    Você atingiu o limite de tokens do seu plano ({tokensInfo?.limitePlano?.toLocaleString('pt-BR') || 'N/A'} tokens).
                    Para continuar usando o chat, entre em contato para renovar ou atualizar seu plano.
                  </p>
                  <div className="tokens-stats">
                    <span>
                      Tokens utilizados: <strong>
                        {(tokensInfo?.tokensUtilizadosMes !== undefined 
                          ? tokensInfo.tokensUtilizadosMes 
                          : tokensInfo?.tokensUtilizados || 0).toLocaleString('pt-BR')}
                      </strong> / {tokensInfo?.limitePlano?.toLocaleString('pt-BR') || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
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
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
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
              placeholder={tokensBlocked ? "Limite de tokens atingido" : "Digite sua mensagem..."}
              className="chat-input-field"
              disabled={loading || tokensBlocked}
            />
            <button 
              type="submit" 
              className="chat-send-btn-modern" 
              disabled={loading || !input.trim() || tokensBlocked}
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
