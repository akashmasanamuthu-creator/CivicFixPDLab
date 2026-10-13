import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Plus } from 'lucide-react'
import Logo from './Logo.jsx'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Browse Reports' },
  { to: '/track', label: 'Track Report' },
  { to: '/admin', label: 'Admin' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-teal-50 text-teal-800' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" aria-label="CivicFix home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/report" className="btn-primary ml-2">
            <Plus className="h-4 w-4" /> Report an Issue
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-navy-700 hover:bg-navy-50 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-navy-100 bg-white lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/report" className="btn-primary mt-2">
              <Plus className="h-4 w-4" /> Report an Issue
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
