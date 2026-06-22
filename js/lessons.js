/* ============================================================
   lessons.js — the 15-lesson journey, zero → ultra-technical.
   Each lesson renders into `mount` and calls ctx.done() when its
   goal is achieved. The learner's artifacts (wallet, tx, block,
   chain) are shared via ENGINE.state across lessons.
   ============================================================ */
(function () {
  "use strict";
  const E = window.ENGINE, U = window.UI;
  const { el, goal, insight, note, gameCard, splitZeros, fmt, short, toast, confetti, logLine } = U;

  // ACT metadata (id, label, color)
  const ACTS = {
    why:       { label: "Act 1 · Why blockchain?",  color: "#5b54e8" },
    crypto:    { label: "Act 2 · Cryptography",      color: "#0d9488" },
    build:     { label: "Act 3 · Build a chain",     color: "#e08600" },
    consensus: { label: "Act 4 · Consensus",         color: "#e5484d" },
    frontier:  { label: "Act 5 · The frontier",      color: "#8b5cf6" },
  };

  // shorthand to build the standard lesson header
  function head(mount, kicker, title, sub) {
    mount.appendChild(U.h(`<div class="lesson-head fadein">
      <div class="lesson-kicker">${kicker}</div>
      <h1 class="lesson-title">${title}</h1>
      <p class="lesson-sub">${sub}</p>
    </div>`));
  }
  const prose = (html) => U.h(`<div class="prose fadein">${html}</div>`);
  const gap = () => U.h(`<div class="section-gap"></div>`);

  const L = [];

  /* ========== 1 · THE LEDGER ========== */
  L.push({ id: "ledger", act: "why", title: "The Ledger", sub: "What money really is",
    render(m, ctx) {
      head(m, "Lesson 1", "Money is just a ledger", "Forget coins and gold. At its core, money is a <b>record of who owns what</b>. The only question that matters is: who keeps that record — and can you trust them?");
      m.appendChild(prose(`<p>Every banking system, from a clay tablet to Visa, is a <span class="term">ledger</span>: a list of balances and the transactions that change them. Whoever controls the ledger controls the money. So the real design choice is <b>where the ledger lives</b> and <b>who is allowed to edit it</b>.</p>`));
      m.appendChild(goal("Try to cheat <b>both</b> systems below. Find the one that can't be fooled by a single bad actor."));
      m.appendChild(U.h(gameCard("Ledger sandbox", `
        <div class="seg" id="lgSeg" style="display:inline-flex;background:var(--bg-tint);border-radius:12px;padding:4px;gap:4px;margin-bottom:16px">
          <button class="btn" data-mode="central" style="padding:8px 14px;border-radius:9px">🏦 One central bank</button>
          <button class="btn" data-mode="dist" style="padding:8px 14px;border-radius:9px">🌐 Distributed network</button>
        </div>
        <div id="lgBody"></div>`)));
      const seg = m.querySelector("#lgSeg"), body = m.querySelector("#lgBody");
      let mode = "central", hackedDist = false;
      const base = { Alice: 50, Bob: 30, You: 20 };
      function setSeg() { seg.querySelectorAll("button").forEach(b => { const on = b.dataset.mode === mode; b.style.background = on ? "var(--act)" : "transparent"; b.style.color = on ? "#fff" : "var(--muted)"; }); }
      function render() {
        setSeg();
        if (mode === "central") {
          body.innerHTML = `
            <p class="prose" style="font-size:14.5px">A single server holds the only copy. Fast and simple — but it's one target.</p>
            <div class="card" style="max-width:320px"><div class="card-label">🏦 Bank server — the only ledger</div><div id="lgC"></div></div>
            <div class="btn-row" style="margin-top:14px"><button class="btn danger" id="lgHackC">😈 Hack the server</button><button class="btn ghost" id="lgResetC">Reset</button></div>
            <div id="lgCmsg" style="margin-top:12px"></div>`;
          let bal = { ...base };
          const draw = (b) => body.querySelector("#lgC").innerHTML = Object.entries(b).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v" style="color:${k==='You'&&v>999?'var(--red)':'var(--text)'}">${v} coins</span></div>`).join("");
          draw(bal);
          body.querySelector("#lgHackC").onclick = () => { bal.You = 9999; draw(bal); body.querySelector("#lgCmsg").innerHTML = `<div class="callout bad" style="background:var(--red-soft);border:1px solid #f3c9cb;color:var(--red);padding:13px 15px;border-radius:10px">⚠ The single ledger was rewritten. There's no second copy to disagree — <b>everyone must accept it</b>. A central ledger is a single point of failure.</div>`; };
          body.querySelector("#lgResetC").onclick = () => { bal = { ...base }; draw(bal); body.querySelector("#lgCmsg").innerHTML = ""; };
        } else {
          body.innerHTML = `
            <p class="prose" style="font-size:14.5px">Every node keeps its <b>own</b> copy. To change the truth you must convince the <b>majority</b>.</p>
            <div class="grid3" id="lgNodes"></div>
            <div class="btn-row" style="margin-top:14px"><button class="btn danger" id="lgHackD">😈 Hack node #3 only</button><button class="btn ghost" id="lgResetD">Reset</button></div>
            <div id="lgDmsg" style="margin-top:12px"></div>`;
          const nodes = [0,1,2,3,4].map(() => ({ ...base }));
          const draw = () => body.querySelector("#lgNodes").innerHTML = nodes.map((n, i) => `<div class="card" style="padding:14px"><div class="card-label" style="margin-bottom:8px">Node #${i+1}</div><div class="kv"><span class="k">You</span><span class="v" style="color:${n.You>999?'var(--red)':'var(--text)'}">${n.You}</span></div></div>`).join("");
          draw();
          body.querySelector("#lgHackD").onclick = () => {
            nodes[2].You = 9999; draw();
            body.querySelector("#lgDmsg").innerHTML = `<div class="callout win" style="margin:0">✅ Node #3 now claims you have 9999 — but the other 4 nodes still say 20. They compare notes and <b>reject the minority lie</b>. The network heals. <b>No single node can rewrite history.</b></div>`;
            hackedDist = true; ctx.done();
          };
          body.querySelector("#lgResetD").onclick = () => { nodes.forEach(n => n.You = 20); draw(); body.querySelector("#lgDmsg").innerHTML = ""; };
        }
      }
      seg.querySelectorAll("button").forEach(b => b.onclick = () => { mode = b.dataset.mode; render(); });
      render();
      m.appendChild(insight("Removing the central keeper is the entire point of blockchain. But it creates a brand-new problem: with no boss, <b>how does the network agree on the one true ledger?</b> That question drives the rest of this course."));
    }});

  /* ========== 2 · DOUBLE-SPEND ========== */
  L.push({ id: "doublespend", act: "why", title: "The Double-Spend Problem", sub: "Why digital money is hard",
    render(m, ctx) {
      head(m, "Lesson 2", "The double-spend problem", "A physical coin can only be in one hand. But a digital file copies perfectly. So what stops you from spending the same digital coin twice?");
      m.appendChild(prose(`<p>You have exactly <b>1 coin</b>. You sign a payment to Bob's shop and, a split-second later, sign a payment of the <b>same coin</b> to Carol's dealership — broadcasting both before anyone notices. Each merchant sees only their own payment and ships the goods.</p>`));
      m.appendChild(goal("Spend your single coin twice. Watch why this breaks money entirely."));
      m.appendChild(U.h(gameCard("Double-spend simulator", `
        <div class="grid3" style="gap:14px;align-items:stretch">
          <div class="card" style="text-align:center"><div style="font-size:30px">🧑‍💻</div><b>You</b><div class="pill" id="dsBal" style="margin-top:6px">1 coin</div></div>
          <div class="card" id="dsBob" style="text-align:center"><div style="font-size:30px">🏪</div><b>Bob's shop</b><div class="pill" id="dsBobS" style="margin-top:6px">waiting</div></div>
          <div class="card" id="dsCarol" style="text-align:center"><div style="font-size:30px">🚗</div><b>Carol's cars</b><div class="pill" id="dsCarolS" style="margin-top:6px">waiting</div></div>
        </div>
        <div class="btn-row" style="margin-top:16px"><button class="btn primary" id="ds1">1 · Sign &amp; pay Bob</button><button class="btn danger" id="ds2" disabled>2 · Pay Carol the same coin</button><button class="btn ghost" id="dsR">Reset</button></div>
        <div class="log" id="dsLog" style="margin-top:14px"><div class="info">// network sees these broadcasts</div></div>`)));
      const log = m.querySelector("#dsLog");
      m.querySelector("#ds1").onclick = (e) => {
        e.target.disabled = true; m.querySelector("#ds2").disabled = false;
        m.querySelector("#dsBobS").textContent = "paid ✓ — ships 📦"; m.querySelector("#dsBob").style.borderColor = "var(--green)";
        logLine(log, `tx1 · You → Bob (1 coin) · <span style="color:var(--green)">signature valid ✓</span>`);
      };
      m.querySelector("#ds2").onclick = (e) => {
        e.target.disabled = true;
        m.querySelector("#dsCarolS").textContent = "paid ✓ — ships 🚗"; m.querySelector("#dsCarol").style.borderColor = "var(--red)";
        m.querySelector("#dsBal").textContent = "spent 2 ✗"; m.querySelector("#dsBal").style.background = "var(--red-soft)"; m.querySelector("#dsBal").style.color = "var(--red)";
        logLine(log, `tx2 · You → Carol (the <b>same</b> coin) · <span style="color:var(--green)">signature also valid ✓</span>`, "");
        logLine(log, `⚠ Both signatures are legit — cryptography proves you authorized both, but not which came <i>first</i>.`, "warn");
        logLine(log, `💥 Both merchants shipped. You spent one coin twice.`, "bad");
        ctx.done();
      };
      m.querySelector("#dsR").onclick = () => location.reload && ctx.rerender();
      m.appendChild(insight("The fix isn't more cryptography — both signatures are valid. The fix is <b>agreeing on order</b>: the network must pick one transaction as “first” and reject the other. Doing that with no central referee is exactly what <b>blocks + Proof of Work</b> achieve. First we need the cryptographic Lego bricks."));
    }});

  /* ========== 3 · HASHING ========== */
  L.push({ id: "hashing", act: "crypto", title: "Hashing", sub: "The digital fingerprint",
    render(m, ctx) {
      head(m, "Lesson 3", "Hashing: the digital fingerprint", "A hash function takes <b>any</b> data and returns a fixed-size fingerprint. It's the single most important primitive in a blockchain — so let's get an intuition for it by hand.");
      m.appendChild(prose(`<p>We'll use <span class="term">SHA-256</span> (the one Bitcoin uses). It has three magic properties: it's <b>deterministic</b> (same input → same output, always), <b>one-way</b> (you can't run it backwards), and it shows the <b>avalanche effect</b> — flip a single character and roughly half of the 256 output bits flip. This is computed for real, right here in your browser.</p>`));
      m.appendChild(goal("Edit the receipt by one character and watch how violently the fingerprint changes."));
      m.appendChild(U.h(gameCard("SHA-256, live", `
        <label class="fld">A transaction receipt (edit me)</label>
        <textarea class="input" id="hzIn" rows="2">Alice pays Bob 10 coins</textarea>
        <label class="fld" style="margin-top:14px">SHA-256 fingerprint</label>
        <div class="hashbox" id="hzOut"></div>
        <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:14px;align-items:center">
          <div class="statline"><div class="s"><span class="n" id="hzAval">0</span><span class="l">of 256 bits changed vs. original</span></div></div>
          <button class="btn ghost" id="hzRev">🔓 Try to reverse the hash</button>
        </div>
        <div id="hzRevMsg" style="margin-top:10px"></div>`)));
      const inp = m.querySelector("#hzIn"), out = m.querySelector("#hzOut");
      const original = inp.value, origBits = sha256.toBits(sha256(original));
      let touched = false;
      function render() {
        const d = sha256(inp.value); out.innerHTML = splitZeros(d);
        const bits = sha256.toBits(d); let diff = 0; for (let i = 0; i < 256; i++) if (bits[i] !== origBits[i]) diff++;
        m.querySelector("#hzAval").textContent = diff;
        if (inp.value !== original && !touched) { touched = true; ctx.done(); }
      }
      inp.oninput = render; render();
      m.querySelector("#hzRev").onclick = () => { m.querySelector("#hzRevMsg").innerHTML = `<div class="callout note" style="margin:0">There is no “reverse” button — and there never will be. To find an input matching a given hash you'd have to guess, on average, <b>2²⁵⁵ times</b>. That one-way-ness is what makes the next lessons possible.</div>`; };
      m.appendChild(insight("Because the tiniest change produces a totally different fingerprint, a hash is a perfect <b>tamper detector</b>. Seal data with its hash, and anyone can later re-hash it to check nothing was altered. Blocks are chained together using exactly this trick."));
    }});

  /* ========== 4 · YOUR KEYS ========== */
  L.push({ id: "keys", act: "crypto", title: "Your Keys", sub: "Create your identity",
    render(m, ctx) {
      head(m, "Lesson 4", "Your keys = your identity", "On a blockchain there are no usernames or passwords. Ownership is proven by a <b>private key</b>. Let's generate yours — you'll use it for the rest of the course.");
      m.appendChild(prose(`<p>You get a <span class="term">key pair</span>. The <b>private key</b> is a secret only you know — it's the master key to your funds. The <b>public key</b> (and the shorter <b>address</b> derived from it) is like an account number you hand out freely. The magic: anything signed by the private key can be verified by the public key, but the public key can never reveal the private one.</p>`));
      m.appendChild(goal("Generate the key pair that becomes your on-chain identity."));
      m.appendChild(U.h(gameCard("Your wallet", `
        <div id="kyEmpty">
          <button class="btn primary lg" id="kyGen">🔑 Generate my wallet ${E.hasSubtle ? `<span class="pill" style="background:rgba(255,255,255,.2);color:#fff">real ECDSA P-256</span>` : ``}</button>
          <p class="prose" style="font-size:13.5px;margin-top:12px;color:var(--faint)">Generates a genuine elliptic-curve key pair using your browser's Web Crypto API.</p>
        </div>
        <div id="kyShow" style="display:none">
          <div class="card" style="border-color:#f3c9cb;background:var(--red-soft)"><div class="card-label" style="color:var(--red)">🔒 Private key — NEVER share</div><div class="hashbox bad" id="kyPriv"></div></div>
          <div class="card" style="margin-top:12px"><div class="card-label">🌍 Public address — share freely</div><div class="hashbox ok" id="kyAddr"></div></div>
          <div class="btn-row" style="margin-top:12px"><button class="btn ghost" id="kyReveal">👁 Reveal private key</button><span class="pill" id="kyStatus">wallet created</span></div>
        </div>`)));
      async function gen() {
        const w = await E.generateWallet("you"); E.state.wallet = w;
        m.querySelector("#kyEmpty").style.display = "none";
        const show = m.querySelector("#kyShow"); show.style.display = "block"; show.classList.add("fadein");
        m.querySelector("#kyPriv").textContent = "•".repeat(64);
        m.querySelector("#kyAddr").textContent = w.address;
        m.querySelector("#kyReveal").onclick = () => { m.querySelector("#kyPriv").textContent = w.pubHex ? ("d3rived•secret•" + sha256(w.pubHex).slice(0, 40)) : "secret"; m.querySelector("#kyReveal").textContent = "🙈 (in real life, revealing this = losing your funds)"; };
        toast("Wallet created — this is you now"); confetti(); ctx.done();
      }
      if (E.state.wallet) { gen(); } // already created earlier
      m.querySelector("#kyGen") && (m.querySelector("#kyGen").onclick = gen);
      m.appendChild(insight("Lose the private key and your funds are gone forever — there's no “forgot password”. This brutal simplicity is also blockchain's superpower: <b>no bank can freeze or seize what only you can sign for</b>. Next, you'll use this key to authorize a payment."));
    }});

  /* ========== 5 · SIGNATURES ========== */
  L.push({ id: "signatures", act: "crypto", title: "Signing", sub: "Authorize without revealing",
    async render(m, ctx) {
      head(m, "Lesson 5", "Signing a transaction", "Now use your private key to <b>authorize</b> a payment — proving it's really you, without ever exposing your secret. Then watch what happens when an attacker tampers with it.");
      if (!E.state.wallet) E.state.wallet = await E.generateWallet("you");
      m.appendChild(prose(`<p>A <span class="term">digital signature</span> is produced from your private key <b>plus</b> the exact message. Change a single digit of the message and the signature no longer matches — so signatures bind a payment to its precise contents. Anyone can verify using your public address.</p>`));
      m.appendChild(goal("Sign a payment, then let an attacker change the amount — and watch the network reject it."));
      m.appendChild(U.h(gameCard("Sign &amp; verify", `
        <div class="grid2" style="gap:14px;align-items:start">
          <div>
            <div class="kv"><span class="k">From</span><span class="v">${short(E.state.wallet.address, 8, 6)} (you)</span></div>
            <div class="kv"><span class="k">To</span><span class="v">Satoshi</span></div>
            <label class="fld" style="margin-top:12px">Amount (coins)</label>
            <input class="input" id="sgAmt" value="10">
            <div class="btn-row" style="margin-top:14px"><button class="btn primary" id="sgSign">✍️ Sign with my key</button></div>
          </div>
          <div>
            <label class="fld">Signature</label><div class="hashbox" id="sgSig">— not signed yet —</div>
            <div class="btn-row" style="margin-top:12px"><button class="btn ghost" id="sgTamper" disabled>😈 Attacker changes amount → 1000</button><button class="btn ghost" id="sgVerify" disabled>🔍 Verify</button></div>
            <div id="sgState" style="margin-top:12px"></div>
          </div>
        </div>`)));
      let sig = null, signedAmt = null;
      const setState = (html, kind) => m.querySelector("#sgState").innerHTML = `<div class="callout ${kind}" style="margin:0">${html}</div>`;
      m.querySelector("#sgSign").onclick = async () => {
        signedAmt = m.querySelector("#sgAmt").value;
        const tx = { from: E.state.wallet.address, to: "Satoshi", amount: signedAmt, nonce: 1 };
        sig = await E.sign(E.state.wallet, E.txString(tx));
        tx.sigHex = sig; tx.valid = true; E.state.tx = tx;
        if (!E.state.mempool.find(t => t.sigHex === sig)) E.state.mempool.unshift(tx);
        m.querySelector("#sgSig").textContent = short(sig, 28, 8);
        m.querySelector("#sgTamper").disabled = false; m.querySelector("#sgVerify").disabled = false;
        setState("Signed ✓ — this transaction is now authorized by you and waiting in the mempool.", "win");
      };
      m.querySelector("#sgTamper").onclick = () => { m.querySelector("#sgAmt").value = "1000"; setState("😈 Attacker swapped the amount to <b>1000</b> but kept your old signature. Hit Verify…", "note"); };
      m.querySelector("#sgVerify").onclick = async () => {
        const tx = { from: E.state.wallet.address, to: "Satoshi", amount: m.querySelector("#sgAmt").value, nonce: 1 };
        const ok = await E.verify(E.state.wallet, E.txString(tx), sig);
        if (ok) setState("✔ VALID — amount matches what you signed. The network accepts it.", "win");
        else { setState("✘ REJECTED — the amount was altered after signing, so the signature no longer matches. Tamper caught.", "bad"); }
        ctx.done();
      };
      m.appendChild(insight("Signatures stop anyone from forging or altering your payments — but remember Lesson 2: a valid signature still doesn't stop <b>you</b> from signing two conflicting payments. Ordering is still unsolved. Time to build the structure that solves it: the block."));
    }});

  /* ========== 6 · BLOCK & MERKLE ========== */
  L.push({ id: "block", act: "build", title: "The Block", sub: "Bundle & Merkle proof",
    async render(m, ctx) {
      head(m, "Lesson 6", "Building a block", "Transactions don't go on-chain one at a time — they're <b>bundled into a block</b>. A clever tree structure lets anyone prove a transaction is inside, using just a handful of hashes.");
      if (!E.state.wallet) E.state.wallet = await E.generateWallet("you");
      // seed mempool with the learner's tx + a few others
      const others = ["Bob→Carol:5#7", "Dan→Eve:2#3", "Finn→Gail:8#1"];
      const yourTx = E.state.tx ? E.txString(E.state.tx) : `${short(E.state.wallet.address,6,4)}→Satoshi:10#1`;
      const pool = [yourTx, ...others];
      m.appendChild(prose(`<p>Each transaction is hashed, then hashes are paired and hashed again, all the way up to one <span class="term">Merkle root</span> — a single fingerprint summarizing every transaction in the block. To prove your payment is included, you don't need the whole block; you only need the few “sibling” hashes along the path to the root. That's an <b>O(log n)</b> proof.</p>`));
      m.appendChild(goal("Include your transaction in the block, then click it to reveal its Merkle proof."));
      m.appendChild(U.h(gameCard("Block builder + Merkle tree", `
        <label class="fld">Mempool — pick transactions to include (your tx is pre-selected)</label>
        <div id="bkPool" style="display:flex;flex-direction:column;gap:8px"></div>
        <div style="margin-top:18px" id="bkTreeWrap"><label class="fld">Merkle tree (click a leaf to prove it)</label><div class="mtree" id="bkTree"></div></div>
        <div class="hashbox ok" id="bkRoot" style="margin-top:14px"></div>
        <div id="bkProof" style="margin-top:12px"></div>`)));
      const selected = new Set([0]); // your tx selected
      const poolEl = m.querySelector("#bkPool");
      pool.forEach((t, i) => {
        const row = el("label", "", `<input type="checkbox" ${selected.has(i)?"checked":""} ${i===0?"":""}> <span style="font-family:var(--mono);font-size:12.5px">${t}</span> ${i===0?'<span class="pill act">your tx</span>':''}`);
        row.style.cssText = "display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer";
        row.querySelector("input").onchange = (e) => { e.target.checked ? selected.add(i) : selected.delete(i); build(); };
        poolEl.appendChild(row);
      });
      let proofShown = false, builtOnce = false;
      function build() {
        const leaves = [...selected].sort((a,b)=>a-b).map(i => pool[i]);
        if (!leaves.length) { m.querySelector("#bkTree").innerHTML = `<span class="prose">Select at least one transaction.</span>`; m.querySelector("#bkRoot").textContent = ""; return; }
        const tree = E.merkle(leaves);
        E.state.block = { txs: leaves, merkleRoot: tree.root };
        m.querySelector("#bkRoot").innerHTML = `<b>Merkle root:</b> ${splitZeros(tree.root)}`;
        renderTree(tree, leaves, -1);
        if (!builtOnce) builtOnce = true;
      }
      function renderTree(tree, leaves, leafSel) {
        const wrap = m.querySelector("#bkTree"); wrap.innerHTML = "";
        // compute proof path
        let path = new Set(), proof = new Set();
        if (leafSel >= 0) {
          let idx = leafSel;
          for (let lv = 0; lv < tree.levels.length - 1; lv++) {
            path.add(tree.levels[lv][idx].hash);
            const sib = idx % 2 === 0 ? idx + 1 : idx - 1;
            proof.add((tree.levels[lv][sib] || tree.levels[lv][idx]).hash);
            idx = Math.floor(idx / 2);
          }
          path.add(tree.levels[tree.levels.length-1][0].hash);
        }
        for (let lv = tree.levels.length - 1; lv >= 0; lv--) {
          const row = el("div", "mlevel");
          tree.levels[lv].forEach((node, i) => {
            const isLeaf = lv === 0, isRoot = lv === tree.levels.length - 1;
            let cls = "mnode" + (isLeaf ? " leaf" : isRoot ? " root" : "");
            if (path.has(node.hash)) cls += " path"; else if (proof.has(node.hash)) cls += " proof";
            const n = el("div", cls, (isLeaf ? leaves[i].slice(0,10)+"…<br>" : isRoot ? "ROOT<br>" : "") + short(node.hash,5,3));
            if (isLeaf) n.onclick = () => { renderTree(tree, leaves, i); showProof(leaves[i], proof.size, leaves.length, i); };
            row.appendChild(n);
          });
          wrap.appendChild(row);
        }
      }
      function showProof(leaf, proofSize, total, idx) {
        const isYours = idx === 0 || leaf === yourTx;
        m.querySelector("#bkProof").innerHTML = `<div class="callout ${isYours?'win':'note'}" style="margin:0">To prove <code>${leaf.slice(0,18)}…</code> is in this ${total}-tx block, you reveal just <b>${proofSize} sibling hash${proofSize===1?'':'es'}</b> (amber) and re-hash up the path (highlighted) to check it equals the root. ${isYours?"<b>That is your transaction, proven. 🎯</b>":""}</div>`;
        if (isYours && !proofShown) { proofShown = true; toast("Merkle proof verified"); ctx.done(); }
      }
      build();
      m.appendChild(insight("Merkle proofs are why a phone wallet can verify a payment without downloading the whole blockchain. The block now has a root summarizing its transactions — but anyone could make one. What makes adding a block <b>hard and expensive</b>? That's mining."));
    }});

  /* ========== 7 · MINING ========== */
  L.push({ id: "mining", act: "build", title: "Mining (PoW)", sub: "Find the golden nonce",
    render(m, ctx) {
      head(m, "Lesson 7", "Mining: Proof of Work", "Adding a block must be <b>costly</b>, or anyone could rewrite history for free. The cost is computational: you must find a magic number (the <b>nonce</b>) that makes your block's hash start with a run of zeros.");
      E.ensureChain();
      if (!E.state.block) E.state.block = { txs: [E.state.tx ? E.txString(E.state.tx) : "your tx"], merkleRoot: sha256("your tx") };
      const prev = E.state.chain[E.state.chain.length - 1];
      const blk = E.state.block;
      blk.index = E.state.chain.length; blk.prevHash = prev.hash; blk.nonce = 0; blk.difficulty = 3;
      m.appendChild(prose(`<p>Your block carries the <b>previous block's hash</b> (linking it to the chain) and your <b>Merkle root</b> (from Lesson 6). The hash function is unpredictable, so the only way to hit the target is brute force: increment the nonce, re-hash, repeat — billions of times on a real network. Verifying the answer, though, takes a <b>single</b> hash. That asymmetry is the engine of blockchain security.</p>`));
      m.appendChild(goal("Find a nonce so your block's hash starts with the required zeros — then append it to the chain."));
      m.appendChild(U.h(gameCard("Mine your block", `
        <div class="grid2" style="gap:18px;align-items:start">
          <div>
            <div class="kv"><span class="k">block #</span><span class="v">${blk.index}</span></div>
            <div class="kv"><span class="k">prev hash</span><span class="v">${short(blk.prevHash,8,6)}</span></div>
            <div class="kv"><span class="k">merkle root</span><span class="v">${short(blk.merkleRoot,8,6)}</span></div>
            <div class="slider-row" style="margin-top:14px"><span class="name">Difficulty</span><input type="range" id="mnDiff" min="1" max="4" value="3"><span class="val" id="mnDiffV">3</span></div>
            <div class="statline" style="margin-top:14px"><div class="s"><span class="n" id="mnExp">4,096</span><span class="l">expected tries (16^N)</span></div><div class="s"><span class="n" id="mnTries">0</span><span class="l">your tries</span></div></div>
          </div>
          <div>
            <label class="fld">Nonce</label><div class="hashbox" style="font-size:24px;text-align:center;font-weight:700;color:var(--act)" id="mnNonce">0</div>
            <label class="fld" style="margin-top:10px">Block hash</label><div class="hashbox" id="mnHash"></div>
            <div id="mnVerdict" style="margin-top:10px"></div>
            <div class="hashbox" id="mnRate" style="margin-top:10px;display:none;text-align:center;color:var(--act)"></div>
          </div>
        </div>
        <div class="btn-row" style="margin-top:16px"><button class="btn ghost" id="mnTry">⛏ Try +1</button><button class="btn primary" id="mnAuto">🚀 Auto-mine</button><button class="btn ghost" id="mnReset">Reset</button></div>`)));
      let mining = false, startT = 0, mined = false;
      const target = () => "0".repeat(blk.difficulty);
      function render() {
        const hsh = E.blockHash(blk);
        m.querySelector("#mnNonce").textContent = fmt(blk.nonce);
        m.querySelector("#mnTries").textContent = fmt(blk.nonce);
        m.querySelector("#mnHash").innerHTML = splitZeros(hsh);
        const ok = hsh.startsWith(target());
        const v = m.querySelector("#mnVerdict");
        if (ok) { v.innerHTML = `<div class="callout win" style="margin:0">🏆 Golden nonce! Hash starts with <code>${target()}</code>.</div>`; m.querySelector("#mnHash").classList.add("ok"); finish(hsh); }
        else { v.innerHTML = `<div class="callout note" style="margin:0">Need prefix <code>${target()}</code>, got <code>${hsh.slice(0,blk.difficulty)}</code>. Keep mining.</div>`; m.querySelector("#mnHash").classList.remove("ok"); }
        return ok;
      }
      function finish(hsh) {
        if (mined) return; mined = true; mining = false;
        blk.hash = hsh; blk.mined = true;
        if (!E.state.chain.find(b => b.index === blk.index && b.hash === blk.hash)) E.state.chain.push({ ...blk });
        m.querySelector("#mnAuto").textContent = "✅ Mined & appended";
        m.querySelector("#mnAuto").disabled = true; m.querySelector("#mnTry").disabled = true;
        toast("Block mined & added to the chain!"); confetti(); ctx.done();
      }
      m.querySelector("#mnDiff").oninput = (e) => { blk.difficulty = +e.target.value; m.querySelector("#mnDiffV").textContent = blk.difficulty; m.querySelector("#mnExp").textContent = fmt(Math.pow(16, blk.difficulty)); render(); };
      m.querySelector("#mnTry").onclick = () => { if (mined) return; blk.nonce++; render(); };
      m.querySelector("#mnReset").onclick = () => { if (mined) return; blk.nonce = 0; render(); };
      m.querySelector("#mnAuto").onclick = () => {
        if (mined) return;
        if (mining) { mining = false; m.querySelector("#mnAuto").textContent = "🚀 Auto-mine"; return; }
        mining = true; m.querySelector("#mnAuto").textContent = "⏸ Stop"; startT = performance.now();
        const step = () => {
          if (!mining) return;
          for (let i = 0; i < 1500; i++) { blk.nonce++; if (E.blockHash(blk).startsWith(target())) break; }
          const secs = (performance.now() - startT) / 1000;
          const r = m.querySelector("#mnRate"); r.style.display = "block"; r.textContent = fmt(Math.round(blk.nonce / Math.max(secs, .001))) + " hashes/sec";
          if (render()) return;
          setTimeout(step, 0);
        };
        setTimeout(step, 0);
      };
      m.querySelector("#mnExp").textContent = fmt(Math.pow(16, 3));
      render();
      m.appendChild(insight("That work is the “proof” in Proof of Work. To fake one block you'd redo all this computation — and to fake a block buried in history, you'd redo every block after it too. Let's see why that makes the chain tamper-proof."));
    }});

  /* ========== 8 · THE CHAIN ========== */
  L.push({ id: "chain", act: "build", title: "The Chain", sub: "Why it's immutable",
    render(m, ctx) {
      head(m, "Lesson 8", "Chaining blocks = immutability", "Each block stores the hash of the one before it. Change anything in a past block and its hash changes — which breaks the link in <b>every</b> block that follows. Try it on the chain <b>you</b> built.");
      E.ensureChain();
      // build a working chain incl. genesis + learner's block + 1 more demo block
      let blocks = E.state.chain.map((b, i) => ({ index: i, data: Array.isArray(b.txs) ? b.txs.join(", ") : (b.data || "block"), prevHash: b.prevHash, nonce: b.nonce, difficulty: b.difficulty || 3, hash: b.hash }));
      if (blocks.length < 3) { // pad so the cascade is visible
        let prev = blocks[blocks.length - 1];
        while (blocks.length < 3) { const nb = { index: blocks.length, data: `Later tx batch #${blocks.length}`, prevHash: prev.hash, nonce: 0, difficulty: 3 }; nb.merkleRoot = sha256(nb.data); while (!sha256(nb.index + nb.prevHash + nb.merkleRoot + nb.nonce).startsWith("000")) nb.nonce++; nb.hash = sha256(nb.index + nb.prevHash + nb.merkleRoot + nb.nonce); blocks.push(nb); prev = nb; }
      }
      const GEN = "0".repeat(64);
      const bh = (b) => sha256(b.index + b.prevHash + sha256(b.data) + b.nonce);
      m.appendChild(goal("Rewrite history — edit a past block's data and watch the chain break. Then feel the cost of fixing it."));
      m.appendChild(U.h(gameCard("Your blockchain — try to tamper with it", `<div class="chainrow" id="cnRow"></div><div id="cnMsg" style="margin-top:6px"></div>`)));
      let tampered = false;
      function valid(i) { const b = blocks[i]; const prevOk = b.prevHash === (i === 0 ? GEN : blocks[i-1].hash); const diffOk = bh(b).startsWith("0".repeat(b.difficulty)); return prevOk && diffOk && b.hash === bh(b); }
      function render() {
        const row = m.querySelector("#cnRow"); row.innerHTML = "";
        blocks.forEach((b, i) => {
          const ok = valid(i);
          const card = el("div", "cblk" + (ok ? "" : " bad") + (i === 1 ? " mine" : ""), `
            <div class="ix"><span>Block #${i}${i===1?' · yours':''}</span><span class="st">${ok ? "✅" : "⛔"}</span></div>
            <div class="row"><div class="k">data</div><textarea data-i="${i}" class="input" style="font-size:11px;padding:6px;min-height:38px">${b.data}</textarea></div>
            <div class="row"><div class="k">nonce</div><div class="v">${fmt(b.nonce)}</div></div>
            <div class="row"><div class="k">prev</div><div class="v">${short(b.prevHash,6,4)}</div></div>
            <div class="row"><div class="k">hash</div><div class="v" style="color:${ok?'var(--green)':'var(--red)'}">${short(bh(b),6,4)}</div></div>
            <div class="row" style="margin-top:8px"><button class="btn ghost" data-mine="${i}" style="font-size:11px;padding:6px 10px">⛏ Re-mine from here</button></div>`);
          row.appendChild(card);
          if (i < blocks.length - 1) row.appendChild(el("div", "cblk-link link" + (ok ? "" : " bad")) ) , row.lastChild.className = "link" + (ok?"":" bad");
        });
        row.querySelectorAll("textarea[data-i]").forEach(ta => ta.oninput = () => { const i=+ta.dataset.i; blocks[i].data = ta.value; blocks[i].hash = bh(blocks[i]); render(); const t=m.querySelector('textarea[data-i="'+i+'"]'); if(t){t.focus();} if(!tampered){tampered=true; m.querySelector("#cnMsg").innerHTML=`<div class="callout bad" style="margin:8px 0 0;background:var(--red-soft);border:1px solid #f3c9cb;color:var(--red)">⛔ Block #${i} changed → its hash changed → every later block's “prev” no longer matches. The chain is broken. To fix it you'd have to re-mine #${i} <b>and</b> every block after it, faster than the whole network mines new ones.</div>`; ctx.done();} });
        row.querySelectorAll("button[data-mine]").forEach(btn => btn.onclick = () => { let i=+btn.dataset.mine; let prev = i===0?GEN:blocks[i-1].hash; for (let j=i;j<blocks.length;j++){ blocks[j].prevHash=prev; blocks[j].nonce=0; while(!bh(blocks[j]).startsWith("0".repeat(blocks[j].difficulty))) blocks[j].nonce++; blocks[j].hash=bh(blocks[j]); prev=blocks[j].hash;} render(); });
      }
      render();
      m.appendChild(insight("This is <b>immutability</b>: the past is protected not by a law but by sheer accumulated computation. An attacker would need to out-mine the entire honest network to rewrite even recent history. Which raises the real question — what if someone controls a huge share of that mining power? That's Act 4."));
    }});

  /* ========== 9 · MINING RACE ========== */
  L.push({ id: "race", act: "consensus", title: "The Mining Race", sub: "Hash power = odds",
    render(m, ctx) {
      head(m, "Lesson 9", "The mining race", "On a live network, thousands of miners race to find the next nonce. Mining is a <b>memoryless lottery</b>: your chance of winning each block equals your share of the total hash power.");
      let miners = [{ n: "You", p: 25, c: "#5b54e8", w: 0 }, { n: "Pool B", p: 35, c: "#0d9488", w: 0 }, { n: "Pool C", p: 40, c: "#e08600", w: 0 }];
      let total = 0;
      m.appendChild(goal("Set the hash power, simulate 100 blocks, and confirm reward share ≈ work share."));
      m.appendChild(U.h(gameCard("Mining race", `<div id="rcSliders"></div>
        <div style="margin-top:16px"><label class="fld">Blocks won (<span id="rcTot">0</span> mined)</label><div style="display:flex;height:34px;border-radius:10px;overflow:hidden;border:1px solid var(--border)" id="rcTally"></div></div>
        <div class="btn-row" style="margin-top:16px"><button class="btn primary" id="rcRun">⚡ Simulate 100 blocks</button><button class="btn ghost" id="rcReset">Reset</button></div>`)));
      const sum = () => miners.reduce((a,b)=>a+b.p,0);
      function sliders() { const c = m.querySelector("#rcSliders"); c.innerHTML=""; miners.forEach((mi,i)=>{ const r=el("div","slider-row"); r.innerHTML=`<span class="name" style="color:${mi.c}">${mi.n}</span>`; const inp=el("input"); inp.type="range";inp.min="10";inp.max="70";inp.value=mi.p; inp.oninput=()=>{miners[i].p=+inp.value; tally(); sliders.v();}; const v=el("span","val");v.style.color=mi.c;v.dataset.i=i; r.appendChild(inp);r.appendChild(v);c.appendChild(r);}); sliders.v(); }
      sliders.v=()=>m.querySelectorAll("#rcSliders .val").forEach((v,i)=>v.textContent=Math.round(miners[i].p/sum()*100)+"%");
      function tally() { const t=m.querySelector("#rcTally"); t.innerHTML=""; m.querySelector("#rcTot").textContent=total; if(!total){t.innerHTML=`<div style="flex:1;display:grid;place-items:center;color:var(--faint);font-size:12px">run the simulation →</div>`;return;} miners.forEach(mi=>{const pct=mi.w/total*100; const s=el("div","",pct>8?Math.round(pct)+"%":""); s.style.cssText=`flex:${mi.w} 1 0;background:${mi.c};display:grid;place-items:center;color:#fff;font-family:var(--mono);font-size:12px;font-weight:700`; t.appendChild(s);}); }
      m.querySelector("#rcRun").onclick=()=>{ for(let i=0;i<100;i++){ let r=Math.random()*sum(),w=0; for(let j=0;j<miners.length;j++){if(r<miners[j].p){w=j;break;}r-=miners[j].p;} miners[w].w++; total++; } tally(); ctx.done(); };
      m.querySelector("#rcReset").onclick=()=>{miners.forEach(mi=>mi.w=0);total=0;tally();};
      sliders(); tally();
      m.appendChild(insight("No miner is ever “due” a win — each block is independent. Over time, payout tracks hash-power share exactly. This is why miners pool together: to turn rare jackpots into steady income. But what happens when two miners win at the <b>same time</b>?"));
    }});

  /* ========== 10 · FORKS ========== */
  L.push({ id: "forks", act: "consensus", title: "Forks", sub: "Longest-chain rule",
    render(m, ctx) {
      head(m, "Lesson 10", "Forks & the longest-chain rule", "Two miners on opposite sides of the world can find block #4 at the same instant. Now there are two valid chains. The tie-breaker is brutally simple: <b>the longest chain (most accumulated work) wins.</b>");
      m.appendChild(goal("Trigger a fork, then extend one branch to resolve it. Watch the loser get orphaned."));
      m.appendChild(U.h(gameCard("Fork resolver", `<div id="fkStage"></div><div id="fkCtl" class="btn-row" style="margin-top:14px"></div><div class="log" id="fkLog" style="margin-top:12px"><div class="info">// network view</div></div>`)));
      let state = "base"; const log = () => m.querySelector("#fkLog");
      const blk = (label, cls) => `<div class="cblk ${cls||''}" style="min-width:96px;text-align:center"><div class="ix" style="justify-content:center">${label}</div></div>`;
      function render() {
        const s = m.querySelector("#fkStage");
        if (state === "base") s.innerHTML = `<div class="chainrow">${blk("#2")}<div class="link"></div>${blk("#3")}<div class="link"></div>${blk("#4","mine")}</div>`;
        else if (state === "forked") s.innerHTML = `<div class="chainrow" style="align-items:flex-start"><div style="display:flex;align-items:center">${blk("#3")}<div class="link"></div></div><div style="display:flex;flex-direction:column;gap:14px"><div class="chainrow" style="padding:0">${blk("#4a","mine")}</div><div class="chainrow" style="padding:0">${blk("#4b")}</div></div></div>`;
        else s.innerHTML = `<div class="chainrow" style="align-items:flex-start"><div style="display:flex;align-items:center">${blk("#3")}<div class="link"></div></div><div style="display:flex;flex-direction:column;gap:14px"><div class="chainrow" style="padding:0">${blk("#4a","mine")}<div class="link"></div>${blk("#5","mine")}</div><div class="chainrow" style="padding:0;opacity:.4">${blk("#4b","bad")}<span class="pill red" style="align-self:center;margin-left:8px">orphaned</span></div></div></div>`;
        ctl();
      }
      function ctl() {
        const c = m.querySelector("#fkCtl"); c.innerHTML = "";
        if (state === "base") { const b = el("button","btn primary","⚡ Two miners find #4 at once"); b.onclick = ()=>{ state="forked"; logLine(log(),`Pool A mines <b>#4a</b>; Pool B mines <b>#4b</b> simultaneously.`); logLine(log(),`⚠ Network split — both valid. Nodes wait. <b>Undecided.</b>`,"warn"); render(); }; c.appendChild(b); }
        else if (state === "forked") { const a = el("button","btn ghost","Extend #4a →"); a.onclick=()=>resolve(); const b=el("button","btn ghost","Extend #4b →"); b.onclick=()=>resolve(); c.append(a,b); c.appendChild(el("span","pill","pick the branch the next miner builds on")); }
        else { const b=el("button","btn ghost","↺ Replay"); b.onclick=()=>{state="base"; m.querySelector("#fkLog").innerHTML='<div class="info">// network view</div>'; render();}; c.appendChild(b); }
      }
      function resolve() { state="resolved"; logLine(log(),`A miner finds <b>#5</b> on top of one branch → that chain is now longer.`,"info"); logLine(log(),`Longest-chain rule: every node switches to it. The other block is <b>orphaned</b>; its txs return to the mempool.`,"bad"); logLine(log(),`✓ Consensus restored — the fork lasted one block.`,"ok"); render(); ctx.done(); }
      render();
      m.appendChild(insight("Short forks are normal and resolve in a block or two. This is exactly why a payment isn't truly final the instant it's mined — each block stacked on top (a <b>confirmation</b>) makes it exponentially less likely to ever be reversed. Which sets up the scariest question…"));
    }});

  /* ========== 11 · 51% ATTACK ========== */
  L.push({ id: "attack", act: "consensus", title: "The 51% Attack", sub: "Nakamoto's math",
    render(m, ctx) {
      head(m, "Lesson 11", "The 51% attack", "Here's the heart of blockchain security. You bought a <b>$1M car</b>; the dealer waits for K confirmations, then hands you the keys. Your heist: secretly mine a longer chain that erases your payment. Can you out-run the honest network?");
      let q = 25, conf = 6, running = false;
      m.appendChild(goal("Discover how much hash power and how few confirmations it takes to reverse a payment."));
      m.appendChild(U.h(gameCard("Attack simulator (Bitcoin whitepaper §11 math)", `
        <div class="slider-row"><span class="name">Your hash power (q)</span><input type="range" id="atQ" min="1" max="90" value="25"><span class="val" id="atQv">25%</span></div>
        <div class="slider-row" style="margin-top:8px"><span class="name">Confirmations waited</span><input type="range" id="atC" min="0" max="12" value="6"><span class="val" id="atCv">6</span></div>
        <div class="grid2" style="margin-top:18px;align-items:center;gap:20px">
          <div style="text-align:center">
            <div class="prose" style="font-size:13px;color:var(--faint);margin:0">Probability the attack eventually succeeds</div>
            <div style="font-family:var(--mono);font-weight:800;font-size:46px;line-height:1.1" id="atPct">—</div>
            <div id="atVerdict" class="prose" style="font-size:13.5px"></div>
          </div>
          <div>
            <div class="prose" style="font-size:13px;color:var(--faint);margin-bottom:8px">One stochastic race:</div>
            <div id="atChains"></div>
            <button class="btn danger" id="atRun" style="margin-top:12px">☠ Launch attack</button>
          </div>
        </div>`)));
      function prob(qf, z) { const p = 1 - qf; if (qf >= p) return 1; const lam = z*(qf/p); let s=0,po=Math.exp(-lam); for (let k=0;k<=z;k++){ if(k>0)po*=lam/k; s+=po*(1-Math.pow(qf/p,z-k)); } return 1-s; }
      function chains() { m.querySelector("#atChains").innerHTML = `
        <div class="slider-row" style="gap:8px"><span class="name" style="width:80px;color:var(--green)">Honest</span><div style="flex:1;height:22px;background:var(--bg-tint);border-radius:8px;overflow:hidden"><div id="atH" style="height:100%;width:0;background:var(--green)"></div></div><span class="val" id="atHn" style="color:var(--green);width:30px">0</span></div>
        <div class="slider-row" style="gap:8px;margin-top:6px"><span class="name" style="width:80px;color:var(--red)">You</span><div style="flex:1;height:22px;background:var(--bg-tint);border-radius:8px;overflow:hidden"><div id="atE" style="height:100%;width:0;background:var(--red)"></div></div><span class="val" id="atEn" style="color:var(--red);width:30px">0</span></div>`; }
      function renderProb() {
        const qf=q/100, P=prob(qf,conf), pe=m.querySelector("#atPct");
        pe.textContent = P>=0.5?(P*100).toFixed(0)+"%":P<0.0001?"<0.01%":(P*100).toPrecision(2)+"%";
        pe.style.color = P>0.01?"var(--red)":"var(--green)";
        const v=m.querySelector("#atVerdict");
        if(qf>=0.5) v.innerHTML=`<b style="color:var(--red)">q ≥ 50%: you're the majority. Success is guaranteed given time — this is “the 51% attack.”</b>`;
        else if(P<0.0001) v.innerHTML=`Practically impossible. You'd burn a fortune in electricity for nothing.`;
        else if(P>0.01) v.innerHTML=`<b style="color:var(--amber)">Real risk.</b> The dealer should demand more confirmations for $1M.`;
        else v.innerHTML=`Safe enough. Each extra confirmation makes it exponentially harder.`;
      }
      m.querySelector("#atQ").oninput=e=>{q=+e.target.value;m.querySelector("#atQv").textContent=q+"%";renderProb();};
      m.querySelector("#atC").oninput=e=>{conf=+e.target.value;m.querySelector("#atCv").textContent=conf;renderProb();};
      m.querySelector("#atRun").onclick=()=>{ if(running)return; running=true; chains(); const qf=q/100; let hon=conf,evil=0,t=0; const hf=m.querySelector("#atH"),ef=m.querySelector("#atE");
        const step=()=>{ t++; if(Math.random()<qf)evil++; else hon++; const sc=Math.max(hon,evil,conf+3); hf.style.width=hon/sc*100+"%"; ef.style.width=evil/sc*100+"%"; m.querySelector("#atHn").textContent=hon; m.querySelector("#atEn").textContent=evil;
          if(evil>hon){ m.querySelector("#atVerdict").innerHTML=`<b style="color:var(--red)">💀 This run: you overtook the honest chain and reversed the payment.</b>`; running=false; ctx.done(); return; }
          if(t>=250||(qf<0.5&&hon-evil>25)){ m.querySelector("#atVerdict").innerHTML=`<b style="color:var(--green)">🛡 This run: the honest chain pulled away. Attack failed.</b> Re-run — luck varies, but the odds above are the truth.`; running=false; ctx.done(); return; }
          setTimeout(step,40); };
        step(); };
      chains(); renderProb();
      m.appendChild(insight("Below 50%, every confirmation multiplies your failure odds — security grows <b>exponentially</b> with depth. At ≥50%, the math flips and the “longest chain” rule works <i>for</i> the attacker. So Bitcoin's safety ultimately rests on one social fact: <b>no single party controls a majority of the world's hash power.</b>"));
    }});

  /* ========== 12 · PROOF OF STAKE ========== */
  L.push({ id: "pos", act: "consensus", title: "Proof of Stake", sub: "Capital, not electricity",
    render(m, ctx) {
      head(m, "Lesson 12", "Proof of Stake & slashing", "PoW buys security with electricity. Proof of Stake buys it with <b>money at risk</b>: validators lock up coins as a bond. Propose honestly → earn. Cheat → the protocol destroys your stake. Ethereum switched to this in 2022.");
      let vals=[{n:"Val A",s:32,c:"#5b54e8",w:0,x:false},{n:"Val B",s:96,c:"#0d9488",w:0,x:false},{n:"Val C",s:64,c:"#e08600",w:0,x:false},{n:"Val D",s:32,c:"#8b5cf6",w:0,x:false}]; let blocks=0;
      m.appendChild(goal("Run stake-weighted consensus, then make a validator cheat and watch it get slashed."));
      m.appendChild(U.h(gameCard("Validators", `<div class="grid2" id="psGrid" style="gap:12px"></div>
        <div class="btn-row" style="margin-top:16px"><button class="btn primary" id="psRun">⚡ Run 50 blocks</button><button class="btn danger" id="psCheat">☠ Make Val B double-sign</button><button class="btn ghost" id="psReset">Reset</button></div>
        <div class="log" id="psLog" style="margin-top:12px"><div class="info">// beacon chain</div></div>`)));
      const log=()=>m.querySelector("#psLog");
      const active=()=>vals.filter(v=>!v.x); const tot=()=>active().reduce((a,b)=>a+b.s,0);
      function grid(){ const g=m.querySelector("#psGrid"); g.innerHTML=""; vals.forEach(v=>{ const pct=v.x?0:Math.round(v.s/tot()*100); g.appendChild(U.h(`<div class="card ${v.x?'':''}" style="text-align:center;${v.x?'opacity:.5;border-color:var(--red)':''}"><b>${v.n}</b><div style="font-family:var(--mono);font-size:22px;font-weight:700;color:${v.x?'var(--red)':v.c};${v.x?'text-decoration:line-through':''}">${v.s} Ξ</div><div class="pill" style="margin-top:4px">${v.x?'SLASHED ✘':pct+'% odds'}</div><div class="prose" style="font-size:12px;margin-top:6px;color:${v.c}">won ${v.w}</div></div>`)); }); }
      function pick(){ const a=active(); let r=Math.random()*tot(); for(const v of a){if(r<v.s)return v;r-=v.s;} return a[a.length-1]; }
      m.querySelector("#psRun").onclick=()=>{ for(let i=0;i<50;i++){pick().w++;blocks++;} grid(); logLine(log(),`Ran 50 blocks — reward share is tracking stake share.`,"info"); ctx.done(); };
      m.querySelector("#psCheat").onclick=()=>{ const b=vals[1]; if(b.x){logLine(log(),`Val B already slashed.`,"warn");return;} logLine(log(),`☠ Val B signs two conflicting blocks at the same height.`,"warn"); const lost=b.s; b.x=true; b.s=0; grid(); logLine(log(),`💥 Other validators submit proof. Val B SLASHED — ${lost} Ξ destroyed and ejected. Cheating cost more than it could gain.`,"bad"); ctx.done(); };
      m.querySelector("#psReset").onclick=()=>{vals.forEach(v=>{v.w=0;v.x=false;}); vals[1].s=96; blocks=0; m.querySelector("#psLog").innerHTML='<div class="info">// beacon chain</div>'; grid();};
      grid();
      m.appendChild(insight("Same idea as PoW — selection odds scale with a scarce resource — but the resource is the validator's own capital, posted on-chain. Acquiring a majority stake would be ruinously expensive and self-defeating (you'd crash the price of the asset you hold). And it uses <b>~99.95% less energy.</b>"));
    }});

  /* ========== 13 · SMART CONTRACTS ========== */
  L.push({ id: "contracts", act: "frontier", title: "Smart Contracts", sub: "Code as the middleman",
    render(m, ctx) {
      head(m, "Lesson 13", "Smart contracts", "Once a chain can store data and run consensus, it can run <b>programs</b>. A smart contract is code that lives on-chain and executes automatically when called — no intermediary, no “trust me.”");
      m.appendChild(prose(`<p>Here's a tiny vending machine in Solidity-style pseudocode. The <code>require</code> lines are guards: if a condition fails, the whole transaction <b>reverts</b> — state is rolled back as if it never happened, though you still pay gas for the attempt.</p>`));
      m.appendChild(goal("Call buy() with too little money (watch it revert), then with enough (watch it dispense)."));
      m.appendChild(U.h(gameCard("Vending machine contract", `
        <pre class="hashbox" style="white-space:pre-wrap;font-size:12.5px;line-height:1.6"><span style="color:#8b5cf6">contract</span> Vending {
  uint price = 3;  uint stock = 3;
  <span style="color:#0d9488">function</span> buy() payable {
    <span style="color:#e08600">require</span>(msg.value >= price, "underpaid");
    <span style="color:#e08600">require</span>(stock > 0, "sold out");
    stock--; emit Dispensed(msg.sender);
  }
}</pre>
        <div class="btn-row" style="margin-top:14px"><label class="fld" style="margin:0">send</label><input class="input" id="scAmt" value="2" style="width:80px"><span class="pill">coins</span><button class="btn primary" id="scCall">▶ call buy()</button><span class="pill" id="scStock">stock: 3</span></div>
        <div class="log" id="scLog" style="margin-top:12px"><div class="info">// EVM execution log</div></div>`)));
      let stock=3, didFail=false, didOk=false; const log=()=>m.querySelector("#scLog");
      m.querySelector("#scCall").onclick=()=>{ const amt=parseFloat(m.querySelector("#scAmt").value)||0; logLine(log(),`> buy() · msg.value=${amt}`);
        if(amt<3){ logLine(log(),`✘ require(msg.value >= price) failed → REVERT "underpaid". State unchanged.`,"bad"); didFail=true; }
        else if(stock<=0){ logLine(log(),`✘ REVERT "sold out".`,"bad"); }
        else { stock--; m.querySelector("#scStock").textContent="stock: "+stock; logLine(log(),`✓ guards passed · stock → ${stock} · emit Dispensed(0x${sha256("b"+stock).slice(0,8)})`,"ok"); didOk=true; }
        if(didFail&&didOk) ctx.done();
      };
      m.appendChild(insight("This determinism — every node runs the same code and must agree on the result — is what powers <b>DeFi</b> (lending, exchanges), <b>NFTs</b>, and <b>DAOs</b>. It's also a new attack surface: a bug in the code is a bug in the money. “Code is law” cuts both ways."));
    }});

  /* ========== 14 · ZERO-KNOWLEDGE ========== */
  L.push({ id: "zk", act: "frontier", title: "Zero-Knowledge", sub: "Prove without revealing",
    render(m, ctx) {
      head(m, "Lesson 14", "Zero-knowledge proofs", "The frontier of blockchain privacy and scaling. A <b>zero-knowledge proof</b> lets you prove a statement is true while revealing <b>nothing else</b>. The classic intuition: the Ali Baba cave.");
      m.appendChild(prose(`<p>Peggy claims she knows the secret word that opens a magic door connecting the two ends of a ring-shaped cave. She wants to prove it to Victor <b>without saying the word</b>. Each round: Peggy enters one side; Victor then shouts which side she must come out of. If she really knows the word, she can always comply. If she's bluffing, she only had a 50% chance of guessing right.</p>`));
      m.appendChild(goal("Run rounds against an honest prover, then a cheater — watch the cheater's luck run out."));
      m.appendChild(U.h(gameCard("The Ali Baba cave", `
        <div class="btn-row"><button class="btn primary" id="zkRound">▶ Run a round</button><button class="btn ghost" id="zkMode">Prover: <b id="zkM">HONEST</b></button><button class="btn ghost" id="zkReset">Reset</button></div>
        <div style="margin-top:14px"><label class="fld">Victor's confidence (a cheater would have been caught by now)</label><div style="height:14px;background:var(--bg-tint);border-radius:99px;overflow:hidden"><div id="zkBar" style="height:100%;width:0;background:linear-gradient(90deg,var(--act),#0d9488);transition:width .4s"></div></div></div>
        <div class="log" id="zkLog" style="margin-top:12px"></div>`)));
      let honest=true, rounds=0, fooled=1; const log=()=>m.querySelector("#zkLog");
      m.querySelector("#zkMode").onclick=()=>{honest=!honest; m.querySelector("#zkM").textContent=honest?"HONEST":"CHEATER"; m.querySelector("#zkMode").style.borderColor=honest?"":"var(--red)";};
      m.querySelector("#zkReset").onclick=()=>{rounds=0;fooled=1;m.querySelector("#zkBar").style.width="0";m.querySelector("#zkLog").innerHTML="";};
      m.querySelector("#zkRound").onclick=()=>{ rounds++; const enter=Math.random()<.5?"A":"B"; const ask=Math.random()<.5?"A":"B"; let success;
        if(honest){ success=true; logLine(log(),`R${rounds}: enters <b>${enter}</b>, Victor demands exit <b>${ask}</b> → opens the door, complies ✓`,"ok"); fooled*=0.5; }
        else { success=ask===enter; if(success){logLine(log(),`R${rounds}: enters <b>${enter}</b>, demand <b>${ask}</b> → lucky guess, complies ✓ (50% fluke)`,"ok"); fooled*=0.5;} else {logLine(log(),`R${rounds}: enters <b>${enter}</b>, demand <b>${ask}</b> → wrong side, can't open door → EXPOSED ✘`,"bad"); fooled=0;} }
        const conf=(1-fooled)*100; m.querySelector("#zkBar").style.width=conf.toFixed(1)+"%";
        if(rounds>=3) ctx.done();
      };
      m.appendChild(insight("Repeat enough rounds and a cheater's odds of fooling Victor vanish (½ⁿ) — yet Victor never learns the word. Modern <b>zk-SNARKs/STARKs</b> compress this into a single tiny proof, powering private transactions (Zcash) and <b>zk-rollups</b> that batch thousands of transactions into one proof to scale Ethereum. This is where a huge amount of frontier research lives."));
    }});

  /* ========== 15 · RECAP ========== */
  L.push({ id: "recap", act: "frontier", title: "Recap & Frontier", sub: "You built a blockchain",
    render(m, ctx) {
      head(m, "Finale", "You built a blockchain 🎉", "From “money is a ledger” to the Nakamoto attack probability — you constructed every piece by hand. Here's the chain <b>you</b> made, and where the field goes next.");
      const w = E.state.wallet, tx = E.state.tx; E.ensureChain();
      m.appendChild(U.h(gameCard("Your on-chain footprint", `
        <div class="kv"><span class="k">Your address</span><span class="v">${w ? short(w.address,10,8) : "(not generated)"}</span></div>
        <div class="kv"><span class="k">Your signed transaction</span><span class="v">${tx ? `→ ${tx.to}, ${tx.amount} coins` : "(none)"}</span></div>
        <div class="kv"><span class="k">Blocks in your chain</span><span class="v">${E.state.chain.length}</span></div>
        <div class="kv"><span class="k">Your mined block</span><span class="v">${E.state.block && E.state.block.mined ? "#"+E.state.block.index+" ✓" : "(remine in Lesson 7)"}</span></div>`)));
      m.appendChild(U.h(`<div style="margin-top:20px"><h3 style="font-size:20px;margin-bottom:6px">The journey, in one line each</h3></div>`));
      const recap = [
        ["Ledger", "money is a record; removing the central keeper needs consensus"],
        ["Hashing", "a one-way fingerprint that detects any tampering"],
        ["Keys & signatures", "prove ownership and authorize payments without revealing secrets"],
        ["Blocks & Merkle", "bundle transactions; prove inclusion in O(log n)"],
        ["Mining", "spend work to earn the right to append a block"],
        ["Chaining", "linked hashes make the past immutable"],
        ["Consensus", "longest chain wins; 51% is the security boundary"],
        ["PoS", "swap electricity for slashable capital"],
      ];
      const grid = el("div", "grid2"); grid.style.marginTop = "10px";
      recap.forEach(([h2, d], i) => grid.appendChild(U.h(`<div class="card" style="padding:14px"><div style="display:flex;gap:10px;align-items:flex-start"><span class="pill act">${i+1}</span><div><b>${h2}</b><div class="prose" style="font-size:13px;margin:2px 0 0">${d}</div></div></div></div>`)));
      m.appendChild(grid);
      m.appendChild(U.h(`<div style="margin-top:24px"><h3 style="font-size:20px;margin-bottom:10px">Where the frontier goes next</h3></div>`));
      const frontier = [
        ["⚡ Layer-2 & rollups", "Batch thousands of txns off-chain into one on-chain proof. zk-rollups use the ZK math from Lesson 14."],
        ["💎 Real-world assets", "Tokenizing T-bills, real estate, credit. BlackRock & Franklin Templeton already have billions on-chain."],
        ["🏛 CBDCs", "State-issued digital currency — centralized and permissioned, the opposite of Bitcoin. India's e₹, China's e-CNY."],
        ["🌉 Interoperability", "Bridging assets across chains — and the single largest hack surface in crypto ($2.5B+ lost)."],
        ["👛 Account abstraction", "Smart-contract wallets: social recovery, gas sponsorship, session keys — Web2-grade UX."],
        ["⚖️ Policy", "EU's MiCA is the global benchmark; the US stays fragmented; India taxes heavily with no enabling framework."],
      ];
      const fg = el("div", "grid2"); fg.style.marginTop = "10px";
      frontier.forEach(([h2, d]) => fg.appendChild(U.h(`<div class="card" style="padding:16px"><b style="font-size:14.5px">${h2}</b><div class="prose" style="font-size:13px;margin:4px 0 0">${d}</div></div>`)));
      m.appendChild(fg);
      m.appendChild(U.h(`<div class="callout win" style="margin-top:24px"><span class="ic">✅</span><div><b>That's the whole machine.</b> Blockchain's real value isn't cryptocurrency — it's <b>immutability and trustless coordination</b>. Everything else is built on the eight ideas above.</div></div>`));
      ctx.done();
    }});

  window.LESSONS = L; window.ACTS = ACTS;
})();
