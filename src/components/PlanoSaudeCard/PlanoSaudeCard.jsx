import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faChevronDown, faTag } from '@fortawesome/free-solid-svg-icons'
import { getCicloFromPlano } from '../../utils/planoCiclo'
import './PlanoSaudeCard.css'

const arredondarMoeda = (valor) => Math.round((Number(valor) || 0) * 100) / 100

const formatarValor = (valor) => {
  if (valor === null || valor === undefined || isNaN(Number(valor))) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(arredondarMoeda(valor))
}

const formatarTokens = (tokens) => {
  const numTokens = parseInt(tokens, 10) || 0
  if (numTokens >= 1000000) {
    return `${(numTokens / 1000000).toFixed(1)} milhão${numTokens > 1000000 ? 's' : ''}`
  }
  if (numTokens >= 1000) {
    return `${(numTokens / 1000).toFixed(0)} mil`
  }
  return numTokens.toString()
}

const PlanoSaudeCard = ({
  plano,
  index = 0,
  features,
  tagline,
  cupomValido = false,
  cupomData = null,
  cupomLabel = '',
  onSelect,
  defaultExpanded = true,
  ctaLabel = 'Assinar Agora',
  showTokens = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const planoId = plano.id || `plano-${index}`
  const nomePlano = plano.nome || 'Plano'
  const featuresList = features ?? plano.features ?? []
  const taglineText = tagline ?? plano.tagline ?? null
  const tokenChat = plano.tokenChat || plano.token_chat || plano.tokensChat

  const valorOriginal = Number(plano.valorOriginal) || 0
  const valorPromocional =
    plano.valorPromocional !== null && plano.valorPromocional !== undefined
      ? Number(plano.valorPromocional)
      : null

  const temPromocao =
    valorPromocional !== null &&
    !isNaN(valorPromocional) &&
    valorPromocional > 0 &&
    valorOriginal > 0 &&
    valorPromocional < valorOriginal

  const valorBase = temPromocao ? valorPromocional : valorOriginal
  let valorExibir = valorBase
  let temDescontoCupom = false

  if (cupomValido && cupomData && valorBase > 0) {
    const discountPercent = Number(cupomData.discountValue) || 0
    if (discountPercent > 0) {
      valorExibir = arredondarMoeda(valorBase * (1 - discountPercent / 100))
      temDescontoCupom = true
    }
  }

  const cicloInfo = getCicloFromPlano(plano)
  const hasFeatures = featuresList.length > 0

  return (
    <div
      className={`chat-home-plan-card ${plano.featured ? 'featured' : ''} ${expanded ? 'features-open' : ''}`}
    >
      {plano.badge && <div className="chat-home-plan-badge">{plano.badge}</div>}

      <div className="chat-home-plan-header">
        <h3>{nomePlano}</h3>
        {taglineText && <p className="chat-home-plan-tagline">{taglineText}</p>}
        {cupomValido && cupomData && cupomLabel && (
          <div className="chat-home-cupom-badge-plan">
            <FontAwesomeIcon icon={faTag} />
            <span>Cupom {cupomLabel} aplicado</span>
          </div>
        )}
        <div className="chat-home-plan-price">
          {(temPromocao || temDescontoCupom) && valorOriginal > 0 && (
            <span className="chat-home-price-old">
              {formatarValor(valorOriginal)}
              {cicloInfo.periodoCurto}
            </span>
          )}
          {temDescontoCupom && temPromocao && valorPromocional > 0 && (
            <span className="chat-home-price-old">
              {formatarValor(valorPromocional)}
              {cicloInfo.periodoCurto}
            </span>
          )}
          {temDescontoCupom && !temPromocao && valorOriginal > 0 && (
            <span className="chat-home-price-old">
              {formatarValor(valorOriginal)}
              {cicloInfo.periodoCurto}
            </span>
          )}
          <span className="chat-home-price-current">
            {formatarValor(valorExibir)}
            {cicloInfo.periodoCurto}
          </span>
        </div>
        {showTokens && tokenChat && parseInt(tokenChat, 10) > 0 && (
          <p className="chat-home-plan-tokens">{formatarTokens(tokenChat)} de tokens</p>
        )}
      </div>

      {hasFeatures && (
        <>
          <button
            type="button"
            className="chat-home-plan-toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Ocultar recursos' : 'Ver recursos'}
            <FontAwesomeIcon icon={faChevronDown} className={expanded ? 'expanded' : ''} />
          </button>
          {expanded && (
            <ul className="chat-home-plan-features">
              {featuresList.map((feature, idx) => (
                <li key={idx}>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <button
        type="button"
        className={`chat-home-plan-btn ${plano.featured ? 'featured' : ''}`}
        onClick={() => onSelect?.(nomePlano, planoId)}
      >
        {ctaLabel}
      </button>
      <p className="chat-home-plan-note">{cicloInfo.notaPlano}</p>
    </div>
  )
}

export default PlanoSaudeCard
