import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { universityApi } from '../lib/api'
import { Card, Badge, Spinner } from '../components/ui'
import { Building2, Shield, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { user, universityId, logout } = useAuth()

  const { data: uni, isLoading } = useQuery({
    queryKey: ['university', universityId],
    queryFn: () => universityApi.get().then(r => r.data),
    enabled: !!universityId,
  })

  if (isLoading) return <Spinner className="h-48" />

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-navy-700" /> University Profile
        </h3>
        <dl className="space-y-3">
          {[
            { label: 'Name', value: uni?.name || '—' },
            { label: 'Short Name', value: uni?.short_name || '—' },
            { label: 'City', value: uni?.city || '—' },
            { label: 'Country', value: uni?.country_code || '—' },
            { label: 'Status', value: <Badge status={uni?.status || 'active'} /> },
            { label: 'Risk Level', value: <span className="capitalize text-sm text-gray-700">{uni?.risk_level || '—'}</span> },
            { label: 'University ID', value: <span className="font-mono text-xs text-gray-500">{universityId}</span> },
          ].map(item => (
            <div key={item.label} className="flex gap-3">
              <dt className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{item.label}</dt>
              <dd>{typeof item.value === 'string' ? <span className="text-sm text-gray-700">{item.value}</span> : item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-navy-700" /> Account
        </h3>
        <dl className="space-y-3">
          {[
            { label: 'Email', value: user?.email || '—' },
            { label: 'Role', value: 'University Admin' },
            { label: 'Access Level', value: 'Read-only (view students, documents, payments)' },
          ].map(item => (
            <div key={item.label} className="flex gap-3">
              <dt className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{item.label}</dt>
              <dd className="text-sm text-gray-700">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="bg-navy-50 border-navy-100">
        <p className="text-sm font-medium text-navy-800 mb-1">Need to update your information?</p>
        <p className="text-sm text-navy-600">Contact your FORSA account manager to update university details, add programs, or modify agreements.</p>
        <a href="mailto:partners@forsa.tn" className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium mt-3">
          partners@forsa.tn <ExternalLink size={12} />
        </a>
      </Card>

      <button onClick={logout}
        className="w-full p-4 text-red-600 text-sm font-medium text-center border border-red-100 rounded-xl hover:bg-red-50 transition-colors">
        Sign out
      </button>
    </div>
  )
}
