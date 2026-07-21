/* ============================================================
   views.js: Home, the Journey map, and Lesson explorables.
   No points, no levels. Just clean progress and a lot to play with.
   ============================================================ */
import { STORE as S } from './store.js';
import { LESSONS as L } from './lessons.js';
import { QUIZ } from './lessons-extra.js';
import './lessons-v2.js'; // restructure pass; pulls in lessons-plus + lessons-extra

export const VIEWS = (function () {
  "use strict";
  const root = () => document.getElementById("root");
  const go = (h) => { location.hash = h; };
  const LOGO = `<img src="takshashila-logo-light.svg" alt="The Takshashila Institution" class="logo-light">
                <img src="takshashila-logo.svg" alt="The Takshashila Institution" class="logo-dark">`;

  const wv = (w) => `--wca:${w.color};--wcl:${w.colorText || w.color};--wcd:${w.colorTextDark || w.color}`;
  /* chapter colours are oklch() strings, so tints are mixed, never concatenated */
  const tint = (c, pct) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;
  function progMini() {
    const d = S.totalDone(), t = S.lessonsTotal;
    return `<div class="progmini"><span>${d} / ${t}</span><div class="bar"><i style="width:${(d / t * 100).toFixed(0)}%"></i></div></div>`;
  }
  function nav(active) {
    const isDark = document.documentElement.dataset.theme === "dark";
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    const toggle = `<button class="theme-toggle" data-action="toggleTheme" title="Toggle theme" aria-label="Dark theme" aria-pressed="${isDark}">${isDark ? sunSvg : moonSvg}</button>`;
    const hamburger = `<button class="hamburger" data-action="toggleMobileNav" aria-label="Menu" aria-expanded="false" aria-controls="mobileNav"><span></span><span></span><span></span></button>`;
    return `<nav class="nav"><a class="brand" href="https://takshashila.org.in/" target="_blank" rel="noopener" title="The Takshashila Institution">${LOGO}</a>
      <div class="links desktop-only"><a href="#/" class="${active === "home" ? "on" : ""}" ${active === "home" ? 'aria-current="page"' : ""}>Home</a><a href="#/map" class="${active === "map" ? "on" : ""}" ${active === "map" ? 'aria-current="page"' : ""}>Map</a></div>
      <div class="right">${toggle}${progMini()}${hamburger}</div></nav>
      <nav id="mobileNav" class="mobile-nav">
        <a href="#/" class="${active === "home" ? "on" : ""}">Home</a>
        <a href="#/map" class="${active === "map" ? "on" : ""}">Map</a>
      </nav>`;
  }

  let _lessonIO = null;
  let _lessonScroll = null;

  /* map filter: "core path only" hides every optional lesson and chapter.
     Remembered, because it is a statement about how you want to learn. */
  let coreOnly = false;
  try { coreOnly = localStorage.getItem("blockcourse_path") === "core"; } catch (e) {}
  const savePath = () => { try { localStorage.setItem("blockcourse_path", coreOnly ? "core" : "all"); } catch (e) {} };

  function teardown() {
    if (_lessonIO) { _lessonIO.disconnect(); _lessonIO = null; }
    if (_lessonScroll) { removeEventListener("scroll", _lessonScroll); _lessonScroll = null; }
  }

  const SOCIALS = `<div style="display:flex; justify-content:center; align-items:center; gap: 14px; flex-wrap:wrap; margin-top: 12px;">
          <span>Built by <a href="https://takshashila.org.in/content/team/tannmay-kumarr-baid.html" target="_blank" rel="noopener noreferrer" style="color:var(--ink-3); text-decoration:none; border-bottom:1px solid var(--line-2); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'">Tannmay Kumarr Baid</a></span>
          <a href="https://x.com/tannmaybaid" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="X (Twitter)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/tannmaykumarrbaid/" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="LinkedIn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
          <a href="https://github.com/tannmay-python/blockchain-learning-tool" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; color:var(--ink-3); transition:color 0.2s;" onmouseover="this.style.color='var(--plum)'" onmouseout="this.style.color='var(--ink-3)'" aria-label="GitHub">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
        </div>`;

  /* ---------------- HOME ---------------- */
  function home() {
    teardown();
    const done = S.totalDone(), total = S.lessonsTotal, resume = done > 0 && done < total, startId = S.firstUndone();
    const journey = S.WORLDS.map(w => `<a class="jd" href="#/chapter/${w.id}" style="background:${w.color}; ${wv(w)}" aria-label="${w.title}">
      <span class="jd-tt"><span class="jd-tt-n mono">Chapter ${w.n}</span><span class="jd-tt-t">${w.title}</span></span>
    </a>`).join(`<span class="jd-link"></span>`)
      + `<span class="jd-link"></span><span class="jd-cap mono">the journey</span>`;
    root().innerHTML = nav("home") + `
      <div class="home-wrap">
        <section class="hero home-hero">
          <canvas id="heroCanvas"></canvas>
          <div class="hero-in">
          <h1>Learn blockchain<br>by <em>doing</em>.</h1>
          <div class="cta">
            <button class="btn gold lg" data-go="#/lesson/${startId}">${resume ? "Continue where you left off" : "Start the course"} →</button>
            <button class="btn lg ghost" data-go="#/map">Open the map</button>
          </div>
          <div class="journey-rail">${journey}</div>
        </div>
      </section>
      <footer style="padding: 16px 24px;">
        <span id="rsWrapHome" style="display:block; text-align:center; margin-bottom:12px;">
          ${done} of ${total} explored${done > 0 ? ` · <a id="restartHome" style="cursor:pointer; font-weight:500; color:var(--plum); border-bottom:1px solid var(--plum)">start over</a>` : ""}
        </span>
        ${SOCIALS}
      </footer>
      </div>`;

    const rb = document.getElementById("restartHome");
    if (rb) rb.onclick = () => {
      const w = document.getElementById("rsWrapHome");
      w.innerHTML = `<span class="restart-confirm"><b>Erase all progress?</b><a id="rsYesHome" style="margin-left:8px; cursor:pointer;">yes, start over</a><a id="rsNoHome" style="margin-left:8px; cursor:pointer;">keep it</a></span>`;
      document.getElementById("rsYesHome").onclick = () => { S.reset(); home(); };
      document.getElementById("rsNoHome").onclick = () => home();
    };

    if (window.APP) window.APP.heroCanvas();
  }

  /* ---------------- MAP ---------------- */
  function map() {
    teardown();
    const cDone = S.coreDone(), cTotal = S.coreTotal, done = S.totalDone(), total = S.lessonsTotal;
    const nextId = S.firstUndone(), allDone = cDone >= cTotal;
    const resume = cDone > 0 && !allDone ? `<div class="map-resume"><div class="bar"><i style="width:${(cDone / cTotal * 100).toFixed(0)}%"></i></div><span class="mr-n">${cDone} / ${cTotal} core</span><button class="btn gold" data-go="#/lesson/${nextId}">Continue: ${L[nextId].title} →</button></div>` : "";
    root().innerHTML = nav("map") + `
      <div class="map-wrap ${coreOnly ? "core-only" : ""}"><div class="map-head"><h1>Map</h1>${resume}
        <div class="path-switch" role="group" aria-label="Which lessons to show">
          <button class="ps-b ${coreOnly ? "on" : ""}" id="psCore" aria-pressed="${coreOnly}">Core path <span class="ps-n">${cTotal}</span></button>
          <button class="ps-b ${coreOnly ? "" : "on"}" id="psAll" aria-pressed="${!coreOnly}">Everything <span class="ps-n">${total}</span></button>
        </div>
        <p class="path-note">${coreOnly
          ? "Showing only what you need. The optional lessons are still there whenever you want them."
          : `${total - cTotal} optional lessons are marked ◇. Skip any of them and the course still works.`}</p>
      </div>
      ${S.WORLDS.map(mapWorld).filter(Boolean).join("")}</div>
      <footer>
        <span id="rsWrap">${done} of ${total} explored${done > 0 ? ` · <a id="restart" style="cursor:pointer; font-weight:500; color:var(--plum); border-bottom:1px solid var(--plum)">start over</a>` : ""}</span>
        ${SOCIALS}
      </footer>`;

    document.getElementById("psCore").onclick = () => { if (!coreOnly) { coreOnly = true; savePath(); map(); } };
    document.getElementById("psAll").onclick = () => { if (coreOnly) { coreOnly = false; savePath(); map(); } };
    const rb = document.getElementById("restart");
    if (rb) rb.onclick = () => {
      const w = document.getElementById("rsWrap");
      w.innerHTML = `<span class="restart-confirm"><b>Erase all progress?</b><a id="rsYes">yes, start over</a><a id="rsNo">keep it</a></span>`;
      document.getElementById("rsYes").onclick = () => { S.reset(); map(); };
      document.getElementById("rsNo").onclick = () => map();
    };
  }
  function mapWorld(w) {
    const cur = S.firstUndone();
    /* "core path" hides optional lessons, and optional chapters entirely */
    if (coreOnly && w.optional) return "";
    const shown = coreOnly ? w.lessons.filter(id => !S.isOptional(id)) : w.lessons;
    if (!shown.length) return "";
    const nodes = shown.map(id => {
      const l = L[id], done = S.isDone(id), isCur = id === cur && !done;
      const deep = S.isOptional(id);
      return `<a class="lnode ${done ? "done" : ""} ${isCur ? "cur" : ""}${deep ? " deep" : ""}" href="#/lesson/${id}" style="${wv(w)}" aria-label="${l.title}${done ? " (done)" : ""}${deep ? " (optional deep dive)" : ""}">
        ${done ? '<div class="check" aria-hidden="true">✓</div>' : ""}
        <div class="ic" style="background:${tint(w.color, 11)}">${l.icon}</div>
        <div class="lt">${l.title}</div><div class="lo">${l.oneliner}</div>
        ${deep ? '<div class="lx">◇ optional deep dive</div>' : isCur ? '<div class="lx">start here</div>' : ""}</a>`;
    }).join("");
    const band = `<a class="chapter-band${w.optional ? " optional" : ""}" href="#/chapter/${w.id}" title="Go to ${w.title} chapter intro" style="${wv(w)}">
        <span class="cb-bar" aria-hidden="true"></span>
        <div class="cb-main">
          <div class="cb-code">Chapter ${w.n}${w.optional ? ' <span class="cb-opt">◇ optional</span>' : ""}</div>
          <div class="cb-title">${w.title}</div>
          <div class="cb-sub">${w.sub}</div>
        </div>
        <div class="cb-right">
          <span class="cb-prog">${shown.filter(S.isDone).length}/${shown.length}</span>
          <span class="cb-read">Read intro →</span>
        </div></a>`;
    return `<div class="world-block${w.optional ? " optional" : ""}">${band}<div class="nodes">${nodes}</div></div>`;
  }

  /* Optional lessons announce themselves at the top and offer a way out.
     The core path never depends on anything behind one of these banners. */
  function optBanner(id, w) {
    if (!S.isOptional(id)) return "";
    const skipTo = S.nextCoreOf(id);
    const whole = w.optional;
    return `<div class="opt-banner" style="${wv(w)}">
      <span class="ob-mark" aria-hidden="true">◇</span>
      <div class="ob-main">
        <div class="ob-t">Optional${whole ? " chapter" : ""}</div>
        <p class="ob-d">${whole
          ? `Every lesson in <b>${w.title}</b> is a side road. Nothing later in the course depends on it.`
          : `A deeper look, off the main path. You can skip it and lose nothing later.`}</p>
      </div>
      ${skipTo ? `<button class="btn ob-skip" data-go="#/lesson/${skipTo}">Skip to the core path →</button>` : ""}
    </div>`;
  }

  /* ---------------- LESSON (vertical explorable) ---------------- */
  function lesson(id) {
    teardown();
    const l = L[id]; if (!l) { go("#/map"); return; }
    const w = S.worldOf[id], gpos = S.ORDER.indexOf(id), prev = S.prevOf(id), next = S.nextOf(id);
    root().innerHTML = `
      <div class="lesson-bar">
        <a class="back" href="#/map">← Map</a>
        <span class="wchip" style="background:${tint(w.color, 11)};${wv(w)}">${w.title}</span>
        <span class="lttl">${l.title}</span>
        <span class="nums">${gpos + 1} / ${S.lessonsTotal}</span>
        <div class="barnav"><button class="lbtn" id="lPrev" ${prev ? "" : "disabled"} aria-label="Previous lesson">←</button><button class="lbtn next" id="lNext">${next ? "Next →" : "Done"}</button></div>
        <div class="lprog"><i id="lprogFill" style="background:${w.color}"></i></div>
      </div>
      <div class="explorable">
        ${optBanner(id, w)}
        <div class="lesson-hero"><div class="icbig" style="background:${tint(w.color, 11)};${wv(w)}">${l.icon}</div><h1>${l.title}</h1><p>${l.hero}</p></div>
        <div id="beats"></div>
        ${l.deeper ? `<details class="deeper"><summary>Go deeper: the technical detail</summary><div class="dbody">${l.deeper}</div></details>` : ""}
        ${l.bridge ? `<div class="bridge"><span class="bridge-lab" style="${wv(w)}">▸ where this leads</span><p class="bridge-txt">${l.bridge}</p>${next ? `<div class="bridge-next">Next up: <b>${L[next].title}</b></div>` : ""}</div>` : ""}
        <div class="lesson-end">
          <div class="btn-row" style="justify-content:center">${prev ? `<button class="btn ghost" data-go="#/lesson/${prev}">← ${L[prev].title}</button>` : ""}${next ? `<button class="btn primary" id="endNext">${L[next].title} →</button>` : `<button class="btn primary" data-go="#/map">Back to the map</button>`}</div>
          <div class="kbd-hint">tip: <kbd>←</kbd> <kbd>→</kbd> move between lessons</div>
        </div>
      </div>`;

    // build beats
    const beatsEl = document.getElementById("beats");
    l.beats.forEach((b, i) => {
      const beat = document.createElement("div"); beat.className = "beat reveal";
      beat.innerHTML = `<div class="beat-cap"><span class="bn">${b.n || String(i + 1).padStart(2, "0")}</span><h2>${b.h}</h2><p>${b.cap}</p></div><div class="beat-viz"></div>`;
      beatsEl.appendChild(beat);
      try { b.build(beat.querySelector(".beat-viz")); } catch (e) { console.error("beat", id, i, e); beat.querySelector(".beat-viz").innerHTML = `<div class="sig-state bad">This demo hit an error: ${e.message}</div>`; }
    });
    // demo outputs are silent to AT otherwise. Announce updates politely.
    beatsEl.querySelectorAll(".sig-state, .verdict, .linkmsg, .log, .hashout").forEach(n => { n.setAttribute("aria-live", "polite"); });
    // silently mark done when the learner moves on or reaches the end of the page
    const markDone = () => { if (!S.isDone(id)) { S.setDone(id, true); document.querySelectorAll(".progmini").forEach(p => { p.outerHTML = progMini(); }); document.querySelectorAll(".progmini .bar").forEach(b => { b.classList.add("pulse"); setTimeout(() => b.classList.remove("pulse"), 700); }); } };
    // reveal on scroll; reaching the lesson-end block also counts as completing the lesson
    const endEl = root().querySelector(".lesson-end");
    _lessonIO = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { if (e.target === endEl) markDone(); e.target.classList.add("in"); _lessonIO.unobserve(e.target); } }), { threshold: 0.12 });
    root().querySelectorAll(".reveal").forEach(r => _lessonIO.observe(r));
    if (endEl) _lessonIO.observe(endEl);
    // reading progress in the lesson bar
    const fill = document.getElementById("lprogFill");
    _lessonScroll = () => { if (!fill || !document.contains(fill)) return;
      fill.style.width = Math.min(100, Math.max(0, (scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100)) + "%"; };
    addEventListener("scroll", _lessonScroll, { passive: true }); _lessonScroll();
    document.getElementById("lPrev").onclick = () => prev && go("#/lesson/" + prev);
    const isChapterEnd = !next || S.worldOf[next] !== w;
    const onNext = () => { 
      const wasDone = S.isDone(id);
      markDone(); 
      const advance = () => {
        if (isChapterEnd && next) go("#/chapter/" + S.worldOf[next].id);
        else if (!next) go("#/map");
        else go("#/lesson/" + next);
      };
      if (!wasDone && isChapterEnd && window.APP && window.APP.confetti) {
        window.APP.confetti();
        setTimeout(advance, 750);
      } else {
        advance();
      }
    };
    document.getElementById("lNext").onclick = onNext;
    const en = document.getElementById("endNext"); if (en) en.onclick = onNext;
  }

  function chapterGate(wId) {
    teardown();
    const w = S.WORLDS.find(x => x.id === wId);
    if (!w) return go("#/map");
    const demos = w.lessons.reduce((a, id) => a + (L[id] ? L[id].beats.length : 0), 0);
    /* time estimate rides on the beats, so a fully optional chapter still
       reports a real number (counting only core lessons gave those "~0 min") */
    const mins = Math.max(5, Math.round(demos * 2.5));
    let html = nav("");
    html += `<div class="ch-gate explorable fadein" style="${wv(w)}">
      ${w.optional ? `<div class="opt-banner" style="${wv(w)}">
        <span class="ob-mark" aria-hidden="true">◇</span>
        <div class="ob-main">
          <div class="ob-t">Optional chapter</div>
          <p class="ob-d">Nothing later in the course depends on <b>${w.title}</b>. Take it because it interests you, not because it's required.</p>
        </div>
        <button class="btn ob-skip" data-go="#/map">Back to the map →</button>
      </div>` : ""}
      <div class="ch-gate-head">
        <div class="cg-n">Chapter ${w.n}</div>
        <h1 class="cg-title">${w.title}</h1>
        <p class="cg-intro">${w.intro}</p>
        <p class="cg-meta">~${mins} min · ${w.lessons.length} lesson${w.lessons.length > 1 ? "s" : ""} · ${demos} hands-on demos</p>
      </div>
      <div class="cg-modules">`;
    let num = 0;
    w.lessons.forEach((id) => {
      const l = L[id];
      if (!l) return;
      const done = S.isDone(id), deep = S.isOptional(id) && !w.optional;
      if (!deep) num++;
      html += `<a href="#/lesson/${id}" class="cg-mod ${done ? "done" : ""}">
        <div class="cgm-icon" style="${done ? `background:${w.color};color:#fff;border:none` : ""}">${done ? "✓" : (l.icon || "•")}</div>
        <div class="cgm-info">
          <div class="cgm-title">${deep ? "◇ " : num + ". "}${l.title}${deep ? ' <span class="deep-chip">optional deep dive</span>' : ""}</div>
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
    root().innerHTML = html;

  }

  return { home, map, lesson, chapterGate };
})();
