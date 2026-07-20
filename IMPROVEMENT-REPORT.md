# The Blockchain Course — Ultra-Comprehensive Improvement Report

*Six parallel review passes: bug hunt, UI/UX design, copy & pedagogy, curriculum architecture, interactives design, frontend architecture/performance. Compiled 2026-07-19.*

**Overall verdict:** this is unusually good courseware. The hard math is right (Satoshi's gambler's-ruin formula, selfish-mining ⅓ threshold, birthday bounds, the 3.125 BTC subsidy — all verified correct for 2026). SHA-256 was re-verified against NIST vectors during this review (empty string, `"abc"`, the two-block `abcdbcde…` vector, a 1000-char input) — **all pass**. The reduced-motion discipline, `crypto.subtle` fallback, and the bridge texts between lessons are all above average for the genre. The findings below are what stands between "good" and "excellent."

---

## Part 0 — Consensus findings (flagged independently by 2+ reviewers; fix these first)

1. **`lessons.js:494` — Layer 2 lesson says zk-rollups use "the zero-knowledge maths from the previous lesson," but ZK is the *next* lesson** in `store.js` order. One-word fix: "previous" → "next". *(Curriculum + Copy)*
2. **`lessons.js:233` — Keys lesson shows `private key ↓ hash ↓ public key`, and the demo computes `pub = sha256(priv)`.** Real derivation is elliptic-curve multiplication; if it were a hash, the verification in beat 02 (which uses real ECDSA!) would be impossible. The lesson's own deeper panel describes EC multiplication correctly — the demo contradicts it. Fix: relabel the first arrow "↓ one-way elliptic-curve maths ↓"; keep "hash" only for pubkey→address (which really is a hash). *(Copy + Interactives — both called this the top factual error)*
3. **`forks` beat 02 — invented reversal odds (`50% × 0.25^conf`) contradict the course's own 51%-attack calculator** two lessons later, which implements Satoshi's real formula. A learner playing both gets two different physics. Fix: derive this beat's numbers from the same `prob(q, z)` with a stated attacker share. *(Copy + Interactives)*
4. **"Majority of nodes out-votes the liar" framing (`lessons.js:166`, `:514`, whatis beat 03, ledger beat 02) plants the exact Sybil misconception the doublespend deeper (`lessons.js:196`) later demolishes.** As taught, an attacker with 10,000 cheap VMs wins. Minimal fix: reword to "the other five copies still agree with each other, so the odd one out is ignored." Better fix: the "Sybil Machine" interactive (Part 5, idea #4). *(Copy + Interactives)*
5. **PoS slashing shown as 100% stake destruction for one double-sign (`lessons.js:375, 382`).** Ethereum's initial penalty is ~1/32 of stake; near-total loss only under correlated mass cheating — and that correlation penalty is the interesting design idea, currently erased. *(Copy + Interactives)*
6. **Hashing beat 03 ("guess the secret `marigold`") — caption says "you'll never recover it" while the demo proves you can.** Reframe: guessing is the only attack — hopeless for random 256-bit secrets, very possible for dictionary words, which is exactly why leaked password hashes get cracked. *(Copy + Interactives)*
7. **No scroll reset / focus move on navigation** (`js/app.js:10–20`): pressing Next at the bottom of a lesson lands mid-page in the next one; screen readers get zero announcement. Add `scrollTo(0,0)` + focus the new `h1`. *(UI + Architecture)*
8. **Canvas backdrops hardcode light-theme plum** (`js/app.js:27, 63–64`; confetti `#620d3c` at `:47`) — nearly invisible on the dark background `#140910`. Read colors from CSS variables via `getComputedStyle` and re-seed on theme toggle. *(UI + Architecture)*
9. **`markDone` fires only from the Next button** (`js/views.js:143–153`): arrow-keying through = 100% complete; finishing via "← Map" or browser back = no credit. Fix gently: mark done when `.lesson-end` intersects (the IntersectionObserver already exists); make *chapter* badges depend on exit-gate quizzes. *(UI + Curriculum)*
10. **`test.js` is broken and doesn't test what the README claims.** Running it today: `TypeError: cv.getContext is not a function` — caused by a dead `APP.heroCanvas()` call in `chapterGate` (`js/views.js:188`) whose markup has no canvas. It never loads `sha256.js` or `lessons-plus.js` — the exact file whose interaction caused the last shipped bug. README claims "verified against test vectors"; no such test exists in the repo (this review ran them externally: all pass). *(Architecture + verified directly)*
11. **Reduced-motion preference sampled once at load** (`js/app.js:8`, duplicated in `lessons-extra.js:12`, `lessons-plus.js:13`) — mid-session OS toggle ignored until reload. One shared `matchMedia(...).addEventListener("change", …)`. *(UI + Architecture)*

---

## Part 1 — Bugs & correctness

*(Note: the dedicated bug-hunt agent was cut off mid-run by a session limit; the architecture and copy passes covered most of this ground, plus direct verification below.)*

### Verified directly during this review
- **SHA-256 implementation is correct** — NIST vectors pass, including the two-block padding path and long inputs. Worth encoding as a real `test.js` (see Part 4, testing).
- **`test.js` fails as shipped** — stub only special-cases `starfield`, and `chapterGate`'s dead `heroCanvas()` call hits `cv.getContext`.

### From the architecture pass
- **Unguarded timers mutate detached DOM after navigation:** contract-drain `setInterval` (`lessons.js:409`, ~3s), tour pipeline `setTimeout` chain (`lessons-plus.js:110`, ~7.5s, no `document.contains` in `step`), quiz score-counter `setInterval` (`lessons-extra.js:77`). Everywhere else the codebase uses `document.contains(wrap)` guards — inconsistency, not absence. Cheap fix.
- **Duplicate `wireGo` definition** (`views.js:30` and `:32`).
- **Silent no-op patch helpers:** `setBeat`/`setHero`/`setDeeper`/`setBridge` and `addCheck` all guard with `if (L[id])` — a typo'd lesson id fails silently. Make them `console.error` loudly. Add a 5-line startup assertion: every `STORE.ORDER` id exists in `LESSONS` and vice versa. (Commit `8356423` — the Chapter Gate ReferenceError — is exactly this class of failure.)
- **Web Crypto calls have no try/catch** — a rejected `generateKey/sign/verify` leaves buttons dead. Wrap and downgrade to the existing fallback path with a visible note.
- **`tx` beat 01 bumps the account nonce when the *amount* changes** — nonce increments per confirmed transaction, not per edit. Minor but teaches the wrong thing in a lesson that defines the term.

---

## Part 2 — Copy & pedagogy

### Factual errors (beyond the consensus items above)

**Medium:**
- **99.9% vs ~0.05% mismatch** — `lessons-plus.js:274` says the Merge cut energy "by about 99.9%" next to a bar showing "~0.05% of PoW" (implies 99.95%). Same mismatch in `lessons.js:386/389`. Pick 99.95% everywhere.
- **`lessons.js:366` — "Even then, cannot: Rewrite deep, buried history"** in the attack lesson directly contradicts its own deeper three paragraphs later ("At 50% it becomes certain — a cliff, not a slope"). Replace list item with "Change the protocol's rules" (accurate, and currently claimed only in the deeper).

**Low:**
- `lessons.js:245` — "This is ECDSA, the same… Bitcoin and Ethereum use." Demo uses P-256; they use secp256k1 (plus Schnorr/BLS). Say "same scheme, sibling curve."
- `lessons.js:407` / `lessons-plus.js:329` — "a deployed contract cannot be patched": true by default, but upgradeable proxies are everywhere. Add one clause: "unpatchable *by default* — adding an upgrade key reintroduces a trusted party."
- `lessons-extra.js:335` — gossip delay "purely because light is not instant": propagation is dominated by verification/hops/bandwidth. "Purely because news takes time to travel" keeps the poetry.
- `lessons.js:430, 494` — zk-rollups mostly use SNARKs for *succinctness*, not secrecy. One inoculating clause in the zk deeper.
- **The word "nonce" defined twice with unrelated meanings, never disambiguated:** `lessons-extra.js:100` (tx: replay counter) vs `lessons.js:259` (mining throwaway number). Add: "(no relation to the transaction counter that borrows the same name)."
- "trillions of useless guesses" (`lessons-extra.js:202, 285`) understates the course's own 10²³ figure by ten orders of magnitude — "quintillions" is punchier *and* closer.
- Satoshi is name-dropped at `lessons.js:356` ("the odds are Satoshi's") before ever being introduced. Either introduce once in an early deeper or say "the whitepaper's own formula."
- **Spelling register mixed:** mostly British (-ise, flavours, centre) with American strays ("incentivize" `lessons.js:201`, "center" `lessons-extra.js:302`, "Recognizing" `lessons-extra.js:390`). Normalize to British.

### Top line edits (before → after)
1. `lessons.js:229` — "A private key gives a public key gives an address." → "A private key makes a public key; the public key makes an address."
2. `lessons.js:435/570` + `lessons-plus.js:588` — "opposite valence" (used 3×) → "pointed in opposite directions." Chemistry jargon in a course that never talks over the reader.
3. `lessons.js:363` — "Re-run — the odds above are the truth." → "Re-run it — over many runs, the outcomes converge on exactly the odds above."
4. `lessons-extra.js:391` — "here is the pattern-recognition, by drill." → "the only defence is pattern-recognition — so let's drill the patterns."
5. `lessons.js:375` — slashing copy → "burns a slice of its bond and ejects it — slashing. Cheat *en masse* and the slice approaches everything."
6. `lessons-extra.js:67` — quiz-fail copy says "the 'go deeper' panel **above**" but the panel renders *below* the beats. → "below."

### Quiz quality
- Question writing is above the bar: one correct option, distractors built from real misconceptions, wrong-answer explanations that restate the correct model. Safety drill (with two *non*-scam cards) is excellent.
- **`lessons-extra.js:483` (keys Q1):** correct answer "See payments to you — nothing else" is itself wrong — a public address exposes full balance and all outgoing history too. → "Watch your balance and history — but never spend."
- **Scoring tiers too generous:** with 2-question checkpoints, 1/2 lands "Solid grasp." Add a third question or demote the middle tier.
- **Coverage collapses in Chapter 05:** hashing, keys, whatis, chainlink, forks, attack, tx, incentives, gossip have quizzes; **15 lessons have none** — including contracts, wallets, layer2, zk — exactly the lessons whose misconceptions are most expensive in real life. (Structural fix in Part 6: chapter-exit gates.)

---

## Part 3 — UI / UX / Visual design

### Color & contrast (computed WCAG ratios against the real hex values)

- **Dark theme broken on hardcoded-white components (1.6:1 — near invisible):** `.xblock` gradient `#fff→#fcf9fb` (`app.css:302`), `.bigblock` (`:349`), `.mblk textarea` (`:280`), `.netnode` fill (`:482`). These are the flagship demos. Replace with `var(--surface)` / a new `--block-face` token.
- **Semantic colors not themed for dark:** `[data-theme="dark"]` (`app.css:761–779`) overrides everything except `--green/--red/--*-soft/--blue`. `.log .ok` = 3.66:1, `.log .bad` = 3.05:1 — both fail AA; pastel soft chips glare. Add dark variants (e.g. `--green:#4ecb92; --green-soft:#123526; --red:#f2708a; --red-soft:#3a1520`).
- **Marigold as text fails everywhere:** `--gold-2 #c67c05` on white = 3.34:1 (beat numbers `.bn`, `.target-line .t`, `.feechip .fee`). Raw chapter colors used as text are worse: crypto `#f1a222` = **2.11:1**, capstone `#d98908` = 2.79:1, frontier `#2e9e6b` = 3.38:1 (`views.js:94,96,109`). Fix: paired `colorText` per world in `store.js` (crypto text `#8a5a00`, frontier `#1e7350`), used anywhere color is foreground.
- **`--ink-4` (2.34:1) used for real text:** `.kbd-hint`, `.dropzone.empty` instruction, `.scroll-hint`, `.mpslot` labels. The dropzone one is an *instruction*. Promote readable uses to `--ink-3` (5.3:1).
- Smaller: `.btn.gold:hover` white-on-`#d98908` = 2.79:1 (keep the dark ink on hover); green-on-green-soft 4.07:1 at 13–14px (darken to `#1e7350`); dark-mode `--plum` at 13px mono = 3.50:1 (add a `--plum-text`).

### Navigation & information architecture
- **Highest-impact single fix in the whole report: main nav is not keyboard/SR navigable.** Every nav element is `<a data-go>` *without* `href` — unfocusable, no link semantics: nav links (`views.js:23`), mobile nav (`:26–27`), lesson back link (`:108`), chapter-gate cards (`:172`), world-rail (`:98`). Routing is hash-based, so the fix is just `<a href="#/map">` — `hashchange` already routes; most `data-go` wiring can be deleted. (Map `.lnode`s already do it right.)
- **Map page under-informs:** header is literally `<h1>Map</h1>`; the app's home base deserves a resume block — progress bar + "Continue: *{next lesson}* →". Chapter gates reachable only via a `title=` tooltip on the world-rail title — make it an explicit labeled chip.
- **Mobile lesson bar hides the `12 / 25` counter** under 640px (`app.css:205`) — keep `.nums`, it's 40px and answers "where am I."
- **"Restart course" styled as a peer CTA in the hero** (`views.js:53`) with native `confirm()`. Demote to map footer; inline two-step confirm.
- ~40 lines of dead CSS no longer rendered by `home()` (`.jlist/.jrow`, `.tryrow/.trybox`, `.howlist`, `.scroll-hint`).

### Demo interaction & accessibility
- **Clickable divs:** `.txchip`, traceable `.xblock`, `.mnode` merkle nodes, SVG `.netnode` — mouse-only. Make chips/nodes real `<button>`s; `tabindex="0"` + Enter on the SVG circles.
- **Zero live regions:** every demo result (`.sig-state`, `.linkmsg`, `.verdict`, hash outputs) is silent to screen readers. `aria-live="polite"` on ~6 shared primitives covers most of the course.
- **Heading order skips:** lesson `h1` → beats `h3`; quiz result `h4`. Make beats `h2`.
- Range-slider focus ring outlines the track, not the thumb; add a thumb `box-shadow` on `:focus-visible`.
- Horizontal-scroll chains (`.xchain/.mchain`) have no off-screen cue — edge-fade mask + `scroll-snap-type: x proximity`.
- Theme toggle: add `aria-pressed`; `aria-hidden="true"` on meaning-paired emoji (🔒/⚠️).

### Mobile & responsive
- **Touch targets under 44px:** hamburger is 28×18 (most-tapped control — pad to 44×44), theme toggle 34×34, `.lbtn` ≈33px, `.quiz-skip` ≈24px. Bump under `@media (pointer:coarse)`.
- **Hamburger semantics:** no `aria-expanded`/`aria-controls`; overlay `z-index:49` sits *below* nav `z-index:50` while the button jumps to `1001`; no body scroll lock; no Esc-close. Also: full-screen overlay for exactly two links is heavyweight — a compact inline pair might beat it.
- Define a z-index scale (`--z-bg/--z-content/--z-bar/--z-nav/--z-overlay`) instead of `0/1/40/49/50/1001`.
- Map nodes: fixed `width:172px` flex-wrap leaves a ragged gutter at 375px → `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`.
- Starfield reseeds all dots on every mobile URL-bar resize — guard to width changes; halve density and skip the O(n²) line pass under 640px.

### Typography & polish
- **Chapter-gate title is faux-bold:** `.cg-title { font-weight:800 }` but Fraunces loads at 400–600 → browser-synthesized mush; also `--ink` while every sibling page title is `--plum`. Use `600` + `var(--plum)`.
- **Micro-type below legibility floor:** 8.5px `.xlbl`/`.hashtag`, 9px `.ms-tag`/`.mblk .r .k`, 9.5px `.nf-k` — field labels users must read. Floor at 10.5–11px.
- ~14 distinct font sizes between 8.5 and 16.5px — snap to 6 token steps.
- Theme switch is a hard cut — 250ms color transition class around the toggle, canvas palette swap in the same tick.
- Completion has no moment — one scaleY pulse on the progress bar + brief "+1".
- "Start here" map node: slow gold ring pulse (reuse `frkpulse`, RM-guarded) to make the entry point findable among 25 nodes.

---

## Part 4 — Architecture, performance, maintainability

### 1. The three-file override chain is the core tech debt (High)
`lessons.js` defines `window.LESSONS`; `lessons-extra.js:459–462` mutates it; `lessons-plus.js` patches **by numeric beat index** (`setBeat("why", 2, …)`). Inserting one beat silently corrupts every later patch — no error. Four sources of truth must agree (three files + `STORE.WORLDS[].lessons`). Drift already visible: every lesson carries a `world:` property nothing reads.

**Consolidation (stays no-build), in order:**
1. **Fold the patches in once** — lessons-plus payloads are final content, not runtime config. Mechanical one-time edit.
2. **Native ES modules** (`<script type="module">`) — one file per chapter, a registry module assembling `LESSONS` and deriving `ORDER`/`worldOf` (kills the `store.js` duplicate list, the load-order coupling, and the hand-bumped `?v=35` cache keys in one move).
3. If layering must remain: stable string beat ids, patch by id, throw on unknown targets.

### 2. Mining runs synchronously on the main thread during render (High)
`richChain` mines every block in its constructor (`lessons.js:22`); `chainlink` builds three diff-3 chains ≈ 40–50k hashes inside one navigation render — hundreds of ms of jank on mid-range mobile. Fixes, cheapest first:
- **Precompute the nonces** — all inputs are deterministic literals; winning nonces never change. Ship them inline or memoize. Removes ~95% of cost, zero architecture change.
- Time-budget batches: `while (performance.now() - start < 8)` inside rAF instead of fixed counts.
- Lazy-build beats on first intersection (the IntersectionObserver already exists).
- Web Worker only if difficulty ever grows for spectacle.

### 3. index.html quick wins (High value, cheap)
- **Fonts load via CSS `@import`** (`app.css:7`) — fully serial chain, likely the single biggest first-paint win. Move to `<link rel="preconnect">` + `<link rel="stylesheet">` in head.
- **No social meta:** no og:/twitter:/canonical/theme-color/apple-touch-icon — public link previews render bare.
- **Dark-flash:** theme applied in `boot()` after all scripts parse. 3-line inline head script before the stylesheet kills it.
- **PWA:** fully static site — `manifest.json` + ~30-line cache-first service worker = whole course offline. Unusually cheap here, great fit for a course.

### 4. Lifecycle & state
- Replace the `window._lessonIO`-style teardown-by-convention with a `cleanups[]` array drained by `route()`.
- **`store.js` has no versioning/migration:** renamed lesson id = silently lost progress. One versioned envelope `{v:2, done:[...], theme}` + a `RENAMES` map at load (~20 lines). Theme currently lives under a bare `"theme"` key outside the namespace.
- **XSS surface near-zero by luck, not design:** only escaping call in the codebase is `replace(/</g,"&lt;")` in richChain. Add an `esc()` helper next to `el()` and use it for anything that touched an input; prefer `textContent` for pure text.

### 5. Testing (currently: one broken test)
Cheap no-framework tests worth having (plain `node` + `assert`):
1. **sha256 NIST vectors** — verified passing during this review; encode it.
2. **Curriculum invariants** — every `ORDER` id exists in `LESSONS` and vice versa; every `BRIDGES` key targets a real lesson; every quiz has exactly one `ok:true`; every lesson has ≥1 beat. Would have caught the last shipped bug class.
3. **Build smoke test** — call every `beat.build()` against a minimal DOM with the *production* script stack (fix the stub: `getContext` everywhere, load `sha256.js` + `lessons-plus.js`).
4. **store.js edges** — `nextOf`/`prevOf`, `firstUndone` when all done, corrupted payload.

### 6. Code-health inventory (do while consolidating)
Helpers `el/short/P/RM` re-declared in all three lesson files; sun/moon SVGs duplicated in `app.js` and `views.js`; Merkle root computed three separate times; dead: `sha256.toBits`, duplicate `wireGo`, `if (s.vx)` on dots that never get `vx`, unused `world:` property, `chapterGate`'s `heroCanvas()` call; ~160 inline `style="…"` attributes, several with hardcoded colors that bypass theming.

---

## Part 5 — Interactives

### Inventory summary
~60 beats total; **only ~12 are genuinely explorable** (learner varies input, tests a prediction) — the rest are press-button-watch or static. The polish pass made several demos *prettier but less interactive* (ledger, doublespend, tokens). Gold standard existing demos: hashing 01/02 (avalanche), **attack 01** (sliders + analytic formula + monte-carlo the learner can use to *distrust and check* the number — the model every demo should copy), tx 02 (mempool auction — the only real fail-then-retry loop), chainlink 03 (tamper cascade), incentives 01 (scored vs greedy optimum), zk cave, safety drill.

### Upgrades to weak existing demos
1. **keys 02:** "Tamper" hardcodes `5→5000` — let free edits after signing count as the tamper, challenge: "change the message so it still verifies." Discovering nothing works is the point. One-line change.
2. **forks 01:** branch choice has mirror-image outcomes = fake choice. Put *your* transaction in branch #4a only — orphaning becomes personal.
3. **forks 02:** derive from `prob(q,z)` (see consensus #3).
4. **pos 01:** make the learner a validator — stake slider, epochs, a bribe offer. Slashing becomes a bet you personally lose.
5. **gossip 02:** add one "block time" slider + orphan-rate readout → scene becomes experiment.
6. **contracts 02:** show the two-line `withdraw()`, learner orders `send` vs `balance -= x`. Wrong order → existing drain animation, now *earned*.
7. **tokens 02 (NFT tap-to-claim):** currently demonstrates the *opposite* of ownership — no signature, no scarcity. Claiming should require signing with a key; a second simulated user should *fail* to claim yours.
8. **wallets 01:** add "type your own phrase" → same phrase, same addresses, every time; one flipped character → different wallet. Determinism aha is currently never tested.
9. **chainlink 03:** re-mining is instant and free — add a cost counter ("you re-did 214,000 guesses… meanwhile the honest network added block #5") so futility is felt.
10. **recap 01:** one "inject a bad tx" button whose forged signature gets rejected at Settle — the machine defending itself is the course's thesis.

### New interactives, ranked by learning impact
| # | Name | Concept | Effort |
|---|------|---------|--------|
| 1 | **The Double-Spend Heist** | Pay a merchant, secretly mine a fork (hashrate slider), choose when to reveal; profit/loss tally over runs. Confirmations become a defense you *feel* beat you. Replaces forks-02's fake numbers. | M (all parts exist) |
| 2 | **Difficulty Thermostat Flight Sim** | Drag global hashrate over time; network retargets; try to make blocks permanently fast — and fail. Answers the #1 beginner question the course skips. | M |
| 3 | **Fork Lab** | Block-interval + latency sliders on the existing gossip engine; auto-run 50 races, live orphan-rate. Why Bitcoin is slow *on purpose*. | M (reuses gossip wholesale) |
| 4 | **The Sybil Machine** | Phase 1: consensus by node-vote — "spawn 1,000 fake nodes," win any vote free. Phase 2: hashpower-weighted — your fakes share one CPU, you lose. Highest concept-per-line-of-code available; repairs consensus mislead. | **S** |
| 5 | **Sandwich! (MEV game)** | You're the block producer: reorder the mempool, front-run + back-run a victim's DEX trade; "private relay" toggle kills your edge. | M |
| 6 | **Gas Surge Auction** | Adaptive simulated peers rebid; budget + deadline; fee histogram per block. Why fees 100× during hype. | S/M |
| 7 | **One Word Missing** | Seed phrase with 1 word smudged → brute-forced in seconds; 4 missing → age-of-universe ETA. Both sides of entropy at once. | S/M |
| 8 | **Crack My Secret** | Replaces hashing 03: learner picks the secret (name / word / 4 random words / hex), unleashes a real dictionary attacker (~50k H/s in-browser). "The hash is never the weak point — your input is." | **S** |
| 9 | **Catch the Lying Server** | Server answers light-wallet queries with Merkle proofs, sometimes forged; learner verifies and rules valid/forged, scored like the scam drill. | **S** |
| 10 | **Mining P&L Dashboard** | Price/electricity/hashrate sliders; competitors enter until margin ≈ 0; crash the price, watch security bleed. Security is a budget. | S/M |
| 11 | **Reentrancy: One-Line Heist** | Drag-order the 3 lines of `withdraw()`; attacker recurses mid-execution. The DAO hack in one drag. | M |
| 12 | **Death Spiral** | Operate an algorithmic stablecoin peg; small shocks fine; big shock → the defending mechanism *is* the killing mechanism. Why Terra died. | M |
| 13 | **Validator's Dilemma** | 20 epochs; honest/offline/bribed; slashing scales with how many simulated validators also cheat (real correlation-penalty shape). | M |
| 14 | **Blockchain Workbench** | Sandbox freeplay: real ECDSA wallets, mempool, mining, tamper anything — a validator panel names every violation. Assembly, not invention. | L |
| 15 | **Nonce Reuse = Game Over** | Reused ECDSA nonce → extract the private key (toy curve, honestly labeled); the PS3 jailbreak story. | M/L |

**If only three:** #1, #2, #4 — they cover the biggest experiential gap (economics/attacks are told, not played), fix the two worst factual misleads as a side effect, and reuse existing engines.

---

## Part 6 — Curriculum architecture

**The spine (00→04) is excellent** — the BRIDGES map makes every lesson end on the exact question the next answers; all bridge directions verified correct against `store.js` order. Keep it linear; resist a prerequisite DAG.

### Ordering changes
- **Chapter 03 is the difficulty spike / likely #1 drop-off** (6 lessons; merkle interrupts the *pack → mine → get paid → lock* emotional arc and nothing downstream hard-depends on it). Make merkle the first optional **Deep dive** node — visible on the map, skipped by `firstUndone()`, never blocking.
- **Split Chapter 05 (7 lessons) into three:** *Programmable money* (contracts, tokens, + future gas/AMM/oracles) · *Your keys, your problem* (wallets, safety) · *Scaling, privacy & the state* (layer2, zk, money). Fixes the 3/2/2/6/4/7/1 pacing asymmetry.
- **Don't merge chapters 00 and 01** — two completion checkmarks in the first 20 minutes builds momentum.
- **Near-duplicate demo:** `block` beat 02 ≈ `chainlink` beat 03 (both editable richChain with re-mine). In block's position the learner hasn't met "prev" yet. Replace block beat 02 with a static labeled anatomy view; let chainlink own the tamper-cascade moment.
- Keep the fee-auction spiral (tx + incentives, buyer's then seller's side); add one cross-reference sentence.

### New module proposals (ranked value ÷ effort)
1. **Build your own coin** (capstone, M) — current recap is passive. Learner names a token, sets supply + halving, mines their genesis block, signs transactions between generated addresses, survives a scripted 51% attempt *on their own chain*. Pure composition of existing primitives. Highest emotional payoff per unit of work.
2. **Swap without a seller — AMMs** (M) — x·y=k curve; drag trade size, watch slippage grow nonlinearly; then LP + impermanent loss. The killer "contracts + tokens = something new" payoff.
3. **UTXO vs accounts** (S) — the course silently mixes models today (tx is account+nonce; mining lessons are Bitcoin-flavored). Pay 7 coins from a 10-coin note; watch change come back; toggle to account mode. Could be a third beat inside tx.
4. **Gas: the fuel meter** (M) — step a tiny program with a draining fuel tank; too small → revert (reuses vending machine); gas-price slider links back to the fee auction.
5. **History timeline** (S–M) — the course name-drops FTX, Terra, DAO hack with zero backstory. Flip cards whose reverse names the course concept each event proves ("Mt. Gox = not your keys"). Place before the capstone; retroactively glues the curriculum to reality.
6. **Mining pools** (S) — solo-mine at 0.1%: brutal lottery; join a pool: smooth drip, same expected value (genuinely counterintuitive variance lesson); drag pool share toward 51% → connects into the attack lesson.
7. **Oracles** (S) — one oracle lies, payout wrong; five + median, lie outvoted (pleasing echo of lesson one).
8. **MEV — deep dive** (S–M) · 9. **Seed phrases in depth** (S) · 10. **Bitcoin Script — deep dive** (M) · 11. **Lightning — deep dive** (M).

*Deliberately excluded:* regulation/taxes (dates fast, no interactive), standalone environmental module (pos beat 02 covers it), privacy coins (one sentence in zk), DAOs as full module (worth one beat).

### Structural recommendations
- **a. Two-track structure (Core + Deep dives)** — highest-leverage change; a `deep:true` flag, `firstUndone()` filters core, map renders deep nodes as satellites. Charter members: merkle, zk, MEV, Script, Lightning. Caps every core chapter at ≤5 lessons.
- **b. Chapter-exit gates with cumulative quizzes** — use the existing chapterGate pages as *exit* gates: 4–5 questions, 1–2 from earlier chapters = spaced repetition with zero new UI primitives. Fixes the 15-lessons-without-quizzes hole without writing 15 quizzes.
- **c. One cumulative challenge per act:** "Find the forgery" after Ch 03 (locate the pre-tampered block by reading broken links); "Survive the attack" after Ch 04 (pick confirmations + fee under time pressure vs a 30% attacker). Tests transfer, not recall.
- **d.** Lesson checkmarks stay free; chapter badges require the exit gate (fixes arrow-key-to-100%).
- **e.** Time estimates on chapter gates ("~15 min · 4 lessons · 9 demos") — one line of copy, measurable abandonment reduction where Ch 03/05 bleed.

**Suggested end-state:** 00 Start here (3) · 01 Big idea (2) · 02 Cryptography (2) · 03 Building the chain (5 core + merkle/Script deep) · 04 Network agrees (5, +pools) · 05 Programmable money (5 + MEV deep) · 06 Your keys (3) · 07 Scaling/privacy/state (3 + Lightning deep) · 08 History (1) · 09 Capstone: build your own coin (1).

---

## Master priority list

### Do this week (hours, not days)
1. `lessons.js:494` "previous" → "next" (one word).
2. Relabel keys derivation arrow (consensus #2) + the 6 line edits in Part 2.
3. Real `href`s on all navigation + `scrollTo(0,0)` and focus reset in `route()`.
4. Dark theme: kill hardcoded whites, add dark `--green/--red/--*-soft`, theme the canvases.
5. Font loading via `<link>` + preconnect; inline dark-theme bootstrap; og:/twitter: meta.
6. Precompute richChain nonces (kills navigation jank).
7. `document.contains` guards on the 3 unguarded timers; delete dead code (duplicate `wireGo`, dead `heroCanvas()` call — which also unbreaks test.js).
8. Make patch helpers loud on unknown ids + ORDER↔LESSONS startup assertion.
9. Fix test.js and add sha256-vector + curriculum-invariant tests (~50 lines; vectors already verified passing).
10. Touch-target/hamburger pass (44px, `aria-expanded`, overlay above nav) + `aria-live` on shared demo primitives.

### Do this month
- Fold lessons-plus patches into base definitions, then ES-module conversion with a single lesson registry feeding STORE.
- Chapter-exit quiz gates + Chapter 05 split + merkle → deep-dive.
- Forks-02 rewrite using `prob(q,z)`; Sybil Machine (S); Crack My Secret (S); keys-02 free-edit tamper (one line).
- Versioned localStorage envelope + rename map; `cleanups[]` lifecycle registry.
- World `colorText` pairs; typography floor + scale tokens; map resume block.

### The big swings (each 1–2 weeks, transformative)
- **Build your own coin capstone** — the course's missing emotional payoff.
- **Double-Spend Heist + Difficulty Flight Sim** — economics/attacks played, not told.
- **AMM + Gas modules** — completes the "programmable money" story.
- **PWA layer** — the whole course, offline, installable.
