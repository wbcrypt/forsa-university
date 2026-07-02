import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../../components/ui'
import { Eye, EyeOff, Loader2, Building2, Shield } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [universityId, setUniversityId] = useState(localStorage.getItem('uni_university_id') || '')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !universityId) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      await login(email, password)
      localStorage.setItem('uni_university_id', universityId)
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (msg === 'Invalid credentials') setError('Incorrect email or password.')
      else setError(msg || 'Login failed. Please contact FORSA support.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="FORSA" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <p className="text-white font-semibold text-lg leading-none">FORSA</p>
              <p className="text-teal-400 text-sm">University Portal</p>
            </div>
          </div>
          <h1 className="text-white text-xl font-bold">University Sign In</h1>
          <p className="text-white/50 text-sm mt-1">Access your student financing dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-modal p-6">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@university.tn" autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-1">
                <Building2 size={12} /> University ID
              </label>
              <input value={universityId} onChange={e => setUniversityId(e.target.value)}
                className="input font-mono text-xs" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              <p className="text-xs text-gray-400 mt-1">Provided by your FORSA account manager</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Security notice */}
        <div className="flex items-center gap-2 justify-center mt-5">
          <Shield size={12} className="text-white/30" />
          <p className="text-white/30 text-xs">Read-only access · Secured by FORSA OS</p>
        </div>
      </div>
    </div>
  )
}
