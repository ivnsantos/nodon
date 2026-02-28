import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHistory, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { useChatHeader } from '../context/ChatHeaderContext'
import nodoLogo from '../img/nodo.png'
import '../pages/Chat.css'

const ChatHeader = ({ onHistoryToggle }) => {
  const chatHeaderContext = useChatHeader()
  const { chatHeaderContent } = chatHeaderContext || {}

  // Se não houver conteúdo, ainda renderizar o header básico
  if (!chatHeaderContent) {
    return (
      <div className="chat-header-modern">
        <div className="chat-header-content">
          <div className="chat-ai-avatar">
            <img src={nodoLogo} alt="NODON" className="nodo-chat-logo" />
          </div>
          <div>
            <h2>IA NODON</h2>
          </div>
        </div>
        <div className="chat-header-right">
          <div className="chat-status">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
    )
  }

  const {
    tokensInfo,
    loadingTokens,
    getTokensPercentage,
    isNearLimit,
    isAtLimit,
    isCriticalLimit,
    handleSolicitarMaisTokens,
    setShowHistory
  } = chatHeaderContent

  return (
    <div className="chat-header-modern">
      <div className="chat-header-content">
        <button 
          className="history-toggle-btn"
          onClick={() => {
            if (setShowHistory) {
              if (typeof setShowHistory === 'function') {
                setShowHistory((prev) => !prev)
              }
            }
            if (onHistoryToggle) {
              onHistoryToggle()
            }
          }}
        >
          <FontAwesomeIcon icon={faHistory} />
        </button>
        <div className="chat-ai-avatar">
          <img src={nodoLogo} alt="NODON" className="nodo-chat-logo" />
        </div>
        <div>
          <h2>IA NODON</h2>
        </div>
      </div>
      <div className="chat-header-right">
        {loadingTokens ? (
          <div className="tokens-loading-header">
            <FontAwesomeIcon icon={faSpinner} spin /> Carregando...
          </div>
        ) : tokensInfo && (
          <div className="tokens-progress-container-header">
            <div className="tokens-progress-simple">
              <div className="tokens-simple-header">
                <span className="tokens-simple-text">
                  {(tokensInfo.tokensUtilizadosMes !== undefined 
                    ? tokensInfo.tokensUtilizadosMes 
                    : (tokensInfo.tokensUtilizados || 0)).toLocaleString('pt-BR')
                  } / {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 
                    ? tokensInfo.limitePlano.toLocaleString('pt-BR') 
                    : 'Ilimitado'}
                </span>
                {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 && getTokensPercentage && (
                  <span className={`tokens-simple-percentage ${isNearLimit && isNearLimit() ? 'near-limit' : ''} ${isAtLimit && isAtLimit() ? 'at-limit' : ''} ${isCriticalLimit && isCriticalLimit() ? 'critical-pulse' : ''}`}>
                    {getTokensPercentage().toFixed(1)}%
                  </span>
                )}
              </div>
              {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 && getTokensPercentage && (
                <div className="tokens-progress-bar-simple">
                  <div 
                    className={`tokens-progress-fill-simple ${isNearLimit && isNearLimit() ? 'near-limit' : ''} ${isAtLimit && isAtLimit() ? 'at-limit' : ''} ${isCriticalLimit && isCriticalLimit() ? 'critical-pulse' : ''}`}
                    style={{ width: `${getTokensPercentage()}%` }}
                  ></div>
                </div>
              )}
            </div>
            {tokensInfo.limitePlano && tokensInfo.limitePlano > 0 && getTokensPercentage && getTokensPercentage() >= 80 && (
              <button 
                className="btn-mais-tokens"
                onClick={() => handleSolicitarMaisTokens && handleSolicitarMaisTokens()}
                title="Solicitar mais tokens"
              >
                <FontAwesomeIcon icon={faWhatsapp} />
                <span>Mais Tokens</span>
              </button>
            )}
          </div>
        )}
        <div className="chat-status">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader

