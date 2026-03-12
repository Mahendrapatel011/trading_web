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
import { cilPlus, cilPencil, cilTrash, cilSearch, cilMoney, cilExcerpt, cilDescription, cilFile } from '@coreui/icons'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { purchaseApi, supplierApi, masterApi, saleApi, loadingRateApi } from '../../api/reservationApi'
import { useAuth } from '../../context/AuthContext'
import { exportToExcel } from '../../utils/excelExport'

const PurchaseSale = () => {
    const { isImpersonating, user } = useAuth()
    // Current Context
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    // State for data
    const [purchaseData, setPurchaseData] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [items, setItems] = useState([])
    const [loadingRates, setLoadingRates] = useState([])
    const [loading, setLoading] = useState(false)

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLotNo, setFilterLotNo] = useState('')
    const [filterParty, setFilterParty] = useState('')

    // State for modals
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState(null)

    // Purchase Form State
    const [purchaseForm, setPurchaseForm] = useState({
        billDate: new Date().toISOString().split('T')[0],
        billNo: '',
        supplierId: '',
        supplierName: '',
        purchasedForId: '',
        purchasedForName: '',
        itemId: '',
        agreementNo: '',
        noOfPacket: '',
        grWt: '',
        cutting: '0',
        netWt: '0.000',
        rate: '',
        amount: '0.00',
        loadingLabour: '0',
        totalCost: '0.00',
        year: currentYear
    })

    // Search & UI States
    const [supplierSearch, setSupplierSearch] = useState('')
    const [showSupplierResults, setShowSupplierResults] = useState(false)
    const [purchasedForSearch, setPurchasedForSearch] = useState('')
    const [showPurchasedForResults, setShowPurchasedForResults] = useState(false)

    // Refs for clicking outside
    const searchRef = useRef(null)
    const purchasedForSearchRef = useRef(null)

    // Fetch initial data
    useEffect(() => {
        fetchInitialData()
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSupplierResults(false)
            }
            if (purchasedForSearchRef.current && !purchasedForSearchRef.current.contains(event.target)) {
                setShowPurchasedForResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        fetchPurchases()
    }, [currentYear])

    const fetchInitialData = async () => {
        try {
            const [suppliersRes, itemsRes, loadingRatesRes] = await Promise.all([
                supplierApi.getAll(),
                masterApi.getItems(),
                loadingRateApi.getAll()
            ])
            setSuppliers(suppliersRes.data.data)
            setItems(itemsRes.data.data)
            setLoadingRates(loadingRatesRes.data.data)
        } catch (error) {
            console.error('Error fetching master data:', error)
        }
    }

    const exportPurchaseBill = (p) => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4')
            const location = p?.location || user?.location || {}
            const locationName = location.name || ''

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
            doc.text('PURCHASE BILL', 105, currentY + 2, { align: 'center' })

            doc.setLineWidth(0.4)
            doc.setDrawColor(180, 180, 180)
            doc.line(10, currentY + 6, 200, currentY + 6)

            const startY = currentY - 10

            // Bill Summary Info
            doc.setFontSize(10)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(50)
            doc.text(`Bill No: ${p.billNo}`, 15, startY + 23)
            doc.text(`Date: ${p.billDate ? p.billDate.split('-').reverse().join('.') : '-'}`, 195, startY + 23, { align: 'right' })

            doc.setFont(undefined, 'normal')
            doc.text(`Lot No: ${p.lotNo}`, 15, startY + 28)
            doc.text(`Agreement No: ${p.agreementNo}`, 195, startY + 28, { align: 'right' })

            // Party Info Block
            doc.setFillColor(248, 249, 250)
            doc.rect(10, startY + 34, 190, 25, 'F')
            doc.setDrawColor(220, 220, 220)
            doc.rect(10, startY + 34, 190, 25, 'S')

            doc.setFontSize(10)
            doc.setFont(undefined, 'bold')
            doc.text('FROM (SUPPLIER)', 15, startY + 41)
            doc.text('FOR (OWNER)', 110, startY + 41)

            // Fetch mobile numbers from master list if missing in p
            const supplierInfo = suppliers.find(s => s.id === p.supplierId)
            const ownerInfo = suppliers.find(s => s.id === p.purchasedForId)

            const supplierMob = p.supplier?.mobileNo || supplierInfo?.mobileNo || '-'
            const ownerMob = p.purchasedFor?.mobileNo || ownerInfo?.mobileNo || '-'

            doc.setFont(undefined, 'normal')
            doc.setFontSize(9.5)
            doc.text(`Name: ${p.supplier?.name || '-'}`, 15, startY + 47)
            doc.text(`Mob : ${supplierMob}`, 15, startY + 53)

            doc.text(`Name: ${p.purchasedFor?.name || '-'}`, 110, startY + 47)
            doc.text(`Mob : ${ownerMob}`, 110, startY + 53)

            // Items Table
            autoTable(doc, {
                head: [['Description', 'Packets', 'Gr Wt', 'Cutting', 'Net Wt', 'Rate', 'Total Amount']],
                body: [[
                    p.item?.name || '-',
                    p.noOfPacket || '-',
                    p.grWt || '-',
                    p.cutting || '-',
                    p.netWt || '-',
                    `Rs. ${p.rate}`,
                    `Rs. ${p.amount}`
                ]],
                startY: startY + 65,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
                headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { halign: 'left', cellWidth: 40 },
                    6: { halign: 'right', fontStyle: 'bold' }
                }
            })

            // Summary Calculation
            let finalY = doc.lastAutoTable.finalY + 8
            doc.setFontSize(10)
            doc.setFont(undefined, 'normal')
            doc.text('Loading Charges:', 150, finalY, { align: 'right' })
            doc.text(`Rs. ${p.loadingLabour}`, 190, finalY, { align: 'right' })

            finalY += 7
            doc.setFontSize(13)
            doc.setFont(undefined, 'bold')
            doc.setTextColor(30, 40, 50)
            doc.text('NET TOTAL:', 150, finalY, { align: 'right' })
            doc.text(`Rs. ${p.totalCost}`, 190, finalY, { align: 'right' })

            // Manager details & Signature
            finalY += 15
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

            // Footer (Print Date)
            finalY += 20
            doc.setFontSize(8)
            doc.setFont(undefined, 'italic')
            doc.setTextColor(150)

            doc.text(`Printed Date: ${new Date().toLocaleString()}`, 105, finalY + 5, { align: 'center' })

            doc.save(`Purchase_Bill_${p.billNo}.pdf`)
        } catch (error) {
            console.error('PDF Export error:', error)
            alert('Failed to generate Purchase Bill PDF')
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



    const fetchAutoBillNo = async () => {
        try {
            const response = await purchaseApi.generateBillNo(currentYear)
            setPurchaseForm(prev => ({ ...prev, billNo: response.data.data.billNo }))
        } catch (error) {
            console.error('Error fetching bill no:', error)
        }
    }

    // Auto Calculations Purchase
    useEffect(() => {
        const grWt = parseFloat(purchaseForm.grWt) || 0
        const cutting = parseFloat(purchaseForm.cutting) || 0
        const rate = parseFloat(purchaseForm.rate) || 0
        const noOfPacket = parseInt(purchaseForm.noOfPacket) || 0
        const itemId = parseInt(purchaseForm.itemId) || 0

        // Fetch loading rate from master data
        const activeLoadingRate = loadingRates.find(r => r.itemId === itemId)?.rate || 0
        const calculatedLoadingLabour = (noOfPacket * parseFloat(activeLoadingRate)).toFixed(2)

        const netWt = (grWt - cutting).toFixed(3)
        const amount = (parseFloat(netWt) * rate).toFixed(2)
        const totalCost = (parseFloat(amount) + parseFloat(calculatedLoadingLabour)).toFixed(2)

        setPurchaseForm(prev => ({
            ...prev,
            netWt,
            amount,
            loadingLabour: calculatedLoadingLabour,
            totalCost
        }))
    }, [purchaseForm.grWt, purchaseForm.cutting, purchaseForm.rate, purchaseForm.noOfPacket, purchaseForm.itemId, loadingRates])

    const handlePurchaseChange = (e) => {
        const { name, value } = e.target
        setPurchaseForm(prev => ({ ...prev, [name]: value }))
    }

    const selectSupplier = (supplier) => {
        setPurchaseForm(prev => ({
            ...prev,
            supplierId: supplier.id,
            supplierName: supplier.name
        }))
        setSupplierSearch(supplier.name)
        setShowSupplierResults(false)
    }

    const selectPurchasedFor = (supplier) => {
        setPurchaseForm(prev => ({
            ...prev,
            purchasedForId: supplier.id,
            purchasedForName: supplier.name
        }))
        setPurchasedForSearch(supplier.name)
        setShowPurchasedForResults(false)
    }

    const openPurchaseModal = () => {
        setIsEditing(false)
        setEditId(null)
        setPurchaseForm({
            billDate: new Date().toISOString().split('T')[0],
            billNo: '',
            supplierId: '',
            supplierName: '',
            purchasedForId: '',
            purchasedForName: '',
            itemId: items.length > 0 ? items[0].id : '',
            agreementNo: '',
            noOfPacket: '',
            grWt: '',
            cutting: '0',
            netWt: '0.000',
            rate: '',
            amount: '0.00',
            loadingLabour: '0',
            totalCost: '0.00',
            year: currentYear
        })
        setSupplierSearch('')
        setPurchasedForSearch('')
        fetchAutoBillNo()
        setPurchaseModalVisible(true)
    }

    const handleEditPurchase = (purchase) => {
        setIsEditing(true)
        setEditId(purchase.id)
        setPurchaseForm({
            billDate: purchase.billDate,
            billNo: purchase.billNo,
            supplierId: purchase.supplierId,
            supplierName: purchase.supplier?.name || '',
            purchasedForId: purchase.purchasedForId || '',
            purchasedForName: purchase.purchasedFor?.name || '',
            itemId: purchase.itemId,
            agreementNo: purchase.agreementNo,
            noOfPacket: purchase.noOfPacket,
            grWt: purchase.grWt,
            cutting: purchase.cutting,
            netWt: purchase.netWt,
            rate: purchase.rate,
            amount: purchase.amount,
            loadingLabour: purchase.loadingLabour,
            totalCost: purchase.totalCost,
            year: purchase.year
        })
        setSupplierSearch(purchase.supplier?.name || '')
        setPurchasedForSearch(purchase.purchasedFor?.name || '')
        setPurchaseModalVisible(true)
    }

    const handleDeletePurchase = async (id) => {
        if (!window.confirm('Are you sure you want to delete this purchase and all its sales?')) return
        try {
            await purchaseApi.delete(id, currentYear)
            fetchPurchases()
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting purchase')
        }
    }

    const handleSavePurchase = async () => {
        if (!purchaseForm.supplierId || !purchaseForm.purchasedForId || !purchaseForm.agreementNo || !purchaseForm.noOfPacket || !purchaseForm.grWt || !purchaseForm.rate) {
            alert('Please fill all required fields (*)')
            return
        }

        try {
            const { supplierName, purchasedForName, ...payload } = purchaseForm
            payload.year = currentYear

            // Convert empty purchasedForId to null
            if (!payload.purchasedForId || payload.purchasedForId === '') {
                payload.purchasedForId = null
            }

            if (isEditing) {
                await purchaseApi.update(editId, payload, currentYear)
            } else {
                await purchaseApi.create(payload)
            }
            setPurchaseModalVisible(false)
            fetchPurchases()
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving purchase')
        }
    }

    const handleExportExcel = () => {
        if (!filteredData || filteredData.length === 0) {
            alert('No data available to export')
            return
        }

        const excelData = filteredData.map(p => ({
            'Date': p.billDate ? p.billDate.split('-').reverse().join('.') : '-',
            'Bill No': p.billNo,
            'Seller (Supplier)': p.supplier?.name || '-',
            'Owner (Purchased For)': p.purchasedFor?.name || '-',
            'Item': p.item?.name || '-',
            'Lot No': p.lotNo,
            'Agreement No': p.agreementNo,
            'Packets': p.noOfPacket,
            'Gr Wt': p.grWt,
            'Cutting': p.cutting,
            'Net Wt': p.netWt,
            'Rate': p.rate,
            'Amount': p.amount,
            'Loading': p.loadingLabour,
            'Total Cost': p.totalCost
        }))

        excelData.push({
            'Date': 'TOTAL',
            'Bill No': '',
            'Seller (Supplier)': '',
            'Owner (Purchased For)': '',
            'Item': '',
            'Lot No': '',
            'Agreement No': '',
            'Packets': totals.totalPackets,
            'Gr Wt': totals.totalGrWt,
            'Cutting': totals.totalCutting,
            'Net Wt': totals.totalNetWt,
            'Rate': '',
            'Amount': totals.totalAmount,
            'Loading': totals.totalLoading,
            'Total Cost': totals.totalCost
        })

        exportToExcel(excelData, `Purchase_Records_${currentYear}`)
    }

    const filteredData = purchaseData.filter(p => {
        const matchesOverall = searchTerm === '' ||
            p.lotNo?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.purchasedFor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.billNo?.toString().toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLot = filterLotNo === '' || p.lotNo?.toString().toLowerCase().includes(filterLotNo.toLowerCase())
        const matchesParty = filterParty === '' ||
            (p.supplier?.name?.toLowerCase().includes(filterParty.toLowerCase()) ||
                p.purchasedFor?.name?.toLowerCase().includes(filterParty.toLowerCase()))

        return matchesOverall && matchesLot && matchesParty
    })

    // Calculate totals for filtered data
    const totals = filteredData.reduce((acc, p) => ({
        totalPackets: acc.totalPackets + (parseInt(p.noOfPacket) || 0),
        totalGrWt: acc.totalGrWt + (parseFloat(p.grWt) || 0),
        totalCutting: acc.totalCutting + (parseFloat(p.cutting) || 0),
        totalNetWt: acc.totalNetWt + (parseFloat(p.netWt) || 0),
        totalAmount: acc.totalAmount + (parseFloat(p.amount) || 0),
        totalLoading: acc.totalLoading + (parseFloat(p.loadingLabour) || 0),
        totalCost: acc.totalCost + (parseFloat(p.totalCost) || 0)
    }), { totalPackets: 0, totalGrWt: 0, totalCutting: 0, totalNetWt: 0, totalAmount: 0, totalLoading: 0, totalCost: 0 })

    totals.totalGrWt = totals.totalGrWt.toFixed(3)
    totals.totalCutting = totals.totalCutting.toFixed(3)
    totals.totalNetWt = totals.totalNetWt.toFixed(3)
    totals.totalAmount = totals.totalAmount.toFixed(2)
    totals.totalLoading = totals.totalLoading.toFixed(2)
    totals.totalCost = totals.totalCost.toFixed(2)

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (s.mobileNo && s.mobileNo.includes(supplierSearch))
    )

    const filteredPurchasedFor = suppliers.filter(s =>
        s.name.toLowerCase().includes(purchasedForSearch.toLowerCase()) ||
        (s.mobileNo && s.mobileNo.includes(purchasedForSearch))
    )

    return (
        <>
            <style>{`
            /* ============================================
               GLOBAL PROFESSIONAL THEME
            ============================================ */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

            :root {
                --purchase-50: #eff6ff;
                --purchase-100: #dbeafe;
                --purchase-200: #bfdbfe;
                --purchase-500: #3b82f6;
                --purchase-600: #2563eb;
                --purchase-700: #1d4ed8;
                --purchase-800: #1e40af;
                --purchase-900: #1e3a8a;
                --purchase-950: #172554;

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

                --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
                --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
                --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
                --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                --radius: 10px;
                --radius-lg: 14px;
            }

            * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; }

            /* ============================================
               PURCHASE BLUE THEME
            ============================================ */
            /* ============================================
               PURCHASE BLUE THEME
            ============================================ */
            .purchase-header {
                background: linear-gradient(135deg, var(--purchase-900) 0%, var(--purchase-800) 50%, var(--purchase-700) 100%) !important;
                color: white !important;
                letter-spacing: 0.8px;
                border-right: 1px solid rgba(255,255,255,0.1) !important;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            .purchase-header-light {
                background: linear-gradient(180deg, var(--purchase-50) 0%, #ffffff 100%) !important;
                color: var(--purchase-900) !important;
                font-weight: 700 !important;
                font-size: 0.68rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                border-bottom: 3px solid var(--purchase-600) !important;
                border-right: 1px solid var(--purchase-100) !important;
                padding: 10px 8px !important;
                white-space: nowrap;
            }
            .btn-purchase {
                background: linear-gradient(135deg, var(--purchase-700), var(--purchase-800)) !important;
                color: white !important;
                border: none !important;
                font-weight: 600 !important;
                border-radius: 6px !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 2px 4px rgba(30,58,138,0.3) !important;
            }
            .btn-purchase:hover {
                background: linear-gradient(135deg, var(--purchase-600), var(--purchase-700)) !important;
                color: white !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 8px rgba(30,58,138,0.4) !important;
            }
            .badge-purchase {
                background: linear-gradient(135deg, var(--purchase-600), var(--purchase-800)) !important;
                font-weight: 600 !important;
                font-size: 0.7rem !important;
                padding: 4px 10px !important;
                border-radius: 6px !important;
                letter-spacing: 0.3px;
                box-shadow: 0 1px 3px rgba(30,58,138,0.25);
            }
            .text-purchase { color: var(--purchase-800) !important; }

            /* ============================================
               TABLE PROFESSIONAL STYLING
            ============================================ */
            .table-container {
                background: white;
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                border: 1px solid var(--neutral-200);
                overflow: hidden;
            }
            .table-container::-webkit-scrollbar {
                height: 8px;
            }
            .table-container::-webkit-scrollbar-track {
                background: var(--neutral-100);
                border-radius: 4px;
            }
            .table-container::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, var(--neutral-300), var(--neutral-400));
                border-radius: 4px;
            }
            .table-container::-webkit-scrollbar-thumb:hover {
                background: var(--neutral-500);
            }

            .table-container .table {
                margin-bottom: 0 !important;
                border-collapse: separate !important;
                border-spacing: 0 !important;
            }
            .table-container .table td {
                padding: 8px 10px !important;
                vertical-align: middle !important;
                font-size: 0.73rem !important;
                color: var(--neutral-700);
                border-color: var(--neutral-100) !important;
                transition: background 0.15s ease;
            }
            .table-container .table th {
                vertical-align: middle !important;
            }

            .total-row {
                background: linear-gradient(180deg, var(--neutral-50) 0%, #ffffff 100%) !important;
                font-weight: 800 !important;
                border-top: 3px solid var(--neutral-300) !important;
            }
            .total-row td {
                padding: 12px 10px !important;
                font-size: 0.75rem !important;
                color: var(--neutral-800) !important;
            }

            .calculated-field {
                background-color: var(--neutral-50) !important;
                font-weight: 600 !important;
                color: var(--neutral-600) !important;
                border: 1px dashed var(--neutral-300) !important;
            }

            .hover-row {
                transition: all 0.15s ease !important;
            }
            .hover-row:hover td {
                background-color: var(--neutral-50) !important;
            }

            .price-col {
                font-family: 'JetBrains Mono', monospace !important;
                font-weight: 600 !important;
                letter-spacing: -0.3px;
            }

            /* ============================================
               ACTION BUTTONS IN TABLE
            ============================================ */
            .action-btn-group {
                display: flex;
                gap: 2px;
                justify-content: center;
                align-items: center;
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
                border: 1px solid transparent !important;
            }
            .action-btn-group .btn:hover {
                transform: scale(1.12);
                box-shadow: var(--shadow-md) !important;
            }
            .action-btn-group .btn-ghost-info { color: #0891b2 !important; }
            .action-btn-group .btn-ghost-info:hover { background: #ecfeff !important; border-color: #a5f3fc !important; }
            .action-btn-group .btn-ghost-danger { color: #dc2626 !important; }
            .action-btn-group .btn-ghost-danger:hover { background: #fef2f2 !important; border-color: #fecaca !important; }

            /* ============================================
               SEARCH & DROPDOWN
            ============================================ */
            .search-results {
                position: absolute;
                width: 100%;
                z-index: 1050;
                max-height: 220px;
                overflow-y: auto;
                box-shadow: var(--shadow-lg);
                border: 1px solid var(--neutral-200) !important;
                background: white;
                border-radius: 0 0 8px 8px !important;
                animation: slideDown 0.2s ease;
            }
            .search-results .list-group-item {
                border: none !important;
                padding: 10px 14px !important;
                cursor: pointer;
                transition: all 0.15s ease;
                border-bottom: 1px solid var(--neutral-50) !important;
            }
            .search-results .list-group-item:hover {
                background: var(--purchase-50) !important;
                padding-left: 18px !important;
            }
            .search-results .list-group-item:last-child {
                border-bottom: none !important;
            }

            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* ============================================
               MODAL PROFESSIONAL STYLING
            ============================================ */
            .modal-content {
                border: none !important;
                border-radius: var(--radius-lg) !important;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important;
                overflow: hidden;
            }
            .modal-header {
                border-bottom: none !important;
            }
            .modal-footer {
                border-top: 1px solid var(--neutral-100) !important;
            }
            .modal-header-purchase {
                background: linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-800) 100%) !important;
                color: white !important;
                padding: 16px 24px !important;
            }
            .modal-header-purchase {
                background: linear-gradient(135deg, var(--neutral-900) 0%, var(--neutral-800) 100%) !important;
                color: white !important;
                padding: 16px 24px !important;
            }

            .form-section-title {
                font-size: 11px;
                font-weight: 800;
                color: var(--neutral-500);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--neutral-100);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .form-section-title::before {
                content: '';
                width: 4px;
                height: 16px;
                background: linear-gradient(180deg, var(--purchase-500), var(--purchase-700));
                border-radius: 2px;
                display: inline-block;
            }

            /* Form Controls */
            .modal-body .form-control,
            .modal-body .form-select {
                border: 1.5px solid var(--neutral-200) !important;
                border-radius: 8px !important;
                font-size: 0.82rem !important;
                padding: 8px 12px !important;
                transition: all 0.2s ease !important;
                background-color: white !important;
            }
            .modal-body .form-control:focus,
            .modal-body .form-select:focus {
                border-color: var(--purchase-500) !important;
                box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important;
            }
            .modal-body .form-label {
                font-size: 0.72rem !important;
                font-weight: 700 !important;
                color: var(--neutral-600) !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                margin-bottom: 4px !important;
            }
            .modal-body .input-group-text {
                background: var(--neutral-50) !important;
                border: 1.5px solid var(--neutral-200) !important;
                border-right: none !important;
                border-radius: 8px 0 0 8px !important;
                color: var(--neutral-400) !important;
            }
            .modal-body .input-group .form-control {
                border-left: none !important;
                border-radius: 0 8px 8px 0 !important;
            }

            /* Amount Display Boxes */
            .amount-display {
                padding: 14px 18px;
                border-radius: 10px;
                border: 1.5px solid var(--neutral-200);
                background: linear-gradient(135deg, var(--neutral-50), white);
                text-align: right;
            }
            .amount-display .label {
                font-size: 0.65rem;
                font-weight: 700;
                color: var(--neutral-400);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 2px;
            }
            .amount-display .value {
                font-family: 'JetBrains Mono', monospace !important;
                font-size: 1.3rem;
                font-weight: 800;
            }
            .amount-display.purchase-amount {
                border-color: var(--purchase-200);
                background: linear-gradient(135deg, var(--purchase-50), white);
            }
            .amount-display.purchase-amount .value { color: var(--purchase-800); }
            .amount-display.sale-amount {
                border-color: var(--sale-200);
                background: linear-gradient(135deg, var(--sale-50), white);
            }
            .amount-display.sale-amount .value { color: var(--sale-700); }
            .amount-display.loan-amount {
                border-color: #fecaca;
                background: linear-gradient(135deg, #fef2f2, white);
            }
            .amount-display.loan-amount .value { color: #dc2626; }
            .amount-display.processing-amount {
                border-color: var(--processing-200);
                background: linear-gradient(135deg, var(--processing-50), white);
            }
            .amount-display.processing-amount .value { color: var(--processing-800); }

            /* Year Selector */
            .year-selector-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                background: white;
                padding: 8px 16px;
                border-radius: 10px;
                border: 1.5px solid var(--neutral-200);
                box-shadow: var(--shadow-sm);
            }
            .year-selector-wrapper label {
                font-size: 0.75rem;
                font-weight: 700;
                color: var(--neutral-600);
                text-transform: uppercase;
                letter-spacing: 0.8px;
                white-space: nowrap;
            }
            .year-selector-wrapper select {
                border: 1.5px solid var(--neutral-200) !important;
                border-radius: 6px !important;
                font-weight: 700 !important;
                color: var(--purchase-800) !important;
                padding: 4px 10px !important;
                font-size: 0.85rem !important;
            }

            /* Top Section Add Buttons */
            .header-add-btn {
                background: rgba(255,255,255,0.15) !important;
                backdrop-filter: blur(10px) !important;
                color: white !important;
                border: 1.5px solid rgba(255,255,255,0.25) !important;
                font-weight: 700 !important;
                font-size: 0.7rem !important;
                padding: 5px 14px !important;
                border-radius: 8px !important;
                transition: all 0.2s ease !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
            }
            .header-add-btn:hover {
                background: rgba(255,255,255,0.3) !important;
                color: white !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }

            .section-title-badge {
                font-size: 0.7rem;
                font-weight: 800;
                letter-spacing: 2px;
                color: white !important;
                text-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }

            /* Sale BG rows */
            .sale-cell {
                background: linear-gradient(180deg, var(--sale-50), #ffffff) !important;
                border-right: 1px solid var(--sale-100) !important;
            }

            /* Sticky Column */
            .table-sticky-cell {
                position: sticky;
                left: 0;
                background: white;
                z-index: 1;
                border-right: 2px solid var(--neutral-200) !important;
            }

            /* Divider between sections */
            .section-divider {
                border-right: 3px solid var(--neutral-200) !important;
            }

            /* Card styling */
            .main-card {
                border: none !important;
                border-radius: var(--radius-lg) !important;
                box-shadow: var(--shadow-lg) !important;
                overflow: hidden;
            }

            /* Modal Buttons */
            .modal-footer .btn {
                border-radius: 8px !important;
                font-weight: 600 !important;
                font-size: 0.8rem !important;
                padding: 8px 20px !important;
                transition: all 0.2s ease !important;
            }
            .modal-footer .btn:hover {
                transform: translateY(-1px) !important;
            }
            .btn-cancel {
                background: var(--neutral-100) !important;
                color: var(--neutral-600) !important;
                border: 1.5px solid var(--neutral-200) !important;
            }
            .btn-cancel:hover {
                background: var(--neutral-200) !important;
                color: var(--neutral-700) !important;
            }

            /* Loading animation */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
            .loading-cell {
                animation: pulse 1.5s ease-in-out infinite;
                color: var(--neutral-400) !important;
            }

            /* No data state */
            .empty-state {
                color: var(--neutral-400) !important;
                font-style: italic;
            }

            /* Inline amount displays in form */
            .inline-amount {
                padding: 7px 12px;
                border-radius: 8px;
                border: 1.5px solid var(--neutral-200);
                background: var(--neutral-50);
                font-family: 'JetBrains Mono', monospace !important;
                font-weight: 700;
                font-size: 0.82rem;
                color: var(--neutral-700);
            }
            .inline-amount.primary {
                border-color: var(--purchase-200);
                background: var(--purchase-50);
                color: var(--purchase-800);
            }

            /* Stock info badge */
            .stock-info {
                background: linear-gradient(135deg, #ecfeff, #cffafe);
                color: #0891b2;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 0.7rem;
                font-weight: 700;
                border: 1px solid #a5f3fc;
                display: inline-block;
                margin-top: 4px;
            }
        `}</style>

            <CRow className="mb-3 g-2">
                <CCol md={2}>
                    <div className="year-selector-wrapper h-100 py-1">
                        <label className="mb-0 small fw-bold">Year</label>
                        <CFormSelect
                            size="sm"
                            value={currentYear}
                            onChange={(e) => { setCurrentYear(e.target.value); setCurrentPage(1); }}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </CFormSelect>
                    </div>
                </CCol>
                <CCol md={10}></CCol>
            </CRow>

            <CCard className="main-card mb-4">
                <CCardBody className="p-0">
                    <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                        <CTable bordered hover className="text-center align-middle mb-0" style={{ fontSize: '0.73rem', minWidth: '1600px' }}>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell colSpan={16} className="purchase-header text-uppercase py-2">
                                        <div className="d-flex align-items-center justify-content-between px-3">
                                            <div className="d-flex gap-2">
                                                <CButton size="sm" className="header-add-btn" onClick={openPurchaseModal}>
                                                    <CIcon icon={cilPlus} className="me-1" /> Add Purchase
                                                </CButton>
                                                <CButton size="sm" color="success" className="text-white fw-bold shadow-sm" onClick={handleExportExcel} style={{ fontSize: '0.7rem', padding: '5px 14px', borderRadius: '8px' }}>
                                                    <CIcon icon={cilFile} className="me-1" /> Export Excel
                                                </CButton>
                                            </div>
                                            <span className="section-title-badge">PURCHASE DETAILS</span>
                                            <div style={{ width: '120px' }}></div>
                                        </div>
                                    </CTableHeaderCell>
                                </CTableRow>

                                <CTableRow>
                                    {/* Purchase Headers (16) */}
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '100px' }}>Date</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '100px' }}>
                                        Bill No
                                        <CFormInput
                                            size="sm"
                                            className="mt-1 py-0 px-1"
                                            placeholder="Search..."
                                            style={{ fontSize: '0.65rem' }}
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '220px' }}>
                                        Seller (Supplier)
                                        <CFormInput
                                            size="sm"
                                            className="mt-1 py-0 px-1"
                                            placeholder="Filter Party..."
                                            style={{ fontSize: '0.65rem' }}
                                            value={filterParty}
                                            onChange={(e) => { setFilterParty(e.target.value); setCurrentPage(1); }}
                                        />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '200px' }}>Owner (Purchased For)</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '100px' }}>Item</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '100px' }}>
                                        Lot No.
                                        <CFormInput
                                            size="sm"
                                            className="mt-1 py-0 px-1"
                                            placeholder="Lot No..."
                                            style={{ fontSize: '0.65rem' }}
                                            value={filterLotNo}
                                            onChange={(e) => { setFilterLotNo(e.target.value); setCurrentPage(1); }}
                                        />
                                    </CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '110px' }}>Agmt No.</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '60px' }}>Pkt</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '95px' }}>Gr Wt</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '95px' }}>Cutting</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '95px' }}>Net Wt</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '80px' }}>Rate</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '110px' }}>Amount</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '90px' }}>Loading</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '110px' }}>Total Cost</CTableHeaderCell>
                                    <CTableHeaderCell className="purchase-header-light" style={{ width: '100px' }}>Actions</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>

                            <CTableBody>
                                {loading ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan={16} className="py-5 loading-cell">
                                            <div className="d-flex align-items-center justify-content-center gap-2">
                                                <CSpinner size="sm" color="primary" />
                                                <span className="fw-semibold">Loading data...</span>
                                            </div>
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : currentItems.length === 0 ? (
                                    <CTableRow>
                                        <CTableDataCell colSpan={16} className="py-5 empty-state">
                                            <div className="text-center">
                                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                                                <div className="fw-semibold">No results found for your search</div>
                                                <div className="small mt-1">Try adjusting your filters</div>
                                            </div>
                                        </CTableDataCell>
                                    </CTableRow>
                                ) : (
                                    currentItems.map((pRow, pIndex) => (
                                        <CTableRow key={pRow.id} className="hover-row">
                                            {/* Purchase Cells */}
                                            <CTableDataCell className="fw-medium">{pRow.billDate ? pRow.billDate.split('-').reverse().join('.') : '-'}</CTableDataCell>
                                            <CTableDataCell><CBadge className="badge-purchase">{pRow.billNo}</CBadge></CTableDataCell>
                                            <CTableDataCell className="text-start fw-semibold" style={{ color: 'var(--neutral-800)' }}>{pRow.supplier?.name}</CTableDataCell>
                                            <CTableDataCell className="text-start" style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>
                                                {pRow.purchasedFor?.name || '-'}
                                            </CTableDataCell>
                                            <CTableDataCell>{pRow.item?.name}</CTableDataCell>
                                            <CTableDataCell className="fw-bold text-purchase">{pRow.lotNo}</CTableDataCell>
                                            <CTableDataCell>{pRow.agreementNo}</CTableDataCell>
                                            <CTableDataCell className="fw-bold" style={{ color: 'var(--neutral-800)' }}>{pRow.noOfPacket}</CTableDataCell>
                                            <CTableDataCell className="price-col">{pRow.grWt}</CTableDataCell>
                                            <CTableDataCell className="price-col">{pRow.cutting}</CTableDataCell>
                                            <CTableDataCell className="price-col fw-bold" style={{ color: 'var(--neutral-900)' }}>{pRow.netWt}</CTableDataCell>
                                            <CTableDataCell className="price-col">{pRow.rate}</CTableDataCell>
                                            <CTableDataCell className="price-col">₹{pRow.amount}</CTableDataCell>
                                            <CTableDataCell className="price-col">₹{pRow.loadingLabour}</CTableDataCell>
                                            <CTableDataCell className="price-col fw-bold text-purchase">₹{pRow.totalCost}</CTableDataCell>
                                            <CTableDataCell>
                                                <div className="action-btn-group">
                                                    <CButton color="warning" size="sm" variant="ghost" title="Print Bill" onClick={() => exportPurchaseBill(pRow)}>
                                                        <CIcon icon={cilDescription} size="sm" />
                                                    </CButton>
                                                    {isImpersonating && (
                                                        <>
                                                            <CButton color="info" size="sm" variant="ghost" title="Edit Purchase" onClick={() => handleEditPurchase(pRow)}>
                                                                <CIcon icon={cilPencil} size="sm" />
                                                            </CButton>
                                                            <CButton color="danger" size="sm" variant="ghost" title="Delete Purchase" onClick={() => handleDeletePurchase(pRow.id)}>
                                                                <CIcon icon={cilTrash} size="sm" />
                                                            </CButton>
                                                        </>
                                                    )}
                                                </div>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ))
                                )}
                            </CTableBody>

                            <CTableBody>
                                <CTableRow className="total-row">
                                    <CTableDataCell colSpan={7} className="text-end pe-3" style={{ background: 'white', letterSpacing: '1px', fontSize: '0.7rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                                        Grand Totals
                                    </CTableDataCell>
                                    <CTableDataCell className="text-purchase fw-bold" style={{ background: 'white' }}>{totals.totalPackets}</CTableDataCell>
                                    <CTableDataCell className="price-col" style={{ background: 'white' }}>{totals.totalGrWt}</CTableDataCell>
                                    <CTableDataCell className="price-col" style={{ background: 'white' }}>{totals.totalCutting}</CTableDataCell>
                                    <CTableDataCell className="price-col fw-bold" style={{ background: 'white', color: 'var(--neutral-900)' }}>{totals.totalNetWt}</CTableDataCell>
                                    <CTableDataCell style={{ background: 'white' }}></CTableDataCell>
                                    <CTableDataCell className="price-col" style={{ background: 'white' }}>₹{totals.totalAmount}</CTableDataCell>
                                    <CTableDataCell className="price-col" style={{ background: 'white' }}>₹{totals.totalLoading}</CTableDataCell>
                                    <CTableDataCell className="price-col text-purchase fw-bold" style={{ background: 'white' }}>₹{totals.totalCost}</CTableDataCell>
                                    <CTableDataCell style={{ background: 'white' }}></CTableDataCell>
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
                                    className="border-0 fw-bold text-primary p-0"
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
                                    color={currentPage === i + 1 ? 'primary' : 'secondary'}
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

            {/* ============================================
            PURCHASE MODAL
        ============================================ */}
            <CModal visible={purchaseModalVisible} onClose={() => setPurchaseModalVisible(false)} size="lg" backdrop="static">
                <CModalHeader className="modal-header-purchase">
                    <CModalTitle className="fs-6 fw-bold" style={{ letterSpacing: '0.5px' }}>
                        {isEditing ? '✏️ Edit Purchase' : '📦 New Purchase Entry'}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody className="p-4" style={{ background: 'var(--neutral-50)' }}>
                    <CForm>
                        <CRow className="mb-4">
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold">Supplier Search *</CFormLabel>
                                <div className="position-relative" ref={searchRef}>
                                    <CInputGroup size="sm">
                                        <CInputGroupText><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                                        <CFormInput
                                            placeholder="Type name or mobile..."
                                            value={supplierSearch}
                                            onChange={(e) => { setSupplierSearch(e.target.value); setShowSupplierResults(true); }}
                                            onFocus={() => setShowSupplierResults(true)}
                                            autoComplete="off"
                                        />
                                    </CInputGroup>
                                    {showSupplierResults && supplierSearch && (
                                        <CListGroup className="search-results">
                                            {filteredSuppliers.map(s => (
                                                <CListGroupItem
                                                    key={s.id} component="button" type="button"
                                                    onClick={() => selectSupplier(s)}
                                                    className="d-flex justify-content-between align-items-center small"
                                                >
                                                    <span className="fw-semibold" style={{ color: 'var(--neutral-800)' }}>{s.name}</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>{s.mobileNo}</span>
                                                </CListGroupItem>
                                            ))}
                                        </CListGroup>
                                    )}
                                </div>
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold">Purchased For *</CFormLabel>
                                <div className="position-relative" ref={purchasedForSearchRef}>
                                    <CInputGroup size="sm">
                                        <CInputGroupText><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                                        <CFormInput
                                            placeholder="Type name or mobile..."
                                            value={purchasedForSearch}
                                            onChange={(e) => { setPurchasedForSearch(e.target.value); setShowPurchasedForResults(true); }}
                                            onFocus={() => setShowPurchasedForResults(true)}
                                            autoComplete="off"
                                        />
                                    </CInputGroup>
                                    {showPurchasedForResults && purchasedForSearch && (
                                        <CListGroup className="search-results">
                                            {filteredPurchasedFor.map(s => (
                                                <CListGroupItem
                                                    key={s.id} component="button" type="button"
                                                    onClick={() => selectPurchasedFor(s)}
                                                    className="d-flex justify-content-between align-items-center small"
                                                >
                                                    <span className="fw-semibold" style={{ color: 'var(--neutral-800)' }}>{s.name}</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--neutral-400)' }}>{s.mobileNo}</span>
                                                </CListGroupItem>
                                            ))}
                                        </CListGroup>
                                    )}
                                </div>
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Bill Information</div>
                        <CRow className="mb-4">
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold">Date</CFormLabel>
                                <CFormInput type="date" name="billDate" size="sm" value={purchaseForm.billDate} onChange={handlePurchaseChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold">Bill No</CFormLabel>
                                <CFormInput size="sm" className="calculated-field" value={purchaseForm.billNo} readOnly />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold">Item</CFormLabel>
                                <CFormSelect name="itemId" size="sm" value={purchaseForm.itemId} onChange={handlePurchaseChange}>
                                    <option value="">Select Item</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </CFormSelect>
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Lot & Packet Details</div>
                        <CRow className="mb-4">
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold">Agmt No</CFormLabel>
                                <CFormInput name="agreementNo" size="sm" value={purchaseForm.agreementNo} onChange={handlePurchaseChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold">Pkt</CFormLabel>
                                <CFormInput type="number" name="noOfPacket" size="sm" value={purchaseForm.noOfPacket} onChange={handlePurchaseChange} />
                            </CCol>
                            <CCol md={6}>
                                <CFormLabel className="small fw-bold">Lot No (Auto)</CFormLabel>
                                <CFormInput
                                    size="sm"
                                    className="calculated-field"
                                    value={purchaseForm.agreementNo ? `${purchaseForm.agreementNo}/${purchaseForm.noOfPacket || 0}` : '-'}
                                    readOnly
                                />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Weight Details</div>
                        <CRow className="mb-4">
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold">Gr Wt (in Qtl)</CFormLabel>
                                <CFormInput type="number" step="0.001" name="grWt" size="sm" value={purchaseForm.grWt} onChange={handlePurchaseChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold">Cutting (in Qtl)</CFormLabel>
                                <CFormInput type="number" step="0.001" name="cutting" size="sm" value={purchaseForm.cutting} onChange={handlePurchaseChange} />
                            </CCol>
                            <CCol md={4}>
                                <CFormLabel className="small fw-bold">Net Wt (in Qtl) — Auto</CFormLabel>
                                <CFormInput size="sm" className="calculated-field" value={purchaseForm.netWt} readOnly />
                            </CCol>
                        </CRow>

                        <div className="form-section-title">Pricing & Cost</div>
                        <CRow className="align-items-end">
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold">Rate</CFormLabel>
                                <CFormInput type="number" name="rate" size="sm" value={purchaseForm.rate} onChange={handlePurchaseChange} />
                            </CCol>
                            <CCol md={3}>
                                <CFormLabel className="small fw-bold">Loading (Auto)</CFormLabel>
                                <CFormInput size="sm" className="calculated-field" value={purchaseForm.loadingLabour} readOnly title="Calculated as: Packets x Master Loading Rate" />
                            </CCol>
                            <CCol md={3}>
                                <div className="amount-display" title="Calculated as: Gr Wt x Rate">
                                    <div className="label">Amount</div>
                                    <div className="value" style={{ color: 'var(--neutral-700)' }}>₹ {purchaseForm.amount}</div>
                                </div>
                            </CCol>
                            <CCol md={3}>
                                <div className="amount-display purchase-amount">
                                    <div className="label">Total Cost</div>
                                    <div className="value">₹ {purchaseForm.totalCost}</div>
                                </div>
                            </CCol>
                        </CRow>
                    </CForm>
                </CModalBody>
                <CModalFooter className="p-3" style={{ background: 'var(--neutral-50)', borderTop: '1px solid var(--neutral-100)' }}>
                    <CButton className="btn-cancel" size="sm" onClick={() => setPurchaseModalVisible(false)}>Cancel</CButton>
                    <CButton className="btn-purchase px-4" size="sm" onClick={handleSavePurchase}>
                        {isEditing ? 'Update Purchase' : 'Save Purchase'}
                    </CButton>
                </CModalFooter>
            </CModal>


        </>
    )
}

export default PurchaseSale

