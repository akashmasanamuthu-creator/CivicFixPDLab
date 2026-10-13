import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import { api } from '../api.js'
import StatCards from '../components/StatCards.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { Spinner, ErrorState } from '../components/States.jsx'
import { CATEGORIES, CATEGORY_STYLE, STATUSES, STATUS_STYLE, timeAgo } from '../utils.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([api.stats(), api.listReports({ sort: 'updated', limit: 6 })])
      .then(([s, r]) => {
        setStats(s)
        setRecent(r.reports)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const maxCat = stats ? Math.max(1, ...Object.values(stats.by_category)) : 1

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-sm text-navy-500">All figures are calculated live from the CivicFix database.</p>
        </div>
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && !stats ? (
        <Spinner label="Loading statistics…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <StatCards stats={stats} />

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {/* Status distribution */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="font-bold">Status distribution</h2>
              <p className="text-sm text-navy-500">{stats.resolution_rate}% of all reports are resolved</p>
              <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-navy-50">
                {STATUSES.map((s) =>
                  stats.by_status[s] ? (
                    <div
                      key={s}
                      className={STATUS_STYLE[s].dot}
                      style={{ width: `${(100 * stats.by_status[s]) / stats.total}%` }}
                      title={`${s}: ${stats.by_status[s]}`}
                    />
                  ) : null,
                )}
              </div>
              <ul className="mt-5 space-y-2.5">
                {STATUSES.map((s) => (
                  <li key={s} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-navy-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLE[s].dot}`} /> {s}
                    </span>
                    <span className="font-bold text-navy-900">{stats.by_status[s]}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Category breakdown */}
            <div className="card p-6 lg:col-span-3">
              <h2 className="font-bold">Reports by category</h2>
              <p className="text-sm text-navy-500">Click a category to browse its reports</p>
              <ul className="mt-5 space-y-3.5">
                {CATEGORIES.map((c) => {
                  const { icon: Icon, fg } = CATEGORY_STYLE[c]
                  const n = stats.by_category[c]
                  return (
                    <li key={c}>
                      <Link to={`/reports?category=${encodeURIComponent(c)}`} className="group block">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium text-navy-700 group-hover:text-teal-700">
                            <Icon className={`h-4 w-4 ${fg}`} /> {c}
                          </span>
                          <span className="font-bold">{n}</span>
                        </div>
                        <div className="h-2 rounded-full bg-navy-50">
                          <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${(100 * n) / maxCat}%` }} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Recent activity */}
          <div className="card mt-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Recently updated</h2>
              <Link to="/reports" className="text-sm font-semibold text-teal-700 hover:underline">View all</Link>
            </div>
            <ul className="mt-4 divide-y divide-navy-100">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link to={`/reports/${r.tracking_id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-navy-50/50 sm:flex-nowrap">
                    <span className="font-mono text-xs font-semibold text-navy-400">{r.tracking_id}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-800">{r.title}</span>
                    <span className="text-xs text-navy-400">{timeAgo(r.updated_at)}</span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
