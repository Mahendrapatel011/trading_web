// src/views/pages/login/Login.js
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CCol, CContainer, CRow } from '@coreui/react'
import { useAuth } from '../../../context/AuthContext'
import logo from '../../../assets/logo.png'
import bg from '../../../assets/bg.jpeg'

// Admin Icon
const AdminIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

// Error Icon
const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get redirect path based on role
  const getRedirectPath = (userRole) => {
    const role = userRole?.toUpperCase()

    switch (role) {
      case 'SUPER_ADMIN':
        return '/'
      case 'ADMIN':
        return '/dashboard'
      case 'MANAGER':
        return '/dashboard'
      case 'STAFF':
        return '/dashboard'
      default:
        return '/dashboard'
    }
  }

  useEffect(() => {
    if (isAuthenticated() && user) {
      // If already logged in, redirect based on role
      const redirectPath = getRedirectPath(user.role)
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, navigate, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        // Get user role from result
        const userRole = result.user?.role || result.data?.user?.role

        // Check if there was a previous intended destination
        const from = location.state?.from?.pathname

        // Determine redirect path
        let redirectPath

        if (from && from !== '/login') {
          // If user was trying to access a specific page, redirect there
          redirectPath = from
        } else {
          // Otherwise, redirect based on role
          redirectPath = getRedirectPath(userRole)
        }

        navigate(redirectPath, { replace: true })
      } else {
        setError(result.message || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <CContainer fluid className="p-0 h-100">
        <CRow className="g-0 h-100">
          {/* Left Side - Image */}
          <CCol lg={7} className="d-none d-lg-block login-image-section">
            <img
              src={bg}
              alt="Trading"
              className="login-bg-image"
            />
            <div className="image-overlay"></div>

          </CCol>

          {/* Right Side - Login Form */}
          <CCol lg={5} className="login-form-section">
            <div className="login-form-container">
              {/* Header */}
              <div className="login-header">
                <div className="login-icon">
                  <img src={logo} alt="Logo" className="login-logo" />
                </div>
                <h1>Trading Login</h1>
                <p>Enter your credentials to continue</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="login-error">
                  <ErrorIcon />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="text"
                    id="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="login-footer">
                <p>© 2025 Trading Management System</p>
              </div>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login