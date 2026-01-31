import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilTruck,
  cilCart,
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
    name: 'Purchase Sale',
    to: '/purchase-sale',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
]

export default _nav