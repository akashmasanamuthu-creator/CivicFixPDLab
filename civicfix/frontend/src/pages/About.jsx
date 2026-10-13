import { Link } from 'react-router-dom'
import { AlertCircle, Lightbulb, Users, ShieldAlert, Rocket } from 'lucide-react'

const sections = [
  {
    icon: AlertCircle,
    title: 'The problem',
    body: [
      'Everyday civic issues — potholes, uncollected garbage, leaking pipes, dark streets and blocked drains — often go unreported or get lost in phone calls and informal complaints.',
      'Citizens rarely get a reference number or any visibility into whether a complaint was seen, acted on or fixed, so the same issue gets reported again and again.',
    ],
  },
  {
    icon: Lightbulb,
    title: 'Our solution',
    body: [
      'CivicFix gives every report a structured format (category, location, description, photo) and a unique tracking ID such as CF-2026-0012.',
      'Reports are visible to the community, can be searched and filtered, and move through a clear status flow — Submitted → Acknowledged → In Progress → Resolved — with a note at every step.',
      'A duplicate-assistance check warns people when a similar issue has already been reported nearby, without deleting or merging anything automatically.',
    ],
  },
  {
    icon: Users,
    title: 'Target users',
    body: [
      'Residents who want a simple way to report and follow up on local problems.',
      'Resident welfare associations, college NSS units and ward volunteers who collect and track issues for an area.',
      'Ward or panchayat staff who need one place to see open issues and post progress updates.',
    ],
  },
  {
    icon: ShieldAlert,
    title: 'Current limitations',
    body: [
      'This is a student prototype. Reports are stored in a local SQLite database and are NOT sent to any government department or official grievance portal.',
      'There are no real user accounts. The admin area uses a shared demo key, which is not a substitute for proper authentication and role-based access.',
      'Locations are free text — there is no map pin or GPS verification, and reports are not verified for accuracy.',
      'Duplicate detection uses simple text similarity, so it can miss duplicates or flag unrelated reports.',
    ],
  },
  {
    icon: Rocket,
    title: 'Future improvements',
    body: [
      'User accounts with OTP login, and role-based access for ward officers.',
      'Map-based reporting with GPS coordinates and a heatmap of problem hotspots.',
      'Email/SMS notifications when the status of your report changes.',
      'Image-based category suggestion and better duplicate detection using location distance.',
      'Upvotes so the community can signal priority, plus SLA tracking for how long issues stay open.',
      'Integration with official grievance systems — only through authorised, documented channels.',
    ],
  },
]

export default function About() {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">About the project</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">About CivicFix</h1>
        <p className="mt-3 text-lg text-navy-500">
          CivicFix is a real-world problem reporting platform built as a Product Development Lab prototype. It
          demonstrates how a simple, transparent workflow can make civic complaints easier to file and easier to follow.
        </p>

        <div className="mt-10 space-y-5">
          {sections.map(({ icon: Icon, title, body }) => (
            <section key={title} className="card p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {body.map((line) => (
                  <li key={line} className="flex gap-3 text-navy-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="card mt-8 p-6 text-sm text-navy-500">
          <p className="font-semibold text-navy-800">Built with</p>
          <p className="mt-1">React + Vite + Tailwind CSS (frontend) · Python Flask REST API · SQLite database · Lucide icons</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/report" className="btn-primary">Report an Issue</Link>
          <Link to="/reports" className="btn-secondary">Browse Reports</Link>
        </div>
      </div>
    </div>
  )
}
