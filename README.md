# Blockchain Live — operate a real blockchain, learn how it works

Not slides, not a list of mini-games. **One persistent, live Proof-of-Work blockchain** running in
the browser — real SHA-256 mining, real ECDSA transactions, a real mempool and account ledger — with
a **guided teaching layer** that walks you from "what is this?" to genuinely ultra-technical, all by
operating the *same* network.

You build an identity, broadcast money, become a miner, trigger a fork, attack the chain, and switch
the consensus engine — and the network reacts live the whole time.

## Run it

```bash
cd blockchainResearchSeminar
python3 -m http.server 4321      # then open http://localhost:4321
```

Live demo: **https://tannmay-python.github.io/blockchain-seminar/**

Controls: **space** play/pause · the speed buttons (0.5×–4×) and **⏭** step in the top bar · click any
block to open the **inspector** · **Esc** closes it. The guide on the right has **Back / Next**.

## What's actually real here

- **Real Proof of Work.** The mining loop runs real SHA-256 over real block headers searching for a
  nonce that meets the difficulty target. The "Mining" spotlight shows the actual candidate hash being
  tried. Which miner wins is weighted by hash power, exactly like a real network.
- **Real cryptography.** Your wallet is a genuine **ECDSA P-256** key pair (Web Crypto). Your
  transactions are really signed; tampering really invalidates them.
- **A real ledger.** Accounts have balances and nonces; mining a block applies its transactions, pays
  the miner the reward + fees, and drains the mempool. Send 25 coins and your balance really drops.
- **Real Merkle roots, real chaining.** The inspector lets you recompute a block's Merkle root and
  re-hash its header to verify it — change anything and it breaks.

## The guided journey (8 chapters, one network)

1. **The living ledger** — orient: what you're watching is a live distributed ledger.
2. **Anatomy of a block** — freeze it, open the inspector, dissect the header; SHA-256 deep-dive.
3. **Your identity & money** — generate your ECDSA wallet; keys, addresses, the account model.
4. **Sending value** — sign & broadcast a transaction; the fee market; watch it get confirmed.
5. **Proof of Work** — become a miner, set your hash power & difficulty, mine a block yourself.
6. **Consensus & forks** — trigger a fork, resolve it by the longest-chain rule; confirmations.
7. **The 51% attack** — Nakamoto's whitepaper-§11 probability + a live stochastic attack race.
8. **Beyond Proof of Work** — switch the network to Proof of Stake; tour the frontier.

## Files

```
index.html      shell: top bar + stage (miners, mining spotlight, chain, mempool) + guide rail + inspector
css/app.css      light, rich "live network" design system
js/sha256.js     pure-JS SHA-256 (verified against test vectors)
js/chain.js      the blockchain engine — real PoW, ECDSA txs, ledger, miners, events (window.CHAIN)
js/viz.js        renders the live chain/miners/mempool/spotlight + the block inspector (window.VIZ)
js/guide.js      the 8 deep technical chapters that drive & explain the one network (window.GUIDE)
js/app.js        boot + top-bar controls
```

The engine emits events (`block`, `tx`, `mempool`, `tick`, `fork`, …); the visualization and the guide
both subscribe. The guide chapters drive the same engine (play/pause, difficulty, fork, mode) and
detect completion from real engine events — so the teaching and the simulation are never out of sync.
