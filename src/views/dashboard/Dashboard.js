import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCart,
  cilGraph,
  cilStorage,
} from '@coreui/icons'

import { dashboardApi } from '../../api/reservationApi'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    purchase: { weight: 0, bags: 0, amount: 0 },
    sales: { weight: 0, bags: 0, amount: 0 },
    stock: { weight: 0, bags: 0, amount: 0 },
  })

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const fetchStats = async () => {
    try {
      const response = await dashboardApi.getStats({ year: selectedYear })
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [selectedYear])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN').format(value)
  }

  const formatWeight = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const MetricCard = ({ title, data, icon, color }) => (
    <CCol xs={12} lg={4}>
      <CCard className={`mb-4 border-top-${color} border-top-3 shadow-sm h-100`}>
        <CCardBody>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="text-medium-emphasis small text-uppercase fw-semibold">{title}</div>
              {loading ? (
                <div className="fs-2 fw-bold mt-2"><CSpinner size="sm" /></div>
              ) : (
                <div className="fs-3 fw-bold mt-1 text-dark">
                  {formatCurrency(data.amount)}
                </div>
              )}
            </div>
            <div className={`bg-${color} bg-opacity-10 p-3 rounded-3`}>
              <CIcon icon={icon} size="xl" className={`text-${color}`} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top">
            <CRow className="text-center">
              <CCol xs={6} className="border-end">
                <div className="text-medium-emphasis small mb-1">Total Weight</div>
                <div className="fw-bold text-dark">
                  {loading ? '...' : `${formatWeight(data.weight)} Qtl`}
                </div>
              </CCol>
              <CCol xs={6}>
                <div className="text-medium-emphasis small mb-1">Total Bags</div>
                <div className="fw-bold text-dark">
                  {loading ? '...' : `${formatNumber(data.bags)} ps`}
                </div>
              </CCol>
            </CRow>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  )

  return (
    <div className="dashboard-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Trading Overview</h4>
          <p className="text-medium-emphasis mb-0 small">
            <span className="live-pulse me-2"></span>
            Real-time tracking of your inventory and transactions.
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm shadow-sm border-0 bg-white"
            style={{ width: '120px', borderRadius: '8px' }}
            value={selectedYear}
            onChange={(e) => { setLoading(true); setSelectedYear(parseInt(e.target.value)) }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <CRow className="g-4">
        <MetricCard
          title="Total Purchase"
          data={stats.purchase}
          icon={cilCart}
          color="primary"
        />
        <MetricCard
          title="Total Sales"
          data={stats.sales}
          icon={cilGraph}
          color="success"
        />
        <MetricCard
          title="Stock-in-Hand"
          data={stats.stock}
          icon={cilStorage}
          color="info"
        />
      </CRow>

      {/* Placeholder for future sections */}
      {!loading && (
        <CRow className="mt-4">
          <CCol xs={12}>
            <CCard className="border-0 bg-light">
              <CCardBody className="p-4 text-center">

              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </div>
  )
}

export default Dashboard
