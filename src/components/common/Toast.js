import React, { useRef, useEffect, useState } from 'react'
import {
  CToast,
  CToastBody,
  CToastClose,
  CToaster,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilWarning,
  cilInfo,
  cilXCircle,
} from '@coreui/icons'
import './Toast.css'

const Toast = ({ message, type = 'info', onClose }) => {
  const toaster = useRef(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (message) {
      const toastColor = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info',
      }[type] || 'info'

      const toastIcon = {
        success: cilCheckCircle,
        error: cilXCircle,
        warning: cilWarning,
        info: cilInfo,
      }[type] || cilInfo

      const toastElement = (
        <CToast
          autohide={true}
          delay={4000}
          visible={true}
          color={toastColor}
          className={`text-white align-items-center custom-toast ${type}`}
          onClose={() => {
            setToast(null)
            if (onClose) onClose()
          }}
        >
          <div className="d-flex align-items-center">
            <CIcon icon={toastIcon} className="me-3 toast-icon" size="lg" />
            <CToastBody className="toast-message">{message}</CToastBody>
            <CToastClose className="ms-2 toast-close" white />
          </div>
        </CToast>
      )

      setToast(toastElement)

      // Auto remove after 4 seconds
      const timer = setTimeout(() => {
        setToast(null)
        if (onClose) {
          onClose()
        }
      }, 4000)

      return () => clearTimeout(timer)
    } else {
      setToast(null)
    }
  }, [message, type, onClose])

  return <CToaster ref={toaster} push={toast} placement="top-center" />
}

export default Toast

