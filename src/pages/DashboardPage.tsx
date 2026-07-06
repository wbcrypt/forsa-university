import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { universityApi, applicationsApi } from '../lib/api'
import { StatCard, Card, Badge, ErrorState, Spinner } from '../components/ui'
import { Users, CheckCircle, Clock, AlertTriangle, TrendingUp, ArrowRight, Building2 } from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { universityId } = useAuth()

  const { data: uni, isLoading: uniLoading } = useQuery({
    queryKey: ['university', universityId],
    queryFn: () => universityApi.get().then(r => r.data),
    enabled: !!universityId,
  })

  const { data: perf } = useQuery({
    queryKey: ['university-perf', universityId],
    queryFn: () => universityApi.getPerformance().then(r => r.data),
    enabled: !!universityId,
  })

  const { data: appsData, isLoading: appsLoading, isError, refetch } = useQuery({
    queryKey: ['applications-uni', universityId],
    queryFn: () => applicationsApi.list({ universityId, limit: 50 }).then(r => r.data),
    enabled: !!universityId,
  })

  if (!universityId) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Building2 size={40} className="text-gray-300 mb-4" />
      <p className="text-gray-500 font-medium">No university linked to this account</p>
      <p className="text-gray-400 text-sm mt-1">Please contact FORSA to link your university account.</p>
    </div>
  )

  if (uniLoading) return <Spinner className="h-64" />
  if (isError) return <ErrorState onRetry={refetch} />

  const apps = appsData?.data || []
  const total = apps.length
  const approved = apps.filter((a: any) => ['approved_level1', 'approved_level2', 'approved_level3', 'active_student', 'completed'].includes(a.current_status)).length
  const pending = apps.filter((a: any) => ['under_review', 'waiting_for_documents', 'new_lead', 'contacted'].includes(a.current_status)).length
  const active = apps.filter((a: any) => a.current_status === 'active_student').length
  const totalAmount = apps.filter((a: any) => a.approved_amount).reduce((s: number, a: any) => s + parseFloat(a.approved_amount || '0'), 0)

  const recent = apps.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* University header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-navy-100">
          <span className="text-navy-700 font-bold text-2xl">{(uni?.name || 'U')[0]}</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{uni?.name || 'University'}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge status={uni?.status || 'active'} />
            <span className="text-xs text-gray-400">{uni?.city} · {uni?.country_code}</span>
            {uni?.short_name && <span className="text-xs text-gray-400">{uni.short_name}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={total} icon={Users} color="navy" />
        <StatCard label="Active Students" value={active} icon={CheckCircle} color="teal" />
        <StatCard label="Pending Review" value={pending} icon={Clock} color="navy" />
        <StatCard label="Total Financed" value={`${totalAmount.toLocaleString()} TND`} icon={TrendingUp} color="green" sub="Approved applications" />
      </div>

      {/* Agreement info */}
      {uni?.agreements?.find((a: any) => a.status === 'active') && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Active FORSA Partnership Agreement</p>
            {(() => {
              const a = uni.agreements.find((a: any) => a.status === 'active')
              return (
                <p className="text-xs text-green-700 mt-0.5">
                  {a.payment_model} model · Max {parseFloat(a.max_financing_amount || 0).toLocaleString()} TND ·
                  Levels: {(a.financing_levels || []).join(', ')}
                </p>
              )
            })()}
          </div>
        </div>
      )}

      {/* Recent students */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Students</h3>
          <Link to="/students" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {appsLoading ? (
          <div className="px-5 pb-5"><Spinner className="h-20" /></div>
        ) : recent.length === 0 ? (
          <div className="px-5 pb-8 text-center text-sm text-gray-400">
            No students yet. Students will appear here once their applications are submitted through FORSA.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Student', 'Program', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="table-th first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((app: any) => (
                <tr key={app.id} className="table-row">
                  <td className="table-td pl-5">
                    <Link to={`/students/${app.id}`} className="hover:opacity-75 block">
                      <p className="font-medium text-gray-900">{app.first_name} {app.last_name}</p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </Link>
                  </td>
                  <td className="table-td text-xs text-gray-500">{app.program_name || '—'}</td>
                  <td className="table-td">
                    <span className="font-medium text-gray-900">{parseFloat(app.tuition_amount || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">{app.currency || 'TND'}</span>
                  </td>
                  <td className="table-td"><Badge status={app.current_status} /></td>
                  <td className="table-td pr-5 text-xs text-gray-400">
                    {app.lead_date ? format(new Date(app.lead_date), 'dd MMM yy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
