import { parseCiclo } from './planoCiclo'
import { filterPlanosSaude, resolvePlanoBadge, resolvePlanoFeatured } from './planosSaude'

const parsePrice = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim().replace(',', '.'))
    return isNaN(parsed) ? null : parsed
  }
  return null
}

const formatarTokens = (tokens) => {
  const n = parseInt(tokens) || 0
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} milhão${n > 1000000 ? 's' : ''}`
  if (n >= 1000) return `${(n / 1000).toFixed(0)} mil`
  return String(n)
}

const buildFeatures = (plano, origemSaude) => {
  const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat
  const nome = (plano.nome || '').toLowerCase()
  const features = []

  if (tokenChat && parseInt(tokenChat) > 0) {
    features.push(`${formatarTokens(tokenChat)} de tokens no chat`)
  }

  if (origemSaude || nome.includes('estudante') || nome.includes('chat') || nome.includes('starter') || nome.includes('master')) {
    features.push('Chat por texto, voz e imagem')
    features.push('IA para profissionais e estudantes de saúde')
    features.push('Disponível 24 horas, 7 dias por semana')
    features.push('Acesso mobile')
    features.push('Sem fidelidade — cancele quando quiser')
    return features
  }

  const limite = plano.limiteAnalises || plano.limite_analises
  features.push('Diagnósticos com IA')
  if (limite) features.push(`Até ${limite} análises por mês`)
  features.push('Gestão de pacientes e agenda')
  features.push('Chat IA especializado')
  features.push('Armazenamento na nuvem')
  return features
}

export function mapPlanosCheckout(planosBackend, { origemSaude = false } = {}) {
  if (!Array.isArray(planosBackend)) return []

  const lista = origemSaude ? filterPlanosSaude(planosBackend) : planosBackend

  return lista
    .filter((p) => p.ativo !== false && p.id && p.nome)
    .map((plano) => {
      const valorOriginal = parsePrice(plano.valorOriginal ?? plano.valor_original ?? plano.valor) ?? 0
      const valorPromocional = parsePrice(plano.valorPromocional ?? plano.valor_promocional)
      const pricePromo = valorPromocional > 0 ? valorPromocional : null
      const price = pricePromo ?? valorOriginal
      const oldPrice = pricePromo && valorOriginal > pricePromo ? valorOriginal : null
      const nome = plano.nome || 'Plano'
      const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat

      return {
        id: plano.id,
        name: nome,
        price,
        oldPrice,
        ciclo: parseCiclo(plano),
        patients: plano.descricao || '',
        tokenChat: tokenChat && parseInt(tokenChat) > 0 ? tokenChat : null,
        features: buildFeatures(plano, origemSaude),
        featured: resolvePlanoFeatured(plano),
        badge: resolvePlanoBadge(plano)
      }
    })
    .sort((a, b) => (a.price || 0) - (b.price || 0))
}

export { parsePrice }
