import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { applicationsApi, paymentsApi } from '../lib/api'
import { Card, StatCard, Badge, Spinner, EmptyState } from '../components/ui'
import { CreditCard, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default function PaymentsPage() {
  const { universityId } = useAuth()

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['applications-uni-approved', universityId],
    queryFn: () => applicationsApi.list({ universityId, limit: 100 }).then(r => r.data),
    enabled: !!universityId,
  })

  const approvedApps = (appsData?.data || []).filter((a: any) =>
    ['approved_level1', 'approved_level2', 'approved_level3', 'active_student', 'completed'].includes(a.current_status)
  )

  const totalFinanced = approvedApps.reduce((s: number, a: any) => s + parseFloat(a.approved_amount || a.tuition_amount || 0), 0)

  if (isLoading) return <Spinner className="h-64" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Payments & Tuition</h1>
        <p className="text-sm text-gray-500 mt-0.5">Payment status for FORSA-financed students</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Financed Students" value={approvedApps.length} icon={CheckCircle} color="teal" />
        <StatCard label="Total Financed" value={`${totalFinanced.toLocaleString()} TND`} icon={TrendingUp} color="green" />
        <StatCard label="Total Applications" value={appsData?.data?.length || 0} icon={CreditCard} color="navy" />
      </div>

      {approvedApps.length === 0 ? (
        <EmptyState icon={CreditCard} title="No financed students yet"
          description="Payment schedules will appear here once students are approved by FORSA." />
      ) : (
        <div className="space-y-3">
          {approvedApps.map((app: any) => (
            <PaymentRow key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentRow({ app }: { app: any }) {
  const { data: schedule } = useQuery({
    queryKey: ['schedule', app.id],
    queryFn: () => paymentsApi.getSchedule(app.id).then(r => r.data),
  })

  const installments = schedule?.installments || []
  const paidCount = installments.filter((i: any) => i.status === 'paid').length
  const lateCount = installments.filter((i: any) => i.status === 'late' || i.status === 'default_risk').length
  const total = schedule?.installment_count || 0
  const progress = total > 0 ? (paidCount / total) * 100 : 0

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <Link to={`/students/${app.id}`} className="hover:opacity-75">
          <p className="text-sm font-semibold text-gray-900">{app.first_name} {app.last_name}</p>
          <p className="text-xs text-gray-400">{app.program_name || '—'} · {app.academic_year}</p>
        </Link>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">
            {parseFloat(app.approved_amount || app.tuition_amount || '0').toLocaleString()} TND
          </p>
          <Badge status={app.current_status} />
        </div>
      </div>

      {schedule ? (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{paidCount}/{total} installments paid</span>
            {lateCount > 0 && (
              <span className="text-red-500 font-medium flex items-center gap-1">
                <AlertTriangle size={11} /> {lateCount} late
              </span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${lateCount > 0 ? 'bg-red-400' : 'bg-teal-500'}`}
              style={{ width: `${progress}%` }} />
          </div>
          {/* Next payment */}
          {(() => {
            const next = installments.find((i: any) => i.status === 'pending' || i.status === 'due_soon')
            if (!next) return null
            return (
              <p className="text-xs text-gray-400 mt-1.5">
                Next due: {next.due_date ? format(new Date(next.due_date), 'dd MMM yyyy') : '—'} ·
                {parseFloat(next.amount).toLocaleString()} TND
              </p>
            )
          })()}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No payment schedule yet</p>
      )}
    </Card>
  )
}
