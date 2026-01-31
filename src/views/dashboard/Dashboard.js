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

const Dashboard = () => {
  const [loading, setLoading] = useState(true)

  // Placeholder stats - since transaction models are not yet created
  const [stats, setStats] = useState({
    purchase: { weight: 0, bags: 0, amount: 0 },
    sales: { weight: 0, bags: 0, amount: 0 },
    stock: { weight: 0, bags: 0, amount: 0 },
  })

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
      // Set some dummy data for preview
      setStats({
        purchase: { weight: 1250.5, bags: 2500, amount: 750000 },
        sales: { weight: 800.75, bags: 1600, amount: 520000 },
        stock: { weight: 449.75, bags: 900, amount: 230000 },
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

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
      <div className="mb-4">
        <h4 className="fw-bold text-dark">Trading Overview</h4>
        <p className="text-medium-emphasis">Real-time tracking of your inventory and transactions.</p>
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
