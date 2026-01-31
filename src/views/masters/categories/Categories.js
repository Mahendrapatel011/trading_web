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

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  })

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Load all categories
  const loadCategories = async () => {
    setLoading(true)
    try {
      const response = await masterApi.getCategories()
      setCategories(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (err) {
      setError('Failed to load categories')
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Open modal for add
  const handleAdd = () => {
    setModalMode('add')
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true,
      sortOrder: 0,
    })
    setCurrentCategory(null)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  // Open modal for edit
  const handleEdit = (category) => {
    setModalMode('edit')
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
    })
    setCurrentCategory(category)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  // Save category (create or update)
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
        await masterApi.createCategory(formData)
        setSuccess('Category created successfully!')
      } else {
        await masterApi.updateCategory(currentCategory._id, formData)
        setSuccess('Category updated successfully!')
      }
      
      await loadCategories()
      setShowModal(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  // Delete category
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await masterApi.deleteCategory(id)
      setSuccess('Category deleted successfully!')
      await loadCategories()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Categories Management</strong>
            <CButton color="primary" size="sm" onClick={handleAdd}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Category
            </CButton>
          </CCardHeader>
          <CCardBody>
            {/* Alert Messages */}
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

            {/* Loading State */}
            {loading && !showModal && (
              <div className="text-center py-4">
                <CSpinner color="primary" />
                <div className="mt-2">Loading...</div>
              </div>
            )}

            {/* Categories Table */}
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
                  {categories.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        No categories found. Click "Add Category" to create one.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    categories.map((category, index) => (
                      <CTableRow key={category._id}>
                        <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{category.name}</CTableDataCell>
                        <CTableDataCell>
                          <code>{category.code}</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          {category.description || '-'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {category.isActive ? (
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
                        <CTableDataCell>{category.sortOrder}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(category)}
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(category._id)}
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

      {/* Add/Edit Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="name">
                  Category Name <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
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
                  placeholder="Enter code (e.g., CAT01)"
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
                  placeholder="Enter category description"
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
              'Save Category'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Categories

