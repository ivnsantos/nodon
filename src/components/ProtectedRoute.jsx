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
  const allowedPathsWithoutVerification = ['/verify-email', '/select-clinic', '/assinatura-pendente', '/usuario-inativo']
  
  if (!allowedPathsWithoutVerification.includes(location.pathname) && !emailVerified) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />
  }

  // 2. SEGUNDO: Se email verificado e for master, verificar se precisa completar dados
  // (A verificação se já completou os dados será feita pela API ou pode ser adicionada aqui)
  // Por enquanto, permitir acesso a complete-master-data e select-clinic após email verificado

  // 3. TERCEIRO: Verificar se precisa selecionar consultório
  const needsClinicSelection = emailVerified && !selectedClinicId && location.pathname !== '/verify-email' && location.pathname !== '/select-clinic' && location.pathname !== '/assinatura-pendente'
  
  if (needsClinicSelection && location.pathname.startsWith('/app')) {
    return <Navigate to="/select-clinic" replace />
  }

  // 4. QUARTO: Verificar se o relacionamento está inativo (para usuários comuns)
  if (selectedClinicId && selectedClinicData && location.pathname !== '/usuario-inativo' && location.pathname !== '/select-clinic') {
    const relacionamento = selectedClinicData.relacionamento
    
    // Se o relacionamento tiver status "inativo", redirecionar para página de usuário inativo
    if (relacionamento?.status === 'inativo') {
      const allowedPaths = ['/verify-email', '/select-clinic', '/usuario-inativo']
      if (!allowedPaths.includes(location.pathname)) {
        return <Navigate to="/usuario-inativo" replace />
      }
    }
  }

  // 5. QUINTO: Verificar assinatura pendente (após selecionar consultório)
  // Verificar se o cliente master ou assinatura não estão ativos
  if (selectedClinicId && selectedClinicData && location.pathname !== '/assinatura-pendente' && location.pathname !== '/select-clinic' && location.pathname !== '/usuario-inativo') {
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
      const allowedPaths = ['/verify-email', '/select-clinic', '/assinatura-pendente', '/add-clinic', '/usuario-inativo']
      if (!allowedPaths.includes(location.pathname)) {
        return <Navigate to="/assinatura-pendente" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute

