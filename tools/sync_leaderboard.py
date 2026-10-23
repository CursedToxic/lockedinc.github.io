#!/usr/bin/env python3
"""Keep data.db and leaderboard.json holding the same leaderboard.

The site ships the board twice: leaderboard.json for anything that just wants
to read it, and data.db for anything that would rather run SQL over it. They
must agree, so this script rebuilds one from the other.

    python3 tools/sync_leaderboard.py             # leaderboard.json -> data.db
    python3 tools/sync_leaderboard.py --from-db   # data.db -> leaderboard.json
    python3 tools/sync_leaderboard.py --check     # verify both match, exit 1 if not

Run it after dropping in a board exported from the app, so whichever file you
replaced is mirrored into the other before you commit.
"""

import argparse
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(ROOT, "leaderboard.json")
DB_PATH = os.path.join(ROOT, "data.db")

COLUMNS = [
    "player_id", "name", "xp", "level", "title",
    "cleared", "stars", "accuracy", "runs", "updated_at",
]
INTEGER_COLUMNS = {"xp", "level", "cleared", "stars", "accuracy", "runs"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS leaderboard (
    player_id  TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    xp         INTEGER NOT NULL DEFAULT 0,
    level      INTEGER NOT NULL DEFAULT 1,
    title      TEXT,
    cleared    INTEGER NOT NULL DEFAULT 0,
    stars      INTEGER NOT NULL DEFAULT 0,
    accuracy   INTEGER NOT NULL DEFAULT 0,
    runs       INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE INDEX IF NOT EXISTS leaderboard_xp ON leaderboard (xp DESC);
"""


def normalise(entry):
    row = {}
    for column in COLUMNS:
        value = entry.get(column)
        if column in INTEGER_COLUMNS:
            try:
                row[column] = int(value or 0)
            except (TypeError, ValueError):
                row[column] = 0
        elif column == "name":
            row[column] = str(value or "player")
        elif column == "player_id":
            row[column] = str(value or "")
        else:
            row[column] = None if value is None else str(value)
    return row


def rank(entries):
    """Same order the app uses: XP, then nodes cleared, then accuracy, then name."""
    return sorted(
        entries,
        key=lambda e: (-e["xp"], -e["cleared"], -e["accuracy"], e["name"].lower()),
    )


def read_json(path):
    if not os.path.exists(path):
        return "", []
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, list):
        return "", rank([normalise(e) for e in data])
    entries = data.get("entries") or []
    return data.get("updated") or "", rank([normalise(e) for e in entries])


def write_json(path, updated, entries):
    payload = {"updated": updated, "entries": rank(entries)}
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def read_db(path):
    if not os.path.exists(path):
        return "", []
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute(
            "SELECT %s FROM leaderboard" % ", ".join(COLUMNS)
        ).fetchall()
        entries = rank([normalise(dict(row)) for row in rows])
        updated_row = connection.execute(
            "SELECT value FROM meta WHERE key = 'updated'"
        ).fetchone()
        return (updated_row["value"] if updated_row else ""), entries
    finally:
        connection.close()


def write_db(path, updated, entries):
    # Rebuild from scratch so a removed player never lingers in the mirror.
    if os.path.exists(path):
        os.remove(path)
    connection = sqlite3.connect(path)
    try:
        connection.executescript(SCHEMA)
        connection.executemany(
            "INSERT INTO leaderboard (%s) VALUES (%s)"
            % (", ".join(COLUMNS), ", ".join(["?"] * len(COLUMNS))),
            [tuple(entry[column] for column in COLUMNS) for entry in rank(entries)],
        )
        connection.execute(
            "INSERT INTO meta (key, value) VALUES ('updated', ?)", (updated,)
        )
        connection.commit()
    finally:
        connection.close()


def now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--from-db", action="store_true", help="rebuild leaderboard.json from data.db")
    parser.add_argument("--check", action="store_true", help="report whether the two already match")
    parser.add_argument("--json", default=JSON_PATH)
    parser.add_argument("--db", default=DB_PATH)
    args = parser.parse_args()

    json_updated, json_entries = read_json(args.json)
    db_updated, db_entries = read_db(args.db)

    if args.check:
        if json_entries == db_entries:
            print(f"in sync — {len(json_entries)} entries in both")
            return 0
        print("OUT OF SYNC", file=sys.stderr)
        print(f"  {os.path.basename(args.json)}: {len(json_entries)} entries", file=sys.stderr)
        print(f"  {os.path.basename(args.db)}: {len(db_entries)} entries", file=sys.stderr)
        only_json = {e["player_id"] for e in json_entries} - {e["player_id"] for e in db_entries}
        only_db = {e["player_id"] for e in db_entries} - {e["player_id"] for e in json_entries}
        if only_json:
            print(f"  only in json: {', '.join(sorted(only_json))}", file=sys.stderr)
        if only_db:
            print(f"  only in db:   {', '.join(sorted(only_db))}", file=sys.stderr)
        print("  run tools/sync_leaderboard.py to rebuild one from the other", file=sys.stderr)
        return 1

    if args.from_db:
        write_json(args.json, db_updated or now(), db_entries)
        print(f"wrote {os.path.relpath(args.json, ROOT)} — {len(db_entries)} entries from data.db")
    else:
        write_db(args.db, json_updated or now(), json_entries)
        print(f"wrote {os.path.relpath(args.db, ROOT)} — {len(json_entries)} entries from leaderboard.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
