import { Check, Circle } from 'lucide-react'
import { STATUSES, formatDateTime } from '../utils.js'

// Progress stepper (Submitted -> Acknowledged -> In Progress -> Resolved)
export function StatusStepper({ status }) {
  const current = STATUSES.indexOf(status)
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STATUSES.map((s, i) => {
        const done = i <= current
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-1 flex-1 rounded ${i === 0 ? 'invisible' : done ? 'bg-teal-500' : 'bg-navy-100'}`} />
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  done ? 'border-teal-500 bg-teal-500 text-white' : 'border-navy-200 bg-white text-navy-300'
                } ${i === current ? 'ring-4 ring-teal-100' : ''}`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Circle className="h-2.5 w-2.5" />}
              </div>
              <div
                className={`h-1 flex-1 rounded ${i === STATUSES.length - 1 ? 'invisible' : i < current ? 'bg-teal-500' : 'bg-navy-100'}`}
              />
            </div>
            <span className={`mt-2 text-[11px] font-semibold sm:text-xs ${done ? 'text-navy-800' : 'text-navy-400'}`}>{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

// Vertical history list of every status update, newest at the bottom.
export default function StatusTimeline({ history = [] }) {
  if (!history.length) return <p className="text-sm text-navy-500">No updates yet.</p>
  return (
    <ol className="relative space-y-6 border-l-2 border-navy-100 pl-6">
      {history.map((h, i) => {
        const latest = i === history.length - 1
        return (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[33px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                latest ? 'border-teal-500 bg-teal-500' : 'border-navy-300 bg-white'
              }`}
            />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-bold text-navy-900">{h.status}</span>
              <span className="text-xs text-navy-400">{formatDateTime(h.created_at)}</span>
            </div>
            {h.note && <p className="mt-1 text-sm text-navy-600">{h.note}</p>}
            <p className="mt-0.5 text-xs text-navy-400">by {h.updated_by}</p>
          </li>
        )
      })}
    </ol>
  )
}
