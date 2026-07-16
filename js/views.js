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
    const isDark = document.documentElement.dataset.theme === "dark";
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    const toggle = `<button class="theme-toggle" onclick="window.APP.toggleTheme()" title="Toggle theme" aria-label="Toggle theme">${isDark ? sunSvg : moonSvg}</button>`;
    return `<nav class="nav"><div class="brand" data-go="#/" title="Home"><div class="mk">${LOGO}</div><span class="bt">The Blockchain <span>Course</span></span></div>
      <div class="links"><a data-go="#/" class="${active === "home" ? "on" : ""}">Home</a><a data-go="#/map" class="${active === "map" ? "on" : ""}">Map</a></div>
      <div class="right">${toggle}${progMini()}</div></nav>`;
  }
  function wireGo(scope) { (scope || document).querySelectorAll("[data-go]").forEach(e => e.onclick = (ev) => { ev.preventDefault(); go(e.dataset.go); }); }

  function wireGo(scope) { (scope || document).querySelectorAll("[data-go]").forEach(e => e.onclick = (ev) => { ev.preventDefault(); go(e.dataset.go); }); }

  function teardown() {
    if (window._lessonIO) { window._lessonIO.disconnect(); window._lessonIO = null; }
    if (window._lessonScroll) { removeEventListener("scroll", window._lessonScroll); window._lessonScroll = null; }
  }

  /* ---------------- HOME ---------------- */
  function home() {
    teardown();
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
          <a href="https://x.com/tannmaybaid" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="X (Twitter)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/tannmaykumarrbaid/" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="LinkedIn">
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
    teardown();
    const done = S.totalDone();
    root().innerHTML = nav("map") + `
      <div class="map-wrap"><div class="map-head"><h1>Map</h1></div>
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
    return `<div class="world-block"><div class="world-rail" data-go="#/chapter/${w.id}" style="cursor:pointer" title="Go to Chapter Intro"><span class="wdot" style="background:${w.color}"></span><span class="wt">${w.title}</span><span class="ws">${w.sub}</span><span class="wprog">${S.worldDone(w)}/${w.lessons.length}</span><span class="wgate-arr" style="margin-left:auto;color:var(--line-2);font-size:18px">→</span></div><div class="nodes">${nodes}</div></div>`;
  }

  /* ---------------- LESSON (vertical explorable) ---------------- */
  function lesson(id) {
    teardown();
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
    window._lessonIO = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); window._lessonIO.unobserve(e.target); } }), { threshold: 0.12 });
    root().querySelectorAll(".reveal").forEach(r => window._lessonIO.observe(r));
    // reading progress in the lesson bar
    const fill = document.getElementById("lprogFill");
    window._lessonScroll = () => { if (!fill || !document.contains(fill)) return;
      const h = document.documentElement, max = h.scrollHeight - innerHeight; fill.style.width = (max > 0 ? Math.min(100, h.scrollTop / max * 100) : 0) + "%"; };
    addEventListener("scroll", window._lessonScroll, { passive: true }); window._lessonScroll();
    // silently mark done when the learner moves on
    const markDone = () => { if (!S.isDone(id)) { S.setDone(id, true); document.querySelectorAll(".progmini").forEach(p => { p.outerHTML = progMini(); }); } };
    document.getElementById("lPrev").onclick = () => prev && go("#/lesson/" + prev);
    const isChapterEnd = !next || S.worldOf[next] !== w;
    const onNext = () => { 
      markDone(); 
      if (isChapterEnd && next) go("#/chapter/" + S.worldOf[next].id);
      else if (!next) go("#/map");
      else go("#/lesson/" + next);
    };
    document.getElementById("lNext").onclick = onNext;
    const en = document.getElementById("endNext"); if (en) en.onclick = onNext;
  }

  function chapterGate(wId) {
    teardown();
    const w = S.WORLDS.find(x => x.id === wId);
    if (!w) return go("#/map");
    let html = nav("");
    html += `<div class="ch-gate explorable fadein">
      <div class="ch-gate-head">
        <div class="cg-n">Chapter ${w.n}</div>
        <h1 class="cg-title">${w.title}</h1>
        <p class="cg-intro">${w.intro}</p>
      </div>
      <div class="cg-modules">`;
    w.lessons.forEach((id, i) => {
      const l = window.LESSONS[id];
      if (!l) return;
      const done = S.isDone(id);
      html += `<a data-go="#/lesson/${id}" class="cg-mod ${done ? "done" : ""}">
        <div class="cgm-icon" style="${done ? `background:${w.color};color:#fff;border:none` : ""}">${done ? "✓" : (l.icon || "•")}</div>
        <div class="cgm-info">
          <div class="cgm-title">${i + 1}. ${l.title}</div>
          <div class="cgm-sub">${l.oneliner || ""}</div>
        </div>
        <div class="cgm-arrow">→</div>
      </a>`;
    });
    html += `</div>
      <div class="cg-start">
        <button class="btn primary" style="font-size:16px;padding:14px 32px;background:${w.color};border-color:transparent;color:#fff" data-go="#/lesson/${w.lessons[0]}">Enter Chapter →</button>
      </div>
    </div>`;
    root().innerHTML = html + footer();
    wireGo();
    if (window.APP) window.APP.heroCanvas();
  }

  return { home, map, lesson, chapterGate };
})();
