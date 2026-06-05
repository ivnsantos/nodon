import { NODON_LOGO_DARK_BG } from '../../utils/nodonLogos'
import './NodonLoading.css'

const SIZES = {
  sm: 48,
  md: 72,
  lg: 96
}

function NodonLoading({ text = 'Carregando...', fullScreen = false, size = 'md', className = '' }) {
  const iconSize = SIZES[size] || SIZES.md

  const content = (
    <div className={`nodon-loading nodon-loading--${size} ${className}`.trim()} role="status" aria-live="polite" aria-busy="true">
      <img
        src={NODON_LOGO_DARK_BG}
        alt="NODON"
        className="nodon-loading__icon"
        width={iconSize}
        height={iconSize}
        draggable={false}
      />
      {text ? <p className="nodon-loading__text">{text}</p> : null}
    </div>
  )

  if (fullScreen) {
    return <div className="nodon-loading-overlay">{content}</div>
  }

  return content
}

export function NodonSpinner({ size = 48, className = '' }) {
  return (
    <img
      src={NODON_LOGO_DARK_BG}
      alt=""
      role="presentation"
      aria-hidden="true"
      className={`nodon-loading__icon nodon-spinner ${className}`.trim()}
      width={size}
      height={size}
      draggable={false}
    />
  )
}

export default NodonLoading
