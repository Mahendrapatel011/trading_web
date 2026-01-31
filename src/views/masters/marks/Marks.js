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
  CFormTextarea,
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

const Marks = () => {
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [currentMark, setCurrentMark] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    loadMarks()
  }, [])

  const loadMarks = async () => {
    setLoading(true)
    try {
      const response = await masterApi.getMarks()
      setMarks(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (err) {
      setError('Failed to load marks')
      console.error('Error loading marks:', err)
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
      description: '',
      isActive: true,
      sortOrder: 0,
    })
    setCurrentMark(null)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleEdit = (mark) => {
    setModalMode('edit')
    setFormData({
      name: mark.name,
      code: mark.code,
      description: mark.description || '',
      isActive: mark.isActive,
      sortOrder: mark.sortOrder || 0,
    })
    setCurrentMark(mark)
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
        await masterApi.createMark(formData)
        setSuccess('Mark created successfully!')
      } else {
        await masterApi.updateMark(currentMark._id, formData)
        setSuccess('Mark updated successfully!')
      }
      
      await loadMarks()
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save mark')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mark?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await masterApi.deleteMark(id)
      setSuccess('Mark deleted successfully!')
      await loadMarks()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete mark')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Marks Management</strong>
            <CButton color="primary" size="sm" onClick={handleAdd}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Mark
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
                    <CTableHeaderCell scope="col">Description</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Sort Order</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {marks.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        No marks found. Click "Add Mark" to create one.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    marks.map((mark, index) => (
                      <CTableRow key={mark._id}>
                        <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{mark.name}</CTableDataCell>
                        <CTableDataCell>
                          <code>{mark.code}</code>
                        </CTableDataCell>
                        <CTableDataCell>{mark.description || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {mark.isActive ? (
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
                        <CTableDataCell>{mark.sortOrder}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(mark)}
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(mark._id)}
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
            {modalMode === 'add' ? 'Add New Mark' : 'Edit Mark'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="name">
                  Mark Name <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter mark name"
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
                  placeholder="Enter code (e.g., MRK01)"
                  required
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel htmlFor="description">Description</CFormLabel>
                <CFormTextarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter mark description"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
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
              <CCol md={6} className="d-flex align-items-end">
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
              'Save Mark'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Marks

