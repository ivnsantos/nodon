import { Navigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContextRef'

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
  const phoneVerified = user.isEmailVerified || user.phoneVerified || user.emailVerified || false
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

  // 2. SEGUNDO: Verificar se assinatura é null (usuário sem assinatura ativa)
  // Bloquear TODAS as rotas exceto /assinatura-pendente
  if (phoneVerified && user.assinatura === null && pathname !== '/assinatura-pendente') {
    return <Navigate to="/assinatura-pendente" replace />
  }

  // 3. TERCEIRO: Verificar se precisa selecionar consultório
  // EXCEÇÃO: Usuários com plano estudante vão direto para /app/chat
  const PLANOS_ESTUDANTE = [
    '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7', // Plano Estudante
    '1503826a-ee30-4fa9-9955-c77d11fe44ed'  // Plano Estudante PRO
  ]
  const isPlanoEstudante = PLANOS_ESTUDANTE.includes(user?.assinatura?.planoId) || 
                           PLANOS_ESTUDANTE.includes(user?.planoId) ||
                           PLANOS_ESTUDANTE.includes(user?.assinatura?.plano?.id)
  
  // Se for plano estudante e estiver em /select-clinic, redirecionar para /app/chat
  if (isPlanoEstudante && phoneVerified && pathname === '/select-clinic') {
    return <Navigate to="/app/chat" replace />
  }
  
  // Se for plano estudante e estiver em /app (sem rota específica), redirecionar para /app/chat
  if (isPlanoEstudante && phoneVerified && pathname === '/app') {
    return <Navigate to="/app/chat" replace />
  }
  
  // Plano estudante não precisa de consultório, então pular toda a verificação
  if (!isPlanoEstudante) {
    const needsClinicSelection = phoneVerified && !selectedClinicId && pathname !== '/verify-email' && pathname !== '/select-clinic' && pathname !== '/assinatura-pendente'
    
    if (needsClinicSelection && pathname.startsWith('/app')) {
      return <Navigate to="/select-clinic" replace />
    }
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
  // EXCEÇÃO: Usuários com plano estudante não precisam de consultório, então não verificar assinatura de consultório
  if (selectedClinicId && selectedClinicData && pathname !== '/assinatura-pendente' && pathname !== '/select-clinic' && pathname !== '/usuario-inativo' && !isPlanoEstudante) {
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

