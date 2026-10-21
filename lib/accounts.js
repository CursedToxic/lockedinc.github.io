/* Player profiles.
 *
 * Profiles live on this device: each one owns its own XP, runs and per-node
 * best scores, and the app plays as whichever profile is active. There is no
 * password and no server — switching profile is a local action, so treat these
 * as named save slots rather than authenticated accounts.
 *
 * Plain data only — loaded directly by the browser as an ES module.
 */

export const ACCOUNTS_KEY = "se-bootcamp-accounts-v1";
const LEGACY_PROGRESS_KEY = "se-bootcamp-progress-v2";

export const PROFILE_COLOURS = [
  "#7ee787", "#79c0ff", "#ffa657", "#ff7b72",
  "#d2a8ff", "#f2cc60", "#56d4dd", "#ff9bce",
];

export const MAX_NAME_LENGTH = 18;

export function emptyProgress() {
  return { xp: 0, runs: 0, best: {} };
}

function newId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function cleanName(name) {
  return String(name || "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export function makeAccount(name, colour) {
  return {
    id: newId(),
    name: cleanName(name) || "player",
    colour: colour || PROFILE_COLOURS[0],
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    progress: emptyProgress(),
  };
}

/* The page supplies an async window.storage shim; fall back to localStorage so
   the profile system still works if that shim is missing. */
async function readRaw(key) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const res = await window.storage.get(key, false);
      if (res && res.value) return res.value;
    }
  } catch (e) {
    /* fall through to localStorage */
  }
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

async function writeRaw(key, value) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(key, value, false);
      return;
    }
  } catch (e) {
    /* fall through to localStorage */
  }
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* storage unavailable — state stays in memory for this session */
  }
}

function normalise(state) {
  const accounts = (state.accounts || [])
    .filter((a) => a && a.id)
    .map((a) => ({
      id: a.id,
      name: cleanName(a.name) || "player",
      colour: a.colour || PROFILE_COLOURS[0],
      createdAt: a.createdAt || Date.now(),
      lastPlayed: a.lastPlayed || a.createdAt || Date.now(),
      progress: {
        xp: Math.max(0, Math.floor((a.progress && a.progress.xp) || 0)),
        runs: Math.max(0, Math.floor((a.progress && a.progress.runs) || 0)),
        best: (a.progress && a.progress.best) || {},
      },
    }));
  const activeId = accounts.some((a) => a.id === state.activeId)
    ? state.activeId
    : accounts.length
      ? accounts[0].id
      : null;
  return { accounts, activeId };
}

/**
 * Loads saved profiles, migrating a pre-profiles save into the first profile so
 * nobody loses progress recorded before accounts existed.
 */
export async function loadAccountState() {
  const raw = await readRaw(ACCOUNTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.accounts)) return normalise(parsed);
    } catch (e) {
      /* corrupt save — fall through to migration/empty */
    }
  }

  const legacy = await readRaw(LEGACY_PROGRESS_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (parsed && (parsed.xp || parsed.runs || parsed.best)) {
        const account = makeAccount("player one", PROFILE_COLOURS[0]);
        account.progress = { ...emptyProgress(), ...parsed };
        return normalise({ accounts: [account], activeId: account.id });
      }
    } catch (e) {
      /* no usable legacy save */
    }
  }

  return { accounts: [], activeId: null };
}

export async function saveAccountState(state) {
  await writeRaw(ACCOUNTS_KEY, JSON.stringify(state));
}

export function activeAccount(state) {
  if (!state || !state.activeId) return null;
  return state.accounts.find((a) => a.id === state.activeId) || null;
}

export function addAccount(state, name, colour) {
  const account = makeAccount(name, colour);
  return { accounts: [...state.accounts, account], activeId: account.id };
}

export function switchAccount(state, id) {
  if (!state.accounts.some((a) => a.id === id)) return state;
  return { ...state, activeId: id };
}

export function renameAccount(state, id, name) {
  const clean = cleanName(name);
  if (!clean) return state;
  return {
    ...state,
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, name: clean } : a)),
  };
}

export function recolourAccount(state, id, colour) {
  return {
    ...state,
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, colour } : a)),
  };
}

export function removeAccount(state, id) {
  const accounts = state.accounts.filter((a) => a.id !== id);
  const activeId = state.activeId === id ? (accounts[0] ? accounts[0].id : null) : state.activeId;
  return { accounts, activeId };
}

export function setProgress(state, id, progress) {
  return {
    ...state,
    accounts: state.accounts.map((a) =>
      a.id === id ? { ...a, progress, lastPlayed: Date.now() } : a
    ),
  };
}

/** Summary figures used by the profile list, the header and the leaderboard. */
export function accountStats(account) {
  const best = Object.values((account && account.progress && account.progress.best) || {});
  const cleared = best.filter((b) => b && b.stars > 0).length;
  const stars = best.reduce((n, b) => n + ((b && b.stars) || 0), 0);
  const correct = best.reduce((n, b) => n + ((b && b.correct) || 0), 0);
  const answered = best.reduce((n, b) => n + ((b && b.total) || 0), 0);
  return {
    xp: (account && account.progress && account.progress.xp) || 0,
    runs: (account && account.progress && account.progress.runs) || 0,
    cleared,
    stars,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
  };
}

export function initials(name) {
  const parts = cleanName(name).split(" ").filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
