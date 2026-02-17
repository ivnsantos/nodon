import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarAlt, faClock, faUserMd, faSpinner, faCheckCircle, faTimes, faUser, faIdCard, faEnvelope, faPhone, faMapMarkerAlt, faInfoCircle, faChevronLeft
} from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import './AgendamentoPublico.css'

const AgendamentoPublico = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agendamento, setAgendamento] = useState(null)
  const [step, setStep] = useState(1) // 1 = informações, 2 = formulário
  const formRef = useRef(null)
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  })
  const [loadingCep, setLoadingCep] = useState(false)
  const [showEnderecoFields, setShowEnderecoFields] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      fetchAgendamento()
    }
  }, [id])

  const fetchAgendamento = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/calendario/consultas/publica/${id}`)
      
      // Verificar se é erro (statusCode diferente de 200)
      if (response.data.statusCode !== 200) {
        const errorMsg = response.data?.message || 'Erro ao buscar agendamento'
        setError(errorMsg)
        setLoading(false)
        return
      }
      
      // A resposta tem estrutura aninhada: data.data.data.consulta
      const consulta = response.data?.data?.data?.consulta || response.data?.data?.consulta || response.data?.consulta
      
      if (consulta) {
        setAgendamento(consulta)
      } else {
        setError('Agendamento não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error)
      // Extrair mensagem de erro de diferentes estruturas possíveis
      const errorMsg = 
        error.response?.data?.message || 
        error.response?.data?.data?.message ||
        error.message ||
        'Erro ao buscar agendamento'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
  }

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      setLoadingCep(true)
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }))
        setShowEnderecoFields(true)
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 11) formattedValue = formattedValue.slice(0, 11)
      if (formattedValue.length > 3) {
        formattedValue = formattedValue.replace(/(\d{3})(\d)/, '$1.$2')
      }
      if (formattedValue.length > 7) {
        formattedValue = formattedValue.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      }
      if (formattedValue.length > 11) {
        formattedValue = formattedValue.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
      }
    } else if (name === 'cep') {
      formattedValue = value.replace(/\D/g, '')
      if (formattedValue.length > 8) formattedValue = formattedValue.slice(0, 8)
      if (formattedValue.length > 5) {
        formattedValue = formattedValue.replace(/(\d{5})(\d)/, '$1-$2')
      }
      
      // Buscar CEP quando tiver 8 dígitos
      if (formattedValue.replace(/\D/g, '').length === 8) {
        buscarCep(formattedValue)
      }
    } else if (name === 'telefone') {
      // Remove tudo que não é número
      let numbers = value.replace(/\D/g, '')
      
      // Se começar com 55, remove para não duplicar
      if (numbers.startsWith('55')) {
        numbers = numbers.substring(2)
      }
      
      // Limita a 11 dígitos (DDD + número de 9 dígitos)
      if (numbers.length > 11) {
        numbers = numbers.slice(0, 11)
      }
      
      // Formata: +55 (DD) 9XXXX-XXXX
      if (numbers.length === 0) {
        formattedValue = ''
      } else if (numbers.length <= 2) {
        formattedValue = `+55 (${numbers}`
      } else if (numbers.length <= 7) {
        formattedValue = `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      } else if (numbers.length <= 10) {
        formattedValue = `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
      } else {
        // 11 dígitos: +55 (DD) 9XXXX-XXXX
        formattedValue = `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Por favor, preencha o nome')
      return
    }
    
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      alert('Por favor, preencha um CPF válido')
      return
    }

    if (!formData.dataNascimento) {
      alert('Por favor, preencha a data de nascimento')
      return
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      alert('Por favor, preencha um email válido')
      return
    }

    // Validar telefone
    let telefoneLimpo = formData.telefone.replace(/\D/g, '')
    if (telefoneLimpo.startsWith('55')) {
      telefoneLimpo = telefoneLimpo.substring(2)
    }
    if (!telefoneLimpo || telefoneLimpo.length < 10) {
      alert('Por favor, preencha um telefone válido')
      return
    }

    // Validar CEP
    const cepLimpo = formData.cep.replace(/\D/g, '')
    if (!cepLimpo || cepLimpo.length !== 8) {
      alert('Por favor, preencha um CEP válido')
      return
    }

    // Validar endereço
    if (!showEnderecoFields) {
      alert('Por favor, digite o CEP para preencher o endereço')
      return
    }

    if (!formData.endereco.trim()) {
      alert('Por favor, preencha a rua/logradouro')
      return
    }

    if (!formData.numero.trim()) {
      alert('Por favor, preencha o número')
      return
    }

    if (!formData.bairro.trim()) {
      alert('Por favor, preencha o bairro')
      return
    }

    if (!formData.cidade.trim()) {
      alert('Por favor, preencha a cidade')
      return
    }

    if (!formData.estado.trim() || formData.estado.trim().length !== 2) {
      alert('Por favor, preencha o estado (UF) com 2 letras')
      return
    }

    try {
      setSubmitting(true)
      
      // Preparar payload conforme a nova API
      const payload = {
        consultaId: id,
        dadosPessoais: {
          nome: formData.nome.trim(),
          cpf: formData.cpf.replace(/\D/g, ''),
          dataNascimento: formData.dataNascimento,
          email: formData.email.trim(),
          telefone: telefoneLimpo ? `55${telefoneLimpo}` : null
        },
        endereco: {
          cep: formData.cep.replace(/\D/g, ''),
          rua: formData.endereco.trim(),
          numero: formData.numero.trim(),
          complemento: formData.complemento.trim() || null,
          bairro: formData.bairro.trim(),
          cidade: formData.cidade.trim(),
          estado: formData.estado.trim().toUpperCase()
        }
      }

      // Usar fetch direto para rota pública (sem autenticação)
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const response = await fetch(`${baseURL}/calendario/consultas/publica/cadastrar-paciente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && (data.statusCode === 201 || data.statusCode === 200)) {
        setSuccess(true)
        setStep(1)
      } else {
        throw new Error(data.message || 'Erro ao realizar cadastro')
      }
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error)
      alert(error.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }


  const Header = () => (
    <header className="nodon-header">
      <div className="nodon-header-content">
        <img src={nodoLogo} alt="Nodon" className="nodon-icon" />
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
      <div className="agendamento-page">
        <Header />
        <div className="loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Carregando...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    const isPacienteVinculado = error.includes('paciente vinculado') || error.includes('possui paciente')
    
    return (
      <div className="agendamento-page">
        <Header />
        <div className={`error ${isPacienteVinculado ? 'error-info' : ''}`}>
          <div className="error-icon">
            <FontAwesomeIcon icon={isPacienteVinculado ? faInfoCircle : faTimes} />
          </div>
          <h2>{isPacienteVinculado ? 'Agendamento já confirmado' : 'Erro'}</h2>
          <p>{error}</p>
          {isPacienteVinculado && (
            <div className="error-info-box">
              <p>Este agendamento já foi confirmado por outro paciente. Se você já realizou o cadastro, entre em contato com a clínica para mais informações.</p>
            </div>
          )}
        </div>
        <Footer />
      </div>
    )
  }

  if (!agendamento) {
    return (
      <div className="agendamento-page">
        <Header />
        <div className="error">
          <div className="error-icon">
            <FontAwesomeIcon icon={faTimes} />
          </div>
          <h2>Agendamento não encontrado</h2>
          <p>O agendamento solicitado não foi encontrado ou não está mais disponível.</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="agendamento-page">
        <Header />
        <div className="success-box">
          <div className="success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <h2>Cadastro realizado!</h2>
          <p>Seu agendamento foi confirmado.</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="agendamento-page">
      <Header />
      <div className="container">
        <div className="header">
          <h1>Agendamento</h1>
          <p className="clinic-name">{agendamento.clienteMaster?.nomeEmpresa || 'Clínica'}</p>
        </div>

        <div className="info-box">
          <div className="info-row">
            <span className="info-label">Tipo:</span>
            <span className="info-value">{agendamento.tipoConsulta?.nome || 'Consulta'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Data:</span>
            <span className="info-value">{formatDate(agendamento.dataConsulta)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Horário:</span>
            <span className="info-value">{agendamento.horaConsulta ? agendamento.horaConsulta.substring(0, 5) : ''}</span>
          </div>
          {agendamento.profissional && (
            <div className="info-row">
              <span className="info-label">Profissional:</span>
              <span className="info-value">{agendamento.profissional.nome || agendamento.profissional.email}</span>
            </div>
          )}
          {agendamento.observacoes && (
            <div className="info-row full">
              <span className="info-label">Observações:</span>
              <span className="info-value">{agendamento.observacoes}</span>
            </div>
          )}
        </div>

        {step === 1 ? (
          <div className="action-box">
            <div className="info-banner">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>Preencha seus dados para confirmar o agendamento</span>
            </div>
            <button 
              onClick={() => {
                setStep(2)
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }} 
              className="btn-main"
            >
              Preencher Dados
            </button>
          </div>
        ) : (
          <div className="form-container" ref={formRef}>
            <div className="step-header">
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="btn-back"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                Voltar
              </button>
              <h3>Seus Dados</h3>
            </div>
            <form className="form-box" onSubmit={handleSubmit}>
            
            <div className="form-field">
              <label>Nome Completo *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>CPF *</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="form-field">
                <label>Data de Nascimento *</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Telefone *</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                required
                placeholder="+55 (00) 00000-0000"
                maxLength={19}
              />
            </div>

            <div className="form-field">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="form-field">
              <label>CEP *</label>
              <div className="cep-input-wrapper">
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleInputChange}
                  required
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loadingCep && (
                  <FontAwesomeIcon icon={faSpinner} spin className="cep-loading" />
                )}
              </div>
              {!showEnderecoFields && (
                <small className="cep-hint">Digite o CEP para preencher automaticamente</small>
              )}
              {showEnderecoFields && (
                <small className="cep-hint">Ou preencha manualmente abaixo</small>
              )}
            </div>

            {showEnderecoFields && (
              <>
                <div className="form-field">
                  <label>Rua/Logradouro *</label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome da rua"
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Número *</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleInputChange}
                      required
                      placeholder="123"
                    />
                  </div>

                  <div className="form-field">
                    <label>Complemento</label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleInputChange}
                      placeholder="Apto, Bloco, etc"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Bairro *</label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleInputChange}
                      required
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div className="form-field">
                    <label>Cidade *</label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      required
                      placeholder="Nome da cidade"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Estado (UF) *</label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    required
                    placeholder="SP"
                    maxLength={2}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </>
            )}

            {!showEnderecoFields && (
              <button 
                type="button" 
                onClick={() => setShowEnderecoFields(true)}
                className="btn-manual-address"
              >
                Preencher endereço manualmente
              </button>
            )}

            <div className="form-actions" style={{backgroundColor: '#1e293b'}}>
            <button type="button" onClick={() => setStep(1)} className="btn-cancel">
              Cancelar
            </button>
              <button type="submit" className="btn-main" disabled={submitting}>
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Cadastrando...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default AgendamentoPublico
