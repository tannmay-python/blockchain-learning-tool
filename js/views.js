/* ============================================================
   views.js — renders Home, the Journey map, and Lesson screens.
   ============================================================ */
window.VIEWS = (function () {
  "use strict";
  const S = window.STORE, L = window.LESSONS;
  const root = () => document.getElementById("root");
  const go = (h) => { location.hash = h; };

  const LOGO = `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.6" stroke="#fff" stroke-width="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.6" stroke="#fff" stroke-width="1.7"/><path d="M10 6.5h2.5A1.5 1.5 0 0 1 14 8v6" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`;

  function levelChip() {
    const lv = S.level();
    return `<div class="lvlchip"><span class="lv">Level ${lv}</span><div class="xpbar"><i style="width:${(S.levelProgress() * 100).toFixed(0)}%"></i></div><div class="rank">${lv}</div></div>`;
  }
  function nav(active) {
    return `<nav class="nav">
      <div class="brand" data-go="#/"><div class="mk">${LOGO}</div><div class="bt">Chain<span>World</span></div></div>
      <div class="links"><a data-go="#/" class="${active === "home" ? "on" : ""}">Home</a><a data-go="#/map" class="${active === "map" ? "on" : ""}">The Journey</a></div>
      <div class="right">${levelChip()}</div></nav>`;
  }
  function wireGo(scope) { (scope || document).querySelectorAll("[data-go]").forEach(e => e.onclick = (ev) => { ev.preventDefault(); go(e.dataset.go); }); }

  /* ---------------- HOME ---------------- */
  function home() {
    const done = S.totalDone(), total = S.lessonsTotal;
    const resume = done > 0 && done < total;
    const startId = S.firstUndone();
    root().innerHTML = nav("home") + `
      <section class="hero">
        <canvas id="heroCanvas"></canvas>
        <div class="hero-in">
          <div class="eyebrow">An interactive academy</div>
          <h1>Blockchain<br>you can <em>see</em>.</h1>
          <p class="sub">Fourteen short, hands-on lessons across five worlds. No jargon and no prerequisites — watch each idea move, poke at it, and it clicks.</p>
          <div class="cta">
            <button class="btn primary lg" data-go="#/lesson/${startId}">${resume ? "Continue learning" : done === total ? "Review the journey" : "Start the journey"} →</button>
            <button class="btn lg ghost" data-go="#/map">See the map</button>
          </div>
        </div>
        <div class="scroll-hint">SCROLL</div>
      </section>

      <section class="section">
        <div class="dash">
          <div class="dcard"><div class="n vi">${done}<span style="font-size:18px;color:var(--ink-4)">/${total}</span></div><div class="l">lessons completed</div></div>
          <div class="dcard"><div class="n cy">${S.level()}</div><div class="l">your level</div></div>
          <div class="dcard"><div class="n go">${S.xp}</div><div class="l">total XP</div></div>
          <div class="dcard"><div class="n gr">${S.badges()}<span style="font-size:18px;color:var(--ink-4)">/${S.WORLDS.length}</span></div><div class="l">worlds mastered</div></div>
        </div>
      </section>

      <section class="section" style="padding-top:0">
        <div class="section-h"><div class="k">The curriculum</div><h2>Five worlds, one machine</h2><p>Each world builds on the last — from why blockchain exists, to the cryptography, to consensus and the wider ecosystem.</p></div>
        <div class="worlds-grid">${S.WORLDS.map(worldCard).join("")}</div>
      </section>
      <footer>Built to make a hard idea visible · every demo runs locally, the hashing is real SHA-256.</footer>`;
    wireGo();
    root().querySelectorAll(".wcard").forEach(c => c.onclick = () => go("#/map"));
    if (window.APP) window.APP.heroCanvas();
  }

  function worldCard(w) {
    const d = S.worldDone(w), t = w.lessons.length, pct = d / t * 100, complete = d === t;
    return `<div class="wcard">
      <div class="orb" style="background:${w.color}"></div>
      ${complete ? `<div class="wdone" style="background:${w.color}33;color:${w.color}">✓</div>` : ""}
      <div class="wnum" style="color:${w.color}">WORLD ${w.n}</div>
      <h3>${w.title}</h3>
      <div class="wsub">${w.sub}</div>
      <div class="wmeta"><div class="wbar"><i style="width:${pct}%;background:${w.color}"></i></div><span>${d}/${t}</span></div>
    </div>`;
  }

  /* ---------------- MAP ---------------- */
  function map() {
    root().innerHTML = nav("map") + `
      <div class="map-wrap">
        <div class="map-head"><h1>The Journey</h1><p>Pick any stop. The path runs left to right, simple to deep — but you can wander.</p></div>
        ${S.WORLDS.map(mapWorld).join("")}
      </div>
      <footer>${S.totalDone()} of ${S.lessonsTotal} lessons complete · Level ${S.level()} · ${S.xp} XP</footer>`;
    wireGo();
    root().querySelectorAll(".lnode").forEach(n => n.onclick = () => go("#/lesson/" + n.dataset.id));
  }
  function mapWorld(w) {
    const cur = S.firstUndone();
    const nodes = w.lessons.map(id => {
      const l = L[id], done = S.isDone(id), isCur = id === cur;
      return `<div class="lnode ${done ? "done" : ""} ${isCur && !done ? "cur" : ""}" data-id="${id}">
        ${done ? '<div class="check">✓</div>' : ""}
        <div class="ic" style="background:${w.color}22;color:${w.color}">${l.icon}</div>
        <div class="lt">${l.title}</div><div class="lo">${l.oneliner}</div>
        <div class="lx">+${S.XP_PER} XP${isCur && !done ? ' · <span style="color:var(--violet-2)">start here</span>' : ""}</div>
      </div>`;
    }).join("");
    return `<div class="world-block">
      <div class="world-rail"><span class="wdot" style="background:${w.color};color:${w.color}"></span><span class="wt">${w.title}</span><span class="ws">${w.sub}</span><span class="wprog">${S.worldDone(w)}/${w.lessons.length}</span></div>
      <div class="nodes">${nodes}</div>
    </div>`;
  }

  /* ---------------- LESSON ---------------- */
  function lesson(id) {
    const l = L[id]; if (!l) { go("#/map"); return; }
    const w = S.worldOf[id], pos = w.lessons.indexOf(id), gpos = S.ORDER.indexOf(id);
    const prev = S.prevOf(id), next = S.nextOf(id), done = S.isDone(id);
    const dots = w.lessons.map((lid, i) => `<div class="d ${S.isDone(lid) ? "done" : ""} ${lid === id ? "cur" : ""}" data-id="${lid}"></div>`).join("");
    root().innerHTML = `
      <div class="lesson">
        <div class="lesson-top">
          <a class="back" data-go="#/map">← Map</a>
          <span class="wchip" style="background:${w.color}22;color:${w.color}">${w.title}</span>
          <span class="lttl">${l.title}</span>
          <div class="dots">${dots}</div>
          <div style="margin-left:18px">${levelChip()}</div>
        </div>
        <div class="lesson-stage"><div id="lessonStage" style="height:100%"></div></div>
        <aside class="lesson-narr">
          <div class="narr-head"><div class="narr-num">Lesson ${gpos + 1} of ${S.lessonsTotal} · ${w.title}</div><div class="narr-title">${l.title}</div></div>
          <div class="narr-body" id="narrBody"></div>
        </aside>
        <div class="lesson-foot">
          <button class="nav-btn" id="lPrev" ${prev ? "" : "disabled"}>← Back</button>
          <button class="nav-btn ${done ? "" : "next"}" id="lComplete">${done ? "Completed ✓" : "Complete lesson · +" + S.XP_PER + " XP"}</button>
          <button class="nav-btn next" id="lNext" ${next ? "" : "disabled"} style="margin-left:auto">${next ? "Next lesson →" : "Finish"}</button>
        </div>
      </div>`;
    wireGo();
    // narration + quiz
    const nb = document.getElementById("narrBody");
    nb.innerHTML = l.narr() + (l.quiz ? quizHTML(l.quiz) : "");
    nb.classList.add("fadein");
    if (l.quiz) wireQuiz(nb, l.quiz);
    // stage
    const stage = document.getElementById("lessonStage");
    try { l.stage(stage); } catch (e) { console.error("lesson", id, e); stage.innerHTML = `<div class="mstage"><div class="aside">This lesson hit an error: ${e.message}</div></div>`; }
    // dots nav
    root().querySelectorAll(".lesson-top .d").forEach(d => d.onclick = () => go("#/lesson/" + d.dataset.id));
    // foot
    document.getElementById("lPrev").onclick = () => prev && go("#/lesson/" + prev);
    document.getElementById("lNext").onclick = () => next ? go("#/lesson/" + next) : go("#/map");
    document.getElementById("lComplete").onclick = function () {
      if (S.isDone(id)) return;
      const r = S.complete(id);
      this.textContent = "Completed ✓"; this.classList.remove("next");
      if (window.APP) { window.APP.celebrate(r.leveledUp ? `Level ${r.level}! +${S.XP_PER} XP` : `+${S.XP_PER} XP · ${l.title} complete`); if (r.leveledUp) window.APP.confetti(); }
      // refresh chip(s)
      document.querySelectorAll(".lvlchip").forEach(c => { c.outerHTML = levelChip(); });
      // mark this dot done
      const dot = root().querySelector(`.lesson-top .d[data-id="${id}"]`); if (dot) dot.classList.add("done");
      const nx = document.getElementById("lNext"); if (nx && !nx.disabled) nx.focus();
    };
  }

  function quizHTML(q) {
    return `<div class="sub">Quick check</div><div class="quiz"><div class="q">${q.q}</div>${q.options.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join("")}<div class="res note" id="quizRes"></div></div>`;
  }
  function wireQuiz(scope, q) {
    const opts = scope.querySelectorAll(".opt"); let answered = false;
    opts.forEach(o => o.onclick = () => {
      if (answered) return; answered = true; const i = +o.dataset.i;
      opts.forEach((b, j) => { if (j === q.answer) b.classList.add("right"); }); if (i !== q.answer) o.classList.add("wrong");
      scope.querySelector("#quizRes").innerHTML = (i === q.answer ? `<span class="ok">Correct. </span>` : `<span class="bad">Not quite. </span>`) + q.explain;
      setTimeout(() => { answered = false; }, 1500);
    });
  }

  return { home, map, lesson };
})();
