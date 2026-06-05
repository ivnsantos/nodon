/** Meses por ciclo de cobrança (API: ciclo = quantidade de meses) */
export function parseCiclo(plano) {
  if (!plano) return 1
  const raw = plano.ciclo ?? plano.cicloCobranca ?? plano.ciclo_cobranca ?? 1
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export function getCicloCobranca(ciclo) {
  const meses = parseInt(ciclo, 10) || 1

  if (meses === 3) {
    return {
      meses: 3,
      periodoCurto: '/trimestre',
      periodoComDe: 'por trimestre',
      periodoLabel: 'trimestral',
      notaRecorrente: 'Cobrança trimestral recorrente. Cancele quando quiser.',
      notaPlano: '*Plano trimestral. Cobrança recorrente a cada 3 meses.',
      resumoTotal: 'Total / trimestre'
    }
  }

  if (meses === 12) {
    return {
      meses: 12,
      periodoCurto: '/ano',
      periodoComDe: 'por ano',
      periodoLabel: 'anual',
      notaRecorrente: 'Cobrança anual recorrente. Cancele quando quiser.',
      notaPlano: '*Plano anual. Cobrança recorrente a cada 12 meses.',
      resumoTotal: 'Total / ano'
    }
  }

  return {
    meses: 1,
    periodoCurto: '/mês',
    periodoComDe: 'por mês',
    periodoLabel: 'mensal',
    notaRecorrente: 'Cobrança mensal recorrente. Cancele quando quiser.',
    notaPlano: '*Plano mensal com renovação automática.',
    resumoTotal: 'Total / mês'
  }
}

export function getCicloFromPlano(plano) {
  return getCicloCobranca(parseCiclo(plano))
}
