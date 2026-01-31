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
import { userApi } from '../../api/reservationApi'

const ChangeUserPasswordModal = ({ visible, onClose, userId, userName }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

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

    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirm password do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      await userApi.update(userId, {
        password: formData.password,
      })
      setSuccess('Password changed successfully!')
      setFormData({
        password: '',
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
      password: '',
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
          Change Password for {userName}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
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
            <CFormLabel>New Password * (Minimum 6 characters)</CFormLabel>
            <CFormInput
              type="password"
              name="password"
              value={formData.password}
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
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleSubmit} 
          disabled={loading || !formData.password || !formData.confirmPassword}
        >
          {loading ? <CSpinner size="sm" /> : 'Change Password'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ChangeUserPasswordModal

