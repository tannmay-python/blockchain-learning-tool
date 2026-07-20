/* ============================================================
   lessons-coin.js: the capstone sandbox, "Build your own coin".

   The old capstone was three disconnected toys. This is one live
   chain that all four beats share:

     01  write the monetary policy, then mine genesis
     02  open it to other people: sign, broadcast, forge, fail
     03  mine real blocks and open any of them up
     04  let someone rewrite it, for real

   Everything is real SHA-256 over a real header. Balances are
   always replayed from the chain and never stored anywhere, which
   is what makes beat 04 land: when the attacker's fork wins, the
   payment does not get "undone", it simply stops having happened.

   Loads before lessons-v2.js's renumber pass, so the beat numbers
   below are cosmetic. They get rewritten from the array order.
   ============================================================ */
import { LESSONS as L } from './lessons.js';
import { sha256 } from './sha256.js';

(function () {
  "use strict";
  if (!L) return;

  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : (s || "");
  const fmt = (n) => Math.round(n).toLocaleString();
  const P = (t) => `<p>${t}</p>`;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  /* leading zeros of a hash, coloured, so "it starts with 000" is visible */
  const zeros = (h) => { let z = 0; while (h[z] === "0") z++; return `<span class="go">${h.slice(0, z)}</span>${h.slice(z)}`; };

  /* ============================================================
     the three people who live on your chain
     ============================================================ */
  const NAMES = { you: "You", ava: "Ava", ben: "Ben" };
  const ICON = { you: "◈", ava: "▲", ben: "■" };
  const KEY = { you: sha256("privkey:you"), ava: sha256("privkey:ava"), ben: sha256("privkey:ben") };
  const ADDR = {}; Object.keys(KEY).forEach(k => { ADDR[k] = "0x" + sha256(KEY[k]).slice(-10); });

  /* the exact bytes a signature commits to. change any field and the
     signature stops matching, which is the whole point of beat 02 */
  const txMsg = (t) => `${t.from}>${t.to}:${t.amt}:${t.fee}:${t.n}`;
  const sign = (who, t) => sha256(KEY[who] + txMsg(t));
  const verify = (t) => !!t.sig && t.sig === sha256(KEY[t.from] + txMsg(t));
  const txid = (t) => t.cb ? sha256("coinbase:" + t.to + ":" + t.amt + ":" + t.h) : sha256(txMsg(t) + ":" + t.sig);

  /* a real merkle root over the block's transactions, so editing any
     amount in beat 03 propagates into the header and breaks the seal */
  function merkle(txs) {
    if (!txs.length) return "0".repeat(64);
    let lv = txs.map(txid);
    while (lv.length > 1) {
      const nx = [];
      for (let i = 0; i < lv.length; i += 2) nx.push(sha256(lv[i] + (lv[i + 1] || lv[i])));
      lv = nx;
    }
    return lv[0];
  }

  const GEN = "0".repeat(64);
  const header = (b) => `${b.i}|${b.prev}|${merkle(b.txs)}|${b.time}`;
  const hashOf = (b) => sha256(header(b) + b.nonce);

  /* ============================================================
     the coin itself: one module-level singleton, persisted
     ============================================================ */
  const LSK = "blockcourse_coin_v1";

  const fresh = () => ({ name: "MyCoin", ticker: "MYC", reward: 50, halve: 5, diff: 3, chain: [], pool: [], sel: null, spent: 0 });

  let C = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(LSK) || "null");
    if (raw && Array.isArray(raw.chain) && Array.isArray(raw.pool)) C = Object.assign(fresh(), raw);
  } catch (e) {}
  /* note: a tampered chain is loaded back exactly as it was left. validity
     is derived at render time, never stored, so broken blocks stay broken */
  const save = () => { _bad = null; try { localStorage.setItem(LSK, JSON.stringify(C)); } catch (e) {} };

  /* ---- monetary policy -------------------------------------- */
  const rewardAt = (h) => { let r = C.reward, e = Math.floor(h / C.halve); while (e-- > 0 && r > 0) r = Math.floor(r / 2); return r; };
  const capOf = () => { let s = 0, r = C.reward, e = 0; while (r > 0 && e < 64) { s += r * C.halve; r = Math.floor(r / 2); e++; } return s; };
  const capHeight = () => { let r = C.reward, e = 0; while (r > 0 && e < 64) { r = Math.floor(r / 2); e++; } return e * C.halve; };

  /* ---- derived chain state ---------------------------------- */
  const Z = () => "0".repeat(C.diff);
  const prevOf = (i) => i === 0 ? GEN : hashOf(C.chain[i - 1]);
  /* the first block that fails on its own terms: either its hash no longer
     meets the target, or the prev field it committed to no longer matches
     what the block before it actually hashes to */
  /* every render asks this once per block, and each answer costs hashes, so it
     is memoised and thrown away whenever the chain is written to */
  let _bad = null;
  function brokenFrom() {
    if (_bad !== null) return _bad;
    _bad = -1;
    for (let i = 0; i < C.chain.length; i++) {
      const b = C.chain[i];
      if (b.prev !== prevOf(i) || !hashOf(b).startsWith(Z())) { _bad = i; break; }
    }
    return _bad;
  }
  /* validity is inherited. a block sitting on a broken ancestor is not part of
     a valid chain however well-formed it is in isolation, which is exactly why
     tampering with old history means re-mining everything that came after it */
  const sealed = (i) => { const bad = brokenFrom(); return bad < 0 || i < bad; };

  function balances(chain) {
    const b = { you: 0, ava: 0, ben: 0 };
    (chain || C.chain).forEach(blk => blk.txs.forEach(t => {
      if (t.cb) { b[t.to] = (b[t.to] || 0) + t.amt; return; }
      b[t.from] -= t.amt + t.fee; b[t.to] += t.amt;
    }));
    return b;
  }
  const supply = () => C.chain.reduce((a, blk) => a + blk.txs.reduce((x, t) => x + (t.cb ? t.amt : 0), 0), 0);
  /* per-sender counter, so two identical payments are still distinct
     transactions with distinct signatures (the replay problem, again) */
  const nonceOf = (who) => {
    let n = 0;
    C.chain.forEach(b => b.txs.forEach(t => { if (!t.cb && t.from === who) n++; }));
    C.pool.forEach(t => { if (t.from === who) n++; });
    return n;
  };

  /* ---- the redraw bus --------------------------------------- */
  /* every beat renders the same state, so they all subscribe. subscribers
     whose node has left the document are dropped on the next emit */
  const subs = [];
  const sub = (node, fn) => { subs.push({ node, fn }); fn(); };
  const emit = () => {
    for (let i = subs.length - 1; i >= 0; i--) {
      if (!document.contains(subs[i].node)) subs.splice(i, 1);
      else try { subs[i].fn(); } catch (e) {}
    }
  };
  const commit = () => { save(); emit(); };

  /* ---- mining ------------------------------------------------ */
  /* time-sliced so the page keeps breathing at difficulty 4.
     the header is fixed while the nonce spins, so it is built once and only
     re-hashed. this is exactly why real miners hash an 80-byte header and
     not the block: the merkle root is settled before the search starts.

     yielding goes through a MessageChannel rather than setTimeout, which a
     background tab throttles hard enough to stall a search mid-block, or
     requestAnimationFrame, which stops firing in a background tab entirely.
     switch tabs while mining and the block still lands. */
  function mine(b, onTick, onDone) {
    b.nonce = 0;
    const target = Z(), hdr = header(b);
    const ch = typeof MessageChannel === "function" ? new MessageChannel() : null;
    const step = () => {
      const t0 = performance.now();
      while (performance.now() - t0 < 18) {
        if (sha256(hdr + b.nonce).startsWith(target)) {
          b.guesses = b.nonce + 1;
          if (ch) ch.port1.close();
          onDone(b); return;
        }
        b.nonce++;
      }
      if (onTick) onTick(b.nonce);
      if (ch) ch.port2.postMessage(0); else setTimeout(step, 0);
    };
    if (ch) ch.port1.onmessage = step;
    step();
  }
  /* synchronous: only used for the attacker's blocks, which need to resolve
     inside one step of the race loop */
  function mineSync(b) { b.nonce = 0; const t = Z(), hdr = header(b); while (!sha256(hdr + b.nonce).startsWith(t)) b.nonce++; b.guesses = b.nonce + 1; return b; }

  /* build the next block: highest-fee transactions first, skipping any
     the sender can no longer afford by the time it is their turn */
  function assemble(height, prev, pool) {
    const bal = balances();
    const picked = [];
    pool.slice().sort((a, b) => b.fee - a.fee).forEach(t => {
      if (picked.length >= 3) return;
      if (!verify(t)) return;
      if (bal[t.from] < t.amt + t.fee) return;
      bal[t.from] -= t.amt + t.fee; bal[t.to] += t.amt;
      picked.push(t);
    });
    const fees = picked.reduce((a, t) => a + t.fee, 0);
    const cb = { cb: true, to: "you", amt: rewardAt(height) + fees, h: height };
    return { i: height, prev, time: 1700000000 + height * 600, txs: [cb].concat(picked), nonce: 0, guesses: 0 };
  }

  /* ============================================================
     shared bits of UI
     ============================================================ */
  const card = (host, label, inner) => {
    const w = el("div", "fcard cxc");
    w.innerHTML = `<div class="flabel"><span class="pin"></span>${label}</div>${inner}`;
    host.appendChild(w);
    return w;
  };
  const gate = (host, msg) => { const n = el("div", "note"); n.style.textAlign = "center"; n.innerHTML = msg; host.appendChild(n); };

  const txLine = (t, i, editable) => t.cb
    ? `<div class="cxt cb"><span class="cxt-k">coinbase</span><span class="cxt-b">newly minted → ${NAMES[t.to]}</span><span class="cxt-a">+${t.amt}</span></div>`
    : `<div class="cxt${verify(t) ? "" : " bad"}">
         <span class="cxt-k">tx ${short(txid(t), 5, 3)}</span>
         <span class="cxt-b">${NAMES[t.from]} → ${NAMES[t.to]}</span>
         <span class="cxt-a">${editable ? `<input class="cxin mono" data-t="${i}" value="${t.amt}" inputmode="numeric">` : t.amt}</span>
         <span class="cxt-f">fee ${t.fee}</span>
         <span class="cxt-s mono">sig ${short(t.sig, 6, 4)} ${verify(t) ? "✓" : "✕ does not match"}</span>
       </div>`;

  /* ============================================================
     BEAT 01. the constitution
     ============================================================ */
  const beatRules = {
    n: "01", h: "Write its rules, then mine block zero",
    cap: "Every chain begins with a <b>genesis block</b>, and with a decision nobody can take back afterwards: how much money will ever exist. Set the reward, set how often it halves, and watch the supply curve you are writing. Then mine block zero for real. Those rules are sealed into it.",
    build(s) {
      const w = card(s, "your coin's constitution", `
        <div class="cxgrid">
          <label class="cxf"><span>name</span><input class="in" id="cN" maxlength="14" value=""></label>
          <label class="cxf"><span>ticker</span><input class="in mono" id="cT" maxlength="5" value="" style="text-transform:uppercase"></label>
        </div>
        <div class="srow"><span class="nm">block reward</span><input type="range" id="cR" min="5" max="100" step="5"><span class="v" id="cRv"></span></div>
        <div class="srow"><span class="nm">halves every</span><input type="range" id="cH" min="2" max="10" step="1"><span class="v" id="cHv"></span></div>
        <div class="srow"><span class="nm">difficulty</span><span class="btn-row" id="cD" style="flex:1;gap:6px"></span><span class="v" id="cDv"></span></div>
        <div class="cxsupply"><svg id="cSv" viewBox="0 0 320 92" preserveAspectRatio="none"></svg></div>
        <div class="statline" style="margin:6px 0 14px"><div class="s"><span class="n" id="cCap">0</span><span class="l">coins that will ever exist</span></div><div class="s"><span class="n" id="cLast">0</span><span class="l">blocks until the last one</span></div><div class="s"><span class="n" id="cWork">0</span><span class="l">expected guesses per block</span></div></div>
        <div class="btn-row" style="justify-content:center"><button class="btn gold" id="cGo">Mine the genesis block</button><button class="btn danger" id="cRst">Start a new coin</button></div>
        <div class="sig-state" id="cM" style="margin-top:12px"></div>`);

      const $ = (id) => w.querySelector("#" + id);
      const setMsg = (t, cls) => { const m = $("cM"); m.innerHTML = t; m.className = "sig-state" + (cls ? " " + cls : ""); };

      $("cD").innerHTML = [2, 3, 4].map(d => `<button class="btn" data-d="${d}">${"0".repeat(d)}…</button>`).join("");

      /* the supply curve: cumulative issuance against block height */
      function curve() {
        const H = Math.max(capHeight(), 1), cap = capOf();
        const pts = []; let acc = 0;
        for (let h = 0; h <= H; h++) {
          acc += rewardAt(h);
          pts.push(`${(h / H * 316 + 2).toFixed(1)},${(88 - acc / cap * 82).toFixed(1)}`);
        }
        $("cSv").innerHTML =
          `<polyline points="2,88 ${pts.join(" ")} 318,88" fill="var(--gold-soft)" stroke="none" opacity=".55"></polyline>
           <polyline points="${pts.join(" ")}" fill="none" stroke="var(--gold-2)" stroke-width="2" vector-effect="non-scaling-stroke"></polyline>
           <line x1="2" y1="6" x2="318" y2="6" stroke="var(--line-2)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"></line>`;
      }

      function render() {
        const launched = C.chain.length > 0;
        $("cN").value = C.name; $("cT").value = C.ticker;
        $("cR").value = C.reward; $("cH").value = C.halve;
        $("cRv").textContent = C.reward; $("cHv").textContent = C.halve + " blocks";
        $("cDv").textContent = "1 in " + fmt(Math.pow(16, C.diff));
        $("cCap").textContent = fmt(capOf()); $("cLast").textContent = fmt(capHeight());
        $("cWork").textContent = fmt(Math.pow(16, C.diff));
        w.querySelectorAll("#cD button").forEach(b => b.classList.toggle("primary", +b.dataset.d === C.diff));
        /* the rules are hashed into genesis. after that they are not yours to move */
        ["cN", "cT", "cR", "cH"].forEach(id => { $(id).disabled = launched; });
        w.querySelectorAll("#cD button").forEach(b => { b.disabled = launched; });
        w.classList.toggle("locked", launched);
        $("cGo").style.display = launched ? "none" : "";
        curve();
        if (launched && !$("cM").dataset.live) {
          $("cM").dataset.live = "1";
          setMsg(`<b>${esc(C.name)}</b> is live. Genesis hashes to <span class="mono">${zeros(short(hashOf(C.chain[0]), 10, 6))}</span>, and the rules above are now part of that hash. Changing one would change the hash, break every block after it, and produce a different coin. That is what "hard fork" means.`, "ok");
        } else if (!launched) {
          setMsg(`Nothing exists yet. The name and the reward schedule go into block zero's data, and get hashed into everything that follows.`);
        }
      }

      const edit = (fn) => { if (C.chain.length) return; fn(); commit(); };
      $("cN").oninput = e => edit(() => { C.name = e.target.value.slice(0, 14) || "MyCoin"; });
      $("cT").oninput = e => edit(() => { C.ticker = e.target.value.toUpperCase().slice(0, 5) || "MYC"; });
      $("cR").oninput = e => edit(() => { C.reward = +e.target.value; });
      $("cH").oninput = e => edit(() => { C.halve = +e.target.value; });
      w.querySelectorAll("#cD button").forEach(b => { b.onclick = () => edit(() => { C.diff = +b.dataset.d; }); });

      $("cGo").onclick = () => {
        if (C.chain.length) return;
        const btn = $("cGo"); btn.disabled = true;
        const b = assemble(0, GEN, []);
        setMsg("spinning the nonce…");
        mine(b, n => setMsg(`spinning the nonce… ${fmt(n)} guesses, none of them starting with ${Z()}`), (done) => {
          C.chain.push(done); C.spent += done.guesses; btn.disabled = false;
          commit();
        });
      };
      $("cRst").onclick = () => {
        const keep = { name: C.name, ticker: C.ticker, reward: C.reward, halve: C.halve, diff: C.diff };
        C = Object.assign(fresh(), keep);
        delete $("cM").dataset.live;
        commit();
      };

      sub(w, render);
    }
  };

  /* ============================================================
     BEAT 02. wallets, signatures, mempool
     ============================================================ */
  const beatPay = {
    n: "02", h: "Open it to other people",
    cap: "A coin only you can hold is a diary. Two strangers turn up with keys of their own. Pay one of them and your transaction sits in the <b>mempool</b> until a block picks it up. Then let the other one try to sign a payment out of a wallet that isn't his.",
    build(s) {
      const w = card(s, "wallets on your chain", `
        <div class="cxw" id="pW"></div>
        <div class="cxpay">
          <span class="note">pay</span>
          <select class="in" id="pTo"><option value="ava">Ava</option><option value="ben">Ben</option></select>
          <input class="in mono" id="pAmt" value="5" style="width:64px" inputmode="numeric">
          <span class="note">fee</span>
          <input type="range" id="pFee" min="0" max="5" step="1" value="1" style="width:100px">
          <span class="v mono" id="pFeeV">1</span>
          <button class="btn gold" id="pGo">Sign &amp; broadcast</button>
        </div>
        <div class="btn-row" style="justify-content:center;margin-top:4px"><button class="btn danger" id="pForge">Ben signs “Ava → Ben, 20” with his own key</button></div>
        <div class="cxpool" id="pPool"></div>
        <div class="log" id="pL" style="margin-top:12px"><div class="info">your node's transaction log</div></div>`);

      const $ = (id) => w.querySelector("#" + id);
      const log = (h, c) => { const l = $("pL"); l.appendChild(el("div", c, h)); l.scrollTop = l.scrollHeight; };

      function render() {
        const bal = balances();
        $("pW").innerHTML = Object.keys(NAMES).map(k =>
          `<div class="cxwc${k === "you" ? " me" : ""}"><span class="cxwi">${ICON[k]}</span><span class="cxwn">${NAMES[k]}</span><span class="cxwa mono">${ADDR[k]}</span><span class="cxwb${bal[k] < 0 ? " neg" : ""}">${bal[k]} <i>${esc(C.ticker)}</i></span></div>`).join("");
        $("pPool").innerHTML = C.pool.length
          ? `<div class="cxpl">mempool · ${C.pool.length} waiting for a block</div>` + C.pool.map((t, i) => txLine(t, i, false)).join("")
          : `<div class="cxpl">mempool · empty</div>`;
        $("pFeeV").textContent = $("pFee").value;
        const live = C.chain.length > 0;
        $("pGo").disabled = !live; $("pForge").disabled = !live;
      }

      $("pFee").oninput = render;

      $("pGo").onclick = () => {
        const bal = balances(), to = $("pTo").value;
        const amt = Math.max(1, Math.min(999, parseInt($("pAmt").value, 10) || 0));
        const fee = +$("pFee").value;
        if (bal.you < amt + fee) {
          log(`rejected: you hold ${bal.you}, and this spends ${amt + fee}. Your own node checked before anyone else saw it.`, "bad");
          return;
        }
        const t = { from: "you", to, amt, fee, n: nonceOf("you") };
        t.sig = sign("you", t);
        C.pool.push(t);
        log(`signed “You → ${NAMES[to]}, ${amt}” · sig ${short(t.sig, 8, 4)}`);
        log(`verified against your public key → VALID. Broadcast, and waiting in the mempool.`, "ok");
        commit();
      };

      $("pForge").onclick = () => {
        /* Ben builds a well-formed transaction moving Ava's money and signs it
           with the only key he has. Everything about it is correct except that */
        const t = { from: "ava", to: "ben", amt: 20, fee: 1, n: nonceOf("ava") };
        t.sig = sign("ben", t);
        log(`incoming: “Ava → Ben, 20” · sig ${short(t.sig, 8, 4)}`, "warn");
        log(`expected sha256(Ava's key + message) = ${short(sign("ava", t), 8, 4)}`, "warn");
        log(`got ${short(t.sig, 8, 4)} → REJECTED, never enters the mempool. Your chain just defended a woman it has never met, without asking you, because the only thing that moves coins here is the key.`, "bad");
      };

      if (!C.chain.length) gate(w, "Your chain has no blocks and no money yet. Mine genesis in the step above, and these wallets come alive.");
      sub(w, render);
    }
  };

  /* ============================================================
     BEAT 03. the explorer. mine, open, tamper, pay for it
     ============================================================ */
  const beatMine = {
    n: "03", h: "Mine it, then open it up",
    cap: "This is your chain, block by block. Mine a few. Then <b>click any block</b> and read what you actually built: the header it hashed, the merkle root over its transactions, the nonce that took thousands of guesses to find. Every field is live. Edit an amount inside an old block and watch what your own machine does about it.",
    build(s) {
      const w = card(s, "block explorer", `
        <div class="statline" style="margin-bottom:14px"><div class="s"><span class="n" id="xHt">0</span><span class="l">blocks</span></div><div class="s"><span class="n" id="xSup">0</span><span class="l">in circulation</span></div><div class="s"><span class="n" id="xRw">0</span><span class="l">reward right now</span></div><div class="s"><span class="n" id="xBal" style="color:var(--green)">0</span><span class="l">your balance</span></div></div>
        <div class="xchain" id="xC"></div>
        <div class="btn-row" style="justify-content:center"><button class="btn gold" id="xGo">Mine the next block</button><button class="btn" id="xGo5">Mine 5</button></div>
        <div class="sig-state" id="xM" style="margin-top:12px"></div>
        <div class="cxdrawer" id="xD"></div>`);

      const $ = (id) => w.querySelector("#" + id);
      const setMsg = (t, cls) => { const m = $("xM"); m.innerHTML = t; m.className = "sig-state" + (cls ? " " + cls : ""); };
      let busy = false, queue = 0;

      function drawChain() {
        const c = $("xC"); c.innerHTML = "";
        C.chain.forEach((b, i) => {
          const ok = sealed(i), h = hashOf(b);
          const node = el("div", "xblock" + (ok ? "" : " bad") + (C.sel === i ? " sel" : ""));
          node.dataset.i = i; node.tabIndex = 0; node.setAttribute("role", "button");
          node.innerHTML = `<div class="xtop"></div><div class="xpad">
            <div class="xh"><span class="xn">#${i}</span><span class="xs">${ok ? "sealed" : "broken"}</span></div>
            <div class="xseg xprev"><div class="xlbl">prev block ↩</div><div class="xv">${i === 0 ? "nothing. this is the start" : short(b.prev, 9, 5)}</div></div>
            <div class="xseg"><div class="xlbl">${b.txs.length} transaction${b.txs.length > 1 ? "s" : ""}</div><div class="xtxs">${b.txs.map(t => `<div class="xtx">${t.cb ? `⊕ mint ${t.amt} → You` : `${NAMES[t.from]} → ${NAMES[t.to]} · ${t.amt}`}</div>`).join("")}</div></div>
            <div class="xseg xnonce"><span class="xlbl" style="margin:0">nonce</span><span class="v">${fmt(b.nonce)}</span></div>
            <div class="xseal"><span class="lk" aria-hidden="true">${ok ? "🔒" : "⚠️"}</span><span class="sv">${short(h, 9, 5)}</span></div>
            <div class="cxopen">${C.sel === i ? "▾ open" : "click to open"}</div></div>`;
          node.onclick = () => { C.sel = C.sel === i ? null : i; commit(); };
          node.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); node.click(); } };
          c.appendChild(node);
          if (i < C.chain.length - 1) {
            const conn = el("div", "xconn" + (sealed(i + 1) ? "" : " bad"));
            conn.innerHTML = `<div class="hashtag">${short(h, 5, 3)}</div><div class="ln"></div>`;
            c.appendChild(conn);
          }
        });
      }

      function drawDrawer() {
        const d = $("xD");
        if (C.sel == null || !C.chain[C.sel]) { d.innerHTML = ""; d.classList.remove("on"); return; }
        d.classList.add("on");
        const i = C.sel, b = C.chain[i], ok = sealed(i), h = hashOf(b);
        const fees = b.txs.reduce((a, t) => a + (t.cb ? 0 : t.fee), 0);
        d.innerHTML = `
          <div class="cxdh"><span class="cxdn">Block #${i}</span><span class="cxds ${ok ? "ok" : "bad"}">${ok ? "sealed" : "broken"}</span><button class="btn" id="xClose" style="margin-left:auto;padding:6px 12px;font-size:12px">close ✕</button></div>
          <div class="cxdl">the header. these four fields, plus the nonce, are the only things that get hashed</div>
          <div class="bfields">
            <div class="bfield"><div class="k">height</div><div class="v">${b.i}</div></div>
            <div class="bfield"><div class="k">previous block's hash</div><div class="v">${i === 0 ? "0000…0000 · genesis points at nothing" : esc(b.prev)}</div></div>
            <div class="bfield full"><div class="k">merkle root over the ${b.txs.length} transaction${b.txs.length > 1 ? "s" : ""} below</div><div class="v vi">${esc(merkle(b.txs))}</div></div>
            <div class="bfield"><div class="k">nonce</div><div class="v go">${fmt(b.nonce)}</div></div>
            <div class="bfield"><div class="k">guesses it took</div><div class="v go">${fmt(b.guesses || b.nonce + 1)}</div></div>
            <div class="bfield full ${ok ? "" : "hl"}"><div class="k">sha256(header + nonce) — must start with ${Z()}</div><div class="v ${ok ? "hash" : ""}">${zeros(esc(h))}</div></div>
          </div>
          <div class="cxdl">its transactions. the amounts are editable, because the interesting question is what happens when you edit one</div>
          <div class="cxtxs">${b.txs.map((t, k) => txLine(t, k, !t.cb)).join("")}</div>
          <div class="note" style="margin-top:8px">Miner took ${rewardAt(b.i)} newly minted${fees ? ` plus ${fees} in fees` : ""}.</div>
          ${ok ? "" : `<div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn danger" id="xFix">Re-mine this block and every block after it</button></div>`}`;
        d.querySelector("#xClose").onclick = () => { C.sel = null; commit(); };
        d.querySelectorAll("input[data-t]").forEach(inp => {
          inp.oninput = () => {
            const k = +inp.dataset.t, v = Math.max(0, parseInt(inp.value, 10) || 0);
            C.chain[i].txs[k].amt = v;
            /* the signature was made over the old amount, and the merkle root
               was made over the signature. one keystroke breaks both. emit so
               the wallets in the other beats follow the forged ledger too */
            save(); emit();
            const nd = $("xD").querySelector(`input[data-t="${k}"]`);
            if (nd) { nd.focus(); nd.setSelectionRange(nd.value.length, nd.value.length); }
            setMsg(`You changed an amount inside block #${i}. Its merkle root moved, so its header moved, so its hash moved, and the new hash does not start with ${Z()} any more. Every block after it was pointing at the old hash. <b>${C.chain.length - i} block${C.chain.length - i > 1 ? "s are" : " is"} now broken.</b>`, "bad");
          };
        });
        const fix = d.querySelector("#xFix");
        if (fix) fix.onclick = () => {
          if (busy) return; busy = true; fix.disabled = true;
          const start = brokenFrom();
          let j = start, spent = 0;
          const next = () => {
            if (j >= C.chain.length) {
              busy = false;
              setMsg(`Repaired. It cost <b>${fmt(spent)} guesses</b> to re-mine ${C.chain.length - start} block${C.chain.length - start > 1 ? "s" : ""}, on top of the ${fmt(C.spent)} you had already spent building this history honestly. And you are the only miner here. On a real chain the rest of the network would have kept extending the honest history the entire time you were catching up, which is the reason nobody does this.`, "ok");
              C.spent += spent; commit(); return;
            }
            C.chain[j].prev = prevOf(j);
            mine(C.chain[j], null, (done) => { spent += done.guesses; j++; save(); drawChain(); drawDrawer(); next(); });
          };
          setMsg("re-mining…"); next();
        };
      }

      function mineOne(after) {
        if (busy || !C.chain.length) return;
        busy = true; $("xGo").disabled = true; $("xGo5").disabled = true;
        const h = C.chain.length;
        const b = assemble(h, hashOf(C.chain[h - 1]), C.pool);
        const included = b.txs.filter(t => !t.cb);
        mine(b, n => setMsg(`mining block #${h}… ${fmt(n)} guesses`), (done) => {
          C.chain.push(done); C.spent += done.guesses;
          C.pool = C.pool.filter(t => !included.includes(t));
          busy = false; $("xGo").disabled = false; $("xGo5").disabled = false;
          const halved = h % C.halve === 0 && h > 0;
          setMsg(halved
            ? `<b style="color:var(--gold-text)">Halving.</b> Block #${h} is the first paying ${rewardAt(h)} instead of ${rewardAt(h - 1)}. Nobody voted on that. You wrote it into the rules before any of this existed, and the schedule has simply arrived. Same trick as Bitcoin's 21 million.`
            : `Block #${h} sealed after ${fmt(done.guesses)} guesses${included.length ? `, carrying ${included.length} payment${included.length > 1 ? "s" : ""} out of the mempool` : ""}. Click it to read what went in.`, halved ? "" : "ok");
          commit();
          if (after) after();
        });
      }

      $("xGo").onclick = () => mineOne();
      $("xGo5").onclick = () => { if (busy) return; queue = 5; const run = () => { if (queue-- <= 0) return; mineOne(run); }; run(); };

      function render() {
        $("xHt").textContent = C.chain.length;
        $("xSup").textContent = fmt(supply());
        $("xRw").textContent = rewardAt(C.chain.length);
        $("xBal").textContent = fmt(balances().you);
        $("xGo").disabled = busy || !C.chain.length;
        $("xGo5").disabled = busy || !C.chain.length;
        drawChain(); drawDrawer();
      }

      if (!C.chain.length) gate(w, "Mine genesis in step 01 first. There is nothing to explore yet.");
      sub(w, render);
      if (!$("xM").textContent) setMsg(C.chain.length ? "Click any block to open it." : "No blocks yet.");
    }
  };

  /* ============================================================
     BEAT 04. the attack, with something real to lose
     ============================================================ */
  const beatAttack = {
    n: "04", h: "Now let someone try to take it back",
    cap: "Pay Ava, let the payment settle under a few blocks, and then spend the money you already spent. The attacker mines a private fork that simply never contains your payment to her. Both chains are real, both are mined with real hashes, and your node follows whichever one is longer. That last rule is the entire defence.",
    build(s) {
      const w = card(s, "double-spend the merchant", `
        <div class="srow"><span class="nm">attacker's share of the hashpower</span><input type="range" id="aQ" min="10" max="60" step="5" value="30"><span class="v" id="aQv">30%</span></div>
        <div class="srow"><span class="nm">confirmations Ava waits for</span><input type="range" id="aK" min="1" max="6" step="1" value="3"><span class="v" id="aKv">3</span></div>
        <div class="cxodds" id="aOdds"></div>
        <div class="btn-row" style="justify-content:center"><button class="btn" id="aSetup">1 · Pay Ava 25 and wait</button><button class="btn danger" id="aGo" disabled>2 · Fork the chain and race</button></div>
        <div class="cxrace">
          <div class="cxlane"><span class="cxln ok">honest chain</span><div class="mchain" id="aH"></div></div>
          <div class="cxlane"><span class="cxln bad">attacker's private fork</span><div class="mchain" id="aE"></div></div>
        </div>
        <div class="cxwallet" id="aW"></div>
        <div class="sig-state" id="aM" style="margin-top:12px">Ava is a merchant. She will not hand over the goods until your payment is buried under a few blocks. How many is enough?</div>`);

      const $ = (id) => w.querySelector("#" + id);
      const setMsg = (t, cls) => { const m = $("aM"); m.innerHTML = t; m.className = "sig-state" + (cls ? " " + cls : ""); };
      let forkAt = null, avaTx = null, honest = [], evil = [], running = false, burned = 0, waited = 0;

      const lane = (id, blocks, cls) => {
        $(id).innerHTML = blocks.map((b, i) => `<div class="mblk2 ${cls}"><span class="mb-n">#${b.i}</span><span class="mb-h mono">${short(hashOf(b), 4, 3)}</span></div>`).join("") || `<span class="note">—</span>`;
      };

      function odds() {
        const q = +$("aQ").value / 100, k = +$("aK").value;
        /* Satoshi, section 11: an attacker on q catches up from k behind with
           probability (q/(1-q))^k while q < 0.5 */
        const p = q >= 0.5 ? 1 : Math.pow(q / (1 - q), k);
        $("aQv").textContent = Math.round(q * 100) + "%";
        $("aKv").textContent = k;
        $("aOdds").innerHTML = `On paper: an attacker holding <b>${Math.round(q * 100)}%</b> catches up from <b>${k}</b> block${k > 1 ? "s" : ""} behind with probability <b>${q >= 0.5 ? "1 — certainty, given time" : (p * 100 < 0.01 ? "under 0.01%" : (p * 100).toFixed(2) + "%")}</b>. Below is one actual attempt.`;
      }
      $("aQ").oninput = odds; $("aK").oninput = odds;

      function wallets() {
        const bal = balances();
        $("aW").innerHTML = Object.keys(NAMES).map(k =>
          `<div class="cxwc${k === "ava" ? " watch" : ""}"><span class="cxwi">${ICON[k]}</span><span class="cxwn">${NAMES[k]}</span><span class="cxwb${bal[k] < 0 ? " neg" : ""}">${bal[k]} <i>${esc(C.ticker)}</i></span></div>`).join("");
      }

      $("aSetup").onclick = () => {
        if (running || !C.chain.length) return;
        const bal = balances();
        const amt = Math.min(25, bal.you);
        if (amt < 1) { setMsg("You have nothing to spend. Mine a few blocks in step 03 first.", "bad"); return; }
        running = true; $("aSetup").disabled = true; $("aGo").disabled = true;
        /* each run is a fresh scenario, not a second payment stacked on the last */
        forkAt = null; honest = []; evil = [];
        const t = { from: "you", to: "ava", amt, fee: 1, n: nonceOf("you") };
        t.sig = sign("you", t);
        avaTx = t; C.pool.push(t);
        const k = +$("aK").value;
        waited = k;
        let left = k;
        const step = () => {
          const h = C.chain.length;
          const b = assemble(h, hashOf(C.chain[h - 1]), C.pool);
          const inc = b.txs.filter(x => !x.cb);
          mine(b, null, (done) => {
            C.chain.push(done); C.spent += done.guesses;
            C.pool = C.pool.filter(x => !inc.includes(x));
            if (forkAt == null) forkAt = h; // the fork point: the block that carried the payment
            /* emit, not save: the explorer in beat 03 is showing this same chain */
            commit(); lane("aH", C.chain.slice(forkAt), "ok");
            if (--left > 0) { setMsg(`Block #${h} mined. ${left} confirmation${left > 1 ? "s" : ""} to go.`); step(); }
            else {
              running = false; $("aGo").disabled = false;
              setMsg(`Paid. Ava sees <b>${amt} ${esc(C.ticker)}</b> in her wallet, buried under ${k} block${k > 1 ? "s" : ""}, and hands over the goods. Now take the money back.`, "ok");
            }
          });
        };
        setMsg("signing and mining…"); step();
      };

      $("aGo").onclick = () => {
        if (running || forkAt == null) return;
        running = true; $("aGo").disabled = true; burned = 0;
        /* the attacker forks from just before the payment and mines an
           alternative history in which the payment simply never happened */
        honest = C.chain.slice(forkAt);
        evil = [];
        const base = forkAt === 0 ? GEN : hashOf(C.chain[forkAt - 1]);
        const q = +$("aQ").value / 100;
        let rounds = 0;

        const step = () => {
          if (!document.contains(w)) return;
          rounds++;
          if (Math.random() < q) {
            const h = forkAt + evil.length;
            const prev = evil.length ? hashOf(evil[evil.length - 1]) : base;
            /* same rules, same difficulty, real hashes. only the contents differ:
               the coinbase pays the attacker and Ava's payment is absent */
            const b = mineSync({ i: h, prev, time: 1700000000 + h * 600, txs: [{ cb: true, to: "ben", amt: rewardAt(h), h }], nonce: 0, guesses: 0 });
            burned += b.guesses; evil.push(b);
          } else {
            const h = forkAt + honest.length;
            const prev = honest.length ? hashOf(honest[honest.length - 1]) : base;
            const b = mineSync({ i: h, prev, time: 1700000000 + h * 600, txs: [{ cb: true, to: "you", amt: rewardAt(h), h }], nonce: 0, guesses: 0 });
            honest.push(b);
          }
          lane("aH", honest, "ok"); lane("aE", evil, "bad");

          if (evil.length > honest.length) {
            /* the fork is longer, so it is the chain. your node does not "accept
               a rewrite", it just follows the most work, exactly as instructed */
            running = false;
            C.chain = C.chain.slice(0, forkAt).concat(evil);
            C.sel = null;
            const gone = avaTx ? avaTx.amt : 0;
            forkAt = null; // the scenario is over; the chain underneath it changed
            commit(); wallets();
            setMsg(`<b>The fork won.</b> Your node did nothing wrong: it saw a longer chain, and the rule it has followed since block zero is to take the longest one. Ava's ${gone} ${esc(C.ticker)} is not "reversed". In the history the network now holds, <b>you never paid her</b>, and she has already handed over the goods. It took the attacker ${fmt(burned)} guesses and ${rounds} rounds. That is what she was really buying when she waited for confirmations, and she did not wait long enough.`, "bad");
            return;
          }
          /* the attacker started `waited` blocks behind. it gives up once it has
             fallen four further behind than that, never at a fixed gap, or a
             merchant who waited six confirmations would win before rolling once */
          if (honest.length - evil.length >= waited + 4) {
            running = false;
            /* the honest blocks of this race really were mined, so they join the
               chain. the attacker's stay private forever, which is the cost */
            C.chain = C.chain.slice(0, forkAt).concat(honest);
            forkAt = null; // one scenario per setup: another go starts a fresh payment
            const wasted = evil.length
              ? `burned <b>${fmt(burned)} guesses</b> on ${evil.length} block${evil.length === 1 ? "" : "s"} that no one will ever see, and earned nothing for any of them`
              : `never found a single block. Every guess it made bought it nothing at all`;
            commit(); wallets();
            setMsg(`<b>The attack is abandoned.</b> It started ${waited} block${waited > 1 ? "s" : ""} behind and is now ${honest.length - evil.length} behind, so the gap is widening and the fork can never catch up. The attacker ${wasted}. Meanwhile your chain simply kept going, and those blocks are now real. Ava keeps her ${avaTx ? avaTx.amt : 0}. Nobody defended her. The arithmetic did.`, "ok");
            return;
          }
          setTimeout(step, 90);
        };
        setMsg("racing. every block on both lanes is really being mined…");
        step();
      };

      function render() {
        wallets(); odds();
        $("aSetup").disabled = running || !C.chain.length;
        $("aGo").disabled = running || forkAt == null;
        if (forkAt != null) { lane("aH", honest.length ? honest : C.chain.slice(forkAt), "ok"); lane("aE", evil, "bad"); }
      }

      if (!C.chain.length) gate(w, "There is no chain to attack yet. Start at step 01.");
      sub(w, render);
    }
  };

  /* ============================================================
     assemble the lesson
     ============================================================ */
  L.coin = {
    world: "capstone", title: "Build your own coin", oneliner: "Write its rules, mine it, defend it", icon: "◆",
    hero: "You have taken the machine apart. Now build one that runs. Write a monetary policy, mine a genesis block that never existed before you pressed the button, open your wallet to strangers, and then stand there while someone tries to rewrite what you made. Every hash on this page is real, and the chain is yours. it is still here when you come back.",
    beats: [beatRules, beatPay, beatMine, beatAttack],
    deeper: P("Everything here uses the same primitives as the real thing, only smaller: SHA-256 over a real header, a merkle root over real transactions, a target of three leading zeros instead of nineteen, a halving every few blocks instead of every 210,000. Nothing conceptual was cut. A genesis block, a coinbase, fee-priority block assembly, signature-gated transfers, a longest-chain rule and a reorg that quietly deletes a settled payment <i>are</i> the skeleton of Bitcoin.<br><br>The one thing the sandbox cannot give you is the thing that actually makes it work. Here you are the network: you mine every honest block, you set the difficulty, and the attacker only exists when you press a button. A real chain is thousands of strangers who have never spoken, most of whom would happily take your money, held in line by nothing but the fact that following the rules pays better than breaking them. The gap between your coin and a real one is not ideas. It is <i>other people</i>. A blockchain, in the end, is a machine for surviving them."),
    bridge: "That's the course. Strangers keeping one honest record with no one in charge. money no state can freeze, or the most controllable money in history, depending entirely on who holds the keys. Same machine, opposite directions. You now know exactly why."
  };

})();
