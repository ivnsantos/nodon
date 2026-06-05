import { parseCiclo } from './planoCiclo'

/** IDs legados dos planos de chat/saúde */
export const PLANOS_SAUDE_IDS = [
  '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7',
  '1503826a-ee30-4fa9-9955-c77d11fe44ed'
]

const SAUDE_KEYWORDS = [
  'estudante',
  'chat',
  'saúde',
  'saude',
  'starter',
  'master',
  'trimestral'
]

const IDEAL_ESTUDANTES_RE = /ideal\s*(para\s*)?estudantes?/i

const isPlanoGestaoClinica = (plano) => {
  const nome = (plano.nome || '').toLowerCase()
  const acesso = (plano.acesso || '').toLowerCase()
  const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat
  const hasTokens = tokenChat && parseInt(tokenChat, 10) > 0

  if (hasTokens) return false
  if (acesso === 'chat' || acesso === 'saude' || acesso === 'estudante') return false

  const gestaoKeywords = ['inicial', 'profissional', 'premium', 'clínica', 'clinica', 'gestão', 'gestao']
  const limiteAnalises = plano.limiteAnalises || plano.limite_analises

  return gestaoKeywords.some((k) => nome.includes(k)) || Boolean(limiteAnalises)
}

export function isPlanoTrimestral(plano) {
  if (!plano) return false
  const nome = (plano.nome || '').toLowerCase()
  return parseCiclo(plano) === 3 || nome.includes('trimestral')
}

export function sanitizeBadge(badge) {
  if (!badge || typeof badge !== 'string') return null
  if (IDEAL_ESTUDANTES_RE.test(badge)) return null
  return badge
}

/** Badge exibida: "Mais vendido" apenas no plano trimestral */
export function resolvePlanoBadge(plano) {
  const fromApi = sanitizeBadge(plano?.badge || plano?.label)
  if (fromApi && !/mais\s*vendido/i.test(fromApi)) return fromApi
  if (isPlanoTrimestral(plano)) return 'Mais vendido'
  return null
}

export function resolvePlanoFeatured(plano) {
  if (plano?.featured || plano?.destaque) return true
  return isPlanoTrimestral(plano)
}

/** Plano de chat/IA para área da saúde (não gestão de clínica) */
export function isPlanoSaudeChat(plano) {
  if (!plano || plano.ativo === false) return false

  const nome = (plano.nome || '').toLowerCase()
  const acesso = (plano.acesso || '').toLowerCase()

  if (PLANOS_SAUDE_IDS.includes(plano.id)) return true
  if (acesso === 'chat' || acesso === 'saude' || acesso === 'estudante') return true
  if (SAUDE_KEYWORDS.some((k) => nome.includes(k))) return true

  const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat
  if (tokenChat && parseInt(tokenChat, 10) > 0 && !isPlanoGestaoClinica(plano)) return true

  if (parseCiclo(plano) === 3 && tokenChat && parseInt(tokenChat, 10) > 0) return true

  return false
}

export function filterPlanosSaude(planos) {
  const lista = Array.isArray(planos) ? planos : []
  const filtrados = lista.filter(isPlanoSaudeChat)
  return filtrados.length > 0 ? filtrados : lista.filter((p) => p.ativo !== false)
}

/** Planos de chat/saúde que não devem aparecer nas LPs de dentista/clínica */
export function isPlanoChatExcluirDentista(plano) {
  const nome = (plano.nome || '').toLowerCase()
  const acesso = (plano.acesso || '').toLowerCase()

  return (
    PLANOS_SAUDE_IDS.includes(plano.id) ||
    acesso === 'chat' ||
    acesso === 'saude' ||
    acesso === 'estudante' ||
    nome.includes('estudante') ||
    nome.includes('chat') ||
    nome.includes('starter') ||
    nome.includes('master') ||
    nome.includes('trimestral')
  )
}

export function isPlanoMaster(plano) {
  const nome = (plano?.nome || '').toLowerCase()
  return (
    plano?.id === '1503826a-ee30-4fa9-9955-c77d11fe44ed' ||
    nome.includes('pro') ||
    nome.includes('master')
  )
}

export function isPlanoStarter(plano) {
  const nome = (plano?.nome || '').toLowerCase()
  return (
    plano?.id === '3aa6ec3e-be03-41f4-a0e6-46b52e4f1da7' ||
    nome.includes('starter') ||
    (nome.includes('estudante') && !nome.includes('pro') && !nome.includes('master'))
  )
}

export function getPlanoPrecoExibicao(plano) {
  const promocional = plano?.valorPromocional ?? plano?.valor_promocional
  if (promocional > 0) return Number(promocional)
  if (plano?.price > 0) return Number(plano.price)
  return Number(plano?.valorOriginal ?? plano?.valor_original ?? plano?.price ?? 0) || 0
}

export function sortPlanosPorPreco(planos, { descendente = true } = {}) {
  return [...planos].sort((a, b) => {
    const va = getPlanoPrecoExibicao(a)
    const vb = getPlanoPrecoExibicao(b)
    return descendente ? vb - va : va - vb
  })
}
