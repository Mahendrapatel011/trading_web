import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import { userApi, locationApi } from '../../api/reservationApi'
import Toast from '../../components/common/Toast'
import { useToast } from '../../components/common/useToast'

const UserManagement = () => {
  const { toast, showToast, hideToast } = useToast()
  const [users, setUsers] = useState([])
  const [locations, setlocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    locationId: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, locationsRes] = await Promise.all([
        userApi.getAll(),
        locationApi.getAll(),
      ])
      setUsers(usersRes.data.data || [])
      setlocations(locationsRes.data.data || [])
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.email || '',
        password: '',
        locationId: user.locationId || '',
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        password: '',
        locationId: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      username: '',
      password: '',
      locationId: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username || !formData.locationId) {
      showToast('Please fill all required fields', 'error')
      return
    }

    if (!editingUser && !formData.password) {
      showToast('Password is required for new users', 'error')
      return
    }

    // Validate password length (minimum 6 characters for login)
    if (formData.password && formData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error')
      return
    }

    setLoading(true)
    try {
      // Extract username from email (before @) for firstName
      const emailPrefix = formData.username.split('@')[0]
      const dataToSend = {
        email: formData.username,
        password: formData.password,
        locationId: parseInt(formData.locationId),
        firstName: emailPrefix || 'User',
        lastName: 'User',
        role: 'staff', // Default role
      }

      if (editingUser && !formData.password) {
        delete dataToSend.password
      }

      if (editingUser) {
        await userApi.update(editingUser.id, dataToSend)
        showToast('User updated successfully', 'success')
      } else {
        await userApi.create(dataToSend)
        showToast('User created successfully', 'success')
      }
      handleCloseModal()
      loadData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save user', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    setLoading(true)
    try {
      await userApi.delete(id)
      showToast('User deleted successfully', 'success')
      loadData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete user', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toast toast={toast} hideToast={hideToast} />
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">User Management</h5>
          <CButton color="primary" onClick={() => handleOpenModal()}>
            <CIcon icon={cilPlus} className="me-2" />
            Add User
          </CButton>
        </CCardHeader>
        <CCardBody>
          {loading && !users.length ? (
            <div className="text-center py-4">
              <CSpinner />
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Username (Email)</CTableHeaderCell>
                  <CTableHeaderCell>location</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {users.map((user) => (
                  <CTableRow key={user.id}>
                    <CTableDataCell>{user.email}</CTableDataCell>
                    <CTableDataCell>
                      {user.location?.name || '-'}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={`badge bg-${user.status === 'active' ? 'success' : 'secondary'}`}>
                        {user.status}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenModal(user)}
                        disabled={user.role === 'super_admin'}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'super_admin'}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={showModal} onClose={handleCloseModal} size="lg">
        <CModalHeader>
          <CModalTitle>{editingUser ? 'Edit User' : 'Add User'}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="row mb-3">
              <div className="col-md-12">
                <CFormLabel>Username (Email) *</CFormLabel>
                <CFormInput
                  type="email"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-12">
                <CFormLabel>Password {!editingUser && '*'}</CFormLabel>
                <CFormInput
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password (min 6 characters)'}
                />
                {formData.password && formData.password.length > 0 && formData.password.length < 6 && (
                  <div className="text-danger small mt-1">
                    Password must be at least 6 characters long
                  </div>
                )}
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-12">
                <CFormLabel>location *</CFormLabel>
                <CFormSelect
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  required
                >
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : editingUser ? 'Update' : 'Create'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default UserManagement

