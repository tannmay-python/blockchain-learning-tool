/* ============================================================
   store.js — curriculum structure + simple progress (no points).
   ============================================================ */
window.STORE = (function () {
  "use strict";
  const LS = "blockcourse_v1";

  const WORLDS = [
    { id: "primer", n: "00", title: "Start here", sub: "Money, trust, and the core problem", color: "#9c2a5a", lessons: ["ledger", "why", "doublespend"],
      intro: "Before we write a single line of code, we must define the problem. Money is fundamentally a <b>technology for keeping score</b>. For centuries, we've relied on centralized ledgers and trusted middlemen to maintain that score. This chapter strips away the jargon to expose the structural vulnerability of trust—and the catastrophic failure mode of digital cash: the <b>double-spend problem</b>." },
    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is", color: "#620d3c", lessons: ["whatis", "tour"],
      intro: "Satoshi's breakthrough wasn't cryptographic; it was architectural. A blockchain is simply an <b>append-only distributed ledger</b> maintained by a decentralized network. Before diving into the cryptography and consensus algorithms, this chapter maps the high-level anatomy of the system. You will see how transactions flow from a user's wallet to a globally accepted, immutable state." },
    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "#f1a222", lessons: ["hashing", "keys"],
      intro: "The entire blockchain architecture rests on just two cryptographic primitives. <b>Cryptographic hash functions</b> act as digital fingerprints, ensuring that any tampering cascades into catastrophic failure. <b>Public-key cryptography</b> (ECDSA) allows you to mathematically prove ownership without ever revealing your secret key. If you understand these two tools, the rest of the system is just applied plumbing." },
    { id: "chain", n: "03", title: "Building the chain", sub: "Bundling, mining, and locking the past", color: "#8a2057", lessons: ["tx", "block", "merkle", "nonce", "incentives", "chainlink"],
      intro: "This is where the theoretical becomes physical. We will assemble the core data structures from scratch: packing transactions into a <b>Merkle Tree</b>, linking state via block headers, and grinding through computational <b>Proof of Work</b> to seal the batch. You will manually mine a block, observing firsthand how thermodynamic energy is converted into network security and immutability." },
    { id: "consensus", n: "04", title: "The network agrees", sub: "Thousands of strangers, one history", color: "#d2384f", lessons: ["gossip", "forks", "attack", "pos"],
      intro: "A single honest node is trivial; reaching global agreement among a network of adversarial strangers is a miracle of game theory. This chapter explores <b>Nakamoto Consensus</b> and the Longest Chain Rule. We will examine how a decentralized peer-to-peer network converges on a single canonical truth, resolves temporary forks, and exactly what it takes to execute a 51% attack." },
    { id: "frontier", n: "05", title: "The ecosystem", sub: "Contracts, tokens, wallets, scaling, safety", color: "#2e9e6b", lessons: ["contracts", "tokens", "wallets", "layer2", "zk", "money", "safety"],
      intro: "A secure ledger is just the foundation. The introduction of <b>Turing-complete smart contracts</b> transformed the blockchain from a calculator into a globally accessible, unstoppable computer. Here, we explore the modern ecosystem: token standards (ERC-20, NFTs), deterministic state machines, Layer-2 rollup architectures, zero-knowledge proofs, and the unforgiving reality of smart contract exploits." },
    { id: "capstone", n: "06", title: "The whole machine", sub: "Watch every piece work together", color: "#d98908", lessons: ["recap"],
      intro: "You have manually constructed every component of a blockchain: derived keys, signed transactions, built Merkle roots, mined nonces, and resolved network forks. This final chapter brings all the primitives together into a single, cohesive, living machine. This is the <b>complete architectural loop</b>." },
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
