# CivicFix — Real-World Problem Reporting Platform

> **Report Local Problems. Track Real Progress.**

CivicFix is a working web prototype (Product Development Lab) that lets people report public problems — potholes, overflowing garbage, water leakage, broken streetlights, damaged roads and drainage issues — browse community reports, and track each report until it is resolved.

> ⚠️ **Prototype disclaimer:** CivicFix stores reports in a local SQLite database only. It does **not** send complaints to any government department, does **not** use any government API, and does **not** provide real user authentication. The admin area is a clearly labelled **demo mode** protected by a shared demo key.

---

## 1. Features

| # | Feature | Where |
|---|---------|-------|
| 1 | Landing page with tagline, Report button, how-it-works, live stats and recent reports | `/` |
| 2 | Dashboard with total / submitted / acknowledged / in-progress / resolved counts, status & category breakdown — all computed from the database | `/dashboard` |
| 3 | Report form (title, category, description, location, optional name, optional photo) with client + server validation | `/report` |
| 4 | Six categories: Roads & Potholes, Garbage, Water Leakage, Streetlights, Drainage, Other | everywhere |
| 5 | Browse page with cards, photos, IDs, locations, dates, statuses, search, category & status filters, sorting | `/reports` |
| 6 | Issue details with full info, progress stepper and status history timeline; add a photo if none exists | `/reports/CF-2026-0001` |
| 7 | Track by report ID with current status and update history | `/track` |
| 8 | Admin dashboard (demo key) to filter reports, change status, add notes — saved to SQLite | `/admin` |
| 9 | Duplicate-report assistance: live warning while typing if a similar report exists (never merges/deletes) | `/report` |
| 10 | Responsive nav, loading skeletons, empty states, validation messages, toasts, error states with retry | everywhere |
| 11 | Sample data seeded once (guarded by a flag, so restarts never duplicate it) | `backend/database.py` |
| 12 | About page: problem, solution, target users, limitations, future work | `/about` |

---

## 2. Tech stack

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Lucide icons, React Router
- **Backend:** Python Flask 3 REST API (+ flask-cors)
- **Database:** SQLite (file `backend/civicfix.db`, created automatically)
- **Uploads:** `backend/uploads/` — validated by extension, real file content (magic bytes) and size (max 5 MB); saved under random names

---

## 3. Folder structure

```
civicfix/
├── backend/
│   ├── app.py              # Flask app: all REST endpoints, upload handling, admin check
│   ├── database.py         # SQLite schema, helpers, sample data, one-time seeding
│   ├── seed.py             # CLI: init / reset + reseed the database
│   ├── requirements.txt
│   └── uploads/            # uploaded photos (random filenames)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js      # proxies /api and /uploads to Flask (port 5000)
│   ├── tailwind.config.js
│   ├── public/favicon.svg  # map-pin + checkmark logo
│   └── src/
│       ├── main.jsx, App.jsx, api.js, utils.js, index.css
│       ├── components/     # Navbar, Footer, Logo, ReportCard, StatusBadge, StatusTimeline, StatCards, Toast, States…
│       └── pages/          # Home, Dashboard, ReportIssue, BrowseReports, ReportDetails, TrackReport, Admin, About, NotFound
├── start-backend.bat       # one-click backend start (Windows)
├── start-frontend.bat      # one-click frontend start (Windows)
├── .gitignore
└── README.md
```

---

## 4. Installation and running on Windows

### Prerequisites
- **Python 3.10+** — during install tick **"Add Python to PATH"**. Check: `python --version`
- **Node.js 18+ (LTS)** — check: `node --version` and `npm --version`

### Option A — double-click (easiest)
1. Double-click **`start-backend.bat`** → wait for `CivicFix API running at http://localhost:5000`. Keep this window open.
2. Double-click **`start-frontend.bat`** → wait for `Local: http://localhost:5173/`.
3. Open **http://localhost:5173** in your browser.

### Option B — exact commands (Command Prompt)

**Terminal 1 — backend**
```bat
cd civicfix\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Terminal 2 — frontend**
```bat
cd civicfix\frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

> Using **PowerShell** and `venv\Scripts\activate` is blocked? Run once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` — or use Command Prompt instead.

The database and sample data are created automatically the first time `app.py` runs.

### Demo admin key
The backend prints it on startup. Default: **`civicfix-demo-2026`**.
To use your own key for the demo (Command Prompt):
```bat
set CIVICFIX_ADMIN_KEY=my-secret-key
python app.py
```

### Reset the demo data
```bat
cd civicfix\backend
venv\Scripts\activate
python seed.py --reset
```
This deletes the database and uploaded photos and re-inserts the 12 sample reports.

### Optional — single-server mode (no Vite)
```bat
cd civicfix\frontend
npm run build
cd ..\backend
python app.py
```
Flask then serves the built app at **http://localhost:5000** as well as the API.

---

## 5. Architecture

```
 Browser (React SPA, port 5173)
        │   fetch('/api/...')            Vite dev proxy
        ▼                                     │
 Flask REST API (port 5000) ◄─────────────────┘
        │  validation · duplicate check · admin-key check · upload validation
        ├──► SQLite  (reports, status_updates, app_meta)
        └──► backend/uploads/  (photos with random UUID names)
```

- The React app never touches the database directly; every number on screen comes from an API call.
- **Tracking IDs** are `CF-<year>-<4-digit id>`, e.g. `CF-2026-0013`, derived from the auto-increment row id, so they are unique and human-readable.
- Timestamps are stored in **UTC ISO-8601** (`2026-10-12T17:31:00Z`) and shown in the viewer's local time.

### Database schema

**reports**

| column | type | notes |
|---|---|---|
| id | INTEGER PK | auto-increment |
| tracking_id | TEXT UNIQUE | `CF-2026-0001` |
| title, category, description, location | TEXT | validated |
| reporter_name | TEXT | optional |
| image_filename | TEXT | random `<uuid>.<ext>` or NULL |
| status | TEXT | Submitted / Acknowledged / In Progress / Resolved |
| created_at, updated_at | TEXT | UTC ISO timestamps |

**status_updates** — full history: `id, report_id (FK), status, note, updated_by, created_at`

**app_meta** — key/value; the `seeded` key prevents re-seeding on restart.

### Duplicate detection (how it works)
While the user types, the form calls `POST /api/reports/check-duplicates`. The server compares the new report with existing ones using:
- **title similarity** — max of character similarity (`difflib.SequenceMatcher`) and word overlap; flagged at ≥ 0.6
- **same category + location word overlap** (Jaccard, ignoring common words like "road", "near", "Chennai"); flagged at ≥ 0.4

Up to 3 matches are shown as a warning with links. The user can still submit. Nothing is merged or deleted.

---

## 6. API documentation

Base URL: `http://localhost:5000`. All responses are JSON. Errors look like `{"error": "message", "fields": {"title": "..."}}`.

| Method | Endpoint | Description | Success |
|---|---|---|---|
| GET | `/api/health` | Health check | 200 |
| GET | `/api/meta` | Categories and statuses | 200 |
| GET | `/api/stats` | Counts by status & category, resolution rate | 200 |
| GET | `/api/reports` | List / search / filter reports. Query: `q`, `category`, `status`, `sort` (`newest`\|`oldest`\|`updated`), `limit` | 200 |
| POST | `/api/reports` | Create report. `multipart/form-data` (or JSON without image): `title`, `category`, `description`, `location`, `reporter_name?`, `image?` | **201** |
| POST | `/api/reports/check-duplicates` | JSON `{title, category, location}` → `{matches: [...]}` with `match_reasons` | 200 |
| GET | `/api/reports/<tracking_id>` | Full report + `history` | 200 / 404 |
| GET | `/api/track/<tracking_id>` | Tracking view: status + `history` (ID is case-insensitive) | 200 / 404 |
| POST | `/api/reports/<tracking_id>/photo` | Upload photo (form field `image`). Allowed only if the report has no photo; replacing needs admin key | **201** / 409 |
| POST | `/api/admin/verify` | Check header `X-Admin-Key` | 200 / 401 |
| PATCH | `/api/admin/reports/<tracking_id>/status` | Header `X-Admin-Key`; JSON `{status, note?, updated_by?}` | 200 / 401 / 422 |
| GET | `/uploads/<filename>` | Serve an uploaded image (only generated names allowed) | 200 / 404 |

Validation rules: title 5–120 chars, description 15–2000, location 5–200, category from the list, name ≤ 60, note ≤ 500. Images: JPG/PNG/WEBP/GIF, ≤ 5 MB, content must really be an image. Invalid input → **422**, unknown ID → **404**, oversized upload → **413**, bad/missing admin key → **401**.

Example (Command Prompt, with curl):
```bat
curl -X POST http://localhost:5000/api/reports -F "title=Broken streetlight" -F "category=Streetlights" -F "description=Light near the bus stop has been off for a week." -F "location=Anna Salai, Chennai"
curl http://localhost:5000/api/track/CF-2026-0013
curl -X PATCH http://localhost:5000/api/admin/reports/CF-2026-0013/status -H "Content-Type: application/json" -H "X-Admin-Key: civicfix-demo-2026" -d "{\"status\":\"Resolved\",\"note\":\"Lamp replaced\"}"
```

---

## 7. Demo workflow (for the faculty presentation)

1. **Home** — show the tagline, live counts and recent reports.
2. **Dashboard** — note the totals (e.g. 12 total, 3 resolved).
3. **Report an Issue** — type the title *"Pothole near Chromepet bus stop"*, choose *Roads & Potholes*, location *"GST Road, Chromepet"* → the **possible-duplicate warning** appears (matches seeded report CF-2026-0001). Change it to a new issue, add a photo, submit → note the **tracking ID**.
4. **Browse Reports** — search for your title; try the category and status filters.
5. **Track Report** — paste the tracking ID → status *Submitted* with history.
6. **Admin** — unlock with the demo key → Manage your report → set *Acknowledged* → *In Progress* → *Resolved* with notes.
7. **Track Report** again → the timeline shows every update.
8. **Dashboard** → the counts have changed (total +1, resolved +1).

---

## 8. Security measures and remaining limitations

**Implemented**
- Uploads: extension allow-list **and** magic-byte check, 5 MB limit, saved under random UUID filenames (user filenames/paths are never used), served only if the name matches the generated pattern.
- All SQL uses parameterised queries (no string-built SQL with user input).
- Status changes require the `X-Admin-Key` header, compared in constant time; the key is configurable via environment variable and is not shown in the UI.
- Server-side validation of every field; CORS restricted to the local frontend origin; Flask debug mode off.

**Limitations (be upfront about these)**
- **No real authentication.** One shared demo key; no user accounts, roles, sessions expiry, or rate limiting. Anyone with the key can change statuses. The key is kept in browser `sessionStorage` while the tab is open.
- Reports are **not verified** and are **not forwarded** to any authority.
- Location is free text (no GPS/map validation).
- Duplicate detection is simple text similarity — it can miss duplicates or show false matches.
- Anyone can submit reports (no spam protection / CAPTCHA) and add a photo to a report that has none.
- Uses Flask's development server and SQLite — fine for a demo, not for public deployment.
- The Plus Jakarta Sans font loads from Google Fonts; offline, the app falls back to the system font.

---

## 9. Final-year upgrade roadmap

1. **Authentication & roles** — OTP/email login for citizens; ward-officer and super-admin roles (JWT or session-based), audit log of who changed what.
2. **Maps & geolocation** — pick location on a map (Leaflet + OpenStreetMap), store lat/long, show a hotspot heatmap, distance-based duplicate detection.
3. **Notifications** — email/SMS/WhatsApp updates when status changes.
4. **AI assistance** — suggest a category from the photo; smarter duplicate detection using text embeddings + location distance.
5. **Community features** — upvotes ("me too"), comments, priority score.
6. **SLA & analytics** — time-to-resolve per category/ward, overdue alerts, exportable reports (CSV/PDF).
7. **Production deployment** — PostgreSQL, Gunicorn/Waitress, cloud object storage for photos, HTTPS, rate limiting, image compression.
8. **Official integration** — connect to municipal grievance systems only through authorised, documented channels.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Page says *"Cannot reach the CivicFix server"* | The backend isn't running — start `python app.py` (Terminal 1). |
| `python` not recognised | Reinstall Python with "Add to PATH", or use `py` instead of `python`. |
| `npm` not recognised | Install Node.js LTS and reopen the terminal. |
| Port 5000 or 5173 already in use | Close the other program/terminal using it, then restart. |
| Want a clean demo | `python seed.py --reset` in the backend folder, then restart `app.py`. |
