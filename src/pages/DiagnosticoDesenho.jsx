/**
 * Página de Desenho/Edição de Radiografia
 * Lousa interativa com drag and drop nativo
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, faPalette, faUndo, faRedo,
  faSave, faFilter, faPencil, faSearchPlus,
  faSearchMinus, faExpand, faFont, faTimes,
  faFileAlt, faCheck, faCircle, faSquare, faMinus,
  faArrowRight, faCrosshairs, faChevronLeft, faChevronRight,
  faDownload
} from '@fortawesome/free-solid-svg-icons'
import exameImage from '../img/exame.jpg'
import denteparafusoImage from '../img/denteparafuso.png'
import limaImage from '../img/lima.png'
import pinoImage from '../img/pino.png'
import xImage from '../img/x.png'
import dentesOKImage from '../img/dentesOK.PNG'
import './DiagnosticoDesenho.css'

// Importar todos os SVGs dos dentes
import dente11 from '../img/dentes/11.svg'
import dente12 from '../img/dentes/12.svg'
import dente13 from '../img/dentes/13.svg'
import dente14 from '../img/dentes/14.svg'
import dente15 from '../img/dentes/15.svg'
import dente16 from '../img/dentes/16.svg'
import dente17 from '../img/dentes/17.svg'
import dente18 from '../img/dentes/18.svg'
import dente21 from '../img/dentes/21.svg'
import dente22 from '../img/dentes/22.svg'
import dente23 from '../img/dentes/23.svg'
import dente24 from '../img/dentes/24.svg'
import dente25 from '../img/dentes/25.svg'
import dente26 from '../img/dentes/26.svg'
import dente27 from '../img/dentes/27.svg'
import dente28 from '../img/dentes/28.svg'
import dente31 from '../img/dentes/31.svg'
import dente32 from '../img/dentes/32.svg'
import dente33 from '../img/dentes/33.svg'
import dente34 from '../img/dentes/34.svg'
import dente35 from '../img/dentes/35.svg'
import dente36 from '../img/dentes/36.svg'
import dente37 from '../img/dentes/37.svg'
import dente38 from '../img/dentes/38.svg'
import dente41 from '../img/dentes/41.svg'
import dente42 from '../img/dentes/42.svg'
import dente43 from '../img/dentes/43.svg'
import dente44 from '../img/dentes/44.svg'
import dente45 from '../img/dentes/45.svg'
import dente46 from '../img/dentes/46.svg'
import dente47 from '../img/dentes/47.svg'
import dente48 from '../img/dentes/48.svg'

// Lista de todos os números de dentes (FDI notation)
const dentesNumeros = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48]

// Criar objeto com todos os SVGs dos dentes
const dentesSVGs = {
  11: dente11, 12: dente12, 13: dente13, 14: dente14,
  15: dente15, 16: dente16, 17: dente17, 18: dente18,
  21: dente21, 22: dente22, 23: dente23, 24: dente24,
  25: dente25, 26: dente26, 27: dente27, 28: dente28,
  31: dente31, 32: dente32, 33: dente33, 34: dente34,
  35: dente35, 36: dente36, 37: dente37, 38: dente38,
  41: dente41, 42: dente42, 43: dente43, 44: dente44,
  45: dente45, 46: dente46, 47: dente47, 48: dente48
}

// Dados mockados para a radiografia
const getMockRadiografia = (id) => {
  return {
    id: id || 1,
    paciente: 'Radiografia Panorâmica - Exemplo',
    cliente_nome: 'Ana Carolina Vaz',
    imagem: exameImage
  }
}

const DiagnosticoDesenho = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const boardRef = useRef(null)
  const canvasRef = useRef(null)
  const [radiografia, setRadiografia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [observacoes, setObservacoes] = useState('')
  
  // Estado dos elementos arrastáveis
  const [elements, setElements] = useState([])
  const [nextId, setNextId] = useState(1)
  const [draggingElement, setDraggingElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [maxZIndex, setMaxZIndex] = useState(1)
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, startX: 0, startY: 0, startWidth: 0, startHeight: 0, handleType: null })
  const [rotateStart, setRotateStart] = useState({ x: 0, y: 0, angle: 0 })

  // Estado para desenho no canvas
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState(null) // null, pencil, circle, rectangle, line, arrow, cross
  const currentToolRef = useRef(currentTool)
  const isDrawingRef = useRef(isDrawing)
  const [currentColor, setCurrentColor] = useState('#FF6B9D')
  const [lineWidth, setLineWidth] = useState(5)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#FF6B9D')
  const [shapeStart, setShapeStart] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoomMode, setZoomMode] = useState(null) // 'in' ou 'out' quando em modo zoom
  const [drawingHistory, setDrawingHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Cores disponíveis
  const colors = [
    { name: 'Rosa', value: '#FF6B9D' },
    { name: 'Verde', value: '#4ECDC4' },
    { name: 'Amarelo', value: '#FFE66D' },
    { name: 'Vermelho', value: '#FF6B6B' },
    { name: 'Azul', value: '#4A90E2' },
    { name: 'Branco', value: '#FFFFFF' },
    { name: 'Preto', value: '#000000' },
    { name: 'Laranja', value: '#FF8C42' },
    { name: 'Roxo', value: '#9B59B6' },
    { name: 'Ciano', value: '#00CED1' }
  ]

  // Elementos disponíveis para adicionar
  const availableElements = [
    { type: 'denteparafuso', name: 'Dente Parafuso', image: denteparafusoImage },
    { type: 'lima', name: 'Lima', image: limaImage },
    { type: 'pino', name: 'Pino', image: pinoImage },
    { type: 'x', name: 'X', image: xImage }
  ]

  const [selectedTool, setSelectedTool] = useState(null)
  const [toolsPanelVisible, setToolsPanelVisible] = useState(true)

  // Estado para dentes selecionados
  const [selectedDentes, setSelectedDentes] = useState([]) // Array de { numero: number, descricao: string }
  
  // Os SVGs já estão importados como conteúdo, então podemos usar diretamente
  // Não precisamos mais do estado dentesSVGContent, vamos usar dentesSVGs diretamente

  useEffect(() => {
    loadRadiografia()
  }, [id])

  const loadRadiografia = async () => {
    setLoading(true)
    // Simular carregamento
    setTimeout(() => {
      const mockData = getMockRadiografia(id)
        setRadiografia(mockData)
      setLoading(false)
      // A imagem será carregada pelo useEffect quando radiografia mudar
    }, 500)
  }

  /**
   * Carrega imagem de fundo no canvas
   */
  const drawImageOnCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !radiografia) return

    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      if (!boardRef.current) {
        console.log('Board ref não disponível')
        return
      }
      
      const boardWidth = boardRef.current.offsetWidth || 1200
      const boardHeight = boardRef.current.offsetHeight || 900
      
      // Calcular escala mantendo proporção (contain - não distorcer)
      // Aumentar escala em 1.5x para imagem maior
      const scaleX = (boardWidth / img.width) * 1.5
      const scaleY = (boardHeight / img.height) * 1.5
      const scale = Math.min(scaleX, scaleY) // Usar Math.min para contain (não cortar)
      
      const displayWidth = img.width * scale
      const displayHeight = img.height * scale
      
      // Definir tamanho interno do canvas (resolução) - usar tamanho original da imagem
      canvas.width = img.width
      canvas.height = img.height
      
      // Definir tamanho de exibição mantendo proporção
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
      
      // Desenhar imagem no tamanho original (sem distorção)
      ctx.drawImage(img, 0, 0, img.width, img.height)
      setImageLoaded(true)
      saveState()
      console.log('Imagem carregada no canvas:', displayWidth, displayHeight, 'Board:', boardWidth, boardHeight)
    }
    
    img.onerror = (error) => {
      console.error('Erro ao carregar imagem:', error)
      // Tentar usar imagem padrão
      img.src = exameImage
    }
    
    img.src = radiografia?.imagem || exameImage
  }, [radiografia])

  // Carregar imagem quando radiografia mudar
  useEffect(() => {
    if (radiografia && canvasRef.current && boardRef.current) {
      const timer = setTimeout(() => {
        drawImageOnCanvas()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [radiografia, drawImageOnCanvas])

  // Redesenhar quando board mudar de tamanho
  useEffect(() => {
    if (imageLoaded && boardRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        drawImageOnCanvas()
      })
      resizeObserver.observe(boardRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [imageLoaded, drawImageOnCanvas])

  // Atualizar refs quando estado mudar
  useEffect(() => {
    currentToolRef.current = currentTool
    isDrawingRef.current = isDrawing
  }, [currentTool, isDrawing])

  /**
   * Obtém coordenadas do canvas
   */
  const getCanvasCoordinates = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
  }

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: ((clientX - rect.left) / zoom) * scaleX,
      y: ((clientY - rect.top) / zoom) * scaleY
    }
  }, [zoom])

  /**
   * Inicia desenho no canvas
   */
  const startDrawing = useCallback((e) => {
    if (!imageLoaded) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const { x, y } = getCanvasCoordinates(e)
    
    if (['circle', 'rectangle', 'line', 'arrow', 'cross'].includes(currentTool)) {
      setShapeStart({ x, y })
    }
    
    setIsDrawing(true)
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = currentColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [imageLoaded, currentTool, currentColor, lineWidth, getCanvasCoordinates])

  /**
   * Desenha no canvas
   */
  const draw = useCallback((e) => {
    if (!isDrawing || !imageLoaded) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const { x, y } = getCanvasCoordinates(e)
    
    if (['circle', 'rectangle', 'line', 'arrow', 'cross'].includes(currentTool) && shapeStart) {
      // Redesenhar tudo e adicionar forma
      const imageData = drawingHistory[historyIndex] || null
      if (imageData) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          drawShape(ctx, shapeStart, { x, y }, currentTool)
        }
        img.src = imageData
      }
    } else {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }, [isDrawing, imageLoaded, currentTool, shapeStart, getCanvasCoordinates, drawingHistory, historyIndex])

  /**
   * Desenha formas geométricas
   */
  const drawShape = (ctx, start, end, tool) => {
    ctx.strokeStyle = currentColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    const width = end.x - start.x
    const height = end.y - start.y
    
    switch (tool) {
      case 'circle':
        const radius = Math.sqrt(width * width + height * height)
    ctx.beginPath()
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        break
      case 'rectangle':
        ctx.strokeRect(start.x, start.y, width, height)
        break
      case 'line':
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        break
      case 'arrow':
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        // Cabeça da seta
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        const arrowLength = 20
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(
          end.x - arrowLength * Math.cos(angle - Math.PI / 6),
          end.y - arrowLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(
          end.x - arrowLength * Math.cos(angle + Math.PI / 6),
          end.y - arrowLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
        break
      case 'cross':
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.moveTo(start.x, end.y)
        ctx.lineTo(end.x, start.y)
        ctx.stroke()
        break
    }
  }

  /**
   * Para de desenhar
   */
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    setShapeStart(null)
    saveState()
  }, [isDrawing])

  // Listeners globais para continuar desenhando mesmo quando o mouse sai do canvas
  useEffect(() => {
    if (!isDrawing || !currentTool) return

    const handleGlobalMouseMove = (e) => {
      // Usar refs para acessar valores atuais
      const board = boardRef.current
      const canvas = canvasRef.current
      if (!board || !canvas) return
      
      const boardRect = board.getBoundingClientRect()
      
      // Se o mouse estiver dentro do board, continuar desenhando
      if (e.clientX >= boardRect.left && e.clientX <= boardRect.right &&
          e.clientY >= boardRect.top && e.clientY <= boardRect.bottom) {
        e.preventDefault()
        e.stopPropagation()
        
        // Calcular coordenadas do canvas
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        
        const x = ((e.clientX - rect.left) / zoom) * scaleX
        const y = ((e.clientY - rect.top) / zoom) * scaleY
        
        const ctx = canvas.getContext('2d')
        
        // Usar ref para obter o tool atual
        const tool = currentToolRef.current
        
        // Verificar se é forma ou desenho livre
        if (!['circle', 'rectangle', 'line', 'arrow', 'cross'].includes(tool)) {
          // Desenho livre - continuar a linha
          ctx.lineTo(x, y)
          ctx.stroke()
        }
        // Para formas, o draw normal do canvas já trata
      }
    }

    const handleGlobalMouseUp = () => {
      // Parar o desenho quando soltar o botão do mouse
      stopDrawing()
    }

    const handleGlobalTouchMove = (e) => {
      const board = boardRef.current
      const canvas = canvasRef.current
      if (!board || !canvas) return
      
      const boardRect = board.getBoundingClientRect()
      const touch = e.touches?.[0]
      
      if (touch && touch.clientX >= boardRect.left && touch.clientX <= boardRect.right &&
          touch.clientY >= boardRect.top && touch.clientY <= boardRect.bottom) {
        e.preventDefault()
        e.stopPropagation()
        
        // Calcular coordenadas do canvas
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        
        const x = ((touch.clientX - rect.left) / zoom) * scaleX
        const y = ((touch.clientY - rect.top) / zoom) * scaleY
        
        const ctx = canvas.getContext('2d')
        const tool = currentToolRef.current
        
        if (!['circle', 'rectangle', 'line', 'arrow', 'cross'].includes(tool)) {
          ctx.lineTo(x, y)
          ctx.stroke()
        }
      }
    }

    const handleGlobalTouchEnd = () => {
      stopDrawing()
    }

    // Adicionar listeners globais
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd)

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDrawing, currentTool, stopDrawing, zoom])

  /**
   * Salva estado do canvas
   */
  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const imageData = canvas.toDataURL()
    const newHistory = drawingHistory.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setDrawingHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  /**
   * Undo
   */
  const undo = () => {
    if (historyIndex <= 0) return
    
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const imageData = drawingHistory[newIndex]
    
    if (imageData) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = imageData
    } else {
      // Voltar para imagem original
      drawImageOnCanvas()
    }
  }

  /**
   * Redo
   */
  const redo = () => {
    if (historyIndex >= drawingHistory.length - 1) return
    
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const imageData = drawingHistory[newIndex]
    
    if (imageData) {
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
    }
      img.src = imageData
    }
  }

  /**
   * Obtém coordenadas relativas ao canvas wrapper
   */
  const getWrapperCoordinates = useCallback((e) => {
    const wrapper = document.querySelector('.canvas-wrapper')
    if (!wrapper) return { x: 0, y: 0 }
    
    const rect = wrapper.getBoundingClientRect()
    let clientX, clientY
    
    if (e?.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e?.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else if (e) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      // Se não houver evento, usar centro
      return { x: rect.width / 2, y: rect.height / 2 }
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [])

  /**
   * Zoom no ponto clicado
   */
  const handleZoom = useCallback((delta, e) => {
    const wrapper = document.querySelector('.canvas-wrapper')
    if (!wrapper) return
    
    const wrapperRect = wrapper.getBoundingClientRect()
    const wrapperCenterX = wrapperRect.width / 2
    const wrapperCenterY = wrapperRect.height / 2
    
    // Ponto de zoom (onde o usuário clicou ou centro se não houver evento)
    const coords = getWrapperCoordinates(e)
    const zoomPointX = coords.x
    const zoomPointY = coords.y
    
    // Calcular novo zoom
    const newZoom = Math.max(0.5, Math.min(5, zoom + delta))
    const zoomFactor = newZoom / zoom
    
    // Se o zoom está voltando para 1 ou menor, resetar o pan para centralizar
    if (newZoom <= 1) {
      setPan({ x: 0, y: 0 })
      setZoom(newZoom)
      return
    }
    
    // Calcular offset para manter o ponto fixo
    // Quando fazemos zoom, precisamos ajustar o pan para que o ponto clicado permaneça fixo
    const offsetX = (zoomPointX - wrapperCenterX) * (1 - zoomFactor)
    const offsetY = (zoomPointY - wrapperCenterY) * (1 - zoomFactor)
    
    // Atualizar pan e zoom
    setPan(prev => ({
      x: prev.x + offsetX,
      y: prev.y + offsetY
    }))
    setZoom(newZoom)
  }, [zoom, getWrapperCoordinates])

  /**
   * Ativa modo zoom (aguarda clique na lousa)
   */
  const handleZoomIn = () => {
    if (zoomMode === 'in') {
      // Se já estiver selecionado, deselecionar
      setZoomMode(null)
    } else {
      setZoomMode('in')
      setCurrentTool(null) // Desmarcar ferramentas
      setSelectedTool(null) // Desmarcar elementos
    }
  }

  /**
   * Ativa modo zoom out (aguarda clique na lousa)
   */
  const handleZoomOut = () => {
    if (zoomMode === 'out') {
      // Se já estiver selecionado, deselecionar
      setZoomMode(null)
    } else {
      setZoomMode('out')
      setCurrentTool(null) // Desmarcar ferramentas
      setSelectedTool(null) // Desmarcar elementos
    }
  }

  /**
   * Aplica zoom no ponto clicado
   */
  const applyZoomAtPoint = useCallback((e, zoomType) => {
    const delta = zoomType === 'in' ? 0.25 : -0.25
    handleZoom(delta, e)
    // Não desativar o modo zoom - ele permanece ativo até escolher outra ferramenta
  }, [handleZoom])

  /**
   * Reset Zoom
   */
  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setZoomMode(null)
    }

  /**
   * Download
   */
  const downloadDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Criar um canvas temporário para combinar canvas + elementos
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    
    // Desenhar o canvas original primeiro
    tempCtx.drawImage(canvas, 0, 0)
    
    // Se não houver elementos, fazer download direto
    if (elements.length === 0) {
    const link = document.createElement('a')
      link.download = `radiografia_${id}_${Date.now()}.png`
      link.href = tempCanvas.toDataURL('image/png')
    link.click()
      return
    }
    
    // Calcular escala do canvas em relação ao board
    const boardWidth = boardRef.current?.offsetWidth || canvas.width
    const boardHeight = boardRef.current?.offsetHeight || canvas.height
    const scaleX = canvas.width / boardWidth
    const scaleY = canvas.height / boardHeight
    
    // Carregar todas as imagens dos elementos
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }
    
    try {
      // Carregar todas as imagens em paralelo
      const images = await Promise.all(
        elements.map(element => loadImage(element.imageSrc))
      )
      
      // Desenhar cada elemento no canvas temporário
      elements.forEach((element, index) => {
        const img = images[index]
        if (!img) return
        
        // Salvar o estado do contexto
        tempCtx.save()
        
        // Calcular posição e escala no canvas
        const x = element.x * scaleX
        const y = element.y * scaleY
        const width = element.width * scaleX
        const height = element.height * scaleY
        
        // Aplicar rotação se houver
        if (element.rotation) {
          const centerX = x + width / 2
          const centerY = y + height / 2
          tempCtx.translate(centerX, centerY)
          tempCtx.rotate(element.rotation)
          tempCtx.translate(-centerX, -centerY)
        }
        
        // Desenhar a imagem do elemento
        tempCtx.drawImage(img, x, y, width, height)
        
        // Restaurar o estado do contexto
        tempCtx.restore()
      })
      
      // Fazer o download da imagem completa
    const link = document.createElement('a')
      link.download = `radiografia_${id}_${Date.now()}.png`
      link.href = tempCanvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Erro ao carregar imagens dos elementos:', error)
      // Fazer download mesmo assim (sem os elementos)
      const link = document.createElement('a')
      link.download = `radiografia_${id}_${Date.now()}.png`
      link.href = tempCanvas.toDataURL('image/png')
    link.click()
    }
  }

  /**
   * Obtém coordenadas relativas ao container da lousa, considerando zoom e pan
   */
  const getRelativeCoordinates = useCallback((e) => {
    if (!boardRef.current) return { x: 0, y: 0 }
    
    let clientX, clientY
    
    // Suporte para touch e mouse
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    // Obter o wrapper e o container
    const wrapper = document.querySelector('.canvas-wrapper')
    const container = document.querySelector('.canvas-content-wrapper')
    
    if (!wrapper || !container || zoom === 1 && pan.x === 0 && pan.y === 0) {
      // Fallback: coordenadas relativas ao board sem transformação
      const rect = boardRef.current.getBoundingClientRect()
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    }
    
    // O board está dentro do wrapper que tem transform: translate(pan) scale(zoom)
    // com transformOrigin: center center
    // getBoundingClientRect() do board já considera o transform aplicado
    const boardRect = boardRef.current.getBoundingClientRect()
    
    // Coordenadas do mouse relativas ao board (já transformado visualmente)
    const boardX = clientX - boardRect.left
    const boardY = clientY - boardRect.top
    
    // Tamanho original do board (sem transform)
    const originalBoardWidth = boardRef.current.offsetWidth
    const originalBoardHeight = boardRef.current.offsetHeight
    
    // Tamanho visual do board (com zoom aplicado)
    const visualBoardWidth = boardRect.width
    const visualBoardHeight = boardRect.height
    
    // Centro visual do board
    const visualBoardCenterX = visualBoardWidth / 2
    const visualBoardCenterY = visualBoardHeight / 2
    
    // Distância do mouse ao centro visual
    const offsetFromVisualCenterX = boardX - visualBoardCenterX
    const offsetFromVisualCenterY = boardY - visualBoardCenterY
    
    // Inverter o zoom para obter offset no espaço original
    const originalOffsetX = offsetFromVisualCenterX / zoom
    const originalOffsetY = offsetFromVisualCenterY / zoom
    
    // Centro original do board
    const originalBoardCenterX = originalBoardWidth / 2
    const originalBoardCenterY = originalBoardHeight / 2
    
    // Coordenadas finais no espaço original do board
    const finalX = originalBoardCenterX + originalOffsetX
    const finalY = originalBoardCenterY + originalOffsetY
    
    return {
      x: finalX,
      y: finalY
    }
  }, [zoom, pan])

  /**
   * Constrange posição dentro dos limites do container
   */
  const constrainPosition = useCallback((x, y, elementWidth, elementHeight) => {
    if (!boardRef.current) return { x, y }
    
    const containerWidth = boardRef.current.offsetWidth
    const containerHeight = boardRef.current.offsetHeight
    
    return {
      x: Math.max(0, Math.min(containerWidth - elementWidth, x)),
      y: Math.max(0, Math.min(containerHeight - elementHeight, y))
    }
  }, [])

  /**
   * Inicia o drag de um elemento
   */
  const handleDragStart = useCallback((e, elementId) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element) return
    
    const coords = getRelativeCoordinates(e)
    
    // Calcular offset do mouse em relação ao elemento
    const offsetX = coords.x - element.x
    const offsetY = coords.y - element.y
    
    setDraggingElement(elementId)
    setDragOffset({ x: offsetX, y: offsetY })
    
    // Trazer elemento para frente
    const newZIndex = maxZIndex + 1
    setMaxZIndex(newZIndex)
    setElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, zIndex: newZIndex } : el
      )
    )
  }, [elements, getRelativeCoordinates, maxZIndex])

  /**
   * Atualiza posição durante o drag
   */
  const handleDragMove = useCallback((e) => {
    if (!draggingElement) return
    
    e.preventDefault()
    
    const coords = getRelativeCoordinates(e)
    const element = elements.find(el => el.id === draggingElement)
    if (!element) return
    
    // Calcular nova posição considerando o offset
    let newX = coords.x - dragOffset.x
    let newY = coords.y - dragOffset.y
    
    // Aplicar limites do container
    const constrained = constrainPosition(newX, newY, element.width, element.height)
    
    // Atualizar posição do elemento
    setElements(prev =>
      prev.map(el =>
        el.id === draggingElement
          ? { ...el, x: constrained.x, y: constrained.y }
          : el
      )
    )
  }, [draggingElement, dragOffset, elements, getRelativeCoordinates, constrainPosition])

  /**
   * Finaliza o drag
   */
  const handleDragEnd = useCallback((e) => {
    if (!draggingElement) return
    
    e.preventDefault()
    setDraggingElement(null)
    setDragOffset({ x: 0, y: 0 })
  }, [draggingElement])

  /**
   * Event listeners globais para drag
   */
  useEffect(() => {
    if (!draggingElement) return

    const handleMove = (e) => handleDragMove(e)
    const handleEnd = (e) => handleDragEnd(e)

    // Adicionar listeners
    document.addEventListener('mousemove', handleMove, { passive: false })
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [draggingElement, handleDragMove, handleDragEnd])

  /**
   * Adiciona novo elemento na posição clicada
   */
  const handleBoardClick = useCallback((e) => {
    // Se estiver arrastando, resize ou rotacionando, não fazer nada
    if (draggingElement || isResizing || isRotating) return
    
    // Se clicou em um elemento ou seus controles, não fazer nada
    if (e.target.closest('.draggable-element') || 
        e.target.closest('.resize-handle') || 
        e.target.closest('.rotate-handle')) {
      return
    }
    
    // Se estiver em modo zoom, aplicar zoom no ponto clicado
    if (zoomMode) {
      applyZoomAtPoint(e, zoomMode)
      return
    }
    
    // Desselecionar elemento se clicou fora
    if (selectedElementId) {
      setSelectedElementId(null)
    }
    
    // Se não tiver ferramenta selecionada, não fazer nada
    if (!selectedTool) return
    
    const coords = getRelativeCoordinates(e)
    const tool = availableElements.find(t => t.type === selectedTool)
    if (!tool) return
    
    // Tamanho padrão do elemento
    const defaultSize = { width: 100, height: 100 }
    
    // Calcular posição inicial (centralizada no clique)
    let initialX = coords.x - defaultSize.width / 2
    let initialY = coords.y - defaultSize.height / 2
    
    // Aplicar limites
    const constrained = constrainPosition(initialX, initialY, defaultSize.width, defaultSize.height)
    
    // Adicionar elemento
    const newElement = {
      id: nextId,
      type: selectedTool,
      imageSrc: tool.image,
      x: constrained.x,
      y: constrained.y,
      width: defaultSize.width,
      height: defaultSize.height,
      zIndex: maxZIndex + 1
    }
    
    setElements(prev => [...prev, newElement])
    setNextId(prev => prev + 1)
    setMaxZIndex(prev => prev + 1)
    
    // Desmarcar ferramenta após adicionar e selecionar o novo elemento
    setSelectedTool(null)
    setSelectedElementId(nextId)
  }, [selectedTool, availableElements, getRelativeCoordinates, constrainPosition, nextId, maxZIndex, draggingElement, isResizing, isRotating, selectedElementId, zoomMode, applyZoomAtPoint])

  /**
   * Remove elemento
   */
  const handleDeleteElement = useCallback((e, elementId) => {
    e.stopPropagation()
    setElements(prev => prev.filter(el => el.id !== elementId))
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }, [selectedElementId])

  /**
   * Inicia resize do elemento
   */
  const handleResizeStart = useCallback((e, elementId, handleType) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element) return
    
    const coords = getRelativeCoordinates(e)
    
    setIsResizing(true)
    setSelectedElementId(elementId)
    setResizeStart({
      x: coords.x,
      y: coords.y,
      startX: element.x,
      startY: element.y,
      startWidth: element.width,
      startHeight: element.height,
      handleType: handleType // 'nw', 'ne', 'sw', 'se'
    })
  }, [elements, getRelativeCoordinates])

  /**
   * Atualiza resize durante o movimento
   */
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !selectedElementId) return
    
    e.preventDefault()
    
    const coords = getRelativeCoordinates(e)
    const deltaX = coords.x - resizeStart.x
    const deltaY = coords.y - resizeStart.y
    
    let newX = resizeStart.startX
    let newY = resizeStart.startY
    let newWidth = resizeStart.startWidth
    let newHeight = resizeStart.startHeight
    
    // Calcular novo tamanho e posição baseado no handle
    switch (resizeStart.handleType) {
      case 'nw': // Canto superior esquerdo
        newX = resizeStart.startX + deltaX
        newY = resizeStart.startY + deltaY
        newWidth = resizeStart.startWidth - deltaX
        newHeight = resizeStart.startHeight - deltaY
        break
      case 'ne': // Canto superior direito
        newY = resizeStart.startY + deltaY
        newWidth = resizeStart.startWidth + deltaX
        newHeight = resizeStart.startHeight - deltaY
        break
      case 'sw': // Canto inferior esquerdo
        newX = resizeStart.startX + deltaX
        newWidth = resizeStart.startWidth - deltaX
        newHeight = resizeStart.startHeight + deltaY
        break
      case 'se': // Canto inferior direito
        newWidth = resizeStart.startWidth + deltaX
        newHeight = resizeStart.startHeight + deltaY
        break
    }
    
    // Limitar tamanho mínimo e máximo
    const minSize = 20
    const maxSize = 500
    
    // Ajustar posição se o tamanho mínimo foi atingido
    if (newWidth < minSize) {
      if (resizeStart.handleType === 'nw' || resizeStart.handleType === 'sw') {
        newX = resizeStart.startX + resizeStart.startWidth - minSize
      }
      newWidth = minSize
    } else if (newWidth > maxSize) {
      newWidth = maxSize
    }
    
    if (newHeight < minSize) {
      if (resizeStart.handleType === 'nw' || resizeStart.handleType === 'ne') {
        newY = resizeStart.startY + resizeStart.startHeight - minSize
      }
      newHeight = minSize
    } else if (newHeight > maxSize) {
      newHeight = maxSize
    }
    
    // Aplicar limites do container
    if (boardRef.current) {
      const maxX = boardRef.current.offsetWidth
      const maxY = boardRef.current.offsetHeight
      
      // Garantir que não ultrapasse os limites
      if (newX < 0) {
        newWidth += newX
        newX = 0
      }
      if (newY < 0) {
        newHeight += newY
        newY = 0
      }
      if (newX + newWidth > maxX) {
        newWidth = maxX - newX
      }
      if (newY + newHeight > maxY) {
        newHeight = maxY - newY
      }
    }
    
    setElements(prev =>
      prev.map(el =>
        el.id === selectedElementId
          ? { 
              ...el, 
              x: newX, 
              y: newY,
              width: newWidth,
              height: newHeight
            }
          : el
      )
    )
  }, [isResizing, selectedElementId, resizeStart, getRelativeCoordinates, constrainPosition])

  /**
   * Finaliza resize
   */
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeStart({ x: 0, y: 0, startX: 0, startY: 0, startWidth: 0, startHeight: 0, handleType: null })
  }, [])

  /**
   * Inicia rotação do elemento
   */
  const handleRotateStart = useCallback((e, elementId) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element) return
    
    const coords = getRelativeCoordinates(e)
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    
    const angle = Math.atan2(coords.y - centerY, coords.x - centerX)
    
    setIsRotating(true)
    setSelectedElementId(elementId)
    setRotateStart({
      x: coords.x,
      y: coords.y,
      angle: element.rotation || 0,
      startAngle: angle
    })
  }, [elements, getRelativeCoordinates])

  /**
   * Atualiza rotação durante o movimento
   */
  const handleRotateMove = useCallback((e) => {
    if (!isRotating || !selectedElementId) return
    
    e.preventDefault()
    
    const coords = getRelativeCoordinates(e)
    const element = elements.find(el => el.id === selectedElementId)
    if (!element) return
    
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    const currentAngle = Math.atan2(coords.y - centerY, coords.x - centerX)
    
    const deltaAngle = currentAngle - rotateStart.startAngle
    const newRotation = rotateStart.angle + deltaAngle
    
    setElements(prev =>
      prev.map(el =>
        el.id === selectedElementId
          ? { ...el, rotation: newRotation }
          : el
      )
    )
  }, [isRotating, selectedElementId, elements, rotateStart, getRelativeCoordinates])

  /**
   * Finaliza rotação
   */
  const handleRotateEnd = useCallback(() => {
    setIsRotating(false)
    setRotateStart({ x: 0, y: 0, angle: 0, startAngle: 0 })
  }, [])

  /**
   * Event listeners globais para resize
   */
  useEffect(() => {
    if (!isResizing) return

    const handleMove = (e) => handleResizeMove(e)
    const handleEnd = () => handleResizeEnd()

    document.addEventListener('mousemove', handleMove, { passive: false })
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  /**
   * Event listeners globais para rotação
   */
  useEffect(() => {
    if (!isRotating) return
      
    const handleMove = (e) => handleRotateMove(e)
    const handleEnd = () => handleRotateEnd()

    document.addEventListener('mousemove', handleMove, { passive: false })
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isRotating, handleRotateMove, handleRotateEnd])

  /**
   * Adiciona ou remove dente da lista de selecionados
   */
  const toggleDente = (numero) => {
    setSelectedDentes(prev => {
      const exists = prev.find(d => d.numero === numero)
      if (exists) {
        // Remove se já existe
        return prev.filter(d => d.numero !== numero)
      } else {
        // Adiciona se não existe
        return [...prev, { numero, descricao: '' }]
      }
    })
  }

  /**
   * Atualiza descrição de um dente
   */
  const updateDenteDescricao = (numero, descricao) => {
    setSelectedDentes(prev =>
      prev.map(d => d.numero === numero ? { ...d, descricao } : d)
    )
  }

  /**
   * Remove dente da lista
   */
  const removeDente = (numero) => {
    setSelectedDentes(prev => prev.filter(d => d.numero !== numero))
  }

  /**
   * Verifica se um dente está selecionado
   */
  const isDenteSelected = (numero) => {
    return selectedDentes.some(d => d.numero === numero)
  }

  /**
   * Salva o desenho
   */
  const saveDrawing = () => {
    const drawingData = {
      elements,
      observacoes,
      selectedDentes,
      radiografiaId: id
    }
    
    // Salvar no localStorage (futuramente via API)
    localStorage.setItem(`drawing_${id}`, JSON.stringify(drawingData))
    
    alert('Desenho salvo com sucesso!')
  }

  if (loading) {
    return (
      <div>
      <div className="desenho-loading">
        <p>Carregando radiografia...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="desenho-header">
        <div className="header-left">
          <button className="btn-back-desenho" onClick={() => navigate(`/app/diagnosticos/${id}`)}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar
          </button>
          <div className="paciente-name">
            {radiografia?.cliente_nome || 'Paciente'}
          </div>
        </div>
        <div className="header-right">
          <button className="btn-download-header" onClick={downloadDrawing} title="Download">
            <FontAwesomeIcon icon={faDownload} /> Download
          </button>
          <button className="btn-salvar-header" onClick={saveDrawing} title="Salvar">
            <FontAwesomeIcon icon={faSave} /> Salvar
          </button>
        </div>
      </div>

      {/* Container Principal - Ferramentas e Canvas lado a lado */}
      <div className="desenho-main-container">
        {/* Botão para toggle do painel de ferramentas */}
        <button 
          className="tools-panel-toggle"
          onClick={() => setToolsPanelVisible(!toolsPanelVisible)}
          title={toolsPanelVisible ? "Ocultar ferramentas" : "Mostrar ferramentas"}
        >
          <FontAwesomeIcon icon={toolsPanelVisible ? faChevronLeft : faChevronRight} />
        </button>
        
        {/* Div das Ferramentas - Esquerda */}
        <div className={`desenho-tools-panel ${toolsPanelVisible ? 'visible' : 'hidden'}`}>
          {/* Botão de minimizar dentro do painel */}
          {toolsPanelVisible && (
            <button 
              className="tools-panel-minimize-internal"
              onClick={() => setToolsPanelVisible(false)}
              title="Minimizar ferramentas"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          )}
      <div className="desenho-toolbar">
        {/* Ferramentas de Desenho */}
        <div className="toolbar-section">
          <button 
            className={`tool-btn ${currentTool === 'pencil' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTool(currentTool === 'pencil' ? null : 'pencil')
              setSelectedTool(null) // Desmarcar elemento
              setZoomMode(null) // Desmarcar zoom
            }}
            title="Lápis"
          >
            <FontAwesomeIcon icon={faPencil} />
          </button>
          <button 
            className={`tool-btn ${currentTool === 'circle' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTool(currentTool === 'circle' ? null : 'circle')
              setSelectedTool(null) // Desmarcar elemento
              setZoomMode(null) // Desmarcar zoom
            }}
            title="Círculo"
          >
            <FontAwesomeIcon icon={faCircle} />
          </button>
          <button 
            className={`tool-btn ${currentTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTool(currentTool === 'rectangle' ? null : 'rectangle')
              setSelectedTool(null) // Desmarcar elemento
              setZoomMode(null) // Desmarcar zoom
            }}
            title="Retângulo"
          >
            <FontAwesomeIcon icon={faSquare} />
          </button>
          <button
            className={`tool-btn ${currentTool === 'line' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTool(currentTool === 'line' ? null : 'line')
              setSelectedTool(null) // Desmarcar elemento
              setZoomMode(null) // Desmarcar zoom
            }}
            title="Linha"
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <button
            className={`tool-btn ${currentTool === 'arrow' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTool(currentTool === 'arrow' ? null : 'arrow')
              setSelectedTool(null) // Desmarcar elemento
              setZoomMode(null) // Desmarcar zoom
            }}
            title="Seta"
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
          <button
            className={`tool-btn ${currentTool === 'cross' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTool(currentTool === 'cross' ? null : 'cross')
              setSelectedTool(null) // Desmarcar elemento
              setZoomMode(null) // Desmarcar zoom
            }}
            title="X"
          >
            <FontAwesomeIcon icon={faCrosshairs} />
          </button>
        </div>

        {/* Seletor de Cor */}
        <div className="toolbar-section">
          <div className="color-picker-container">
            <button
              className={`tool-btn color-picker-btn ${showColorPicker ? 'active' : ''}`}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Cor"
            >
            <FontAwesomeIcon icon={faPalette} />
              <div
                className="color-preview"
                style={{ backgroundColor: currentColor }}
              />
            </button>
            {showColorPicker && (
              <div className="color-picker-dropdown">
                <div className="color-picker-header">Cores</div>
                <div className="color-grid">
                  {colors.map(color => (
                <button
                  key={color.value}
                      className="color-btn"
                  style={{ backgroundColor: color.value }}
                      onClick={() => {
                        setCurrentColor(color.value)
                        setShowColorPicker(false)
                      }}
                  title={color.name}
                />
              ))}
            </div>
                <div className="color-custom">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                      setCurrentColor(e.target.value)
                    }}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => {
                      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                        setCurrentColor(e.target.value)
                        setCustomColor(e.target.value)
                      }
                    }}
                    className="color-hex-input"
                    placeholder="#FF6B9D"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Espessura */}
        <div className="toolbar-section">
          <label className="line-width-label">
            <span>Espessura:</span>
            <input
              type="range"
              min="5"
              max="30"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="line-width-slider"
            />
            <span>{lineWidth}px</span>
          </label>
        </div>

        {/* Undo/Redo */}
        <div className="toolbar-section">
          <button 
            className="tool-btn"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Desfazer"
          >
            <FontAwesomeIcon icon={faUndo} />
          </button>
          <button 
            className="tool-btn"
            onClick={redo}
            disabled={historyIndex >= drawingHistory.length - 1}
            title="Refazer"
          >
            <FontAwesomeIcon icon={faRedo} />
          </button>
        </div>

        {/* Zoom */}
        <div className="toolbar-section">
          <button 
            className={`tool-btn ${zoomMode === 'out' ? 'active' : ''}`}
            onClick={handleZoomOut}
            disabled={zoom <= 0.5 && !zoomMode}
            title={zoomMode === 'out' ? 'Clique na lousa para aplicar zoom out' : 'Diminuir Zoom'}
          >
            <FontAwesomeIcon icon={faSearchMinus} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            className={`tool-btn ${zoomMode === 'in' ? 'active' : ''}`}
            onClick={handleZoomIn}
            disabled={zoom >= 5 && !zoomMode}
            title={zoomMode === 'in' ? 'Clique na lousa para aplicar zoom in' : 'Aumentar Zoom'}
          >
            <FontAwesomeIcon icon={faSearchPlus} />
          </button>
          <button 
            className="tool-btn"
            onClick={handleZoomReset}
            title="Resetar Zoom"
          >
            <FontAwesomeIcon icon={faExpand} />
          </button>
        </div>

        {/* Elementos Arrastáveis */}
        <div className="toolbar-section">
          <h3 style={{ color: '#fff', margin: 0, fontSize: '0.875rem' }}>Elementos:</h3>
          {availableElements.map(tool => (
            <button
              key={tool.type}
              className={`tool-btn ${selectedTool === tool.type ? 'active' : ''}`}
              onClick={() => {
                setSelectedTool(selectedTool === tool.type ? null : tool.type)
                setCurrentTool(null) // Desmarcar ferramenta de desenho
                setZoomMode(null) // Desmarcar zoom
              }}
              title={tool.name}
            >
              <img 
                src={tool.image} 
                alt={tool.name}
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              />
          </button>
          ))}
        </div>
        </div>
      </div>

        {/* Div do Canvas - Direita */}
      <div className="desenho-canvas-container">
          <div className="canvas-content-wrapper">
        <div 
          className="canvas-wrapper"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <div
            ref={boardRef}
            className="interactive-board"
            onClick={handleBoardClick}
            style={{
              cursor: zoomMode === 'in' ? 'zoom-in' : zoomMode === 'out' ? 'zoom-out' : 'default'
          }}
        >
            {/* Canvas para desenho */}
          <canvas
            ref={canvasRef}
              className="drawing-canvas"
            onMouseDown={currentTool ? startDrawing : undefined}
            onMouseMove={currentTool ? draw : undefined}
            onMouseUp={currentTool ? stopDrawing : undefined}
            onTouchStart={currentTool ? startDrawing : undefined}
            onTouchMove={currentTool ? draw : undefined}
            onTouchEnd={currentTool ? stopDrawing : undefined}
            style={{ 
                cursor: zoomMode ? (zoomMode === 'in' ? 'zoom-in' : 'zoom-out') :
                       ['circle', 'rectangle', 'line', 'arrow', 'cross'].includes(currentTool) ? 'crosshair' :
                       currentTool === 'pencil' ? 'crosshair' :
                       'default',
                touchAction: 'none',
                pointerEvents: (currentTool || zoomMode) ? 'auto' : 'none'
            }}
          />
          
            {/* Elementos arrastáveis - acima do canvas */}
            {elements.map(element => {
              const isSelected = selectedElementId === element.id
              const isDragging = draggingElement === element.id
              
              return (
            <div 
                  key={element.id}
                  className={`draggable-element ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                    position: 'absolute',
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    transform: element.rotation ? `rotate(${element.rotation}rad)` : 'none',
                    transformOrigin: 'center center',
                    zIndex: element.zIndex || 10,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging || isResizing || isRotating ? 'none' : 'none',
                    pointerEvents: 'auto'
                  }}
                  onMouseDown={(e) => {
                    if (!isSelected) {
                      setSelectedElementId(element.id)
                    }
                    handleDragStart(e, element.id)
                  }}
                  onTouchStart={(e) => {
                    if (!isSelected) {
                      setSelectedElementId(element.id)
                    }
                    handleDragStart(e, element.id)
                  }}
                >
                  <img
                    src={element.imageSrc}
                    alt={element.type}
                    className="element-image"
                    draggable={false}
                  />
                  
                  {/* Controles de seleção */}
                  {isSelected && (
                    <>
                      {/* Borda de seleção */}
                      <div className="element-selection-border" />
                      
                      {/* Handles de resize (cantos) */}
                      <div
                        className="resize-handle resize-handle-nw"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                        onTouchStart={(e) => handleResizeStart(e, element.id, 'nw')}
                      />
                      <div
                        className="resize-handle resize-handle-ne"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                        onTouchStart={(e) => handleResizeStart(e, element.id, 'ne')}
                      />
                      <div
                        className="resize-handle resize-handle-sw"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                        onTouchStart={(e) => handleResizeStart(e, element.id, 'sw')}
                      />
                      <div
                        className="resize-handle resize-handle-se"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                        onTouchStart={(e) => handleResizeStart(e, element.id, 'se')}
                      />
                      
                      {/* Handle de rotação (topo) */}
                      <div
                        className="rotate-handle"
                        onMouseDown={(e) => handleRotateStart(e, element.id)}
                        onTouchStart={(e) => handleRotateStart(e, element.id)}
              />
                      
                      {/* Botão de deletar */}
              <button 
                        className="element-delete-btn"
                        onClick={(e) => handleDeleteElement(e, element.id)}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(e, element.id);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(e, element.id);
                        }}
                        title="Excluir"
              >
                        ×
              </button>
                    </>
                  )}
            </div>
              )
            })}

            {/* Overlay de instrução */}
            {selectedTool && (
              <div className="board-instruction-overlay">
                <p>Clique no quadro para adicionar {availableElements.find(t => t.type === selectedTool)?.name}</p>
            </div>
          )}
          </div>
          </div>
        </div>
        </div>
      </div>

      {/* Lista de Dentes Clicáveis */}
      <div className="dentes-list-section">
        <div className="dentes-list-header">
          <h3>Selecione os Dentes</h3>
        </div>
        <div className="dentes-list-container">
          {/* Arco Superior */}
          <div className="dentes-arch dentes-arch-upper">
            {/* Quadrante 1 (Superior Direito) - da direita para esquerda */}
            {[18, 17, 16, 15, 14, 13, 12, 11].map(numero => {
              const svgSrc = dentesSVGs[numero]
              const isSelected = isDenteSelected(numero)
              return (
                <button
                  key={numero}
                  className={`dente-item-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleDente(numero)}
                  title={`Dente ${numero}`}
            >
                  {svgSrc ? (
                    <>
                      <img 
                        src={svgSrc} 
                        alt={`Dente ${numero}`}
                        className="dente-item-icon"
                      />
                      <span className="dente-item-number">{numero}</span>
                    </>
                  ) : (
                    <span className="dente-item-number">{numero}</span>
                  )}
                </button>
              )
            })}
            {/* Quadrante 2 (Superior Esquerdo) - da esquerda para direita */}
            {[21, 22, 23, 24, 25, 26, 27, 28].map(numero => {
              const svgSrc = dentesSVGs[numero]
              const isSelected = isDenteSelected(numero)
              return (
              <button 
                  key={numero}
                  className={`dente-item-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleDente(numero)}
                  title={`Dente ${numero}`}
                >
                  {svgSrc ? (
                    <>
                      <img 
                        src={svgSrc} 
                        alt={`Dente ${numero}`}
                        className="dente-item-icon"
                      />
                      <span className="dente-item-number">{numero}</span>
                    </>
                  ) : (
                    <span className="dente-item-number">{numero}</span>
                  )}
              </button>
              )
            })}
            </div>
          
          {/* Arco Inferior */}
          <div className="dentes-arch dentes-arch-lower">
            {/* Quadrante 4 (Inferior Direito) - da direita para esquerda */}
            {[48, 47, 46, 45, 44, 43, 42, 41].map(numero => {
              const svgSrc = dentesSVGs[numero]
              const isSelected = isDenteSelected(numero)
              return (
                <button
                  key={numero}
                  className={`dente-item-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleDente(numero)}
                  title={`Dente ${numero}`}
                >
                  {svgSrc ? (
                    <>
                      <img 
                        src={svgSrc} 
                        alt={`Dente ${numero}`}
                        className="dente-item-icon"
                      />
                      <span className="dente-item-number">{numero}</span>
                    </>
                  ) : (
                    <span className="dente-item-number">{numero}</span>
                  )}
                </button>
              )
            })}
            {/* Quadrante 3 (Inferior Esquerdo) - da esquerda para direita */}
            {[31, 32, 33, 34, 35, 36, 37, 38].map(numero => {
              const svgSrc = dentesSVGs[numero]
              const isSelected = isDenteSelected(numero)
              return (
                <button
                  key={numero}
                  className={`dente-item-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleDente(numero)}
                  title={`Dente ${numero}`}
                >
                  {svgSrc ? (
                    <>
                      <img 
                        src={svgSrc} 
                        alt={`Dente ${numero}`}
                        className="dente-item-icon"
                      />
                      <span className="dente-item-number">{numero}</span>
                    </>
                  ) : (
                    <span className="dente-item-number">{numero}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de Dentes Selecionados com Descrições */}
      {selectedDentes.length > 0 && (
        <div className="dentes-selected-section">
          <div className="dentes-selected-header">
            <h3>Dentes Selecionados</h3>
            <span className="dentes-count">{selectedDentes.length}</span>
          </div>
          <div className="dentes-selected-list">
            {selectedDentes.map(dente => {
              const svgSrc = dentesSVGs[dente.numero]
              return (
                <div key={dente.numero} className="dente-selected-item">
                  <div className="dente-selected-info">
                    {svgSrc ? (
                      <img 
                        src={svgSrc} 
                        alt={`Dente ${dente.numero}`}
                        className="dente-selected-icon"
                      />
                    ) : (
                      <span className="dente-selected-number">{dente.numero}</span>
                    )}
                    <span className="dente-selected-label">Dente {dente.numero}</span>
                    <button
                      className="dente-remove-btn"
                      onClick={() => removeDente(dente.numero)}
                      title="Remover"
                    >
                      <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>
                  <textarea
                    className="dente-descricao-input"
                    value={dente.descricao}
                    onChange={(e) => updateDenteDescricao(dente.numero, e.target.value)}
                    placeholder={`Digite a descrição para o dente ${dente.numero}...`}
                    rows={2}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seção de Observações */}
      <div className="observacoes-section">
        <div className="observacoes-section-header">
          <FontAwesomeIcon icon={faFileAlt} />
          <span>Observações</span>
        </div>
        <textarea
          className="observacoes-textarea"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Digite suas observações sobre este diagnóstico..."
        />
        <div className="observacoes-section-footer">
          <button className="btn-salvar-observacoes" onClick={saveDrawing}>
            <FontAwesomeIcon icon={faSave} /> SALVAR
            </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticoDesenho
