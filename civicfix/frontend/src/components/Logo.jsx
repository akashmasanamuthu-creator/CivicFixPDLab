// CivicFix logo: a map pin with a checkmark inside.
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M24 3C15.2 3 8 10 8 18.8 8 30.6 24 45 24 45s16-14.4 16-26.2C40 10 32.8 3 24 3z" fill="#0d9488" />
      <circle cx="24" cy="19" r="10" fill="#fff" />
      <path d="M19.2 19.3l3.3 3.3 6.4-6.6" fill="none" stroke="#172745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        Civic<span className="text-teal-600">Fix</span>
      </span>
    </span>
  )
}
