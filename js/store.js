/* ============================================================
   store.js — curriculum structure + simple progress (no points).
   ============================================================ */
window.STORE = (function () {
  "use strict";
  const LS = "blockcourse_v1";
  const LEGACY = "chainworld_v2";

  const WORLDS = [
    { id: "primer", n: "00", title: "Start here", sub: "Money, trust, and the core problem", color: "#9c2a5a", lessons: ["ledger", "why", "doublespend"] },
    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is", color: "#620d3c", lessons: ["whatis", "tour"] },
    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "#f1a222", lessons: ["hashing", "keys"] },
    { id: "chain", n: "03", title: "Building the chain", sub: "Bundling, mining, and locking the past", color: "#8a2057", lessons: ["block", "nonce", "incentives", "chainlink", "merkle"] },
    { id: "consensus", n: "04", title: "The network agrees", sub: "Thousands of strangers, one history", color: "#d2384f", lessons: ["gossip", "forks", "attack", "pos"] },
    { id: "frontier", n: "05", title: "The ecosystem", sub: "Contracts, tokens, wallets, scaling, safety", color: "#2e9e6b", lessons: ["contracts", "tokens", "wallets", "layer2", "zk", "money", "safety"] },
    { id: "capstone", n: "06", title: "The whole machine", sub: "Watch every piece work together", color: "#d98908", lessons: ["recap"] },
  ];
  const ORDER = WORLDS.flatMap(w => w.lessons);
  const worldOf = {}; WORLDS.forEach(w => w.lessons.forEach(id => worldOf[id] = w));

  let completed = new Set();
  try {
    const cur = JSON.parse(localStorage.getItem(LS) || "null");
    if (cur) { cur.forEach(id => completed.add(id)); }
    else {
      // one-time migration from the old ChainWorld progress key
      (JSON.parse(localStorage.getItem(LEGACY) || "[]")).forEach(id => completed.add(id));
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify([...completed])); } catch (e) {} }

  function isDone(id) { return completed.has(id); }
  function setDone(id, v) { if (v) completed.add(id); else completed.delete(id); save(); }
  function reset() { completed.clear(); save(); }
  function worldDone(w) { return w.lessons.filter(isDone).length; }
  function worldComplete(w) { return worldDone(w) === w.lessons.length; }
  function totalDone() { return ORDER.filter(isDone).length; }
  function nextOf(id) { const i = ORDER.indexOf(id); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; }
  function prevOf(id) { const i = ORDER.indexOf(id); return i > 0 ? ORDER[i - 1] : null; }
  function firstUndone() { return ORDER.find(id => !isDone(id)) || ORDER[0]; }

  return { WORLDS, ORDER, worldOf, isDone, setDone, reset, worldDone, worldComplete, totalDone, nextOf, prevOf, firstUndone, lessonsTotal: ORDER.length };
})();
