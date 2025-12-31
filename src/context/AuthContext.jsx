import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

// Dados mockados de usuários
const mockUsers = [
  {
    id: 1,
    nome: 'Dr. João Silva',
    email: 'admin@nodon.com',
    password: 'admin123',
    tipo: 'admin'
  },
  {
    id: 2,
    nome: 'Dra. Maria Santos',
    email: 'dentista@nodon.com',
    password: 'dentista123',
    tipo: 'dentista'
  }
]

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      // Restaurar usuário do localStorage
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Buscar usuário mockado
    const foundUser = mockUsers.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        nome: foundUser.nome,
        email: foundUser.email,
        tipo: foundUser.tipo
      }
      const token = `mock_token_${Date.now()}`
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } else {
      return { 
        success: false, 
        message: 'Email ou senha incorretos' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const register = async (userData) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Criar novo usuário mockado
    const newUser = {
      id: mockUsers.length + 1,
      nome: userData.nome,
      email: userData.email,
      password: userData.password,
      tipo: 'dentista'
    }
    
    mockUsers.push(newUser)
    
    const userResponse = {
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.email,
      tipo: newUser.tipo
    }
    
    const token = `mock_token_${Date.now()}`
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userResponse))
    setUser(userResponse)
    return { success: true }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

