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
    CFormSelect,
    CInputGroup,
    CInputGroupText,
    CBadge,
    CListGroup,
    CListGroupItem,
    CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSearch, cilMoney, cilExcerpt, cilFile } from '@coreui/icons'
import { purchaseApi, supplierApi, masterApi, saleApi, loanApi, lotProcessingApi } from '../../api/reservationApi'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel } from '../../utils/excelExport'

const LotProcessing = () => {
    const { isImpersonating } = useAuth()
    // Current Context
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    // State for data
    const [purchaseData, setPurchaseData] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLotNo, setFilterLotNo] = useState('')
    const [filterParty, setFilterParty] = useState('')

    // State for modals
    const [processingModalVisible, setProcessingModalVisible] = useState(false)
    const [isEditingProcessing, setIsEditingProcessing] = useState(false)
    const [editProcessingId, setEditProcessingId] = useState(null)

    // Processing Form State
    const [processingForm, setProcessingForm] = useState({
        purchaseId: '',
        processingDate: new Date().toISOString().split('T')[0],
        nikashiPkt: '0',
        purchaseCost: '0',
        nikashiLabour: '0',
        tayariLabour: '0',
        rent: '0',
        newBags: '0',
        sutli: '0',
        pktCollection: '0',
        raffuChippi: '0',
        totalExps: '0',
        tayariPkt: '0',
        tayariWt: '0',
        charriPkt: '0',
        charriWt: '0'
    })

    const [purchaseSearch, setPurchaseSearch] = useState('')
    const [showPurchaseList, setShowPurchaseList] = useState(false)
    const purchaseListRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (purchaseListRef.current && !purchaseListRef.current.contains(event.target)) {
                setShowPurchaseList(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch initial data
    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchPurchases()
    }, [currentYear])

    const fetchInitialData = async () => {
        try {
            const [suppliersRes, itemsRes] = await Promise.all([
                supplierApi.getAll(),
                masterApi.getItems()
            ])
            setSuppliers(suppliersRes.data.data)
            setItems(itemsRes.data.data)
        } catch (error) {
            console.error('Error fetching master data:', error)
        }
    }

    const fetchPurchases = async () => {
        setLoading(true)
        try {
            const response = await saleApi.getGrouped(currentYear)
            setPurchaseData(response.data.data)
        } catch (error) {
            console.error('Error fetching purchases:', error)
        } finally {
            setLoading(false)
        }
    }

    // Auto Calculations Processing
    useEffect(() => {
        const pc = parseFloat(processingForm.purchaseCost) || 0
        const nl = parseFloat(processingForm.nikashiLabour) || 0
        const tl = parseFloat(processingForm.tayariLabour) || 0
        const r = parseFloat(processingForm.rent) || 0
        const nb = parseFloat(processingForm.newBags) || 0
        const s = parseFloat(processingForm.sutli) || 0
        const pcoll = parseFloat(processingForm.pktCollection) || 0
        const rc = parseFloat(processingForm.raffuChippi) || 0

        const total = (pc + nl + tl + r + nb + s + pcoll + rc).toFixed(2)
        setProcessingForm(prev => ({ ...prev, totalExps: total }))
    }, [
        processingForm.purchaseCost, processingForm.nikashiLabour, processingForm.tayariLabour,
        processingForm.rent, processingForm.newBags, processingForm.sutli,
        processingForm.pktCollection, processingForm.raffuChippi
    ])

    const openProcessingModal = (pId = null) => {
        setIsEditingProcessing(false)
        setEditProcessingId(null)
        setPurchaseSearch('')
        setProcessingForm({
            purchaseId: pId || '',
            processingDate: new Date().toISOString().split('T')[0],
            nikashiPkt: '0',
            purchaseCost: '0',
            nikashiLabour: '0',
            tayariLabour: '0',
            rent: '0',
            newBags: '0',
            sutli: '0',
            pktCollection: '0',
            raffuChippi: '0',
            totalExps: '0',
            tayariPkt: '0',
            tayariWt: '0',
            charriPkt: '0',
            charriWt: '0'
        })

        if (pId) {
            const purchase = purchaseData.find(p => p.id === pId)
            if (purchase) {
                setProcessingForm(prev => ({ ...prev, purchaseCost: purchase.totalCost || '0' }))
                setPurchaseSearch(`Lot ${purchase.lotNo} - ${purchase.purchasedFor?.name || purchase.supplier?.name}`)
            }
        }

        setProcessingModalVisible(true)
    }

    const handleEditProcessing = (proc) => {
        setIsEditingProcessing(true)
        setEditProcessingId(proc.id)
        const purchase = purchaseData.find(p => p.id === proc.purchaseId)
        setPurchaseSearch(purchase ? `Lot ${purchase.lotNo} - ${purchase.purchasedFor?.name || purchase.supplier?.name}` : '')
        setProcessingForm({
            purchaseId: proc.purchaseId,
            processingDate: proc.processingDate,
            nikashiPkt: proc.nikashiPkt || '0',
            purchaseCost: proc.purchaseCost || '0',
            nikashiLabour: proc.nikashiLabour || '0',
            tayariLabour: proc.tayariLabour || '0',
            rent: proc.rent || '0',
            newBags: proc.newBags || '0',
            sutli: proc.sutli || '0',
            pktCollection: proc.pktCollection || '0',
            raffuChippi: proc.raffuChippi || '0',
            totalExps: proc.totalExps || '0',
            tayariPkt: proc.tayariPkt || '0',
            tayariWt: proc.tayariWt || '0',
            charriPkt: proc.charriPkt || '0',
            charriWt: proc.charriWt || '0'
        })
        setProcessingModalVisible(true)
    }

    const selectPurchase = (p) => {
        const existingProc = p.processings && p.processings[0]
        setProcessingForm({
            ...processingForm,
            purchaseId: p.id,
            purchaseCost: existingProc ? existingProc.purchaseCost : (p.totalCost || '0'),
            nikashiLabour: '0',
            tayariLabour: '0',
            rent: '0',
            newBags: '0',
            sutli: '0',
            pktCollection: '0',
            raffuChippi: '0',
            nikashiPkt: '0',
            tayariPkt: '0',
            tayariWt: '0',
            charriPkt: '0',
            charriWt: '0'
        })
        setPurchaseSearch(`Lot ${p.lotNo} - ${p.purchasedFor?.name || p.supplier?.name}`)
        setShowPurchaseList(false)
    }

    const filteredPurchases = purchaseData.filter(p => {
        const matchesSearch = p.lotNo?.toString().includes(purchaseSearch) ||
            p.purchasedFor?.name?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
            p.supplier?.name?.toLowerCase().includes(purchaseSearch.toLowerCase())

        return matchesSearch
    })

    const handleProcessingSave = async () => {
        if (!processingForm.purchaseId) {
            alert('Please select a Lot')
            return
        }
        try {
            if (isEditingProcessing) {
                await lotProcessingApi.update(editProcessingId, processingForm)
            } else {
                await lotProcessingApi.create(processingForm)
            }
            setProcessingModalVisible(false)
            fetchPurchases()
        } catch (error) {
            console.error('Error saving processing:', error)
            alert(error.response?.data?.message || 'Error saving processing data')
        }
    }

    const handleExportExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            alert('No data available to export')
            return
        }

        const excelData = []
        filteredData.forEach(p => {
            if (p.processings && p.processings.length > 0) {
                p.processings.forEach(pr => {
                    excelData.push({
                        'Lot No': p.lotNo,
                        'Party': p.purchasedFor?.name || p.supplier?.name || '-',
                        'Nikashi Date': pr.processingDate ? pr.processingDate.split('-').reverse().join('.') : '-',
                        'Nikashi Pkt': pr.nikashiPkt,
                        'Purchase Cost': pr.purchaseCost,
                        'Nikashi Labour': pr.nikashiLabour,
                        'Tayari Labour': pr.tayariLabour,
                        'Rent': pr.rent,
                        'New Bags': pr.newBags,
                        'Sutli': pr.sutli,
                        'Pkt Collection': pr.pktCollection,
                        'Raffu & Chippi': pr.raffuChippi,
                        'Total Exp': pr.totalExps,
                        'Tayari Pkt': pr.tayariPkt,
                        'Tayari Wt': pr.tayariWt,
                        'Charri Pkt': pr.charriPkt,
                        'Charri Wt': pr.charriWt
                    })
                })
            } else {
                excelData.push({
                    'Lot No': p.lotNo,
                    'Party': p.purchasedFor?.name || p.supplier?.name || '-',
                    'Nikashi Date': '-',
                    'Nikashi Pkt': '0',
                    'Purchase Cost': p.totalCost || '0',
                    'Nikashi Labour': '0',
                    'Tayari Labour': '0',
                    'Rent': '0',
                    'New Bags': '0',
                    'Sutli': '0',
                    'Pkt Collection': '0',
                    'Raffu & Chippi': '0',
                    'Total Exp': '0',
                    'Tayari Pkt': '0',
                    'Tayari Wt': '0',
                    'Charri Pkt': '0',
                })
            }
        })

        excelData.push({
            'Lot No': 'TOTAL',
            'Party': '',
            'Nikashi Date': '',
            'Nikashi Pkt': grandTotals.totalNikashiPkt,
            'Purchase Cost': grandTotals.totalProcCost,
            'Nikashi Labour': grandTotals.totalNikashiLabour,
            'Tayari Labour': grandTotals.totalTayariLabour,
            'Rent': grandTotals.totalRent,
            'New Bags': grandTotals.totalNewBags,
            'Sutli': grandTotals.totalSutli,
            'Pkt Collection': grandTotals.totalPktCollection,
            'Raffu & Chippi': grandTotals.totalRaffuChippi,
            'Total Exp': grandTotals.totalProcExps,
            'Tayari Pkt': grandTotals.totalTayariPkt,
            'Tayari Wt': grandTotals.totalTayariWt,
            'Charri Pkt': grandTotals.totalCharriPkt,
            'Charri Wt': grandTotals.totalCharriWt
        })

        exportToExcel(excelData, `Lot_Processing_Records_${currentYear}`)
    }

    const handleDeleteProcessing = async (id) => {
        if (!window.confirm('Are you sure you want to delete this processing record?')) return
        try {
            await lotProcessingApi.delete(id)
            fetchPurchases()
        } catch (error) {
            console.error('Error deleting processing:', error)
        }
    }

    const handleProcessingChange = (e) => {
        const { name, value } = e.target
        let updatedForm = { ...processingForm, [name]: value }

        if (name === 'purchaseId' || name === 'nikashiPkt' || name === 'tayariPkt') {
            const purchaseId = name === 'purchaseId' ? parseInt(value) : parseInt(updatedForm.purchaseId)
            const purchase = purchaseData.find(p => p.id === purchaseId)

            if (purchase) {
                if (name === 'purchaseId') {
                    updatedForm.purchaseCost = purchase.totalCost || '0'
                }

                const nPkt = parseInt(updatedForm.nikashiPkt) || 0
                const tPkt = parseInt(updatedForm.tayariPkt) || 0
                const wt = parseFloat(purchase.grWt) || 0

                updatedForm.nikashiLabour = (nPkt * (purchase.itemUnloadingRate || 0)).toFixed(2)
                updatedForm.tayariLabour = (nPkt * (purchase.itemTaiyariRate || 0)).toFixed(2)
                updatedForm.rent = (wt * (purchase.itemRentRate || 0)).toFixed(2)
            }
        }

        setProcessingForm(updatedForm)
    }

    const filteredData = purchaseData.filter(p => {
        const matchesOverall = searchTerm === '' ||
            p.lotNo?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.purchasedFor?.name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLot = filterLotNo === '' || p.lotNo?.toString().toLowerCase().includes(filterLotNo.toLowerCase())
        const matchesParty = filterParty === '' ||
            (p.supplier?.name?.toLowerCase().includes(filterParty.toLowerCase()) ||
                p.purchasedFor?.name?.toLowerCase().includes(filterParty.toLowerCase()))

        return matchesOverall && matchesLot && matchesParty
    })

    const totals = (data) => {
        const totalPackets = data.reduce((sum, p) => sum + (parseInt(p.noOfPacket) || 0), 0)
        const totalNetWt = data.reduce((sum, p) => sum + (parseFloat(p.netWt) || 0), 0)
        const totalCost = data.reduce((sum, p) => sum + (parseFloat(p.totalCost) || 0), 0)

        // Processing totals
        const allProcs = data.flatMap(p => p.processings || [])
        const totalNikashiPkt = allProcs.reduce((sum, pr) => sum + (parseInt(pr.nikashiPkt) || 0), 0)
        const totalProcCost = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.purchaseCost) || 0), 0)
        const totalNikashiLabour = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.nikashiLabour) || 0), 0)
        const totalTayariLabour = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.tayariLabour) || 0), 0)
        const totalRent = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.rent) || 0), 0)
        const totalProcExps = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.totalExps) || 0), 0)
        const totalTayariPkt = allProcs.reduce((sum, pr) => sum + (parseInt(pr.tayariPkt) || 0), 0)
        const totalTayariWt = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.tayariWt) || 0), 0)
        const totalCharriPkt = allProcs.reduce((sum, pr) => sum + (parseInt(pr.charriPkt) || 0), 0)
        const totalCharriWt = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.charriWt) || 0), 0)

        const totalNewBags = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.newBags) || 0), 0)
        const totalSutli = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.sutli) || 0), 0)
        const totalPktCollection = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.pktCollection) || 0), 0)
        const totalRaffuChippi = allProcs.reduce((sum, pr) => sum + (parseFloat(pr.raffuChippi) || 0), 0)

        return {
            totalPackets,
            totalNetWt: totalNetWt.toFixed(3),
            totalCost: totalCost.toFixed(2),
            totalNikashiPkt,
            totalProcCost: totalProcCost.toFixed(2),
            totalNikashiLabour: totalNikashiLabour.toFixed(2),
            totalTayariLabour: totalTayariLabour.toFixed(2),
            totalRent: totalRent.toFixed(2),
            totalProcExps: totalProcExps.toFixed(2),
            totalTayariPkt,
            totalTayariWt: totalTayariWt.toFixed(3),
            totalCharriPkt,
            totalCharriWt: totalCharriWt.toFixed(3),
            totalNewBags,
            totalSutli,
            totalPktCollection,
            totalRaffuChippi
        }
    }

    const grandTotals = totals(filteredData)

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)

    return (
        <>
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

            :root {
                --proc-50: #fef2f2;
                --proc-100: #fee2e2;
                --proc-200: #fecaca;
                --proc-500: #ef4444;
                --proc-600: #dc2626;
                --proc-700: #b91c1c;
                --proc-800: #991b1b;
                --proc-900: #7f1d1d;

                --neutral-50: #f8fafc;
                --neutral-100: #f1f5f9;
                --neutral-200: #e2e8f0;
                --neutral-300: #cbd5e1;
                --neutral-400: #94a3b8;
                --neutral-500: #64748b;
                --neutral-600: #475569;
                --neutral-700: #334155;
                --neutral-800: #1e293b;
                --neutral-900: #0f172a;

                --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                --radius-lg: 14px;
            }

            * { font-family: 'Inter', sans-serif !important; }

            .processing-header {
                background: linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-800) 50%, var(--neutral-700) 100%) !important;
                color: white !important;
                letter-spacing: 0.8px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }

            .sub-header-light {
                background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%) !important;
                color: #334155 !important;
                font-weight: 700 !important;
                font-size: 0.65rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                border-bottom: 3px solid var(--neutral-300) !important;
                border-right: 1px solid var(--neutral-100) !important;
                padding: 10px 8px !important;
                white-space: nowrap;
            }

            .header-red { color: #dc3545 !important; border-bottom-color: #dc3545 !important; }

            .header-add-btn {
                background: rgba(255,255,255,0.15) !important;
                backdrop-filter: blur(10px) !important;
                color: white !important;
                border: 1.5px solid rgba(255,255,255,0.25) !important;
                font-weight: 700 !important;
                font-size: 0.7rem !important;
                padding: 5px 14px !important;
                border-radius: 8px !important;
                text-transform: uppercase !important;
            }

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

            .table-container {
                background: white;
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                border: 1px solid var(--neutral-200);
                overflow: hidden;
            }

            .table-container .table td {
                padding: 8px 10px !important;
                font-size: 0.73rem !important;
                color: var(--neutral-700);
                border-color: var(--neutral-100) !important;
            }

            .price-col {
                font-family: 'JetBrains Mono', monospace !important;
                font-weight: 600 !important;
                letter-spacing: -0.3px;
            }

            .text-danger-custom {
                color: #dc3545 !important;
                font-weight: 700 !important;
            }

            .hover-row:hover td {
                background-color: var(--neutral-50) !important;
            }

            .action-btn-group {
                display: flex;
                gap: 2px;
                justify-content: center;
            }

            .action-btn-group .btn {
                width: 28px;
                height: 28px;
                padding: 0 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px !important;
                transition: all 0.2s ease !important;
            }

            .action-btn-group .btn:hover {
                transform: scale(1.1);
            }

            .amount-display {
                padding: 14px 18px;
                border-radius: 10px;
                border: 1.5px solid var(--neutral-200);
                background: linear-gradient(135deg, var(--neutral-50), white);
            }

            .amount-display.processing-amount {
                border-color: var(--processing-200);
                background: linear-gradient(135deg, var(--processing-50), white);
            }

            .form-section-title {
                font-size: 11px;
                font-weight: 800;
                color: var(--neutral-500);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--neutral-100);
            }
        `}</style>

            <CRow className="mb-3 g-2">
                <CCol md={2}>
                    <div style={{ background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }} className="h-100 py-1">
                        <label className="mb-0 me-2 small fw-bold text-uppercase">Year</label>
                        <CFormSelect size="sm" style={{ width: '80px', display: 'inline-block' }} value={currentYear} onChange={(e) => { setCurrentYear(e.target.value); setCurrentPage(1); }}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </CFormSelect>
                    </div>
                </CCol>
                <CCol md={10}></CCol>
            </CRow>

            <CCard className="border-0 shadow-sm mb-4">
                <CCardBody className="p-0">
                    <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                        <CTable bordered className="text-center align-middle mb-0" style={{ minWidth: '1800px' }}>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell colSpan={15} className="processing-header text-uppercase py-2">
                                        <div className="d-flex align-items-center justify-content-between px-3">
                                            <div className="d-flex gap-2">
                                                <CButton size="sm" className="header-add-btn" onClick={() => openProcessingModal()}>
                                                    <CIcon icon={cilPlus} className="me-1" /> Add Processing
                                                </CButton>
                                                <CButton size="sm" color="success" className="text-white fw-bold shadow-sm" onClick={handleExportExcel} style={{ fontSize: '0.7rem', padding: '5px 14px', borderRadius: '8px' }}>
                                                    <CIcon icon={cilFile} className="me-1" /> Export Excel
                                                </CButton>
                                            </div>
                                            <span className="section-title-badge">TAIYARI PROCESS</span>
                                            <div style={{ width: '120px' }}></div>
                                        </div>
                                    </CTableHeaderCell>
                                </CTableRow>
                                <CTableRow>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '120px' }}>
                                        Lot No.
                                        <CFormInput
                                            size="sm"
                                            className="mt-1 py-0 px-1 border-danger"
                                            placeholder="Lot No..."
                                            style={{ fontSize: '0.65rem' }}
                                            value={filterLotNo}
                                            onChange={(e) => { setFilterLotNo(e.target.value); setCurrentPage(1); }}
                                        />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '120px' }}>
                                        Nikashi Date/Party
                                        <CFormInput
                                            size="sm"
                                            className="mt-1 py-0 px-1"
                                            placeholder="Search..."
                                            style={{ fontSize: '0.65rem' }}
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>Nikashi Pkt</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '110px' }}>Purchase Cost</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '130px' }}> Labour (Per Pkt)</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '130px' }}>Tayari Labour (Per Pkt)</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '110px' }}>Rent Per Qtl</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>New Bags</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>Sutli</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Pkt Collection</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '110px' }}>Raffu & Chippi</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '120px' }}>Total Exp</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>Tayari Pkt</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>Tayari Wt (Qtl)</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>Charri Pkt</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '90px' }}>Charri Wt (Qtl)</CTableHeaderCell>
                                    {isImpersonating && <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Actions</CTableHeaderCell>}
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow><CTableDataCell colSpan={15} className="py-5">Loading...</CTableDataCell></CTableRow>
                                ) : currentItems.length === 0 ? (
                                    <CTableRow><CTableDataCell colSpan={15} className="py-5">No results found for your search</CTableDataCell></CTableRow>
                                ) : (
                                    currentItems.map((pRow) => (
                                        <React.Fragment key={pRow.id}>
                                            {(pRow.processings && pRow.processings.length > 0) ? (
                                                pRow.processings.map((pr) => (
                                                    <CTableRow key={pr.id} className="hover-row">
                                                        <CTableDataCell className="text-danger-custom">
                                                            <div>{pRow.lotNo}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 'normal' }}>
                                                                {pRow.purchasedFor?.name || pRow.supplier?.name}
                                                            </div>
                                                        </CTableDataCell>
                                                        <CTableDataCell>{pr.processingDate ? pr.processingDate.split('-').reverse().join('.') : '-'}</CTableDataCell>
                                                        <CTableDataCell className="fw-bold">{pr.nikashiPkt}</CTableDataCell>
                                                        <CTableDataCell className="text-danger-custom price-col">{pr.purchaseCost}</CTableDataCell>
                                                        <CTableDataCell className="text-danger-custom price-col">{pr.nikashiLabour}</CTableDataCell>
                                                        <CTableDataCell className="text-danger-custom price-col">{pr.tayariLabour}</CTableDataCell>
                                                        <CTableDataCell className="text-danger-custom price-col">{pr.rent}</CTableDataCell>
                                                        <CTableDataCell className="price-col">{pr.newBags}</CTableDataCell>
                                                        <CTableDataCell className="price-col">{pr.sutli}</CTableDataCell>
                                                        <CTableDataCell className="price-col">{pr.pktCollection}</CTableDataCell>
                                                        <CTableDataCell className="price-col">{pr.raffuChippi}</CTableDataCell>
                                                        <CTableDataCell className="text-danger-custom price-col">{pr.totalExps}</CTableDataCell>
                                                        <CTableDataCell className="fw-bold">{pr.tayariPkt}</CTableDataCell>
                                                        <CTableDataCell className="fw-bold text-primary">{pr.tayariWt}</CTableDataCell>
                                                        <CTableDataCell className="fw-bold">{pr.charriPkt}</CTableDataCell>
                                                        <CTableDataCell className="fw-bold text-primary">{pr.charriWt}</CTableDataCell>
                                                        {isImpersonating && (
                                                            <CTableDataCell>
                                                                <div className="action-btn-group">
                                                                    <CButton color="info" size="sm" variant="ghost" onClick={() => handleEditProcessing(pr)}><CIcon icon={cilPencil} size="sm" /></CButton>
                                                                    <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteProcessing(pr.id)}><CIcon icon={cilTrash} size="sm" /></CButton>
                                                                </div>
                                                            </CTableDataCell>
                                                        )}
                                                    </CTableRow>
                                                ))
                                            ) : (
                                                <CTableRow className="hover-row">
                                                    <CTableDataCell className="text-danger-custom">
                                                        <div>{pRow.lotNo}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 'normal' }}>
                                                            {pRow.purchasedFor?.name || pRow.supplier?.name}
                                                        </div>
                                                    </CTableDataCell>
                                                    <CTableDataCell colSpan={isImpersonating ? 14 : 15} className="text-muted small">No processing data</CTableDataCell>
                                                    <CTableDataCell>
                                                        <div className="action-btn-group">
                                                            <CButton color="primary" size="sm" variant="ghost" onClick={() => openProcessingModal(pRow.id)}>
                                                                <CIcon icon={cilPlus} size="sm" />
                                                            </CButton>
                                                        </div>
                                                    </CTableDataCell>
                                                </CTableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                                {/* Grand Totals Row */}
                                <CTableRow style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                    <CTableDataCell colSpan={2} className="text-end px-3 text-muted" style={{ fontSize: '0.7rem' }}>GRAND TOTAL</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom">{grandTotals.totalNikashiPkt}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalProcCost}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalNikashiLabour}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalTayariLabour}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalRent}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalNewBags}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalSutli}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalPktCollection}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalRaffuChippi}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom price-col">{grandTotals.totalProcExps}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom">{grandTotals.totalTayariPkt}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom">{grandTotals.totalTayariWt}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom">{grandTotals.totalCharriPkt}</CTableDataCell>
                                    <CTableDataCell className="text-danger-custom">{grandTotals.totalCharriWt}</CTableDataCell>
                                    {isImpersonating && <CTableDataCell></CTableDataCell>}
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                    </div>
                </CCardBody>
                {totalPages > 1 && (
                    <div className="px-3 py-2 border-top bg-light d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2 bg-white px-2 rounded border" style={{ borderColor: '#e2e8f0', height: '31px' }}>
                                <span className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.6rem' }}>Rows:</span>
                                <CFormSelect
                                    size="sm"
                                    className="border-0 fw-bold text-danger p-0"
                                    style={{ width: '50px', boxShadow: 'none', fontSize: '0.75rem' }}
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="30">30</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </CFormSelect>
                            </div>
                            <div className="small text-muted fw-bold">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records
                            </div>
                        </div>
                        <div className="d-flex gap-1">
                            <CButton
                                size="sm"
                                color="secondary"
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >Previous</CButton>
                            {[...Array(totalPages)].map((_, i) => (
                                <CButton
                                    key={i}
                                    size="sm"
                                    color={currentPage === i + 1 ? 'danger' : 'secondary'}
                                    variant={currentPage === i + 1 ? 'solid' : 'outline'}
                                    style={{ width: '30px' }}
                                    onClick={() => setCurrentPage(i + 1)}
                                >{i + 1}</CButton>
                            ))}
                            <CButton
                                size="sm"
                                color="secondary"
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >Next</CButton>
                        </div>
                    </div>
                )}
            </CCard>

            <CModal visible={processingModalVisible} onClose={() => setProcessingModalVisible(false)} size="xl">
                <CModalHeader className="modal-header-processing">
                    <CModalTitle className="fs-6 fw-bold">
                        {isEditingProcessing ? '✏️ Edit Processing' : '⚙️ New Processing (Second Entry)'}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody className="p-4 bg-light">
                    <CForm>
                        <div className="form-section-title mb-2">Lot Selection</div>
                        <CRow className="mb-2 g-2">
                            <CCol md={6} className="position-relative">
                                <CFormLabel className="small fw-bold mb-1">Select Purchase Lot *</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                                    <CFormInput
                                        placeholder="Search Lot No or Party..."
                                        value={purchaseSearch}
                                        onChange={(e) => {
                                            setPurchaseSearch(e.target.value)
                                            setShowPurchaseList(true)
                                        }}
                                        onFocus={() => setShowPurchaseList(true)}
                                        disabled={isEditingProcessing}
                                    />
                                </CInputGroup>
                                {showPurchaseList && purchaseSearch && !isEditingProcessing && (
                                    <CListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }} ref={purchaseListRef}>
                                        {filteredPurchases.map(p => (
                                            <CListGroupItem
                                                key={p.id}
                                                onClick={() => selectPurchase(p)}
                                                className="small py-2"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <strong>Lot {p.lotNo}</strong> - {p.purchasedFor?.name || p.supplier?.name} <span className="text-muted">({p.item?.name})</span>
                                            </CListGroupItem>
                                        ))}
                                        {filteredPurchases.length === 0 && <CListGroupItem className="small">No lots found</CListGroupItem>}
                                    </CListGroup>
                                )}
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold mb-1">Processing Date</CFormLabel>
                                <CFormInput type="date" name="processingDate" size="sm" value={processingForm.processingDate} onChange={handleProcessingChange} />
                            </CCol>
                        </CRow>

                        {processingForm.purchaseId && (
                            <div className="mb-3 p-3 rounded bg-white border shadow-sm">
                                <div className="form-section-title mb-3 text-primary" style={{ borderBottomColor: '#cfe2f3' }}>
                                    Current Status of Lot {purchaseData.find(p => p.id === parseInt(processingForm.purchaseId))?.lotNo}
                                </div>
                                <CTable small bordered className="text-center mb-0" style={{ fontSize: '0.65rem' }}>
                                    <CTableHead>
                                        <CTableRow className="bg-light">
                                            <CTableHeaderCell>Nikashi Pkt</CTableHeaderCell>
                                            <CTableHeaderCell>Tayari Pkt</CTableHeaderCell>
                                            <CTableHeaderCell>Charri Pkt</CTableHeaderCell>
                                            <CTableHeaderCell>Weight (T+C)</CTableHeaderCell>
                                            <CTableHeaderCell>Total Expenses</CTableHeaderCell>
                                        </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                        {(() => {
                                            const p = purchaseData.find(p => p.id === parseInt(processingForm.purchaseId));
                                            const proc = p?.processings?.[0] || {};
                                            return (
                                                <CTableRow>
                                                    <CTableDataCell className="fw-bold">{proc.nikashiPkt || 0} / {p?.noOfPacket || 0}</CTableDataCell>
                                                    <CTableDataCell className="fw-bold">{proc.tayariPkt || 0}</CTableDataCell>
                                                    <CTableDataCell className="fw-bold">{proc.charriPkt || 0}</CTableDataCell>
                                                    <CTableDataCell className="fw-bold text-primary">{(parseFloat(proc.tayariWt) || 0) + (parseFloat(proc.charriWt) || 0)} Qtl</CTableDataCell>
                                                    <CTableDataCell className="fw-bold text-danger">₹ {proc.totalExps || 0}</CTableDataCell>
                                                </CTableRow>
                                            )
                                        })()}
                                    </CTableBody>
                                </CTable>
                                <div className="mt-2 text-muted italic" style={{ fontSize: '0.6rem' }}>
                                    * Adding new values below will be SUMMED with these existing totals.
                                </div>
                            </div>
                        )}

                        <div className="form-section-title mb-2 text-danger">Add New Processing (Additional Entry)</div>
                        <CRow className="mb-2 g-2">
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">New Nikashi</CFormLabel>
                                <CFormInput type="number" name="nikashiPkt" size="sm" value={processingForm.nikashiPkt} onChange={handleProcessingChange} placeholder="Add Pkt..." />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">New Tayari</CFormLabel>
                                <CFormInput type="number" name="tayariPkt" size="sm" value={processingForm.tayariPkt} onChange={handleProcessingChange} placeholder="Add Pkt..." />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold mb-1">New Tayari Wt</CFormLabel>
                                <CFormInput type="number" step="0.001" name="tayariWt" size="sm" value={processingForm.tayariWt} onChange={handleProcessingChange} placeholder="Add Wt..." />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">New Charri</CFormLabel>
                                <CFormInput type="number" name="charriPkt" size="sm" value={processingForm.charriPkt} onChange={handleProcessingChange} placeholder="Add Pkt..." />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold mb-1">New Charri Wt</CFormLabel>
                                <CFormInput type="number" step="0.001" name="charriWt" size="sm" value={processingForm.charriWt} onChange={handleProcessingChange} placeholder="Add Wt..." />
                            </CCol>
                        </CRow>

                        <div className="form-section-title mb-2">Expense Breakdown (₹)</div>
                        <CRow className="mb-2 g-2">
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold mb-1">Purchase Cost</CFormLabel>
                                <CFormInput
                                    type="number"
                                    name="purchaseCost"
                                    size="sm"
                                    value={processingForm.purchaseCost}
                                    onChange={handleProcessingChange}
                                    disabled={!isEditingProcessing && purchaseData.find(p => p.id === parseInt(processingForm.purchaseId))?.processings?.length > 0}
                                />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold mb-1">Unloading Labour</CFormLabel>
                                <CFormInput type="number" name="nikashiLabour" size="sm" value={processingForm.nikashiLabour} onChange={handleProcessingChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold mb-1">Tayari Labour</CFormLabel>
                                <CFormInput type="number" name="tayariLabour" size="sm" value={processingForm.tayariLabour} onChange={handleProcessingChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold mb-1">Rent</CFormLabel>
                                <CFormInput type="number" name="rent" size="sm" value={processingForm.rent} onChange={handleProcessingChange} />
                            </CCol>
                        </CRow>

                        <div className="form-section-title mb-2">Other Expenses</div>
                        <CRow className="mb-2 g-2 align-items-end">
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">New Bags</CFormLabel>
                                <CFormInput type="number" name="newBags" size="sm" value={processingForm.newBags} onChange={handleProcessingChange} />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">Sutli</CFormLabel>
                                <CFormInput type="number" name="sutli" size="sm" value={processingForm.sutli} onChange={handleProcessingChange} />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">Pkt Coll.</CFormLabel>
                                <CFormInput type="number" name="pktCollection" size="sm" value={processingForm.pktCollection} onChange={handleProcessingChange} />
                            </CCol>
                            <CCol md={2}>
                                <CFormLabel className="small fw-bold mb-1">Raffu/Chippi</CFormLabel>
                                <CFormInput type="number" name="raffuChippi" size="sm" value={processingForm.raffuChippi} onChange={handleProcessingChange} />
                            </CCol>
                            <CCol md={4}>
                                <div className="amount-display processing-amount py-2 text-center" style={{ border: '2px solid #ef4444', borderRadius: '10px' }}>
                                    <div className="label small fw-bold text-uppercase text-muted" style={{ fontSize: '0.65rem' }}>Total Processing Exp</div>
                                    <div className="value fw-bold fs-5 text-danger">₹ {processingForm.totalExps}</div>
                                </div>
                            </CCol>
                        </CRow>
                    </CForm>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" size="sm" onClick={() => setProcessingModalVisible(false)}>Close</CButton>
                    <CButton color="primary" size="sm" onClick={handleProcessingSave}>
                        {isEditingProcessing ? 'Update Processing' : 'Save Processing'}
                    </CButton>
                </CModalFooter>
            </CModal >
        </>
    )
}

export default LotProcessing
