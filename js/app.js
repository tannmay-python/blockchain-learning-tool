/* app.js — boots the engine + visualization + guide, wires topbar controls. */
(function () {
  "use strict";
  const C = window.CHAIN, V = window.VIZ, G = window.GUIDE;
  const $ = (s) => document.querySelector(s);

  function boot() {
    C.init();
    V.init();
    G.init();

    // topbar network controls
    const playBtn = $("#ctrlPlay");
    const sync = () => { playBtn.innerHTML = C.state.running ? "⏸" : "▶"; playBtn.classList.toggle("on", C.state.running); };
    playBtn.onclick = () => C.state.running ? C.pause() : C.play();
    C.on("running", sync); sync();
    $("#ctrlStep").onclick = () => { if (C.state.running) C.pause(); C.stepBlock(); };

    document.querySelectorAll("#speedSeg button").forEach(b => b.onclick = () => {
      document.querySelectorAll("#speedSeg button").forEach(x => x.classList.remove("on"));
      b.classList.add("on"); C.setSpeed(+b.dataset.s);
    });

    // splash → start
    $("#splashStart").onclick = () => { $("#splash").classList.add("hide"); if (!C.state.running) C.play(); };

    // keyboard
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (e.key === " ") { e.preventDefault(); C.state.running ? C.pause() : C.play(); }
      if (e.key === "Escape") V.closeInspector();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
