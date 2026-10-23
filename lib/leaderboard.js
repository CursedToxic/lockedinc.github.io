/* Leaderboard.
 *
 * Two boards are supported:
 *   - the device board, built from the profiles saved in this browser, which
 *     always works and needs no setup;
 *   - the global board, which needs a database because GitHub Pages only
 *     serves static files and cannot store anyone's score.
 *
 * The global board talks to a Supabase REST table (or anything that speaks the
 * same REST dialect) using a project URL and its public anon key, both pasted
 * in the app's leaderboard settings and kept in this browser only. The anon key
 * is a publishable key, but it is only safe to expose when row-level security
 * is switched on, so create the table like this:
 *
 *   create table leaderboard (
 *     player_id   text primary key,
 *     name        text not null,
 *     xp          integer not null default 0,
 *     level       integer not null default 1,
 *     title       text,
 *     cleared     integer not null default 0,
 *     stars       integer not null default 0,
 *     accuracy    integer not null default 0,
 *     runs        integer not null default 0,
 *     updated_at  timestamptz not null default now()
 *   );
 *   alter table leaderboard enable row level security;
 *   create policy "read all"  on leaderboard for select using (true);
 *   create policy "write own" on leaderboard for insert with check (true);
 *   create policy "update own" on leaderboard for update using (true);
 *
 * Anyone with the page can then post a score, so treat the global board as a
 * friendly scoreboard rather than a trusted ranking.
 *
 * Plain data only — loaded directly by the browser as an ES module.
 */

/* A second source needs no database at all: leaderboard.json ships with the
 * site and is fetched and parsed with res.json() on every visit.
 *
 *   { "updated": "2026-10-23T00:00:00.000Z", "entries": [ { ...row }, ... ] }
 *
 * A static host can serve that file but nothing in the browser can write back
 * to it, so the board offers "download leaderboard.json": it merges the scores
 * on screen with your own, hands you the finished file, and you commit it to
 * the repo to publish it. Use the Supabase source instead when scores need to
 * appear without a commit.
 */

export const LEADERBOARD_CONFIG_KEY = "se-bootcamp-leaderboard-v1";

/* The same board also ships as data.db, a real SQLite file, so anything that
 * would rather run SQL than parse JSON can read it — including this app, which
 * opens it in the browser through sql.js. Reading it costs a WebAssembly
 * download, so it stays switched off until someone asks for it; the JSON file
 * is the default source. tools/sync_leaderboard.py keeps the two in step.
 */
const SQLJS_VERSION = "1.11.0";
const SQLJS_MODULE = `https://esm.sh/sql.js@${SQLJS_VERSION}`;
const SQLJS_ASSETS = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`;

export const DEFAULT_CONFIG = {
  url: "",
  key: "",
  table: "leaderboard",
  autoPublish: true,
  useFile: true,
  filePath: "leaderboard.json",
  useDb: false,
  dbPath: "data.db",
};

export function loadLeaderboardConfig() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveLeaderboardConfig(config) {
  try {
    localStorage.setItem(LEADERBOARD_CONFIG_KEY, JSON.stringify(config || DEFAULT_CONFIG));
  } catch (e) {
    /* config stays in memory for this session */
  }
}

/** True when the Supabase source can be used. */
export function isConfigured(config) {
  return Boolean(config && config.url && config.key);
}

/** True when the bundled JSON file should be read. */
export function fileEnabled(config) {
  return Boolean(config && config.useFile !== false);
}

/** True when the SQLite mirror should be read. */
export function dbEnabled(config) {
  return Boolean(config && config.useDb);
}

function baseUrl(config) {
  const trimmed = String(config.url || "").trim().replace(/\/+$/, "");
  return /\/rest\/v1$/.test(trimmed) ? trimmed : `${trimmed}/rest/v1`;
}

function headers(config, extra) {
  return {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  };
}

async function failure(res) {
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 200);
  } catch (e) {
    /* body already consumed or unreadable */
  }
  return new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
}

/** Builds the row published for a profile. */
export function entryForAccount(account, stats, level) {
  return {
    player_id: account.id,
    name: account.name,
    xp: stats.xp,
    level: level.number,
    title: level.title,
    cleared: stats.cleared,
    stars: stats.stars,
    accuracy: stats.accuracy,
    runs: stats.runs,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchScores(config, limit = 50) {
  if (!isConfigured(config)) throw new Error("Leaderboard is not configured");
  const table = encodeURIComponent(config.table || DEFAULT_CONFIG.table);
  const url = `${baseUrl(config)}/${table}?select=*&order=xp.desc&limit=${limit}`;
  const res = await fetch(url, { headers: headers(config) });
  if (!res.ok) throw await failure(res);
  const rows = await res.json();
  return Array.isArray(rows) ? rows.map(normaliseEntry) : [];
}

export async function publishScore(config, entry) {
  if (!isConfigured(config)) throw new Error("Leaderboard is not configured");
  const table = encodeURIComponent(config.table || DEFAULT_CONFIG.table);
  const url = `${baseUrl(config)}/${table}?on_conflict=player_id`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(config, { Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify([entry]),
  });
  if (!res.ok) throw await failure(res);
  return true;
}

/**
 * Reads the JSON file that ships with the site. The page itself may be running
 * from a blob URL, so the path is resolved against the document, and the query
 * string keeps a CDN from serving yesterday's board.
 */
export async function fetchFileScores(config) {
  const path = (config && config.filePath) || DEFAULT_CONFIG.filePath;
  const base = typeof location !== "undefined" ? location.href : undefined;
  const url = new URL(path, base);
  url.searchParams.set("v", Date.now().toString(36));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw await failure(res);
  const data = await res.json();
  const rows = Array.isArray(data) ? data : (data && data.entries) || [];
  return rows.map(normaliseEntry);
}

/* sql.js is a WebAssembly build of SQLite. It is pulled in on first use only,
   and the promise is kept so a second read reuses the loaded runtime. */
let sqlRuntime = null;

function loadSqlRuntime() {
  if (!sqlRuntime) {
    sqlRuntime = import(/* @vite-ignore */ SQLJS_MODULE)
      .then((module) => (module.default || module)({ locateFile: (file) => SQLJS_ASSETS + file }))
      .catch((e) => {
        sqlRuntime = null; // let a later attempt retry rather than cache the failure
        throw new Error(`Could not load the SQLite reader — ${e && e.message ? e.message : e}`);
      });
  }
  return sqlRuntime;
}

const DB_COLUMNS = [
  "player_id", "name", "xp", "level", "title",
  "cleared", "stars", "accuracy", "runs", "updated_at",
];

const DB_SCHEMA = `
CREATE TABLE leaderboard (
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
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE INDEX leaderboard_xp ON leaderboard (xp DESC);
`;

/** Reads the board out of the SQLite mirror that ships with the site. */
export async function fetchDbScores(config) {
  const path = (config && config.dbPath) || DEFAULT_CONFIG.dbPath;
  const base = typeof location !== "undefined" ? location.href : undefined;
  const url = new URL(path, base);
  url.searchParams.set("v", Date.now().toString(36));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw await failure(res);

  const bytes = new Uint8Array(await res.arrayBuffer());
  const SQL = await loadSqlRuntime();
  const db = new SQL.Database(bytes);
  try {
    const result = db.exec(`SELECT ${DB_COLUMNS.join(", ")} FROM leaderboard`);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map((row) => {
      const entry = {};
      columns.forEach((column, i) => { entry[column] = row[i]; });
      return normaliseEntry(entry);
    });
  } finally {
    db.close();
  }
}

/** Builds a data.db holding exactly what buildFile() would put in the JSON. */
export async function buildDbFile(entries) {
  const SQL = await loadSqlRuntime();
  const db = new SQL.Database();
  try {
    db.run(DB_SCHEMA);
    const insert = db.prepare(
      `INSERT OR REPLACE INTO leaderboard (${DB_COLUMNS.join(", ")}) VALUES (${DB_COLUMNS.map(() => "?").join(", ")})`
    );
    for (const entry of rankEntries(entries)) {
      insert.run(DB_COLUMNS.map((column) => (entry[column] === undefined ? null : entry[column])));
    }
    insert.free();
    db.run("INSERT INTO meta (key, value) VALUES ('updated', ?)", [new Date().toISOString()]);
    return db.export();
  } finally {
    db.close();
  }
}

export async function downloadDb(entries, filename) {
  const bytes = await buildDbFile(entries);
  const blob = new Blob([bytes], { type: "application/vnd.sqlite3" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || DEFAULT_CONFIG.dbPath.split("/").pop() || "data.db";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Combines boards, keeping one row per player — the best score wins. */
export function mergeEntries(...lists) {
  const byPlayer = new Map();
  for (const list of lists) {
    for (const row of list || []) {
      const key = row.player_id || `name:${row.name}`;
      const current = byPlayer.get(key);
      if (!current || row.xp > current.xp) byPlayer.set(key, { ...current, ...row });
    }
  }
  return rankEntries([...byPlayer.values()]);
}

/** The contents of a publishable leaderboard.json. */
export function buildFile(entries) {
  return JSON.stringify(
    {
      updated: new Date().toISOString(),
      entries: rankEntries(entries).map(({ colour, ...row }) => row),
    },
    null,
    2
  ) + "\n";
}

/** Hands the finished file to the browser as a download. */
export function downloadFile(entries, filename) {
  const blob = new Blob([buildFile(entries)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || DEFAULT_CONFIG.filePath.split("/").pop() || "leaderboard.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function normaliseEntry(row) {
  return {
    player_id: row.player_id || row.id || "",
    name: row.name || "player",
    xp: Number(row.xp) || 0,
    level: Number(row.level) || 1,
    title: row.title || "",
    cleared: Number(row.cleared) || 0,
    stars: Number(row.stars) || 0,
    accuracy: Number(row.accuracy) || 0,
    runs: Number(row.runs) || 0,
    updated_at: row.updated_at || null,
  };
}

/** Highest XP first, then nodes cleared, then accuracy, then name. */
export function rankEntries(entries) {
  return [...entries].sort((a, b) =>
    b.xp - a.xp ||
    b.cleared - a.cleared ||
    b.accuracy - a.accuracy ||
    String(a.name).localeCompare(String(b.name))
  );
}
