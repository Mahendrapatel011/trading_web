import React, { useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked } from '@coreui/icons'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/reservationApi'

const ChangePasswordModal = ({ visible, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const isSuperAdmin = user?.role === 'super_admin'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })
      setSuccess('Password changed successfully!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setError('')
    setSuccess('')
    onClose()
  }

  return (
    <CModal visible={visible} onClose={handleClose}>
      <CModalHeader>
        <CModalTitle>
          <CIcon icon={cilLockLocked} className="me-2" />
          Change Password
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {!isSuperAdmin ? (
          <CAlert color="warning">
            <strong>Contact Administrator</strong>
            <br />
            Regular users cannot change their password. Please contact your administrator to change your password.
          </CAlert>
        ) : (
          <>
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError('')}>
                {error}
              </CAlert>
            )}
            {success && (
              <CAlert color="success" dismissible onClose={() => setSuccess('')}>
                {success}
              </CAlert>
            )}
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel>Current Password *</CFormLabel>
                <CFormInput
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter current password"
                />
              </div>
              <div className="mb-3">
                <CFormLabel>New Password * (Minimum 6 characters)</CFormLabel>
                <CFormInput
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Confirm New Password *</CFormLabel>
                <CFormInput
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm new password"
                />
              </div>
            </CForm>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose} disabled={loading}>
          {isSuperAdmin ? 'Cancel' : 'Close'}
        </CButton>
        {isSuperAdmin && (
          <CButton 
            color="primary" 
            onClick={handleSubmit} 
            disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          >
            {loading ? <CSpinner size="sm" /> : 'Change Password'}
          </CButton>
        )}
      </CModalFooter>
    </CModal>
  )
}

export default ChangePasswordModal

