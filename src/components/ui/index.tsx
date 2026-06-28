import React from 'react'
import clsx from 'clsx'
import { AlertCircle, CheckCircle, X, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new_lead: 'bg-gray-100 text-gray-600',
  waiting_for_documents: 'bg-yellow-50 text-yellow-700',
  under_review: 'bg-purple-50 text-purple-700',
  approved_level1: 'bg-green-50 text-green-700',
  approved_level2: 'bg-emerald-50 text-emerald-700',
  approved_level3: 'bg-teal-50 text-teal-700',
  rejected: 'bg-red-50 text-red-600',
  on_hold: 'bg-orange-50 text-orange-600',
  contract_sent: 'bg-blue-50 text-blue-600',
  contract_signed: 'bg-indigo-50 text-indigo-700',
  active_student: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  late: 'bg-red-50 text-red-600',
  default_risk: 'bg-red-100 text-red-700',
  verified: 'bg-green-50 text-green-700',
  uploaded: 'bg-blue-50 text-blue-600',
  under_review_doc: 'bg-purple-50 text-purple-600',
  absent: 'bg-gray-100 text-gray-500',
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  new_lead: 'New Lead', waiting_for_documents: 'Docs Required',
  under_review: 'Under Review', approved_level1: 'Approved L1',
  approved_level2: 'Approved L2', approved_level3: 'Referred',
  rejected: 'Not Approved', active_student: 'Active Student',
  contract_sent: 'Contract Sent', contract_signed: 'Contract Signed',
  completed: 'Completed', paid: 'Paid', pending: 'Pending',
  late: 'Late', default_risk: 'At Risk',
  verified: 'Verified', uploaded: 'Uploaded', absent: 'Missing',
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'
  const text = label || STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return <span className={clsx('badge', color)}>{text}</span>
}

export function Card({ children, className, padding = true }: {
  children: React.ReactNode; className?: string; padding?: boolean
}) {
  return <div className={clsx('card', padding && 'p-5', className)}>{children}</div>
}

export function Alert({ type = 'info', message, onClose }: {
  type?: 'success' | 'error' | 'info' | 'warning'; message: string; onClose?: () => void
}) {
  const s = {
    success: { bg: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle },
    error: { bg: 'bg-red-50 border-red-200 text-red-800', Icon: AlertCircle },
    warning: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-800', Icon: AlertCircle },
    info: { bg: 'bg-blue-50 border-blue-200 text-blue-800', Icon: Info },
  }[type]
  return (
    <div className={clsx('flex items-start gap-3 p-4 rounded-xl border text-sm mb-4', s.bg)}>
      <s.Icon size={15} className="flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={13} /></button>}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <Loader2 size={22} className="text-navy-800 animate-spin" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: React.ElementType; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      {Icon && (
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={24} className="text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-700">Failed to load data</p>
      <p className="text-xs text-gray-400 mt-1">{message || 'Please try again.'}</p>
      {onRetry && <button onClick={onRetry} className="btn-secondary mt-4 text-xs">Try again</button>}
    </div>
  )
}

export function Table({ headers, children, loading, empty }: {
  headers: string[]; children?: React.ReactNode; loading?: boolean; empty?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>{headers.map(h => <th key={h} className="table-th first:pl-5 last:pr-5">{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {headers.map((_, j) => (
                    <td key={j} className="table-td first:pl-5 last:pr-5">
                      <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : children}
        </tbody>
      </table>
      {!loading && !children && empty && (
        <div className="text-center py-16 text-sm text-gray-400">{empty}</div>
      )}
    </div>
  )
}

export function Pagination({ page, totalPages, onPageChange, total }: {
  page: number; totalPages: number; onPageChange: (p: number) => void; total: number
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">{total.toLocaleString()} records</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg'
}) {
  if (!open) return null
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-modal w-full animate-fade-in max-h-[90vh] flex flex-col', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={15} /></button>
        </div>
        <div className="px-5 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'navy', sub }: {
  label: string; value: string | number; icon?: React.ElementType; color?: 'navy' | 'teal' | 'green' | 'red'; sub?: string
}) {
  const colors = { navy: 'bg-navy-50 text-navy-700', teal: 'bg-teal-50 text-teal-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700' }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}><Icon size={18} /></div>}
      </div>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void
}) {
  return (
    <div className="flex border-b border-gray-100 overflow-x-auto">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={clsx('px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            active === tab.id ? 'text-navy-800 border-navy-800' : 'text-gray-500 border-transparent hover:text-gray-700')}>
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full',
              active === tab.id ? 'bg-navy-100 text-navy-700' : 'bg-gray-100 text-gray-500')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
