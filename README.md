# The Blockchain Course — learn blockchain by doing

An interactive course that teaches blockchain from absolute first principles. No slides, no
jargon-first lectures: every idea is a thing you **do** — you mine the blocks, forge the
signatures, watch a coin double-spend, trigger the forks, run the 51% attack — and the terms
land only after your hands have built the experience.

**Live:** https://tannmay-python.github.io/blockchain-learning-tool/

## The journey (10 chapters · 28 lessons · 80+ hands-on demos)

| # | Chapter | What it answers |
|---|---------|-----------------|
| 00 | **Start here** | Money is a list. Who keeps the list? Why digital money is hard (double-spend). |
| 01 | **The big idea** | What a blockchain actually is, and the life of one payment end to end. |
| 02 | **Cryptography** | Hashing (the fingerprint) and keys & signatures (ownership without trust). |
| 03 | **Building the chain** | Inside a transaction & the mempool, build a block, Merkle-prove it (deep dive), mine the nonce, the difficulty thermostat, rewards & pools, chain the past shut. |
| 04 | **The network agrees** | Gossip propagation, the Sybil machine (why voting fails), forks, the 51% attack — run the heist yourself — and Proof of Stake. |
| 05 | **Programmable money** | Smart contracts (order the DAO's withdraw lines yourself), tokens & NFTs, and the automated market — x·y=k, impermanent loss, oracles. |
| 06 | **Your keys, your problem** | Wallets & custody, seed-phrase determinism, and staying safe from scams. |
| 07 | **Scaling, privacy & the state** | Layer 2, zero-knowledge (deep dive), stablecoins & CBDCs. |
| 08 | **How it went wrong** | Mt. Gox, The DAO, Terra, FTX — each disaster mapped to the rule it proved. |
| 09 | **The whole machine** | Everything you built, running together. |

Lessons tick themselves as you pass through; chapter **badges** must be won at each
chapter's exit gate — a short cumulative quiz that deliberately reaches back into
earlier chapters. `merkle` and `zk` are optional **deep dives**: on the map, never
on the critical path.

Most lessons end with a **checkpoint** — a short quiz that explains *why* every option is
right or wrong, not just which one to click.

## What's actually real here

- **Real SHA-256** (pure JS, verified against test vectors) powers every hash you see — the
  avalanche demo, the mining loops, the Merkle trees, the transaction signatures.
- **Real ECDSA P-256** (Web Crypto) — the signature lesson generates a genuine key pair;
  tampering with the signed message really breaks verification.
- **Satoshi's actual math** — the 51% attack odds are the whitepaper's gambler's-ruin
  formula, computed live as you drag the sliders.
- **No accounts, no backend.** Progress lives in `localStorage` on the learner's device.

## Run it

```bash
cd blockchain-learning-tool
python3 -m http.server 4321      # then open http://localhost:4321
```

Any static file server works; there is no build step and no dependency.

## Files

```
index.html            shell — loads the scripts below
css/app.css           the whole design system (Llama maroon & marigold, Lora/Inter/JetBrains Mono)
js/sha256.js          pure-JS SHA-256 (verified against test vectors)
js/store.js           curriculum structure + progress (localStorage)
js/lessons.js         the core lessons — each one a vertical "explorable" of interactive beats
js/lessons-extra.js   checkpoint quizzes + the transaction / incentives / network / safety lessons
js/lessons-plus.js    the "living interactives" layer — animated overrides + sharpened copy
js/views.js           home, journey map, and lesson renderer
js/app.js             hash router + ambient canvas backdrops
```

Keyboard: **← / →** move between lessons.
