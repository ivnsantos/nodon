import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard,
  faCheckCircle,
  faTag,
  faLock,
  faExclamationTriangle,
  faTimes,
  faCheck,
  faShieldAlt,
  faChevronDown,
  faGift
} from '@fortawesome/free-solid-svg-icons'
import FloatingWhatsApp from '../components/FloatingWhatsApp'
import axios from 'axios'
import { NODON_LOGO_DARK_BG as nodoLogo } from '../utils/nodonLogos'
import api from '../utils/api'
import { mapPlanosCheckout } from '../utils/checkoutPlans'
import { getCicloFromPlano } from '../utils/planoCiclo'
import { trackPlanSelection, trackConversion, trackEvent } from '../utils/gtag'
import './Checkout.css'

const PAGARME_PUBLIC_KEY = import.meta.env.VITE_PAGARME_PUBLIC_KEY || ''

async function tokenizeCardPagarMe({
  number,
  holder_name,
  holder_document,
  exp_month,
  exp_year,
  cvv,
  billing_address
}) {
  const appId = PAGARME_PUBLIC_KEY
  if (!appId) {
    throw new Error('Chave pública da Pagar.me não configurada (VITE_PAGARME_PUBLIC_KEY).')
  }
  const url = `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(appId)}`
  const body = {
    card: {
      number: number.replace(/\D/g, ''),
      holder_name,
      holder_document: (holder_document || '').replace(/\D/g, ''),
      exp_month: String(exp_month || '01').padStart(2, '0'),
      exp_year: String(exp_year || '00').length === 2 ? String(exp_year) : String(exp_year || '').slice(-2),
      cvv: String(cvv || '')
    },
    type: 'card'
  }
  if (billing_address?.zip_code && billing_address?.line_1) {
    body.billing_address = {
      country: billing_address.country || 'BR',
      state: billing_address.state || '',
      city: billing_address.city || '',
      zip_code: String(billing_address.zip_code).replace(/\D/g, ''),
      line_1: billing_address.line_1,
      ...(billing_address.line_2 && { line_2: billing_address.line_2 })
    }
  }
  const response = await axios.post(url, body, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
  })
  const data = response.data
  const token = data?.id
  if (!token) throw new Error(data?.message || 'Token do cartão não retornado pela Pagar.me')
  return {
    token,
    lastFourDigits: data?.card?.last_four_digits != null ? String(data.card.last_four_digits) : null,
    brand: data?.card?.brand || null
  }
}

const formatMoney = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0)

const formatPhone = (value) => {
  let numbers = value.replace(/\D/g, '')
  if (numbers.startsWith('55')) numbers = numbers.substring(2)
  numbers = numbers.substring(0, 11)
  let formatted = ''
  if (numbers.length <= 10) {
    formatted = numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, p1, p2) => {
      if (p2) return `(${ddd}) ${p1}-${p2}`
      if (p1) return `(${ddd}) ${p1}`
      if (ddd) return `(${ddd})`
      return numbers
    })
  } else {
    formatted = numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, p1, p2) => {
      if (p2) return `(${ddd}) ${p1}-${p2}`
      if (p1) return `(${ddd}) ${p1}`
      if (ddd) return `(${ddd})`
      return numbers
    })
  }
  return formatted ? `55 ${formatted}` : ''
}

const formatCpfCnpj = (value) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, p1, p2, p3, p4) => {
      if (p4) return `${p1}.${p2}.${p3}-${p4}`
      if (p3) return `${p1}.${p2}.${p3}`
      if (p2) return `${p1}.${p2}`
      return p1
    })
  }
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, p1, p2, p3, p4, p5) => {
    if (p5) return `${p1}.${p2}.${p3}/${p4}-${p5}`
    if (p4) return `${p1}.${p2}.${p3}/${p4}`
    if (p3) return `${p1}.${p2}.${p3}`
    if (p2) return `${p1}.${p2}`
    return p1
  })
}

const formatCardNumber = (value) => value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
const formatExpiry = (value) => value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/')

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const Checkout = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const origemParam = searchParams.get('origem')
  const origemSaude = origemParam === 'saude' || origemParam === 'estudante'

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountValue, setDiscountValue] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefone: '',
    cpf: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    numeroCartao: '',
    nomeCartao: '',
    validade: '',
    cvv: ''
  })

  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [showPollingModal, setShowPollingModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [pollingAttempt, setPollingAttempt] = useState(0)
  const [pollingStatus, setPollingStatus] = useState('Verificando pagamento...')
  const [loadingMessage, setLoadingMessage] = useState('Processando...')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [userId, setUserId] = useState(null)
  const [periodoGratis, setPeriodoGratis] = useState(null)
  const [expandedPlanFeatures, setExpandedPlanFeatures] = useState({})

  const showAlert = (message, type = 'error') => {
    setCustomAlert({ show: true, message, type })
    setTimeout(() => setCustomAlert({ show: false, message: '', type: 'error' }), 5000)
  }

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true)
        const response = await api.get('/planos')
        const raw = response.data?.data || response.data || []
        setPlans(mapPlanosCheckout(raw, { origemSaude }))
      } catch {
        showAlert('Erro ao carregar planos. Tente novamente.', 'error')
      } finally {
        setLoadingPlans(false)
      }
    }
    loadPlans()
  }, [origemSaude])

  const applyCoupon = async (code) => {
    const codigo = code?.toString().toUpperCase().trim()
    if (!codigo) return false
    setIsApplyingCoupon(true)
    try {
      const response = await api.get(`/cupons/name/${codigo}`)
      const cupom = response.data?.data || response.data
      if (!cupom?.active) {
        showAlert('Cupom inválido ou inativo', 'error')
        setCouponApplied(false)
        setAppliedCoupon(null)
        setDiscount(0)
        setDiscountValue(0)
        return false
      }
      setAppliedCoupon(cupom)
      const pct = parseFloat(cupom.discountValue) || 0
      setDiscount(pct)
      setCouponApplied(true)
      return true
    } catch (err) {
      showAlert(err.response?.status === 404 ? 'Cupom não encontrado' : 'Erro ao validar cupom', 'error')
      setCouponApplied(false)
      setAppliedCoupon(null)
      setDiscount(0)
      setDiscountValue(0)
      return false
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  useEffect(() => {
    const cupom = searchParams.get('cupom')
    if (cupom && !couponApplied && !isApplyingCoupon) {
      setCouponCode(cupom.toUpperCase())
      applyCoupon(cupom.toUpperCase())
    }
  }, [searchParams])

  useEffect(() => {
    if (!plans.length) return
    const planoId = searchParams.get('planoId')
    const planoNome = searchParams.get('plano')
    const found = plans.find(
      (p) => (planoId && p.id === planoId) || (planoNome && (p.id === planoNome || p.name === planoNome))
    )
    if (found) {
      setSelectedPlan(found)
      return
    }
    setSelectedPlan((prev) => prev ?? plans.find((p) => p.featured) ?? plans[0])
  }, [plans, searchParams])

  useEffect(() => {
    if (!appliedCoupon || !selectedPlan) {
      if (appliedCoupon && !selectedPlan) setDiscountValue(0)
      return
    }
    const pct = parseFloat(appliedCoupon.discountValue) || 0
    const price = parseFloat(selectedPlan.price) || 0
    setDiscount(pct)
    setDiscountValue(price > 0 ? (price * pct) / 100 : 0)
  }, [selectedPlan, appliedCoupon])

  useEffect(() => {
    const lock = showLoadingModal || showPollingModal || showSuccessAnimation
    document.body.style.overflow = lock ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showLoadingModal, showPollingModal, showSuccessAnimation])

  const total = useMemo(() => {
    if (!selectedPlan) return 0
    const sub = parseFloat(selectedPlan.price) || 0
    const t = sub - (parseFloat(discountValue) || 0)
    return t > 0 ? t : 0
  }, [selectedPlan, discountValue])

  const handleCouponSubmit = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) {
      showAlert('Digite um código de cupom', 'error')
      return
    }
    if (await applyCoupon(couponCode)) showAlert('Cupom aplicado!', 'success')
  }

  const removeCoupon = () => {
    setCouponApplied(false)
    setAppliedCoupon(null)
    setDiscount(0)
    setDiscountValue(0)
    setCouponCode('')
  }

  const selectPlan = (plan) => {
    setSelectedPlan(plan)
    const params = new URLSearchParams(searchParams)
    params.set('plano', plan.name)
    params.set('planoId', plan.id)
    setSearchParams(params, { replace: true })
    trackPlanSelection(plan.name, plan.id, plan.price)
  }

  const togglePlanFeatures = (planId, e) => {
    e.stopPropagation()
    setExpandedPlanFeatures((prev) => ({ ...prev, [planId]: !prev[planId] }))
  }

  const formatTokens = (tokens) => {
    const n = parseInt(tokens) || 0
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)} milhão${n > 1000000 ? 's' : ''}`
    if (n >= 1000) return `${(n / 1000).toFixed(0)} mil`
    return String(n)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'telefone') {
      setFormData((p) => ({ ...p, telefone: formatPhone(value) }))
    } else if (name === 'cpf') {
      setFormData((p) => ({ ...p, cpf: formatCpfCnpj(value) }))
    } else {
      setFormData((p) => ({ ...p, [name]: value }))
    }
  }

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    const formattedCep = cep.replace(/(\d{5})(\d)/, '$1-$2')
    setFormData((p) => ({ ...p, cep: formattedCep }))
    if (cep.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) {
        showAlert('CEP não encontrado. Preencha o endereço manualmente.', 'error')
        return
      }
      setFormData((p) => ({
        ...p,
        rua: data.logradouro || p.rua,
        bairro: data.bairro || p.bairro,
        cidade: data.localidade || p.cidade,
        estado: data.uf || p.estado,
        complemento: data.complemento || p.complemento
      }))
    } catch {
      showAlert('Erro ao buscar CEP. Preencha manualmente.', 'error')
    }
  }

  const normalizePhone = () => {
    let phone = formData.telefone.replace(/\D/g, '')
    if (!phone.startsWith('55')) phone = '55' + phone
    return phone
  }

  const validateForm = () => {
    if (!selectedPlan) {
      showAlert('Selecione um plano', 'error')
      return false
    }
    if (!formData.nome?.trim() || !formData.email?.trim() || !formData.telefone || !formData.cpf) {
      showAlert('Preencha nome, e-mail, telefone e CPF', 'error')
      return false
    }
    const phone = normalizePhone()
    if (phone.length < 12 || phone.length > 13) {
      showAlert('Telefone inválido. Ex: 55 (11) 98765-4321', 'error')
      return false
    }
    if (!formData.password || formData.password.length < 6) {
      showAlert('Senha com mínimo de 6 caracteres', 'error')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      showAlert('As senhas não coincidem', 'error')
      return false
    }
    if (!formData.cep || !formData.rua || !formData.numero || !formData.cidade || !formData.estado) {
      showAlert('Preencha o endereço completo', 'error')
      return false
    }
    if (!formData.numeroCartao || !formData.nomeCartao || !formData.validade || !formData.cvv) {
      showAlert('Preencha os dados do cartão', 'error')
      return false
    }
    return true
  }

  const createCustomer = async () => {
    const payload = {
      name: formData.nome.trim(),
      email: formData.email.trim(),
      password: formData.password,
      cpf: formData.cpf.replace(/\D/g, ''),
      phone: normalizePhone(),
      postalCode: formData.cep.replace(/\D/g, ''),
      address: formData.rua,
      addressNumber: formData.numero,
      complement: formData.complemento || '',
      province: formData.bairro,
      city: formData.cidade,
      state: formData.estado
    }
    const response = await api.post('/assinaturas/customer', payload)
    const outer = response.data?.data
    const inner = outer?.data ?? outer
    const uid = inner?.userId ?? outer?.userId ?? response.data?.userId
    if (!uid) throw new Error('Cadastro não concluído. Tente novamente.')
    setUserId(uid)
    return uid
  }

  const finishSuccess = (transactionId) => {
    trackConversion('purchase', total, 'BRL')
    trackEvent('purchase', {
      transaction_id: transactionId,
      value: total,
      currency: 'BRL',
      items: selectedPlan
        ? [{ item_name: selectedPlan.name, item_id: selectedPlan.id, price: selectedPlan.price, quantity: 1 }]
        : []
    })
    setShowLoadingModal(false)
    setShowPollingModal(false)
    setIsPolling(false)
    setIsSubmitting(false)
    setShowSuccessAnimation(true)
    setTimeout(() => {
      setShowSuccessAnimation(false)
      navigate('/login')
    }, 3500)
  }

  const pollPaymentStatus = async (paymentId) => {
    const maxAttempts = 3
    const interval = 8000
    let attempts = 0

    const poll = async () => {
      attempts++
      setPollingAttempt(attempts)
      setPollingStatus(`Verificando pagamento... (${attempts}/${maxAttempts})`)
      try {
        const response = await api.get(`/assinaturas/check-payment-status/${paymentId}`)
        const responseData = response.data?.data || response.data
        const pagamento = responseData?.pagamento || responseData
        const status = pagamento?.status || responseData?.status

        if (status === 'CONFIRMED') {
          finishSuccess(paymentId)
          return
        }
        if (attempts >= maxAttempts) {
          setIsPolling(false)
          setIsSubmitting(false)
          setShowPollingModal(false)
          showAlert('Não foi possível confirmar o pagamento. Verifique mais tarde.', 'error')
          return
        }
        setTimeout(poll, interval)
      } catch {
        if (attempts >= maxAttempts) {
          setIsPolling(false)
          setIsSubmitting(false)
          setShowPollingModal(false)
          showAlert('Erro ao verificar pagamento.', 'error')
          return
        }
        setTimeout(poll, interval)
      }
    }
    setTimeout(poll, interval)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting || !validateForm()) return

    setIsSubmitting(true)
    setShowLoadingModal(true)
    setLoadingMessage('Criando sua conta...')

    try {
      let uid = userId
      if (!uid) {
        uid = await createCustomer()
      }

      setLoadingMessage('Processando pagamento...')

      const [expiryMonth, expiryYear] = (formData.validade || '/').split('/').map((s) => s.trim())
      const billing_address = {
        country: 'BR',
        state: (formData.estado || '').trim().toUpperCase().slice(0, 2),
        city: (formData.cidade || '').trim(),
        zip_code: formData.cep.replace(/\D/g, ''),
        line_1: [formData.rua.trim(), formData.numero.trim()].filter(Boolean).join(', '),
        ...(formData.complemento?.trim() && { line_2: formData.complemento.trim() })
      }

      const { token, lastFourDigits, brand } = await tokenizeCardPagarMe({
        number: formData.numeroCartao,
        holder_name: formData.nomeCartao,
        holder_document: formData.cpf,
        exp_month: expiryMonth || '01',
        exp_year: expiryYear?.length === 2 ? expiryYear : (expiryYear || '').slice(-2),
        cvv: formData.cvv,
        billing_address
      })

      const checkoutPayload = {
        userId: uid,
        planoId: selectedPlan.id,
        billingType: 'CREDIT_CARD',
        creditCardToken: token,
        ...(lastFourDigits && { creditCardNumber: lastFourDigits }),
        ...(brand && { creditCardBrand: brand }),
        ...(appliedCoupon ? { couponName: appliedCoupon.name } : {})
      }

      const response = await api.post('/assinaturas/checkout', checkoutPayload)
      const responseStatusCode = response.data?.statusCode || response.status
      if (responseStatusCode >= 400) {
        throw new Error(response.data?.message || 'Erro ao processar pagamento.')
      }

      const outerData = response.data?.data
      const innerData = outerData?.data
      const responseData = innerData || outerData || response.data
      const statusCode = outerData?.statusCode || response.data?.statusCode || response.status

      const pagamento = responseData?.pagamento || innerData?.pagamento
      const assinatura = responseData?.assinatura || innerData?.assinatura
      const periodoGratisData = responseData?.periodoGratis || innerData?.periodoGratis
      if (periodoGratisData) setPeriodoGratis(periodoGratisData)

      const orderId = responseData?.orderId ?? responseData?.order?.id ?? innerData?.orderId
      const paymentId = orderId || pagamento?.id || assinatura?.id
      const paymentStatus = pagamento?.status || (assinatura?.status === 'ACTIVE' ? 'CONFIRMED' : null)

      if (
        (statusCode === 200 || statusCode === 201 || response.status === 201) &&
        (assinatura?.status === 'ACTIVE' || paymentStatus === 'CONFIRMED')
      ) {
        finishSuccess(paymentId)
        return
      }

      if (statusCode === 202 && paymentStatus === 'PENDING') {
        setShowLoadingModal(false)
        setIsPolling(true)
        setShowPollingModal(true)
        setPollingAttempt(0)
        await pollPaymentStatus(paymentId)
        return
      }

      throw new Error('Resposta inesperada do pagamento. Tente novamente.')
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Erro ao finalizar. Verifique os dados e tente novamente.'
      showAlert(String(msg).replace(/Erro ao tokenizar cartão:\s*/gi, '').trim(), 'error')
      setIsSubmitting(false)
      setShowLoadingModal(false)
      setShowPollingModal(false)
    }
  }

  const planPriceDisplay = (plan) => {
    const price = parseFloat(plan.price) || 0
    if (couponApplied && discount > 0) {
      return Math.max(0, price - (price * discount) / 100)
    }
    return price
  }

  return (
    <div className="checkout-page checkout-page--single">
      <header className="checkout-header checkout-header--compact">
        <img src={nodoLogo} alt="NODON" className="checkout-logo" />
        <h1>NODON</h1>
        <p className="checkout-header-sub">Plano, cadastro e pagamento em uma única etapa</p>
      </header>

      <div className="checkout-container checkout-single-wrap">
        <form className="checkout-single-form" onSubmit={handleSubmit}>
          {/* Planos — largura total */}
          <section className="checkout-plans-section" aria-label="Escolha do plano">
            <div className="checkout-plans-section-head">
              <div>
                <h2>Escolha seu plano</h2>
                <p className="checkout-plans-hint">
                  Compare e clique no card para selecionar.
                </p>
              </div>
              {!loadingPlans && plans.length > 0 && (
                <span className="checkout-plans-count">{plans.length} plano{plans.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {loadingPlans ? (
              <div className="checkout-plans-grid checkout-plans-grid--loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="checkout-plan-card checkout-plan-card--skeleton" aria-hidden="true">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-price" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="checkout-plans-empty">
                <p>Nenhum plano disponível no momento.</p>
              </div>
            ) : (
              <>
              <div className="checkout-plans-grid" role="radiogroup" aria-label="Planos disponíveis">
                {plans.map((plan) => {
                  const selected = selectedPlan?.id === plan.id
                  const finalPrice = planPriceDisplay(plan)
                  const expanded = expandedPlanFeatures[plan.id] === true
                  const showOldPrice =
                    (plan.oldPrice && !couponApplied) ||
                    (couponApplied && plan.price !== finalPrice)
                  const cicloInfo = getCicloFromPlano(plan)

                  return (
                    <div
                      key={plan.id}
                      role="radio"
                      tabIndex={0}
                      aria-checked={selected}
                      className={`checkout-plan-card ${selected ? 'selected' : ''} ${plan.featured ? 'featured' : ''} ${expanded ? 'features-open' : ''}`}
                      onClick={() => selectPlan(plan)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          selectPlan(plan)
                        }
                      }}
                    >
                      <span className="checkout-plan-radio" aria-hidden="true">
                        <span className="checkout-plan-radio-dot" />
                      </span>

                      {plan.badge && <span className="checkout-plan-badge">{plan.badge}</span>}

                      <div className="checkout-plan-card-header">
                        <h3 className="checkout-plan-card-name">{plan.name}</h3>
                        {plan.patients && (
                          <p className="checkout-plan-card-tagline">{plan.patients}</p>
                        )}
                        {selected && (
                          <span className="checkout-plan-selected-pill">
                            <FontAwesomeIcon icon={faCheckCircle} /> Selecionado
                          </span>
                        )}
                      </div>

                      <div className="checkout-plan-card-price">
                        {showOldPrice && (
                          <span className="checkout-plan-price-old">
                            {formatMoney(couponApplied && plan.price !== finalPrice ? plan.price : plan.oldPrice)}{cicloInfo.periodoCurto}
                          </span>
                        )}
                        <span className="checkout-plan-price-current">
                          {formatMoney(finalPrice)}
                          <small>{cicloInfo.periodoCurto}</small>
                        </span>
                      </div>

                      {plan.tokenChat && (
                        <p className="checkout-plan-tokens">
                          {formatTokens(plan.tokenChat)} de tokens no chat
                        </p>
                      )}

                     

                      {plan.features?.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="checkout-plan-features-toggle"
                            onClick={(e) => togglePlanFeatures(plan.id, e)}
                          >
                            {expanded ? 'Ocultar recursos' : 'Ver recursos'}
                            <FontAwesomeIcon icon={faChevronDown} className={expanded ? 'expanded' : ''} />
                          </button>
                          {expanded && (
                            <ul className="checkout-plan-card-features">
                              {plan.features.map((f, i) => (
                                <li key={i}>
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}

                      <span className="checkout-plan-card-cta">
                        {selected ? 'Plano ativo neste pedido' : 'Selecionar este plano'}
                      </span>
                    </div>
                  )
                })}
              </div>
              {plans.length > 1 && (
                <p className="checkout-plans-scroll-hint">Deslize para ver os planos →</p>
              )}
              <p className="checkout-plans-continue-hint">Cadastro e pagamento abaixo ↓</p>
              </>
            )}

            <div className={`checkout-coupon-bar${couponApplied ? ' checkout-coupon-bar--applied' : ''}`}>
              {couponApplied && appliedCoupon ? (
                <div className="checkout-coupon-applied">
                  <div className="checkout-coupon-applied-row">
                    <span className="checkout-coupon-applied-chip">
                      <FontAwesomeIcon icon={faTag} aria-hidden />
                      <strong>{appliedCoupon.name}</strong>
                      <span className="checkout-coupon-applied-pct">−{discount}%</span>
                    </span>
                    <button
                      type="button"
                      className="btn-coupon-remove btn-coupon-remove--link"
                      onClick={removeCoupon}
                    >
                      Remover
                    </button>
                  </div>
                  <p className="checkout-coupon-ok">
                    <FontAwesomeIcon icon={faCheckCircle} aria-hidden />
                    Desconto aplicado em todos os planos
                  </p>
                </div>
              ) : (
                <div className="checkout-coupon-inline">
                  <FontAwesomeIcon icon={faTag} aria-hidden />
                  <input
                    type="text"
                    placeholder="Cupom de desconto"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={isApplyingCoupon}
                    aria-label="Código do cupom"
                  />
                  <button
                    type="button"
                    className="btn-coupon-apply"
                    onClick={handleCouponSubmit}
                    disabled={isApplyingCoupon}
                  >
                    {isApplyingCoupon ? '…' : 'Aplicar'}
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="checkout-single-grid checkout-single-grid--form">
            {/* Dados + cartão */}
            <section className="checkout-panel checkout-panel--form">
              <h2>Seus dados e pagamento</h2>
              <div className="checkout-fields-grid">
                <label className="checkout-field full">
                  <span>Nome completo *</span>
                  <input name="nome" value={formData.nome} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field">
                  <span>E-mail *</span>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field">
                  <span>Telefone *</span>
                  <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="55 (11) 98765-4321" required />
                </label>
                <label className="checkout-field">
                  <span>CPF *</span>
                  <input name="cpf" value={formData.cpf} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field">
                  <span>Senha *</span>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} minLength={6} required />
                </label>
                <label className="checkout-field">
                  <span>Confirmar senha *</span>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
                </label>
              </div>

              <h3 className="checkout-subtitle">Endereço</h3>
              <div className="checkout-fields-grid">
                <label className="checkout-field">
                  <span>CEP *</span>
                  <input name="cep" value={formData.cep} onChange={handleCepChange} onBlur={handleCepChange} required />
                </label>
                <label className="checkout-field wide">
                  <span>Rua *</span>
                  <input name="rua" value={formData.rua} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field narrow">
                  <span>Nº *</span>
                  <input name="numero" value={formData.numero} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field">
                  <span>Complemento</span>
                  <input name="complemento" value={formData.complemento} onChange={handleInputChange} />
                </label>
                <label className="checkout-field">
                  <span>Bairro *</span>
                  <input name="bairro" value={formData.bairro} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field">
                  <span>Cidade *</span>
                  <input name="cidade" value={formData.cidade} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field narrow">
                  <span>UF *</span>
                  <select name="estado" value={formData.estado} onChange={handleInputChange} required>
                    <option value="">—</option>
                    {ESTADOS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </label>
              </div>

              <h3 className="checkout-subtitle">
                <FontAwesomeIcon icon={faLock} /> Pagamento
              </h3>
              <div className="checkout-fields-grid">
                <label className="checkout-field full">
                  <span>Número do cartão *</span>
                  <input
                    name="numeroCartao"
                    value={formData.numeroCartao}
                    onChange={(e) => setFormData((p) => ({ ...p, numeroCartao: formatCardNumber(e.target.value) }))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    required
                  />
                </label>
                <label className="checkout-field full">
                  <span>Nome no cartão *</span>
                  <input name="nomeCartao" value={formData.nomeCartao} onChange={handleInputChange} required />
                </label>
                <label className="checkout-field">
                  <span>Validade *</span>
                  <input
                    name="validade"
                    value={formData.validade}
                    onChange={(e) => setFormData((p) => ({ ...p, validade: formatExpiry(e.target.value) }))}
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                </label>
                <label className="checkout-field">
                  <span>CVV *</span>
                  <input name="cvv" value={formData.cvv} onChange={handleInputChange} maxLength={4} required />
                </label>
              </div>
            </section>

            {/* Resumo */}
            <aside className="checkout-panel checkout-panel--summary">
              <h2>Resumo</h2>
              {selectedPlan ? (
                <>
                  <p className="summary-plan-name">{selectedPlan.name}</p>
                  <div className="summary-line">
                    <span>Subtotal</span>
                    <span>{formatMoney(selectedPlan.price)}</span>
                  </div>
                  {couponApplied && (
                    <div className="summary-line discount">
                      <span>Desconto</span>
                      <span>− {formatMoney(discountValue)}</span>
                    </div>
                  )}
                  <div className="summary-total-line">
                    <span>{getCicloFromPlano(selectedPlan).resumoTotal}</span>
                    <strong>{formatMoney(total)}</strong>
                  </div>
                  <p className="summary-note">{getCicloFromPlano(selectedPlan).notaRecorrente}</p>
                </>
              ) : (
                <p className="summary-empty">Selecione um plano</p>
              )}

              <button
                type="submit"
                className="btn-checkout-submit"
                disabled={isSubmitting || isPolling || !selectedPlan}
              >
                <FontAwesomeIcon icon={faLock} />
                {isPolling ? 'Verificando...' : isSubmitting ? 'Processando...' : 'Finalizar assinatura'}
              </button>

              <p className="checkout-secure">
                <FontAwesomeIcon icon={faShieldAlt} /> Pagamento seguro via Pagar.me
              </p>
            </aside>
          </div>
        </form>
      </div>

      {customAlert.show && (
        <div className={`custom-alert ${customAlert.type}`}>
          <div className="alert-content">
            <FontAwesomeIcon icon={customAlert.type === 'success' ? faCheck : faExclamationTriangle} />
            <span>{customAlert.message}</span>
            <button type="button" onClick={() => setCustomAlert({ show: false, message: '', type: 'error' })}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      {showLoadingModal && typeof document !== 'undefined' && createPortal(
        <div className="polling-modal-overlay">
          <div className="polling-modal">
            <div className="polling-modal-content">
              <div className="polling-loader-container">
                <div className="spinner"><div className="spinner-ring" /><div className="spinner-ring" /><div className="spinner-ring" /></div>
                <div className="spinner-center"><FontAwesomeIcon icon={faLock} /></div>
              </div>
              <h2 className="polling-title">Processando</h2>
              <p className="polling-status">{loadingMessage}</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSuccessAnimation && typeof document !== 'undefined' && createPortal(
        <div className="success-animation-overlay">
          <div className="success-animation-modal">
            <img src={nodoLogo} alt="NODON" className="success-logo" />
            <h2 className="success-title">Pagamento confirmado!</h2>
            <p className="success-message">Sua assinatura foi ativada.</p>
            {periodoGratis?.ativo && (
              <p className="success-free-trial">
                Período grátis de {periodoGratis.diasRestantes} dias ativado.
              </p>
            )}
            <p className="success-loading">Redirecionando para o login...</p>
          </div>
        </div>,
        document.body
      )}

      {showPollingModal && typeof document !== 'undefined' && createPortal(
        <div className="polling-modal-overlay">
          <div className="polling-modal">
            <div className="polling-modal-content">
              <h2 className="polling-title">Verificando pagamento</h2>
              <p className="polling-status">{pollingStatus}</p>
              <div className="polling-progress-bar-wrapper">
                <div className="polling-progress-bar-fill" style={{ width: `${(pollingAttempt / 3) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <FloatingWhatsApp />
    </div>
  )
}

export default Checkout
