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
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import { supplierApi, locationApi } from '../../api/reservationApi'
import Toast from '../../components/common/Toast'
import { useToast } from '../../components/common/useToast'

const Suppliers = () => {
    const { toast, showToast, hideToast } = useToast()
    const [suppliers, setSuppliers] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        locationId: '',
        mobileNo: '',
        whatsappNo: '',
        email: '',
        aadharCard: '',
        address: '',
    })

    // Get current user role and location from auth (assuming it's stored in localStorage for now, or we can use a hook)
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const isSuperAdmin = storedUser?.role === 'super_admin'
    const userLocationId = storedUser?.locationId

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [suppliersRes, locationsRes] = await Promise.all([
                isSuperAdmin ? supplierApi.getAllAdmin() : supplierApi.getAll(),
                locationApi.getAll(),
            ])
            setSuppliers(suppliersRes.data.data || [])
            setLocations(locationsRes.data.data || [])
        } catch (error) {
            showToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier)
            setFormData({
                name: supplier.name || '',
                locationId: supplier.locationId || '',
                mobileNo: supplier.mobileNo || '',
                whatsappNo: supplier.whatsappNo || '',
                email: supplier.email || '',
                aadharCard: supplier.aadharCard || '',
                address: supplier.address || '',
            })
        } else {
            setEditingSupplier(null)
            setFormData({
                name: '',
                locationId: isSuperAdmin ? '' : userLocationId,
                mobileNo: '',
                whatsappNo: '',
                email: '',
                aadharCard: '',
                address: '',
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingSupplier(null)
        setFormData({
            name: '',
            locationId: '',
            mobileNo: '',
            whatsappNo: '',
            email: '',
            aadharCard: '',
            address: '',
        })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name) {
            showToast('Name is required', 'error')
            return
        }
        if (isSuperAdmin && !formData.locationId) {
            showToast('Location is required', 'error')
            return
        }

        setLoading(true)
        try {
            if (editingSupplier) {
                await supplierApi.update(editingSupplier.id, formData)
                showToast('Party updated successfully', 'success')
            } else {
                await supplierApi.create(formData)
                showToast('Party created successfully', 'success')
            }
            handleCloseModal()
            loadData()
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save party', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this party?')) {
            setLoading(true)
            try {
                await supplierApi.delete(id)
                showToast('Party deleted successfully', 'success')
                loadData()
            } catch (error) {
                showToast(error.response?.data?.message || 'Failed to delete party', 'error')
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <>
            <Toast toast={toast} hideToast={hideToast} />
            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4">
                        <CCardHeader className="d-flex justify-content-between align-items-center">
                            <strong>Party Management</strong>
                            <CButton color="primary" onClick={() => handleOpenModal()}>
                                <CIcon icon={cilPlus} className="me-2" />
                                Add Party
                            </CButton>
                        </CCardHeader>
                        <CCardBody>
                            <CTable hover responsive>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>Name</CTableHeaderCell>
                                        
                                        <CTableHeaderCell>Mobile</CTableHeaderCell>
                                        <CTableHeaderCell>WhatsApp</CTableHeaderCell>
                                        <CTableHeaderCell>Address</CTableHeaderCell>
                                        <CTableHeaderCell>Actions</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {suppliers.map((supplier) => (
                                        <CTableRow key={supplier.id}>
                                            <CTableDataCell>{supplier.name}</CTableDataCell>
                                       
                                            <CTableDataCell>{supplier.mobileNo || '-'}</CTableDataCell>
                                            <CTableDataCell>{supplier.whatsappNo || '-'}</CTableDataCell>
                                            <CTableDataCell>{supplier.address || '-'}</CTableDataCell>
                                            <CTableDataCell>
                                                <CButton
                                                    color="info"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleOpenModal(supplier)}
                                                >
                                                    <CIcon icon={cilPencil} />
                                                </CButton>
                                                <CButton
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(supplier.id)}
                                                >
                                                    <CIcon icon={cilTrash} />
                                                </CButton>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))}
                                    {suppliers.length === 0 && (
                                        <CTableRow>
                                            <CTableDataCell colSpan="6" className="text-center">
                                                No parties found
                                            </CTableDataCell>
                                        </CTableRow>
                                    )}
                                </CTableBody>
                            </CTable>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            <CModal visible={showModal} onClose={handleCloseModal} size="lg">
                <CModalHeader>
                    <CModalTitle>{editingSupplier ? 'Edit Party' : 'Add Party'}</CModalTitle>
                </CModalHeader>
                <CForm onSubmit={handleSubmit}>
                    <CModalBody>
                        <CRow>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Party Name *</CFormLabel>
                                <CFormInput
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </CCol>
                            {isSuperAdmin && (
                                <CCol md={6} className="mb-3">
                                    <CFormLabel>Location *</CFormLabel>
                                    <CFormSelect
                                        name="locationId"
                                        value={formData.locationId}
                                        onChange={handleInputChange}
                                        required
                                        disabled={!isSuperAdmin && !editingSupplier}
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </CFormSelect>
                                </CCol>
                            )}
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Mobile No.</CFormLabel>
                                <CFormInput
                                    name="mobileNo"
                                    value={formData.mobileNo}
                                    onChange={handleInputChange}
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>WhatsApp No.</CFormLabel>
                                <CFormInput
                                    name="whatsappNo"
                                    value={formData.whatsappNo}
                                    onChange={handleInputChange}
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Email</CFormLabel>
                                <CFormInput
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Address</CFormLabel>
                                <CFormInput
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Aadhar Card</CFormLabel>
                                <CFormInput
                                    name="aadharCard"
                                    value={formData.aadharCard}
                                    onChange={handleInputChange}
                                />
                            </CCol>
                        </CRow>
                    </CModalBody>
                    <CModalFooter>
                        <CButton color="secondary" onClick={handleCloseModal}>
                            Cancel
                        </CButton>
                        <CButton type="submit" color="primary" disabled={loading}>
                            {loading ? <CSpinner size="sm" /> : editingSupplier ? 'Update' : 'Save'}
                        </CButton>
                    </CModalFooter>
                </CForm>
            </CModal>
        </>
    )
}

export default Suppliers
