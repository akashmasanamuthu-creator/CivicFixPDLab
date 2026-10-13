import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ReportIssue from './pages/ReportIssue.jsx'
import BrowseReports from './pages/BrowseReports.jsx'
import ReportDetails from './pages/ReportDetails.jsx'
import TrackReport from './pages/TrackReport.jsx'
import Admin from './pages/Admin.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/reports" element={<BrowseReports />} />
          <Route path="/reports/:trackingId" element={<ReportDetails />} />
          <Route path="/track" element={<TrackReport />} />
          <Route path="/track/:trackingId" element={<TrackReport />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
