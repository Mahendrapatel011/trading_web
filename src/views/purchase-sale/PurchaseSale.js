import React, { useState } from 'react'
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
    CFormSelect,
    CInputGroup,
    CInputGroupText,
    CBadge,
    CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilPencil } from '@coreui/icons'

const PurchaseSale = () => {
    // State for modals
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false)
    const [saleModalVisible, setSaleModalVisible] = useState(false)

    // State for purchase data
    const [purchaseData, setPurchaseData] = useState([])
    const [salesData, setSalesData] = useState([])

    // Generate Bill Number
    const generateBillNo = () => {
        const lastBillNo = purchaseData.length > 0 
            ? Math.max(...purchaseData.map(p => parseInt(p.billNo))) 
            : 1100
        return (lastBillNo + 1).toString()
    }

    // Generate Lot Number
    const generateLotNo = () => {
        return (purchaseData.length + 1).toString()
    }

    // Purchase Form State
    const [purchaseForm, setPurchaseForm] = useState({
        billDate: new Date().toISOString().split('T')[0],
        billNo: '',
        supplierName: '',
        item: 'Potatoes',
        lotNo: '',
        agreementNo: '',
        noOfPacket: '',
        grWt: '',
        cutting: '',
        netWt: '',
        rate: '',
        amount: '',
        loadingLabour: '',
        totalCost: ''
    })

    // Sale Form State
    const [saleForm, setSaleForm] = useState({
        purchaseId: '',
        saleDt: new Date().toISOString().split('T')[0],
        party: '',
        nikashiPkt: '',
        tayariPkt: '',
        charri: '',
        salePkt: '',
        saleWt: '',
        rate: '',
        amount: '',
        unloadingLabour: '',
        tayaroLabour: '',
        coldStorageRent: '',
        newBags: '',
        sutli: '',
        pktCollection: '',
        raffuChipri: '',
        totalExpOnSales: '',
        netResult: '',
        shortage: ''
    })

    // Handle Purchase Form Change
    const handlePurchaseChange = (e) => {
        const { name, value } = e.target
        let updatedForm = { ...purchaseForm, [name]: value }

        // Auto-calculate Net Weight
        if (name === 'grWt' || name === 'cutting') {
            const grWt = parseFloat(updatedForm.grWt) || 0
            const cutting = parseFloat(updatedForm.cutting) || 0
            updatedForm.netWt = (grWt - cutting).toFixed(3)
        }

        // Auto-calculate Rate (₹950 per Qtl - can be dynamic)
        if (name === 'noOfPacket') {
            updatedForm.rate = '950' // Default rate - can be made configurable
        }

        // Auto-calculate Amount
        if (name === 'netWt' || name === 'rate' || name === 'grWt' || name === 'cutting') {
            const netWt = parseFloat(updatedForm.netWt) || 0
            const rate = parseFloat(updatedForm.rate) || 0
            updatedForm.amount = (netWt * rate).toFixed(2)
        }

        // Auto-calculate Loading Labour (₹8.50 per packet)
        if (name === 'noOfPacket') {
            const packets = parseFloat(value) || 0
            updatedForm.loadingLabour = (packets * 8.50).toFixed(2)
        }

        // Auto-calculate Total Cost
        const amount = parseFloat(updatedForm.amount) || 0
        const loadingLabour = parseFloat(updatedForm.loadingLabour) || 0
        updatedForm.totalCost = (amount + loadingLabour).toFixed(2)

        setPurchaseForm(updatedForm)
    }

    // Handle Sale Form Change
    const handleSaleChange = (e) => {
        const { name, value } = e.target
        let updatedForm = { ...saleForm, [name]: value }

        // Auto-calculate Rate (₹1500 per Qtl - default)
        if (name === 'saleWt' && !updatedForm.rate) {
            updatedForm.rate = '1500'
        }

        // Auto-calculate Amount
        if (name === 'saleWt' || name === 'rate') {
            const saleWt = parseFloat(updatedForm.saleWt) || 0
            const rate = parseFloat(updatedForm.rate) || 0
            updatedForm.amount = (saleWt * rate).toFixed(2)
        }

        // Auto-calculate Total Expenses
        const unloadingLabour = parseFloat(updatedForm.unloadingLabour) || 0
        const tayaroLabour = parseFloat(updatedForm.tayaroLabour) || 0
        const coldStorageRent = parseFloat(updatedForm.coldStorageRent) || 0
        const newBags = parseFloat(updatedForm.newBags) || 0
        const sutli = parseFloat(updatedForm.sutli) || 0
        const pktCollection = parseFloat(updatedForm.pktCollection) || 0
        const raffuChipri = parseFloat(updatedForm.raffuChipri) || 0
        updatedForm.totalExpOnSales = (unloadingLabour + tayaroLabour + coldStorageRent + newBags + sutli + pktCollection + raffuChipri).toFixed(2)

        // Auto-calculate Net Result
        const amount = parseFloat(updatedForm.amount) || 0
        const totalExp = parseFloat(updatedForm.totalExpOnSales) || 0
        updatedForm.netResult = (amount - totalExp).toFixed(2)

        setSaleForm(updatedForm)
    }

    // Open Purchase Modal
    const openPurchaseModal = () => {
        setPurchaseForm({
            ...purchaseForm,
            billNo: generateBillNo(),
            lotNo: generateLotNo(),
            billDate: new Date().toISOString().split('T')[0],
            rate: '950'
        })
        setPurchaseModalVisible(true)
    }

    // Add Purchase
    const handleAddPurchase = () => {
        const newPurchase = {
            ...purchaseForm,
            id: Date.now(),
            lotNo: `${purchaseForm.lotNo}/${purchaseForm.noOfPacket}`
        }
        setPurchaseData([...purchaseData, newPurchase])
        setSalesData([...salesData, []])
        setPurchaseModalVisible(false)
        setPurchaseForm({
            billDate: new Date().toISOString().split('T')[0],
            billNo: '',
            supplierName: '',
            item: 'Potatoes',
            lotNo: '',
            agreementNo: '',
            noOfPacket: '',
            grWt: '',
            cutting: '',
            netWt: '',
            rate: '',
            amount: '',
            loadingLabour: '',
            totalCost: ''
        })
    }

    // Open Sale Modal
    const openSaleModal = (purchaseIndex) => {
        setSaleForm({
            ...saleForm,
            purchaseId: purchaseIndex,
            saleDt: new Date().toISOString().split('T')[0],
            rate: '1500'
        })
        setSaleModalVisible(true)
    }

    // Add Sale
    const handleAddSale = () => {
        const purchaseIndex = saleForm.purchaseId
        const newSalesData = [...salesData]
        newSalesData[purchaseIndex] = [...(newSalesData[purchaseIndex] || []), { ...saleForm, id: Date.now() }]
        setSalesData(newSalesData)
        setSaleModalVisible(false)
        setSaleForm({
            purchaseId: '',
            saleDt: new Date().toISOString().split('T')[0],
            party: '',
            nikashiPkt: '',
            tayariPkt: '',
            charri: '',
            salePkt: '',
            saleWt: '',
            rate: '',
            amount: '',
            unloadingLabour: '',
            tayaroLabour: '',
            coldStorageRent: '',
            newBags: '',
            sutli: '',
            pktCollection: '',
            raffuChipri: '',
            totalExpOnSales: '',
            netResult: '',
            shortage: ''
        })
    }

    // Calculate Totals
    const calculateTotals = () => {
        const totalPackets = purchaseData.reduce((sum, p) => sum + (parseFloat(p.noOfPacket) || 0), 0)
        const totalGrWt = purchaseData.reduce((sum, p) => sum + (parseFloat(p.grWt) || 0), 0)
        const totalNetWt = purchaseData.reduce((sum, p) => sum + (parseFloat(p.netWt) || 0), 0)
        const totalAmount = purchaseData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const totalLoadingLabour = purchaseData.reduce((sum, p) => sum + (parseFloat(p.loadingLabour) || 0), 0)
        const totalCost = purchaseData.reduce((sum, p) => sum + (parseFloat(p.totalCost) || 0), 0)

        let totalSalePkt = 0, totalNikashi = 0, totalTayari = 0, totalCharri = 0

        salesData.forEach(sales => {
            sales.forEach(s => {
                totalSalePkt += parseFloat(s.salePkt) || 0
                totalNikashi += parseFloat(s.nikashiPkt) || 0
                totalTayari += parseFloat(s.tayariPkt) || 0
                totalCharri += parseFloat(s.charri) || 0
            })
        })

        return { totalPackets, totalGrWt: totalGrWt.toFixed(3), totalNetWt: totalNetWt.toFixed(3), totalAmount: totalAmount.toFixed(2), totalLoadingLabour: totalLoadingLabour.toFixed(2), totalCost: totalCost.toFixed(2), totalSalePkt, totalNikashi, totalTayari, totalCharri }
    }

    const totals = calculateTotals()

    return (
        <>
            <style>{`
                .purple-header {
                    background: #6f42c1 !important;
                    color: white !important;
                }
                .purple-header-light {
                    background: #e9e3f4 !important;
                    color: #5a32a3 !important;
                    font-weight: 600 !important;
                }
                .btn-purple {
                    background: #6f42c1;
                    border: none;
                    color: white;
                }
                .btn-purple:hover {
                    background: #5a32a3;
                    color: white;
                }
                .btn-purple-outline {
                    border: 1px solid #6f42c1;
                    color: #6f42c1;
                    background: white;
                }
                .btn-purple-outline:hover {
                    background: #6f42c1;
                    color: white;
                }
                .badge-purple {
                    background: #6f42c1 !important;
                }
                .text-purple {
                    color: #6f42c1 !important;
                }
                .border-purple {
                    border-color: #6f42c1 !important;
                }
                .table-container {
                    background: white;
                }
                .total-row {
                    background: #f8f9fa !important;
                    font-weight: 600;
                }
                .empty-state {
                    padding: 60px 20px;
                    text-align: center;
                }
                .action-btn {
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    margin: 0 2px;
                }
                .form-section-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #6f42c1;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 12px;
                    padding-bottom: 6px;
                    border-bottom: 2px solid #e9e3f4;
                }
                .modal-header-purple {
                    background: #6f42c1;
                    color: white;
                }
                .modal-header-purple .btn-close {
                    filter: brightness(0) invert(1);
                }
                .calculated-field {
                    background-color: #f8f9fa !important;
                    font-weight: 500;
                }
                .form-control:focus, .form-select:focus {
                    border-color: #6f42c1;
                    box-shadow: 0 0 0 0.2rem rgba(111, 66, 193, 0.15);
                }
            `}</style>

            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4 border-0 shadow-sm">
                        <CCardBody className="p-0 bg-white">
                            {/* Table Container */}
                            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                                <CTable bordered hover className="text-center align-middle mb-0" style={{ fontSize: '0.75rem', minWidth: '3200px' }}>
                                    <CTableHead>
                                        <CTableRow>
                                            <CTableHeaderCell colSpan={15} className="purple-header text-uppercase py-2">
                                                <div className="d-flex align-items-center justify-content-between px-2">
                                                    <CButton size="sm" className="btn-purple" onClick={openPurchaseModal}>
                                                        <CIcon icon={cilPlus} className="me-1" /> Add Purchase
                                                    </CButton>
                                                    <span className="fs-6 fw-semibold">PURCHASE DETAILS</span>
                                                    <div style={{ width: '120px' }}></div>
                                                </div>
                                            </CTableHeaderCell>
                                            <CTableHeaderCell colSpan={20} className="purple-header text-uppercase py-2">
                                                <div className="d-flex align-items-center justify-content-between px-2">
                                                    <CButton 
                                                        size="sm" 
                                                        className="btn-purple"
                                                        onClick={() => purchaseData.length > 0 && openSaleModal(purchaseData.length - 1)}
                                                        disabled={purchaseData.length === 0}
                                                    >
                                                        <CIcon icon={cilPlus} className="me-1" /> Add Sale
                                                    </CButton>
                                                    <span className="fs-6 fw-semibold">SALES DETAILS</span>
                                                    <div style={{ width: '100px' }}></div>
                                                </div>
                                            </CTableHeaderCell>
                                        </CTableRow>
                                        <CTableRow>
                                            {/* Purchase Headers */}
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Bill Date</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '65px' }}>Bill No</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '160px' }}>Supplier Name</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '70px' }}>Item</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '65px' }}>Lot No.</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '90px' }}>Agreement No.</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '70px' }}>No. of Pkt</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Gr Wt (Qtls)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Cutting (Qtls)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Net Wt (Qtls)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '75px' }}>Rate (₹)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '90px' }}>Amount (₹)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '95px' }}>Loading Labour</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '95px' }}>Total Cost (₹)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '70px' }}>Actions</CTableHeaderCell>

                                            {/* Sales Headers */}
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Sale Date</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '130px' }}>Sale Party</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '75px' }}>Nikashi Pkt</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '75px' }}>Tayari Pkt</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '55px' }}>Charri</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '65px' }}>Packet</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Sale Wt (Qtl)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '75px' }}>Rate (₹)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '90px' }}>Amount (₹)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '100px' }}>Unload Labour</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '100px' }}>Tayaro Labour</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '105px' }}>Cold Storage Rent</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '75px' }}>New Bags</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '55px' }}>Sutli</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Pkt Collection</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '85px' }}>Raffu & Chipri</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '100px' }}>Total Exp</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '90px' }}>Net Result (₹)</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '75px' }}>% Shortage</CTableHeaderCell>
                                            <CTableHeaderCell className="purple-header-light" style={{ minWidth: '70px' }}>Actions</CTableHeaderCell>
                                        </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                        {purchaseData.length === 0 ? (
                                            <CTableRow>
                                                <CTableDataCell colSpan={35} className="empty-state bg-white">
                                                    <div className="text-muted mb-3" style={{ fontSize: '48px' }}>📋</div>
                                                    <h6 className="text-muted mb-2">No Purchase Data</h6>
                                                    <p className="text-muted small mb-3">Click "Add Purchase" to add your first entry</p>
                                                    <CButton size="sm" className="btn-purple" onClick={openPurchaseModal}>
                                                        <CIcon icon={cilPlus} className="me-1" /> Add Purchase
                                                    </CButton>
                                                </CTableDataCell>
                                            </CTableRow>
                                        ) : (
                                            purchaseData.map((pRow, pIndex) => {
                                                const pSales = salesData[pIndex] || []
                                                const rowSpanCount = pSales.length > 0 ? pSales.length : 1

                                                return Array.from({ length: rowSpanCount }).map((_, sIndex) => {
                                                    const sRow = pSales[sIndex] || {}
                                                    const isFirstRow = sIndex === 0

                                                    return (
                                                        <CTableRow key={`${pIndex}-${sIndex}`} className="bg-white">
                                                            {isFirstRow && (
                                                                <>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>{pRow.billDate}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>
                                                                        <CBadge className="badge-purple">{pRow.billNo}</CBadge>
                                                                    </CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount} className="text-start text-uppercase" style={{ fontSize: '0.7rem' }}>{pRow.supplierName}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>{pRow.item}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount} className="fw-semibold text-purple">{pRow.lotNo}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>{pRow.agreementNo}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount} className="fw-semibold">{pRow.noOfPacket}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>{pRow.grWt}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>{pRow.cutting}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount} className="fw-semibold">{pRow.netWt}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>{pRow.rate}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>₹{pRow.amount}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>₹{pRow.loadingLabour}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount} className="fw-semibold">₹{pRow.totalCost}</CTableDataCell>
                                                                    <CTableDataCell rowSpan={rowSpanCount}>
                                                                        <CTooltip content="Add Sale">
                                                                            <CButton color="success" variant="ghost" size="sm" className="action-btn" onClick={() => openSaleModal(pIndex)}>
                                                                                <CIcon icon={cilPlus} size="sm" />
                                                                            </CButton>
                                                                        </CTooltip>
                                                                        <CTooltip content="Edit">
                                                                            <CButton color="primary" variant="ghost" size="sm" className="action-btn">
                                                                                <CIcon icon={cilPencil} size="sm" />
                                                                            </CButton>
                                                                        </CTooltip>
                                                                        <CTooltip content="Delete">
                                                                            <CButton color="danger" variant="ghost" size="sm" className="action-btn">
                                                                                <CIcon icon={cilTrash} size="sm" />
                                                                            </CButton>
                                                                        </CTooltip>
                                                                    </CTableDataCell>
                                                                </>
                                                            )}

                                                            {/* Sales Columns */}
                                                            <CTableDataCell>{sRow.saleDt || '-'}</CTableDataCell>
                                                            <CTableDataCell className="text-start" style={{ fontSize: '0.7rem' }}>{sRow.party || '-'}</CTableDataCell>
                                                            <CTableDataCell className="fw-semibold">{sRow.nikashiPkt || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.tayariPkt || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.charri || '-'}</CTableDataCell>
                                                            <CTableDataCell className="fw-semibold">{sRow.salePkt || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.saleWt || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.rate || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.amount ? `₹${sRow.amount}` : '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.unloadingLabour ? `₹${sRow.unloadingLabour}` : '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.tayaroLabour ? `₹${sRow.tayaroLabour}` : '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.coldStorageRent ? `₹${sRow.coldStorageRent}` : '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.newBags || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.sutli || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.pktCollection || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.raffuChipri || '-'}</CTableDataCell>
                                                            <CTableDataCell>{sRow.totalExpOnSales ? `₹${sRow.totalExpOnSales}` : '-'}</CTableDataCell>
                                                            <CTableDataCell className={`fw-semibold ${parseFloat(sRow.netResult) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {sRow.netResult ? `₹${sRow.netResult}` : '-'}
                                                            </CTableDataCell>
                                                            <CTableDataCell>{sRow.shortage || '-'}</CTableDataCell>
                                                            <CTableDataCell>
                                                                {sRow.id && (
                                                                    <>
                                                                        <CButton color="primary" variant="ghost" size="sm" className="action-btn">
                                                                            <CIcon icon={cilPencil} size="sm" />
                                                                        </CButton>
                                                                        <CButton color="danger" variant="ghost" size="sm" className="action-btn">
                                                                            <CIcon icon={cilTrash} size="sm" />
                                                                        </CButton>
                                                                    </>
                                                                )}
                                                            </CTableDataCell>
                                                        </CTableRow>
                                                    )
                                                })
                                            })
                                        )}

                                        {/* Total Row */}
                                        {purchaseData.length > 0 && (
                                            <CTableRow className="total-row">
                                                <CTableDataCell colSpan={6} className="text-end fw-bold">TOTAL</CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalPackets}</CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalGrWt}</CTableDataCell>
                                                <CTableDataCell></CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalNetWt}</CTableDataCell>
                                                <CTableDataCell></CTableDataCell>
                                                <CTableDataCell className="fw-bold">₹{totals.totalAmount}</CTableDataCell>
                                                <CTableDataCell className="fw-bold">₹{totals.totalLoadingLabour}</CTableDataCell>
                                                <CTableDataCell className="fw-bold">₹{totals.totalCost}</CTableDataCell>
                                                <CTableDataCell></CTableDataCell>
                                                <CTableDataCell colSpan={2}></CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalNikashi}</CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalTayari}</CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalCharri}</CTableDataCell>
                                                <CTableDataCell className="fw-bold">{totals.totalSalePkt}</CTableDataCell>
                                                <CTableDataCell colSpan={14}></CTableDataCell>
                                            </CTableRow>
                                        )}
                                    </CTableBody>
                                </CTable>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Purchase Modal */}
            <CModal visible={purchaseModalVisible} onClose={() => setPurchaseModalVisible(false)} size="lg" backdrop="static">
                <CModalHeader className="modal-header-purple">
                    <CModalTitle>Add New Purchase</CModalTitle>
                </CModalHeader>
                <CModalBody className="p-4 bg-white">
                    <CForm>
                        <div className="form-section-title">Basic Information</div>
                        <CRow className="mb-3">
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Bill Date *</CFormLabel>
                                <CFormInput type="date" name="billDate" value={purchaseForm.billDate} onChange={handlePurchaseChange} size="sm" />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Bill No (Auto)</CFormLabel>
                                <CFormInput type="text" name="billNo" value={purchaseForm.billNo} readOnly className="calculated-field" size="sm" />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Lot No (Auto)</CFormLabel>
                                <CFormInput type="text" name="lotNo" value={purchaseForm.lotNo} readOnly className="calculated-field" size="sm" />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Supplier Information</div>
                        <CRow className="mb-3">
                            <CCol md={5}>
                                <CFormLabel className="small fw-semibold">Supplier Name *</CFormLabel>
                                <CFormInput type="text" name="supplierName" value={purchaseForm.supplierName} onChange={handlePurchaseChange} placeholder="Enter supplier name" size="sm" />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Item</CFormLabel>
                                <CFormSelect name="item" value={purchaseForm.item} onChange={handlePurchaseChange} size="sm">
                                    <option value="Potatoes">Potatoes</option>
                                    <option value="Onions">Onions</option>
                                </CFormSelect>
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Agreement No *</CFormLabel>
                                <CFormInput type="text" name="agreementNo" value={purchaseForm.agreementNo} onChange={handlePurchaseChange} placeholder="e.g., 1, 2, 3" size="sm" />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Weight & Quantity</div>
                        <CRow className="mb-3">
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">No. of Packets *</CFormLabel>
                                <CFormInput type="number" name="noOfPacket" value={purchaseForm.noOfPacket} onChange={handlePurchaseChange} placeholder="Packets" size="sm" />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Gross Weight (Qtls) *</CFormLabel>
                                <CFormInput type="number" step="0.001" name="grWt" value={purchaseForm.grWt} onChange={handlePurchaseChange} placeholder="Gross Wt" size="sm" />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Cutting (Qtls)</CFormLabel>
                                <CFormInput type="number" step="0.001" name="cutting" value={purchaseForm.cutting} onChange={handlePurchaseChange} placeholder="Cutting" size="sm" />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Net Weight (Auto)</CFormLabel>
                                <CFormInput type="text" name="netWt" value={purchaseForm.netWt} readOnly className="calculated-field" size="sm" />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Pricing</div>
                        <CRow className="mb-3">
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Rate (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="rate" value={purchaseForm.rate} readOnly className="calculated-field" />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Amount (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="amount" value={purchaseForm.amount} readOnly className="calculated-field" />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Loading Labour (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="loadingLabour" value={purchaseForm.loadingLabour} readOnly className="calculated-field" />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Total Cost (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="totalCost" value={purchaseForm.totalCost} readOnly className="calculated-field fw-bold" />
                                </CInputGroup>
                            </CCol>
                        </CRow>
                    </CForm>
                </CModalBody>
                <CModalFooter className="bg-white">
                    <CButton color="secondary" variant="outline" size="sm" onClick={() => setPurchaseModalVisible(false)}>Cancel</CButton>
                    <CButton className="btn-purple" size="sm" onClick={handleAddPurchase}>
                        <CIcon icon={cilPlus} className="me-1" /> Add Purchase
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Sale Modal */}
            <CModal visible={saleModalVisible} onClose={() => setSaleModalVisible(false)} size="xl" backdrop="static">
                <CModalHeader className="modal-header-purple">
                    <CModalTitle className="d-flex align-items-center gap-2">
                        Add New Sale
                        {saleForm.purchaseId !== '' && purchaseData[saleForm.purchaseId] && (
                            <CBadge color="light" className="text-purple ms-2">Lot: {purchaseData[saleForm.purchaseId].lotNo}</CBadge>
                        )}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody className="p-4 bg-white">
                    <CForm>
                        <div className="form-section-title">Link to Purchase</div>
                        <CRow className="mb-3">
                            <CCol md={5}>
                                <CFormLabel className="small fw-semibold">Select Purchase Lot *</CFormLabel>
                                <CFormSelect name="purchaseId" value={saleForm.purchaseId} onChange={handleSaleChange} size="sm">
                                    <option value="">Select a purchase lot...</option>
                                    {purchaseData.map((p, idx) => (
                                        <option key={idx} value={idx}>Lot {p.lotNo} - {p.supplierName} ({p.noOfPacket} Pkts)</option>
                                    ))}
                                </CFormSelect>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Sale Date *</CFormLabel>
                                <CFormInput type="date" name="saleDt" value={saleForm.saleDt} onChange={handleSaleChange} size="sm" />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Sale Party *</CFormLabel>
                                <CFormInput type="text" name="party" value={saleForm.party} onChange={handleSaleChange} placeholder="Party name" size="sm" />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Quantity Details</div>
                        <CRow className="mb-3">
                            <CCol md={2}>
                                <CFormLabel className="small fw-semibold">Nikashi Pkt</CFormLabel>
                                <CFormInput type="number" name="nikashiPkt" value={saleForm.nikashiPkt} onChange={handleSaleChange} size="sm" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-semibold">Tayari Pkt</CFormLabel>
                                <CFormInput type="number" name="tayariPkt" value={saleForm.tayariPkt} onChange={handleSaleChange} size="sm" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-semibold">Charri</CFormLabel>
                                <CFormInput type="number" name="charri" value={saleForm.charri} onChange={handleSaleChange} size="sm" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-semibold">Sale Packets</CFormLabel>
                                <CFormInput type="number" name="salePkt" value={saleForm.salePkt} onChange={handleSaleChange} size="sm" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-semibold">Sale Wt (Qtl)</CFormLabel>
                                <CFormInput type="number" step="0.001" name="saleWt" value={saleForm.saleWt} onChange={handleSaleChange} size="sm" />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-semibold">% Shortage</CFormLabel>
                                <CFormInput type="text" name="shortage" value={saleForm.shortage} onChange={handleSaleChange} placeholder="e.g., 7.18%" size="sm" />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Pricing</div>
                        <CRow className="mb-3">
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Rate (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="rate" value={saleForm.rate} readOnly className="calculated-field" />
                                </CInputGroup>
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Amount (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="amount" value={saleForm.amount} readOnly className="calculated-field" />
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Expenses</div>
                        <CRow className="mb-3">
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Unloading Labour</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="unloadingLabour" value={saleForm.unloadingLabour} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Tayaro Labour</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="tayaroLabour" value={saleForm.tayaroLabour} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Cold Storage Rent</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="coldStorageRent" value={saleForm.coldStorageRent} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">New Bags</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="newBags" value={saleForm.newBags} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                        </CRow>
                        <CRow className="mb-3">
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Sutli</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="sutli" value={saleForm.sutli} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Packet Collection</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="pktCollection" value={saleForm.pktCollection} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-semibold">Raffu & Chipri</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="number" name="raffuChipri" value={saleForm.raffuChipri} onChange={handleSaleChange} />
                                </CInputGroup>
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Summary</div>
                        <CRow>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Total Expenses (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput type="text" name="totalExpOnSales" value={saleForm.totalExpOnSales} readOnly className="calculated-field" />
                                </CInputGroup>
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-semibold">Net Result (Auto)</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText>₹</CInputGroupText>
                                    <CFormInput 
                                        type="text" 
                                        name="netResult" 
                                        value={saleForm.netResult} 
                                        readOnly 
                                        className="calculated-field fw-bold"
                                        style={{ 
                                            color: parseFloat(saleForm.netResult) >= 0 ? '#198754' : '#dc3545'
                                        }}
                                    />
                                </CInputGroup>
                            </CCol>
                        </CRow>
                    </CForm>
                </CModalBody>
                <CModalFooter className="bg-white">
                    <CButton color="secondary" variant="outline" size="sm" onClick={() => setSaleModalVisible(false)}>Cancel</CButton>
                    <CButton className="btn-purple" size="sm" onClick={handleAddSale}>
                        <CIcon icon={cilPlus} className="me-1" /> Add Sale
                    </CButton>
                </CModalFooter>
            </CModal>
        </>
    )
}

export default PurchaseSale