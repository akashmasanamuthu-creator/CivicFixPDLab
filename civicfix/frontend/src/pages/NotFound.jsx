import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <MapPinOff className="h-12 w-12 text-navy-300" />
      <h1 className="mt-4 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-navy-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">Go to home</Link>
    </div>
  )
}
