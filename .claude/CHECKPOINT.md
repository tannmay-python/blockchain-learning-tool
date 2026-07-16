# Session checkpoint — 2026-07-16

Resume ritual: read this file, then `git log --oneline -5`, `git status`.

## Shipped
- **v6 (e0be23d):** rebrand to "The Blockchain Course", 3 new lessons (incentives/gossip/safety), checkpoint quizzes, home + design overhaul, repo renamed blockchain-seminar → blockchain-learning-tool.
- **v7 (aa1f40d):** THE OBSERVATORY — living blockchain layer at `#/live` (js/observatory.js): 26-node gossip network, real-SHA-256 mining w/ live candidate ticker, block waves, forks split/heal/orphan, node mempool panels, real block-header inspector, 9-act guided tour (auto-plays first visit, localStorage key `obs_tour`), controls (pause/speed/broadcast/tamper/force-fork). Home: removed "first sixty seconds" + "how this course teaches" (Tannmay's ask), added dark Observatory teaser + nav link. Fully verified in browser; deployed via Pages.

## Hard-won environment notes
- Browser pane: screenshots go blank after scrolling (pane bug — use tall viewport or JS state probes); rAF + setTimeout heavily throttled (sim uses setTimeout + wall-clock dt ≤0.5s); `innerWidth` can be 0 at boot (Observatory retries mount until stage >60px); script cache needs `?v=` bumps (currently v26).
- CSS class `.in` is the global input style — never reuse as a state class (caused white tour caption).
- ECC GateGuard stays off via `~/.claude/settings.json` env.

## Course upgrade — DONE (v33, commits …40d9f92)
`js/lessons-plus.js` = override module (loads after lessons.js + lessons-extra.js, mutates window.LESSONS; leaves strong interactives intact). Upgraded the dry beats into living/animated ones + sharpened copy:
- tour: animated 5-station payment pipeline (real signed/hashed coin travels)
- tokens: coins physically fly between accounts
- layer2: swarm of tx dots funnels into one L1 proof block
- wallets: animated seed→keys derivation cascade
- why: 12-node network you can freeze / knock offline
- pos beat2: animated energy draw-down meter (setTimeout-driven, pane-throttle-proof)
- sharper heroes/captions across ~15 lessons
All 24 lessons verified: 0 build errors, 0 console errors.

## Next (parked ideas)
1. The remaining "card"-style beats (attack can/cannot grid, zk/money reference cards, NFT claim grid) are legit summaries — left as-is.
3. ~~51% "hostile takeover" mode~~ — DONE in v8 (a16d607): slider 30–75%, secret shadow chain, live multi-block reorg with skull-marked canonical blocks, gambler's-ruin give-up below 50%. Verified end-to-end in browser.
4. Ideas parked: dark-mode toggle for course layer using Observatory palette; tour act for the takeover.
