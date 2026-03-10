import axios from 'axios'

// Configurar base URL usando variável de ambiente
// Vite requer que variáveis de ambiente comecem com VITE_
let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'



const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token automaticamente e userComumId ou clienteMasterId
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
      // Verificar se é plano estudante
      const planoAcesso = localStorage.getItem('planoAcesso')
      const userStr = localStorage.getItem('user')
      const relacionamentoStr = localStorage.getItem('relacionamento')
      const selectedClinicId = localStorage.getItem('selectedClinicId')
      
      // Se for plano estudante (planoAcesso = 'chat'), usar o ID do usuário como cliente master
      if (planoAcesso === 'chat' && userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.id) {
            config.headers['X-Cliente-Master-Id'] = user.id
            delete config.headers['X-User-Comum-Id']
          }
        } catch (error) {
          // Ignorar erro de parse
        }
      } else if (relacionamentoStr) {
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
            // SEMPRE remover X-Cliente-Master-Id para usuários comuns
            delete config.headers['X-Cliente-Master-Id']
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

// Evitar múltiplos redirects ao mesmo tempo (várias requisições 401)
let redirectingToLogin = false
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      
      // Rotas públicas que não devem redirecionar para login
      const publicPaths = [
        '/login',
        '/register',
        '/profissional',
        '/lp/',
        '/agendamento-publico',
        '/responder-anamnese',
        '/responder-questionario',
        '/verify-email',
        '/forgot-password',
        '/reset-password'
      ]
      
      // Verificar se a rota atual é pública
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path))
      
      if (!isPublicPath && currentPath !== '/login' && currentPath !== '/register' && !redirectingToLogin) {
        redirectingToLogin = true
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('selectedClinicId')
        localStorage.removeItem('selectedClinicData')
        localStorage.removeItem('relacionamento')
        localStorage.removeItem('userComumId')
        localStorage.removeItem('planoAcesso')
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api

