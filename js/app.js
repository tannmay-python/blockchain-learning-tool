/* app.js — shell for the focused-module primer: rail, routing, nav, hero. */
(function () {
  "use strict";
  const M = window.MODULES;
  const $ = (s) => document.querySelector(s);
  const PARTS = { A: "Foundations", B: "Hashing", C: "Public-key crypto", D: "Data structures", "D/E": "Data structures", E: "Proof of Work", F: "Consensus", G: "Attacks", H: "Proof of Stake" };
  let idx = 0;

  function renderRail() {
    const r = $("#rail"); r.innerHTML = `<div class="rail-kicker">The modules</div>`;
    M.forEach((m, i) => {
      const node = document.createElement("div");
      node.className = "chap" + (i === idx ? " cur" : "");
      node.innerHTML = `${i < M.length - 1 ? '<div class="rail-line"></div>' : ''}<div class="ix">${i + 1}</div><div class="tx"><div class="pt">Part ${m.part}</div><div class="t">${m.title}</div></div>`;
      node.onclick = () => go(i); r.appendChild(node);
    });
  }

  function render() {
    const m = M[idx];
    $("#topLabel").textContent = `Part ${m.part} — ${PARTS[m.part] || ""}`;
    $("#narrKick").textContent = `Module ${idx + 1} of ${M.length} · Part ${m.part}`;
    $("#narrTitle").textContent = m.title;
    const narr = $("#narrBody"); narr.innerHTML = m.narr(); narr.scrollTop = 0; narr.classList.remove("fadein"); void narr.offsetWidth; narr.classList.add("fadein");
    const stage = $("#moduleStage"); stage.innerHTML = "";
    try { m.stage(stage); } catch (e) { console.error("module", m.id, e); stage.innerHTML = `<div class="mhold"><div class="aside">This module hit an error: ${e.message}</div></div>`; }
    $("#gPrev").disabled = idx === 0;
    const nx = $("#gNext"); nx.disabled = idx === M.length - 1; nx.textContent = idx === M.length - 1 ? "Done" : "Next →";
    renderRail();
  }
  window.__rerender = render;

  function go(i) { idx = Math.max(0, Math.min(M.length - 1, i)); render(); }

  /* hero constellation */
  function hero() {
    const cv = $("#heroCanvas"); if (!cv) return () => {};
    const ctx = cv.getContext("2d"); let W, H, dpr, raf, nodes = [], alive = true;
    function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); nodes = []; for (let i = 0; i < 46; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.8 + .8 }); }
    function frame() { if (!alive) return; ctx.clearRect(0, 0, W, H); nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 168) { ctx.strokeStyle = `rgba(139,124,255,${(1 - d / 168) * 0.18})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      nodes.forEach(n => { ctx.fillStyle = "rgba(180,175,255,0.5)"; ctx.shadowBlur = 8; ctx.shadowColor = "rgba(139,124,255,0.6)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0; });
      raf = requestAnimationFrame(frame); }
    size(); addEventListener("resize", size); frame(); return () => { alive = false; cancelAnimationFrame(raf); };
  }

  function boot() {
    render();
    const stopHero = hero();
    $("#heroStart").onclick = () => { $("#hero").classList.add("gone"); setTimeout(() => { $("#hero").style.display = "none"; stopHero(); }, 850); };
    const togglePresent = () => { const on = $("#app").classList.toggle("present"); $("#ctrlPresent").classList.toggle("on", on); };
    $("#ctrlPresent").onclick = togglePresent;
    const toggleFull = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen && document.exitFullscreen(); };
    $("#ctrlFull").onclick = toggleFull;
    $("#gPrev").onclick = () => go(idx - 1); $("#gNext").onclick = () => go(idx + 1);
    addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(idx - 1);
      else if (e.key >= "1" && e.key <= "9" && +e.key <= M.length) go(+e.key - 1);
      else if (e.key.toLowerCase() === "p") togglePresent();
      else if (e.key.toLowerCase() === "f") toggleFull();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
