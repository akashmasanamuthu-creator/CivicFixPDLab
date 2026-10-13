import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Camera, ClipboardCheck, Hammer, CheckCircle2, ArrowRight, MapPin } from 'lucide-react'
import { api } from '../api.js'
import ReportCard from '../components/ReportCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { StatusStepper } from '../components/StatusTimeline.jsx'
import { CardSkeleton, EmptyState, ErrorState } from '../components/States.jsx'
import { CATEGORIES, CATEGORY_STYLE, timeAgo } from '../utils.js'

const steps = [
  { icon: Camera, title: 'Report', text: 'Describe the problem, pick a category, add the location and an optional photo.' },
  { icon: ClipboardCheck, title: 'Get a tracking ID', text: 'Every report gets a unique ID like CF-2026-0012 so you can follow it later.' },
  { icon: Hammer, title: 'Follow progress', text: 'Status moves from Submitted to Acknowledged and In Progress, with notes at each step.' },
  { icon: CheckCircle2, title: 'See it resolved', text: 'Once fixed, the report is marked Resolved and stays visible to the community.' },
]

export default function Home() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([api.listReports({ limit: 6 }), api.stats()])
      .then(([r, s]) => {
        setReports(r.reports)
        setStats(s)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const featured = reports.find((r) => r.status !== 'Submitted') || reports[0]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-navy-100">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-navy-100/60 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Community problem reporting</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              Report Local Problems.
              <br />
              <span className="text-teal-600">Track Real Progress.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-navy-500">
              Potholes, overflowing garbage, leaking pipes, dark streets, blocked drains — log them in under a minute
              and follow every update until the problem is fixed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/report" className="btn-primary px-6 py-3 text-base">
                <Plus className="h-5 w-5" /> Report an Issue
              </Link>
              <Link to="/track" className="btn-secondary px-6 py-3 text-base">
                <Search className="h-5 w-5" /> Track a Report
              </Link>
            </div>
            {stats && (
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                <div>
                  <dt className="text-sm text-navy-500">Reports logged</dt>
                  <dd className="text-2xl font-extrabold text-navy-900">{stats.total}</dd>
                </div>
                <div>
                  <dt className="text-sm text-navy-500">Resolved</dt>
                  <dd className="text-2xl font-extrabold text-teal-600">{stats.resolved}</dd>
                </div>
                <div>
                  <dt className="text-sm text-navy-500">Resolution rate</dt>
                  <dd className="text-2xl font-extrabold text-navy-900">{stats.resolution_rate}%</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Live preview of a real report from the database */}
          <div className="relative">
            {featured ? (
              <Link to={`/reports/${featured.tracking_id}`} className="card block p-6 shadow-lift transition hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-navy-400">{featured.tracking_id}</span>
                  <StatusBadge status={featured.status} />
                </div>
                <h3 className="mt-3 text-lg font-bold leading-snug">{featured.title}</h3>
                <p className="mt-2 flex items-start gap-1.5 text-sm text-navy-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> {featured.location}
                </p>
                <div className="mt-6">
                  <StatusStepper status={featured.status} />
                </div>
                <p className="mt-5 text-xs text-navy-400">Last updated {timeAgo(featured.updated_at)}</p>
              </Link>
            ) : (
              !loading && <div className="card p-8 text-center text-sm text-navy-500">Reports will appear here.</div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl font-extrabold">From complaint to closure in four steps</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-navy-200">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-navy-500">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const { icon: Icon, chip } = CATEGORY_STYLE[c]
            return (
              <Link
                key={c}
                to={`/reports?category=${encodeURIComponent(c)}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-80 ${chip}`}
              >
                <Icon className="h-4 w-4" /> {c}
                {stats && <span className="opacity-60">{stats.by_category[c]}</span>}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Recent reports */}
      <section className="bg-navy-50/50 py-16">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Community feed</p>
              <h2 className="mt-2 text-3xl font-extrabold">Recent reports</h2>
            </div>
            <Link to="/reports" className="btn-secondary">
              View all reports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <CardSkeleton count={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : reports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              message="Be the first to report a problem in your area."
              action={<Link to="/report" className="btn-primary">Report an Issue</Link>}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
