import { useState, useCallback } from 'react'

export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  const showAlert = useCallback((message, type = 'info', title = '') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type
    })
  }, [])

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  // Atalhos para diferentes tipos
  const showSuccess = useCallback((message, title = '') => {
    showAlert(message, 'success', title)
  }, [showAlert])

  const showError = useCallback((message, title = '') => {
    showAlert(message, 'error', title)
  }, [showAlert])

  const showWarning = useCallback((message, title = '') => {
    showAlert(message, 'warning', title)
  }, [showAlert])

  const showInfo = useCallback((message, title = '') => {
    showAlert(message, 'info', title)
  }, [showAlert])

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

export default useAlert
