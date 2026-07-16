/* ============================================================
   views.js — Home, the Journey map, and Lesson explorables.
   No points, no levels — just clean progress + a lot to play with.
   ============================================================ */
window.VIEWS = (function () {
  "use strict";
  const S = window.STORE, L = window.LESSONS;
  const root = () => document.getElementById("root");
  const go = (h) => { location.hash = h; };
  const LOGO = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.6" stroke="#fff" stroke-width="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.6" stroke="#fff" stroke-width="1.7"/><path d="M10 6.5h2.5A1.5 1.5 0 0 1 14 8v6" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;

  function progMini() {
    const d = S.totalDone(), t = S.lessonsTotal;
    return `<div class="progmini"><span>${d} / ${t}</span><div class="bar"><i style="width:${(d / t * 100).toFixed(0)}%"></i></div></div>`;
  }
  function nav(active) {
    return `<nav class="nav"><div class="brand" data-go="#/" title="Home"><div class="mk">${LOGO}</div><span class="bt">The Blockchain <span>Course</span></span></div>
      <div class="links"><a data-go="#/" class="${active === "home" ? "on" : ""}">Home</a><a data-go="#/map" class="${active === "map" ? "on" : ""}">Map</a></div>
      <div class="right">${progMini()}</div></nav>`;
  }
  function wireGo(scope) { (scope || document).querySelectorAll("[data-go]").forEach(e => e.onclick = (ev) => { ev.preventDefault(); go(e.dataset.go); }); }

  /* ---------------- HOME ---------------- */
  function home() {
    const done = S.totalDone(), total = S.lessonsTotal, resume = done > 0 && done < total, startId = S.firstUndone();
    const beatsTotal = S.ORDER.reduce((a, id) => a + (L[id] ? L[id].beats.length : 0), 0);
    root().innerHTML = nav("home") + `
      <div style="display:flex; flex-direction:column; min-height: calc(100vh - 61px);">
        <section class="hero hero-full" style="flex:1; padding: 24px; min-height:0;">
          <canvas id="heroCanvas"></canvas>
          <div class="hero-in">
          <h1>Learn Blockchain<br>by <em>doing</em>.</h1>
          <div class="cta">
            <button class="btn primary lg" data-go="#/lesson/${startId}">${resume ? "Continue where you left off" : "Start the course"} →</button>
            <button class="btn lg ghost" data-go="#/map">Open the map</button>
            ${done > 0 ? `<button class="btn lg ghost" id="restartHome" style="color:var(--ink-3)">Restart course</button>` : ""}
          </div>
          <div class="herostats"><span><b>${S.WORLDS.length}</b> chapters</span><span class="dot"></span><span><b>${total}</b> lessons</span><span class="dot"></span><span><b>${beatsTotal}</b> hands-on demos</span></div>
        </div>
      </section>
      <footer style="padding: 16px 24px;">
        <div style="display:flex; justify-content:center; align-items:center; gap: 14px;">
          <span>Built by Tannmay Kumarr Baid</span>
          <a href="https://x.com/tannmaybaid" target="_blank" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="X (Twitter)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/tannmaykumarrbaid/" target="_blank" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="LinkedIn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </footer>
      </div>`;
    wireGo();
    const rh = document.getElementById("restartHome");
    if (rh) rh.onclick = () => { if (confirm("Clear your progress and start from the beginning?")) { S.reset(); go("#/lesson/" + S.ORDER[0]); } };
    if (window.APP) window.APP.heroCanvas();
  }

  /* ---------------- MAP ---------------- */
  function map() {
    const done = S.totalDone();
    root().innerHTML = nav("map") + `
      <div class="map-wrap"><div class="map-head"><h1>Map</h1><p>Pick any stop. The path runs simple to deep — but you can wander.</p></div>
      ${S.WORLDS.map(mapWorld).join("")}</div>
      <footer>${done} of ${S.lessonsTotal} explored${done > 0 ? ` · <a id="restart" style="cursor:pointer;border-bottom:1px solid var(--line-2)">start over</a>` : ""}</footer>`;
    wireGo();
    const rb = document.getElementById("restart"); if (rb) rb.onclick = () => { if (confirm("Clear your progress and start from the beginning?")) { S.reset(); map(); } };
    root().querySelectorAll(".lnode").forEach(n => { const open = () => go("#/lesson/" + n.dataset.id); n.onclick = open; n.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }; });
  }
  function mapWorld(w) {
    const cur = S.firstUndone();
    const nodes = w.lessons.map(id => {
      const l = L[id], done = S.isDone(id), isCur = id === cur && !done;
      return `<div class="lnode ${done ? "done" : ""} ${isCur ? "cur" : ""}" data-id="${id}" role="link" tabindex="0" aria-label="${l.title}">
        ${done ? '<div class="check">✓</div>' : ""}
        <div class="ic" style="background:${w.color}1c;color:${w.color}">${l.icon}</div>
        <div class="lt">${l.title}</div><div class="lo">${l.oneliner}</div>
        ${isCur ? '<div class="lx" style="color:' + w.color + '">start here</div>' : ""}</div>`;
    }).join("");
    return `<div class="world-block"><div class="world-rail"><span class="wdot" style="background:${w.color}"></span><span class="wt">${w.title}</span><span class="ws">${w.sub}</span><span class="wprog">${S.worldDone(w)}/${w.lessons.length}</span></div><div class="nodes">${nodes}</div></div>`;
  }

  /* ---------------- LESSON (vertical explorable) ---------------- */
  function lesson(id) {
    const l = L[id]; if (!l) { go("#/map"); return; }
    const w = S.worldOf[id], gpos = S.ORDER.indexOf(id), prev = S.prevOf(id), next = S.nextOf(id);
    root().innerHTML = `
      <div class="lesson-bar">
        <a class="back" data-go="#/map">← Map</a>
        <span class="wchip" style="background:${w.color}1c;color:${w.color}">${w.title}</span>
        <span class="lttl">${l.title}</span>
        <span class="nums">${gpos + 1} / ${S.lessonsTotal}</span>
        <div class="barnav"><button class="lbtn" id="lPrev" ${prev ? "" : "disabled"} aria-label="Previous lesson">←</button><button class="lbtn next" id="lNext">${next ? "Next →" : "Done"}</button></div>
        <div class="lprog"><i id="lprogFill" style="background:${w.color}"></i></div>
      </div>
      <div class="explorable">
        ${w.lessons[0] === id && w.intro ? `<div class="chapter-open"><span class="co-n" style="color:${w.color}">Chapter ${w.n} · ${w.title}</span><p class="co-i">${w.intro}</p></div>` : ""}
        <div class="lesson-hero"><div class="icbig" style="background:${w.color}1c;color:${w.color}">${l.icon}</div><h1>${l.title}</h1><p>${l.hero}</p></div>
        <div id="beats"></div>
        ${l.deeper ? `<details class="deeper"><summary>Go deeper — the technical detail</summary><div class="dbody">${l.deeper}</div></details>` : ""}
        ${l.bridge ? `<div class="bridge"><span class="bridge-lab" style="color:${w.color}">▸ where this leads</span><p class="bridge-txt">${l.bridge}</p>${next ? `<div class="bridge-next">Next up — <b>${L[next].title}</b></div>` : ""}</div>` : ""}
        <div class="lesson-end">
          <div class="btn-row" style="justify-content:center">${prev ? `<button class="btn ghost" data-go="#/lesson/${prev}">← ${L[prev].title}</button>` : ""}${next ? `<button class="btn primary" id="endNext">${L[next].title} →</button>` : `<button class="btn primary" data-go="#/map">Back to the map</button>`}</div>
          <div class="kbd-hint">tip: <kbd>←</kbd> <kbd>→</kbd> move between lessons</div>
        </div>
      </div>`;
    wireGo();
    // build beats
    const beatsEl = document.getElementById("beats");
    l.beats.forEach((b, i) => {
      const beat = document.createElement("div"); beat.className = "beat reveal";
      beat.innerHTML = `<div class="beat-cap"><span class="bn">${b.n || String(i + 1).padStart(2, "0")}</span><h3>${b.h}</h3><p>${b.cap}</p></div><div class="beat-viz"></div>`;
      beatsEl.appendChild(beat);
      try { b.build(beat.querySelector(".beat-viz")); } catch (e) { console.error("beat", id, i, e); beat.querySelector(".beat-viz").innerHTML = `<div class="sig-state bad">This demo hit an error: ${e.message}</div>`; }
    });
    // reveal on scroll
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    root().querySelectorAll(".reveal").forEach(r => io.observe(r));
    // reading progress in the lesson bar
    const fill = document.getElementById("lprogFill");
    const onScroll = () => { if (!fill || !document.contains(fill)) { removeEventListener("scroll", onScroll); return; }
      const h = document.documentElement, max = h.scrollHeight - innerHeight; fill.style.width = (max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0) + "%"; };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    // silently mark done when the learner moves on
    const markDone = () => { if (!S.isDone(id)) { S.setDone(id, true); document.querySelectorAll(".progmini").forEach(p => { p.outerHTML = progMini(); }); } };
    document.getElementById("lPrev").onclick = () => prev && go("#/lesson/" + prev);
    const onNext = () => { markDone(); next ? go("#/lesson/" + next) : go("#/map"); };
    document.getElementById("lNext").onclick = onNext;
    const en = document.getElementById("endNext"); if (en) en.onclick = onNext;
  }

  return { home, map, lesson };
})();
