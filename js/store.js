/* ============================================================
   store.js: curriculum structure + simple progress (no points).
   ============================================================ */
export const STORE = (function () {
  "use strict";
  const LS = "blockcourse_v1";

  const WORLDS = [
    { id: "primer", n: "00", title: "Start here", sub: "Money, trust, and the core problem", color: "#e2e8f0", colorText: "#334155", colorTextDark: "#94a3b8", lessons: ["ledger", "why", "doublespend"],
      intro: "Before jumping into code, we need to understand the problem we're actually trying to solve. For centuries, we've trusted banks to keep score of who owns what. But what happens when we remove the middleman? This chapter breaks down the core challenge of digital money: how do you stop someone from spending the same digital dollar twice?" },
    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is", color: "#fbcfe8", colorText: "#9d174d", colorTextDark: "#f472b6", lessons: ["whatis", "tour"],
      intro: "A blockchain is just a shared, unchangeable record book. Instead of one company holding the book, thousands of computers hold identical copies. Before we dive into the heavy maths, this chapter will give you a bird's-eye view of how this shared record actually works in plain sight." },
    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "#fde68a", colorText: "#92400e", colorTextDark: "#fbbf24", lessons: ["hashing", "keys"],
      intro: "Don't let the word 'cryptography' scare you. The entire system is built on just two simple tools: a digital fingerprint that makes it impossible to tamper with data, and a digital signature that proves you own your money. Once you grasp these two tools, the rest of blockchain is just connecting the dots." },
    { id: "chain", n: "03", title: "Building the chain", sub: "Bundling, mining, and locking the past", color: "#c7d2fe", colorText: "#3730a3", colorTextDark: "#818cf8", lessons: ["tx", "block", "merkle", "nonce", "incentives", "chainlink"],
      intro: "Now we get our hands dirty. You're going to build the machine yourself. You'll pack transactions together, seal them with 'work', and link them up so the past can never be erased. You'll see exactly how a blockchain earns its name." },
    { id: "consensus", n: "04", title: "The network agrees", sub: "Thousands of strangers, one history", color: "#fecdd3", colorText: "#9f1239", colorTextDark: "#fb7185", lessons: ["gossip", "sybil", "forks", "attack", "pos"],
      intro: "Getting one computer to follow the rules is easy. Getting thousands of strangers around the world to agree on the exact same history without a referee is the real magic. This chapter explores how the network reaches agreement, handles disagreements, and stays secure against attackers." },
    { id: "progmoney", n: "05", title: "Programmable money", sub: "Contracts, tokens, and markets made of code", color: "#a7f3d0", colorText: "#065f46", colorTextDark: "#34d399", lessons: ["contracts", "tokens", "amm", "mev"],
      intro: "A secure ledger is just the foundation. Once a network can store data and agree on it, it can run unstoppable programs. This chapter explores what gets built on top: smart contracts, tokens and NFTs, and markets that trade with no seller on the other side." },
    { id: "keysworld", n: "06", title: "Your keys, your problem", sub: "Custody, and the ways people lose everything", color: "#e9d5ff", colorText: "#6b21a8", colorTextDark: "#c084fc", lessons: ["wallets", "safety"],
      intro: "On a blockchain there is no password reset and no fraud department. A wallet is just a key, and whoever holds the key owns the coins. This makes you both the owner and the single point of failure. This short chapter is about keeping it that way." },
    { id: "scaling", n: "07", title: "Scaling, privacy & the state", sub: "Layer 2, zero-knowledge, and public money", color: "#99f6e4", colorText: "#115e59", colorTextDark: "#2dd4bf", lessons: ["layer2", "zk", "money"],
      intro: "A chain everyone verifies is slow and public by design. This chapter covers the engineering that speeds it up, the cryptography that brings back privacy, and what happens when governments adopt these tools." },
    { id: "history", n: "08", title: "How it went wrong", sub: "The disasters that proved the rules", color: "#fed7aa", colorText: "#9a3412", colorTextDark: "#fb923c", lessons: ["history"],
      intro: "Technology does not exist in a vacuum. It exists in markets, built by humans, under incredible financial pressure. This chapter looks at the most spectacular failures in the short history of crypto, and what they teach us about the actual limits of code." },
    { id: "capstone", n: "09", title: "The whole machine", sub: "Watch every piece work together", color: "#bfdbfe", colorText: "#1e40af", colorTextDark: "#60a5fa", lessons: ["recap", "coin"],
      intro: "You've built every piece by hand: the keys, the signatures, the blocks, and the chain. Now, watch them all come together. This final chapter runs the entire machine." },
  ];
  const ORDER = WORLDS.flatMap(w => w.lessons);
  /* optional deep-dive lessons: on the map, never on the critical path */
  const DEEP = new Set(["merkle", "zk", "mev"]);
  const worldOf = {}; WORLDS.forEach(w => w.lessons.forEach(id => worldOf[id] = w));

  /* lesson renames across versions: old id -> new id (progress survives) */
  const RENAMES = {};
  let completed = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || "[]");
    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.done) ? raw.done : []);
    list.forEach(id => { const cur = RENAMES[id] || id; if (ORDER.includes(cur)) completed.add(cur); });
  } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify({ v: 2, done: [...completed] })); } catch (e) {} }

  function isDone(id) { return completed.has(id); }
  function setDone(id, v) { if (v) completed.add(id); else completed.delete(id); save(); }
  function reset() { completed.clear(); save(); }
  function worldDone(w) { return w.lessons.filter(isDone).length; }
  function totalDone() { return ORDER.filter(isDone).length; }
  function nextOf(id) { const i = ORDER.indexOf(id); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; }
  function prevOf(id) { const i = ORDER.indexOf(id); return i > 0 ? ORDER[i - 1] : null; }
  function firstUndone() { return ORDER.find(id => !isDone(id) && !DEEP.has(id)) || ORDER.find(id => !isDone(id)) || ORDER[0]; }

  return { WORLDS, ORDER, worldOf, DEEP, isDone, setDone, reset, worldDone, totalDone, nextOf, prevOf, firstUndone, lessonsTotal: ORDER.length };
})();
