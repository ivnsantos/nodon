import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faSave, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faIdCard,
  faStethoscope, faCheckCircle, faPlus, faTimes,
  faClipboardQuestion
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import { necessidadesToDisplayStrings } from '../utils/necessidades'
import useAlert from '../hooks/useAlert'
import AlertModal from '../components/AlertModal'
import './ClienteNovo.css'

const ClienteNovo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedClinicData } = useAuth()
  const { alertConfig, showError, showWarning, hideAlert } = useAlert()
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
    necessidades: [],
    observacoes: '',
    status: 'avaliacao-realizada'
  })
  const [novaNecessidade, setNovaNecessidade] = useState('')
  const [anamneses, setAnamneses] = useState([])
  const [anamneseSelecionada, setAnamneseSelecionada] = useState('')
  const [loadingAnamneses, setLoadingAnamneses] = useState(false)

  useEffect(() => {
    if (isEditMode && id) {
      loadPacienteData()
    }
    loadAnamneses()
  }, [id, isEditMode, selectedClinicData])

  const loadAnamneses = async () => {
    try {
      setLoadingAnamneses(true)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      
      if (!clienteMasterId) {
        setLoadingAnamneses(false)
        return
      }

      const response = await api.get(`/anamneses?clienteMasterId=${clienteMasterId}`)
      let anamnesesData = []
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          anamnesesData = response.data.filter(a => a.ativa) // Apenas anamneses ativas
        } else if (response.data.data && Array.isArray(response.data.data)) {
          anamnesesData = response.data.data.filter(a => a.ativa)
        }
      }
      
      setAnamneses(anamnesesData)
    } catch (error) {
      console.error('Erro ao carregar anamneses:', error)
    } finally {
      setLoadingAnamneses(false)
    }
  }

  const loadPacienteData = async () => {
    setLoadingData(true)
    try {
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      if (!clienteMasterId) {
        showError('Cliente Master não encontrado')
        setLoadingData(false)
        return
      }
      const response = await api.get(`/pacientes/${id}/completo?clienteMasterId=${clienteMasterId}`)
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

        const necessidadesNormalizadas = necessidadesToDisplayStrings(
          paciente.informacoesClinicas?.necessidades || paciente.necessidades
        )

        setFormData({
          nome: paciente.nome || '',
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
          necessidades: necessidadesNormalizadas,
          observacoes: paciente.observacoes || '',
          status: paciente.status || 'avaliacao-realizada'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do paciente:', error)
      showError('Erro ao carregar dados do paciente. Tente novamente.')
    } finally {
      setLoadingData(false)
    }
  }

  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 11) // Limitar a 11 dígitos
    if (cleaned.length === 0) {
      return ''
    } else if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return cleaned.replace(/(\d{3})(\d)/, '$1.$2')
    } else if (cleaned.length <= 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3')
    } else {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4')
    }
  }

  const formatTelefone = (value) => {
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
    if (numbers.length === 0) {
      return ''
    } else if (numbers.length <= 2) {
      formatted = `(${numbers}`
    } else if (numbers.length <= 6) {
      formatted = numbers.replace(/(\d{2})(\d)/, '($1) $2')
    } else if (numbers.length <= 10) {
      // Telefone fixo (10 dígitos)
      formatted = numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3')
    } else {
      // Celular (11 dígitos)
      formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    
    // Adicionar código do país 55 no início
    if (formatted) {
      return `55 ${formatted}`
    }
    
    return formatted
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Aplicar máscaras específicas
    if (name === 'cpf') {
      const formatted = formatCPF(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'telefone') {
      const formatted = formatTelefone(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAddNecessidade = () => {
    if (!novaNecessidade.trim()) return
    
    setFormData(prev => ({
      ...prev,
      necessidades: [...prev.necessidades, novaNecessidade.trim()]
    }))
    setNovaNecessidade('')
  }

  const handleRemoveNecessidade = (index) => {
    setFormData(prev => ({
      ...prev,
      necessidades: prev.necessidades.filter((_, i) => i !== index)
    }))
  }

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    let formattedCep = cep
    
    // Aplicar máscara progressivamente
    if (cep.length > 5) {
      formattedCep = cep.substring(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
    } else if (cep.length > 0) {
      formattedCep = cep
    }
    
    setFormData(prev => ({ ...prev, cep: formattedCep }))

    // Buscar CEP quando tiver 8 dígitos
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (data.erro) {
          showWarning('CEP não encontrado. Por favor, verifique o CEP digitado.')
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
        showError('Erro ao buscar CEP. Tente novamente.')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validação básica dos campos obrigatórios
      if (!formData.nome || !formData.nome.trim()) {
        showWarning('Por favor, preencha o nome do paciente.')
        setLoading(false)
        return
      }

      if (!formData.email || !formData.email.trim()) {
        showWarning('Por favor, preencha o e-mail do paciente.')
        setLoading(false)
        return
      }

      if (!formData.telefone || !formData.telefone.replace(/\D/g, '')) {
        showWarning('Por favor, preencha o telefone do paciente.')
        setLoading(false)
        return
      }

      // Obter dados do clienteMaster do contexto (pode estar em diferentes lugares dependendo do tipo de usuário)
      const clienteMasterId = selectedClinicData?.clienteMasterId || selectedClinicData?.clienteMaster?.id || selectedClinicData?.id
      const userId = selectedClinicData?.usuarioId || selectedClinicData?.user?.id
      
      if (!clienteMasterId) {
        showError('Erro: Dados do cliente master não encontrados. Por favor, selecione um consultório.')
        setLoading(false)
        return
      }

      // Preparar dados para a API seguindo a estrutura do curl de exemplo
      const cpfLimpo = formData.cpf.replace(/\D/g, '')
      let telefoneLimpo = formData.telefone.replace(/\D/g, '')
      
      // Se não começar com 55, adicionar código do país
      if (!telefoneLimpo.startsWith('55')) {
        telefoneLimpo = '55' + telefoneLimpo
      }
      
      const cepLimpo = formData.cep.replace(/\D/g, '')

      // Construir dadosPessoais - seguindo exatamente a estrutura do curl
      const dadosPessoais = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: telefoneLimpo,
        status: formData.status || 'avaliacao-realizada'
      }
      
      // Adicionar campos opcionais (cpf e dataNascimento podem ser omitidos se vazios)
      if (cpfLimpo) dadosPessoais.cpf = cpfLimpo
      if (formData.dataNascimento) dadosPessoais.dataNascimento = formData.dataNascimento

      // Construir endereco - incluir todos os campos, mesmo vazios (como no curl)
      const endereco = {
        cep: cepLimpo || '',
        rua: formData.rua?.trim() || '',
        numero: formData.numero?.trim() || '',
        complemento: formData.complemento?.trim() || '',
        bairro: formData.bairro?.trim() || '',
        cidade: formData.cidade?.trim() || '',
        estado: formData.estado?.trim() || ''
      }

      // Construir informacoesClinicas
      const informacoesClinicas = {
        necessidades: formData.necessidades && formData.necessidades.length > 0 
          ? formData.necessidades 
          : [],
        observacoes: formData.observacoes?.trim() || ''
      }

      // Montar payload completo seguindo exatamente a estrutura do curl
      const payload = {
        clienteMasterId: clienteMasterId,
        dadosPessoais: dadosPessoais,
        endereco: endereco,
        informacoesClinicas: informacoesClinicas
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
      
      // Vincular anamnese se uma foi selecionada
      if (!isEditMode && anamneseSelecionada) {
        try {
          // Vincular anamnese ao paciente
          const vincularResponse = await api.post('/anamneses/vincular-paciente', {
            anamneseId: anamneseSelecionada,
            pacienteId: pacienteId
          })
          
          // Obter o ID da respostaAnamnese criada
          const respostaAnamneseId = vincularResponse.data?.id || vincularResponse.data?.data?.id
          
          // Se conseguiu o ID, ativar automaticamente
          if (respostaAnamneseId) {
            try {
              await api.put(`/anamneses/ativar/${respostaAnamneseId}`)
            } catch (ativarError) {
              console.warn('Erro ao ativar anamnese automaticamente:', ativarError)
              // Não bloquear o cadastro se a ativação falhar
            }
          }
        } catch (error) {
          console.error('Erro ao vincular anamnese:', error)
          // Não bloquear o cadastro se falhar ao vincular
        }
      }
      
      navigate(`/app/clientes/${pacienteId}`)
    } catch (error) {
      console.error('Erro ao salvar paciente:', error)
      console.error('Status:', error.response?.status)
      console.error('Data do erro:', error.response?.data)
      
      let errorMessage = 'Erro ao salvar paciente. Tente novamente.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        errorMessage = errorData.message || errorData.error || errorMessage
        
        // Se houver detalhes de validação, mostrar
        if (errorData.message && errorData.message.includes('validation')) {
          errorMessage += '\n\nVerifique se todos os campos obrigatórios estão preenchidos corretamente.'
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
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
            <FontAwesomeIcon icon={faUser} /> Dados Pessoais
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faUser} /> Paciente *
              </label>
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
                maxLength="18"
                placeholder="55 (00) 00000-0000"
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
            {!isEditMode && (
              <div className="form-group full-width">
                <label>
                  <FontAwesomeIcon icon={faClipboardQuestion} /> Vincular Anamnese (Opcional)
                </label>
                {loadingAnamneses ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                    Carregando anamneses...
                  </p>
                ) : (
                  <select
                    value={anamneseSelecionada}
                    onChange={(e) => setAnamneseSelecionada(e.target.value)}
                  >
                    <option value="">Nenhuma anamnese</option>
                    {anamneses.map((anamnese) => (
                      <option key={anamnese.id} value={anamnese.id}>
                        {anamnese.titulo}
                      </option>
                    ))}
                  </select>
                )}
                {anamneses.length === 0 && !loadingAnamneses && (
                  <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                    Nenhuma anamnese disponível. Você pode vincular uma depois no perfil do paciente.
                  </small>
                )}
              </div>
            )}
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
              <div className="necessidades-header">
                <label>Necessidades</label>
                <div className="necessidades-input-group">
                  <input
                    type="text"
                    value={novaNecessidade}
                    onChange={(e) => setNovaNecessidade(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddNecessidade()
                      }
                    }}
                    placeholder="Digite uma necessidade e pressione Enter ou clique em Adicionar"
                  />
                  <button
                    type="button"
                    className="btn-add-necessidade"
                    onClick={handleAddNecessidade}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
              {formData.necessidades.length > 0 ? (
                <ul className="necessidades-list">
                  {formData.necessidades.map((necessidade, index) => (
                    <li key={index}>
                      <FontAwesomeIcon icon={faStethoscope} />
                      <span>{necessidade}</span>
                      <button
                        type="button"
                        className="btn-remove-necessidade"
                        onClick={() => handleRemoveNecessidade(index)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-text">Nenhuma necessidade adicionada</p>
              )}
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

export default ClienteNovo

