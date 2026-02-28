import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard, faCheckCircle,
  faChevronRight, faChevronLeft, faChevronDown, faTag, faLock,
  faExclamationTriangle, faTimes, faCheck, faArrowLeft
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import { useAuth } from '../context/useAuth'
import './Checkout.css'

const AddClinic = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [discountValue, setDiscountValue] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  
  // Form data - apenas dados do cartão
  const [formData, setFormData] = useState({
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
        const response = await api.get('/planos')
        
        const planosBackend = response.data?.data || response.data || []
        
        if (!Array.isArray(planosBackend)) {
          console.error('Resposta da API não é um array:', planosBackend)
          showAlert('Erro ao carregar planos. Formato inválido.', 'error')
          return
        }

        const planosMapeados = planosBackend.map((plano) => {
          let features = []
          let featured = false
          let badge = null

          if (plano.nome?.toLowerCase().includes('básico')) {
            features = ['12 análises por mês', '1.500.000 tokens de chat', 'Suporte por email']
            featured = false
          } else if (plano.nome?.toLowerCase().includes('intermediário') || plano.nome?.toLowerCase().includes('intermediario')) {
            features = ['30 análises por mês', '3.000.000 tokens de chat', 'Suporte prioritário']
            featured = true
            badge = 'Mais Popular'
          } else if (plano.nome?.toLowerCase().includes('avançado') || plano.nome?.toLowerCase().includes('avancado')) {
            features = ['Análises ilimitadas', 'Tokens ilimitados', 'Suporte 24/7', 'Relatórios avançados']
            featured = false
          } else {
            features = plano.descricao ? [plano.descricao] : ['Recursos do plano']
          }

          return {
            id: plano.id,
            name: plano.nome,
            price: Number(plano.valor || plano.valorPromocional || plano.valorOriginal || 0),
            originalPrice: Number(plano.valorOriginal || plano.valor || 0),
            features: features,
            featured: featured,
            badge: badge,
            limiteAnalises: plano.analises || plano.limiteAnalises || 0,
            tokenChat: plano.tokenChat || 0,
            valorPromocional: Number(plano.valorPromocional || 0),
            valorOriginal: Number(plano.valorOriginal || plano.valor || 0)
          }
        })

        setPlans(planosMapeados)
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
        showAlert('Erro ao carregar planos. Tente novamente.', 'error')
      } finally {
        setLoadingPlans(false)
      }
    }

    loadPlans()
  }, [])

  // Aplicar cupom
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      return false
    }

    if (!selectedPlan) {
      showAlert('Por favor, selecione um plano primeiro')
      return false
    }

    // Garantir que o código do cupom sempre seja enviado em maiúsculas
    const codigoNormalizado = code.toString().toUpperCase().trim()

    setIsApplyingCoupon(true)
    try {
      const response = await api.get(`/cupons/name/${codigoNormalizado}`)
      const cupom = response.data

      if (!cupom || !cupom.active) {
        showAlert('Cupom inválido ou inativo', 'error')
        setIsApplyingCoupon(false)
        return false
      }

      setAppliedCoupon(cupom)
      const discountPercent = Number(cupom.discountValue) || 0
      setDiscount(discountPercent)
      
      if (selectedPlan) {
        const planPrice = Number(selectedPlan.price) || 0
        if (planPrice > 0) {
          const discountInReais = (planPrice * discountPercent) / 100
          setDiscountValue(discountInReais)
        }
      }
      
      setCouponApplied(true)
      setIsApplyingCoupon(false)
      return true
    } catch (error) {
      console.error('Erro ao validar cupom:', error)
      if (error.response?.status === 404) {
        showAlert('Cupom não encontrado', 'error')
      } else {
        showAlert('Erro ao validar cupom. Tente novamente.', 'error')
      }
      setIsApplyingCoupon(false)
      return false
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showAlert('Por favor, informe um código de cupom')
      return
    }

    const success = await applyCoupon(couponCode)
    if (success) {
      showAlert('Cupom aplicado com sucesso!', 'success')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'numeroCartao') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'validade') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/')
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 4)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
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
    const subtotal = Number(selectedPlan.price) || 0
    const discountAmount = Number(discountValue) || 0
    const total = subtotal - discountAmount
    return total > 0 ? total : 0
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedPlan) {
        showAlert('Por favor, selecione um plano para continuar')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.numeroCartao || !formData.nomeCartao || !formData.validade || !formData.cvv) {
        showAlert('Por favor, preencha todos os dados do cartão')
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    } else {
      navigate('/select-clinic')
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [showPollingModal, setShowPollingModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [pollingAttempt, setPollingAttempt] = useState(0)
  const [pollingStatus, setPollingStatus] = useState('Verificando pagamento...')
  const [loadingMessage, setLoadingMessage] = useState('Criando assinatura...')

  useEffect(() => {
    if (showLoadingModal || showPollingModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showLoadingModal, showPollingModal])

  const pollPaymentStatus = async () => {
    const maxAttempts = 3
    const interval = 5000
    let attempts = 0

    const poll = async () => {
      attempts++
      setPollingAttempt(attempts)
      setPollingStatus(`Verificando pagamento... (Tentativa ${attempts}/${maxAttempts})`)

      try {
        // Verificar assinatura atual do usuário
        const response = await api.get('/assinaturas/minha?sync=true')
        const assinatura = response.data?.data || response.data

        if (assinatura?.status === 'ACTIVE') {
          setPollingStatus('Pagamento confirmado!')
          setIsPolling(false)
          setIsSubmitting(false)
          showAlert('Pagamento confirmado! Redirecionando...', 'success')
          
          // Atualizar dados do usuário antes de redirecionar
          await refreshUser()
          
          setTimeout(() => {
            setShowPollingModal(false)
            navigate('/select-clinic')
          }, 2000)
          return
        }

        if (attempts >= maxAttempts) {
          setPollingStatus('Não foi possível confirmar o pagamento automaticamente.')
          setIsPolling(false)
          setIsSubmitting(false)
          showAlert('Tempo de espera esgotado. Verifique o status do pagamento mais tarde.', 'error')
          
          // Atualizar dados do usuário antes de redirecionar
          await refreshUser()
          
          setTimeout(() => {
            setShowPollingModal(false)
            navigate('/select-clinic')
          }, 2000)
          return
        }

        setTimeout(poll, interval)
      } catch (error) {
        if (attempts >= maxAttempts) {
          setPollingStatus('Erro ao verificar pagamento. Tente novamente mais tarde.')
          setIsPolling(false)
          setIsSubmitting(false)
          showAlert('Erro ao verificar status do pagamento. Verifique mais tarde.', 'error')
          
          // Atualizar dados do usuário antes de redirecionar
          await refreshUser()
          
          setTimeout(() => {
            setShowPollingModal(false)
            navigate('/select-clinic')
          }, 2000)
          return
        }

        setTimeout(poll, interval)
      }
    }

    setTimeout(poll, interval)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      setShowLoadingModal(true)
      setLoadingMessage('Criando assinatura...')

      const [expiryMonth, expiryYear] = formData.validade.split('/')
      const fullYear = `20${expiryYear}`

      const payload = {
        planoId: selectedPlan.id,
        billingType: 'CREDIT_CARD',
        creditCardHolderName: formData.nomeCartao,
        creditCardNumber: formData.numeroCartao.replace(/\D/g, ''),
        creditCardExpiryMonth: expiryMonth,
        creditCardExpiryYear: fullYear,
        creditCardCcv: formData.cvv,
        ...(appliedCoupon && couponCode ? { couponName: couponCode.toUpperCase().trim() } : {}),
      }

      const response = await api.post('/assinaturas/simple', payload)
      
      const responseData = response.data?.data || response.data
      
      if (!responseData) {
        throw new Error('Resposta inválida do servidor')
      }
      
      setShowLoadingModal(false)
      setIsPolling(true)
      setShowPollingModal(true)
      setPollingAttempt(0)
      setPollingStatus('Verificando pagamento...')
      await pollPaymentStatus()
      
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao processar pagamento. Tente novamente.'
      showAlert(errorMessage, 'error')
      setIsSubmitting(false)
      setShowLoadingModal(false)
      setShowPollingModal(false)
    }
  }

  const steps = [
    { number: 1, title: 'Escolha o Plano', icon: faCheckCircle },
    { number: 2, title: 'Pagamento', icon: faCreditCard }
  ]

  return (
    <div className="checkout-page">
      <button
        onClick={() => navigate('/select-clinic')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Voltar
      </button>

      <div className="checkout-container">
        <div className="checkout-header">
          <img src={nodoLogo} alt="NODON" className="checkout-logo" />
          <h1>Adicionar</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.125rem', marginTop: '0.5rem' }}>Escolha um plano e complete o pagamento</p>
        </div>

        <div className="checkout-steps">
          {steps.map((step, index) => (
            <div key={step.number} className={`step ${currentStep >= step.number ? 'active' : ''}`}>
              <div className="step-number">
                {currentStep > step.number ? (
                  <FontAwesomeIcon icon={faCheck} />
                ) : (
                  step.number
                )}
              </div>
              <span className="step-title">{step.title}</span>
              {index < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

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

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            {/* Step 1: Seleção de Plano */}
            {currentStep === 1 && (
              <div className="checkout-step">
              <h2>Escolha seu plano</h2>
              {loadingPlans ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#ffffff' }}>
                  Carregando planos...
                </div>
              ) : (
                <div className="plans-grid-checkout">
                  {plans.map(plan => {
                    const planPrice = Number(plan.price) || 0
                    const discountPercent = Number(discount) || 0
                    const finalPrice = couponApplied && appliedCoupon && selectedPlan?.id === plan.id && discountPercent > 0
                      ? Math.max(0, Math.round(planPrice - discountValue))
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
                            {plan.originalPrice && Number(plan.originalPrice) > planPrice && !couponApplied ? (
                              <>
                                <span className="price-old">De: R$ {Number(plan.originalPrice || 0).toFixed(2).replace('.', ',')}/mês*</span>
                                <span className="price-new">Por: R$ {planPrice.toFixed(2).replace('.', ',')}/mês*</span>
                              </>
                            ) : couponApplied && appliedCoupon && selectedPlan?.id === plan.id && planPrice !== finalPrice ? (
                              <>
                                <span className="price-old">De: R$ {planPrice.toFixed(2).replace('.', ',')}/mês*</span>
                                <span className="price-new">Por: R$ {finalPrice.toFixed(2).replace('.', ',')}/mês*</span>
                              </>
                            ) : (
                              <span className="price-single">R$ {finalPrice.toFixed(2).replace('.', ',')}/mês*</span>
                            )}
                          </div>
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
                        <p className="plan-note">*Plano mensal. Cobrança recorrente com renovação automática.</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedPlan && (
                <div className="coupon-section-step1">
                  <form onSubmit={(e) => { e.preventDefault(); handleApplyCoupon(); }} className="coupon-form">
                    <div className="coupon-input-wrapper">
                      <FontAwesomeIcon icon={faTag} className="coupon-icon" />
                      <input
                        type="text"
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={isApplyingCoupon || couponApplied}
                      />
                    </div>
                    <button type="submit" disabled={isApplyingCoupon || !couponCode || couponApplied}>
                      {isApplyingCoupon ? 'Aplicando...' : couponApplied ? 'Aplicado' : 'Aplicar'}
                    </button>
                  </form>
                  {couponApplied && appliedCoupon && (
                    <div className="coupon-success">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Cupom "{appliedCoupon.name || appliedCoupon.codigo}" aplicado! Desconto de {discount}%</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponApplied(false)
                          setAppliedCoupon(null)
                          setCouponCode('')
                          setDiscount(0)
                          setDiscountValue(0)
                        }}
                        className="coupon-remove"
                        title="Remover cupom"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="checkout-step-actions">
                <button type="button" onClick={handleBack} className="btn-back">
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Voltar
                </button>
                <button type="button" onClick={handleNext} className="btn-checkout-next" disabled={!selectedPlan}>
                  Continuar
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pagamento */}
          {currentStep === 2 && (
            <div className="checkout-step">
              <h2>Dados do Cartão</h2>
              
              <div className="order-summary">
                <h3>Resumo do Pedido</h3>
                <div className="summary-item">
                  <span>Plano:</span>
                  <span>{selectedPlan?.name}</span>
                </div>
                {couponApplied && appliedCoupon && (
                  <div className="summary-item discount">
                    <span>Desconto ({discount}%):</span>
                    <span>- R$ {Number(discountValue || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>R$ {Number(calculateTotal()).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Número do Cartão</label>
                <input
                  type="text"
                  name="numeroCartao"
                  value={formData.numeroCartao}
                  onChange={handleInputChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nome no Cartão</label>
                <input
                  type="text"
                  name="nomeCartao"
                  value={formData.nomeCartao}
                  onChange={handleInputChange}
                  placeholder="Nome como está no cartão"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Validade</label>
                  <input
                    type="text"
                    name="validade"
                    value={formData.validade}
                    onChange={handleInputChange}
                    placeholder="MM/AA"
                    maxLength="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="checkout-step-actions">
                <button type="button" onClick={handleBack} className="btn-back">
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Voltar
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Processando...' : 'Finalizar Pagamento'}
                  {!isSubmitting && <FontAwesomeIcon icon={faChevronRight} />}
                </button>
              </div>
            </div>
          )}
          </form>
        </div>
      </div>

      {/* Loading Modal */}
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
              <h2 className="polling-title">
                <FontAwesomeIcon icon={faCheckCircle} />
                Processando Pagamento
              </h2>
              <p className="polling-status">{loadingMessage}</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Polling Modal */}
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
              <h2 className="polling-title">
                <FontAwesomeIcon icon={faCheckCircle} />
                Verificando Pagamento
              </h2>
              <p className="polling-status">{pollingStatus}</p>
              <div className="polling-progress-container">
                <div 
                  className="polling-progress-bar-fill" 
                  style={{ width: `${(pollingAttempt / 3) * 100}%` }}
                ></div>
              </div>
              <div className="polling-progress-info">
                <span className="polling-attempt-text">Tentativa {pollingAttempt} de 3</span>
              </div>
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

export default AddClinic
