"""
database.py - SQLite setup, schema and seed data for CivicFix.

Run directly to (re)initialise the database:
    python database.py          -> create tables + seed sample data (only once)
    python database.py --reset  -> delete the database file and start fresh
"""
import os
import sqlite3
import sys
from datetime import datetime, timedelta, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("CIVICFIX_DB", os.path.join(BASE_DIR, "civicfix.db"))

CATEGORIES = [
    "Roads & Potholes",
    "Garbage",
    "Water Leakage",
    "Streetlights",
    "Drainage",
    "Other",
]
STATUSES = ["Submitted", "Acknowledged", "In Progress", "Resolved"]

SCHEMA = """
CREATE TABLE IF NOT EXISTS reports (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_id   TEXT UNIQUE,
    title         TEXT NOT NULL,
    category      TEXT NOT NULL,
    description   TEXT NOT NULL,
    location      TEXT NOT NULL,
    reporter_name TEXT,
    image_filename TEXT,
    status        TEXT NOT NULL DEFAULT 'Submitted',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS status_updates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id   INTEGER NOT NULL,
    status      TEXT NOT NULL,
    note        TEXT,
    updated_by  TEXT NOT NULL DEFAULT 'System',
    created_at  TEXT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_updates_report   ON status_updates(report_id);
"""


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def now_iso(dt=None):
    """Return a UTC timestamp string like 2026-10-12T08:35:00Z.
    Storing UTC (with 'Z') lets every browser convert it to its own local time correctly."""
    return (dt or utc_now()).replace(microsecond=0).isoformat() + "Z"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def make_tracking_id(report_id, created_at):
    """Human-readable tracking ID, e.g. CF-2026-0007."""
    year = created_at[:4]
    return f"CF-{year}-{report_id:04d}"


def insert_report(conn, title, category, description, location,
                  reporter_name=None, image_filename=None, created_at=None):
    """Insert a report plus its first 'Submitted' history entry. Returns the new row id."""
    created_at = created_at or now_iso()
    cur = conn.execute(
        """INSERT INTO reports (title, category, description, location, reporter_name,
                                image_filename, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)""",
        (title, category, description, location, reporter_name, image_filename,
         created_at, created_at),
    )
    report_id = cur.lastrowid
    conn.execute("UPDATE reports SET tracking_id = ? WHERE id = ?",
                 (make_tracking_id(report_id, created_at), report_id))
    conn.execute(
        """INSERT INTO status_updates (report_id, status, note, updated_by, created_at)
           VALUES (?, 'Submitted', 'Report received by CivicFix.', 'System', ?)""",
        (report_id, created_at),
    )
    return report_id


def add_status_update(conn, report_id, status, note, updated_by, created_at=None):
    created_at = created_at or now_iso()
    conn.execute(
        """INSERT INTO status_updates (report_id, status, note, updated_by, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (report_id, status, note, updated_by, created_at),
    )
    conn.execute("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?",
                 (status, created_at, report_id))


# ---------------------------------------------------------------------------
# Sample data. Each entry: (title, category, description, location, reporter,
#                           days_ago, [(status, note, hours_after_creation), ...])
# ---------------------------------------------------------------------------
SEED_REPORTS = [
    ("Large pothole near bus stop causing two-wheeler skids",
     "Roads & Potholes",
     "A deep pothole about 1 metre wide has formed right in front of the bus stop. "
     "It fills with rainwater and two-wheelers have skidded here at least twice this week.",
     "GST Road, near Chromepet Bus Stop, Chennai", "Arun K", 21,
     [("Acknowledged", "Forwarded to the roads maintenance team for inspection.", 20),
      ("In Progress", "Inspection done. Patch work scheduled for this weekend.", 70),
      ("Resolved", "Pothole filled and levelled with bituminous mix.", 140)]),
    ("Garbage bin overflowing for 4 days",
     "Garbage",
     "The community bin at the corner of the street has not been cleared for four days. "
     "Waste is spilling onto the road and stray dogs are scattering it.",
     "3rd Cross Street, Besant Nagar, Chennai", "Priya S", 9,
     [("Acknowledged", "Ward sanitation supervisor informed.", 6),
      ("In Progress", "Collection vehicle assigned for daily pickup.", 30)]),
    ("Drinking water pipe leaking on main road",
     "Water Leakage",
     "Clean water has been gushing from a cracked pipe joint near the footpath since morning. "
     "A lot of water is being wasted and the road is getting slippery.",
     "Poonamallee High Road, near Kilpauk Medical College, Chennai", "Mohammed R", 6,
     [("Acknowledged", "Water supply department notified.", 4)]),
    ("Three streetlights not working on stretch",
     "Streetlights",
     "Three consecutive streetlights are off, leaving a 150 m stretch completely dark at night. "
     "Women and elderly walkers feel unsafe using this road after 7 PM.",
     "Velachery Main Road, near Vijayanagar Junction, Chennai", "Lakshmi V", 15,
     [("Acknowledged", "Electrical maintenance team informed.", 12),
      ("In Progress", "Faulty fittings identified; replacement ordered.", 48),
      ("Resolved", "All three lamps replaced with LED fittings and tested.", 120)]),
    ("Blocked storm drain causing waterlogging",
     "Drainage",
     "The storm water drain is clogged with plastic and silt. Even light rain causes "
     "ankle-deep water outside the school gate.",
     "Station Road, Gummidipoondi, Tiruvallur District", "Karthik M", 4, []),
    ("Damaged road surface after cable work",
     "Roads & Potholes",
     "The road was dug up for cable laying and was never resurfaced properly. "
     "Loose gravel and uneven patches make it dangerous for cyclists.",
     "Arcot Road, Vadapalani, Chennai", "Divya N", 12,
     [("Acknowledged", "Utility contractor contacted to restore the road.", 24)]),
    ("Open garbage dumping near lake bund",
     "Garbage",
     "People are dumping household and construction waste along the lake bund. "
     "There is a bad smell and it is attracting mosquitoes.",
     "Lake View Road, near Madipakkam Lake, Chennai", "Suresh P", 2, []),
    ("Sewage overflowing from manhole",
     "Drainage",
     "The manhole cover is broken and sewage is overflowing onto the road, "
     "especially in the mornings. Residents have to walk through it.",
     "2nd Avenue, Anna Nagar East, Chennai", "Fathima Z", 7,
     [("Acknowledged", "Sewerage maintenance crew scheduled.", 10),
      ("In Progress", "Jetting machine deployed; manhole cover replacement pending.", 40)]),
    ("Streetlight flickering near park entrance",
     "Streetlights",
     "The light at the park entrance keeps flickering on and off all night.",
     "Natesan Park, T. Nagar, Chennai", "Ganesh B", 1, []),
    ("Leaking overhead water tank in public school",
     "Water Leakage",
     "The overhead tank at the government school is leaking continuously and the "
     "wall below has started developing cracks and moss.",
     "Panchayat Union School, Ponneri Road, Gummidipoondi", "Meena R", 18,
     [("Acknowledged", "Panchayat engineer informed.", 30),
      ("Resolved", "Tank outlet valve replaced and walls sealed.", 200)]),
    ("Fallen tree branch blocking footpath",
     "Other",
     "A large branch fell during last night's wind and is blocking the entire footpath. "
     "Pedestrians are forced to walk on the road.",
     "Cathedral Road, near Music Academy, Chennai", "Rahul J", 3,
     [("Acknowledged", "Parks department notified for removal.", 5)]),
    ("Potholes along service road near toll plaza",
     "Roads & Potholes",
     "Multiple potholes along the service lane make it difficult for buses and "
     "auto-rickshaws. Traffic slows down badly during peak hours.",
     "Service Road, near Nallur Toll Plaza, Chennai–Kolkata Highway", "Venkat S", 5, []),
]


def seed_sample_data(conn):
    """Insert sample data exactly once. Uses the app_meta table as a guard so
    restarting the server never creates duplicate seed records."""
    already = conn.execute("SELECT value FROM app_meta WHERE key = 'seeded'").fetchone()
    if already:
        return False

    base = utc_now().replace(minute=0, second=0, microsecond=0)
    for (title, cat, desc, loc, reporter, days_ago, history) in SEED_REPORTS:
        created = base - timedelta(days=days_ago, hours=3)
        rid = insert_report(conn, title, cat, desc, loc, reporter, None, now_iso(created))
        for status, note, hours_after in history:
            add_status_update(conn, rid, status, note, "Municipal Desk (demo)",
                              now_iso(created + timedelta(hours=hours_after)))

    conn.execute("INSERT INTO app_meta (key, value) VALUES ('seeded', ?)", (now_iso(),))
    return True


def init_db():
    """Create tables (if missing) and seed sample data (only on first run)."""
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        seeded = seed_sample_data(conn)
        conn.commit()
        return seeded
    finally:
        conn.close()


if __name__ == "__main__":
    if "--reset" in sys.argv and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Deleted {DB_PATH}")
    seeded = init_db()
    print("Database ready at", DB_PATH)
    print("Sample data inserted." if seeded else "Sample data already present - skipped.")
