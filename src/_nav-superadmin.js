import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilHome,
  cilLayers,
} from '@coreui/icons'
import { CNavItem, CNavTitle, CNavGroup } from '@coreui/react'

const _navSuperAdmin = [
  {
    component: CNavTitle,
    name: 'Super Admin',
  },
  {
    component: CNavItem,
    name: 'Management',
    to: '/management',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Masters',
    to: '/masters',
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Item Creation',
        to: '/masters/items',
      },
      {
        component: CNavItem,
        name: 'Units',
        to: '/masters/units',
      },
      {
        component: CNavItem,
        name: 'Loading Labour Rate',
        to: '/masters/loading-rates',
      },
      {
        component: CNavItem,
        name: 'Unloading Labour Rate',
        to: '/masters/unloading-rates',
      },
      {
        component: CNavItem,
        name: 'Taiyari Labour Rate',
        to: '/masters/taiyari-rates',
      },
      {
        component: CNavItem,
        name: 'ColdStorage Rent Rate',
        to: '/masters/rent-rates',
      },
      {
        component: CNavItem,
        name: 'Interest Rate',
        to: '/masters/interest-rates',
      },
    ],
  },
]

export default _navSuperAdmin
