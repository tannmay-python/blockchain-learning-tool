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

  function route() {
    toggleMobileNav(false);
    const h = location.hash || "#/";
    const m = h.match(/^#\/lesson\/(.+)$/);
    const c = h.match(/^#\/chapter\/(.+)$/);
    if (m) { V.lesson(m[1]); const L = LESSONS[m[1]]; document.title = (L ? L.title : "Lesson") + " · The Blockchain Course"; }
    else if (c) { V.chapterGate(c[1]); document.title = "Chapter · The Blockchain Course"; }
    else if (h === "#/map") { V.map(); document.title = "The Journey · The Blockchain Course"; }
    else { V.home(); document.title = "The Blockchain Course: learn blockchain by doing"; }
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
    const ctx = cv.getContext("2d"); let W, H, dpr, dots = [];
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
      if (!RM) requestAnimationFrame(frame);
    }
    size(); addEventListener("resize", size); frame();
  }

  /* ------------------------------------------------------------------
     Celebration burst. Its own full-opacity layer: the starfield canvas
     sits at opacity .5, which washed the old confetti out. Two angled
     cones fire from the element that earned them (the score dial), so
     the burst reads as coming from the result, not raining on the page.
     ------------------------------------------------------------------ */
  const FX = (function () {
    let cv = null, ctx = null, W = 0, H = 0, dpr = 1, bits = [], running = false;
    const R = Math.random;
    /* brand palette; a couple of tints so the spray has depth */
    const COL = {
      light: ["#f1a222", "#f7c064", "#620d3c", "#8a2057", "#1e7350", "#fdedcf"],
      dark:  ["#f7c064", "#f1a222", "#e264a6", "#c74a88", "#5cd39d", "#f9cd80"],
    };

    function ensure() {
      if (cv) return;
      cv = document.createElement("canvas");
      cv.id = "fxLayer"; cv.setAttribute("aria-hidden", "true");
      document.body.appendChild(cv);
      ctx = cv.getContext("2d");
      size(); addEventListener("resize", size);
    }
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      /* measure the layer's own box: it shares the coordinate space with the
         getBoundingClientRect() of whatever element we burst from */
      /* clientWidth/Height is the CSS viewport, the same space getBoundingClientRect()
         reports in, so a burst origin taken from an element lands where we draw it */
      const de = document.documentElement;
      const w = de.clientWidth || innerWidth || 0;
      const h = de.clientHeight || innerHeight || 0;
      if (!w || !h) return false;
      if (w === W && h === H && cv.width) return true; // nothing moved: keep the backing store
      W = w; H = h;
      cv.width = W * dpr; cv.height = H * dpr;
      /* pin the CSS box to the same units W/H were measured in, so canvas
         coordinates and getBoundingClientRect() coordinates stay in step
         (same approach as heroCanvas) */
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    /* one piece: a ribbon that tumbles on its own axis, with drag and sway */
    function piece(x, y, angle, speed, cols) {
      const sq = R() < .18;
      return {
        x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        w: sq ? R() * 2.5 + 3.5 : R() * 2 + 3,
        h: sq ? R() * 2.5 + 3.5 : R() * 4 + 6,
        round: R() < .12,
        spin: R() * 6.283, spinV: (R() - .5) * .22,
        flip: R() * 6.283, flipV: R() * .16 + .07, // fake 3D: width scales as it tumbles
        sway: R() * 6.283, swayV: R() * .05 + .02, swayA: R() * .5 + .2,
        life: 0, span: R() * 70 + 110,
        c: cols[(R() * cols.length) | 0],
      };
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      const next = [];
      for (const p of bits) {
        p.life++;
        p.vy += .26;                  // gravity
        p.vx *= .95; p.vy *= .96;     // heavy air drag: the launch dies fast, then it flutters down
        p.sway += p.swayV;
        p.x += p.vx + Math.sin(p.sway) * p.swayA;
        p.y += p.vy;
        p.spin += p.spinV; p.spinV *= .995;
        p.flip += p.flipV;
        if (p.y > H + 30 || p.life > p.span) continue;
        next.push(p);
        // fade out over the last third of the life, so nothing pops out of existence
        const t = p.life / p.span;
        ctx.globalAlpha = t > .66 ? 1 - (t - .66) / .34 : 1;
        const sx = Math.abs(Math.cos(p.flip));   // edge-on = thin sliver
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.scale(sx < .12 ? .12 : sx, 1);
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      bits = next;
      if (bits.length) requestAnimationFrame(frame);
      else { running = false; ctx.clearRect(0, 0, W, H); }
    }

    /* originEl: burst from that element's centre. Falls back to mid-viewport. */
    return function burst(originEl) {
      if (RM) return;
      ensure();
      if (!size()) return; // viewport not laid out yet; nothing sensible to draw into
      let ox = W / 2, oy = H * .38;
      if (originEl && originEl.getBoundingClientRect) {
        const r = originEl.getBoundingClientRect();
        if (r.width || r.height) { ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
      }
      const cols = COL[isDark() ? "dark" : "light"];
      const N = innerWidth < 640 ? 44 : 72;
      for (let i = 0; i < N; i++) {
        // two cones fired up and outward, ~26° of spread each
        const dir = i % 2 ? 1 : -1;
        const angle = (dir > 0 ? -1.02 : -2.12) + (R() - .5) * .9;
        const speed = R() * 6 + 7;
        bits.push(piece(ox + (R() - .5) * 24, oy + (R() - .5) * 12, angle, speed, cols));
      }
      if (!running) { running = true; requestAnimationFrame(frame); }
    };
  })();

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
    if (window._heroResize) removeEventListener("resize", window._heroResize);
    let hw = 0;
    window._heroResize = () => { if (!document.contains(cv)) return; const w = dims()[0]; size(w !== hw); hw = w; };
    addEventListener("resize", window._heroResize); frame();
  }

  function toggleTheme() {
    const isDark = document.documentElement.dataset.theme === "dark";
    const newTheme = isDark ? "light" : "dark";
    const de = document.documentElement;
    if (!RM) { de.classList.add("theming"); clearTimeout(window._themeT); window._themeT = setTimeout(() => de.classList.remove("theming"), 320); }
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
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  return { heroCanvas, confetti: (originEl) => FX(originEl), toggleTheme, toggleMobileNav };
})();
window.APP = APP;
