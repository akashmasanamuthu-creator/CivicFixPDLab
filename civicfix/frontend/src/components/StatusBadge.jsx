import { STATUS_STYLE } from '../utils.js'

export default function StatusBadge({ status, size = 'sm' }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.Submitted
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${style.badge} ${pad}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
