import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal, GitBranch, GitCommit, GitMerge, Cpu, Shield, Globe, Bot,
  FolderGit2, Braces, ChevronRight, RotateCcw, Trophy, Zap, Activity,
  CheckCircle2, XCircle, Lock, Star, ArrowLeft, Sparkles, Clock, Check,
  Settings, Eye, EyeOff, Upload, FileText, X, Loader2,
  Users, UserPlus, Crown, Trash2, RefreshCw, Pencil, Medal, Database
} from "lucide-react";
import { levelForXp, MAX_LEVEL } from "./lib/levels.js";
import {
  loadAccountState, saveAccountState, activeAccount, addAccount, switchAccount,
  renameAccount, recolourAccount, removeAccount, setProgress, accountStats,
  emptyProgress, initials, cleanName, PROFILE_COLOURS, MAX_NAME_LENGTH,
  hasPassword, setAccountAuth, hashPassword, verifyPassword, passwordProblem,
  cryptoAvailable, MIN_PASSWORD_LENGTH,
} from "./lib/accounts.js";
import {
  loadLeaderboardConfig, saveLeaderboardConfig, isConfigured, fileEnabled, dbEnabled,
  fetchScores, fetchFileScores, fetchDbScores, publishScore, entryForAccount,
  rankEntries, mergeEntries, downloadFile, downloadDb, DEFAULT_CONFIG,
} from "./lib/leaderboard.js";
import { programmingFundamentalsNodes } from "./questions/programming-fundamentals.js";
import { objectOrientedParadigmNodes } from "./questions/object-oriented-paradigm.js";
import { programmingMechatronicsNodes } from "./questions/programming-mechatronics.js";
import { secureSoftwareArchitectureNodes } from "./questions/secure-software-architecture.js";
import { programmingForTheWebNodes } from "./questions/programming-for-the-web.js";
import { softwareAutomationNodes } from "./questions/software-automation.js";
import { softwareEngineeringProjectNodes } from "./questions/software-engineering-project.js";

/* ------------------------------------------------------------------ */
/*  CONTENT — NSW Software Engineering 11–12 Syllabus, skill-tree bank */
/*  Each module is a small tree of nodes (subtopics). Nodes unlock     */
/*  in order as you clear the one before them.                         */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    id: "prog-fund",
    year: 11,
    title: "Programming Fundamentals",
    file: "fundamentals.py",
    accent: "#7ee787",
    icon: Terminal,
    blurb: "SDLC, algorithms, data types & debugging.",
    nodes: programmingFundamentalsNodes,
  },
  {
    id: "oop",
    year: 11,
    title: "The Object-Oriented Paradigm",
    file: "oop.class",
    accent: "#79c0ff",
    icon: Braces,
    blurb: "Objects, classes, inheritance & testing.",
    nodes: objectOrientedParadigmNodes,
  },
  {
    id: "mecha",
    year: 11,
    title: "Programming Mechatronics",
    file: "mechatronics.ino",
    accent: "#ffa657",
    icon: Cpu,
    blurb: "Sensors, actuators & control systems.",
    nodes: programmingMechatronicsNodes,
  },
  {
    id: "secure-arch",
    year: 12,
    title: "Secure Software Architecture",
    file: "security.conf",
    accent: "#ff7b72",
    icon: Shield,
    blurb: "CIA triad, secure coding, attack vectors & impact.",
    nodes: secureSoftwareArchitectureNodes,
  },
  {
    id: "web",
    year: 12,
    title: "Programming for the Web",
    file: "webapp.js",
    accent: "#d2a8ff",
    icon: Globe,
    blurb: "Protocols, front/back-end, databases & standards.",
    nodes: programmingForTheWebNodes,
  },
  {
    id: "automation",
    year: 12,
    title: "Software Automation",
    file: "model.ml",
    accent: "#f2cc60",
    icon: Bot,
    blurb: "ML models, algorithms & coding them in OOP.",
    nodes: softwareAutomationNodes,
  },
  {
    id: "project",
    year: 12,
    title: "Software Engineering Project",
    file: "project.plan",
    accent: "#56d4dd",
    icon: FolderGit2,
    blurb: "Defining, planning, building & evaluating.",
    nodes: softwareEngineeringProjectNodes,
  },
];

const API_KEY_STORAGE = "se-bootcamp-groq-key";
const AI_MODE_STORAGE = "se-bootcamp-ai-mode";
const SYLLABUS_STORAGE = "se-bootcamp-syllabus-v1";
const SYLLABUS_MAX_CHARS = 2000; // ~500 tokens — Groq's free on_demand tier caps gpt-oss-20b at 8000 tokens/min total
const AI_QUESTION_MODEL = "openai/gpt-oss-20b";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const TIME_LIMIT = 20; // seconds per question

function shuffledIndices(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/**
 * Extracts plain text from an uploaded syllabus file. Text/Markdown files are
 * read directly; PDFs are parsed page-by-page in the browser via pdf.js.
 * Truncated to SYLLABUS_MAX_CHARS to keep later prompts a bounded size/cost.
 */
async function extractTextFromFile(file) {
  let text;
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@4.7.76/build/pdf.worker.mjs";
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => it.str).join(" "));
    }
    text = pages.join("\n\n");
  } else {
    text = await file.text();
  }
  text = text.trim();
  if (!text) throw new Error("No readable text found in that file");
  if (text.length > SYLLABUS_MAX_CHARS) {
    text = text.slice(0, SYLLABUS_MAX_CHARS) + "\n\n[...truncated...]";
  }
  return text;
}

/**
 * Calls Groq's OpenAI-compatible API directly from the browser to generate a
 * fresh batch of multiple-choice questions for a node, styled after its
 * existing bank and, when provided, grounded in the user's own uploaded
 * syllabus text. Groq serves the free, open-weight gpt-oss model used here.
 * The user's own API key is stored only in localStorage and never leaves
 * their machine except in requests to Groq.
 */
async function generateAiQuestions(apiKey, mod, node, count, syllabusText) {
  count = Math.min(count, 6); // keep prompt+completion well under Groq's free-tier 8000 TPM cap
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL, dangerouslyAllowBrowser: true });

  const sample = node.questions.slice(0, 2).map((q) => ({ q: q.q, options: q.options, correct: q.correct }));

  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            q: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct: { type: "integer" },
            note: { type: "string" },
          },
          required: ["q", "options", "correct", "note"],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  };

  const prompt =
    `You are writing multiple-choice quiz questions for a NSW Year 11/12 Software Engineering syllabus study game.\n` +
    `Module: "${mod.title}" (${mod.file}). Topic/node: "${node.title}".\n\n` +
    (syllabusText
      ? `The user has uploaded their own syllabus/reference document. Treat it as the authoritative source for terminology, scope and depth whenever it covers this topic — prefer it over general knowledge where they conflict:\n"""\n${syllabusText}\n"""\n\n`
      : "") +
    `Write ${count} NEW, difficult, scenario-based multiple-choice questions on exactly this topic. ` +
    `Match the style of these existing examples but do not repeat or trivially reword them:\n` +
    JSON.stringify(sample, null, 2) +
    `\n\nRules:\n` +
    `- Each question has exactly 4 options.\n` +
    `- "correct" is the 0-indexed position of the correct option within "options".\n` +
    `- "note" is a one-sentence explanation of why that answer is correct.\n` +
    `- Questions must be accurate, unambiguous, and harder than a simple definition lookup — favour applied scenarios with plausible, non-trivial distractors.`;

  const response = await client.chat.completions.create({
    model: AI_QUESTION_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_schema", json_schema: { name: "quiz_questions", strict: true, schema } },
    max_completion_tokens: Math.min(2500, count * 200 + 250),
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Model returned no content");
  const parsed = JSON.parse(raw);
  const qs = (parsed.questions || [])
    .filter(
      (q) =>
        q &&
        typeof q.q === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correct) &&
        q.correct >= 0 &&
        q.correct < 4
    )
    .map((q) => ({ q: q.q, options: q.options, correct: q.correct, note: q.note || "" }));

  if (qs.length < 3) throw new Error("Model did not return enough usable questions");
  return qs;
}

/* Unlocked profiles are remembered for the tab, not saved — closing the tab
   or reopening the site asks for the password again. */
const UNLOCK_SESSION_KEY = "se-bootcamp-unlocked";

function loadUnlocked() {
  try {
    const raw = sessionStorage.getItem(UNLOCK_SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function rememberUnlocked(ids) {
  try {
    sessionStorage.setItem(UNLOCK_SESSION_KEY, JSON.stringify(ids));
  } catch (e) {
    /* unlock state stays in memory for this session */
  }
}

function nodeKey(moduleId, nodeId) {
  return `${moduleId}::${nodeId}`;
}

/* ------------------------------------------------------------------ */
/*  APP                                                                 */
/* ------------------------------------------------------------------ */

export default function SEBootcamp() {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState({ accounts: [], activeId: null });
  const [screen, setScreen] = useState("home"); // home | tree | quiz | result | accounts | leaderboard
  const [activeModule, setActiveModule] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [leveledUp, setLeveledUp] = useState(null);

  // which profiles have been unlocked this browsing session
  const [unlocked, setUnlocked] = useState(loadUnlocked);
  const [unlockError, setUnlockError] = useState(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  // leaderboard
  const [lbConfig, setLbConfig] = useState(DEFAULT_CONFIG);
  const [lbEntries, setLbEntries] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState(null);
  const [lbPublishedAt, setLbPublishedAt] = useState(null);

  // quiz-in-progress state
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stability, setStability] = useState(100);
  const [runXp, setRunXp] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [order, setOrder] = useState([]);
  const [runQuestions, setRunQuestions] = useState([]);

  // AI question generation
  const [apiKey, setApiKey] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [genError, setGenError] = useState(null);
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusName, setSyllabusName] = useState("");

  const saveTimer = useRef(null);
  const accountsRef = useRef(accounts);

  const account = activeAccount(accounts);
  const progress = account ? account.progress : emptyProgress();

  useEffect(() => {
    (async () => {
      try {
        const state = await loadAccountState();
        accountsRef.current = state;
        setAccounts(state);
      } catch (e) {
        /* no saved profiles yet — onboarding will create the first one */
      } finally {
        setReady(true);
      }
    })();
    try {
      setLbConfig(loadLeaderboardConfig());
      const storedKey = localStorage.getItem(API_KEY_STORAGE);
      if (storedKey) setApiKey(storedKey);
      setAiMode(localStorage.getItem(AI_MODE_STORAGE) === "1");
      const storedSyllabus = localStorage.getItem(SYLLABUS_STORAGE);
      if (storedSyllabus) {
        const parsed = JSON.parse(storedSyllabus);
        setSyllabusText(parsed.text || "");
        setSyllabusName(parsed.name || "");
      }
    } catch (e) {
      /* localStorage unavailable */
    }
  }, []);

  function saveApiKey(key) {
    setApiKey(key);
    try {
      if (key) localStorage.setItem(API_KEY_STORAGE, key);
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch (e) {
      /* ignore */
    }
  }

  function toggleAiMode(on) {
    setAiMode(on);
    try {
      localStorage.setItem(AI_MODE_STORAGE, on ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  function saveSyllabus(name, text) {
    setSyllabusName(name);
    setSyllabusText(text);
    try {
      if (text) localStorage.setItem(SYLLABUS_STORAGE, JSON.stringify({ name, text }));
      else localStorage.removeItem(SYLLABUS_STORAGE);
    } catch (e) {
      /* ignore — syllabus still usable for this session even if it can't persist */
    }
  }

  function clearSyllabus() {
    saveSyllabus("", "");
  }

  /* Every write goes through the whole profile file, so a save always records
     which profile is active as well as its progress. */
  const persistAccounts = useCallback((next) => {
    accountsRef.current = next;
    setAccounts(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAccountState(next).catch(() => {});
    }, 250);
  }, []);

  const persist = useCallback((nextProgress) => {
    const state = accountsRef.current;
    if (!state.activeId) return;
    persistAccounts(setProgress(state, state.activeId, nextProgress));
  }, [persistAccounts]);

  function markUnlocked(id) {
    setUnlocked((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      rememberUnlocked(next);
      return next;
    });
  }

  async function createAccount(name, colour, password) {
    const auth = password ? await hashPassword(password) : null;
    const next = addAccount(accountsRef.current, name, colour, auth);
    persistAccounts(next);
    markUnlocked(next.activeId);
    setScreen("home");
  }

  /* Switching only changes who is active; a profile with a password then meets
     the lock screen before any of its progress is shown. */
  function switchToAccount(id) {
    persistAccounts(switchAccount(accountsRef.current, id));
    setActiveModule(null);
    setActiveNode(null);
    setUnlockError(null);
    setScreen("home");
  }

  async function unlockAccount(id, password) {
    const target = accountsRef.current.accounts.find((a) => a.id === id);
    if (!target) return;
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      if (await verifyPassword(password, target.auth)) {
        markUnlocked(id);
        if (accountsRef.current.activeId !== id) switchToAccount(id);
      } else {
        setUnlockError("That password does not match");
      }
    } catch (e) {
      setUnlockError(e && e.message ? e.message : "Could not check that password");
    } finally {
      setUnlockBusy(false);
    }
  }

  /** Setting, changing or clearing a password; `current` is checked when one exists. */
  async function changeAccountPassword(id, current, next) {
    const target = accountsRef.current.accounts.find((a) => a.id === id);
    if (!target) return "Profile not found";
    if (hasPassword(target) && !(await verifyPassword(current, target.auth))) {
      return "Current password does not match";
    }
    const auth = next ? await hashPassword(next) : null;
    persistAccounts(setAccountAuth(accountsRef.current, id, auth));
    markUnlocked(id);
    return null;
  }

  function editAccountName(id, name) {
    persistAccounts(renameAccount(accountsRef.current, id, name));
  }

  function editAccountColour(id, colour) {
    persistAccounts(recolourAccount(accountsRef.current, id, colour));
  }

  function deleteAccount(id) {
    persistAccounts(removeAccount(accountsRef.current, id));
  }

  function saveLbSettings(config) {
    setLbConfig(config);
    saveLeaderboardConfig(config);
    setLbError(null);
    refreshLeaderboard(config);
  }

  /* Reads whichever sources are switched on — the JSON file that ships with the
     site, the Supabase table, or both — and merges them into one board. */
  const refreshLeaderboard = useCallback(async (config) => {
    const cfg = config || lbConfig;
    const sources = [];
    if (fileEnabled(cfg)) sources.push(["file", fetchFileScores(cfg)]);
    if (dbEnabled(cfg)) sources.push(["data.db", fetchDbScores(cfg)]);
    if (isConfigured(cfg)) sources.push(["shared table", fetchScores(cfg)]);
    if (!sources.length) {
      setLbEntries([]);
      return;
    }
    setLbLoading(true);
    setLbError(null);
    try {
      const settled = await Promise.allSettled(sources.map(([, p]) => p));
      const lists = [];
      const failures = [];
      settled.forEach((result, i) => {
        if (result.status === "fulfilled") lists.push(result.value);
        else failures.push(`${sources[i][0]}: ${result.reason && result.reason.message ? result.reason.message : result.reason}`);
      });
      setLbEntries(mergeEntries(...lists));
      setLbError(failures.length ? failures.join(" · ") : null);
    } finally {
      setLbLoading(false);
    }
  }, [lbConfig]);

  const publishMyScore = useCallback(async (config, who) => {
    const cfg = config || lbConfig;
    const target = who || activeAccount(accountsRef.current);
    if (!isConfigured(cfg) || !target) return;
    const stats = accountStats(target);
    try {
      await publishScore(cfg, entryForAccount(target, stats, levelForXp(stats.xp)));
      setLbPublishedAt(Date.now());
      setLbError(null);
      refreshLeaderboard(cfg);
    } catch (e) {
      setLbError(e && e.message ? e.message : "Could not publish your score");
    }
  }, [lbConfig, refreshLeaderboard]);

  function openTree(mod) {
    setActiveModule(mod);
    setScreen("tree");
  }

  function resetRunState() {
    setQIndex(0);
    setSelected(null);
    setLocked(false);
    setTimedOut(false);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setStability(100);
    setRunXp(0);
    setCrashed(false);
    setLeveledUp(null);
  }

  function beginRun(questions) {
    setRunQuestions(questions);
    setOrder(shuffledIndices(questions.length));
    setScreen("quiz");
  }

  async function startNode(mod, node) {
    setActiveModule(mod);
    setActiveNode(node);
    resetRunState();
    setGenError(null);

    if (aiMode && apiKey) {
      setScreen("generating");
      try {
        const aiQuestions = await generateAiQuestions(apiKey, mod, node, node.questions.length, syllabusText);
        beginRun(aiQuestions);
      } catch (e) {
        console.error("AI question generation failed:", e);
        const detail = e && (e.message || e.name) ? `${e.name || "Error"}: ${e.message || "(no message)"}` : "Failed to generate AI questions.";
        setGenError(detail);
        beginRun(node.questions);
      }
      return;
    }

    beginRun(node.questions);
  }

  function answer(optionIdx, isTimeout) {
    if (locked || crashed) return;
    const qi = order[qIndex];
    const question = runQuestions[qi];
    const isCorrect = !isTimeout && optionIdx === question.correct;
    setSelected(isTimeout ? -1 : optionIdx);
    setLocked(true);
    setTimedOut(!!isTimeout);

    if (isCorrect) {
      const newStreak = streak + 1;
      const bonus = Math.min(newStreak - 1, 5) * 3;
      const gained = 10 + bonus;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      setRunXp((x) => x + gained);
    } else {
      setStreak(0);
      setStability((s) => {
        const next = Math.max(0, s - 34);
        if (next === 0) setCrashed(true);
        return next;
      });
    }
  }

  function nextQuestion() {
    if (crashed || qIndex + 1 >= order.length) {
      finishRun();
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setLocked(false);
    setTimedOut(false);
  }

  function finishRun() {
    const total = order.length;
    const pctScore = Math.round((correctCount / total) * 100);
    const stars = pctScore === 100 ? 3 : pctScore >= 70 ? 2 : pctScore >= 40 ? 1 : 0;
    const key = nodeKey(activeModule.id, activeNode.id);
    const prevBest = progress.best[key];
    // A crashed run must never create or improve a best-record for this node —
    // otherwise the next node in the tree would unlock off a failed attempt.
    const best = crashed
      ? progress.best
      : {
          ...progress.best,
          [key]: !prevBest || pctScore > prevBest.pct
            ? { pct: pctScore, stars, correct: correctCount, total }
            : prevBest,
        };
    const next = {
      xp: progress.xp + runXp,
      runs: (progress.runs || 0) + 1,
      best,
    };
    const before = levelForXp(progress.xp);
    const after = levelForXp(next.xp);
    setLeveledUp(after.number > before.number ? after : null);
    persist(next);
    if (account && lbConfig.autoPublish && isConfigured(lbConfig)) {
      publishMyScore(lbConfig, { ...account, progress: next });
    }
    setScreen("result");
  }

  function backToTree() {
    setScreen("tree");
    setActiveNode(null);
  }

  function backHome() {
    setScreen("home");
    setActiveModule(null);
    setActiveNode(null);
  }

  async function resetProgress() {
    persist(emptyProgress());
  }

  function openLeaderboard() {
    setScreen("leaderboard");
    refreshLeaderboard();
  }

  /* The board you can see, plus your own score, in whichever format you ask for.
     Both carry the same rows so the two files stay mirrors of each other. */
  function boardWithMyScore() {
    const mine = account
      ? [entryForAccount(account, accountStats(account), levelForXp(accountStats(account).xp))]
      : [];
    return mergeEntries(lbEntries, mine);
  }

  function exportLeaderboard() {
    downloadFile(boardWithMyScore(), (lbConfig.filePath || DEFAULT_CONFIG.filePath).split("/").pop());
  }

  async function exportLeaderboardDb() {
    try {
      setLbError(null);
      await downloadDb(boardWithMyScore(), (lbConfig.dbPath || DEFAULT_CONFIG.dbPath).split("/").pop());
    } catch (e) {
      setLbError(e && e.message ? e.message : "Could not build data.db");
    }
  }

  if (!ready) {
    return (
      <div style={S.appShell}>
        <div style={{ ...S.mono, color: "#7d8590", fontSize: 13 }}>booting se//bootcamp …</div>
      </div>
    );
  }

  /* No profile yet (first visit, or every profile deleted) — ask for one before
     any progress can be recorded against it. */
  if (!account) {
    return (
      <div style={S.appShell}>
        <OnboardingScreen onCreate={createAccount} />
      </div>
    );
  }

  /* The active profile is password-protected and has not been unlocked in this
     tab, so nothing of its progress is rendered until it is. */
  if (hasPassword(account) && !unlocked.includes(account.id)) {
    return (
      <div style={S.appShell}>
        <LockScreen
          account={account}
          others={accounts.accounts.filter((a) => a.id !== account.id)}
          error={unlockError}
          busy={unlockBusy}
          onUnlock={(password) => unlockAccount(account.id, password)}
          onPick={switchToAccount}
          onForget={() => { deleteAccount(account.id); setUnlockError(null); }}
        />
      </div>
    );
  }

  return (
    <div style={S.appShell}>
      <style>{`
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes popIn { from{opacity:0; transform:scale(.94)} to{opacity:1; transform:scale(1)} }
        @keyframes slideUp { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
        @keyframes shake { 10%,90%{transform:translateX(-1px)} 20%,80%{transform:translateX(2px)} 30%,50%,70%{transform:translateX(-4px)} 40%,60%{transform:translateX(4px)} }
        @keyframes pulseRed { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .cursor-blink { animation: blink 1s step-start infinite; }
        .spin { animation: spin 0.9s linear infinite; }
        .opt-btn:hover:not(:disabled) { border-color: var(--accent) !important; background: rgba(255,255,255,0.04) !important; }
        .node-btn:hover .node-circle { transform: scale(1.08); }
        .node-btn:hover .node-title { color: #fff !important; }
        .tree-node:not(.locked):hover { border-color: var(--accent) !important; transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #232b36; border-radius: 4px; }
      `}</style>

      {screen === "home" && (
        <HomeScreen
          progress={progress}
          account={account}
          profileCount={accounts.accounts.length}
          onOpen={openTree}
          onAccounts={() => setScreen("accounts")}
          onLeaderboard={openLeaderboard}
          onReset={resetProgress}
          apiKey={apiKey}
          aiMode={aiMode}
          onSaveApiKey={saveApiKey}
          onToggleAiMode={toggleAiMode}
          syllabusName={syllabusName}
          syllabusText={syllabusText}
          onSaveSyllabus={saveSyllabus}
          onClearSyllabus={clearSyllabus}
        />
      )}
      {screen === "accounts" && (
        <AccountsScreen
          accounts={accounts.accounts}
          activeId={accounts.activeId}
          onUse={switchToAccount}
          onCreate={createAccount}
          onRename={editAccountName}
          onRecolour={editAccountColour}
          onDelete={deleteAccount}
          onChangePassword={changeAccountPassword}
          onHome={backHome}
        />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen
          accounts={accounts.accounts}
          activeId={accounts.activeId}
          config={lbConfig}
          entries={lbEntries}
          loading={lbLoading}
          error={lbError}
          publishedAt={lbPublishedAt}
          onRefresh={() => refreshLeaderboard()}
          onPublish={() => publishMyScore()}
          onExport={exportLeaderboard}
          onExportDb={exportLeaderboardDb}
          onSaveConfig={saveLbSettings}
          onHome={backHome}
        />
      )}
      {screen === "tree" && activeModule && (
        <TreeScreen mod={activeModule} progress={progress} onStart={startNode} onHome={backHome} />
      )}
      {screen === "generating" && activeModule && activeNode && (
        <GeneratingScreen mod={activeModule} node={activeNode} />
      )}
      {screen === "quiz" && activeModule && activeNode && runQuestions.length > 0 && (
        <QuizScreen
          mod={activeModule}
          node={activeNode}
          questions={runQuestions}
          order={order}
          qIndex={qIndex}
          selected={selected}
          locked={locked}
          timedOut={timedOut}
          streak={streak}
          stability={stability}
          runXp={runXp}
          crashed={crashed}
          aiGenerated={aiMode && !genError}
          genError={genError}
          onPick={(i) => answer(i, false)}
          onTimeout={() => answer(-1, true)}
          onNext={nextQuestion}
          onQuit={backToTree}
        />
      )}
      {screen === "result" && activeModule && activeNode && (
        <ResultScreen
          mod={activeModule}
          node={activeNode}
          correctCount={correctCount}
          total={order.length}
          runXp={runXp}
          bestStreak={bestStreak}
          crashed={crashed}
          leveledUp={leveledUp}
          onRetry={() => startNode(activeModule, activeNode)}
          onTree={backToTree}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME — commit-graph module map                                     */
/* ------------------------------------------------------------------ */

function HomeScreen({ progress, account, profileCount, onOpen, onAccounts, onLeaderboard, onReset, apiKey, aiMode, onSaveApiKey, onToggleAiMode, syllabusName, syllabusText, onSaveSyllabus, onClearSyllabus }) {
  const lvl = levelForXp(progress.xp);
  const y11 = MODULES.filter((m) => m.year === 11);
  const y12 = MODULES.filter((m) => m.year === 12);
  const totalNodes = MODULES.reduce((n, m) => n + m.nodes.length, 0);
  const clearedNodes = Object.values(progress.best).filter((b) => b.stars > 0).length;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
        <div>
          <div style={{ ...S.mono, fontSize: 12, color: "#56d4dd", letterSpacing: 1.5, marginBottom: 6 }}>
            ~/nesa/software-engineering-11-12
          </div>
          <h1 style={{ ...S.display, fontSize: 34, margin: 0, color: "#e6edf3", display: "flex", alignItems: "center", gap: 10 }}>
            <GitBranch size={30} color="#56d4dd" strokeWidth={2.2} />
            se<span style={{ color: "#3fb950" }}>//</span>bootcamp
          </h1>
          <div style={{ ...S.mono, fontSize: 12.5, color: "#7d8590", marginTop: 6, maxWidth: 480 }}>
            Merge your way through the NSW syllabus. Each topic is a skill tree — clear a node before the timer runs out to unlock the next.
          </div>
        </div>

        <div style={{ ...S.card, minWidth: 262 }}>
          <button
            onClick={onAccounts}
            title="switch profile"
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <Avatar account={account} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...S.display, fontSize: 15, color: "#e6edf3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {account ? account.name : "player"}
              </div>
              <div style={{ ...S.mono, fontSize: 10.5, color: "#7d8590" }}>
                {profileCount > 1 ? `${profileCount} profiles · switch` : "switch profile"}
              </div>
            </div>
            <ChevronRight size={15} color="#3d4552" />
          </button>

          <div style={{ height: 1, background: "#1f2734", margin: "12px 0" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={15} color="#56d4dd" />
            <div style={{ ...S.mono, fontSize: 11, color: "#7d8590" }}>LEVEL {lvl.number}/{MAX_LEVEL}</div>
          </div>
          <div style={{ ...S.display, fontSize: 15, color: "#e6edf3", marginTop: 2 }}>{lvl.title}</div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", ...S.mono, fontSize: 10.5, color: "#7d8590", marginBottom: 4 }}>
              <span>{progress.xp} XP</span>
              <span>{lvl.isMax ? "max level" : `${lvl.toNext} to next`}</span>
            </div>
            <div style={{ height: 6, background: "#161d27", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${lvl.pct}%`, background: "linear-gradient(90deg,#3fb950,#56d4dd)", borderRadius: 4, transition: "width .4s ease" }} />
            </div>
          </div>
          <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 10 }}>
            {clearedNodes}/{totalNodes} nodes cleared · {progress.runs || 0} runs
          </div>
        </div>
      </div>

      <div style={{ ...S.panel, padding: "26px 20px 14px", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <BranchColumn label="year 11 branch" color="#3fb950" modules={y11} progress={progress} onOpen={onOpen} align="right" />
          <BranchColumn label="year 12 branch" color="#56d4dd" modules={y12} progress={progress} onOpen={onOpen} align="left" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "22px 0 16px", ...S.mono, fontSize: 11.5, color: "#7d8590" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #232b36)" }} />
          <GitMerge size={15} color="#f2cc60" />
          <span>project skills merge into every module</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #232b36, transparent)" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <button onClick={onLeaderboard} style={{ ...S.ghostBtn, color: "#f2cc60", borderColor: "#2d3542" }}>
          <Medal size={13} /> leaderboard
        </button>
        <button onClick={onAccounts} style={{ ...S.ghostBtn, color: "#56d4dd", borderColor: "#2d3542" }}>
          <Users size={13} /> profiles{profileCount > 1 ? ` (${profileCount})` : ""}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <button
          onClick={onReset}
          style={{ ...S.mono, fontSize: 11, color: "#4b5563", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f85149")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4b5563")}
        >
          <RotateCcw size={12} /> reset this profile
        </button>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          style={{ ...S.mono, fontSize: 11, color: aiMode ? "#f2cc60" : "#4b5563", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f2cc60")}
          onMouseLeave={(e) => (e.currentTarget.style.color = aiMode ? "#f2cc60" : "#4b5563")}
        >
          <Settings size={12} /> AI questions{aiMode ? " (on)" : ""}
        </button>
      </div>

      {settingsOpen && (
        <AiSettingsPanel
          apiKey={apiKey}
          aiMode={aiMode}
          onSaveApiKey={onSaveApiKey}
          onToggleAiMode={onToggleAiMode}
          syllabusName={syllabusName}
          syllabusText={syllabusText}
          onSaveSyllabus={onSaveSyllabus}
          onClearSyllabus={onClearSyllabus}
        />
      )}
    </div>
  );
}

function AiSettingsPanel({ apiKey, aiMode, onSaveApiKey, onToggleAiMode, syllabusName, syllabusText, onSaveSyllabus, onClearSyllabus }) {
  const [draft, setDraft] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const text = await extractTextFromFile(file);
      onSaveSyllabus(file.name, text);
    } catch (err) {
      setUploadError(err && err.message ? err.message : "Could not read that file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ ...S.panel, maxWidth: 480, margin: "16px auto 0", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...S.display, fontSize: 13.5, color: "#e6edf3", marginBottom: 10 }}>
        <Sparkles size={14} color="#f2cc60" /> AI-generated questions
      </div>
      <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", lineHeight: 1.6, marginBottom: 14 }}>
        Paste your own free Groq API key (get one at console.groq.com — no card required) to have {AI_QUESTION_MODEL}, a free open-weight model, write a fresh batch of questions for a node every time you start it, instead of the built-in question bank. The key is stored only in this browser's local storage and is sent directly from your browser to Groq's API — never to any other server. Only use a key you control, on a device you trust.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type={showKey ? "text" : "password"}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
            placeholder="gsk_…"
            style={{
              width: "100%", boxSizing: "border-box", ...S.mono, fontSize: 12, color: "#e6edf3",
              background: "#0d1219", border: "1px solid #232b36", borderRadius: 8,
              padding: "9px 34px 9px 10px",
            }}
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: 4 }}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={() => { onSaveApiKey(draft.trim()); setSaved(true); }}
          style={{ ...S.primaryBtn("#f2cc60"), padding: "9px 16px" }}
        >
          {saved ? <Check size={14} /> : "save"}
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, ...S.mono, fontSize: 12, color: "#c9d1d9", cursor: "pointer", marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={aiMode}
          onChange={(e) => onToggleAiMode(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: "#f2cc60" }}
        />
        Use AI-generated questions instead of the question bank
      </label>
      {aiMode && !apiKey && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#f85149", marginBottom: 16 }}>
          Add and save an API key above — without one, quizzes fall back to the question bank.
        </div>
      )}

      <div style={{ borderTop: "1px solid #1f2734", paddingTop: 14 }}>
        <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", lineHeight: 1.6, marginBottom: 10 }}>
          Optionally upload your own syllabus, notes or course outline (PDF, .txt or .md). The model will treat it as the authoritative source for terminology, scope and depth when writing questions.
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.markdown,text/plain,application/pdf" onChange={handleFile} style={{ display: "none" }} />

        {syllabusName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d1219", border: "1px solid #232b36", borderRadius: 8, padding: "9px 10px" }}>
            <FileText size={14} color="#3fb950" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...S.mono, fontSize: 11.5, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syllabusName}</div>
              <div style={{ ...S.mono, fontSize: 10, color: "#4b5563" }}>{(syllabusText || "").length.toLocaleString()} characters loaded</div>
            </div>
            <button onClick={onClearSyllabus} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            style={{ ...S.ghostBtn, width: "100%", justifyContent: "center", cursor: uploading ? "default" : "pointer" }}
          >
            {uploading ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
            {uploading ? "reading file…" : "upload syllabus"}
          </button>
        )}
        {uploadError && (
          <div style={{ ...S.mono, fontSize: 10.5, color: "#f85149", marginTop: 8 }}>{uploadError}</div>
        )}
      </div>
    </div>
  );
}

function BranchColumn({ label, color, modules, progress, onOpen, align }) {
  return (
    <div>
      <div style={{ ...S.mono, fontSize: 11, color, letterSpacing: 1, marginBottom: 14, textAlign: align === "right" ? "right" : "left", display: "flex", alignItems: "center", gap: 6, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {align === "left" && <GitCommit size={12} />}
        {label}
        {align === "right" && <GitCommit size={12} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {modules.map((m) => (
          <ModuleNode key={m.id} mod={m} progress={progress} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function ModuleNode({ mod, progress, onOpen }) {
  const Icon = mod.icon;
  const cleared = mod.nodes.filter((n) => {
    const b = progress.best[nodeKey(mod.id, n.id)];
    return b && b.stars > 0;
  }).length;

  return (
    <button
      className="node-btn"
      onClick={() => onOpen(mod)}
      style={{
        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
        background: "#11161d", border: "1px solid #1f2734", borderRadius: 12,
        padding: "12px 14px", cursor: "pointer", transition: "border-color .15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = mod.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1f2734")}
    >
      <div
        className="node-circle"
        style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .15s ease",
        }}
      >
        <Icon size={18} color={mod.accent} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="node-title" style={{ ...S.display, fontSize: 14, color: "#c9d1d9", transition: "color .15s ease" }}>
          {mod.title}
        </div>
        <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 1 }}>{mod.file} · {mod.nodes.length} nodes</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ ...S.mono, fontSize: 11, color: cleared === mod.nodes.length ? "#3fb950" : "#7d8590" }}>
          {cleared}/{mod.nodes.length}
        </div>
        <ChevronRight size={16} color="#3d4552" />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TREE — per-topic skill tree                                        */
/* ------------------------------------------------------------------ */

function TreeScreen({ mod, progress, onStart, onHome }) {
  const Icon = mod.icon;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 60px" }}>
      <button onClick={onHome} style={{ ...S.ghostBtn, marginBottom: 20 }}>
        <ArrowLeft size={14} /> module map
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={mod.accent} />
        </div>
        <div>
          <div style={{ ...S.display, fontSize: 21, color: "#e6edf3" }}>{mod.title}</div>
          <div style={{ ...S.mono, fontSize: 11.5, color: "#7d8590" }}>{mod.blurb}</div>
        </div>
      </div>

      <div style={{ ...S.mono, fontSize: 11, color: "#4b5563", margin: "18px 0 22px" }}>
        <span style={{ color: "#f2cc60" }}>// </span>clear each node to unlock the next — {TIME_LIMIT}s per question
      </div>

      <div style={{ position: "relative", paddingLeft: 4 }}>
        {mod.nodes.map((node, i) => {
          const best = progress.best[nodeKey(mod.id, node.id)];
          const prevBest = i === 0 ? null : progress.best[nodeKey(mod.id, mod.nodes[i - 1].id)];
          const locked = i > 0 && !prevBest;
          const isLast = i === mod.nodes.length - 1;

          return (
            <div key={node.id} style={{ display: "flex", gap: 16, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: locked ? "#161d27" : best ? `${mod.accent}22` : "#11161d",
                  border: `2px solid ${locked ? "#232b36" : best ? mod.accent : mod.accent + "88"}`,
                  ...S.mono, fontSize: 13, color: locked ? "#3d4552" : "#e6edf3", zIndex: 1,
                }}>
                  {locked ? <Lock size={14} /> : best ? <Check size={16} color={mod.accent} /> : i + 1}
                </div>
                {!isLast && <div style={{ width: 2, flex: 1, minHeight: 44, background: locked || !best ? "#1f2734" : mod.accent, marginTop: 2, opacity: locked ? 0.5 : 1 }} />}
              </div>

              <button
                className={`tree-node ${locked ? "locked" : ""}`}
                disabled={locked}
                onClick={() => onStart(mod, node)}
                style={{
                  "--accent": mod.accent,
                  flex: 1, marginBottom: 20, textAlign: "left", cursor: locked ? "not-allowed" : "pointer",
                  background: "#11161d", border: "1px solid #1f2734", borderRadius: 12,
                  padding: "13px 16px", opacity: locked ? 0.5 : 1, transition: "border-color .15s ease, transform .15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ ...S.display, fontSize: 14.5, color: "#e6edf3" }}>{node.title}</div>
                    <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 2 }}>
                      {node.questions.length} questions{locked ? " · locked" : best ? ` · best ${best.pct}%` : ""}
                    </div>
                  </div>
                  {best ? (
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      {[0, 1, 2].map((s) => (
                        <Star key={s} size={13} fill={s < best.stars ? "#f2cc60" : "none"} color={s < best.stars ? "#f2cc60" : "#2d3542"} />
                      ))}
                    </div>
                  ) : !locked ? (
                    <ChevronRight size={16} color="#3d4552" />
                  ) : null}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GENERATING — waiting on AI-authored questions                      */
/* ------------------------------------------------------------------ */

function GeneratingScreen({ mod, node }) {
  const Icon = mod.icon;
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "100px 20px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <Icon size={24} color={mod.accent} />
      </div>
      <div style={{ ...S.display, fontSize: 16, color: "#e6edf3", marginBottom: 6 }}>{node.title}</div>
      <div style={{ ...S.mono, fontSize: 12, color: "#7d8590", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Sparkles size={13} color="#f2cc60" />
        generating fresh questions with AI
        <span className="cursor-blink">_</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  QUIZ                                                                */
/* ------------------------------------------------------------------ */

function QuizScreen({ mod, node, questions, order, qIndex, selected, locked, timedOut, streak, stability, runXp, crashed, aiGenerated, genError, onPick, onTimeout, onNext, onQuit }) {
  const qi = order[qIndex];
  const question = questions[qi];
  const Icon = mod.icon;
  const progressPct = Math.round(((qIndex + (locked ? 1 : 0)) / order.length) * 100);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [timedQuestion, setTimedQuestion] = useState(qIndex);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  // Reset the clock during render rather than in an effect. Resetting in an
  // effect left timeLeft at 0 for the first commit after advancing — with the
  // question already unlocked — so the countdown effect below fired again and
  // instantly marked the new question as timed out.
  if (timedQuestion !== qIndex) {
    setTimedQuestion(qIndex);
    setTimeLeft(TIME_LIMIT);
  }

  useEffect(() => {
    if (locked || crashed) return;
    if (timeLeft <= 0) {
      onTimeoutRef.current();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, locked, crashed]);

  const timeColor = timeLeft > 12 ? "#3fb950" : timeLeft > 6 ? "#f2cc60" : "#f85149";
  const timePct = Math.round((timeLeft / TIME_LIMIT) * 100);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <button onClick={onQuit} style={S.ghostBtn}>
          <ArrowLeft size={14} /> exit
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, ...S.mono, fontSize: 12, color: mod.accent }}>
          <Icon size={15} /> {node.title}
          {aiGenerated && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#f2cc60", fontSize: 10.5 }}>
              <Sparkles size={11} /> AI
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, ...S.mono, fontSize: 12, color: "#f2cc60" }}>
          <Zap size={13} /> {runXp} xp
        </div>
      </div>

      {genError && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#f2cc60", marginBottom: 12, textAlign: "center" }}>
          AI question generation failed ({genError}) — using the question bank instead.
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...S.mono, fontSize: 10.5, color: "#4b5563", marginBottom: 4 }}>
          <span>question {Math.min(qIndex + 1, order.length)} / {order.length}</span>
          <span>build {progressPct}%</span>
        </div>
        <div style={{ height: 5, background: "#161d27", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${mod.accent}99, ${mod.accent})`, transition: "width .35s ease" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ ...S.panel, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Activity size={14} color={stability > 66 ? "#3fb950" : stability > 33 ? "#f2cc60" : "#f85149"} />
          <div style={{ ...S.mono, fontSize: 10, color: "#7d8590", flexShrink: 0 }}>STABILITY</div>
          <div style={{ flex: 1, height: 7, background: "#0a0e14", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stability}%`, background: stability > 66 ? "#3fb950" : stability > 33 ? "#f2cc60" : "#f85149", borderRadius: 4, transition: "width .3s ease" }} />
          </div>
          <div style={{ ...S.mono, fontSize: 11, color: "#c9d1d9", width: 30, textAlign: "right", flexShrink: 0 }}>{stability}%</div>
        </div>

        <div style={{ ...S.panel, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, animation: !locked && timeLeft <= 5 ? "pulseRed .6s ease-in-out infinite" : "none" }}>
          <Clock size={14} color={timeColor} />
          <div style={{ ...S.mono, fontSize: 10, color: "#7d8590", flexShrink: 0 }}>TIME</div>
          <div style={{ flex: 1, height: 7, background: "#0a0e14", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${locked ? timePct : timePct}%`, background: timeColor, borderRadius: 4, transition: "width 1s linear" }} />
          </div>
          <div style={{ ...S.mono, fontSize: 11, color: timeColor, width: 30, textAlign: "right", flexShrink: 0 }}>{Math.max(0, timeLeft)}s</div>
        </div>
      </div>

      {streak > 1 && !locked && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#f2cc60", display: "flex", alignItems: "center", gap: 3, marginBottom: 12, justifyContent: "flex-end" }}>
          <Sparkles size={12} /> streak ×{streak}
        </div>
      )}

      <div style={{ ...S.panel, padding: 0, overflow: "hidden", animation: "slideUp .25s ease" }} key={qIndex}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderBottom: "1px solid #1f2734", background: "#0d1219" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f85149" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f2cc60" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3fb950" }} />
          <span style={{ ...S.mono, fontSize: 11, color: "#4b5563", marginLeft: 8 }}>{mod.file} — question.q({qIndex + 1})</span>
        </div>
        <div style={{ padding: "22px 22px 8px" }}>
          <div style={{ ...S.mono, fontSize: 11, color: mod.accent, marginBottom: 8 }}>
            <span style={{ color: "#4b5563" }}>{"> "}</span>
            evaluate<span className="cursor-blink" style={{ color: mod.accent }}>_</span>
          </div>
          <div style={{ ...S.display, fontSize: 17, lineHeight: 1.45, color: "#e6edf3" }}>{question.q}</div>
        </div>

        <div style={{ padding: "8px 22px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {question.options.map((opt, i) => {
            let stateStyle = { borderColor: "#232b36", background: "#0d1219" };
            let icon = null;
            if (locked) {
              if (i === question.correct) {
                stateStyle = { borderColor: "#3fb950", background: "rgba(63,185,80,0.09)" };
                icon = <CheckCircle2 size={17} color="#3fb950" />;
              } else if (i === selected) {
                stateStyle = { borderColor: "#f85149", background: "rgba(248,81,73,0.09)" };
                icon = <XCircle size={17} color="#f85149" />;
              } else {
                stateStyle = { borderColor: "#1a2029", background: "#0d1219", opacity: 0.5 };
              }
            }
            return (
              <button
                key={i}
                className="opt-btn"
                disabled={locked}
                onClick={() => onPick(i)}
                style={{
                  ...S.mono, fontSize: 13.5, textAlign: "left", color: "#c9d1d9",
                  padding: "12px 14px", borderRadius: 9, border: "1px solid",
                  cursor: locked ? "default" : "pointer", display: "flex",
                  alignItems: "center", justifyContent: "space-between", gap: 10,
                  transition: "border-color .12s ease, background .12s ease",
                  "--accent": mod.accent, ...stateStyle,
                }}
              >
                <span style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#4b5563" }}>{String.fromCharCode(97 + i)})</span>
                  {opt}
                </span>
                {icon}
              </button>
            );
          })}
        </div>

        {locked && (
          <div style={{ padding: "0 22px 22px", animation: "slideUp .2s ease" }}>
            {timedOut && (
              <div style={{ ...S.mono, fontSize: 11, color: "#f85149", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={12} /> time's up — treated as incorrect
              </div>
            )}
            <div style={{ padding: "12px 14px", borderRadius: 9, background: "#0d1219", border: "1px solid #1f2734", ...S.mono, fontSize: 12, color: "#7d8590", lineHeight: 1.5 }}>
              <span style={{ color: "#56d4dd" }}>// note </span>{question.note}
            </div>
            <button onClick={onNext} style={{ ...S.primaryBtn(mod.accent), marginTop: 14, width: "100%" }}>
              {crashed ? "view crash report" : qIndex + 1 >= order.length ? "finish build" : "next question"}
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {crashed && locked && (
        <div style={{ ...S.mono, fontSize: 11, color: "#f85149", textAlign: "center", marginTop: 10, animation: "shake .4s ease" }}>
          ⚠ stability hit 0% — system crash
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RESULT                                                              */
/* ------------------------------------------------------------------ */

function ResultScreen({ mod, node, correctCount, total, runXp, bestStreak, crashed, leveledUp, onRetry, onTree }) {
  const pct = Math.round((correctCount / total) * 100);
  const stars = pct === 100 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
  const Icon = mod.icon;

  let verdict = "needs another pass";
  let verdictColor = "#f85149";
  if (crashed) { verdict = "build crashed"; verdictColor = "#f85149"; }
  else if (pct === 100) { verdict = "flawless merge"; verdictColor = "#3fb950"; }
  else if (pct >= 70) { verdict = "build passed"; verdictColor = "#3fb950"; }
  else if (pct >= 40) { verdict = "build passed with warnings"; verdictColor = "#f2cc60"; }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 20px" }}>
      {leveledUp && (
        <div
          style={{
            ...S.panel, padding: "14px 18px", marginBottom: 14, animation: "popIn .35s ease",
            borderColor: "#f2cc6055", background: "rgba(242,204,96,0.07)",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <Trophy size={22} color="#f2cc60" />
          <div>
            <div style={{ ...S.display, fontSize: 15, color: "#f2cc60" }}>
              level up — {leveledUp.title}
            </div>
            <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", marginTop: 2 }}>
              now level {leveledUp.number} of {MAX_LEVEL}
              {leveledUp.isMax ? " · top rank reached" : ` · ${leveledUp.toNext} XP to the next`}
            </div>
          </div>
        </div>
      )}

      <div style={{ ...S.panel, padding: "32px 26px", textAlign: "center", animation: "popIn .3s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: `${mod.accent}1a`, border: `1.5px solid ${mod.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon size={26} color={mod.accent} />
        </div>
        <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", letterSpacing: 1 }}>{mod.file}</div>
        <h2 style={{ ...S.display, fontSize: 21, color: "#e6edf3", margin: "4px 0 2px" }}>{node.title}</h2>
        <div style={{ ...S.mono, fontSize: 13, color: verdictColor, marginBottom: 20, fontWeight: 600 }}>{verdict}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 22 }}>
          {[0, 1, 2].map((i) => (
            <Star key={i} size={30} fill={i < stars ? "#f2cc60" : "none"} color={i < stars ? "#f2cc60" : "#232b36"} strokeWidth={1.5} />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          <StatBox label="score" value={`${correctCount}/${total}`} />
          <StatBox label="xp earned" value={`+${runXp}`} color="#f2cc60" />
          <StatBox label="best streak" value={`×${bestStreak}`} color="#56d4dd" />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onRetry} style={{ ...S.primaryBtn(mod.accent), flex: 1 }}>
            <RotateCcw size={14} /> retry
          </button>
          <button onClick={onTree} style={{ ...S.ghostBtn, flex: 1, justifyContent: "center" }}>
            skill tree
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "#c9d1d9" }) {
  return (
    <div style={{ background: "#0d1219", border: "1px solid #1f2734", borderRadius: 9, padding: "10px 6px" }}>
      <div style={{ ...S.mono, fontSize: 9.5, color: "#4b5563", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ ...S.display, fontSize: 16, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PROFILES — local save slots, each with its own XP and progress      */
/* ------------------------------------------------------------------ */

function Avatar({ account, size = 36 }) {
  const colour = (account && account.colour) || PROFILE_COLOURS[0];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size / 3.4, flexShrink: 0,
        background: `${colour}1f`, border: `1px solid ${colour}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        ...S.mono, fontSize: size * 0.36, fontWeight: 700, color: colour,
      }}
    >
      {initials(account ? account.name : "")}
    </div>
  );
}

function ColourPicker({ value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {PROFILE_COLOURS.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          aria-label={`colour ${c}`}
          style={{
            width: 24, height: 24, borderRadius: 7, cursor: "pointer",
            background: `${c}2b`, border: `2px solid ${value === c ? c : "transparent"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: 3, background: c, display: "block" }} />
        </button>
      ))}
    </div>
  );
}

function OnboardingScreen({ onCreate }) {
  const [name, setName] = useState("");
  const [colour, setColour] = useState(PROFILE_COLOURS[0]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const secure = cryptoAvailable();
  const pwProblem = secure ? passwordProblem(password, confirm) : null;
  const ready = cleanName(name).length > 0 && !pwProblem && !busy;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(name, colour, secure ? password : "");
    } catch (e) {
      setError(e && e.message ? e.message : "Could not create that profile");
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "80px 20px 60px" }}>
      <div style={{ ...S.mono, fontSize: 12, color: "#56d4dd", letterSpacing: 1.5, marginBottom: 6 }}>
        ~/nesa/software-engineering-11-12
      </div>
      <h1 style={{ ...S.display, fontSize: 30, margin: "0 0 8px", color: "#e6edf3", display: "flex", alignItems: "center", gap: 10 }}>
        <GitBranch size={26} color="#56d4dd" strokeWidth={2.2} />
        se<span style={{ color: "#3fb950" }}>//</span>bootcamp
      </h1>
      <div style={{ ...S.mono, fontSize: 12.5, color: "#7d8590", marginBottom: 22 }}>
        Create a profile to track your XP, levels and cleared nodes.
      </div>

      <div style={{ ...S.panel, padding: "20px 20px 22px" }}>
        <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", marginBottom: 8 }}>DISPLAY NAME</div>
        <input
          value={name}
          autoFocus
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="e.g. ada"
          style={S.input}
        />
        <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", margin: "8px 0 18px" }}>
          Shown on the leaderboard · up to {MAX_NAME_LENGTH} characters
        </div>

        {secure && (
          <>
            <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", marginBottom: 8 }}>PASSWORD</div>
            <input
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder={`at least ${MIN_PASSWORD_LENGTH} characters`}
              style={S.input}
            />
            <input
              value={confirm}
              type="password"
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="confirm password"
              style={{ ...S.input, marginTop: 8 }}
            />
            <div style={{ ...S.mono, fontSize: 10.5, color: password || confirm ? (pwProblem ? "#f85149" : "#3fb950") : "#4b5563", margin: "8px 0 18px" }}>
              {password || confirm ? (pwProblem || "passwords match") : "needed to open this profile later"}
            </div>
          </>
        )}

        <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", marginBottom: 8 }}>COLOUR</div>
        <ColourPicker value={colour} onPick={setColour} />

        {error && (
          <div style={{ ...S.mono, fontSize: 11, color: "#f85149", marginTop: 14 }}>{error}</div>
        )}

        <button
          disabled={!ready}
          onClick={submit}
          style={{ ...S.primaryBtn("#3fb950"), width: "100%", marginTop: 20, opacity: ready ? 1 : 0.4, cursor: ready ? "pointer" : "not-allowed" }}
        >
          {busy ? <Loader2 size={15} className="spin" /> : <UserPlus size={15} />}
          {busy ? "creating …" : "create profile"}
        </button>
        <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginTop: 12, lineHeight: 1.5 }}>
          {secure
            ? "Saved in this browser only. The password keeps other people here out of your profile, but it is not encryption and there is no way to recover it."
            : "Passwords need a secure page (https or localhost), so this profile will open without one."}
        </div>
      </div>
    </div>
  );
}

function LockScreen({ account, others, error, busy, onUnlock, onPick, onForget }) {
  const [password, setPassword] = useState("");
  const [showOthers, setShowOthers] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);

  useEffect(() => { setPassword(""); }, [account.id]);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 20px 60px" }}>
      <div style={{ ...S.mono, fontSize: 12, color: "#56d4dd", letterSpacing: 1.5, marginBottom: 20 }}>
        ~/nesa/software-engineering-11-12
      </div>

      <div style={{ ...S.panel, padding: "24px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Avatar account={account} size={46} />
          <div>
            <div style={{ ...S.display, fontSize: 17, color: "#e6edf3" }}>{account.name}</div>
            <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <Lock size={11} /> locked
            </div>
          </div>
        </div>

        <input
          value={password}
          type="password"
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && password && !busy) onUnlock(password); }}
          placeholder="password"
          style={S.input}
        />

        {error && (
          <div style={{ ...S.mono, fontSize: 11, color: "#f85149", marginTop: 10 }}>{error}</div>
        )}

        <button
          disabled={!password || busy}
          onClick={() => onUnlock(password)}
          style={{ ...S.primaryBtn(account.colour), width: "100%", marginTop: 16, opacity: password && !busy ? 1 : 0.4 }}
        >
          {busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
          {busy ? "checking …" : "unlock"}
        </button>

        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "space-between" }}>
          {others.length > 0 && (
            <button
              onClick={() => setShowOthers((v) => !v)}
              style={{ ...S.mono, fontSize: 11, color: "#7d8590", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              use another profile
            </button>
          )}
          <button
            onClick={() => setConfirmForget((v) => !v)}
            style={{ ...S.mono, fontSize: 11, color: "#4b5563", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            forgot password?
          </button>
        </div>

        {showOthers && (
          <div style={{ marginTop: 14, borderTop: "1px solid #1f2734", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {others.map((other) => (
              <button
                key={other.id}
                onClick={() => onPick(other.id)}
                style={{ ...S.ghostBtn, justifyContent: "flex-start", gap: 10, padding: "8px 10px" }}
              >
                <Avatar account={other} size={24} />
                <span style={{ color: "#c9d1d9" }}>{other.name}</span>
                {hasPassword(other) && <Lock size={11} color="#4b5563" />}
              </button>
            ))}
          </div>
        )}

        {confirmForget && (
          <div style={{ marginTop: 14, padding: "11px 12px", background: "rgba(248,81,73,0.07)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 9 }}>
            <div style={{ ...S.mono, fontSize: 11, color: "#f85149", lineHeight: 1.5, marginBottom: 10 }}>
              Nothing here can recover the password — no email, no reset. The only way past it is to
              delete this profile and start again, which loses its XP and cleared nodes.
            </div>
            <button onClick={onForget} style={{ ...S.ghostBtn, color: "#f85149", borderColor: "rgba(248,81,73,0.4)" }}>
              <Trash2 size={12} /> delete {account.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordPanel({ account, onChangePassword, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const existing = hasPassword(account);

  async function apply(clearing) {
    setBusy(true);
    setError(null);
    const problem = clearing ? null : passwordProblem(next, confirm);
    if (problem) { setError(problem); setBusy(false); return; }
    const failure = await onChangePassword(account.id, current, clearing ? "" : next);
    setBusy(false);
    if (failure) setError(failure);
    else onClose();
  }

  return (
    <div style={{ marginTop: 12, padding: "12px 13px", background: "#0d1219", border: "1px solid #1f2734", borderRadius: 9 }}>
      {existing && (
        <input
          value={current}
          type="password"
          placeholder="current password"
          onChange={(e) => setCurrent(e.target.value)}
          style={{ ...S.input, marginBottom: 8 }}
        />
      )}
      <input
        value={next}
        type="password"
        placeholder={existing ? "new password" : `new password (${MIN_PASSWORD_LENGTH}+ characters)`}
        onChange={(e) => setNext(e.target.value)}
        style={S.input}
      />
      <input
        value={confirm}
        type="password"
        placeholder="confirm new password"
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") apply(false); }}
        style={{ ...S.input, marginTop: 8 }}
      />
      {error && <div style={{ ...S.mono, fontSize: 10.5, color: "#f85149", marginTop: 8 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button disabled={busy} onClick={() => apply(false)} style={{ ...S.ghostBtn, color: "#3fb950", borderColor: "#3fb95044" }}>
          {busy ? <Loader2 size={12} className="spin" /> : <Check size={12} />} {existing ? "change" : "set password"}
        </button>
        {existing && (
          <button disabled={busy} onClick={() => apply(true)} style={S.ghostBtn}>remove password</button>
        )}
        <button onClick={onClose} style={S.ghostBtn}>cancel</button>
      </div>
    </div>
  );
}

function AccountsScreen({ accounts, activeId, onUse, onCreate, onRename, onRecolour, onDelete, onChangePassword, onHome }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColour, setNewColour] = useState(PROFILE_COLOURS[1]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [passwordId, setPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [newConfirm, setNewConfirm] = useState("");
  const secure = cryptoAvailable();
  const newPwProblem = secure ? passwordProblem(newPassword, newConfirm) : null;
  const canCreate = cleanName(newName).length > 0 && !newPwProblem;

  const ranked = [...accounts].sort((a, b) => (b.progress.xp || 0) - (a.progress.xp || 0));

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 18px 60px" }}>
      <button onClick={onHome} style={{ ...S.ghostBtn, marginBottom: 20 }}>
        <ArrowLeft size={13} /> back
      </button>

      <h2 style={{ ...S.display, fontSize: 22, color: "#e6edf3", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 9 }}>
        <Users size={20} color="#56d4dd" /> profiles
      </h2>
      <div style={{ ...S.mono, fontSize: 11.5, color: "#7d8590", marginBottom: 22 }}>
        Save slots stored in this browser. Each keeps its own XP, level and cleared nodes.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ranked.map((acc) => {
          const stats = accountStats(acc);
          const lvl = levelForXp(stats.xp);
          const isActive = acc.id === activeId;
          const isEditing = editingId === acc.id;

          return (
            <div
              key={acc.id}
              style={{
                ...S.panel,
                padding: "13px 15px",
                borderColor: isActive ? `${acc.colour}66` : "#1f2734",
                background: isActive ? `${acc.colour}0d` : "#11161d",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar account={acc} size={42} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <input
                      value={editName}
                      autoFocus
                      maxLength={MAX_NAME_LENGTH}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { onRename(acc.id, editName); setEditingId(null); }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => { onRename(acc.id, editName); setEditingId(null); }}
                      style={{ ...S.input, padding: "6px 9px", fontSize: 13 }}
                    />
                  ) : (
                    <div style={{ ...S.display, fontSize: 15, color: "#e6edf3", display: "flex", alignItems: "center", gap: 8 }}>
                      {acc.name}
                      {hasPassword(acc) && <Lock size={12} color="#7d8590" />}
                      {isActive && (
                        <span style={{ ...S.mono, fontSize: 9.5, color: acc.colour, border: `1px solid ${acc.colour}55`, borderRadius: 5, padding: "1px 5px" }}>
                          playing
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ ...S.mono, fontSize: 10.5, color: "#7d8590", marginTop: 3 }}>
                    lvl {lvl.number} {lvl.title} · {stats.xp} XP · {stats.cleared} cleared
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!isActive && (
                    <button onClick={() => onUse(acc.id)} style={{ ...S.ghostBtn, padding: "6px 10px" }}>
                      play
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(acc.id); setEditName(acc.name); }}
                    title="rename"
                    style={{ ...S.ghostBtn, padding: "6px 8px" }}
                  >
                    <Pencil size={12} />
                  </button>
                  {secure && (
                    <button
                      onClick={() => setPasswordId(passwordId === acc.id ? null : acc.id)}
                      title={hasPassword(acc) ? "change password" : "set password"}
                      style={{ ...S.ghostBtn, padding: "6px 8px", color: passwordId === acc.id ? "#f2cc60" : "#7d8590" }}
                    >
                      <Lock size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmId(confirmId === acc.id ? null : acc.id)}
                    title="delete"
                    style={{ ...S.ghostBtn, padding: "6px 8px", color: confirmId === acc.id ? "#f85149" : "#7d8590" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11 }}>
                <span style={{ ...S.mono, fontSize: 10, color: "#4b5563" }}>colour</span>
                <ColourPicker value={acc.colour} onPick={(c) => onRecolour(acc.id, c)} />
              </div>

              {passwordId === acc.id && (
                <PasswordPanel
                  account={acc}
                  onChangePassword={onChangePassword}
                  onClose={() => setPasswordId(null)}
                />
              )}

              {confirmId === acc.id && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(248,81,73,0.07)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 9 }}>
                  <div style={{ ...S.mono, fontSize: 11, color: "#f85149", marginBottom: 9 }}>
                    Delete {acc.name} and all {stats.xp} XP of progress? This cannot be undone.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { onDelete(acc.id); setConfirmId(null); }}
                      style={{ ...S.ghostBtn, color: "#f85149", borderColor: "rgba(248,81,73,0.4)" }}
                    >
                      delete permanently
                    </button>
                    <button onClick={() => setConfirmId(null)} style={S.ghostBtn}>cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div style={{ ...S.panel, padding: "16px 16px 18px", marginTop: 14 }}>
          <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", marginBottom: 8 }}>NEW PROFILE</div>
          <input
            value={newName}
            autoFocus
            maxLength={MAX_NAME_LENGTH}
            placeholder="display name"
            onChange={(e) => setNewName(e.target.value)}
            style={S.input}
          />
          {secure && (
            <>
              <input
                value={newPassword}
                type="password"
                placeholder={`password (${MIN_PASSWORD_LENGTH}+ characters)`}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ ...S.input, marginTop: 8 }}
              />
              <input
                value={newConfirm}
                type="password"
                placeholder="confirm password"
                onChange={(e) => setNewConfirm(e.target.value)}
                style={{ ...S.input, marginTop: 8 }}
              />
              {(newPassword || newConfirm) && newPwProblem && (
                <div style={{ ...S.mono, fontSize: 10.5, color: "#f85149", marginTop: 8 }}>{newPwProblem}</div>
              )}
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <ColourPicker value={newColour} onPick={setNewColour} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              disabled={!canCreate}
              onClick={() => {
                onCreate(newName, newColour, secure ? newPassword : "");
                setAdding(false); setNewName(""); setNewPassword(""); setNewConfirm("");
              }}
              style={{ ...S.primaryBtn("#3fb950"), flex: 1, opacity: canCreate ? 1 : 0.4 }}
            >
              <Check size={14} /> create
            </button>
            <button onClick={() => setAdding(false)} style={{ ...S.ghostBtn, justifyContent: "center", flex: 1 }}>cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ ...S.ghostBtn, marginTop: 14, width: "100%", justifyContent: "center", padding: "11px 12px" }}>
          <UserPlus size={13} /> new profile
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LEADERBOARD — this device, plus an optional shared board           */
/* ------------------------------------------------------------------ */

function LeaderboardScreen({ accounts, activeId, config, entries, loading, error, publishedAt, onRefresh, onPublish, onExport, onExportDb, onSaveConfig, onHome }) {
  const configured = isConfigured(config);
  const usingFile = fileEnabled(config);
  const usingDb = dbEnabled(config);
  const [tab, setTab] = useState(configured || usingFile || usingDb ? "global" : "device");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const deviceRows = rankEntries(
    accounts.map((acc) => {
      const stats = accountStats(acc);
      const lvl = levelForXp(stats.xp);
      return {
        player_id: acc.id, name: acc.name, colour: acc.colour,
        xp: stats.xp, level: lvl.number, title: lvl.title,
        cleared: stats.cleared, stars: stats.stars, accuracy: stats.accuracy, runs: stats.runs,
      };
    })
  );
  const globalRows = rankEntries(entries || []);
  const rows = tab === "device" ? deviceRows : globalRows;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 18px 60px" }}>
      <button onClick={onHome} style={{ ...S.ghostBtn, marginBottom: 20 }}>
        <ArrowLeft size={13} /> back
      </button>

      <h2 style={{ ...S.display, fontSize: 22, color: "#e6edf3", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 9 }}>
        <Medal size={20} color="#f2cc60" /> leaderboard
      </h2>
      <div style={{ ...S.mono, fontSize: 11.5, color: "#7d8590", marginBottom: 18 }}>
        Ranked by XP, then nodes cleared, then accuracy.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("device")}
          style={{ ...S.ghostBtn, color: tab === "device" ? "#56d4dd" : "#7d8590", borderColor: tab === "device" ? "#56d4dd55" : "#232b36" }}
        >
          <Users size={13} /> this device
        </button>
        <button
          onClick={() => { setTab("global"); onRefresh(); }}
          style={{ ...S.ghostBtn, color: tab === "global" ? "#f2cc60" : "#7d8590", borderColor: tab === "global" ? "#f2cc6055" : "#232b36" }}
        >
          <Globe size={13} /> shared
        </button>
        <div style={{ flex: 1 }} />
        {tab === "global" && (configured || usingFile || usingDb) && (
          <>
            <button onClick={onRefresh} style={S.ghostBtn} title="refresh">
              <RefreshCw size={13} className={loading ? "spin" : ""} /> refresh
            </button>
            {configured && (
              <button onClick={onPublish} style={{ ...S.ghostBtn, color: "#3fb950", borderColor: "#3fb95044" }}>
                <Upload size={13} /> publish
              </button>
            )}
            <button onClick={onExport} style={{ ...S.ghostBtn, color: "#56d4dd", borderColor: "#56d4dd44" }} title="download leaderboard.json including your score">
              <FileText size={13} /> .json
            </button>
            <button onClick={onExportDb} style={{ ...S.ghostBtn, color: "#d2a8ff", borderColor: "#d2a8ff44" }} title="download the same board as a SQLite data.db">
              <Database size={13} /> .db
            </button>
          </>
        )}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          style={{ ...S.ghostBtn, color: settingsOpen ? "#f2cc60" : "#7d8590" }}
        >
          <Settings size={13} /> setup
        </button>
      </div>

      {settingsOpen && (
        <LeaderboardSettings config={config} onSave={onSaveConfig} onClose={() => setSettingsOpen(false)} />
      )}

      {tab === "global" && (
        <div style={{ ...S.mono, fontSize: 10.5, color: "#4b5563", marginBottom: 12, lineHeight: 1.6 }}>
          reading{" "}
          {[
            usingFile && <span key="f" style={{ color: "#56d4dd" }}>{config.filePath || DEFAULT_CONFIG.filePath}</span>,
            usingDb && <span key="d" style={{ color: "#d2a8ff" }}>{config.dbPath || DEFAULT_CONFIG.dbPath}</span>,
            configured && <span key="t" style={{ color: "#f2cc60" }}>shared table</span>,
          ].filter(Boolean).reduce((out, item, i) => (i ? [...out, " + ", item] : [item]), [])}
          {!usingFile && !usingDb && !configured && <span style={{ color: "#f85149" }}>nothing — every source is off</span>}
        </div>
      )}

      {tab === "global" && usingFile && !configured && (
        <div style={{ ...S.panel, padding: "16px 18px 18px", marginBottom: 14 }}>
          <div style={{ ...S.display, fontSize: 14, color: "#e6edf3", marginBottom: 8 }}>Sharing through the shipped files</div>
          <div style={{ ...S.mono, fontSize: 11.5, color: "#7d8590", lineHeight: 1.6 }}>
            Scores come from <span style={{ color: "#56d4dd" }}>{config.filePath || DEFAULT_CONFIG.filePath}</span>,
            mirrored as SQLite in <span style={{ color: "#d2a8ff" }}>{config.dbPath || DEFAULT_CONFIG.dbPath}</span>.
            A static host cannot write to either, so download the board in whichever format you keep
            and commit it — then run{" "}
            <span style={{ color: "#c9d1d9" }}>tools/sync_leaderboard.py</span> so both files match.
            For scores that appear without a commit, add a database under{" "}
            <span style={{ color: "#f2cc60" }}>setup</span>.
          </div>
        </div>
      )}

      {tab === "global" && error && (
        <div style={{ ...S.mono, fontSize: 11.5, color: "#f85149", background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 9, padding: "10px 12px", marginBottom: 14 }}>
          {error}
        </div>
      )}

      {tab === "global" && configured && publishedAt && !error && (
        <div style={{ ...S.mono, fontSize: 11, color: "#3fb950", marginBottom: 12 }}>
          score published {new Date(publishedAt).toLocaleTimeString()}
        </div>
      )}

      {tab === "global" && loading && !rows.length ? (
        <div style={{ ...S.mono, fontSize: 12, color: "#7d8590", padding: "20px 2px" }}>loading scores …</div>
      ) : rows.length === 0 ? (
        <div style={{ ...S.mono, fontSize: 12, color: "#4b5563", padding: "20px 2px" }}>
          {tab === "global" ? "No scores posted yet — be the first." : "No profiles yet."}
        </div>
      ) : (
        <div style={{ ...S.panel, overflow: "hidden" }}>
          {rows.map((row, i) => {
            const mine = row.player_id === activeId;
            const medal = ["#f2cc60", "#c9d1d9", "#d08a4a"][i];
            return (
              <div
                key={row.player_id || `${row.name}-${i}`}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 15px",
                  borderBottom: i === rows.length - 1 ? "none" : "1px solid #1a2029",
                  background: mine ? "rgba(86,212,221,0.06)" : "transparent",
                }}
              >
                <div style={{ width: 26, textAlign: "center", flexShrink: 0 }}>
                  {i < 3 ? (
                    <Crown size={15} color={medal} />
                  ) : (
                    <span style={{ ...S.mono, fontSize: 12, color: "#4b5563" }}>{i + 1}</span>
                  )}
                </div>
                <Avatar account={{ name: row.name, colour: row.colour || "#56d4dd" }} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...S.display, fontSize: 14, color: "#e6edf3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.name}{mine ? " · you" : ""}
                  </div>
                  <div style={{ ...S.mono, fontSize: 10.5, color: "#7d8590", marginTop: 2 }}>
                    lvl {row.level} {row.title} · {row.cleared} cleared · {row.accuracy}% accurate
                  </div>
                </div>
                <div style={{ ...S.mono, fontSize: 13, color: "#56d4dd", flexShrink: 0 }}>{row.xp} XP</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeaderboardSettings({ config, onSave, onClose }) {
  const [url, setUrl] = useState(config.url || "");
  const [key, setKey] = useState(config.key || "");
  const [table, setTable] = useState(config.table || DEFAULT_CONFIG.table);
  const [autoPublish, setAutoPublish] = useState(config.autoPublish !== false);
  const [useFile, setUseFile] = useState(config.useFile !== false);
  const [filePath, setFilePath] = useState(config.filePath || DEFAULT_CONFIG.filePath);
  const [useDb, setUseDb] = useState(Boolean(config.useDb));
  const [dbPath, setDbPath] = useState(config.dbPath || DEFAULT_CONFIG.dbPath);
  const [showKey, setShowKey] = useState(false);

  return (
    <div style={{ ...S.panel, padding: "18px 18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ ...S.display, fontSize: 14, color: "#e6edf3" }}>Shared leaderboard</div>
        <button onClick={onClose} style={{ ...S.ghostBtn, padding: "4px 7px" }}><X size={12} /></button>
      </div>

      <div style={{ ...S.mono, fontSize: 11, color: "#7d8590", lineHeight: 1.6, marginBottom: 16 }}>
        Two sources, usable together. The JSON file ships with the site and needs no setup but is
        updated by committing a new copy. A Supabase table updates live. Everything here stays in
        this browser.
      </div>

      <div style={{ ...S.mono, fontSize: 10.5, color: "#56d4dd", letterSpacing: 0.5, marginBottom: 8 }}>JSON FILE</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", ...S.mono, fontSize: 11.5, color: "#c9d1d9" }}>
        <input type="checkbox" checked={useFile} onChange={(e) => setUseFile(e.target.checked)} />
        read scores from a JSON file
      </label>
      <input
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        placeholder="leaderboard.json"
        disabled={!useFile}
        style={{ ...S.input, opacity: useFile ? 1 : 0.45 }}
      />
      <div style={{ ...S.mono, fontSize: 10, color: "#4b5563", marginTop: 6, marginBottom: 18 }}>
        relative to the site root · fetched fresh on every refresh
      </div>

      <div style={{ ...S.mono, fontSize: 10.5, color: "#d2a8ff", letterSpacing: 0.5, marginBottom: 8 }}>SQLITE MIRROR</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", ...S.mono, fontSize: 11.5, color: "#c9d1d9" }}>
        <input type="checkbox" checked={useDb} onChange={(e) => setUseDb(e.target.checked)} />
        also read scores from data.db
      </label>
      <input
        value={dbPath}
        onChange={(e) => setDbPath(e.target.value)}
        placeholder="data.db"
        disabled={!useDb}
        style={{ ...S.input, opacity: useDb ? 1 : 0.45 }}
      />
      <div style={{ ...S.mono, fontSize: 10, color: "#4b5563", marginTop: 6, marginBottom: 18, lineHeight: 1.5 }}>
        the same rows as the JSON file, as real SQLite · reading it downloads a WebAssembly
        copy of SQLite the first time, so leave it off unless you want it
      </div>

      <div style={{ ...S.mono, fontSize: 10.5, color: "#f2cc60", letterSpacing: 0.5, marginBottom: 8 }}>DATABASE (OPTIONAL)</div>
      <div style={{ ...S.mono, fontSize: 10.5, color: "#7d8590", marginBottom: 6 }}>PROJECT URL</div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" style={S.input} />

      <div style={{ ...S.mono, fontSize: 10.5, color: "#7d8590", margin: "12px 0 6px" }}>ANON KEY</div>
      <div style={{ position: "relative" }}>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          type={showKey ? "text" : "password"}
          placeholder="public anon key"
          style={{ ...S.input, paddingRight: 38 }}
        />
        <button
          onClick={() => setShowKey((v) => !v)}
          style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", cursor: "pointer", color: "#7d8590" }}
        >
          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <div style={{ ...S.mono, fontSize: 10.5, color: "#7d8590", margin: "12px 0 6px" }}>TABLE</div>
      <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="leaderboard" style={S.input} />

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, cursor: "pointer", ...S.mono, fontSize: 11.5, color: "#c9d1d9" }}>
        <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />
        publish my score automatically after each run
      </label>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={() => {
            onSave({
              url: url.trim(), key: key.trim(), table: table.trim() || DEFAULT_CONFIG.table,
              autoPublish,
              useFile, filePath: filePath.trim() || DEFAULT_CONFIG.filePath,
              useDb, dbPath: dbPath.trim() || DEFAULT_CONFIG.dbPath,
            });
            onClose();
          }}
          style={{ ...S.primaryBtn("#f2cc60"), flex: 1 }}
        >
          <Check size={14} /> save
        </button>
        {(config.url || config.key) && (
          <button
            onClick={() => { onSave({ ...DEFAULT_CONFIG, autoPublish, useFile, filePath, useDb, dbPath }); setUrl(""); setKey(""); onClose(); }}
            style={{ ...S.ghostBtn, justifyContent: "center", flex: 1 }}
          >
            disconnect database
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STYLE TOKENS                                                        */
/* ------------------------------------------------------------------ */

const S = {
  appShell: {
    minHeight: "100vh",
    background: "#0a0e14",
    backgroundImage:
      "radial-gradient(circle at 15% 0%, rgba(63,185,80,0.06), transparent 40%), radial-gradient(circle at 85% 15%, rgba(86,212,221,0.06), transparent 40%)",
    color: "#e6edf3",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  mono: { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', Menlo, monospace" },
  display: { fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 700, letterSpacing: -0.3 },
  panel: { background: "#11161d", border: "1px solid #1f2734", borderRadius: 14 },
  input: {
    width: "100%", boxSizing: "border-box",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 12.5, color: "#e6edf3",
    background: "#0d1219", border: "1px solid #232b36", borderRadius: 8, padding: "9px 10px",
    outline: "none",
  },
  card: { background: "#11161d", border: "1px solid #1f2734", borderRadius: 14, padding: "14px 16px", minWidth: 220 },
  ghostBtn: {
    fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#7d8590",
    background: "transparent", border: "1px solid #232b36", borderRadius: 8,
    padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  },
  primaryBtn: (accent) => ({
    fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "#0a0e14",
    background: accent, border: "none", borderRadius: 9, padding: "12px 16px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  }),
};