import { useState, useRef, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faComments, faRobot, faPaperPlane, faUser, faMagic, faShieldAlt,
  faHistory, faBars, faTimes, faPlus, faExclamationTriangle, faLock, faStop,
  faMicrophone, faImage, faTrash, faArrowUp
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import ReactMarkdown from 'react-markdown'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useChatHeader } from '../context/ChatHeaderContext'
import nodoLogo from '../img/nodo.png'
import './Chat.css'

const Chat = () => {
  const { selectedClinicData } = useAuth()
  const chatHeaderContext = useChatHeader()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [conversations, setConversations] = useState({})
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [tokensInfo, setTokensInfo] = useState(null)
  const [tokensBlocked, setTokensBlocked] = useState(false)
  const [showTokenWarning, setShowTokenWarning] = useState(false)
  const [tokenWarningLevel, setTokenWarningLevel] = useState(null) // 'near' (80-89%) ou 'critical' (90-99%)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [attachedImages, setAttachedImages] = useState([])
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const fileInputRef = useRef(null)

  // Verifica se o usuário está próximo do final do chat (dentro de 200px do final)
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true
    
    const container = messagesContainerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    // Se estiver dentro de 200px do final, considera que está "próximo do final"
    return distanceFromBottom < 200
  }

  const scrollToBottom = (force = false) => {
    // Só faz scroll se o usuário estiver próximo do final ou se for forçado
    if (force || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Removido o useEffect que fazia scroll a cada mudança de mensagens
  // Agora o scroll só acontece quando necessário (durante streaming, se o usuário estiver no final)

  useEffect(() => {
    loadConversations()
    checkTokens()
  }, [selectedClinicData])

  // Verificar tokens periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokens()
    }, 30000) // Verificar a cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const checkTokens = async () => {
    try {
      const response = await api.get('/assinaturas/dashboard')
      const tokensChat = response.data?.tokensChat || response.data?.data?.tokensChat
      
      if (tokensChat) {
        setTokensInfo(tokensChat)
        // Verificar se tokensUtilizados >= limitePlano
        // Pode vir tokensUtilizados (total) ou tokensUtilizadosMes (do mês)
        const tokensUtilizados = tokensChat.tokensUtilizadosMes !== undefined 
          ? tokensChat.tokensUtilizadosMes 
          : (tokensChat.tokensUtilizados || 0)
        const limitePlano = tokensChat.limitePlano || 0
        
        if (limitePlano > 0) {
          const percentage = (tokensUtilizados / limitePlano) * 100
          
          // Bloquear quando atingir 100% ou mais
          if (tokensUtilizados >= limitePlano) {
            setTokensBlocked(true)
            setShowTokenWarning(false)
            setTokenWarningLevel(null)
          } else {
            setTokensBlocked(false)
            
            // Avisar quando próximo do limite
            if (percentage >= 90) {
              // Crítico: 90-99%
              setShowTokenWarning(true)
              setTokenWarningLevel('critical')
            } else if (percentage >= 80) {
              // Próximo: 80-89%
              setShowTokenWarning(true)
              setTokenWarningLevel('near')
            } else {
              // Abaixo de 80%, não mostrar aviso
              setShowTokenWarning(false)
              setTokenWarningLevel(null)
            }
          }
        } else {
          // Plano ilimitado
          setTokensBlocked(false)
          setShowTokenWarning(false)
          setTokenWarningLevel(null)
        }
      } else {
        // Se não houver tokensChat, definir valores padrão para exibir o componente
        setTokensInfo({
          tokensUtilizados: 0,
          tokensUtilizadosMes: 0,
          limitePlano: 0
        })
        setTokensBlocked(false)
        setShowTokenWarning(false)
        setTokenWarningLevel(null)
      }
    } catch (error) {
      console.error('Erro ao verificar tokens:', error)
      // Em caso de erro, não bloquear o chat
      setTokensBlocked(false)
      setShowTokenWarning(false)
      setTokenWarningLevel(null)
      // Definir valores padrão para exibir o componente mesmo com erro
      setTokensInfo({
        tokensUtilizados: 0,
        tokensUtilizadosMes: 0,
        limitePlano: 0
      })
    }
  }

  // Calcular porcentagem de tokens utilizados
  const getTokensPercentage = () => {
    if (!tokensInfo || !tokensInfo.limitePlano || tokensInfo.limitePlano === 0) return 0
    
    const tokensUtilizados = tokensInfo.tokensUtilizadosMes !== undefined 
      ? tokensInfo.tokensUtilizadosMes 
      : (tokensInfo.tokensUtilizados || 0)
    
    return Math.min((tokensUtilizados / tokensInfo.limitePlano) * 100, 100)
  }

  // Verificar se está próximo do limite (80% ou mais)
  const isNearLimit = () => {
    const percentage = getTokensPercentage()
    return percentage >= 80 && percentage < 100
  }

  // Verificar se está acima de 95% (para animação de piscar)
  const isCriticalLimit = () => {
    const percentage = getTokensPercentage()
    return percentage >= 95
  }

  // Verificar se atingiu o limite
  const isAtLimit = () => {
    return getTokensPercentage() >= 100 || tokensBlocked
  }

  // Função para abrir WhatsApp para solicitar mais tokens
  const handleSolicitarMaisTokens = () => {
    const phoneNumber = '5511932589622' // Número com código do país (55 = Brasil)
    const message = encodeURIComponent('Olá, eu quero mais tokens da ia nodon')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const loadConversations = async () => {
    try {
      setLoadingHistory(true)
      
      // Buscar conversas da API
      const response = await api.get('/chat/conversations')
      
      // A API pode retornar data.data.data ou data.data ou data
      let data = response.data
      if (data?.data?.data) {
        data = data.data.data
      } else if (data?.data) {
        data = data.data
      }
      
      
      // A estrutura pode variar, então vamos tratar diferentes formatos
      let conversationsList = []
      if (Array.isArray(data)) {
        conversationsList = data
      } else if (data?.conversations) {
        conversationsList = data.conversations
      } else if (data?.history) {
        conversationsList = data.history
      } else if (data?.chats) {
        conversationsList = data.chats
      } else if (data?.conversationId || data?.id) {
        // Se for um objeto único com conversationId, colocar em um array
        conversationsList = [data]
      }
      
      if (conversationsList.length === 0) {
        setConversations({})
        return
      }
      
      // Agrupar conversas por data
      const grouped = conversationsList.reduce((acc, conv) => {
        const dateStr = conv.created_at || conv.createdAt || conv.updatedAt || new Date().toISOString()
        const date = new Date(dateStr).toLocaleDateString('pt-BR')
        if (!acc[date]) {
          acc[date] = []
        }
        
        // Extrair a primeira mensagem do usuário para preview
        let mensagemPreview = ''
        if (conv.title) {
          mensagemPreview = conv.title
        } else if (conv.mensagem) {
          mensagemPreview = conv.mensagem
        } else if (conv.message) {
          mensagemPreview = conv.message
        } else if (conv.userMessage) {
          mensagemPreview = conv.userMessage
        } else if (Array.isArray(conv.messages) && conv.messages.length > 0) {
          const firstUserMsg = conv.messages.find(m => m.role === 'user')
          mensagemPreview = firstUserMsg?.content || conv.messages[0]?.content || 'Conversa'
        } else {
          mensagemPreview = 'Conversa'
        }
        
        acc[date].push({
          id: conv.conversationId || conv.id || conv._id,
          mensagem: mensagemPreview,
          resposta: conv.resposta || conv.response || conv.assistantMessage || '',
          created_at: dateStr
        })
        return acc
      }, {})
      
      setConversations(grouped)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      // Em caso de erro, tentar carregar do localStorage como fallback
      try {
        const savedHistory = JSON.parse(localStorage.getItem('mockChatHistory') || '[]')
        if (savedHistory.length > 0) {
          const grouped = savedHistory.reduce((acc, conv) => {
            const date = new Date(conv.created_at).toLocaleDateString('pt-BR')
            if (!acc[date]) {
              acc[date] = []
            }
            acc[date].push(conv)
            return acc
          }, {})
          setConversations(grouped)
        } else {
          setConversations({})
        }
      } catch (fallbackError) {
        console.error('Erro ao carregar histórico do localStorage:', fallbackError)
        setConversations({})
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadConversation = async (conversationId) => {
    try {
      
      // Buscar conversa específica da API
      const response = await api.get(`/chat/history/${conversationId}`)
      
      // A API pode retornar data.data.data ou data.data ou data
      let data = response.data
      if (data?.data?.data) {
        data = data.data.data
      } else if (data?.data) {
        data = data.data
      }
      
      
      if (data) {
        // Mapear mensagens da API para o formato do componente
        const messagesList = []
        
        // Pegar as mensagens do objeto
        let messages = data.messages || data
        
        // Se messages for um array de mensagens
        if (Array.isArray(messages) && messages.length > 0) {
          messages.forEach(msg => {
            // Filtrar apenas mensagens de user e assistant
            if (msg.role === 'user' || msg.role === 'assistant') {
              const messageObj = {
                role: msg.role,
                content: msg.content || msg.mensagem || msg.text || '',
                isTyping: false
              }
              
              // Incluir imagens se existirem
              if (msg.imageUrls && Array.isArray(msg.imageUrls) && msg.imageUrls.length > 0) {
                messageObj.images = msg.imageUrls
              }
              
              messagesList.push(messageObj)
            }
          })
        } else {
          // Se a API retornar mensagem e resposta separadas
          if (data.mensagem || data.message || data.userMessage) {
            messagesList.push({
              role: 'user',
              content: data.mensagem || data.message || data.userMessage
            })
          }
          if (data.resposta || data.response || data.assistantMessage) {
            messagesList.push({
              role: 'assistant',
              content: data.resposta || data.response || data.assistantMessage,
              isTyping: false
            })
          }
        }
        
        
        if (messagesList.length > 0) {
          setMessages(messagesList)
          setCurrentConversationId(conversationId)
          setShowHistory(false)
        } else {
          console.warn('Nenhuma mensagem encontrada na conversa')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
      console.error('Detalhes:', error.response?.data || error.message)
      // Fallback para localStorage
      try {
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
      } catch (fallbackError) {
        console.error('Erro ao carregar conversa do localStorage:', fallbackError)
      }
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

  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    setIsThinking(false)
    setIsStreaming(false)
    
    // Marcar a última mensagem como completa
    setMessages(prev => {
      const newMessages = [...prev]
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isTyping) {
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + ' [Resposta interrompida]',
          isTyping: false
        }
      }
      return newMessages
    })
  }

  // Funções para gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Não foi possível acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setAudioBlob(null)
    audioChunksRef.current = []
  }

  // Funções para anexar imagens
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    processImageFiles(files)
    e.target.value = '' // Reset input
  }

  const processImageFiles = (files) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAttachedImages(prev => [...prev, {
            id: Date.now() + Math.random(),
            data: e.target.result,
            name: file.name
          }])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (imageId) => {
    setAttachedImages(prev => prev.filter(img => img.id !== imageId))
  }

  // Handler para colar imagem (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          processImageFiles([file])
        }
        break
      }
    }
  }

  // Converter blob para base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    
    // Verificar se há conteúdo para enviar (texto, áudio ou imagens)
    const hasContent = input.trim() || audioBlob || attachedImages.length > 0
    if (!hasContent || loading || tokensBlocked) return

    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Preparar mensagem do usuário para exibição
    const userMessageContent = []
    if (input.trim()) userMessageContent.push(input)
    if (audioBlob) userMessageContent.push('🎤 Áudio enviado')

    const userMessage = {
      role: 'user',
      content: userMessageContent.join('\n'),
      images: attachedImages.map(img => img.data),
      hasAudio: !!audioBlob
    }

    setMessages(prev => [...prev, userMessage])
    // Forçar scroll quando o usuário envia uma mensagem
    setTimeout(() => scrollToBottom(true), 100)
    const messageToSend = input
    const imagesToSend = [...attachedImages]
    const audioToSend = audioBlob
    
    // Limpar inputs
    setInput('')
    setAttachedImages([])
    setAudioBlob(null)
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

      // Obter clienteMasterId do contexto (pode estar em diferentes lugares dependendo do tipo de usuário)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id

      // Montar payload da API
      const payload = {
        clienteMasterId: clienteMasterId
      }

      // Adicionar mensagem de texto se houver
      if (messageToSend.trim()) {
        payload.message = messageToSend
      }

      // Adicionar áudio se houver
      if (audioToSend) {
        payload.audio = await blobToBase64(audioToSend)
      }

      // Adicionar imagens se houver
      if (imagesToSend.length > 0) {
        payload.images = imagesToSend.map(img => img.data)
      }

      // Adicionar histórico apenas se houver mensagens anteriores
      if (history.length > 0) {
        payload.history = history
      }

      // Adicionar conversationId ao payload se existir
      if (currentConversationId) {
        payload.conversationId = currentConversationId
      }

      // Obter token de autenticação
      const token = sessionStorage.getItem('token')
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      setIsThinking(true)
      
      // Criar AbortController para permitir cancelar a requisição
      abortControllerRef.current = new AbortController()
      
      // Fazer requisição POST com streaming (única chamada)
      const streamResponse = await fetch(`${baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal
      })

      if (!streamResponse.ok) {
        throw new Error(`HTTP error! status: ${streamResponse.status}`)
      }

      setIsThinking(false)
      setIsStreaming(true)
      
      // Adicionar mensagem vazia inicial
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        isTyping: true
      }])
      // Forçar scroll quando a resposta começar
      setTimeout(() => scrollToBottom(true), 100)

      let chatText = ''
      let tokensUsed = 0
      const reader = streamResponse.body.getReader()
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
            
            // Capturar conversationId se presente
            if (data.conversationId && !currentConversationId) {
              setCurrentConversationId(data.conversationId)
            }
            
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
              
              // Scroll suave a cada atualização (só se o usuário estiver no final)
              scrollToBottom()
            } else if (data.type === 'done') {
              // Resposta completa
              tokensUsed = data.tokensUsed || 0
              
              // Atualizar tokens após a resposta
              if (tokensUsed > 0) {
                await checkTokens()
              }
              
              // Se a resposta veio junto com o done, usar ela
              if (data.response) {
                chatText = data.response
              }
              
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
            } else if (data.response) {
              // Formato alternativo: resposta direta (sem streaming)
              chatText = data.response
              tokensUsed = data.tokensUsed || 0
              
              // Atualizar tokens após a resposta
              if (tokensUsed > 0) {
                checkTokens()
              }
              
              // Atualizar UI com a resposta completa
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
              
              scrollToBottom()
            }
          } catch (parseError) {
            // Ignorar erros de parsing de linhas incompletas
            if (dataLine.trim()) {
              console.warn('Erro ao parsear linha:', dataLine, parseError)
            }
          }
        }
      }
      
      // Processar buffer restante se houver dados
      if (buffer.trim()) {
        try {
          const dataLine = buffer.startsWith('data: ') ? buffer.slice(6) : buffer
          const data = JSON.parse(dataLine)
          
          if (data.conversationId && !currentConversationId) {
            setCurrentConversationId(data.conversationId)
          }
          
          if (data.response) {
            chatText = data.response
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
          }
        } catch (e) {
          console.warn('Erro ao processar buffer final:', e)
        }
      }
      
      // Scroll final (forçar quando a mensagem estiver completa)
      scrollToBottom(true)
      
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
      
      // Recarregar histórico após nova mensagem
      loadConversations()
      
      // Verificar tokens após enviar mensagem
      await checkTokens()
    } catch (error) {
      // Se foi abortado pelo usuário, não mostrar erro
      if (error.name === 'AbortError') {
        return
      }
      
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
      
      // Tentar usar resposta mockada como fallback
      try {
        const aiResponse = generateMockResponse(messageToSend)
        
        // Simular digitação da resposta mockada
        const words = aiResponse.split(' ')
        let currentText = ''
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '',
          isTyping: true
        }])

        for (let i = 0; i < words.length; i++) {
          const word = words[i]
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
          
          if (i % 5 === 0) {
            scrollToBottom()
          }
        }
        
        scrollToBottom(true)
        
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
        
        // Salvar no localStorage como fallback
        const savedHistory = JSON.parse(localStorage.getItem('mockChatHistory') || '[]')
        const newConversation = {
          id: Date.now(),
          mensagem: messageToSend,
          resposta: aiResponse,
          created_at: new Date().toISOString()
        }
        savedHistory.unshift(newConversation)
        localStorage.setItem('mockChatHistory', JSON.stringify(savedHistory))
        
        loadConversations()
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError)
        const errorMessage = {
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          isTyping: false
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Atualizar o contexto com as informações do header do chat sempre que tokensInfo mudar
  useEffect(() => {
    if (!chatHeaderContext?.setChatHeaderContent) return

    chatHeaderContext.setChatHeaderContent({
      tokensInfo: tokensInfo || null,
      getTokensPercentage: () => getTokensPercentage(),
      isNearLimit: () => isNearLimit(),
      isAtLimit: () => isAtLimit(),
      isCriticalLimit: () => isCriticalLimit(),
      handleSolicitarMaisTokens: () => handleSolicitarMaisTokens(),
      setShowHistory: (value) => {
        if (typeof value === 'function') {
          setShowHistory(value)
        } else {
          setShowHistory(value)
        }
      }
    })
    
    return () => {
      if (chatHeaderContext?.setChatHeaderContent) {
        chatHeaderContext.setChatHeaderContent(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensInfo])

  return (
    <div className="chat-modern">
      <div className="chat-header-modern" style={{ display: 'none' }}>
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
          </div>
        </div>
        <div className="chat-header-right">
          {tokensInfo && (
            <div className="tokens-progress-container-header">
              <div className="tokens-progress-simple">
                <div className="tokens-simple-header">
                  <span className="tokens-simple-text">
                    {(tokensInfo.tokensUtilizadosMes !== undefined 
                      ? tokensInfo.tokensUtilizadosMes 
                      : (tokensInfo.tokensUtilizados || 0)).toLocaleString('pt-BR')
                    } / {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 
                      ? tokensInfo.limitePlano.toLocaleString('pt-BR') 
                      : 'Ilimitado'}
                  </span>
                  {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 && (
                    <span className={`tokens-simple-percentage ${isNearLimit() ? 'near-limit' : ''} ${isAtLimit() ? 'at-limit' : ''} ${isCriticalLimit() ? 'critical-pulse' : ''}`}>
                      {getTokensPercentage().toFixed(1)}%
                    </span>
                  )}
                </div>
                {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 && (
                  <div className="tokens-progress-bar-simple">
                    <div 
                      className={`tokens-progress-fill-simple ${isNearLimit() ? 'near-limit' : ''} ${isAtLimit() ? 'at-limit' : ''} ${isCriticalLimit() ? 'critical-pulse' : ''}`}
                      style={{ width: `${getTokensPercentage()}%` }}
                    ></div>
                  </div>
                )}
              </div>
              {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 && getTokensPercentage() >= 80 && (
                <button 
                  className="btn-mais-tokens"
                  onClick={handleSolicitarMaisTokens}
                  title="Solicitar mais tokens"
                >
                  <FontAwesomeIcon icon={faWhatsapp} />
                  <span>Mais Tokens</span>
                </button>
              )}
            </div>
          )}
          <div className="chat-status">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
      
      <div className="chat-container-modern">
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

          <div className="chat-messages-modern" ref={messagesContainerRef}>
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
              <h3>Olá! Sou seu assistente de IA</h3>
              <p>Como posso ajudá-lo hoje com questões odontológicas?</p>
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
                      <>
                        {msg.content}
                        {msg.images && msg.images.length > 0 && (
                          <div className="message-images">
                            {msg.images.map((img, imgIndex) => (
                              <img key={imgIndex} src={img} alt={`Anexo ${imgIndex + 1}`} />
                            ))}
                          </div>
                        )}
                      </>
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
      </div>
      
      {/* Form fixo no final da página */}
      <form onSubmit={handleSend} className="chat-input-modern">
        {/* Preview de imagens anexadas */}
        {attachedImages.length > 0 && (
          <div className="attached-images-preview">
            {attachedImages.map(img => (
              <div key={img.id} className="attached-image-item">
                <img src={img.data} alt={img.name} />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={() => removeImage(img.id)}
                  title="Remover imagem"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview de áudio gravado */}
        {audioBlob && (
          <div className="audio-preview">
            <div className="audio-preview-content">
              <FontAwesomeIcon icon={faMicrophone} className="audio-icon" />
              <span>Áudio gravado</span>
              <audio controls src={URL.createObjectURL(audioBlob)} />
            </div>
            <button 
              type="button" 
              className="remove-audio-btn"
              onClick={cancelRecording}
              title="Remover áudio"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}

        {/* Indicador de gravação */}
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-pulse"></div>
            <span>Gravando...</span>
            <button 
              type="button" 
              className="stop-recording-btn"
              onClick={stopRecording}
            >
              Parar
            </button>
          </div>
        )}

        {isTyping && !isRecording && (
          <div className="user-typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div className="input-wrapper">
          {/* Input de arquivo oculto */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />

          {/* Botão anexar imagem */}
          <button
            type="button"
            className="chat-action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || tokensBlocked}
            title="Anexar imagem"
          >
            <FontAwesomeIcon icon={faImage} />
          </button>

          {/* Botão gravar áudio */}
          <button
            type="button"
            className={`chat-action-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading || tokensBlocked || audioBlob}
            title={isRecording ? "Parar gravação" : "Gravar áudio"}
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>

          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onPaste={handlePaste}
            placeholder={tokensBlocked ? "Limite de tokens atingido" : (loading ? "Aguarde a resposta..." : "Digite sua mensagem ou cole uma imagem...")}
            className="chat-input-field"
            disabled={loading || tokensBlocked || isRecording}
          />
          {isStreaming ? (
            <button 
              type="button" 
              className="chat-stop-btn" 
              onClick={handleStopResponse}
              title="Parar resposta"
            >
              <FontAwesomeIcon icon={faStop} />
            </button>
          ) : (
            <button 
              type="submit" 
              className="chat-send-btn-modern" 
              disabled={loading || tokensBlocked || isRecording || (!input.trim() && !audioBlob && attachedImages.length === 0)}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default Chat
