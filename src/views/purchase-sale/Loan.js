import React, { useState, useEffect, useRef } from 'react'
import {
    CButton,
    CCard,
    CCardBody,
    CCol,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CForm,
    CFormInput,
    CFormLabel,
    CInputGroup,
    CInputGroupText,
    CListGroup,
    CListGroupItem,
    CSpinner,
    CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSearch, cilFile } from '@coreui/icons'
import { loanApi, purchaseApi, interestRateApi, saleApi } from '../../api/reservationApi'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel } from '../../utils/excelExport'

const Loan = () => {
    const { isImpersonating } = useAuth()
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [loanData, setLoanData] = useState([])
    const [purchaseData, setPurchaseData] = useState([])
    const [loading, setLoading] = useState(false)
    const [interestRate, setInterestRate] = useState(0)

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLotNo, setFilterLotNo] = useState('')

    // State for modals
    const [loanModalVisible, setLoanModalVisible] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(null)

    // Form State
    const [loanForm, setLoanForm] = useState({
        purchaseId: '',
        loanDt: new Date().toISOString().split('T')[0],
        loanAmount: '',
        repaymentDt: '',
        payRecd: '',
        interest: '0',
        remarks: '',
        repayments: [{ repaymentDt: new Date().toISOString().split('T')[0], amount: '' }]
    })


    // Search states
    const [lotSearch, setLotSearch] = useState('')
    const [showLotList, setShowLotList] = useState(false)

    // Additional info for selected lot
    const [selectedLotInfo, setSelectedLotInfo] = useState({
        owner: '',
        item: '',
        lotNo: ''
    })

    const lotListRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (lotListRef.current && !lotListRef.current.contains(event.target)) {
                setShowLotList(false)
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
        fetchLotData()
    }, [currentYear])

    const fetchInitialData = async () => {
        try {
            const rateRes = await interestRateApi.getAll()
            if (rateRes.data.data && rateRes.data.data.length > 0) {
                setInterestRate(rateRes.data.data[0].rate)
            }
        } catch (error) {
            console.error('Error fetching interest rate:', error)
        }
    }

    const fetchLotData = async () => {
        try {
            const res = await saleApi.getGrouped(currentYear)
            setPurchaseData(res.data.data)
        } catch (err) {
            console.error('Error fetching lot data:', err)
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await loanApi.getAll(currentYear)
            setLoanData(response.data.data)
        } catch (error) {
            console.error('Error fetching loans:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateInterest = (amount, startDt, endDt) => {
        if (!amount || !startDt || !endDt) return 0

        const start = new Date(startDt)
        const end = new Date(endDt)

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0

        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Convert days to months (Standard: 30 days = 1 month)
        const months = diffDays / 30

        // Simple Interest Formula: (P * R * T) / 100
        // If interestRate is annual, months/12. If interestRate is monthly, just months.
        // Usually in this business, interest is monthly. Let's assume Rate is monthly as per common practice,
        // but if it's "Annual" in model, we divide by 12.
        // User said "proper standard calculation". I'll use Monthly Rate logic if rate looks like 1-2.

        const ratePerMonth = interestRate
        const interest = (parseFloat(amount) * ratePerMonth * months) / 100
        return interest.toFixed(2)
    }

    useEffect(() => {
        const principal = parseFloat(loanForm.loanAmount || 0)
        const startDt = loanForm.loanDt
        const ratePerMonth = interestRate

        if (!principal || !startDt) {
            setLoanForm(prev => ({ ...prev, interest: '0.00' }))
            return
        }

        // 1. Get valid repayments and sort them by date ASC
        const sortedRepayments = [...loanForm.repayments]
            .filter(r => r.amount && parseFloat(r.amount) > 0 && r.repaymentDt)
            .sort((a, b) => new Date(a.repaymentDt) - new Date(b.repaymentDt))

        let totalInterest = 0
        let currentPrincipal = principal
        let lastDate = new Date(startDt)

        // 2. Calculate interest in segments (Reducing Balance logic)
        sortedRepayments.forEach(rep => {
            const currentDate = new Date(rep.repaymentDt)

            // Interest for the period since last payment (or loan start)
            if (currentDate > lastDate) {
                const diffTime = Math.abs(currentDate - lastDate)
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const months = diffDays / 30

                const periodInterest = (currentPrincipal * ratePerMonth * months) / 100
                totalInterest += periodInterest
            }

            // Deduct repayment from principal for the NEXT period
            currentPrincipal -= parseFloat(rep.amount)
            lastDate = currentDate
        })

        setLoanForm(prev => ({ ...prev, interest: totalInterest.toFixed(2) }))
    }, [loanForm.loanAmount, loanForm.loanDt, loanForm.repayments, interestRate])

    const openLoanModal = () => {
        setIsEditing(false)
        setEditId(null)
        setLotSearch('')
        setSelectedLotInfo({ owner: '', item: '', lotNo: '' })
        setLoanForm({
            purchaseId: '',
            loanDt: new Date().toISOString().split('T')[0],
            loanAmount: '',
            repaymentDt: '',
            payRecd: '',
            interest: '0',
            remarks: '',
            repayments: [{ repaymentDt: new Date().toISOString().split('T')[0], amount: '' }]
        })

        setLoanModalVisible(true)
    }

    const selectPurchase = (p) => {
        const owner = p.purchasedFor?.name || p.supplier?.name || ''
        setSelectedLotInfo({
            owner: owner,
            item: p.item?.name || '',
            lotNo: p.lotNo
        })
        setLoanForm(prev => ({ ...prev, purchaseId: p.id }))
        setLotSearch(`Lot ${p.lotNo} - ${owner}`)
        setShowLotList(false)
    }

    const handleLoanChange = (e) => {
        const { name, value } = e.target
        setLoanForm(prev => ({ ...prev, [name]: value }))
    }

    const handleRepaymentChange = (index, e) => {
        const { name, value } = e.target
        const updatedRepayments = [...loanForm.repayments]
        updatedRepayments[index][name] = value

        // Calculate total repayments
        const totalPaid = updatedRepayments.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

        // Find latest date from valid sessions
        const latestDt = updatedRepayments
            .filter(r => r.amount && parseFloat(r.amount) > 0)
            .reduce((latest, r) => (!latest || r.repaymentDt > latest) ? r.repaymentDt : latest, '')

        setLoanForm(prev => ({
            ...prev,
            repayments: updatedRepayments,
            payRecd: totalPaid.toFixed(2),
            repaymentDt: latestDt
        }))
    }

    const addRepayment = () => {
        setLoanForm(prev => ({
            ...prev,
            repayments: [...prev.repayments, { repaymentDt: new Date().toISOString().split('T')[0], amount: '' }]
        }))
    }

    const removeRepayment = (index) => {
        const updatedRepayments = loanForm.repayments.filter((_, i) => i !== index)
        const totalPaid = updatedRepayments.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

        const latestDt = updatedRepayments
            .filter(r => r.amount && parseFloat(r.amount) > 0)
            .reduce((latest, r) => (!latest || r.repaymentDt > latest) ? r.repaymentDt : latest, '')

        setLoanForm(prev => ({
            ...prev,
            repayments: updatedRepayments,
            payRecd: totalPaid.toFixed(2),
            repaymentDt: latestDt
        }))
    }


    const handleLoanSave = async () => {
        if (!loanForm.purchaseId || !loanForm.loanAmount || !loanForm.loanDt) {
            alert('Please fill required fields (*)')
            return
        }
        try {
            if (isEditing) {
                await loanApi.update(editId, loanForm)
            } else {
                await loanApi.create(loanForm)
            }
            setLoanModalVisible(false)
            fetchData()
        } catch (error) {
            console.error('Error saving loan:', error)
            alert(error.response?.data?.message || 'Error saving loan data')
        }
    }

    const handleExportExcel = () => {
        if (!filteredLoans || filteredLoans.length === 0) {
            alert('No data available to export')
            return
        }

        const excelData = filteredLoans.map(l => ({
            'Lot No': l.purchase?.lotNo,
            'Party': l.purchase?.purchasedFor?.name || l.purchase?.supplier?.name || '-',
            'Dt of Loan': l.loanDt ? l.loanDt.split('-').reverse().join('.') : '-',
            'Loan Amt': l.loanAmount,
            'Dt of Repayment': l.repayments?.length > 0
                ? l.repayments.reduce((latest, r) => (!latest || r.repaymentDt > latest) ? r.repaymentDt : latest, '').split('-').reverse().join('.')
                : (l.repaymentDt ? l.repaymentDt.split('-').reverse().join('.') : '-'),
            'Repayment Amt': l.payRecd,
            'Interest': l.interest,
            'Remarks': l.remarks || '-'
        }))

        excelData.push({
            'Lot No': 'TOTAL',
            'Party': '',
            'Dt of Loan': '',
            'Loan Amt': totalLoanAmt.toFixed(2),
            'Dt of Repayment': '',
            'Repayment Amt': totalRepaid.toFixed(2),
            'Interest': totalInterst.toFixed(2),
            'Remarks': ''
        })

        exportToExcel(excelData, `Loan_Records_${currentYear}`)
    }

    const handleEditLoan = (loan) => {
        setIsEditing(true)
        setEditId(loan.id)
        const p = loan.purchase
        const owner = p?.purchasedFor?.name || p?.supplier?.name || ''

        setSelectedLotInfo({
            owner: owner,
            item: p?.item?.name || '',
            lotNo: p?.lotNo
        })

        setLotSearch(`Lot ${p?.lotNo} - ${owner}`)
        setLoanForm({
            purchaseId: loan.purchaseId,
            loanDt: loan.loanDt,
            loanAmount: loan.loanAmount,
            repaymentDt: loan.repaymentDt || '',
            payRecd: loan.payRecd,
            interest: loan.interest,
            remarks: loan.remarks || '',
            repayments: loan.repayments && loan.repayments.length > 0
                ? loan.repayments.map(r => ({ repaymentDt: r.repaymentDt, amount: r.amount }))
                : [{ repaymentDt: new Date().toISOString().split('T')[0], amount: '' }]
        })

        setLoanModalVisible(true)
    }

    const handleDeleteLoan = async (id) => {
        if (!window.confirm('Are you sure you want to delete this loan record?')) return
        try {
            await loanApi.delete(id)
            fetchData()
        } catch (error) {
            console.error('Error deleting loan:', error)
        }
    }

    // Filtering
    const filteredSearchPurchases = purchaseData.filter(p => {
        if (!lotSearch || lotSearch.startsWith('Lot ')) return true
        const owner = (p.purchasedFor?.name || p.supplier?.name || '').toLowerCase()
        const search = lotSearch.toLowerCase()
        return p.lotNo?.toString().includes(search) || owner.includes(search)
    })

    const filteredLoans = loanData.filter(l => {
        const matchesLot = filterLotNo === '' || l.purchase?.lotNo?.toString().includes(filterLotNo)
        const matchesSearch = searchTerm === '' ||
            (l.purchase?.purchasedFor?.name || l.purchase?.supplier?.name)?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesLot && matchesSearch
    })

    // Totals
    const totalLoanAmt = filteredLoans.reduce((sum, l) => sum + (parseFloat(l.loanAmount) || 0), 0)
    const totalRepaid = filteredLoans.reduce((sum, l) => sum + (parseFloat(l.payRecd) || 0), 0)
    const totalInterst = filteredLoans.reduce((sum, l) => sum + (parseFloat(l.interest) || 0), 0)

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredLoans.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)

    return (
        <div className="loan-panel">
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

            :root {
                --neutral-900: #0f172a;
                --neutral-800: #1e293b;
                --neutral-700: #334155;
                --neutral-200: #e2e8f0;
                --neutral-100: #f1f5f9;
                --radius-lg: 14px;
            }

            * { font-family: 'Inter', sans-serif !important; }

            .loan-header-gradient {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
                color: white !important;
                border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            }

            .sub-header-light {
                background: #f8fafc !important;
                color: #334155 !important;
                font-weight: 700 !important;
                font-size: 0.65rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                border-bottom: 3px solid #cbd5e1 !important;
                padding: 10px 8px !important;
            }

            .header-red { color: #dc3545 !important; border-bottom-color: #dc3545 !important; }

            .loan-table td {
                padding: 10px 8px !important;
                font-size: 0.75rem !important;
                border-color: #f1f5f9 !important;
            }

            .lot-no-cell { color: #dc3545; font-weight: 700; }
            .amt-cell { color: #dc3545; font-weight: 700; font-family: 'JetBrains Mono', monospace !important; }
            .price-col { font-family: 'JetBrains Mono', monospace !important; font-weight: 600; }

            .total-row { background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0; }
            .total-val { color: #dc3545; font-family: 'JetBrains Mono', monospace !important; }

            .section-title-badge {
                background: rgba(255,255,255,0.1);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.7rem;
                font-weight: 800;
                letter-spacing: 1px;
                border: 1px solid rgba(255,255,255,0.2);
                color: white !important;
            }

            .header-add-btn {
                background: rgba(255,255,255,0.15) !important;
                color: white !important;
                border: 1.5px solid rgba(255,255,255,0.25) !important;
                font-weight: 700 !important;
                font-size: 0.7rem !important;
                padding: 5px 14px !important;
                border-radius: 8px !important;
            }
        `}</style>

            <CRow className="mb-3">
                <CCol md={2}>
                    <div style={{ background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                        <CFormSelect size="sm" value={currentYear} onChange={(e) => setCurrentYear(e.target.value)}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </CFormSelect>
                    </div>
                </CCol>
            </CRow>

            <CCard className="border-0 shadow-sm mb-4">
                <CCardBody className="p-0">
                    <div className="table-container shadow-sm rounded-lg overflow-hidden border">
                        <CTable bordered className="text-center align-middle mb-0 loan-table">
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell colSpan={8} className="loan-header-gradient text-uppercase py-2">
                                        <div className="d-flex align-items-center justify-content-between px-3">
                                            <div className="d-flex gap-2">
                                                <CButton size="sm" className="header-add-btn" onClick={() => openLoanModal()}>
                                                    <CIcon icon={cilPlus} className="me-1" /> Add Loan
                                                </CButton>
                                                <CButton size="sm" color="success" className="text-white fw-bold shadow-sm" onClick={handleExportExcel} style={{ fontSize: '0.7rem', padding: '5px 14px', borderRadius: '8px' }}>
                                                    <CIcon icon={cilFile} className="me-1" /> Export Excel
                                                </CButton>
                                            </div>
                                            <span className="section-title-badge">FOURTH DATA ENTRY PANEL (Loan)</span>
                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem' }}>
                                                Current Interest Rate: {interestRate}% Monthly
                                            </div>
                                        </div>
                                    </CTableHeaderCell>
                                </CTableRow>
                                <CTableRow>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '120px' }}>
                                        Lot No.
                                        <CFormInput size="sm" className="mt-1 py-0 px-1 border-danger" placeholder="Lot..." style={{ fontSize: '0.6rem' }} value={filterLotNo} onChange={(e) => setFilterLotNo(e.target.value)} />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '120px' }}>Dt of Loan</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '150px' }}>Loan Amt</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '120px' }}>Dt of Repayment</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '150px' }}>Repayment Amt</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '150px' }}>Interest</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '150px' }}>Remarks</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow><CTableDataCell colSpan={8} className="py-5"><CSpinner size="sm" /></CTableDataCell></CTableRow>
                                ) : currentItems.length === 0 ? (
                                    <CTableRow><CTableDataCell colSpan={8} className="py-5 text-muted fst-italic">No loan records found</CTableDataCell></CTableRow>
                                ) : (
                                    currentItems.map((l) => (
                                        <CTableRow key={l.id} className="hover-row">
                                            <CTableDataCell className="lot-no-cell">
                                                <div>{l.purchase?.lotNo}</div>
                                                <div className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 'normal' }}>
                                                    {l.purchase?.purchasedFor?.name || l.purchase?.supplier?.name}
                                                </div>
                                            </CTableDataCell>
                                            <CTableDataCell>{l.loanDt ? l.loanDt.split('-').reverse().join('.') : '-'}</CTableDataCell>
                                            <CTableDataCell className="price-col">₹ {l.loanAmount}</CTableDataCell>
                                            <CTableDataCell>
                                                {(() => {
                                                    const repayments = l.repayments || []
                                                    const latestDt = repayments.length > 0
                                                        ? repayments.reduce((latest, r) => (!latest || r.repaymentDt > latest) ? r.repaymentDt : latest, '')
                                                        : l.repaymentDt
                                                    return latestDt ? latestDt.split('-').reverse().join('.') : '-'
                                                })()}
                                            </CTableDataCell>
                                            <CTableDataCell className="price-col text-success">₹ {l.payRecd}</CTableDataCell>
                                            <CTableDataCell className="amt-cell">₹ {l.interest}</CTableDataCell>
                                            <CTableDataCell className="small">{l.remarks}</CTableDataCell>
                                            <CTableDataCell>
                                                <div className="d-flex gap-1 justify-content-center">
                                                    <CButton size="sm" variant="ghost" color="info" onClick={() => handleEditLoan(l)}><CIcon icon={cilPencil} size="sm" /></CButton>
                                                    <CButton size="sm" variant="ghost" color="danger" onClick={() => handleDeleteLoan(l.id)}><CIcon icon={cilTrash} size="sm" /></CButton>
                                                </div>
                                            </CTableDataCell>

                                        </CTableRow>
                                    ))
                                )}
                                <CTableRow className="total-row">
                                    <CTableDataCell colSpan={2} className="text-end px-3 small fw-bold">TOTAL</CTableDataCell>
                                    <CTableDataCell className="total-val">₹ {totalLoanAmt.toFixed(2)}</CTableDataCell>
                                    <CTableDataCell></CTableDataCell>
                                    <CTableDataCell className="total-val text-success">₹ {totalRepaid.toFixed(2)}</CTableDataCell>
                                    <CTableDataCell className="total-val">₹ {totalInterst.toFixed(2)}</CTableDataCell>
                                    <CTableDataCell colSpan={2}></CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                    </div>
                </CCardBody>
            </CCard>

            <CModal visible={loanModalVisible} onClose={() => setLoanModalVisible(false)} size="lg" backdrop="static">
                <CModalHeader className="bg-dark text-white">
                    <CModalTitle className="fs-6 fw-bold">💰 LOAN ENTRY FORM</CModalTitle>
                </CModalHeader>
                <CModalBody className="bg-light p-4">
                    <CForm>
                        <CRow className="mb-4 g-3">
                            <CCol md={6} className="position-relative">
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Select Lot *</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                                    <CFormInput placeholder="Search Lot No or Name..." value={lotSearch} onChange={(e) => { setLotSearch(e.target.value); setShowLotList(true); }} onFocus={() => setShowLotList(true)} disabled={isEditing} />
                                </CInputGroup>
                                {showLotList && !isEditing && (
                                    <CListGroup className="position-absolute w-100 shadow-lg border-0" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }} ref={lotListRef}>
                                        {filteredSearchPurchases.length > 0 ? (
                                            filteredSearchPurchases.map(p => (
                                                <CListGroupItem key={p.id} onClick={() => selectPurchase(p)} className="small py-2 border-bottom" style={{ cursor: 'pointer' }}>
                                                    <strong>Lot {p.lotNo}</strong> - {p.purchasedFor?.name || p.supplier?.name}
                                                </CListGroupItem>
                                            ))
                                        ) : (
                                            <CListGroupItem className="small py-2 text-muted fw-italic">No lots found for "{lotSearch}"</CListGroupItem>
                                        )}
                                    </CListGroup>
                                )}
                                {selectedLotInfo.lotNo && (
                                    <div className="mt-3 p-3 bg-white border rounded shadow-sm">
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="text-muted">Lot No:</span>
                                            <span className="fw-bold text-danger">{selectedLotInfo.lotNo}</span>
                                        </div>
                                        <div className="d-flex justify-content-between small">
                                            <span className="text-muted">Malik:</span>
                                            <span className="fw-bold">{selectedLotInfo.owner}</span>
                                        </div>
                                    </div>
                                )}
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Remarks</CFormLabel>
                                <CFormInput placeholder="Kuch notes ya karan..." name="remarks" size="sm" value={loanForm.remarks} onChange={handleLoanChange} />
                            </CCol>
                        </CRow>

                        <CRow className="mb-3 g-3 text-center">
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Loan Date *</CFormLabel>
                                <CFormInput type="date" name="loanDt" size="sm" value={loanForm.loanDt} onChange={handleLoanChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Latest Payment Date</CFormLabel>
                                <div className="bg-white p-2 border rounded fw-bold small text-muted">
                                    {loanForm.repaymentDt ? loanForm.repaymentDt.split('-').reverse().join('.') : 'Pending'}
                                </div>
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Current Int. Rate</CFormLabel>
                                <div className="bg-white p-2 border rounded fw-bold text-primary small">
                                    {interestRate}% Monthly
                                </div>
                            </CCol>
                        </CRow>

                        <CRow className="mb-3 g-3">
                            <CCol md={12}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <CFormLabel className="small fw-bold text-uppercase text-muted m-0">Repayment Sessions</CFormLabel>
                                    <CButton size="sm" color="primary" variant="outline" className="py-0 px-2 fw-bold" onClick={addRepayment}>
                                        <CIcon icon={cilPlus} className="me-1" /> ADD PAYMENT
                                    </CButton>
                                </div>
                                <div className="bg-white p-3 border rounded shadow-sm">
                                    {loanForm.repayments.map((rep, idx) => (
                                        <CRow key={idx} className="mb-2 g-2 align-items-end">
                                            <CCol md={5}>
                                                {idx === 0 && <label className="text-muted" style={{ fontSize: '0.6rem' }}>Pay Date</label>}
                                                <CFormInput type="date" size="sm" name="repaymentDt" value={rep.repaymentDt} onChange={(e) => handleRepaymentChange(idx, e)} />
                                            </CCol>
                                            <CCol md={5}>
                                                {idx === 0 && <label className="text-muted" style={{ fontSize: '0.6rem' }}>Amount</label>}
                                                <CFormInput type="number" size="sm" name="amount" placeholder="Amt" value={rep.amount} onChange={(e) => handleRepaymentChange(idx, e)} />
                                            </CCol>
                                            <CCol md={2} className="text-end">
                                                {loanForm.repayments.length > 1 && (
                                                    <CButton size="sm" color="danger" variant="ghost" className="p-1" onClick={() => removeRepayment(idx)}>
                                                        <CIcon icon={cilTrash} size="sm" />
                                                    </CButton>
                                                )}
                                            </CCol>
                                        </CRow>
                                    ))}
                                    <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                                        <span className="small text-muted fw-bold">TOTAL REPAID:</span>
                                        <span className="fw-bold text-success">₹ {loanForm.payRecd || '0.00'}</span>
                                    </div>
                                </div>
                            </CCol>
                        </CRow>

                        <CRow className="g-3 align-items-end mt-2">
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Loan Amount *</CFormLabel>
                                <CFormInput type="number" name="loanAmount" size="sm" placeholder="Disbursed Amt" value={loanForm.loanAmount} onChange={handleLoanChange} />
                            </CCol>
                            <CCol md={6}>
                                <div className="text-end">
                                    <div className="small fw-bold text-uppercase text-muted mb-1">Calculated Interest</div>
                                    <div className="bg-white p-2 border rounded text-danger fw-bold fs-5 shadow-sm" style={{ fontFamily: 'JetBrains Mono' }}>
                                        ₹ {loanForm.interest}
                                    </div>
                                </div>
                            </CCol>
                        </CRow>

                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" variant="ghost" onClick={() => setLoanModalVisible(false)}>CANCEL</CButton>
                    <CButton color="dark" className="px-4" onClick={handleLoanSave}>{isEditing ? 'UPDATE LOAN' : 'SAVE LOAN'}</CButton>
                </CModalFooter>
            </CModal>
        </div>
    )
}

export default Loan
