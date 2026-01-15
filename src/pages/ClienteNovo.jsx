import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faIdCard,
  faStethoscope, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import './ClienteNovo.css'

const ClienteNovo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const isEditMode = !!id
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    necessidades: '',
    observacoes: '',
    status: 'avaliacao-realizada'
  })

  useEffect(() => {
    if (isEditMode && id) {
      loadPacienteData()
    }
  }, [id, isEditMode])

  const loadPacienteData = async () => {
    setLoadingData(true)
    try {
      const response = await api.get(`/pacientes/${id}`)
      const paciente = response.data?.data || response.data
      
      if (paciente) {
        // A API retorna os dados diretamente no objeto, não aninhados
        // Formatar CEP, telefone e CPF para exibição
        const formatCEP = (cep) => {
          if (!cep) return ''
          const cleaned = cep.replace(/\D/g, '')
          if (cleaned.length === 8) {
            return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
          }
          return cep
        }

        const formatTelefone = (telefone) => {
          if (!telefone) return ''
          const cleaned = telefone.replace(/\D/g, '')
          if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
          } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
          }
          return telefone
        }

        const formatCPF = (cpf) => {
          if (!cpf) return ''
          const cleaned = cpf.replace(/\D/g, '')
          if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          }
          return cpf
        }

        setFormData({
          nome: paciente.nomePaciente || '',
          email: paciente.email || '',
          telefone: formatTelefone(paciente.telefone || ''),
          cpf: formatCPF(paciente.cpf || ''),
          dataNascimento: paciente.dataNascimento || '',
          cep: formatCEP(paciente.cep || ''),
          rua: paciente.rua || '',
          numero: paciente.numero || '',
          complemento: paciente.complemento || '',
          bairro: paciente.bairro || '',
          cidade: paciente.cidade || '',
          estado: paciente.estado || '',
          necessidades: paciente.necessidades || '',
          observacoes: paciente.observacoes || '',
          status: paciente.status || 'avaliacao-realizada'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error)
      alert('Erro ao carregar dados do paciente. Tente novamente.')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    const formattedCep = cep.replace(/(\d{5})(\d)/, '$1-$2')
    setFormData(prev => ({ ...prev, cep: formattedCep }))

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (data.erro) {
          alert('CEP não encontrado. Por favor, verifique o CEP digitado.')
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
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        alert('Erro ao buscar CEP. Tente novamente.')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Obter dados do clienteMaster e user do contexto
      const clienteMasterId = selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      const userId = selectedClinicData?.user?.id
      
      if (!clienteMasterId) {
        alert('Erro: Dados do cliente master não encontrados. Por favor, selecione um consultório.')
        setLoading(false)
        return
      }

      // Preparar dados para a API
      const payload = {
        dentistId: userId || null,
        masterClientId: clienteMasterId,
        dadosPessoais: {
          nomePaciente: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ''),
          dataNascimento: formData.dataNascimento,
          email: formData.email,
          telefone: formData.telefone.replace(/\D/g, ''),
          status: formData.status || 'avaliacao-realizada'
        },
        endereco: {
          cep: formData.cep.replace(/\D/g, ''),
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        },
        informacoesClinicas: {
          necessidades: formData.necessidades,
          observacoes: formData.observacoes
        }
      }

      let response
      if (isEditMode) {
        // PUT para editar
        response = await api.put(`/pacientes/${id}`, payload)
      } else {
        // POST para criar
        response = await api.post('/pacientes', payload)
      }

      const pacienteId = response.data?.data?.id || response.data?.id || id
      
      navigate(`/app/clientes/${pacienteId}`)
    } catch (error) {
      console.error('Erro ao salvar paciente:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar paciente. Tente novamente.'
      alert(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="cliente-novo-page">
      <div className="cliente-novo-header">
        <button className="btn-back" onClick={() => navigate('/app/clientes')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <h1>{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</h1>
      </div>

      {loadingData && (
        <div className="loading-message">
          <p>Carregando dados do paciente...</p>
        </div>
      )}

      <form className="cliente-novo-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>
            <FontAwesomeIcon icon={faUser} />
            Dados Pessoais
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Paciente *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                placeholder="Nome da paciente"
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faIdCard} /> CPF
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                maxLength="14"
                placeholder="000.000.000-00"
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faCalendarAlt} /> Data de Nascimento
              </label>
              <input
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faEnvelope} /> E-mail *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="email@exemplo.com"
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
                required
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faCheckCircle} /> Status Inicial
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="avaliacao-realizada">Avaliação Realizada</option>
                <option value="em-andamento">Em Andamento</option>
                <option value="aprovado">Aprovado</option>
                <option value="tratamento-concluido">Tratamento Concluído</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            Endereço
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>CEP</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleCepChange}
                onBlur={handleCepChange}
                maxLength="9"
                placeholder="00000-000"
              />
              <small className="cep-hint">Digite o CEP para preencher automaticamente</small>
            </div>
            <div className="form-group">
              <label>Rua</label>
              <input
                type="text"
                name="rua"
                value={formData.rua}
                onChange={handleInputChange}
                placeholder="Nome da rua"
              />
            </div>
            <div className="form-group">
              <label>Número</label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                placeholder="Número"
              />
            </div>
            <div className="form-group">
              <label>Complemento</label>
              <input
                type="text"
                name="complemento"
                value={formData.complemento}
                onChange={handleInputChange}
                placeholder="Apto, Bloco, etc."
              />
            </div>
            <div className="form-group">
              <label>Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                placeholder="Bairro"
              />
            </div>
            <div className="form-group">
              <label>Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                placeholder="Cidade"
              />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
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
        </div>

        <div className="form-section">
          <h2>
            <FontAwesomeIcon icon={faStethoscope} />
            Informações Clínicas
          </h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Necessidades</label>
              <textarea
                name="necessidades"
                value={formData.necessidades}
                onChange={handleInputChange}
                rows="4"
                placeholder="Descreva as necessidades do cliente..."
              />
            </div>
            <div className="form-group full-width">
              <label>Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows="4"
                placeholder="Observações adicionais sobre o cliente..."
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/app/clientes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSave} />
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClienteNovo

