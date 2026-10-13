import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { api } from '../api.js'
import ReportCard from '../components/ReportCard.jsx'
import { CardSkeleton, EmptyState, ErrorState } from '../components/States.jsx'
import { CATEGORIES, STATUSES } from '../utils.js'

export default function BrowseReports() {
  // Filters live in the URL (?q=&category=&status=&sort=) so they can be shared/bookmarked.
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const status = params.get('status') || ''
  const sort = params.get('sort') || 'newest'

  const [searchText, setSearchText] = useState(q)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  // Debounce the search box -> URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchText.trim() !== q) setParam('q', searchText.trim())
    }, 350)
    return () => clearTimeout(t)
  }, [searchText]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api
      .listReports({ q, category, status, sort }, controller.signal)
      .then((d) => setReports(d.reports))
      .catch((e) => e.name !== 'AbortError' && setError(e.message))
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [q, category, status, sort, reloadKey])

  const hasFilters = q || category || status
  const clearAll = () => {
    setSearchText('')
    setParams({}, { replace: true })
  }

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Community reports</p>
      <h1 className="mt-2 text-3xl font-extrabold">Browse Reports</h1>
      <p className="mt-1 text-navy-500">Search by title, description, location or tracking ID.</p>

      <div className="card mt-8 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            className="input pl-10"
            placeholder="Search reports, e.g. 'pothole' or 'Anna Nagar'"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search reports"
          />
        </div>
        <select className="input md:w-48" value={category} onChange={(e) => setParam('category', e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input md:w-44" value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input md:w-40" value={sort} onChange={(e) => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>

      <div className="mb-5 mt-5 flex min-h-[2rem] flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-navy-500">
          <SlidersHorizontal className="h-4 w-4" />
          {loading ? 'Searching…' : `${reports.length} report${reports.length === 1 ? '' : 's'} found`}
        </p>
        {hasFilters && (
          <button onClick={clearAll} className="btn-ghost py-1.5 text-xs">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : reports.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching reports' : 'No reports yet'}
          message={hasFilters ? 'Try a different search term or clear the filters.' : 'Reports submitted by the community will show up here.'}
          action={
            hasFilters ? (
              <button onClick={clearAll} className="btn-secondary">Clear filters</button>
            ) : (
              <Link to="/report" className="btn-primary">Report an Issue</Link>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  )
}
