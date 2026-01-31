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
  cilPhone,
  cilHome,
} from '@coreui/icons'
import { masterApi } from '../../../api/reservationApi'

const Agents = () => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [currentAgent, setCurrentAgent] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    address: '',
    commission: 0,
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    setLoading(true)
    try {
      const response = await masterApi.getAgents()
      setAgents(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (err) {
      setError('Failed to load agents')
      console.error('Error loading agents:', err)
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
      phone: '',
      address: '',
      commission: 0,
      isActive: true,
      sortOrder: 0,
    })
    setCurrentAgent(null)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleEdit = (agent) => {
    setModalMode('edit')
    setFormData({
      name: agent.name,
      code: agent.code,
      phone: agent.phone || '',
      address: agent.address || '',
      commission: agent.commission || 0,
      isActive: agent.isActive,
      sortOrder: agent.sortOrder || 0,
    })
    setCurrentAgent(agent)
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
        await masterApi.createAgent(formData)
        setSuccess('Agent created successfully!')
      } else {
        await masterApi.updateAgent(currentAgent._id, formData)
        setSuccess('Agent updated successfully!')
      }
      
      await loadAgents()
      setShowModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save agent')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await masterApi.deleteAgent(id)
      setSuccess('Agent deleted successfully!')
      await loadAgents()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Agents Management</strong>
            <CButton color="primary" size="sm" onClick={handleAdd}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Agent
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
                    <CTableHeaderCell scope="col">Phone</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Commission %</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Sort Order</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {agents.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center">
                        No agents found. Click "Add Agent" to create one.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    agents.map((agent, index) => (
                      <CTableRow key={agent._id}>
                        <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                        <CTableDataCell>{agent.name}</CTableDataCell>
                        <CTableDataCell>
                          <code>{agent.code}</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          {agent.phone ? (
                            <>
                              <CIcon icon={cilPhone} size="sm" className="me-1" />
                              {agent.phone}
                            </>
                          ) : (
                            '-'
                          )}
                        </CTableDataCell>
                        <CTableDataCell>{agent.commission}%</CTableDataCell>
                        <CTableDataCell>
                          {agent.isActive ? (
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
                        <CTableDataCell>{agent.sortOrder}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="info"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(agent)}
                          >
                            <CIcon icon={cilPencil} size="sm" />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(agent._id)}
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
            {modalMode === 'add' ? 'Add New Agent' : 'Edit Agent'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="name">
                  Agent Name <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter agent name"
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
                  placeholder="Enter code (e.g., AGT01)"
                  required
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="phone">Phone</CFormLabel>
                <CFormInput
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="commission">Commission (%)</CFormLabel>
                <CFormInput
                  type="number"
                  id="commission"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel htmlFor="address">Address</CFormLabel>
                <CFormTextarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter agent address"
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
              'Save Agent'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default Agents

