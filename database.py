import sqlite3
import json
from datetime import datetime

DB_NAME = "history.db"


# ==========================================
# DATABASE CONNECTION
# ==========================================


# Establish database connection
# Establish database connection with timeout and WAL mode
def get_connection():
    conn = sqlite3.connect(DB_NAME, timeout=20.0)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=5000;")
    except Exception:
        pass
    return conn


# Initialize SQLite table schema
def initialize_database():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_history (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        created_at TEXT,

        analysis_name TEXT,

        before_version TEXT,

        after_version TEXT,

        data_source TEXT,

        change_description TEXT,

        analysis_json TEXT

    )
    """)

    conn.commit()
    conn.close()


# Save completed analysis result and metadata to SQLite
def save_analysis(context, analysis):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO analysis_history (

            created_at,
            analysis_name,
            before_version,
            after_version,
            data_source,
            change_description,
            analysis_json

        )

        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            datetime.now().isoformat(),
            context.get("analysis_name", ""),
            context.get("before_version", ""),
            context.get("after_version", ""),
            context.get("data_source", ""),
            context.get("change_description", ""),
            json.dumps(analysis),
        ),
    )

    # Get the ID of the inserted row
    analysis_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return analysis_id


# Fetch all deployment history records ordered by newest first
def get_history():

    conn = get_connection()
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM analysis_history
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    history = []

    for row in rows:

        item = dict(row)
        analysis_raw = item.pop("analysis_json", None)

        try:
            item["analysis"] = json.loads(analysis_raw) if analysis_raw else {}
        except Exception:
            item["analysis"] = {}

        history.append(item)

    return history


# Delete single deployment record by ID
def delete_analysis(record_id):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("DELETE FROM analysis_history WHERE id=?", (record_id,))

    conn.commit()

    conn.close()


# Clear all saved deployment records
def clear_history():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("DELETE FROM analysis_history")

    conn.commit()

    conn.close()
