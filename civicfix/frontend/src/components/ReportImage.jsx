import { useState } from 'react'
import { CATEGORY_STYLE } from '../utils.js'

// Shows the uploaded photo, or a category illustration when there is no photo.
export default function ReportImage({ report, className = 'h-44' }) {
  const [failed, setFailed] = useState(false)
  const style = CATEGORY_STYLE[report.category] || CATEGORY_STYLE.Other
  const Icon = style.icon

  if (report.image_url && !failed) {
    return (
      <img
        src={report.image_url}
        alt={report.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full object-cover ${className}`}
      />
    )
  }
  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br ${style.bg} ${className}`}>
      <Icon className={`h-14 w-14 ${style.fg} opacity-80`} strokeWidth={1.5} />
      <span className="absolute bottom-2 right-3 text-[11px] font-medium text-navy-400">No photo provided</span>
    </div>
  )
}
