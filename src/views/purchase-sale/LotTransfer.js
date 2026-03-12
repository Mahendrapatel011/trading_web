import React, { useState, useEffect, useRef } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCol,
    CRow,
    CForm,
    CFormInput,
    CFormLabel,
    CInputGroup,
    CInputGroupText,
    CListGroup,
    CListGroupItem,
    CSpinner,
    CFormSelect,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CPagination,
    CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilTransfer, cilHistory, cilFile } from '@coreui/icons'
import { purchaseApi, supplierApi, saleApi } from '../../api/reservationApi'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel } from '../../utils/excelExport'

const LotTransfer = () => {
    const { user } = useAuth()
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [purchaseData, setPurchaseData] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // History State
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historyPage, setHistoryPage] = useState(1)
    const [historyTotalPages, setHistoryTotalPages] = useState(1)

    // Form State
    const [transferForm, setTransferForm] = useState({
        purchaseId: '',
        transferDate: new Date().toISOString().split('T')[0],
        transferPartyId: '',
        transferPartyName: '',
        noOfPacket: '',
        netWt: '',
        newRate: '',
    })

    // Search states
    const [lotSearch, setLotSearch] = useState('')
    const [showLotList, setShowLotList] = useState(false)
    const [partySearch, setPartySearch] = useState('')
    const [showPartyList, setShowPartyList] = useState(false)

    // Selection info
    const [selectedPurchase, setSelectedPurchase] = useState(null)

    const lotListRef = useRef(null)
    const partyListRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (lotListRef.current && !lotListRef.current.contains(event.target)) {
                setShowLotList(false)
            }
            if (partyListRef.current && !partyListRef.current.contains(event.target)) {
                setShowPartyList(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchData()
        fetchHistory()
    }, [currentYear, historyPage])

    const fetchInitialData = async () => {
        try {
            const suppliersRes = await supplierApi.getAll()
            setSuppliers(suppliersRes.data.data)
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await saleApi.getGrouped(currentYear)
            setPurchaseData(response.data.data)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
            const response = await purchaseApi.getTransferHistory({
                year: currentYear,
                page: historyPage,
                limit: 10
            })
            setHistory(response.data.data.data)
            setHistoryTotalPages(response.data.data.totalPages)
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setHistoryLoading(false)
        }
    }

    const selectPurchase = (p) => {
        setSelectedPurchase(p)
        const owner = p.purchasedFor?.name || p.supplier?.name || ''

        setTransferForm(prev => ({
            ...prev,
            purchaseId: p.id,
            noOfPacket: p.noOfPacket,
            netWt: p.netWt,
            newRate: p.rate // Default to current rate
        }))
        setLotSearch(`Lot ${p.lotNo} - ${owner}`)
        setShowLotList(false)
    }

    const selectParty = (s) => {
        setTransferForm(prev => ({
            ...prev,
            transferPartyId: s.id,
            transferPartyName: s.name
        }))
        setPartySearch(s.name)
        setShowPartyList(false)
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setTransferForm(prev => ({ ...prev, [name]: value }))
    }

    const handleTransfer = async () => {
        if (!transferForm.purchaseId || !transferForm.transferPartyId || !transferForm.newRate) {
            alert('Please select Lot, Transfer Party and enter New Rate')
            return
        }

        if (!window.confirm(`Are you sure you want to transfer this lot to ${transferForm.transferPartyName}? This will update the owner in Purchase record.`)) return

        setSaving(true)
        try {
            await purchaseApi.lotTransfer(transferForm)
            alert('Lot Transferred Successfully!')
            // Reset form
            setLotSearch('')
            setPartySearch('')
            setSelectedPurchase(null)
            setTransferForm({
                purchaseId: '',
                transferDate: new Date().toISOString().split('T')[0],
                transferPartyId: '',
                transferPartyName: '',
                noOfPacket: '',
                netWt: '',
                newRate: '',
            })
            fetchData()
            fetchHistory()
        } catch (error) {
            console.error('Error transferring lot:', error)
            alert(error.response?.data?.message || 'Error saving transfer data')
        } finally {
            setSaving(false)
        }
    }

    const handleExportExcel = () => {
        if (!history || history.length === 0) {
            alert('No data available to export')
            return
        }

        const excelData = history.map(item => ({
            'Date': item.transferDate?.split('-').reverse().join('.'),
            'Lot No': item.purchase?.lotNo,
            'From (Old Owner)': item.previousOwner?.name || '-',
            'To (New Owner)': item.newOwner?.name || '-',
            'Packets': item.noOfPacket,
            'Net Weight': item.netWt,
            'New Rate': item.newRate,
            'Loading Amt': item.purchase?.loadingLabour || '0.00',
            'New Cost': ((parseFloat(item.netWt) || 0) * (parseFloat(item.newRate) || 0) + parseFloat(item.purchase?.loadingLabour || 0)).toFixed(2)
        }))

        const totalPkt = history.reduce((sum, item) => sum + (parseInt(item.noOfPacket) || 0), 0)
        const totalWt = history.reduce((sum, item) => sum + (parseFloat(item.netWt) || 0), 0)
        const totalLoading = history.reduce((sum, item) => sum + (parseFloat(item.purchase?.loadingLabour) || 0), 0)
        const totalNewCost = history.reduce((sum, item) => sum + ((parseFloat(item.netWt) || 0) * (parseFloat(item.newRate) || 0) + parseFloat(item.purchase?.loadingLabour || 0)), 0)

        excelData.push({
            'Date': 'TOTAL',
            'Lot No': '',
            'From (Old Owner)': '',
            'To (New Owner)': '',
            'Packets': totalPkt,
            'Net Weight': totalWt.toFixed(3),
            'New Rate': '',
            'Loading Amt': totalLoading.toFixed(2),
            'New Cost': totalNewCost.toFixed(2)
        })

        exportToExcel(excelData, `Lot_Transfer_History_${currentYear}`)
    }

    const filteredLots = purchaseData.filter(p => {
        const owner = p.purchasedFor?.name || p.supplier?.name || ''
        return p.lotNo?.toString().includes(lotSearch) || owner.toLowerCase().includes(lotSearch.toLowerCase())
    })

    const filteredParties = suppliers.filter(s =>
        s.name?.toLowerCase().includes(partySearch.toLowerCase())
    )

    return (
        <div className="lot-transfer-panel">
            <style>{`
                .transfer-card {
                    max-width: 950px;
                    margin: 0 auto;
                    border-radius: 15px;
                    border: none;
                }
                .transfer-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px 15px 0 0;
                }
                .section-header {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 5px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .lot-info-box {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }
                .history-table th {
                    background: #f8fafc !important;
                    font-size: 0.7rem !important;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 700;
                }
                .history-table td {
                    font-size: 0.75rem !important;
                    vertical-align: middle;
                }
            `}</style>

            <CRow className="mb-3">
                <CCol md={2}>
                    <div style={{ background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                        <label className="mb-0 me-2 small fw-bold text-uppercase">Year</label>
                        <CFormSelect size="sm" style={{ width: '80px', display: 'inline-block' }} value={currentYear} onChange={(e) => { setCurrentYear(e.target.value); setHistoryPage(1); }}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </CFormSelect>
                    </div>
                </CCol>
            </CRow>

            <CCard className="transfer-card shadow-lg mb-5">
                <div className="transfer-header">
                    <div className="d-flex align-items-center">
                        <div className="bg-primary p-2 rounded-3 me-3">
                            <CIcon icon={cilTransfer} size="xl" />
                        </div>
                        <div>
                            <h4 className="mb-0 fw-bold">LOT TRANSFER</h4>
                            <p className="mb-0 small opacity-75">Change lot ownership (Malik Change)</p>
                        </div>
                    </div>
                </div>
                <CCardBody className="p-4">
                    <CForm>
                        <CRow className="g-4">
                            {/* Lot Selection */}
                            <CCol md={6}>
                                <div className="section-header">1. Select Purchase Lot</div>
                                <div className="position-relative">
                                    <CFormLabel className="small fw-bold">Search Lot No / Malik Name *</CFormLabel>
                                    <CInputGroup size="sm">
                                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                                        <CFormInput
                                            placeholder="Type Lot No..."
                                            value={lotSearch}
                                            onChange={(e) => { setLotSearch(e.target.value); setShowLotList(true); }}
                                            onFocus={() => setShowLotList(true)}
                                        />
                                    </CInputGroup>
                                    {showLotList && lotSearch && (
                                        <CListGroup className="position-absolute w-100 shadow-lg border-0" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }} ref={lotListRef}>
                                            {filteredLots.map(p => (
                                                <CListGroupItem key={p.id} onClick={() => selectPurchase(p)} className="small py-2 border-bottom" style={{ cursor: 'pointer' }}>
                                                    <strong>Lot {p.lotNo}</strong> - {p.purchasedFor?.name || p.supplier?.name}
                                                </CListGroupItem>
                                            ))}
                                        </CListGroup>
                                    )}
                                </div>

                                {selectedPurchase && (
                                    <div className="lot-info-box mt-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="small text-muted">Current Owner:</span>
                                            <span className="fw-bold">{selectedPurchase.purchasedFor?.name || selectedPurchase.supplier?.name}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="small text-muted">Item:</span>
                                            <span className="fw-bold">{selectedPurchase.item?.name}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="small text-muted">Stock:</span>
                                            <span className="fw-bold">{selectedPurchase.noOfPacket} Pkt | {selectedPurchase.netWt} Qtl</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="small text-muted">Rate:</span>
                                            <span className="fw-bold">₹ {selectedPurchase.rate}</span>
                                        </div>
                                    </div>
                                )}
                            </CCol>

                            {/* Transfer To */}
                            <CCol md={6}>
                                <div className="section-header">2. Transfer To Party</div>
                                <div className="position-relative mb-3">
                                    <CFormLabel className="small fw-bold">Transfer Party (New Owner) *</CFormLabel>
                                    <CInputGroup size="sm">
                                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                                        <CFormInput
                                            placeholder="Search Party Name..."
                                            value={partySearch}
                                            onChange={(e) => { setPartySearch(e.target.value); setShowPartyList(true); setTransferForm({ ...transferForm, transferPartyName: e.target.value }); }}
                                            onFocus={() => setShowPartyList(true)}
                                        />
                                    </CInputGroup>
                                    {showPartyList && partySearch && (
                                        <CListGroup className="position-absolute w-100 shadow-lg border-0" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }} ref={partyListRef}>
                                            {filteredParties.map((s, idx) => (
                                                <CListGroupItem key={idx} onClick={() => selectParty(s)} className="small py-2 border-bottom" style={{ cursor: 'pointer' }}>{s.name}</CListGroupItem>
                                            ))}
                                        </CListGroup>
                                    )}
                                </div>

                                <CFormLabel className="small fw-bold">Transfer Date</CFormLabel>
                                <CFormInput type="date" size="sm" name="transferDate" value={transferForm.transferDate} onChange={handleFormChange} />
                            </CCol>
                        </CRow>

                        <hr className="my-4" />

                        <div className="section-header">3. Transfer Details</div>
                        <CRow className="g-2 align-items-end">
                            <CCol md={1}>
                                <CFormLabel className="small fw-bold text-muted" style={{ fontSize: '0.65rem' }}>Packets</CFormLabel>
                                <CFormInput size="sm" value={transferForm.noOfPacket} disabled className="bg-light px-1" />
                            </CCol>
                            <CCol md={1}>
                                <CFormLabel className="small fw-bold text-muted" style={{ fontSize: '0.65rem' }}>Wt(Qtl)</CFormLabel>
                                <CFormInput size="sm" value={transferForm.netWt} disabled className="bg-light px-1" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold text-primary">Rate *</CFormLabel>
                                <CFormInput type="number" size="sm" name="newRate" value={transferForm.newRate} onChange={handleFormChange} className="border-primary" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold text-muted">Loading Amt</CFormLabel>
                                <CFormInput
                                    size="sm"
                                    value={selectedPurchase?.loadingLabour || '0.00'}
                                    disabled
                                    className="bg-light fw-bold"
                                />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold text-muted">Total Cost</CFormLabel>
                                <CFormInput
                                    size="sm"
                                    value={selectedPurchase?.totalCost || '0.00'}
                                    disabled
                                    className="bg-light fw-bold text-danger"
                                />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold" style={{ color: '#10b981' }}>New Cost</CFormLabel>
                                <CFormInput
                                    size="sm"
                                    value={((parseFloat(transferForm.netWt) || 0) * (parseFloat(transferForm.newRate) || 0) + parseFloat(selectedPurchase?.loadingLabour || 0)).toFixed(2)}
                                    disabled
                                    className="bg-light fw-bold"
                                    style={{ color: '#10b981' }}
                                />
                            </CCol>
                            <CCol md={2}>
                                <div className="text-end">
                                    <CButton color="dark" className="w-100 fw-bold" onClick={handleTransfer} disabled={saving} style={{ fontSize: '0.65rem', padding: '8px 2px' }}>
                                        {saving ? <CSpinner size="sm" /> : 'CONVERT & TRANSFER'}
                                    </CButton>
                                </div>
                            </CCol>
                        </CRow>
                    </CForm>
                </CCardBody>
            </CCard>

            {/* History Section */}
            <CCard className="transfer-card shadow-sm border-0 bg-white">
                <CCardBody className="p-4">
                    <div className="section-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <CIcon icon={cilHistory} className="text-primary" />
                            LOT TRANSFER HISTORY
                        </div>
                        <CButton color="success" size="sm" className="text-white" onClick={handleExportExcel}>
                            <CIcon icon={cilFile} className="me-2" />
                            Export Excel
                        </CButton>
                    </div>

                    <div className="table-responsive">
                        <CTable hover className="history-table mb-0">
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>Date</CTableHeaderCell>
                                    <CTableHeaderCell>Lot No.</CTableHeaderCell>
                                    <CTableHeaderCell>From (Old Owner)</CTableHeaderCell>
                                    <CTableHeaderCell>To (New Owner)</CTableHeaderCell>
                                    <CTableHeaderCell>Weight</CTableHeaderCell>
                                    <CTableHeaderCell>Rate</CTableHeaderCell>
                                    <CTableHeaderCell>Loading Amt</CTableHeaderCell>
                                    <CTableHeaderCell>New Cost</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {historyLoading ? (
                                    <CTableRow><CTableDataCell colSpan={7} className="text-center py-4"><CSpinner size="sm" /></CTableDataCell></CTableRow>
                                ) : history.length === 0 ? (
                                    <CTableRow><CTableDataCell colSpan={7} className="text-center py-4 text-muted">No transfer history found</CTableDataCell></CTableRow>
                                ) : (
                                    history.map(item => (
                                        <CTableRow key={item.id}>
                                            <CTableDataCell>{item.transferDate?.split('-').reverse().join('.')}</CTableDataCell>
                                            <CTableDataCell className="fw-bold text-primary">Lot {item.purchase?.lotNo}</CTableDataCell>
                                            <CTableDataCell className="text-muted">{item.previousOwner?.name}</CTableDataCell>
                                            <CTableDataCell className="fw-bold text-success">{item.newOwner?.name}</CTableDataCell>
                                            <CTableDataCell>{item.noOfPacket} ps | {item.netWt} Qtl</CTableDataCell>
                                            <CTableDataCell><span className="fw-bold text-danger">₹ {item.newRate}</span></CTableDataCell>
                                            <CTableDataCell className="fw-bold">
                                                ₹ {item.purchase?.loadingLabour || '0.00'}
                                            </CTableDataCell>
                                            <CTableDataCell className="fw-bold" style={{ color: '#10b981' }}>
                                                ₹ {((parseFloat(item.netWt) || 0) * (parseFloat(item.newRate) || 0) + parseFloat(item.purchase?.loadingLabour || 0)).toFixed(2)}
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                            </CTableBody>
                        </CTable>
                    </div>

                    {historyTotalPages > 1 && (
                        <div className="mt-3 d-flex justify-content-end">
                            <CPagination size="sm">
                                <CPaginationItem disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</CPaginationItem>
                                {[...Array(historyTotalPages)].map((_, i) => (
                                    <CPaginationItem key={i} active={historyPage === i + 1} onClick={() => setHistoryPage(i + 1)}>
                                        {i + 1}
                                    </CPaginationItem>
                                ))}
                                <CPaginationItem disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage(p => p + 1)}>Next</CPaginationItem>
                            </CPagination>
                        </div>
                    )}
                </CCardBody>
            </CCard>
        </div>
    )
}

export default LotTransfer
