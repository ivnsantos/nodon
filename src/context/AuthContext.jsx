import { createContext, useState, useContext, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedClinicId, setSelectedClinicIdState] = useState(null)
  const [selectedClinicData, setSelectedClinicData] = useState(null)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const savedUser = sessionStorage.getItem('user')
    const savedClinicId = sessionStorage.getItem('selectedClinicId')
    
    if (token && savedUser) {
      // Restaurar usuário do sessionStorage
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
      // Tentar restaurar dados do cliente master também
      const savedClinicData = sessionStorage.getItem('selectedClinicData')
      if (savedClinicData) {
        try {
          setSelectedClinicData(JSON.parse(savedClinicData))
        } catch (error) {
          console.error('Erro ao restaurar dados do cliente master:', error)
        }
      }
    }
    
    setLoading(false)
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

      // Normalizar campo de verificação de email (pode vir como isEmailVerified, emailVerified ou email_verified)
      const normalizedUser = {
        ...userData,
        emailVerified: userData.isEmailVerified || userData.emailVerified || userData.email_verified || false
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
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      setUser(null)
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

  const verifyEmail = async (email, code) => {
    try {
      const response = await api.post('/auth/verify-email', {
        email,
        code
      })

      // A API pode retornar statusCode 200 ou 201 para sucesso
      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        // Atualizar status de verificação do usuário
        const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}')
        if (savedUser) {
          savedUser.emailVerified = true
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
      console.error('Erro ao verificar email:', error)
      console.error('Resposta do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.message || 'Código inválido'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  const resendVerificationCode = async (email) => {
    try {
      const response = await api.post('/auth/resend-verification-code', {
        email
      })

      if (response.data.statusCode === 200) {
        return { success: true }
      }
    } catch (error) {
      console.error('Erro ao reenviar código:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao reenviar código'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  const getClinicsByEmail = async (email) => {
    try {
      const response = await api.get(`/auth/get-client-by-email?email=${encodeURIComponent(email)}`)

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

  const setSelectedClinicId = async (clinicId) => {
    setSelectedClinicIdState(clinicId)
    sessionStorage.setItem('selectedClinicId', clinicId)
    
    // Buscar dados completos do cliente master selecionado usando a rota /complete
    try {
      const response = await api.get(`/clientes-master/${clinicId}/complete`)
      const clinicData = response.data?.data || response.data
      
      if (clinicData) {
        setSelectedClinicData(clinicData)
        sessionStorage.setItem('selectedClinicData', JSON.stringify(clinicData))
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

  const value = {
    user,
    login,
    logout,
    register,
    refreshUser,
    verifyEmail,
    resendVerificationCode,
    getClinicsByEmail,
    selectedClinicId,
    selectedClinicData,
    setSelectedClinicId,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

