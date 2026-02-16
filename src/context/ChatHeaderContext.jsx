import { createContext, useContext, useState } from 'react'

export const ChatHeaderContext = createContext()

export const useChatHeader = () => {
  const context = useContext(ChatHeaderContext)
  if (!context) {
    return null
  }
  return context
}

export const ChatHeaderProvider = ({ children }) => {
  const [chatHeaderContent, setChatHeaderContent] = useState(null)

  return (
    <ChatHeaderContext.Provider value={{ chatHeaderContent, setChatHeaderContent }}>
      {children}
    </ChatHeaderContext.Provider>
  )
}

