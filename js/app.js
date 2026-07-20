/* ============================================================
   app.js: router + ambient canvas backdrops (light theme).
   ============================================================ */
import { VIEWS as V } from './views.js';
import { LESSONS } from './lessons.js';

export const APP = (function () {
  "use strict";

  const _rmq = matchMedia && matchMedia("(prefers-reduced-motion: reduce)");
  let RM = _rmq && _rmq.matches;
  if (_rmq && _rmq.addEventListener) _rmq.addEventListener("change", e => { RM = e.matches; });
  const isDark = () => document.documentElement.dataset.theme === "dark";

  let _starfieldResize = null, _starfieldAnim = null, _heroResize = null, _themeT = null;
  let triggerConfetti = () => {};
  function route() {
    toggleMobileNav(false);
    const h = location.hash || "#/";
    const m = h.match(/^#\/lesson\/(.+)$/);
    const c = h.match(/^#\/chapter\/(.+)$/);
    if (m) { V.lesson(m[1]); const L = LESSONS[m[1]]; document.title = (L ? L.title : "Lesson") + " | The Takshashila Institution"; }
    else if (c) { V.chapterGate(c[1]); document.title = "Chapter | The Takshashila Institution"; }
    else if (h === "#/map") { V.map(); document.title = "The Journey | The Takshashila Institution"; }
    else { V.home(); document.title = "An Interactive Blockchain Course | The Takshashila Institution"; }
    // new view: back to the top, and hand focus to the heading for keyboard/AT users
    scrollTo(0, 0);
    const h1 = document.querySelector("#root h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
    // gentle crossfade between views (skipped under reduced motion)
    if (!RM) { const r = document.getElementById("root"); r.classList.remove("viewin"); void r.offsetWidth; r.classList.add("viewin"); }
  }

  /* ambient drifting dots, subtle on a light page */
  function starfield() {
    const cv = document.getElementById("starfield"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, dots = [], confetti = [];
    // per-theme dot palettes, resolved every frame so a theme toggle takes effect immediately
    const PALETTE = { light: ["98,13,60", "241,162,34"], dark: ["198,59,135", "241,162,34"] };
    let lastW = 0;
    function size() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (W === lastW && dots.length) return; // height-only change (mobile URL bar), so keep the field
      lastW = W; dots = []; const n = Math.min(90, Math.round(W * H / (W < 640 ? 36000 : 18000))); for (let i = 0; i < n; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, a: Math.random(), tw: Math.random() * .015 + .003, vy: Math.random() * .1 + .02, ci: (Math.random() * 2) | 0 }); }
    function frame() {
      const cols = PALETTE[isDark() ? "dark" : "light"];
      ctx.clearRect(0, 0, W, H);
      dots.forEach(s => { s.a += s.tw; const al = .08 + Math.abs(Math.sin(s.a)) * .22; s.y += s.vy; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } ctx.fillStyle = `rgba(${cols[s.ci]},${al})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); });
      
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
      if (!RM) _starfieldAnim = requestAnimationFrame(frame);
    }
    if (_starfieldResize) removeEventListener("resize", _starfieldResize);
    if (_starfieldAnim) cancelAnimationFrame(_starfieldAnim);
    _starfieldResize = size;
    addEventListener("resize", _starfieldResize); frame();
    
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
      const plum = isDark() ? "198,59,135" : "98,13,60", dotAl = isDark() ? 0.4 : 0.32, lineAl = isDark() ? 0.18 : 0.13;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 160) { ctx.strokeStyle = `rgba(${plum},${(1 - d / 160) * lineAl})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      nodes.forEach((n, i) => { ctx.fillStyle = i % 3 === 0 ? "rgba(241,162,34,0.5)" : `rgba(${plum},${dotAl})`; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill(); });
      if (!RM) requestAnimationFrame(frame); }
    size(true); requestAnimationFrame(() => size(true)); setTimeout(() => size(true), 120);
    if (_heroResize) removeEventListener("resize", _heroResize);
    let hw = 0;
    _heroResize = () => { if (!document.contains(cv)) return; const w = dims()[0]; size(w !== hw); hw = w; };
    addEventListener("resize", _heroResize); frame();
  }

  function toggleTheme() {
    const newTheme = isDark() ? "light" : "dark";
    const de = document.documentElement;
    if (!RM) { de.classList.add("theming"); clearTimeout(_themeT); _themeT = setTimeout(() => de.classList.remove("theming"), 320); }
    if (newTheme === "dark") de.dataset.theme = "dark";
    else de.removeAttribute("data-theme");
    localStorage.setItem("theme", newTheme);
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    document.querySelectorAll(".theme-toggle").forEach(btn => { btn.innerHTML = newTheme === "dark" ? sunSvg : moonSvg; btn.setAttribute("aria-pressed", String(newTheme === "dark")); });
  }

  /* mobile nav: one controller for class state, aria-expanded, scroll lock, and Esc */
  function toggleMobileNav(force) {
    const nav = document.getElementById("mobileNav"), burger = document.querySelector(".hamburger");
    if (!nav) return;
    const open = force != null ? !!force : !nav.classList.contains("active");
    nav.classList.toggle("active", open);
    if (burger) { burger.classList.toggle("active", open); burger.setAttribute("aria-expanded", String(open)); }
    if (document.body) document.body.style.overflow = open ? "hidden" : "";
  }

  function boot() {
    if (localStorage.getItem("theme") === "dark") document.documentElement.dataset.theme = "dark";
    starfield(); addEventListener("hashchange", route); route();
    // keyboard: ← / → move between lessons
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") { const mn = document.getElementById("mobileNav"); if (mn && mn.classList.contains("active")) { toggleMobileNav(false); return; } }
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (!location.hash.startsWith("#/lesson/")) return;
      if (e.key === "ArrowRight") { const b = document.getElementById("lNext"); if (b) b.click(); }
      else if (e.key === "ArrowLeft") { const b = document.getElementById("lPrev"); if (b && !b.disabled) b.click(); }
    });
    
    // Global event delegation for data-action and data-go
    document.addEventListener("click", (e) => {
      const act = e.target.closest("[data-action]");
      if (act) {
        if (act.dataset.action === "toggleTheme") toggleTheme();
        else if (act.dataset.action === "toggleMobileNav") toggleMobileNav();
      }
      const goEl = e.target.closest("[data-go]:not([href])");
      if (goEl) {
        e.preventDefault();
        const to = goEl.dataset.go;
        if (to.startsWith("http")) window.open(to, "_blank");
        else location.hash = to;
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  return { heroCanvas, confetti: () => triggerConfetti(), toggleTheme, toggleMobileNav };
})();
