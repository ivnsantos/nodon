import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, faFileMedical, faCheck, faFileAlt, faTooth,
  faDownload
} from '@fortawesome/free-solid-svg-icons'
import jsPDF from 'jspdf'
import exameImage from '../img/exame.jpg'
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
  const [detalhamento, setDetalhamento] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDetalhamento()
  }, [id])

  const loadDetalhamento = async () => {
    try {
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
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      
      // Título
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Detalhamento Profissional', margin, margin + 10)
      
      let yPosition = margin + 20
      
      // Carregar e adicionar a imagem da radiografia
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Calcular dimensões da imagem para caber na página
            const maxWidth = contentWidth
            const maxHeight = 100 // Altura máxima para a imagem
            let imgWidth = img.width
            let imgHeight = img.height
            const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
            imgWidth = imgWidth * ratio
            imgHeight = imgHeight * ratio
            
            // Adicionar imagem ao PDF
            pdf.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight)
            yPosition += imgHeight + 10
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        img.onerror = reject
        img.src = detalhamento.radiografia
      })
      
      // Adicionar linha separadora
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
      
      // Dentes Marcados
      if (detalhamento.dentes && detalhamento.dentes.length > 0) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Dentes Marcados:', margin, yPosition)
        yPosition += 8
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        detalhamento.dentes.forEach((dente, index) => {
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 30) {
            pdf.addPage()
            yPosition = margin
          }
          
          // Número do dente em negrito
          pdf.setFont('helvetica', 'bold')
          pdf.text(`Dente ${dente.numero}:`, margin, yPosition)
          
          // Descrição do dente
          pdf.setFont('helvetica', 'normal')
          const descricaoLines = pdf.splitTextToSize(dente.descricao || `Dente ${dente.numero} selecionado`, contentWidth)
          pdf.text(descricaoLines, margin + 5, yPosition + 5)
          yPosition += (descricaoLines.length * 5) + 5
        })
        
        yPosition += 5
      }
      
      // Observações Gerais
      if (detalhamento.observacoes) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = margin
        }
        
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Observações Gerais:', margin, yPosition)
        yPosition += 8
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const observacoesLines = pdf.splitTextToSize(detalhamento.observacoes, contentWidth)
        pdf.text(observacoesLines, margin, yPosition)
        yPosition += (observacoesLines.length * 5) + 10
      }
      
      // Rodapé com data
      const dataAtual = new Date().toLocaleDateString('pt-BR')
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Gerado em: ${dataAtual}`, margin, pageHeight - 10)
      
      // Salvar PDF
      pdf.save(`detalhamento_profissional_${id}_${Date.now()}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
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
            {/* Marcadores dos dentes */}
            {detalhamento.dentes.map((dente, index) => (
              <div
                key={index}
                className="dente-marcador"
                style={{
                  top: dente.posicao?.top || '50%',
                  left: dente.posicao?.left || '50%'
                }}
                title={`Dente ${dente.numero}`}
              >
                <div className="marcador-ponto"></div>
                <div className="marcador-numero">{dente.numero}</div>
              </div>
            ))}
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
    </div>
  )
}

export default DetalhamentoProfissional

