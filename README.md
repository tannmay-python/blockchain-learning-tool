# Blockchain, Built From Scratch — an interactive course

A self-paced, **gamified course** that takes someone from *"I don't know what a blockchain is"*
to an **ultra-technical** understanding — by having them build one, piece by piece, in the browser.

Not a slideshow and not an endless scroll: it's a **dashboard** with a lesson map on the left and
one focused, hands-on lesson at a time on the right. Crucially, the games are **connected** — there
is a single thread of state running through the whole course:

> You **generate your own keypair** → **sign a transaction** with it → that transaction is **bundled
> into a block** → you **mine that block** → it **joins the chain** → then you **attack the chain you
> built**. Each game's output is the next game's input.

Everything runs locally. SHA-256 is computed for real; signatures use real **Web Crypto ECDSA P-256**.

## Run it

```bash
cd blockchainResearchSeminar
python3 -m http.server 4321      # then open http://localhost:4321
```

Use the sidebar, the **Next/Previous** buttons, or the **← / →** arrow keys. Progress is saved in
your browser (`localStorage`); "Reset progress" clears it.

## The 15 lessons, in 5 acts

**Act 1 · Why blockchain?**
1. **The Ledger** — money is a record; cheat a central bank vs. a distributed network.
2. **The Double-Spend Problem** — spend one coin twice; see why ordering needs consensus.

**Act 2 · Cryptography**
3. **Hashing** — live SHA-256; the avalanche effect; one-wayness.
4. **Your Keys** — generate the ECDSA keypair that *is your identity* for the rest of the course.
5. **Signing** — sign a payment with your key; watch an attacker's tampering get rejected.

**Act 3 · Build a chain**
6. **The Block** — bundle *your* transaction; build a Merkle tree; prove inclusion in O(log n).
7. **Mining (PoW)** — find the golden nonce for *your* block; difficulty/target math; append it.
8. **The Chain** — tamper with a past block and watch the whole chain break (immutability).

**Act 4 · Consensus**
9. **The Mining Race** — hash power = win probability; reward share converges over 100 blocks.
10. **Forks** — trigger a fork, resolve it with the longest-chain rule (why confirmations matter).
11. **The 51% Attack** — set hash power + confirmations; success probability uses **Nakamoto's
    exact formula from §11 of the Bitcoin whitepaper** (verified against the paper's own values).
12. **Proof of Stake** — stake-weighted selection; make a validator cheat and get slashed.

**Act 5 · The frontier**
13. **Smart Contracts** — call a contract; pay too little → revert; pay enough → dispense.
14. **Zero-Knowledge** — the Ali Baba cave; prove you know a secret without revealing it.
15. **Recap & Frontier** — the chain *you* built, plus rollups, RWA, CBDCs, interop, AA, and policy.

## Structure

```
index.html        app shell (sidebar + stage + nav)
css/app.css       light, playful design system
js/sha256.js      pure-JS SHA-256 (verified against test vectors)
js/engine.js      shared course state (the synced thread), crypto, chain/Merkle helpers
js/ui.js          DOM + component helpers (goal banners, cards, confetti, toasts)
js/lessons.js     all 15 lessons
js/app.js         sidebar map, routing, progress, lesson navigation
```

## Presenter tips

- Each lesson follows the same rhythm: **plain-language concept → 🎯 a game with a clear goal →
  💡 a "what this means" insight** that sets up the next lesson. Narrate the goal, play the game,
  land the insight.
- The strongest live moments: tamper the chain (L8), the 51% probability slider (L11), and the
  reveal in L6 that *your* signed transaction is sitting inside the block you then mine.
