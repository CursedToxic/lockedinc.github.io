#!/usr/bin/env python3
"""Serve the app with a writable leaderboard.

GitHub Pages can only hand out files, so a page served from there cannot change
leaderboard.json or data.db. This server can: it serves the same static files
and accepts the board writes the app sends, updating BOTH files on disk so they
stay mirrors of each other.

    python3 tools/serve.py            # http://localhost:8000
    python3 tools/serve.py --port 9000

Endpoints beyond the static files:

    POST /api/leaderboard   one entry as JSON -> merged into leaderboard.json
                            and data.db, returns the updated board
    GET  /api/leaderboard   the current board as JSON

Registering a player or finishing a run in the app calls that POST, so both
files are up to date the moment it happens. Served from anywhere read-only, the
app falls back to keeping the board in the browser and offering the two files
as downloads to commit by hand.
"""

import argparse
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sync_leaderboard as sync  # noqa: E402  (path set above)

MAX_BODY = 64 * 1024


def merge_entry(entries, entry):
    """Adds or updates one player, keeping their best score."""
    merged = []
    replaced = False
    for existing in entries:
        if existing["player_id"] == entry["player_id"]:
            replaced = True
            merged.append(entry if entry["xp"] >= existing["xp"] else existing)
        else:
            merged.append(existing)
    if not replaced:
        merged.append(entry)
    return sync.rank(merged)


class Handler(SimpleHTTPRequestHandler):
    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # The app is reloaded constantly while developing; never serve a stale copy.
        if self.path.endswith((".js", ".jsx", ".json", ".db", ".html")):
            self.send_header("Cache-Control", "no-store")
        SimpleHTTPRequestHandler.end_headers(self)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/leaderboard":
            updated, entries = sync.read_json(sync.JSON_PATH)
            self._json(200, {"updated": updated, "entries": entries})
            return
        SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path.split("?")[0] != "/api/leaderboard":
            self._json(404, {"error": "unknown endpoint"})
            return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"error": "body must be between 1 byte and 64KB"})
            return

        try:
            payload = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeDecodeError):
            self._json(400, {"error": "body must be JSON"})
            return

        rows = payload if isinstance(payload, list) else [payload]
        if not rows or not all(isinstance(r, dict) and r.get("player_id") for r in rows):
            self._json(400, {"error": "each entry needs a player_id"})
            return

        _, entries = sync.read_json(sync.JSON_PATH)
        for row in rows:
            entries = merge_entry(entries, sync.normalise(row))

        updated = sync.now()
        sync.write_json(sync.JSON_PATH, updated, entries)
        sync.write_db(sync.DB_PATH, updated, entries)

        names = ", ".join(r.get("name", "?") for r in rows)
        print(f"  leaderboard.json + data.db updated — {names} ({len(entries)} players)", flush=True)
        self._json(200, {"updated": updated, "entries": entries})

    def log_message(self, fmt, *args):
        # Routine static hits are noise; board writes and any error are not.
        # (fmt % args is used because log_error passes an int status code.)
        message = fmt % args
        if "/api/" in message or "code 4" in message or "code 5" in message:
            sys.stderr.write(f"{self.log_date_time_string()} {message}\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    os.chdir(sync.ROOT)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"se//bootcamp serving {sync.ROOT}")
    print(f"  open http://{args.host}:{args.port}/")
    print("  leaderboard writes land in leaderboard.json and data.db")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
