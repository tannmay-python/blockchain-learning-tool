/* ============================================================
   modules.js — focused, one-concept-at-a-time interactives.
   Each module mirrors a part of the seminar deck. Nothing runs
   in the background; only the current module is on screen.
   ============================================================ */
window.MODULES = (function () {
  "use strict";
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const fmt = (n) => Math.round(n).toLocaleString();
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : s;
  const splitZ = (h, col = "go") => { let z = 0; while (h[z] === "0") z++; return `<span class="${col}">${h.slice(0, z)}</span>${h.slice(z)}`; };
  const bits = (hex) => { let b = ""; for (const c of hex) b += parseInt(c, 16).toString(2).padStart(4, "0"); return b; };
  const subtle = window.crypto && window.crypto.subtle;
  const hasSubtle = !!(subtle && subtle.generateKey);
  const hexOf = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

  /* small narration builder */
  function N(parts) { return parts.join(""); }
  const lead = (t) => `<p class="lead">${t}</p>`;
  const p = (t) => `<p class="p">${t}</p>`;
  const sub = (t) => `<p class="sub">${t}</p>`;
  const aside = (h, t) => `<div class="aside"><div class="h">${h}</div>${t}</div>`;
  const tryit = (t) => `<div class="do"><div class="l">On screen</div><div class="t">${t}</div></div>`;

  const M = [];

  /* ============ A · THE PROBLEM ============ */
  M.push({ id: "problem", part: "A", title: "The problem", sub: "Why we need any of this",
    narr() { return N([
      lead("Money is a ledger — a record of who owns what. We trust a bank to keep it honestly. Take the bank away and one problem dominates everything: the double-spend."),
      p("A digital coin is a file, and files copy. Nothing physically stops me paying the same coin to two people. The problem splits in two. <b>Authorisation</b> — proving I own the coin — is solved by a signature. <b>Ordering</b> — agreeing which payment came first — needs everyone to settle on one shared order of transactions. That agreement is <span class=\"k\">consensus</span>."),
      p("Why not just vote? Because identity on the internet is free — I can spin up a million fake nodes and outvote everyone. That's a <span class=\"k\">Sybil attack</span>. So a vote has to <b>cost</b> something real: electricity (Proof of Work) or capital at stake (Proof of Stake). The network is secure because lying is expensive."),
      aside("Say this", "Everything in this seminar is one question — how do strangers agree on a ledger with no referee? Each module answers a piece of it."),
      tryit("Try to spend one coin twice. Both payments are validly signed — yet only an agreed order can resolve it."),
    ]); },
    stage(s) {
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>the double-spend</div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center">
          <div class="fcard" style="text-align:center;padding:18px"><div style="font-size:13px;color:var(--ink-3)">You hold</div><div class="mono" style="font-size:24px;font-weight:700;color:var(--cyan)" id="dpBal">1 coin</div></div>
          <div style="text-align:center;color:var(--ink-4);font-size:12px">sign &amp;<br>broadcast →</div>
          <div><div class="fcard" id="dpBob" style="padding:14px;margin-bottom:10px"><b>Bob</b> <span class="mono" id="dpBobS" style="float:right;color:var(--ink-4)">waiting</span></div>
            <div class="fcard" id="dpCarol" style="padding:14px"><b>Carol</b> <span class="mono" id="dpCarolS" style="float:right;color:var(--ink-4)">waiting</span></div></div>
        </div>
        <div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn primary" id="dp1">Pay Bob</button><button class="btn danger" id="dp2" disabled>Pay Carol — same coin</button><button class="btn" id="dpR">Reset</button></div>
        <div class="log" id="dpLog" style="margin-top:14px"><div class="info">network sees:</div></div></div></div>`;
      const log = (h, c) => s.querySelector("#dpLog").appendChild(el("div", c, h));
      s.querySelector("#dp1").onclick = (e) => { e.target.disabled = true; s.querySelector("#dp2").disabled = false; s.querySelector("#dpBobS").textContent = "paid ✓"; s.querySelector("#dpBob").style.borderColor = "var(--green)"; log("tx1 · You → Bob · <span style='color:var(--green)'>signature valid</span>"); };
      s.querySelector("#dp2").onclick = (e) => { e.target.disabled = true; s.querySelector("#dpCarolS").textContent = "paid ✓"; s.querySelector("#dpCarol").style.borderColor = "var(--red)"; s.querySelector("#dpBal").innerHTML = "spent <b style='color:var(--red)'>2</b>"; log("tx2 · You → Carol · <span style='color:var(--green)'>signature also valid</span>"); log("both signatures check out — cryptography proved you authorised both, not which is first", "warn"); log("only an agreed ORDER of transactions resolves this → consensus", "info"); };
      s.querySelector("#dpR").onclick = () => window.__rerender && window.__rerender();
    }});

  /* ============ B · HASHING ============ */
  M.push({ id: "hashing", part: "B", title: "Hashing", sub: "The fingerprint",
    narr() { return N([
      lead("A hash function takes any input and returns a fixed-size fingerprint. <span class=\"k\">SHA-256</span> always returns 256 bits — 64 hex characters — whether you feed it one letter or a library."),
      p("It is <b>deterministic</b> (same input, same output, always) but <b>unpredictable</b>: you cannot work backwards from output to input, and the <b>avalanche effect</b> means flipping a single bit of input scatters about half the output bits with no usable pattern."),
      p("Why is it one-way? There are infinitely many possible inputs but only 2²⁵⁶ outputs, so hashing <b>destroys information</b> — like multiplying by zero, you can't recover what went in. Forward takes nanoseconds; reversing a specific output would take longer than the age of the universe."),
      p("Security rests on three guarantees: <b>preimage</b> resistance (can't find an input for a given output), <b>second-preimage</b> (can't find another input matching one), and <b>collision</b> resistance (can't find any two inputs that match). The birthday paradox means collisions take ~2¹²⁸ work, not 2²⁵⁶ — still astronomical, which is why SHA-256 holds while SHA-1 (2⁸⁰) is dead."),
      aside("Say this", "Hashing is not encryption. Encryption is two-way and keeps the information. Hashing is one-way and throws it away. This one tool seals records, links blocks, and makes mining hard."),
      tryit("Change one character in either box and watch how many of the 256 output bits flip."),
    ]); },
    stage(s) {
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>SHA-256, live</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div><div class="bfield" style="border:none;padding:0;margin-bottom:6px"><div class="k">input A</div></div><textarea class="in big-in" id="hA" rows="2">hello</textarea><div class="hashout" id="hAo" style="margin-top:10px;font-size:12.5px"></div></div>
          <div><div class="bfield" style="border:none;padding:0;margin-bottom:6px"><div class="k">input B — change one letter</div></div><textarea class="in big-in" id="hB" rows="2">Hello</textarea><div class="hashout" id="hBo" style="margin-top:10px;font-size:12.5px"></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:24px;margin-top:18px;flex-wrap:wrap">
          <div class="metric"><span class="n" id="hDiff">0</span> <span class="u">/ 256 bits differ between A and B</span></div>
        </div>
        <div class="avalanche" id="hGrid"></div></div></div>`;
      const A = s.querySelector("#hA"), B = s.querySelector("#hB"), grid = s.querySelector("#hGrid");
      for (let i = 0; i < 256; i++) grid.appendChild(el("div", "b"));
      const cells = grid.children;
      function render() {
        const da = sha256(A.value), db = sha256(B.value);
        s.querySelector("#hAo").innerHTML = da; s.querySelector("#hBo").innerHTML = db;
        const ba = bits(da), bb = bits(db); let d = 0;
        for (let i = 0; i < 256; i++) { const on = ba[i] !== bb[i]; cells[i].classList.toggle("on", on); if (on) d++; }
        s.querySelector("#hDiff").textContent = d;
      }
      A.oninput = render; B.oninput = render; render();
    }});

  /* ============ C · KEYS & SIGNATURES ============ */
  M.push({ id: "keys", part: "C", title: "Keys & signatures", sub: "Ownership without trust",
    narr() { return N([
      lead("To verify a secret password, the verifier must know it — and anyone who knows it can forge it. Public-key cryptography breaks that trap by splitting the secret in two."),
      p("You hold a <b>private key</b> (only you can sign with it) and a <b>public key</b> (anyone can check your signature with it). The chain runs one direction: private → public → <b>address</b>, where the address is a hash of the public key. Owning crypto isn't holding coins — it's knowing a private key that controls a ledger entry. Lose it and the coins freeze forever; copy it and the thief simply <i>is</i> you."),
      p("Signing (<span class=\"k\">ECDSA</span>) does two jobs at once: it proves the message came from you and that nothing was changed. You sign the <b>hash</b> of the transaction — change one character and the hash changes, so the signature no longer matches and the network rejects it. The verifier learns only ‘yes, this key signed this’, never your private key."),
      p("Why is it one-way? It's built on elliptic curves: your public key is a fixed point added to itself <i>k</i> times, where <i>k</i> is your private key. Going forward is fast; going back — the discrete-log problem — is computationally hopeless."),
      aside("Policy hook", "There's no intermediary to pressure. A state can lean on a bank to freeze an account; here, control is a secret number. So states regulate the on/off-ramps — the exchanges — the one place an intermediary reappears."),
      tryit("Generate a key pair, sign a transaction, then tamper with it and watch the signature fail."),
    ]); },
    stage(s) {
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>sign &amp; verify</div>
        <div id="kEmpty"><button class="btn primary lg" id="kGen">Generate my key pair${hasSubtle ? ' &nbsp;<span class="mono" style="font-size:11px;opacity:.8">real ECDSA P-256</span>' : ''}</button></div>
        <div id="kShow" style="display:none">
          <div class="bfields"><div class="bfield"><div class="k">private key — secret</div><div class="v" style="color:var(--red)">••••••••••••</div></div><div class="bfield"><div class="k">public address</div><div class="v vi" id="kAddr"></div></div></div>
          <div style="margin-top:14px"><div class="bfield" style="border:none;padding:0;margin-bottom:6px"><div class="k">transaction</div></div><input class="in mono" id="kMsg" value="Pay Bob 5 coins"></div>
          <div class="btn-row" style="margin-top:12px"><button class="btn primary" id="kSign">Sign</button><button class="btn" id="kTamper" disabled>Tamper (change amount)</button><button class="btn" id="kVerify" disabled>Verify</button></div>
          <div class="bfield" style="margin-top:12px"><div class="k">signature</div><div class="v" id="kSig">— not signed —</div></div>
          <div class="sig-state" id="kState" style="margin-top:10px">Sign the transaction, then tamper with it.</div>
        </div></div></div>`;
      let keys = null, sig = null;
      const setS = (t, c) => { const e = s.querySelector("#kState"); e.textContent = t; e.className = "sig-state" + (c ? " " + c : ""); };
      async function gen() {
        if (hasSubtle) { keys = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]); var pub = hexOf(await subtle.exportKey("raw", keys.publicKey)); }
        else { keys = { _p: sha256("p" + Math.random()) }; var pub = sha256(keys._p); }
        s.querySelector("#kEmpty").style.display = "none"; s.querySelector("#kShow").style.display = "block";
        s.querySelector("#kAddr").textContent = "0x" + sha256(pub).slice(-16);
      }
      s.querySelector("#kGen").onclick = gen;
      s.querySelector("#kSign").onclick = async () => {
        const m = s.querySelector("#kMsg").value;
        sig = hasSubtle ? hexOf(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, new TextEncoder().encode(m))) : sha256(keys._p + m);
        s.querySelector("#kSig").textContent = short(sig, 18, 8); s.querySelector("#kTamper").disabled = false; s.querySelector("#kVerify").disabled = false;
        setS("Signed. Now tamper with the message, then verify.", "ok");
      };
      s.querySelector("#kTamper").onclick = () => { s.querySelector("#kMsg").value = "Pay Bob 5000 coins"; setS("Attacker changed 5 → 5000 but kept the old signature. Verify it.", ""); };
      s.querySelector("#kVerify").onclick = async () => {
        const m = s.querySelector("#kMsg").value;
        let ok = hasSubtle ? await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, keys.publicKey, new Uint8Array(sig.match(/../g).map(h => parseInt(h, 16))), new TextEncoder().encode(m)) : sig === sha256(keys._p + m);
        ok ? setS("VALID — signature matches the message and the public key.", "ok") : setS("REJECTED — the message was altered after signing. Tamper caught.", "bad");
      };
    }});

  /* ============ D · A BLOCK ============ */
  M.push({ id: "block", part: "D", title: "A block", sub: "What gets bundled",
    narr() { return N([
      lead("We have signed transactions. A <span class=\"k\">block</span> bundles a batch of them and stamps a small <b>header</b> on top. Only the header gets hashed."),
      p("Four fields matter. The <b>previous block's hash</b> — this is the chain itself. The <b>Merkle root</b> — one fingerprint that commits to every transaction inside. A <b>timestamp</b>. And the <b>nonce</b> with a target — the mining fields we'll use next."),
      p("Edit the data below and watch the Merkle root and the block's hash change instantly. That sensitivity is the whole point: the header is a tamper-evident seal over everything in the block. If a single transaction changed, the Merkle root would change, and so would the block's hash."),
      aside("Note", "A block on its own isn't special — anyone can build one. What makes adding it <i>hard</i>, and the past unchangeable, is the next two modules: the nonce, and the chain."),
      tryit("Edit the transactions and watch the Merkle root and block hash react to every keystroke."),
    ]); },
    stage(s) {
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>anatomy of a block</div>
        <div class="bfield full" style="border:none;padding:0;margin-bottom:8px"><div class="k">transactions (edit me)</div></div>
        <textarea class="in mono" id="bTx" rows="3">Alice → Bob: 5
Carol → Dan: 2
Eve → Finn: 8</textarea>
        <div class="bfields" style="margin-top:14px">
          <div class="bfield"><div class="k">previous block hash · the chain link</div><div class="v" id="bPrev"></div></div>
          <div class="bfield"><div class="k">timestamp</div><div class="v" id="bTime"></div></div>
          <div class="bfield hl full"><div class="k">merkle root · commits to all transactions</div><div class="v go" id="bRoot"></div></div>
          <div class="bfield"><div class="k">nonce · the mining field (next)</div><div class="v vi">1 057 392</div></div>
          <div class="bfield"><div class="k">target · difficulty</div><div class="v">0000…</div></div>
          <div class="bfield hl full"><div class="k">this block's hash = SHA-256(header)</div><div class="v hash" id="bHash"></div></div>
        </div></div></div>`;
      const prev = "0000a3f2" + sha256("prev").slice(8, 64);
      s.querySelector("#bPrev").textContent = short(prev, 14, 8);
      s.querySelector("#bTime").textContent = new Date().toLocaleTimeString();
      function merk(lines) { let lvl = lines.map(x => sha256(x)); if (!lvl.length) return sha256("∅"); while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) n.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = n; } return lvl[0]; }
      const tx = s.querySelector("#bTx");
      function render() { const lines = tx.value.split("\n").filter(x => x.trim()); const root = merk(lines); s.querySelector("#bRoot").textContent = root; s.querySelector("#bHash").innerHTML = splitZ(sha256(prev + root + "1057392"), "go"); }
      tx.oninput = render; render();
    }});

  /* ============ E · THE NONCE ============ */
  M.push({ id: "nonce", part: "E", title: "The nonce", sub: "Proof of Work, by hand",
    narr() { return N([
      lead("Adding a block must cost real effort, or rewriting history would be free. We need a task that is <b>hard to do but easy to check</b>. Hashing is exactly that."),
      p("The rule: a block is valid only if its hash is <b>below a target</b> — in practice, starts with a run of zeros. The miner can't steer the output (avalanche), so they spin one throwaway field — the <span class=\"k\">nonce</span> — 0, 1, 2, 3… re-hashing each time. Mining is rolling a 2²⁵⁶-sided die until it lands below target."),
      p("The maths is clean. If <code>p = target / 2²⁵⁶</code> is the chance one hash qualifies, the expected number of tries is <code>1/p</code>. Each extra zero of difficulty makes it 16× rarer. Bitcoin today runs about 10²³ hashes per block, every ten minutes — and the network re-tunes the target every two weeks to hold that pace as miners come and go."),
      p("Why do it? The winner mints new coins (the block reward) plus the fees in the block. And here's the recurring theme: producing a block is staggeringly expensive, but <b>verifying</b> it is a single hash and one comparison. Cheap-to-check, expensive-to-cheat."),
      aside("Policy hook", "Proof of Work turns electricity into security, so mining migrates to the cheapest power. China's 2021 ban moved half the world's hashrate across borders in months. Where the machines sit is now a geopolitical fact."),
      tryit("Spin the nonce yourself, or auto-mine. Raise the difficulty and watch the expected work explode."),
    ]); },
    stage(s) {
      let diff = 4, nonce = 0, tries = 0, mining = false;
      const DATA = "block #42 · Alice→Bob 5", PREV = "0000a3f2c1";
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>the mining puzzle</div>
        <div class="nonce-display"><span class="lab">current nonce</span><span id="nNonce">0</span></div>
        <div class="hashout" id="nHash" style="margin:16px 0;text-align:center"></div>
        <div class="verdict no" id="nVerdict" style="margin-bottom:16px"></div>
        <div class="target-line">hash must start with <span class="t" id="nTgt">0000</span></div>
        <div class="srow" style="margin:14px 0"><span class="nm">difficulty</span><input type="range" id="nDiff" min="1" max="5" value="4"><span class="v" id="nDiffV">4</span></div>
        <div class="statline"><div class="s"><span class="n" id="nExp">65,536</span><span class="l">expected tries (16ᴺ)</span></div><div class="s"><span class="n" id="nTries">0</span><span class="l">your tries</span></div></div>
        <div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn gold" id="nTry">Spin once</button><button class="btn primary" id="nAuto">Auto-mine</button><button class="btn" id="nReset">Reset</button></div></div></div>`;
      const tgt = () => "0".repeat(diff);
      function render() {
        const h = sha256(DATA + PREV + nonce); s.querySelector("#nNonce").textContent = fmt(nonce); s.querySelector("#nTries").textContent = fmt(tries);
        s.querySelector("#nHash").innerHTML = splitZ(h); const ok = h.startsWith(tgt()); const v = s.querySelector("#nVerdict");
        if (ok) { v.className = "verdict yes"; v.textContent = `Found it — below target after ${fmt(tries)} tries`; } else { v.className = "verdict no"; v.textContent = `starts "${h.slice(0, diff)}" — need "${tgt()}"`; }
        return ok;
      }
      s.querySelector("#nDiff").oninput = (e) => { diff = +e.target.value; s.querySelector("#nDiffV").textContent = diff; s.querySelector("#nTgt").textContent = tgt(); s.querySelector("#nExp").textContent = fmt(Math.pow(16, diff)); render(); };
      s.querySelector("#nTry").onclick = () => { if (mining) return; nonce++; tries++; render(); };
      s.querySelector("#nReset").onclick = () => { mining = false; nonce = 0; tries = 0; s.querySelector("#nAuto").textContent = "Auto-mine"; render(); };
      s.querySelector("#nAuto").onclick = () => {
        if (mining) { mining = false; s.querySelector("#nAuto").textContent = "Auto-mine"; return; }
        mining = true; s.querySelector("#nAuto").textContent = "Stop";
        const step = () => { if (!mining) return; for (let i = 0; i < 1200; i++) { nonce++; tries++; if (sha256(DATA + PREV + nonce).startsWith(tgt())) { render(); mining = false; s.querySelector("#nAuto").textContent = "Auto-mine"; return; } } render(); setTimeout(step, 0); };
        setTimeout(step, 0);
      };
      render();
    }});

  /* ============ F · THE CHAIN ============ */
  M.push({ id: "chain", part: "D/E", title: "The chain", sub: "Why the past locks",
    narr() { return N([
      lead("Now connect the blocks. Each block's header carries the <b>hash of the previous block</b>. That fingerprint is the glue — every block welded to the one before it."),
      p("Edit a transaction in any past block. Its hash changes, so the next block's ‘previous hash’ no longer matches, and the link visibly breaks — in plain view, all the way down the chain. To repair it you'd have to re-mine that block <i>and every block after it</i>."),
      p("That's what immutability really means. It isn't that the past <i>can't</i> be changed — it's that changing it invalidates everything built on top, and fixing it means winning the entire Proof-of-Work race again while the honest network keeps extending the real chain. Unless you control more than half the hashrate, you fall further behind every ten minutes."),
      aside("The two ingredients", "Fingerprints make tampering visible. Work makes fixing it a race you lose. Glue plus cost is the whole security argument."),
      tryit("Edit a past block. Watch the break cascade. Then re-mine from there to feel the cost."),
    ]); },
    stage(s) {
      const GEN = "0".repeat(16), DIFF = 3;
      let blocks = [{ d: "Genesis" }, { d: "Alice → Bob: 5" }, { d: "Carol → Dan: 2" }, { d: "Eve → Finn: 8" }];
      const bh = (d, prev, nonce) => sha256(d + prev + nonce);
      function mine(b, prev) { b.nonce = 0; while (!bh(b.d, prev, b.nonce).startsWith("0".repeat(DIFF))) b.nonce++; }
      let prev = GEN; blocks.forEach(b => { mine(b, prev); b.prev = prev; b.hash = bh(b.d, prev, b.nonce); prev = b.hash; });
      s.innerHTML = `<div class="mstage" style="padding-top:30px"><div style="width:100%"><div class="flabel" style="justify-content:center"><span class="pin"></span>edit a block — break the chain</div><div class="mchain" id="cRow"></div></div></div>`;
      function valid(i) { const b = blocks[i]; const realPrev = i === 0 ? GEN : blocks[i - 1].hash; return b.prev === realPrev && bh(b.d, b.prev, b.nonce).startsWith("0".repeat(DIFF)) && b.hash === bh(b.d, b.prev, b.nonce); }
      function render() {
        const row = s.querySelector("#cRow"); row.innerHTML = "";
        blocks.forEach((b, i) => {
          const ok = valid(i);
          const card = el("div", "mblk" + (ok ? "" : " bad"), `<div class="top">#${i}<span class="st">${ok ? "✓" : "✕"}</span></div>
            <textarea data-i="${i}" rows="2">${b.d.replace(/</g, "&lt;")}</textarea>
            <div class="r"><div class="k">nonce</div><div class="v" style="color:var(--gold)">${fmt(b.nonce)}</div></div>
            <div class="r"><div class="k">prev</div><div class="v">${short(b.prev, 8, 4)}</div></div>
            <div class="r"><div class="k">hash</div><div class="v hash">${short(bh(b.d, b.prev, b.nonce), 8, 4)}</div></div>
            <button class="btn" data-mine="${i}" style="margin-top:9px;font-size:11px;padding:6px 10px">Re-mine from here</button>`);
          row.appendChild(card);
          if (i < blocks.length - 1) row.appendChild(el("div", "mlink" + (ok ? "" : " bad")));
        });
        row.querySelectorAll("textarea[data-i]").forEach(t => t.oninput = () => { const i = +t.dataset.i; blocks[i].d = t.value; blocks[i].hash = bh(blocks[i].d, blocks[i].prev, blocks[i].nonce); render(); const tt = s.querySelector(`textarea[data-i="${i}"]`); if (tt) tt.focus(); });
        row.querySelectorAll("button[data-mine]").forEach(btn => btn.onclick = () => { let i = +btn.dataset.mine, pr = i === 0 ? GEN : blocks[i - 1].hash; for (let j = i; j < blocks.length; j++) { blocks[j].prev = pr; mine(blocks[j], pr); blocks[j].hash = bh(blocks[j].d, pr, blocks[j].nonce); pr = blocks[j].hash; } render(); });
      }
      render();
    }});

  /* ============ D · MERKLE TREE ============ */
  M.push({ id: "merkle", part: "D", title: "Merkle tree", sub: "Prove inclusion cheaply",
    narr() { return N([
      lead("A block can hold thousands of transactions. We want one fingerprint that commits to all of them — and a way to prove a single transaction is inside <b>without sending the whole block</b>. A Merkle tree gives both."),
      p("Build it like a tournament bracket running upward. Hash each transaction into a leaf, pair and hash, pair and hash again, until one hash remains: the <span class=\"k\">Merkle root</span> in the block header. Change any transaction and the avalanche ripples up — the root changes."),
      p("To prove transaction C is inside, you compute C yourself and are handed only the <b>siblings along the path</b> to the root. You re-hash up the path; if your computed root matches the trusted one, C is provably inside. A fake sibling just produces the wrong root, so it fails — safe even from an untrusted source."),
      p("And it's tiny: the tree's height is <code>log₂(n)</code>, so a million transactions need only about 20 sibling hashes, a billion about 30. Doubling the block adds just <b>one</b> hash to the proof. This is what lets a phone verify a payment without downloading the chain."),
      aside("Policy hook", "Immutability proves a record wasn't altered after entry. It says nothing about whether the entry was true. Garbage in, immutable garbage out — the sharp question for any ‘blockchain for transparency’ pitch."),
      tryit("Click any transaction to see the handful of sibling hashes that prove it's in the block."),
    ]); },
    stage(s) {
      const txs = ["Alice→Bob", "Bob→Carol", "Carol→Dan", "Dan→Eve", "Eve→Finn", "Finn→Gail", "Gail→Hank", "Hank→Ivy"];
      let levels = []; let lvl = txs.map(t => ({ hash: sha256(t), label: t })); levels.push(lvl);
      while (lvl.length > 1) { const n = []; for (let i = 0; i < lvl.length; i += 2) { const a = lvl[i], b = lvl[i + 1] || lvl[i]; n.push({ hash: sha256(a.hash + b.hash) }); } levels.push(n); lvl = n; }
      s.innerHTML = `<div class="mstage"><div style="width:100%"><div class="flabel" style="justify-content:center"><span class="pin"></span>click a transaction to prove it</div><div class="mtree2" id="mt"></div><div class="aside" id="mMsg" style="max-width:560px;margin:18px auto 0;text-align:center">Click any leaf at the bottom.</div></div></div>`;
      function proof(leaf) { const path = new Set(), prf = new Set(); let idx = leaf; for (let l = 0; l < levels.length - 1; l++) { path.add(levels[l][idx].hash); const sib = idx % 2 === 0 ? idx + 1 : idx - 1; prf.add((levels[l][sib] || levels[l][idx]).hash); idx = Math.floor(idx / 2); } path.add(levels[levels.length - 1][0].hash); return { path, prf }; }
      function render(sel) {
        const wrap = s.querySelector("#mt"); wrap.innerHTML = ""; const pr = sel >= 0 ? proof(sel) : null;
        for (let l = levels.length - 1; l >= 0; l--) {
          const row = el("div", "mrow");
          levels[l].forEach((node, i) => {
            const isLeaf = l === 0, isRoot = l === levels.length - 1; let c = "mnode" + (isLeaf ? " leaf" : isRoot ? " root" : "");
            if (pr) { if (pr.path.has(node.hash)) c += " path"; else if (pr.prf.has(node.hash)) c += " proof"; }
            const n = el("div", c, (isLeaf ? node.label + "<br>" : isRoot ? "ROOT<br>" : "") + short(node.hash, 5, 3));
            if (isLeaf) n.onclick = () => { render(i); const sz = proof(i).prf.size; s.querySelector("#mMsg").innerHTML = `<div class="h">proof</div>To prove <b style="color:var(--cyan)">${txs[i]}</b> is in this block of ${txs.length}, you supply only <b style="color:var(--gold)">${sz} sibling hashes</b> (gold) and re-hash up the violet path to the root. That's O(log n).`; };
            row.appendChild(n);
          });
          wrap.appendChild(row);
        }
      }
      render(-1);
    }});

  /* ============ F · CONSENSUS & FORKS ============ */
  M.push({ id: "forks", part: "F", title: "Consensus & forks", sub: "How nodes agree",
    narr() { return N([
      lead("No vote, no authority — one rule every node follows alone: the valid chain is the one with the <b>most cumulative work</b> behind it. People say ‘longest chain’; precisely it's most-work, not most-blocks."),
      p("Because blocks propagate at internet speed, two miners can find a valid block at nearly the same moment. The network splits — a <span class=\"k\">fork</span>. It resolves on the next block: whichever branch gets extended first now has more work and wins. The losing block becomes an <b>orphan</b> and its transactions return to the pool."),
      p("So a recent block is never fully final — a deeper competing branch could in theory replace it (a <span class=\"k\">reorg</span>). What you get is <b>probabilistic finality</b>: every block stacked on top makes reversal exponentially harder. ‘Wait for six confirmations’ — about an hour — is this principle with a number on it. There's no moment of certainty, only certainty that grows."),
      tryit("Trigger a fork, then choose which branch the next block extends. Watch the other get orphaned."),
    ]); },
    stage(s) {
      let state = "base";
      s.innerHTML = `<div class="mstage"><div style="width:100%;max-width:640px"><div class="flabel" style="justify-content:center"><span class="pin"></span>longest-chain rule</div><div id="fkStage" style="display:flex;justify-content:center;padding:20px 0"></div><div class="btn-row" id="fkCtl" style="justify-content:center"></div><div class="log" id="fkLog" style="margin-top:16px"><div class="info">network view</div></div></div></div>`;
      const blk = (l, c) => `<div class="mblk" style="flex:0 0 auto;min-width:80px;text-align:center;${c === 'g' ? 'border-color:var(--green)' : c === 'p' ? 'border-color:var(--violet)' : c === 'o' ? 'border-color:var(--red);opacity:.4' : ''}"><div class="top" style="justify-content:center">${l}</div></div>`;
      const log = (h, c) => s.querySelector("#fkLog").appendChild(el("div", c, h));
      function render() {
        const st = s.querySelector("#fkStage");
        if (state === "base") st.innerHTML = `<div style="display:flex;align-items:center">${blk("#2", "g")}<div class="mlink"></div>${blk("#3", "g")}<div class="mlink"></div>${blk("#4", "g")}</div>`;
        else if (state === "fork") st.innerHTML = `<div style="display:flex;align-items:center">${blk("#3", "g")}<div class="mlink"></div><div style="display:flex;flex-direction:column;gap:12px">${blk("#4a", "g")}${blk("#4b", "p")}</div></div>`;
        else st.innerHTML = `<div style="display:flex;align-items:center">${blk("#3", "g")}<div class="mlink"></div><div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;align-items:center">${blk("#4a", "g")}<div class="mlink"></div>${blk("#5", "g")}</div>${blk("#4b", "o")}</div></div>`;
        ctl();
      }
      function ctl() { const c = s.querySelector("#fkCtl"); c.innerHTML = "";
        if (state === "base") { const b = el("button", "btn primary", "Two miners find #4 at once"); b.onclick = () => { state = "fork"; log("Pool A mines #4a; Pool B mines #4b — same height, same instant", ""); log("network split: both valid, briefly undecided", "warn"); render(); }; c.appendChild(b); }
        else if (state === "fork") { const a = el("button", "btn", "Extend #4a"); a.onclick = res; const b = el("button", "btn", "Extend #4b"); b.onclick = res; c.append(a, b); }
        else { const b = el("button", "btn", "Replay"); b.onclick = () => { state = "base"; s.querySelector("#fkLog").innerHTML = '<div class="info">network view</div>'; render(); }; c.appendChild(b); }
      }
      function res() { state = "done"; log("next block extends one branch → it now has more work → it wins", "info"); log("the losing block is orphaned; its transactions return to the pool", "bad"); log("consensus restored — the fork lasted one block", "ok"); render(); }
      render();
    }});

  /* ============ G · 51% ATTACK ============ */
  M.push({ id: "attack", part: "G", title: "The 51% attack", sub: "The security boundary",
    narr() { return N([
      lead("Control a majority of hashrate and you can out-race the honest chain. What you <b>can</b> do: double-spend by privately building a longer chain, then releasing it; and censor transactions. What you <b>cannot</b> do: steal coins you have no key for, forge signatures, or change the rules. Cryptography still holds — only ordering is up for grabs."),
      p("An attacker behind by <i>k</i> blocks is a gambler clawing back a deficit. Below 50% hashrate, the probability of ever catching up falls <b>exponentially</b> in <i>k</i> — each confirmation multiplies the luck they'd need. That's the maths under ‘wait for six confirmations’, from §11 of Satoshi's whitepaper, computed live here. At 50% or more, catch-up becomes certain. That's why 50% is a cliff edge, not a slope."),
      p("The subtler threats matter for policy. <b>Selfish mining</b> can pay off above roughly a third of hashrate. And <b>pools</b> — miners combining hashrate to smooth income — can quietly drift toward majority. Security is economic, not absolute: attacks are deterred by costing more than they're worth."),
      aside("Say this", "‘Decentralisation’ stops being ideology here and becomes a security parameter. A state-scale actor, or one dominant pool, is a real threat model — and smaller chains get 51%-attacked routinely."),
      tryit("Set your hashrate and the confirmations waited, read the odds, then run a stochastic attack."),
    ]); },
    stage(s) {
      let q = 30, z = 6, run = false;
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>attack console · whitepaper §11</div>
        <div class="srow"><span class="nm">your hashrate</span><input type="range" id="aQ" min="5" max="90" value="30"><span class="v" id="aQv">30%</span></div>
        <div class="srow" style="margin-top:10px"><span class="nm">confirmations</span><input type="range" id="aZ" min="0" max="12" value="6"><span class="v" id="aZv">6</span></div>
        <div style="text-align:center;margin:18px 0"><div class="note" style="font-size:12px">probability the attack eventually succeeds</div><div class="mono" id="aP" style="font-size:46px;font-weight:800"></div></div>
        <div id="aRace"></div>
        <div class="btn-row" style="margin-top:14px;justify-content:center"><button class="btn danger" id="aRun">Run the attack</button></div>
        <div class="note" id="aMsg" style="text-align:center;margin-top:10px"></div></div></div>`;
      function prob(qf, zz) { const pp = 1 - qf; if (qf >= pp) return 1; const lam = zz * (qf / pp); let s2 = 0, po = Math.exp(-lam); for (let k = 0; k <= zz; k++) { if (k > 0) po *= lam / k; s2 += po * (1 - Math.pow(qf / pp, zz - k)); } return 1 - s2; }
      function upd() { s.querySelector("#aQv").textContent = q + "%"; s.querySelector("#aZv").textContent = z; const P = prob(q / 100, z); const e = s.querySelector("#aP"); e.textContent = P >= .5 ? Math.round(P * 100) + "%" : P < 1e-4 ? "<0.01%" : (P * 100).toPrecision(2) + "%"; e.style.color = P > .01 ? "var(--red)" : "var(--green)"; }
      s.querySelector("#aRace").innerHTML = `<div class="srow" style="gap:8px"><span class="nm" style="width:60px;color:var(--green)">honest</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="aH" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:24px;color:var(--green)" id="aHn">0</span></div><div class="srow" style="gap:8px;margin-top:6px"><span class="nm" style="width:60px;color:var(--red)">you</span><div style="flex:1;height:16px;background:rgba(255,255,255,.08);border-radius:7px;overflow:hidden"><i id="aE" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:24px;color:var(--red)" id="aEn">0</span></div>`;
      s.querySelector("#aQ").oninput = e => { q = +e.target.value; upd(); }; s.querySelector("#aZ").oninput = e => { z = +e.target.value; upd(); }; upd();
      s.querySelector("#aRun").onclick = () => { if (run) return; run = true; const qf = q / 100; let h = z, ev = 0, t = 0; const hf = s.querySelector("#aH"), ef = s.querySelector("#aE");
        const step = () => { t++; Math.random() < qf ? ev++ : h++; const sc = Math.max(h, ev, z + 3); hf.style.width = h / sc * 100 + "%"; ef.style.width = ev / sc * 100 + "%"; s.querySelector("#aHn").textContent = h; s.querySelector("#aEn").textContent = ev;
          if (ev > h) { s.querySelector("#aMsg").innerHTML = `<span style="color:var(--red)">Your chain overtook the honest one. Payment reversed.</span>`; run = false; return; }
          if (t > 220 || (qf < .5 && h - ev > 22)) { s.querySelector("#aMsg").innerHTML = `<span style="color:var(--green)">The honest chain pulled away. Attack failed.</span> Re-run — the odds above are the long-run truth.`; run = false; return; }
          setTimeout(step, 42); }; step(); };
    }});

  /* ============ H · PROOF OF STAKE ============ */
  M.push({ id: "pos", part: "H", title: "Proof of Stake", sub: "Capital, not electricity",
    narr() { return N([
      lead("Proof of Work makes lying cost <b>electricity</b>. Proof of Stake makes it cost <b>capital</b>. Validators lock up coins as a bond to win the right to propose blocks; influence is proportional to stake at risk, not hashrate."),
      p("It's the same Sybil defence — faking a thousand validators means risking a thousand times the money. The protocol pseudo-randomly picks a proposer weighted by stake. <span class=\"k\">Slashing</span> enforces honesty: a validator who double-signs or attacks has their staked capital destroyed. Many PoS chains add explicit finality — once finalised, reverting would burn a huge fraction of all stake."),
      p("The tradeoffs are a genuine, open debate. Energy: PoS uses a tiny fraction — Ethereum's 2022 switch cut its use ~99.9%. PoW's argument: cost is external and physical, you can't fake electricity. PoS's argument: an attacker's own stake gets slashed, so the attack destroys their capital. The worry for both: wealth and pools concentrate control."),
      tryit("Run blocks weighted by stake, then make a validator cheat and watch its bond get slashed."),
    ]); },
    stage(s) {
      let vals = [{ n: "A", stake: 32, c: "#3fe0cf", w: 0, x: false }, { n: "B", stake: 96, c: "#8b7cff", w: 0, x: false }, { n: "C", stake: 64, c: "#f5b13d", w: 0, x: false }, { n: "D", stake: 32, c: "#46d98a", w: 0, x: false }];
      let blocks = 0;
      s.innerHTML = `<div class="mhold fadein"><div class="fcard"><div class="flabel"><span class="pin"></span>validators · stake-weighted</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px" id="pG"></div>
        <div class="btn-row" style="margin-top:16px;justify-content:center"><button class="btn primary" id="pRun">Propose 50 blocks</button><button class="btn danger" id="pCheat">Make B double-sign</button><button class="btn" id="pReset">Reset</button></div>
        <div class="log" id="pLog" style="margin-top:14px"><div class="info">beacon chain</div></div></div></div>`;
      const log = (h, c) => s.querySelector("#pLog").appendChild(el("div", c, h));
      const active = () => vals.filter(v => !v.x); const tot = () => active().reduce((a, b) => a + b.stake, 0);
      function grid() { const g = s.querySelector("#pG"); g.innerHTML = ""; vals.forEach(v => { const pct = v.x ? 0 : Math.round(v.stake / tot() * 100); g.appendChild(el("div", "pos-card" + (v.x ? " slashed" : ""), `<b>Val ${v.n}</b><div class="stk">${v.stake}Ξ</div><div class="note" style="font-size:11px">${v.x ? "SLASHED" : pct + "% odds"}</div><div class="note" style="font-size:11px;color:${v.c}">won ${v.w}</div>`)); }); }
      function pick() { const a = active(); let r = Math.random() * tot(); for (const v of a) { if (r < v.stake) return v; r -= v.stake; } return a[a.length - 1]; }
      s.querySelector("#pRun").onclick = () => { for (let i = 0; i < 50; i++) { pick().w++; blocks++; } grid(); log("ran 50 blocks — reward share tracks stake share", "info"); };
      s.querySelector("#pCheat").onclick = () => { const b = vals[1]; if (b.x) return; log("Val B signs two conflicting blocks at one height", "warn"); const lost = b.stake; b.x = true; b.stake = 0; grid(); log(`Val B slashed — ${lost}Ξ destroyed and ejected. Cheating cost more than it could gain.`, "bad"); };
      s.querySelector("#pReset").onclick = () => { vals.forEach(v => { v.w = 0; v.x = false; }); vals[1].stake = 96; blocks = 0; s.querySelector("#pLog").innerHTML = '<div class="info">beacon chain</div>'; grid(); };
      grid();
    }});

  window.MODULES = M;
  return M;
})();
