/* ============================================================
   app.js — router, ambient starfield, hero animation, celebrations.
   ============================================================ */
window.APP = (function () {
  "use strict";
  const V = window.VIEWS;

  /* ---- router ---- */
  function route() {
    const h = location.hash || "#/";
    const m = h.match(/^#\/lesson\/(.+)$/);
    window.scrollTo(0, 0);
    if (m) V.lesson(m[1]);
    else if (h === "#/map") V.map();
    else V.home();
  }

  /* ---- ambient starfield (whole-page backdrop) ---- */
  function starfield() {
    const cv = document.getElementById("starfield"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, stars = [];
    function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); stars = []; const n = Math.min(150, Math.round(W * H / 11000)); for (let i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, a: Math.random(), tw: Math.random() * .02 + .004, vy: Math.random() * .12 + .02 }); }
    function frame() { ctx.clearRect(0, 0, W, H); stars.forEach(s => { s.a += s.tw; const al = .25 + Math.abs(Math.sin(s.a)) * .55; s.y += s.vy; if (s.y > H) s.y = 0; ctx.fillStyle = `rgba(190,195,255,${al})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }); requestAnimationFrame(frame); }
    size(); addEventListener("resize", size); frame();
  }

  /* ---- hero constellation (home) ---- */
  function heroCanvas() {
    const cv = document.getElementById("heroCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, nodes = [], alive = true;
    function size() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); nodes = []; for (let i = 0; i < 40; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.8 + .9 }); }
    function frame() { if (!alive || !document.getElementById("heroCanvas")) { alive = false; return; } ctx.clearRect(0, 0, W, H); nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 150) { ctx.strokeStyle = `rgba(139,124,255,${(1 - d / 150) * 0.22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      nodes.forEach(n => { ctx.fillStyle = "rgba(185,180,255,0.6)"; ctx.shadowBlur = 9; ctx.shadowColor = "rgba(139,124,255,0.7)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0; });
      requestAnimationFrame(frame); }
    size(); addEventListener("resize", () => { if (document.getElementById("heroCanvas")) size(); }); alive = true; frame();
  }

  /* ---- celebrations ---- */
  function celebrate(msg) {
    let t = document.getElementById("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.innerHTML = `<span style="color:var(--gold);font-weight:700">★</span> ${msg}`; t.classList.add("show");
    clearTimeout(celebrate._t); celebrate._t = setTimeout(() => t.classList.remove("show"), 2800);
  }
  function confetti() {
    let c = document.getElementById("confetti"); if (!c) { c = document.createElement("canvas"); c.id = "confetti"; document.body.appendChild(c); }
    const ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
    const cols = ["#8b7cff", "#3fe0cf", "#46d98a", "#f5b13d", "#ff7eb6"];
    const ps = Array.from({ length: 130 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 280, y: innerHeight / 2.4, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, s: 5 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1 }));
    let f = 0; (function run() { ctx.clearRect(0, 0, c.width, c.height); f++; ps.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .011; ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); }); if (f < 130) requestAnimationFrame(run); else ctx.clearRect(0, 0, c.width, c.height); })();
  }

  function boot() { starfield(); addEventListener("hashchange", route); route(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  return { heroCanvas, celebrate, confetti };
})();
