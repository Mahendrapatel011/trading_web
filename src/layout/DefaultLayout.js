// src/layout/DefaultLayout.jsx
import React from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import ImpersonationBanner from '../components/common/ImpersonationBanner'

const DefaultLayout = () => {
  return (
    <div>
      {/* Impersonation Banner at the very top */}
      <ImpersonationBanner />
      
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout