import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faPlus, faUserMd, faEnvelope, faIdCard, faGraduationCap, faPhone, faImage, faLink, faCopy, faCheckCircle, faToggleOn, faToggleOff, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Dentistas.css'

const Dentistas = () => {
  const { selectedClinicData, selectedClinicId } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    crm: '',
    especialidade: '',
    telefone: '',
    imagem: null
  })

  // Obter hash do cliente master
  const clienteMaster = selectedClinicData?.clienteMaster || selectedClinicData
  const hash = clienteMaster?.hash
  const inviteUrl = hash ? `${window.location.origin}/profissional/${hash}` : null

  const handleCopyUrl = async () => {
    if (!inviteUrl) return
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar URL:', error)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea')
      textArea.value = inviteUrl
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Erro ao copiar:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  useEffect(() => {
    if (selectedClinicId) {
      fetchUsuarios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId])

  const fetchUsuarios = async () => {
    if (!selectedClinicId) {
      setError('Cliente Master não selecionado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/clientes-master/${selectedClinicId}/usuarios`)
      
      if (response.data.statusCode === 200) {
        const usuariosData = response.data.data?.usuarios || response.data.usuarios || []
        setUsuarios(usuariosData)
      } else {
        setError('Erro ao buscar usuários')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setError(error.response?.data?.message || 'Erro ao buscar usuários. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (usuarioId, currentStatus) => {
    if (!usuarioId) return

    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo'

    setUpdatingStatus(prev => ({ ...prev, [usuarioId]: true }))

    try {
      const response = await api.patch(`/clientes-master/usuarios/${usuarioId}/status`, {
        status: newStatus
      })

      if (response.data.statusCode === 200 || response.status === 200) {
        // Atualizar o estado local usando o status retornado
        const updatedUsuario = response.data.usuario || response.data.data?.usuario
        setUsuarios(prev => prev.map(usuario => 
          usuario.id === usuarioId 
            ? { 
                ...usuario, 
                status: updatedUsuario?.status || newStatus,
                ativo: updatedUsuario?.ativo !== undefined ? updatedUsuario.ativo : (newStatus === 'ativo')
              }
            : usuario
        ))
      } else {
        setError('Erro ao alterar status do usuário')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      setError(error.response?.data?.message || 'Erro ao alterar status. Tente novamente.')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [usuarioId]: false }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, imagem: reader.result })
        setSelectedImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Buscar dentistas existentes
      const savedDentistas = JSON.parse(localStorage.getItem('mockDentistas') || '[]')
      
      // Criar novo dentista
      const novoDentista = {
        id: Math.max(...savedDentistas.map(d => d.id), 0) + 1,
        ...formData
      }
      
      savedDentistas.push(novoDentista)
      localStorage.setItem('mockDentistas', JSON.stringify(savedDentistas))
      
      setShowForm(false)
      setFormData({
        nome: '',
        email: '',
        crm: '',
        especialidade: '',
        telefone: '',
        imagem: null
      })
      setSelectedImage(null)
      fetchDentistas()
    } catch (error) {
      console.error('Erro ao cadastrar dentista:', error)
      alert('Erro ao cadastrar dentista')
    }
  }

  if (loading) {
    return (
      <div className="dentistas-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dentistas...</p>
      </div>
    )
  }

  return (
    <div className="dentistas-modern">
      <div className="dentistas-header">
        <div>
          <h2>
            <FontAwesomeIcon icon={faUsers} /> Cadastro de Dentistas
          </h2>
          <p>Gerencie os profissionais da sua clínica</p>
        </div>
        <button className="btn-dentistas-primary" onClick={() => setShowForm(!showForm)}>
          <FontAwesomeIcon icon={faPlus} /> {showForm ? 'Cancelar' : 'Novo Dentista'}
        </button>
      </div>

      {inviteUrl && (
        <div className="invite-link-card">
          <div className="invite-link-header">
            <FontAwesomeIcon icon={faLink} />
            <h3>Link de Convite para Dentistas</h3>
          </div>
          <p className="invite-link-description">
            Compartilhe este link com os dentistas que deseja adicionar à sua clínica. 
            Eles poderão se cadastrar ou vincular sua conta existente através deste link.
          </p>
          <div className="invite-link-container">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="invite-link-input"
              onClick={(e) => e.target.select()}
            />
            <button 
              className="btn-copy-link"
              onClick={handleCopyUrl}
              title="Copiar link"
            >
              {copied ? (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Copiado!
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCopy} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="form-card-modern">
          <h3>Novo Dentista</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group-modern">
              <label>
                <FontAwesomeIcon icon={faImage} /> Foto do Profissional
              </label>
              <div className="image-upload-area">
                {selectedImage ? (
                  <div className="image-preview">
                    <img src={selectedImage} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => {
                        setSelectedImage(null)
                        setFormData({ ...formData, imagem: null })
                      }}
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <FontAwesomeIcon icon={faImage} size="3x" />
                    <span>Clique para fazer upload da foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="form-grid-modern">
              <div className="form-group-modern">
                <label>
                  <FontAwesomeIcon icon={faUserMd} /> Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Nome do dentista"
                />
              </div>
              <div className="form-group-modern">
                <label>
                  <FontAwesomeIcon icon={faEnvelope} /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="form-grid-modern">
              <div className="form-group-modern">
                <label>
                  <FontAwesomeIcon icon={faIdCard} /> CRM
                </label>
                <input
                  type="text"
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                  required
                  placeholder="Número do CRM"
                />
              </div>
              <div className="form-group-modern">
                <label>
                  <FontAwesomeIcon icon={faGraduationCap} /> Especialidade
                </label>
                <input
                  type="text"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                  required
                  placeholder="Ex: Ortodontia, Implantodontia..."
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label>
                <FontAwesomeIcon icon={faPhone} /> Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
                placeholder="(00) 00000-0000"
              />
            </div>

            <button type="submit" className="btn-submit-modern">
              <FontAwesomeIcon icon={faPlus} /> Cadastrar Dentista
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message-dentistas">
          <FontAwesomeIcon icon={faEnvelope} />
          <span>{error}</span>
        </div>
      )}

      <div className="dentistas-grid">
        {usuarios.length === 0 ? (
          <div className="empty-state-dentistas">
            <FontAwesomeIcon icon={faUsers} size="4x" />
            <h3>Nenhum usuário vinculado</h3>
            <p>Compartilhe o link de convite para adicionar profissionais à sua clínica</p>
          </div>
        ) : (
          usuarios.map((usuario) => {
            const user = usuario.user || {}
            const isAtivo = usuario.status === 'ativo'
            const isUpdating = updatingStatus[usuario.id]

            return (
              <div key={usuario.id} className={`dentista-card ${!isAtivo ? 'inactive' : ''}`}>
                <div className="dentista-image">
                  <div className="dentista-image-placeholder">
                    {(user.nome || 'U').charAt(0).toUpperCase()}
                  </div>
                  {!isAtivo && (
                    <div className="status-badge-inactive">
                      Inativo
                    </div>
                  )}
                </div>
                <div className="dentista-info">
                  <div className="dentista-header">
                    <h4>{user.nome || 'Nome não informado'}</h4>
                    {isAtivo && (
                      <span className="status-badge-active">
                        <FontAwesomeIcon icon={faCheckCircle} /> Ativo
                      </span>
                    )}
                  </div>
                  {user.cro && (
                    <p className="dentista-crm">
                      <FontAwesomeIcon icon={faIdCard} /> CRO: {user.cro}
                    </p>
                  )}
                  <div className="dentista-contact">
                    <p>
                      <FontAwesomeIcon icon={faEnvelope} /> {user.email || 'Email não informado'}
                    </p>
                    {user.telefone && (
                      <p>
                        <FontAwesomeIcon icon={faPhone} /> {user.telefone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="dentista-actions">
                  <button 
                    className={`status-toggle-btn ${isAtivo ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                    disabled={isUpdating}
                    title={isAtivo ? 'Desativar usuário' : 'Ativar usuário'}
                  >
                    {isUpdating ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : isAtivo ? (
                      <>
                        <FontAwesomeIcon icon={faToggleOn} />
                        Desativar
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faToggleOff} />
                        Ativar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Dentistas
