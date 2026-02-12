import { Navigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const authContext = useContext(AuthContext)
  
  if (!authContext) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: '#ffffff',
      background: '#0a0e27'
    }}>Carregando...</div>
  }
  
  const { user, loading, selectedClinicId, selectedClinicData } = authContext

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

  const pathname = location.pathname
  const phoneVerified = user.phoneVerified || user.emailVerified || false
  const allowedPathsWithoutVerification = ['/verify-email', '/select-clinic', '/assinatura-pendente', '/usuario-inativo']
  
  // 1. PRIMEIRO: Verificar se o telefone está validado
  if (!allowedPathsWithoutVerification.includes(pathname) && !phoneVerified) {
    const telefone = user.telefone || user.phone || user.telefoneCelular || ''
    if (telefone) {
      return <Navigate to={`/verify-email?telefone=${encodeURIComponent(telefone)}`} replace />
    } else {
      return <Navigate to="/verify-email" replace />
    }
  }

  // 3. TERCEIRO: Verificar se precisa selecionar consultório
  const needsClinicSelection = phoneVerified && !selectedClinicId && pathname !== '/verify-email' && pathname !== '/select-clinic' && pathname !== '/assinatura-pendente'
  
  if (needsClinicSelection && pathname.startsWith('/app')) {
    return <Navigate to="/select-clinic" replace />
  }

  // 4. QUARTO: Verificar se o relacionamento está inativo (para usuários comuns)
  if (selectedClinicId && selectedClinicData && pathname !== '/usuario-inativo' && pathname !== '/select-clinic') {
    const relacionamento = selectedClinicData.relacionamento
    if (relacionamento?.status === 'inativo') {
      const allowedPaths = ['/verify-email', '/select-clinic', '/usuario-inativo']
      if (!allowedPaths.includes(pathname)) {
        return <Navigate to="/usuario-inativo" replace />
      }
    }
  }

  // 5. QUINTO: Verificar assinatura pendente (após selecionar consultório)
  if (selectedClinicId && selectedClinicData && pathname !== '/assinatura-pendente' && pathname !== '/select-clinic' && pathname !== '/usuario-inativo') {
    const clienteMaster = selectedClinicData.clienteMaster || selectedClinicData
    const assinatura = selectedClinicData.assinatura
    
    const clienteMasterInativo = clienteMaster?.ativo === false || clienteMaster?.status === 'INACTIVE'
    const assinaturaInativa = assinatura?.status !== 'ACTIVE'
    
    if (clienteMasterInativo || assinaturaInativa) {
      const allowedPaths = ['/verify-email', '/select-clinic', '/assinatura-pendente', '/add-clinic', '/usuario-inativo']
      if (!allowedPaths.includes(pathname)) {
        return <Navigate to="/assinatura-pendente" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute

