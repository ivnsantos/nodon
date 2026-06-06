import { useRef, useState, useEffect, Children } from 'react'
import './PlanosSaudeCarousel.css'

const PlanosSaudeCarousel = ({
  children,
  className = '',
  trackClassName = 'chat-home-plans-grid',
  trackRole = 'list',
  trackAriaLabel = 'Planos disponíveis',
  hintText = 'Deslize para ver os planos →'
}) => {
  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const items = Children.toArray(children).filter(Boolean)
  const count = items.length

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    track.scrollLeft = 0

    if (count <= 1) return

    const updateIndex = () => {
      const cards = Array.from(track.children)
      if (!cards.length) return

      const scrollLeft = track.scrollLeft
      let closest = 0
      let minDist = Infinity

      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - scrollLeft)
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      })

      setActiveIndex(closest)
    }

    updateIndex()
    track.addEventListener('scroll', updateIndex, { passive: true })
    window.addEventListener('resize', updateIndex)

    return () => {
      track.removeEventListener('scroll', updateIndex)
      window.removeEventListener('resize', updateIndex)
    }
  }, [count])

  const scrollTo = (index) => {
    const track = trackRef.current
    const card = track?.children[index]
    if (track && card) {
      track.scrollTo({ left: Math.max(0, card.offsetLeft), behavior: 'smooth' })
    }
  }

  return (
    <div className={`planos-saude-carousel ${className}`.trim()}>
      <div
        ref={trackRef}
        className={`${trackClassName} planos-saude-carousel__track`.trim()}
        role={trackRole}
        aria-label={trackAriaLabel}
      >
        {items}
      </div>

      {count > 1 && (
        <div className="planos-saude-carousel__footer">
          <p className="planos-saude-carousel__hint">{hintText}</p>
          <div className="planos-saude-carousel__dots" role="tablist" aria-label="Navegação entre planos">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={activeIndex === index}
                aria-label={`Plano ${index + 1} de ${count}`}
                className={`planos-saude-carousel__dot ${activeIndex === index ? 'active' : ''}`}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanosSaudeCarousel
