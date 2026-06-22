/* ============================================================
   engine.js — shared course state (the synced thread) + helpers.
   Everything the learner builds lives in ENGINE.state:
   their wallet → their transaction → their block → the chain.
   ============================================================ */
window.ENGINE = (function () {
  "use strict";

  const LS_KEY = "bcc_progress_v1";

  const state = {
    wallet: null,     // { keyPair, pubHex, address }  (real ECDSA when available)
    contacts: { satoshi: null },
    tx: null,         // { from, to, amount, nonce, sigHex, valid }
    mempool: [],      // pending txs the learner can include in a block
    block: null,      // { txs, prevHash, merkleRoot, nonce, hash, difficulty, mined }
    chain: [],        // confirmed blocks (incl. genesis)
    completed: new Set(),
  };

  /* ---- persistence: only progress is saved; the built artifacts
          rebuild naturally as the learner moves through lessons ---- */
  function loadProgress() {
    try { const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); raw.forEach((id) => state.completed.add(id)); } catch (e) {}
  }
  function saveProgress() {
    try { localStorage.setItem(LS_KEY, JSON.stringify([...state.completed])); } catch (e) {}
  }
  function complete(id) { if (!state.completed.has(id)) { state.completed.add(id); saveProgress(); bus.emit("progress", id); } }
  function resetProgress() { state.completed.clear(); saveProgress(); }

  /* ---- tiny event bus so lessons/sidebar stay in sync ---- */
  const bus = (function () {
    const map = {};
    return {
      on: (e, fn) => { (map[e] = map[e] || []).push(fn); },
      emit: (e, d) => { (map[e] || []).forEach((fn) => fn(d)); },
    };
  })();

  /* ---- crypto helpers ---- */
  const subtle = window.crypto && window.crypto.subtle;
  const hasSubtle = !!(subtle && subtle.generateKey);
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

  async function generateWallet(label) {
    let pubHex;
    let keyPair = null;
    if (hasSubtle) {
      keyPair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
      pubHex = hex(await subtle.exportKey("raw", keyPair.publicKey));
    } else {
      const priv = sha256("priv" + Math.random() + Date.now());
      keyPair = { _priv: priv };
      pubHex = sha256(priv);
    }
    const address = "0x" + sha256(pubHex).slice(-40);
    return { keyPair, pubHex, address, label: label || "you" };
  }

  async function sign(wallet, message) {
    if (hasSubtle && wallet.keyPair.privateKey) {
      const data = new TextEncoder().encode(message);
      const sig = await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, wallet.keyPair.privateKey, data);
      return hex(sig);
    }
    return sha256(wallet.keyPair._priv + message);
  }
  async function verify(wallet, message, sigHex) {
    if (hasSubtle && wallet.keyPair.publicKey) {
      const data = new TextEncoder().encode(message);
      const sigBuf = new Uint8Array(sigHex.match(/../g).map((h) => parseInt(h, 16)));
      return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, wallet.keyPair.publicKey, sigBuf, data);
    }
    return sigHex === sha256(wallet.keyPair._priv + message);
  }

  /* ---- chain helpers ---- */
  function txString(tx) { return `${tx.from}→${tx.to}:${tx.amount}#${tx.nonce}`; }

  function merkle(leaves) {
    // returns { levels: [[{hash,label}],...], root }
    if (!leaves.length) return { levels: [[{ hash: "0".repeat(64), label: "∅" }]], root: "0".repeat(64) };
    let level = leaves.map((l) => ({ hash: sha256(l), label: l }));
    const levels = [level];
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const a = level[i], b = level[i + 1] || level[i];
        next.push({ hash: sha256(a.hash + b.hash), left: a, right: b });
      }
      levels.push(next); level = next;
    }
    return { levels, root: level[0].hash };
  }

  function blockHash(b) { return sha256((b.index ?? "") + b.prevHash + b.merkleRoot + b.nonce); }

  function genesis() {
    const b = { index: 0, txs: ["Genesis — the first block"], prevHash: "0".repeat(64), nonce: 0, difficulty: 3 };
    b.merkleRoot = merkle(b.txs).root;
    // pre-mine genesis to 3 zeros
    while (!blockHash(b).startsWith("000")) b.nonce++;
    b.hash = blockHash(b);
    return b;
  }

  function ensureChain() { if (!state.chain.length) state.chain = [genesis()]; }

  loadProgress();

  return {
    state, bus, complete, resetProgress,
    hasSubtle, generateWallet, sign, verify,
    txString, merkle, blockHash, genesis, ensureChain,
  };
})();
