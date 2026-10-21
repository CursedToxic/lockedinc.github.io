/* Experience levels.
 *
 * A flawless clear of every node in the app is worth roughly 17,800 XP, so the
 * ladder is tuned to end just above that: level 24 is reachable by clearing
 * everything well, and level 25 takes some replaying.
 *
 * `xp` is the total experience required to ENTER that level. Keep the list
 * ordered and strictly increasing.
 *
 * Plain data only — loaded directly by the browser as an ES module.
 */

export const LEVELS = [
  { title: "Trainee", xp: 0 },
  { title: "Intern", xp: 120 },
  { title: "Junior Dev", xp: 280 },
  { title: "Developer", xp: 480 },
  { title: "Software Engineer", xp: 720 },
  { title: "Engineer II", xp: 1000 },
  { title: "Senior Engineer", xp: 1320 },
  { title: "Staff Engineer", xp: 1700 },
  { title: "Tech Lead", xp: 2140 },
  { title: "Principal Engineer", xp: 2640 },
  { title: "Systems Architect", xp: 3200 },
  { title: "Solutions Architect", xp: 3820 },
  { title: "Security Architect", xp: 4500 },
  { title: "Reliability Lead", xp: 5250 },
  { title: "Platform Architect", xp: 6060 },
  { title: "Engineering Manager", xp: 6940 },
  { title: "Head of Engineering", xp: 7880 },
  { title: "Distinguished Engineer", xp: 8900 },
  { title: "Chief Architect", xp: 10000 },
  { title: "Chief Technology Officer", xp: 11200 },
  { title: "Core Maintainer", xp: 12500 },
  { title: "Kernel Hacker", xp: 13900 },
  { title: "Compiler Whisperer", xp: 15400 },
  { title: "Legendary Engineer", xp: 17000 },
  { title: "Singularity", xp: 18700 },
];

export const MAX_LEVEL = LEVELS.length;

/**
 * Resolves total XP into the level it sits in, plus progress toward the next.
 * `level` is 0-indexed for array use; `number` is the 1-indexed value shown.
 */
export function levelForXp(xp) {
  const total = Math.max(0, Math.floor(xp || 0));
  let level = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (total >= LEVELS[i].xp) level = i;
    else break;
  }
  const isMax = level === LEVELS.length - 1;
  const floor = LEVELS[level].xp;
  const next = isMax ? LEVELS[level].xp : LEVELS[level + 1].xp;
  const pct = isMax ? 100 : Math.round(((total - floor) / (next - floor)) * 100);
  return {
    level,
    number: level + 1,
    title: LEVELS[level].title,
    floor,
    next,
    isMax,
    pct: Math.max(0, Math.min(100, pct)),
    toNext: isMax ? 0 : next - total,
  };
}
