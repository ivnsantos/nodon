import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCreditCard, faMapMarkerAlt, faCheckCircle,
  faChevronRight, faChevronLeft, faTag, faLock, faChevronDown,
  faExclamationTriangle, faTimes, faCheck, faUser, faEnvelope, faPhone, faIdCard, faHome, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import './Checkout.css'

const Register = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { register } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [customAlert, setCustomAlert] = useState({ show: false, message: '', type: 'error' })
  const [loading, setLoading] = useState(false)
  const [showAddressFields, setShowAddressFields] = useState(false)
  
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

  const plans = [
    {
      id: 'inicial',
      name: 'Plano Inicial',
      price: 98,
      oldPrice: 159,
      patients: 'Até 12 análises por mês',
      features: [
        'Análise de radiografias',
        'Relatórios detalhados',
        'Suporte por email',
        'Armazenamento na nuvem',
        '1 milhão de tokens no chat da NODON'
      ]
    },
    {
      id: 'basico',
      name: 'Plano Básico',
      price: 179,
      oldPrice: 299,
      patients: 'Até 30 análises por mês',
      featured: true,
      features: [
        'Tudo do Plano Inicial',
        'Análise avançada com IA',
        'Suporte prioritário',
        'Múltiplos profissionais',
        'Relatórios personalizados',
        '1 milhão de tokens no chat da NODON'
      ]
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 299,
      patients: 'Até 50 análises por mês',
      badge: 'Novo',
      features: [
        'Tudo do Plano Básico',
        'Suporte 24/7',
        'Treinamento dedicado',
        '1.5 milhão de tokens no chat da NODON',
        'Gerente de Conta especializado'
      ]
    },
    {
      id: 'essencial',
      name: 'Plano Essencial',
      price: 399,
      patients: 'Até 120 análises por mês',
      badge: 'Mais Vendido',
      features: [
        'Tudo do Plano Premium',
        'Suporte 24/7',
        'Treinamento dedicado',
        '1.5 milhão de tokens no chat da NODON',
        'Gerente de Conta especializado'
      ]
    },
    {
      id: 'enterprise',
      name: 'Plano Enterprise',
      price: 499,
      patients: 'Até 200 análises por mês',
      features: [
        'Tudo do Plano Essencial',
        'Suporte 24/7',
        'Treinamento dedicado',
        '1.5 milhão de tokens no chat da NODON',
        'Gerente de Conta especializado'
      ]
    }
  ]

  useEffect(() => {
    // Verificar se há plano na query
    const planId = searchParams.get('plano')
    if (planId) {
      const plan = plans.find(p => p.id === planId)
      if (plan) {
        setSelectedPlan(plan)
      }
    }

    // Verificar se há cupom na query
    const coupon = searchParams.get('cupom')
    if (coupon) {
      setCouponCode(coupon)
      applyCoupon(coupon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const applyCoupon = (code) => {
    const validCoupons = {
      'DESCONTO10': 10,
      'DESCONTO20': 20,
      'BEMVINDO': 15,
      'NODON2024': 25
    }

    if (validCoupons[code.toUpperCase()]) {
      setDiscount(validCoupons[code.toUpperCase()])
      setCouponApplied(true)
      return true
    }
    return false
  }

  const showAlert = (message, type = 'error') => {
    setCustomAlert({ show: true, message, type })
    setTimeout(() => {
      setCustomAlert({ show: false, message: '', type: 'error' })
    }, 5000)
  }

  const formatPhone = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Formata como (00) 00000-0000
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`
        if (p2) return `(${p1}) ${p2}`
        if (p1) return `(${p1}`
        return ''
      })
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`
        if (p2) return `(${p1}) ${p2}`
        if (p1) return `(${p1}`
        return ''
      })
    }
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
    const subtotal = selectedPlan.price
    const discountAmount = (subtotal * discount) / 100
    return subtotal - discountAmount
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('plano', plan.id)
    setSearchParams(newSearchParams, { replace: true })
  }

  const handlePlanToggle = (planId, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setExpandedPlan(expandedPlan === planId ? null : planId)
  }

  const handleCouponSubmit = (e) => {
    e.preventDefault()
    if (applyCoupon(couponCode)) {
      showAlert('Cupom aplicado com sucesso!', 'success')
    } else {
      showAlert('Cupom inválido')
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedPlan) {
        showAlert('Por favor, selecione um plano para continuar')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.nome || !formData.email || !formData.password || !formData.telefone || !formData.cpf) {
        showAlert('Por favor, preencha todos os campos obrigatórios')
        return
      }
      // Validar se as senhas coincidem
      if (formData.password !== formData.confirmPassword) {
        showAlert('As senhas não coincidem. Por favor, verifique.')
        return
      }
      // Validar tamanho mínimo da senha
      if (formData.password.length < 6) {
        showAlert('A senha deve ter no mínimo 6 caracteres')
        return
      }
      if (!formData.cep || !formData.rua || !formData.numero || !formData.cidade || !formData.estado) {
        showAlert('Por favor, preencha todos os campos de endereço')
        return
      }
    }
    if (currentStep === 3) {
      if (!formData.numeroCartao || !formData.nomeCartao || !formData.validade || !formData.cvv) {
        showAlert('Por favor, preencha todos os dados do cartão')
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Validar se as senhas coincidem antes de enviar
    if (formData.password !== formData.confirmPassword) {
      showAlert('As senhas não coincidem. Por favor, verifique.')
      setLoading(false)
      return
    }
    
    // Validar tamanho mínimo da senha
    if (formData.password.length < 6) {
      showAlert('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }
    
    try {
      const result = await register({
        nome: formData.nome,
        email: formData.email,
        password: formData.password,
        tipo: 'usuario',
        plan: selectedPlan?.id,
        endereco: {
          cep: formData.cep,
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        }
      })
      
      if (result.success) {
        showAlert('Cadastro realizado com sucesso! Redirecionando...', 'success')
        setTimeout(() => {
          navigate('/app')
        }, 2000)
      } else {
        showAlert(result.message || 'Erro ao realizar cadastro. Tente novamente.')
        setLoading(false)
      }
    } catch (error) {
      showAlert('Erro ao processar cadastro. Tente novamente.')
      setLoading(false)
    }
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
        <h1>Crie sua Conta</h1>
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
                      disabled={couponApplied}
                    />
                  </div>
                  <button type="submit" disabled={couponApplied || !couponCode}>
                    {couponApplied ? 'Aplicado' : 'Aplicar'}
                  </button>
                </form>
                {couponApplied && (
                  <div className="coupon-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Desconto de {discount}% aplicado!</span>
                  </div>
                )}
              </div>

              <div className="plans-grid-checkout">
                {plans.map(plan => {
                  const finalPrice = couponApplied 
                    ? Math.round(plan.price - (plan.price * discount / 100))
                    : plan.price
                  
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
                              <span className="price-old">De: R$ {plan.oldPrice}/mês*</span>
                              <span className="price-new">Por: R$ {plan.price}/mês*</span>
                            </>
                          ) : couponApplied && plan.price !== finalPrice ? (
                            <>
                              <span className="price-old">De: R$ {plan.price}/mês*</span>
                              <span className="price-new">Por: R$ {finalPrice}/mês*</span>
                            </>
                          ) : (
                            <span className="price-single">R$ {finalPrice}/mês*</span>
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
                    </div>
                  )
                })}
              </div>
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
                      <label>CPF/CNPJ *</label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        maxLength="18"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
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
                      <label>
                        <FontAwesomeIcon icon={faPhone} /> Telefone *
                      </label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="(00) 00000-0000"
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
                  
                  {(showAddressFields || formData.cep.replace(/\D/g, '').length === 8) && (
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
              
              {selectedPlan && (
                <div className="order-summary">
                  <h3>Resumo do Pedido</h3>
                  <div className="summary-item">
                    <span>Plano: {selectedPlan.name}</span>
                    <span>R$ {selectedPlan.price.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="summary-item discount">
                      <span>Desconto ({discount}%)</span>
                      <span>- R$ {((selectedPlan.price * discount) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-total">
                    <span>Total</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="coupon-section">
                <form onSubmit={handleCouponSubmit} className="coupon-form">
                  <input
                    type="text"
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                  />
                  <button type="submit" disabled={couponApplied || !couponCode}>
                    {couponApplied ? 'Aplicado' : 'Aplicar'}
                  </button>
                </form>
              </div>

              <form className="checkout-form" onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>
                    <FontAwesomeIcon icon={faLock} /> Dados do Cartão
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <FontAwesomeIcon icon={faCreditCard} /> Número do Cartão
                      </label>
                      <input
                        type="text"
                        name="numeroCartao"
                        value={formData.numeroCartao}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value)
                          setFormData(prev => ({ ...prev, numeroCartao: formatted }))
                        }}
                        placeholder="XXXX XXXX XXXX XXXX"
                        maxLength="19"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <FontAwesomeIcon icon={faUser} /> Nome no Cartão
                      </label>
                      <input
                        type="text"
                        name="nomeCartao"
                        value={formData.nomeCartao}
                        onChange={handleInputChange}
                        placeholder="Nome Completo"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <FontAwesomeIcon icon={faCalendarAlt} /> Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        name="validade"
                        value={formData.validade}
                        onChange={(e) => {
                          const formatted = formatExpiry(e.target.value)
                          setFormData(prev => ({ ...prev, validade: formatted }))
                        }}
                        placeholder="MM/AA"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <FontAwesomeIcon icon={faLock} /> CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value.length <= 3) {
                            setFormData(prev => ({ ...prev, cvv: value }))
                          }
                        }}
                        placeholder="XXX"
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Parcelas</label>
                      <select
                        name="parcelas"
                        value={formData.parcelas}
                        onChange={handleInputChange}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}x de R$ {(calculateTotal() / (i + 1)).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="checkout-actions">
            {currentStep > 1 && (
              <button className="btn-back" onClick={() => setCurrentStep(prev => prev - 1)}>
                <FontAwesomeIcon icon={faChevronLeft} />
                Voltar
              </button>
            )}
            {currentStep < 3 ? (
              <button 
                className="btn-next" 
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedPlan}
              >
                Continuar
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            ) : (
              <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                <FontAwesomeIcon icon={faLock} />
                {loading ? 'Processando...' : 'Finalizar Cadastro'}
              </button>
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
    </div>
  )
}

export default Register
