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
import { unloadingRateApi, masterApi, unitApi, locationApi } from '../../../api/reservationApi'

const UnloadingRates = () => {
    const [rates, setRates] = useState([])
    const [items, setItems] = useState([])
    const [units, setUnits] = useState([])
    const [locations, setlocations] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [currentRate, setCurrentRate] = useState(null)

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
            const [ratesRes, itemsRes, unitsRes, locationsRes] = await Promise.all([
                unloadingRateApi.getAllAdmin(),
                masterApi.getItems(),
                unitApi.getAllAdmin(),
                locationApi.getAll(),
            ])
            setRates(Array.isArray(ratesRes.data.data) ? ratesRes.data.data : [])
            setItems(Array.isArray(itemsRes.data.data) ? itemsRes.data.data : [])
            setUnits(Array.isArray(unitsRes.data.data) ? unitsRes.data.data : [])
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
        setCurrentRate(null)
        setShowModal(true)
    }

    const handleEdit = (rate) => {
        setModalMode('edit')
        setFormData({
            itemId: rate.itemId || rate.item?.id || '',
            unitId: rate.unitId || rate.unit?.id || '',
            locationId: rate.locationId || rate.location?.id || '',
            rate: rate.rate || 0,
            isActive: rate.isActive,
        })
        setCurrentRate(rate)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formData.itemId || !formData.unitId || !formData.locationId) {
            setError('Item, Unit, and location are required')
            return
        }

        setLoading(true)
        setError('')
        try {
            if (modalMode === 'add') {
                await unloadingRateApi.create(formData)
                setSuccess('Unloading rate created successfully!')
            } else {
                await unloadingRateApi.update(currentRate.id, formData)
                setSuccess('Unloading rate updated successfully!')
            }
            await loadData()
            setShowModal(false)
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save rate')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rate?')) return
        setLoading(true)
        try {
            await unloadingRateApi.delete(id)
            setSuccess('Rate deleted successfully!')
            await loadData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete rate')
        } finally {
            setLoading(false)
        }
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader className="d-flex justify-content-between align-items-center">
                        <strong>Unloading Labour Rate Fixation</strong>
                        <CButton color="primary" size="sm" onClick={handleAdd}>
                            <CIcon icon={cilPlus} className="me-2" />
                            Add Unloading Rate
                        </CButton>
                    </CCardHeader>
                    <CCardBody>
                        {error && <CAlert color="danger" dismissible>{error}</CAlert>}
                        {success && <CAlert color="success" dismissible>{success}</CAlert>}
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>#</CTableHeaderCell>
                                    <CTableHeaderCell>Item</CTableHeaderCell>
                                    <CTableHeaderCell>Unit</CTableHeaderCell>
                                    <CTableHeaderCell>location</CTableHeaderCell>
                                    <CTableHeaderCell>Rate (₹)</CTableHeaderCell>
                                    <CTableHeaderCell>Status</CTableHeaderCell>
                                    <CTableHeaderCell>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {rates.map((rate, index) => (
                                    <CTableRow key={rate.id}>
                                        <CTableDataCell>{index + 1}</CTableDataCell>
                                        <CTableDataCell>{rate.item?.name}</CTableDataCell>
                                        <CTableDataCell>{rate.unit?.name}</CTableDataCell>
                                        <CTableDataCell>{rate.location?.name}</CTableDataCell>
                                        <CTableDataCell>₹{rate.rate}</CTableDataCell>
                                        <CTableDataCell>
                                            <CBadge color={rate.isActive ? 'success' : 'secondary'}>
                                                {rate.isActive ? 'Active' : 'Inactive'}
                                            </CBadge>
                                        </CTableDataCell>
                                        <CTableDataCell>
                                            <CButton color="info" size="sm" className="me-2" onClick={() => handleEdit(rate)}>
                                                <CIcon icon={cilPencil} />
                                            </CButton>
                                            <CButton color="danger" size="sm" onClick={() => handleDelete(rate.id)}>
                                                <CIcon icon={cilTrash} />
                                            </CButton>
                                        </CTableDataCell>
                                    </CTableRow>
                                ))}
                            </CTableBody>
                        </CTable>
                    </CCardBody>
                </CCard>
            </CCol>

            <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
                <CModalHeader><CModalTitle>{modalMode === 'add' ? 'Add Unloading Rate' : 'Edit Unloading Rate'}</CModalTitle></CModalHeader>
                <CModalBody>
                    <CForm>
                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>Item *</CFormLabel>
                                <CFormSelect name="itemId" value={formData.itemId} onChange={handleChange} required>
                                    <option value="">Select Item</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </CFormSelect>
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel>Unit *</CFormLabel>
                                <CFormSelect name="unitId" value={formData.unitId} onChange={handleChange} required>
                                    <option value="">Select Unit</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </CFormSelect>
                            </CCol>
                        </CRow>
                        <CRow className="mb-3">
                            <CCol md={6}>
                                <CFormLabel>location *</CFormLabel>
                                <CFormSelect name="locationId" value={formData.locationId} onChange={handleChange} required>
                                    <option value="">Select location</option>
                                    {locations.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </CFormSelect>
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel>Rate (₹) *</CFormLabel>
                                <CFormInput type="number" name="rate" value={formData.rate} onChange={handleChange} required />
                            </CCol>
                        </CRow>
                        <CFormCheck label="Active" name="isActive" checked={formData.isActive} onChange={handleChange} />
                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
                    <CButton color="primary" onClick={handleSave} disabled={loading}>Save</CButton>
                </CModalFooter>
            </CModal>
        </CRow>
    )
}

export default UnloadingRates
