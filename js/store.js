/* ============================================================
   store.js: curriculum structure + simple progress (no points).

   Two tracks live in here:
   - the CORE path: everything you need to understand a blockchain.
   - OPTIONAL lessons and whole optional chapters, marked with ◇.
     Skipping every optional item still leaves a complete course.
   ============================================================ */
export const STORE = (function () {
  "use strict";
  const LS = "blockcourse_v1";

  const WORLDS = [
    { id: "primer", n: "00", title: "Start here", sub: "Money, trust, and the core problem", color: "oklch(0.60 0.078 340)", colorText: "oklch(0.45 0.088 340)", colorTextDark: "oklch(0.85 0.080 340)", lessons: ["ledger", "why", "doublespend"],
      intro: "Before jumping into code, we need to understand the problem we're actually trying to solve. For centuries, we've trusted banks to keep score of who owns what. But what happens when we remove the middleman? This chapter breaks down the core challenge of digital money: how do you stop someone from spending the same digital dollar twice?" },

    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is, and who runs it", color: "oklch(0.60 0.078 10)", colorText: "oklch(0.45 0.088 10)", colorTextDark: "oklch(0.85 0.080 10)", lessons: ["whatis", "tour", "nodes"],
      intro: "A blockchain is just a shared, unchangeable record book. Instead of one company holding the book, thousands of computers hold identical copies. Before we dive into the heavy maths, this chapter gives you a bird's-eye view: what the thing is, what happens to a single payment from end to end, and who exactly is running all these computers." },

    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "oklch(0.60 0.078 40)", colorText: "oklch(0.45 0.088 40)", colorTextDark: "oklch(0.85 0.080 40)", lessons: ["hashing", "keys", "merkle"],
      intro: "Don't let the word 'cryptography' scare you. The entire system is built on just two simple tools: a digital fingerprint that makes it impossible to tamper with data, and a digital signature that proves you own your money. Once you grasp these two tools, the rest of blockchain is just connecting the dots." },

    { id: "chain", n: "03", title: "Building the chain", sub: "Transactions, blocks, and locking the past", color: "oklch(0.60 0.078 68)", colorText: "oklch(0.45 0.088 68)", colorTextDark: "oklch(0.85 0.080 68)", lessons: ["tx", "block", "chainlink"],
      intro: "Now we get our hands dirty. You're going to build the machine yourself. You'll look inside a single transaction, pack a batch of them into a block, and link the blocks together so the past can never be quietly edited. This is where a blockchain earns its name." },

    { id: "mining", n: "04", title: "Mining", sub: "Burning work to seal the record", color: "oklch(0.60 0.078 95)", colorText: "oklch(0.45 0.088 95)", colorTextDark: "oklch(0.85 0.080 95)", lessons: ["nonce", "difficulty", "incentives"],
      intro: "Linking blocks is cheap. Making them expensive to produce is the whole trick. This chapter is about the puzzle miners race to solve, the thermostat that keeps blocks arriving every ten minutes no matter how many miners show up, and the reward that makes anyone bother in the first place." },

    { id: "consensus", n: "05", title: "The network agrees", sub: "Thousands of strangers, one history", color: "oklch(0.60 0.078 122)", colorText: "oklch(0.45 0.088 122)", colorTextDark: "oklch(0.85 0.080 122)", lessons: ["gossip", "sybil", "forks"],
      intro: "Getting one computer to follow the rules is easy. Getting thousands of strangers around the world to agree on the exact same history without a referee is the real magic. This chapter is about how news travels with no broadcaster, why the network cannot simply take a vote, and what happens when two miners win at the same moment." },

    { id: "attacks", n: "06", title: "Attacks & alternatives", sub: "Breaking it, and the other way to build it", color: "oklch(0.60 0.078 150)", colorText: "oklch(0.45 0.088 150)", colorTextDark: "oklch(0.85 0.080 150)", lessons: ["attack", "finality", "pos"],
      intro: "A system is only as good as the attacks it survives. Here you'll run the famous 51% attack yourself and watch the money you burn doing it, learn why merchants wait for confirmations before shipping, and meet Proof of Stake: the same problem solved by putting capital at risk instead of electricity." },

    { id: "keysworld", n: "07", title: "Your keys, your problem", sub: "Custody, recovery, and losing everything", color: "oklch(0.60 0.078 178)", colorText: "oklch(0.45 0.088 178)", colorTextDark: "oklch(0.85 0.080 178)", lessons: ["wallets", "seed", "safety"],
      intro: "On a blockchain there is no password reset and no fraud department. A wallet is just a key, and whoever holds the key owns the coins. This makes you both the owner and the single point of failure. This chapter is about what a wallet actually holds, how twelve ordinary words can back up a fortune, and the ways people lose it all." },

    { id: "progmoney", n: "08", title: "Programmable money", sub: "Contracts, fuel, and tokens", color: "oklch(0.60 0.078 205)", colorText: "oklch(0.45 0.088 205)", colorTextDark: "oklch(0.85 0.080 205)", lessons: ["contracts", "gas", "tokens"],
      intro: "A secure ledger is just the foundation. Once a network can store data and agree on it, it can run programs nobody can switch off. This chapter is about writing one, paying for the electricity it burns, and using it to mint assets that live on the chain." },

    { id: "frontier", n: "09", title: "The frontier", sub: "Markets, scaling, and privacy", color: "oklch(0.60 0.078 245)", colorText: "oklch(0.45 0.088 245)", colorTextDark: "oklch(0.85 0.080 245)", optional: true, lessons: ["amm", "mev", "layer2", "zk"],
      intro: "Everything up to here is the machine itself. This chapter is what people built on top of it: markets that trade with nobody on the other side, the invisible tax charged by whoever orders the queue, the engineering that makes a slow chain fast, and the cryptography that hands privacy back to a public ledger. Fascinating, and entirely optional." },

    { id: "state", n: "10", title: "Money & the state", sub: "Public money, and the disasters that shaped the rules", color: "oklch(0.60 0.078 300)", colorText: "oklch(0.45 0.088 300)", colorTextDark: "oklch(0.85 0.080 300)", optional: true, lessons: ["money", "history", "regulation"],
      intro: "Technology does not exist in a vacuum. It exists in markets, built by humans, under enormous financial pressure, and inside legal systems that were written long before any of this. This chapter covers stablecoins and central bank digital currencies, the spectacular failures that proved every rule you have just learned, and how governments actually regulate the thing." },

    { id: "capstone", n: "11", title: "The whole machine", sub: "Watch every piece work together", color: "oklch(0.60 0.078 358)", colorText: "oklch(0.45 0.088 358)", colorTextDark: "oklch(0.85 0.080 358)", lessons: ["recap", "coin"],
      intro: "You've built every piece by hand: the keys, the signatures, the blocks, and the chain. Now, watch them all come together. This final chapter runs the entire machine." },
  ];

  const ORDER = WORLDS.flatMap(w => w.lessons);

  /* Optional lessons: interesting, but the core path never depends on them.
     A learner can skip every one of these and still finish a complete course.
     Whole chapters can be optional too (see `optional: true` above). */
  const OPTIONAL = new Set(["merkle", "sybil"]);
  WORLDS.forEach(w => { if (w.optional) w.lessons.forEach(id => OPTIONAL.add(id)); });

  const worldOf = {}; WORLDS.forEach(w => w.lessons.forEach(id => worldOf[id] = w));
  const CORE = ORDER.filter(id => !OPTIONAL.has(id));

  /* lesson renames across versions: old id -> new id (progress survives).
     Splitting a long lesson keeps the original id on the first half, so the
     second half simply starts unvisited. Never delete an entry from here. */
  const RENAMES = {};

  let completed = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || "[]");
    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.done) ? raw.done : []);
    list.forEach(id => { const cur = RENAMES[id] || id; if (ORDER.includes(cur)) completed.add(cur); });
  } catch (e) {}
  function save() { try { localStorage.setItem(LS, JSON.stringify({ v: 2, done: [...completed] })); } catch (e) {} }

  function isDone(id) { return completed.has(id); }
  function isOptional(id) { return OPTIONAL.has(id); }
  function setDone(id, v) { if (v) completed.add(id); else completed.delete(id); save(); }
  function reset() { completed.clear(); save(); }
  function worldDone(w) { return w.lessons.filter(isDone).length; }
  function totalDone() { return completed.size; }
  function coreDone() { return CORE.filter(isDone).length; }
  function nextOf(id) { const i = ORDER.indexOf(id); return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null; }
  function prevOf(id) { const i = ORDER.indexOf(id); return i > 0 ? ORDER[i - 1] : null; }
  /* the next thing on the core path; optional lessons are never "up next" */
  function nextCoreOf(id) { const i = ORDER.indexOf(id); if (i < 0) return null; for (let j = i + 1; j < ORDER.length; j++) if (!OPTIONAL.has(ORDER[j])) return ORDER[j]; return null; }
  function firstUndone() { return CORE.find(id => !isDone(id)) || ORDER.find(id => !isDone(id)) || ORDER[0]; }

  return {
    WORLDS, ORDER, CORE, worldOf, OPTIONAL,
    /* DEEP kept as an alias: older view code asks for it by that name */
    DEEP: OPTIONAL,
    isDone, isOptional, setDone, reset, worldDone, totalDone, coreDone,
    nextOf, prevOf, nextCoreOf, firstUndone,
    lessonsTotal: ORDER.length, coreTotal: CORE.length,
  };
})();
