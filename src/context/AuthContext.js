// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import config from '../config'

const AuthContext = createContext(null);

const API_BASE_URL = config.API_BASE_URL

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(() => {
        try {
            return localStorage.getItem('accessToken');
        } catch {
            return null;
        }
    });

    // ✅ NEW: Impersonation state
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [originalUser, setOriginalUser] = useState(null);
    const [impersonatedlocation, setImpersonatedlocation] = useState(null);

    const getAuthHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` })
    }), [accessToken]);

    const handleTokens = useCallback((data) => {
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            setAccessToken(data.accessToken);
        }
        if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
        }
    }, []);

    // ✅ UPDATED: clearAuth with optional redirect - also clears impersonation
    const clearAuth = useCallback((shouldRedirect = false) => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('impersonation'); // ✅ Clear impersonation
        setAccessToken(null);
        setUser(null);
        setIsImpersonating(false);
        setOriginalUser(null);
        setImpersonatedlocation(null);

        if (shouldRedirect) {
            window.location.href = '/#/login';
        }
    }, []);

    const refreshAccessToken = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) return null;

            const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                handleTokens(data.data);
                return data.data.accessToken;
            }

            clearAuth(true);
            return null;
        } catch (error) {
            clearAuth(true);
            return null;
        }
    }, [handleTokens, clearAuth]);

    const fetchWithAuth = useCallback(async (url, options = {}) => {
        try {
            let response = await fetch(url, {
                ...options,
                headers: { ...getAuthHeaders(), ...options.headers },
                credentials: 'include'
            });

            if (response.status === 401) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    response = await fetch(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${newToken}`
                        },
                        credentials: 'include'
                    });
                } else {
                    return response;
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    }, [getAuthHeaders, refreshAccessToken]);

    const verifyAuth = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/auth/verify`);

            if (!response.ok) {
                let errorData = null;
                try {
                    errorData = await response.json();
                } catch (e) { }

                if (response.status === 401 || response.status === 403) {
                    clearAuth(false);
                }
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.success) {
                // ✅ Check for stored impersonation state
                const storedImpersonation = localStorage.getItem('impersonation');
                if (storedImpersonation) {
                    try {
                        const impersonationData = JSON.parse(storedImpersonation);
                        setIsImpersonating(true);
                        setOriginalUser(impersonationData.originalUser);
                        setImpersonatedlocation(impersonationData.location);
                        // Set impersonated user data
                        setUser({
                            ...data.data.user,
                            role: 'staff',
                            locationId: impersonationData.location.id,
                            location: impersonationData.location,
                            isImpersonated: true,
                        });
                    } catch (e) {
                        setUser(data.data.user);
                    }
                } else {
                    setUser(data.data.user);
                }
            } else {
                clearAuth(false);
            }
        } catch (error) {
            if (!error.message?.includes('Failed to fetch') && !error.message?.includes('NetworkError')) {
                console.warn('Auth verification error:', error.message);
                clearAuth(false);
            }
        } finally {
            setLoading(false);
        }
    }, [accessToken, fetchWithAuth, clearAuth]);

    useEffect(() => {
        if (accessToken) {
            verifyAuth();
        } else {
            setLoading(false);
        }
    }, [accessToken, verifyAuth]);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                handleTokens(data.data);
                setUser(data.data.user);
                // ✅ Clear any impersonation on fresh login
                localStorage.removeItem('impersonation');
                setIsImpersonating(false);
                setOriginalUser(null);
                setImpersonatedlocation(null);
                return { success: true };
            }

            let errorMessage = data.message || 'Login failed';

            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                const errorMessages = data.errors.map(err => {
                    return err.field ? `${err.field}: ${err.message}` : err.message;
                });
                errorMessage = errorMessages.join('. ');
            }

            return {
                success: false,
                message: errorMessage
            };
        } catch (error) {
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    };

    const logout = async () => {
        try {
            await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuth(true);
        }
    };

    const isAuthenticated = () => {
        return !!user && !!accessToken;
    };

    const forceLogout = useCallback((message = 'Session expired. Please login again.') => {
        alert(message);
        clearAuth(true);
    }, [clearAuth]);

    // ✅ NEW: Login as location (Impersonation)
    const loginAslocation = useCallback((location) => {
        if (user?.role !== 'super_admin') {
            console.error('Only super admin can impersonate');
            return false;
        }

        // Store original user
        const originalUserData = { ...user };
        setOriginalUser(originalUserData);

        // Create impersonated user (as staff of that location)
        const impersonatedUser = {
            ...user,
            role: 'staff',
            locationId: location.id,
            location: location,
            isImpersonated: true,
        };

        // Update user state
        setUser(impersonatedUser);
        setIsImpersonating(true);
        setImpersonatedlocation(location);

        // Store in localStorage for persistence
        localStorage.setItem('impersonation', JSON.stringify({
            originalUser: originalUserData,
            location: location,
        }));

        return true;
    }, [user]);

    // ✅ NEW: Exit impersonation and return to super admin
    const exitImpersonation = useCallback(() => {
        if (!isImpersonating || !originalUser) {
            return false;
        }

        // Restore original user
        setUser(originalUser);
        setIsImpersonating(false);
        setImpersonatedlocation(null);

        // Clear impersonation from localStorage
        localStorage.removeItem('impersonation');

        setOriginalUser(null);

        return true;
    }, [isImpersonating, originalUser]);

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        fetchWithAuth,
        accessToken,
        API_BASE_URL,
        forceLogout,
        // ✅ NEW: Impersonation exports
        isImpersonating,
        originalUser,
        impersonatedlocation,
        loginAslocation,
        exitImpersonation,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;