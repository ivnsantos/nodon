import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faSpinner, faXRay, faFileMedical, faSearch, faArrowRight, faSignOutAlt, faImage, faPalette, faUpload, faTimes } from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import { useAuth } from '../context/useAuth'
import api from '../utils/api'
import './Auth.css'

const CompleteMasterData = () => {
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    cnpj: '',
    logo: '',
    cor: '#0ea5e9'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [useFileUpload, setUseFileUpload] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'cnpj') {
      // Formatar CPF ou CNPJ automaticamente
      const numbers = value.replace(/\D/g, '')
      let formatted
      
      if (numbers.length <= 11) {
        // Formatar como CPF
        formatted = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (match, p1, p2, p3, p4) => {
          if (p4) return `${p1}.${p2}.${p3}-${p4}`
          if (p3) return `${p1}.${p2}.${p3}`
          if (p2) return `${p1}.${p2}`
          return p1
        })
      } else {
        // Formatar como CNPJ
        formatted = numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (match, p1, p2, p3, p4, p5) => {
          if (p5) return `${p1}.${p2}.${p3}/${p4}-${p5}`
          if (p4) return `${p1}.${p2}.${p3}/${p4}`
          if (p3) return `${p1}.${p2}.${p3}`
          if (p2) return `${p1}.${p2}`
          return p1
        })
      }
      
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'logo') {
      // Se for URL, atualizar preview
      setFormData(prev => ({ ...prev, [name]: value }))
      if (value.startsWith('http')) {
        setLogoPreview(value)
        setUseFileUpload(false)
        setLogoFile(null)
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB')
      return
    }

    setLogoFile(file)
    setUseFileUpload(true)
    setFormData(prev => ({ ...prev, logo: '' })) // Limpar URL quando selecionar arquivo
    
    // Criar preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, logo: '' }))
    setUseFileUpload(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validações
    if (!formData.nomeEmpresa.trim()) {
      setError('Por favor, informe o nome da empresa')
      return
    }
    
    if (!formData.cnpj.trim()) {
      setError('Por favor, informe o CPF ou CNPJ')
      return
    }
    
    // Validar CPF ou CNPJ
    const documentoNumbers = formData.cnpj.replace(/\D/g, '')
    if (documentoNumbers.length !== 11 && documentoNumbers.length !== 14) {
      setError('CPF/CNPJ inválido. CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos')
      return
    }

    setLoading(true)

    try {
      let response

      if (useFileUpload && logoFile) {
        // Enviar via FormData (multipart/form-data) quando houver arquivo
        const formDataToSend = new FormData()
        formDataToSend.append('file', logoFile)
        formDataToSend.append('nomeEmpresa', formData.nomeEmpresa)
        formDataToSend.append('documento', documentoNumbers)
        formDataToSend.append('cor', formData.cor)

        response = await api.post('/clientes-master/meus-dados', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else if (formData.logo && formData.logo.trim()) {
        // Enviar via FormData com URL
        const formDataToSend = new FormData()
        formDataToSend.append('logo', formData.logo)
        formDataToSend.append('nomeEmpresa', formData.nomeEmpresa)
        formDataToSend.append('documento', documentoNumbers)
        formDataToSend.append('cor', formData.cor)

        response = await api.post('/clientes-master/meus-dados', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // Enviar via JSON quando não houver logo
        response = await api.post('/clientes-master/meus-dados', {
          nomeEmpresa: formData.nomeEmpresa,
          documento: documentoNumbers,
          cor: formData.cor
        })
      }

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        // Dados salvos com sucesso, redirecionar para seleção de consultório
        navigate('/select-clinic')
      } else {
        setError(response.data.message || 'Erro ao salvar dados. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || 'Erro ao salvar dados. Tente novamente.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="auth-container-modern">
      <div className="auth-left-panel">
        <div className="auth-branding">
          <h1 className="auth-brand-title">NODON</h1>
          <p className="auth-brand-subtitle">
            Plataforma inteligente para análise de radiografias odontológicas
          </p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faXRay} />
              </div>
              <span>Análise de Radiografias</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faFileMedical} />
              </div>
              <span>Relatórios Detalhados</span>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faSearch} />
              </div>
              <span>Detecção Inteligente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-form-container" style={{ position: 'relative' }}>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
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
            <FontAwesomeIcon icon={faSignOutAlt} />
            Sair
          </button>
          
          <div className="auth-logo-right">
            <img src={nodoLogo} alt="NODON" className="auth-logo-animated" />
          </div>
          
          <div className="auth-header-modern">
            <h2>Complete seus dados</h2>
            <p>Preencha as informações da sua clínica para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-modern">
            {error && <div className="error-message-modern">{error}</div>}
            
            <div className="form-group-modern">
              <label htmlFor="nomeEmpresa">
                <FontAwesomeIcon icon={faBuilding} /> Nome da Empresa *
              </label>
              <input
                type="text"
                id="nomeEmpresa"
                name="nomeEmpresa"
                value={formData.nomeEmpresa}
                onChange={handleInputChange}
                placeholder="Ex: Clínica Odontológica XYZ"
                required
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="cnpj">CPF/CNPJ *</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                maxLength="18"
                required
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="logo">
                <FontAwesomeIcon icon={faImage} /> Logo (Opcional)
              </label>
              
              {/* Preview da imagem */}
              {logoPreview && (
                <div style={{ 
                  marginBottom: '1rem', 
                  position: 'relative',
                  display: 'inline-block'
                }}>
                  <img 
                    src={logoPreview} 
                    alt="Preview do logo" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px', 
                      borderRadius: '0.5rem',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      objectFit: 'contain'
                    }} 
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 1)'
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}

              {/* Opção de upload de arquivo */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="logoFile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '2px dashed rgba(14, 165, 233, 0.5)',
                    borderRadius: '0.5rem',
                    color: '#0ea5e9',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.8)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'
                  }}
                >
                  <FontAwesomeIcon icon={faUpload} />
                  {logoFile ? logoFile.name : 'Fazer upload de imagem'}
                </label>
                <input
                  type="file"
                  id="logoFile"
                  name="logoFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Separador OU */}
              {!logoPreview && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  margin: '1rem 0',
                  color: '#9ca3af',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                  <span>OU</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                </div>
              )}

              {/* Opção de URL */}
              {!logoPreview && (
                <>
                  <input
                    type="url"
                    id="logo"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <small style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Cole a URL da imagem do logo da sua clínica
                  </small>
                </>
              )}
            </div>

            <div className="form-group-modern">
              <label htmlFor="cor">
                <FontAwesomeIcon icon={faPalette} /> Cor Principal (Opcional)
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="color"
                  id="cor"
                  name="cor"
                  value={formData.cor}
                  onChange={handleInputChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    borderRadius: '0.5rem',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={formData.cor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      handleInputChange({ target: { name: 'cor', value: e.target.value } })
                    }
                  }}
                  placeholder="#0ea5e9"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <small style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Escolha a cor principal da sua marca
              </small>
            </div>

            <button 
              type="submit" 
              className="auth-button-modern" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Salvando...
                </>
              ) : (
                <>
                  Continuar
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompleteMasterData

