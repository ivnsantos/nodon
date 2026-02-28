import { createContext } from 'react'

/**
 * Contexto de autenticação. Definido em arquivo separado para que o Vite Fast Refresh
 * não invalide o módulo AuthContext.jsx (que exporta apenas AuthProvider).
 * Ver: https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports
 */
export const AuthContext = createContext()
