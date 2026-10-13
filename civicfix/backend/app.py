"""
app.py - CivicFix REST API (Flask + SQLite).

Start the server:
    python app.py
The API runs on http://localhost:5000 and the React dev server proxies /api and
/uploads to it. If the frontend has been built (frontend/dist exists), Flask also
serves the built app at http://localhost:5000/.
"""
import hmac
import os
import re
import uuid
from difflib import SequenceMatcher

from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge

from database import (CATEGORIES, STATUSES, get_connection, init_db,
                      insert_report, add_status_update, now_iso)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

# Demo-mode admin key. Change it by setting the CIVICFIX_ADMIN_KEY environment variable.
ADMIN_KEY = os.environ.get("CIVICFIX_ADMIN_KEY", "civicfix-demo-2026")

app = Flask(__name__, static_folder=None)
# Slightly above the image limit so form fields fit; image size is checked separately.
app.config["MAX_CONTENT_LENGTH"] = MAX_IMAGE_BYTES + 512 * 1024
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def error(message, status=400, field_errors=None):
    body = {"error": message}
    if field_errors:
        body["fields"] = field_errors
    return jsonify(body), status


def report_to_dict(row):
    return {
        "id": row["id"],
        "tracking_id": row["tracking_id"],
        "title": row["title"],
        "category": row["category"],
        "description": row["description"],
        "location": row["location"],
        "reporter_name": row["reporter_name"],
        "image_url": f"/uploads/{row['image_filename']}" if row["image_filename"] else None,
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def history_for(conn, report_id):
    rows = conn.execute(
        """SELECT status, note, updated_by, created_at FROM status_updates
           WHERE report_id = ? ORDER BY created_at ASC, id ASC""",
        (report_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def find_report(conn, tracking_id):
    """Look up a report by tracking ID (case-insensitive, whitespace tolerant)."""
    tid = (tracking_id or "").strip().upper()
    if not re.fullmatch(r"CF-\d{4}-\d{4,}", tid):
        return None
    return conn.execute("SELECT * FROM reports WHERE tracking_id = ?", (tid,)).fetchone()


def is_admin(req):
    supplied = req.headers.get("X-Admin-Key", "")
    return bool(supplied) and hmac.compare_digest(supplied, ADMIN_KEY)


def detect_image_type(data):
    """Check the file's real content (magic bytes), not just its extension."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def save_image(file_storage):
    """Validate and save an uploaded image. Returns (filename, error_message).
    The stored filename is a random UUID, so user-supplied names/paths are never used."""
    if not file_storage or not file_storage.filename:
        return None, None
    ext = file_storage.filename.rsplit(".", 1)[-1].lower() if "." in file_storage.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return None, "Only JPG, PNG, WEBP or GIF images are allowed."
    data = file_storage.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        return None, "Image is too large. Maximum size is 5 MB."
    if len(data) == 0:
        return None, "The uploaded image is empty."
    real_type = detect_image_type(data)
    if real_type is None:
        return None, "The file does not look like a valid image."
    filename = f"{uuid.uuid4().hex}.{real_type}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as fh:
        fh.write(data)
    return filename, None


def validate_report_fields(form):
    title = (form.get("title") or "").strip()
    category = (form.get("category") or "").strip()
    description = (form.get("description") or "").strip()
    location = (form.get("location") or "").strip()
    reporter = (form.get("reporter_name") or "").strip()

    errors = {}
    if not 5 <= len(title) <= 120:
        errors["title"] = "Title must be between 5 and 120 characters."
    if category not in CATEGORIES:
        errors["category"] = "Please choose a valid category."
    if not 15 <= len(description) <= 2000:
        errors["description"] = "Description must be between 15 and 2000 characters."
    if not 5 <= len(location) <= 200:
        errors["location"] = "Location must be between 5 and 200 characters."
    if len(reporter) > 60:
        errors["reporter_name"] = "Name must be 60 characters or fewer."

    clean = dict(title=title, category=category, description=description,
                 location=location, reporter_name=reporter or None)
    return clean, errors


# ---------------------------------------------------------------------------
# Duplicate detection (simple text similarity, no ML)
# ---------------------------------------------------------------------------
STOPWORDS = {
    "a", "an", "the", "of", "and", "at", "in", "on", "near", "opp", "opposite", "to",
    "is", "for", "with", "from", "road", "rd", "street", "st", "main", "chennai",
    "india", "avenue", "junction", "nagar", "not", "very", "this", "since", "has",
}


def tokens(text):
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 1}


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def similarity_scores(title, category, location, row):
    title_seq = SequenceMatcher(None, title.lower(), row["title"].lower()).ratio()
    title_tok = jaccard(tokens(title), tokens(row["title"]))
    title_sim = max(title_seq, title_tok)
    loc_sim = jaccard(tokens(location), tokens(row["location"]))
    same_cat = category == row["category"]
    return title_sim, loc_sim, same_cat


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "time": now_iso()})


@app.get("/api/meta")
def meta():
    return jsonify({"categories": CATEGORIES, "statuses": STATUSES})


@app.get("/api/stats")
def stats():
    conn = get_connection()
    try:
        rows = conn.execute("SELECT status, COUNT(*) AS n FROM reports GROUP BY status").fetchall()
        by_status = {s: 0 for s in STATUSES}
        for r in rows:
            by_status[r["status"]] = r["n"]
        cat_rows = conn.execute(
            "SELECT category, COUNT(*) AS n FROM reports GROUP BY category").fetchall()
        by_category = {c: 0 for c in CATEGORIES}
        for r in cat_rows:
            by_category[r["category"]] = r["n"]
        total = sum(by_status.values())
        return jsonify({
            "total": total,
            "submitted": by_status["Submitted"],
            "acknowledged": by_status["Acknowledged"],
            "in_progress": by_status["In Progress"],
            "resolved": by_status["Resolved"],
            "by_status": by_status,
            "by_category": by_category,
            "resolution_rate": round(100 * by_status["Resolved"] / total) if total else 0,
        })
    finally:
        conn.close()


@app.get("/api/reports")
def list_reports():
    """List reports with optional search (?q=), filters (?category=, ?status=),
    sorting (?sort=newest|oldest|updated) and ?limit=."""
    q = (request.args.get("q") or "").strip()
    category = (request.args.get("category") or "").strip()
    status = (request.args.get("status") or "").strip()
    sort = request.args.get("sort", "newest")
    try:
        limit = max(1, min(int(request.args.get("limit", 200)), 500))
    except ValueError:
        return error("limit must be a number.")

    if category and category not in CATEGORIES:
        return error("Unknown category.")
    if status and status not in STATUSES:
        return error("Unknown status.")

    sql = "SELECT * FROM reports WHERE 1=1"
    params = []
    if q:
        like = f"%{q}%"
        sql += (" AND (title LIKE ? OR description LIKE ? OR location LIKE ?"
                " OR tracking_id LIKE ?)")
        params += [like, like, like, like]
    if category:
        sql += " AND category = ?"
        params.append(category)
    if status:
        sql += " AND status = ?"
        params.append(status)
    order = {"oldest": "created_at ASC", "updated": "updated_at DESC"}.get(sort, "created_at DESC")
    sql += f" ORDER BY {order}, id DESC LIMIT ?"
    params.append(limit)

    conn = get_connection()
    try:
        rows = conn.execute(sql, params).fetchall()
        return jsonify({"count": len(rows), "reports": [report_to_dict(r) for r in rows]})
    finally:
        conn.close()


@app.post("/api/reports")
def create_report():
    """Create a report. Accepts multipart/form-data (with optional 'image') or JSON."""
    form = request.form if request.form else (request.get_json(silent=True) or {})
    clean, errors = validate_report_fields(form)
    if errors:
        return error("Please fix the highlighted fields.", 422, errors)

    image_filename, img_err = save_image(request.files.get("image"))
    if img_err:
        return error(img_err, 422, {"image": img_err})

    conn = get_connection()
    try:
        rid = insert_report(conn, image_filename=image_filename, **clean)
        conn.commit()
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (rid,)).fetchone()
        result = report_to_dict(row)
        result["history"] = history_for(conn, rid)
        return jsonify(result), 201
    finally:
        conn.close()


@app.post("/api/reports/check-duplicates")
def check_duplicates():
    """Return existing reports that look similar. Never merges or deletes anything."""
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    category = (data.get("category") or "").strip()
    location = (data.get("location") or "").strip()
    if len(title) < 4 and len(location) < 4:
        return jsonify({"matches": []})

    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM reports ORDER BY created_at DESC LIMIT 500").fetchall()
    finally:
        conn.close()

    matches = []
    for row in rows:
        title_sim, loc_sim, same_cat = similarity_scores(title, category, location, row)
        reasons = []
        if len(title) >= 4 and title_sim >= 0.6:
            reasons.append("similar title")
        if same_cat and location and loc_sim >= 0.4:
            reasons.append("same category at a similar location")
        if reasons:
            score = round(max(title_sim, (loc_sim + 0.5) if same_cat else 0), 2)
            item = report_to_dict(row)
            item["match_reasons"] = reasons
            item["score"] = score
            matches.append(item)
    matches.sort(key=lambda m: m["score"], reverse=True)
    return jsonify({"matches": matches[:3]})


@app.get("/api/reports/<tracking_id>")
def get_report(tracking_id):
    conn = get_connection()
    try:
        row = find_report(conn, tracking_id)
        if not row:
            return error("Report not found. Check the tracking ID (e.g. CF-2026-0001).", 404)
        result = report_to_dict(row)
        result["history"] = history_for(conn, row["id"])
        return jsonify(result)
    finally:
        conn.close()


@app.get("/api/track/<tracking_id>")
def track_report(tracking_id):
    """Lightweight tracking view: current status + update history."""
    conn = get_connection()
    try:
        row = find_report(conn, tracking_id)
        if not row:
            return error("No report found with that tracking ID.", 404)
        return jsonify({
            "tracking_id": row["tracking_id"],
            "title": row["title"],
            "category": row["category"],
            "location": row["location"],
            "status": row["status"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "history": history_for(conn, row["id"]),
        })
    finally:
        conn.close()


@app.post("/api/reports/<tracking_id>/photo")
def upload_photo(tracking_id):
    """Attach a photo to an existing report. Anyone may add a photo to a report that has
    none; replacing an existing photo requires the admin key."""
    conn = get_connection()
    try:
        row = find_report(conn, tracking_id)
        if not row:
            return error("Report not found.", 404)
        if row["image_filename"] and not is_admin(request):
            return error("This report already has a photo. Only an admin can replace it.", 409)
        if "image" not in request.files:
            return error("No image file was sent (form field name must be 'image').")
        filename, img_err = save_image(request.files["image"])
        if img_err:
            return error(img_err, 422, {"image": img_err})
        old = row["image_filename"]
        conn.execute("UPDATE reports SET image_filename = ?, updated_at = ? WHERE id = ?",
                     (filename, now_iso(), row["id"]))
        conn.commit()
        if old:
            try:
                os.remove(os.path.join(UPLOAD_DIR, old))
            except OSError:
                pass
        return jsonify({"tracking_id": row["tracking_id"], "image_url": f"/uploads/{filename}"}), 201
    finally:
        conn.close()


# ----------------------------- Admin (demo mode) ----------------------------
@app.post("/api/admin/verify")
def admin_verify():
    if not is_admin(request):
        return error("Invalid admin key.", 401)
    return jsonify({"ok": True})


@app.patch("/api/admin/reports/<tracking_id>/status")
def update_status(tracking_id):
    if not is_admin(request):
        return error("Admin key missing or invalid. Status changes are restricted.", 401)

    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "").strip()
    note = (data.get("note") or "").strip()
    updated_by = (data.get("updated_by") or "Admin (demo)").strip()[:60] or "Admin (demo)"

    if status not in STATUSES:
        return error("Status must be one of: " + ", ".join(STATUSES), 422, {"status": "Invalid status."})
    if len(note) > 500:
        return error("Note must be 500 characters or fewer.", 422, {"note": "Too long."})

    conn = get_connection()
    try:
        row = find_report(conn, tracking_id)
        if not row:
            return error("Report not found.", 404)
        if status == row["status"] and not note:
            return error("Status is unchanged. Add a note to post a progress update.", 422,
                         {"note": "Required when status is unchanged."})
        add_status_update(conn, row["id"], status, note or f"Status changed to {status}.", updated_by)
        conn.commit()
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (row["id"],)).fetchone()
        result = report_to_dict(row)
        result["history"] = history_for(conn, row["id"])
        return jsonify(result)
    finally:
        conn.close()


# ----------------------------- Files & frontend -----------------------------
@app.get("/uploads/<path:filename>")
def uploaded_file(filename):
    # Only serve plain generated names like <hex>.<ext>; block any path tricks.
    if not re.fullmatch(r"[a-f0-9]{32}\.(jpg|png|gif|webp)", filename):
        abort(404)
    return send_from_directory(UPLOAD_DIR, filename)


@app.get("/")
@app.get("/<path:path>")
def serve_frontend(path=""):
    """Serve the built React app (frontend/dist) if it exists."""
    if path.startswith("api/"):
        return error("Endpoint not found.", 404)
    if not os.path.isdir(FRONTEND_DIST):
        return jsonify({"message": "CivicFix API is running. Start the frontend with "
                                   "'npm run dev' in the frontend folder."})
    full = os.path.join(FRONTEND_DIST, path)
    if path and os.path.isfile(full):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")  # React Router fallback


# ----------------------------- Error handlers -------------------------------
@app.errorhandler(RequestEntityTooLarge)
def too_large(_e):
    return error("Upload is too large. Maximum image size is 5 MB.", 413)


@app.errorhandler(404)
def not_found(_e):
    return error("Not found.", 404)


@app.errorhandler(405)
def bad_method(_e):
    return error("Method not allowed.", 405)


@app.errorhandler(500)
def server_error(_e):
    return error("Something went wrong on the server.", 500)


init_db()

if __name__ == "__main__":
    print("CivicFix API running at http://localhost:5000")
    print("Demo admin key:", "(custom, from CIVICFIX_ADMIN_KEY)"
          if "CIVICFIX_ADMIN_KEY" in os.environ else ADMIN_KEY)
    app.run(host="127.0.0.1", port=5000, debug=False)
