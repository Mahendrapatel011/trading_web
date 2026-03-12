import axios from 'axios'
import config from '../config'

const API_BASE_URL = config.API_BASE_URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // ✅ Handle Impersonation Header
        const storedImpersonation = localStorage.getItem('impersonation')
        if (storedImpersonation) {
            try {
                const impersonationData = JSON.parse(storedImpersonation)
                if (impersonationData?.location?.id) {
                    config.headers['X-location-Id'] = impersonationData.location.id
                }
            } catch (e) {
                console.error('Error parsing impersonation data:', e)
            }
        }
        return config
    },
    (error) => Promise.reject(error),
)

export const userApi = {
    getAll: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
}

export const locationApi = {
    getAll: () => api.get('/locations'),
    create: (data) => api.post('/locations', data),
    update: (id, data) => api.put(`/locations/${id}`, data),
    delete: (id) => api.delete(`/locations/${id}`),
    getAvailableYears: (id) => api.get(`/locations/${id}/available-years`),
    deleteByYear: (id, year) => api.delete(`/locations/${id}/year/${year}`),
}

export const dashboardApi = {
    getStats: (params) => api.get('/dashboard/stats', { params }),
}

export const masterApi = {
    // Items
    getItems: () => api.get('/items'),
    createItem: (data) => api.post('/items', data),
    updateItem: (id, data) => api.put(`/items/${id}`, data),
    deleteItem: (id) => api.delete(`/items/${id}`),
}

export const unitApi = {
    getAllAdmin: () => api.get('/units'),
}

export const rentRateApi = {
    getAllAdmin: () => api.get('/rent-rates/admin/all'),
    create: (data) => api.post('/rent-rates', data),
    update: (id, data) => api.put(`/rent-rates/${id}`, data),
    delete: (id) => api.delete(`/rent-rates/${id}`),
}

export const loadingRateApi = {
    getAll: () => api.get('/loading-rates'),
    getAllAdmin: () => api.get('/loading-rates/admin/all'),
    create: (data) => api.post('/loading-rates', data),
    update: (id, data) => api.put(`/loading-rates/${id}`, data),
    delete: (id) => api.delete(`/loading-rates/${id}`),
}

export const unloadingRateApi = {
    getAllAdmin: () => api.get('/unloading-rates/admin/all'),
    create: (data) => api.post('/unloading-rates', data),
    update: (id, data) => api.put(`/unloading-rates/${id}`, data),
    delete: (id) => api.delete(`/unloading-rates/${id}`),
}

export const taiyariRateApi = {
    getAllAdmin: () => api.get('/taiyari-rates/admin/all'),
    create: (data) => api.post('/taiyari-rates', data),
    update: (id, data) => api.put(`/taiyari-rates/${id}`, data),
    delete: (id) => api.delete(`/taiyari-rates/${id}`),
}

export const interestRateApi = {
    getAll: () => api.get('/interest-rates'),
    getAllAdmin: () => api.get('/interest-rates/admin/all'),
    create: (data) => api.post('/interest-rates', data),
    update: (id, data) => api.put(`/interest-rates/${id}`, data),
    delete: (id) => api.delete(`/interest-rates/${id}`),
}

export const reservationApi = {
    getAvailableYears: () => api.get('/reservations/available-years'),
    getAllByYear: (year) => api.get(`/reservations/year/${year}`),
}

export const supplierApi = {
    getAll: () => api.get('/suppliers'),
    getAllAdmin: () => api.get('/suppliers/admin/all'),
    getById: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`),
}

export const purchaseApi = {
    getAll: (year) => api.get('/purchases', { params: { year } }),
    getAllAdmin: (year) => api.get('/purchases/admin/all', { params: { year } }),
    getById: (id, year) => api.get(`/purchases/${id}`, { params: { year } }),
    generateBillNo: (year, locationId) => api.post('/purchases/generate-bill-no', { locationId }, { params: { year } }),
    create: (data) => api.post('/purchases', data),
    update: (id, data, year) => api.put(`/purchases/${id}`, data, { params: { year } }),
    delete: (id, year) => api.delete(`/purchases/${id}`, { params: { year } }),
    lotTransfer: (data) => api.post('/purchases/lot-transfer', data),
    getTransferHistory: (params) => api.get('/purchases/transfer-history/all', { params }),
}

export const saleApi = {
    getAll: (year, locationId) => api.get('/sales', { params: { year, locationId } }),
    getGrouped: (year) => api.get('/sales/grouped', { params: { year } }),
    getAvailablePurchases: (year) => api.get('/sales/available-purchases', { params: { year } }),
    getById: (id) => api.get(`/sales/${id}`),
    create: (data) => api.post('/sales', data),
    update: (id, data) => api.put(`/sales/${id}`, data),
    delete: (id) => api.delete(`/sales/${id}`),
}

export const loanApi = {
    getAll: (year) => api.get('/loans', { params: { year } }),
    create: (data) => api.post('/loans', data),
    update: (id, data) => api.put(`/loans/${id}`, data),
    delete: (id) => api.delete(`/loans/${id}`),
    getByPurchase: (purchaseId) => api.get(`/loans/purchase/${purchaseId}`),
}

export const lotProcessingApi = {
    create: (data) => api.post('/lot-processings', data),
    update: (id, data) => api.patch(`/lot-processings/${id}`, data),
    delete: (id) => api.delete(`/lot-processings/${id}`),
    getByPurchase: (purchaseId) => api.get(`/lot-processings/purchase/${purchaseId}`),
    getAll: (params) => api.get('/lot-processings', { params }),
}


export default api

