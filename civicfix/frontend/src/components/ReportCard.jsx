import { Link } from 'react-router-dom'
import { MapPin, CalendarDays } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import ReportImage from './ReportImage.jsx'
import { CATEGORY_STYLE, formatDate } from '../utils.js'

export default function ReportCard({ report }) {
  const cat = CATEGORY_STYLE[report.category] || CATEGORY_STYLE.Other
  return (
    <Link
      to={`/reports/${report.tracking_id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative">
        <ReportImage report={report} />
        <div className="absolute left-3 top-3">
          <StatusBadge status={report.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cat.chip}`}>{report.category}</span>
          <span className="font-mono text-xs font-semibold text-navy-400">{report.tracking_id}</span>
        </div>
        <h3 className="line-clamp-2 font-bold leading-snug group-hover:text-teal-700">{report.title}</h3>
        <div className="mt-auto space-y-1.5 pt-3 text-xs text-navy-500">
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-px h-3.5 w-3.5 shrink-0 text-teal-600" />
            <span className="line-clamp-1">{report.location}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            {formatDate(report.created_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}
