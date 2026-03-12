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
import { cilPlus, cilPencil, cilTrash, cilSearch, cilDescription, cilFile } from '@coreui/icons'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saleApi, supplierApi, lotProcessingApi } from '../../api/reservationApi'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel } from '../../utils/excelExport'

const Sale = () => {
    const { isImpersonating, user } = useAuth()
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [purchaseData, setPurchaseData] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLotNo, setFilterLotNo] = useState('')
    const [filterParty, setFilterParty] = useState('')

    // State for modals
    const [saleModalVisible, setSaleModalVisible] = useState(false)
    const [isEditingSale, setIsEditingSale] = useState(false)
    const [editSaleId, setEditSaleId] = useState(null)

    // Form State
    const [saleForm, setSaleForm] = useState({
        purchaseId: '',
        saleType: 'Taiyari',
        saleDt: new Date().toISOString().split('T')[0],
        party: '',
        salePkt: '',
        saleWt: '',
        rate: '',
        amount: '0',
    })

    // Search states
    const [lotSearch, setLotSearch] = useState('')
    const [showLotList, setShowLotList] = useState(false)
    const [partySearch, setPartySearch] = useState('')
    const [showPartyList, setShowPartyList] = useState(false)

    // Additional info for selected lot
    const [selectedPurchase, setSelectedPurchase] = useState(null)
    const [selectedLotInfo, setSelectedLotInfo] = useState({
        owner: '',
        item: '',
        lotNo: ''
    })

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
    }, [currentYear])

    const fetchInitialData = async () => {
        try {
            const suppliersRes = await supplierApi.getAll()
            setSuppliers(suppliersRes.data.data)
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    const exportSaleBill = (s) => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4')
            const location = s?.location || user?.location || {}
            const locationName = location.name || 'TRADING SYSTEM'

            const companyName = location.nameHindi || locationName.toUpperCase()
            const companyAddress = location.addressHindi || ''
            const companyOffice = location.officeHindi || ''

            let currentY = 10

            // Header Section
            doc.setFontSize(22)
            doc.setTextColor(40, 40, 40)
            doc.setFont(undefined, 'bold')
            doc.text(companyName, 105, currentY + 5, { align: 'center' })

            currentY += 12

            doc.setFontSize(11)
            doc.setFont(undefined, 'normal')
            if (companyAddress) {
                doc.text(companyAddress, 105, currentY, { align: 'center' })
                currentY += 6
            }
            if (companyOffice) {
                doc.text(companyOffice, 105, currentY, { align: 'center' })
                currentY += 6
            }

            doc.setFontSize(14)
            doc.setTextColor(80)
            doc.setFont(undefined, 'bold')
            doc.text('SALE BILL', 105, currentY + 2, { align: 'center' })

            doc.setLineWidth(0.4)
            doc.setDrawColor(180, 180, 180)
            doc.line(10, currentY + 6, 200, currentY + 6)

            const startY = currentY - 10

            // Bill Summary Info
            doc.setFontSize(10)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(50)
            doc.text(`Lot No: ${s.purchase?.lotNo || '-'}`, 15, startY + 23)
            doc.text(`Date: ${s.saleDt ? s.saleDt.split('-').reverse().join('.') : '-'}`, 195, startY + 23, { align: 'right' })

            doc.setFont(undefined, 'normal')
            doc.text(`Item: ${s.purchase?.item?.name || '-'}`, 15, startY + 28)
            doc.text(`Agreement No: ${s.purchase?.agreementNo || '-'}`, 195, startY + 28, { align: 'right' })

            // Party Info Block
            doc.setFillColor(248, 249, 250)
            doc.rect(10, startY + 34, 190, 25, 'F')
            doc.setDrawColor(220, 220, 220)
            doc.rect(10, startY + 34, 190, 25, 'S')

            doc.setFontSize(10)
            doc.setFont(undefined, 'bold')
            doc.text('SALE TO (PARTY)', 15, startY + 41)
            doc.text('SALE FROM (OWNER)', 110, startY + 41)

            // Fetch mobile numbers from master list if missing
            const partyInfo = suppliers.find(sup => sup.name === s.party)
            const ownerId = s.purchase?.purchasedForId || s.purchase?.supplierId
            const ownerInfo = suppliers.find(sup => sup.id === ownerId)

            const partyMob = partyInfo?.mobileNo || '-'
            const ownerMob = ownerInfo?.mobileNo || '-'

            doc.setFont(undefined, 'normal')
            doc.setFontSize(9.5)
            doc.text(`Name: ${s.party || '-'}`, 15, startY + 47)
            doc.text(`Mob : ${partyMob}`, 15, startY + 53)

            doc.text(`Name: ${s.purchase?.purchasedFor?.name || s.purchase?.supplier?.name || '-'}`, 110, startY + 47)
            doc.text(`Mob : ${ownerMob}`, 110, startY + 53)

            // Items Table
            autoTable(doc, {
                head: [['Description', 'Packets', 'Total Weight (Qtl)', 'Rate', 'Total Amount']],
                body: [[
                    s.purchase?.item?.name || '-',
                    s.salePkt || '-',
                    s.saleWt || '-',
                    `Rs. ${s.rate}`,
                    `Rs. ${s.amount}`
                ]],
                startY: startY + 65,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
                headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { halign: 'left', cellWidth: 60 },
                    4: { halign: 'right', fontStyle: 'bold' }
                }
            })

            // Summary Calculation
            let finalY = doc.lastAutoTable.finalY + 15
            doc.setFontSize(13)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(30, 40, 50)
            doc.text('NET TOTAL:', 150, finalY, { align: 'right' })
            doc.text(`Rs. ${s.amount}`, 190, finalY, { align: 'right' })

            // Footer
            finalY += 30
            const managerName = location.managerName || 'Manager'
            const managerPhone = location.phone || ''

            doc.setFontSize(10)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(40, 40, 40)
            doc.text('______________________', 190, finalY, { align: 'right' })
            doc.text(managerName, 190, finalY + 6, { align: 'right' })
            if (managerPhone) {
                doc.setFont(undefined, 'normal')
                doc.text(managerPhone, 190, finalY + 11, { align: 'right' })
            }

            finalY += 15
            doc.setFontSize(8)
            doc.setFont(undefined, 'italic')
            doc.setTextColor(150)

            doc.text(`Printed Date: ${new Date().toLocaleString()}`, 105, finalY + 5, { align: 'center' })

            doc.save(`Sale_Bill_Lot_${s.purchase?.lotNo}_${s.party}.pdf`)
        } catch (error) {
            console.error('PDF Export error:', error)
            alert('Failed to generate Sale Bill PDF')
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

    const openSaleModal = (pId = null) => {
        setIsEditingSale(false)
        setEditSaleId(null)
        setLotSearch('')
        setPartySearch('')
        setSelectedPurchase(null)
        setSelectedLotInfo({ owner: '', item: '', lotNo: '' })

        setSaleForm({
            purchaseId: pId || '',
            saleType: 'Taiyari',
            saleDt: new Date().toISOString().split('T')[0],
            party: '',
            salePkt: '',
            saleWt: '',
            rate: '',
            amount: '0',
        })

        if (pId) {
            const purchase = purchaseData.find(p => p.id === pId)
            if (purchase) {
                selectPurchase(purchase)
            }
        }

        setSaleModalVisible(true)
    }

    const selectPurchase = (p) => {
        setSelectedPurchase(p)
        const owner = p.purchasedFor?.name || p.supplier?.name || ''
        setSelectedLotInfo({
            owner: owner,
            item: p.item?.name || '',
            lotNo: p.lotNo
        })

        setSaleForm(prev => ({
            ...prev,
            purchaseId: p.id,
        }))
        setLotSearch(`Lot ${p.lotNo} - ${owner}`)
        setShowLotList(false)
    }

    const selectParty = (s) => {
        setSaleForm(prev => ({
            ...prev,
            party: s.name
        }))
        setPartySearch(s.name)
        setShowPartyList(false)
    }

    const handleSaleChange = (e) => {
        const { name, value } = e.target
        let updatedForm = { ...saleForm, [name]: value }

        if (name === 'saleWt' || name === 'rate') {
            const wt = parseFloat(name === 'saleWt' ? value : updatedForm.saleWt) || 0
            const rt = parseFloat(name === 'rate' ? value : updatedForm.rate) || 0
            updatedForm.amount = (wt * rt).toFixed(2)
        }

        setSaleForm(updatedForm)
    }

    const getAvailableStock = (purchase, type, editId) => {
        if (!purchase) return { availablePkt: 0, availableWt: 0, totalPkt: 0, totalWt: 0 }

        let totalPkt = 0
        let totalWt = 0

        if (type === 'Taiyari') {
            totalPkt = (purchase.processings || []).reduce((sum, pr) => sum + (parseInt(pr.tayariPkt) || 0), 0)
            totalWt = (purchase.processings || []).reduce((sum, pr) => sum + (parseFloat(pr.tayariWt) || 0), 0)
            if (totalPkt === 0 && totalWt === 0) {
                totalPkt = parseInt(purchase.noOfPacket) || 0
                totalWt = parseFloat(purchase.netWt) || 0
            }
        } else {
            totalPkt = (purchase.processings || []).reduce((sum, pr) => sum + (parseInt(pr.charriPkt) || 0), 0)
            totalWt = (purchase.processings || []).reduce((sum, pr) => sum + (parseFloat(pr.charriWt) || 0), 0)
        }

        const typeSales = (purchase.sales || []).filter(s => s.saleType === type && s.id !== editId)

        const soldPkt = typeSales.reduce((sum, s) => sum + (parseInt(s.salePkt) || 0), 0)
        const soldWt = typeSales.reduce((sum, s) => sum + (parseFloat(s.saleWt) || 0), 0)

        return {
            totalPkt,
            totalWt,
            availablePkt: Math.max(0, totalPkt - soldPkt),
            availableWt: Math.max(0, totalWt - soldWt)
        }
    }

    const handleSaleSave = async () => {
        if (!saleForm.purchaseId || !saleForm.party || !saleForm.saleWt || !saleForm.rate) {
            alert('Please fill all required fields')
            return
        }

        const enteredWt = parseFloat(saleForm.saleWt) || 0;
        const enteredPkt = parseInt(saleForm.salePkt) || 0;

        const { availablePkt, availableWt } = getAvailableStock(selectedPurchase, saleForm.saleType, isEditingSale ? editSaleId : null)

        if (enteredWt > availableWt) {
            alert(`Sale weight (${enteredWt}) cannot exceed the remaining ${saleForm.saleType} weight (${availableWt.toFixed(3)} Qtl)!`);
            return;
        }

        if (enteredPkt > availablePkt) {
            alert(`Sale packets (${enteredPkt}) cannot exceed the remaining ${saleForm.saleType} packets (${availablePkt})!`);
            return;
        }

        try {
            if (isEditingSale) {
                await saleApi.update(editSaleId, saleForm)
            } else {
                await saleApi.create(saleForm)
            }
            setSaleModalVisible(false)
            fetchData()
        } catch (error) {
            console.error('Error saving sale:', error)
            alert(error.response?.data?.message || 'Error saving sale data')
        }
    }

    const handleExportExcel = () => {
        if (!filteredTableData || filteredTableData.length === 0) {
            alert('No data available to export')
            return
        }

        const excelData = filteredTableData.map(s => ({
            'Lot No': s.purchase?.lotNo,
            'Sale Date': s.saleDt ? s.saleDt.split('-').reverse().join('.') : '-',
            'Sale For': s.purchase?.purchasedFor?.name || s.purchase?.supplier?.name || '-',
            'Sale Party': s.party,
            'Items': s.purchase?.item?.name || '-',
            'Sale Pkt': s.salePkt,
            'Sale Wt (Qtl)': s.saleWt,
            'Rate/Qtl': s.rate,
            'Sale Amt': s.amount
        }))

        excelData.push({
            'Lot No': 'TOTAL',
            'Sale Date': '',
            'Sale For': '',
            'Sale Party': '',
            'Items': '',
            'Sale Pkt': totalPkt,
            'Sale Wt (Qtl)': totalWt.toFixed(2),
            'Rate/Qtl': '',
            'Sale Amt': totalAmt.toFixed(2)
        })

        exportToExcel(excelData, `Sale_Records_${currentYear}`)
    }

    const handleEditSale = (pRow, sale) => {
        setIsEditingSale(true)
        setEditSaleId(sale.id)
        setSelectedPurchase(pRow)

        const owner = pRow.purchasedFor?.name || pRow.supplier?.name || ''
        setSelectedLotInfo({
            owner: owner,
            item: pRow.item?.name || '',
            lotNo: pRow.lotNo
        })

        setLotSearch(`Lot ${pRow.lotNo} - ${owner}`)
        setPartySearch(sale.party)

        setSaleForm({
            purchaseId: pRow.id,
            saleType: sale.saleType || 'Taiyari',
            saleDt: sale.saleDt,
            party: sale.party,
            salePkt: sale.salePkt,
            saleWt: sale.saleWt,
            rate: sale.rate,
            amount: sale.amount,
        })
        setSaleModalVisible(true)
    }

    const handleDeleteSale = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sale record?')) return
        try {
            await saleApi.delete(id)
            fetchData()
        } catch (error) {
            console.error('Error deleting sale:', error)
        }
    }

    // Filtering logic
    const filteredPurchasesForSearch = purchaseData.filter(p => {
        const owner = p.purchasedFor?.name || p.supplier?.name || ''
        return p.lotNo?.toString().includes(lotSearch) || owner.toLowerCase().includes(lotSearch.toLowerCase())
    })

    const filteredParties = suppliers.filter(s =>
        s.name?.toLowerCase().includes(partySearch.toLowerCase())
    )

    const filteredTableData = purchaseData.filter(p => {
        const matchesLot = filterLotNo === '' || p.lotNo?.toString().includes(filterLotNo)
        const matchesParty = filterParty === '' || (p.purchasedFor?.name || p.supplier?.name)?.toLowerCase().includes(filterParty.toLowerCase())
        return matchesLot && matchesParty
    }).flatMap(p => (p.sales || []).map(s => ({ ...s, purchase: p })))
        .filter(s => {
            const matchesSearch = searchTerm === '' ||
                s.party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.purchase?.lotNo?.toString().includes(searchTerm)
            return matchesSearch
        })

    // Totals
    const totalPkt = filteredTableData.reduce((sum, s) => sum + (parseInt(s.salePkt) || 0), 0)
    const totalWt = filteredTableData.reduce((sum, s) => sum + (parseFloat(s.saleWt) || 0), 0)
    const totalAmt = filteredTableData.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredTableData.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredTableData.length / itemsPerPage)

    return (
        <div className="sale-panel">
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

            :root {
                --neutral-50: #f8fafc;
                --neutral-100: #f1f5f9;
                --neutral-200: #e2e8f0;
                --neutral-300: #cbd5e1;
                --neutral-500: #64748b;
                --neutral-700: #334155;
                --neutral-800: #1e293b;
                --neutral-900: #0f172a;
                --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                --radius-lg: 14px;
            }

            * { font-family: 'Inter', sans-serif !important; }

            .sale-header-gradient {
                background: linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-800) 50%, var(--neutral-700) 100%) !important;
                color: white !important;
                letter-spacing: 0.8px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            }

            .sub-header-light {
                background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%) !important;
                color: #334155 !important;
                font-weight: 700 !important;
                font-size: 0.65rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                border-bottom: 3px solid var(--neutral-300) !important;
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
            .header-add-btn:hover { background: rgba(255,255,255,0.25) !important; }

            .table-container {
                background: white;
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                border: 1px solid var(--neutral-200);
                overflow: hidden;
            }

            .sale-table td {
                padding: 10px 8px !important;
                font-size: 0.75rem !important;
                border-color: var(--neutral-100) !important;
            }

            .lot-no-cell { color: #dc3545; font-weight: 700; }
            .amt-cell { color: #dc3545; font-weight: 700; font-family: 'JetBrains Mono', monospace !important; }
            .price-col { font-family: 'JetBrains Mono', monospace !important; font-weight: 600; }

            .total-row { background: #f8fafc; font-weight: 800; border-top: 2px solid var(--neutral-200); }
            .total-text { color: var(--neutral-800); text-transform: uppercase; font-size: 0.7rem; }
            .total-val { color: #dc3545; font-family: 'JetBrains Mono', monospace !important; }

            .stock-badge {
                padding: 12px;
                border-radius: 12px;
                background: white;
                border: 1.5px solid var(--neutral-200);
                margin-top: 10px;
            }
            .stock-item { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.75rem; }
            .stock-item:last-child { margin-bottom: 0; padding-top: 4px; border-top: 1px dashed #dee2e6; }
            .stock-label { font-weight: 600; color: #64748b; }
            .stock-value { font-weight: 800; }
            .text-remaining { color: #10b981; }

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
        `}</style>

            <CRow className="mb-3 g-2">
                <CCol md={2}>
                    <div style={{ background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                        <label className="mb-0 me-2 small fw-bold text-uppercase">Year</label>
                        <CFormSelect size="sm" style={{ width: '80px', display: 'inline-block' }} value={currentYear} onChange={(e) => { setCurrentYear(e.target.value); setCurrentPage(1); }}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </CFormSelect>
                    </div>
                </CCol>
            </CRow>

            <CCard className="border-0 shadow-sm mb-4">
                <CCardBody className="p-0">
                    <div className="table-container">
                        <CTable bordered className="text-center align-middle mb-0 sale-table">
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell colSpan={isImpersonating ? 10 : 9} className="sale-header-gradient text-uppercase py-2">
                                        <div className="d-flex align-items-center justify-content-between px-3">
                                            <div className="d-flex gap-2">
                                                <CButton size="sm" className="header-add-btn" onClick={() => openSaleModal()}>
                                                    <CIcon icon={cilPlus} className="me-1" /> Add Sale
                                                </CButton>
                                                <CButton size="sm" color="success" className="text-white fw-bold shadow-sm" onClick={handleExportExcel} style={{ fontSize: '0.7rem', padding: '5px 14px', borderRadius: '8px' }}>
                                                    <CIcon icon={cilFile} className="me-1" /> Export Excel
                                                </CButton>
                                            </div>
                                            <span className="section-title-badge">SALE PANEL (Third Entry)</span>
                                            <div style={{ width: '120px' }}></div>
                                        </div>
                                    </CTableHeaderCell>
                                </CTableRow>
                                <CTableRow>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '100px' }}>
                                        Lot No.
                                        <CFormInput size="sm" className="mt-1 py-0 px-1 border-danger" placeholder="Search..." style={{ fontSize: '0.6rem' }} value={filterLotNo} onChange={(e) => { setFilterLotNo(e.target.value); setCurrentPage(1); }} />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Sale Date</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '150px' }}>
                                        Sale For
                                        <CFormInput size="sm" className="mt-1 py-0 px-1" placeholder="Search..." style={{ fontSize: '0.6rem' }} value={filterParty} onChange={(e) => { setFilterParty(e.target.value); setCurrentPage(1); }} />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '150px' }}>
                                        Sale Party
                                        <CFormInput size="sm" className="mt-1 py-0 px-1" placeholder="Search..." style={{ fontSize: '0.6rem' }} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Items</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '80px' }}>Sale Pkt</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Sale Wt (Qtl)</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Rate/Qtl</CTableHeaderCell>
                                    <CTableHeaderCell className="sub-header-light header-red" style={{ width: '120px' }}>Sale Amt</CTableHeaderCell>
                                    {isImpersonating && <CTableHeaderCell className="sub-header-light" style={{ width: '100px' }}>Actions</CTableHeaderCell>}
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                {loading ? (
                                    <CTableRow><CTableDataCell colSpan={isImpersonating ? 10 : 9} className="py-5"><CSpinner color="primary" /></CTableDataCell></CTableRow>
                                ) : currentItems.length === 0 ? (
                                    <CTableRow><CTableDataCell colSpan={isImpersonating ? 10 : 9} className="py-5 text-muted fst-italic">No sale records found</CTableDataCell></CTableRow>
                                ) : (
                                    currentItems.map((s) => (
                                        <CTableRow key={s.id} className="hover-row">
                                            <CTableDataCell className="lot-no-cell">
                                                <div>{s.purchase?.lotNo}</div>
                                                <div className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 'normal' }}>
                                                    {s.purchase?.purchasedFor?.name || s.purchase?.supplier?.name}
                                                </div>
                                            </CTableDataCell>
                                            <CTableDataCell>{s.saleDt ? s.saleDt.split('-').reverse().join('.') : '-'}</CTableDataCell>
                                            <CTableDataCell>{s.purchase?.purchasedFor?.name || s.purchase?.supplier?.name}</CTableDataCell>
                                            <CTableDataCell className="fw-bold">{s.party}</CTableDataCell>
                                            <CTableDataCell>{s.purchase?.item?.name}</CTableDataCell>
                                            <CTableDataCell className="fw-bold">{s.salePkt}</CTableDataCell>
                                            <CTableDataCell className="price-col text-primary">{s.saleWt}</CTableDataCell>
                                            <CTableDataCell className="price-col">{s.rate}</CTableDataCell>
                                            <CTableDataCell className="amt-cell">₹ {s.amount}</CTableDataCell>
                                            <CTableDataCell>
                                                <div className="d-flex gap-1 justify-content-center">
                                                    <CButton size="sm" variant="ghost" color="warning" title="Print Bill" onClick={() => exportSaleBill(s)}>
                                                        <CIcon icon={cilDescription} size="sm" />
                                                    </CButton>
                                                    {isImpersonating && (
                                                        <>
                                                            <CButton size="sm" variant="ghost" color="info" onClick={() => handleEditSale(s.purchase, s)}><CIcon icon={cilPencil} size="sm" /></CButton>
                                                            <CButton size="sm" variant="ghost" color="danger" onClick={() => handleDeleteSale(s.id)}><CIcon icon={cilTrash} size="sm" /></CButton>
                                                        </>
                                                    )}
                                                </div>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                                <CTableRow className="total-row">
                                    <CTableDataCell colSpan={5} className="text-end total-text px-3">Total</CTableDataCell>
                                    <CTableDataCell className="total-val">{totalPkt}</CTableDataCell>
                                    <CTableDataCell className="total-val">{totalWt.toFixed(3)}</CTableDataCell>
                                    <CTableDataCell></CTableDataCell>
                                    <CTableDataCell className="total-val">₹ {totalAmt.toFixed(2)}</CTableDataCell>
                                    {isImpersonating && <CTableDataCell></CTableDataCell>}
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                    </div>
                </CCardBody>
                {totalPages > 1 && (
                    <div className="px-3 py-2 border-top bg-light d-flex justify-content-between align-items-center">
                        <div className="small text-muted fw-bold">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTableData.length)} of {filteredTableData.length} records
                        </div>
                        <div className="d-flex gap-1">
                            <CButton size="sm" color="secondary" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</CButton>
                            {[...Array(totalPages)].map((_, i) => (
                                <CButton key={i} size="sm" color={currentPage === i + 1 ? 'dark' : 'secondary'} variant={currentPage === i + 1 ? 'solid' : 'outline'} onClick={() => setCurrentPage(i + 1)}>{i + 1}</CButton>
                            ))}
                            <CButton size="sm" color="secondary" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</CButton>
                        </div>
                    </div>
                )}
            </CCard>

            <CModal visible={saleModalVisible} onClose={() => setSaleModalVisible(false)} size="lg" backdrop="static">
                <CModalHeader className="bg-dark text-white">
                    <CModalTitle className="fs-6 fw-bold">
                        {isEditingSale ? '✏️ EDIT SALE ENTRY' : '💰 NEW SALE ENTRY'}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody className="bg-light p-4">
                    <CForm>
                        <CRow className="mb-4 g-3">
                            <CCol md={6} className="position-relative">
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Lot Selection *</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                                    <CFormInput placeholder="Lot No or Malik Name..." value={lotSearch} onChange={(e) => { setLotSearch(e.target.value); setShowLotList(true); }} onFocus={() => setShowLotList(true)} disabled={isEditingSale} />
                                </CInputGroup>
                                {showLotList && lotSearch && !isEditingSale && (
                                    <CListGroup className="position-absolute w-100 shadow-lg border-0" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }} ref={lotListRef}>
                                        {filteredPurchasesForSearch.map(p => (
                                            <CListGroupItem key={p.id} onClick={() => selectPurchase(p)} className="small py-2 border-bottom" style={{ cursor: 'pointer' }}>
                                                <strong>Lot {p.lotNo}</strong> - {p.purchasedFor?.name || p.supplier?.name}
                                            </CListGroupItem>
                                        ))}
                                    </CListGroup>
                                )}
                                {selectedLotInfo.lotNo && (() => {
                                    const { totalPkt, availablePkt, availableWt } = getAvailableStock(selectedPurchase, saleForm.saleType, isEditingSale ? editSaleId : null);
                                    return (
                                        <div className="stock-badge shadow-sm">
                                            <div className="stock-item"><span className="stock-label">Lot No:</span> <span className="stock-value text-danger">{selectedLotInfo.lotNo}</span></div>
                                            <div className="stock-item"><span className="stock-label">Malik:</span> <span className="stock-value">{selectedLotInfo.owner}</span></div>
                                            <div className="stock-item"><span className="stock-label">Item:</span> <span className="stock-value">{selectedLotInfo.item}</span></div>
                                            <div className="stock-item">
                                                <span className="stock-label">Sale Type:</span>
                                                <span className="stock-value text-primary">{saleForm.saleType}</span>
                                            </div>
                                            <div className="stock-item">
                                                <span className="stock-label">Total Stock:</span>
                                                <span className="stock-value text-primary">{totalPkt} Pkt</span>
                                            </div>
                                            <div className="stock-item">
                                                <span className="stock-label">Available to Sell:</span>
                                                <span className="stock-value text-remaining">{availablePkt} Pkt | {availableWt.toFixed(3)} Qtl</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CCol>
                            <CCol md={6} className="position-relative">
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Sale Party *</CFormLabel>
                                <CInputGroup size="sm">
                                    <CInputGroupText><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                                    <CFormInput placeholder="Kisko bechna he? Name search karein..." value={partySearch} onChange={(e) => { setPartySearch(e.target.value); setShowPartyList(true); setSaleForm({ ...saleForm, party: e.target.value }); }} onFocus={() => setShowPartyList(true)} />
                                </CInputGroup>
                                {showPartyList && partySearch && (
                                    <CListGroup className="position-absolute w-100 shadow-lg border-0" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }} ref={partyListRef}>
                                        {filteredParties.map((s, idx) => (
                                            <CListGroupItem key={idx} onClick={() => selectParty(s)} className="small py-2 border-bottom" style={{ cursor: 'pointer' }}>{s.name}</CListGroupItem>
                                        ))}
                                    </CListGroup>
                                )}
                                <div className="mt-2 small text-muted fst-italic">Aap naya naam bhi type kar sakte hain.</div>

                                <div className="mt-3">
                                    <CFormLabel className="small fw-bold text-uppercase text-muted">Sale Type</CFormLabel>
                                    <CFormSelect size="sm" name="saleType" value={saleForm.saleType} onChange={handleSaleChange} className="fw-bold border-primary text-primary" style={{ backgroundColor: '#f8f9fa' }}>
                                        <option value="Taiyari">Taiyari Stock</option>
                                        <option value="Charri">Charri Stock</option>
                                    </CFormSelect>
                                </div>
                            </CCol>
                        </CRow>

                        <CRow className="mb-3 g-3">
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Sale Date</CFormLabel>
                                <CFormInput type="date" name="saleDt" size="sm" value={saleForm.saleDt} onChange={handleSaleChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Sale Packets</CFormLabel>
                                <CFormInput type="number" name="salePkt" size="sm" placeholder="Kitne bags?" value={saleForm.salePkt} onChange={handleSaleChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Sale Wt (Qtl) *</CFormLabel>
                                <CFormInput type="number" name="saleWt" size="sm" placeholder="Example: 10.500" value={saleForm.saleWt} onChange={handleSaleChange} step="0.001" />
                            </CCol>
                        </CRow>

                        <CRow className="g-3 align-items-end">
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold text-uppercase text-muted">Rate Per Qtl *</CFormLabel>
                                <CFormInput type="number" name="rate" size="sm" placeholder="Bhao per quintal" value={saleForm.rate} onChange={handleSaleChange} />
                            </CCol>
                            <CCol md={6}>
                                <div className="text-end">
                                    <div className="small fw-bold text-uppercase text-muted mb-1">Total Sale Amount</div>
                                    <div className="bg-white p-3 border rounded text-danger fw-bold fs-4 shadow-sm" style={{ fontFamily: 'JetBrains Mono' }}>
                                        ₹ {saleForm.amount}
                                    </div>
                                </div>
                            </CCol>
                        </CRow>
                    </CForm>
                </CModalBody>
                <CModalFooter className="bg-light border-top-0">
                    <CButton color="secondary" variant="ghost" className="fw-bold" onClick={() => setSaleModalVisible(false)}>CANCEL</CButton>
                    <CButton color="dark" className="px-4 fw-bold" onClick={handleSaleSave}>{isEditingSale ? 'UPDATE SALE' : 'SAVE SALE'}</CButton>
                </CModalFooter>
            </CModal>
        </div>
    )
}

export default Sale
