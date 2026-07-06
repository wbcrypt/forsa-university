import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { applicationsApi } from '../../lib/api'
import { Card, Badge, Table, Pagination, EmptyState, ErrorState, Spinner } from '../../components/ui'
import { Users, Search, X, Download, FileText } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new_lead', label: 'New Lead' },
  { value: 'waiting_for_documents', label: 'Docs Required' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved_level1', label: 'Approved L1' },
  { value: 'approved_level2', label: 'Approved L2' },
  { value: 'active_student', label: 'Active Student' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
]

export default function StudentsPage() {
  const { universityId } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications-uni', universityId, page, search, status],
    queryFn: () => applicationsApi.list({
      universityId,
      page, limit: 20,
      search: search || undefined,
      status: status || undefined,
    }).then(r => r.data),
    enabled: !!universityId,
  })

  const apps = data?.data || []
  const meta = data?.meta || {}

  const exportCSV = () => {
    if (!apps.length) return
    const headers = ['Name', 'Email', 'Program', 'Tuition (TND)', 'Approved Amount', 'Status', 'Application Date']
    const rows = apps.map((a: any) => [
      `${a.first_name} ${a.last_name}`,
      a.email || '',
      a.program_name || '',
      parseFloat(a.tuition_amount || '0').toFixed(2),
      parseFloat(a.approved_amount || '0').toFixed(2),
      a.current_status,
      a.lead_date ? format(new Date(a.lead_date), 'yyyy-MM-dd') : '',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map((v: string) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forsa-students-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const exportPDF = () => {
    // Build a simple printable HTML page
    const html = `<!DOCTYPE html>
<html>
<head>
<title>FORSA Student List — ${format(new Date(), 'dd MMM yyyy')}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
  h1 { color: #1B2A5E; font-size: 18px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1B2A5E; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .badge { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; background: #e0f7f4; color: #0d9488; }
  .footer { margin-top: 20px; color: #999; font-size: 10px; text-align: center; }
</style>
</head>
<body>
<h1>FORSA — Student Financing List</h1>
<p class="meta">Generated: ${format(new Date(), 'dd MMMM yyyy · HH:mm')} | ${apps.length} students</p>
<table>
<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Program</th><th>Tuition</th><th>Approved</th><th>Status</th><th>Date</th></tr></thead>
<tbody>
${apps.map((a: any, i: number) => `
<tr>
  <td>${i + 1}</td>
  <td><strong>${a.first_name} ${a.last_name}</strong></td>
  <td>${a.email || '—'}</td>
  <td>${a.program_name || '—'}</td>
  <td>${parseFloat(a.tuition_amount || '0').toLocaleString()} TND</td>
  <td>${a.approved_amount ? parseFloat(a.approved_amount).toLocaleString() + ' TND' : '—'}</td>
  <td><span class="badge">${a.current_status.replace(/_/g, ' ')}</span></td>
  <td>${a.lead_date ? format(new Date(a.lead_date), 'dd MMM yyyy') : '—'}</td>
</tr>`).join('')}
</tbody>
</table>
<p class="footer">Confidential — FORSA Educational Financing Platform · forsa.tn</p>
</body>
</html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total || 0} students in your university</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs">
            <Download size={13} /> CSV
          </button>
          <button onClick={exportPDF} className="btn-secondary text-xs">
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        <div className="flex items-center gap-3 p-4 border-b border-gray-50 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or email..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} className="input pl-9 text-sm" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="input text-sm w-40">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(search || status) && (
            <button onClick={() => { setSearch(''); setStatus(''); setPage(1) }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {!isError && (
          <Table headers={['Student', 'Program', 'Tuition', 'Approved', 'Score', 'Status', 'Date']} loading={isLoading}>
            {apps.map((app: any) => (
              <tr key={app.id} className="table-row">
                <td className="table-td pl-5">
                  <Link to={`/students/${app.id}`} className="hover:opacity-75 block">
                    <p className="text-sm font-medium text-gray-900">{app.first_name} {app.last_name}</p>
                    <p className="text-xs text-gray-400">{app.email}</p>
                  </Link>
                </td>
                <td className="table-td text-xs text-gray-500">{app.program_name || '—'}</td>
                <td className="table-td text-sm font-medium text-gray-900">
                  {parseFloat(app.tuition_amount || '0').toLocaleString()} <span className="text-gray-400 font-normal text-xs">TND</span>
                </td>
                <td className="table-td">
                  {app.approved_amount
                    ? <span className="text-sm font-medium text-teal-700">{parseFloat(app.approved_amount).toLocaleString()} <span className="text-xs text-teal-500">TND</span></span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                <td className="table-td">
                  {app.aggregate_score
                    ? <span className="text-sm font-medium text-gray-700">{app.aggregate_score}</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                <td className="table-td"><Badge status={app.current_status} /></td>
                <td className="table-td pr-5 text-xs text-gray-400">
                  {app.lead_date ? format(new Date(app.lead_date), 'dd MMM yy') : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}

        {!isLoading && !isError && apps.length === 0 && (
          <EmptyState icon={Users} title="No students found"
            description={search || status ? 'Try adjusting your filters.' : 'Students will appear here when they apply for a FORSA tuition facilitation plan and select your university.'} />
        )}

        <Pagination page={page} totalPages={meta.totalPages || 1} onPageChange={setPage} total={meta.total || 0} />
      </Card>
    </div>
  )
}
