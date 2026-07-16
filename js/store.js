/* ============================================================
   store.js — curriculum structure + simple progress (no points).
   ============================================================ */
window.STORE = (function () {
  "use strict";
  const LS = "blockcourse_v1";

  const WORLDS = [
    { id: "primer", n: "00", title: "Start here", sub: "Money, trust, and the core problem", color: "#9c2a5a", lessons: ["ledger", "why", "doublespend"],
      intro: "Before jumping into code, we need to understand the problem we're actually trying to solve. For centuries, we've trusted banks to keep score of who owns what. But what happens when we remove the middleman? This chapter breaks down the core challenge of digital money: how do you stop someone from spending the same digital dollar twice?" },
    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is", color: "#620d3c", lessons: ["whatis", "tour"],
      intro: "A blockchain is just a shared, unchangeable record book. Instead of one company holding the book, thousands of computers hold identical copies. Before we dive into the heavy math, this chapter will give you a bird's-eye view of how this shared record actually works in plain sight." },
    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "#f1a222", lessons: ["hashing", "keys"],
      intro: "Don't let the word 'cryptography' scare you. The entire system is built on just two simple tools: a digital fingerprint that makes it impossible to tamper with data, and a digital signature that proves you own your money. Once you grasp these two tools, the rest of blockchain is just connecting the dots." },
    { id: "chain", n: "03", title: "Building the chain", sub: "Bundling, mining, and locking the past", color: "#8a2057", lessons: ["tx", "block", "merkle", "nonce", "incentives", "chainlink"],
      intro: "Now we get our hands dirty. You're going to build the machine yourself: packing transactions into a neat bundle, doing the 'work' to seal them, and linking them together so the past can never be erased. You'll see exactly how a blockchain earns its name." },
    { id: "consensus", n: "04", title: "The network agrees", sub: "Thousands of strangers, one history", color: "#d2384f", lessons: ["gossip", "forks", "attack", "pos"],
      intro: "Getting one computer to follow the rules is easy. Getting thousands of strangers around the world to agree on the exact same history—without a referee—is the real magic. This chapter explores how the network reaches agreement, handles disagreements, and protects itself from attackers." },
    { id: "frontier", n: "05", title: "The ecosystem", sub: "Contracts, tokens, wallets, scaling, safety", color: "#2e9e6b", lessons: ["contracts", "tokens", "wallets", "layer2", "zk", "money", "safety"],
      intro: "A secure ledger is just the foundation. Once you have a trusted network, you can build unstoppable programs on top of it. This chapter explores the wild world beyond just moving money: smart contracts, digital art (NFTs), scaling the network, and the very real ways people lose their funds." },
    { id: "capstone", n: "06", title: "The whole machine", sub: "Watch every piece work together", color: "#d98908", lessons: ["recap"],
      intro: "You've built every piece by hand: the keys, the signatures, the blocks, and the chain. Now, watch them all come together. This final chapter runs the entire machine as one living, breathing system." },
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
