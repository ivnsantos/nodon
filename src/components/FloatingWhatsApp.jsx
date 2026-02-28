import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import './FloatingWhatsApp.css'

const DEFAULT_PHONE = '5511932589622'
const DEFAULT_MESSAGE = 'Olá! Gostaria de falar com um especialista da NODON.'

const FloatingWhatsApp = ({ phoneNumber = DEFAULT_PHONE, message = DEFAULT_MESSAGE }) => {
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp"
      aria-label="Fale conosco no WhatsApp"
      title="Fale conosco no WhatsApp"
    >
      <FontAwesomeIcon icon={faWhatsapp} />
    </a>
  )
}

export default FloatingWhatsApp
