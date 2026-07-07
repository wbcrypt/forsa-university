import axios from 'axios'

const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'be694fc0-789a-4dec-b514-850710469c72'

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
  // Phase 3 (browser E2E testing) discovery — get()/getPerformance()
  // called GET /universities/:id and GET /universities/:id/performance
  // directly (university.view, staff-only) — every real university
  // account's dashboard has 403'd on every load ("Failed to load data")
  // since T-223's identity fix only addressed *where* the id came from,
  // not that every downstream call still hit staff-only routes. Fixed to
  // the self-scoped routes (me returns the same full profile get() did;
  // me/performance is the new sibling).
  get: () => api.get('/universities/me'),
  getPerformance: () => api.get('/universities/me/performance'),
  // Phase 3 (browser E2E testing) discovery — hit the staff-only
  // GET /:id/programs; the public sibling below is what forsa-student
  // already correctly uses.
  getPrograms: (id: string) => api.get(`/universities/${id}/programs/public`, { params: { tenantId: TENANT_ID } }),
  // T-223 discovery — was a manually-typed login-form field, trusted
  // client-side for every "my university" call (same class of bug as
  // K-03/T-103's partners[0] issue). Resolves the real identity
  // server-side via the JWT — never trust anything the client sends.
  me: () => api.get('/universities/me'),
}

export const applicationsApi = {
  // Phase 3 (browser E2E testing) discovery — called the staff-only
  // GET /applications?universityId=X (application.view) directly —
  // every real university account 403'd. Self-scoped: resolves the
  // university via the JWT identity server-side.
  list: (params?: Record<string, unknown>) => api.get('/applications/university-mine', { params }),
  // Phase 3 (browser E2E testing) discovery — get()/getStatusHistory()
  // called the staff-only GET /applications/:id and
  // /:id/status-history directly, 403ing StudentDetailPage for every
  // real university account. Self-scoped siblings verify the
  // application actually belongs to the caller's own university.
  get: (id: string) => api.get(`/applications/university-mine/${id}`),
  getStatusHistory: (id: string) => api.get(`/applications/university-mine/${id}/status-history`),
  // T-223 — the portal's one write capability: confirming enrollment/
  // tuition before the payment plan activates. Self-scoped server-side,
  // never trusting a client-supplied university id.
  confirmEnrollment: (id: string, notes?: string) =>
    api.post(`/applications/${id}/university-confirm`, { notes }),
}

export const studentsApi = {
  get: (id: string) => api.get(`/students/${id}`),
  // Phase 3 (browser E2E testing) discovery — hit the staff-only
  // GET /scores/students/:id, 403ing the FORSA score widget on
  // StudentDetailPage for every real university account.
  getScore: (id: string) => api.get(`/scores/university-mine/students/${id}`),
}

export const documentsApi = {
  getForEntity: (type: string, id: string) => api.get(`/documents/entity/${type}/${id}`),
  // Phase 3 (browser E2E testing) discovery — both hit staff-only
  // document.view routes, 403ing the whole Documents page and
  // StudentDetailPage's checklist/downloads for every real university
  // account.
  getChecklist: (applicationId: string) => api.get(`/documents/university-mine/checklist/applications/${applicationId}`),
  getDownloadUrl: (id: string) => api.get(`/documents/university-mine/${id}/download-url`),
}

export const paymentsApi = {
  // Phase 3 (browser E2E testing) discovery — hit the staff-only
  // GET /payments/schedules/applications/:id, 403ing the Payments page
  // and StudentDetailPage for every real university account.
  getSchedule: (applicationId: string) =>
    api.get(`/payments/schedules/university-mine/applications/${applicationId}`),
}
