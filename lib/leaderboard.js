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

export const LEADERBOARD_CONFIG_KEY = "se-bootcamp-leaderboard-v1";

export const DEFAULT_CONFIG = { url: "", key: "", table: "leaderboard", autoPublish: true };

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
    if (config && config.url && config.key) {
      localStorage.setItem(LEADERBOARD_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(LEADERBOARD_CONFIG_KEY);
    }
  } catch (e) {
    /* config stays in memory for this session */
  }
}

export function isConfigured(config) {
  return Boolean(config && config.url && config.key);
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
