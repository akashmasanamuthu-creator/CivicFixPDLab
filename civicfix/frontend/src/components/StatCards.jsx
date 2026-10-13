import { FileText, Send, BadgeCheck, Hammer, CheckCircle2 } from 'lucide-react'

export default function StatCards({ stats }) {
  const items = [
    { label: 'Total Reports', value: stats.total, icon: FileText, tone: 'bg-navy-50 text-navy-700' },
    { label: 'Submitted', value: stats.submitted, icon: Send, tone: 'bg-slate-100 text-slate-700' },
    { label: 'Acknowledged', value: stats.acknowledged, icon: BadgeCheck, tone: 'bg-sky-50 text-sky-700' },
    { label: 'In Progress', value: stats.in_progress, icon: Hammer, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'bg-teal-50 text-teal-700' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, value, icon: Icon, tone }, i) => (
        <div key={label} className={`card p-5 ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}>
          <div className={`mb-3 inline-flex rounded-xl p-2.5 ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-3xl font-extrabold text-navy-900">{value}</p>
          <p className="mt-0.5 text-sm font-medium text-navy-500">{label}</p>
        </div>
      ))}
    </div>
  )
}
