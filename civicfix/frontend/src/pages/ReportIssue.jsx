import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Loader2, Send, X, AlertTriangle, CheckCircle2, Copy, Search, Eye, Info } from 'lucide-react'
import { api } from '../api.js'
import { useToast } from '../components/Toast.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { CATEGORIES, formatDate } from '../utils.js'

const EMPTY = { title: '', category: '', description: '', location: '', reporter_name: '' }
const MAX_IMAGE_MB = 5
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function validate(form) {
  const e = {}
  const t = form.title.trim()
  if (t.length < 5 || t.length > 120) e.title = 'Title must be between 5 and 120 characters.'
  if (!CATEGORIES.includes(form.category)) e.category = 'Please choose a category.'
  const d = form.description.trim()
  if (d.length < 15 || d.length > 2000) e.description = 'Description must be between 15 and 2000 characters.'
  const l = form.location.trim()
  if (l.length < 5 || l.length > 200) e.location = 'Please enter a location of at least 5 characters.'
  if (form.reporter_name.length > 60) e.reporter_name = 'Name must be 60 characters or fewer.'
  return e
}

export default function ReportIssue() {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [checkingDup, setCheckingDup] = useState(false)
  const fileInput = useRef(null)

  // Duplicate check: runs 600 ms after the user stops typing title/category/location.
  useEffect(() => {
    const { title, category, location } = form
    if (title.trim().length < 5 && location.trim().length < 5) {
      setDuplicates([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setCheckingDup(true)
      api
        .checkDuplicates({ title, category, location }, controller.signal)
        .then((d) => setDuplicates(d.matches))
        .catch(() => {}) // duplicate check is only a helper; ignore failures
        .finally(() => setCheckingDup(false))
    }, 600)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [form.title, form.category, form.location]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((er) => ({ ...er, image: 'Only JPG, PNG, WEBP or GIF images are allowed.' }))
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrors((er) => ({ ...er, image: `Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.` }))
      return
    }
    setErrors((er) => ({ ...er, image: undefined }))
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImage(null)
    setPreview('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length) {
      toast('Please fix the highlighted fields.', 'error')
      return
    }
    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, val]) => fd.append(k, val.trim()))
    if (image) fd.append('image', image)
    try {
      const report = await api.createReport(fd)
      setCreated(report)
      toast(`Report ${report.tracking_id} submitted successfully.`)
      window.scrollTo(0, 0)
    } catch (err) {
      if (err.fields) setErrors(err.fields)
      toast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm(EMPTY)
    setErrors({})
    removeImage()
    setDuplicates([])
    setCreated(null)
  }

  if (created) return <SuccessPanel report={created} onAnother={resetForm} />

  const fieldClass = (f) => `input ${errors[f] ? 'input-error' : ''}`

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">New report</p>
        <h1 className="mt-2 text-3xl font-extrabold">Report an Issue</h1>
        <p className="mt-1 text-navy-500">Fields marked * are required. You'll get a tracking ID after submitting.</p>

        <form onSubmit={submit} noValidate className="card mt-8 space-y-6 p-6 sm:p-8">
          <div>
            <label htmlFor="title" className="label">Issue title *</label>
            <input id="title" className={fieldClass('title')} placeholder="e.g. Deep pothole near the bus stop"
              value={form.title} onChange={update('title')} maxLength={120} />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="label">Category *</label>
              <select id="category" className={fieldClass('category')} value={form.category} onChange={update('category')}>
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>
            <div>
              <label htmlFor="reporter_name" className="label">Your name <span className="font-normal text-navy-400">(optional)</span></label>
              <input id="reporter_name" className={fieldClass('reporter_name')} placeholder="Shown on the report"
                value={form.reporter_name} onChange={update('reporter_name')} maxLength={60} />
              {errors.reporter_name && <p className="field-error">{errors.reporter_name}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="location" className="label">Location / address *</label>
            <input id="location" className={fieldClass('location')} placeholder="Street, landmark, area, city"
              value={form.location} onChange={update('location')} maxLength={200} />
            {errors.location && <p className="field-error">{errors.location}</p>}
          </div>

          {/* Duplicate warning */}
          {checkingDup && duplicates.length === 0 && (
            <p className="flex items-center gap-2 text-xs text-navy-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking for similar reports…
            </p>
          )}
          {duplicates.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4" /> Possible duplicate{duplicates.length > 1 ? 's' : ''} found
              </p>
              <p className="mt-1 text-sm text-amber-800">
                This looks similar to existing report{duplicates.length > 1 ? 's' : ''}. Check before submitting — you can
                still submit if your issue is different.
              </p>
              <ul className="mt-3 space-y-2">
                {duplicates.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/80 px-3 py-2 text-sm">
                    <span className="font-mono text-xs font-semibold text-navy-400">{d.tracking_id}</span>
                    <span className="min-w-0 flex-1 font-semibold text-navy-800">{d.title}</span>
                    <StatusBadge status={d.status} />
                    <span className="w-full text-xs text-navy-500">
                      {d.location} · {formatDate(d.created_at)} · <em>{d.match_reasons.join(', ')}</em>
                    </span>
                    <Link to={`/reports/${d.tracking_id}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
                      <Eye className="h-3.5 w-3.5" /> View report
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="description" className="label">Description *</label>
            <textarea id="description" rows={5} className={fieldClass('description')} maxLength={2000}
              placeholder="What is the problem? How long has it been there? Is it causing any danger?"
              value={form.description} onChange={update('description')} />
            <div className="flex justify-between">
              {errors.description ? <p className="field-error">{errors.description}</p> : <span />}
              <span className="mt-1.5 text-xs text-navy-400">{form.description.length}/2000</span>
            </div>
          </div>

          <div>
            <span className="label">Photo <span className="font-normal text-navy-400">(optional, JPG/PNG/WEBP/GIF, max 5 MB)</span></span>
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-navy-100">
                <img src={preview} alt="Selected" className="max-h-72 w-full object-cover" />
                <button type="button" onClick={removeImage} className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow hover:bg-white" aria-label="Remove photo">
                  <X className="h-4 w-4" />
                </button>
                <p className="bg-white px-3 py-2 text-xs text-navy-500">{image?.name}</p>
              </div>
            ) : (
              <button type="button" onClick={() => fileInput.current?.click()}
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-sm transition hover:border-teal-400 hover:bg-teal-50/40 ${
                  errors.image ? 'border-red-300' : 'border-navy-200'
                }`}>
                <ImagePlus className="h-7 w-7 text-teal-600" />
                <span className="font-semibold text-navy-700">Click to add a photo</span>
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={pickImage} />
            {errors.image && <p className="field-error">{errors.image}</p>}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-navy-50 p-3 text-xs text-navy-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            This is a prototype. Your report is saved in the CivicFix database only — it is not forwarded to any government department.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="btn-ghost" disabled={submitting}>Clear form</button>
            <button type="submit" className="btn-primary px-6" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SuccessPanel({ report, onAnother }) {
  const toast = useToast()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report.tracking_id)
      toast('Tracking ID copied to clipboard.')
    } catch {
      toast('Could not copy automatically — please note the ID down.', 'error')
    }
  }
  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 inline-flex rounded-full bg-teal-50 p-4">
          <CheckCircle2 className="h-10 w-10 text-teal-600" />
        </div>
        <h1 className="text-2xl font-extrabold">Report submitted</h1>
        <p className="mt-2 text-navy-500">Save your tracking ID to check progress later.</p>
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-4">
          <span className="font-mono text-2xl font-extrabold tracking-wide text-navy-900">{report.tracking_id}</span>
          <button onClick={copy} className="rounded-lg p-2 text-teal-700 hover:bg-teal-100" aria-label="Copy tracking ID">
            <Copy className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold text-navy-700">{report.title}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link to={`/track/${report.tracking_id}`} className="btn-primary"><Search className="h-4 w-4" /> Track it</Link>
          <Link to={`/reports/${report.tracking_id}`} className="btn-secondary"><Eye className="h-4 w-4" /> View details</Link>
          <button onClick={onAnother} className="btn-secondary">Report another</button>
        </div>
      </div>
    </div>
  )
}
