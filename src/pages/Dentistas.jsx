import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faPlus, faUserMd, faEnvelope, faIdCard, faGraduationCap, faPhone, faImage } from '@fortawesome/free-solid-svg-icons'
// Removido import de API - usando dados mockados
import './Dentistas.css'

const Dentistas = () => {
  const [dentistas, setDentistas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    crm: '',
    especialidade: '',
    telefone: '',
    imagem: null
  })

  useEffect(() => {
    fetchDentistas()
  }, [])

  const fetchDentistas = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Buscar dentistas do localStorage ou usar dados mockados
      const savedDentistas = JSON.parse(localStorage.getItem('mockDentistas') || '[]')
      if (savedDentistas.length > 0) {
        setDentistas(savedDentistas)
      } else {
        // Dados mockados iniciais
        const mockData = [
          {
            id: 1,
            nome: 'Dr. João Silva',
            email: 'joao.silva@nodon.com',
            crm: 'CRO-SP 12345',
            especialidade: 'Ortodontia',
            telefone: '(11) 99999-9999',
            imagem: null
          },
          {
            id: 2,
            nome: 'Dra. Maria Santos',
            email: 'maria.santos@nodon.com',
            crm: 'CRO-SP 67890',
            especialidade: 'Implantodontia',
            telefone: '(11) 88888-8888',
            imagem: null
          }
        ]
        setDentistas(mockData)
        localStorage.setItem('mockDentistas', JSON.stringify(mockData))
      }
    } catch (error) {
      console.error('Erro ao buscar dentistas:', error)
    } finally {
      setLoading(false)
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

      <div className="dentistas-grid">
        {dentistas.length === 0 ? (
          <div className="empty-state-dentistas">
            <FontAwesomeIcon icon={faUsers} size="4x" />
            <h3>Nenhum dentista cadastrado</h3>
            <p>Comece adicionando um novo profissional</p>
          </div>
        ) : (
          dentistas.map((dentista) => (
            <div key={dentista.id} className="dentista-card">
              <div className="dentista-image">
                {dentista.imagem ? (
                  <img src={dentista.imagem} alt={dentista.nome} />
                ) : (
                  <div className="dentista-image-placeholder">
                    {dentista.nome.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="dentista-info">
                <h4>{dentista.nome}</h4>
                <p className="dentista-crm">
                  <FontAwesomeIcon icon={faIdCard} /> CRM: {dentista.crm}
                </p>
                <p className="dentista-especialidade">
                  <FontAwesomeIcon icon={faGraduationCap} /> {dentista.especialidade}
                </p>
                <div className="dentista-contact">
                  <p>
                    <FontAwesomeIcon icon={faEnvelope} /> {dentista.email}
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faPhone} /> {dentista.telefone}
                  </p>
                </div>
              </div>
              <div className="dentista-actions">
                <button className="dentista-edit-btn">Editar</button>
                <button className="dentista-view-btn">Ver Perfil</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dentistas
