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
  CFormSelect,
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
import { rentRateApi, masterApi, unitApi, locationApi } from '../../../api/reservationApi'

const RentRates = () => {
  const [rentRates, setRentRates] = useState([])
  const [items, setItems] = useState([])
  const [units, setUnits] = useState([])
  const [locations, setlocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [currentRentRate, setCurrentRentRate] = useState(null)

  const [formData, setFormData] = useState({
    itemId: '',
    unitId: '',
    locationId: '',
    rate: 0,
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rentRatesRes, itemsRes, unitsRes, locationsRes] = await Promise.all([
        rentRateApi.getAllAdmin(),
        masterApi.getItems(),
        unitApi.getAllAdmin(),
        locationApi.getAll(),
      ])
      setRentRates(Array.isArray(rentRatesRes.data.data) ? rentRatesRes.data.data : [])
      setItems(Array.isArray(itemsRes.data.data) ? itemsRes.data.data : [])

      // Filter units to only show Bag and Quintal (normalize names)
      const allUnits = Array.isArray(unitsRes.data.data) ? unitsRes.data.data : []
      const filteredUnits = allUnits
        .filter(u => {
          const name = u.name?.toLowerCase()?.trim()
          return name === 'bag' || name === 'bags' || name === 'quintal' || name === 'qtl' || name === 'quintle'
        })
        .map(u => {
          const name = u.name?.toLowerCase()?.trim()
          // Normalize to "Bag" or "Quintal"
          if (name === 'bag' || name === 'bags') {
            return { ...u, name: 'Bag' }
          }
          if (name === 'quintal' || name === 'qtl' || name === 'quintle') {
            return { ...u, name: 'Quintal' }
          }
          return u
        })
        // Remove duplicates (keep first occurrence of each normalized name)
        .filter((u, index, self) =>
          index === self.findIndex(unit => unit.name === u.name)
        )

      setUnits(filteredUnits)
      setlocations(Array.isArray(locationsRes.data.data) ? locationsRes.data.data : [])
    } catch (err) {
      setError('Failed to load data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }))
  }

  const handleAdd = () => {
    setModalMode('add')
    setFormData({
      itemId: '',
      unitId: '',
      locationId: '',
      rate: 0,
      isActive: true,
    })
    setCurrentRentRate(null)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleEdit = (rentRate) => {
    setModalMode('edit')
    setFormData({
      itemId: rentRate.itemId || rentRate.item?.id || '',
      unitId: rentRate.unitId || rentRate.unit?.id || '',
      locationId: rentRate.locationId || rentRate.location?.id || '',
      rate: rentRate.rate || 0,
      isActive: rentRate.isActive,
    })
    setCurrentRentRate(rentRate)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!formData.itemId || !formData.unitId || !formData.locationId) {
      setError('Item, Unit, and location are required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (modalMode === 'add') {
        await rentRateApi.create(formData)
        setSuccess('Rent rate created successfully!')
        await loadData()
        setShowModal(false)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        await rentRateApi.update(currentRentRate.id, formData)
        setSuccess('Rent rate updated successfully!')
        await loadData()
        setShowModal(false)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rent rate')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rent rate?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await rentRateApi.delete(id)
      setSuccess('Rent rate deleted successfully!')
      await loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete rent rate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Cold Storage Rent Rate Fixataion</strong>
            <CButton color="primary" size="sm" onClick={handleAdd}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Rent Rate
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
                    <CTableHeaderCell scope="col">Item</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Unit</CTableHeaderCell>
                    <CTableHeaderCell scope="col">location</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Rate (₹)</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rentRates.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        No rent rates found. Click "Add Rent Rate" to create one.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    rentRates.map((rentRate, index) => (
                      <CTableRow key={rentRate.id}>
                        <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{rentRate.item?.name || '-'}</CTableDataCell>
                        <CTableDataCell>{rentRate.unit?.name || '-'}</CTableDataCell>
                        <CTableDataCell>{rentRate.location?.name || '-'}</CTableDataCell>
                        <CTableDataCell>₹{rentRate.rate || 0}</CTableDataCell>
                        <CTableDataCell>
                          {rentRate.isActive ? (
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
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(rentRate)}
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(rentRate.id)}
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
            {modalMode === 'add' ? 'Add New Rent Rate' : 'Edit Rent Rate'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="itemId">
                  Item <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  id="itemId"
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="unitId">
                  Unit <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  id="unitId"
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Unit</option>
                  {units
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="locationId">
                  location <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  id="locationId"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="rate">
                  Rate (₹) <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
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
              'Save Rent Rate'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default RentRates

