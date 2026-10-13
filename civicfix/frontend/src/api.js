// api.js - small wrapper around fetch() for talking to the Flask backend.
// All paths are relative (/api/...) - Vite proxies them to http://127.0.0.1:5000 in development.

export class ApiError extends Error {
  constructor(message, status = 0, fields = null) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

const TIMEOUT_MS = 15000 // give up after 15 s instead of showing a spinner forever

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  // Abort if the caller cancels OR if the server takes too long.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TIMEOUT_MS)
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  try {
    return await doRequest(path, { method, body, headers, signal: controller.signal })
  } catch (err) {
    if (timedOut) {
      throw new ApiError(
        'The server is taking too long to respond. Check the backend window — if you clicked inside it, press Enter there to resume it.',
      )
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function doRequest(path, { method, body, headers, signal }) {
  const options = { method, headers: { ...headers }, signal }
  if (body instanceof FormData) {
    options.body = body // browser sets multipart boundary automatically
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(path, options)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Cannot reach the CivicFix server. Make sure the backend (python app.py) is running.')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    /* non-JSON response */
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status, data?.fields)
  }
  return data
}

function adminHeaders() {
  const key = sessionStorage.getItem('civicfix_admin_key') || ''
  return { 'X-Admin-Key': key }
}

export const api = {
  meta: () => request('/api/meta'),
  stats: () => request('/api/stats'),
  listReports: (params = {}, signal) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    return request(`/api/reports?${qs}`, { signal })
  },
  getReport: (trackingId) => request(`/api/reports/${encodeURIComponent(trackingId)}`),
  track: (trackingId) => request(`/api/track/${encodeURIComponent(trackingId)}`),
  createReport: (formData) => request('/api/reports', { method: 'POST', body: formData }),
  checkDuplicates: (payload, signal) =>
    request('/api/reports/check-duplicates', { method: 'POST', body: payload, signal }),
  uploadPhoto: (trackingId, file) => {
    const fd = new FormData()
    fd.append('image', file)
    return request(`/api/reports/${encodeURIComponent(trackingId)}/photo`, { method: 'POST', body: fd })
  },
  verifyAdmin: (key) => request('/api/admin/verify', { method: 'POST', headers: { 'X-Admin-Key': key } }),
  updateStatus: (trackingId, payload) =>
    request(`/api/admin/reports/${encodeURIComponent(trackingId)}/status`, {
      method: 'PATCH',
      body: payload,
      headers: adminHeaders(),
    }),
}
