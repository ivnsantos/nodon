import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, faEraser, faPalette, faUndo, faRedo,
  faSave, faDownload, faFilter, faPencil, faSearchPlus,
  faSearchMinus, faExpand, faCompress, faFont, faTimes,
  faFileAlt, faCheck
} from '@fortawesome/free-solid-svg-icons'
// Removido import de API - usando dados mockados
import dente1 from '../img/dente1 (1).png'
import dente2 from '../img/dente2 (1).png'
import dente3 from '../img/dente3 (1).png'
import dente4 from '../img/dente4 (1).png'
import exameImage from '../img/exame.jpg'
import './DiagnosticoDesenho.css'

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
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState('#FF6B9D') // Rosa
  const [currentTool, setCurrentTool] = useState('pencil') // pencil, eraser, text
  const [lineWidth, setLineWidth] = useState(2)
  const [annotations, setAnnotations] = useState([])
  const [editingAnnotation, setEditingAnnotation] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const [showTextInput, setShowTextInput] = useState(false)
  const [radiografia, setRadiografia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [drawingHistory, setDrawingHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [observacoes, setObservacoes] = useState('')

  const colors = [
    { name: 'Rosa', value: '#FF6B9D' },
    { name: 'Verde', value: '#4ECDC4' },
    { name: 'Amarelo', value: '#FFE66D' },
    { name: 'Vermelho', value: '#FF6B6B' },
    { name: 'Azul', value: '#4A90E2' },
    { name: 'Branco', value: '#FFFFFF' }
  ]

  useEffect(() => {
    loadRadiografia()
  }, [id])

  useEffect(() => {
    if (radiografia && canvasRef.current && !imageLoaded) {
      // Pequeno delay para garantir que o canvas esteja pronto
      setTimeout(() => {
        drawImageOnCanvas()
      }, 100)
    }
  }, [radiografia, imageLoaded])

  const loadRadiografia = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar radiografia do localStorage
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      const radiografia = savedDiagnosticos.find(d => d.id === parseInt(id))
      
      if (radiografia) {
        // Sempre usar exameImage
        const radiografiaComImagem = {
          ...radiografia,
          imagem: exameImage
        }
        setRadiografia(radiografiaComImagem)
        // Carregar observações se existirem
        if (radiografia.observacoes) {
          setObservacoes(radiografia.observacoes)
        }
      } else {
        // Usar dados mockados se não encontrar
        const mockData = getMockRadiografia(parseInt(id))
        setRadiografia(mockData)
      }
    } catch (error) {
      console.error('Erro ao carregar radiografia:', error)
      // Usar dados mockados se não encontrar
      const mockData = getMockRadiografia(parseInt(id))
      setRadiografia(mockData)
    } finally {
      setLoading(false)
    }
  }

  const drawImageOnCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !radiografia) return

    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Aumentar significativamente o tamanho da imagem
      // Usar um tamanho fixo maior ou baseado na resolução da imagem original
      const originalWidth = img.width
      const originalHeight = img.height
      
      // Calcular um tamanho mínimo baseado na tela, mas muito maior
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      
      // Usar pelo menos 2x o tamanho da tela ou manter a resolução original se for maior
      const minWidth = Math.max(screenWidth * 2, originalWidth * 2)
      const minHeight = Math.max(screenHeight * 2, originalHeight * 2)
      
      // Calcular escala para manter proporção
      const scaleX = minWidth / originalWidth
      const scaleY = minHeight / originalHeight
      const scale = Math.max(scaleX, scaleY) // Usar o maior para garantir que a imagem seja grande
      
      // Se a imagem original já for grande, aumentar ainda mais
      const finalScale = originalWidth < 1000 ? scale * 2 : scale * 1.5
      
      const width = originalWidth * finalScale
      const height = originalHeight * finalScale
      
      canvas.width = width
      canvas.height = height
      
      // Desenhar a imagem escalada
      ctx.drawImage(img, 0, 0, width, height)
      setImageLoaded(true)
      saveState()
    }
    
    img.onerror = () => {
      // Se a imagem falhar, tentar novamente com exameImage
      img.src = exameImage
    }
    
    // Sempre usar exameImage
    img.src = exameImage
  }

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    // Ajustar coordenadas considerando zoom e pan
    const x = ((e.clientX - rect.left - pan.x) / zoom) * scaleX
    const y = ((e.clientY - rect.top - pan.y) / zoom) * scaleY
    
    return { x, y }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }


  const handleMouseDownPan = (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Botão do meio ou Ctrl + clique esquerdo
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMovePan = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUpPan = () => {
    setIsPanning(false)
  }

  const startDrawing = (e) => {
    if (currentTool === 'eraser') {
      erase(e)
      return
    }
    
    if (currentTool === 'text') {
      const { x, y } = getCoordinates(e)
      setTextPosition({ x, y })
      setShowTextInput(true)
      setTextInput('')
      return
    }
    
    if (!imageLoaded) return
    
    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = currentColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  const draw = (e) => {
    if (!isDrawing || currentTool === 'eraser' || !imageLoaded) return
    
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveState()
    }
  }

  const erase = (e) => {
    if (currentTool !== 'eraser' || !imageLoaded) return
    
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, lineWidth * 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const state = canvas.toDataURL()
    const newHistory = drawingHistory.slice(0, historyIndex + 1)
    newHistory.push(state)
    setDrawingHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      restoreState(drawingHistory[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      restoreState(drawingHistory[newIndex])
    }
  }

  const restoreState = (state) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = state
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawImageOnCanvas()
    saveState()
  }

  const saveDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataURL = canvas.toDataURL('image/png')
    try {
      // Salvar desenho e observações no localStorage
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      const diagnosticoIndex = savedDiagnosticos.findIndex(d => d.id === parseInt(id))
      
      if (diagnosticoIndex !== -1) {
        savedDiagnosticos[diagnosticoIndex] = {
          ...savedDiagnosticos[diagnosticoIndex],
          desenho: dataURL,
          observacoes: observacoes,
          dataDesenho: new Date().toISOString()
        }
        localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
        alert('Desenho e observações salvos com sucesso!')
      } else {
        // Se não encontrar, criar novo registro
        const novoDiagnostico = {
          id: parseInt(id),
          desenho: dataURL,
          observacoes: observacoes,
          dataDesenho: new Date().toISOString()
        }
        savedDiagnosticos.push(novoDiagnostico)
        localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
        alert('Desenho e observações salvos com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar desenho:', error)
      alert('Erro ao salvar desenho')
    }
  }

  const saveObservacoes = () => {
    // Salvar apenas as observações
    try {
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      const diagnosticoIndex = savedDiagnosticos.findIndex(d => d.id === parseInt(id))
      
      if (diagnosticoIndex !== -1) {
        savedDiagnosticos[diagnosticoIndex] = {
          ...savedDiagnosticos[diagnosticoIndex],
          observacoes: observacoes
        }
        localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
        alert('Observações salvas com sucesso!')
      } else {
        // Se não encontrar, criar novo registro
        const novoDiagnostico = {
          id: parseInt(id),
          observacoes: observacoes
        }
        savedDiagnosticos.push(novoDiagnostico)
        localStorage.setItem('mockDiagnosticos', JSON.stringify(savedDiagnosticos))
        alert('Observações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar observações:', error)
      alert('Erro ao salvar observações')
    }
  }

  const downloadDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const link = document.createElement('a')
    link.download = `radiografia-${id}-desenho.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const addAnnotation = () => {
    if (!textInput.trim()) {
      setShowTextInput(false)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { x, y } = textPosition

    // Desenhar o texto no canvas
    ctx.fillStyle = currentColor
    ctx.font = `${lineWidth * 8}px Arial`
    ctx.textBaseline = 'top'
    ctx.fillText(textInput, x, y)

    // Adicionar à lista de anotações
    const newAnnotation = {
      id: Date.now(),
      text: textInput,
      x,
      y,
      color: currentColor,
      fontSize: lineWidth * 8
    }
    setAnnotations([...annotations, newAnnotation])
    setTextInput('')
    setShowTextInput(false)
    saveState()
  }

  const cancelTextInput = () => {
    setShowTextInput(false)
    setTextInput('')
  }

  const deleteAnnotation = (annotationId) => {
    const updatedAnnotations = annotations.filter(ann => ann.id !== annotationId)
    setAnnotations(updatedAnnotations)
    
    // Redesenhar canvas sem a anotação
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Recarregar a imagem base e redesenhar todas as anotações
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Redesenhar todas as anotações restantes
      updatedAnnotations.forEach(ann => {
        ctx.fillStyle = ann.color
        ctx.font = `${ann.fontSize}px Arial`
        ctx.textBaseline = 'top'
        ctx.fillText(ann.text, ann.x, ann.y)
      })
      saveState()
    }
    img.src = canvas.toDataURL()
  }

  // Redesenhar anotações quando a imagem carregar
  useEffect(() => {
    if (imageLoaded && annotations.length > 0) {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      annotations.forEach(ann => {
        ctx.fillStyle = ann.color
        ctx.font = `${ann.fontSize}px Arial`
        ctx.textBaseline = 'top'
        ctx.fillText(ann.text, ann.x, ann.y)
      })
      saveState()
    }
  }, [imageLoaded])

  if (loading) {
    return (
      <div className="desenho-loading">
        <div className="loading-spinner"></div>
        <p>Carregando radiografia...</p>
      </div>
    )
  }

  return (
    <div className="diagnostico-desenho-page">
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
          <button className="btn-salvar-header" onClick={saveDrawing} title="Salvar">
            <FontAwesomeIcon icon={faSave} /> Salvar
          </button>
          <button className="btn-header-action">
            <FontAwesomeIcon icon={faFilter} /> Filtro
          </button>
          <button className="btn-header-action active">
            <FontAwesomeIcon icon={faPencil} /> Desenho
          </button>
        </div>
      </div>

      <div className="desenho-toolbar">
        <div className="toolbar-section">
          <button 
            className={`tool-btn ${currentTool === 'pencil' ? 'active' : ''}`}
            onClick={() => setCurrentTool('pencil')}
            title="Lápis"
          >
            <FontAwesomeIcon icon={faPencil} />
          </button>
          <button 
            className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setCurrentTool('eraser')}
            title="Borracha"
          >
            <FontAwesomeIcon icon={faEraser} />
          </button>
          <button 
            className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
            onClick={() => setCurrentTool('text')}
            title="Anotação de Texto"
          >
            <FontAwesomeIcon icon={faFont} />
          </button>
        </div>

        <div className="toolbar-section">
          <div className="color-picker">
            <FontAwesomeIcon icon={faPalette} />
            <div className="color-options">
              {colors.map((color) => (
                <button
                  key={color.value}
                  className={`color-btn ${currentColor === color.value ? 'active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setCurrentColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="toolbar-section">
          <label className="line-width-label">
            Espessura:
            <input
              type="range"
              min="1"
              max="30"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="line-width-slider"
            />
            <span>{lineWidth}px</span>
          </label>
        </div>

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

        <div className="toolbar-section">
          <button 
            className="tool-btn"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Diminuir Zoom"
          >
            <FontAwesomeIcon icon={faSearchMinus} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            className="tool-btn"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            title="Aumentar Zoom"
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

        <div className="toolbar-section">
          <button className="tool-btn download-btn" onClick={downloadDrawing} title="Download">
            <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>
      </div>

      <div className="desenho-canvas-container">
        <div 
          className="canvas-wrapper"
          style={{ 
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            display: 'inline-block'
          }}
        >
          <canvas
            ref={canvasRef}
            className="desenho-canvas"
            onMouseDown={(e) => {
              if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                handleMouseDownPan(e)
              } else {
                startDrawing(e)
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                handleMouseMovePan(e)
              } else {
                draw(e)
              }
            }}
            onMouseUp={(e) => {
              handleMouseUpPan()
              stopDrawing()
            }}
            onMouseLeave={(e) => {
              handleMouseUpPan()
              stopDrawing()
            }}
            style={{ 
              cursor: isPanning ? 'grabbing' : (currentTool === 'text' ? 'text' : (currentTool === 'eraser' ? 'grab' : 'crosshair'))
            }}
          />
          
          {/* Input de texto para anotações */}
          {showTextInput && (
            <div 
              className="text-input-overlay"
              style={{
                left: `${textPosition.x}px`,
                top: `${textPosition.y}px`
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAnnotation()
                  } else if (e.key === 'Escape') {
                    cancelTextInput()
                  }
                }}
                onBlur={addAnnotation}
                autoFocus
                className="annotation-input"
                placeholder="Digite sua anotação..."
                style={{ 
                  color: currentColor,
                  fontSize: `${lineWidth * 8}px`,
                  borderColor: currentColor
                }}
              />
              <button 
                className="cancel-text-btn"
                onClick={cancelTextInput}
                title="Cancelar"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}

          {/* Anotações existentes */}
          {annotations.map(ann => (
            <div
              key={ann.id}
              className="annotation-display"
              style={{
                left: `${ann.x}px`,
                top: `${ann.y}px`,
                color: ann.color,
                fontSize: `${ann.fontSize}px`
              }}
            >
              <span className="annotation-text">{ann.text}</span>
              <button 
                className="delete-annotation-btn"
                onClick={() => deleteAnnotation(ann.id)}
                title="Deletar anotação"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Arcada Dentária */}
      <div className="arcada-dentaria">
        <div className="arcada-row arcada-superior">
          {/* Arcada Superior - 16 dentes: 3 molares, 2 pré-molares, 1 canino, 4 incisivos, 1 canino, 2 pré-molares, 3 molares */}
          {[
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 },
            { type: 'premolar', img: dente2 },
            { type: 'premolar', img: dente2 },
            { type: 'canino', img: dente3 },
            { type: 'incisivo', img: dente4 },
            { type: 'incisivo', img: dente4 },
            { type: 'incisivo', img: dente4 },
            { type: 'incisivo', img: dente4 },
            { type: 'canino', img: dente3 },
            { type: 'premolar', img: dente2 },
            { type: 'premolar', img: dente2 },
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 }
          ].map((dente, i) => (
            <button key={`superior-${i}`} className="dente-btn" title={`Dente ${i + 1}`}>
              <img src={dente.img} alt={`Dente ${dente.type}`} className="dente-icon" />
            </button>
          ))}
        </div>
        <div className="arcada-row arcada-inferior">
          {/* Arcada Inferior - 16 dentes: 3 molares, 2 pré-molares, 1 canino, 4 incisivos, 1 canino, 2 pré-molares, 3 molares */}
          {[
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 },
            { type: 'premolar', img: dente2 },
            { type: 'premolar', img: dente2 },
            { type: 'canino', img: dente3 },
            { type: 'incisivo', img: dente4 },
            { type: 'incisivo', img: dente4 },
            { type: 'incisivo', img: dente4 },
            { type: 'incisivo', img: dente4 },
            { type: 'canino', img: dente3 },
            { type: 'premolar', img: dente2 },
            { type: 'premolar', img: dente2 },
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 },
            { type: 'molar', img: dente1 }
          ].map((dente, i) => (
            <button key={`inferior-${i}`} className="dente-btn" title={`Dente ${i + 1}`}>
              <img src={dente.img} alt={`Dente ${dente.type}`} className="dente-icon" />
            </button>
          ))}
        </div>
      </div>

      {/* Seção de Observações - No final da página */}
      <div className="observacoes-section">
        <div className="observacoes-section-header">
          <h3>
            <FontAwesomeIcon icon={faFileAlt} /> Observações do Dentista
          </h3>
        </div>
        <div className="observacoes-section-body">
          <textarea
            className="observacoes-textarea"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Digite suas observações sobre a radiografia e o desenho realizado..."
            rows={4}
          />
        </div>
        <div className="observacoes-section-footer">
          <button 
            className="btn-save-observacoes"
            onClick={saveObservacoes}
          >
            <FontAwesomeIcon icon={faCheck} /> SALVAR
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticoDesenho

