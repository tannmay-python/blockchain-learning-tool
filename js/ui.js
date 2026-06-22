/* ui.js — DOM + component helpers shared by every lesson. */
window.UI = (function () {
  "use strict";
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

  const fmt = (n) => n.toLocaleString();
  const short = (s, a = 8, b = 6) => s.length > a + b + 2 ? s.slice(0, a) + "…" + s.slice(-b) : s;
  const splitZeros = (hash) => { let z = 0; while (hash[z] === "0") z++; return `<span class="z">${hash.slice(0, z)}</span>${hash.slice(z)}`; };

  /* reward toast */
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = el("div"); t.id = "toast"; document.body.appendChild(t); }
    t.innerHTML = `<span style="font-size:18px">🎉</span> ${msg}`;
    t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* lightweight confetti burst */
  function confetti() {
    let c = document.getElementById("confetti");
    if (!c) { c = el("canvas"); c.id = "confetti"; document.body.appendChild(c); }
    const ctx = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    const colors = ["#5b54e8", "#12a150", "#e08600", "#e5484d", "#2f6df6", "#8b7bff"];
    const parts = Array.from({ length: 130 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 240, y: innerHeight / 2.4,
      vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 5,
      s: 5 + Math.random() * 7, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1
    }));
    let frames = 0;
    (function run() {
      ctx.clearRect(0, 0, c.width, c.height);
      frames++;
      parts.forEach((p) => { p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.012;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore(); });
      if (frames < 130) requestAnimationFrame(run); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* standard callouts — return elements (lessons append them directly) */
  function goal(text) { return h(`<div class="callout goal"><span class="ic">🎯</span><div><b>Goal:</b> ${text}</div></div>`); }
  function insight(text) { return h(`<div class="callout insight"><span class="ic">💡</span><div>${text}</div></div>`); }
  function note(text) { return h(`<div class="callout note"><span class="ic">ℹ️</span><div>${text}</div></div>`); }

  /* a game card wrapper */
  function gameCard(label, innerHTML) {
    return `<div class="card game"><div class="card-label"><span class="pin"></span>${label}</div>${innerHTML}</div>`;
  }

  function logLine(logEl, html, cls) { const d = el("div", cls || ""); d.innerHTML = html; logEl.appendChild(d); logEl.scrollTop = 1e9; }

  return { el, h, $, $$, fmt, short, splitZeros, toast, confetti, goal, insight, note, gameCard, logLine };
})();
