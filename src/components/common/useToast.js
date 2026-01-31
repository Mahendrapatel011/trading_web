import { useState, useCallback } from 'react'

export const useToast = () => {
  const [toast, setToast] = useState({ message: '', type: 'info', show: false })

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, show: true })
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast({ message: '', type: 'info', show: false })
    }, 4000)
  }, [])

  const hideToast = useCallback(() => {
    setToast({ message: '', type: 'info', show: false })
  }, [])

  return {
    toast,
    showToast,
    hideToast,
  }
}

