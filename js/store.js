/* ============================================================
   store.js — curriculum structure + simple progress (no points).
   ============================================================ */
window.STORE = (function () {
  "use strict";
  const LS = "blockcourse_v1";

  const WORLDS = [
    { id: "primer", n: "00", title: "Start here", sub: "Money, trust, and the core problem", color: "#9c2a5a", lessons: ["ledger", "why", "doublespend"],
      intro: "Before any technology: what money actually is, why we hand it to middlemen, and the one problem that makes digital money genuinely hard." },
    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is", color: "#620d3c", lessons: ["whatis", "tour"],
      intro: "You know the problem now. This chapter shows you the shape of the whole solution — in plain sight — before we build any single piece of it." },
    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "#f1a222", lessons: ["hashing", "keys"],
      intro: "Everything ahead is assembled from exactly two tools: a fingerprint that catches tampering, and a signature that proves ownership. Master these and the rest is plumbing." },
    { id: "chain", n: "03", title: "Building the chain", sub: "Bundling, mining, and locking the past", color: "#8a2057", lessons: ["tx", "block", "merkle", "nonce", "incentives", "chainlink"],
      intro: "Now you build the machine with your hands: package a payment, seal a batch of them with real work, pay the sealer, and lock each block to the last so the past can't be rewritten." },
    { id: "consensus", n: "04", title: "The network agrees", sub: "Thousands of strangers, one history", color: "#d2384f", lessons: ["gossip", "forks", "attack", "pos"],
      intro: "One computer keeping an honest chain is easy. The miracle is thousands of them — strangers, no referee — agreeing on a single history. This is how, and where it can break." },
    { id: "frontier", n: "05", title: "The ecosystem", sub: "Contracts, tokens, wallets, scaling, safety", color: "#2e9e6b", lessons: ["contracts", "tokens", "wallets", "layer2", "zk", "money", "safety"],
      intro: "The base layer works. Now everything it makes possible — programs that hold money, new kinds of assets, wallets, scaling, privacy, and the very real ways people lose it all." },
    { id: "capstone", n: "06", title: "The whole machine", sub: "Watch every piece work together", color: "#d98908", lessons: ["recap"],
      intro: "You've built every part by hand. Here they are, running together as one living machine." },
  ];
  const ORDER = WORLDS.flatMap(w => w.lessons);
  const worldOf = {}; WORLDS.forEach(w => w.lessons.forEach(id => worldOf[id] = w));

  let completed = new Set();
  try {
    const cur = JSON.parse(localStorage.getItem(LS) || "[]");
    cur.forEach(id => completed.add(id));
  } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify([...completed])); } catch (e) {} }

  function isDone(id) { return completed.has(id); }
  function setDone(id, v) { if (v) completed.add(id); else completed.delete(id); save(); }
  function reset() { completed.clear(); save(); }
  function worldDone(w) { return w.lessons.filter(isDone).length; }
  function totalDone() { return ORDER.filter(isDone).length; }
  function nextOf(id) { const i = ORDER.indexOf(id); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; }
  function prevOf(id) { const i = ORDER.indexOf(id); return i > 0 ? ORDER[i - 1] : null; }
  function firstUndone() { return ORDER.find(id => !isDone(id)) || ORDER[0]; }

  return { WORLDS, ORDER, worldOf, isDone, setDone, reset, worldDone, totalDone, nextOf, prevOf, firstUndone, lessonsTotal: ORDER.length };
})();
