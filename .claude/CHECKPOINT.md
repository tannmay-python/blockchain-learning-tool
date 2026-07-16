# Session checkpoint — 2026-07-16 (final ship pass)

Resume ritual: read this file, then `git log --oneline -8`, `git status`.

## Where it stands
Shipping build. **The Observatory is gone** (removed entirely on request). The product is now a
single focused thing: the course, 7 chapters · **25 lessons** · 60+ hands-on demos, all light-theme.

## This pass (v34)
1. **Removed the Observatory** — deleted `js/observatory.js`; stripped the `#/live` route (app.js),
   the nav link + home teaser (views.js), and all `.obs-*` / teaser CSS (~107 lines). The old
   `#/live` hash now falls through to home gracefully. `window.OBS` is undefined.
2. **New module — `tx` "Inside a transaction"** (Chapter 03, first lesson). Beat 1: an anatomy
   card (from/to/amount/fee/nonce) whose signature re-seals as you nudge the amount and breaks when
   you tamper. Beat 2: a live **mempool** — broadcast your tx, watch a miner take the top fees into a
   4-slot block; raise your fee to win the auction. Beat 3: checkpoint quiz. Fills the real gap
   between `keys` (you signed something) and `block` (you bundle things), and gives the mempool a home.
3. **Restructured Chapter 03** → `tx, block, merkle, nonce, incentives, chainlink` (was
   `block, nonce, incentives, chainlink, merkle`). Clean build order: atomic unit → bundle → summarise →
   seal → pay → link.
4. **Brought the last static interactives to life** (all `lessons-plus.js` overrides):
   - `ledger` b1: coins fly between people while the balances tick — but the point is nothing moves.
   - `doublespend` b1: the coin visibly clones to Bob **and** Carol; b2: broadcast both, network picks
     an order, first confirms / second rejected as a double-spend.
   - `whatis` b1: the block fingerprint rescrambles on every added record (avalanche feel).
   - `forks` b1: the chain visibly splits into #4a/#4b, then the extended branch wins and the other
     greys out to an orphan.

## Verified (browser, localhost:4321)
- All **25** lessons build every beat: **0 build errors, 0 console errors**.
- `tx` mempool state machine: broadcast→mine(lose at 0.3)→raise(0.8)→mine(win)→locks as done. Correct.
  Added a `miningToken` generation guard so a Reset/re-mine during the 620ms settle can't corrupt state.
- ledger / doublespend×2 / whatis / forks all drive correctly.
- Home nav = Home · The Journey only; hero reads "7 chapters · 25 lessons · 63 hands-on demos".

## Hard-won environment notes (unchanged)
- Browser pane: screenshots blank after a couple of programmatic scrolls (pane bug — verify via JS
  state probes); `navigate` to the *same* URL does **not** reload (stale closures) — use a
  `?v=Date.now()` cache-buster to force a true reload when testing stateful widgets.
- rAF + setTimeout throttled in the pane; `.fcard` is now `position: relative` so `.flycoin` anchors
  correctly (also fixes the old tokens fly).
- ECC GateGuard stays off via `~/.claude/settings.json` env.

## Parked (only if asked)
- Reference-card beats (attack can/cannot, zk/money/recap summaries, layer2 tps bars) are intentionally
  static — lists doing a list's job.
- Could add a second new module if a genuinely non-redundant topic comes up (gas from the user's side,
  Bitcoin-vs-Ethereum landscape). Held back to protect the no-filler quality bar.
