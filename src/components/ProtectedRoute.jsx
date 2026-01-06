import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading, selectedClinicId, selectedClinicData } = useAuth()
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

  // 1. PRIMEIRO: Verificar se o email está validado
  const emailVerified = user.emailVerified || false
  const allowedPathsWithoutVerification = ['/verify-email', '/complete-master-data', '/select-clinic', '/assinatura-pendente']
  
  if (!allowedPathsWithoutVerification.includes(location.pathname) && !emailVerified) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />
  }

  // 2. SEGUNDO: Se email verificado e for master, verificar se precisa completar dados
  // (A verificação se já completou os dados será feita pela API ou pode ser adicionada aqui)
  // Por enquanto, permitir acesso a complete-master-data e select-clinic após email verificado

  // 3. TERCEIRO: Verificar se precisa selecionar consultório (após completar dados se for master)
  const needsClinicSelection = emailVerified && !selectedClinicId && location.pathname !== '/verify-email' && location.pathname !== '/complete-master-data' && location.pathname !== '/select-clinic' && location.pathname !== '/assinatura-pendente'
  
  if (needsClinicSelection && location.pathname.startsWith('/app')) {
    return <Navigate to="/select-clinic" replace />
  }

  // 4. QUARTO: Verificar assinatura pendente (após selecionar consultório)
  // Verificar se o cliente master ou assinatura não estão ativos
  if (selectedClinicId && selectedClinicData && location.pathname !== '/assinatura-pendente' && location.pathname !== '/select-clinic') {
    // A estrutura pode ser: { clienteMaster: {...}, assinatura: {...} } ou diretamente os dados
    const clienteMaster = selectedClinicData.clienteMaster || selectedClinicData
    const assinatura = selectedClinicData.assinatura
    
    // Verificar se cliente master está inativo
    const clienteMasterInativo = 
      clienteMaster?.ativo === false || 
      clienteMaster?.status === 'INACTIVE'
    
    // Verificar se assinatura não está ativa
    const assinaturaStatus = assinatura?.status
    const assinaturaInativa = assinaturaStatus !== 'ACTIVE'
    
    // Se cliente master inativo OU assinatura não ativa, redirecionar para assinatura pendente
    if (clienteMasterInativo || assinaturaInativa) {
      // Não redirecionar se já estiver em rotas permitidas
      const allowedPaths = ['/verify-email', '/complete-master-data', '/select-clinic', '/assinatura-pendente', '/add-clinic']
      if (!allowedPaths.includes(location.pathname)) {
        return <Navigate to="/assinatura-pendente" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute

