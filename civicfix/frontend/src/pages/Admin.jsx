import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, LogOut, Loader2, Search, Save, ExternalLink, X, RotateCw, Info } from 'lucide-react'
import { api } from '../api.js'
import { useToast } from '../components/Toast.jsx'
import StatCards from '../components/StatCards.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import { Spinner, EmptyState, ErrorState } from '../components/States.jsx'
import { CATEGORIES, STATUSES, formatDate } from '../utils.js'

const KEY_NAME = 'civicfix_admin_key'

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => Boolean(sessionStorage.getItem(KEY_NAME)))
  const lock = () => {
    sessionStorage.removeItem(KEY_NAME)
    setUnlocked(false)
  }
  return unlocked ? <AdminPanel onLock={lock} /> : <AdminLogin onUnlock={() => setUnlocked(true)} />
}

function DemoBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <strong>Demo mode.</strong> Access is protected by a shared demo key, not real user accounts. Status changes are saved
        in the local database only.
      </span>
    </div>
  )
}

function AdminLogin({ onUnlock }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!key.trim()) return setError('Please enter the admin key.')
    setLoading(true)
    setError('')
    try {
      await api.verifyAdmin(key.trim())
      sessionStorage.setItem(KEY_NAME, key.trim())
      onUnlock()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <div className="card p-8">
          <div className="mb-5 inline-flex rounded-2xl bg-navy-50 p-3">
            <Lock className="h-7 w-7 text-navy-700" />
          </div>
          <h1 className="text-2xl font-extrabold">Admin (demo mode)</h1>
          <p className="mt-1 text-sm text-navy-500">
            Enter the demo admin key to manage report statuses. The key is printed in the backend terminal when the
            server starts.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-key" className="label">Admin key</label>
              <input id="admin-key" type="password" autoComplete="off" className={`input ${error ? 'input-error' : ''}`}
                value={key} onChange={(e) => setKey(e.target.value)} placeholder="Enter key" />
              {error && <p className="field-error">{error}</p>}
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Unlock admin
            </button>
          </form>
        </div>
        <div className="mt-4"><DemoBanner /></div>
      </div>
    </div>
  )
}

function AdminPanel({ onLock }) {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ q: '', category: '', status: '' })
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(() => {
    setError('')
    return Promise.all([api.stats(), api.listReports({ ...filters, sort: 'updated' })])
      .then(([s, r]) => {
        setStats(s)
        setReports(r.reports)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const onSaved = (updated) => {
    toast(`${updated.tracking_id} updated to "${updated.status}".`)
    load()
  }
  const onAuthError = () => {
    toast('Admin key is no longer valid. Please unlock again.', 'error')
    onLock()
  }

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-2 text-3xl font-extrabold">Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLoading(true); load() }} className="btn-secondary"><RotateCw className="h-4 w-4" /> Refresh</button>
          <button onClick={onLock} className="btn-secondary"><LogOut className="h-4 w-4" /> Lock</button>
        </div>
      </div>
      <DemoBanner />

      {stats && <div className="mt-6"><StatCards stats={stats} /></div>}

      <div className="card mt-6 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input className="input pl-10" placeholder="Search title, location or tracking ID" value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} aria-label="Search" />
        </div>
        <select className="input md:w-48" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input md:w-44" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <Spinner label="Loading reports…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : reports.length === 0 ? (
          <EmptyState title="No reports match" message="Change the search or filters." />
        ) : (
          <div className="card overflow-hidden">
            {/* Table on larger screens */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-navy-100 bg-navy-50/60 text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tracking ID</th>
                  <th className="px-4 py-3 font-semibold">Issue</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Reported</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-50/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-navy-500">{r.tracking_id}</td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-semibold text-navy-900">{r.title}</p>
                      <p className="truncate text-xs text-navy-400">{r.location}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-600">{r.category}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-600">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedId(r.tracking_id)} className="btn-secondary py-1.5 text-xs">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Cards on mobile */}
            <ul className="divide-y divide-navy-100 md:hidden">
              {reports.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-navy-400">{r.tracking_id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 font-semibold">{r.title}</p>
                  <p className="text-xs text-navy-400">{r.category} · {formatDate(r.created_at)}</p>
                  <button onClick={() => setSelectedId(r.tracking_id)} className="btn-secondary mt-3 w-full py-2 text-xs">Manage</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selectedId && (
        <ManageDrawer trackingId={selectedId} onClose={() => setSelectedId(null)} onSaved={onSaved} onAuthError={onAuthError} />
      )}
    </div>
  )
}

function ManageDrawer({ trackingId, onClose, onSaved, onAuthError }) {
  const toast = useToast()
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [updatedBy, setUpdatedBy] = useState('Ward Office (demo)')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getReport(trackingId)
      .then((r) => {
        setReport(r)
        setStatus(r.status)
      })
      .catch((e) => setError(e.message))
  }, [trackingId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (status === report.status && !note.trim()) {
      setError('Choose a new status or add a progress note.')
      return
    }
    setSaving(true)
    try {
      const updated = await api.updateStatus(trackingId, { status, note: note.trim(), updated_by: updatedBy.trim() })
      setReport(updated)
      setNote('')
      onSaved(updated)
    } catch (err) {
      if (err.status === 401) return onAuthError()
      setError(err.message)
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy-900/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-lift" role="dialog" aria-modal="true" aria-label="Manage report">
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <div>
            <p className="font-mono text-xs font-bold text-teal-700">{trackingId}</p>
            <h2 className="font-bold">Manage report</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-navy-50" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!report && !error && <Spinner />}
          {!report && error && <p className="text-sm text-red-600">{error}</p>}
          {report && (
            <>
              <h3 className="text-lg font-bold leading-snug">{report.title}</h3>
              <p className="mt-1 text-sm text-navy-500">{report.location}</p>
              <p className="mt-3 text-sm text-navy-600">{report.description}</p>
              {report.image_url && <img src={report.image_url} alt="" className="mt-4 max-h-48 w-full rounded-xl object-cover" />}
              <Link to={`/reports/${report.tracking_id}`} target="_blank" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
                Open public page <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-navy-100 bg-navy-50/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Current status</span>
                  <StatusBadge status={report.status} />
                </div>
                <div>
                  <label htmlFor="new-status" className="label">New status</label>
                  <select id="new-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="note" className="label">Update note</label>
                  <textarea id="note" rows={3} maxLength={500} className="input" value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Crew assigned, work scheduled for Friday" />
                </div>
                <div>
                  <label htmlFor="updated-by" className="label">Updated by</label>
                  <input id="updated-by" className="input" maxLength={60} value={updatedBy} onChange={(e) => setUpdatedBy(e.target.value)} />
                </div>
                {error && <p className="field-error">{error}</p>}
                <button className="btn-primary w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save update
                </button>
              </form>

              <h4 className="mb-4 mt-8 font-bold">History</h4>
              <StatusTimeline history={report.history} />
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
