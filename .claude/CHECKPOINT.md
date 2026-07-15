# Session checkpoint — 2026-07-15 (Observatory build)

If resuming with "continue": read this whole file, then `git log --oneline -5` and `git status`.

## Context
- Repo renamed blockchain-seminar → **blockchain-learning-tool** (GitHub + local `~/Desktop/blockchain-learning-tool`). Brand: **"The Blockchain Course"**. Deploy: GitHub Pages from `main` root (auto on push). Live: https://tannmay-python.github.io/blockchain-learning-tool/
- v6 (commit e0be23d) shipped: rebrand, 3 new lessons (incentives/gossip/safety), checkpoint quizzes, home + design overhaul. All 24 lessons verified clean.
- ECC GateGuard disabled via `~/.claude/settings.json` env `ECC_GATEGUARD=off` — leave it.
- Tannmay feedback after v6: removed home sections "Your first sixty seconds" + "How this course teaches" (DONE). Wants something far more ambitious visually — "The Network" gossip sim was the only interactive he loved; rest felt dry, copy "subpar". Asked for a visualization layer on top of the course layer, worth revisiting repeatedly.

## The build: THE OBSERVATORY (route #/live)
Full-screen dark cinematic living blockchain. One canvas stage + DOM overlay.

Design (agreed with self, follows impeccable skill):
- Dark layer: bg near-black plum (#160511-ish), gold/plum glow. Fraunces title, mono hashes. Light course layer stays as-is. Reduced-motion honored.
- **Engine** (`js/observatory.js`, window.OBS): ~26 nodes, organic fixed layout, edges < radius. 4-5 miner nodes (weighted hash power). Tx spawn at random nodes → hop-by-hop pulse propagation, per-node mempools. Miners grind REAL sha256 (throttled per frame, difficulty 3 zeros, block ~9s at 1×). Winner → block {height, prev, nonce, real hash, real merkle root, txs≤4} → wavefront acceptance across network, mempools drain. Natural forks (~12% of blocks): two blocks same height, two-color split by arrival (plum vs gold), next block resolves, orphan grays + ejects from ribbon. Reorg handled 1-deep only (keep simple).
- **Chain ribbon** bottom: last ~9 blocks as plates, hash snippets, slide-in animation, orphan ejection.
- **Interactions:** click node → mempool + peers panel; click ribbon block → header inspector (prev/merkle/nonce/hash, txs). Buttons: ⏯ pause (space), speed 1×/2×/4×, "Broadcast a tx", "Tamper a node" (invalid block announced, neighbors flash red, rejected — log it), "Force a fork". Stats top bar: height, mempool count, ~hashrate, forks seen, last-block-ago.
- **Event log** right rail, terse lines, newest top.
- **Home teaser** (DONE in views.js): `.obs-tease` dark band with mini canvas `OBS.tease("obsTease")` + nav link "Observatory" (DONE). Route + `OBS.mount(root)` in app.js — TODO if not done.

## Status right now
- [x] Home sections removed; obs-tease markup + nav link in views.js
- [ ] css: `.obs-tease*` styles + observatory styles (dark stage, panels, log, ribbon)
- [ ] js/observatory.js (engine + render + tease())
- [ ] app.js route `#/live` → VIEWS or OBS.mount; title "The Observatory · The Blockchain Course"
- [ ] index.html script tag js/observatory.js?v=20 (bump all ?v=19 → 20)
- [ ] Browser-verify (NOTE: pane screenshots blank after scroll — pane bug; use tall viewport 1280x2900 + JS state checks; new tab if renderer wedges)
- [ ] commit + push (Pages auto-deploys), update .claude/CHECKPOINT.md status, memory file blockchain-learning-tool.md

## After Observatory (next priorities from Tannmay's feedback)
1. Lesson copy pass — he called explanations "subpar": rewrite flattest hero/cap lines (tokens, wallets, money, layer2 are driest).
2. Upgrade driest interactives toward Network-sim quality (e.g. layer2 rollup as animated funnel, tokens as living ledger).
3. Consider dark-mode toggle for course layer using Observatory palette.
