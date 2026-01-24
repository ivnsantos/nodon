import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faTimesCircle, 
  faInfoCircle,
  faTimes 
} from '@fortawesome/free-solid-svg-icons'
import './AlertModal.css'

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' // 'success', 'error', 'warning', 'info'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle
      case 'error':
        return faTimesCircle
      case 'warning':
        return faExclamationTriangle
      default:
        return faInfoCircle
    }
  }

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'success':
        return 'Sucesso'
      case 'error':
        return 'Erro'
      case 'warning':
        return 'Atenção'
      default:
        return 'Aviso'
    }
  }

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className={`alert-modal-container alert-modal-${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="alert-modal-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <div className="alert-modal-icon">
          <FontAwesomeIcon icon={getIcon()} />
        </div>
        
        <h3 className="alert-modal-title">{getTitle()}</h3>
        
        <p className="alert-modal-message">{message}</p>
        
        <button className="alert-modal-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}

export default AlertModal
