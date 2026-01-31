import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
  CSpinner,
  CAlert,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPencil,
  cilTrash,
  cilCheckCircle,
  cilXCircle,
} from '@coreui/icons'
import { masterApi } from '../../../api/reservationApi'

const DeliveryPoints = () => {
  const [deliveryPoints, setDeliveryPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [currentPoint, setCurrentPoint] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: '',
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    loadDeliveryPoints()
  }, [])

  const loadDeliveryPoints = async () => {
    setLoading(true)
    try {
      const response = await masterApi.getDeliveryPoints()
      setDeliveryPoints(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (err) {
      setError('Failed to load delivery points')
      console.error('Error loading delivery points:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAdd = () => {
    setModalMode('add')
    setFormData({
      name: '',
      code: '',
      capacity: '',
      isActive: true,
      sortOrder: 0,
    })
    setCurrentPoint(null)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleEdit = (point) => {
    setModalMode('edit')
    setFormData({
      name: point.name,
      code: point.code,
      capacity: point.capacity || '',
      isActive: point.isActive,
      sortOrder: point.sortOrder || 0,
    })
    setCurrentPoint(point)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      setError('Name and Code are required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (modalMode === 'add') {
        await masterApi.createDeliveryPoint(formData)
        setSuccess('Delivery point created successfully!')
      } else {
        await masterApi.updateDeliveryPoint(currentPoint._id, formData)
        setSuccess('Delivery point updated successfully!')
      }
      
      await loadDeliveryPoints()
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery point')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery point?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await masterApi.deleteDeliveryPoint(id)
      setSuccess('Delivery point deleted successfully!')
      await loadDeliveryPoints()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete delivery point')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Delivery Points Management</strong>
            <CButton color="primary" size="sm" onClick={handleAdd}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Delivery Point
            </CButton>
          </CCardHeader>
          <CCardBody>
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

            {loading && !showModal && (
              <div className="text-center py-4">
                <CSpinner color="primary" />
                <div className="mt-2">Loading...</div>
              </div>
            )}

            {!loading && (
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">#</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Code</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Capacity</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Sort Order</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {deliveryPoints.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        No delivery points found. Click "Add Delivery Point" to create one.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    deliveryPoints.map((point, index) => (
                      <CTableRow key={point._id}>
                        <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{point.name}</CTableDataCell>
                        <CTableDataCell>
                          <code>{point.code}</code>
                        </CTableDataCell>
                        <CTableDataCell>{point.capacity || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {point.isActive ? (
                            <CBadge color="success">
                              <CIcon icon={cilCheckCircle} className="me-1" size="sm" />
                              Active
                            </CBadge>
                          ) : (
                            <CBadge color="secondary">
                              <CIcon icon={cilXCircle} className="me-1" size="sm" />
                              Inactive
                            </CBadge>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>{point.sortOrder}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(point)}
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(point._id)}
                          >
                            <CIcon icon={cilTrash} size="sm" />
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
      </CCol>

      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {modalMode === 'add' ? 'Add New Delivery Point' : 'Edit Delivery Point'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="name">
                  Name <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter delivery point name"
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="code">
                  Code <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Enter code (e.g., DP01)"
                  required
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="capacity">Capacity</CFormLabel>
                <CFormInput
                  type="text"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Enter capacity (e.g., 1000 Qtl)"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="sortOrder">Sort Order</CFormLabel>
                <CFormInput
                  type="number"
                  id="sortOrder"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  placeholder="0"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormCheck
                  id="isActive"
                  name="isActive"
                  label="Active"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Delivery Point'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default DeliveryPoints