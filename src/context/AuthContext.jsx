import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { AuthContext } from './AuthContextRef'

// Tela de loading com botão "Continuar" após 3s caso trave no F5
function LoadingFallback({ onContinue }) {
  const [showRetry, setShowRetry] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowRetry(true), 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        background: '#0a0e27',
        color: '#e2e8f0'
      }}
      aria-busy="true"
    >
      <div style={{ marginBottom: 12 }}>Carregando...</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>Restaurando sessão</div>
      {showRetry && (
        <button
          type="button"
          onClick={onContinue}
          style={{
            marginTop: 24,
            padding: '10px 20px',
            fontSize: 14,
            background: '#0ea5e9',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Continuar
        </button>
      )}
    </div>
  )
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedClinicId, setSelectedClinicIdState] = useState(null)
  const [selectedClinicData, setSelectedClinicData] = useState(null)
  const [userComumId, setUserComumId] = useState(null)
  const [planoAcesso, setPlanoAcesso] = useState(null) // 'chat' ou 'all'

  useEffect(() => {
    // Garantir que loading nunca fique travado: após 1,2s força setLoading(false)
    const loadingTimeout = setTimeout(() => setLoading(false), 1200)

    try {
      if (typeof sessionStorage === 'undefined') {
        setLoading(false)
        return
      }
      const token = sessionStorage.getItem('token')
      const savedUser = sessionStorage.getItem('user')
      const savedClinicId = sessionStorage.getItem('selectedClinicId')

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (error) {
          console.error('Erro ao restaurar usuário:', error)
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('user')
        }
      }

      if (savedClinicId) {
        setSelectedClinicIdState(savedClinicId)
        const savedClinicData = sessionStorage.getItem('selectedClinicData')
        if (savedClinicData) {
          try {
            const clinicData = JSON.parse(savedClinicData)
            setSelectedClinicData(clinicData)
            const savedAcesso = sessionStorage.getItem('planoAcesso')
            if (savedAcesso) {
              setPlanoAcesso(savedAcesso)
            } else {
              const acesso = clinicData.relacionamento?.acesso || clinicData.plano?.acesso || 'all'
              setPlanoAcesso(acesso)
              sessionStorage.setItem('planoAcesso', acesso)
            }
            if (clinicData.relacionamento) {
              sessionStorage.setItem('relacionamento', JSON.stringify(clinicData.relacionamento))
              const relacionamento = clinicData.relacionamento
              if (relacionamento.tipo === 'usuario' && relacionamento.id) {
                setUserComumId(relacionamento.id)
                sessionStorage.setItem('userComumId', relacionamento.id)
              } else {
                setUserComumId(null)
                sessionStorage.removeItem('userComumId')
              }
            } else {
              setUserComumId(null)
              sessionStorage.removeItem('userComumId')
            }
          } catch (error) {
            console.error('Erro ao restaurar dados do cliente master:', error)
          }
        }
        const savedAcesso = sessionStorage.getItem('planoAcesso')
        if (savedAcesso) setPlanoAcesso(savedAcesso)
        const relacionamentoStr = sessionStorage.getItem('relacionamento')
        if (relacionamentoStr) {
          try {
            const relacionamento = JSON.parse(relacionamentoStr)
            if (relacionamento.tipo === 'usuario' && relacionamento.id) {
              const savedUserComumId = sessionStorage.getItem('userComumId')
              if (savedUserComumId) setUserComumId(savedUserComumId)
            } else {
              setUserComumId(null)
              sessionStorage.removeItem('userComumId')
            }
          } catch (error) {
            console.error('Erro ao parsear relacionamento:', error)
          }
        } else {
          setUserComumId(null)
          sessionStorage.removeItem('userComumId')
        }
      }
    } catch (err) {
      console.error('Erro na inicialização do AuthContext:', err)
    } finally {
      setLoading(false)
    }
    return () => clearTimeout(loadingTimeout)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      })

      // A API pode retornar { statusCode, message, data } ou diretamente { access_token, user }
      let access_token, userData
      
      if (response.data.statusCode && response.data.data) {
        // Estrutura: { statusCode, message, data: { access_token, user } }
        access_token = response.data.data.access_token
        userData = response.data.data.user
      } else if (response.data.access_token) {
        // Estrutura direta: { access_token, user }
        access_token = response.data.access_token
        userData = response.data.user
      } else {
        // Tentar pegar do data diretamente
        access_token = response.data.data?.access_token || response.data.access_token
        userData = response.data.data?.user || response.data.user
      }

      if (!access_token || !userData) {
        console.error('Resposta da API não contém access_token ou user:', response.data)
        return {
          success: false,
          message: 'Resposta inválida do servidor'
        }
      }

      // Normalizar campos do usuário
      const normalizedUser = {
        ...userData,
        // Normalizar campo de verificação (pode vir como isEmailVerified, emailVerified, email_verified ou phoneVerified)
        phoneVerified: userData.phoneVerified || userData.isEmailVerified || userData.emailVerified || userData.email_verified || false,
        // Garantir que telefone está presente (pode vir como telefone, phone ou telefoneCelular)
        telefone: userData.telefone || userData.phone || userData.telefoneCelular || ''
      }

      // Salvar token e usuário no sessionStorage (mais seguro que localStorage)
      sessionStorage.setItem('token', access_token)
      sessionStorage.setItem('user', JSON.stringify(normalizedUser))
      setUser(normalizedUser)

      return { 
        success: true,
        user: normalizedUser
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      console.error('Resposta do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || 'Credenciais inválidas'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  const logout = async () => {
    try {
      // Chamar API de logout antes de limpar o sessionStorage
      await api.post('/auth/logout')
    } catch (error) {
      // Mesmo se a API falhar, continuar com o logout local
      console.error('Erro ao fazer logout na API:', error)
    } finally {
      // Sempre limpar dados locais
      setUser(null)
      setSelectedClinicIdState(null)
      setSelectedClinicData(null)
      setUserComumId(null)
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('selectedClinicId')
      sessionStorage.removeItem('selectedClinicData')
      sessionStorage.removeItem('relacionamento')
      sessionStorage.removeItem('userComumId')
    }
  }

  const register = async (userData) => {
    try {
      // Determinar qual endpoint usar baseado no tipo
      const endpoint = userData.tipo === 'master' 
        ? '/auth/register-master' 
        : '/auth/register-user'
      
      const response = await api.post(endpoint, userData)

      // A API pode retornar { statusCode, message, data } ou diretamente { access_token, user }
      let access_token, newUser
      
      if (response.data.statusCode && response.data.data) {
        // Estrutura: { statusCode, message, data: { access_token, user } }
        access_token = response.data.data.access_token
        newUser = response.data.data.user
      } else if (response.data.access_token) {
        // Estrutura direta: { access_token, user }
        access_token = response.data.access_token
        newUser = response.data.user
      } else {
        // Tentar pegar do data diretamente
        access_token = response.data.data?.access_token || response.data.access_token
        newUser = response.data.data?.user || response.data.user
      }

      if (!access_token || !newUser) {
        console.error('Resposta da API não contém access_token ou user:', response.data)
        return {
          success: false,
          message: 'Resposta inválida do servidor'
        }
      }

      // Normalizar campo de verificação de email (pode vir como isEmailVerified, emailVerified ou email_verified)
      const normalizedUser = {
        ...newUser,
        emailVerified: newUser.isEmailVerified || newUser.emailVerified || newUser.email_verified || false
      }

      // Salvar token e usuário no sessionStorage (mais seguro que localStorage)
      sessionStorage.setItem('token', access_token)
      sessionStorage.setItem('user', JSON.stringify(normalizedUser))
      setUser(normalizedUser)

      return { 
        success: true,
        user: normalizedUser
      }
    } catch (error) {
      console.error('Erro ao registrar:', error)
      console.error('Resposta do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || 'Erro ao criar conta'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  const refreshUser = async () => {
    try {
      // Buscar assinatura atualizada
      const response = await api.get('/assinaturas/minha')
      const assinatura = response.data
      
      // Atualizar usuário com nova assinatura
      const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}')
      if (savedUser && assinatura) {
        savedUser.assinatura = assinatura
        sessionStorage.setItem('user', JSON.stringify(savedUser))
        setUser({ ...savedUser })
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  const verifyPhone = useCallback(async (telefone, code) => {
    try {
      // Garantir que o telefone tenha apenas números e comece com 55
      let telefoneLimpo = telefone.replace(/\D/g, '')
      if (!telefoneLimpo.startsWith('55')) {
        telefoneLimpo = '55' + telefoneLimpo
      }
      
      const response = await api.post('/auth/verify-phone', {
        telefone: telefoneLimpo,
        code
      })

      // A API pode retornar statusCode 200 ou 201 para sucesso
      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        // Atualizar status de verificação do usuário
        const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}')
        if (savedUser) {
          savedUser.phoneVerified = true
          savedUser.emailVerified = true // Manter compatibilidade
          sessionStorage.setItem('user', JSON.stringify(savedUser))
          setUser({ ...savedUser })
        }
        return { success: true }
      }
      
      // Se não for sucesso, retornar erro
      const errorMessage = response.data?.message || 'Erro ao verificar código'
      return {
        success: false,
        message: errorMessage
      }
    } catch (error) {
      console.error('Erro ao verificar telefone:', error)
      console.error('Resposta do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || 'Código inválido'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }, [])

  const resendVerificationCode = useCallback(async (telefone) => {
    try {
      // Garantir que o telefone tenha apenas números e comece com 55
      let telefoneLimpo = telefone.replace(/\D/g, '')
      if (!telefoneLimpo.startsWith('55')) {
        telefoneLimpo = '55' + telefoneLimpo
      }
      
      const response = await api.post('/auth/resend-verification-code', {
        telefone: telefoneLimpo
      })

      // Aceitar tanto statusCode 200 quanto 201, ou status HTTP 201
      const statusCode = response.data?.statusCode || response.status
      if (statusCode === 200 || statusCode === 201) {
        return { success: true }
      }
      
      // Se não for sucesso, retornar erro
      const errorMessage = response.data?.message || 'Erro ao reenviar código'
      return { 
        success: false, 
        message: errorMessage
      }
    } catch (error) {
      console.error('Erro ao reenviar código:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || 'Erro ao reenviar código'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }, [])

  const getClinicsByEmail = async (email) => {
    try {
      // userBaseId vem do token JWT, não precisa enviar na query
      const response = await api.get(`/auth/get-client-token`)

      if (response.data.statusCode === 200) {
        const clinics = response.data.data?.clientesMaster || []
        return { 
          success: true, 
          clinics 
        }
      }
      return {
        success: false,
        message: 'Erro ao buscar consultórios',
        clinics: []
      }
    } catch (error) {
      console.error('Erro ao buscar consultórios:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao buscar consultórios'
      return { 
        success: false, 
        message: errorMessage,
        clinics: []
      }
    }
  }

  const setSelectedClinicId = async (clinicId, clinicData = null) => {
    // Limpar dados antigos antes de buscar novos
    setSelectedClinicData(null)
    setUserComumId(null)
    setPlanoAcesso(null)
    sessionStorage.removeItem('selectedClinicData')
    sessionStorage.removeItem('relacionamento')
    sessionStorage.removeItem('userComumId')
    sessionStorage.removeItem('planoAcesso')
    
    // Atualizar o ID do consultório selecionado
    setSelectedClinicIdState(clinicId)
    sessionStorage.setItem('selectedClinicId', clinicId)
    
    // Se os dados já foram fornecidos, usar eles diretamente sem chamar a API
    if (clinicData) {
      setSelectedClinicData(clinicData)
      sessionStorage.setItem('selectedClinicData', JSON.stringify(clinicData))
      
      // Salvar também o relacionamento separadamente para fácil acesso
      if (clinicData.relacionamento) {
        sessionStorage.setItem('relacionamento', JSON.stringify(clinicData.relacionamento))
        
        // Extrair e salvar userComumId do relacionamento apenas se for tipo "usuario"
        // Se for clienteMaster, o ID é do cliente master, não do userComum
        // Se for usuario, o ID é do UserComum vinculado
        const relacionamento = clinicData.relacionamento
        if (relacionamento.tipo === 'usuario' && relacionamento.id) {
          setUserComumId(relacionamento.id)
          sessionStorage.setItem('userComumId', relacionamento.id)
        } else {
          // Se for clienteMaster ou outro tipo, limpar userComumId
          setUserComumId(null)
          sessionStorage.removeItem('userComumId')
        }
        
        // Extrair e salvar acesso do plano
        const acesso = relacionamento.acesso || clinicData.plano?.acesso || 'all'
        setPlanoAcesso(acesso)
        sessionStorage.setItem('planoAcesso', acesso)
      } else {
        // Se não houver relacionamento, limpar userComumId
        setUserComumId(null)
        sessionStorage.removeItem('userComumId')
        // Definir acesso padrão como 'all'
        setPlanoAcesso('all')
        sessionStorage.setItem('planoAcesso', 'all')
      }
      return
    }
    
    // Buscar dados completos do cliente master selecionado usando a rota /complete
    try {
      // Chamar API via GET com o ID no header
      const response = await api.get('/clientes-master/complete', {
        headers: {
          'X-Cliente-Master-Id': clinicId
        }
      })
      
      // A estrutura pode ser: response.data.data ou response.data
      const data = response.data?.data || response.data
      
      if (data) {
        // Garantir que o relacionamento seja salvo
        // A estrutura já vem com relacionamento: { tipo: "clienteMaster", id: "...", acesso: "all" ou "chat" }
        setSelectedClinicData(data)
        sessionStorage.setItem('selectedClinicData', JSON.stringify(data))
        
        // Extrair e salvar o acesso do plano
        // O acesso pode vir de: data.relacionamento.acesso ou data.plano.acesso
        const acesso = data.relacionamento?.acesso || data.plano?.acesso || 'all'
        setPlanoAcesso(acesso)
        sessionStorage.setItem('planoAcesso', acesso)
        
        // Salvar também o relacionamento separadamente para fácil acesso
        if (data.relacionamento) {
          sessionStorage.setItem('relacionamento', JSON.stringify(data.relacionamento))
          
          // Extrair e salvar userComumId do relacionamento apenas se for tipo "usuario"
          // Se for clienteMaster, o ID é do cliente master, não do userComum
          // Se for usuario, o ID é do UserComum vinculado
          const relacionamento = data.relacionamento
          if (relacionamento.tipo === 'usuario' && relacionamento.id) {
            setUserComumId(relacionamento.id)
            sessionStorage.setItem('userComumId', relacionamento.id)
          } else {
            // Se for clienteMaster ou outro tipo, limpar userComumId
            setUserComumId(null)
            sessionStorage.removeItem('userComumId')
          }
        } else {
          // Se não houver relacionamento, limpar userComumId
          setUserComumId(null)
          sessionStorage.removeItem('userComumId')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos do cliente master:', error)
      // Fallback: tentar buscar da lista de clínicas se a rota /complete falhar
      try {
        const email = user?.email
        if (email) {
          const result = await getClinicsByEmail(email)
          if (result.success && result.clinics) {
            const clinic = result.clinics.find(c => c.id === clinicId)
            if (clinic) {
              setSelectedClinicData(clinic)
              sessionStorage.setItem('selectedClinicData', JSON.stringify(clinic))
            }
          }
        }
      } catch (fallbackError) {
        console.error('Erro ao buscar dados do cliente master (fallback):', fallbackError)
      }
    }
  }

  // Função para limpar userComumId quando voltar para clínicas
  const clearUserComumId = useCallback(() => {
    setUserComumId(null)
    sessionStorage.removeItem('userComumId')
  }, [])

  // Função helper para verificar se o usuário é ClienteMaster
  const isClienteMaster = useCallback(() => {
    if (!selectedClinicData) return false
    const relacionamento = selectedClinicData.relacionamento
    return relacionamento?.tipo === 'clienteMaster'
  }, [selectedClinicData])

  // Função helper para verificar se o usuário é Usuario comum
  const isUsuario = useCallback(() => {
    if (!selectedClinicData) return false
    const relacionamento = selectedClinicData.relacionamento
    return relacionamento?.tipo === 'usuario'
  }, [selectedClinicData])

  // Função helper para obter o relacionamento atual
  const getRelacionamento = useCallback(() => {
    if (!selectedClinicData) return null
    return selectedClinicData.relacionamento || null
  }, [selectedClinicData])

  // Memoizar o objeto value para evitar re-renders desnecessários
  // Apenas valores primitivos e objetos que realmente mudam precisam estar nas dependências
  const value = useMemo(() => ({
    user,
    setUser,
    login,
    logout,
    register,
    refreshUser,
    verifyPhone,
    resendVerificationCode,
    getClinicsByEmail,
    selectedClinicId,
    selectedClinicData,
    setSelectedClinicId,
    isClienteMaster,
    isUsuario,
    getRelacionamento,
    userComumId,
    clearUserComumId,
    planoAcesso,
    loading
  }), [
    user,
    selectedClinicId,
    selectedClinicData,
    userComumId,
    planoAcesso,
    loading,
    verifyPhone,
    resendVerificationCode,
    isClienteMaster,
    isUsuario,
    getRelacionamento,
    clearUserComumId
  ])

  // Tela de carregamento no refresh; com botão de recuperação se travar
  if (loading) {
    return (
      <LoadingFallback onContinue={() => setLoading(false)} />
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

