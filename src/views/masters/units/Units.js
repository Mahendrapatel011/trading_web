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
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPencil,
  cilTrash,
} from '@coreui/icons'
import { unitApi } from '../../../api/unitApi'

const Units = () => {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fixed units: Bag and Quintal
  const FIXED_UNITS = [
    { name: 'Bag', id: 1 },
    { name: 'Quintal', id: 2 }
  ]

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [currentUnit, setCurrentUnit] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
  })

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = async () => {
    setLoading(true)
    try {
      const response = await unitApi.getAllAdmin()
      const allUnits = Array.isArray(response.data.data) ? response.data.data : []

      // Filter to only show Bag and Quintal, create if they don't exist
      const existingUnits = allUnits.filter(u =>
        u.name?.toLowerCase() === 'bag' ||
        u.name?.toLowerCase() === 'bags' ||
        u.name?.toLowerCase() === 'quintal' ||
        u.name?.toLowerCase() === 'qtl'
      )

      // Create missing units
      const bagExists = existingUnits.some(u =>
        u.name?.toLowerCase() === 'bag' || u.name?.toLowerCase() === 'bags'
      )
      const quintalExists = existingUnits.some(u =>
        u.name?.toLowerCase() === 'quintal' || u.name?.toLowerCase() === 'qtl'
      )

      if (!bagExists) {
        try {
          await unitApi.create({ name: 'Bag' })
        } catch (err) {
          console.log('Bag unit may already exist')
        }
      }

      if (!quintalExists) {
        try {
          await unitApi.create({ name: 'Quintal' })
        } catch (err) {
          console.log('Quintal unit may already exist')
        }
      }

      // Reload units after creating missing ones
      const updatedResponse = await unitApi.getAllAdmin()
      const updatedUnits = Array.isArray(updatedResponse.data.data) ? updatedResponse.data.data : []

      // Filter to only Bag and Quintal (handle variations)
      const filteredUnits = updatedUnits.filter(u => {
        const name = u.name?.toLowerCase()?.trim()
        return name === 'bag' || name === 'bags' || name === 'quintal' || name === 'qtl' || name === 'quintle'
      })

      // Normalize names to "Bag" and "Quintal"
      const normalizedUnits = filteredUnits.map(u => {
        const name = u.name?.toLowerCase()?.trim()
        if (name === 'bag' || name === 'bags') {
          return { ...u, name: 'Bag' }
        }
        if (name === 'quintal' || name === 'qtl' || name === 'quintle') {
          return { ...u, name: 'Quintal' }
        }
        return u
      })

      // Remove duplicates - keep only one "Bag" and one "Quintal"
      const uniqueUnits = []
      const seenNames = new Set()

      normalizedUnits.forEach(u => {
        if (!seenNames.has(u.name)) {
          seenNames.add(u.name)
          uniqueUnits.push(u)
        }
      })

      setUnits(uniqueUnits)
    } catch (err) {
      setError('Failed to load units')
      console.error('Error loading units:', err)
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
    // Don't allow adding new units - only Bag and Quintal are allowed
    setError('Only Bag and Quintal units are allowed. Please edit existing units.')
    return
  }

  const handleEdit = (unit) => {
    setModalMode('edit')
    setFormData({
      name: unit.name,
    })
    setCurrentUnit(unit)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!formData.name) {
      setError('Name is required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (modalMode === 'add') {
        await unitApi.create(formData)
        setSuccess('Unit created successfully!')
        await loadUnits()
        setShowModal(false)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        await unitApi.update(currentUnit.id, formData)
        setSuccess('Unit updated successfully!')
        await loadUnits()
        setShowModal(false)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save unit')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await unitApi.delete(id)
      setSuccess('Unit deleted successfully!')
      await loadUnits()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete unit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Units Management</strong>
            <small className="text-muted">Only Bag and Quintal units are available</small>
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
                    <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {units.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center">
                        No units found. Click "Add Unit" to create one.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    units.map((unit, index) => (
                      <CTableRow key={unit.id}>
                        <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{unit.name}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(unit)}
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(unit.id)}
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

      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>
            {modalMode === 'add' ? 'Add New Unit' : 'Edit Unit'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel htmlFor="name">
                  Unit Name <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  readOnly={modalMode === 'edit'}
                  disabled={modalMode === 'edit'}
                  placeholder="Bag or Quintal"
                  required
                />
                {modalMode === 'edit' && (
                  <small className="text-muted d-block mt-1">
                    ⚠️ Unit name cannot be changed. Only Bag and Quintal are allowed.
                  </small>
                )}
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
              'Save Unit'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Units

