# The Blockchain Course — learn blockchain by doing

An interactive course that teaches blockchain from absolute first principles. No slides, no
jargon-first lectures: every idea is a thing you **do** — you mine the blocks, forge the
signatures, trigger the forks, run the 51% attack — and the terms land only after your hands
have built the experience.

**Live:** https://tannmay-python.github.io/blockchain-learning-tool/

## The Observatory

The second layer of the site (`#/live`): a **living blockchain on one screen**. A 26-node
peer-to-peer network runs continuously — transactions gossip node to node, five miners race
real SHA-256 (every candidate hash shown live), winning blocks sweep the map as waves, and
forks genuinely split the network in two colours before the next block heals them and orphans
the loser. Click any node to open its mempool; click any block on the ribbon to read its real
header. A narrated **guided tour** plays on first visit — nine acts, each driven by real
simulator events. Buttons let you broadcast a transaction, make a node announce an invalid
block (its neighbours reject it), or force a fork.

## The journey (7 chapters · 24 lessons · ~60 hands-on demos)

| # | Chapter | What it answers |
|---|---------|-----------------|
| 00 | **Start here** | Money is a list. Who keeps the list? Why digital money is hard (double-spend). |
| 01 | **The big idea** | What a blockchain actually is, and the life of one payment end to end. |
| 02 | **Cryptography** | Hashing (the fingerprint) and keys & signatures (ownership without trust). |
| 03 | **Building the chain** | Build a block, mine the nonce, earn the reward, chain the past shut, Merkle-prove inclusion. |
| 04 | **The network agrees** | Gossip propagation, forks, the 51% attack, Proof of Stake. |
| 05 | **The ecosystem** | Smart contracts, tokens & NFTs, wallets & custody, Layer 2, zero-knowledge, stablecoins & CBDCs, staying safe from scams. |
| 06 | **The whole machine** | Everything you built, running together. |

Most lessons end with a **checkpoint** — a short quiz that explains *why* every option is
right or wrong, not just which one to click.

## What's actually real here

- **Real SHA-256** (pure JS, verified against test vectors) powers every hash you see — the
  avalanche demo, the mining loops, the Merkle trees.
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
css/app.css           the whole design system (plum & marigold, Fraunces/Inter/JetBrains Mono)
js/sha256.js          pure-JS SHA-256 (verified against test vectors)
js/store.js           curriculum structure + progress (localStorage)
js/lessons.js         the core lessons — each one a vertical "explorable" of interactive beats
js/lessons-extra.js   checkpoint quizzes + the incentives / network / safety lessons
js/views.js           home, journey map, and lesson renderer
js/app.js             hash router + ambient canvas backdrops
```

Keyboard: **← / →** move between lessons.
