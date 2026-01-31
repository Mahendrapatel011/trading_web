// src/components/profile/UserProfileModal.js
import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalBody,
  CSpinner,
} from '@coreui/react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/reservationApi'
import './UserProfileModal.css'

// Default Avatar
import defaultAvatar from '../../assets/images/avatars/8.jpg'

const UserProfileModal = ({ visible, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (visible && user) {
      loadUserProfile()
    }
  }, [visible, user])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/auth/me')
      // Backend returns: { data: { user: {...} } }
      const data = response.data?.data?.user || response.data?.user || response.data?.data || user
      setUserData(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUserData(user)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFullName = () => {
    const data = userData || user
    if (data?.firstName && data?.lastName) {
      return `${data.firstName} ${data.lastName}`
    }
    return data?.fullName || data?.name || data?.email?.split('@')[0] || 'User'
  }

  const getlocationName = () => {
    const data = userData || user
    return data?.location?.name || data?.locationName || 'Not Assigned'
  }

  const displayData = userData || user

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="sm"
      alignment="center"
      className="profile-modal"
    >
      <CModalBody className="profile-modal-body">
        {loading ? (
          <div className="profile-loading">
            <CSpinner size="sm" />
            <span>Loading...</span>
          </div>
        ) : (
          <>
            {/* Close Button */}
            <button className="profile-close-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar">
                <img
                  src={displayData?.profileImage || defaultAvatar}
                  alt="Profile"
                  onError={(e) => { e.target.src = defaultAvatar }}
                />
                <span className={`status-dot ${displayData?.status || 'active'}`}></span>
              </div>
              <h3 className="profile-name">{getFullName()}</h3>
              <span className="profile-role">{displayData?.role || 'User'}</span>
            </div>

            {/* Profile Info */}
            <div className="profile-info">
              <div className="info-row">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">{displayData?.email || 'N/A'}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">location</span>
                  <span className="info-value">{getlocationName()}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">{formatDate(displayData?.createdAt)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CModalBody>
    </CModal>
  )
}

export default UserProfileModal