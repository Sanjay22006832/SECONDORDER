import sqlite3
import json
from datetime import datetime

DB_NAME = "history.db"


# ==========================================
# DATABASE CONNECTION
# ==========================================


def get_connection():
    return sqlite3.connect(DB_NAME)


# ==========================================
# CREATE TABLE
# ==========================================


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


# ==========================================
# SAVE ANALYSIS
# ==========================================


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


# ==========================================
# GET HISTORY
# ==========================================


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

        item["analysis"] = json.loads(item.pop("analysis_json"))

        history.append(item)

    return history


# ==========================================
# DELETE HISTORY
# ==========================================


def delete_analysis(record_id):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("DELETE FROM analysis_history WHERE id=?", (record_id,))

    conn.commit()

    conn.close()


# ==========================================
# CLEAR HISTORY
# ==========================================


def clear_history():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("DELETE FROM analysis_history")

    conn.commit()

    conn.close()
