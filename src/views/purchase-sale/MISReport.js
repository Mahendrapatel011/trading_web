import React, { useState, useEffect } from 'react'
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
    CFormSelect,
    CSpinner,
    CBadge,
} from '@coreui/react'
import { saleApi } from '../../api/reservationApi'
import { useAuth } from '../../context/AuthContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilCloudDownload, cilFilter, cilX } from '@coreui/icons'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
 * MIS Report Component
 * Combines Purchase, Lot Processing (Taiyari), Sales, and Loans into a single master sheet.
 * Follows the visual structure provided in the user's reference image.
 */
const MISReport = () => {
    const { user } = useAuth()
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [purchaseData, setPurchaseData] = useState([])
    const [loading, setLoading] = useState(false)

    const [filters, setFilters] = useState({
        billDate: '',
        billNo: '',
        supplier: '',
        owner: '',
        item: '',
        lotNo: '',
        agreementNo: '',
        saleDt: '',
        party: '',
        loanDt: ''
    })

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            billDate: '',
            billNo: '',
            supplier: '',
            owner: '',
            item: '',
            lotNo: '',
            agreementNo: '',
            saleDt: '',
            party: '',
            loanDt: ''
        })
    }

    useEffect(() => {
        fetchData()
    }, [currentYear])

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await saleApi.getGrouped(currentYear)
            setPurchaseData(response.data.data)
        } catch (error) {
            console.error('Error fetching MIS data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = React.useMemo(() => {
        return purchaseData.map(p => {
            // Purchase level filters
            const matchesBillDate = !filters.billDate || (p.billDate && p.billDate.split('-').reverse().join('.').includes(filters.billDate))
            const matchesBillNo = !filters.billNo || (p.billNo && p.billNo.toString().includes(filters.billNo))
            const matchesSupplier = !filters.supplier || (p.supplier?.name && p.supplier.name.toLowerCase().includes(filters.supplier.toLowerCase()))
            const matchesOwner = !filters.owner || (p.purchasedFor?.name && p.purchasedFor.name.toLowerCase().includes(filters.owner.toLowerCase()))
            const matchesItem = !filters.item || (p.item?.name && p.item.name.toLowerCase().includes(filters.item.toLowerCase()))
            const matchesLotNo = !filters.lotNo || (p.lotNo && p.lotNo.toString().includes(filters.lotNo))
            const matchesAgmtNo = !filters.agreementNo || (p.agreementNo && p.agreementNo.toString().includes(filters.agreementNo))

            if (!(matchesBillDate && matchesBillNo && matchesSupplier && matchesOwner && matchesItem && matchesLotNo && matchesAgmtNo)) {
                return null
            }

            // Sale level filters
            const filteredSales = (p.sales || []).filter(s => {
                const matchesSaleDt = !filters.saleDt || (s.saleDt && s.saleDt.split('-').reverse().join('.').includes(filters.saleDt))
                const matchesParty = !filters.party || (s.party && s.party.toLowerCase().includes(filters.party.toLowerCase()))
                return matchesSaleDt && matchesParty
            })

            const saleFilterActive = !!(filters.saleDt || filters.party)
            if (saleFilterActive && filteredSales.length === 0) {
                return null
            }

            // Loan level filters
            const filteredLoans = (p.loans || []).filter(l => {
                const matchesLoanDt = !filters.loanDt || (l.loanDt && l.loanDt.split('-').reverse().join('.').includes(filters.loanDt))
                return matchesLoanDt
            })

            const loanFilterActive = !!filters.loanDt
            if (loanFilterActive && filteredLoans.length === 0) {
                return null
            }

            return {
                ...p,
                sales: saleFilterActive ? filteredSales : p.sales,
                loans: loanFilterActive ? filteredLoans : p.loans
            }
        }).filter(Boolean)
    }, [purchaseData, filters])

    const exportLotReport = (p) => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4')
            const location = p?.location || user?.location || {}
            const locationName = location.name || 'TRADING SYSTEM'
            const companyName = location.nameHindi || locationName.toUpperCase()
            const companyAddress = location.addressHindi || ''
            const companyOffice = location.officeHindi || ''

            let y = 10

            // 1. Header
            doc.setFontSize(20)
            doc.setTextColor(40, 40, 40)
            doc.setFont(undefined, 'bold')
            doc.text(companyName, 105, y + 5, { align: 'center' })

            y += 12

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

            doc.setFontSize(14)
            doc.setTextColor(100)
            doc.setFont(undefined, 'bold')
            doc.text(`DETAILED LOT HISTORY - LOT NO: ${p.lotNo}`, 105, y + 3, { align: 'center' })

            doc.setLineWidth(0.5)
            doc.setDrawColor(0)
            doc.line(10, y + 8, 200, y + 8)

            y = y - 10

            // 2. Lot Basics (Purchase Info)
            doc.setFontSize(11)
            doc.setTextColor(0)
            doc.setFont('helvetica', 'bold')
            doc.text('A. PURCHASE & ITEM DETAILS', 10, y + 26)

            const formatDate = (dt) => (dt && typeof dt === 'string') ? dt.split('-').reverse().join('.') : '-'
            const getSafeY = (fallback) => (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : fallback

            autoTable(doc, {
                startY: y + 28,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [251, 192, 45], textColor: [0, 0, 0], fontStyle: 'bold' },
                head: [['Bill Date', 'Bill No', 'Supplier (Seller)', 'Malik (Owner)', 'Item', 'Agreement']],
                body: [[
                    formatDate(p.billDate),
                    p.billNo || '-',
                    p.supplier?.name || '-',
                    p.purchasedFor?.name || p.supplier?.name || '-',
                    p.item?.name || '-',
                    p.agreementNo || '-'
                ]]
            })

            autoTable(doc, {
                startY: getSafeY(y + 50) + 2,
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 2 },
                headStyles: { fillColor: [251, 192, 45], textColor: [0, 0, 0], fontStyle: 'bold' },
                head: [['Packets', 'Gross Wt', 'Cutting', 'Net Weight', 'Rate', 'Shortage %', 'Total Cost']],
                body: [[
                    p.noOfPacket || '-',
                    p.grWt || '-',
                    p.cutting || '-',
                    p.netWt || '-',
                    `Rs. ${p.rate}`,
                    p.shortage ? `${p.shortage}%` : '-',
                    `Rs. ${p.totalCost}`
                ]]
            })

            // 3. Processing / Taiyari Details
            const proc = p.processings && p.processings.length > 0 ? p.processings[0] : null
            if (proc) {
                let py = getSafeY(y + 80) + 10
                doc.setFont('helvetica', 'bold')
                doc.text('B. PROCESSING (TAIYARI) SUMMARY', 10, py)
                const pureProcExps = (parseFloat(proc.totalExps) || 0) - (parseFloat(proc.purchaseCost) || 0)
                autoTable(doc, {
                    startY: py + 2,
                    theme: 'grid',
                    styles: { fontSize: 8.5, cellPadding: 2 },
                    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
                    head: [['Nikashi Pkt', 'Tayari Pkt', 'Charri', 'Labour (N+T)', 'Rent', 'Bags+Sutli', 'Pkt Col / Rafu', 'Proc. Exp']],
                    body: [[
                        proc.nikashiPkt || '-',
                        proc.tayariPkt || '-',
                        proc.charriPkt || '-',
                        `Rs. ${(parseFloat(proc.nikashiLabour) || 0) + (parseFloat(proc.tayariLabour) || 0)}`,
                        `Rs. ${proc.rent || '0'}`,
                        `Rs. ${(parseFloat(proc.newBags) || 0) + (parseFloat(proc.sutli) || 0)}`,
                        `Rs. ${(parseFloat(proc.pktCollection) || 0) + (parseFloat(proc.raffuChippi) || 0)}`,
                        `Rs. ${pureProcExps.toFixed(2)}`
                    ]]
                })
            }

            // 4. Sales History
            const sales = p.sales || []
            let sy = getSafeY(y + 100) + 10
            doc.setFont('helvetica', 'bold')
            doc.text(`C. SALES HISTORY (${sales.length} Entries)`, 10, sy)

            if (sales.length > 0) {
                autoTable(doc, {
                    startY: sy + 2,
                    theme: 'grid',
                    styles: { fontSize: 8.5, cellPadding: 2 },
                    headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: 'bold' },
                    head: [['Sale Date', 'Party Name', 'Packets', 'Weight (Q)', 'Rate', 'Amount']],
                    body: sales.map(s => [
                        formatDate(s.saleDt),
                        s.party || '-',
                        s.salePkt || '-',
                        s.saleWt || '-',
                        `Rs. ${s.rate}`,
                        `Rs. ${s.amount}`
                    ])
                })
            } else {
                doc.setFont('helvetica', 'italic')
                doc.setFontSize(9)
                doc.text('No sales recorded for this lot yet.', 15, sy + 5)
            }

            // 5. Loan Details
            const loans = p.loans || []
            if (loans.length > 0) {
                let ly = getSafeY(y + 120) + 10
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(11)
                doc.text('D. LOAN HISTORY', 10, ly)
                autoTable(doc, {
                    startY: ly + 2,
                    theme: 'grid',
                    styles: { fontSize: 8.5, cellPadding: 2 },
                    headStyles: { fillColor: [255, 112, 67], textColor: [255, 255, 255], fontStyle: 'bold' },
                    head: [['Loan Date', 'Loan Amt', 'Repay Date', 'Interest', 'Pay Recd', 'Net Dues']],
                    body: loans.map(l => [
                        formatDate(l.loanDt),
                        `Rs. ${l.loanAmount}`,
                        formatDate(l.repaymentDt),
                        `Rs. ${l.interest}`,
                        `Rs. ${l.payRecd}`,
                        `Rs. ${l.netDues}`
                    ])
                })
            }

            // 6. Final Financial Summary
            const totalSalesAmt = sales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
            const purchaseCostOnly = (parseFloat(p.totalCost) || 0)
            const pureProcExp = proc ? (parseFloat(proc.totalExps) || 0) - (parseFloat(proc.purchaseCost) || 0) : 0
            const combinedTotalCost = purchaseCostOnly + pureProcExp
            const netResult = totalSalesAmt - combinedTotalCost

            let fy = getSafeY(y + 150) + 15

            // Draw summary box
            doc.setFillColor(245, 245, 245)
            doc.rect(130, fy, 70, 36, 'F')
            doc.setDrawColor(200)
            doc.rect(130, fy, 70, 36, 'S')

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(50)
            doc.text('FINANCIAL SUMMARY', 135, fy + 7)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.text(`Total Sales: Rs. ${totalSalesAmt.toFixed(2)}`, 135, fy + 15)
            doc.text(`Total Cost: Rs. ${combinedTotalCost.toFixed(2)}`, 135, fy + 20)
            doc.text(`Shortage: ${p.shortage ? p.shortage + '%' : '0%'}`, 135, fy + 25)

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            if (netResult >= 0) {
                doc.setTextColor(46, 125, 50)
            } else {
                doc.setTextColor(211, 47, 47)
            }
            doc.text(`NET RESULT: Rs. ${netResult.toFixed(2)}`, 135, fy + 32)

            // Manager Details
            let signY = fy + 55
            const managerName = location.managerName || 'Manager'
            const managerPhone = location.phone || ''

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(40, 40, 40)
            doc.text('______________________', 190, signY, { align: 'right' })
            doc.text(managerName, 190, signY + 6, { align: 'right' })
            if (managerPhone) {
                doc.setFont('helvetica', 'normal')
                doc.text(managerPhone, 190, signY + 11, { align: 'right' })
            }

            // Footer
            doc.setFontSize(8)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(150)
            doc.text(`Printed on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' })

            doc.save(`LotSummary_${String(p.lotNo).replace(/[/\\?%*:|"<>]/g, '-')}.pdf`)
        } catch (error) {
            console.error('Lot PDF Export error:', error)
            alert('Failed to generate Lot Summary PDF: ' + error.message)
        }
    }

    const exportToExcel = () => {
        const rows = []
        const merges = []
        let currentRow = 1 // Header is row 0, so data starts from row 1

        filteredData.forEach(p => {
            const sales = p.sales || []
            const loans = p.loans || []
            const rowSpan = Math.max(sales.length, loans.length, 1)
            const proc = p.processings?.[0] || {}

            const lotSalesAmount = (p.sales || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
            const purchaseCost = (parseFloat(p.totalCost) || 0)
            const lotTaiyariExps = (parseFloat(proc.totalExps) || 0) - (parseFloat(proc.purchaseCost) || 0)
            const lotNetRes = lotSalesAmount - purchaseCost - lotTaiyariExps

            const lotLoans = p.loans || []
            const totalLoan = lotLoans.reduce((sum, ln) => sum + (parseFloat(ln.loanAmount) || 0), 0)
            const totalInt = lotLoans.reduce((sum, ln) => sum + (parseFloat(ln.interest) || 0), 0)
            const totalPay = lotLoans.reduce((sum, ln) => sum + (parseFloat(ln.payRecd) || 0), 0)
            const totalDues = lotLoans.reduce((sum, ln) => sum + (parseFloat(ln.netDues) || 0), 0)

            for (let i = 0; i < rowSpan; i++) {
                const s = sales[i] || {}

                rows.push({
                    'Bill Date': i === 0 ? p.billDate?.split('-').reverse().join('.') : '',
                    'Bill No': i === 0 ? p.billNo : '',
                    'Supplier': i === 0 ? p.supplier?.name : '',
                    'Owner': i === 0 ? (p.purchasedFor?.name || '-') : '',
                    'Item': i === 0 ? p.item?.name : '',
                    'Lot No': i === 0 ? p.lotNo : '',
                    'Agmt No': i === 0 ? p.agreementNo : '',
                    'Pkt': i === 0 ? p.noOfPacket : '',
                    'Gr Wt': i === 0 ? p.grWt : '',
                    'Cutting': i === 0 ? p.cutting : '',
                    'Net Wt': i === 0 ? p.netWt : '',
                    'Rate (P)': i === 0 ? p.rate : '',
                    'Amount (P)': i === 0 ? p.amount : '',
                    'Loading': i === 0 ? p.loadingLabour : '',
                    'Total Cost': i === 0 ? p.totalCost : '',

                    'Sale Dt': s.saleDt?.split('-').reverse().join('.') || '',
                    'Sale Party': s.party || '',
                    'Nikashi': i === 0 ? (proc.nikashiPkt || '') : '',
                    'Tayari': i === 0 ? (proc.tayariPkt || '') : '',
                    'Chant': i === 0 ? (proc.charriPkt || '') : '',
                    'Sale Pkt': s.salePkt || '',
                    'Sale Wt': s.saleWt || '',
                    'Sale Rate': s.rate || '',
                    'Sale Amount': s.amount || '',

                    'Unload': i === 0 ? (proc.nikashiLabour || '') : '',
                    'Tayaro': i === 0 ? (proc.tayariLabour || '') : '',
                    'Rent': i === 0 ? (proc.rent || '') : '',
                    'Bags': i === 0 ? (proc.newBags || '') : '',
                    'Sutli': i === 0 ? (proc.sutli || '') : '',
                    'Pkt Col': i === 0 ? (proc.pktCollection || '') : '',
                    'Rafu': i === 0 ? (proc.raffuChippi || '') : '',
                    'Total Exp': i === 0 ? (proc.totalExps || '') : '',
                    'Net Res': i === 0 ? lotNetRes.toFixed(2) : '',
                    'Shortage': i === 0 ? (p.shortage ? `${p.shortage}%` : '') : '',

                    'Loan Dt': i === 0 ? (lotLoans[0]?.loanDt?.split('-').reverse().join('.') || '') : '',
                    'Loan': i === 0 ? totalLoan.toFixed(2) : '',
                    'Repay Dt': i === 0 ? (lotLoans.reduce((latest, ln) => (!latest || (ln.repaymentDt && ln.repaymentDt > latest)) ? ln.repaymentDt : latest, '')?.split('-').reverse().join('.') || '') : '',
                    'Interest': i === 0 ? totalInt.toFixed(2) : '',
                    'Pay Recd': i === 0 ? totalPay.toFixed(2) : '',
                    'Net Dues': i === 0 ? totalDues.toFixed(2) : '',
                })
            }

            if (rowSpan > 1) {
                // Add merges for purchase and common columns to mimic UI rowSpan
                // Purchase Columns (0-14)
                for (let col = 0; col <= 14; col++) {
                    merges.push({ s: { r: currentRow, c: col }, e: { r: currentRow + rowSpan - 1, c: col } })
                }
                // Taiyari Common Columns (17-19)
                for (let col = 17; col <= 19; col++) {
                    merges.push({ s: { r: currentRow, c: col }, e: { r: currentRow + rowSpan - 1, c: col } })
                }
                // Common Expenses / Result Columns (24-33)
                for (let col = 24; col <= 33; col++) {
                    merges.push({ s: { r: currentRow, c: col }, e: { r: currentRow + rowSpan - 1, c: col } })
                }
                // Loan Common Columns (34-39)
                for (let col = 34; col <= 39; col++) {
                    merges.push({ s: { r: currentRow, c: col }, e: { r: currentRow + rowSpan - 1, c: col } })
                }
            }
            currentRow += rowSpan
        })

        // Add Grand Totals Row
        rows.push({
            'Bill Date': 'GRAND TOTALS',
            'Pkt': totals.pkt,
            'Gr Wt': totals.grWt.toFixed(3),
            'Cutting': totals.cutting.toFixed(3),
            'Net Wt': totals.netWt.toFixed(3),
            'Amount (P)': totals.amount.toFixed(2),
            'Loading': totals.loading.toFixed(2),
            'Total Cost': totals.cost.toFixed(2),
            'Sale Pkt': totals.salePkt,
            'Sale Wt': totals.saleWt.toFixed(3),
            'Sale Amount': totals.saleAmt.toFixed(2),
            'Unload': totals.tUnload?.toFixed(2),
            'Tayaro': totals.tTayaro?.toFixed(2),
            'Rent': totals.tRent?.toFixed(2),
            'Bags': totals.tBags?.toFixed(2),
            'Sutli': totals.tSutli?.toFixed(2),
            'Pkt Col': totals.tPktCol?.toFixed(2),
            'Rafu': totals.tRafu?.toFixed(2),
            'Total Exp': totals.tExp?.toFixed(2),
            'Net Res': totals.netRes.toFixed(2),
            'Shortage': totals.grWt > 0 ? (((totals.grWt - totals.saleWt - (totals.charriPkt / 2)) / totals.grWt) * 100).toFixed(2) + '%' : '-',
            'Loan': totals.loan.toFixed(2),
            'Interest': totals.int.toFixed(2),
            'Pay Recd': totals.pay.toFixed(2),
            'Net Dues': totals.dues.toFixed(2),
        })

        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MIS Report')

        // Apply Merges
        worksheet['!merges'] = merges

        // Adjust column widths
        const wscols = Object.keys(rows[0] || {}).map(() => ({ wch: 15 }))
        worksheet['!cols'] = wscols

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const excelData = new Blob([excelBuffer], { type: 'application/octet-stream' })
        saveAs(excelData, `MIS_Report_${currentYear}_${new Date().toLocaleDateString()}.xlsx`)
    }

    const calculateTotals = (data) => {
        let totals = {
            pkt: 0,
            grWt: 0,
            netWt: 0,
            cutting: 0,
            amount: 0,
            loading: 0,
            cost: 0,
            salePkt: 0,
            saleWt: 0,
            saleAmt: 0,
            loan: 0,
            int: 0,
            pay: 0,
            dues: 0,
            netRes: 0,
            charriPkt: 0,
            tUnload: 0,
            tTayaro: 0,
            tRent: 0,
            tBags: 0,
            tSutli: 0,
            tPktCol: 0,
            tRafu: 0,
            tExp: 0
        }

        data.forEach(p => {
            totals.pkt += (parseInt(p.noOfPacket) || 0)
            totals.grWt += (parseFloat(p.grWt) || 0)
            totals.netWt += (parseFloat(p.netWt) || 0)
            totals.cutting += (parseFloat(p.cutting) || 0)
            totals.amount += (parseFloat(p.amount) || 0)
            totals.loading += (parseFloat(p.loadingLabour) || 0)
            totals.cost += (parseFloat(p.totalCost) || 0)

            const sales = p.sales || []
            sales.forEach(s => {
                totals.salePkt += (parseInt(s.salePkt) || 0)
                totals.saleWt += (parseFloat(s.saleWt) || 0)
                totals.saleAmt += (parseFloat(s.amount) || 0)
            })

            const loans = p.loans || []
            loans.forEach(l => {
                totals.loan += (parseFloat(l.loanAmount) || 0)
                totals.int += (parseFloat(l.interest) || 0)
                totals.pay += (parseFloat(l.payRecd) || 0)
                totals.dues += (parseFloat(l.netDues) || 0)
            })

            // Taiyari Totals from Processings
            const procs = p.processings || []
            procs.forEach(pr => {
                totals.tUnload += (parseFloat(pr.nikashiLabour) || 0)
                totals.tTayaro += (parseFloat(pr.tayariLabour) || 0)
                totals.tRent += (parseFloat(pr.rent) || 0)
                totals.tBags += (parseFloat(pr.newBags) || 0)
                totals.tSutli += (parseFloat(pr.sutli) || 0)
                totals.tPktCol += (parseFloat(pr.pktCollection) || 0)
                totals.tRafu += (parseFloat(pr.raffuChippi) || 0)
                totals.tExp += (parseFloat(pr.totalExps) || 0)
                totals.charriPkt += (parseFloat(pr.charriPkt) || 0)
            })

            // Calculate Net Result for this lot
            const lotSalesAmount = sales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
            const purchaseCostTotal = (parseFloat(p.totalCost) || 0)
            const firstProc = p.processings && p.processings.length > 0 ? p.processings[0] : {}
            const taiyariExpsTotal = (parseFloat(firstProc.totalExps) || 0) - (parseFloat(firstProc.purchaseCost) || 0)
            const lotNetResValue = lotSalesAmount - purchaseCostTotal - taiyariExpsTotal
            totals.netRes += lotNetResValue
        })

        return totals
    }

    const totals = calculateTotals(filteredData)

    return (
        <div className="mis-report-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

                .mis-report-container {
                    font-family: 'Inter', sans-serif;
                }

                /* Header Sections using colors from user image */
                .header-purchase { background-color: #fbc02d !important; color: #000 !important; font-weight: 800 !important; letter-spacing: 1px; border-right: 2px solid #fff !important; }
                .header-sale { background-color: #1976d2 !important; color: #fff !important; font-weight: 800 !important; letter-spacing: 1px; border-right: 2px solid #fff !important; }
                .header-loan { background-color: #ff7043 !important; color: #fff !important; font-weight: 800 !important; letter-spacing: 1px; }

                /* Light Sub-headers */
                .sub-purchase { background-color: #fff9c4 !important; color: #7b5e00 !important; border-bottom: 2px solid #fbc02d !important; border-right: 1px solid #fff8e1 !important; }
                .sub-sale { background-color: #e3f2fd !important; color: #0d47a1 !important; border-bottom: 2px solid #1976d2 !important; border-right: 1px solid #e1f5fe !important; }
                .sub-loan { background-color: #fbe9e7 !important; color: #bf360c !important; border-bottom: 2px solid #ff7043 !important; border-right: 1px solid #ffccbc !important; }

                .mis-table {
                    font-size: 0.68rem;
                    border-collapse: separate !important;
                    border-spacing: 0 !important;
                }

                .mis-table th, .mis-table td {
                    padding: 6px 4px !important;
                    vertical-align: middle !important;
                    border: 1px solid #ddd !important;
                }

                .mis-table th {
                    text-transform: uppercase;
                    font-size: 0.62rem;
                    white-space: nowrap;
                }

                .mono {
                    font-family: 'JetBrains Mono', monospace !important;
                    font-weight: 600;
                    font-size: 0.65rem;
                }

                .fw-800 { font-weight: 800; }
                
                .row-hover:hover td {
                    background-color: #f0f4f8 !important;
                }

                .total-row {
                    background-color: #f5f5f5 !important;
                    font-weight: 800;
                }

                .total-row td {
                    border-top: 3px solid #333 !important;
                    font-size: 0.72rem !important;
                }

                .badge-bill {
                    font-size: 0.62rem;
                    padding: 3px 6px;
                    border-radius: 4px;
                    background-color: #fbc02d;
                    color: #000;
                    font-weight: 700;
                }
                
                .text-amt { color: #d32f2f; }
                .text-qty { color: #1565c0; }

                .table-responsive-wrapper {
                   border-radius: 8px;
                   box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                   background: white;
                }

                .top-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .year-select-box {
                    background: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid #cfd8dc;
                }

                /* Cell coloring for better grouping */
                .cell-purchase { background-color: #fffde7; }
                .cell-sale { background-color: #f1f8fe; }
                .cell-loan { background-color: #fff9f8; }

                .filter-input {
                    font-size: 0.62rem;
                    padding: 4px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    width: 100%;
                    outline: none;
                }
                .filter-input:focus {
                    border-color: #1976d2;
                    box-shadow: 0 0 0 0.1rem rgba(25, 118, 210, 0.25);
                }
                .btn-export {
                    background: linear-gradient(45deg, #2e7d32, #43a047);
                    border: none;
                    transition: all 0.3s ease;
                }
                .btn-export:hover {
                    background: linear-gradient(45deg, #1b5e20, #2e7d32);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
                }
            `}</style>

            <div className="top-bar">
                <div className="d-flex align-items-center gap-3">
                    <div className="year-select-box shadow-sm">
                        <span className="fw-bold text-uppercase small text-muted">Stock Year</span>
                        <CFormSelect
                            size="sm"
                            style={{ width: '100px', fontWeight: '800' }}
                            value={currentYear}
                            onChange={(e) => setCurrentYear(e.target.value)}
                        >
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </CFormSelect>
                    </div>
                    {Object.values(filters).some(v => v !== '') && (
                        <CButton size="sm" color="danger" variant="outline" className="fw-bold" onClick={clearFilters}>
                            <CIcon icon={cilX} className="me-1" /> CLEAR FILTERS
                        </CButton>
                    )}
                    <CButton size="sm" color="success" className="btn-export text-white fw-bold shadow-sm" onClick={exportToExcel}>
                        <CIcon icon={cilCloudDownload} className="me-1" /> EXCEL EXPORT
                    </CButton>
                </div>
                <h4 className="mb-0 fw-bold text-secondary text-end" style={{ letterSpacing: '1px' }}>COMPREHENSIVE MIS REPORT</h4>
            </div>

            <CCard className="border-0">
                <CCardBody className="p-0">
                    <div className="table-responsive-wrapper">
                        <div style={{ overflowX: 'auto' }}>
                            <CTable bordered className="mis-table text-center mb-0" hover>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell colSpan={15} className="header-purchase py-2">
                                            PURCHASE DETAILS
                                        </CTableHeaderCell>
                                        <CTableHeaderCell colSpan={19} className="header-sale py-2">
                                            SALES DETAILS
                                        </CTableHeaderCell>
                                        <CTableHeaderCell colSpan={6} className="header-loan py-2">
                                            LOAN DETAILS
                                        </CTableHeaderCell>
                                    </CTableRow>
                                    <CTableRow>
                                        {/* Purchase */}
                                        <CTableHeaderCell className="sub-purchase">Bill Date</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Bill No</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Supplier</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Owner</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Item</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Lot No.</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Agmt No.</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Pkt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Gr Wt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Cutting</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Net Wt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Rate</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Amount</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Loading</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-purchase">Total Cost</CTableHeaderCell>

                                        {/* Sales */}
                                        <CTableHeaderCell className="sub-sale">Sale Dt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Sale Party</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Nikashi</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Tayari</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Charri</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Pkt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Wt (Q)</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Rate</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Amount</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Unload</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Taiyari</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Rent</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Bags</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Sutli</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Pkt Col</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Rafu/Chip</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Total Exp</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">Net Res</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-sale">%Shortage</CTableHeaderCell>

                                        {/* Loan */}
                                        <CTableHeaderCell className="sub-loan">Loan Dt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-loan">Loan</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-loan">Repay Dt</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-loan">Interest</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-loan">Pay Recd</CTableHeaderCell>
                                        <CTableHeaderCell className="sub-loan">Net Dues</CTableHeaderCell>
                                    </CTableRow>
                                    <CTableRow className="bg-light">
                                        <CTableHeaderCell><input className="filter-input" placeholder="Date.." value={filters.billDate} onChange={e => handleFilterChange('billDate', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="No.." value={filters.billNo} onChange={e => handleFilterChange('billNo', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="Supplier.." value={filters.supplier} onChange={e => handleFilterChange('supplier', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="Owner.." value={filters.owner} onChange={e => handleFilterChange('owner', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="Item.." value={filters.item} onChange={e => handleFilterChange('item', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="Lot.." value={filters.lotNo} onChange={e => handleFilterChange('lotNo', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="Agmt.." value={filters.agreementNo} onChange={e => handleFilterChange('agreementNo', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell colSpan={8} className="bg-white"></CTableHeaderCell>

                                        <CTableHeaderCell><input className="filter-input" placeholder="Date.." value={filters.saleDt} onChange={e => handleFilterChange('saleDt', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell><input className="filter-input" placeholder="Party.." value={filters.party} onChange={e => handleFilterChange('party', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell colSpan={17} className="bg-white"></CTableHeaderCell>

                                        <CTableHeaderCell><input className="filter-input" placeholder="Date.." value={filters.loanDt} onChange={e => handleFilterChange('loanDt', e.target.value)} /></CTableHeaderCell>
                                        <CTableHeaderCell colSpan={5} className="bg-white"></CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {loading ? (
                                        <CTableRow>
                                            <CTableDataCell colSpan={40} className="py-5">
                                                <CSpinner color="primary" />
                                                <div className="mt-2 fw-bold text-muted">GENERATING REPORT...</div>
                                            </CTableDataCell>
                                        </CTableRow>
                                    ) : filteredData.length === 0 ? (
                                        <CTableRow>
                                            <CTableDataCell colSpan={40} className="py-5 text-muted fw-bold">NO RECORDS MATCHING THE FILTERS</CTableDataCell>
                                        </CTableRow>
                                    ) : (
                                        filteredData.map((p, pIdx) => {
                                            const sales = p.sales || []
                                            const loans = p.loans || []
                                            const rowSpan = Math.max(sales.length, loans.length, 1)

                                            // Get Taiyari (Lot Processing) info from the processings association
                                            const proc = p.processings && p.processings.length > 0 ? p.processings[0] : {}

                                            return Array.from({ length: rowSpan }).map((_, i) => {
                                                const s = sales[i] || {}
                                                const l = loans[i] || {}
                                                const isFirstRow = i === 0

                                                return (
                                                    <CTableRow key={`${p.id}-${i}`} className="row-hover">
                                                        {isFirstRow && (
                                                            <>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-purchase">{p.billDate?.split('-').reverse().join('.')}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-purchase"><CBadge className="badge-bill">{p.billNo}</CBadge></CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="text-start fw-bold cell-purchase">{p.supplier?.name}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="text-start text-muted cell-purchase" style={{ fontSize: '0.6rem' }}>{p.purchasedFor?.name || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-purchase">{p.item?.name}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="fw-800 text-amt cell-purchase">
                                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                                        <span>{p.lotNo}</span>
                                                                        <CButton
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            color="primary"
                                                                            title="Print Lot Details"
                                                                            style={{ padding: '0 2px' }}
                                                                            onClick={() => exportLotReport(p)}
                                                                        >
                                                                            <CIcon icon={cilDescription} style={{ width: '12px' }} />
                                                                        </CButton>
                                                                    </div>
                                                                </CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-purchase">{p.agreementNo}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="fw-800 cell-purchase">{p.noOfPacket}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono cell-purchase">{p.grWt}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono text-muted cell-purchase">{p.cutting}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono fw-bold cell-purchase">{p.netWt}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono cell-purchase">{p.rate}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono cell-purchase">₹{p.amount}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono text-muted cell-purchase">₹{p.loadingLabour}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono fw-bold text-amt cell-purchase">₹{p.totalCost}</CTableDataCell>
                                                            </>
                                                        )}

                                                        {/* Sales Data */}
                                                        <CTableDataCell className="cell-sale">{s.saleDt?.split('-').reverse().join('.') || '-'}</CTableDataCell>
                                                        <CTableDataCell className="text-start cell-sale">{s.party || '-'}</CTableDataCell>

                                                        {/* Common Taiyari Info (Show only once per lot or rowSpan) */}
                                                        {isFirstRow ? (
                                                            <>
                                                                <CTableDataCell rowSpan={rowSpan} className="text-qty fw-bold cell-sale">{proc.nikashiPkt || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="text-qty fw-bold cell-sale">{proc.tayariPkt || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-sale">{proc.charriPkt || '-'}</CTableDataCell>
                                                            </>
                                                        ) : null}

                                                        <CTableDataCell className="fw-bold cell-sale">{s.salePkt || '-'}</CTableDataCell>
                                                        <CTableDataCell className="mono text-qty cell-sale">{s.saleWt || '-'}</CTableDataCell>
                                                        <CTableDataCell className="mono cell-sale">{s.rate || '-'}</CTableDataCell>
                                                        <CTableDataCell className="mono cell-sale">₹{s.amount || '-'}</CTableDataCell>

                                                        {/* Common Taiyari Expenses (Pull from Lot Processing) */}
                                                        {isFirstRow ? (
                                                            <>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono text-muted cell-sale">{proc.nikashiLabour || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono text-muted cell-sale">{proc.tayariLabour || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono text-muted cell-sale">{proc.rent || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-sale">{proc.newBags || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-sale">{proc.sutli || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-sale">{proc.pktCollection || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="cell-sale">{proc.raffuChippi || '-'}</CTableDataCell>
                                                                <CTableDataCell rowSpan={rowSpan} className="mono fw-bold cell-sale">₹{proc.totalExps || '-'}</CTableDataCell>
                                                            </>
                                                        ) : null}

                                                        {/* Net Result (Per Lot) */}
                                                        {isFirstRow && (
                                                            <CTableDataCell rowSpan={rowSpan} className="mono fw-bold text-amt cell-sale">
                                                                {(() => {
                                                                    const lotSalesAmount = sales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
                                                                    const purchaseCost = (parseFloat(p.totalCost) || 0)
                                                                    const lotProc = p.processings && p.processings.length > 0 ? p.processings[0] : {}
                                                                    const lotTaiyariExps = (parseFloat(lotProc.totalExps) || 0) - (parseFloat(lotProc.purchaseCost) || 0)
                                                                    const lotNetRes = lotSalesAmount - purchaseCost - lotTaiyariExps
                                                                    return `₹${lotNetRes.toFixed(2)}`
                                                                })()}
                                                            </CTableDataCell>
                                                        )}

                                                        {isFirstRow ? (
                                                            <CTableDataCell rowSpan={rowSpan} className="fw-bold text-danger cell-sale">{p.shortage ? `${p.shortage}%` : '-'}</CTableDataCell>
                                                        ) : null}

                                                        {/* Loan Data - Spanned to Purchase Row */}
                                                        {isFirstRow && (
                                                            <>
                                                                {(() => {
                                                                    const lotLoans = p.loans || []
                                                                    const totalLoan = lotLoans.reduce((sum, l) => sum + (parseFloat(l.loanAmount) || 0), 0)
                                                                    const totalInt = lotLoans.reduce((sum, l) => sum + (parseFloat(l.interest) || 0), 0)
                                                                    const totalPay = lotLoans.reduce((sum, l) => sum + (parseFloat(l.payRecd) || 0), 0)
                                                                    const totalDues = lotLoans.reduce((sum, l) => sum + (parseFloat(l.netDues) || 0), 0)
                                                                    const firstLoanDt = lotLoans.length > 0 ? lotLoans[0].loanDt : null
                                                                    const latestRepayDt = lotLoans.reduce((latest, l) => {
                                                                        if (!l.repaymentDt) return latest;
                                                                        return (!latest || l.repaymentDt > latest) ? l.repaymentDt : latest;
                                                                    }, null);

                                                                    return (
                                                                        <>
                                                                            <CTableDataCell rowSpan={rowSpan} className="cell-loan">
                                                                                {firstLoanDt ? firstLoanDt.split('-').reverse().join('.') : '-'}
                                                                                {lotLoans.length > 1 && <div className="text-muted" style={{ fontSize: '0.5rem' }}>({lotLoans.length} Loans)</div>}
                                                                            </CTableDataCell>
                                                                            <CTableDataCell rowSpan={rowSpan} className="mono text-amt fw-bold cell-loan">
                                                                                {totalLoan > 0 ? `₹${totalLoan.toFixed(2)}` : '-'}
                                                                            </CTableDataCell>
                                                                            <CTableDataCell rowSpan={rowSpan} className="cell-loan">
                                                                                {latestRepayDt ? latestRepayDt.split('-').reverse().join('.') : '-'}
                                                                            </CTableDataCell>
                                                                            <CTableDataCell rowSpan={rowSpan} className="mono text-muted cell-loan">
                                                                                {totalInt > 0 ? `₹${totalInt.toFixed(2)}` : '-'}
                                                                            </CTableDataCell>
                                                                            <CTableDataCell rowSpan={rowSpan} className="mono text-qty cell-loan">
                                                                                {totalPay > 0 ? `₹${totalPay.toFixed(2)}` : '-'}
                                                                            </CTableDataCell>
                                                                            <CTableDataCell rowSpan={rowSpan} className="mono text-amt fw-bold cell-loan">
                                                                                {totalDues > 0 ? `₹${totalDues.toFixed(2)}` : '-'}
                                                                            </CTableDataCell>
                                                                        </>
                                                                    )
                                                                })()}
                                                            </>
                                                        )}
                                                    </CTableRow>
                                                )
                                            })
                                        })
                                    )}
                                    <CTableRow className="total-row">
                                        <CTableDataCell colSpan={7} className="text-end pe-3">GRAND TOTALS</CTableDataCell>
                                        <CTableDataCell className="text-dark bg-warning-subtle">{totals.pkt}</CTableDataCell>
                                        <CTableDataCell className="mono bg-warning-subtle">{totals.grWt.toFixed(3)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-warning-subtle">{totals.cutting.toFixed(3)}</CTableDataCell>
                                        <CTableDataCell className="mono fw-bold bg-warning-subtle">{totals.netWt.toFixed(3)}</CTableDataCell>
                                        <CTableDataCell className="bg-warning-subtle"></CTableDataCell>
                                        <CTableDataCell className="mono bg-warning-subtle">₹{totals.amount.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-warning-subtle">₹{totals.loading.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono fw-bold text-amt bg-warning-subtle">₹{totals.cost.toFixed(2)}</CTableDataCell>

                                        <CTableDataCell colSpan={5} className="bg-primary-subtle"></CTableDataCell>
                                        <CTableDataCell className="fw-bold bg-primary-subtle text-primary">{totals.salePkt}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle text-primary">{totals.saleWt.toFixed(3)}</CTableDataCell>
                                        <CTableDataCell className="bg-primary-subtle"></CTableDataCell>
                                        <CTableDataCell className="mono fw-bold bg-primary-subtle text-primary">₹{totals.saleAmt.toFixed(2)}</CTableDataCell>

                                        {/* Taiyari Totals in Grand Totals row */}
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tUnload?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tTayaro?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tRent?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tBags?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tSutli?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tPktCol?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-primary-subtle">{totals.tRafu?.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono fw-bold bg-primary-subtle text-amt">₹{totals.tExp?.toFixed(2)}</CTableDataCell>

                                        <CTableDataCell className="mono fw-bold text-amt bg-primary-subtle" style={{ color: totals.netRes >= 0 ? '#2e7d32' : '#d32f2f' }}>
                                            ₹{totals.netRes.toFixed(2)}
                                        </CTableDataCell>
                                        <CTableDataCell className="bg-primary-subtle fw-bold text-danger">
                                            {totals.grWt > 0 ? (((totals.grWt - totals.saleWt - (totals.charriPkt / 2)) / totals.grWt) * 100).toFixed(2) + '%' : '-'}
                                        </CTableDataCell>

                                        <CTableDataCell className="bg-danger-subtle"></CTableDataCell>
                                        <CTableDataCell className="mono fw-bold bg-danger-subtle text-danger">₹{totals.loan.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="bg-danger-subtle"></CTableDataCell>
                                        <CTableDataCell className="mono bg-danger-subtle text-danger">₹{totals.int.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono bg-danger-subtle text-danger">₹{totals.pay.toFixed(2)}</CTableDataCell>
                                        <CTableDataCell className="mono fw-bold text-amt bg-danger-subtle">₹{totals.dues.toFixed(2)}</CTableDataCell>
                                    </CTableRow>
                                </CTableBody>
                            </CTable>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </div>
    )
}

export default MISReport;
