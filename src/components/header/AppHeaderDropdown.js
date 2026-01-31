import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilUser,
  cilAccountLogout,
  cilSettings,
  cilLockLocked,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useAuth } from '../../context/AuthContext'
import UserProfileModal from '../profile/UserProfileModal'
import ChangePasswordModal from '../profile/ChangePasswordModal'

import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <CDropdown variant="nav-item" alignment="end">
        <CDropdownToggle 
          placement="bottom-end" 
          className="py-0 pe-0 d-flex align-items-center" 
          caret={false}
        >
          <CAvatar src={avatar8} size="md" status="success" />
        </CDropdownToggle>
        <CDropdownMenu className="pt-0" placement="bottom-end">
          <CDropdownHeader className="bg-body-secondary fw-semibold rounded-top">
            <div className="d-flex align-items-center py-2">
              <CAvatar src={avatar8} size="md" className="me-2" />
              <div>
                <div className="fw-semibold">{user?.username || user?.email || 'Admin User'}</div>
                <small className="text-body-secondary">{user?.role || 'Administrator'}</small>
              </div>
            </div>
          </CDropdownHeader>
          
          <CDropdownHeader className="bg-body-secondary fw-semibold my-2">
            Settings
          </CDropdownHeader>
          
          <CDropdownItem 
            onClick={() => setShowProfileModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <CIcon icon={cilUser} className="me-2" />
            My Profile
          </CDropdownItem>
          
          <CDropdownItem 
            onClick={() => setShowChangePasswordModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <CIcon icon={cilLockLocked} className="me-2" />
            Change Password
          </CDropdownItem>
          
          <CDropdownDivider />
          
          <CDropdownItem 
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            <CIcon icon={cilAccountLogout} className="me-2 text-danger" />
            <span className="text-danger">Logout</span>
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>

      <UserProfileModal 
        visible={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
      <ChangePasswordModal 
        visible={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
    </>
  )
}

export default AppHeaderDropdown