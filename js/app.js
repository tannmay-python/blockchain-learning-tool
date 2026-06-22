/* app.js — course shell: sidebar map, routing, progress, lesson nav. */
(function () {
  "use strict";
  const E = window.ENGINE, U = window.UI, L = window.LESSONS, ACTS = window.ACTS;
  const $ = (s) => document.querySelector(s);
  let idx = 0;

  /* ---- sidebar ---- */
  function buildSidebar() {
    const nav = $("#lessonList"); nav.innerHTML = "";
    let curAct = null;
    L.forEach((lesson, i) => {
      if (lesson.act !== curAct) {
        curAct = lesson.act; const a = ACTS[curAct];
        nav.appendChild(U.h(`<div class="act-label"><span class="dot" style="background:${a.color}"></span>${a.label}</div>`));
      }
      const done = E.state.completed.has(lesson.id);
      const item = U.h(`<button class="lesson-item ${i === idx ? "current" : ""} ${done ? "done" : ""}" data-i="${i}">
        <span class="num">${done ? "✓" : i + 1}</span><span class="tt">${lesson.title}</span></button>`);
      item.onclick = () => go(i);
      nav.appendChild(item);
    });
    updateProgress();
  }

  function updateProgress() {
    const pct = Math.round(E.state.completed.size / L.length * 100);
    $("#cpBar").style.width = pct + "%";
    $("#cpLbl").textContent = `${E.state.completed.size} / ${L.length} lessons · ${pct}%`;
    $("#topPct").textContent = pct + "%";
  }

  /* ---- render a lesson ---- */
  function render() {
    const lesson = L[idx];
    const act = ACTS[lesson.act];
    document.documentElement.style.setProperty("--act", act.color);
    document.documentElement.style.setProperty("--act-soft", hexSoft(act.color));
    const stage = $("#stage"); stage.innerHTML = ""; stage.scrollTop = 0;
    $("#main").scrollTop = 0; window.scrollTo(0, 0);

    // crumb
    $("#crumb").innerHTML = `${act.label.split("·")[0].trim()} · <b>${lesson.title}</b>`;

    const ctx = {
      done: () => { E.complete(lesson.id); markCurrentDone(); },
      rerender: render,
      next: () => go(Math.min(L.length - 1, idx + 1)),
    };
    try { const r = lesson.render(stage, ctx); if (r && r.then) r.catch(e => console.error(e)); }
    catch (e) { console.error("lesson error", lesson.id, e); stage.appendChild(U.h(`<div class="callout note">This lesson hit an error: ${e.message}</div>`)); }

    // nav buttons
    $("#prevBtn").disabled = idx === 0;
    const nextBtn = $("#nextBtn");
    nextBtn.disabled = idx === L.length - 1;
    nextBtn.classList.toggle("ready", E.state.completed.has(lesson.id));
    refreshSidebarActive();
  }

  function markCurrentDone() {
    refreshSidebarActive();
    updateProgress();
    $("#nextBtn").classList.add("ready");
  }

  function refreshSidebarActive() {
    document.querySelectorAll(".lesson-item").forEach((it) => {
      const i = +it.dataset.i;
      it.classList.toggle("current", i === idx);
      const done = E.state.completed.has(L[i].id);
      it.classList.toggle("done", done);
      it.querySelector(".num").textContent = done ? "✓" : i + 1;
    });
  }

  function go(i) { idx = Math.max(0, Math.min(L.length - 1, i)); location.hash = "#/" + L[idx].id; render(); }

  function hexSoft(hex) {
    // produce a soft tint of the act color
    const c = hex.replace("#", ""); const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    const mix = (x) => Math.round(x + (255 - x) * 0.88);
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
  }

  /* ---- nav wiring ---- */
  function init() {
    $("#prevBtn").onclick = () => go(idx - 1);
    $("#nextBtn").onclick = () => go(idx + 1);
    $("#resetBtn").onclick = () => { if (confirm("Reset all course progress?")) { E.resetProgress(); buildSidebar(); render(); } };
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    });
    // route from hash
    const id = (location.hash.match(/#\/(.+)/) || [])[1];
    const found = L.findIndex((l) => l.id === id);
    if (found >= 0) idx = found;
    buildSidebar();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
