import { Loader2, Inbox, AlertTriangle, RotateCw } from 'lucide-react'

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-navy-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      {label}
    </div>
  )
}

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse overflow-hidden">
          <div className="h-44 bg-navy-50" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-navy-100" />
            <div className="h-4 w-4/5 rounded bg-navy-100" />
            <div className="h-3 w-2/3 rounded bg-navy-50" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-teal-50 p-4">
        <Inbox className="h-8 w-8 text-teal-600" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-navy-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center border-red-100 px-6 py-12 text-center">
      <div className="mb-4 rounded-2xl bg-red-50 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold">Something went wrong</h3>
      <p className="mt-1 max-w-md text-sm text-navy-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-5">
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  )
}
