import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faCheckCircle, faSpinner, faXRay, faFileMedical, faSearch, faArrowRight, faPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import nodoLogo from '../img/nodo.png'
import api from '../utils/api'
import './Auth.css'

const SelectClinic = () => {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, getClinicsByEmail, setSelectedClinicId, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true)
      setError('')

      try {
        // Pegar email do usuário logado ou da query string
        const email = user?.email || new URLSearchParams(location.search).get('email')
        
        if (!email) {
          setError('Email não encontrado. Faça login novamente.')
          setTimeout(() => navigate('/login'), 2000)
          return
        }

        const result = await getClinicsByEmail(email)

        if (result.success && result.clinics && result.clinics.length > 0) {
          setClinics(result.clinics)
        } else {
          setError('Nenhum consultório encontrado para este email.')
        }
      } catch (error) {
        console.error('Erro ao buscar consultórios:', error)
        setError('Erro ao carregar consultórios. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchClinics()
  }, [user, location, navigate, getClinicsByEmail])

  // Função para buscar assinatura do cliente master selecionado
  const checkClinicSubscription = async (clinicId) => {
    try {
      // Primeiro, tentar pegar dos dados do clinic
      const clinic = clinics.find(c => c.id === clinicId)
      
      // Se não tiver assinatura nos dados do clinic, buscar diretamente da API
      if (!clinic || !clinic.assinatura) {
        try {
          // Buscar assinatura atualizada da API após selecionar o cliente master
          const response = await api.get('/assinaturas/minha?sync=true')
          const assinatura = response.data?.data || response.data
          
          if (assinatura) {
            return {
              success: true,
              subscription: assinatura
            }
          }
        } catch (apiError) {
          console.error('Erro ao buscar assinatura da API:', apiError)
        }
        
        return {
          success: false,
          message: 'Assinatura não encontrada para este consultório'
        }
      }
      
      return {
        success: true,
        subscription: clinic.assinatura
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error)
      return {
        success: false,
        message: 'Erro ao verificar assinatura'
      }
    }
  }

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedClinic) {
      setError('Por favor, selecione um consultório')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Buscar dados completos do cliente master usando a rota /complete
      let clinicCompleteData = null
      try {
        const response = await api.get(`/clientes-master/${selectedClinic.id}/complete`)
        clinicCompleteData = response.data?.data || response.data
      } catch (error) {
        console.error('Erro ao buscar dados completos do cliente master:', error)
        setError('Erro ao buscar dados do consultório. Tente novamente.')
        setSubmitting(false)
        return
      }
      
      if (!clinicCompleteData) {
        setError('Dados do consultório não encontrados.')
        setSubmitting(false)
        return
      }
      
      // A estrutura da resposta é: { clienteMaster: {...}, assinatura: {...}, user: {...}, plano: {...} }
      const clienteMaster = clinicCompleteData.clienteMaster || clinicCompleteData
      const assinatura = clinicCompleteData.assinatura
      
      // Verificar se o cliente master está ativo
      // Pode ser: ativo (boolean) ou status (string: 'ACTIVE'/'INACTIVE')
      const clienteMasterInativo = 
        clienteMaster?.ativo === false || 
        clienteMaster?.status === 'INACTIVE'
      
      // Verificar status da assinatura
      const assinaturaStatus = assinatura?.status
      const assinaturaInativa = assinaturaStatus !== 'ACTIVE'
      
      // Se cliente master não estiver ativo OU assinatura não estiver ativa, redirecionar para assinatura pendente
      if (clienteMasterInativo || assinaturaInativa) {
        // Salvar o ID do consultório selecionado antes de redirecionar
        await setSelectedClinicId(selectedClinic.id)
        navigate('/assinatura-pendente')
        return
      }
      
      // Salvar o ID do consultório selecionado (isso também busca os dados do cliente master)
      await setSelectedClinicId(selectedClinic.id)
      
      // Aguardar um pouco para garantir que os dados foram salvos
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Se tudo estiver ativo, redirecionar para a plataforma
      navigate('/app')
    } catch (error) {
      console.error('Erro ao selecionar consultório:', error)
      setError('Erro ao processar seleção. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-container-modern">
        <div className="auth-right-panel" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <FontAwesomeIcon icon={faSpinner} spin size="3x" style={{ color: '#0ea5e9', marginBottom: '1rem' }} />
            <p style={{ color: '#e5e7eb', fontSize: '1.125rem' }}>Carregando consultórios...</p>
          </div>
        </div>
      </div>
    )
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
            <h2>Selecione seu consultório</h2>
            <p>Escolha o consultório que deseja acessar</p>
          </div>

          {error && !loading && (
            <div className="error-message-modern">{error}</div>
          )}

          {clinics.length === 0 && !loading && !error && (
            <div className="error-message-modern">
              Nenhum consultório encontrado. Entre em contato com o suporte.
            </div>
          )}

          {clinics.length > 0 && (
            <form onSubmit={handleSubmit} className="auth-form-modern">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* Card para adicionar novo consultório */}
                <div
                  onClick={() => navigate('/add-clinic')}
                  style={{
                    padding: '1.5rem',
                    border: '2px dashed rgba(14, 165, 233, 0.5)',
                    borderRadius: '0.75rem',
                    background: 'rgba(14, 165, 233, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    minHeight: '80px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.8)'
                    e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'
                    e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    background: 'rgba(14, 165, 233, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FontAwesomeIcon 
                      icon={faPlus} 
                      size="lg" 
                      style={{ color: '#0ea5e9' }} 
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: '#0ea5e9',
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}>
                      Adicionar Novo Consultório
                    </h3>
                    <p style={{ 
                      margin: '0.25rem 0 0 0', 
                      color: '#9ca3af',
                      fontSize: '0.875rem'
                    }}>
                      Criar uma nova assinatura e adicionar outro escritório
                    </p>
                  </div>
                </div>

                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    onClick={() => handleSelectClinic(clinic)}
                    style={{
                      padding: '1.5rem',
                      border: selectedClinic?.id === clinic.id 
                        ? '2px solid #0ea5e9' 
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.75rem',
                      background: selectedClinic?.id === clinic.id
                        ? 'rgba(14, 165, 233, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedClinic?.id !== clinic.id) {
                        e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'
                        e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedClinic?.id !== clinic.id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '0.5rem',
                      background: (clinic.cor && clinic.cor !== null) ? `${clinic.cor}20` : 'rgba(14, 165, 233, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {(clinic.logo && clinic.logo !== null) ? (
                        <img 
                          src={clinic.logo} 
                          alt={(clinic.nomeEmpresa && clinic.nomeEmpresa !== null) ? clinic.nomeEmpresa : (clinic.nome || 'Consultório')}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            // Se a imagem falhar ao carregar, mostrar o ícone
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = '<i class="fa fa-building"></i>'
                          }}
                        />
                      ) : (
                        <FontAwesomeIcon 
                          icon={faBuilding} 
                          size="lg" 
                          style={{ color: (clinic.cor && clinic.cor !== null) ? clinic.cor : '#0ea5e9' }} 
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: 0, 
                        marginBottom: '0.25rem',
                        color: (clinic.cor && clinic.cor !== null) ? clinic.cor : '#ffffff',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}>
                        {(clinic.nomeEmpresa && clinic.nomeEmpresa !== null) 
                          ? clinic.nomeEmpresa 
                          : (clinic.nome || 'Consultório')
                        }
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        {clinic.email || 'Email não informado'}
                      </p>
                      {clinic.assinatura && (
                        <div style={{ 
                          marginTop: '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.375rem'
                        }}>
                          {clinic.assinatura.plano?.nome && (
                            <p style={{
                              margin: 0,
                              color: '#ffffff',
                              fontSize: '0.8125rem',
                              fontWeight: '500'
                            }}>
                              {clinic.assinatura.plano.nome}
                            </p>
                          )}
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'inline-block',
                            width: 'fit-content',
                            background: clinic.assinatura.status === 'ACTIVE' 
                              ? 'rgba(34, 197, 94, 0.2)' 
                              : clinic.assinatura.status === 'PENDING'
                              ? 'rgba(251, 191, 36, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                            color: clinic.assinatura.status === 'ACTIVE'
                              ? '#22c55e'
                              : clinic.assinatura.status === 'PENDING'
                              ? '#fbbf24'
                              : '#ef4444',
                            border: `1px solid ${
                              clinic.assinatura.status === 'ACTIVE'
                                ? 'rgba(34, 197, 94, 0.3)'
                                : clinic.assinatura.status === 'PENDING'
                                ? 'rgba(251, 191, 36, 0.3)'
                                : 'rgba(239, 68, 68, 0.3)'
                            }`
                          }}>
                            {clinic.assinatura.status === 'ACTIVE' 
                              ? 'Ativo' 
                              : clinic.assinatura.status === 'PENDING'
                              ? 'Pendente'
                              : clinic.assinatura.status || 'Desconhecido'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedClinic?.id === clinic.id && (
                      <FontAwesomeIcon 
                        icon={faCheckCircle} 
                        style={{ 
                          color: '#0ea5e9',
                          fontSize: '1.5rem',
                          flexShrink: 0
                        }} 
                      />
                    )}
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                className="auth-button-modern" 
                disabled={!selectedClinic || submitting}
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <FontAwesomeIcon icon={faArrowRight} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default SelectClinic

