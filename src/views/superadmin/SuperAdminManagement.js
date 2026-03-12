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
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilHome, cilPeople, cilLockLocked, cilAccountLogout } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { userApi, locationApi } from '../../api/reservationApi'
import Toast from '../../components/common/Toast'
import { useToast } from '../../components/common/useToast'
import ChangeUserPasswordModal from '../../components/profile/ChangeUserPasswordModal'
import { useAuth } from '../../context/AuthContext'

const SuperAdminManagement = () => {
  const { toast, showToast, hideToast } = useToast()
  const { loginAslocation } = useAuth()
  const navigate = useNavigate()

  // location state
  const [locations, setlocations] = useState([])
  const [showlocationModal, setShowlocationModal] = useState(false)
  const [editinglocation, setEditinglocation] = useState(null)
  const [locationFormData, setlocationFormData] = useState({
    name: '',
    code: '',
    nameHindi: '',
    addressHindi: '',
    officeHindi: '',
    phone: '',
    managerName: '',
  })

  // User state
  const [users, setUsers] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    locationId: '',
    code: '',
  })

  const [loading, setLoading] = useState(false)

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteItemName, setDeleteItemName] = useState('')

  // Year-wise delete modal state
  const [showYearDeleteModal, setShowYearDeleteModal] = useState(false)
  const [selectedlocationForYearDelete, setSelectedlocationForYearDelete] = useState(null)
  const [availableYears, setAvailableYears] = useState([])
  const [selectedYear, setSelectedYear] = useState('')

  // Change password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null)

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

  // ✅ NEW: Handle Login as location
  const handleLoginAslocation = (location) => {
    const success = loginAslocation(location)
    if (success) {
      showToast(`Logging in as ${location.name}...`, 'success')
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
        window.location.reload() // Reload to update layout
      }, 500)
    } else {
      showToast('Failed to login as location', 'error')
    }
  }

  // Auto-generate unique numerical location code
  const generatelocationCode = (existingCodes = []) => {
    const numericCodes = existingCodes
      .map(code => {
        const num = parseInt(code)
        return isNaN(num) ? 0 : num
      })
      .filter(num => num > 0)

    let nextCode = 1
    if (numericCodes.length > 0) {
      const maxCode = Math.max(...numericCodes)
      nextCode = maxCode + 1
    }

    return nextCode.toString()
  }

  // location handlers
  const handleOpenlocationModal = (location = null) => {
    if (location) {
      setEditinglocation(location)
      setlocationFormData({
        name: location.name || '',
        code: location.code || '',
        nameHindi: location.nameHindi || '',
        addressHindi: location.addressHindi || '',
        officeHindi: location.officeHindi || '',
        phone: location.phone || '',
        managerName: location.managerName || '',
      })
    } else {
      setEditinglocation(null)
      const existingCodes = locations.map(w => w.code)
      const code = generatelocationCode(existingCodes)
      setlocationFormData({
        name: '',
        code,
        nameHindi: '',
        addressHindi: '',
        officeHindi: '',
        phone: '',
        managerName: '',
      })
    }
    setShowlocationModal(true)
  }

  const handleCloselocationModal = () => {
    setShowlocationModal(false)
    setEditinglocation(null)
    setlocationFormData({
      name: '',
      code: '',
      nameHindi: '',
      addressHindi: '',
      officeHindi: '',
      phone: '',
      managerName: '',
    })
  }

  const handlelocationNameChange = (name) => {
    setlocationFormData({
      ...locationFormData,
      name,
    })
  }

  const handlelocationSubmit = async (e) => {
    e.preventDefault()

    if (!locationFormData.name || !locationFormData.code) {
      showToast('Please fill all fields', 'error')
      return
    }

    setLoading(true)
    try {
      if (editinglocation) {
        await locationApi.update(editinglocation.id, locationFormData)
        showToast('location updated successfully', 'success')
      } else {
        await locationApi.create(locationFormData)
        showToast('location created successfully', 'success')
      }
      handleCloselocationModal()
      loadData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save location', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlelocationDeleteClick = (location) => {
    setDeleteType('location')
    setDeleteId(location.id)
    setDeleteItemName(location.name)
    setShowDeleteModal(true)
  }

  const handlelocationYearDeleteClick = async (location) => {
    console.log('Year delete clicked for location:', location)
    setSelectedlocationForYearDelete(location)
    setShowYearDeleteModal(true)
    setLoading(true)
    setAvailableYears([])

    try {
      const response = await locationApi.getAvailableYears(location.id)
      console.log('Available years response:', response)
      const years = response.data.data || []
      setAvailableYears(years)
      if (years.length > 0) {
        setSelectedYear(years[0].toString())
      }
    } catch (error) {
      console.error('Error loading years:', error)
      showToast(error.response?.data?.message || 'Failed to load available years', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseYearDeleteModal = () => {
    setShowYearDeleteModal(false)
    setSelectedlocationForYearDelete(null)
    setAvailableYears([])
    setSelectedYear('')
  }

  const handleYearDelete = async () => {
    if (!selectedYear || !selectedlocationForYearDelete) {
      showToast('Please select a year', 'error')
      return
    }

    setLoading(true)
    try {
      await locationApi.deleteByYear(selectedlocationForYearDelete.id, selectedYear)
      showToast(`location data for year ${selectedYear} deleted successfully`, 'success')
      handleCloseYearDeleteModal()
      loadData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete location data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlelocationDelete = async () => {
    setShowDeleteModal(false)
    setLoading(true)
    try {
      await locationApi.delete(deleteId)
      showToast('location deleted successfully', 'success')
      loadData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete location', 'error')
    } finally {
      setLoading(false)
      setDeleteId(null)
      setDeleteType(null)
      setDeleteItemName('')
    }
  }

  // Auto-generate unique numerical user code
  const generateUserCode = (existingCodes = []) => {
    const numericCodes = existingCodes
      .map(code => {
        const num = parseInt(code)
        return isNaN(num) ? 0 : num
      })
      .filter(num => num > 0)

    let nextCode = 1
    if (numericCodes.length > 0) {
      const maxCode = Math.max(...numericCodes)
      nextCode = maxCode + 1
    }

    return nextCode.toString()
  }

  // User handlers
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setUserFormData({
        username: user.email || '',
        password: '',
        locationId: user.locationId || '',
        code: user.code || '',
      })
    } else {
      setEditingUser(null)
      const existingCodes = users.map(u => u.code).filter(Boolean)
      const code = generateUserCode(existingCodes)
      setUserFormData({
        username: '',
        password: '',
        locationId: '',
        code,
      })
    }
    setShowUserModal(true)
  }

  const handleCloseUserModal = () => {
    setShowUserModal(false)
    setEditingUser(null)
    setUserFormData({
      username: '',
      password: '',
      locationId: '',
      code: '',
    })
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()

    if (!userFormData.username || !userFormData.locationId) {
      showToast('Please fill all required fields', 'error')
      return
    }

    const locationIdNum = parseInt(userFormData.locationId)
    if (isNaN(locationIdNum) || locationIdNum <= 0) {
      showToast('Please select a valid location', 'error')
      return
    }

    if (!editingUser && !userFormData.password) {
      showToast('Password is required for new users', 'error')
      return
    }

    if (userFormData.password && userFormData.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error')
      return
    }

    setLoading(true)
    try {
      const emailPrefix = userFormData.username.split('@')[0]
      const dataToSend = {
        email: userFormData.username,
        password: userFormData.password,
        locationId: locationIdNum,
        firstName: emailPrefix || 'User',
        lastName: 'User',
        role: 'staff',
        code: userFormData.code || undefined,
      }

      if (editingUser && !userFormData.password) {
        delete dataToSend.password
      }

      console.log('Creating/Updating user with data:', {
        ...dataToSend,
        password: dataToSend.password ? '***' : undefined
      })

      if (editingUser) {
        await userApi.update(editingUser.id, dataToSend)
        showToast('User updated successfully', 'success')
      } else {
        await userApi.create(dataToSend)
        showToast('User created successfully', 'success')
      }
      handleCloseUserModal()
      loadData()
    } catch (error) {
      console.error('Error saving user:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save user'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUserDeleteClick = (user) => {
    setDeleteType('user')
    setDeleteId(user.id)
    setDeleteItemName(user.email)
    setShowDeleteModal(true)
  }

  const handleChangePasswordClick = (user) => {
    setSelectedUserForPassword(user)
    setShowChangePasswordModal(true)
  }

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false)
    setSelectedUserForPassword(null)
  }

  const handleUserDelete = async () => {
    setShowDeleteModal(false)
    setLoading(true)
    try {
      await userApi.delete(deleteId)
      showToast('User deleted successfully', 'success')
      loadData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete user', 'error')
    } finally {
      setLoading(false)
      setDeleteId(null)
      setDeleteType(null)
      setDeleteItemName('')
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteId(null)
    setDeleteType(null)
    setDeleteItemName('')
  }


  return (
    <>
      <Toast toast={toast} hideToast={hideToast} />

      {/* location Management Section */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <CIcon icon={cilHome} className="me-2" />
            Location Management
          </h5>
          <CButton color="primary" onClick={() => handleOpenlocationModal()}>
            <CIcon icon={cilPlus} className="me-2" />
            Add Location
          </CButton>
        </CCardHeader>
        <CCardBody>
          {loading && !locations.length ? (
            <div className="text-center py-4">
              <CSpinner />
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>ID</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Code</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {locations.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="4" className="text-center py-4">
                      No locations found. Click "Add location" to create one.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  locations.map((location) => (
                    <CTableRow key={location.id}>
                      <CTableDataCell>{location.id}</CTableDataCell>
                      <CTableDataCell>{location.name}</CTableDataCell>
                      <CTableDataCell>
                        <span className="badge bg-info">{location.code}</span>
                      </CTableDataCell>
                      <CTableDataCell>
                        {/* ✅ NEW: Login as location Button */}
                        <CButton
                          color="success"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => handleLoginAslocation(location)}
                          title="Login as this location"
                        >
                          <CIcon icon={cilAccountLogout} className="me-1" />
                          <span className="d-none d-lg-inline">Login</span>
                        </CButton>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenlocationModal(location)}
                          title="Edit location"
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          type="button"
                          color="warning"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlelocationYearDeleteClick(location)
                          }}
                          title="Delete location Data by Year"
                        >
                          <CIcon icon={cilTrash} />
                          <span className="d-none d-lg-inline ms-1">Year</span>
                        </CButton>
                        <CButton
                          type="button"
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlelocationDeleteClick(location)
                          }}
                          title="Delete location"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* User Management Section */}
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <CIcon icon={cilPeople} className="me-2" />
            User Management
          </h5>
          <CButton color="primary" onClick={() => handleOpenUserModal()}>
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
                  <CTableHeaderCell>Code</CTableHeaderCell>
                  <CTableHeaderCell>Username (Email)</CTableHeaderCell>
                  <CTableHeaderCell>location</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {users.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="5" className="text-center py-4">
                      No users found. Click "Add User" to create one.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  users.map((user) => (
                    <CTableRow key={user.id}>
                      <CTableDataCell>
                        <span className="badge bg-info">{user.code || '-'}</span>
                      </CTableDataCell>
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
                          onClick={() => handleOpenUserModal(user)}
                          disabled={user.role === 'super_admin'}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="me-2"
                          onClick={() => handleChangePasswordClick(user)}
                          disabled={user.role === 'super_admin'}
                          title="Change Password"
                        >
                          <CIcon icon={cilLockLocked} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserDeleteClick(user)}
                          disabled={user.role === 'super_admin'}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* location Modal */}
      <CModal visible={showlocationModal} onClose={handleCloselocationModal}>
        <CModalHeader>
          <CModalTitle>{editinglocation ? 'Edit location' : 'Add location'}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handlelocationSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel>Name *</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.name}
                onChange={(e) => handlelocationNameChange(e.target.value)}
                required
                placeholder="e.g., location 1"
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Code * (Auto-generated)</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.code}
                onChange={(e) => setlocationFormData({ ...locationFormData, code: e.target.value })}
                required
                readOnly={!editinglocation}
                placeholder="Auto-generated numerical code"
              />
              {!editinglocation && (
                <small className="text-muted">Code will be auto-generated numerically</small>
              )}
            </div>

            <hr className="my-4" />
            <h6 className="mb-3">Company Information (for Receipts)</h6>

            <div className="mb-3">
              <CFormLabel>Company Name (Hindi)</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.nameHindi}
                onChange={(e) => setlocationFormData({ ...locationFormData, nameHindi: e.target.value })}

              />
            </div>

            <div className="mb-3">
              <CFormLabel>Address (Hindi)</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.addressHindi}
                onChange={(e) => setlocationFormData({ ...locationFormData, addressHindi: e.target.value })}

              />
            </div>

            <div className="mb-3">
              <CFormLabel>Office (Hindi)</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.officeHindi}
                onChange={(e) => setlocationFormData({ ...locationFormData, officeHindi: e.target.value })}

              />
            </div>

            <div className="mb-3">
              <CFormLabel>Phone</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.phone}
                onChange={(e) => setlocationFormData({ ...locationFormData, phone: e.target.value })}

              />
            </div>

            <div className="mb-3">
              <CFormLabel>Manager Name</CFormLabel>
              <CFormInput
                type="text"
                value={locationFormData.managerName}
                onChange={(e) => setlocationFormData({ ...locationFormData, managerName: e.target.value })}

              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloselocationModal}>
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : editinglocation ? 'Update' : 'Create'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* User Modal */}
      <CModal visible={showUserModal} onClose={handleCloseUserModal} size="lg">
        <CModalHeader>
          <CModalTitle>{editingUser ? 'Edit User' : 'Add User'}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleUserSubmit}>
          <CModalBody>
            <div className="row mb-3">
              <div className="col-md-6">
                <CFormLabel>Code {!editingUser && '(Auto-generated)'}</CFormLabel>
                <CFormInput
                  type="text"
                  value={userFormData.code || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, code: e.target.value })}
                  readOnly={!editingUser}
                  disabled={!editingUser}
                  placeholder={editingUser ? 'User code' : 'Auto-generated numerical code'}
                />
                {!editingUser && (
                  <small className="text-muted">Code will be auto-generated numerically</small>
                )}
              </div>
              <div className="col-md-6">
                <CFormLabel>Username (Email) *</CFormLabel>
                <CFormInput
                  type="email"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-12">
                <CFormLabel>Password {!editingUser && '*'} (Minimum 6 characters)</CFormLabel>
                <CFormInput
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password (min 6 characters)'}
                />
                {userFormData.password && userFormData.password.length > 0 && userFormData.password.length < 6 && (
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
                  value={userFormData.locationId}
                  onChange={(e) => {
                    const selectedId = e.target.value
                    console.log('Selected location ID:', selectedId, 'Type:', typeof selectedId)
                    setUserFormData({ ...userFormData, locationId: selectedId })
                  }}
                  required
                >
                  <option value="">Select location</option>
                  {locations.length === 0 ? (
                    <option value="" disabled>No locations available. Please create a location first.</option>
                  ) : (
                    locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.code}) - ID: {location.id}
                      </option>
                    ))
                  )}
                </CFormSelect>
                {locations.length === 0 && (
                  <div className="text-warning small mt-1">
                    ⚠️ No locations found. Please create a location first before adding users.
                  </div>
                )}
                {userFormData.locationId && (
                  <div className="text-info small mt-1">
                    Selected location ID: {userFormData.locationId}
                  </div>
                )}
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseUserModal}>
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : editingUser ? 'Update' : 'Create'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteModal} onClose={handleCancelDelete}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilTrash} className="me-2 text-danger" />
            Confirm Delete
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {deleteType === 'location' ? (
            <>
              <p className="mb-3">
                Are you sure you want to delete <strong>{deleteItemName}</strong> location?
              </p>
              <p className="text-danger mb-2">This will permanently delete:</p>
              <ul className="mb-3">
                <li>All users associated with this location</li>
                <li>All reservations and agreements</li>
                <li>All chambers, partial deliveries, and cash receipts</li>
                <li>All agents, delivery points, and marks</li>
                <li>All rent rates, discount rates, and advance rates</li>
                <li>All document counters</li>
              </ul>
              <p className="text-danger fw-bold">This action cannot be undone!</p>
            </>
          ) : (
            <>
              <p className="mb-3">
                Are you sure you want to delete user <strong>{deleteItemName}</strong>?
              </p>
              <p className="text-danger mb-3">
                This action will permanently remove the user from the system and cannot be undone.
              </p>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelDelete} disabled={loading}>
            Cancel
          </CButton>
          <CButton
            color="danger"
            onClick={deleteType === 'location' ? handlelocationDelete : handleUserDelete}
            disabled={loading}
          >
            {loading ? <CSpinner size="sm" /> : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Year-wise Delete Modal */}
      <CModal visible={showYearDeleteModal} onClose={handleCloseYearDeleteModal}>
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilTrash} className="me-2 text-warning" />
            Delete location Data by Year
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedlocationForYearDelete && (
            <>
              <p className="mb-3">
                Select year to delete data for location: <strong>{selectedlocationForYearDelete.name}</strong>
              </p>
              <div className="mb-3">
                <CFormLabel>Select Year *</CFormLabel>
                <CFormSelect
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={loading || availableYears.length === 0}
                >
                  <option value="">{loading ? 'Loading years...' : 'Select Year'}</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </CFormSelect>
                {loading && (
                  <div className="mt-2 text-primary small">
                    <CSpinner size="sm" className="me-2" /> Fetching available years...
                  </div>
                )}
                {!loading && availableYears.length === 0 && (
                  <div className="text-danger small mt-1 font-weight-bold">
                    ⚠️ No data found for this location in any year.
                  </div>
                )}
              </div>
              <div className="alert alert-warning">
                <strong>Warning:</strong> This will permanently delete all data for year <strong>{selectedYear || 'selected year'}</strong> including:
                <ul className="mb-0 mt-2">
                  <li>All Purchases & Agreement Data</li>
                  <li>All Sales Records</li>
                  <li>All Loans & Repayments</li>
                  <li>All Lot Processing (Taiyari) data</li>
                </ul>
                <p className="mb-0 mt-2 text-danger fw-bold">This action cannot be undone!</p>
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCloseYearDeleteModal} disabled={loading}>
            Cancel
          </CButton>
          <CButton
            color="warning"
            onClick={handleYearDelete}
            disabled={loading || !selectedYear || availableYears.length === 0}
          >
            {loading ? <CSpinner size="sm" /> : 'Delete Data'}
          </CButton>
        </CModalFooter>
      </CModal>

      <ChangeUserPasswordModal
        visible={showChangePasswordModal}
        onClose={handleCloseChangePasswordModal}
        userId={selectedUserForPassword?.id}
        userName={selectedUserForPassword?.email}
      />

    </>
  )
}

export default SuperAdminManagement