import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUp, faHeartbeat } from '@fortawesome/free-solid-svg-icons'
import './ChatPromptStarter.css'

const PENDING_MESSAGE_KEY = 'nodon_pending_chat_message'

export function savePendingChatMessage(message) {
  const trimmed = message?.trim()
  if (trimmed) {
    sessionStorage.setItem(PENDING_MESSAGE_KEY, trimmed)
  }
}

export function consumePendingChatMessage() {
  const message = sessionStorage.getItem(PENDING_MESSAGE_KEY)
  if (message) {
    sessionStorage.removeItem(PENDING_MESSAGE_KEY)
  }
  return message || ''
}

export default function ChatPromptStarter({
  badge,
  badgeIcon = faHeartbeat,
  title,
  subtitle,
  capabilities = [],
  areas = [],
  placeholder = 'Pergunte qualquer coisa sobre saúde...',
  suggestions = [],
  onSubmit,
  loginPath = '/login',
  onBeforeSubmit,
  onBeforeLogin,
  className = '',
  variant = 'elite',
  footerLink
}) {
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const hasText = input.trim().length > 0
  const beforeSubmit = onBeforeSubmit || onBeforeLogin

  const handleAction = (message) => {
    savePendingChatMessage(message)
    beforeSubmit?.(message)

    if (onSubmit) {
      onSubmit(message)
      return
    }

    navigate(loginPath)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleAction(input)
  }

  const canSend = Boolean(onSubmit) || hasText

  return (
    <div className={`chat-prompt-starter chat-prompt-starter--${variant} ${className}`.trim()}>
      <div className="chat-prompt-starter__intro">
        {badge ? (
          <div className="chat-prompt-starter__badge">
            <FontAwesomeIcon icon={badgeIcon} />
            <span>{badge}</span>
          </div>
        ) : null}

        {title ? <h1 className="chat-prompt-starter__title">{title}</h1> : null}
        {subtitle ? <p className="chat-prompt-starter__subtitle">{subtitle}</p> : null}

        {capabilities.length > 0 ? (
          <div className="chat-prompt-starter__capabilities">
            {capabilities.map((item) => (
              <span key={item} className="chat-prompt-starter__capability">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        {areas.length > 0 ? (
          <p className="chat-prompt-starter__areas">
            {areas.map((area, index) => (
              <span key={area}>
                {index > 0 ? ' · ' : null}
                {area}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      <form className="chat-prompt-starter__form" onSubmit={handleSubmit}>
        <div className="chat-prompt-starter__box">
          <textarea
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (canSend) {
                  handleAction(input)
                }
              }
            }}
            placeholder={placeholder}
            className="chat-prompt-starter__input"
            aria-label="Digite sua mensagem para a NODON"
          />
          <button
            type="submit"
            className="chat-prompt-starter__send"
            aria-label="Enviar mensagem"
            disabled={!canSend}
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
        </div>
      </form>

      {suggestions.length > 0 ? (
        <div className="chat-prompt-starter__suggestions" role="list">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chat-prompt-starter__suggestion"
              onClick={() => handleAction(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      {footerLink ? (
        <div className="chat-prompt-starter__footer">{footerLink}</div>
      ) : null}
    </div>
  )
}
