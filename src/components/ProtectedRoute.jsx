import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: '#ffffff',
      background: '#0a0e27'
    }}>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Verificar se a assinatura está pendente apenas se não estiver na página de assinatura pendente
  if (location.pathname !== '/assinatura-pendente') {
    // Se for master e tiver assinatura pendente, redirecionar
    if (user.tipo === 'master' && user.assinatura?.status === 'PENDING') {
      return <Navigate to="/assinatura-pendente" replace />
    }

    // Se for usuário comum e o cliente master tiver assinatura pendente
    if (user.tipo === 'usuario' && (!user.assinatura || user.assinatura?.status === 'PENDING')) {
      return <Navigate to="/assinatura-pendente" replace />
    }
  }

  return children
}

export default ProtectedRoute

