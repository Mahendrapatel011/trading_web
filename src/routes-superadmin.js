import React from 'react'

const SuperAdminManagement = React.lazy(() => import('./views/superadmin/SuperAdminManagement'))
const UserManagement = React.lazy(() => import('./views/superadmin/UserManagement'))
const Items = React.lazy(() => import('./views/masters/items/Items'))
const Units = React.lazy(() => import('./views/masters/units/Units'))
const LoadingRates = React.lazy(() => import('./views/masters/loadingRates/LoadingRates'))
const UnloadingRates = React.lazy(() => import('./views/masters/unloadingRates/UnloadingRates'))
const TaiyariRates = React.lazy(() => import('./views/masters/taiyariRates/TaiyariRates'))
const RentRates = React.lazy(() => import('./views/masters/rentRates/RentRates'))
const InterestRates = React.lazy(() => import('./views/masters/interestRates/InterestRates'))
const Suppliers = React.lazy(() => import('./views/suppliers/Suppliers'))

const superAdminRoutes = [
  { path: '/', exact: true, name: 'Home', element: SuperAdminManagement },
  { path: '/management', name: 'Management', element: SuperAdminManagement },
  { path: '/suppliers', name: 'Suppliers', element: Suppliers },

  { path: '/users', name: 'User Management', element: UserManagement },
  { path: '/masters/items', name: 'Item Creation', element: Items },
  { path: '/masters/units', name: 'Units', element: Units },
  { path: '/masters/loading-rates', name: 'Loading Labour Rate Fixation', element: LoadingRates },
  { path: '/masters/unloading-rates', name: 'Unloading Labour Rate Fixation', element: UnloadingRates },
  { path: '/masters/taiyari-rates', name: 'Taiyari Labour Rate Fixation', element: TaiyariRates },
  { path: '/masters/rent-rates', name: 'Cold Storage Rent Rate Fixataion', element: RentRates },
  { path: '/masters/interest-rates', name: 'Interest Rate', element: InterestRates },
]

export default superAdminRoutes
