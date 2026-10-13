import { Construction, Trash2, Droplets, Lightbulb, Waves, CircleHelp } from 'lucide-react'

export const CATEGORIES = ['Roads & Potholes', 'Garbage', 'Water Leakage', 'Streetlights', 'Drainage', 'Other']
export const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved']

// Visual style for each category (used for icons and photo placeholders).
export const CATEGORY_STYLE = {
  'Roads & Potholes': { icon: Construction, bg: 'from-amber-100 to-orange-50', fg: 'text-amber-700', chip: 'bg-amber-50 text-amber-800' },
  Garbage: { icon: Trash2, bg: 'from-lime-100 to-emerald-50', fg: 'text-lime-700', chip: 'bg-lime-50 text-lime-800' },
  'Water Leakage': { icon: Droplets, bg: 'from-sky-100 to-cyan-50', fg: 'text-sky-700', chip: 'bg-sky-50 text-sky-800' },
  Streetlights: { icon: Lightbulb, bg: 'from-yellow-100 to-amber-50', fg: 'text-yellow-700', chip: 'bg-yellow-50 text-yellow-800' },
  Drainage: { icon: Waves, bg: 'from-indigo-100 to-blue-50', fg: 'text-indigo-700', chip: 'bg-indigo-50 text-indigo-800' },
  Other: { icon: CircleHelp, bg: 'from-slate-100 to-gray-50', fg: 'text-slate-600', chip: 'bg-slate-100 text-slate-700' },
}

export const STATUS_STYLE = {
  Submitted: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  Acknowledged: { badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  'In Progress': { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  Resolved: { badge: 'bg-teal-50 text-teal-800 ring-teal-200', dot: 'bg-teal-500' },
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function timeAgo(iso) {
  if (!iso) return ''
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [name, secs] of units) {
    const n = Math.floor(seconds / secs)
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
