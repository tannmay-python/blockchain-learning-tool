/* ============================================================
   observatory.js — THE OBSERVATORY. A living blockchain on one
   screen: transactions ripple peer-to-peer, miners race real
   SHA-256, blocks sweep the network, forks split it and heal.
   window.OBS = { mount(host), unmount(), tease(canvasId) }
   ============================================================ */
window.OBS = (function () {
  "use strict";
  const RM = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const NAMES = ["Ava", "Bo", "Cy", "Dee", "Eli", "Fay", "Gus", "Hana", "Ida", "Jules", "Kip", "Lena", "Mo", "Nia", "Oz", "Pia"];
  const short = (s, a = 7, b = 5) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : (s || "");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ---------------- deterministic-ish layout ---------------- */
  function buildTopology(W, H, N) {
    // golden-angle spiral + jitter → organic, evenly filled, no seed pile-ups
    const nodes = [];
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.44;
    for (let i = 0; i < N; i++) {
      const t = (i + 0.7) / N, a = i * 2.399963;
      nodes.push({
        i, x: cx + Math.cos(a) * R * Math.sqrt(t) + rnd(-18, 18),
        y: cy + Math.sin(a) * R * Math.sqrt(t) * 0.86 + rnd(-14, 14),
        peers: [], mempool: [], tip: null, heardCol: null,
        pulse: 0, flash: 0, badFlash: 0, miner: false, power: 0, tampered: false,
      });
    }
    // connect: each node to its 2-3 nearest, then ensure connectivity
    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    nodes.forEach(n => {
      const near = nodes.filter(m => m !== n).sort((a, b) => d2(n, a) - d2(n, b));
      const want = 2 + (n.i % 2);
      for (let k = 0; k < near.length && n.peers.length < want; k++) {
        const m = near[k];
        if (!n.peers.includes(m.i)) { n.peers.push(m.i); if (!m.peers.includes(n.i)) m.peers.push(n.i); }
      }
    });
    // stitch disconnected components to the main one
    const seen = new Set(); const stack = [0];
    while (stack.length) { const i = stack.pop(); if (seen.has(i)) continue; seen.add(i); nodes[i].peers.forEach(p => stack.push(p)); }
    nodes.forEach(n => {
      if (!seen.has(n.i)) {
        const anchor = nodes.filter(m => seen.has(m.i)).sort((a, b) => d2(n, a) - d2(n, b))[0];
        n.peers.push(anchor.i); anchor.peers.push(n.i);
        const st = [n.i]; while (st.length) { const i = st.pop(); if (seen.has(i)) continue; seen.add(i); nodes[i].peers.push && nodes[i].peers.forEach(p => st.push(p)); }
      }
    });
    const edges = [];
    nodes.forEach(n => n.peers.forEach(p => { if (p > n.i) edges.push([n.i, p]); }));
    return { nodes, edges };
  }

  /* ---------------- the simulation ---------------- */
  function makeSim(W, H) {
    const N = 26;
    const { nodes, edges } = buildTopology(W, H, N);
    // miners: 5 spread-out nodes, weighted power
    const minerIdx = [];
    const wantMiners = [0.12, 0.32, 0.52, 0.72, 0.92].map(f => Math.floor(f * N));
    wantMiners.forEach((i, k) => { nodes[i].miner = true; nodes[i].power = [3, 5, 2, 4, 3][k]; minerIdx.push(i); });

    const GEN = { height: 0, hash: "0".repeat(12), txs: [], nonce: 0, prev: "—", merkle: "—", miner: -1, color: "g" };
    const S = {
      nodes, edges, minerIdx,
      chain: [GEN],                 // canonical chain (ribbon shows tail)
      orphans: [],                  // {block, at}
      travelers: [],                // tx / block pulses on edges {kind, from,to,t,speed, payload, col}
      waves: [],                    // expanding rings {x,y,r,max,col,a}
      log: [],
      txSeq: 0, forks: 0, hashes: 0, hashrateEMA: 0,
      pendingFork: null,            // {a:block, b:block, resolved:false, splitA:Set, splitB:Set}
      candidate: { nonce: 0, hash: "", miner: minerIdx[1] },
      speed: 1, paused: false, tampered: null,
      sinceBlock: 0, blockEvery: 9,  // seconds at 1x
      forceForkNext: false,
      selNode: null, selBlock: null,
      diff: 3,
      onEvent: null,
    };
    const tip = () => S.chain[S.chain.length - 1];

    function logline(t, cls) { S.log.unshift({ t, cls, at: Date.now() }); if (S.log.length > 40) S.log.pop(); if (S.onEvent) S.onEvent(); }

    function newTx(fromIdx) {
      const a = pick(NAMES), b = pick(NAMES.filter(x => x !== a));
      const tx = { id: ++S.txSeq, label: `${a} → ${b}: ${1 + (Math.random() * 19 | 0)}`, fee: +(rnd(0.1, 1.5)).toFixed(1), origin: fromIdx };
      const n = nodes[fromIdx];
      n.mempool.push(tx); n.pulse = 1;
      relay(fromIdx, { kind: "tx", tx }, null);
      return tx;
    }

    // gossip relay: send payload from node i to all peers that haven't seen it
    function relay(i, msg, except) {
      nodes[i].peers.forEach(p => {
        if (p === except) return;
        S.travelers.push({ kind: msg.kind, from: i, to: p, t: 0, speed: rnd(0.9, 1.4), msg });
      });
    }

    function nodeReceives(p, tr) {
      const n = nodes[p], msg = tr.msg;
      if (msg.kind === "tx") {
        if (n.mempool.some(t => t.id === msg.tx.id)) return;
        n.mempool.push(msg.tx); n.pulse = 1;
        relay(p, msg, tr.from);
      } else if (msg.kind === "block") {
        const b = msg.block;
        if (n.tip === b.hash) return;
        if (msg.invalid) { n.badFlash = 1; logOnce(msg, `✕ node ${p + 1} rejected invalid block from tampered node`, "bad"); return; }
        // fork colouring: first block heard at this height wins the node
        if (S.pendingFork && !S.pendingFork.resolved && b.height === S.pendingFork.a.height) {
          if (n.heardCol == null) n.heardCol = (b === S.pendingFork.a) ? "A" : "B";
          else return; // already convinced by the other side — don't re-relay
        }
        n.tip = b.hash; n.flash = 1;
        n.mempool = n.mempool.filter(t => !b.txs.some(bt => bt.id === t.id));
        relay(p, msg, tr.from);
      }
    }
    const logOnce = (msg, text, cls) => { if (!msg._logged) { msg._logged = true; logline(text, cls); } };

    function merkleOf(txs) {
      if (!txs.length) return sha256("empty");
      let lvl = txs.map(t => sha256(t.label));
      while (lvl.length > 1) { const nx = []; for (let i = 0; i < lvl.length; i += 2) nx.push(sha256(lvl[i] + (lvl[i + 1] || lvl[i]))); lvl = nx; }
      return lvl[0];
    }

    function mineBlock(minerI, prevBlock) {
      // real PoW, one hash per step(), spread across frames
      const mn = nodes[minerI];
      const txs = mn.mempool.slice().sort((a, b) => b.fee - a.fee).slice(0, 4);
      const merkle = merkleOf(txs);
      const body = txs.map(t => t.label).join("|") + prevBlock.hash + merkle;
      let nonce = Math.floor(rnd(0, 50000));
      return {
        txCount: txs.length,
        step() {
          const h = sha256(body + nonce);
          S.hashes++;
          S.candidate = { nonce, hash: h, miner: minerI };
          if (h.startsWith("0".repeat(S.diff))) {
            return { height: prevBlock.height + 1, prev: prevBlock.hash, merkle, txs, nonce, hash: h, miner: minerI, foundAt: Date.now() };
          }
          nonce++;
          return null;
        }
      };
    }

    let job = null, jobMiner = minerIdx[1];

    function announce(block, forkTwin) {
      const mn = nodes[block.miner];
      mn.flash = 1; mn.tip = block.hash;
      mn.mempool = mn.mempool.filter(t => !block.txs.some(bt => bt.id === t.id));
      S.waves.push({ x: mn.x, y: mn.y, r: 6, max: Math.max(W, H) * 0.5, col: forkTwin ? (forkTwin === "A" ? "a" : "b") : "g", a: 0.9 });
      relay(block.miner, { kind: "block", block }, null);
    }

    function onBlockFound(block) {
      const t = tip();
      const makeFork = (S.forceForkNext || Math.random() < 0.13) && !S.pendingFork && S.chain.length > 2;
      if (makeFork) {
        S.forceForkNext = false;
        // second miner finds a competing block at the same height, far away
        const others = minerIdx.filter(i => i !== block.miner);
        const rival = nodes[pick(others)];
        const txs2 = rival.mempool.slice().sort((a, b) => b.fee - a.fee).slice(0, 4);
        const merkle2 = merkleOf(txs2);
        let n2 = 0, h2 = "";
        const body2 = txs2.map(x => x.label).join("|") + t.hash + merkle2 + "b";
        while (!(h2 = sha256(body2 + n2)).startsWith("0".repeat(S.diff))) n2++;
        const twin = { height: block.height, prev: t.hash, merkle: merkle2, txs: txs2, nonce: n2, hash: h2, miner: rival.i };
        S.pendingFork = { a: block, b: twin, resolved: false };
        S.forks++;
        nodes.forEach(n => n.heardCol = null);
        nodes[block.miner].heardCol = "A"; nodes[rival.i].heardCol = "B";
        announce(block, "A"); announce(twin, "B");
        logline(`⑂ two blocks found at height ${block.height} — network splitting`, "warn");
      } else if (S.pendingFork && !S.pendingFork.resolved && (block.prev === S.pendingFork.a.hash || block.prev === S.pendingFork.b.hash)) {
        // fork resolution: this block extends one side
        const F = S.pendingFork;
        const winner = block.prev === F.a.hash ? F.a : F.b;
        const loser = winner === F.a ? F.b : F.a;
        S.chain.push(winner, block);
        S.orphans.push({ block: loser, at: Date.now() });
        F.resolved = true; S.pendingFork = null;
        nodes.forEach(n => { n.heardCol = null; n.tip = block.hash; });
        announce(block, null);
        logline(`◆ height ${block.height} extends ${short(winner.hash, 6, 0)} — fork healed, ${short(loser.hash, 6, 0)} orphaned`, "info");
        logline(`✦ orphaned block's ${loser.txs.length} txs return to the mempool`, "");
        loser.txs.forEach(t => { const n = nodes[loser.miner]; if (!n.mempool.some(x => x.id === t.id)) n.mempool.push(t); });
      } else {
        S.chain.push(block);
        announce(block, null);
        const fees = block.txs.reduce((a, t) => a + t.fee, 0).toFixed(1);
        logline(`◆ block ${block.height} mined by node ${block.miner + 1} — ${block.txs.length} txs, 3.125 + ${fees} fee`, "ok");
      }
      S.sinceBlock = 0;
    }

    /* fork resolution mining target: while pendingFork, miners mine on their heard side */
    function pickJobBase() {
      if (S.pendingFork && !S.pendingFork.resolved) {
        const mn = nodes[jobMiner];
        return mn.heardCol === "B" ? S.pendingFork.b : S.pendingFork.a;
      }
      return tip();
    }

    let txTimer = 0, hrTimer = 0, hrCount = 0;

    function tick(dt) {
      if (S.paused) return;
      const dts = dt * S.speed;
      S.sinceBlock += dts;

      // spawn transactions
      txTimer -= dts;
      if (txTimer <= 0) { newTx((Math.random() * N) | 0); txTimer = rnd(1.4, 3.4) / Math.sqrt(S.speed); }

      // travelers advance
      for (let i = S.travelers.length - 1; i >= 0; i--) {
        const tr = S.travelers[i];
        tr.t += dts * tr.speed * (tr.kind === "block" ? 2.1 : 1.55);
        if (tr.t >= 1) { S.travelers.splice(i, 1); nodeReceives(tr.to, tr); }
      }
      // waves, pulses decay
      S.waves.forEach(w => { w.r += dts * 340; w.a -= dts * 0.9; });
      S.waves = S.waves.filter(w => w.a > 0 && w.r < w.max);
      nodes.forEach(n => { n.pulse = Math.max(0, n.pulse - dts * 2.2); n.flash = Math.max(0, n.flash - dts * 1.6); n.badFlash = Math.max(0, n.badFlash - dts * 1.4); });

      // mining: re-pick the active miner (weighted by power) whenever the base tip
      // changes, or rebuild the job when fresh transactions could fill an emptier block
      const base = pickJobBase();
      const staleTxs = job && job.impl.txCount < 4 && nodes[jobMiner].mempool.length > job.impl.txCount;
      if (!job || job.baseHash !== base.hash || staleTxs) {
        const pool = minerIdx.flatMap(i => Array(nodes[i].power).fill(i));
        jobMiner = pick(pool);
        job = { baseHash: base.hash, impl: mineBlock(jobMiner, base) };
      }
      // hash budget per tick — tuned so a block lands ~blockEvery seconds at 1x
      const p = Math.pow(16, S.diff);
      const budget = Math.max(6, Math.round(p / S.blockEvery * dts * 1.15));
      let block = null;
      for (let k = 0; k < budget; k++) {
        const one = job.impl.step();
        if (one) { block = one; break; }
      }
      hrCount += budget; hrTimer += dts;
      if (hrTimer > 0.5) { S.hashrateEMA = Math.round(hrCount / hrTimer); hrCount = 0; hrTimer = 0; }
      if (block) { job = null; onBlockFound(block); }

      // stale orphans fade out of the ribbon after a while (renderer handles alpha)
    }

    /* --------- user actions --------- */
    function userBroadcast() { const i = (Math.random() * N) | 0; const tx = newTx(i); logline(`▸ you broadcast "${tx.label}" from node ${i + 1}`, "info"); }
    function userTamper() {
      const candidates = nodes.filter(n => !n.miner);
      const n = pick(candidates);
      n.tampered = true; n.badFlash = 1; S.tampered = n.i;
      const fake = { kind: "block", block: { height: tip().height + 1, hash: sha256("fake" + Math.random()), prev: "ffff" + tip().hash.slice(4), txs: [], nonce: 0, merkle: "?", miner: n.i }, invalid: true };
      relay(n.i, fake, null);
      logline(`⚠ node ${n.i + 1} announces a block with no valid proof-of-work…`, "warn");
      setTimeout(() => { n.tampered = false; }, 4200);
    }
    function userFork() { S.forceForkNext = true; logline(`⑂ forcing a tie on the next block…`, "warn"); }

    return { S, tick, tip, userBroadcast, userTamper, userFork, W, H };
  }

  /* ---------------- renderer ---------------- */
  const COL = {
    bg1: "#160511", bg2: "#22091b",
    edge: "rgba(214,160,190,.13)", edgeLit: "rgba(241,162,34,.55)",
    node: "#f6e7ee", nodeDim: "rgba(246,231,238,.75)",
    gold: "#f1a222", plum: "#c04f86", green: "#3fca8a", red: "#ff5a76",
    a: "#c04f86", b: "#f1a222",
    ink: "#f6e7ee", ink2: "#c9a3b6", ink3: "#96707f",
  };

  let raf = 0, sim = null, ui = null, lastT = 0, host = null;

  function draw(cv, ctx, dpr, t) {
    const { S } = sim, W = sim.W, H = sim.H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // bg
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, COL.bg2); g.addColorStop(1, COL.bg1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // fork tint overlays: subtle split glow when network divided
    // edges
    ctx.lineWidth = 1;
    S.edges.forEach(([a, b]) => {
      const A = S.nodes[a], B = S.nodes[b];
      ctx.strokeStyle = COL.edge;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    });
    // travelers
    S.travelers.forEach(tr => {
      const A = S.nodes[tr.from], B = S.nodes[tr.to];
      const x = A.x + (B.x - A.x) * tr.t, y = A.y + (B.y - A.y) * tr.t;
      const isBlock = tr.kind === "block";
      const col = tr.msg && tr.msg.invalid ? COL.red : isBlock ? (S.pendingFork && !S.pendingFork.resolved && tr.msg.block ? (tr.msg.block === S.pendingFork.a ? COL.a : tr.msg.block === S.pendingFork.b ? COL.b : COL.gold) : COL.gold) : "rgba(241,162,34,.9)";
      // trail
      ctx.strokeStyle = col.replace ? col : col; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(A.x + (B.x - A.x) * Math.max(0, tr.t - 0.12), A.y + (B.y - A.y) * Math.max(0, tr.t - 0.12)); ctx.lineTo(x, y); ctx.lineWidth = isBlock ? 3 : 1.6; ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, isBlock ? 4.5 : 2.6, 0, TAU); ctx.fill();
      if (isBlock) { ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1; ctx.strokeRect(x - 4, y - 4, 8, 8); }
    });
    // waves
    S.waves.forEach(w => {
      ctx.globalAlpha = Math.max(0, w.a) * 0.55;
      ctx.strokeStyle = w.col === "a" ? COL.a : w.col === "b" ? COL.b : COL.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    });
    // nodes
    S.nodes.forEach(n => {
      const sel = S.selNode === n.i;
      const col = n.tampered || n.badFlash > 0 ? COL.red : n.heardCol === "A" ? COL.a : n.heardCol === "B" ? COL.b : n.miner ? COL.gold : COL.nodeDim;
      const r = (n.miner ? 7.5 : 5) + n.pulse * 3 + n.flash * 3.5;
      // glow
      ctx.globalAlpha = 0.28 + n.flash * 0.5 + n.pulse * 0.3;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.4, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.fill();
      if (n.miner) { // mining ring
        ctx.strokeStyle = "rgba(241,162,34,.8)"; ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 5]); ctx.lineDashOffset = RM ? 0 : (-t / 40) % 9;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 5.5, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      if (sel) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(n.x, n.y, r + 9, 0, TAU); ctx.stroke(); }
      // mempool count
      if (n.mempool.length) {
        ctx.fillStyle = COL.ink2; ctx.font = "600 9px JetBrains Mono, monospace"; ctx.textAlign = "center";
        ctx.fillText(String(n.mempool.length), n.x, n.y - r - 7);
      }
    });
  }

  /* ---------------- DOM shell ---------------- */
  function panelNode(S, i) {
    const n = S.nodes[i];
    return `<div class="obs-panel-h"><b>Node ${i + 1}</b>${n.miner ? ` <span class="obs-chip gold">miner · power ${n.power}</span>` : ""}<button class="obs-x" id="obsPX">✕</button></div>
      <div class="obs-kv"><span>peers</span><b>${n.peers.map(p => p + 1).join(", ")}</b></div>
      <div class="obs-kv"><span>tip</span><b class="mono">${short(n.tip || "—", 8, 6)}</b></div>
      <div class="obs-sub">mempool — ${n.mempool.length} waiting</div>
      ${n.mempool.slice(0, 7).map(t => `<div class="obs-tx"><span>${t.label}</span><i>fee ${t.fee}</i></div>`).join("") || `<div class="obs-tx dim">empty — txs arrive by gossip</div>`}`;
  }
  function panelBlock(S, b) {
    return `<div class="obs-panel-h"><b>Block ${b.height}</b><span class="obs-chip">${b.miner < 0 ? "genesis" : "mined by node " + (b.miner + 1)}</span><button class="obs-x" id="obsPX">✕</button></div>
      <div class="obs-kv"><span>prev</span><b class="mono">${short(b.prev, 10, 8)}</b></div>
      <div class="obs-kv"><span>merkle root</span><b class="mono">${short(b.merkle, 10, 8)}</b></div>
      <div class="obs-kv"><span>nonce</span><b class="mono">${b.nonce.toLocaleString()}</b></div>
      <div class="obs-kv"><span>hash</span><b class="mono gold">${short(b.hash, 12, 10)}</b></div>
      <div class="obs-sub">transactions — ${b.txs.length}</div>
      ${b.txs.map(t => `<div class="obs-tx"><span>${t.label}</span><i>fee ${t.fee}</i></div>`).join("") || `<div class="obs-tx dim">no transactions (empty block)</div>`}
      <div class="obs-note">every field above is real — the hash really is SHA-256 of this header, mined until it started with ${"0".repeat(S.diff)}</div>`;
  }

  function ribbonHTML(S) {
    const tail = S.chain.slice(-8);
    const orph = S.orphans.slice(-1)[0];
    return tail.map(b => `<button class="obs-blk${S.selBlock === b.hash ? " sel" : ""}${S.pendingFork && !S.pendingFork.resolved ? "" : ""}" data-h="${b.hash}">
        <span class="bh">#${b.height}</span><span class="bx mono">${short(b.hash, 5, 4)}</span><span class="bt">${b.txs ? b.txs.length : 0} tx</span></button>`).join(`<span class="obs-link">—</span>`)
      + (S.pendingFork && !S.pendingFork.resolved ? `<span class="obs-link">—</span><span class="obs-forkpair"><button class="obs-blk fa" data-h="${S.pendingFork.a.hash}"><span class="bh">#${S.pendingFork.a.height}</span><span class="bx mono">${short(S.pendingFork.a.hash, 5, 4)}</span><span class="bt">A</span></button><button class="obs-blk fb" data-h="${S.pendingFork.b.hash}"><span class="bh">#${S.pendingFork.b.height}</span><span class="bx mono">${short(S.pendingFork.b.hash, 5, 4)}</span><span class="bt">B</span></button></span>` : "")
      + (orph && Date.now() - orph.at < 6000 ? `<button class="obs-blk orphan" data-h="${orph.block.hash}"><span class="bh">#${orph.block.height}</span><span class="bx mono">${short(orph.block.hash, 5, 4)}</span><span class="bt">orphan</span></button>` : "");
  }

  function statsHTML(S) {
    const ago = S.sinceBlock.toFixed(0);
    const mem = S.nodes.reduce((a, n) => a + n.mempool.length, 0);
    return `<span><b>${S.chain[S.chain.length - 1].height}</b> height</span>
      <span><b>${mem}</b> in mempools</span>
      <span><b>${S.hashrateEMA.toLocaleString()}</b> real H/s</span>
      <span><b>${S.forks}</b> forks seen</span>
      <span><b>${ago}s</b> since block</span>`;
  }

  function mount(rootEl) {
    unmount();
    host = document.createElement("div");
    host.className = "obs";
    host.innerHTML = `
      <canvas class="obs-cv"></canvas>
      <div class="obs-top">
        <a class="obs-back" href="#/">← exit</a>
        <div class="obs-title">The <em>Observatory</em><span class="obs-sub2">a living blockchain — every hash real</span></div>
        <div class="obs-stats" id="obsStats"></div>
      </div>
      <div class="obs-candidate mono" id="obsCand"></div>
      <div class="obs-log" id="obsLog" aria-live="polite"></div>
      <div class="obs-panel" id="obsPanel" hidden></div>
      <div class="obs-tour" id="obsTour" hidden>
        <div class="obs-tour-text" id="obsTourText"></div>
        <div class="obs-tour-foot"><div class="obs-tour-dots" id="obsTourDots"></div><button class="obs-btn" id="obsTourSkip">skip tour</button></div>
      </div>
      <div class="obs-bottom">
        <div class="obs-ribbon" id="obsRibbon"></div>
        <div class="obs-controls">
          <button class="obs-btn" id="obsPause" title="space">⏸ pause</button>
          <button class="obs-btn" id="obsSpeed">1×</button>
          <span class="obs-sep"></span>
          <button class="obs-btn act" id="obsTx">broadcast a tx</button>
          <button class="obs-btn act" id="obsTamper">tamper a node</button>
          <button class="obs-btn act" id="obsFork">force a fork</button>
          <span class="obs-sep"></span>
          <button class="obs-btn act" id="obsTourBtn">✦ guided tour</button>
        </div>
      </div>`;
    rootEl.appendChild(host);
    document.body.classList.add("obs-open");

    const cv = host.querySelector(".obs-cv"), ctx = cv.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    const stage = () => { const r = host.getBoundingClientRect(); return [r.width || innerWidth, r.height || innerHeight]; };
    let [W, H] = stage();
    // CSS-load / pre-layout race: never build the world on a zero-sized stage — retry
    if (!(W > 60 && H > 60)) {
      host.remove(); host = null; document.body.classList.remove("obs-open");
      raf = setTimeout(() => { if ((location.hash || "") === "#/live") mount(rootEl); }, 80);
      return;
    }
    cv.width = W * dpr; cv.height = H * dpr;
    sim = makeSim(W, H);
    sim.S.onEvent = renderLog;
    const onResize = () => {
      if (!sim || !document.contains(host)) return;
      const [w2, h2] = stage(); if (!(w2 > 60) || !(h2 > 60)) return;
      if (Math.abs(w2 - sim.W) < 2 && Math.abs(h2 - sim.H) < 2) return;
      const fx = w2 / sim.W, fy = h2 / sim.H;
      if (!isFinite(fx) || !isFinite(fy) || fx <= 0 || fy <= 0) { console.warn("obs resize skipped", w2, h2, sim.W, sim.H); return; }
      sim.S.nodes.forEach(n => { n.x *= fx; n.y *= fy; });
      sim.W = w2; sim.H = h2; W = w2; H = h2;
      cv.width = w2 * dpr; cv.height = h2 * dpr;
    };
    addEventListener("resize", onResize);

    const $ = (id) => host.querySelector(id);
    const logEl = $("#obsLog"), statsEl = $("#obsStats"), ribEl = $("#obsRibbon"), candEl = $("#obsCand"), panelEl = $("#obsPanel");

    function renderLog() {
      logEl.innerHTML = sim.S.log.slice(0, 11).map(l => `<div class="${l.cls || ""}">${l.t}</div>`).join("");
    }
    function renderPanel() {
      const S = sim.S;
      if (S.selNode == null && !S.selBlock) { panelEl.hidden = true; return; }
      panelEl.hidden = false;
      panelEl.innerHTML = S.selNode != null ? panelNode(S, S.selNode)
        : panelBlock(S, S.chain.find(b => b.hash === S.selBlock) || (S.pendingFork && [S.pendingFork.a, S.pendingFork.b].find(b => b.hash === S.selBlock)) || S.orphans.map(o => o.block).find(b => b.hash === S.selBlock) || S.chain[0]);
      const x = panelEl.querySelector("#obsPX"); if (x) x.onclick = () => { S.selNode = null; S.selBlock = null; renderPanel(); };
    }

    // interactions
    cv.addEventListener("click", (e) => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const S = sim.S;
      let best = null, bd = 24 * 24;
      S.nodes.forEach(n => { const d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd) { bd = d; best = n.i; } });
      S.selBlock = null;
      S.selNode = best;
      renderPanel();
    });
    ribEl.addEventListener("click", (e) => {
      const b = e.target.closest(".obs-blk"); if (!b) return;
      sim.S.selNode = null; sim.S.selBlock = b.dataset.h; renderPanel();
    });
    $("#obsPause").onclick = () => { sim.S.paused = !sim.S.paused; $("#obsPause").textContent = sim.S.paused ? "▶ play" : "⏸ pause"; };
    $("#obsSpeed").onclick = () => { const seq = [1, 2, 4, 0.5]; sim.S.speed = seq[(seq.indexOf(sim.S.speed) + 1) % seq.length]; $("#obsSpeed").textContent = sim.S.speed + "×"; };
    $("#obsTx").onclick = () => sim.userBroadcast();
    $("#obsTamper").onclick = () => sim.userTamper();
    $("#obsFork").onclick = () => sim.userFork();
    const onKey = (e) => { if (e.key === " " && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $("#obsPause").click(); } };
    addEventListener("keydown", onKey);
    host._cleanup = () => { removeEventListener("keydown", onKey); removeEventListener("resize", onResize); };

    /* ---- guided tour: a narrated pass over the live machine ---- */
    const TOUR = [
      { t: "This is a <em>blockchain network</em>. No server, no headquarters — just strangers' computers, each connected only to its neighbours. Everything that follows happens with nobody in charge.", dur: 8 },
      { t: "Someone, somewhere, just paid someone. Watch the gold pulse <em>gossip</em> from node to node — within seconds, every waiting room on the map holds a copy of that payment.", act: () => sim.userBroadcast(), dur: 9 },
      { t: "Meanwhile the glowing nodes are <em>mining</em>: real SHA-256, live, in your browser — the ticker top-left shows every guess. First to land a hash starting with three zeros seals the next block.", prep: (c) => c.h = sim.S.chain.length, until: (c) => sim.S.chain.length > c.h || sim.S.pendingFork, timeout: 30 },
      { t: "There — a miner won. Its block sweeps outward, every node checks the proof and files it, and the payments inside vanish from every waiting room. That ripple is the ledger updating planet-wide.", dur: 8 },
      { t: "Now the famous failure. Two miners sometimes win at the <em>same instant</em> — half the world hears one block first, half the other. Plum against gold. Nobody is lying; light is just slow.", act: () => sim.userFork(), until: (c) => sim.S.pendingFork, timeout: 30 },
      { t: "The network is split between two honest truths. It doesn't argue — it just keeps mining. Whichever side grows first, wins…", until: (c) => !sim.S.pendingFork, timeout: 45 },
      { t: "…and there's the verdict. The losing block is <em>orphaned</em> — greyed out on the ribbon below — and its payments quietly return to the pool. The fork healed itself. That is consensus.", dur: 9 },
      { t: "One more thing. A liar just joined: it announces a block with <em>no work behind it</em>. Watch its neighbours check the hash, flash red, and refuse to pass it on. Lies die at the first hop.", act: () => sim.userTamper(), dur: 9 },
      { t: "Gossip. Work. Longest chain. That's the entire trick — everything else is detail. Now reach in yourself: click any node to open its mempool, any block to read its real header.", dur: 11 },
    ];
    let tourAlive = false, tourTimer = 0;
    const tourEl = $("#obsTour"), tourText = $("#obsTourText"), tourDots = $("#obsTourDots");
    function endTour() { tourAlive = false; tourEl.hidden = true; try { localStorage.setItem("obs_tour", "1"); } catch (e) {} }
    function startTour() {
      if (tourAlive || !sim) return;
      tourAlive = true; tourEl.hidden = false;
      let i = -1;
      const ctx = {};
      const show = (k) => {
        tourText.classList.remove("tin"); void tourText.offsetWidth;
        tourText.innerHTML = TOUR[k].t; tourText.classList.add("tin");
        tourDots.innerHTML = TOUR.map((_, j) => `<i class="${j <= k ? "on" : ""}"></i>`).join("");
      };
      const advance = () => {
        if (!tourAlive || !document.contains(host)) return;
        i++;
        if (i >= TOUR.length) { endTour(); return; }
        const st = TOUR[i];
        if (st.prep) st.prep(ctx);
        show(i);
        if (st.act) setTimeout(() => { if (tourAlive && sim) st.act(); }, 900);
        const t0 = Date.now();
        const check = () => {
          if (!tourAlive || !document.contains(host)) return;
          const done = st.until ? (st.until(ctx) || (Date.now() - t0) / 1000 > (st.timeout || 30))
            : (Date.now() - t0) / 1000 > (st.dur || 8);
          if (done) advance(); else tourTimer = setTimeout(check, 400);
        };
        tourTimer = setTimeout(check, 400);
      };
      advance();
    }
    $("#obsTourSkip").onclick = endTour;
    $("#obsTourBtn").onclick = startTour;
    const prevCleanup = host._cleanup;
    host._cleanup = () => { prevCleanup(); tourAlive = false; clearTimeout(tourTimer); };
    let auto = true; try { auto = !localStorage.getItem("obs_tour"); } catch (e) {}
    if (auto) setTimeout(() => { if (document.contains(host)) startTour(); }, 1600);

    // main loop
    lastT = performance.now();
    let uiTimer = 0;
    const loop = (t) => {
      if (!document.contains(host)) return;
      // wall-clock dt, clamped loosely: sim keeps real pace even where timers are throttled
      const dt = Math.min(0.5, (t - lastT) / 1000); lastT = t;
      sim.tick(dt);
      draw(cv, ctx, dpr, t);
      uiTimer += dt;
      if (uiTimer > 0.25) {
        uiTimer = 0;
        onResize(); // self-heal if the stage changed size without a window resize event
        statsEl.innerHTML = statsHTML(sim.S);
        ribEl.innerHTML = ribbonHTML(sim.S);
        const c = sim.S.candidate;
        candEl.innerHTML = `node ${c.miner + 1} trying nonce <b>${c.nonce.toLocaleString()}</b> → ${splitZ(c.hash)}`;
        if (!panelEl.hidden) renderPanel();
      }
      // setTimeout, not rAF: keeps the world alive even where rAF is throttled
      raf = setTimeout(() => loop(performance.now()), 33);
    };
    renderLog();
    sim.S.log.unshift({ t: "◉ network online — 26 nodes, 5 miners, difficulty " + sim.S.diff, cls: "info" }); renderLog();
    raf = setTimeout(() => loop(performance.now()), 16);
  }
  const splitZ = (h) => { if (!h) return ""; let z = 0; while (h[z] === "0") z++; return `<span class="gold">${h.slice(0, z)}</span>${h.slice(z, 22)}…`; };

  function unmount() {
    clearTimeout(raf);
    if (host) { if (host._cleanup) host._cleanup(); host.remove(); host = null; }
    document.body.classList.remove("obs-open");
    sim = null;
  }

  /* ---------------- home teaser: tiny ambient net ---------------- */
  function tease(id) {
    const cv = document.getElementById(id); if (!cv) return;
    const ctx = cv.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { const r = cv.parentElement.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + "px"; cv.style.height = r.height + "px"; return [r.width, r.height]; };
    let [W, H] = size();
    const { nodes, edges } = buildTopology(W, H, 16);
    const pulses = [];
    let last = performance.now();
    function frame(t) {
      if (!document.contains(cv)) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.6);
      g.addColorStop(0, COL.bg2); g.addColorStop(1, COL.bg1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1;
      edges.forEach(([a, b]) => { ctx.strokeStyle = COL.edge; ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke(); });
      if (Math.random() < dt * 1.6) { const e = pick(edges); pulses.push({ e, t: 0, flip: Math.random() < 0.5 }); }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += dt * 1.3; if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const [ai, bi] = p.e, A = nodes[p.flip ? bi : ai], B = nodes[p.flip ? ai : bi];
        ctx.fillStyle = COL.gold; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(A.x + (B.x - A.x) * p.t, A.y + (B.y - A.y) * p.t, 2.2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      }
      nodes.forEach(n => { ctx.fillStyle = COL.nodeDim; ctx.beginPath(); ctx.arc(n.x, n.y, 3.4, 0, TAU); ctx.fill(); });
      if (!RM) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  return { mount, unmount, tease, _sim: () => sim };
})();
