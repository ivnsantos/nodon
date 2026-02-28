import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, 
  faEnvelope, 
  faLock, 
  faIdCard, 
  faPhone, 
  faMapMarkerAlt,
  faBuilding,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import './RegisterByHash.css'

const RegisterByHash = () => {
  const { hash } = useParams()
  const navigate = useNavigate()
  const { user, login } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [clinicData, setClinicData] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(3)
  const countdownIntervalRef = useRef(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    telefone: '',
    cro: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: '',
    ativo: true
  })

  const [formErrors, setFormErrors] = useState({})
  const [loadingCep, setLoadingCep] = useState(false)

  // Buscar dados do cliente master pelo hash
  useEffect(() => {
    const fetchClinicData = async () => {
      if (!hash) {
        setError('Hash inválido')
        setLoading(false)
        return
      }

      try {
        // Buscar dados completos do cliente master usando o hash
        const response = await api.get(`/clientes-master/hash/${hash}`)
        
        if (response.data.statusCode === 200) {
          const data = response.data.data || response.data
          setClinicData(data)
        } else {
          setError('Consultório não encontrado ou link inválido.')
        }
      } catch (error) {
        console.error('Erro ao buscar dados do consultório:', error)
        setError('Erro ao carregar dados do consultório. Verifique se o link está correto.')
      } finally {
        setLoading(false)
      }
    }

    fetchClinicData()
  }, [hash])

  // Preencher dados do usuário se estiver logado
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        nome: user.nome || prev.nome,
        cpf: user.cpf || prev.cpf,
        telefone: user.telefone || prev.telefone,
        postalCode: user.postalCode || prev.postalCode,
        address: user.address || prev.address,
        addressNumber: user.addressNumber || prev.addressNumber,
        complement: user.complement || prev.complement,
        province: user.province || prev.province,
        city: user.city || prev.city,
        state: user.state || prev.state
      }))
    }
  }, [user])

  // Limpar intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [])

  // Função para formatar CPF
  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return value
  }

  // Função para formatar telefone com código do país 55
  const formatTelefone = (value) => {
    // Remove tudo que não é número
    let numbers = value.replace(/\D/g, '')
    
    // Se começar com 55, remove para não duplicar
    if (numbers.startsWith('55')) {
      numbers = numbers.substring(2)
    }
    
    // Limita a 11 dígitos (DDD + número de 9 dígitos para celular ou 8 para fixo)
    // Mas permite até 11 dígitos completos
    if (numbers.length > 11) {
      numbers = numbers.slice(0, 11)
    }
    
    // Formata: +55 (DD) 9XXXX-XXXX para celular ou +55 (DD) XXXX-XXXX para fixo
    if (numbers.length === 0) {
      return ''
    } else if (numbers.length <= 2) {
      return `+55 (${numbers}`
    } else if (numbers.length <= 6) {
      return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length === 10) {
      // Telefone fixo: +55 (DD) XXXX-XXXX (10 dígitos)
      return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    } else if (numbers.length === 11) {
      // Celular: +55 (DD) 9XXXX-XXXX (11 dígitos)
      // Garantir que pega todos os 11 dígitos: DDD (2) + 9 dígitos (9)
      // DDD: posições 0-1 (2 dígitos)
      // Primeira parte: posições 2-6 (5 dígitos) = slice(2, 7)
      // Segunda parte: posições 7-10 (4 dígitos) = slice(7, 11) ou slice(7)
      const ddd = numbers.substring(0, 2)
      const parte1 = numbers.substring(2, 7)
      const parte2 = numbers.substring(7, 11)
      return `+55 (${ddd}) ${parte1}-${parte2}`
    } else {
      // Para qualquer outro caso, retornar formatado até onde conseguir
      return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value
    
    // Formatar CPF
    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    }
    
    // Formatar telefone
    if (name === 'telefone') {
      formattedValue = formatTelefone(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    const formattedCep = cep.replace(/(\d{5})(\d)/, '$1-$2')
    setFormData(prev => ({ ...prev, postalCode: formattedCep }))

    if (cep.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (data.erro) {
          setFormErrors(prev => ({
            ...prev,
            postalCode: 'CEP não encontrado. Verifique o CEP digitado ou preencha manualmente.'
          }))
          setLoadingCep(false)
          return
        }

        setFormData(prev => ({
          ...prev,
          address: data.logradouro || '',
          province: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          complement: data.complemento || prev.complement
        }))
        setFormErrors(prev => ({
          ...prev,
          postalCode: ''
        }))
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        setFormErrors(prev => ({
          ...prev,
          postalCode: 'Erro ao buscar CEP. Você pode preencher manualmente.'
        }))
      } finally {
        setLoadingCep(false)
      }
    } else if (cep.length < 8) {
      // Limpar campos se CEP incompleto
      setFormData(prev => ({
        ...prev,
        address: '',
        province: '',
        city: '',
        state: ''
      }))
      setFormErrors(prev => ({
        ...prev,
        postalCode: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido'
    }

    if (!user) {
      // Apenas validar senha se não estiver logado
      if (!formData.password) {
        errors.password = 'Senha é obrigatória'
      } else if (formData.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres'
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'As senhas não coincidem'
      }
    }

    if (!formData.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório'
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      errors.cpf = 'CPF inválido (deve ter 11 dígitos)'
    }

    if (!formData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório'
    } else {
      // Validar que tem pelo menos 10 dígitos (DDD + número) ou 11 dígitos (DDD + celular)
      const telefoneLimpo = formData.telefone.replace(/\D/g, '')
      const telefoneSem55 = telefoneLimpo.startsWith('55') ? telefoneLimpo.substring(2) : telefoneLimpo
      if (telefoneSem55.length < 10 || telefoneSem55.length > 11) {
        errors.telefone = 'Telefone inválido (deve ter 10 ou 11 dígitos)'
      }
    }

    // CRO é opcional - não precisa validar

    setFormErrors(errors)
    
    // Se houver erros, mostrar mensagem geral
    if (Object.keys(errors).length > 0) {
      setError('Por favor, corrija os erros no formulário antes de continuar.')
      // Scroll para o topo para mostrar o erro
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar formulário e mostrar erros
    if (!validateForm()) {
      // Scroll para o primeiro erro
      const firstErrorField = Object.keys(formErrors)[0]
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess(false)
    // Limpar erros de validação ao submeter
    setFormErrors({})

    try {
      let telefoneLimpo = formData.telefone.replace(/\D/g, '')
      
      // Remover o código 55 se já estiver presente para processar
      let telefoneSem55 = telefoneLimpo
      if (telefoneLimpo.startsWith('55')) {
        telefoneSem55 = telefoneLimpo.substring(2)
      }
      
      // Validar que tem pelo menos 10 dígitos (DDD + número) ou 11 dígitos (DDD + celular)
      if (telefoneSem55.length < 10 || telefoneSem55.length > 11) {
        setError('Telefone inválido. Deve ter 10 ou 11 dígitos (incluindo DDD).')
        setSubmitting(false)
        return
      }
      
      // Garantir que o código 55 está presente no telefone enviado
      const telefoneFinal = '55' + telefoneSem55
      
      const payload = {
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: telefoneFinal,
        cro: formData.cro.trim() || '000000', // Se não preenchido, enviar 6 zeros
        postalCode: formData.postalCode.replace(/\D/g, ''),
        address: formData.address,
        addressNumber: formData.addressNumber,
        complement: formData.complement,
        province: formData.province,
        city: formData.city,
        state: formData.state,
        ativo: formData.ativo
      }

      // Se não estiver logado, incluir senha
      if (!user) {
        payload.password = formData.password
      }

      const response = await api.post(`/clientes-master/register-by-hash/${hash}`, payload)

      if (response.data.statusCode === 200 || response.status === 200 || response.status === 201) {
        // Limpar erros e mostrar sucesso
        setError('')
        setSuccess(true)
        setSubmitting(false)
        setRedirectCountdown(3)
        
        // Scroll para o topo para mostrar mensagem de sucesso
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
        
        // Contador regressivo antes de redirecionar
        countdownIntervalRef.current = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
              }
              navigate('/login')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        const errorMsg = response.data?.message || response.data?.error || 'Erro ao realizar cadastro'
        setError(errorMsg)
        setSuccess(false)
        // Scroll para o topo para mostrar o erro
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      
      // Extrair mensagem de erro de forma mais detalhada
      let errorMessage = 'Erro ao realizar cadastro. Tente novamente.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (Array.isArray(errorData.errors)) {
          // Se for array de erros, mostrar o primeiro
          errorMessage = errorData.errors[0]?.message || errorData.errors[0] || errorMessage
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      // Scroll para o topo para mostrar o erro
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const Header = () => (
    <header className="nodon-header">
      <div className="nodon-header-content">
        <img src={nodoLogo} alt="Nodon Logo" className="nodon-icon" />
        <h1 className="nodon-logo">Nodon</h1>
      </div>
    </header>
  )

  const Footer = () => (
    <footer className="nodon-footer">
      <div className="nodon-footer-content">
        <p>&copy; {new Date().getFullYear()} Nodon. Todos os direitos reservados.</p>
      </div>
    </footer>
  )

  if (loading) {
    return (
      <div className="register-by-hash-page">
        <Header />
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Carregando informações do consultório...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error && !clinicData) {
    return (
      <div className="register-by-hash-page">
        <Header />
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
          <h2>Erro</h2>
          <p>{error}</p>
          <Link to="/login" className="btn-primary">Ir para Login</Link>
        </div>
        <Footer />
      </div>
    )
  }

  const clienteMaster = clinicData?.clienteMaster || clinicData

  return (
    <div className="register-by-hash-page">
      <Header />
      <div className="register-by-hash-container">
        <div className="clinic-info-card">
          <div className="clinic-header">
            {clienteMaster?.logo ? (
              <img src={clienteMaster.logo} alt={clienteMaster.nomeEmpresa} className="clinic-logo" />
            ) : (
              <div className="clinic-logo-placeholder" style={{ background: clienteMaster?.cor || '#0ea5e9' }}>
                <FontAwesomeIcon icon={faBuilding} />
              </div>
            )}
            <h2 style={{ color: clienteMaster?.cor || '#0ea5e9' }}>
              {clienteMaster?.nomeEmpresa || 'Consultório'}
            </h2>
            {clienteMaster?.cnpj && (
              <p className="clinic-cnpj">CNPJ: {clienteMaster.cnpj}</p>
            )}
          </div>
          <div className="clinic-description">
            <p>Você está sendo convidado para fazer parte da equipe deste consultório.</p>
            {user && (
              <div className="user-logged-info">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Você está logado como: <strong>{user.email}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="register-form-card">
          <h3>{user ? 'Vincular-se ao Consultório' : 'Cadastro de Profissional'}</h3>
          
          {error && !success && (
            <div className="error-message" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <div>
                <strong>Erro ao cadastrar:</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="success-message success-animation" role="alert">
              <div className="success-icon-wrapper">
                <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
              </div>
              <div className="success-content">
                <strong>Cadastro realizado com sucesso! ✅</strong>
                <p>
                  {user 
                    ? 'Você foi vinculado ao consultório com sucesso!'
                    : 'Seu cadastro foi realizado com sucesso!'
                  }
                </p>
                <p className="redirect-info">
                  Redirecionando para login em <span className="countdown">{redirectCountdown}</span> segundo{redirectCountdown !== 1 ? 's' : ''}...
                </p>
              </div>
            </div>
          )}

          {!user && (
            <div className="login-prompt">
              <p>Já possui uma conta?</p>
              <Link to={`/login?redirect=/profissional/${hash}`} className="login-link">
                Faça login aqui
              </Link>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="nome">
                <FontAwesomeIcon icon={faUser} />
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                disabled={submitting || success}
              />
              {formErrors.nome && <span className="field-error">{formErrors.nome}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} />
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={submitting || success || !!user}
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            {!user && (
              <>
                <div className="form-group">
                  <label htmlFor="password">
                    <FontAwesomeIcon icon={faLock} />
                    Senha *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || success}
                  />
                  {formErrors.password && <span className="field-error">{formErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FontAwesomeIcon icon={faLock} />
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || success}
                  />
                  {formErrors.confirmPassword && <span className="field-error">{formErrors.confirmPassword}</span>}
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cpf">
                  <FontAwesomeIcon icon={faIdCard} />
                  CPF *
                </label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                  disabled={submitting || success}
                  maxLength={14}
                  placeholder="000.000.000-00"
                />
                {formErrors.cpf && <span className="field-error">{formErrors.cpf}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefone">
                  <FontAwesomeIcon icon={faPhone} />
                  Telefone *
                </label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  required
                  disabled={submitting || success}
                  maxLength={20}
                  placeholder="+55 (99) 99999-9999"
                />
                {formErrors.telefone && <span className="field-error">{formErrors.telefone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cro">
                <FontAwesomeIcon icon={faIdCard} />
                CRO (Conselho Regional de Odontologia)
              </label>
              <input
                type="text"
                id="cro"
                name="cro"
                value={formData.cro}
                onChange={handleInputChange}
                disabled={submitting || success}
                placeholder="Opcional"
              />
              {formErrors.cro && <span className="field-error">{formErrors.cro}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                CEP
                {loadingCep && <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '0.5rem' }} />}
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleCepChange}
                onBlur={handleCepChange}
                disabled={submitting || success}
                maxLength={9}
                placeholder="00000-000"
              />
              {formErrors.postalCode && <span className="field-error">{formErrors.postalCode}</span>}
              {!formErrors.postalCode && !loadingCep && (
                <small className="cep-hint">Digite o CEP para preencher automaticamente</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                Endereço
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={submitting || success}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="addressNumber">Número</label>
                <input
                  type="text"
                  id="addressNumber"
                  name="addressNumber"
                  value={formData.addressNumber}
                  onChange={handleInputChange}
                  disabled={submitting || success}
                />
              </div>

              <div className="form-group">
                <label htmlFor="complement">Complemento</label>
                <input
                  type="text"
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleInputChange}
                  disabled={submitting || success}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">Bairro</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  disabled={submitting || success}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Cidade</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={submitting || success}
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">Estado</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={submitting || success}
                  maxLength={2}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={submitting || success}
            >
              {submitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Processando...
                </>
              ) : (
                <>
                  {user ? 'Vincular-se ao Consultório' : 'Cadastrar'}
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default RegisterByHash

