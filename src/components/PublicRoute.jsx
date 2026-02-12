import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>Carregando...</div>
  }

  const pathname = location.pathname
  const allowedPathsWhenLoggedIn = ['/verify-email', '/select-clinic', '/assinatura-pendente', '/usuario-inativo', '/checkout']

  // Se o usuário estiver logado, redirecionar apenas de login/register para /app
  // Mas permitir acesso a verify-email mesmo logado (pode estar verificando email)
  if (user) {
    // Se estiver em uma rota que precisa ser acessível mesmo logado, permitir acesso
    if (allowedPathsWhenLoggedIn.includes(pathname)) {
      return children
    }
    
    // Apenas redirecionar de login/register se já estiver logado
    if (pathname === '/login' || pathname === '/register') {
      return <Navigate to="/app" replace />
    }
  }

  return children
}

export default PublicRoute

