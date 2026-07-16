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
  setBeat("doublespend", 0, {
    cap: "Click to copy the very same coin to two people at once. Nothing physical stops you — the file just duplicates. So what <i>could</i> stop you?",
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

})();
