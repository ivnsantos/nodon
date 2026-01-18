import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faEdit, faUser, faCalendarAlt,
  faPhone, faEnvelope, faMapMarkerAlt, faIdCard,
  faStethoscope, faHistory, faPlus, faFileMedical,
  faCheckCircle, faClock, faTimesCircle, faExclamationTriangle,
  faXRay, faEye
} from '@fortawesome/free-solid-svg-icons'
import api from '../utils/api'
import exameImage from '../img/exame.jpg'
import './ClienteDetalhes.css'

const ClienteDetalhes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [historico, setHistorico] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNecessidadesModal, setShowNecessidadesModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [novaNecessidade, setNovaNecessidade] = useState('')
  const [novoStatus, setNovoStatus] = useState('')

  useEffect(() => {
    loadCliente()
    loadHistorico()
  }, [id])

  // Carregar radiografias quando o cliente for carregado
  useEffect(() => {
    if (cliente) {
      loadRadiografias(cliente)
    } else {
      // Tentar carregar mesmo sem cliente (pode ter radiografias por ID)
      loadRadiografias({ id: parseInt(id) })
    }
  }, [cliente, id])

  const loadCliente = async () => {
    try {
      // Fazer GET para buscar dados do paciente
      const response = await api.get(`/pacientes/${id}`)
      const paciente = response.data?.data || response.data
      
      if (paciente) {
        // Normalizar dados do paciente para o formato esperado
        // A API retorna os dados diretamente no objeto, não aninhados
        const clienteNormalizado = {
          id: paciente.id,
          nome: paciente.nomePaciente || '',
          email: paciente.email || '',
          telefone: paciente.telefone || '',
          cpf: paciente.cpf || '',
          dataNascimento: paciente.dataNascimento || '',
          endereco: {
            rua: paciente.rua || '',
            numero: paciente.numero || '',
            complemento: paciente.complemento || '',
            bairro: paciente.bairro || '',
            cidade: paciente.cidade || '',
            estado: paciente.estado || '',
            cep: paciente.cep || ''
          },
          status: paciente.status || 'avaliacao-realizada',
          necessidades: (() => {
            // Verificar se necessidades está em informacoesClinicas ou diretamente no paciente
            const necessidadesRaw = paciente.informacoesClinicas?.necessidades || paciente.necessidades
            
            if (!necessidadesRaw) return []
            
            // Se for array, normalizar cada item para string
            if (Array.isArray(necessidadesRaw)) {
              return necessidadesRaw.map(nec => {
                // Se o item já é uma string, retornar
                if (typeof nec === 'string') return nec
                // Se for um array, juntar com vírgula
                if (Array.isArray(nec)) return nec.join(', ')
                // Se for objeto, tentar converter para string
                if (typeof nec === 'object' && nec !== null) {
                  return JSON.stringify(nec)
                }
                // Caso contrário, converter para string
                return String(nec)
              })
            }
            
            // Se for string, retornar como array
            if (typeof necessidadesRaw === 'string' && necessidadesRaw.trim()) {
              // Tentar fazer parse se for JSON
              try {
                const parsed = JSON.parse(necessidadesRaw)
                if (Array.isArray(parsed)) {
                  return parsed.map(nec => typeof nec === 'string' ? nec : String(nec))
                }
              } catch (e) {
                // Não é JSON, retornar como string única
                return [necessidadesRaw]
              }
              return [necessidadesRaw]
            }
            
            return []
          })(),
          observacoes: paciente.observacoes || '',
          createdAt: paciente.createdAt || new Date().toISOString()
        }
        
        setCliente(clienteNormalizado)
      } else {
        alert('Paciente não encontrado')
        navigate('/app/clientes')
      }
    } catch (error) {
      console.error('Erro ao carregar paciente:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao carregar dados do paciente.'
      alert(errorMessage)
      navigate('/app/clientes')
    } finally {
      setLoading(false)
    }
  }

  const mapCampoAlteradoToTipo = (campoAlterado) => {
    const campoMap = {
      'status': 'status',
      'necessidades': 'necessidade',
      'informacoesClinicas.necessidades': 'necessidade',
      'observacoes': 'observacao',
      'informacoesClinicas.observacoes': 'observacao',
      'email': 'observacao',
      'telefone': 'observacao',
      'cpf': 'observacao',
      'dataNascimento': 'observacao',
      'nomePaciente': 'observacao',
      'endereco': 'observacao'
    }
    return campoMap[campoAlterado] || 'observacao'
  }

  const formatarDescricaoHistorico = (item, clienteAtual) => {
    // Se for uma alteração de necessidades, verificar se é uma adição
    if (item.campoAlterado === 'necessidades' || item.campoAlterado === 'informacoesClinicas.necessidades') {
      const descricao = item.descricaoAlteracao || ''
      
      // Verificar se a descrição contém "alterado de" e "para" (formato de alteração)
      if (descricao.toLowerCase().includes('alterado de') && descricao.toLowerCase().includes('para')) {
        // Tentar extrair os valores antigo e novo usando regex mais flexível
        // Pode estar no formato: "alterado de "X" para "Y"" ou "alterado de X para Y"
        const match = descricao.match(/alterado de\s+["']?([^"']+)["']?\s+para\s+["']?([^"']+)["']?/i)
        if (match) {
          const valorAntigo = match[1] || ''
          const valorNovo = match[2] || ''
          
          // Se o valor novo tem mais itens que o antigo (separados por vírgula), é uma adição
          const itensAntigos = valorAntigo.split(',').map(s => s.trim()).filter(s => s)
          const itensNovos = valorNovo.split(',').map(s => s.trim()).filter(s => s)
          
          if (itensNovos.length > itensAntigos.length) {
            // Encontrar qual item foi adicionado
            const itensAdicionados = itensNovos.filter(itemNovo => 
              !itensAntigos.some(itemAntigo => itemAntigo === itemNovo)
            )
            if (itensAdicionados.length > 0) {
              return `Necessidade adicionada: ${itensAdicionados.join(', ')}`
            }
          }
        }
      }
    }
    
    // Retornar descrição original se não for uma adição detectada
    return item.descricaoAlteracao || ''
  }

  const loadHistorico = async () => {
    try {
      // Fazer GET para buscar histórico do paciente
      const response = await api.get(`/pacientes/${id}/historico`)
      // A API pode retornar diretamente um array ou dentro de response.data
      const historicoData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || [])
      
      if (historicoData.length > 0) {
        // Mapear dados da API para o formato esperado pelo componente
        const historicoMapeado = historicoData.map(item => ({
          id: item.id,
          tipo: mapCampoAlteradoToTipo(item.campoAlterado),
          descricao: formatarDescricaoHistorico(item, cliente),
          data: item.dataFormatada || item.createdAt, // Usar dataFormatada se disponível
          dataOriginal: item.createdAt, // Manter createdAt para ordenação se necessário
          usuario: item.nomeAlterador || 'Usuário'
        }))
        
        setHistorico(historicoMapeado)
      } else {
        // Se não houver histórico, definir array vazio
        setHistorico([])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      // Em caso de erro, definir array vazio
      setHistorico([])
    }
  }

  const loadRadiografias = async (clienteData = null) => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar radiografias do localStorage filtradas por cliente_id
      const savedDiagnosticos = JSON.parse(localStorage.getItem('mockDiagnosticos') || '[]')
      const clienteId = parseInt(id)
      const clienteInfo = clienteData || cliente
      
      // Filtrar radiografias do cliente
      let radiografiasCliente = []
      
      if (clienteInfo) {
        radiografiasCliente = savedDiagnosticos.filter(d => 
          d.cliente_id === clienteId || 
          (d.cliente_nome && d.cliente_nome === clienteInfo.nome)
        )
      } else {
        // Se não tiver cliente, buscar por ID apenas
        radiografiasCliente = savedDiagnosticos.filter(d => d.cliente_id === clienteId)
      }
      
      // Ordenar por data mais recente primeiro
      radiografiasCliente.sort((a, b) => {
        const dateA = new Date(a.data || a.created_at || 0)
        const dateB = new Date(b.data || b.created_at || 0)
        return dateB - dateA
      })
      
      setRadiografias(radiografiasCliente)
    } catch (error) {
      console.error('Erro ao carregar radiografias:', error)
    }
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

  const formatCEP = (cep) => {
    if (!cep) return ''
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return cep
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'avaliacao-realizada': 'Avaliação Realizada',
      'em-andamento': 'Em Andamento',
      'aprovado': 'Aprovado',
      'tratamento-concluido': 'Tratamento Concluído',
      'perdido': 'Perdido'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'avaliacao-realizada': '#3b82f6',
      'em-andamento': '#f59e0b',
      'aprovado': '#10b981',
      'tratamento-concluido': '#8b5cf6',
      'perdido': '#ef4444'
    }
    return colorMap[status] || '#6b7280'
  }

  const getStatusIcon = (status) => {
    const iconMap = {
      'avaliacao-realizada': faCheckCircle,
      'em-andamento': faClock,
      'aprovado': faCheckCircle,
      'tratamento-concluido': faCheckCircle,
      'perdido': faTimesCircle
    }
    return iconMap[status] || faExclamationTriangle
  }

  const handleAddNecessidade = async () => {
    if (!novaNecessidade.trim()) return

    try {
      // Obter necessidades atuais do cliente
      const necessidadesAtuais = Array.isArray(cliente.necessidades) 
        ? cliente.necessidades 
        : (cliente.necessidades ? [cliente.necessidades] : [])
      
      // Adicionar nova necessidade à lista
      const updatedNecessidades = [...necessidadesAtuais, novaNecessidade.trim()]
      
      // Preparar payload para a API - necessidades deve estar dentro de informacoesClinicas
      const payload = {
        informacoesClinicas: {
          necessidades: updatedNecessidades
        }
      }

      // Fazer PUT para atualizar as necessidades do paciente
      await api.put(`/pacientes/${id}`, payload)
      
      // Atualizar estado local
      setCliente({ ...cliente, necessidades: updatedNecessidades })
      
      // Recarregar histórico da API (a API gera o histórico automaticamente)
      await loadHistorico()
      
      setNovaNecessidade('')
      setShowNecessidadesModal(false)
    } catch (error) {
      console.error('Erro ao adicionar necessidade:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao adicionar necessidade. Tente novamente.'
      alert(errorMessage)
    }
  }

  const handleUpdateStatus = async () => {
    if (!novoStatus) return

    try {
      // Preparar payload para a API - status deve estar dentro de dadosPessoais
      const payload = {
        dadosPessoais: {
          status: novoStatus
        }
      }

      // Fazer PUT para atualizar o status do paciente
      await api.put(`/pacientes/${id}`, payload)
      
      // Atualizar estado local
      setCliente({ ...cliente, status: novoStatus })
      
      // Adicionar ao histórico
      const savedHistorico = JSON.parse(localStorage.getItem(`mockHistorico_${id}`) || '[]')
      savedHistorico.unshift({
        id: Date.now(),
        tipo: 'status',
        descricao: `Status alterado para ${getStatusLabel(novoStatus)}`,
        data: new Date().toISOString(),
        usuario: 'Dr. Usuário'
      })
      localStorage.setItem(`mockHistorico_${id}`, JSON.stringify(savedHistorico))
      
      setNovoStatus('')
      setShowStatusModal(false)
      loadHistorico()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar status. Tente novamente.'
      alert(errorMessage)
    }
  }

  const getHistoricoIcon = (tipo) => {
    const iconMap = {
      'status': faCheckCircle,
      'necessidade': faStethoscope,
      'avaliacao': faFileMedical,
      'observacao': faEdit
    }
    return iconMap[tipo] || faHistory
  }

  const getHistoricoColor = (tipo) => {
    const colorMap = {
      'status': '#3b82f6',
      'necessidade': '#10b981',
      'avaliacao': '#8b5cf6',
      'observacao': '#f59e0b'
    }
    return colorMap[tipo] || '#6b7280'
  }

  if (loading) {
    return (
      <div className="cliente-detalhes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do cliente...</p>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="cliente-detalhes-error">
        <p>Cliente não encontrado</p>
        <button onClick={() => navigate('/app/clientes')}>
          Voltar para Clientes
        </button>
      </div>
    )
  }

  return (
    <div className="cliente-detalhes-page">
      <div className="cliente-detalhes-header">
        <button className="btn-back" onClick={() => navigate('/app/clientes')}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </button>
        <div className="header-actions">
          <button
            className="btn-edit-header"
            onClick={() => navigate(`/app/clientes/${id}/editar`)}
          >
            <FontAwesomeIcon icon={faEdit} />
            Editar Cliente
          </button>
        </div>
      </div>

      <div className="cliente-detalhes-content">
        <div className="cliente-ficha">
          <div className="ficha-header">
            <div className="cliente-avatar-large">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            <div className="cliente-info-main">
              <h1>{cliente.nome}</h1>
              <div className="status-badge-large" style={{ backgroundColor: getStatusColor(cliente.status) }}>
                <FontAwesomeIcon icon={getStatusIcon(cliente.status)} />
                {getStatusLabel(cliente.status)}
              </div>
            </div>
          </div>

          <div className="ficha-sections">
            <div className="ficha-section">
              <h2>
                <FontAwesomeIcon icon={faUser} />
                Dados Pessoais
              </h2>
              <div className="ficha-grid">
                <div className="ficha-item">
                  <label>Nome Completo</label>
                  <p>{cliente.nome}</p>
                </div>
                {cliente.cpf && (
                  <div className="ficha-item">
                    <label>
                      <FontAwesomeIcon icon={faIdCard} /> CPF
                    </label>
                    <p>{formatCPF(cliente.cpf)}</p>
                  </div>
                )}
                {cliente.dataNascimento && (
                  <div className="ficha-item">
                    <label>
                      <FontAwesomeIcon icon={faCalendarAlt} /> Data de Nascimento
                    </label>
                    <p>{new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                <div className="ficha-item">
                  <label>
                    <FontAwesomeIcon icon={faEnvelope} /> E-mail
                  </label>
                  <p>{cliente.email}</p>
                </div>
                <div className="ficha-item">
                  <label>
                    <FontAwesomeIcon icon={faPhone} /> Telefone
                  </label>
                  <p>{formatTelefone(cliente.telefone)}</p>
                </div>
              </div>
            </div>

            {cliente.endereco && (
              <div className="ficha-section">
                <h2>
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  Endereço
                </h2>
                <div className="ficha-grid">
                  <div className="ficha-item">
                    <label>Rua</label>
                    <p>
                      {cliente.endereco.rua}
                      {cliente.endereco.numero && `, ${cliente.endereco.numero}`}
                      {cliente.endereco.complemento && ` - ${cliente.endereco.complemento}`}
                    </p>
                  </div>
                  {cliente.endereco.bairro && (
                    <div className="ficha-item">
                      <label>Bairro</label>
                      <p>{cliente.endereco.bairro}</p>
                    </div>
                  )}
                  <div className="ficha-item">
                    <label>Cidade</label>
                    <p>{cliente.endereco.cidade} - {cliente.endereco.estado}</p>
                  </div>
                  {cliente.endereco.cep && (
                    <div className="ficha-item">
                      <label>CEP</label>
                      <p>{formatCEP(cliente.endereco.cep)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="ficha-section">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faStethoscope} />
                  Necessidades
                </h2>
                <button
                  className="btn-add"
                  onClick={() => setShowNecessidadesModal(true)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Adicionar
                </button>
              </div>
              {Array.isArray(cliente.necessidades) && cliente.necessidades.length > 0 ? (
                <ul className="necessidades-list">
                  {cliente.necessidades.map((necessidade, index) => {
                    // Garantir que necessidade seja uma string
                    const necessidadeTexto = typeof necessidade === 'string' 
                      ? necessidade 
                      : (Array.isArray(necessidade) 
                          ? necessidade.join(', ') 
                          : String(necessidade))
                    
                    return (
                      <li key={index}>
                        <FontAwesomeIcon icon={faStethoscope} />
                        {necessidadeTexto}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="empty-text">Nenhuma necessidade registrada</p>
              )}
            </div>

            <div className="ficha-section">
              <div className="section-header-actions">
                <h2>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Status do Tratamento
                </h2>
                <button
                  className="btn-change-status"
                  onClick={() => setShowStatusModal(true)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Alterar Status
                </button>
              </div>
              <div className="status-display">
                <div
                  className="status-badge-display"
                  style={{ backgroundColor: getStatusColor(cliente.status) }}
                >
                  <FontAwesomeIcon icon={getStatusIcon(cliente.status)} />
                  {getStatusLabel(cliente.status)}
                </div>
              </div>
            </div>

            {cliente.observacoes && (
              <div className="ficha-section">
                <h2>
                  <FontAwesomeIcon icon={faFileMedical} />
                  Observações
                </h2>
                <p className="observacoes-text">{cliente.observacoes}</p>
              </div>
            )}

            <div className="ficha-section">
              <h2>
                <FontAwesomeIcon icon={faXRay} />
                Radiografias
              </h2>
              {radiografias.length > 0 ? (
                <div className="radiografias-grid">
                  {radiografias.map((radiografia) => (
                    <div 
                      key={radiografia.id} 
                      className="radiografia-card"
                      onClick={() => navigate(`/app/diagnosticos/${radiografia.id}`)}
                    >
                      <div className="radiografia-card-image">
                        <img 
                          src={radiografia.imagem && radiografia.imagem.startsWith('data:image') 
                            ? radiografia.imagem 
                            : exameImage} 
                          alt={radiografia.paciente}
                          onError={(e) => {
                            e.target.src = exameImage
                          }}
                        />
                        <div className="radiografia-card-overlay">
                          <button className="btn-view-radiografia">
                            <FontAwesomeIcon icon={faEye} /> Ver Detalhes
                          </button>
                        </div>
                      </div>
                      <div className="radiografia-card-info">
                        <h3>{radiografia.paciente || 'Radiografia'}</h3>
                        <p className="radiografia-card-date">
                          {new Date(radiografia.data || radiografia.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {radiografia.tipoExame && (
                          <p className="radiografia-card-type">{radiografia.tipoExame}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">Nenhuma radiografia registrada</p>
              )}
            </div>
          </div>
        </div>

        <div className="cliente-historico">
          <h2>
            <FontAwesomeIcon icon={faHistory} />
            Histórico
          </h2>
          {historico.length > 0 ? (
            <div className="historico-timeline">
              {historico.map((item) => (
                <div key={item.id} className="historico-item">
                  <div
                    className="historico-icon"
                    style={{ backgroundColor: getHistoricoColor(item.tipo) }}
                  >
                    <FontAwesomeIcon icon={getHistoricoIcon(item.tipo)} />
                  </div>
                  <div className="historico-content">
                    <p className="historico-descricao">{item.descricao}</p>
                    <div className="historico-meta">
                      <span className="historico-usuario">{item.usuario}</span>
                      <span className="historico-data">
                        {item.data}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="historico-empty-state">
              <div className="historico-empty-icon">
                <FontAwesomeIcon icon={faHistory} />
              </div>
              <h3>Nenhum histórico registrado</h3>
              <p>As alterações feitas neste paciente aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Necessidade */}
      {showNecessidadesModal && (
        <div className="modal-overlay" onClick={() => setShowNecessidadesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Adicionar Necessidade</h3>
            <textarea
              value={novaNecessidade}
              onChange={(e) => setNovaNecessidade(e.target.value)}
              placeholder="Descreva a necessidade do cliente..."
              rows="4"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowNecessidadesModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleAddNecessidade}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alterar Status */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Alterar Status</h3>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
            >
              <option value="">Selecione um status</option>
              <option value="avaliacao-realizada">Avaliação Realizada</option>
              <option value="em-andamento">Em Andamento</option>
              <option value="aprovado">Aprovado</option>
              <option value="tratamento-concluido">Tratamento Concluído</option>
              <option value="perdido">Perdido</option>
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowStatusModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleUpdateStatus}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClienteDetalhes

