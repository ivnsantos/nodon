import { useContext } from 'react'
import { AuthContext } from './AuthContextRef'

/**
 * Hook de autenticação. Em arquivo separado para que o Fast Refresh
 * do Vite funcione no AuthContext.jsx (que exporta apenas AuthProvider).
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
