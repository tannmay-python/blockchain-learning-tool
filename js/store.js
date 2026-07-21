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
      intro: "Before writing any code, it helps to see the actual problem. For centuries, banks have kept score of who owns what. Take the bank away, and something still has to stop a person from spending the same digital dollar twice. This chapter is about that problem, usually called double-spending, and why it turns out to be harder to solve than it sounds." },

    { id: "foundations", n: "01", title: "The big idea", sub: "What a blockchain actually is, and who runs it", color: "oklch(0.60 0.078 10)", colorText: "oklch(0.45 0.088 10)", colorTextDark: "oklch(0.85 0.080 10)", lessons: ["whatis", "tour", "nodes"],
      intro: "A blockchain is a shared record book that nobody can quietly edit. Instead of one company holding it, thousands of computers each keep an identical copy. This chapter is the bird's-eye view before the maths: what the thing actually is, what happens to a single payment from start to finish, and who is running all these computers in the first place." },

    { id: "crypto", n: "02", title: "Cryptography", sub: "The two tools everything is built from", color: "oklch(0.60 0.078 40)", colorText: "oklch(0.45 0.088 40)", colorTextDark: "oklch(0.85 0.080 40)", lessons: ["hashing", "keys", "merkle"],
      intro: "Don't let the word 'cryptography' put you off. The whole system runs on two tools: a digital fingerprint that makes tampering obvious, and a digital signature that proves you own your money. Almost everything else in this course is really just those two tools, reused over and over." },

    { id: "chain", n: "03", title: "Building the chain", sub: "Transactions, blocks, and locking the past", color: "oklch(0.60 0.078 68)", colorText: "oklch(0.45 0.088 68)", colorTextDark: "oklch(0.85 0.080 68)", lessons: ["tx", "block", "chainlink"],
      intro: "Now you build it yourself. You'll look inside a single transaction, pack a batch of them into a block, and link the blocks together so the past can't be quietly rewritten. That link between one block and the next is the part actually called a chain." },

    { id: "mining", n: "04", title: "Mining", sub: "Burning work to seal the record", color: "oklch(0.60 0.078 95)", colorText: "oklch(0.45 0.088 95)", colorTextDark: "oklch(0.85 0.080 95)", lessons: ["nonce", "difficulty", "incentives"],
      intro: "Linking blocks together is cheap. The actual trick is making each block expensive to produce, on purpose. This chapter covers the puzzle miners race to solve, the thermostat that keeps blocks arriving roughly every ten minutes no matter how many miners join, and the reward that gives anyone a reason to mine in the first place." },

    { id: "consensus", n: "05", title: "The network agrees", sub: "Thousands of strangers, one history", color: "oklch(0.60 0.078 122)", colorText: "oklch(0.45 0.088 122)", colorTextDark: "oklch(0.85 0.080 122)", lessons: ["gossip", "sybil", "forks"],
      intro: "Getting one computer to follow the rules is easy. Getting thousands of strangers scattered across the world to agree on the exact same history, with no referee, is the actual hard problem this chapter solves. It covers how news spreads with no central broadcaster, why the network can't just take a vote, and what happens when two miners find a block at the same moment." },

    { id: "attacks", n: "06", title: "Attacks & alternatives", sub: "Breaking it, and the other way to build it", color: "oklch(0.60 0.078 150)", colorText: "oklch(0.45 0.088 150)", colorTextDark: "oklch(0.85 0.080 150)", lessons: ["attack", "finality", "pos"],
      intro: "This chapter is about what happens when someone tries to break the system, not just how it's supposed to work. You'll run the famous 51% attack yourself and watch how much it actually costs to pull off, see why merchants wait for confirmations before shipping goods, and look at Proof of Stake, which solves the same problem by putting capital at risk instead of burning electricity." },

    { id: "keysworld", n: "07", title: "Your keys, your problem", sub: "Custody, recovery, and losing everything", color: "oklch(0.60 0.078 178)", colorText: "oklch(0.45 0.088 178)", colorTextDark: "oklch(0.85 0.080 178)", lessons: ["wallets", "seed", "safety"],
      intro: "On a blockchain, there is no password reset and no fraud department to call. A wallet is just a key, and whoever holds the key owns the coins. That makes you the owner and the single point of failure, both at once. This chapter covers what a wallet actually holds, how twelve ordinary words can back up a fortune, and the different ways people manage to lose it all anyway." },

    { id: "progmoney", n: "08", title: "Programmable money", sub: "Contracts, fuel, and tokens", color: "oklch(0.60 0.078 205)", colorText: "oklch(0.45 0.088 205)", colorTextDark: "oklch(0.85 0.080 205)", lessons: ["contracts", "gas", "tokens"],
      intro: "A secure ledger is only the foundation. Once a network can store data and agree on it, it can also run programs that nobody controls and nobody can switch off. This chapter covers writing one of those programs, paying for the computing it uses, and using it to create assets that live directly on the chain." },

    { id: "frontier", n: "09", title: "The frontier", sub: "Markets, scaling, and privacy", color: "oklch(0.60 0.078 245)", colorText: "oklch(0.45 0.088 245)", colorTextDark: "oklch(0.85 0.080 245)", optional: true, lessons: ["amm", "mev", "layer2", "zk"],
      intro: "Everything up to this chapter is the machine itself. This one covers what people have built on top of it since: markets that trade with nobody on the other side, the hidden fee charged by whoever gets to order the queue, the engineering that makes a slow chain fast, and the cryptography that hands privacy back to a public ledger. All of it is optional — the core course doesn't depend on any of it." },

    { id: "state", n: "10", title: "Money & the state", sub: "Public money, and the disasters that shaped the rules", color: "oklch(0.60 0.078 300)", colorText: "oklch(0.45 0.088 300)", colorTextDark: "oklch(0.85 0.080 300)", optional: true, lessons: ["money", "history", "regulation"],
      intro: "Every rule in this course has been tested against real money, real markets, and real governments, and some of those tests failed badly. This chapter covers stablecoins and central bank digital currencies, the collapses that exposed exactly where the earlier chapters' assumptions break down, and how governments actually regulate any of this." },

    { id: "capstone", n: "11", title: "The whole machine", sub: "Watch every piece work together", color: "oklch(0.60 0.078 358)", colorText: "oklch(0.45 0.088 358)", colorTextDark: "oklch(0.85 0.080 358)", lessons: ["recap", "coin"],
      intro: "You've built every piece of this by hand: the keys, the signatures, the blocks, the chain. This final chapter puts all of it together and runs the whole machine." },
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
