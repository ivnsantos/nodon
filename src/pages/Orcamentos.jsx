import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileInvoiceDollar, faPlus, faSearch, faFilter,
  faEye, faEdit, faTrash, faChevronDown, faCheck,
  faTimes, faCalendarAlt, faUser, faDollarSign, faChartBar, faList,
  faCheckCircle, faDownload, faTrophy, faStar, faMedkit
} from '@fortawesome/free-solid-svg-icons'
import jsPDF from 'jspdf'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './Orcamentos.css'

const Orcamentos = () => {
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  
  const { alertConfig, showError, showSuccess, hideAlert } = useAlert()
  
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orcamentoToDelete, setOrcamentoToDelete] = useState(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef(null)
  const [orcamentoStatusDropdowns, setOrcamentoStatusDropdowns] = useState({})
  const [itemStatusDropdowns, setItemStatusDropdowns] = useState({})
  const [showStatusModal, setShowStatusModal] = useState(null) // null ou orcamentoId
  const [showItemStatusModal, setShowItemStatusModal] = useState(null) // null ou {orcamentoId, itemIndex}
  const [showTratamentosModal, setShowTratamentosModal] = useState(false)
  const [tratamentosModalData, setTratamentosModalData] = useState(null)
  const orcamentoStatusRefs = useRef({})
  const itemStatusRefs = useRef({})

  // Estados para gráficos
  const [activeTab, setActiveTab] = useState('lista') // 'lista' ou 'graficos'
  const [activeGraficoTab, setActiveGraficoTab] = useState('geral') // 'geral', 'mensal' ou 'lista'
  const [dadosGerais, setDadosGerais] = useState(null)
  const [dadosMensais, setDadosMensais] = useState(null)
  const [dadosItensPagos, setDadosItensPagos] = useState(null)
  const [loadingGraficos, setLoadingGraficos] = useState(false)
  const [porcentagensLucro, setPorcentagensLucro] = useState({}) // { 'orcamentoId-itemId': porcentagem }
  const [porcentagemGlobal, setPorcentagemGlobal] = useState(30) // Porcentagem global para itens sem tratamentoId (pode ser number ou '' temporariamente)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const statusOptions = [
    { value: 'all', label: 'Todos os Status', color: '#9ca3af' },
    { value: 'RASCUNHO', label: 'Rascunho', color: '#6b7280' },
    { value: 'ENVIADO', label: 'Enviado', color: '#0ea5e9' },
    { value: 'ACEITO', label: 'Aceito', color: '#10b981' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: '#f59e0b' },
    { value: 'FINALIZADO', label: 'Finalizado', color: '#8b5cf6' },
    { value: 'RECUSADO', label: 'Recusado', color: '#ef4444' },
    { value: 'CANCELADO', label: 'Cancelado', color: '#6b7280' }
  ]

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Não fechar se algum modal estiver aberto
      if (showStatusModal !== null || showItemStatusModal !== null) return
      
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false)
      }
      
      // Fechar dropdowns de status de orçamento
      Object.keys(orcamentoStatusDropdowns).forEach(orcamentoId => {
        const ref = orcamentoStatusRefs.current[orcamentoId]
        if (ref && !ref.contains(event.target)) {
          setOrcamentoStatusDropdowns(prev => {
            const newState = { ...prev }
            delete newState[orcamentoId]
            return newState
          })
        }
      })
      
      // Fechar dropdowns de status de itens
      Object.keys(itemStatusDropdowns).forEach(key => {
        const ref = itemStatusRefs.current[key]
        if (ref && !ref.contains(event.target)) {
          setItemStatusDropdowns(prev => {
            const newState = { ...prev }
            delete newState[key]
            return newState
          })
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [orcamentoStatusDropdowns, itemStatusDropdowns, showStatusModal, showItemStatusModal])

  // Carregar orçamentos
  const fetchOrcamentos = async () => {
    try {
      setLoading(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setOrcamentos([])
        setLoading(false)
        return
      }

      const params = new URLSearchParams({ clienteMasterId })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await api.get(`/orcamentos?${params.toString()}`)
      const data = response.data?.data || response.data || []
      
      setOrcamentos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      showError('Erro ao carregar orçamentos. Tente novamente.')
      setOrcamentos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClinicData) {
      fetchOrcamentos()
    }
  }, [selectedClinicData, statusFilter])

  // Carregar dados gerais dos gráficos
  const fetchDadosGerais = async () => {
    try {
      setLoadingGraficos(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoadingGraficos(false)
        return
      }

      const response = await api.get('/orcamentos/dados-gerais', {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })
      
      // A API retorna os dados dentro de data.data
      const dados = response.data?.data || response.data
      console.log('Dados gerais recebidos:', dados)
      console.log('Tratamentos:', dados?.tratamentos)
      setDadosGerais(dados)
    } catch (error) {
      console.error('Erro ao carregar dados gerais:', error)
      showError('Erro ao carregar dados dos gráficos. Tente novamente.')
    } finally {
      setLoadingGraficos(false)
    }
  }

  // Carregar dados mensais dos gráficos
  const fetchDadosMensais = async (mes) => {
    try {
      setLoadingGraficos(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoadingGraficos(false)
        return
      }

      const response = await api.get(`/orcamentos/graficos-mensais?mes=${mes}`, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })
      
      // A API retorna os dados dentro de data.data
      setDadosMensais(response.data?.data || response.data)
    } catch (error) {
      console.error('Erro ao carregar dados mensais:', error)
      showError('Erro ao carregar dados mensais. Tente novamente.')
    } finally {
      setLoadingGraficos(false)
    }
  }

  // Carregar dados gerais quando mudar para aba de gráficos e selecionar aba geral
  useEffect(() => {
    if (activeTab === 'graficos' && activeGraficoTab === 'geral' && selectedClinicData && !dadosGerais) {
      fetchDadosGerais()
    }
  }, [activeTab, activeGraficoTab, selectedClinicData])

  // Carregar dados mensais quando selecionar aba mensal e mês
  useEffect(() => {
    if (activeTab === 'graficos' && activeGraficoTab === 'mensal' && selectedClinicData && selectedMonth) {
      fetchDadosMensais(selectedMonth)
    }
  }, [selectedMonth, activeTab, activeGraficoTab, selectedClinicData])

  // Carregar dados de itens pagos quando selecionar aba lista
  const fetchItensPagos = async (mes) => {
    try {
      setLoadingGraficos(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        console.error('clienteMasterId não encontrado')
        setLoadingGraficos(false)
        return
      }

      // Extrair mês e ano do formato YYYY-MM
      const [ano, mesNum] = mes.split('-')
      
      const response = await api.get(`/orcamentos/itens-pagos?mes=${mesNum}&ano=${ano}`, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })
      
      // A API retorna os dados dentro de data.data
      setDadosItensPagos(response.data?.data || response.data)
    } catch (error) {
      console.error('Erro ao carregar itens pagos:', error)
      showError('Erro ao carregar lista de itens pagos. Tente novamente.')
      setDadosItensPagos(null)
    } finally {
      setLoadingGraficos(false)
    }
  }

  // Carregar dados de itens pagos quando selecionar aba lista e mês
  useEffect(() => {
    if (activeTab === 'graficos' && activeGraficoTab === 'lista' && selectedClinicData && selectedMonth) {
      fetchItensPagos(selectedMonth)
    }
  }, [selectedMonth, activeTab, activeGraficoTab, selectedClinicData])

  // Filtrar orçamentos por busca
  const filteredOrcamentos = orcamentos.filter(orcamento => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    const pacienteNome = orcamento.paciente?.nome?.toLowerCase() || ''
    const observacoes = orcamento.observacoes?.toLowerCase() || ''
    
    return pacienteNome.includes(searchLower) || observacoes.includes(searchLower)
  })

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Gerar PDF da lista de itens pagos
  const gerarPDF = () => {
    if (!dadosItensPagos || !dadosItensPagos.orcamentos) {
      showError('Não há dados para gerar o PDF')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20
    const margin = 15
    const lineHeight = 7
    const tableLineHeight = 6.5

    // Paleta de cores profissional
    const corPrimaria = [14, 165, 233] // Azul principal
    const corPrimariaEscura = [8, 120, 180] // Azul escuro
    const corSecundaria = [16, 185, 129] // Verde
    const corSecundariaEscura = [12, 140, 95] // Verde escuro
    const corTexto = [30, 30, 30] // Preto suave
    const corTextoClaro = [100, 100, 100] // Cinza médio
    const corCinzaClaro = [240, 242, 245] // Cinza muito claro
    const corCinzaMedio = [220, 223, 230] // Cinza médio
    const corBranco = [255, 255, 255]

    // Data do mês selecionado
    const [ano, mes] = selectedMonth.split('-')
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    const mesNome = meses[parseInt(mes) - 1]

    // Função para adicionar cabeçalho de página com gradiente
    const adicionarCabecalho = () => {
      // Fundo com gradiente simulado (camadas)
      doc.setFillColor(...corPrimariaEscura)
      doc.rect(0, 0, pageWidth, 35, 'F')
      
      // Linha decorativa
      doc.setFillColor(...corSecundaria)
      doc.rect(0, 33, pageWidth, 2, 'F')
      
      // Título principal
      doc.setTextColor(...corBranco)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('RELATÓRIO DE ITENS PAGOS', pageWidth / 2, 18, { align: 'center' })
      
      // Subtítulo
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(240, 240, 240)
      doc.text(`${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)} de ${ano}`, pageWidth / 2, 28, { align: 'center' })
      
      // Linha decorativa inferior
      doc.setDrawColor(...corPrimariaEscura)
      doc.setLineWidth(0.5)
      doc.line(margin, 35, pageWidth - margin, 35)
      
      doc.setTextColor(...corTexto)
    }

    // Função para adicionar rodapé profissional
    const adicionarRodape = (pageNum, totalPages) => {
      const footerY = pageHeight - 12
      
      // Linha superior do rodapé
      doc.setDrawColor(...corCinzaMedio)
      doc.setLineWidth(0.3)
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
      
      // Informações do rodapé
      doc.setFontSize(8)
      doc.setTextColor(...corTextoClaro)
      doc.setFont('helvetica', 'normal')
      
      const dataHora = new Date()
      const dataFormatada = dataHora.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
      const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, footerY, { align: 'center' })
      doc.text(`Gerado em ${dataFormatada} às ${horaFormatada}`, pageWidth / 2, footerY + 4, { align: 'center' })
    }

    // Calcular lucro total estimado
    let lucroTotalEstimado = 0
    dadosItensPagos.orcamentos.forEach((orc) => {
      orc.itensPagos.forEach((item, idx) => {
        const itemKey = `${orc.id}-${item.id || idx}`
        const precoUnitario = item.preco || 0
        const temTratamento = item.tratamentoId !== null && item.tratamentoId !== undefined
        
        let porcentagemCalculada = null
        if (temTratamento && item.tratamento && item.tratamento.custo !== undefined && precoUnitario > 0) {
          const lucroReal = precoUnitario - item.tratamento.custo
          porcentagemCalculada = parseFloat(((lucroReal / precoUnitario) * 100).toFixed(2))
        }
        
        const porcentagemGlobalNum = typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30
        const porcentagemAtual = temTratamento 
          ? porcentagemCalculada
          : (porcentagensLucro[itemKey] !== undefined ? porcentagensLucro[itemKey] : porcentagemGlobalNum)
        
        const totalLucro = porcentagemAtual ? (precoUnitario * porcentagemAtual) / 100 : 0
        lucroTotalEstimado += totalLucro
      })
    })

    adicionarCabecalho()
    yPos = 45

    // Card de Resumo profissional com sombra
    doc.setFillColor(...corCinzaClaro)
    doc.setDrawColor(...corCinzaMedio)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 55, 4, 4, 'FD')
    
    // Barra lateral colorida
    doc.setFillColor(...corPrimaria)
    doc.rect(margin, yPos, 4, 55, 'F')
    
    // Título do resumo
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corPrimariaEscura)
    doc.text('RESUMO EXECUTIVO', margin + 10, yPos + 10)
    
    // Linha decorativa
    doc.setDrawColor(...corPrimaria)
    doc.setLineWidth(0.5)
    doc.line(margin + 10, yPos + 12, margin + 70, yPos + 12)
    
    yPos += 18
    doc.setFontSize(9.5)
    doc.setTextColor(...corTexto)
    doc.setFont('helvetica', 'normal')
    
    const resumoX1 = margin + 12
    const resumoX2 = pageWidth / 2 + 5
    const resumoY = yPos
    
    // Coluna esquerda
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...corTextoClaro)
    doc.text(`Orçamentos:`, resumoX1, resumoY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corTexto)
    doc.text(`${dadosItensPagos.resumo?.quantidadeOrcamentos || 0}`, resumoX1 + 38, resumoY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...corTextoClaro)
    doc.text(`Itens Pagos:`, resumoX1, resumoY + lineHeight + 1)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corTexto)
    doc.text(`${dadosItensPagos.resumo?.quantidadeItensPagos || 0}`, resumoX1 + 38, resumoY + lineHeight + 1)
    
    // Coluna direita
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...corTextoClaro)
    doc.text(`Valor Bruto Total:`, resumoX2, resumoY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corSecundariaEscura)
    doc.text(formatCurrency(dadosItensPagos.resumo?.valorBrutoTotalGeral || 0), resumoX2 + 48, resumoY)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...corTextoClaro)
    doc.text(`Lucro Total Estimado:`, resumoX2, resumoY + lineHeight + 1)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corSecundariaEscura)
    doc.text(formatCurrency(lucroTotalEstimado), resumoX2 + 52, resumoY + lineHeight + 1)
    
    yPos += 40

    // Card de Porcentagem Global
    const porcentagemGlobalNum = typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30
    doc.setFillColor(255, 251, 235)
    doc.setDrawColor(255, 235, 180)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 15, 3, 3, 'FD')
    
    // Ícone visual (círculo)
    doc.setFillColor(...corPrimaria)
    doc.circle(margin + 8, yPos + 7.5, 4, 'F')
    
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...corTexto)
    doc.text(`% Lucro Global aplicado (itens sem tratamento):`, margin + 16, yPos + 9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corPrimariaEscura)
    doc.text(`${porcentagemGlobalNum}%`, margin + 105, yPos + 9)
    
    yPos += 22

    // Lista de Orçamentos
    dadosItensPagos.orcamentos.forEach((orcamento, orcIndex) => {
      // Verificar se precisa de nova página
      if (yPos > pageHeight - 70) {
        doc.addPage()
        adicionarCabecalho()
        yPos = 45
      }

      // Card do Orçamento com design profissional
      doc.setFillColor(...corBranco)
      doc.setDrawColor(...corCinzaMedio)
      doc.setLineWidth(0.4)
      const cardHeight = 85 + (orcamento.itensPagos?.length || 0) * tableLineHeight + 25
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), cardHeight, 4, 4, 'FD')
      
      // Cabeçalho do Card com gradiente
      doc.setFillColor(...corPrimariaEscura)
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 18, 4, 4, 'F')
      
      // Linha decorativa
      doc.setFillColor(...corSecundaria)
      doc.rect(margin, yPos + 16, pageWidth - (margin * 2), 2, 'F')
      
      doc.setTextColor(...corBranco)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`ORÇAMENTO #${orcIndex + 1}`, margin + 8, yPos + 12)
      
      yPos += 23

      // Informações do Orçamento em grid profissional
      doc.setTextColor(...corTexto)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const infoX1 = margin + 8
      const infoX2 = pageWidth / 2 + 5
      const infoSpacing = lineHeight + 2
      
      // Linha 1 - Paciente e Status
      doc.setTextColor(...corTextoClaro)
      doc.text(`Paciente:`, infoX1, yPos)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...corTexto)
      doc.text(`${(orcamento.paciente?.nome || 'Não informado').substring(0, 30)}`, infoX1 + 22, yPos)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...corTextoClaro)
      doc.text(`Status:`, infoX2, yPos)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...corPrimariaEscura)
      doc.text(`${getStatusLabel(orcamento.status)}`, infoX2 + 20, yPos)
      
      // Linha 2 - Data e Valor Bruto
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...corTextoClaro)
      doc.text(`Data:`, infoX1, yPos + infoSpacing)
      doc.setTextColor(...corTexto)
      doc.text(`${formatDate(orcamento.createdAt)}`, infoX1 + 17, yPos + infoSpacing)
      
      doc.setTextColor(...corTextoClaro)
      doc.text(`Valor Bruto:`, infoX2, yPos + infoSpacing)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...corSecundariaEscura)
      doc.text(formatCurrency(orcamento.valorBrutoTotal || 0), infoX2 + 32, yPos + infoSpacing)
      
      yPos += 22
      
      // Linha separadora
      doc.setDrawColor(...corCinzaMedio)
      doc.setLineWidth(0.2)
      doc.line(margin + 5, yPos - 2, pageWidth - margin - 5, yPos - 2)
      yPos += 5

      // Tabela de Itens profissional
      if (orcamento.itensPagos && orcamento.itensPagos.length > 0) {
        doc.setTextColor(...corTexto)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...corPrimariaEscura)
        doc.text('ITENS PAGOS', margin + 8, yPos)
        yPos += 8

        // Cabeçalho da tabela com estilo profissional
        doc.setFillColor(...corPrimariaEscura)
        doc.roundedRect(margin + 5, yPos - 6, pageWidth - (margin * 2) - 10, 9, 2, 2, 'F')
        
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...corBranco)
        let xPos = margin + 8
        doc.text('ITEM', xPos, yPos)
        xPos += 70
        doc.text('PREÇO UNIT.', xPos, yPos)
        xPos += 38
        doc.text('% LUCRO', xPos, yPos)
        xPos += 28
        doc.text('TOTAL LUCRO', xPos, yPos)
        yPos += 8

        // Linha separadora
        doc.setDrawColor(...corPrimariaEscura)
        doc.setLineWidth(0.4)
        doc.line(margin + 5, yPos - 1, pageWidth - margin - 5, yPos - 1)
        yPos += 4

        // Itens da tabela com estilo profissional
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        
        orcamento.itensPagos.forEach((item, index) => {
          // Verificar se precisa de nova página
          if (yPos > pageHeight - 50) {
            doc.addPage()
            adicionarCabecalho()
            yPos = 45
          }

          const itemKey = `${orcamento.id}-${item.id || index}`
          const precoUnitario = item.preco || 0
          const temTratamento = item.tratamentoId !== null && item.tratamentoId !== undefined
          
          let porcentagemCalculada = null
          if (temTratamento && item.tratamento && item.tratamento.custo !== undefined && precoUnitario > 0) {
            const lucroReal = precoUnitario - item.tratamento.custo
            porcentagemCalculada = parseFloat(((lucroReal / precoUnitario) * 100).toFixed(2))
          }
          
          const porcentagemGlobalNum = typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30
          const porcentagemAtual = temTratamento 
            ? porcentagemCalculada
            : (porcentagensLucro[itemKey] !== undefined ? porcentagensLucro[itemKey] : porcentagemGlobalNum)
          
          const totalLucro = porcentagemAtual ? (precoUnitario * porcentagemAtual) / 100 : 0

          // Linha alternada com cores suaves
          if (index % 2 === 0) {
            doc.setFillColor(250, 251, 253)
            doc.rect(margin + 5, yPos - 4, pageWidth - (margin * 2) - 10, tableLineHeight + 1, 'F')
          } else {
            doc.setFillColor(...corBranco)
            doc.rect(margin + 5, yPos - 4, pageWidth - (margin * 2) - 10, tableLineHeight + 1, 'F')
          }

          xPos = margin + 8
          doc.setTextColor(...corTexto)
          doc.text(item.nome.substring(0, 32), xPos, yPos)
          xPos += 70
          doc.setTextColor(...corTextoClaro)
          doc.text(formatCurrency(precoUnitario), xPos, yPos)
          xPos += 38
          doc.setTextColor(...corTexto)
          doc.text(`${porcentagemAtual ? porcentagemAtual.toFixed(2) : '0.00'}%`, xPos, yPos)
          xPos += 28
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...corSecundariaEscura)
          doc.text(formatCurrency(totalLucro), xPos, yPos)
          doc.setFont('helvetica', 'normal')
          
          // Linha separadora sutil entre itens
          if (index < orcamento.itensPagos.length - 1) {
            doc.setDrawColor(240, 240, 240)
            doc.setLineWidth(0.1)
            doc.line(margin + 5, yPos + 2, pageWidth - margin - 5, yPos + 2)
          }
          
          yPos += tableLineHeight + 1
        })

        // Linha final da tabela
        doc.setDrawColor(...corPrimariaEscura)
        doc.setLineWidth(0.5)
        doc.line(margin + 5, yPos - 1, pageWidth - margin - 5, yPos - 1)
        yPos += 6

        // Total do orçamento com destaque
        doc.setFillColor(245, 250, 255)
        doc.roundedRect(margin + 5, yPos - 3, pageWidth - (margin * 2) - 10, 10, 2, 2, 'F')
        
        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...corTexto)
        const totalX = pageWidth - margin - 8
        doc.text('TOTAL DO ORÇAMENTO:', totalX - 65, yPos + 4)
        doc.setFontSize(10)
        doc.setTextColor(...corSecundariaEscura)
        doc.text(formatCurrency(orcamento.lucroTotal || 0), totalX - 3, yPos + 4, { align: 'right' })
        
        yPos += 18
      }
    })

    // Adicionar rodapé em todas as páginas
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      adicionarRodape(i, totalPages)
    }

    // Nome do arquivo
    const nomeArquivo = `itens-pagos-${mesNome}-${ano}.pdf`
    doc.save(nomeArquivo)
    showSuccess('PDF gerado com sucesso!')
  }

  // Obter cor do status
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.color || '#9ca3af'
  }

  // Obter label do status
  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption?.label || status
  }

  // Funções para status dos itens
  const getItemStatusColor = (status) => {
    const colors = {
      'EM_ANALISE': '#0ea5e9',
      'PAGO': '#10b981',
      'RECUSADO': '#ef4444',
      'PERDIDO': '#6b7280'
    }
    return colors[status] || '#9ca3af'
  }

  const getItemStatusLabel = (status) => {
    const labels = {
      'EM_ANALISE': 'Em Análise',
      'PAGO': 'Pago',
      'RECUSADO': 'Recusado',
      'PERDIDO': 'Perdido'
    }
    return labels[status] || status
  }

  // Deletar orçamento
  const handleDeleteClick = (orcamento) => {
    setOrcamentoToDelete(orcamento)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!orcamentoToDelete) return

    try {
      await api.delete(`/orcamentos/${orcamentoToDelete.id}`)
      showSuccess('Orçamento excluído com sucesso!')
      setShowDeleteModal(false)
      setOrcamentoToDelete(null)
      fetchOrcamentos()
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao excluir orçamento. Tente novamente.')
      setShowDeleteModal(false)
      setOrcamentoToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setOrcamentoToDelete(null)
  }

  const handleUpdateOrcamentoStatus = async (orcamentoId, newStatus) => {
    // Fechar dropdown e modal imediatamente
    setOrcamentoStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[orcamentoId]
      return newState
    })
    setShowStatusModal(null)

    try {
      const orcamento = orcamentos.find(o => o.id === orcamentoId)
      if (!orcamento || orcamento.status === newStatus) return

      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      const payload = {
        status: newStatus,
        pacienteId: orcamento.pacienteId
      }

      await api.patch(`/orcamentos/${orcamentoId}`, payload, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      setOrcamentos(prev => prev.map(o => 
        o.id === orcamentoId 
          ? { ...o, status: newStatus }
          : o
      ))
    } catch (error) {
      console.error('Erro ao atualizar status do orçamento:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do orçamento. Tente novamente.')
    }
  }

  const handleUpdateItemStatus = async (orcamentoId, itemIndex, newStatus) => {
    const key = `${orcamentoId}-${itemIndex}`
    // Fechar dropdown e modal imediatamente
    setItemStatusDropdowns(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
    setShowItemStatusModal(null)

    try {
      const orcamento = orcamentos.find(o => o.id === orcamentoId)
      if (!orcamento || !orcamento.itens) return

      const item = orcamento.itens[itemIndex]
      if (!item || item.status === newStatus) return

      if (!item.id) {
        showError('ID do item não encontrado')
        return
      }

      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        return
      }

      // Usar o endpoint específico para atualizar status do item
      const payload = {
        status: newStatus
      }

      await api.patch(`/orcamentos/${orcamentoId}/itens/${item.id}/status`, payload, {
        headers: {
          'X-Cliente-Master-Id': clienteMasterId
        }
      })

      // Atualizar estado local
      const updatedItens = orcamento.itens.map((it, idx) => 
        idx === itemIndex ? { ...it, status: newStatus } : it
      )

      setOrcamentos(prev => prev.map(o => 
        o.id === orcamentoId 
          ? { ...o, itens: updatedItens }
          : o
      ))
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error)
      showError(error.response?.data?.message || 'Erro ao atualizar status do item. Tente novamente.')
    }
  }

  const itemStatusOptions = [
    { value: 'EM_ANALISE', label: 'Em Análise' },
    { value: 'PAGO', label: 'Pago' },
    { value: 'RECUSADO', label: 'Recusado' },
    { value: 'PERDIDO', label: 'Perdido' }
  ]

  // Preparar dados para gráficos
  const prepararDadosOrcamentosPorStatus = () => {
    if (!dadosGerais?.orcamentos?.porStatus) return []
    
    const statusLabels = {
      'RASCUNHO': 'Rascunho',
      'ENVIADO': 'Enviado',
      'EM_ANDAMENTO': 'Em Andamento',
      'ACEITO': 'Aceito',
      'RECUSADO': 'Recusado',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado'
    }

    return Object.entries(dadosGerais.orcamentos.porStatus)
      .filter(([status, quantidade]) => quantidade > 0) // Filtrar status zerados
      .map(([status, quantidade]) => ({
        name: statusLabels[status] || status,
        quantidade,
        valor: dadosGerais.orcamentos.valorPorStatus?.[status] || 0
      }))
  }

  const prepararDadosItensPorStatus = () => {
    if (!dadosGerais?.itens?.porStatus) return []
    
    const statusLabels = {
      'EM_ANALISE': 'Em Análise',
      'PAGO': 'Pago',
      'RECUSADO': 'Recusado',
      'PERDIDO': 'Perdido'
    }

    return Object.entries(dadosGerais.itens.porStatus)
      .filter(([status, quantidade]) => quantidade > 0) // Filtrar status zerados
      .map(([status, quantidade]) => ({
        name: statusLabels[status] || status,
        quantidade,
        valor: dadosGerais.itens.valorPorStatus?.[status] || 0
      }))
  }


  const prepararDadosMensaisOrcamentos = () => {
    if (!dadosMensais?.graficos?.orcamentosPorStatus) return []
    
    const statusLabels = {
      'RASCUNHO': 'Rascunho',
      'ENVIADO': 'Enviado',
      'EM_ANDAMENTO': 'Em Andamento',
      'ACEITO': 'Aceito',
      'RECUSADO': 'Recusado',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado'
    }

    return Object.entries(dadosMensais.graficos.orcamentosPorStatus)
      .filter(([status, quantidade]) => quantidade > 0) // Filtrar status zerados
      .map(([status, quantidade]) => ({
        name: statusLabels[status] || status,
        quantidade,
        valor: dadosMensais.graficos.valorPorStatusOrcamento?.[status] || 0
      }))
  }

  const prepararDadosMensaisItens = () => {
    if (!dadosMensais?.graficos?.itensPorStatus) return []
    
    const statusLabels = {
      'EM_ANALISE': 'Em Análise',
      'PAGO': 'Pago',
      'RECUSADO': 'Recusado',
      'PERDIDO': 'Perdido'
    }

    return Object.entries(dadosMensais.graficos.itensPorStatus)
      .filter(([status, quantidade]) => quantidade > 0) // Filtrar status zerados
      .map(([status, quantidade]) => ({
        name: statusLabels[status] || status,
        quantidade,
        valor: dadosMensais.graficos.valorPorStatusItens?.[status] || 0
      }))
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#ec4899']

  if (loading) {
    return (
      <div className="orcamentos-loading">
        <div className="loading-spinner"></div>
        <p>Carregando orçamentos...</p>
      </div>
    )
  }

  return (
    <div className="orcamentos-modern">
      <AlertModal {...alertConfig} onClose={hideAlert} />

      {/* Header */}
      <div className="orcamentos-header">
        <div>
          <h2>
            <FontAwesomeIcon icon={faFileInvoiceDollar} /> Orçamentos
          </h2>
          <p>Gerencie orçamentos de tratamentos para seus pacientes</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div className="orcamentos-tabs">
            <button
              className={`tab-btn ${activeTab === 'lista' ? 'active' : ''}`}
              onClick={() => setActiveTab('lista')}
            >
              <FontAwesomeIcon icon={faList} /> Lista
            </button>
            <button
              className={`tab-btn ${activeTab === 'graficos' ? 'active' : ''}`}
              onClick={() => setActiveTab('graficos')}
            >
              <FontAwesomeIcon icon={faChartBar} /> Faturamento
            </button>
          </div>
          {activeTab === 'lista' && (
            <button 
              className="btn-orcamentos-primary"
              onClick={() => navigate('/app/orcamentos/novo')}
            >
              <FontAwesomeIcon icon={faPlus} /> Novo Orçamento
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo baseado na aba ativa */}
      {activeTab === 'graficos' ? (
        <div className="graficos-container">
          {/* Tabs internas para gráficos */}
          <div className="graficos-tabs-internas">
            <button
              className={`grafico-tab-btn ${activeGraficoTab === 'geral' ? 'active' : ''}`}
              onClick={() => setActiveGraficoTab('geral')}
            >
              <FontAwesomeIcon icon={faChartBar} /> Geral
            </button>
            <button
              className={`grafico-tab-btn ${activeGraficoTab === 'mensal' ? 'active' : ''}`}
              onClick={() => setActiveGraficoTab('mensal')}
            >
              <FontAwesomeIcon icon={faCalendarAlt} /> Mensal
            </button>
            <button
              className={`grafico-tab-btn ${activeGraficoTab === 'lista' ? 'active' : ''}`}
              onClick={() => setActiveGraficoTab('lista')}
            >
              <FontAwesomeIcon icon={faList} /> Lista
            </button>
          </div>

          {loadingGraficos ? (
            <div className="orcamentos-loading">
              <div className="loading-spinner"></div>
              <p>Carregando gráficos...</p>
            </div>
          ) : (
            <>
              {/* Aba Geral */}
              {activeGraficoTab === 'geral' && (
                <>
                  {dadosGerais ? (
                    <div className="graficos-section">
                  
                  {/* Cards de Resumo */}
                  <div className="graficos-resumo-cards">
                    <div className="resumo-card">
                      <div className="resumo-card-icon" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0ea5e9' }} />
                      </div>
                      <div className="resumo-card-content">
                        <div className="resumo-card-label">Total de Orçamentos</div>
                        <div className="resumo-card-value">{dadosGerais.orcamentos?.total || 0}</div>
                        <div className="resumo-card-subvalue">
                          Valor Total: {formatCurrency(dadosGerais.orcamentos?.valorTotal || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="resumo-card">
                      <div className="resumo-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                      </div>
                      <div className="resumo-card-content">
                        <div className="resumo-card-label">Valor Médio</div>
                        <div className="resumo-card-value">{formatCurrency(dadosGerais.orcamentos?.valorMedio || 0)}</div>
                        <div className="resumo-card-subvalue">
                          Taxa de Conversão: {dadosGerais.orcamentos?.taxaConversao?.toFixed(2) || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="resumo-card">
                      <div className="resumo-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#f59e0b' }} />
                      </div>
                      <div className="resumo-card-content">
                        <div className="resumo-card-label">Total de Itens</div>
                        <div className="resumo-card-value">{dadosGerais.itens?.total || 0}</div>
                        <div className="resumo-card-subvalue">
                          Valor Total: {formatCurrency(dadosGerais.itens?.valorTotal || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="resumo-card">
                      <div className="resumo-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#8b5cf6' }} />
                      </div>
                      <div className="resumo-card-content">
                        <div className="resumo-card-label">Taxa de Aprovação</div>
                        <div className="resumo-card-value">{dadosGerais.itens?.taxaPagamento?.toFixed(2) || 0}%</div>
                        <div className="resumo-card-subvalue">
                          Valor Médio: {formatCurrency(dadosGerais.itens?.valorMedio || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção de Tratamentos */}
                  {dadosGerais.tratamentos && (
                    <div className="tratamentos-container">
                      {/* Tratamento Mais Vendido */}
                      {dadosGerais.tratamentos.maisVendido && !isMobile && (
                        <div className="tratamento-mais-vendido-card">
                          <div className="tratamento-mais-vendido-header">
                            <div className="tratamento-mais-vendido-icon">
                              <FontAwesomeIcon icon={faTrophy} />
                            </div>
                            <h4 className="tratamento-mais-vendido-title">Tratamento Mais Vendido</h4>
                          </div>
                          <div className="tratamento-mais-vendido-content">
                            <div className="tratamento-mais-vendido-name">
                              {dadosGerais.tratamentos.maisVendido.name}
                            </div>
                            <div className="tratamento-mais-vendido-stats">
                              <div className="tratamento-stat">
                                <span className="tratamento-stat-label">Quantidade:</span>
                                <span className="tratamento-stat-value">{dadosGerais.tratamentos.maisVendido.quantidade}</span>
                              </div>
                              <div className="tratamento-stat highlight">
                                <span className="tratamento-stat-label">Valor Total:</span>
                                <span className="tratamento-stat-value">{formatCurrency(dadosGerais.tratamentos.maisVendido.valorTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Top Tratamentos */}
                      {dadosGerais.tratamentos.topTratamentos && dadosGerais.tratamentos.topTratamentos.length > 0 && (
                        <div className="top-tratamentos-section">
                          <div className="top-tratamentos-header">
                            <h4 className="top-tratamentos-title">
                              <FontAwesomeIcon icon={faStar} /> Top Tratamentos
                            </h4>
                            {dadosGerais.tratamentos.topTratamentos.length > 3 && (
                              <button 
                                className="btn-ver-mais-tratamentos"
                                onClick={() => {
                                  setTratamentosModalData(dadosGerais.tratamentos.topTratamentos)
                                  setShowTratamentosModal(true)
                                }}
                              >
                                Ver todos ({dadosGerais.tratamentos.topTratamentos.length})
                              </button>
                            )}
                          </div>
                          <div className="top-tratamentos-list">
                            {dadosGerais.tratamentos.topTratamentos.slice(0, 3).map((tratamento, index) => (
                              <div key={tratamento.id || index} className="top-tratamento-item">
                                <div className="top-tratamento-rank">
                                  <span className="rank-number">{index + 1}</span>
                                  <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                                </div>
                                <div className="top-tratamento-info">
                                  <div className="top-tratamento-name">{tratamento.name}</div>
                                  <div className="top-tratamento-details">
                                    <span className="top-tratamento-quantidade">
                                      {tratamento.quantidade} vendas
                                    </span>
                                    <span className="top-tratamento-valor">
                                      {formatCurrency(tratamento.valorTotal)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gráficos de Orçamentos */}
                  <div className="graficos-grid">
                    <div className="grafico-card">
                      <h4 className="grafico-card-title">Orçamentos por Status</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepararDadosOrcamentosPorStatus()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantidade" fill="#0ea5e9" name="Quantidade" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grafico-card">
                      <h4 className="grafico-card-title">Valor por Status (Orçamentos)</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepararDadosOrcamentosPorStatus()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="valor" fill="#10b981" name="Valor (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grafico-card">
                      <h4 className="grafico-card-title">Itens por Status</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={prepararDadosItensPorStatus()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="quantidade"
                          >
                            {prepararDadosItensPorStatus().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grafico-card">
                      <h4 className="grafico-card-title">Valor por Status (Itens)</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepararDadosItensPorStatus()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="valor" fill="#f59e0b" name="Valor (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Seção de Tratamentos */}
                  {dadosGerais.tratamentos && (
                    <div className="tratamentos-container">
                      {/* Tratamento Mais Vendido */}
                      {dadosGerais.tratamentos.maisVendido && !isMobile && (
                        <div className="tratamento-mais-vendido-card">
                          <div className="tratamento-mais-vendido-header">
                            <div className="tratamento-mais-vendido-icon">
                              <FontAwesomeIcon icon={faTrophy} />
                            </div>
                            <h4 className="tratamento-mais-vendido-title">Tratamento Mais Vendido</h4>
                          </div>
                          <div className="tratamento-mais-vendido-content">
                            <div className="tratamento-mais-vendido-name">
                              {dadosGerais.tratamentos.maisVendido.name}
                            </div>
                            <div className="tratamento-mais-vendido-stats">
                              <div className="tratamento-stat">
                                <span className="tratamento-stat-label">Quantidade:</span>
                                <span className="tratamento-stat-value">{dadosGerais.tratamentos.maisVendido.quantidade}</span>
                              </div>
                              <div className="tratamento-stat highlight">
                                <span className="tratamento-stat-label">Valor Total:</span>
                                <span className="tratamento-stat-value">{formatCurrency(dadosGerais.tratamentos.maisVendido.valorTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Top Tratamentos */}
                      {dadosGerais.tratamentos.topTratamentos && dadosGerais.tratamentos.topTratamentos.length > 0 && (
                        <div className="top-tratamentos-section">
                          <div className="top-tratamentos-header">
                            <h4 className="top-tratamentos-title">
                              <FontAwesomeIcon icon={faStar} /> Top Tratamentos
                            </h4>
                            {dadosGerais.tratamentos.topTratamentos.length > 3 && (
                              <button 
                                className="btn-ver-mais-tratamentos"
                                onClick={() => {
                                  setTratamentosModalData(dadosGerais.tratamentos.topTratamentos)
                                  setShowTratamentosModal(true)
                                }}
                              >
                                Ver todos ({dadosGerais.tratamentos.topTratamentos.length})
                              </button>
                            )}
                          </div>
                          <div className="top-tratamentos-list">
                            {dadosGerais.tratamentos.topTratamentos.slice(0, 3).map((tratamento, index) => (
                              <div key={tratamento.id || index} className="top-tratamento-item">
                                <div className="top-tratamento-rank">
                                  <span className="rank-number">{index + 1}</span>
                                  <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                                </div>
                                <div className="top-tratamento-info">
                                  <div className="top-tratamento-name">{tratamento.name}</div>
                                  <div className="top-tratamento-details">
                                    <span className="top-tratamento-quantidade">
                                      {tratamento.quantidade} vendas
                                    </span>
                                    <span className="top-tratamento-valor">
                                      {formatCurrency(tratamento.valorTotal)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                    </div>
                  ) : (
                    <div className="graficos-empty-state">
                      <FontAwesomeIcon icon={faChartBar} size="3x" />
                      <p>Carregando dados gerais...</p>
                    </div>
                  )}
                </>
              )}

              {/* Aba Mensal */}
              {activeGraficoTab === 'mensal' && (
                <div className="graficos-section">
                  <div className="graficos-section-header">
                    <h3 className="graficos-section-title">Análise Mensal</h3>
                    <div className="mes-selector">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="mes-input"
                      />
                    </div>
                  </div>

                  {dadosMensais ? (
                  <>
                    {/* Resumo Mensal */}
                    <div className="graficos-resumo-cards">
                      <div className="resumo-card">
                        <div className="resumo-card-icon" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
                          <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0ea5e9' }} />
                        </div>
                        <div className="resumo-card-content">
                          <div className="resumo-card-label">Orçamentos no Mês</div>
                          <div className="resumo-card-value">{dadosMensais.resumo?.qtdOrcamentosEntraram || 0}</div>
                          <div className="resumo-card-subvalue">
                            Valor Total: {formatCurrency(dadosMensais.resumo?.valorTotalOrcamentos || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="resumo-card">
                        <div className="resumo-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                          <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981' }} />
                        </div>
                        <div className="resumo-card-content">
                          <div className="resumo-card-label">Itens Pagos</div>
                          <div className="resumo-card-value">{formatCurrency(dadosMensais.resumo?.valorTotalItensPagos || 0)}</div>
                          <div className="resumo-card-subvalue">
                            Quantidade: {dadosMensais.resumo?.qtdItensPagos || 0}
                          </div>
                        </div>
                      </div>

                      <div className="resumo-card">
                        <div className="resumo-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                          <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#f59e0b' }} />
                        </div>
                        <div className="resumo-card-content">
                          <div className="resumo-card-label">Total de Itens</div>
                          <div className="resumo-card-value">{dadosMensais.resumo?.qtdItensTotal || 0}</div>
                          <div className="resumo-card-subvalue">
                            Valor Total: {formatCurrency(dadosMensais.resumo?.valorTotalItens || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Tratamentos do Mês */}
                    {dadosMensais.topTratamentos && dadosMensais.topTratamentos.length > 0 && (
                      <div className="top-tratamentos-section">
                        <div className="top-tratamentos-header">
                          <h4 className="top-tratamentos-title">
                            <FontAwesomeIcon icon={faStar} /> Top Tratamentos do Mês
                          </h4>
                          {dadosMensais.topTratamentos.length > 3 && (
                            <button 
                              className="btn-ver-mais-tratamentos"
                              onClick={() => {
                                setTratamentosModalData(dadosMensais.topTratamentos)
                                setShowTratamentosModal(true)
                              }}
                            >
                              Ver todos ({dadosMensais.topTratamentos.length})
                            </button>
                          )}
                        </div>
                        <div className="top-tratamentos-list">
                          {dadosMensais.topTratamentos.slice(0, 3).map((tratamento, index) => (
                          <div key={tratamento.id || index} className="top-tratamento-item">
                            <div className="top-tratamento-rank">
                              <span className="rank-number">{index + 1}</span>
                              <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                            </div>
                            <div className="top-tratamento-info">
                              <div className="top-tratamento-name">{tratamento.name}</div>
                              <div className="top-tratamento-details">
                                <span className="top-tratamento-quantidade">
                                  {tratamento.quantidade} vendas
                                </span>
                                <span className="top-tratamento-valor">
                                  {formatCurrency(tratamento.valorTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}

                    {/* Gráficos Mensais */}
                    <div className="graficos-grid">
                      <div className="grafico-card">
                        <h4 className="grafico-card-title">Orçamentos por Status (Mensal)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={prepararDadosMensaisOrcamentos()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantidade" fill="#0ea5e9" name="Quantidade" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grafico-card">
                        <h4 className="grafico-card-title">Valor por Status - Orçamentos (Mensal)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={prepararDadosMensaisOrcamentos()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="valor" fill="#10b981" name="Valor (R$)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grafico-card">
                        <h4 className="grafico-card-title">Itens por Status (Mensal)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={prepararDadosMensaisItens()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="quantidade"
                            >
                              {prepararDadosMensaisItens().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grafico-card">
                        <h4 className="grafico-card-title">Valor por Status - Itens (Mensal)</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={prepararDadosMensaisItens()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="valor" fill="#f59e0b" name="Valor (R$)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                  ) : (
                    <div className="graficos-empty-state">
                      <FontAwesomeIcon icon={faCalendarAlt} size="3x" />
                      <p>Selecione um mês para visualizar os dados</p>
                    </div>
                  )}
                </div>
              )}

              {/* Aba Lista */}
              {activeGraficoTab === 'lista' && (
                <div className="graficos-section">
                  <div className="graficos-section-header">
                    <h3 className="graficos-section-title">Lista de Itens Pagos</h3>
                    <div className="mes-selector">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="mes-input"
                      />
                    </div>
                  </div>

                  {/* Botão Baixar PDF */}
                  {dadosItensPagos && dadosItensPagos.orcamentos && dadosItensPagos.orcamentos.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-download-pdf"
                        onClick={gerarPDF}
                        title="Baixar PDF"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Baixar PDF
                      </button>
                    </div>
                  )}

                  {loadingGraficos ? (
                    <div className="orcamentos-loading">
                      <div className="loading-spinner"></div>
                      <p>Carregando lista de itens pagos...</p>
                    </div>
                  ) : dadosItensPagos ? (
                    <>
                      {/* Resumo */}
                      {dadosItensPagos.resumo && (() => {
                        // Calcular lucro total estimado de todos os itens
                        let lucroTotalEstimado = 0
                        if (dadosItensPagos.orcamentos) {
                          dadosItensPagos.orcamentos.forEach((orc) => {
                            orc.itensPagos.forEach((item, idx) => {
                              const itemKey = `${orc.id}-${item.id || idx}`
                              const precoUnitario = item.preco || 0
                              const temTratamento = item.tratamentoId !== null && item.tratamentoId !== undefined
                              
                              let porcentagemCalculada = null
                              if (temTratamento && item.tratamento && item.tratamento.custo !== undefined && precoUnitario > 0) {
                                const lucroReal = precoUnitario - item.tratamento.custo
                                porcentagemCalculada = parseFloat(((lucroReal / precoUnitario) * 100).toFixed(2))
                              }
                              
                              const porcentagemGlobalNum = typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30
                              const porcentagemAtual = temTratamento 
                                ? porcentagemCalculada
                                : (porcentagensLucro[itemKey] !== undefined ? porcentagensLucro[itemKey] : porcentagemGlobalNum)
                              
                              const totalLucro = porcentagemAtual ? (precoUnitario * porcentagemAtual) / 100 : 0
                              lucroTotalEstimado += totalLucro
                            })
                          })
                        }
                        
                        return (
                          <div className="graficos-resumo-cards">
                            <div className="resumo-card">
                              <div className="resumo-card-icon" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
                                <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0ea5e9' }} />
                              </div>
                              <div className="resumo-card-content">
                                <div className="resumo-card-label">Orçamentos</div>
                                <div className="resumo-card-value">{dadosItensPagos.resumo.quantidadeOrcamentos || 0}</div>
                                <div className="resumo-card-subvalue">
                                  Itens Pagos: {dadosItensPagos.resumo.quantidadeItensPagos || 0}
                                </div>
                              </div>
                            </div>

                            <div className="resumo-card">
                              <div className="resumo-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                                <FontAwesomeIcon icon={faDollarSign} style={{ color: '#10b981' }} />
                              </div>
                              <div className="resumo-card-content">
                                <div className="resumo-card-label">Valor Bruto Total</div>
                                <div className="resumo-card-value">{formatCurrency(dadosItensPagos.resumo.valorBrutoTotalGeral || 0)}</div>
                                <div className="resumo-card-subvalue">
                                  Lucro Total Estimado: {formatCurrency(lucroTotalEstimado)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Campo de Porcentagem Global */}
                      {dadosItensPagos.orcamentos && dadosItensPagos.orcamentos.length > 0 && (
                        <div className="porcentagem-global-container">
                          <div className="porcentagem-global-control">
                            <label className="porcentagem-global-label">
                              % Lucro Global (itens sem tratamento):
                            </label>
                            <div className="porcentagem-global-input-wrapper">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="input-porcentagem-global"
                                value={typeof porcentagemGlobal === 'number' ? porcentagemGlobal : ''}
                                onChange={(e) => {
                                  const valorTexto = e.target.value
                                  // Permitir campo vazio durante digitação
                                  if (valorTexto === '') {
                                    setPorcentagemGlobal('')
                                    return
                                  }
                                  const valor = parseFloat(valorTexto)
                                  // Só atualizar se for um número válido e dentro do range
                                  if (!isNaN(valor) && valor >= 0 && valor <= 100) {
                                    setPorcentagemGlobal(valor)
                                    // Aplicar a todos os itens sem tratamentoId de TODOS os orçamentos
                                    const novosPorcentagens = { ...porcentagensLucro }
                                    dadosItensPagos.orcamentos.forEach((orc) => {
                                      orc.itensPagos.forEach((item, idx) => {
                                        const temTratamento = item.tratamentoId !== null && item.tratamentoId !== undefined
                                        if (!temTratamento) {
                                          const itemKey = `${orc.id}-${item.id || idx}`
                                          novosPorcentagens[itemKey] = valor
                                        }
                                      })
                                    })
                                    setPorcentagensLucro(novosPorcentagens)
                                  }
                                }}
                                onBlur={(e) => {
                                  // Se ficar vazio ao sair, usar 30 como padrão
                                  const valorTexto = e.target.value
                                  if (valorTexto === '' || isNaN(parseFloat(valorTexto))) {
                                    setPorcentagemGlobal(30)
                                    // Aplicar 30% a todos os itens sem tratamentoId
                                    const novosPorcentagens = { ...porcentagensLucro }
                                    dadosItensPagos.orcamentos.forEach((orc) => {
                                      orc.itensPagos.forEach((item, idx) => {
                                        const temTratamento = item.tratamentoId !== null && item.tratamentoId !== undefined
                                        if (!temTratamento) {
                                          const itemKey = `${orc.id}-${item.id || idx}`
                                          novosPorcentagens[itemKey] = 30
                                        }
                                      })
                                    })
                                    setPorcentagensLucro(novosPorcentagens)
                                  }
                                }}
                              />
                              <span className="porcentagem-symbol">%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lista de Orçamentos */}
                      {dadosItensPagos.orcamentos && dadosItensPagos.orcamentos.length > 0 ? (
                        <div className="itens-pagos-list">
                          {dadosItensPagos.orcamentos.map((orcamento) => (
                            <div key={orcamento.id} className="orcamento-item-pago-card">
                              <div className="orcamento-item-pago-header">
                                <div className="orcamento-item-pago-info">
                                  <h4 className="orcamento-item-pago-paciente">
                                    {orcamento.paciente?.nome || 'Paciente não informado'}
                                  </h4>
                                  <div className="orcamento-item-pago-meta">
                                    <span className="orcamento-item-pago-date">
                                      {formatDate(orcamento.createdAt)}
                                    </span>
                                    <span className="orcamento-item-pago-status" style={{ backgroundColor: getStatusColor(orcamento.status) }}>
                                      {getStatusLabel(orcamento.status)}
                                    </span>
                                  </div>
                                </div>
                                <div className="orcamento-item-pago-totais">

                                  <div className="orcamento-item-pago-total-item">
                                    <span className="total-label">Valor Bruto:</span>
                                    <span className="total-value">{formatCurrency(orcamento.valorBrutoTotal || 0)}</span>
                                  </div>
                                  <div className="orcamento-item-pago-total-item highlight">
                                    <span className="total-label">Lucro Total:</span>
                                    <span className="total-value">{formatCurrency(orcamento.lucroTotal || 0)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Lista de Itens Pagos */}
                              {orcamento.itensPagos && orcamento.itensPagos.length > 0 && (
                                <div className="itens-pagos-container">
                                  <h5 className="itens-pagos-title">Itens Pagos:</h5>
                                  <div className="itens-pagos-lista-simples">
                                    <div className="itens-pagos-lista-header">
                                      <div className="lista-col-nome">Item</div>
                                      <div className="lista-col-preco">Preço Unitário</div>
                                      <div className="lista-col-porcentagem">% Lucro</div>
                                      <div className="lista-col-lucro">Total Lucro</div>
                                    </div>
                                    {orcamento.itensPagos.map((item, index) => {
                                      const itemKey = `${orcamento.id}-${item.id || index}`
                                      const precoUnitario = item.preco || 0
                                      const temTratamento = item.tratamentoId !== null && item.tratamentoId !== undefined
                                      
                                      // Se tem tratamento, calcular porcentagem baseada no lucro real
                                      let porcentagemCalculada = null
                                      if (temTratamento && item.tratamento && item.tratamento.custo !== undefined && precoUnitario > 0) {
                                        const lucroReal = precoUnitario - item.tratamento.custo
                                        porcentagemCalculada = parseFloat(((lucroReal / precoUnitario) * 100).toFixed(2))
                                      }
                                      
                                      // Se tem tratamento: usar porcentagem calculada (fixa)
                                      // Se não tem tratamento: usar porcentagem editada individual ou porcentagem global
                                      const porcentagemGlobalNum = typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30
                                      const porcentagemAtual = temTratamento 
                                        ? porcentagemCalculada
                                        : (porcentagensLucro[itemKey] !== undefined ? porcentagensLucro[itemKey] : porcentagemGlobalNum)
                                      
                                      const totalLucro = porcentagemAtual ? (precoUnitario * porcentagemAtual) / 100 : 0
                                      
                                      return (
                                        <div key={item.id || index} className="itens-pagos-lista-row">
                                          <div className="lista-col-nome">
                                            <span className="item-nome-lista">{item.nome}</span>
                                            {item.quantidade > 1 && (
                                              <span className="item-qtd-lista">Qtd: {item.quantidade}</span>
                                            )}
                                          </div>
                                          <div className="lista-col-preco">
                                            {formatCurrency(precoUnitario)}
                                          </div>
                                          <div className="lista-col-porcentagem">
                                            {temTratamento ? (
                                              // Com tratamento: campo somente leitura
                                              <>
                                                <span className="porcentagem-readonly">{porcentagemCalculada || 0}</span>
                                                <span className="porcentagem-symbol">%</span>
                                              </>
                                            ) : (
                                              // Sem tratamento: campo editável
                                              <>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  step="0.01"
                                                  className="input-porcentagem-lucro"
                                                  value={porcentagensLucro[itemKey] !== undefined ? porcentagensLucro[itemKey] : (typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30)}
                                                  placeholder={(typeof porcentagemGlobal === 'number' ? porcentagemGlobal : 30).toString()}
                                                  onChange={(e) => {
                                                    const valor = e.target.value === '' ? null : parseFloat(e.target.value)
                                                    setPorcentagensLucro(prev => ({
                                                      ...prev,
                                                      [itemKey]: valor
                                                    }))
                                                  }}
                                                  onBlur={(e) => {
                                                    // Se ficar vazio, usar porcentagem global como padrão
                                                    if (e.target.value === '') {
                                                      setPorcentagensLucro(prev => ({
                                                        ...prev,
                                                        [itemKey]: porcentagemGlobal
                                                      }))
                                                    }
                                                  }}
                                                />
                                                <span className="porcentagem-symbol">%</span>
                                              </>
                                            )}
                                          </div>
                                          <div className="lista-col-lucro highlight">
                                            {formatCurrency(totalLucro)}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="graficos-empty-state">
                          <FontAwesomeIcon icon={faList} size="3x" />
                          <p>Nenhum item pago encontrado para o mês selecionado</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="graficos-empty-state">
                      <FontAwesomeIcon icon={faCalendarAlt} size="3x" />
                      <p>Selecione um mês para visualizar os itens pagos</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Filtros e Busca */}
          <div className="orcamentos-filters">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por paciente ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className="filter-dropdown-wrapper" ref={statusDropdownRef}>
          <button
            className="filter-dropdown-btn"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>{statusOptions.find(opt => opt.value === statusFilter)?.label || 'Todos os Status'}</span>
            <FontAwesomeIcon icon={faChevronDown} className={`chevron ${statusDropdownOpen ? 'open' : ''}`} />
          </button>
          {statusDropdownOpen && (
            <div className="filter-dropdown-menu">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  className={`filter-dropdown-item ${statusFilter === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter(option.value)
                    setStatusDropdownOpen(false)
                  }}
                >
                  <span className="status-dot" style={{ backgroundColor: option.color }}></span>
                  {option.label}
                  {statusFilter === option.value && (
                    <FontAwesomeIcon icon={faCheck} className="check-icon" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Orçamentos */}
      {filteredOrcamentos.length === 0 ? (
        <div className="empty-state-orcamentos">
          <FontAwesomeIcon icon={faFileInvoiceDollar} size="4x" />
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? 'Nenhum orçamento encontrado' 
              : 'Nenhum orçamento cadastrado'}
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro orçamento'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button 
              className="btn-empty-state"
              onClick={() => navigate('/app/orcamentos/novo')}
            >
              <FontAwesomeIcon icon={faPlus} /> Criar Primeiro Orçamento
            </button>
          )}
        </div>
      ) : (
        <div className="orcamentos-grid">
          {filteredOrcamentos.map((orcamento) => (
            <div key={orcamento.id} className="orcamento-card">
              <div className="orcamento-card-header">
                <div 
                  className="status-dropdown-container" 
                  ref={el => orcamentoStatusRefs.current[orcamento.id] = el}
                >
                  <span 
                    className="orcamento-status-badge status-badge-clickable"
                    style={{ backgroundColor: getStatusColor(orcamento.status) }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const isMobileDevice = window.innerWidth <= 768
                      if (isMobileDevice) {
                        setShowStatusModal(orcamento.id)
                        setOrcamentoStatusDropdowns(prev => {
                          const newState = { ...prev }
                          delete newState[orcamento.id]
                          return newState
                        })
                      } else {
                        setOrcamentoStatusDropdowns(prev => ({
                          ...prev,
                          [orcamento.id]: !prev[orcamento.id]
                        }))
                        setShowStatusModal(null)
                      }
                    }}
                    title="Clique para alterar status"
                  >
                    {getStatusLabel(orcamento.status)}
                    <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${orcamentoStatusDropdowns[orcamento.id] ? 'open' : ''}`} />
                  </span>
                  {!isMobile && orcamentoStatusDropdowns[orcamento.id] && (
                    <div className="status-dropdown-menu">
                      {statusOptions.filter(opt => opt.value !== 'all').map((option) => (
                        <div
                          key={option.value}
                          className={`status-dropdown-item ${orcamento.status === option.value ? 'active' : ''}`}
                          style={{ backgroundColor: getStatusColor(option.value) }}
                          onClick={() => handleUpdateOrcamentoStatus(orcamento.id, option.value)}
                        >
                          <span>{option.label}</span>
                          {orcamento.status === option.value && (
                            <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="orcamento-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => navigate(`/app/orcamentos/${orcamento.id}`)}
                    title="Ver detalhes"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => navigate(`/app/orcamentos/${orcamento.id}/editar`)}
                    title="Editar"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteClick(orcamento)}
                    title="Excluir"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className="orcamento-card-body">
                <div className="orcamento-paciente">
                  <FontAwesomeIcon icon={faUser} />
                  <span>{orcamento.paciente?.nome || 'Paciente não informado'}</span>
                </div>

                <div className="orcamento-valor">
                  <FontAwesomeIcon icon={faDollarSign} />
                  <span className="valor-total">{formatCurrency(orcamento.valorTotal)}</span>
                </div>

                {orcamento.observacoes && (
                  <div className="orcamento-observacoes">
                    <p>{orcamento.observacoes}</p>
                  </div>
                )}

                {/* Itens do Orçamento */}
                {orcamento.itens && orcamento.itens.length > 0 && (
                  <div className="orcamento-itens-preview">
                    {orcamento.itens.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="orcamento-item-preview">
                        <div className="item-preview-info">
                          <div className="item-preview-descricao">
                            {item.descricao || item.nome}
                          </div>
                          <div className="item-preview-valor">
                            {formatCurrency(item.preco * (item.quantidade || 1))}
                          </div>
                        </div>
                        <div 
                          className="status-dropdown-container" 
                          ref={el => itemStatusRefs.current[`${orcamento.id}-${idx}`] = el}
                        >
                          <span 
                            className="item-preview-status status-badge-clickable"
                            style={{ 
                              backgroundColor: getItemStatusColor(item.status),
                              color: '#ffffff'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              const isMobileDevice = window.innerWidth <= 768
                              if (isMobileDevice) {
                                setShowItemStatusModal({ orcamentoId: orcamento.id, itemIndex: idx })
                                setItemStatusDropdowns(prev => {
                                  const newState = { ...prev }
                                  delete newState[`${orcamento.id}-${idx}`]
                                  return newState
                                })
                              } else {
                                setItemStatusDropdowns(prev => ({
                                  ...prev,
                                  [`${orcamento.id}-${idx}`]: !prev[`${orcamento.id}-${idx}`]
                                }))
                                setShowItemStatusModal(null)
                              }
                            }}
                            title="Clique para alterar status"
                          >
                            {getItemStatusLabel(item.status)}
                            <FontAwesomeIcon icon={faChevronDown} className={`status-dropdown-icon ${itemStatusDropdowns[`${orcamento.id}-${idx}`] ? 'open' : ''}`} />
                          </span>
                          {!isMobile && itemStatusDropdowns[`${orcamento.id}-${idx}`] && (
                            <div className="status-dropdown-menu">
                              {itemStatusOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`status-dropdown-item ${item.status === option.value ? 'active' : ''}`}
                                  style={{ backgroundColor: getItemStatusColor(option.value) }}
                                  onClick={() => handleUpdateItemStatus(orcamento.id, idx, option.value)}
                                >
                                  <span>{option.label}</span>
                                  {item.status === option.value && (
                                    <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {orcamento.itens.length > 2 && (
                      <button
                        className="btn-ver-mais-itens-lista"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/app/orcamentos/${orcamento.id}`)
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                        Ver mais ({orcamento.itens.length - 2} {orcamento.itens.length - 2 === 1 ? 'item' : 'itens'})
                      </button>
                    )}
                  </div>
                )}

                <div className="orcamento-info">
                  <div className="info-item">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>Criado em: {formatDate(orcamento.createdAt)}</span>
                  </div>
                  {orcamento.itens && orcamento.itens.length > 0 && (
                    <div className="info-item">
                      <FontAwesomeIcon icon={faFileInvoiceDollar} />
                      <span>{orcamento.itens.length} {orcamento.itens.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>
            <h3>Excluir Orçamento</h3>
            <p>
              Tem certeza que deseja excluir o orçamento de <strong>{orcamentoToDelete?.paciente?.nome}</strong>?
            </p>
            <p className="modal-warning">
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-delete"
                onClick={handleConfirmDelete}
              >
                <FontAwesomeIcon icon={faTrash} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Status do Orçamento (Mobile) */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(null)}>
          <div className="modal-status-select" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status do Orçamento</h3>
            <div className="modal-status-list">
              {statusOptions.filter(opt => opt.value !== 'all').map((option) => {
                const orcamento = orcamentos.find(o => o.id === showStatusModal)
                return (
                  <button
                    key={option.value}
                    className={`modal-status-item ${orcamento?.status === option.value ? 'active' : ''}`}
                    style={{ backgroundColor: getStatusColor(option.value) }}
                    onClick={() => handleUpdateOrcamentoStatus(showStatusModal, option.value)}
                  >
                    <span>{option.label}</span>
                    {orcamento?.status === option.value && (
                      <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowStatusModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Status do Item (Mobile) */}
      {showItemStatusModal && (
        <div className="modal-overlay" onClick={() => setShowItemStatusModal(null)}>
          <div className="modal-status-select" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status do Item</h3>
            <div className="modal-status-list">
              {itemStatusOptions.map((option) => {
                const orcamento = orcamentos.find(o => o.id === showItemStatusModal.orcamentoId)
                const item = orcamento?.itens?.[showItemStatusModal.itemIndex]
                return (
                  <button
                    key={option.value}
                    className={`modal-status-item ${item?.status === option.value ? 'active' : ''}`}
                    style={{ backgroundColor: getItemStatusColor(option.value) }}
                    onClick={() => handleUpdateItemStatus(showItemStatusModal.orcamentoId, showItemStatusModal.itemIndex, option.value)}
                  >
                    <span>{option.label}</span>
                    {item?.status === option.value && (
                      <FontAwesomeIcon icon={faCheck} className="status-check-icon" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel"
                onClick={() => setShowItemStatusModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Todos os Tratamentos */}
      {showTratamentosModal && tratamentosModalData && tratamentosModalData.length > 0 && (
        <div className="modal-overlay" onClick={() => {
          setShowTratamentosModal(false)
          setTratamentosModalData(null)
        }}>
          <div className="modal-tratamentos" onClick={(e) => e.stopPropagation()}>
            <div className="modal-tratamentos-header">
              <h3 className="modal-tratamentos-title">
                <FontAwesomeIcon icon={faStar} /> Todos os Tratamentos
              </h3>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowTratamentosModal(false)
                  setTratamentosModalData(null)
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-tratamentos-content">
              <div className="modal-tratamentos-list">
                {tratamentosModalData.map((tratamento, index) => (
                  <div key={tratamento.id || index} className="modal-tratamento-item">
                    <div className="modal-tratamento-rank">
                      <span className="rank-number">{index + 1}</span>
                      <FontAwesomeIcon icon={faMedkit} className="rank-icon" />
                    </div>
                    <div className="modal-tratamento-info">
                      <div className="modal-tratamento-name">{tratamento.name}</div>
                      <div className="modal-tratamento-details">
                        <span className="modal-tratamento-quantidade">
                          {tratamento.quantidade} vendas
                        </span>
                        <span className="modal-tratamento-valor">
                          {formatCurrency(tratamento.valorTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default Orcamentos

