import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const contentAPI = {
  list: () => api.get('/content'),
  get: (id) => api.get(`/content/${id}`),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  getComments: (id) => api.get(`/content/${id}/comments`),
  addComment: (id, data) => api.post(`/content/${id}/comments`, data),
}

export const subscriptionAPI = {
  createSession: (creatorId) => api.post(`/subscriptions/create-session?creator_id=${creatorId}`),
  activateDemo: (creatorId) => api.post(`/subscriptions/activate-demo?creator_id=${creatorId}`),
  verifySession: (sessionId) => api.post(`/subscriptions/verify-session?session_id=${sessionId}`),
  status: () => api.get('/subscriptions/status'),
}

export const dashboardAPI = {
  creator: () => api.get('/dashboard/creator'),
  user: () => api.get('/dashboard/user'),
}

export const adminAPI = {
  summary: () => api.get('/admin/analytics/summary'),
  revenue: () => api.get('/admin/analytics/revenue'),
  usersGrowth: () => api.get('/admin/analytics/users'),
  subscriptionDist: () => api.get('/admin/analytics/subscriptions'),
  getUsers: () => api.get('/admin/users'),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getContent: () => api.get('/admin/content'),
  deleteContent: (id) => api.delete(`/admin/content/${id}`),
  getSubscriptions: () => api.get('/admin/subscriptions'),
}