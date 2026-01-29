import axios from 'axios'

// Configurar base URL usando variável de ambiente
// Vite requer que variáveis de ambiente comecem com VITE_
let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Garantir que o baseURL sempre termine com /api
if (!baseURL.endsWith('/api')) {
  // Se não terminar com /api, adicionar
  baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`
}

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token automaticamente e userComumId ou clienteMasterId
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Verificar se o header X-Cliente-Master-Id foi passado explicitamente na requisição
    // O axios pode normalizar os headers, então verificamos de forma case-insensitive
    const hasExplicitClienteMasterId = config.headers && (
      config.headers['X-Cliente-Master-Id'] !== undefined || 
      config.headers['x-cliente-master-id'] !== undefined ||
      config.headers['X-CLIENTE-MASTER-ID'] !== undefined
    )
    
    // Se o header foi passado explicitamente, preservar seu valor
    const explicitClienteMasterIdValue = hasExplicitClienteMasterId ? 
      (config.headers['X-Cliente-Master-Id'] || config.headers['x-cliente-master-id'] || config.headers['X-CLIENTE-MASTER-ID']) : 
      null
    
    // Adicionar headers apropriados apenas em rotas dentro de /app para segurança
    if (window.location.pathname.startsWith('/app')) {
      // Verificar se existe relacionamento no sessionStorage
      const relacionamentoStr = sessionStorage.getItem('relacionamento')
      const selectedClinicId = sessionStorage.getItem('selectedClinicId')
      
      if (relacionamentoStr) {
        try {
          const relacionamento = JSON.parse(relacionamentoStr)
          
          // Se o relacionamento for do tipo "clienteMaster", usar X-Cliente-Master-Id
          if (relacionamento.tipo === 'clienteMaster' && relacionamento.id) {
            config.headers['X-Cliente-Master-Id'] = relacionamento.id
            // Remover X-User-Comum-Id se existir
            delete config.headers['X-User-Comum-Id']
          } else if (relacionamento.tipo === 'usuario' && relacionamento.id) {
            // Se for do tipo "usuario", usar X-User-Comum-Id
            config.headers['X-User-Comum-Id'] = relacionamento.id
            // Remover X-Cliente-Master-Id apenas se não foi passado explicitamente
            if (!hasExplicitClienteMasterId) {
              delete config.headers['X-Cliente-Master-Id']
            }
          } else {
            // Se não tiver tipo válido, usar X-Cliente-Master-Id com selectedClinicId como fallback
            if (selectedClinicId && !hasExplicitClienteMasterId) {
              config.headers['X-Cliente-Master-Id'] = selectedClinicId
            }
            delete config.headers['X-User-Comum-Id']
          }
        } catch (error) {
          // Se houver erro ao parsear, usar X-Cliente-Master-Id como fallback
          if (selectedClinicId && !hasExplicitClienteMasterId) {
            config.headers['X-Cliente-Master-Id'] = selectedClinicId
          }
          delete config.headers['X-User-Comum-Id']
        }
      } else {
        // Se não houver relacionamento, usar X-Cliente-Master-Id com selectedClinicId
        if (selectedClinicId && !hasExplicitClienteMasterId) {
          config.headers['X-Cliente-Master-Id'] = selectedClinicId
        }
        delete config.headers['X-User-Comum-Id']
      }
    } else {
      // Se não estiver dentro de /app, manter X-Cliente-Master-Id se foi passado explicitamente
      // (ex: na chamada /complete que acontece antes de entrar em /app)
      if (hasExplicitClienteMasterId && explicitClienteMasterIdValue) {
        config.headers['X-Cliente-Master-Id'] = explicitClienteMasterIdValue
      } else {
        // Remover apenas se não foi passado explicitamente
        delete config.headers['X-Cliente-Master-Id']
      }
      delete config.headers['X-User-Comum-Id']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Não redirecionar se já estiver na página de login
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

