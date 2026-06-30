/* ============================================================
   lessons.js — the curriculum. Each lesson: metadata + an
   interactive (stage) + narration + a quick check (quiz).
   ============================================================ */
window.LESSONS = (function () {
  "use strict";
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const fmt = (n) => Math.round(n).toLocaleString();
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : s;
  const splitZ = (h, col = "go") => { let z = 0; while (h[z] === "0") z++; return `<span class="${col}">${h.slice(0, z)}</span>${h.slice(z)}`; };
  const bits = (hex) => { let b = ""; for (const c of hex) b += parseInt(c, 16).toString(2).padStart(4, "0"); return b; };
  const subtle = window.crypto && window.crypto.subtle, hasSubtle = !!(subtle && subtle.generateKey);
  const hexOf = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const lead = (t) => `<p class="lead">${t}</p>`, P = (t) => `<p class="p">${t}</p>`, sub = (t) => `<p class="sub">${t}</p>`;
  const aside = (h, t) => `<div class="aside"><div class="h">${h}</div>${t}</div>`, tryit = (t) => `<div class="do"><div class="l">On screen</div><div class="t">${t}</div></div>`;
  const wrap = (inner) => `<div class="mstage"><div class="mhold fadein">${inner}</div></div>`;

  const L = {};

  /* ===================== FOUNDATIONS ===================== */
  L.ledger = { world: "foundations", title: "The ledger", oneliner: "What money really is", icon: "₿",
    narr() { return lead("Money is just a ledger — a list of who owns what. The only real question is who keeps that list, and whether you can trust them.")
      + P("A bank keeps it on its own servers. That's one copy, one target, one point of control: it can be hacked, it can fail, it can freeze you out. A blockchain makes a different bet — <b>everyone keeps a copy</b>, and the truth is whatever the majority agrees on.")
      + P("Try cheating both systems on screen. Only one of them shrugs off a bad actor.")
      + aside("The whole idea", "Take away the trusted keeper and a hard new problem appears: with no boss, how does everyone agree on the one true ledger? That question drives this entire course."); },
    stage(s) {
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>centralized vs distributed</div>
        <div class="btn-row" style="margin-bottom:16px"><button class="btn" data-m="c">One bank</button><button class="btn primary" data-m="d">A network</button></div>
        <div id="lgBody"></div></div>`);
      const body = s.querySelector("#lgBody"); let mode = "d";
      function setBtns() { s.querySelectorAll("[data-m]").forEach(b => b.className = "btn" + (b.dataset.m === mode ? " primary" : "")); }
      function render() {
        setBtns();
        if (mode === "c") {
          body.innerHTML = `<p class="note" style="margin-bottom:12px">One server holds the only copy.</p><div class="kvs" id="lgT"></div><div class="btn-row" style="margin-top:14px"><button class="btn danger" id="lgH">Hack the bank</button><button class="btn" id="lgR">Reset</button></div><div id="lgM" style="margin-top:12px"></div>`;
          let bal = { Alice: 50, Bob: 30, You: 20 };
          const draw = () => body.querySelector("#lgT").innerHTML = Object.entries(bal).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v ${k === 'You' && v > 999 ? 'bad' : ''}" style="${k === 'You' && v > 999 ? 'color:var(--red)' : ''}">${v}</span></div>`).join("");
          draw();
          body.querySelector("#lgH").onclick = () => { bal.You = 9999; draw(); body.querySelector("#lgM").innerHTML = `<div class="sig-state bad">The single ledger was rewritten. No second copy to disagree — everyone must accept it. One point of control is one point of failure.</div>`; };
          body.querySelector("#lgR").onclick = () => { bal = { Alice: 50, Bob: 30, You: 20 }; draw(); body.querySelector("#lgM").innerHTML = ""; };
        } else {
          body.innerHTML = `<p class="note" style="margin-bottom:12px">Every node keeps its own copy.</p><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px" id="lgN"></div><div class="btn-row" style="margin-top:14px"><button class="btn danger" id="lgH">Hack node #3</button><button class="btn" id="lgR">Reset</button></div><div id="lgM" style="margin-top:12px"></div>`;
          const nodes = [20, 20, 20, 20, 20];
          const draw = () => body.querySelector("#lgN").innerHTML = nodes.map((v, i) => `<div class="bfield" style="text-align:center;padding:10px"><div class="k">node ${i + 1}</div><div class="v ${v > 999 ? '' : 'gr'}" style="${v > 999 ? 'color:var(--red)' : ''}">${v}</div></div>`).join("");
          draw();
          body.querySelector("#lgH").onclick = () => { nodes[2] = 9999; draw(); body.querySelector("#lgM").innerHTML = `<div class="sig-state ok">Node 3 now lies, but the other four still say 20. They compare and reject the minority. The network heals — no single node can rewrite history.</div>`; };
          body.querySelector("#lgR").onclick = () => { nodes.fill(20); draw(); body.querySelector("#lgM").innerHTML = ""; };
        }
      }
      s.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; render(); });
      render();
    },
    quiz: { q: "Why is a single bank server a weakness?", options: ["It's too slow", "One copy means one point of control and failure", "Banks don't use computers"], answer: 1, explain: "With only one copy, whoever controls it controls the money — and there's nothing to cross-check it against." } };

  L.doublespend = { world: "foundations", title: "Double-spend", oneliner: "The problem digital money must solve", icon: "⊘",
    narr() { return lead("A coin is a file, and files copy. Nothing physically stops you from paying the same coin to two people at once. This is the double-spend problem.")
      + P("It splits in two. <b>Authorisation</b> — proving you own the coin — is solved by a signature. <b>Ordering</b> — agreeing which payment happened first — needs everyone to settle on one shared order of transactions. That agreement is called <span class='k'>consensus</span>.")
      + P("And you can't just vote, because anyone can spin up a million fake identities for free — a <span class='k'>Sybil attack</span>. So a vote has to cost something real. The network is secure precisely because lying is expensive.")
      + tryit("Spend one coin twice. Both signatures are valid — only an agreed order can break the tie."); },
    stage(s) {
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>spend it twice</div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center">
          <div class="bfield" style="text-align:center"><div class="k">you hold</div><div class="v" style="font-size:20px;color:var(--cyan)" id="dBal">1 coin</div></div>
          <div class="note" style="text-align:center">sign →</div>
          <div><div class="bfield" id="dBob" style="margin-bottom:8px">Bob <span class="note" id="dBobS" style="float:right">waiting</span></div><div class="bfield" id="dCarol">Carol <span class="note" id="dCarolS" style="float:right">waiting</span></div></div></div>
        <div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn primary" id="d1">Pay Bob</button><button class="btn danger" id="d2" disabled>Pay Carol — same coin</button></div>
        <div class="log" id="dLog" style="margin-top:14px"><div class="info">network sees:</div></div></div>`);
      const log = (h, c) => s.querySelector("#dLog").appendChild(el("div", c, h));
      s.querySelector("#d1").onclick = (e) => { e.target.disabled = true; s.querySelector("#d2").disabled = false; s.querySelector("#dBobS").textContent = "paid ✓"; s.querySelector("#dBob").style.borderColor = "var(--green)"; log("tx1 · You → Bob · <span style='color:var(--green)'>signature valid</span>"); };
      s.querySelector("#d2").onclick = (e) => { e.target.disabled = true; s.querySelector("#dCarolS").textContent = "paid ✓"; s.querySelector("#dCarol").style.borderColor = "var(--red)"; s.querySelector("#dBal").innerHTML = "spent <b style='color:var(--red)'>2</b>"; log("tx2 · You → Carol · <span style='color:var(--green)'>also valid</span>"); log("both signatures check out — crypto proved authorisation, not order", "warn"); log("only an agreed ORDER of transactions resolves this → consensus", "info"); };
    },
    quiz: { q: "Signatures solve which half of the double-spend problem?", options: ["Ordering — which came first", "Authorisation — proving you own the coin", "Both halves at once"], answer: 1, explain: "A signature proves you authorised a payment, but two valid signatures can't say which one is first. That needs consensus." } };

  /* ===================== CRYPTOGRAPHY ===================== */
  L.hashing = { world: "crypto", title: "Hashing", oneliner: "The digital fingerprint", icon: "#",
    narr() { return lead("A hash function takes any input and returns a fixed-size fingerprint. SHA-256 always returns 256 bits — 64 hex characters — whether you feed it one letter or a library.")
      + P("It is <b>deterministic</b> (same input, same output) but <b>unpredictable</b>: you can't run it backwards, and the <b>avalanche effect</b> means flipping one bit of input scatters about half the output bits, with no usable pattern.")
      + P("Why one-way? Infinitely many inputs map to only 2²⁵⁶ outputs, so hashing <b>destroys information</b> — like multiplying by zero, you can't recover what went in. Forward takes nanoseconds; reversing a specific output would take longer than the age of the universe.")
      + aside("Remember", "Hashing is not encryption. Encryption is two-way and keeps the data. Hashing is one-way and throws it away. This one tool seals records, links blocks, and makes mining hard.")
      + tryit("Change one character and watch how many of the 256 output bits flip."); },
    stage(s) {
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>SHA-256, live</div>
        <div class="bfields"><div><div class="k" style="margin-bottom:6px;font-size:10px;text-transform:uppercase;color:var(--ink-4)">input A</div><textarea class="in big-in" id="hA" rows="2">hello</textarea><div class="hashout" id="hAo" style="margin-top:9px;font-size:11.5px"></div></div>
        <div><div class="k" style="margin-bottom:6px;font-size:10px;text-transform:uppercase;color:var(--ink-4)">input B — change one letter</div><textarea class="in big-in" id="hB" rows="2">Hello</textarea><div class="hashout" id="hBo" style="margin-top:9px;font-size:11.5px"></div></div></div>
        <div class="metric" style="margin-top:16px"><span class="n" id="hD">0</span> <span class="u">/ 256 bits differ between A and B</span></div>
        <div class="avalanche" id="hG"></div></div>`);
      const A = s.querySelector("#hA"), B = s.querySelector("#hB"), grid = s.querySelector("#hG");
      for (let i = 0; i < 256; i++) grid.appendChild(el("div", "b")); const cells = grid.children;
      function render() { const da = sha256(A.value), db = sha256(B.value); s.querySelector("#hAo").textContent = da; s.querySelector("#hBo").textContent = db; const ba = bits(da), bb = bits(db); let d = 0; for (let i = 0; i < 256; i++) { const on = ba[i] !== bb[i]; cells[i].classList.toggle("on", on); if (on) d++; } s.querySelector("#hD").textContent = d; }
      A.oninput = render; B.oninput = render; render();
    },
    quiz: { q: "Change one letter of the input. The output…", options: ["Changes by one letter too", "Changes by about half its bits, unpredictably", "Stays the same"], answer: 1, explain: "That's the avalanche effect — it's what makes a hash a tamper-evident seal." } };

  L.keys = { world: "crypto", title: "Keys & signatures", oneliner: "Ownership without trust", icon: "⚿",
    narr() { return lead("There are no usernames or passwords. A private key — a secret random number — is the only thing that proves ownership.")
      + P("From the private key you derive a <b>public key</b>, and from that a short <b>address</b>. Share the address; it's how people pay you. Guard the private key; it's how you spend. Owning crypto isn't holding coins — it's knowing a key that controls a ledger entry. Lose it and the coins freeze forever; copy it and the thief simply <i>is</i> you.")
      + P("Signing (<span class='k'>ECDSA</span>) does two jobs at once: it proves the message came from you and that nothing was changed. You sign the <b>hash</b> of a transaction — alter one character and the hash changes, so the signature no longer matches and the network rejects it. The verifier learns only ‘yes, this key signed this’, never your secret.")
      + aside("Policy hook", "There's no intermediary to pressure. A state can lean on a bank to freeze an account; here, control is a secret number. So states regulate the exchanges — the one place an intermediary reappears.")
      + tryit("Generate a key pair, sign a transaction, tamper with it, and watch the signature fail."); },
    stage(s) {
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>sign &amp; verify</div>
        <div id="kE"><button class="btn primary lg" id="kG">Generate my key pair${hasSubtle ? ' &nbsp;<span class="mono" style="font-size:11px;opacity:.8">real ECDSA</span>' : ''}</button></div>
        <div id="kS" style="display:none"><div class="bfields"><div class="bfield"><div class="k">private key — secret</div><div class="v" style="color:var(--red)">••••••••</div></div><div class="bfield"><div class="k">public address</div><div class="v vi" id="kA"></div></div></div>
          <div style="margin-top:13px"><div class="k" style="font-size:10px;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px">transaction</div><input class="in mono" id="kM" value="Pay Bob 5 coins"></div>
          <div class="btn-row" style="margin-top:12px"><button class="btn primary" id="kSg">Sign</button><button class="btn" id="kT" disabled>Tamper</button><button class="btn" id="kV" disabled>Verify</button></div>
          <div class="bfield" style="margin-top:12px"><div class="k">signature</div><div class="v" id="kSig">— not signed —</div></div>
          <div class="sig-state" id="kSt" style="margin-top:10px">Sign, then tamper, then verify.</div></div></div>`);
      let keys = null, sig = null;
      const setS = (t, c) => { const e = s.querySelector("#kSt"); e.textContent = t; e.className = "sig-state" + (c ? " " + c : ""); };
      s.querySelector("#kG").onclick = async () => { let pub; if (hasSubtle) { keys = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]); pub = hexOf(await subtle.exportKey("raw", keys.publicKey)); } else { keys = { _p: sha256("p" + Math.random()) }; pub = sha256(keys._p); } s.querySelector("#kE").style.display = "none"; s.querySelector("#kS").style.display = "block"; s.querySelector("#kA").textContent = "0x" + sha256(pub).slice(-16); };
      s.querySelector("#kSg").onclick = async () => { const m = s.querySelector("#kM").value; sig = hasSubtle ? hexOf(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, new TextEncoder().encode(m))) : sha256(keys._p + m); s.querySelector("#kSig").textContent = short(sig, 18, 8); s.querySelector("#kT").disabled = false; s.querySelector("#kV").disabled = false; setS("Signed. Now tamper, then verify.", "ok"); };
      s.querySelector("#kT").onclick = () => { s.querySelector("#kM").value = "Pay Bob 5000 coins"; setS("Attacker changed 5 → 5000 but kept the signature. Verify it.", ""); };
      s.querySelector("#kV").onclick = async () => { const m = s.querySelector("#kM").value; const ok = hasSubtle ? await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, keys.publicKey, new Uint8Array(sig.match(/../g).map(h => parseInt(h, 16))), new TextEncoder().encode(m)) : sig === sha256(keys._p + m); ok ? setS("VALID — signature matches the message and the key.", "ok") : setS("REJECTED — the message was altered after signing.", "bad"); };
    },
    quiz: { q: "What can someone do with only your public key?", options: ["Spend your coins", "Verify your signatures, but never recover your private key", "Reset your password"], answer: 1, explain: "The public key checks signatures and derives your address — but the math is one-way, so it never reveals the private key." } };

  /* ===================== BUILDING THE CHAIN ===================== */
  L.block = { world: "chain", title: "A block", oneliner: "What gets bundled", icon: "▦",
    narr() { return lead("We have signed transactions. A <span class='k'>block</span> bundles a batch of them and stamps a small header on top. Only the header gets hashed.")
      + P("Four fields matter: the <b>previous block's hash</b> (this is the chain), the <b>Merkle root</b> (one fingerprint over every transaction inside), a <b>timestamp</b>, and the <b>nonce</b> with a target — the mining fields, coming next.")
      + P("Edit the transactions below and watch the Merkle root and the block's hash change instantly. That sensitivity is the point: the header is a tamper-evident seal over everything in the block.")
      + tryit("Edit a transaction and watch the Merkle root and block hash react to every keystroke."); },
    stage(s) {
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>anatomy of a block</div>
        <div class="k" style="font-size:10px;text-transform:uppercase;color:var(--ink-4);margin-bottom:7px">transactions (edit me)</div>
        <textarea class="in mono" id="bTx" rows="3">Alice → Bob: 5
Carol → Dan: 2
Eve → Finn: 8</textarea>
        <div class="bfields" style="margin-top:14px">
          <div class="bfield"><div class="k">previous hash · the chain link</div><div class="v" id="bP"></div></div>
          <div class="bfield"><div class="k">timestamp</div><div class="v" id="bTi"></div></div>
          <div class="bfield hl full"><div class="k">merkle root · commits to all transactions</div><div class="v go" id="bR"></div></div>
          <div class="bfield"><div class="k">nonce · mining field (next)</div><div class="v vi">1 057 392</div></div>
          <div class="bfield"><div class="k">target</div><div class="v">0000…</div></div>
          <div class="bfield hl full"><div class="k">block hash = SHA-256(header)</div><div class="v hash" id="bH"></div></div></div></div>`);
      const prev = "0000a3f2" + sha256("prev").slice(8, 64);
      s.querySelector("#bP").textContent = short(prev, 14, 8); s.querySelector("#bTi").textContent = new Date().toLocaleTimeString();
      function merk(lines) { let lvl = lines.map(x => sha256(x)); if (!lvl.length) return sha256("∅"); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) n.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = n; } return lvl[0]; }
      const tx = s.querySelector("#bTx");
      function render() { const lines = tx.value.split("\n").filter(x => x.trim()); const root = merk(lines); s.querySelector("#bR").textContent = root; s.querySelector("#bH").innerHTML = splitZ(sha256(prev + root + "1057392")); }
      tx.oninput = render; render();
    },
    quiz: { q: "What does the Merkle root commit to?", options: ["Only the first transaction", "Every transaction in the block, as one hash", "The miner's reward"], answer: 1, explain: "Change any transaction and the root changes — so the root is a single fingerprint for the whole block's contents." } };

  L.nonce = { world: "chain", title: "The nonce", oneliner: "Proof of Work, by hand", icon: "⛏",
    narr() { return lead("Adding a block must cost real effort, or rewriting history would be free. We need a task that is hard to do but easy to check. Hashing is exactly that.")
      + P("The rule: a block is valid only if its hash is <b>below a target</b> — in practice, starts with a run of zeros. The miner can't steer the output, so they spin one throwaway field — the <span class='k'>nonce</span> — 0, 1, 2, 3… re-hashing each time. Mining is rolling a 2²⁵⁶-sided die until it lands below target.")
      + P("The maths is clean. If <code>p = target / 2²⁵⁶</code>, the expected number of tries is <code>1/p</code>, and each extra zero of difficulty makes it 16× rarer. Bitcoin runs about 10²³ hashes per block, every ten minutes, re-tuning the target every two weeks to hold that pace.")
      + aside("Policy hook", "Proof of Work turns electricity into security, so mining migrates to the cheapest power. China's 2021 ban moved half the world's hashrate across borders in months.")
      + tryit("Spin the nonce yourself, or auto-mine. Raise the difficulty and watch the expected work explode."); },
    stage(s) {
      let diff = 4, nonce = 0, tries = 0, mining = false; const DATA = "block #42 · Alice→Bob 5", PREV = "0000a3f2c1";
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>the mining puzzle</div>
        <div class="nonce-display"><span class="lab">current nonce</span><span id="nN">0</span></div>
        <div class="hashout" id="nH" style="margin:16px 0;text-align:center"></div>
        <div class="verdict no" id="nV" style="margin-bottom:16px"></div>
        <div class="target-line">hash must start with <span class="t" id="nT">0000</span></div>
        <div class="srow" style="margin:14px 0"><span class="nm">difficulty</span><input type="range" id="nD" min="1" max="5" value="4"><span class="v" id="nDv">4</span></div>
        <div class="statline"><div class="s"><span class="n" id="nE">65,536</span><span class="l">expected tries (16ᴺ)</span></div><div class="s"><span class="n" id="nTr">0</span><span class="l">your tries</span></div></div>
        <div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn gold" id="nTy">Spin once</button><button class="btn primary" id="nAu">Auto-mine</button><button class="btn" id="nR">Reset</button></div></div>`);
      const tgt = () => "0".repeat(diff);
      function render() { const h = sha256(DATA + PREV + nonce); s.querySelector("#nN").textContent = fmt(nonce); s.querySelector("#nTr").textContent = fmt(tries); s.querySelector("#nH").innerHTML = splitZ(h); const ok = h.startsWith(tgt()); const v = s.querySelector("#nV"); if (ok) { v.className = "verdict yes"; v.textContent = `Found it after ${fmt(tries)} tries`; } else { v.className = "verdict no"; v.textContent = `starts "${h.slice(0, diff)}" — need "${tgt()}"`; } return ok; }
      s.querySelector("#nD").oninput = (e) => { diff = +e.target.value; s.querySelector("#nDv").textContent = diff; s.querySelector("#nT").textContent = tgt(); s.querySelector("#nE").textContent = fmt(Math.pow(16, diff)); render(); };
      s.querySelector("#nTy").onclick = () => { if (mining) return; nonce++; tries++; render(); };
      s.querySelector("#nR").onclick = () => { mining = false; nonce = 0; tries = 0; s.querySelector("#nAu").textContent = "Auto-mine"; render(); };
      s.querySelector("#nAu").onclick = () => { if (mining) { mining = false; s.querySelector("#nAu").textContent = "Auto-mine"; return; } mining = true; s.querySelector("#nAu").textContent = "Stop"; const step = () => { if (!mining) return; for (let i = 0; i < 1200; i++) { nonce++; tries++; if (sha256(DATA + PREV + nonce).startsWith(tgt())) { render(); mining = false; s.querySelector("#nAu").textContent = "Auto-mine"; return; } } render(); setTimeout(step, 0); }; setTimeout(step, 0); };
      render();
    },
    quiz: { q: "Why does each extra zero of difficulty make mining 16× harder?", options: ["Hashes get longer", "Each hex digit has 16 possible values, so one more fixed zero is 1/16 as likely", "Miners get tired"], answer: 1, explain: "A hex digit is 0–f (16 values). Requiring one more leading zero multiplies the expected tries by 16." } };

  L.chainlink = { world: "chain", title: "The chain", oneliner: "Why the past locks", icon: "⛓",
    narr() { return lead("Now connect the blocks. Each block's header carries the <b>hash of the previous block</b>. That fingerprint is the glue — every block welded to the one before it.")
      + P("Edit a transaction in a past block. Its hash changes, so the next block's ‘previous hash’ no longer matches, and the link breaks — in plain view, all the way down. To repair it you'd have to re-mine that block <i>and every block after it</i>.")
      + P("That's what immutability really means. Not that the past can't be changed, but that changing it invalidates everything on top — and fixing it means winning the entire Proof-of-Work race again while the honest network keeps extending the real chain. Below 50% of the hashrate, you fall further behind every ten minutes.")
      + aside("Two ingredients", "Fingerprints make tampering visible. Work makes fixing it a race you lose. Glue plus cost is the whole security argument.")
      + tryit("Edit a past block, watch the break cascade, then re-mine from there to feel the cost."); },
    stage(s) {
      const GEN = "0".repeat(16), DIFF = 3; let blocks = [{ d: "Genesis" }, { d: "Alice → Bob: 5" }, { d: "Carol → Dan: 2" }, { d: "Eve → Finn: 8" }];
      const bh = (d, prev, nonce) => sha256(d + prev + nonce);
      function mine(b, prev) { b.nonce = 0; while (!bh(b.d, prev, b.nonce).startsWith("0".repeat(DIFF))) b.nonce++; }
      let prev = GEN; blocks.forEach(b => { mine(b, prev); b.prev = prev; b.hash = bh(b.d, prev, b.nonce); prev = b.hash; });
      s.innerHTML = `<div class="mstage" style="padding-top:30px"><div style="width:100%"><div class="flabel" style="justify-content:center"><span class="pin"></span>edit a block — break the chain</div><div class="mchain" id="cR"></div></div></div>`;
      function valid(i) { const b = blocks[i]; const realPrev = i === 0 ? GEN : blocks[i - 1].hash; return b.prev === realPrev && bh(b.d, b.prev, b.nonce).startsWith("0".repeat(DIFF)) && b.hash === bh(b.d, b.prev, b.nonce); }
      function render() { const row = s.querySelector("#cR"); row.innerHTML = "";
        blocks.forEach((b, i) => { const ok = valid(i); const card = el("div", "mblk" + (ok ? "" : " bad"), `<div class="top">#${i}<span class="st">${ok ? "✓" : "✕"}</span></div><textarea data-i="${i}" rows="2">${b.d.replace(/</g, "&lt;")}</textarea><div class="r"><div class="k">nonce</div><div class="v" style="color:var(--gold)">${fmt(b.nonce)}</div></div><div class="r"><div class="k">prev</div><div class="v">${short(b.prev, 8, 4)}</div></div><div class="r"><div class="k">hash</div><div class="v hash">${short(bh(b.d, b.prev, b.nonce), 8, 4)}</div></div><button class="btn" data-mine="${i}" style="margin-top:9px;font-size:11px;padding:6px 10px">Re-mine from here</button>`); row.appendChild(card); if (i < blocks.length - 1) row.appendChild(el("div", "mlink" + (ok ? "" : " bad"))); });
        row.querySelectorAll("textarea[data-i]").forEach(t => t.oninput = () => { const i = +t.dataset.i; blocks[i].d = t.value; blocks[i].hash = bh(blocks[i].d, blocks[i].prev, blocks[i].nonce); render(); const tt = s.querySelector(`textarea[data-i="${i}"]`); if (tt) tt.focus(); });
        row.querySelectorAll("button[data-mine]").forEach(btn => btn.onclick = () => { let i = +btn.dataset.mine, pr = i === 0 ? GEN : blocks[i - 1].hash; for (let j = i; j < blocks.length; j++) { blocks[j].prev = pr; mine(blocks[j], pr); blocks[j].hash = bh(blocks[j].d, pr, blocks[j].nonce); pr = blocks[j].hash; } render(); });
      }
      render();
    },
    quiz: { q: "Editing block #2 breaks block #3 because…", options: ["Block 3 stores block 2's hash, which just changed", "Blocks are stored alphabetically", "The timestamp updates"], answer: 0, explain: "Each block contains the previous block's hash. Change a block and its hash changes, so the next block's stored link no longer matches." } };

  L.merkle = { world: "chain", title: "Merkle tree", oneliner: "Prove inclusion cheaply", icon: "⋔",
    narr() { return lead("A block can hold thousands of transactions. We want one fingerprint over all of them — and a way to prove one transaction is inside <b>without sending the whole block</b>. A Merkle tree gives both.")
      + P("Build it like a tournament bracket: hash each transaction into a leaf, pair and hash, again and again, until one hash remains — the <span class='k'>Merkle root</span>. To prove transaction C is inside, you compute C yourself and are handed only the <b>siblings along the path</b> to the root. Re-hash up; if your root matches the trusted one, C is provably inside.")
      + P("And it's tiny: the tree's height is <code>log₂(n)</code>, so a million transactions need ~20 sibling hashes, a billion ~30. Doubling the block adds just <b>one</b> hash to the proof. This is what lets a phone verify a payment without downloading the chain.")
      + aside("Policy hook", "Immutability proves a record wasn't altered after entry. It says nothing about whether the entry was true. Garbage in, immutable garbage out — the sharp question for any ‘blockchain for transparency’ pitch.")
      + tryit("Click any transaction to see the handful of sibling hashes that prove it's in the block."); },
    stage(s) {
      const txs = ["Alice→Bob", "Bob→Carol", "Carol→Dan", "Dan→Eve", "Eve→Finn", "Finn→Gail", "Gail→Hank", "Hank→Ivy"];
      let levels = []; let lvl = txs.map(t => ({ hash: sha256(t), label: t })); levels.push(lvl);
      while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) { const a = lvl[i], b = lvl[i + 1] || lvl[i]; n.push({ hash: sha256(a.hash + b.hash) }); } levels.push(n); lvl = n; }
      s.innerHTML = `<div class="mstage"><div style="width:100%"><div class="flabel" style="justify-content:center"><span class="pin"></span>click a transaction to prove it</div><div class="mtree2" id="mt"></div><div class="aside" id="mM" style="max-width:560px;margin:18px auto 0;text-align:center">Click any leaf at the bottom.</div></div></div>`;
      function proof(leaf) { const path = new Set(), prf = new Set(); let idx = leaf; for (let l = 0; l < levels.length - 1; l++) { path.add(levels[l][idx].hash); const sib = idx % 2 === 0 ? idx + 1 : idx - 1; prf.add((levels[l][sib] || levels[l][idx]).hash); idx = Math.floor(idx / 2); } path.add(levels[levels.length - 1][0].hash); return { path, prf }; }
      function render(sel) { const wrapEl = s.querySelector("#mt"); wrapEl.innerHTML = ""; const pr = sel >= 0 ? proof(sel) : null;
        for (let l = levels.length - 1; l >= 0; l--) { const row = el("div", "mrow"); levels[l].forEach((node, i) => { const isLeaf = l === 0, isRoot = l === levels.length - 1; let c = "mnode" + (isLeaf ? " leaf" : isRoot ? " root" : ""); if (pr) { if (pr.path.has(node.hash)) c += " path"; else if (pr.prf.has(node.hash)) c += " proof"; } const n = el("div", c, (isLeaf ? node.label + "<br>" : isRoot ? "ROOT<br>" : "") + short(node.hash, 5, 3)); if (isLeaf) n.onclick = () => { render(i); const sz = proof(i).prf.size; s.querySelector("#mM").innerHTML = `<div class="h">proof</div>To prove <b style="color:var(--cyan)">${txs[i]}</b> is in this block of ${txs.length}, you supply only <b style="color:var(--gold)">${sz} sibling hashes</b> (gold) and re-hash up the violet path to the root. That's O(log n).`; }; row.appendChild(n); }); wrapEl.appendChild(row); }
      }
      render(-1);
    },
    quiz: { q: "Proving one transaction is in a block of 1,000,000 needs roughly…", options: ["1,000,000 hashes", "20 sibling hashes", "Half the block"], answer: 1, explain: "The tree height is log₂(n), so a million transactions need only about 20 siblings along the path." } };

  /* ===================== CONSENSUS & SECURITY ===================== */
  L.forks = { world: "consensus", title: "Forks", oneliner: "How nodes agree", icon: "⑂",
    narr() { return lead("No vote, no authority — one rule every node follows alone: the valid chain is the one with the <b>most cumulative work</b> behind it. People say ‘longest chain’; precisely it's most-work.")
      + P("Because blocks propagate at internet speed, two miners can find a valid block at nearly the same moment. The network splits — a <span class='k'>fork</span>. It resolves on the next block: whichever branch gets extended first now has more work and wins. The losing block becomes an <b>orphan</b> and its transactions return to the pool.")
      + P("So a recent block is never fully final — a deeper competing branch could replace it (a <span class='k'>reorg</span>). You get <b>probabilistic finality</b>: every block on top makes reversal exponentially harder. ‘Wait for six confirmations’ — about an hour — is this with a number on it.")
      + tryit("Trigger a fork, then choose which branch the next block extends. Watch the other get orphaned."); },
    stage(s) {
      let state = "base";
      s.innerHTML = `<div class="mstage"><div style="width:100%;max-width:620px"><div class="flabel" style="justify-content:center"><span class="pin"></span>longest-chain rule</div><div id="fkS" style="display:flex;justify-content:center;padding:20px 0"></div><div class="btn-row" id="fkC" style="justify-content:center"></div><div class="log" id="fkL" style="margin-top:16px"><div class="info">network view</div></div></div></div>`;
      const blk = (l, c) => `<div class="mblk" style="flex:0 0 auto;min-width:74px;text-align:center;${c === 'g' ? 'border-color:var(--green)' : c === 'p' ? 'border-color:var(--violet)' : c === 'o' ? 'border-color:var(--red);opacity:.4' : ''}"><div class="top" style="justify-content:center">${l}</div></div>`;
      const log = (h, c) => s.querySelector("#fkL").appendChild(el("div", c, h));
      function render() { const st = s.querySelector("#fkS"); if (state === "base") st.innerHTML = `<div style="display:flex;align-items:center">${blk("#2", "g")}<div class="mlink"></div>${blk("#3", "g")}<div class="mlink"></div>${blk("#4", "g")}</div>`; else if (state === "fork") st.innerHTML = `<div style="display:flex;align-items:center">${blk("#3", "g")}<div class="mlink"></div><div style="display:flex;flex-direction:column;gap:12px">${blk("#4a", "g")}${blk("#4b", "p")}</div></div>`; else st.innerHTML = `<div style="display:flex;align-items:center">${blk("#3", "g")}<div class="mlink"></div><div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;align-items:center">${blk("#4a", "g")}<div class="mlink"></div>${blk("#5", "g")}</div>${blk("#4b", "o")}</div></div>`; ctl(); }
      function ctl() { const c = s.querySelector("#fkC"); c.innerHTML = ""; if (state === "base") { const b = el("button", "btn primary", "Two miners find #4 at once"); b.onclick = () => { state = "fork"; log("Pool A mines #4a; Pool B mines #4b — same height", ""); log("network split: both valid, briefly undecided", "warn"); render(); }; c.appendChild(b); } else if (state === "fork") { const a = el("button", "btn", "Extend #4a"); a.onclick = res; const b = el("button", "btn", "Extend #4b"); b.onclick = res; c.append(a, b); } else { const b = el("button", "btn", "Replay"); b.onclick = () => { state = "base"; s.querySelector("#fkL").innerHTML = '<div class="info">network view</div>'; render(); }; c.appendChild(b); } }
      function res() { state = "done"; log("next block extends one branch → more work → it wins", "info"); log("the losing block is orphaned; its transactions return to the pool", "bad"); log("consensus restored — the fork lasted one block", "ok"); render(); }
      render();
    },
    quiz: { q: "When two valid blocks appear at the same height, who wins?", options: ["The one with the lower hash", "Whichever branch the next block extends (most work)", "Both stay forever"], answer: 1, explain: "The chain with the most cumulative work wins; the next block to land decides it, and the loser is orphaned." } };

  L.attack = { world: "consensus", title: "The 51% attack", oneliner: "The security boundary", icon: "½",
    narr() { return lead("Control a majority of hashrate and you can out-race the honest chain. What you <b>can</b> do: double-spend by privately building a longer chain, then releasing it; and censor transactions. What you <b>cannot</b> do: steal coins you have no key for, forge signatures, or change the rules. Cryptography still holds — only ordering is up for grabs.")
      + P("An attacker behind by <i>k</i> blocks is a gambler clawing back a deficit. Below 50% hashrate, the probability of ever catching up falls <b>exponentially</b> in <i>k</i> — each confirmation multiplies the luck they'd need. That's the maths under ‘wait for six confirmations’, from §11 of Satoshi's whitepaper, computed live here. At 50% or more, catch-up becomes certain. 50% is a cliff, not a slope.")
      + aside("Say this", "‘Decentralisation’ stops being ideology here and becomes a security parameter. A state-scale actor, or one dominant pool, is a real threat model — and smaller chains get 51%-attacked routinely.")
      + tryit("Set your hashrate and the confirmations waited, read the odds, then run a stochastic attack."); },
    stage(s) {
      let q = 30, z = 6, run = false;
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>attack console · whitepaper §11</div>
        <div class="srow"><span class="nm">your hashrate</span><input type="range" id="aQ" min="5" max="90" value="30"><span class="v" id="aQv">30%</span></div>
        <div class="srow" style="margin-top:10px"><span class="nm">confirmations</span><input type="range" id="aZ" min="0" max="12" value="6"><span class="v" id="aZv">6</span></div>
        <div style="text-align:center;margin:18px 0"><div class="note">probability the attack eventually succeeds</div><div class="mono" id="aP" style="font-size:46px;font-weight:800"></div></div>
        <div id="aRc"></div>
        <div class="btn-row" style="margin-top:14px;justify-content:center"><button class="btn danger" id="aR">Run the attack</button></div>
        <div class="note" id="aM" style="text-align:center;margin-top:10px"></div></div>`);
      function prob(qf, zz) { const pp = 1 - qf; if (qf >= pp) return 1; const lam = zz * (qf / pp); let s2 = 0, po = Math.exp(-lam); for (let k = 0; k <= zz; k++) { if (k > 0) po *= lam / k; s2 += po * (1 - Math.pow(qf / pp, zz - k)); } return 1 - s2; }
      function upd() { s.querySelector("#aQv").textContent = q + "%"; s.querySelector("#aZv").textContent = z; const Pv = prob(q / 100, z); const e = s.querySelector("#aP"); e.textContent = Pv >= .5 ? Math.round(Pv * 100) + "%" : Pv < 1e-4 ? "<0.01%" : (Pv * 100).toPrecision(2) + "%"; e.style.color = Pv > .01 ? "var(--red)" : "var(--green)"; }
      s.querySelector("#aRc").innerHTML = `<div class="srow" style="gap:8px"><span class="nm" style="width:56px;color:var(--green)">honest</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="aH" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:22px;color:var(--green)" id="aHn">0</span></div><div class="srow" style="gap:8px;margin-top:6px"><span class="nm" style="width:56px;color:var(--red)">you</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="aE" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:22px;color:var(--red)" id="aEn">0</span></div>`;
      s.querySelector("#aQ").oninput = e => { q = +e.target.value; upd(); }; s.querySelector("#aZ").oninput = e => { z = +e.target.value; upd(); }; upd();
      s.querySelector("#aR").onclick = () => { if (run) return; run = true; const qf = q / 100; let h = z, ev = 0, t = 0; const hf = s.querySelector("#aH"), ef = s.querySelector("#aE"); const step = () => { t++; Math.random() < qf ? ev++ : h++; const sc = Math.max(h, ev, z + 3); hf.style.width = h / sc * 100 + "%"; ef.style.width = ev / sc * 100 + "%"; s.querySelector("#aHn").textContent = h; s.querySelector("#aEn").textContent = ev; if (ev > h) { s.querySelector("#aM").innerHTML = `<span style="color:var(--red)">Your chain overtook the honest one. Payment reversed.</span>`; run = false; return; } if (t > 220 || (qf < .5 && h - ev > 22)) { s.querySelector("#aM").innerHTML = `<span style="color:var(--green)">The honest chain pulled away. Attack failed.</span> Re-run — the odds above are the long-run truth.`; run = false; return; } setTimeout(step, 42); }; step(); };
    },
    quiz: { q: "With 25% of the hashrate, more confirmations make a double-spend…", options: ["More likely", "Exponentially less likely", "Equally likely"], answer: 1, explain: "Below 50%, catch-up probability decays exponentially with each confirmation — which is exactly why you wait for six." } };

  L.pos = { world: "consensus", title: "Proof of Stake", oneliner: "Capital, not electricity", icon: "◈",
    narr() { return lead("Proof of Work makes lying cost <b>electricity</b>. Proof of Stake makes it cost <b>capital</b>. Validators lock up coins as a bond to win the right to propose blocks; influence is proportional to stake at risk, not hashrate.")
      + P("Same Sybil defence — faking a thousand validators means risking a thousand times the money. The protocol pseudo-randomly picks a proposer weighted by stake. <span class='k'>Slashing</span> enforces honesty: a validator who double-signs has their staked capital destroyed. Many chains add explicit finality — once finalised, reverting would burn a huge fraction of all stake.")
      + P("The tradeoffs are a genuine, open debate. Energy: PoS uses a tiny fraction — Ethereum's 2022 switch cut its use ~99.9%. PoW's argument: cost is external and physical. PoS's argument: an attacker's own stake gets slashed. The worry for both: wealth and pools concentrate control.")
      + tryit("Run blocks weighted by stake, then make a validator cheat and watch its bond get slashed."); },
    stage(s) {
      let vals = [{ n: "A", stake: 32, c: "#3fe0cf", w: 0, x: false }, { n: "B", stake: 96, c: "#8b7cff", w: 0, x: false }, { n: "C", stake: 64, c: "#f5b13d", w: 0, x: false }, { n: "D", stake: 32, c: "#46d98a", w: 0, x: false }];
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>validators · stake-weighted</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px" id="pG"></div>
        <div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn primary" id="pR">Propose 50 blocks</button><button class="btn danger" id="pC">Make B double-sign</button><button class="btn" id="pRs">Reset</button></div>
        <div class="log" id="pL" style="margin-top:14px"><div class="info">beacon chain</div></div></div>`);
      const log = (h, c) => s.querySelector("#pL").appendChild(el("div", c, h));
      const active = () => vals.filter(v => !v.x), tot = () => active().reduce((a, b) => a + b.stake, 0);
      function grid() { const g = s.querySelector("#pG"); g.innerHTML = ""; vals.forEach(v => { const pct = v.x ? 0 : Math.round(v.stake / tot() * 100); g.appendChild(el("div", "pos-card" + (v.x ? " slashed" : ""), `<b>Val ${v.n}</b><div class="stk">${v.stake}Ξ</div><div class="note" style="font-size:11px">${v.x ? "SLASHED" : pct + "% odds"}</div><div class="note" style="font-size:11px;color:${v.c}">won ${v.w}</div>`)); }); }
      function pick() { const a = active(); let r = Math.random() * tot(); for (const v of a) { if (r < v.stake) return v; r -= v.stake; } return a[a.length - 1]; }
      s.querySelector("#pR").onclick = () => { for (let i = 0; i < 50; i++) pick().w++; grid(); log("ran 50 blocks — reward share tracks stake share", "info"); };
      s.querySelector("#pC").onclick = () => { const b = vals[1]; if (b.x) return; log("Val B signs two conflicting blocks at one height", "warn"); const lost = b.stake; b.x = true; b.stake = 0; grid(); log(`Val B slashed — ${lost}Ξ destroyed and ejected. Cheating cost more than it could gain.`, "bad"); };
      s.querySelector("#pRs").onclick = () => { vals.forEach(v => { v.w = 0; v.x = false; }); vals[1].stake = 96; s.querySelector("#pL").innerHTML = '<div class="info">beacon chain</div>'; grid(); };
      grid();
    },
    quiz: { q: "How does Proof of Stake punish a cheating validator?", options: ["A fine paid later", "It destroys (slashes) their staked capital", "It bans their IP"], answer: 1, explain: "Slashing burns the validator's bond on-chain — the attack costs them their own money." } };

  /* ===================== THE ECOSYSTEM ===================== */
  L.contracts = { world: "frontier", title: "Smart contracts", oneliner: "Code as the middleman", icon: "ƒ",
    narr() { return lead("Once a chain can store data and run consensus, it can run <b>programs</b>. A smart contract is code that lives on-chain and executes exactly as written, enforced by every node — no intermediary to trust or bribe.")
      + P("It isn't ‘smart’ and isn't a ‘contract’: it's a deterministic program with no off switch. ‘If X, do Y’, automatically. Here's a vending machine. The <code>require</code> lines are guards — fail one and the whole transaction <b>reverts</b>, as if it never happened (though you still pay for the gas).")
      + P("This powers <b>DeFi</b> (lending and trading with no bank), <b>NFTs</b>, and <b>DAOs</b> — all just contracts moving tokens by rules. The catch: immutable code means immutable <b>bugs</b>, and the funds sit inside the contract. A logic flaw is a vault with a hole; billions have been lost this way.")
      + tryit("Call buy() with too little, then with enough. Watch one revert and one dispense."); },
    stage(s) {
      let stock = 3;
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>a vending machine, on-chain</div>
        <pre class="sc-screen" style="white-space:pre-wrap"><span style="color:#8b7cff">contract</span> Vending {
  uint price = 3;  uint stock = 3;
  <span style="color:#3fe0cf">function</span> buy() payable {
    <span style="color:#f5b13d">require</span>(msg.value >= price, "underpaid");
    <span style="color:#f5b13d">require</span>(stock > 0, "sold out");
    stock--; emit Dispensed(msg.sender);
  }
}</pre>
        <div class="btn-row" style="margin-top:14px;align-items:center"><span class="note">send</span><input class="in mono" id="cAmt" value="2" style="width:70px"><span class="note">coins</span><button class="btn primary" id="cCall">call buy()</button><span class="note" id="cStock">stock: 3</span></div>
        <div class="log" id="cL" style="margin-top:12px"><div class="info">EVM execution</div></div></div>`);
      const log = (h, c) => s.querySelector("#cL").appendChild(el("div", c, h));
      s.querySelector("#cCall").onclick = () => { const a = parseFloat(s.querySelector("#cAmt").value) || 0; log(`> buy() · msg.value = ${a}`); if (a < 3) { log(`require(value >= price) failed → REVERT "underpaid". State unchanged.`, "bad"); return; } if (stock <= 0) { log(`REVERT "sold out".`, "bad"); return; } stock--; s.querySelector("#cStock").textContent = "stock: " + stock; log(`guards passed · stock → ${stock} · emit Dispensed(0x${sha256("b" + stock).slice(0, 8)})`, "ok"); };
    },
    quiz: { q: "If a require() guard fails mid-transaction…", options: ["The contract keeps going", "The whole transaction reverts, as if it never happened", "The money is lost forever"], answer: 1, explain: "A failed require reverts all state changes — though the caller still pays gas for the work attempted." } };

  L.zk = { world: "frontier", title: "Zero-knowledge", oneliner: "Prove without revealing", icon: "◇",
    narr() { return lead("The frontier of privacy and scaling. A <b>zero-knowledge proof</b> lets you prove a statement is true while revealing nothing beyond its truth.")
      + P("The intuition is the Ali Baba cave. Peggy claims she knows the secret word that opens a door joining two tunnels. Each round, she enters one side; Victor then shouts which side she must exit. If she really knows the word she can always comply. If she's bluffing, she had a 50% chance of guessing. Run enough rounds and a cheater's luck runs out — yet Victor never learns the word.")
      + P("Real <b>zk-SNARKs / zk-STARKs</b> compress this into a tiny proof that ‘I ran this computation correctly’, cheap to check even when the computation was huge. That powers private payments and <b>zk-rollups</b> — bundling thousands of transactions off-chain and posting one proof to settle them, scaling the chain without trusting anyone.")
      + tryit("Run rounds as an honest prover, then as a cheater, and watch the confidence bar."); },
    stage(s) {
      let honest = true, rounds = 0, fooled = 1;
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>the Ali Baba cave</div>
        <div class="btn-row"><button class="btn primary" id="zR">Run a round</button><button class="btn" id="zM">Prover: <b id="zMl">HONEST</b></button><button class="btn" id="zRs">Reset</button></div>
        <div style="margin-top:14px"><div class="note" style="margin-bottom:6px">Victor's confidence (a cheater would be caught by now)</div><div style="height:14px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden"><div id="zB" style="height:100%;width:0;background:linear-gradient(90deg,var(--violet),var(--cyan));transition:width .4s"></div></div></div>
        <div class="log" id="zL" style="margin-top:12px"></div></div>`);
      const log = (h, c) => { const d = el("div", c); d.innerHTML = h; s.querySelector("#zL").prepend(d); };
      s.querySelector("#zM").onclick = () => { honest = !honest; s.querySelector("#zMl").textContent = honest ? "HONEST" : "CHEATER"; s.querySelector("#zM").style.borderColor = honest ? "" : "var(--red)"; };
      s.querySelector("#zRs").onclick = () => { rounds = 0; fooled = 1; s.querySelector("#zB").style.width = "0"; s.querySelector("#zL").innerHTML = ""; };
      s.querySelector("#zR").onclick = () => { rounds++; const enter = Math.random() < .5 ? "A" : "B", ask = Math.random() < .5 ? "A" : "B"; let ok; if (honest) { ok = true; log(`R${rounds}: enters ${enter}, exit ${ask} demanded → opens the door, complies ✓`, "ok"); fooled *= .5; } else { ok = ask === enter; ok ? (log(`R${rounds}: enters ${enter}, exit ${ask} → lucky guess ✓ (50%)`, "ok"), fooled *= .5) : (log(`R${rounds}: enters ${enter}, exit ${ask} → wrong side, EXPOSED ✕`, "bad"), fooled = 0); } s.querySelector("#zB").style.width = ((1 - fooled) * 100).toFixed(1) + "%"; };
    },
    quiz: { q: "After many rounds, what has Victor learned?", options: ["The secret word", "That Peggy almost certainly knows it — but not the word itself", "Nothing at all"], answer: 1, explain: "That's the magic: overwhelming confidence in the claim, zero knowledge of the secret behind it." } };

  L.money = { world: "frontier", title: "Money & the state", oneliner: "Stablecoins, CBDCs", icon: "$",
    narr() { return lead("Two kinds of digital money sit at opposite ends of a spectrum of control. Slide the marker to see where each lands.")
      + P("<b>Stablecoins</b> hold a peg to a real currency — fiat-backed (a dollar in reserve per token), crypto-backed (over-collateralised), or algorithmic (held by code, and fragile — Terra collapsed). The peg holds only while everyone believes redemption at par is real.")
      + P("A <b>CBDC</b> is a central bank's own digital currency — and technically the <b>opposite</b> of crypto: centralised, permissioned, fully controlled by the issuer. China's e-CNY is built for visibility and control; India's e-Rupee is in pilot; the digital euro is wary of disintermediating banks.")
      + aside("The through-line", "Same technology, opposite valence. Take the referee out and you get money no state can freeze. Hand the state the keys and you get the most controllable money in history. The policy question is never the tech — it's who holds the keys.")
      + tryit("Drag the marker from permissionless crypto to state-controlled money."); },
    stage(s) {
      s.innerHTML = wrap(`<div class="fcard"><div class="flabel"><span class="pin"></span>the control spectrum</div>
        <input type="range" id="spR" min="0" max="100" value="20" style="width:100%">
        <div style="display:flex;justify-content:space-between;margin-top:8px"><span class="note" style="color:var(--cyan)">permissionless</span><span class="note" style="color:var(--red)">state-controlled</span></div>
        <div class="fcard" id="spCard" style="margin-top:16px;background:rgba(0,0,0,.25)"></div></div>`);
      const ex = [{ at: 0, t: "Bitcoin", d: "No issuer, no off switch, censorship-resistant. The most decentralised money — and the hardest for any state to touch." }, { at: 30, t: "Stablecoin (USDC)", d: "A private issuer holds dollar reserves and can freeze addresses. Centralised, but living on a public chain." }, { at: 70, t: "e-CNY / e-Rupee", d: "Issued by the central bank: centralised, permissioned, visible to the state. The opposite end of the design space from Bitcoin." }, { at: 100, t: "Programmable CBDC", d: "Money with rules baked in — expiry dates, spending limits, conditional transfers. Powerful, and a civil-liberties flashpoint." }];
      const card = s.querySelector("#spCard"), R = s.querySelector("#spR");
      function render(v) { let pick = ex[0]; for (const e of ex) if (v >= e.at - 15) pick = e; const dec = 100 - v; card.innerHTML = `<h3 style="font-family:var(--disp);font-weight:500;font-size:22px;margin-bottom:6px">${pick.t}</h3><p class="note" style="font-size:13.5px;color:var(--ink-2);line-height:1.5">${pick.d}</p><div class="note" style="margin-top:10px;font-family:var(--mono)">decentralisation ${dec}% · state control ${v}%</div>`; }
      R.oninput = e => render(+e.target.value); render(20);
    },
    quiz: { q: "How does a CBDC differ from Bitcoin?", options: ["It's faster", "It's centralised, permissioned and state-controlled — the opposite design", "It uses no computers"], answer: 1, explain: "A CBDC hands the keys to the state. Same digital-money idea, opposite valence on control." } };

  return L;
})();
