// src/components/common/ImpersonationBanner.jsx
import React from 'react'
import { CAlert, CButton, CContainer } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilWarning } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedlocation, exitImpersonation } = useAuth()
  const navigate = useNavigate()

  if (!isImpersonating) {
    return null
  }

  const handleExitImpersonation = () => {
    const success = exitImpersonation()
    if (success) {
      navigate('/management')
      // Small delay before reload to allow navigation
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1060,
        width: '100%',
      }}
    >
      <CAlert
        color="warning"
        className="d-flex align-items-center justify-content-between m-0 rounded-0 py-2"
      >
        <CContainer fluid className="d-flex align-items-center justify-content-between px-2">
          <div className="d-flex align-items-center">
            <CIcon icon={cilWarning} className="me-2 flex-shrink-0" />
            <span className="d-none d-sm-inline">
              <strong>Impersonation Mode:</strong> You are viewing as{' '}
              <strong>{impersonatedlocation?.name}</strong> location
            </span>
            <span className="d-sm-none">
              <strong>{impersonatedlocation?.name}</strong>
            </span>
          </div>
          <CButton
            color="dark"
            size="sm"
            onClick={handleExitImpersonation}
            className="ms-2 flex-shrink-0"
          >
            <CIcon icon={cilArrowLeft} className="me-1" />
            <span className="d-none d-md-inline">Back to Super Admin</span>
            <span className="d-md-none">Exit</span>
          </CButton>
        </CContainer>
      </CAlert>
    </div>
  )
}

export default ImpersonationBanner