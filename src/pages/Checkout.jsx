import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard, faMapMarkerAlt, faCheckCircle,
  faChevronRight, faChevronLeft, faTag, faLock, faChevronDown, faChevronUp,
  faExclamationTriangle, faTimes, faCheck, faPhone, faUsers, faShieldAlt
} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import { trackCheckoutStep, trackPlanSelection, trackConversion, trackEvent } from '../utils/gtag'
import './Checkout.css'

const Checkout = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountValue, setDiscountValue] = useState(0) // Valor em reais
  const [couponApplied, setCouponApplied] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null) // Armazena o cupom aplicado
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [showAddressFields, setShowAddressFields] = useState(false)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [showAllPlans, setShowAllPlans] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    // Dados pessoais
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefone: '',
    cpf: '',
    
    // Endereço
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    
    // Cartão
    numeroCartao: '',
    nomeCartao: '',
    validade: '',
    cvv: '',
    parcelas: 1
  })

  const showAlert = (message, type = 'error') => {
    setCustomAlert({ show: true, message, type })
    setTimeout(() => {
      setCustomAlert({ show: false, message: '', type: 'error' })
    }, 5000)
  }

  // Carregar planos do backend
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true)
        // O baseURL já garante que termina com /api, então usamos apenas /planos
        const response = await api.get('/planos')
        
        // A API pode retornar { statusCode, message, data } ou diretamente o array
        const planosBackend = response.data?.data || response.data || []

        // Verificar se é um array
        if (!Array.isArray(planosBackend)) {
          showAlert('Erro ao carregar planos. Formato inválido.', 'error')
          return
        }

        // Função auxiliar para formatar tokens
        const formatarTokensAux = (tokens) => {
          const numTokens = parseInt(tokens) || 0
          if (numTokens >= 1000000) {
            return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`
          } else if (numTokens >= 1000) {
            return `${(numTokens / 1000).toFixed(0)} mil`
          }
          return numTokens.toString()
        }

        // Mapear planos do backend para o formato esperado no frontend
        const planosMapeados = planosBackend.map((plano) => {
          // Validar campos obrigatórios
          if (!plano.id || !plano.nome) {
            // Plano com dados incompletos - será filtrado depois
          }

          // Determinar features baseado no ID ou nome do plano (mesma lógica do LPDentista)
          let features = []
          let featured = false
          let badge = null

          // Identifica o plano pelo ID ou nome
          const isPlanoInicial = plano.id === '3521d057-f3b3-4ae5-9966-a5bdeddc38f2' || plano.nome?.toLowerCase().includes('inicial')
          const isPlanoChat = plano.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' || plano.nome?.toLowerCase().includes('chat')

          if (isPlanoChat) {
            // Plano Chat - Apenas Chat
            badge = 'Ideal para estudantes'
            features = [
              'Chat especializado em odontologia 24/7',
              'IA treinada especificamente para odontologia',
              'Tire dúvidas sobre diagnósticos e tratamentos',
              'Suporte para técnicas odontológicas',
              'Respostas instantâneas e precisas',
              plano.tokenChat || plano.token_chat || plano.tokensChat ? `${formatarTokensAux(plano.tokenChat || plano.token_chat || plano.tokensChat)} de tokens` : '1 milhão de tokens',
              'Acesso mobile completo',
              'Sem fidelidade - cancele quando quiser'
            ]
          } else if (isPlanoInicial) {
            // Plano Inicial - Ideal para Dentistas Iniciantes
            badge = 'Ideal para Dentistas Iniciantes'
            features = [
              'Diagnósticos com IA avançada',
              `Até ${plano.limiteAnalises || plano.limite_analises || 12} análises por mês`,
              'Agendamento de consultas',
              'Anamneses personalizadas',
              'Chat especializado em odontologia 24/7',
              'Precificação de tratamentos',
              'Feedbacks e avaliações',
              'Gráficos customizados para melhor entendimento',
              'Gestão completa de pacientes',
              'Relatórios detalhados e profissionais',
              'Armazenamento ilimitado na nuvem',
              plano.tokenChat || plano.token_chat || plano.tokensChat ? `${formatarTokensAux(plano.tokenChat || plano.token_chat || plano.tokensChat)} de tokens` : '1 milhão de tokens',
              'Acesso mobile completo',
              'Sem fidelidade - cancele quando quiser'
            ]
          } else {
            // Features completas para outros planos
            features = [
              'Diagnósticos com IA avançada',
              plano.limiteAnalises || plano.limite_analises ? `Até ${plano.limiteAnalises || plano.limite_analises} análises por mês` : 'Análises ilimitadas',
              'Agendamento de consultas',
              'Anamneses personalizadas',
              'Chat especializado em odontologia 24/7',
              'Precificação de tratamentos',
              'Feedbacks e avaliações',
              'Gráficos customizados para melhor entendimento',
              'Gestão completa de pacientes',
              'Relatórios detalhados e profissionais',
              'Armazenamento ilimitado na nuvem',
              plano.tokenChat || plano.token_chat || plano.tokensChat ? `${formatarTokensAux(plano.tokenChat || plano.token_chat || plano.tokensChat)} de tokens` : '1 milhão de tokens',
              'Acesso mobile completo',
              'Sem fidelidade - cancele quando quiser'
            ]
          }

          // Valores padrão baseados no nome do plano (quando API retorna null)
          const getDefaultPrices = (nomePlano) => {
            switch (nomePlano) {
              case 'Plano Inicial':
                return { original: 159, promocional: 98 }
              case 'Plano Básico':
                return { original: 299, promocional: 179 }
              case 'Plano Premium':
                return { original: 299, promocional: null }
              case 'Plano Essencial':
                return { original: 399, promocional: null }
              case 'Plano Enterprise':
                return { original: 499, promocional: null }
              case 'Plano Chat':
                return { original: 49, promocional: 39 }
              default:
                return { original: 0, promocional: null }
            }
          }

          // Calcular preços com segurança
          // Os valores podem vir como string (ex: "49.00") ou número
          let valorPromocional = plano.valorPromocional || plano.valor_promocional || null
          let valorOriginal = plano.valorOriginal || plano.valor_original || plano.valor || null
          
          // Se os valores vierem null, usar valores padrão
          if (valorOriginal === null && valorPromocional === null) {
            const defaultPrices = getDefaultPrices(plano.nome)
            valorOriginal = defaultPrices.original
            valorPromocional = defaultPrices.promocional
          } else if (valorOriginal === null) {
            // Se só o original for null, usar o promocional como original
            valorOriginal = valorPromocional
          }
          
          // Converter para número, tratando strings com vírgula ou ponto decimal
          const parsePrice = (value) => {
            if (value === null || value === undefined) return null
            if (typeof value === 'number') return value
            if (typeof value === 'string') {
              // Remove espaços e converte vírgula para ponto
              const cleaned = value.trim().replace(',', '.')
              const parsed = parseFloat(cleaned)
              return isNaN(parsed) ? null : parsed
            }
            return null
          }
          
          const priceOriginal = parsePrice(valorOriginal) || 0
          const pricePromocional = valorPromocional !== null ? parsePrice(valorPromocional) : null
          const price = pricePromocional !== null && pricePromocional > 0 ? pricePromocional : priceOriginal
          const oldPrice = pricePromocional !== null && pricePromocional > 0 && priceOriginal > pricePromocional ? priceOriginal : null

          return {
            id: plano.id,
            name: plano.nome,
            price: price,
            oldPrice: oldPrice,
            patients: plano.descricao || `Até ${plano.limiteAnalises || plano.limite_analises || 0} análises por mês`,
            features,
            featured,
            badge
          }
        })

        // Filtrar planos inválidos
        const planosValidos = planosMapeados.filter(plano => plano.id && plano.name)
        
        if (planosValidos.length === 0) {
          console.error('Nenhum plano válido encontrado')
          showAlert('Nenhum plano disponível no momento.', 'error')
          return
        }

        setPlans(planosValidos)
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
        showAlert('Erro ao carregar planos. Tente novamente.', 'error')
      } finally {
        setLoadingPlans(false)
      }
    }

    loadPlans()
  }, [])

  // Rastrear mudanças de etapa
  useEffect(() => {
    if (currentStep) {
      trackCheckoutStep(currentStep, selectedPlan?.name, selectedPlan?.price)
    }
  }, [currentStep])

  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      return false
    }

    // Garantir que o código do cupom sempre seja enviado em maiúsculas
    const codigoNormalizado = code.toString().toUpperCase().trim()

    setIsApplyingCoupon(true)
    try {
      const response = await api.get(`/cupons/name/${codigoNormalizado}`)
      // A API pode retornar { message, data } ou diretamente o cupom
      const cupom = response.data?.data || response.data

      // Verificar se o cupom existe e está ativo (verificação estrita)
      if (!cupom || cupom.active !== true) {
        showAlert('Cupom inválido ou inativo', 'error')
        setIsApplyingCoupon(false)
        setCouponApplied(false)
        setAppliedCoupon(null)
        setDiscount(0)
        setDiscountValue(0)
        return false
      }

      // O cupom retorna discountValue em porcentagem
      setAppliedCoupon(cupom)
      const discountPercent = parseFloat(cupom.discountValue) || 0
      setDiscount(discountPercent)
      
      // Calcular valor em reais do desconto (baseado no plano selecionado)
      // SEM arredondamento - manter precisão decimal
      if (selectedPlan) {
        const planPrice = parseFloat(selectedPlan.price) || 0
        if (planPrice > 0) {
          const discountInReais = (planPrice * discountPercent) / 100
          setDiscountValue(discountInReais) // Mantém precisão decimal completa
        }
      }
      
      setCouponApplied(true)
      setIsApplyingCoupon(false)
      return true
    } catch (error) {
      console.error('Erro ao validar cupom:', error)
      setIsApplyingCoupon(false)
      setCouponApplied(false)
      setAppliedCoupon(null)
      setDiscount(0)
      setDiscountValue(0)
      
      if (error.response?.status === 404) {
        showAlert('Cupom não encontrado', 'error')
      } else {
        showAlert('Erro ao validar cupom. Tente novamente.', 'error')
      }
      return false
    }
  }

  // Aplicar cupom assim que chegar na página (independente dos planos)
  useEffect(() => {
    const coupon = searchParams.get('cupom')
    if (coupon) {
      // Preenche o input com o cupom
      setCouponCode(coupon.toUpperCase())
      // Aplica o cupom se ainda não foi aplicado
      if (!couponApplied && !isApplyingCoupon) {
        applyCoupon(coupon.toUpperCase())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    // Verificar se há plano na query (usando o nome do plano)
    if (plans.length > 0) {
      const planName = searchParams.get('plano')
      if (planName) {
        const plan = plans.find(p => p.name === planName)
        if (plan) {
          setSelectedPlan(plan)
          // Não pular o passo 1, deixar o usuário confirmar
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, plans])

  // Recalcular desconto quando o plano mudar ou quando o cupom for aplicado
  useEffect(() => {
    if (appliedCoupon && selectedPlan) {
      const discountPercent = parseFloat(appliedCoupon.discountValue) || 0
      const planPrice = parseFloat(selectedPlan.price) || 0
      setDiscount(discountPercent)
      if (planPrice > 0) {
        // SEM arredondamento - manter precisão decimal completa
        const discountInReais = (planPrice * discountPercent) / 100
        setDiscountValue(discountInReais)
      }
    } else if (appliedCoupon && !selectedPlan) {
      // Se tem cupom mas ainda não tem plano, mantém o desconto percentual
      const discountPercent = parseFloat(appliedCoupon.discountValue) || 0
      setDiscount(discountPercent)
      setDiscountValue(0) // Valor em reais será calculado quando o plano for selecionado
    }
  }, [selectedPlan, appliedCoupon])

  const handleCouponSubmit = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) {
      showAlert('Por favor, digite um código de cupom', 'error')
      return
    }

    const success = await applyCoupon(couponCode)
    if (success) {
      showAlert('Cupom aplicado com sucesso!', 'success')
    }
  }

  const formatPhone = (value) => {
    // Remove tudo que não é dígito
    let numbers = value.replace(/\D/g, '')
    
    // Se começar com 55, remover para processar
    let hasCountryCode = false
    if (numbers.startsWith('55')) {
      hasCountryCode = true
      numbers = numbers.substring(2)
    }
    
    // Limitar a 11 dígitos (DDD + número)
    numbers = numbers.substring(0, 11)
    
    // Formatar conforme o tamanho
    let formatted = ''
    if (numbers.length <= 10) {
      // Telefone fixo: (00) 0000-0000
      formatted = numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, ddd, part1, part2) => {
        if (part2) return `(${ddd}) ${part1}-${part2}`
        if (part1) return `(${ddd}) ${part1}`
        if (ddd) return `(${ddd})`
        return numbers
      })
    } else {
      // Celular: (00) 00000-0000
      formatted = numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, ddd, part1, part2) => {
        if (part2) return `(${ddd}) ${part1}-${part2}`
        if (part1) return `(${ddd}) ${part1}`
        if (ddd) return `(${ddd})`
        return numbers
      })
    }
    
    // Adicionar código do país 55 no início
    if (formatted) {
      return `55 ${formatted}`
    }
    
    return formatted
  }

  const formatCpfCnpj = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Se tiver 11 dígitos ou menos, formata como CPF
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (match, p1, p2, p3, p4) => {
        if (p4) return `${p1}.${p2}.${p3}-${p4}`
        if (p3) return `${p1}.${p2}.${p3}`
        if (p2) return `${p1}.${p2}`
        return p1
      })
    } else {
      // Se tiver mais de 11 dígitos, formata como CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (match, p1, p2, p3, p4, p5) => {
        if (p5) return `${p1}.${p2}.${p3}/${p4}-${p5}`
        if (p4) return `${p1}.${p2}.${p3}/${p4}`
        if (p3) return `${p1}.${p2}.${p3}`
        if (p2) return `${p1}.${p2}`
        return p1
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Formatar telefone automaticamente
    if (name === 'telefone') {
      const formatted = formatPhone(value)
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
    } else if (name === 'cpf') {
      // Formatar CPF ou CNPJ automaticamente
      const formatted = formatCpfCnpj(value)
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    const formattedCep = cep.replace(/(\d{5})(\d)/, '$1-$2')
    setFormData(prev => ({ ...prev, cep: formattedCep }))

    if (cep.length === 8) {
      // Mostrar campos quando CEP tiver 8 dígitos
      setShowAddressFields(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (data.erro) {
          showAlert('CEP não encontrado. Por favor, verifique o CEP digitado ou preencha manualmente.')
          // Manter campos visíveis para preenchimento manual
          setShowAddressFields(true)
          return
        }

        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          complemento: data.complemento || prev.complemento
        }))
        
        // Mostrar campos de endereço após preencher
        setShowAddressFields(true)
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        showAlert('Erro ao buscar CEP. Você pode preencher manualmente.')
        // Manter campos visíveis para preenchimento manual
        setShowAddressFields(true)
      }
    } else if (cep.length < 8) {
      // Limpar campos se CEP incompleto
      setFormData(prev => ({
        ...prev,
        rua: '',
        bairro: '',
        cidade: '',
        estado: ''
      }))
      setShowAddressFields(false)
    }
  }

  const formatCardNumber = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiry = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/')
  }

  const calculateTotal = () => {
    if (!selectedPlan) return 0
    const subtotal = parseFloat(selectedPlan.price) || 0
    // discountValue agora é calculado em reais baseado na porcentagem
    // SEM arredondamento - manter precisão decimal completa
    const discountAmount = parseFloat(discountValue) || 0
    const total = subtotal - discountAmount
    return total > 0 ? total : 0 // Garantir que não seja negativo
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    // Atualizar a query string com o nome do plano selecionado
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('plano', plan.name)
    setSearchParams(newSearchParams, { replace: true })
    
    // Evento GTM - Seleção de plano
    trackPlanSelection(plan.name, plan.id, plan.price)
    
    // Ocultar outros planos quando selecionar um
    setShowAllPlans(false)
    
    // Avançar automaticamente para o próximo step
    if (currentStep === 1) {
      setCurrentStep(2)
    }
  }

  const handlePlanToggle = (planId, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setExpandedPlan(expandedPlan === planId ? null : planId)
  }

  // Função para cadastrar cliente na API
  const createCustomer = async () => {
    if (isCreatingCustomer) return
    
    setIsCreatingCustomer(true)
    try {
      // Validar telefone
      let phoneNumbers = formData.telefone.replace(/\D/g, '')
      if (!phoneNumbers.startsWith('55')) {
        phoneNumbers = '55' + phoneNumbers
      }
      
      const customerPayload = {
        name: formData.nome,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: phoneNumbers,
        postalCode: formData.cep.replace(/\D/g, ''),
        address: formData.rua,
        addressNumber: formData.numero,
        complement: formData.complemento || '',
        province: formData.bairro,
        city: formData.cidade,
        state: formData.estado
      }
      
      console.log('=== CRIANDO CLIENTE /api/assinaturas/customer ===')
      console.log(customerPayload)
      
      const response = await api.post('/assinaturas/customer', customerPayload)
      
      // Log completo da resposta para debug
      console.log('=== RESPOSTA /api/assinaturas/customer ===')
      console.log('Response completo:', response)
      console.log('Response.data:', response.data)
      
      // Estrutura aninhada: response.data.data.data contém { asaasCustomerId, userId }
      const outerData = response.data?.data
      const innerData = outerData?.data
      
      // Tentar diferentes níveis de aninhamento
      const customerId = innerData?.asaasCustomerId || outerData?.asaasCustomerId || response.data?.asaasCustomerId
      const user = innerData?.userId || outerData?.userId || response.data?.userId
      
      console.log('Dados extraídos:', { 
        customerId, 
        userId: user
      })
      
      if (!user) {
        console.error('userId não encontrado na resposta:', response.data)
        throw new Error('userId não retornado pela API')
      }
      
      setAsaasCustomerId(customerId)
      setUserId(user) // IMPORTANTE: Usar userId, não clienteMasterId
      console.log('Cliente criado com sucesso. userId salvo:', user)
      
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao cadastrar cliente. Tente novamente.'
      showAlert(errorMessage, 'error')
      setIsCreatingCustomer(false)
      throw error // Re-throw para impedir avanço de etapa
    } finally {
      setIsCreatingCustomer(false)
    }
  }


  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedPlan) {
        showAlert('Por favor, selecione um plano para continuar')
        return
      }
    }
    if (currentStep === 2) {
      // Validar dados pessoais e endereço
      if (!formData.nome || !formData.email || !formData.telefone || !formData.cpf) {
        showAlert('Por favor, preencha todos os campos obrigatórios')
        return
      }
      // Validar telefone com DDD e código do país
      let phoneNumbers = formData.telefone.replace(/\D/g, '')
      
      // Se não começar com 55, adicionar
      if (!phoneNumbers.startsWith('55')) {
        phoneNumbers = '55' + phoneNumbers
      }
      
      // Validar tamanho: 55 (código país) + 2 (DDD) + 8 ou 9 (número) = 12 ou 13 dígitos
      if (phoneNumbers.length < 12 || phoneNumbers.length > 13) {
        showAlert('Por favor, informe um telefone válido com DDD (ex: 55 (11) 98765-4321)')
        return
      }
      if (!formData.password || formData.password.length < 6) {
        showAlert('A senha deve ter no mínimo 6 caracteres')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        showAlert('As senhas não coincidem')
        return
      }
      if (!formData.cep || !formData.rua || !formData.numero || !formData.cidade || !formData.estado) {
        showAlert('Por favor, preencha todos os campos de endereço')
        return
      }
      
      // Se já tem o userId, não precisa criar novamente
      if (!userId) {
        try {
          // Cadastrar cliente antes de avançar para etapa 3
          await createCustomer()
        } catch (error) {
          // Erro já foi tratado na função createCustomer
          return // Não avança para próxima etapa se houver erro
        }
      }
    }
    if (currentStep === 3) {
      // Validar dados do cartão
      if (!formData.numeroCartao || !formData.nomeCartao || !formData.validade || !formData.cvv) {
        showAlert('Por favor, preencha todos os dados do cartão')
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [showPollingModal, setShowPollingModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [pollingAttempt, setPollingAttempt] = useState(0)
  const [pollingStatus, setPollingStatus] = useState('Verificando pagamento...')
  const [loadingMessage, setLoadingMessage] = useState('Criando assinatura...')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [asaasCustomerId, setAsaasCustomerId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (showLoadingModal || showPollingModal || showSuccessAnimation) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showLoadingModal, showPollingModal, showSuccessAnimation])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Validar se as senhas coincidem antes de enviar
      if (formData.password !== formData.confirmPassword) {
        showAlert('As senhas não coincidem. Por favor, verifique.')
        setIsSubmitting(false)
        return
      }
      
      // Validar tamanho mínimo da senha
      if (formData.password.length < 6) {
        showAlert('A senha deve ter no mínimo 6 caracteres')
        setIsSubmitting(false)
        return
      }
      
      // Validar telefone antes de enviar
      let phoneNumbers = formData.telefone.replace(/\D/g, '')
      
      // Se não começar com 55, adicionar
      if (!phoneNumbers.startsWith('55')) {
        phoneNumbers = '55' + phoneNumbers
      }
      
      // Validar tamanho: 55 (código país) + 2 (DDD) + 8 ou 9 (número) = 12 ou 13 dígitos
      if (!phoneNumbers || phoneNumbers.length < 12 || phoneNumbers.length > 13) {
        showAlert('Por favor, informe um telefone válido com DDD')
        setIsSubmitting(false)
        return
      }

      // Validar se tem userId
      if (!userId) {
        showAlert('Erro: Cliente não cadastrado. Por favor, volte e tente novamente.', 'error')
        setIsSubmitting(false)
        return
      }

      // Mostrar modal de loading
      setShowLoadingModal(true)
      setLoadingMessage('Tokenizando cartão...')

      // Preparar dados do cartão
      const [expiryMonth, expiryYear] = formData.validade.split('/')
      // Para a Asaas, o ano deve ser apenas os 2 últimos dígitos (ex: "26" para 2026)
      const yearTwoDigits = expiryYear

      // Validar se tem asaasCustomerId para tokenização
      if (!asaasCustomerId) {
        showAlert('Erro: Cliente Asaas não encontrado. Por favor, volte e tente novamente.', 'error')
        setIsSubmitting(false)
        setShowLoadingModal(false)
        return
      }

      // Obter IP do cliente
      let clientIp = '0.0.0.0'
      try {
        const ipResponse = await axios.get('https://api.ipify.org?format=json')
        clientIp = ipResponse.data?.ip || '0.0.0.0'
      } catch (error) {
        console.warn('Não foi possível obter o IP do cliente:', error)
        // Se falhar, tentar obter de outra forma ou usar um valor padrão
      }

      // 1. Tokenizar cartão primeiro na Asaas
      const tokenizePayload = {
        customer: asaasCustomerId,
        creditCard: {
          holderName: formData.nomeCartao,
          number: formData.numeroCartao.replace(/\D/g, ''),
          expiryMonth: expiryMonth,
          expiryYear: yearTwoDigits, // Apenas 2 dígitos (ex: "26")
          ccv: formData.cvv
        },
        creditCardHolderInfo: {
          name: formData.nome,
          email: formData.email,
          cpfCnpj: formData.cpf.replace(/\D/g, ''),
          postalCode: formData.cep.replace(/\D/g, ''),
          addressNumber: formData.numero,
          addressComplement: formData.complemento || '',
          phone: phoneNumbers,
          mobilePhone: phoneNumbers
        },
        remoteIp: clientIp
      }

      console.log('=== TOKENIZANDO CARTÃO DIRETO NA ASAAS ===')
      console.log('Payload completo:', tokenizePayload)
      console.log('IP do cliente:', clientIp)

      // Usar sempre /asaas-proxy - em dev usa proxy do Vite, em prod usa Edge Function do Vercel
      const tokenizeURL = '/asaas-proxy/creditCard/tokenizeCreditCard'
      
      console.log('=== TOKENIZANDO CARTÃO ===')
      console.log('URL:', tokenizeURL)
      console.log('Payload completo:', tokenizePayload)
      
      const tokenizeResponse = await axios.post(
        tokenizeURL,
        tokenizePayload,
        {
          headers: {
            'Content-Type': 'application/json'
            // Headers adicionados automaticamente pelo proxy (Vite em dev, Edge Function em prod)
          }
        }
      )
      
      console.log('=== RESPOSTA TOKENIZAÇÃO ===')
      console.log('Response completo:', tokenizeResponse)
      console.log('Response.data:', tokenizeResponse.data)
      
      // Extrair token da resposta (pode estar em diferentes níveis)
      const tokenizeData = tokenizeResponse.data?.data || tokenizeResponse.data
      const creditCardToken = tokenizeData?.creditCardToken || tokenizeResponse.data?.creditCardToken

      if (!creditCardToken) {
        console.error('Token não encontrado na resposta:', tokenizeResponse.data)
        throw new Error('Token do cartão não retornado pela API')
      }

      console.log('Cartão tokenizado com sucesso. Token:', creditCardToken)

      // Atualizar mensagem de loading
      setLoadingMessage('Processando pagamento...')

      // 2. Fazer checkout com apenas o token
      const checkoutPayload = {
        userId: userId,
        planoId: selectedPlan.id,
        billingType: 'CREDIT_CARD',
        creditCardToken: creditCardToken,
        ...(appliedCoupon ? { couponName: appliedCoupon.name } : {})
      }

      // Log do payload enviado para debug
      console.log('=== PAYLOAD ENVIADO /api/assinaturas/checkout ===')
      console.log(checkoutPayload)
      console.log('========================================')

      // Fazer checkout
      const response = await api.post('/assinaturas/checkout', checkoutPayload)
      
      // Log do retorno da API para debug
      console.log('=== RETORNO DA API /api/assinaturas ===')
      console.log('Response completo:', response)
      console.log('Response.data:', response.data)
      console.log('Status Code:', response.status)
      console.log('========================================')
      
      // Verificar se há erro na resposta (statusCode 400, 500, etc)
      const responseStatusCode = response.data?.statusCode || response.status
      if (responseStatusCode >= 400) {
        const errorMessage = response.data?.message || 'Erro ao processar pagamento. Tente novamente.'
        // Limpar mensagens duplicadas ou muito técnicas
        const cleanMessage = errorMessage
          .replace(/Erro ao tokenizar cartão:\s*/gi, '')
          .replace(/Erro ao tokenizar cartão:\s*/gi, '')
          .trim()
        throw new Error(cleanMessage || 'Erro ao processar pagamento. Verifique os dados e tente novamente.')
      }
      
      // Estrutura aninhada: response.data.data.data contém { pagamento, assinatura }
      // response.data.data.statusCode contém o statusCode interno (200 ou 202)
      const outerData = response.data?.data
      const innerData = outerData?.data
      const innerStatusCode = outerData?.statusCode
      
      // Tentar diferentes níveis de aninhamento para compatibilidade
      const responseData = innerData || outerData || response.data
      const statusCode = innerStatusCode || outerData?.statusCode || response.data?.statusCode || response.status
      
      if (!responseData) {
        console.error('Resposta inválida do servidor:', response.data)
        throw new Error('Resposta inválida do servidor')
      }
      
      // Extrair dados do pagamento e assinatura (pode estar em data.data.data ou data.data)
      const pagamento = responseData.pagamento || innerData?.pagamento
      const assinatura = responseData.assinatura || innerData?.assinatura
      
      console.log('Pagamento extraído:', pagamento)
      console.log('Assinatura extraída:', assinatura)
      console.log('Status Code interno:', statusCode)
      
      if (!pagamento || !pagamento.id) {
        console.error('Dados do pagamento não encontrados na resposta:', response.data)
        throw new Error('Dados do pagamento não encontrados')
      }
      
      const paymentId = pagamento.id
      const paymentStatus = pagamento.status
      
      // Cenário 1: statusCode 200 e status CONFIRMED - Pagamento já confirmado
      if (statusCode === 200 && paymentStatus === 'CONFIRMED') {
        setShowLoadingModal(false)
        setIsPolling(false)
        setIsSubmitting(false)
        
        // Evento GTM - Conversão (pagamento confirmado)
        const totalValue = selectedPlan ? calculateTotal() : 0
        const userId = assinatura?.userId || paymentId
        trackConversion('purchase', totalValue, 'BRL')
        trackEvent('purchase', {
          transaction_id: userId,
          value: totalValue,
          currency: 'BRL',
          items: selectedPlan ? [{
            item_name: selectedPlan.name,
            item_id: selectedPlan.id,
            price: selectedPlan.price,
            quantity: 1
          }] : []
        })
        
        // Mostrar animação de sucesso
        setShowSuccessAnimation(true)
        
        // Redirecionar após a animação (3.5 segundos)
        setTimeout(() => {
          setShowSuccessAnimation(false)
          navigate('/login')
        }, 3500)
        return
      }
      
      // Cenário 2: statusCode 202 e status PENDING - Precisa fazer polling
      if (statusCode === 202 && paymentStatus === 'PENDING') {
        setShowLoadingModal(false)
        setIsPolling(true)
        setShowPollingModal(true)
        setPollingAttempt(0)
        setPollingStatus('Aguardando confirmação do pagamento...')
        await pollPaymentStatus(paymentId)
        return
      }
      
      // Caso não se encaixe nos cenários esperados
      console.error('Status inesperado:', { statusCode, paymentStatus })
      throw new Error(`Status inesperado: ${statusCode} - ${paymentStatus}`)
      
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      
      // Extrair mensagem de erro de forma amigável
      let errorMessage = 'Erro ao processar pagamento. Tente novamente.'
      
      if (error.response?.data) {
        // Erro da API com estrutura { statusCode, message, ... }
        const apiError = error.response.data
        errorMessage = apiError.message || errorMessage
        
        // Limpar mensagens duplicadas ou muito técnicas
        errorMessage = errorMessage
          .replace(/Erro ao tokenizar cartão:\s*/gi, '')
          .replace(/Erro ao tokenizar cartão:\s*/gi, '')
          .replace(/Tokenização\s+falhou:\s*/gi, '')
          .trim()
      } else if (error.message) {
        // Erro lançado manualmente
        errorMessage = error.message
      }
      
      // Garantir que a mensagem não esteja vazia
      if (!errorMessage || errorMessage.trim() === '') {
        errorMessage = 'Erro ao processar pagamento. Verifique os dados do cartão e tente novamente.'
      }
      
      showAlert(errorMessage, 'error')
      setIsSubmitting(false)
      setShowLoadingModal(false)
      setShowPollingModal(false)
    }
  }

  const pollPaymentStatus = async (paymentId) => {
    const maxAttempts = 3 // Máximo de 3 tentativas
    const interval = 8000 // 8 segundos entre tentativas
    let attempts = 0

    const poll = async () => {
      attempts++
      setPollingAttempt(attempts)
      setPollingStatus(`Verificando pagamento... (Tentativa ${attempts}/${maxAttempts})`)

      try {
        // Usar o ID do pagamento na rota
        const response = await api.get(`/assinaturas/check-payment-status/${paymentId}`)
        
        // A resposta pode vir em diferentes formatos:
        // { statusCode, message, data: { pagamento: { status } } }
        // ou { status } diretamente
        const responseData = response.data?.data || response.data
        const pagamento = responseData?.pagamento || responseData
        const status = pagamento?.status || responseData?.status || response.data?.status

        if (status === 'CONFIRMED') {
          setPollingStatus('Pagamento confirmado!')
          setIsPolling(false)
          setIsSubmitting(false)
          
          // Evento GTM - Conversão (pagamento confirmado)
          const totalValue = selectedPlan ? calculateTotal() : 0
          trackConversion('purchase', totalValue, 'BRL')
          trackEvent('purchase', {
            transaction_id: paymentId,
            value: totalValue,
            currency: 'BRL',
            items: selectedPlan ? [{
              item_name: selectedPlan.name,
              item_id: selectedPlan.id,
              price: selectedPlan.price,
              quantity: 1
            }] : []
          })
          
          // Mostrar animação de sucesso
          setShowSuccessAnimation(true)
          
          // Redirecionar após a animação (3.5 segundos)
          setTimeout(() => {
            setShowSuccessAnimation(false)
            navigate('/login')
          }, 3500)
          return
        }

        if (attempts >= maxAttempts) {
          setPollingStatus('Não foi possível confirmar o pagamento automaticamente.')
          setIsPolling(false)
          setIsSubmitting(false)
          showAlert('Tempo de espera esgotado. Verifique o status do pagamento mais tarde.', 'error')
          
          setTimeout(() => {
            setShowPollingModal(false)
            // Mantém o usuário na mesma página
          }, 2000)
          return
        }

        // Continuar polling após intervalo
        setTimeout(poll, interval)
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error)
        
        if (attempts >= maxAttempts) {
          setPollingStatus('Erro ao verificar pagamento. Tente novamente mais tarde.')
          setIsPolling(false)
          setIsSubmitting(false)
          showAlert('Erro ao verificar status do pagamento. Verifique mais tarde.', 'error')
          
          setTimeout(() => {
            setShowPollingModal(false)
            // Mantém o usuário na mesma página
          }, 2000)
          return
        }

        // Continuar polling mesmo com erro
        setTimeout(poll, interval)
      }
    }

    // Iniciar polling após 5 segundos (primeira tentativa)
    setTimeout(poll, interval)
  }

  const steps = [
    { number: 1, title: 'Escolha o Plano', icon: faCheckCircle },
    { number: 2, title: 'Dados Pessoais', icon: faMapMarkerAlt },
    { number: 3, title: 'Pagamento', icon: faCreditCard }
  ]

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <img src={nodoLogo} alt="NODON" className="checkout-logo" />
        <h1>Complete o Cadastro</h1>
      </div>

      <div className="checkout-container">
        <div className="checkout-steps">
          {steps.map((step, index) => (
            <div key={step.number} className={`step-item ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}>
              <div className="step-number">
                {currentStep > step.number ? (
                  <FontAwesomeIcon icon={faCheckCircle} />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <div className="step-title">{step.title}</div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>

        <div className="checkout-content">
          {/* Step 1: Seleção de Plano */}
          {currentStep === 1 && (
            <div className="checkout-step">
              <h2>Escolha seu plano</h2>
              
              {/* Cupom Section no Step 1 */}
              <div className="coupon-section-step1">
                <form onSubmit={handleCouponSubmit} className="coupon-form">
                  <div className="coupon-input-wrapper">
                    <FontAwesomeIcon icon={faTag} className="coupon-icon" />
                    <input
                      type="text"
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={couponApplied || isApplyingCoupon}
                    />
                  </div>
                  <button type="submit" disabled={couponApplied || !couponCode || isApplyingCoupon}>
                    {isApplyingCoupon ? 'Aplicando...' : couponApplied ? 'Aplicado' : 'Aplicar'}
                  </button>
                </form>
                {couponApplied && appliedCoupon && (
                  <div className="coupon-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>
                      Cupom {appliedCoupon.name} aplicado! 
                      Desconto de {parseFloat(discount || 0).toFixed(1)}%
                    </span>
                    <button 
                      className="coupon-remove"
                      onClick={() => {
                        setCouponApplied(false)
                        setAppliedCoupon(null)
                        setDiscount(0)
                        setDiscountValue(0)
                        setCouponCode('')
                        showAlert('Cupom removido', 'success')
                      }}
                      title="Remover cupom"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                )}
              </div>

              {loadingPlans ? (
                <div className="loading-plans">
                  <p>Carregando planos...</p>
                </div>
              ) : (
                <div className="plans-grid-checkout">
                  {(() => {
                    // Ordenar planos: se tiver plano selecionado, ele vem primeiro
                    // Caso contrário, ordenar por preço (do menor para o maior)
                    const sortedPlans = [...plans].sort((a, b) => {
                      // Se há plano selecionado, ele sempre vem primeiro
                      if (selectedPlan) {
                        if (a.id === selectedPlan.id) return -1
                        if (b.id === selectedPlan.id) return 1
                      }
                      // Caso contrário, ordenar por preço
                      const priceA = parseFloat(a.price) || 0
                      const priceB = parseFloat(b.price) || 0
                      return priceA - priceB
                    })
                    
                    // Se há plano selecionado e não está mostrando todos, mostrar apenas o selecionado
                    const plansToShow = selectedPlan && !showAllPlans 
                      ? sortedPlans.filter(plan => plan.id === selectedPlan.id)
                      : sortedPlans
                    
                    return (
                      <>
                        {plansToShow.map(plan => {
                  const planPrice = parseFloat(plan.price) || 0
                  const discountPercent = parseFloat(discount) || 0
                  // SEM arredondamento - manter precisão decimal completa
                  const finalPrice = couponApplied && discountPercent > 0
                    ? Math.max(0, planPrice - (planPrice * discountPercent / 100))
                    : planPrice
                  
                  return (
                    <div
                      key={plan.id}
                      className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''} ${plan.featured ? 'featured' : ''}`}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {selectedPlan?.id === plan.id && (
                        <div className="plan-selected-indicator">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                      )}
                      {plan.badge && <div className="plan-badge-new">{plan.badge}</div>}
                      <div className="plan-header-card">
                        <h3>{plan.name}</h3>
                        <div className="plan-price">
                          {plan.oldPrice && !couponApplied ? (
                            <>
                              <span className="price-old">De: R$ {parseFloat(plan.oldPrice || 0).toFixed(2)}/mês*</span>
                              <span className="price-new">Por: R$ {parseFloat(plan.price || 0).toFixed(2)}/mês*</span>
                            </>
                          ) : couponApplied && plan.price !== finalPrice ? (
                            <>
                              <span className="price-old">De: R$ {parseFloat(plan.price || 0).toFixed(2)}/mês*</span>
                              <span className="price-new">Por: R$ {parseFloat(finalPrice || 0).toFixed(2)}/mês*</span>
                            </>
                          ) : (
                            <span className="price-single">R$ {parseFloat(finalPrice || 0).toFixed(2)}/mês*</span>
                          )}
                        </div>
                        <div className="plan-feature-count">{plan.patients}</div>
                      </div>
                      <button 
                        type="button"
                        className="plan-details-btn" 
                        onClick={(e) => handlePlanToggle(plan.id, e)}
                      >
                        <FontAwesomeIcon 
                          icon={faChevronDown} 
                          className={`plan-chevron ${expandedPlan === plan.id ? 'expanded' : ''}`}
                        />
                      </button>
                      <div className={expandedPlan === plan.id ? 'plan-details expanded' : 'plan-details'}>
                        <ul className="plan-features">
                          {plan.features.map((feature, idx) => (
                            <li key={idx}>
                              <FontAwesomeIcon icon={faCheckCircle} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="plan-note">*Plano mensal . Cobrança recorrente com renovação automática.</p>
                      
                      {/* Botão "Continuar" dentro do card quando selecionado */}
                      {selectedPlan?.id === plan.id && currentStep === 1 && (
                        <button 
                          className="btn-continue-in-card" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNext()
                          }}
                        >
                          Continuar
                          <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                      )}
                    </div>
                  )
                  })}
                  
                  {/* Botão "Ver mais planos" quando há plano selecionado e não está mostrando todos */}
                  {selectedPlan && !showAllPlans && plans.length > 1 && (
                    <div className="show-more-plans-container">
                      <button 
                        type="button"
                        className="show-more-plans-btn"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowAllPlans(true)
                        }}
                      >
                        <span>Ver mais planos</span>
                        <FontAwesomeIcon icon={faChevronDown} />
                      </button>
                    </div>
                  )}
                  
                  {/* Botão "Ocultar planos" quando está mostrando todos e há plano selecionado */}
                  {selectedPlan && showAllPlans && plans.length > 1 && (
                    <div className="show-more-plans-container">
                      <button 
                        type="button"
                        className="show-more-plans-btn"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowAllPlans(false)
                        }}
                      >
                        <span>Ocultar outros planos</span>
                        <FontAwesomeIcon icon={faChevronUp} />
                      </button>
                    </div>
                  )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Dados Pessoais e Endereço */}
          {currentStep === 2 && (
            <div className="checkout-step">
              <h2>Dados Pessoais e Endereço</h2>
              <form className="checkout-form">
                <div className="form-section">
                  <h3>Informações Pessoais</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome Completo *</label>
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CPF *</label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        maxLength="14"
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>E-mail *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefone *</label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="55 (00) 00000-0000"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Senha *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 6 caracteres"
                        minLength="6"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Senha *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Digite a senha novamente"
                        minLength="6"
                        required
                        style={{
                          borderColor: formData.confirmPassword && formData.password !== formData.confirmPassword 
                            ? '#ef4444' 
                            : undefined
                        }}
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <small style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                          As senhas não coincidem
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Endereço</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>CEP *</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleCepChange}
                        onBlur={handleCepChange}
                        maxLength="9"
                        placeholder="00000-000"
                        required
                      />
                      <small className="cep-hint">Digite o CEP para preencher automaticamente</small>
                    </div>
                  </div>
                  
                  {showAddressFields && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Rua *</label>
                          <input
                            type="text"
                            name="rua"
                            value={formData.rua}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Número *</label>
                          <input
                            type="text"
                            name="numero"
                            value={formData.numero}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Complemento</label>
                          <input
                            type="text"
                            name="complemento"
                            value={formData.complemento}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Bairro *</label>
                          <input
                            type="text"
                            name="bairro"
                            value={formData.bairro}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Cidade *</label>
                          <input
                            type="text"
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Estado *</label>
                          <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="AC">AC</option>
                            <option value="AL">AL</option>
                            <option value="AP">AP</option>
                            <option value="AM">AM</option>
                            <option value="BA">BA</option>
                            <option value="CE">CE</option>
                            <option value="DF">DF</option>
                            <option value="ES">ES</option>
                            <option value="GO">GO</option>
                            <option value="MA">MA</option>
                            <option value="MT">MT</option>
                            <option value="MS">MS</option>
                            <option value="MG">MG</option>
                            <option value="PA">PA</option>
                            <option value="PB">PB</option>
                            <option value="PR">PR</option>
                            <option value="PE">PE</option>
                            <option value="PI">PI</option>
                            <option value="RJ">RJ</option>
                            <option value="RN">RN</option>
                            <option value="RS">RS</option>
                            <option value="RO">RO</option>
                            <option value="RR">RR</option>
                            <option value="SC">SC</option>
                            <option value="SP">SP</option>
                            <option value="SE">SE</option>
                            <option value="TO">TO</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Pagamento */}
          {currentStep === 3 && (
            <div className="checkout-step">
              <h2>Pagamento</h2>
              
              <div className="payment-layout">
                {/* Coluna Esquerda: Resumo do Pedido */}
                {selectedPlan && (
                  <div className="payment-column payment-summary-column">
                    <div className="order-summary">
                      <h3>Resumo do Pedido</h3>
                      
                      <div className="summary-title">
                        <h4>NODON Sistema Inteligente de Odontologia</h4>
                        <p className="summary-subtitle">Você está contratando:</p>
                      </div>

                      <div className="summary-plan-info">
                        <div className="summary-plan-header">
                          <h4>{selectedPlan.name}</h4>
                          <span className="summary-plan-price">R$ {parseFloat(selectedPlan.price || 0).toFixed(2)}/mês</span>
                        </div>
                        
                        <div className="summary-plan-details">
                          {selectedPlan.patients && (
                            <div className="summary-detail-item">
                              <FontAwesomeIcon icon={faUsers} />
                              <span>{selectedPlan.patients}</span>
                            </div>
                          )}
                          {selectedPlan.features && selectedPlan.features.length > 0 && (
                            <div className="summary-plan-features">
                              {selectedPlan.features.slice(0, 3).map((feature, idx) => (
                                <div key={idx} className="summary-feature-item">
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                  <span>{feature}</span>
                                </div>
                              ))}
                              {selectedPlan.features.length > 3 && (
                                <div className="summary-feature-more">
                                  + {selectedPlan.features.length - 3} recursos adicionais
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="summary-financial">
                        <div className="summary-item">
                          <span>Plano: {selectedPlan.name}</span>
                          <span>R$ {parseFloat(selectedPlan.price || 0).toFixed(2)}</span>
                        </div>
                        {couponApplied && appliedCoupon && (
                          <div className="summary-item discount">
                            <span>Desconto ({appliedCoupon.name})</span>
                            <span>- {parseFloat(discount || 0).toFixed(1)}%</span>
                          </div>
                        )}
                        <div className="summary-total">
                          <span>Total</span>
                          <span>R$ {parseFloat(calculateTotal()).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coluna Direita: Dados do Cartão */}
                <div className="payment-column payment-form-column">
                  <div className="coupon-section">
                    <form onSubmit={handleCouponSubmit} className="coupon-form">
                      <input
                        type="text"
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied || isApplyingCoupon}
                      />
                      <button type="submit" disabled={couponApplied || !couponCode || isApplyingCoupon}>
                        {isApplyingCoupon ? 'Aplicando...' : couponApplied ? 'Aplicado' : 'Aplicar'}
                      </button>
                    </form>
                    {couponApplied && appliedCoupon && (
                      <div className="coupon-success">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>
                          Cupom {appliedCoupon.name} aplicado! 
                          Desconto de {parseFloat(discount || 0).toFixed(1)}%
                        </span>
                        <button 
                          className="coupon-remove"
                          onClick={() => {
                            setCouponApplied(false)
                            setAppliedCoupon(null)
                            setDiscount(0)
                            setDiscountValue(0)
                            setCouponCode('')
                            showAlert('Cupom removido', 'success')
                          }}
                          title="Remover cupom"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    )}
                  </div>

                  <form className="checkout-form" onSubmit={handleSubmit}>
                    <div className="form-section card-data-section">
                      <h3>
                        <FontAwesomeIcon icon={faLock} /> Dados do Cartão
                      </h3>
                      <div className="form-group">
                        <label>Número do Cartão *</label>
                        <input
                          type="text"
                          name="numeroCartao"
                          value={formData.numeroCartao}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value)
                            setFormData(prev => ({ ...prev, numeroCartao: formatted }))
                          }}
                          maxLength="19"
                          placeholder="0000 0000 0000 0000"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Nome no Cartão *</label>
                        <input
                          type="text"
                          name="nomeCartao"
                          value={formData.nomeCartao}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-row card-fields-row">
                        <div className="form-group">
                          <label>Validade *</label>
                          <input
                            type="text"
                            name="validade"
                            value={formData.validade}
                            onChange={(e) => {
                              const formatted = formatExpiry(e.target.value)
                              setFormData(prev => ({ ...prev, validade: formatted }))
                            }}
                            maxLength="5"
                            placeholder="MM/AA"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>CVV *</label>
                          <input
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            maxLength="4"
                            placeholder="000"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            {currentStep > 1 && (
              <button className="btn-back" onClick={() => setCurrentStep(prev => prev - 1)}>
                <FontAwesomeIcon icon={faChevronLeft} />
                Voltar
              </button>
            )}
            {/* Não mostrar botão Continuar no Step 1 se há plano selecionado e não está mostrando todos (já está acima do plano) */}
            {!(currentStep === 1 && selectedPlan && !showAllPlans) && (
              <>
                {currentStep < 3 ? (
                  <button 
                    className="btn-next" 
                    onClick={handleNext}
                    disabled={(currentStep === 1 && !selectedPlan) || isCreatingCustomer}
                  >
                    {isCreatingCustomer && currentStep === 2 ? 'Cadastrando...' : 'Continuar'}
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                ) : (
                  <button 
                    className="btn-submit" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || isPolling}
                  >
                    <FontAwesomeIcon icon={faLock} />
                    {isPolling ? 'Verificando pagamento...' : isSubmitting ? 'Processando...' : 'Finalizar'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom Alert */}
      {customAlert.show && (
        <div className={`custom-alert ${customAlert.type}`}>
          <div className="alert-content">
            <div className="alert-icon">
              {customAlert.type === 'success' ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : (
                <FontAwesomeIcon icon={faExclamationTriangle} />
              )}
            </div>
            <div className="alert-message">{customAlert.message}</div>
            <button 
              className="alert-close"
              onClick={() => setCustomAlert({ show: false, message: '', type: 'error' })}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      {/* Loading Modal - Criando Assinatura */}
      {showLoadingModal && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="polling-modal-overlay" 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 14, 39, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="polling-modal" style={{ position: 'relative', zIndex: 1000000 }}>
            <div className="polling-modal-content">
              {/* Loading Animation */}
              <div className="polling-loader-container">
                <div className="spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
                <div className="spinner-center">
                  <FontAwesomeIcon icon={faLock} />
                </div>
              </div>

              {/* Title */}
              <h2 className="polling-title">
                <FontAwesomeIcon icon={faCheckCircle} />
                Processando Pagamento
              </h2>

              {/* Status Text */}
              <p className="polling-status">{loadingMessage}</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Animation Modal */}
      {showSuccessAnimation && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="success-animation-overlay" 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 14, 39, 0.98)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div className="success-animation-modal">
            <div className="success-logo-container">
              <div className="success-logo-circle">
                <img src={nodoLogo} alt="NODON" className="success-logo" />
              </div>
            </div>
            <h2 className="success-title">Pagamento Confirmado!</h2>
            <p className="success-message">Sua assinatura foi ativada com sucesso</p>
            <div className="success-loading">
              <span>Redirecionando para o login...</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Polling Modal - Verificando Pagamento */}
      {showPollingModal && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="polling-modal-overlay" 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 14, 39, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="polling-modal" style={{ position: 'relative', zIndex: 1000000 }}>
            <div className="polling-modal-content">
              {/* Loading Animation */}
              <div className="polling-loader-container">
                <div className="spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
                <div className="spinner-center">
                  <FontAwesomeIcon icon={faLock} />
                </div>
              </div>

              {/* Title */}
              <h2 className="polling-title">
                <FontAwesomeIcon icon={faCheckCircle} />
                Verificando Pagamento
              </h2>

              {/* Status Text */}
              <p className="polling-status">{pollingStatus}</p>

              {/* Progress Section */}
              <div className="polling-progress-container">
                <div className="polling-progress-bar-wrapper">
                  <div 
                    className="polling-progress-bar-fill" 
                    style={{ width: `${(pollingAttempt / 3) * 100}%` }}
                  ></div>
                </div>
                <div className="polling-progress-info">
                  <span className="polling-attempt-text">Tentativa {pollingAttempt} de 3</span>
                </div>
              </div>

              {/* Attempt Indicators */}
              <div className="polling-indicators">
                <div className={`indicator ${pollingAttempt >= 1 ? 'active' : ''}`}>
                  <span className="indicator-number">1</span>
                </div>
                <div className="indicator-line"></div>
                <div className={`indicator ${pollingAttempt >= 2 ? 'active' : ''}`}>
                  <span className="indicator-number">2</span>
                </div>
                <div className="indicator-line"></div>
                <div className={`indicator ${pollingAttempt >= 3 ? 'active' : ''}`}>
                  <span className="indicator-number">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default Checkout

