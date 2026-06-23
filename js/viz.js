/* ============================================================
   viz.js — renders the living blockchain from CHAIN events.
   Incremental: appends blocks as they're mined, updates miners,
   mempool, the mining "spotlight", and the block inspector.
   ============================================================ */
window.VIZ = (function () {
  "use strict";
  const C = window.CHAIN;
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const $ = (s) => document.querySelector(s);
  const short = (s, a = 7, b = 5) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : s;
  const fmt = (n) => Math.round(n).toLocaleString();
  const splitZ = (h) => { let z = 0; while (h[z] === "0") z++; return `<span class="z">${h.slice(0, z)}</span>${h.slice(z)}`; };
  const lbl = (addr) => { const a = C.state.accounts[addr]; return a ? a.label : C.addrShort(addr); };

  let chainScroll, selBlock = null, onOpenCb = null;
  function onInspect(fn) { onOpenCb = fn; }

  /* ---------- toast + confetti ---------- */
  function toast(msg) {
    let t = $("#toast"); if (!t) { t = el("div"); t.id = "toast"; document.body.appendChild(t); }
    t.innerHTML = `<span style="font-size:17px">✨</span> ${msg}`; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2800);
  }
  function confetti() {
    let c = $("#confetti"); if (!c) { c = el("canvas"); c.id = "confetti"; document.body.appendChild(c); }
    const ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    const cols = ["#5b5bf0", "#0bb5c9", "#10b981", "#f3920b", "#f43f5e", "#a855f7"];
    const ps = Array.from({ length: 120 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 260, y: innerHeight / 2.5, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 4, s: 5 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1 }));
    let f = 0; (function run() { ctx.clearRect(0, 0, c.width, c.height); f++; ps.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .012; ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); }); if (f < 120) requestAnimationFrame(run); else ctx.clearRect(0, 0, c.width, c.height); })();
  }

  /* ---------- topbar stats ---------- */
  function renderStats() {
    const s = C.state;
    $("#stHeight").textContent = "#" + s.chain[s.chain.length - 1].height;
    $("#stDiff").textContent = s.difficulty + " zeros";
    $("#stHps").textContent = s.mode === "pos" ? "—" : fmt(s.stats.hps) + " H/s";
    $("#stTime").textContent = s.stats.avgBlockTime ? s.stats.avgBlockTime.toFixed(1) + "s" : "—";
    $("#stMempool").textContent = s.mempool.length;
    const en = $("#stEnergy"); if (en) en.textContent = s.mode === "pos" ? "~0%" : "100%";
  }

  /* ---------- miners ---------- */
  function renderMiners() {
    const wrap = $("#minersStrip"); wrap.innerHTML = "";
    const total = C.totalHP();
    C.state.miners.forEach(m => {
      const pct = Math.round(m.hp / total * 100);
      const card = el("div", "miner" + (m.isYou ? " you" : ""), `
        <div class="top"><span class="swatch" style="background:${m.color}"></span><span class="nm">${m.name}${m.isYou ? " (you)" : ""}</span></div>
        <div class="hp"><i style="width:${pct}%;background:${m.color}"></i></div>
        <div class="hpl">${pct}% hash power</div>
        <div class="att" data-att="${m.id}"></div>`);
      card.dataset.miner = m.id;
      wrap.appendChild(card);
    });
  }
  function flashWinner(block) {
    const m = C.state.miners.find(x => x.color === block.minerColor && x.name === block.minerName) || C.state.miners.find(x => x.addr === block.minerAddr);
    if (!m) return; const card = document.querySelector(`.miner[data-miner="${m.id}"]`); if (card) { card.classList.remove("win"); void card.offsetWidth; card.classList.add("win"); }
  }

  /* ---------- spotlight ---------- */
  function renderSpotlight(d) {
    const h = $("#spotHash"); if (!h) return;
    if (C.state.mode === "pos") { h.innerHTML = `<span style="color:#79e0c0">Proof of Stake — proposer chosen by stake, no hashing</span>`; $("#spotNonce").textContent = ""; return; }
    h.innerHTML = splitZ(d.preview || "".padEnd(64, "0"));
    $("#spotNonce").textContent = "nonce " + fmt(d.nonce);
  }

  /* ---------- the chain ---------- */
  function blockEl(b, isNew) {
    const wrap = el("div", "blk" + (isNew ? " new" : "") + (selBlock && selBlock.hash === b.hash ? " sel" : ""));
    wrap.dataset.hash = b.hash; wrap.dataset.height = b.height;
    const tag = b.height === 0 ? "GENESIS" : (b.minerIsYou ? "YOU MINED" : (b._txObjs && b._txObjs.length ? b._txObjs.length + " tx" : "0 tx"));
    wrap.innerHTML = `
      <div class="stripe" style="background:${b.minerColor || "#121624"}"></div>
      <div class="bd">
        <div class="h-row"><span class="height">#${b.height}</span><span class="tag">${tag}</span></div>
        <div class="field"><div class="k">block hash</div><div class="v hash">${short(b.hash, 10, 6)}</div></div>
        <div class="field"><div class="k">prev hash</div><div class="v">${short(b.prevHash, 10, 6)}</div></div>
        <div class="field"><div class="k">nonce</div><div class="v">${fmt(b.nonce)}</div></div>
        <div class="miner-by"><span class="swatch" style="background:${b.minerColor || "#121624"}"></span> mined by ${b.minerName || "—"}</div>
      </div>`;
    wrap.onclick = () => openInspector(b);
    return wrap;
  }
  function renderChainFull() {
    chainScroll.innerHTML = "";
    C.state.chain.forEach((b, i) => { if (i > 0) chainScroll.appendChild(el("div", "chain-link")); chainScroll.appendChild(blockEl(b, false)); });
    scrollEnd();
  }
  function appendBlock(b) {
    if (C.state.chain.length > 1) chainScroll.appendChild(el("div", "chain-link"));
    chainScroll.appendChild(blockEl(b, true));
    // cap DOM nodes for perf
    while (chainScroll.children.length > 60) chainScroll.removeChild(chainScroll.firstChild);
    scrollEnd();
  }
  function scrollEnd() { chainScroll.scrollTo({ left: chainScroll.scrollWidth, behavior: "smooth" }); }

  /* ---------- mempool ---------- */
  function renderMempool() {
    const wrap = $("#mpChips"); wrap.innerHTML = "";
    $("#mpCount").textContent = C.state.mempool.length + " pending";
    if (!C.state.mempool.length) { wrap.appendChild(el("div", "muted small", "mempool empty — waiting for transactions…")); return; }
    C.state.mempool.slice().sort((a, b) => b.fee - a.fee).forEach(tx => {
      const yours = tx.from === (C.state.you && C.state.you.address);
      const chip = el("div", "tx-chip" + (yours ? " yours" : ""), `
        <span class="a">${lbl(tx.from)}</span><span style="color:var(--ink-4)">→</span><span class="a">${tx.toLabel || lbl(tx.to)}</span>
        <span class="amt">${(+tx.amount).toFixed(1)}</span><span class="fee">⛽${(+tx.fee).toFixed(1)}</span>`);
      wrap.appendChild(chip);
    });
  }

  /* ---------- block inspector ---------- */
  function openInspector(b) {
    selBlock = b;
    document.querySelectorAll(".blk.sel").forEach(e => e.classList.remove("sel"));
    const node = document.querySelector(`.blk[data-hash="${b.hash}"]`); if (node) node.classList.add("sel");
    const insp = $("#inspector");
    const recomputed = C.hashBlock(b);
    const txs = (b._txObjs && b._txObjs.length) ? b._txObjs : (b.txs || []).map(t => ({ raw: t }));
    $("#inspBody").innerHTML = `
      <div class="insp-sec"><div class="sl">Block header — the ${b.height === 0 ? "genesis" : ""} fields that get hashed</div>
        <div class="kvs">
          <div class="kv"><span class="k">height</span><span class="v">#${b.height}</span></div>
          <div class="kv"><span class="k">timestamp</span><span class="v">${new Date(b.timestamp).toLocaleTimeString()}</span></div>
          <div class="kv"><span class="k">difficulty</span><span class="v">${b.difficulty} leading zeros</span></div>
          <div class="kv"><span class="k">nonce</span><span class="v brand">${fmt(b.nonce)}</span></div>
          <div class="kv"><span class="k">mined by</span><span class="v">${b.minerName || "—"}</span></div>
        </div></div>
      <div class="insp-sec"><div class="sl">Previous block hash — the link in the chain</div><div class="field-box">${b.prevHash}</div></div>
      <div class="insp-sec"><div class="sl">Merkle root — fingerprint of all ${txs.length} transaction(s)</div>
        <div class="field-box" id="inspMerkle">${b.merkleRoot}</div>
        <button class="btn ghost small" id="inspVerifyMerkle" style="margin-top:8px">↻ Recompute Merkle root from txs</button>
        <div class="small" id="inspMerkleMsg" style="margin-top:6px"></div></div>
      <div class="insp-sec"><div class="sl">This block's hash — must start with ${b.difficulty} zeros</div>
        <div class="field-box hash">${splitZ(b.hash)}</div>
        <button class="btn ghost small" id="inspRehash" style="margin-top:8px">↻ Re-hash the header &amp; verify</button>
        <div class="small" id="inspRehashMsg" style="margin-top:6px"></div></div>
      <div class="insp-sec"><div class="sl">Transactions (${txs.length})</div>${txs.length ? txs.map(renderInspTx).join("") : '<div class="muted small">No transactions in this block.</div>'}</div>`;
    insp.classList.add("open");
    if (onOpenCb) onOpenCb(b);
    $("#inspVerifyMerkle") && ($("#inspVerifyMerkle").onclick = () => { const r = C.merkleRoot((b.txs && b.txs.length) ? b.txs : ["empty"]); $("#inspMerkleMsg").innerHTML = r === b.merkleRoot ? `<span style="color:var(--green)">✓ matches — the transactions are intact.</span>` : `<span style="color:var(--red)">✗ mismatch — txs were altered.</span>`; });
    $("#inspRehash") && ($("#inspRehash").onclick = () => { const ok = recomputed === b.hash && recomputed.startsWith("0".repeat(b.difficulty)); $("#inspRehashMsg").innerHTML = ok ? `<span style="color:var(--green)">✓ hash verified, meets difficulty. Valid block.</span>` : `<span style="color:var(--red)">✗ invalid.</span>`; });
  }
  function renderInspTx(tx) {
    if (tx.raw) return `<div class="insp-tx"><span class="mono">${tx.raw}</span></div>`;
    const yours = tx.from === (C.state.you && C.state.you.address);
    return `<div class="insp-tx" style="${yours ? 'border-color:var(--brand)' : ''}">
      <div class="r1"><b>${lbl(tx.from)} → ${tx.toLabel || lbl(tx.to)}</b><span>${(+tx.amount).toFixed(2)} <span class="muted">+${(+tx.fee).toFixed(2)} fee</span></span></div>
      <div class="mono" style="margin-top:4px">tx ${short(tx.hash, 10, 6)} · nonce ${tx.nonce} ${tx.sig ? "· sig " + short(tx.sig, 8, 4) : "· (simulated)"} ${yours ? '· <span style="color:var(--brand)">YOURS</span>' : ''}</div></div>`;
  }
  function closeInspector() { $("#inspector").classList.remove("open"); selBlock = null; document.querySelectorAll(".blk.sel").forEach(e => e.classList.remove("sel")); }

  /* ---------- guided spotlight ring ---------- */
  let ring = null;
  function highlight(selector) {
    clearHighlight();
    const target = document.querySelector(selector); if (!target) return;
    const r = target.getBoundingClientRect();
    ring = el("div", "spotlight-ring"); document.body.appendChild(ring);
    Object.assign(ring.style, { left: (r.left - 6) + "px", top: (r.top - 6) + "px", width: (r.width + 12) + "px", height: (r.height + 12) + "px" });
  }
  function clearHighlight() { if (ring) { ring.remove(); ring = null; } }

  /* ---------- fork visual ---------- */
  function showFork(alt) {
    // append a competing block visually next to the tip
    const link = el("div", "chain-link"); link.style.background = alt.minerColor;
    const node = blockEl(alt, true); node.style.marginTop = "120px"; node.dataset.fork = "1";
    chainScroll.appendChild(link); chainScroll.appendChild(node); scrollEnd();
  }

  /* ---------- wire up ---------- */
  function init() {
    chainScroll = $("#chainScroll");
    renderChainFull(); renderMiners(); renderMempool(); renderStats(); renderSpotlight({ preview: "0".repeat(64), nonce: 0 });
    C.on("block", (b) => { appendBlock(b); flashWinner(b); renderStats(); renderMempool(); });
    C.on("mempool", () => { renderMempool(); renderStats(); });
    C.on("miners", () => renderMiners());
    C.on("accounts", () => {});
    C.on("difficulty", () => renderStats());
    C.on("mode", () => { renderStats(); renderSpotlight({}); });
    let tk = 0;
    C.on("tick", (d) => { renderSpotlight(d); if (++tk % 4 === 0) { renderStats(); } });
    C.on("fork", ({ alt }) => showFork(alt));
    C.on("reorg", () => renderChainFull());
    $("#inspClose").onclick = closeInspector;
  }

  return { init, openInspector, closeInspector, highlight, clearHighlight, toast, confetti, renderMiners, renderMempool, renderStats, scrollEnd, onInspect };
})();
