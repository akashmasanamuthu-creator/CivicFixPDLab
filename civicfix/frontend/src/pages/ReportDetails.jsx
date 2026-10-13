import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, CalendarDays, Clock, User, Tag, Copy, ImagePlus, Loader2, Search } from 'lucide-react'
import { api } from '../api.js'
import { useToast } from '../components/Toast.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ReportImage from '../components/ReportImage.jsx'
import StatusTimeline, { StatusStepper } from '../components/StatusTimeline.jsx'
import { Spinner, ErrorState } from '../components/States.jsx'
import { formatDateTime } from '../utils.js'

export default function ReportDetails() {
  const { trackingId } = useParams()
  const toast = useToast()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef(null)

  const load = () => {
    setLoading(true)
    setError('')
    api
      .getReport(trackingId)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [trackingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(report.tracking_id)
      toast('Tracking ID copied.')
    } catch {
      toast('Could not copy automatically.', 'error')
    }
  }

  const addPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast('Image is too large. Maximum size is 5 MB.', 'error')
    setUploading(true)
    try {
      const res = await api.uploadPhoto(report.tracking_id, file)
      setReport((r) => ({ ...r, image_url: res.image_url }))
      toast('Photo added to the report.')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Spinner label="Loading report…" />
  if (error)
    return (
      <div className="container-page py-10">
        <ErrorState message={error} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/reports" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back to reports</Link>
        </div>
      </div>
    )

  const meta = [
    { icon: Tag, label: 'Category', value: report.category },
    { icon: MapPin, label: 'Location', value: report.location },
    { icon: CalendarDays, label: 'Reported', value: formatDateTime(report.created_at) },
    { icon: Clock, label: 'Last updated', value: formatDateTime(report.updated_at) },
    { icon: User, label: 'Reported by', value: report.reporter_name || 'Anonymous' },
  ]

  return (
    <div className="container-page py-10">
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> All reports
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button onClick={copyId} className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-teal-700 hover:underline">
            {report.tracking_id} <Copy className="h-3.5 w-3.5" />
          </button>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{report.title}</h1>
        </div>
        <StatusBadge status={report.status} size="lg" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <ReportImage report={report} className="h-64 sm:h-80" />
            {!report.image_url && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy-100 px-4 py-3">
                <span className="text-sm text-navy-500">Have a photo of this issue?</span>
                <button onClick={() => fileInput.current?.click()} className="btn-secondary py-2 text-xs" disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploading ? 'Uploading…' : 'Add photo'}
                </button>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={addPhoto} />
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold">Description</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-navy-600">{report.description}</p>
          </div>

          <div className="card p-6">
            <h2 className="mb-6 font-bold">Progress</h2>
            <StatusStepper status={report.status} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold">Details</h2>
            <dl className="mt-4 space-y-4">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</dt>
                    <dd className="text-sm font-medium text-navy-800">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="mb-5 font-bold">Status history</h2>
            <StatusTimeline history={report.history} />
          </div>

          <Link to={`/track/${report.tracking_id}`} className="btn-secondary w-full">
            <Search className="h-4 w-4" /> Open in tracker
          </Link>
        </div>
      </div>
    </div>
  )
}
