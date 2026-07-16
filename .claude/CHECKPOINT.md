# Session checkpoint — 2026-07-16

Resume ritual: read this file, then `git log --oneline -5`, `git status`.

## Shipped
- **v6 (e0be23d):** rebrand to "The Blockchain Course", 3 new lessons (incentives/gossip/safety), checkpoint quizzes, home + design overhaul, repo renamed blockchain-seminar → blockchain-learning-tool.
- **v7 (aa1f40d):** THE OBSERVATORY — living blockchain layer at `#/live` (js/observatory.js): 26-node gossip network, real-SHA-256 mining w/ live candidate ticker, block waves, forks split/heal/orphan, node mempool panels, real block-header inspector, 9-act guided tour (auto-plays first visit, localStorage key `obs_tour`), controls (pause/speed/broadcast/tamper/force-fork). Home: removed "first sixty seconds" + "how this course teaches" (Tannmay's ask), added dark Observatory teaser + nav link. Fully verified in browser; deployed via Pages.

## Hard-won environment notes
- Browser pane: screenshots go blank after scrolling (pane bug — use tall viewport or JS state probes); rAF + setTimeout heavily throttled (sim uses setTimeout + wall-clock dt ≤0.5s); `innerWidth` can be 0 at boot (Observatory retries mount until stage >60px); script cache needs `?v=` bumps (currently v26).
- CSS class `.in` is the global input style — never reuse as a state class (caused white tour caption).
- ECC GateGuard stays off via `~/.claude/settings.json` env.

## Next (Tannmay's standing feedback: copy "subpar", some lessons dry)
1. Copy pass on flattest lessons — tokens, wallets, money, layer2 heroes/captions.
2. Upgrade driest interactives toward Network-sim quality (layer2 rollup funnel animation, tokens as living ledger).
3. ~~51% "hostile takeover" mode~~ — DONE in v8 (a16d607): slider 30–75%, secret shadow chain, live multi-block reorg with skull-marked canonical blocks, gambler's-ruin give-up below 50%. Verified end-to-end in browser.
4. Ideas parked: dark-mode toggle for course layer using Observatory palette; tour act for the takeover.
