/* ============================================================
   store.js — curriculum structure + gamified progress (localStorage).
   ============================================================ */
window.STORE = (function () {
  "use strict";
  const LS = "chainworld_v1";
  const XP_PER = 120;

  const WORLDS = [
    { id: "foundations", n: "01", title: "Foundations", sub: "Why blockchain exists at all", color: "#8b7cff", lessons: ["ledger", "doublespend"] },
    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "#3fe0cf", lessons: ["hashing", "keys"] },
    { id: "chain", n: "03", title: "Building the chain", sub: "Bundling, mining, and locking the past", color: "#f5b13d", lessons: ["block", "nonce", "chainlink", "merkle"] },
    { id: "consensus", n: "04", title: "Consensus & security", sub: "Agreeing with no one in charge", color: "#ff5a6e", lessons: ["forks", "attack", "pos"] },
    { id: "frontier", n: "05", title: "The ecosystem", sub: "Contracts, privacy, and money", color: "#46d98a", lessons: ["contracts", "zk", "money"] },
  ];
  const ORDER = WORLDS.flatMap(w => w.lessons);
  const worldOf = {}; WORLDS.forEach(w => w.lessons.forEach(id => worldOf[id] = w));

  let completed = new Set(), xp = 0;
  try { const d = JSON.parse(localStorage.getItem(LS) || "{}"); (d.completed || []).forEach(id => completed.add(id)); xp = d.xp || 0; } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify({ completed: [...completed], xp })); } catch (e) {} }

  const bus = {}; function on(e, fn) { (bus[e] = bus[e] || []).push(fn); } function emit(e, d) { (bus[e] || []).forEach(fn => fn(d)); }

  const levelFor = (x) => Math.floor(x / 360) + 1;
  function level() { return levelFor(xp); }
  function levelProgress() { const base = (level() - 1) * 360; return Math.min(1, (xp - base) / 360); }

  function isDone(id) { return completed.has(id); }
  function complete(id) {
    if (completed.has(id)) return { already: true, xp, level: level() };
    const before = level(); completed.add(id); xp += XP_PER; save();
    const after = level(); emit("progress", { id });
    return { xp, gained: XP_PER, leveledUp: after > before, level: after };
  }
  function reset() { completed.clear(); xp = 0; save(); emit("progress", {}); }

  function worldDone(w) { return w.lessons.filter(isDone).length; }
  function worldComplete(w) { return worldDone(w) === w.lessons.length; }
  function totalDone() { return ORDER.filter(isDone).length; }
  function nextOf(id) { const i = ORDER.indexOf(id); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; }
  function prevOf(id) { const i = ORDER.indexOf(id); return i > 0 ? ORDER[i - 1] : null; }
  function firstUndone() { return ORDER.find(id => !isDone(id)) || ORDER[0]; }
  function badges() { return WORLDS.filter(worldComplete).length; }

  return {
    WORLDS, ORDER, worldOf, on,
    get xp() { return xp; }, level, levelProgress,
    isDone, complete, reset,
    worldDone, worldComplete, totalDone, nextOf, prevOf, firstUndone, badges,
    XP_PER, lessonsTotal: ORDER.length,
  };
})();
