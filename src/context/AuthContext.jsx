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

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const savedUser = sessionStorage.getItem('user')
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
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      })

      const { access_token, user: userData } = response.data

      // Salvar token e usuário no sessionStorage (mais seguro que localStorage)
      sessionStorage.setItem('token', access_token)
      sessionStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      return { 
        success: true,
        user: userData
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      const errorMessage = error.response?.data?.message || 'Credenciais inválidas'
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

      const { access_token, user: newUser } = response.data

      // Salvar token e usuário no sessionStorage (mais seguro que localStorage)
      sessionStorage.setItem('token', access_token)
      sessionStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)

      return { 
        success: true,
        user: newUser
      }
    } catch (error) {
      console.error('Erro ao registrar:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao criar conta'
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

  const value = {
    user,
    login,
    logout,
    register,
    refreshUser,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

