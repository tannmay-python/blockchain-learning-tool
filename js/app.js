/* ============================================================
   app.js — router + ambient canvas backdrops (light theme).
   ============================================================ */
window.APP = (function () {
  "use strict";
  const V = window.VIEWS;

  const RM = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function route() {
    const h = location.hash || "#/";
    const m = h.match(/^#\/lesson\/(.+)$/);
    const c = h.match(/^#\/chapter\/(.+)$/);
    if (m) { V.lesson(m[1]); const L = window.LESSONS[m[1]]; document.title = (L ? L.title : "Lesson") + " · The Blockchain Course"; }
    else if (c) { V.chapterGate(c[1]); document.title = "Chapter · The Blockchain Course"; }
    else if (h === "#/map") { V.map(); document.title = "The Journey · The Blockchain Course"; }
    else { V.home(); document.title = "The Blockchain Course — learn blockchain by doing"; }
    // gentle crossfade between views (skipped under reduced motion)
    if (!RM) { const r = document.getElementById("root"); r.classList.remove("viewin"); void r.offsetWidth; r.classList.add("viewin"); }
  }

  let triggerConfetti = () => {};
  /* ambient drifting dots — subtle on a light page */
  function starfield() {
    const cv = document.getElementById("starfield"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, dots = [], confetti = [];
    const cols = ["98,13,60", "241,162,34"];
    function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dots = []; const n = Math.min(90, Math.round(W * H / 18000)); for (let i = 0; i < n; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, a: Math.random(), tw: Math.random() * .015 + .003, vy: Math.random() * .1 + .02, c: cols[(Math.random() * cols.length) | 0] }); }
    function frame() { 
      ctx.clearRect(0, 0, W, H); 
      dots.forEach(s => { s.a += s.tw; const al = .08 + Math.abs(Math.sin(s.a)) * .22; s.y += s.vy; if (s.vx) s.x += s.vx; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } ctx.fillStyle = `rgba(${s.c},${al})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }); 
      if (confetti.length) {
        let active = [];
        confetti.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.t += p.tr;
          if (p.y < H + 20) {
            active.push(p);
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t); ctx.fillStyle = p.c; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
          }
        });
        confetti = active;
      }
      if (!RM) requestAnimationFrame(frame); 
    }
    size(); addEventListener("resize", size); frame();
    triggerConfetti = () => { 
      const colors = ["#f1a222", "#620d3c", "#2e9e6b", "#d2384f", "#2f6df6"];
      for(let i=0; i<150; i++) confetti.push({ x: Math.random()*W, y: Math.random() * -H * 0.5 - 20, w: Math.random()*8+6, h: Math.random()*12+8, vx: (Math.random()-0.5)*10, vy: Math.random()*4, t: Math.random()*6, tr: (Math.random()-0.5)*0.3, c: colors[Math.floor(Math.random()*colors.length)] }); 
    };
  }

  /* hero constellation (plum + marigold on light) */
  function heroCanvas() {
    const cv = document.getElementById("heroCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, nodes = [];
    function dims() { const h = cv.closest(".hero"); return h ? [h.clientWidth || innerWidth, h.clientHeight || innerHeight] : [innerWidth, innerHeight]; }
    function size(reseed) {
      [W, H] = dims(); dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reseed || !nodes.length) { const n = Math.round(W * H / 26000); nodes = []; for (let i = 0; i < n; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 2 + 1 }); }
    }
    function frame() { if (!document.contains(cv)) return; ctx.clearRect(0, 0, W, H); nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1; });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 160) { ctx.strokeStyle = `rgba(98,13,60,${(1 - d / 160) * 0.13})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      nodes.forEach((n, i) => { ctx.fillStyle = i % 3 === 0 ? "rgba(241,162,34,0.5)" : "rgba(98,13,60,0.32)"; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); });
      if (!RM) requestAnimationFrame(frame); }
    size(true); requestAnimationFrame(() => size(true)); setTimeout(() => size(true), 120);
    if (window._heroResize) removeEventListener("resize", window._heroResize);
    window._heroResize = () => { if (document.contains(cv)) size(true); };
    addEventListener("resize", window._heroResize); frame();
  }

  function toggleTheme() {
    const isDark = document.documentElement.dataset.theme === "dark";
    const newTheme = isDark ? "light" : "dark";
    if (newTheme === "dark") document.documentElement.dataset.theme = "dark";
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", newTheme);
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    document.querySelectorAll(".theme-toggle").forEach(btn => btn.innerHTML = newTheme === "dark" ? sunSvg : moonSvg);
  }

  function boot() {
    if (localStorage.getItem("theme") === "dark") document.documentElement.dataset.theme = "dark";
    starfield(); addEventListener("hashchange", route); route();
    // keyboard: ← / → move between lessons
    addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (!location.hash.startsWith("#/lesson/")) return;
      if (e.key === "ArrowRight") { const b = document.getElementById("lNext"); if (b) b.click(); }
      else if (e.key === "ArrowLeft") { const b = document.getElementById("lPrev"); if (b && !b.disabled) b.click(); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  return { heroCanvas, confetti: () => triggerConfetti(), toggleTheme };
})();
