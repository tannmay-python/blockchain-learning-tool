/* ============================================================
   guide.js — the teaching layer. A sequence of deep, technical
   chapters, each of which drives & explains the ONE live blockchain.
   ============================================================ */
window.GUIDE = (function () {
  "use strict";
  const C = window.CHAIN, V = window.VIZ;
  const $ = (s) => document.querySelector(s);
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const fmt = (n) => Math.round(n).toLocaleString();
  let idx = 0; const done = new Set(); let cleanups = [];
  const track = (off) => cleanups.push(off);

  // helper: render a contextual control widget block
  function widget(label, inner) { return `<div class="widget"><div class="wl">${label}</div>${inner}</div>`; }

  const CH = [];

  /* ===== 1 · THE LIVING LEDGER ===== */
  CH.push({ id: "intro", label: "Chapter 1 of 8", title: "The living ledger",
    body() { return `
      <p class="gp">You're looking at a <b>real blockchain, running live</b>. Those cards streaming in from the right are <span class="term">blocks</span>, each one mined seconds ago by one of the miners up top. This isn't a recording — it's an actual Proof-of-Work network executing in your browser, with real SHA-256 and real cryptographic signatures.</p>
      <p class="gp">A blockchain is fundamentally a <b>distributed ledger</b>: an append-only list of transactions that thousands of computers keep identical copies of, with <b>no central authority</b>. New transactions wait in the <span class="term">mempool</span> (bottom strip) until a miner packages them into the next block and links it onto the chain.</p>
      <div class="gh"><span class="n">▸</span>What to watch</div>
      <p class="gp"><b>Miners</b> (top) race to extend the chain. The <b>chain</b> (center) only ever grows rightward. The <b>mempool</b> (bottom) fills with pending transactions and drains as they get confirmed. Up in the title bar, live stats track block height, network hashrate, and difficulty.</p>
      ${widget("Network controls", `<p class="small muted" style="margin:0 0 11px">The network is running. Let it mine a few blocks.</p><div class="btn-row"><button class="btn primary" id="w1play">▶ Play / Pause</button></div><div class="small" id="w1count" style="margin-top:10px;font-family:var(--mono);color:var(--ink-3)"></div>`)}
      <div class="callout deep"><span class="i">🔬</span><div>Why "chain"? Each block embeds a cryptographic hash of the one before it. Reorder or edit any past block and every later link breaks — which is what makes history practically immutable. You'll prove this to yourself in the next chapter.</div></div>`; },
    enter(ctx) {
      if (!C.state.running) C.play();
      $("#w1play").onclick = () => C.state.running ? C.pause() : C.play();
      let base = C.state.chain.length, need = 3;
      const upd = () => { const made = C.state.chain.length - base; $("#w1count").textContent = `blocks mined since you arrived: ${made} / ${need}`; if (made >= need) ctx.done(); };
      upd(); track(C.on("block", upd));
    }});

  /* ===== 2 · ANATOMY OF A BLOCK ===== */
  CH.push({ id: "block", label: "Chapter 2 of 8", title: "Anatomy of a block",
    body() { return `
      <p class="gp">Let's freeze the network and dissect a single block. Every block has a <span class="term">header</span> — a handful of fields — plus a list of transactions. The header is what actually gets hashed.</p>
      <div class="gh"><span class="n">▸</span>The header fields</div>
      <p class="gp"><b>Previous hash</b> — the 256-bit fingerprint of the prior block. This is the literal "chain". <b>Merkle root</b> — a single hash that summarizes every transaction in the block (a binary tree of hashes). <b>Timestamp</b>, <b>difficulty</b>, and the <b>nonce</b> — the number miners brute-force to satisfy Proof of Work.</p>
      <div class="gh"><span class="n">▸</span>Why SHA-256 underpins all of it</div>
      <p class="gp">SHA-256 maps any input to a fixed <b>256-bit</b> output and has three properties that matter here: it's <b>deterministic</b> (same input → same hash), <b>collision/preimage resistant</b> (you can't find an input for a target hash, nor two inputs sharing one), and shows the <b>avalanche effect</b> (flip one bit of input → ~half the output bits flip). Together these make the hash a tamper-evident seal: change <i>anything</i> and the fingerprint changes unpredictably.</p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Click any block in the chain to open the inspector, then hit <b>“Re-hash the header & verify”</b> to confirm its hash is real and meets difficulty.</div></div>
      ${widget("Inspect", `<button class="btn primary block" id="w2open">🔍 Open the latest block</button>`)}
      <div class="callout deep"><span class="i">🔬</span><div>In the inspector you can also recompute the Merkle root from the transaction list. If even one transaction were altered, the recomputed root wouldn't match the one in the header — and neither would the block hash.</div></div>`; },
    enter(ctx) {
      C.pause();
      $("#w2open").onclick = () => V.openInspector(C.state.chain[C.state.chain.length - 1]);
      V.onInspect(() => { ctx.done(); });
    }, exit() { V.onInspect(null); }});

  /* ===== 3 · YOUR IDENTITY ===== */
  CH.push({ id: "identity", label: "Chapter 3 of 8", title: "Your identity & money",
    body() { return `
      <p class="gp">On a blockchain there are no accounts-with-passwords. Ownership is pure cryptography. You hold a <span class="term">private key</span> — a secret random number — and from it derive a <b>public key</b> and a shorter <b>address</b>. The address is your account number; you share it freely. The private key signs your transactions; you never reveal it.</p>
      <div class="gh"><span class="n">▸</span>The asymmetry that makes it work</div>
      <p class="gp">This is <b>asymmetric (public-key) cryptography</b> — specifically <span class="term">ECDSA</span> on the P-256 curve, generated for real by your browser's Web Crypto API. Anything signed by the private key can be verified by anyone using the public key, yet the public key reveals nothing about the private one. Your <b>address</b> is <code>hash(public key)</code>, truncated — which is why addresses look like random hex.</p>
      <p class="gp">This network uses the <b>account model</b> (like Ethereum): each address has a running <b>balance</b> and a <b>nonce</b> (a counter that prevents the same signed transaction from being replayed twice). Bitcoin instead uses UTXOs — unspent outputs — but the security idea is identical.</p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Generate your key pair and claim some test coins from the faucet.</div></div>
      ${widget("Your wallet", `<div id="w3empty"><button class="btn primary block lg" id="w3gen">🔑 Generate my wallet${C.hasSubtle ? ' <span class="pill" style="background:rgba(255,255,255,.22);color:#fff">real ECDSA</span>' : ''}</button></div>
        <div id="w3show" style="display:none"><div class="kvs"><div class="kv"><span class="k">address</span><span class="v brand" id="w3addr"></span></div><div class="kv"><span class="k">private key</span><span class="v">•••••• (secret)</span></div><div class="kv"><span class="k">balance</span><span class="v green" id="w3bal">0</span></div></div><button class="btn cyan block" id="w3faucet" style="margin-top:10px">🚰 Claim 100 test coins</button></div>`)}`; },
    enter(ctx) {
      const gen = $("#w3gen");
      gen.onclick = async () => { const w = await C.createWallet(); $("#w3empty").style.display = "none"; $("#w3show").style.display = "block"; $("#w3addr").textContent = C.addrShort(w.address); V.renderMiners(); V.toast("Wallet created — this is you now"); };
      const fau = $("#w3faucet"); fau.onclick = () => { C.faucet(100); $("#w3bal").textContent = C.balanceOf(C.state.you.address).toFixed(0); V.confetti(); ctx.done(); };
      if (C.state.you) { $("#w3empty").style.display = "none"; $("#w3show").style.display = "block"; $("#w3addr").textContent = C.addrShort(C.state.you.address); $("#w3bal").textContent = C.balanceOf(C.state.you.address).toFixed(0); }
    }});

  /* ===== 4 · SENDING VALUE ===== */
  CH.push({ id: "send", label: "Chapter 4 of 8", title: "Sending value",
    body() { return `
      <p class="gp">Time to spend. A <span class="term">transaction</span> says "move X coins from my address to theirs," plus a <b>fee</b> that goes to whoever mines it. You <b>sign</b> the whole thing with your private key. The signature mathematically binds to the exact contents — change the amount by one coin afterward and the signature is instantly invalid.</p>
      <div class="gh"><span class="n">▸</span>The fee market</div>
      <p class="gp">Your signed transaction enters the <span class="term">mempool</span> and competes for space. Miners are economically rational: they pack the <b>highest-fee</b> transactions first, because they keep those fees. Set a higher fee and you'll be confirmed sooner. When a block includes your transaction, that's <b>1 confirmation</b>; each block on top adds another.</p>
      <div class="gh"><span class="n">▸</span>Double-spending</div>
      <p class="gp">Notice you can't spend coins you don't have — the network checks your balance. You also can't spend the same coins twice: try it and only one transaction will survive into a block. Resolving <i>which</i> one, with no central referee, is the consensus problem we tackle next.</p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Broadcast a transaction, then watch the chain confirm it. The block that includes it will open automatically.</div></div>
      ${widget("Compose a transaction", `<label class="fld">Amount (coins)</label><input class="input mono" id="w4amt" value="25">
        <label class="fld" style="margin-top:10px">Fee <span class="muted" style="text-transform:none">(higher = faster)</span></label><div class="slider-row"><input type="range" id="w4fee" min="0.2" max="5" step="0.1" value="1.5"><span class="v" id="w4feev">1.5</span></div>
        <button class="btn primary block" id="w4send" style="margin-top:12px">✍️ Sign &amp; broadcast</button>
        <div class="small" id="w4msg" style="margin-top:9px"></div>`)}`; },
    enter(ctx) {
      if (!C.state.you) { C.createWallet().then(() => C.faucet(100)); }
      C.setSpeed(1); C.play();
      const feeS = $("#w4fee"); feeS.oninput = () => $("#w4feev").textContent = (+feeS.value).toFixed(1);
      let myTxHash = null;
      $("#w4send").onclick = async () => {
        const amt = +$("#w4amt").value, fee = +feeS.value;
        const r = await C.sendTx({ to: "random", amount: amt, fee });
        if (r.error) { $("#w4msg").innerHTML = `<span style="color:var(--red)">✗ ${r.error}</span>`; return; }
        myTxHash = r.tx.hash; $("#w4msg").innerHTML = `<span style="color:var(--green)">✓ Signed &amp; broadcast.</span> Watch the mempool (bottom) — your tx is highlighted. It'll be mined soon.`;
        V.highlight("#mempool"); setTimeout(() => V.clearHighlight(), 2500);
      };
      track(C.on("block", (b) => {
        if (myTxHash && b._txObjs && b._txObjs.find(t => t.hash === myTxHash)) {
          V.toast("Your transaction was confirmed!"); V.openInspector(b); ctx.done(); myTxHash = null;
        }
      }));
    }});

  /* ===== 5 · PROOF OF WORK ===== */
  CH.push({ id: "pow", label: "Chapter 5 of 8", title: "Proof of Work — become a miner",
    body() { return `
      <p class="gp">So far miners did the work for you. Now you take the pickaxe. <span class="term">Mining</span> means searching for a <b>nonce</b> such that <code>SHA-256(block header)</code> starts with a required number of zeros (the <span class="term">difficulty target</span>). Because the hash is unpredictable, there's no shortcut — you must guess, billions of times per second on the real network.</p>
      <div class="gh"><span class="n">▸</span>The numbers</div>
      <p class="gp">Each extra zero of difficulty makes the puzzle <b>16× harder</b>. Expected guesses ≈ <code>16^(zeros)</code>. Your odds of finding any given block equal <b>your hash power ÷ the network's total</b> — it's a memoryless lottery. Find one and you collect the <b>block reward</b> (newly minted coins) plus all the fees in that block. Real networks auto-adjust difficulty to keep block time roughly constant as miners join or leave.</p>
      <div class="gh"><span class="n">▸</span>Why this equals security</div>
      <p class="gp">Producing a valid block is expensive; <b>verifying</b> one is a single hash. That asymmetry means honest nodes cheaply reject fakes, while rewriting history would cost an attacker an astronomical amount of redone work. <b>Work is the lock on the past.</b></p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Join the network as a miner, crank your hash power, and mine a block with <b>YOUR</b> name on it.</div></div>
      ${widget("Your mining rig", `<div class="slider-row"><span class="nm">Your hash power</span><input type="range" id="w5hp" min="5" max="200" value="60"><span class="v" id="w5hpv">60</span></div>
        <div class="slider-row" style="margin-top:8px"><span class="nm">Difficulty</span><input type="range" id="w5diff" min="3" max="5" value="4"><span class="v" id="w5diffv">4</span></div>
        <div class="small muted" id="w5share" style="margin:8px 0"></div>
        <button class="btn amber block" id="w5join">⛏ Join mining</button>`)}`; },
    enter(ctx) {
      C.setSpeed(2); if (!C.state.running) C.play();
      const hp = $("#w5hp"), diff = $("#w5diff");
      const updShare = () => { const total = C.totalHP() - (C.state.miners.find(m => m.isYou)?.hp || 0) + (+hp.value); $("#w5share").innerHTML = `That's ~<b>${Math.round(+hp.value / total * 100)}%</b> of network hash power → expect ~${Math.round(total / +hp.value)} blocks between your wins.`; };
      hp.oninput = () => { $("#w5hpv").textContent = hp.value; C.setYourHP(+hp.value); updShare(); };
      diff.oninput = () => { $("#w5diffv").textContent = diff.value; C.setDifficulty(+diff.value); };
      $("#w5join").onclick = () => { C.joinAsMiner(+hp.value); updShare(); V.toast("You're mining! Watch for a block with your stripe."); $("#w5join").textContent = "⛏ Mining…"; };
      updShare();
      track(C.on("block", (b) => { if (b.minerIsYou) { V.confetti(); V.toast("You mined a block! Reward + fees are yours."); ctx.done(); } }));
    }});

  /* ===== 6 · CONSENSUS & FORKS ===== */
  CH.push({ id: "forks", label: "Chapter 6 of 8", title: "Consensus & forks",
    body() { return `
      <p class="gp">Blocks propagate at the speed of the internet, not instantly. So two miners on opposite sides of the world can solve the <b>same height</b> at nearly the same moment. Now the network momentarily disagrees — there are two valid tips. This is a <span class="term">fork</span>.</p>
      <div class="gh"><span class="n">▸</span>The longest-chain rule</div>
      <p class="gp">The resolution is beautifully simple: nodes always extend the chain with the <b>most accumulated Proof of Work</b> (informally, the longest). As soon as one branch gets the next block, every node switches to it. The block on the losing branch becomes an <span class="term">orphan</span> and its transactions flow back into the mempool to be re-mined.</p>
      <div class="gh"><span class="n">▸</span>Why confirmations exist</div>
      <p class="gp">This is exactly why a payment isn't final the instant it's mined — it could still be on a branch that loses. Each additional block on top (a <b>confirmation</b>) buries it deeper, and the probability of a reorg that deep falls <b>exponentially</b>. Bitcoin's "wait for 6 confirmations" is this principle in practice. Finality here is <b>probabilistic</b>, not absolute.</p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Trigger a fork, then resolve it — pick which branch the next block extends and watch the other get orphaned.</div></div>
      ${widget("Fork lab", `<button class="btn primary block" id="w6fork">⚡ Trigger a fork at the tip</button>
        <div id="w6resolve" style="display:none;margin-top:10px"><p class="small" style="margin:0 0 9px">Two valid blocks now sit at the same height. Which branch gets extended next?</p><div class="btn-row"><button class="btn ghost" id="w6main">Extend original</button><button class="btn ghost" id="w6alt">Extend competitor</button></div></div>
        <div class="small" id="w6msg" style="margin-top:9px"></div>`)}`; },
    enter(ctx) {
      C.pause();
      $("#w6fork").onclick = () => { C.demoFork(); $("#w6resolve").style.display = "block"; $("#w6fork").disabled = true; $("#w6msg").innerHTML = `<span style="color:var(--amber)">⚠ Fork! Two valid tips at the same height. The network is briefly undecided.</span>`; V.highlight(".blk[data-fork='1']"); setTimeout(() => V.clearHighlight(), 2600); };
      const resolve = (main) => { C.resolveFork(main); $("#w6msg").innerHTML = `<span style="color:var(--green)">✓ Resolved by longest-chain rule.</span> The losing block is orphaned; its txs return to the mempool. Consensus restored.`; $("#w6main").disabled = $("#w6alt").disabled = true; ctx.done(); };
      $("#w6main").onclick = () => resolve(true); $("#w6alt").onclick = () => resolve(false);
    }});

  /* ===== 7 · THE 51% ATTACK ===== */
  CH.push({ id: "attack", label: "Chapter 7 of 8", title: "The 51% attack",
    body() { return `
      <p class="gp">Here's the security boundary of the entire system. Imagine you buy a <b>$1,000,000 car</b>. The dealer waits for <b>K confirmations</b>, then hands you the keys. Your heist: secretly mine an <b>alternative chain</b> that omits your payment, and once it's longer than the honest chain, publish it — erasing the payment while you keep the car.</p>
      <div class="gh"><span class="n">▸</span>The math (Bitcoin whitepaper §11)</div>
      <p class="gp">If you control fraction <code>q</code> of hash power and the merchant waits <code>z</code> confirmations, your probability of ever catching up follows Satoshi's gambler's-ruin formula. Below <b>q = 50%</b>, that probability <b>decays exponentially</b> in <code>z</code> — which is the whole reason confirmations work. At <b>q ≥ 50%</b> it jumps to a certainty: with the majority of hash power you <i>are</i> the longest chain, and the rules now serve you. Hence "51% attack."</p>
      <div class="gh"><span class="n">▸</span>What ≥50% can and can't do</div>
      <p class="gp">A majority attacker can reverse their <i>own</i> recent payments (double-spend) and censor transactions. They <b>cannot</b> steal coins from addresses they don't have keys for, mint coins out of thin air, or change old buried history cheaply. Security ultimately rests on a social fact: <b>no single party controls a majority of hash power.</b></p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Tune your hash power and the merchant's confirmations, read the success probability, then launch a stochastic attack run.</div></div>
      ${widget("Attack console", `<div class="slider-row"><span class="nm">Your power q</span><input type="range" id="w7q" min="5" max="90" value="30"><span class="v" id="w7qv">30%</span></div>
        <div class="slider-row" style="margin-top:8px"><span class="nm">Confirmations</span><input type="range" id="w7z" min="0" max="12" value="6"><span class="v" id="w7zv">6</span></div>
        <div style="text-align:center;margin:12px 0"><div class="small muted">success probability</div><div style="font-family:var(--mono);font-weight:800;font-size:38px" id="w7p">—</div></div>
        <div id="w7race"></div>
        <button class="btn danger block" id="w7run" style="margin-top:10px">☠ Launch attack run</button>
        <div class="small" id="w7msg" style="margin-top:9px"></div>`)}`; },
    enter(ctx) {
      C.pause();
      const q = $("#w7q"), z = $("#w7z");
      const upd = () => { $("#w7qv").textContent = q.value + "%"; $("#w7zv").textContent = z.value; const P = C.attackProb(+q.value / 100, +z.value); const e = $("#w7p"); e.textContent = P >= .5 ? Math.round(P * 100) + "%" : P < 1e-4 ? "<0.01%" : (P * 100).toPrecision(2) + "%"; e.style.color = P > .01 ? "var(--red)" : "var(--green)"; };
      q.oninput = upd; z.oninput = upd; upd();
      $("#w7race").innerHTML = `<div class="slider-row" style="gap:8px"><span class="nm" style="width:64px;color:var(--green)">Honest</span><div style="flex:1;height:18px;background:var(--surface-3);border-radius:7px;overflow:hidden"><i id="w7h" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:28px;color:var(--green)" id="w7hn">0</span></div>
        <div class="slider-row" style="gap:8px;margin-top:6px"><span class="nm" style="width:64px;color:var(--red)">You</span><div style="flex:1;height:18px;background:var(--surface-3);border-radius:7px;overflow:hidden"><i id="w7e" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:28px;color:var(--red)" id="w7en">0</span></div>`;
      let running = false;
      $("#w7run").onclick = () => { if (running) return; running = true; const qf = +q.value / 100; let hon = +z.value, evil = 0, t = 0; const hf = $("#w7h"), ef = $("#w7e");
        const step = () => { t++; if (Math.random() < qf) evil++; else hon++; const sc = Math.max(hon, evil, +z.value + 3); hf.style.width = hon / sc * 100 + "%"; ef.style.width = evil / sc * 100 + "%"; $("#w7hn").textContent = hon; $("#w7en").textContent = evil;
          if (evil > hon) { $("#w7msg").innerHTML = `<span style="color:var(--red)">💀 Attack succeeded — your chain overtook honest. Payment reversed.</span>`; running = false; ctx.done(); return; }
          if (t > 220 || (qf < .5 && hon - evil > 22)) { $("#w7msg").innerHTML = `<span style="color:var(--green)">🛡 Attack failed — the honest chain pulled away.</span> Re-run; luck varies, the probability above is the long-run truth.`; running = false; ctx.done(); return; }
          setTimeout(step, 42); };
        step(); };
    }});

  /* ===== 8 · BEYOND PROOF OF WORK ===== */
  CH.push({ id: "beyond", label: "Chapter 8 of 8", title: "Beyond Proof of Work",
    body() { return `
      <p class="gp">Proof of Work buys security by burning electricity. The leading alternative, <span class="term">Proof of Stake</span>, buys it with <b>capital at risk</b>. Validators lock up coins as a bond; the protocol pseudo-randomly picks one to propose each block, weighted by stake. Propose honestly → earn rewards. Equivocate or attack → the protocol <b>slashes</b> (destroys) your bond. Ethereum switched to PoS in 2022, cutting its energy use by ~99.95%.</p>
      <div class="objective"><div class="lab">🎯 Objective</div><div class="txt">Switch the live network from Proof of Work to Proof of Stake and watch energy use collapse.</div></div>
      ${widget("Consensus engine", `<div class="btn-row"><button class="btn ghost" id="w8pow">⛏ Proof of Work</button><button class="btn primary" id="w8pos">🪙 Proof of Stake</button></div>
        <div class="slider-row" style="margin-top:12px"><span class="nm">Energy use</span><div style="flex:1;height:18px;background:var(--surface-3);border-radius:7px;overflow:hidden"><i id="w8en" style="display:block;height:100%;width:100%;background:var(--amber);transition:width .6s,background .6s"></i></div><span class="v" id="w8env" style="color:var(--amber)">100%</span></div>`)}
      <div class="gh"><span class="n">▸</span>The frontier (where the research is)</div>
      <p class="gp"><b>Layer-2 / rollups</b> batch thousands of transactions off-chain into one on-chain proof — <span class="term">zk-rollups</span> use zero-knowledge proofs (prove a computation was done correctly while revealing nothing) to scale without trust. <b>Smart contracts</b> turn the chain into a world computer (DeFi, NFTs, DAOs). <b>Real-world asset tokenization</b> puts T-bills and real estate on-chain. <b>CBDCs</b> are state-run digital currencies — centralized, the opposite of this. <b>Cross-chain bridges</b> connect networks (and are crypto's biggest hack surface). And <b>policy</b> — the EU's MiCA, the US's fragmented agencies, India's heavy taxation — decides how all of it touches the real economy.</p>
      <div class="callout deep"><span class="i">🎓</span><div><b>You operated the whole machine:</b> a live ledger, hashed and chained blocks, signed transactions, Proof-of-Work mining, fork resolution, the 51% boundary, and Proof of Stake. Blockchain's real value isn't currency — it's <b>immutability and trustless coordination</b>. Everything else is built on what you just ran.</div></div>`; },
    enter(ctx) {
      if (!C.state.running) C.play(); C.setSpeed(2);
      const setEn = (v, col) => { $("#w8en").style.width = v + "%"; $("#w8en").style.background = col; $("#w8env").textContent = v < 1 ? "~0%" : v + "%"; $("#w8env").style.color = col; };
      $("#w8pow").onclick = () => { C.setMode("pow"); $("#w8pow").className = "btn primary"; $("#w8pos").className = "btn ghost"; setEn(100, "var(--amber)"); };
      $("#w8pos").onclick = () => { C.setMode("pos"); $("#w8pos").className = "btn primary"; $("#w8pow").className = "btn ghost"; setEn(0.5, "var(--green)"); V.toast("Now running Proof of Stake — no hashing"); ctx.done(); };
      $("#w8pow").className = "btn ghost";
    }});

  /* ---- shell ---- */
  function renderProg() {
    const p = $("#railProg"); p.innerHTML = "";
    CH.forEach((c, i) => { const s = el("div", "seg" + (done.has(c.id) ? " done" : (i === idx ? " cur" : ""))); p.appendChild(s); });
  }
  function go(i) {
    if (CH[idx] && CH[idx].exit) try { CH[idx].exit(); } catch (e) {}
    cleanups.forEach(fn => { try { fn(); } catch (e) {} }); cleanups = [];
    V.clearHighlight();
    idx = Math.max(0, Math.min(CH.length - 1, i));
    const c = CH[idx];
    $("#railCh").textContent = c.label; $("#railTitle").textContent = c.title;
    const body = $("#railBody"); body.innerHTML = c.body(); body.scrollTop = 0; body.classList.remove("fadein"); void body.offsetWidth; body.classList.add("fadein");
    $("#gPrev").disabled = idx === 0;
    const nx = $("#gNext"); nx.disabled = idx === CH.length - 1; nx.classList.toggle("ready", done.has(c.id));
    const ctx = { done: () => { if (!done.has(c.id)) { done.add(c.id); renderProg(); $("#gNext").classList.add("ready"); } } };
    try { c.enter && c.enter(ctx); } catch (e) { console.error("chapter enter", c.id, e); }
    renderProg();
  }
  function init() {
    $("#gPrev").onclick = () => go(idx - 1);
    $("#gNext").onclick = () => go(idx + 1);
    go(0);
  }
  return { init, go, CH };
})();
