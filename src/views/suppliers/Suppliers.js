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
import { cilPlus, cilPencil, cilTrash, cilDescription, cilFile } from '@coreui/icons'
import { supplierApi, locationApi } from '../../api/reservationApi'
import Toast from '../../components/common/Toast'
import { useToast } from '../../components/common/useToast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel } from '../../utils/excelExport'

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
        panCard: '',
        address: '',
    })

    // Get current user role and location from auth
    const { user } = useAuth()
    const storedUser = user || {}
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
                panCard: supplier.panCard || '',
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
                panCard: '',
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
            panCard: '',
            address: '',
        })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Mandatory Validations
        if (!formData.name?.trim()) {
            showToast('Party Name is required', 'error')
            return
        }
        if (!formData.mobileNo?.trim()) {
            showToast('Mobile Number is required', 'error')
            return
        }
        if (formData.mobileNo.length < 10) {
            showToast('Enter a valid 10-digit mobile number', 'error')
            return
        }
        if (!formData.address?.trim()) {
            showToast('Address is required', 'error')
            return
        }
        // Aadhar Card and Email are optional
        if (formData.aadharCard?.trim() && formData.aadharCard.trim().length !== 12) {
            showToast('Enter a valid 12-digit Aadhar number', 'error')
            return
        }
        if (isSuperAdmin && !formData.locationId) {
            showToast('Location is required', 'error')
            return
        }

        // Email validation if provided
        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            showToast('Please enter a valid email address', 'error')
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

    const exportToPDF = () => {
        if (!suppliers || suppliers.length === 0) {
            showToast('No data available to export', 'error')
            return
        }

        try {
            const doc = new jsPDF('p', 'mm', 'a4') // Portrait orientation for A4 paper

            const location = storedUser?.location || {}
            const locationName = location.name || 'TRADING SYSTEM'
            const companyName = location.nameHindi || locationName.toUpperCase()
            const companyAddress = location.addressHindi || ''
            const companyOffice = location.officeHindi || ''

            let y = 10

            // Header Section
            doc.setFontSize(20)
            doc.setTextColor(40, 40, 40)
            doc.setFont(undefined, 'bold')
            doc.text(companyName, 105, y + 5, { align: 'center' })

            y += 11

            doc.setFontSize(10)
            doc.setFont(undefined, 'normal')
            if (companyAddress) {
                doc.text(companyAddress, 105, y, { align: 'center' })
                y += 5
            }
            if (companyOffice) {
                doc.text(companyOffice, 105, y, { align: 'center' })
                y += 5
            }

            // Add Title
            doc.setFontSize(16)
            doc.setTextColor(40)
            doc.setFont(undefined, 'bold')
            doc.text('SUPPLIER INFORMATION LIST', 105, y + 3, { align: 'center' })

            // Add Subtitle/Date
            doc.setFontSize(9)
            doc.setTextColor(100)
            doc.setFont(undefined, 'normal')
            doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 200, y + 10, {
                align: 'right',
            })

            const startYTable = y + 16

            const tableColumn = [
                'SNo',
                'Name',
                'Mobile',
                'WhatsApp',
                'Email',
                'Aadhar',
                'PAN',
                'Address',
            ]
            const tableRows = suppliers.map((s, i) => [
                i + 1,
                s.name || '-',
                s.mobileNo || '-',
                s.whatsappNo || '-',
                s.email || '-',
                s.aadharCard || '-',
                s.panCard || '-',
                s.address || '-',
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: startYTable,
                theme: 'grid', // Gives it the "Excel" table structure look
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    lineColor: [200, 200, 200], // Subtle borders
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [45, 52, 54], // Darker professional header
                    textColor: [255, 255, 255],
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 8,
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // S.No
                    1: { cellWidth: 'auto', fontStyle: 'bold' }, // Name
                    2: { cellWidth: 25, halign: 'center' }, // Mobile
                    3: { cellWidth: 25, halign: 'center' }, // WhatsApp
                    4: { cellWidth: 35 }, // Email
                    5: { cellWidth: 25, halign: 'center' }, // Aadhar
                    6: { cellWidth: 15, halign: 'center' }, // PAN
                    7: { cellWidth: 'auto' }, // Address
                },
                alternateRowStyles: {
                    fillColor: [250, 251, 252],
                },
                margin: { top: startYTable, left: 10, right: 10, bottom: 40 }, // Standard A4 margins
                didDrawPage: (data) => {
                    // Manager Details
                    const managerName = location.managerName || 'Manager'
                    const managerPhone = location.phone || ''
                    const pageSize = doc.internal.pageSize
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()

                    doc.setFontSize(10)
                    doc.setFont('helvetica', 'bold')
                    doc.setTextColor(40, 40, 40)
                    doc.text('______________________', 190, pageHeight - 30, { align: 'right' })
                    doc.text(managerName, 190, pageHeight - 24, { align: 'right' })
                    if (managerPhone) {
                        doc.setFont('helvetica', 'normal')
                        doc.text(managerPhone, 190, pageHeight - 19, { align: 'right' })
                    }

                    // Footer with Page Number
                    const str = `Page ${doc.internal.getNumberOfPages()}`
                    doc.setFontSize(8)
                    doc.setTextColor(150)
                    doc.text(str, data.settings.margin.left, pageHeight - 10)
                },
            })

            doc.save('Suppliers_List.pdf')
            showToast('PDF downloaded successfully (A4 Portrait)', 'success')
        } catch (error) {
            console.error('PDF Export error:', error)
            showToast('Failed to generate PDF', 'error')
        }
    }

    const handleExcelExport = () => {
        if (!suppliers || suppliers.length === 0) {
            showToast('No data available to export', 'error')
            return
        }

        const excelData = suppliers.map((s, i) => ({
            'S.No': i + 1,
            'Name': s.name || '-',
            'Mobile': s.mobileNo || '-',
            'WhatsApp': s.whatsappNo || '-',
            'Email': s.email || '-',
            'Aadhar': s.aadharCard || '-',
            'PAN': s.panCard || '-',
            'Address': s.address || '-',
        }))

        excelData.push({
            'S.No': 'TOTAL',
            'Name': `${suppliers.length} Parties`,
            'Mobile': '',
            'WhatsApp': '',
            'Email': '',
            'Aadhar': '',
            'PAN': '',
            'Address': '',
        })

        exportToExcel(excelData, 'Parties_List')
        showToast('Excel exported successfully', 'success')
    }

    return (
        <>
            <Toast toast={toast} hideToast={hideToast} />
            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4">
                        <CCardHeader className="d-flex justify-content-between align-items-center">
                            <strong>Party Management</strong>
                            <div className="d-flex gap-2">
                                <CButton color="success" className="text-white" onClick={handleExcelExport}>
                                    <CIcon icon={cilFile} className="me-2" />
                                    Export Excel
                                </CButton>
                                <CButton color="info" className="text-white" onClick={exportToPDF}>
                                    <CIcon icon={cilDescription} className="me-2" />
                                    Export PDF
                                </CButton>
                                <CButton color="primary" onClick={() => handleOpenModal()}>
                                    <CIcon icon={cilPlus} className="me-2" />
                                    Add Party
                                </CButton>
                            </div>
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
                                <CFormLabel>Mobile No. *</CFormLabel>
                                <CFormInput
                                    name="mobileNo"
                                    value={formData.mobileNo}
                                    onChange={handleInputChange}
                                    required
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
                                <CFormLabel>Email (Optional)</CFormLabel>
                                <CFormInput
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Address *</CFormLabel>
                                <CFormInput
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>Aadhar Card (Optional)</CFormLabel>
                                <CFormInput
                                    name="aadharCard"
                                    value={formData.aadharCard}
                                    onChange={handleInputChange}
                                    maxLength={12}
                                />
                            </CCol>
                            <CCol md={6} className="mb-3">
                                <CFormLabel>PAN Card (Optional)</CFormLabel>
                                <CFormInput
                                    name="panCard"
                                    value={formData.panCard}
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
