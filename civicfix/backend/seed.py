"""
seed.py - Initialise the CivicFix database and insert sample reports.

    python seed.py           # safe to run any number of times; seeds only once
    python seed.py --reset   # wipe the database (and uploaded photos) and re-seed
"""
import os
import sys

from database import DB_PATH, init_db

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

if __name__ == "__main__":
    if "--reset" in sys.argv:
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
            print("Deleted old database.")
        for name in os.listdir(UPLOAD_DIR) if os.path.isdir(UPLOAD_DIR) else []:
            if name != ".gitkeep":
                os.remove(os.path.join(UPLOAD_DIR, name))
        print("Cleared uploaded photos.")
    seeded = init_db()
    print("Database ready:", DB_PATH)
    print("Sample reports inserted." if seeded else "Sample reports already exist - nothing added.")
