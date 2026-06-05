import { isPlanoMaster, isPlanoStarter, isPlanoTrimestral } from './planosSaude'

export const PLANO_SAUDE_STARTER_TAGLINE = 'Tire suas duvidas'

export const PLANO_SAUDE_MASTER_TAGLINE =
  'Acompanhamento mais completo e respostas mais precisas'

export const PLANO_SAUDE_STARTER_FEATURES = [
  'Interpretação de exames e sintomas',
  'Orientações práticas para o dia a dia',
  'Ideal para consultas ocasionais e estudos',
  'Mande perguntas sobre saúde e odontologia',
  'Tire dúvidas sobre diagnósticos e tratamentos',
  'Acesso mobile',
  'Sem fidelidade - cancele quando quiser',
  'Até 300 mil tokens por mês'
]

export const PLANO_SAUDE_MASTER_FEATURES = [
  'Respostas muito mais rápidas',
  'Conversas mais longas sem interrupções',
  'Pergunte qualquer coisa',
  'Análises detalhadas de exames e sintomas',
  'Histórico amplo para acompanhar sua evolução',
  'Ideal para quem gosta de interagir rapido',
  'Tire dúvidas sobre diagnósticos e tratamentos',
  'Suporte para técnicas de saúde',
  'Acesso mobile',
  'Sem fidelidade - cancele quando quiser',
  'Até 1 MILHÃO de tokens'
]

export function isPlanoMasterOuTrimestral(plano) {
  if (!plano) return false
  if (isPlanoMaster(plano)) return true
  const nome = (plano.nome || '').toLowerCase()
  return isPlanoTrimestral(plano) && nome.includes('master')
}

export function getPlanoSaudeTagline(plano) {
  if (isPlanoMasterOuTrimestral(plano)) return PLANO_SAUDE_MASTER_TAGLINE
  if (isPlanoStarter(plano)) return PLANO_SAUDE_STARTER_TAGLINE
  return null
}

export function buildPlanoSaudeFeatures(plano) {
  if (isPlanoMasterOuTrimestral(plano)) return [...PLANO_SAUDE_MASTER_FEATURES]
  if (isPlanoStarter(plano)) return [...PLANO_SAUDE_STARTER_FEATURES]
  return null
}

export function hasPlanoSaudeMarketing(plano) {
  return Boolean(getPlanoSaudeTagline(plano))
}
