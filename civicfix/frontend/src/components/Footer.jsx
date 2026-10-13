import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-navy-100 bg-navy-50/60">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-navy-500">
            A student prototype for reporting and tracking local civic problems. Reports are stored in this
            app only and are not sent to any government department.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm font-medium text-navy-600">
          <Link to="/report" className="hover:text-teal-700">Report an Issue</Link>
          <Link to="/reports" className="hover:text-teal-700">Browse Reports</Link>
          <Link to="/track" className="hover:text-teal-700">Track Report</Link>
          <Link to="/dashboard" className="hover:text-teal-700">Dashboard</Link>
          <Link to="/admin" className="hover:text-teal-700">Admin (demo)</Link>
          <Link to="/about" className="hover:text-teal-700">About</Link>
        </div>
      </div>
      <div className="border-t border-navy-100 py-4 text-center text-xs text-navy-400">
        CivicFix · Product Development Lab prototype · {new Date().getFullYear()}
      </div>
    </footer>
  )
}
