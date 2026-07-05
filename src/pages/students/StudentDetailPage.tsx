import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, studentsApi, documentsApi, paymentsApi } from '../../lib/api'
import { Card, Badge, StatCard, Tabs, Spinner, ErrorState, EmptyState, Modal, Alert } from '../../components/ui'
import {
  ArrowLeft, FileText, CreditCard, CheckCircle, Clock, XCircle,
  Download, Loader2, StickyNote, Plus, Lock, Shield, BadgeCheck
} from 'lucide-react'
import { format } from 'date-fns'
import api from '../../lib/api'

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState('overview')
  const [noteModal, setNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteError, setNoteError] = useState('')
  const qc = useQueryClient()

  const { data: app, isLoading, isError, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: score } = useQuery({
    queryKey: ['score', app?.student_id],
    queryFn: () => studentsApi.getScore(app!.student_id).then(r => r.data),
    enabled: !!app?.student_id,
  })

  const { data: checklist } = useQuery({
    queryKey: ['doc-checklist', id],
    queryFn: () => documentsApi.getChecklist(id!).then(r => r.data),
    enabled: tab === 'documents' && !!id,
  })

  const { data: schedule } = useQuery({
    queryKey: ['schedule', id],
    queryFn: () => paymentsApi.getSchedule(id!).then(r => r.data),
    enabled: tab === 'payments' && !!id,
  })

  const { data: history } = useQuery({
    queryKey: ['app-history', id],
    queryFn: () => applicationsApi.getStatusHistory(id!).then(r => r.data),
    enabled: tab === 'timeline' && !!id,
  })

  // Notes stored locally per application (university-side notes)
  const notesKey = `uni_notes_${id}`
  const savedNotes = JSON.parse(localStorage.getItem(notesKey) || '[]')
  const [notes, setNotes] = useState<Array<{ text: string; createdAt: string }>>(savedNotes)

  const addNote = () => {
    if (!noteText.trim()) { setNoteError('Note cannot be empty'); return }
    const newNote = { text: noteText.trim(), createdAt: new Date().toISOString() }
    const updated = [newNote, ...notes]
    setNotes(updated)
    localStorage.setItem(notesKey, JSON.stringify(updated))
    setNoteText(''); setNoteModal(false); setNoteError('')
  }

  const getDocUrl = async (docId: string) => {
    try {
      const res = await documentsApi.getDownloadUrl(docId)
      window.open(res.data.url, '_blank')
    } catch { alert('Could not retrieve download URL') }
  }

  // T-223 — the portal's one write capability: confirming enrollment/
  // tuition before the payment plan activates (contract_signed ->
  // university_confirmed -> university_paid).
  const [confirmError, setConfirmError] = useState('')
  const confirmMutation = useMutation({
    mutationFn: () => applicationsApi.confirmEnrollment(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', id] }),
    onError: (err: any) => setConfirmError(err?.response?.data?.message || 'Could not confirm enrollment'),
  })

  if (isLoading) return <Spinner className="h-64" />
  if (isError) return (
    <div className="space-y-4">
      <Link to="/students" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Back to Students
      </Link>
      <ErrorState onRetry={refetch} />
    </div>
  )
  if (!app) return null

  const aggregateScore = score?.aggregate_score || app.aggregate_score || 500
  const isApproved = ['approved_level1', 'approved_level2', 'approved_level3', 'active_student', 'completed'].includes(app.current_status)

  const installments = schedule?.installments || []
  const paidCount = installments.filter((i: any) => i.status === 'paid').length
  const lateCount = installments.filter((i: any) => i.status === 'late' || i.status === 'default_risk').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/students" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5 flex-shrink-0">
          <ArrowLeft size={15} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 bg-navy-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-semibold">{app.first_name?.[0]}{app.last_name?.[0]}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{app.first_name} {app.last_name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge status={app.current_status} />
                <span className="text-xs text-gray-400">{app.email}</span>
              </div>
            </div>
          </div>
        </div>
        {app.current_status === 'contract_signed' ? (
          <button
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
            className="btn-primary text-sm"
          >
            {confirmMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
            Confirm Enrollment
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <Lock size={11} />
            Read-only
          </div>
        )}
      </div>

      {confirmError && <Alert type="error" message={confirmError} onClose={() => setConfirmError('')} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">FORSA Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{aggregateScore}</p>
          <Badge status={score?.score_band || 'medium_trust'} />
        </div>
        <StatCard label="Program" value={app.program_name || '—'} color="navy" />
        <StatCard label="Tuition" value={`${parseFloat(app.tuition_amount || '0').toLocaleString()} TND`} color="teal" />
        <StatCard
          label="Payments"
          value={schedule ? `${paidCount}/${schedule.installment_count}` : '—'}
          color={lateCount > 0 ? 'red' : 'green'}
          sub={lateCount > 0 ? `${lateCount} late` : 'On track'}
        />
      </div>

      {/* Decision banner */}
      {isApproved && app.approved_amount && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">FORSA has approved this student</p>
            <p className="text-xs text-green-700 mt-0.5">
              Approved amount: <strong>{parseFloat(app.approved_amount).toLocaleString()} TND</strong> ·
              Level: <strong>{app.current_financing_level?.toUpperCase()}</strong> ·
              {app.academic_year}
            </p>
          </div>
        </div>
      )}

      {lateCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle size={18} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">{lateCount} late payment{lateCount > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-600 mt-0.5">FORSA collections team has been notified.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Card padding={false}>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'documents', label: 'Documents', count: checklist?.filter((d: any) => d.status !== 'absent').length },
            { id: 'payments', label: 'Payments', count: schedule?.installment_count },
            { id: 'timeline', label: 'Timeline' },
            { id: 'notes', label: 'Notes', count: notes.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="p-5">
          {/* Overview */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="section-title mb-3">Application Details</p>
                <dl className="space-y-3">
                  {[
                    { label: 'Student Name', value: `${app.first_name} ${app.last_name}` },
                    { label: 'Email', value: app.email || '—' },
                    { label: 'Program', value: app.program_name || '—' },
                    { label: 'Academic Year', value: app.academic_year },
                    { label: 'Application Date', value: app.lead_date ? format(new Date(app.lead_date), 'dd MMM yyyy') : '—' },
                    { label: 'Is Renewal', value: app.is_renewal ? 'Yes' : 'No' },
                  ].map(item => (
                    <div key={item.label} className="flex gap-3">
                      <dt className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{item.label}</dt>
                      <dd className="text-sm text-gray-700">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="section-title mb-3">FORSA Decision</p>
                {app.decision_result ? (
                  <dl className="space-y-3">
                    {[
                      { label: 'Result', value: <Badge status={app.decision_result} /> },
                      { label: 'Level', value: app.approved_level?.toUpperCase() || '—' },
                      { label: 'Amount', value: app.approved_amount ? `${parseFloat(app.approved_amount).toLocaleString()} TND` : '—' },
                    ].map(item => (
                      <div key={item.label} className="flex gap-3">
                        <dt className="text-xs text-gray-400 w-32 flex-shrink-0 pt-0.5">{item.label}</dt>
                        <dd className="text-sm text-gray-700">{item.value as any}</dd>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                      <Shield size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        FORSA decisions are final and cannot be modified by universities.
                        Contact your FORSA account manager for queries.
                      </p>
                    </div>
                  </dl>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Clock size={20} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Decision pending</p>
                    <p className="text-xs text-gray-400 mt-1">FORSA is reviewing this application</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {tab === 'documents' && (
            <div className="space-y-3">
              {!checklist ? <Spinner className="h-32" />
                : checklist.length === 0
                ? <EmptyState icon={FileText} title="No documents yet" description="Documents will appear once the student uploads them." />
                : checklist.map((doc: any) => (
                  <div key={doc.documentTypeCode} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      {doc.status === 'verified' ? <CheckCircle size={15} className="text-green-500" />
                        : doc.status === 'absent' ? <XCircle size={15} className="text-gray-300" />
                        : <Clock size={15} className="text-amber-500" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {doc.documentTypeCode.replace(/_/g, ' ')}
                        </p>
                        {doc.fileName && <p className="text-xs text-gray-400">{doc.fileName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={doc.status === 'under_review' ? 'under_review_doc' : doc.status} />
                      {doc.documentId && doc.status !== 'absent' && (
                        <button onClick={() => getDocUrl(doc.documentId)}
                          className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                          title="Download">
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              }
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Shield size={11} /> Universities can view documents but cannot upload or modify them.
                </p>
              </div>
            </div>
          )}

          {/* Payments */}
          {tab === 'payments' && (
            <div>
              {!schedule ? (
                <EmptyState icon={CreditCard} title="No payment schedule yet"
                  description="The payment schedule will appear after the student's application is approved." />
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Payment Schedule</p>
                      <p className="text-xs text-gray-400">
                        {schedule.installment_count} installments · {parseFloat(schedule.total_amount).toLocaleString()} {schedule.currency} ·
                        {paidCount} paid · {lateCount > 0 ? <span className="text-red-500">{lateCount} late</span> : 'on track'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {installments.map((inst: any) => (
                      <div key={inst.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            inst.status === 'paid' ? 'bg-green-100 text-green-700' :
                            inst.status === 'late' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {inst.status === 'paid' ? '✓' : inst.sequence_number || inst.sequence}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {parseFloat(inst.amount).toLocaleString()} {schedule.currency}
                            </p>
                            <p className="text-xs text-gray-400">
                              Due: {inst.due_date ? format(new Date(inst.due_date), 'dd MMM yyyy') : '—'}
                              {inst.paid_at ? ` · Paid: ${format(new Date(inst.paid_at), 'dd MMM yyyy')}` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge status={inst.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {tab === 'timeline' && (
            <div className="space-y-4">
              {!history ? <Spinner className="h-32" />
                : history.length === 0 ? <EmptyState icon={Clock} title="No timeline yet" />
                : history.map((h: any, i: number) => (
                  <div key={h.id || i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-navy-800 rounded-full mt-1.5" />
                      {i < history.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-4">
                      {h.to_status && <Badge status={h.to_status} />}
                      {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {h.changed_at ? format(new Date(h.changed_at), 'dd MMM yyyy · HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Internal notes</p>
                  <p className="text-xs text-gray-400 mt-0.5">Visible only to your university — not shared with FORSA or student</p>
                </div>
                <button onClick={() => setNoteModal(true)} className="btn-primary text-xs">
                  <Plus size={13} /> Add note
                </button>
              </div>

              {notes.length === 0 ? (
                <EmptyState icon={StickyNote} title="No notes yet"
                  description="Add internal notes about this student that are only visible to your team." />
              ) : (
                <div className="space-y-3">
                  {notes.map((note, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-sm text-gray-800">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(note.createdAt), 'dd MMM yyyy · HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Note Modal */}
      <Modal open={noteModal} onClose={() => { setNoteModal(false); setNoteError('') }} title="Add Internal Note">
        {noteError && <Alert type="error" message={noteError} />}
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            🔒 Notes are stored locally on your browser and are not shared with FORSA or the student.
          </div>
          <div>
            <label className="label">Note</label>
            <textarea
              className="input h-28 resize-none"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add your internal note here..."
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setNoteModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={addNote} className="btn-primary">Save Note</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
