import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, faFileMedical, faCheck, faFileAlt, faTooth,
  faDownload, faStethoscope
} from '@fortawesome/free-solid-svg-icons'
// jsPDF será importado dinamicamente
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import exameImage from '../img/exame.jpg'
import nodoLogo from '../img/nodo.png'
import './DetalhamentoProfissional.css'

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

// Dados mockados para o detalhamento profissional
const getMockDetalhamento = (diagnosticoId) => {
  return {
    id: diagnosticoId,
    radiografia: exameImage,
    observacoes: 'Radiografia panorâmica apresentando arcada dentária completa. Observa-se presença de restaurações em alguns elementos dentários. Estruturas ósseas preservadas, sem evidências de lesões periapicais ou outras patologias aparentes. Seios maxilares aéreos. ATM bilateralmente preservada.',
    dentes: [
      {
        numero: 18,
        descricao: 'Dente 18 (terceiro molar superior direito) - Ausente. Espaço edêntulo com reabsorção óssea leve.',
        posicao: { top: '15%', left: '10%' }
      },
      {
        numero: 36,
        descricao: 'Dente 36 (primeiro molar inferior direito) - Presença de restauração em resina composta na face oclusal. Raiz completa, espaço periodontal preservado.',
        posicao: { top: '65%', left: '25%' }
      },
      {
        numero: 21,
        descricao: 'Dente 21 (incisivo central superior esquerdo) - Estrutura preservada, sem alterações aparentes.',
        posicao: { top: '20%', left: '45%' }
      },
      {
        numero: 42,
        descricao: 'Dente 42 (incisivo lateral inferior direito) - Presença de cálculo dental leve. Estrutura radicular preservada.',
        posicao: { top: '70%', left: '30%' }
      },
      {
        numero: 15,
        descricao: 'Dente 15 (segundo pré-molar superior direito) - Restauração em amálgama presente. Sem alterações periapicais.',
        posicao: { top: '25%', left: '20%' }
      }
    ]
  }
}

const DetalhamentoProfissional = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { alertConfig, showError, hideAlert } = useAlert()
  const [detalhamento, setDetalhamento] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDetalhamento()
  }, [id, location.state])

  const loadDetalhamento = async () => {
    try {
      // Verificar se há dados do desenho no state da navegação
      const desenhoData = location.state?.desenhoData
      
      if (desenhoData) {
        // Usar dados do desenho da API
        const data = {
          id: parseInt(id),
          radiografia: desenhoData.imagemDesenhada || exameImage,
          observacoes: desenhoData.observacoes || '',
          dentes: desenhoData.dentesAnotacoes ? desenhoData.dentesAnotacoes.map(d => ({
            numero: parseInt(d.dente) || d.dente,
            descricao: d.descricao || `Dente ${d.dente} selecionado`,
            posicao: { top: '50%', left: '50%' } // Posição padrão
          })) : [],
          necessidades: desenhoData.necessidades || [],
          tituloDesenho: desenhoData.tituloDesenho || ''
        }
        setDetalhamento(data)
        setLoading(false)
        return
      }
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Tentar carregar do localStorage primeiro
      const saved = localStorage.getItem(`drawing_${id}`)
      let data = null
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Converter dados salvos para o formato da página
          data = {
            id: parseInt(id),
            radiografia: exameImage,
            observacoes: parsed.observacoes || '',
            dentes: parsed.selectedDentes ? parsed.selectedDentes.map(d => ({
              numero: d.numero,
              descricao: d.descricao || `Dente ${d.numero} selecionado`,
              posicao: { top: '50%', left: '50%' } // Posição padrão
            })) : []
          }
        } catch (e) {
          console.error('Erro ao parsear dados salvos:', e)
        }
      }
      
      // Se não houver dados salvos, usar mock
      if (!data || (!data.observacoes && data.dentes.length === 0)) {
        data = getMockDetalhamento(parseInt(id))
      }
      
      setDetalhamento(data)
    } catch (error) {
      console.error('Erro ao carregar detalhamento:', error)
      setDetalhamento(getMockDetalhamento(parseInt(id)))
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!detalhamento) return

    try {
      // Criar novo documento PDF
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      
      // Função auxiliar para carregar imagem
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      }
      
      // Cabeçalho profissional com azul escuro
      pdf.setFillColor(15, 23, 42) // Azul escuro profissional (#0f172a)
      pdf.rect(0, 0, pageWidth, 40, 'F')
      
      // Barra decorativa inferior no cabeçalho
      pdf.setFillColor(30, 58, 138) // Azul médio (#1e3a8a)
      pdf.rect(0, 38, pageWidth, 2, 'F')
      
      // Carregar e adicionar logo da NODON
      try {
        const logoImg = await loadImage(nodoLogo)
        const logoSize = 14 // Tamanho do logo em mm
        const logoHeight = logoSize
        pdf.addImage(logoImg, 'PNG', margin, 8, logoSize, logoHeight)
      } catch (e) {
        console.log('Erro ao carregar logo:', e)
      }
      
      // Título no cabeçalho
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('NODON', margin + 18, 18)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(200, 200, 200)
      pdf.text('Detalhamento Profissional', margin + 18, 25)
      
      // Data no cabeçalho (lado direito)
      const dataCabecalho = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })
      pdf.setFontSize(10)
      pdf.setTextColor(180, 180, 180)
      pdf.text(dataCabecalho, pageWidth - margin, 20, { align: 'right' })
      
      pdf.setTextColor(0, 0, 0)
      let yPosition = 50
      
      // Carregar e adicionar a imagem da radiografia
      const radiografiaImg = await loadImage(detalhamento.radiografia)
      
      // Calcular dimensões da imagem para caber na página
      const maxWidth = contentWidth
      const maxHeight = 90 // Altura máxima para a imagem
      let imgWidth = radiografiaImg.width
      let imgHeight = radiografiaImg.height
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
      imgWidth = imgWidth * ratio
      imgHeight = imgHeight * ratio
      
      // Borda ao redor da imagem
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.rect(margin - 2, yPosition - 2, imgWidth + 4, imgHeight + 4)
      
      // Adicionar imagem ao PDF
      pdf.addImage(radiografiaImg, 'JPEG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 15
      
      // Linha decorativa com azul escuro
      pdf.setDrawColor(15, 23, 42)
      pdf.setLineWidth(1.5)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 12
      
      // Adicionar linha separadora
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      // Função para converter SVG para PNG
      const svgToPng = async (svgUrl) => {
        return new Promise((resolve, reject) => {
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = 300
            canvas.height = 450
            
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            img.onload = () => {
              try {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
                const x = (canvas.width - img.width * scale) / 2
                const y = (canvas.height - img.height * scale) / 2
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
                const pngDataUrl = canvas.toDataURL('image/png', 1.0)
                resolve(pngDataUrl)
              } catch (error) {
                reject(error)
              }
            }
            
            img.onerror = reject
            img.src = svgUrl
          } catch (error) {
            reject(error)
          }
        })
      }
      
      // Dentes Marcados
      if (detalhamento.dentes && detalhamento.dentes.length > 0) {
        // Título da seção com fundo azul escuro
        pdf.setFillColor(15, 23, 42)
        pdf.rect(margin, yPosition - 5, contentWidth, 10, 'F')
        
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(255, 255, 255)
        pdf.text('Dentes Selecionados', margin + 5, yPosition + 3)
        yPosition += 15
        
        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        // Importar SVGs dos dentes
        const dentesSVGs = {
          11: dente11, 12: dente12, 13: dente13, 14: dente14, 15: dente15,
          16: dente16, 17: dente17, 18: dente18, 21: dente21, 22: dente22,
          23: dente23, 24: dente24, 25: dente25, 26: dente26, 27: dente27,
          28: dente28, 31: dente31, 32: dente32, 33: dente33, 34: dente34,
          35: dente35, 36: dente36, 37: dente37, 38: dente38, 41: dente41,
          42: dente42, 43: dente43, 44: dente44, 45: dente45, 46: dente46,
          47: dente47, 48: dente48
        }
        
        for (const dente of detalhamento.dentes) {
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 40) {
            pdf.addPage()
            yPosition = margin + 10
          }
          
          // Card para cada dente com borda azul escura
          const cardHeight = 25
          pdf.setFillColor(255, 255, 255)
          pdf.setDrawColor(15, 23, 42)
          pdf.setLineWidth(0.5)
          pdf.roundedRect(margin, yPosition - 3, contentWidth, cardHeight, 3, 3, 'FD')
          
          // Barra lateral azul no card
          pdf.setFillColor(30, 58, 138)
          pdf.rect(margin, yPosition - 3, 2, cardHeight, 'F')
          
          // Tentar carregar e adicionar imagem do dente
          const denteSvg = dentesSVGs[dente.numero]
          let hasDenteImage = false
          if (denteSvg) {
            try {
              const pngDataUrl = await svgToPng(denteSvg)
              const denteImg = await loadImage(pngDataUrl)
              const denteImgSize = 6
              const denteImgHeight = denteImgSize * 2
              pdf.addImage(denteImg, 'PNG', margin + 3, yPosition + 2, denteImgSize, denteImgHeight)
              hasDenteImage = true
            } catch (e) {
              console.log('Erro ao carregar imagem do dente:', e)
            }
          }
          
          // Número do dente em negrito
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(11)
          pdf.text(`Dente ${dente.numero}:`, margin + (hasDenteImage ? 12 : 3), yPosition + 5)
          
          // Descrição do dente
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(9)
          const descricaoLines = pdf.splitTextToSize(dente.descricao || `Dente ${dente.numero} selecionado`, contentWidth - (hasDenteImage ? 15 : 6))
          pdf.text(descricaoLines, margin + (hasDenteImage ? 12 : 3), yPosition + 12)
          yPosition += cardHeight + 5
        }
        
        yPosition += 5
      }
      
      // Necessidades/Tratamento
      const necessidades = detalhamento.necessidades || detalhamento.recomendacoes || []
      if (Array.isArray(necessidades) && necessidades.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = margin + 10
        }
        
        // Título da seção com fundo azul escuro
        pdf.setFillColor(15, 23, 42)
        pdf.rect(margin, yPosition - 5, contentWidth, 10, 'F')
        
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(255, 255, 255)
        pdf.text('Necessidades / Tratamento', margin + 5, yPosition + 3)
        yPosition += 15
        
        // Cabeçalho da tabela - proporção 1:5
        const colWidth1 = contentWidth * (1/6) // Procedimentos (1 parte)
        const colWidth2 = contentWidth * (5/6) // Anotações (5 partes)
        const rowHeight = 15
        const headerHeight = 12
        
        // Função para desenhar cabeçalho
        const drawTableHeader = (y) => {
          pdf.setFillColor(15, 23, 42)
          pdf.rect(margin, y, colWidth1, headerHeight, 'F')
          pdf.rect(margin + colWidth1, y, colWidth2, headerHeight, 'F')
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(255, 255, 255)
          pdf.text('Procedimentos', margin + 3, y + 8)
          pdf.text('Anotações', margin + colWidth1 + 3, y + 8)
        }
        
        // Desenhar cabeçalho inicial
        drawTableHeader(yPosition)
        yPosition += headerHeight
        
        // Linhas da tabela
        necessidades.forEach((item, index) => {
          // Texto das células
          const procedimento = typeof item === 'object' ? (item.procedimento || '-') : (item || '-')
          const anotacoes = typeof item === 'object' ? (item.anotacoes || '-') : '-'
          
          const procedimentoLines = pdf.splitTextToSize(procedimento, colWidth1 - 6)
          const anotacoesLines = pdf.splitTextToSize(anotacoes, colWidth2 - 6)
          
          const cellHeight = Math.max(
            procedimentoLines.length * 5 + 4,
            anotacoesLines.length * 5 + 4,
            rowHeight
          )
          
          // Verificar se precisa de nova página ANTES de desenhar a linha
          if (yPosition + cellHeight > pageHeight - 20) {
            pdf.addPage()
            yPosition = margin + 10
            // Redesenhar cabeçalho na nova página
            drawTableHeader(yPosition)
            yPosition += headerHeight
          }
          
          // Borda da célula
          pdf.setDrawColor(15, 23, 42)
          pdf.setLineWidth(0.3)
          pdf.rect(margin, yPosition, colWidth1, cellHeight, 'S')
          pdf.rect(margin + colWidth1, yPosition, colWidth2, cellHeight, 'S')
          
          // Texto das células - PRETO
          pdf.setTextColor(0, 0, 0)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.text(procedimentoLines, margin + 3, yPosition + 6)
          pdf.text(anotacoesLines, margin + colWidth1 + 3, yPosition + 6)
          
          yPosition += cellHeight
        })
        
        yPosition += 10 // Espaço após a tabela
      }
      
      // Observações Gerais
      if (detalhamento.observacoes) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = margin + 10
        } else {
          // Adicionar espaço antes da seção de observações
          yPosition += 10
        }
        
        // Título da seção com fundo azul escuro
        pdf.setFillColor(15, 23, 42)
        pdf.rect(margin, yPosition - 5, contentWidth, 10, 'F')
        
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(255, 255, 255)
        pdf.text('Observações Gerais', margin + 5, yPosition + 3)
        yPosition += 15
        
        // Card para observações com borda azul escura
        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(15, 23, 42)
        pdf.setLineWidth(0.5)
        const observacoesHeight = Math.min((detalhamento.observacoes.split('\n').length * 5) + 10, 50)
        pdf.roundedRect(margin, yPosition - 3, contentWidth, observacoesHeight, 3, 3, 'FD')
        
        // Barra lateral azul no card
        pdf.setFillColor(30, 58, 138)
        pdf.rect(margin, yPosition - 3, 2, observacoesHeight, 'F')
        
        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const observacoesLines = pdf.splitTextToSize(detalhamento.observacoes, contentWidth - 6)
        pdf.text(observacoesLines, margin + 3, yPosition + 5)
        yPosition += observacoesHeight + 10
      }
      
      // Rodapé profissional com azul escuro
      const footerY = pageHeight - 18
      pdf.setFillColor(15, 23, 42)
      pdf.rect(0, footerY, pageWidth, 18, 'F')
      
      // Barra decorativa superior no rodapé
      pdf.setFillColor(30, 58, 138)
      pdf.rect(0, footerY, pageWidth, 2, 'F')
      
      // Logo pequeno no rodapé
      try {
        const logoFooterImg = await loadImage(nodoLogo)
        const logoFooterSize = 6
        pdf.addImage(logoFooterImg, 'PNG', margin, footerY + 5, logoFooterSize, logoFooterSize)
      } catch (e) {
        console.log('Erro ao carregar logo no rodapé:', e)
      }
      
      const dataAtual = new Date().toLocaleDateString('pt-BR')
      const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(200, 200, 200)
      pdf.text(`NODON - Gerado em ${dataAtual} às ${horaAtual}`, pageWidth / 2, footerY + 10, { align: 'center' })
      
      // Texto adicional no rodapé
      pdf.setFontSize(7)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Plataforma inteligente para análise de radiografias odontológicas', pageWidth / 2, footerY + 15, { align: 'center' })
      
      // Salvar PDF
      pdf.save(`detalhamento_profissional_${id}_${Date.now()}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      showError('Erro ao gerar PDF. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="detalhamento-loading">
        <div className="loading-spinner"></div>
        <p>Carregando detalhamento profissional...</p>
      </div>
    )
  }

  if (!detalhamento) {
    return (
      <div className="detalhamento-error">
        <h2>Detalhamento não encontrado</h2>
        <button onClick={() => navigate('/app/diagnosticos')}>
          Voltar para Diagnósticos
        </button>
      </div>
    )
  }

  return (
    <div className="detalhamento-profissional-page">
      <div className="detalhamento-header">
        <div>
          <button className="btn-back-detalhamento" onClick={() => navigate(`/app/diagnosticos/${id}`)}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar
          </button>
          <h1>
            <FontAwesomeIcon icon={faFileMedical} /> Detalhamento Profissional
          </h1>
        </div>
        <button className="btn-exportar-pdf" onClick={handleExportPDF}>
          <FontAwesomeIcon icon={faDownload} /> Exportar PDF
        </button>
      </div>

      <div className="detalhamento-content">
        {/* Radiografia com marcações */}
        <div className="detalhamento-radiografia-section">
          <div className="radiografia-container">
            <img 
              src={detalhamento.radiografia}
              alt="Radiografia"
              className="radiografia-image"
            />
          </div>
        </div>

        {/* Dentes Marcados com Observações */}
        {detalhamento.dentes && detalhamento.dentes.length > 0 && (
          <div className="detalhamento-dentes-section">
            <h2>
              <FontAwesomeIcon icon={faTooth} /> Dentes Marcados
            </h2>
            <div className="dentes-list">
              {detalhamento.dentes.map((dente, index) => {
                const svgSrc = dentesSVGs[dente.numero]
                return (
                  <div key={index} className="dente-item">
                    <div className="dente-item-header">
                      {svgSrc && (
                        <div className="dente-item-image">
                          <img 
                            src={svgSrc} 
                            alt={`Dente ${dente.numero}`}
                            className="dente-svg-icon"
                          />
                        </div>
                      )}
                      <div className="dente-numero-badge">
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Dente {dente.numero}</span>
                      </div>
                    </div>
                    <div className="dente-item-content">
                      <p>{dente.descricao}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Necessidades */}
        {detalhamento.necessidades && Array.isArray(detalhamento.necessidades) && detalhamento.necessidades.length > 0 && (
          <div className="detalhamento-necessidades-section">
            <h2>
              <FontAwesomeIcon icon={faStethoscope} /> Necessidades
            </h2>
            <ul className="necessidades-list">
              {detalhamento.necessidades.map((necessidade, index) => {
                let necessidadeValue = ''
                if (typeof necessidade === 'object' && necessidade !== null) {
                  // Mostrar procedimento primeiro, depois anotação
                  const partes = []
                  if (necessidade.procedimento) partes.push(necessidade.procedimento)
                  if (necessidade.anotacoes) partes.push(necessidade.anotacoes)
                  necessidadeValue = partes.join(' - ') || 'Nenhuma informação'
                } else if (typeof necessidade === 'string') {
                  necessidadeValue = necessidade || 'Nenhuma informação'
                } else {
                  necessidadeValue = 'Nenhuma informação'
                }
                
                return (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheck} className="list-icon" />
                    {necessidadeValue}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Observações Gerais */}
        {detalhamento.observacoes && (
          <div className="detalhamento-observacoes-section">
            <h2>
              <FontAwesomeIcon icon={faFileAlt} /> Observações Gerais
            </h2>
            <div className="observacoes-content">
              <p>{detalhamento.observacoes}</p>
            </div>
          </div>
        )}

        {(!detalhamento.observacoes && (!detalhamento.dentes || detalhamento.dentes.length === 0)) && (
          <div className="detalhamento-empty">
            <p>Nenhum detalhamento profissional registrado.</p>
            <button 
              className="btn-ir-desenho"
              onClick={() => navigate(`/app/diagnosticos/${id}/desenho`)}
            >
              Ir para Desenho
            </button>
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  )
}

export default DetalhamentoProfissional

