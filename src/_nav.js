import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilTruck,
  cilCart,
  cilList,
  cilMoney,
} from '@coreui/icons'

import { CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Parties',
    to: '/parties',
    icon: <CIcon icon={cilTruck} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Purchase',
    to: '/purchase-sale',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Taiyari/Direct',
    to: '/lot-processing',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Sale',
    to: '/sale',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Lot Transfer',
    to: '/lot-transfer',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Loan',
    to: '/loan',
    icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'MIS Report',
    to: '/mis-report',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
]

export default _nav