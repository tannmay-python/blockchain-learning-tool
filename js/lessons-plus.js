/* ============================================================
   lessons-plus.js — the course upgrade pass. Replaces the driest
   interactives with living, animated ones and sharpens copy.
   Loads after lessons.js + lessons-extra.js; mutates window.LESSONS
   in place. Strong existing interactives are left untouched.
   ============================================================ */
(function () {
  "use strict";
  const L = window.LESSONS;
  if (!L) return;
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : (s || "");
  const RM = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setHero = (id, t) => { if (L[id]) L[id].hero = t; };
  const setBeat = (id, i, patch) => { if (L[id] && L[id].beats[i]) Object.assign(L[id].beats[i], patch); };
  const setDeeper = (id, html) => { if (L[id]) L[id].deeper = html; };

  /* ============================================================
     WHY — beat 3: a live distributed network shrugging off a freeze
     ============================================================ */
  setBeat("why", 2, {
    h: "A blockchain has no keeper to lean on",
    cap: "The same balance now lives on every computer at once. Try to freeze it, or knock computers offline one by one — the record survives as long as <b>anyone</b> is still standing.",
    build(s) {
      const N = 12, wrap = el("div", "fcard");
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>your balance, replicated across the network</div>
        <div class="netgrid" id="ng"></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn danger" id="freeze">Order a freeze</button><button class="btn danger" id="kill">Knock one offline</button><button class="btn" id="rst">Reset</button></div>
        <div class="sig-state" id="msg" style="margin-top:12px">All ${N} computers hold the same balance: <b>20 coins</b>. No one is in charge.</div>`;
      s.appendChild(wrap);
      let dead = new Set();
      function draw(flashFreeze) {
        wrap.querySelector("#ng").innerHTML = Array.from({ length: N }, (_, i) => {
          const off = dead.has(i);
          return `<div class="ncell${off ? " off" : ""}${flashFreeze && !off ? " shield" : ""}">
            <div class="nc-ic">🖥️</div><div class="nc-bal">${off ? "—" : "20"}</div></div>`;
        }).join("");
      }
      wrap.querySelector("#freeze").onclick = () => {
        draw(true); setTimeout(() => draw(false), 650);
        const alive = N - dead.size;
        wrap.querySelector("#msg").className = "sig-state ok";
        wrap.querySelector("#msg").innerHTML = `A freeze order hits the network — and bounces. There is no central switch; all ${alive} live copies simply ignore it and agree the balance is still <b>20</b>.`;
      };
      wrap.querySelector("#kill").onclick = () => {
        const live = [...Array(N).keys()].filter(i => !dead.has(i));
        if (live.length <= 1) { wrap.querySelector("#msg").className = "sig-state bad"; wrap.querySelector("#msg").innerHTML = `Only one computer left — take it down too and the ledger is finally gone. But knocking out a whole <b>global</b> network at once is the part that is practically impossible.`; return; }
        dead.add(live[(Math.random() * live.length) | 0]); draw();
        wrap.querySelector("#msg").className = "sig-state ok";
        wrap.querySelector("#msg").innerHTML = `${dead.size} down, <b>${N - dead.size} still holding the record</b>. Every survivor has the full history — so nothing was lost. That redundancy is the whole point.`;
      };
      wrap.querySelector("#rst").onclick = () => { dead = new Set(); draw(); wrap.querySelector("#msg").className = "sig-state"; wrap.querySelector("#msg").innerHTML = `All ${N} computers hold the same balance: <b>20 coins</b>. No one is in charge.`; };
      draw();
    }
  });
  setBeat("why", 1, {
    cap: "Everything sits with one party. Press either button — a frozen account or a dead server — and your money is suddenly out of reach, with no one to appeal to.",
  });
  setHero("why", "Why go to all this trouble? Because handing your records to a single keeper has real costs — and sometimes, when you need it most, you simply can't.");

  /* ============================================================
     TOUR — replace the click-through with an ANIMATED payment
     pipeline: a coin physically travels five stations, live.
     ============================================================ */
  setHero("tour", "Before any of the details, watch the whole machine move. Follow one payment — a real one, signed and hashed in your browser — from your fingertips to the permanent record.");
  setBeat("tour", 0, {
    h: "Watch a payment travel the whole machine",
    cap: "Press play. A single coin moves through all five stations that make a blockchain work. Each one is its own lesson later — this is the map, alive.",
    build(s) {
      const STATIONS = [
        { ic: "✍️", t: "Sign", d: "You authorise it with your secret key. Only you can produce this signature; anyone can check it." },
        { ic: "📥", t: "Broadcast", d: "The signed payment is gossiped to the network and waits in a shared pool with everyone else's." },
        { ic: "⛏️", t: "Mine", d: "A miner scoops it into a block and burns real work — hashing until the seal locks." },
        { ic: "⛓️", t: "Chain", d: "The block points back at the previous one and snaps onto the end. Your payment is now on the record." },
        { ic: "🌍", t: "Settle", d: "Every computer adds the same block. Stack a few more and it is final — no take-backs." },
      ];
      const sig = window.sha256 ? sha256("You→Bob:5·" + Date.now()) : "a1b2c3d4e5f6";
      const details = [
        `signature <span class="mono" style="color:var(--gold-2)">${short(sig, 8, 6)}</span>`,
        `waiting in the pool with <b id="pmc">1</b> other payments`,
        `nonce found: <span class="mono" style="color:var(--gold-2)"><b id="pnc">0</b></span>`,
        `linked to block <span class="mono">#417</span>`,
        `now on <b id="pcp">1</b> computers`,
      ];
      const wrap = el("div", "fcard");
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the life of one payment</div>
        <div class="pipe">
          <div class="pipe-track"><div class="pcoin" id="pcoin">◉</div></div>
          <div class="pipe-stations" id="pst">${STATIONS.map((st, i) => `<div class="pstat" data-i="${i}"><div class="ps-ic">${st.ic}</div><div class="ps-t">${st.t}</div></div>`).join("")}</div>
        </div>
        <div class="pipe-cap" id="pcap"><b>Ready.</b> Press play to send 5 coins from you to Bob.</div>
        <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn primary" id="pplay">▶ Send the payment</button><button class="btn" id="pstep">Step ›</button><button class="btn" id="prst">Reset</button></div>`;
      s.appendChild(wrap);
      const coin = wrap.querySelector("#pcoin"), cap = wrap.querySelector("#pcap"), stats = [...wrap.querySelectorAll(".pstat")];
      let at = -1, playing = false, timer = null;
      const place = (i) => { coin.style.left = ((i + 0.5) / STATIONS.length * 100) + "%"; };
      function goto(i) {
        at = i; place(i);
        stats.forEach((s2, k) => s2.classList.toggle("on", k <= i));
        stats.forEach((s2, k) => s2.classList.toggle("live", k === i));
        const st = STATIONS[i];
        cap.innerHTML = `<b>${st.t}.</b> ${st.d} <span class="pipe-detail">${details[i]}</span>`;
        if (i === 2) { let n = 0; const spin = () => { const e = wrap.querySelector("#pnc"); if (!e) return; n += 617 + (Math.random() * 400 | 0); if (n < 24000) { e.textContent = n.toLocaleString(); requestAnimationFrame(spin); } else e.textContent = "24,113"; }; if (!RM) spin(); }
        if (i === 4) { let c = 1; const grow = () => { const e = wrap.querySelector("#pcp"); if (!e) return; c += 900 + (Math.random() * 600 | 0); if (c < 14000) { e.textContent = c.toLocaleString(); requestAnimationFrame(grow); } else e.textContent = "14,206"; }; if (!RM) grow(); }
        coin.classList.remove("thump"); void coin.offsetWidth; coin.classList.add("thump");
      }
      function play() {
        if (playing) return; if (at >= STATIONS.length - 1) reset();
        playing = true; wrap.querySelector("#pplay").textContent = "● sending…";
        const step = () => { if (at < STATIONS.length - 1) { goto(at + 1); timer = setTimeout(step, 1500); } else { playing = false; wrap.querySelector("#pplay").textContent = "▶ Send again"; cap.innerHTML += ` <b style="color:var(--green)">Done — Bob has been paid, permanently.</b>`; } };
        step();
      }
      function reset() { clearTimeout(timer); playing = false; at = -1; place(-0.5); stats.forEach(s2 => s2.classList.remove("on", "live")); cap.innerHTML = `<b>Ready.</b> Press play to send 5 coins from you to Bob.`; wrap.querySelector("#pplay").textContent = "▶ Send the payment"; }
      wrap.querySelector("#pplay").onclick = play;
      wrap.querySelector("#pstep").onclick = () => { clearTimeout(timer); playing = false; if (at < STATIONS.length - 1) goto(at + 1); };
      wrap.querySelector("#prst").onclick = reset;
      place(-0.5);
    }
  });

  /* ============================================================
     TOKENS — beat 1: coins physically fly between holders
     ============================================================ */
  setHero("tokens", "Once a chain can run code, it can track far more than one coin. A token is just a row in a contract's ledger — and an NFT is a row that happens to be one of a kind.");
  setBeat("tokens", 0, {
    h: "Mint tokens, then watch them move",
    cap: "A token balance is only a number the contract keeps. Mint some to yourself, then send a few — the coins <b>fly</b> between accounts, but all that really changes is the contract's bookkeeping.",
    build(s) {
      const wrap = el("div", "fcard");
      let bal = { You: 0, Bob: 0, Carol: 0 };
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>ACME token · one contract, three accounts</div>
        <div class="tokcols" id="tc"></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn primary" id="mint">Mint 10 to you</button><button class="btn" id="sb" disabled>Send 4 → Bob</button><button class="btn" id="sc" disabled>Send 3 → Carol</button><button class="btn" id="rst">Reset</button></div>
        <div class="note" id="msg" style="text-align:center;margin-top:10px">Minting creates new tokens from nothing — exactly what a token contract's <code>mint()</code> does.</div>`;
      s.appendChild(wrap);
      const who = ["You", "Bob", "Carol"], ic = { You: "🧑", Bob: "🧔", Carol: "👩" };
      function draw(flash) {
        wrap.querySelector("#tc").innerHTML = who.map(k => `<div class="tokcol" data-k="${k}"><div class="tk-ic">${ic[k]}</div><div class="tk-name">${k}</div><div class="tk-bal${flash && flash[k] ? " " + flash[k] : ""}" id="bal-${k}">${bal[k]}</div><div class="tk-u">ACME</div></div>`).join("");
        wrap.querySelector("#sb").disabled = bal.You < 4;
        wrap.querySelector("#sc").disabled = bal.You < 3;
      }
      function fly(from, to, n, done) {
        const a = wrap.querySelector(`.tokcol[data-k="${from}"]`), b = wrap.querySelector(`.tokcol[data-k="${to}"]`);
        if (!a || !b || RM) { done(); return; }
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), host = wrap.getBoundingClientRect();
        for (let i = 0; i < Math.min(n, 5); i++) {
          const dot = el("div", "flycoin", "◉");
          dot.style.left = (ra.left - host.left + ra.width / 2) + "px";
          dot.style.top = (ra.top - host.top + 22) + "px";
          wrap.appendChild(dot);
          requestAnimationFrame(() => { setTimeout(() => {
            dot.style.transform = `translate(${(rb.left - ra.left)}px, ${(rb.top - ra.top)}px) scale(.6)`;
            dot.style.opacity = "0.2";
          }, i * 90); });
          setTimeout(() => dot.remove(), 700 + i * 90);
        }
        setTimeout(done, 380);
      }
      function send(to, n) {
        if (bal.You < n) return;
        bal.You -= n;
        fly("You", to, n, () => { bal[to] += n; draw({ You: "dn", [to]: "up" }); setTimeout(() => draw(), 500);
          wrap.querySelector("#msg").innerHTML = `The contract just moved <b>${n}</b> from You to ${to}. No coin object travelled — one number went down, another went up.`; });
        draw();
      }
      wrap.querySelector("#mint").onclick = () => { bal.You += 10; draw({ You: "up" }); setTimeout(() => draw(), 500); wrap.querySelector("#msg").innerHTML = `Minted <b>10</b> new ACME to your account. Supply just grew — the contract said so, and everyone believes it.`; };
      wrap.querySelector("#sb").onclick = () => send("Bob", 4);
      wrap.querySelector("#sc").onclick = () => send("Carol", 3);
      wrap.querySelector("#rst").onclick = () => { bal = { You: 0, Bob: 0, Carol: 0 }; draw(); wrap.querySelector("#msg").innerHTML = `Minting creates new tokens from nothing — exactly what a token contract's <code>mint()</code> does.`; };
      draw();
    }
  });

  /* ============================================================
     LAYER 2 — beat 2: thousands of tx dots funnel into one proof
     ============================================================ */
  setHero("layer2", "A secure, decentralised chain is slow <i>on purpose</i> — every computer re-checks every transaction. Layer 2 buys the speed back without giving that up.");
  setBeat("layer2", 1, {
    h: "Roll thousands into one",
    cap: "A rollup runs transactions off to the side, then posts a single tiny <b>proof</b> back to the secure main chain. Pile some up and roll them — watch a swarm collapse into one block.",
    build(s) {
      const wrap = el("div", "fcard");
      let pending = 0, settled = 0, rolling = false;
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>rollup batcher</div>
        <div class="roll-stage"><div class="roll-swarm" id="sw"></div><div class="roll-funnel">▽</div><div class="roll-l1" id="l1"><span class="l1-lab">Layer 1</span><span class="l1-n" id="l1n">0</span><span class="l1-u">settled</span></div></div>
        <div class="roll-meter"><span class="mono" id="pnum">0</span> waiting off-chain</div>
        <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn" id="add">+ 250 transactions</button><button class="btn primary" id="roll" disabled>Roll up &amp; post one proof →</button><button class="btn" id="rst">Reset</button></div>
        <div class="note" id="msg" style="text-align:center;margin-top:10px">On the base chain, 250 payments would need many blocks. A rollup settles them all with <b>one</b>.</div>`;
      s.appendChild(wrap);
      const sw = wrap.querySelector("#sw");
      function drawSwarm() {
        const dots = Math.min(48, Math.round(pending / 250 * 12));
        sw.innerHTML = Array.from({ length: dots }, () => `<i class="swd" style="left:${5 + Math.random() * 90}%;top:${8 + Math.random() * 78}%;animation-delay:${(-Math.random() * 3).toFixed(2)}s"></i>`).join("");
        wrap.querySelector("#pnum").textContent = pending.toLocaleString();
        wrap.querySelector("#roll").disabled = pending === 0 || rolling;
      }
      wrap.querySelector("#add").onclick = () => { if (rolling) return; pending += 250; drawSwarm(); };
      wrap.querySelector("#rst").onclick = () => { pending = 0; settled = 0; rolling = false; wrap.querySelector("#l1n").textContent = "0"; wrap.querySelector("#msg").innerHTML = `On the base chain, 250 payments would need many blocks. A rollup settles them all with <b>one</b>.`; drawSwarm(); };
      wrap.querySelector("#roll").onclick = () => {
        if (!pending || rolling) return;
        rolling = true; drawSwarm();
        sw.classList.add("suck");
        const did = pending;
        setTimeout(() => {
          sw.classList.remove("suck"); sw.innerHTML = "";
          settled += did; pending = 0; rolling = false;
          const l1 = wrap.querySelector("#l1"); l1.classList.remove("pop"); void l1.offsetWidth; l1.classList.add("pop");
          wrap.querySelector("#l1n").textContent = settled.toLocaleString();
          wrap.querySelector("#msg").innerHTML = `<span style="color:var(--green)">${did.toLocaleString()} transactions settled on the main chain with a single proof.</span> The base layer only ever saw one block.`;
          drawSwarm();
        }, RM ? 0 : 750);
      };
      drawSwarm();
    }
  });

  /* ============================================================
     WALLETS — beat 1: the seed→keys cascade, animated
     ============================================================ */
  setHero("wallets", "A wallet does not hold coins. It holds <i>keys</i>. The coins are entries on the chain — your key is simply what proves they are yours.");
  setBeat("wallets", 0, {
    h: "One phrase unfolds into every key you own",
    cap: "From a single secret phrase, a wallet <b>derives</b> a whole tree of keys and addresses — deterministically, the same every time. Generate one and watch it cascade down.",
    build(s) {
      const wrap = el("div", "fcard");
      const words = ["ocean", "maple", "silver", "tiger", "amber", "ginger", "violet", "harbor", "cedar", "ribbon", "quartz", "meadow"];
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>hierarchical deterministic wallet</div>
        <div class="casc" id="csc"><div class="casc-seed" id="seed"><div class="cs-k">🔑 secret recovery phrase</div><div class="cs-v" id="seedv">············</div></div><div class="casc-tree" id="tree"></div></div>
        <button class="btn primary block" id="gen" style="margin-top:14px">Generate a wallet</button>
        <div class="note" style="text-align:center;margin-top:8px">Same phrase in → same keys out, forever. That is why the phrase alone can restore everything.</div>`;
      s.appendChild(wrap);
      wrap.querySelector("#gen").onclick = () => {
        const seed = Array.from({ length: 4 }, () => words[(Math.random() * words.length) | 0]).join(" ");
        wrap.querySelector("#seedv").textContent = seed;
        const base = window.sha256 ? sha256(seed) : seed;
        const tree = wrap.querySelector("#tree"); tree.innerHTML = "";
        [0, 1, 2].forEach((i) => {
          const priv = window.sha256 ? sha256(base + "k" + i) : base + i;
          const addr = "0x" + (window.sha256 ? sha256(priv).slice(-16) : "abcd1234");
          const row = el("div", "casc-row");
          row.innerHTML = `<div class="casc-arm"></div><div class="casc-acct"><div class="ca-h">account ${i + 1}</div><div class="ca-r"><span>priv</span><b class="mono" style="color:var(--red)">${short(priv, 8, 4)}</b></div><div class="ca-r"><span>addr</span><b class="mono" style="color:var(--green)">${short(addr, 8, 6)}</b></div></div>`;
          tree.appendChild(row);
          if (!RM) { row.style.animationDelay = (i * 0.16) + "s"; }
          row.classList.add("casc-in");
        });
      };
    }
  });

  /* ============================================================
     copy-only polish across the remaining lessons
     ============================================================ */
  setHero("ledger", "Money isn't gold, and it isn't paper. It's a <i>list</i> of who owns what. Get that, and every other piece of this course clicks into place.");
  setHero("doublespend", "Physical cash can't be in two places at once. A digital file copies perfectly and endlessly. That gap — trivial to state, brutal to close — is the problem blockchains exist to solve.");
  setHero("whatis", "Forget the buzzwords. A blockchain is a list of blocks, copied across many computers, that nobody can quietly rewrite. Let's build that picture from nothing.");
  setHero("hashing", "Feed in anything — a word, a novel, an entire hard drive — and get back one short fingerprint. This single tool seals records, links blocks, and powers all of mining.");
  setHero("keys", "No usernames. No passwords. A single secret number is the only thing standing between you and everything you own on a chain.");
  setHero("contracts", "Once a chain can store data and agree on it, it can run <i>programs</i> — unstoppable ones, with no off switch and no one to call.");
  setHero("money", "The very same technology can free money from the state, or hand the state perfect control over it. Nothing about the tech decides which — only who holds the keys.");
  setHero("pos", "Same defence, radically different cost. Instead of burning electricity, validators put their own money on the line — and lose it if they cheat.");
  setHero("zk", "Prove you know a secret without revealing the secret itself. It sounds impossible; it's real, it's provable, and it's quietly reshaping privacy and scaling.");

  /* ============================================================
     POS — beat 2: a live, animated energy comparison
     ============================================================ */
  setBeat("pos", 1, {
    h: "And it sips energy instead of guzzling it",
    cap: "Same security, a rounding error of the power. Proof of work runs a planet's worth of machines flat out; proof of stake just checks who put up a bond. Watch the two draw down.",
    build(s) {
      const wrap = el("div", "fcard");
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>energy to secure one block</div>
        <div class="enrow"><div class="en-lab"><b>Proof of Work</b><span>a country's worth of electricity</span></div><div class="en-bar"><i class="en-fill pow" id="epow"></i><span class="en-bolts" id="ebolts"></span></div><div class="en-pct mono" id="epowp">100%</div></div>
        <div class="enrow"><div class="en-lab"><b>Proof of Stake</b><span>a handful of ordinary servers</span></div><div class="en-bar"><i class="en-fill pos" id="epos"></i></div><div class="en-pct mono" id="eposp">~0.05%</div></div>
        <div class="note" style="margin-top:12px">Ethereum's 2022 switch from work to stake cut its energy use by about <b>99.9%</b> overnight. The trade critics raise: stake can concentrate with the wealthy.</div>`;
      s.appendChild(wrap);
      wrap.querySelector("#ebolts").innerHTML = "⚡".repeat(9);
      const fill = () => { wrap.querySelector("#epow").style.width = "100%"; wrap.querySelector("#epos").style.width = "0.6%"; };
      RM ? fill() : setTimeout(fill, 200);
    }
  });

  /* ============================================================
     copy polish — sharpen the flattest captions
     ============================================================ */
  /* ============================================================
     DOUBLESPEND — beat 1: a coin that visibly clones to two people
     ============================================================ */
  setBeat("doublespend", 0, {
    h: "A coin is a file — and files copy perfectly",
    cap: "Spend the very same coin to two people at once. Two flawless copies fly out; both look completely real. Nothing physical stops you — so what <i>could</i>?",
    build(s) {
      const wrap = el("div", "fcard");
      wrap.innerHTML = `<div class="dsp">
          <div class="dsp-src"><div class="dsp-coin" id="dsrc">◉</div><div class="note" style="margin-top:6px">your one coin</div></div>
          <div class="dsp-targets">
            <div class="dsp-t" id="dtb"><span class="dsp-ic">🧔</span><span class="dsp-nm">Bob</span><span class="dsp-got" id="dgb">waiting…</span></div>
            <div class="dsp-t" id="dtc"><span class="dsp-ic">👩</span><span class="dsp-nm">Carol</span><span class="dsp-got" id="dgc">waiting…</span></div>
          </div>
        </div>
        <div class="btn-row" style="justify-content:center;margin-top:6px"><button class="btn danger" id="dcopy">Spend it to both at once</button><button class="btn" id="drst">Reset</button></div>
        <div class="note" id="dmsg" style="text-align:center;margin-top:12px">One coin, one owner — for now. What happens if you send it to two people?</div>`;
      s.appendChild(wrap);
      let spent = false;
      function fly(destId, cb) {
        const src = wrap.querySelector("#dsrc"), t = wrap.querySelector("#" + destId), host = wrap.getBoundingClientRect();
        if (RM) { cb(); return; }
        const rs = src.getBoundingClientRect(), rt = t.getBoundingClientRect();
        const c = el("div", "flycoin", "◉");
        c.style.left = (rs.left - host.left + rs.width / 2 - 8) + "px";
        c.style.top = (rs.top - host.top + rs.height / 2 - 8) + "px";
        wrap.appendChild(c);
        requestAnimationFrame(() => { c.style.transform = `translate(${rt.left - rs.left + rt.width / 2 - rs.width / 2}px, ${rt.top - rs.top + 6}px)`; });
        setTimeout(() => { c.remove(); cb(); }, 620);
      }
      wrap.querySelector("#dcopy").onclick = () => {
        if (spent) return; spent = true;
        wrap.querySelector("#dsrc").classList.add("split");
        fly("dtb", () => { wrap.querySelector("#dgb").innerHTML = `<span style="color:var(--green)">got ◉ · valid ✓</span>`; wrap.querySelector("#dtb").classList.add("has"); });
        fly("dtc", () => { wrap.querySelector("#dgc").innerHTML = `<span style="color:var(--green)">got ◉ · valid ✓</span>`; wrap.querySelector("#dtc").classList.add("has"); });
        setTimeout(() => { wrap.querySelector("#dmsg").innerHTML = `<span style="color:var(--red)">You just spent one coin twice.</span> Both copies are byte-for-byte identical and both signatures check out. With no agreed <b>order</b>, Bob and Carol are each convinced they were paid.`; }, RM ? 0 : 640);
      };
      wrap.querySelector("#drst").onclick = () => { spent = false; wrap.querySelector("#dsrc").classList.remove("split"); ["dgb", "dgc"].forEach(id => wrap.querySelector("#" + id).textContent = "waiting…"); ["dtb", "dtc"].forEach(id => wrap.querySelector("#" + id).classList.remove("has")); wrap.querySelector("#dmsg").innerHTML = `One coin, one owner — for now. What happens if you send it to two people?`; };
    }
  });
  setBeat("forks", 1, {
    cap: "Each new block stacked on top of yours makes undoing it exponentially harder. Stack a few and watch the chance of reversal fall off a cliff — this is why merchants ‘wait for confirmations’.",
  });
  setBeat("contracts", 1, {
    cap: "A deployed contract can't be patched, so a single flaw is a vault with a hole and no plumber. Trigger the bug and watch the funds drain — no admin, no pause button, no undo.",
  });
  setBeat("zk", 1, {
    cap: "That one move — prove something is true while revealing nothing else — quietly unlocks three enormous things.",
  });
  setBeat("money", 1, {
    cap: "A stablecoin is engineered to stay worth exactly one dollar. There are three ways to pull that off — and they are nowhere near equally safe.",
  });

  /* ============================================================
     LEDGER — beat 1: the first interactive. Coins fly, but the
     lesson is that nothing physical moves — only the record.
     ============================================================ */
  setHero("ledger", "Money isn't gold, and it isn't paper. It's a <i>list</i> of who owns what. Get that one idea and every other piece of this course clicks into place.");
  setBeat("ledger", 0, {
    h: "Money is just a list of balances",
    cap: "Press send. A coin appears to fly between people — but watch closely. Nothing physical moves: one number drops, another rises. That list <b>is</b> the money.",
    build(s) {
      const START = { Alice: 12, Bob: 7, You: 5 }, ic = { Alice: "👩", Bob: "🧔", You: "🧑" }, who = ["Alice", "Bob", "You"];
      let bal = { ...START };
      const wrap = el("div", "fcard");
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the ledger · who owns what</div>
        <div class="ledgrid" id="lg"></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn primary" id="ab">Alice pays Bob 3</button><button class="btn" id="by">Bob pays You 2</button><button class="btn" id="rst">Reset</button></div>
        <div class="note" id="msg" style="text-align:center;margin-top:10px">Three people, one shared list. Every payment is just an edit to it.</div>`;
      s.appendChild(wrap);
      function draw(flash) {
        wrap.querySelector("#lg").innerHTML = who.map(k => `<div class="ledrow" data-k="${k}"><span class="led-ic">${ic[k]}</span><span class="led-name">${k}</span><span class="led-bal${flash && flash[k] ? " " + flash[k] : ""}" id="lb-${k}">${bal[k]}</span><span class="led-u">coins</span></div>`).join("");
      }
      function fly(from, to, n, done) {
        const a = wrap.querySelector(`.ledrow[data-k="${from}"]`), b = wrap.querySelector(`.ledrow[data-k="${to}"]`);
        if (!a || !b || RM) { done(); return; }
        const host = wrap.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        for (let i = 0; i < Math.min(n, 3); i++) {
          const c = el("div", "flycoin", "◉");
          c.style.left = (ra.right - host.left - 74) + "px";
          c.style.top = (ra.top - host.top + ra.height / 2 - 8) + "px";
          wrap.appendChild(c);
          requestAnimationFrame(() => { setTimeout(() => { c.style.transform = `translate(0, ${rb.top - ra.top}px) scale(.7)`; c.style.opacity = "0.15"; }, i * 110); });
          setTimeout(() => c.remove(), 760 + i * 110);
        }
        setTimeout(done, 430);
      }
      function pay(from, to, n) {
        if (bal[from] < n) { wrap.querySelector("#msg").innerHTML = `${from} only has ${bal[from]} — can't send ${n}. The list won't let you spend what you don't have.`; return; }
        bal[from] -= n; draw({ [from]: "dn" });
        fly(from, to, n, () => { bal[to] += n; draw({ [from]: "dn", [to]: "up" }); setTimeout(() => draw(), 620);
          wrap.querySelector("#msg").innerHTML = `${from} → ${to}, ${n} coins. <b>No coin object travelled</b> — the ledger simply now reads ${from}: ${bal[from]}, ${to}: ${bal[to]}.`; });
      }
      wrap.querySelector("#ab").onclick = () => pay("Alice", "Bob", 3);
      wrap.querySelector("#by").onclick = () => pay("Bob", "You", 2);
      wrap.querySelector("#rst").onclick = () => { bal = { ...START }; draw(); wrap.querySelector("#msg").innerHTML = `Three people, one shared list. Every payment is just an edit to it.`; };
      draw();
    }
  });

  /* ============================================================
     DOUBLESPEND — beat 2: ordering resolves the conflict, live
     ============================================================ */
  setBeat("doublespend", 1, {
    h: "The fix: everyone agrees on the order",
    cap: "Both payments are validly signed — cryptography proves <b>who</b>, never <b>when</b>. Broadcast both, then let the network settle on one order. The first one in wins; the second is rejected as a double-spend.",
    build(s) {
      const wrap = el("div", "fcard");
      wrap.innerHTML = `<div class="dord">
          <div class="dord-tx" id="dt1"><span class="dord-h">tx #1</span><span class="dord-b">You → Bob · 1 coin</span><span class="dord-s" id="ds1">signed ✓</span></div>
          <div class="dord-tx" id="dt2"><span class="dord-h">tx #2</span><span class="dord-b">You → Carol · <i>same</i> coin</span><span class="dord-s" id="ds2">signed ✓</span></div>
        </div>
        <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn primary" id="dgo">Let the network pick an order</button><button class="btn" id="drs">Reset</button></div>
        <div class="note" id="dm" style="text-align:center;margin-top:12px">Two valid transactions spending the same coin. Only one can be true.</div>`;
      s.appendChild(wrap);
      let done = false;
      wrap.querySelector("#dgo").onclick = () => {
        if (done) return; done = true;
        const t1 = wrap.querySelector("#dt1"), t2 = wrap.querySelector("#dt2");
        t1.classList.add("settling"); t2.classList.add("settling");
        setTimeout(() => {
          t1.classList.remove("settling"); t2.classList.remove("settling");
          t1.classList.add("win"); wrap.querySelector("#ds1").innerHTML = `into the block first — confirmed ✓`;
          t2.classList.add("lose"); wrap.querySelector("#ds2").innerHTML = `coin already spent — rejected ✕`;
          wrap.querySelector("#dm").innerHTML = `The network agreed tx&nbsp;#1 came first, so it is final. tx&nbsp;#2 tries to spend a coin that's already gone, and every node rejects it. <b>Agreeing on an order is exactly what kills the double-spend.</b>`;
        }, RM ? 0 : 720);
      };
      wrap.querySelector("#drs").onclick = () => { done = false; ["dt1", "dt2"].forEach(id => wrap.querySelector("#" + id).className = "dord-tx"); wrap.querySelector("#ds1").textContent = "signed ✓"; wrap.querySelector("#ds2").textContent = "signed ✓"; wrap.querySelector("#dm").innerHTML = `Two valid transactions spending the same coin. Only one can be true.`; };
    }
  });

  /* ============================================================
     WHATIS — beat 1: the block fingerprint churns on every change
     ============================================================ */
  setBeat("whatis", 0, {
    cap: "Start with one <b>block</b> — a box holding a list of records, like a page in a notebook. Add a record and watch the fingerprint at the bottom <b>rescramble completely</b>: any change, however small, produces a brand-new seal.",
    build(s) {
      const recs = ["Alice → Bob: 5 coins", "Carol → Dan: 2 coins", "Eve → Finn: 8 coins", "Gail → Hank: 1 coin", "Ivy → Jo: 3 coins"];
      let list = recs.slice(0, 2), i = 2, raf;
      const wrap = el("div", "");
      wrap.innerHTML = `<div class="bigblock"><div class="bt"></div><div class="bp"><div class="bn">Block #1</div><div class="brow"><div class="k">records inside</div><div class="v" id="recs"></div></div><div class="brow"><div class="k">fingerprint that seals it</div><div class="v mono" style="color:var(--gold-2)" id="seal"></div></div></div></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px"><button class="btn" id="add">+ Add a record</button><button class="btn" id="rst">Reset</button></div>
        <div class="note" style="text-align:center;margin-top:8px">The fingerprint is one short code standing in for everything in the box.</div>`;
      s.appendChild(wrap);
      const sealText = () => short(window.sha256 ? sha256(list.join("|")) : list.join(""), 18, 10);
      function drawRecs(freshIdx) { wrap.querySelector("#recs").innerHTML = list.map((r, k) => `<div class="wr-rec${k === freshIdx ? " wr-in" : ""}">${r}</div>`).join(""); }
      function scramble() { const real = sealText(), out = wrap.querySelector("#seal"); let t = 0; cancelAnimationFrame(raf);
        const step = () => { if (RM) { out.textContent = real; return; } if (t < 7) { out.textContent = Array.from({ length: 22 }, () => "0123456789abcdef"[(Math.random() * 16) | 0]).join("") + "…"; t++; raf = requestAnimationFrame(step); } else out.textContent = real; };
        step(); }
      function draw(freshIdx) { drawRecs(freshIdx); scramble(); }
      wrap.querySelector("#add").onclick = () => { list.push(i < recs.length ? recs[i++] : "Someone → Someone: " + (1 + Math.floor(Math.random() * 9)) + " coins"); draw(list.length - 1); };
      wrap.querySelector("#rst").onclick = () => { list = recs.slice(0, 2); i = 2; draw(); };
      draw();
    }
  });

  /* ============================================================
     FORKS — beat 1: the chain visibly splits, then one branch wins
     ============================================================ */
  setBeat("forks", 0, {
    h: "Two winners at once — longest chain breaks the tie",
    cap: "Two miners seal block #4 at the same instant and the chain <b>splits</b>. There's no referee. Whichever branch the <b>next</b> block extends becomes real; the other is abandoned — <b>orphaned</b> — and its transactions slide back into the pool.",
    build(s) {
      const wrap = el("div", "");
      wrap.innerHTML = `<div class="frk" id="frk"></div><div class="btn-row" id="fkc" style="justify-content:center;margin-top:6px"></div><div class="note" id="fmsg" style="text-align:center;margin-top:12px">A healthy chain, growing one block at a time.</div>`;
      s.appendChild(wrap);
      const stage = wrap.querySelector("#frk"), ctl = wrap.querySelector("#fkc"), msg = wrap.querySelector("#fmsg");
      const blk = (label, cls) => `<div class="frk-b ${cls || ""}">#${label}</div>`;
      const arm = () => `<span class="frk-arm"></span>`;
      let state = "base";
      function render() {
        if (state === "base") stage.innerHTML = `<div class="frk-line">${blk("2", "ok")}${arm()}${blk("3", "ok")}${arm()}${blk("4", "ok pulse")}</div>`;
        else if (state === "fork") stage.innerHTML = `<div class="frk-line">${blk("2", "ok")}${arm()}${blk("3", "ok")}${arm()}<div class="frk-split"><div class="frk-line">${blk("4a", "cand pulse")}</div><div class="frk-line">${blk("4b", "cand pulse")}</div></div></div>`;
        else {
          const aCls = state === "a" ? "ok" : "orphan", bCls = state === "b" ? "ok" : "orphan";
          const aExt = state === "a" ? arm() + blk("5", "ok pop") : "", bExt = state === "b" ? arm() + blk("5", "ok pop") : "";
          stage.innerHTML = `<div class="frk-line">${blk("2", "ok")}${arm()}${blk("3", "ok")}${arm()}<div class="frk-split"><div class="frk-line">${blk("4a", aCls)}${aExt}</div><div class="frk-line">${blk("4b", bCls)}${bExt}</div></div></div>`;
        }
        ctl.innerHTML = "";
        if (state === "base") { const b = el("button", "btn primary", "Two miners find #4 at once"); b.onclick = () => { state = "fork"; msg.innerHTML = `Both #4a and #4b are valid, and the network is <b>split</b> — some nodes heard one first, some the other.`; render(); }; ctl.appendChild(b); }
        else if (state === "fork") { const a = el("button", "btn", "Next block extends #4a"); a.onclick = () => pick("a"); const b = el("button", "btn", "Next block extends #4b"); b.onclick = () => pick("b"); ctl.append(a, b); }
        else { const r = el("button", "btn", "Replay"); r.onclick = () => { state = "base"; msg.innerHTML = `A healthy chain, growing one block at a time.`; render(); }; ctl.appendChild(r); }
      }
      function pick(which) { state = which; const kept = which === "a" ? "#4a" : "#4b", orph = which === "a" ? "#4b" : "#4a"; msg.innerHTML = `The next block built on ${kept}, so that branch now has the <b>most work</b> and wins. ${orph} is orphaned — every node abandons it, and its transactions return to the waiting pool. The fork lasted one block.`; render(); }
      render();
    }
  });

})();
