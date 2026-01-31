import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import { useAuth } from '../context/AuthContext'

// routes config
import routes from '../routes'
import superAdminRoutes from '../routes-superadmin'

const AppContent = () => {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const activeRoutes = isSuperAdmin ? superAdminRoutes : routes
  const defaultPath = isSuperAdmin ? '/users' : '/dashboard'

  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {activeRoutes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
