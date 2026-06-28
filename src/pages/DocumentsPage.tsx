import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { applicationsApi, documentsApi } from '../lib/api'
import { Card, Badge, Spinner, EmptyState } from '../components/ui'
import { FileText, CheckCircle, Clock, XCircle, Download, ExternalLink } from 'lucide-react'

export default function DocumentsPage() {
  const { universityId } = useAuth()

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['applications-uni', universityId],
    queryFn: () => applicationsApi.list({ universityId, limit: 100 }).then(r => r.data),
    enabled: !!universityId,
  })

  const apps = appsData?.data || []

  const getDocUrl = async (docId: string) => {
    try {
      const res = await documentsApi.getDownloadUrl(docId)
      window.open(res.data.url, '_blank')
    } catch { alert('Could not retrieve download URL') }
  }

  if (isLoading) return <Spinner className="h-64" />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-0.5">Student documents submitted through FORSA</p>
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={FileText} title="No student documents yet"
          description="Documents will appear here once students submit their applications." />
      ) : (
        <div className="space-y-4">
          {apps.map((app: any) => (
            <StudentDocCard key={app.id} app={app} onDownload={getDocUrl} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentDocCard({ app, onDownload }: { app: any; onDownload: (id: string) => void }) {
  const { data: checklist, isLoading } = useQuery({
    queryKey: ['doc-checklist', app.id],
    queryFn: () => documentsApi.getChecklist(app.id).then(r => r.data),
  })

  const uploaded = (checklist || []).filter((d: any) => d.status !== 'absent')
  const verified = (checklist || []).filter((d: any) => d.status === 'verified')

  return (
    <Card padding={false}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
        <Link to={`/students/${app.id}`} className="flex items-center gap-3 hover:opacity-75">
          <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-navy-700">{app.first_name?.[0]}{app.last_name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{app.first_name} {app.last_name}</p>
            <p className="text-xs text-gray-400">{app.program_name || 'No program'} · {app.academic_year}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {verified.length}/{checklist?.length || 0} verified
          </span>
          <Badge status={app.current_status} />
        </div>
      </div>

      {isLoading ? (
        <div className="px-5 py-3"><Spinner className="h-8" /></div>
      ) : uploaded.length === 0 ? (
        <p className="px-5 py-3 text-sm text-gray-400">No documents uploaded yet</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {uploaded.map((doc: any) => (
            <div key={doc.documentTypeCode} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                {doc.status === 'verified' ? <CheckCircle size={14} className="text-green-500" />
                  : <Clock size={14} className="text-amber-400" />
                }
                <p className="text-xs font-medium text-gray-700 capitalize">
                  {doc.documentTypeCode.replace(/_/g, ' ')}
                </p>
                <Badge status={doc.status === 'under_review' ? 'under_review_doc' : doc.status} />
              </div>
              {doc.documentId && (
                <button onClick={() => onDownload(doc.documentId)}
                  className="flex items-center gap-1 text-xs text-navy-700 hover:text-navy-900 font-medium">
                  <Download size={12} /> View
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
