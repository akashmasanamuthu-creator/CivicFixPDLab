import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Search, Loader2, MapPin, ArrowRight, SearchX } from 'lucide-react'
import { api } from '../api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline, { StatusStepper } from '../components/StatusTimeline.jsx'
import { formatDateTime, timeAgo } from '../utils.js'

const ID_PATTERN = /^CF-\d{4}-\d{4,}$/

export default function TrackReport() {
  const { trackingId } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(trackingId || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!trackingId) {
      setResult(null)
      setError('')
      return
    }
    setInput(trackingId)
    setLoading(true)
    setError('')
    setResult(null)
    api
      .track(trackingId)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [trackingId])

  const submit = (e) => {
    e.preventDefault()
    const id = input.trim().toUpperCase()
    if (!ID_PATTERN.test(id)) {
      setError('Enter a tracking ID in the format CF-2026-0001.')
      setResult(null)
      return
    }
    navigate(`/track/${id}`)
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="eyebrow">Report tracker</p>
          <h1 className="mt-2 text-3xl font-extrabold">Track Your Report</h1>
          <p className="mt-1 text-navy-500">Enter the tracking ID you received when you submitted your report.</p>
        </div>

        <form onSubmit={submit} className="card mt-8 flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              className="input pl-10 font-mono uppercase placeholder:normal-case placeholder:font-sans"
              placeholder="e.g. CF-2026-0001"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Tracking ID"
            />
          </div>
          <button className="btn-primary px-6" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Track
          </button>
        </form>

        {error && (
          <div className="card mt-6 flex flex-col items-center px-6 py-10 text-center">
            <SearchX className="h-10 w-10 text-navy-300" />
            <p className="mt-3 font-bold">Report not found</p>
            <p className="mt-1 text-sm text-navy-500">{error}</p>
          </div>
        )}

        {loading && (
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-navy-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Looking up report…
          </p>
        )}

        {result && (
          <div className="card mt-6 overflow-hidden">
            <div className="border-b border-navy-100 bg-navy-50/50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold text-teal-700">{result.tracking_id}</span>
                <StatusBadge status={result.status} size="lg" />
              </div>
              <h2 className="mt-2 text-xl font-bold">{result.title}</h2>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-navy-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> {result.location}
              </p>
              <p className="mt-1 text-xs text-navy-400">
                {result.category} · Reported {formatDateTime(result.created_at)} · Updated {timeAgo(result.updated_at)}
              </p>
            </div>
            <div className="p-6">
              <StatusStepper status={result.status} />
              <h3 className="mb-5 mt-8 font-bold">Update history</h3>
              <StatusTimeline history={result.history} />
              <Link to={`/reports/${result.tracking_id}`} className="btn-secondary mt-8 w-full">
                View full report <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {!trackingId && !error && (
          <p className="mt-6 text-center text-sm text-navy-400">
            Lost your ID? Find your report on the <Link to="/reports" className="font-semibold text-teal-700 hover:underline">Browse Reports</Link> page.
          </p>
        )}
      </div>
    </div>
  )
}
