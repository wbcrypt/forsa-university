import axios from 'axios'

const TENANT_ID = 'be694fc0-789a-4dec-b514-850710469c72'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uni_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(r => r, async (error) => {
  const req = error.config as any
  if (error.response?.status === 401 && !req._retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then(token => { req.headers.Authorization = `Bearer ${token}`; return api(req) })
    }
    req._retry = true; isRefreshing = true
    const refresh = localStorage.getItem('uni_refresh')
    if (!refresh) { localStorage.clear(); window.location.href = '/login'; return Promise.reject(error) }
    try {
      const res = await axios.post('/api/v1/auth/refresh', { refreshToken: refresh })
      const { accessToken, refreshToken: nr } = res.data
      localStorage.setItem('uni_token', accessToken)
      localStorage.setItem('uni_refresh', nr)
      queue.forEach(p => p.resolve(accessToken)); queue = []
      req.headers.Authorization = `Bearer ${accessToken}`; return api(req)
    } catch (err) {
      queue.forEach(p => p.reject(err)); queue = []
      localStorage.clear(); window.location.href = '/login'; return Promise.reject(err)
    } finally { isRefreshing = false }
  }
  return Promise.reject(error)
})

export default api
export { TENANT_ID }

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password, tenantId: TENANT_ID }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const universityApi = {
  get: (id: string) => api.get(`/universities/${id}`),
  getPerformance: (id: string) => api.get(`/universities/${id}/performance`),
  getPrograms: (id: string) => api.get(`/universities/${id}/programs`),
}

export const applicationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/applications', { params }),
  get: (id: string) => api.get(`/applications/${id}`),
  getStatusHistory: (id: string) => api.get(`/applications/${id}/status-history`),
}

export const studentsApi = {
  get: (id: string) => api.get(`/students/${id}`),
  getScore: (id: string) => api.get(`/scores/students/${id}`),
}

export const documentsApi = {
  getForEntity: (type: string, id: string) => api.get(`/documents/entity/${type}/${id}`),
  getChecklist: (applicationId: string) => api.get(`/documents/checklist/applications/${applicationId}`),
  getDownloadUrl: (id: string) => api.get(`/documents/${id}/download-url`),
}

export const paymentsApi = {
  getSchedule: (applicationId: string) =>
    api.get(`/payments/schedules/applications/${applicationId}`),
}
