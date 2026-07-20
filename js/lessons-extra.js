/* ============================================================
   lessons-extra.js — checkpoint quizzes + the three lessons that
   complete the story: incentives (why mine?), gossip (the network
   itself), and safety (practical literacy). Loads after lessons.js
   and extends window.LESSONS in place.
   ============================================================ */
(function () {
  "use strict";
  const L = window.LESSONS;
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : (s || "");
  const _rmq = matchMedia && matchMedia("(prefers-reduced-motion: reduce)");
  let RM = _rmq && _rmq.matches;
  if (_rmq && _rmq.addEventListener) _rmq.addEventListener("change", e => { RM = e.matches; });
  const P = (t) => `<p>${t}</p>`;

  /* ---------- checkpoint quiz primitive ----------
     q: { ask, opts: [{t, ok, why}] } — one correct option.
     Skippable, progress dots, a scored reveal at the end. Formal, not
     cutesy: mark, explain, tally. */
  function quiz(host, questions) {
    let qi = 0, answered = false, score = 0;
    const marks = new Array(questions.length).fill(null); // 'right' | 'wrong' | null
    const wrap = el("div", "quiz");
    host.appendChild(wrap);
    const dots = (showCur = true) => `<div class="quiz-dots">${questions.map((_, i) => `<i class="qd${marks[i] ? " " + marks[i] : ""}${showCur && i === qi ? " cur" : ""}"></i>`).join("")}</div>`;
    const restart = () => { qi = 0; score = 0; marks.fill(null); drawQ(); };

    function drawQ() {
      const q = questions[qi];
      wrap.className = "quiz fadein";
      wrap.innerHTML = `<div class="quiz-head"><span class="quiz-tag">Checkpoint</span>${dots()}<button class="quiz-skip" id="qskip">skip ›</button></div>
        <div class="quiz-q">${q.ask}</div>
        <div class="quiz-opts">${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}"><span class="qo-mk"></span><span class="qo-t">${o.t}</span></button>`).join("")}</div>
        <div class="quiz-why" id="qwhy"></div>
        <div class="quiz-foot"><button class="btn primary" id="qnext" disabled>${qi < questions.length - 1 ? "Next question →" : "See result →"}</button></div>`;
      answered = false;
      wrap.querySelector("#qskip").onclick = skip;
      wrap.querySelectorAll(".quiz-opt").forEach(btn => btn.onclick = () => {
        if (answered) return; answered = true;
        const o = q.opts[+btn.dataset.i], right = !!o.ok;
        marks[qi] = right ? "right" : "wrong"; if (right) score++;
        wrap.querySelectorAll(".quiz-opt").forEach((b, i) => {
          b.disabled = true;
          if (q.opts[i].ok) b.classList.add("right");
          else if (b === btn) b.classList.add("wrong");
        });
        const d = wrap.querySelectorAll(".qd")[qi]; if (d) { d.classList.remove("cur"); d.classList.add(marks[qi]); }
        const why = wrap.querySelector("#qwhy");
        why.className = "quiz-why show " + (right ? "ok" : "bad");
        why.innerHTML = (right ? "<b>Correct.</b> " : "<b>Not quite.</b> ") + o.why;
        wrap.querySelector("#qnext").disabled = false;
      });
      wrap.querySelector("#qnext").onclick = () => { if (qi < questions.length - 1) { qi++; drawQ(); } else result(); };
    }

    function skip() {
      wrap.className = "quiz skipped fadein";
      wrap.innerHTML = `<div class="quiz-head"><span class="quiz-tag">Checkpoint</span><span class="quiz-n">skipped</span></div>
        <p class="quiz-skipmsg">No problem — it's here whenever you want to test yourself.</p>
        <div class="quiz-foot"><button class="btn" id="qtake">Take it anyway</button></div>`;
      wrap.querySelector("#qtake").onclick = restart;
    }

    function result() {
      const total = questions.length, pct = score / total;
      const tier = pct === 1 ? ["Nailed it.", "Every one correct — you have this cold."]
        : pct >= 0.5 ? ["Halfway there.", "Some stuck, some slipped — worth one more look at the ones you missed before moving on."]
        : ["Worth a re-read.", "A couple slipped — the “go deeper” panel below will shore them up."];
      wrap.className = "quiz result fadein";
      wrap.innerHTML = `<div class="quiz-result">
        <div class="qr-score"><span class="qr-n">${RM ? score : 0}</span><span class="qr-d">/ ${total}</span></div>
        ${dots(false)}
        <h3>${tier[0]}</h3><p>${tier[1]}</p>
        <div class="quiz-foot"><button class="btn" id="qretake">Retake checkpoint</button></div></div>`;
      wrap.querySelector("#qretake").onclick = restart;
      if (!RM && score > 0) { 
        if (pct === 1 && window.APP && window.APP.confetti) window.APP.confetti();
        const n = wrap.querySelector(".qr-n"); let c = 0; const t = setInterval(() => { c++; n.textContent = c; if (c >= score) clearInterval(t); }, 200); 
      }
    }
    drawQ();
  }

  /* ===================== TRANSACTION — the atomic unit ===================== */
  L.tx = { world: "chain", title: "Inside a transaction", oneliner: "The core unit that moves value", icon: "⇄",
    hero: "You just signed a payment. That signed bundle has a proper name — a <b>transaction</b> — and it is the only thing a blockchain ever really moves. Before it can be packed into a block, look at what it is made of, and where it waits its turn.",
    beats: [
      { n: "01", h: "What a transaction is actually made of", cap: "It isn't a coin changing hands — it's a tiny <b>signed record</b>. Nudge the amount and the signature re-seals to match it. Then tamper with it, and watch the seal break.",
        build(s) {
          const FROM = "0x" + sha256("you-wallet-v1").slice(-16), TO = "0x" + sha256("bob-wallet-v1").slice(-16);
          let amt = 5, nonce = 12, sig = null, tampered = false;
          const compute = () => sha256(FROM + TO + amt + nonce + "your-secret-key");
          const sign = () => { sig = compute(); tampered = false; };
          const valid = () => sig === compute();
          sign();
          const rows = () => [
            ["from", short(FROM, 8, 6), "your address — where the coins leave"],
            ["to", short(TO, 8, 6), "Bob's address — where they land"],
            ["amount", `${amt} coins`, "how much value this one record moves"],
            ["fee", `0.3 coins`, "a tip that makes a miner want to include you"],
            ["nonce", `#${nonce}`, "a counter, so this exact payment can't be replayed twice"],
          ];
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>one transaction · you → Bob</div>
            <div class="txp" id="txp"></div>
            <div class="txsig" id="txsig"></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn" id="dec">− amount</button><button class="btn" id="inc">+ amount</button><button class="btn danger" id="tam">Tamper after signing</button><button class="btn" id="rst">Reset</button></div>
            <div class="note" id="msg" style="text-align:center;margin-top:10px">The signature covers <b>every field above</b> — change any of them and it stops matching.</div>`;
          s.appendChild(wrap);
          function draw() {
            wrap.querySelector("#txp").innerHTML = rows().map(([k, v, note]) => `<div class="txrow"><div class="txrow-top"><span class="txk">${k}</span><span class="txv">${v}</span></div><span class="txn">${note}</span></div>`).join("");
            const ok = valid();
            wrap.querySelector("#txsig").innerHTML = `<div class="txsig-in ${ok ? "ok" : "bad"}"><div class="txrow-top"><span class="txk">signature</span><span class="txv">${short(sig, 12, 10)}</span></div><span class="txn">${ok ? "✓ seals these exact fields — only your secret key could have produced it" : "✕ the amount changed after signing, so the signature no longer matches. Every node rejects it as a forgery."}</span></div>`;
          }
          const reseal = (d) => { amt = Math.max(1, amt + d); nonce++; sign(); draw(); wrap.querySelector("#msg").innerHTML = `You changed the amount and <b>re-signed</b> — a fresh, valid transaction. This is the normal case.`; };
          wrap.querySelector("#inc").onclick = () => reseal(1);
          wrap.querySelector("#dec").onclick = () => reseal(-1);
          wrap.querySelector("#tam").onclick = () => { amt += 1000; draw(); wrap.querySelector("#msg").innerHTML = `<span style="color:var(--red)">An attacker bumped 5 → ${amt} but couldn't re-sign without your key.</span> The stored signature was made over the old amount, so it fails — the tampering is caught instantly.`; };
          wrap.querySelector("#rst").onclick = () => { amt = 5; nonce = 12; sign(); draw(); wrap.querySelector("#msg").innerHTML = `The signature covers <b>every field above</b> — change any of them and it stops matching.`; };
          draw();
        } },
      { n: "02", h: "Where it waits: the mempool", cap: "A broadcast transaction doesn't drop straight into the chain. It lands in the <b>mempool</b> — a shared waiting room every node keeps — and sits there until a miner picks it up. Blocks are small, so miners take the <b>highest fees first</b>.",
        build(s) {
          const BLK = 4;
          const OTHERS = [
            { who: "Carol → Dan", fee: 0.9 }, { who: "Eve → Finn", fee: 0.2 },
            { who: "Gail → Hank", fee: 1.6 }, { who: "Ivy → Jo", fee: 0.5 }, { who: "Ken → Lee", fee: 1.1 },
          ];
          let pool, yourFee, broadcast, lastBlock, done, mining, miningToken = 0;
          function reset() { pool = OTHERS.map(x => ({ ...x, mine: false })); yourFee = 0.3; broadcast = false; lastBlock = false; done = false; mining = false; miningToken++; }
          reset();
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the mempool — everyone's pending transactions</div>
            <div class="mpool"><div class="mpool-h"><span>waiting room</span><span class="mono" id="mpc"></span></div><div class="mpgrid" id="mpg"></div></div>
            <div class="mpblk"><div class="mpblk-h"><span class="lk">⛏</span> the next block · fits ${BLK}</div><div class="mpslots" id="mps"></div></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn primary" id="bc">Broadcast your transaction</button><button class="btn gold" id="raise">Raise your fee +0.5</button><button class="btn" id="mine">⛏ Mine the next block</button><button class="btn" id="rst">Reset</button></div>
            <div class="note" id="msg" style="text-align:center;margin-top:10px">Your payment to Bob is signed and ready. Broadcast it into the mempool.</div>`;
          s.appendChild(wrap);
          const yourTx = () => ({ who: "★ You → Bob", fee: yourFee, mine: true });
          function full() { return broadcast ? [...pool, yourTx()] : pool.slice(); }
          function draw(leaving) {
            const list = full();
            wrap.querySelector("#mpc").textContent = list.length + " waiting";
            wrap.querySelector("#mpg").innerHTML = list.length ? list.map((t, i) =>
              `<div class="mptx${t.mine ? " mine" : ""}${leaving && leaving.includes(t.who) ? " picked" : ""}"><span class="who">${t.who}</span><span class="fee">fee ${t.fee.toFixed(1)}</span></div>`).join("")
              : `<div class="mpempty">empty — every pending transaction has been mined</div>`;
            wrap.querySelector("#mps").innerHTML = Array.from({ length: BLK }, (_, i) => {
              const c = lastBlock && lastBlock[i];
              return `<div class="mpslot${c ? " full" + (c.mine ? " mine" : "") : ""}">${c ? `<span class="who">${c.who}</span><span class="fee">${c.fee.toFixed(1)}</span>` : "empty"}</div>`;
            }).join("");
            wrap.querySelector("#bc").disabled = broadcast || done;
            wrap.querySelector("#raise").disabled = !broadcast || done || mining;
            wrap.querySelector("#mine").disabled = done || mining || full().length === 0;
          }
          wrap.querySelector("#bc").onclick = () => { if (broadcast || done) return; broadcast = true; draw(); wrap.querySelector("#msg").innerHTML = `Your transaction joined the pool at fee <b>${yourFee.toFixed(1)}</b> — now it competes with everyone else's for a spot in the next block.`; };
          wrap.querySelector("#raise").onclick = () => { if (!broadcast || done || mining) return; yourFee += 0.5; draw(); wrap.querySelector("#msg").innerHTML = `You bumped your fee to <b>${yourFee.toFixed(1)}</b>. A higher tip pushes you up the miner's list.`; };
          wrap.querySelector("#rst").onclick = () => { reset(); draw(); wrap.querySelector("#msg").innerHTML = `Your payment to Bob is signed and ready. Broadcast it into the mempool.`; };
          wrap.querySelector("#mine").onclick = () => {
            const list = full(); if (!list.length || done || mining) return;
            const myToken = ++miningToken; mining = true;
            const ranked = list.slice().sort((a, b) => b.fee - a.fee);
            const picked = ranked.slice(0, BLK), pickedNames = picked.map(t => t.who);
            const hadYours = list.some(t => t.mine);
            draw(pickedNames);
            const finish = () => {
              if (myToken !== miningToken) return; // reset or re-mined mid-flight
              mining = false;
              lastBlock = picked.slice();
              const yoursIn = picked.some(t => t.mine);
              pool = pool.filter(t => !pickedNames.includes(t.who));
              if (yoursIn) { broadcast = false; done = true; } // yours left the pool, demo complete
              draw();
              wrap.querySelector("#msg").innerHTML = yoursIn
                ? `<span style="color:var(--green)">Your transaction made the block — confirmed.</span> It paid a competitive fee, so the miner picked it up.`
                : hadYours
                  ? `The miner took the top ${BLK} fees; your <b>${yourFee.toFixed(1)}</b> lost the auction and is <b>still waiting</b>. Raise your fee and mine again.`
                  : `Block sealed with the top ${BLK} fees. Broadcast yours and try again.`;
            };
            RM ? finish() : setTimeout(finish, 620);
          };
          draw();
        } },
      { n: "03", h: "Check yourself", cap: "Two quick questions.",
        build(s) { quiz(s, [
          { ask: "What is a “transaction” on a blockchain?",
            opts: [
              { t: "A small signed record that moves value from one address to another", ok: true, why: "That's it — from, to, amount, fee, nonce, and a signature over all of them. Blocks are just bundles of these." },
              { t: "A coin object that physically travels between wallets", ok: false, why: "Nothing physical moves. A transaction is a signed record; balances are just the running total of everyone's records." },
              { t: "A password that unlocks your account", ok: false, why: "There are no accounts or passwords. A transaction is a signed record; your private key is what signs it." },
            ] },
          { ask: "Your transaction has been sitting in the mempool for a while, unconfirmed. The most likely reason?",
            opts: [
              { t: "Your fee is too low, so miners keep picking higher-fee transactions first", ok: true, why: "Block space is limited and miners are paid by fees, so they take the highest bids first. Raise the fee to jump the queue." },
              { t: "The network deleted it", ok: false, why: "It isn't deleted — it waits in the pool. Miners simply prioritise higher fees when block space is scarce." },
              { t: "You need to sign it again", ok: false, why: "It's already validly signed and waiting. What it lacks is a fee high enough to beat the competition for a block slot." },
            ] },
        ]); } },
    ],
    deeper: P("A transaction is the blockchain's atomic unit: a signed instruction, not a moving object. Bitcoin models it as <b>inputs and outputs</b> (you consume whole previous outputs and create new ones — the “UTXO” model); Ethereum uses running <b>account balances</b> instead. Either way, nodes first check the signature and the rules, then hold it in the <b>mempool</b> until a miner includes it. The <b>nonce</b> stops replay — the same signed payment can't be submitted twice — and the <b>fee</b> is a live auction for scarce block space, which is why fees spike when the network is busy. Nothing is final until it's in a block, and buried under a few more.") };

  /* ===================== INCENTIVES — why anyone mines ===================== */
  L.incentives = { world: "chain", title: "Mining rewards", oneliner: "How mining rewards incentivise honesty", icon: "¤",
    hero: "Mining burns real electricity on quintillions of useless guesses. So why does anyone do it? Because the block itself pays the winner — and that payment is what keeps the whole network honest.",
    beats: [
      { n: "01", h: "The block pays its own miner", cap: "Every block's first entry is special: the <b>coinbase</b>, a payment to the winning miner created out of thin air, plus every <b>fee</b> attached to the transactions inside. Pick transactions from the pool and mine — greedy is allowed.",
        build(s) {
          const POOL = [
            { t: "Alice → Bob: 5", fee: 0.8 }, { t: "Carol → Dan: 12", fee: 0.5 },
            { t: "Eve → Finn: 3", fee: 0.2 }, { t: "Gail → Hank: 40", fee: 1.4 },
            { t: "Ivy → Jo: 7", fee: 0.1 }, { t: "Ken → Lee: 2", fee: 0.6 },
          ];
          const SUBSIDY = 3.125, CAP = 3;
          let picked = [], mined = false;
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the fee market — your block fits ${CAP} transactions</div>
            <div class="feegrid" id="fp"></div>
            <div class="paysheet" id="ps"></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn gold" id="mine" disabled>⛏ Mine the block</button><button class="btn" id="rst">Reset</button></div>
            <div class="note" id="msg" style="text-align:center;margin-top:10px">Miners pick the highest-paying transactions first. That is why fees rise when the network is busy.</div>`;
          s.appendChild(wrap);
          const fees = () => picked.reduce((a, i) => a + POOL[i].fee, 0);
          function draw() {
            wrap.querySelector("#fp").innerHTML = POOL.map((p, i) => {
              const on = picked.includes(i);
              return `<button class="feechip${on ? " on" : ""}" data-i="${i}" ${mined ? "disabled" : ""}><span>${p.t}</span><span class="fee">fee ${p.fee}</span></button>`;
            }).join("");
            wrap.querySelector("#ps").innerHTML = `
              <div class="payrow"><span>block subsidy — new coins, from nowhere</span><b>${SUBSIDY}</b></div>
              <div class="payrow"><span>fees from your ${picked.length} transaction${picked.length === 1 ? "" : "s"}</span><b>${fees().toFixed(1)}</b></div>
              <div class="payrow total"><span>you earn, if you win the race</span><b>${(SUBSIDY + fees()).toFixed(3)} coins</b></div>`;
            wrap.querySelector("#mine").disabled = mined || picked.length === 0;
            wrap.querySelectorAll(".feechip").forEach(b => b.onclick = () => {
              const i = +b.dataset.i;
              if (picked.includes(i)) picked = picked.filter(x => x !== i);
              else if (picked.length < CAP) picked.push(i);
              draw();
            });
          }
          wrap.querySelector("#mine").onclick = () => {
            mined = true; draw();
            const best = [...POOL.keys()].sort((a, b) => POOL[b].fee - POOL[a].fee).slice(0, CAP);
            const bestFee = best.reduce((a, i) => a + POOL[i].fee, 0);
            const yours = fees();
            wrap.querySelector("#msg").innerHTML = yours >= bestFee - 1e-9
              ? `<span style="color:var(--green)">You mined the most profitable block possible — exactly what real miners' software does automatically.</span>`
              : `Sealed for <b>${(SUBSIDY + yours).toFixed(3)}</b> coins. The greediest pick paid <b>${(SUBSIDY + bestFee).toFixed(3)}</b> — real miners always sort by fee.`;
          };
          wrap.querySelector("#rst").onclick = () => { picked = []; mined = false; wrap.querySelector("#msg").textContent = "Miners pick the highest-paying transactions first. That is why fees rise when the network is busy."; draw(); };
          draw();
        } },
      { n: "02", h: "The reward halves, forever", cap: "Bitcoin's subsidy started at 50 coins and <b>halves</b> every four years — which is why there will only ever be 21 million. Drag through the decades and watch new supply dry up while fees take over the job of paying for security.",
        build(s) {
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the halving schedule</div>
            <div class="srow"><span class="nm">year</span><input type="range" id="yr" min="2009" max="2061" value="2026" step="1"><span class="v" id="yrv">2026</span></div>
            <div class="halvestats">
              <div class="hs"><span class="n" id="sub"></span><span class="l">coins per block</span></div>
              <div class="hs"><span class="n" id="sup"></span><span class="l">of 21M issued</span></div>
              <div class="hs"><span class="n" id="hv"></span><span class="l">halvings so far</span></div>
            </div>
            <div class="supplybar"><i id="supbar"></i></div>
            <div class="note" id="hmsg" style="margin-top:10px;text-align:center"></div>`;
          s.appendChild(wrap);
          function upd() {
            const y = +wrap.querySelector("#yr").value;
            const halvings = Math.max(0, Math.floor((y - 2009) / 4));
            const sub = 50 / Math.pow(2, halvings);
            let issued = 0; for (let h = 0; h < halvings; h++) issued += 210000 * (50 / Math.pow(2, h));
            issued += 210000 * sub * (((y - 2009) % 4) / 4);
            const pct = Math.min(100, issued / 21e6 * 100);
            wrap.querySelector("#yrv").textContent = y;
            wrap.querySelector("#sub").textContent = sub >= 0.01 ? (+sub.toFixed(4)).toString() : sub.toExponential(1);
            wrap.querySelector("#sup").textContent = pct.toFixed(pct > 99 ? 2 : 1) + "%";
            wrap.querySelector("#hv").textContent = halvings;
            wrap.querySelector("#supbar").style.width = pct + "%";
            wrap.querySelector("#hmsg").innerHTML =
              y < 2013 ? "Early days: 50 new coins per block, miners on laptops." :
              y < 2030 ? "The subsidy is already small — fees matter more every cycle." :
              y < 2050 ? "New coins have slowed to a trickle. <b>Fees now carry the security budget.</b>" :
              "Near zero forever. If fees can't pay for enough mining, security itself gets cheaper to attack — an open question.";
          }
          wrap.querySelector("#yr").oninput = upd; upd();
        } },
      { n: "03", h: "Check yourself", cap: "Two questions before moving on.",
        build(s) { quiz(s, [
          { ask: "Why do miners spend real electricity on quintillions of guesses?",
            opts: [
              { t: "The winning block pays them new coins plus fees", ok: true, why: "The coinbase subsidy and the fees inside the block are the entire business model of mining." },
              { t: "The network forces every computer to mine", ok: false, why: "Mining is voluntary. Miners do it because the winning block pays — new coins plus fees." },
              { t: "Guessing keeps their hardware warm", ok: false, why: "The heat is a cost, not the goal. Miners are paid by the block itself: new coins plus fees." },
            ] },
          { ask: "When Bitcoin's subsidy eventually reaches zero, what pays for security?",
            opts: [
              { t: "Transaction fees", ok: true, why: "Fees are designed to take over as the subsidy halves away — whether they'll be enough is a genuinely open question." },
              { t: "Nothing — mining stops", ok: false, why: "Fees remain. Every transaction still bids a fee, and those fees go to whoever mines the block." },
              { t: "A central fund tops miners up", ok: false, why: "There is no central anything — that's the point. Fees paid by users are the long-term plan." },
            ] },
        ]); } },
    ],
    deeper: P("The reward is not a bonus bolted on — it <b>is</b> the security model. Honest mining pays steadily; attacking the chain means forfeiting those rewards and burning electricity on a losing race. Satoshi's insight was economic, not cryptographic: make honesty the most profitable strategy and strangers will secure each other's money out of pure self-interest. The <b>halving</b> (every 210,000 blocks) enforces the 21-million cap, and the open question economists argue about: when the subsidy is gone, will fees alone fund enough mining to keep attacks unprofitable?") + P("Satoshi's own words, on why even an attacker with majority power should choose honesty:") + "<blockquote>“He ought to find it more profitable to play by the rules, such rules that favour him with more new coins than everyone else combined, than to undermine the system and the validity of his own wealth.” — <a href='https://bitcoin.org/bitcoin.pdf' target='_blank' rel='noopener'>Satoshi Nakamoto, the Bitcoin whitepaper (2008), §6</a></blockquote>" };

  /* ===================== GOSSIP — the network itself ===================== */
  L.gossip = { world: "consensus", title: "The network", oneliner: "How information spreads without a centre", icon: "◍",
    hero: "There is no server. When you broadcast a payment, you tell a few computers, they tell a few more, and in seconds the whole planet knows. Watch it ripple — and see where forks really come from.",
    beats: [
      { n: "01", h: "Gossip, hop by hop", cap: "Every node knows only its neighbours. Click <b>any node</b> to broadcast a transaction from it and watch the news spread like a rumour — no coordinator, no master list of who to tell.",
        build(s) {
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>a peer-to-peer network — click a node</div><div class="netbox"><svg id="net" viewBox="0 0 640 340"></svg></div><div class="note" id="gmsg" style="text-align:center;margin-top:10px">Each hop takes real time. That delay is the seed of every fork.</div>`;
          s.appendChild(wrap);
          const svg = wrap.querySelector("#net"), NS = "http://www.w3.org/2000/svg";
          // fixed layout: organic but deterministic
          const pts = [[60,60],[190,40],[330,70],[470,45],[580,90],[90,170],[230,150],[370,180],[510,160],[590,220],[50,270],[180,260],[320,290],[460,270],[570,310],[260,210]];
          const edges = []; // connect near neighbours
          pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i) { const d = Math.hypot(a[0]-b[0], a[1]-b[1]); if (d < 150) edges.push([i, j]); } }));
          const nbr = pts.map(() => []); edges.forEach(([a, b]) => { nbr[a].push(b); nbr[b].push(a); });
          let lines = [], dots = [], busy = false;
          edges.forEach(([a, b]) => { const ln = document.createElementNS(NS, "line"); ln.setAttribute("x1", pts[a][0]); ln.setAttribute("y1", pts[a][1]); ln.setAttribute("x2", pts[b][0]); ln.setAttribute("y2", pts[b][1]); ln.setAttribute("class", "netedge"); svg.appendChild(ln); lines.push({ ln, a, b }); });
          pts.forEach((p, i) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 11); c.setAttribute("class", "netnode"); svg.appendChild(c); dots.push(c);
            c.setAttribute("tabindex", "0"); c.setAttribute("role", "button"); c.setAttribute("aria-label", "Broadcast from node " + (i + 1));
            c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.onclick(); } };
            c.onclick = () => { if (busy) return; busy = true; ripple(i, "heard", () => { busy = false; wrap.querySelector("#gmsg").innerHTML = `From node ${i + 1} to all ${pts.length} in a few hops — <b>no one was in charge of delivery.</b>`; }); }; });
          function ripple(src, cls, done) {
            dots.forEach(d => d.setAttribute("class", "netnode")); lines.forEach(({ ln }) => ln.setAttribute("class", "netedge"));
            const seen = new Set([src]); let frontier = [src];
            dots[src].setAttribute("class", "netnode src");
            const step = () => {
              if (!document.contains(svg)) return;
              const next = [];
              frontier.forEach(i => nbr[i].forEach(j => { if (!seen.has(j)) { seen.add(j); next.push(j); dots[j].setAttribute("class", "netnode " + cls);
                const e = lines.find(l => (l.a === i && l.b === j) || (l.a === j && l.b === i)); if (e) e.ln.setAttribute("class", "netedge lit"); } }));
              frontier = next;
              if (next.length) setTimeout(step, 420); else if (done) done();
            };
            setTimeout(step, 420);
          }
        } },
      { n: "02", h: "Two truths, briefly", cap: "Now the key scene: two miners on <b>opposite sides of the world</b> seal a block at nearly the same moment. Both spread outward. Every node believes whichever block <b>reached it first</b> — and the network genuinely splits, purely because news takes time to cross the planet.",
        build(s) {
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>a tie, spreading from both ends</div><div class="netbox"><svg id="net2" viewBox="0 0 640 340"></svg></div>
            <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="race">Both miners find a block</button><button class="btn" id="rr">Reset</button></div>
            <div class="race-legend"><span><i class="sw a"></i>heard miner A's block first</span><span><i class="sw b"></i>heard miner B's block first</span></div>
            <div class="note" id="g2msg" style="text-align:center;margin-top:8px">This split is a <b>fork</b> — the subject of the next lesson.</div>`;
          s.appendChild(wrap);
          const svg = wrap.querySelector("#net2"), NS = "http://www.w3.org/2000/svg";
          const pts = [[45,80],[150,50],[280,80],[410,55],[540,80],[600,150],[80,160],[210,170],[340,160],[470,180],[45,250],[170,280],[300,260],[430,290],[560,260],[250,120]];
          const edges = []; pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && Math.hypot(a[0]-b[0], a[1]-b[1]) < 150) edges.push([i, j]); }));
          const nbr = pts.map(() => []); edges.forEach(([a, b]) => { nbr[a].push(b); nbr[b].push(a); });
          let dots = [], busy = false;
          edges.forEach(([a, b]) => { const ln = document.createElementNS(NS, "line"); ln.setAttribute("x1", pts[a][0]); ln.setAttribute("y1", pts[a][1]); ln.setAttribute("x2", pts[b][0]); ln.setAttribute("y2", pts[b][1]); ln.setAttribute("class", "netedge"); svg.appendChild(ln); });
          pts.forEach((p, i) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 11); c.setAttribute("class", "netnode"); svg.appendChild(c); dots.push(c); });
          const A = 0, B = 14; // far corners
          function reset() { dots.forEach(d => d.setAttribute("class", "netnode")); wrap.querySelector("#g2msg").innerHTML = "This split is a <b>fork</b> — the subject of the next lesson."; }
          wrap.querySelector("#rr").onclick = () => { if (!busy) reset(); };
          wrap.querySelector("#race").onclick = () => {
            if (busy) return; busy = true; reset();
            const owner = {}; owner[A] = "a"; owner[B] = "b";
            dots[A].setAttribute("class", "netnode heard-a src"); dots[B].setAttribute("class", "netnode heard-b src");
            let fa = [A], fb = [B];
            const step = () => {
              if (!document.contains(svg)) { busy = false; return; }
              const na = [], nb = [];
              fa.forEach(i => nbr[i].forEach(j => { if (!(j in owner)) { owner[j] = "a"; na.push(j); dots[j].setAttribute("class", "netnode heard-a"); } }));
              fb.forEach(i => nbr[i].forEach(j => { if (!(j in owner)) { owner[j] = "b"; nb.push(j); dots[j].setAttribute("class", "netnode heard-b"); } }));
              fa = na; fb = nb;
              if (na.length || nb.length) setTimeout(step, 430);
              else { busy = false; const ca = Object.values(owner).filter(v => v === "a").length;
                wrap.querySelector("#g2msg").innerHTML = `<b>${ca}</b> nodes back miner A's block, <b>${pts.length - ca}</b> back miner B's — both sides honest, both convinced. Only the <b>next</b> block can break the tie.`; }
            };
            setTimeout(step, 430);
          };
        } },
      { n: "03", h: "Check yourself", cap: "Two questions.",
        build(s) { quiz(s, [
          { ask: "Why do forks happen even when every single node is honest?",
            opts: [
              { t: "News takes time to travel, so distant nodes can hear different blocks first", ok: true, why: "Propagation delay means two simultaneous blocks each convince the part of the network nearest to them." },
              { t: "Some nodes secretly cheat", ok: false, why: "No cheating needed. Two miners can win at nearly the same instant, and each block reaches nearby nodes first." },
              { t: "The software has a bug", ok: false, why: "It's physics, not a bug: information takes time to cross the planet, so ties briefly split the network." },
            ] },
          { ask: "There is no central server. So how does your transaction reach the whole network?",
            opts: [
              { t: "Each node passes it on to its handful of peers, who pass it on again", ok: true, why: "That's the gossip protocol — no coordinator, no master list. A few hops and the whole planet has it." },
              { t: "It uploads to Bitcoin's head office, which distributes it", ok: false, why: "There is no head office. Nodes only know their own neighbours and relay whatever checks out — news spreads like a rumour." },
              { t: "Miners phone each other to stay in sync", ok: false, why: "Nobody coordinates directly. Each node simply forwards valid data to its peers; that alone floods the network in seconds." },
            ] },
        ]); } },
    ],
    deeper: P("Real nodes connect to a handful of peers and relay whatever checks out — <b>gossip protocol</b>. A transaction crosses the globe in a couple of seconds; a block takes a few more because nodes verify before relaying. That delay fixes a design constant: if blocks came every two seconds, ties would be constant and the chain would fray into forks. Bitcoin's ten-minute rhythm makes the network's propagation delay a rounding error. It also explains why each node's <b>mempool</b> — its waiting room of unconfirmed transactions — is slightly different from its neighbour's: everyone hears the news in a slightly different order.") };

  /* ===================== SAFETY — practical literacy ===================== */
  L.safety = { world: "frontier", title: "Staying safe", oneliner: "Recognising scams and protecting your funds", icon: "‼",
    hero: "Everything you've learned protects the chain. Nothing protects you from being talked out of your own keys. Scams steal more crypto than hacks ever have — and the only defence is pattern-recognition, so let's drill the patterns.",
    beats: [
      { n: "01", h: "Scam or normal? You decide", cap: "Each card is a real situation. Call it — the pattern matters more than the example.",
        build(s) {
          const CARDS = [
            { t: "“Support” DMs you: “your wallet is compromised — send us your 12-word recovery phrase and we'll secure it.”", scam: true,
              why: "Nobody legitimate ever asks for a seed phrase. Whoever holds those words <b>is</b> the wallet. This is the single most common crypto theft." },
            { t: "During setup, your wallet app asks you to write 12 words on paper and keep them offline.", scam: false,
              why: "That is normal self-custody. The red flag is never the phrase existing — it's anyone <b>asking to see it</b>." },
            { t: "An investment platform guarantees 2% daily returns, “risk-free, powered by AI trading.”", scam: true,
              why: "2% daily is ~137,000% a year. Guaranteed returns at that scale are mathematically a Ponzi: early exits are paid with later deposits." },
            { t: "A famous person's account posts: “send 1 coin, receive 2 back — giveaway, 30 minutes only!”", scam: true,
              why: "The giveaway scam. You now know why it's unfixable: <b>a confirmed transaction cannot be reversed</b>. Sent is gone." },
            { t: "A token's website shows anonymous founders, a 7-day-old contract, and “100× guaranteed, get in before the crowd.”", scam: true,
              why: "The rug-pull profile: anonymous team, fresh contract, urgency. The creators hold most tokens and sell into your buying." },
            { t: "An exchange emails that withdrawals are paused for scheduled maintenance, announced on its official status page too.", scam: false,
              why: "Verified on the official site, this is routine. The lesson from FTX still stands though: paused withdrawals with <b>no</b> credible explanation is the moment to worry." },
          ];
          let i = 0, score = 0, locked = false;
          const wrap = el("div", "fcard");
          s.appendChild(wrap);
          function draw() {
            const c = CARDS[i];
            wrap.innerHTML = `<div class="quiz-head"><span class="quiz-tag">Drill</span><span class="quiz-n">${i + 1} / ${CARDS.length} · ${score} right</span></div>
              <div class="scam-card">${c.t}</div>
              <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn danger" id="scam">Scam</button><button class="btn" id="ok">Normal</button></div>
              <div class="quiz-why" id="why"></div>
              <div class="quiz-foot"><button class="btn" id="next" disabled>${i < CARDS.length - 1 ? "Next →" : "Finish"}</button></div>`;
            locked = false;
            const judge = (saidScam) => {
              if (locked) return; locked = true;
              const right = saidScam === c.scam; if (right) score++;
              const why = wrap.querySelector("#why");
              why.className = "quiz-why show " + (right ? "ok" : "bad");
              why.innerHTML = (right ? "<b>Right.</b> " : `<b>It's ${c.scam ? "a scam" : "normal"}.</b> `) + c.why;
              wrap.querySelector("#next").disabled = false;
              wrap.querySelector("#" + (c.scam ? "scam" : "ok")).classList.add("quiz-mark");
              wrap.querySelector("#scam").disabled = wrap.querySelector("#ok").disabled = true;
              wrap.querySelector("#next").textContent = i < CARDS.length - 1 ? "Next →" : "Finish";
              wrap.querySelector("#next").onclick = () => {
                if (i < CARDS.length - 1) { i++; draw(); }
                else wrap.querySelector("#why").innerHTML += `<div style="margin-top:10px"><b>${score}/${CARDS.length}.</b> The pattern behind every card: <b>urgency + secrecy + guaranteed upside = scam.</b></div>`;
              };
            };
            wrap.querySelector("#scam").onclick = () => judge(true);
            wrap.querySelector("#ok").onclick = () => judge(false);
          }
          draw();
        } },
      { n: "02", h: "Why crypto scams sting harder", cap: "The same properties you spent this course learning are exactly what scammers exploit. Flip each protection and see its dark side.",
        build(s) {
          const rows = [
            ["No one can reverse your payment", "No one can reverse the payment you were tricked into sending"],
            ["Your keys mean no bank can freeze you", "Your keys mean no bank can save you — one leaked phrase, total loss"],
            ["Anyone can launch a token, permissionlessly", "Anyone includes people building rug-pulls"],
            ["Transactions are pseudonymous", "Stolen coins vanish behind addresses with no name attached"],
          ];
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>every feature has a shadow — tap to flip</div>` +
            rows.map((r, i) => `<button class="flipRow" data-i="${i}"><span class="side good">✓ ${r[0]}</span><span class="side dark">✕ ${r[1]}</span></button>`).join("") +
            `<div class="note" style="margin-top:10px;text-align:center">This is why "there's no customer support hotline" is both the pitch and the warning.</div>`;
          s.appendChild(wrap);
          wrap.querySelectorAll(".flipRow").forEach(b => b.onclick = () => b.classList.toggle("flipped"));
        } },
    ],
    deeper: P("Three rules cover almost everything. <b>One:</b> the seed phrase is never typed anywhere, never photographed, never told to anyone — no exceptions, and every exception someone offers you is the scam. <b>Two:</b> guaranteed returns do not exist; anyone promising them is paying old investors with new deposits until the music stops. <b>Three:</b> irreversibility means prevention is the whole game — verify addresses and sites <i>before</i> sending, because there is no after. In 2024 alone, scams took multiples of what protocol hacks did. The chain is hard to attack; people are not.") };

  /* ===================== checkpoint injections into existing lessons ===================== */
  function addCheck(id, questions) {
    if (!L[id]) return;
    L[id].beats.push({ n: String(L[id].beats.length + 1).padStart(2, "0"), h: "Check yourself",
      cap: "Quick checkpoint before moving on.", build(s) { quiz(s, questions); } });
  }

  addCheck("hashing", [
    { ask: "You change one letter of a document. What happens to its SHA-256 fingerprint?",
      opts: [
        { t: "It changes completely — about half the bits flip", ok: true, why: "The avalanche effect. There is no 'small change' to a hash; any edit scrambles it entirely." },
        { t: "It changes slightly, near the letter you edited", ok: false, why: "Hashes don't work locally — one flipped letter scrambles the whole 256-bit output. That's the avalanche effect you just saw." },
        { t: "Nothing, unless the file is small", ok: false, why: "Any change, any size: the fingerprint scrambles completely. That's what makes tampering visible." },
      ] },
    { ask: "Given only a hash, how do you get the original data back?",
      opts: [
        { t: "You can't — hashing destroys information", ok: true, why: "Infinitely many inputs share each output, so there is nothing to run backwards. Guessing is the only 'attack', and the space is 2²⁵⁶." },
        { t: "Run SHA-256 in reverse", ok: false, why: "There is no reverse. Hashing throws information away — that one-way property is the entire point." },
        { t: "Ask a fast enough computer", ok: false, why: "Speed doesn't help: reversing SHA-256 by guessing would outlast the age of the universe." },
      ] },
  ]);

  addCheck("keys", [
    { ask: "Someone learns your public key and address. What can they do?",
      opts: [
        { t: "Watch your balance and history — but never spend", ok: true, why: "Public means public: an address exposes its full balance and every transaction, in and out. What it can never do is spend — going backwards to the private key is the discrete-log problem: practically impossible." },
        { t: "Spend your coins", ok: false, why: "Spending requires a signature, and only the private key can produce one. The public key can't be run backwards." },
        { t: "Change your past transactions", ok: false, why: "Past transactions are sealed in the chain; and without your private key, no new signature can be forged either." },
      ] },
    { ask: "Why is it safe to post your public address on your website so people can pay you?",
      opts: [
        { t: "The address lets people pay you but never spend — only your private key can sign", ok: true, why: "Public key and address come one-way from the private key. Receiving is public; spending needs the secret only you hold." },
        { t: "The network hides the address after the first payment", ok: false, why: "Addresses stay public and reusable forever. Safety comes from the one-way maths, not from hiding anything." },
        { t: "It isn't safe — you should keep your address secret", ok: false, why: "The address is meant to be shared; that's how people pay you. The private key is the only thing you ever guard." },
      ] },
  ]);

  addCheck("chainlink", [
    { ask: "You secretly edit a transaction in block #47 of a 100-block chain. What breaks?",
      opts: [
        { t: "Every block from #48 onward — their links stop matching", ok: true, why: "Block #48's 'prev' field no longer matches #47's new hash, and so on up the chain. The edit is visible instantly, everywhere." },
        { t: "Only block #47", ok: false, why: "Block #48 stored #47's old fingerprint — the mismatch cascades through every later block. That cascade is the chain's whole defence." },
        { t: "Nothing, if the edit is small", ok: false, why: "Any edit avalanches #47's hash, and every later block's 'prev' link stops matching. Small doesn't exist here." },
      ] },
    { ask: "What actually links one block to the block before it?",
      opts: [
        { t: "Each block stores the previous block's fingerprint in its own header", ok: true, why: "That shared hash is the link. Edit an old block and its fingerprint changes, so the next block's stored copy no longer matches." },
        { t: "The blocks are saved next to each other on disk", ok: false, why: "Physical order means nothing. The link is cryptographic — each block records the exact hash of the one before it." },
        { t: "A central index maps block numbers to positions", ok: false, why: "There is no central index. The chain is nothing but each block carrying the previous block's hash." },
      ] },
  ]);

  addCheck("forks", [
    { ask: "Your payment has 1 confirmation. The seller of a house asks you to wait for more. Why?",
      opts: [
        { t: "A recent block can still be orphaned by a competing branch", ok: true, why: "Finality is probabilistic: each block stacked on top makes reversal exponentially harder. Big payments deserve deep burial." },
        { t: "The bank hasn't approved it yet", ok: false, why: "There is no bank. The risk is a reorg — a competing branch replacing recent blocks — which more confirmations make vanishingly unlikely." },
        { t: "Blocks expire if not renewed", ok: false, why: "Blocks don't expire. The concern is a reorg replacing recent blocks — confirmations bury your payment deeper." },
      ] },
    { ask: "Two miners publish a block at the same height in the same second. What decides the winner?",
      opts: [
        { t: "Whichever branch the next block extends — the chain with more work wins", ok: true, why: "The tie is temporary. The first branch to get another block on top has more accumulated work, and the network abandons the other." },
        { t: "The block with the earlier timestamp", ok: false, why: "Timestamps can't be trusted or globally ordered. The rule is objective: the chain with the most work (usually the longer one) wins." },
        { t: "A vote among all the miners", ok: false, why: "No one votes. Miners build on the chain they saw first, and whichever branch grows longer first becomes canonical." },
      ] },
  ]);

  addCheck("attack", [
    { ask: "An attacker controls 60% of all mining power. Which of these can they do?",
      opts: [
        { t: "Reverse their own recent payments", ok: true, why: "Majority hashpower can out-race the honest chain and double-spend — but it still can't forge signatures or steal keys it doesn't hold." },
        { t: "Steal coins from any wallet", ok: false, why: "Never. Spending needs a valid signature, and hashpower doesn't crack private keys. Majority power reverses recent history; it doesn't forge ownership." },
        { t: "Print unlimited new coins", ok: false, why: "Every node checks every block against the rules; a block minting extra coins is rejected no matter who mined it." },
      ] },
    { ask: "An attacker has only 30% of the hashpower. As the victim waits for more confirmations, the odds of a successful reversal…",
      opts: [
        { t: "Fall exponentially — each confirmation makes catching up far less likely", ok: true, why: "Below 50% the attacker loses ground on average, so the chance of ever catching up decays fast with every block stacked on top." },
        { t: "Stay the same however long you wait", ok: false, why: "They don't. With a minority of the power the attacker falls behind each block, so waiting for confirmations crushes the odds." },
        { t: "Rise — waiting actually helps the attacker", ok: false, why: "The opposite. Below 50%, more confirmations bury the payment deeper and make reversal exponentially less likely." },
      ] },
  ]);

  addCheck("whatis", [
    { ask: "In one line — what is a blockchain?",
      opts: [
        { t: "A shared record, chained by fingerprints, copied to everyone", ok: true, why: "Blocks of records, linked by hashes, replicated across a network. Every other lesson is just how each of those parts works." },
        { t: "A faster kind of database", ok: false, why: "It's actually far slower than a database — the point isn't speed, it's a shared record nobody can quietly rewrite." },
        { t: "A company that processes payments", ok: false, why: "There is no company and no centre — just a record kept identically by thousands of computers." },
      ] },
    { ask: "What actually makes a blockchain hard to tamper with?",
      opts: [
        { t: "Any edit changes a fingerprint, and thousands of copies would disagree", ok: true, why: "Tampering breaks the hash links (visible at once) and every other copy still holds the real history, so the lie is outvoted." },
        { t: "The data is encrypted so no one can read it", ok: false, why: "Blockchain data is usually public, not encrypted. Its defence is that edits are detectable and the honest majority's copy wins." },
        { t: "A firewall protects the main server", ok: false, why: "There is no main server. Safety comes from replication plus hash-linking, not from guarding one machine." },
      ] },
  ]);

  addCheck("block", [
    { ask: "What actually seals a block shut?",
      opts: [
        { t: "Its own hash — one fingerprint computed over everything inside", ok: true, why: "The seal is nothing but a hash of the block's contents. Change any transaction and the fingerprint no longer matches — the seal is the contents." },
        { t: "Encryption — the contents are locked so no one can read them", ok: false, why: "Nothing is encrypted; a block's contents are public. The seal is a hash — anyone can read the data, but no one can change it without the fingerprint giving them away." },
        { t: "The miner's password", ok: false, why: "There are no passwords anywhere in the system. The seal is the block's own hash, computed over everything inside — it answers to the data, not to any person." },
      ] },
    { ask: "You quietly edit one transaction inside a sealed block. What gives you away?",
      opts: [
        { t: "The block's fingerprint no longer matches its contents — anyone re-hashing it sees the break", ok: true, why: "The seal was computed over the old contents. One re-hash exposes the mismatch — tampering isn't impossible, it's instantly detectable." },
        { t: "Nothing — a sealed block physically cannot be edited", ok: false, why: "You can edit your own copy freely — it's just data. What you can't do is edit it undetectably: the stored seal no longer matches the new contents, and one re-hash exposes it." },
        { t: "The block re-seals itself around the change automatically", ok: false, why: "Nothing updates itself. The old seal stays put, the contents now disagree with it, and anyone who re-hashes the block sees the break at once." },
      ] },
    { ask: "Building a block takes a millisecond on any laptop. So where does a block's cost actually come from?",
      opts: [
        { t: "From adding it to the chain — the mining work, not the assembly", ok: true, why: "Assembling a block is free; anyone can do it. The expense is the Proof-of-Work race to append it — that's what the nonce and reward lessons build next." },
        { t: "From the computing power needed to bundle the transactions", ok: false, why: "Bundling is trivial — a laptop does it in a millisecond. The cost lives entirely in the mining that appends the block to the chain." },
        { t: "From a licence fee blocks must pay to the network", ok: false, why: "There are no licences and no one to pay a fee to. The cost is physical: the electricity burned finding a nonce that seals the block onto the chain." },
      ] },
  ]);

  addCheck("merkle", [
    { ask: "Your transaction sits in a block with a million others. What do you need to prove it's really in there?",
      opts: [
        { t: "About 20 sibling hashes — one per level of the tree", ok: true, why: "The proof is one short branch: your transaction plus log₂(n) siblings, re-hashed up to the root. A million transactions, ~20 hashes." },
        { t: "The whole block, so you can check every transaction", ok: false, why: "That's exactly what the tree spares you. You need only the branch from your transaction to the root — ~20 hashes for a million transactions, not the block itself." },
        { t: "Just the Merkle root — it already contains your transaction", ok: false, why: "The root alone proves nothing about any single transaction. You need the sibling hashes along your path, so re-hashing lands you on that root." },
      ] },
    { ask: "You verify a Merkle proof for your payment. What do you learn about the other transactions in the block?",
      opts: [
        { t: "Nothing but a few sibling hashes — their contents stay unseen", ok: true, why: "A proof reveals only fingerprints along your path, never the block's contents. That's why light wallets can verify a payment without downloading anything else." },
        { t: "Everything — the proof unpacks the whole block", ok: false, why: "The proof carries only sibling hashes, and a hash can't be run backwards. You learn your payment is in the block and nothing at all about the rest." },
        { t: "Their senders and amounts, since the siblings are raw transactions", ok: false, why: "The siblings are hashes, not transactions — irreversible fingerprints. The proof shows your payment belongs, while every other record stays private to you." },
      ] },
    { ask: "An untrusted server hands your phone wallet a forged proof. Why doesn't the lie work?",
      opts: [
        { t: "Fake siblings hash up to the wrong root, so the proof fails against the header", ok: true, why: "You re-hash the branch yourself and compare with the root already in the block header. Any forged step lands on a different root — you never trusted the server, only the maths." },
        { t: "Servers that lie get banned from the network", ok: false, why: "No one polices servers, and no one needs to. The forged branch simply hashes to the wrong root, so your wallet rejects it on the spot — trust the maths, not the source." },
        { t: "Proofs are signed by miners, and forgers can't sign", ok: false, why: "No signature is involved. The proof checks itself: re-hash the branch and it either lands on the header's Merkle root or it doesn't. A forgery can't survive that." },
      ] },
  ]);

  addCheck("nonce", [
    { ask: "While hunting for a valid block, what is the miner allowed to change?",
      opts: [
        { t: "Only the nonce — every other field is frozen", ok: true, why: "The data, the prev link, the merkle root, the time — all fixed. The nonce is the one dial, and mining is nothing but turning it." },
        { t: "The transactions, to nudge the hash towards zeros", ok: false, why: "Change a transaction and you're mining a different block — and hashes can't be nudged anyway. The only legitimate dial is the nonce." },
        { t: "The difficulty target, to make its own job easier", ok: false, why: "The target is set by the protocol for everyone at once — no miner touches it. All a miner can turn is the nonce." },
      ] },
    { ask: "Mining is often described as ‘solving complex maths problems’. What is a miner actually doing?",
      opts: [
        { t: "Guessing — re-rolling one number and re-hashing, hoping to land under the target", ok: true, why: "There is no equation and no cleverness. Hash output is unpredictable, so brute-force re-rolling is the only strategy — quintillions of guesses, pure chance." },
        { t: "Solving equations too hard for ordinary computers", ok: false, why: "There's nothing to solve. A hash can't be steered, so miners just increment the nonce and re-hash — a lottery, not a puzzle." },
        { t: "Decrypting the transactions inside the block", ok: false, why: "Nothing is encrypted, so there's nothing to decrypt. Mining is guessing nonces until the block's hash happens to fall in the target zone." },
      ] },
    { ask: "Finding a winning nonce takes quintillions of guesses. How much work is it for everyone else to check it?",
      opts: [
        { t: "One hash — verification is instant, and that asymmetry powers everything", ok: true, why: "Hash the block once and see the leading zeros for yourself. Staggeringly expensive to produce, one hash to verify — that lopsidedness is what makes Proof of Work usable." },
        { t: "The same quintillions — checkers must redo the search", ok: false, why: "Only the search is expensive. Verifying takes a single hash of the finished block — that produce-hard, check-easy asymmetry is the whole point." },
        { t: "None — the network takes the winning miner's word for it", ok: false, why: "No one is trusted, ever. Every node re-hashes the block itself — it just happens that checking costs one hash while finding cost quintillions." },
      ] },
  ]);

  addCheck("pos", [
    { ask: "A validator is caught signing two conflicting blocks. What does it lose?",
      opts: [
        { t: "A slice of its staked coins — burned — plus its place in the validator set", ok: true, why: "Slashing destroys the stake itself, not just income. The bond is real money at risk; that threat is the entire security model." },
        { t: "Only its future rewards — the staked coins themselves are safe", ok: false, why: "That's the expensive misconception. Slashing burns the staked coins — the capital, not just the income stream — and ejects the validator. If only rewards were at risk, cheating would be nearly free." },
        { t: "Nothing at first — slashing only follows repeat offences", ok: false, why: "There are no warnings. One provable double-sign triggers the burn and ejection immediately — the protocol punishes the act, not a pattern." },
      ] },
    { ask: "One validator cheats alone; separately, a third of all validators cheat together. How do the penalties compare?",
      opts: [
        { t: "The penalty scales with how many are slashed together — a coordinated attack can burn everything", ok: true, why: "That's the correlation penalty: a lone fault costs a little, but the more stake slashed at once, the bigger every cheater's burn — up to the entire stake. Exactly what makes an organised attack suicidal." },
        { t: "It's the same fine either way — cheating is cheating", ok: false, why: "The penalty deliberately isn't flat. It scales with the total stake slashed around the same time, so lone accidents stay cheap while coordinated attacks approach total loss." },
        { t: "Only the organiser is slashed; followers keep their stake", ok: false, why: "Every cheating validator is slashed, and the correlation penalty makes each burn bigger the more of them there are. Joining an attack multiplies your own loss." },
      ] },
    { ask: "Why can't an attacker just spin up a thousand fake validators and outvote everyone?",
      opts: [
        { t: "Each validator needs its own real stake — a thousand validators cost a thousand bonds", ok: true, why: "Identities are free; capital isn't. It's the same Sybil defence as mining, with money at risk instead of electricity burned." },
        { t: "The network verifies each validator's real-world identity", ok: false, why: "No one checks identities — the system is permissionless. What stops the swarm is that every validator must post its own stake, so fake identities cost real capital." },
        { t: "The protocol allows only one validator per computer", ok: false, why: "One machine can happily run many validators. The limit is economic, not technical: each one needs its own staked bond, so influence costs capital." },
      ] },
  ]);

  addCheck("contracts", [
    { ask: "What is a smart contract, really?",
      opts: [
        { t: "A program stored on the chain that every node runs identically", ok: true, why: "Deterministic code, executed in lockstep by thousands of computers that all agree on the result. Neither ‘smart’ nor a ‘contract’ — just an unstoppable program." },
        { t: "A legal agreement uploaded to the blockchain", ok: false, why: "No lawyers involved. It's a program — code that holds funds and moves them by its own rules, which every node runs and agrees on." },
        { t: "An AI that negotiates deals between users", ok: false, why: "Nothing intelligent about it — that's rather the point. It's plain deterministic code that does exactly what it says, every time, with no judgement." },
      ] },
    { ask: "A serious bug is found in a deployed contract holding user funds. What can its developers do, by default?",
      opts: [
        { t: "Nothing — deployed code can't be patched, and the flaw is live", ok: true, why: "Immutable code means immutable bugs; that's why exploits have cost billions. (Some teams deploy behind an upgradeable proxy — which fixes patching by reintroducing a trusted party.)" },
        { t: "Push an update, the way any app does", ok: false, why: "There's no update channel — deployed code is part of the chain's history. Immutable code means immutable bugs, and no admin can pause the drain." },
        { t: "Ask the miners to vote the bug away", ok: false, why: "Miners order transactions; they don't edit contracts. Rewriting deployed code would mean rewriting the chain itself — the very thing the whole design prevents." },
      ] },
    { ask: "Why does every operation in a contract cost gas?",
      opts: [
        { t: "Thousands of nodes run your code — gas prices each step, rationing the shared computer and killing infinite loops", ok: true, why: "You're renting the world's most replicated computer. Pricing every operation keeps you honest about its cost — and a loop that can't pay simply halts." },
        { t: "Gas is the profit of the company that owns the blockchain", ok: false, why: "No company owns the chain. Gas pays the validators who actually execute your code, and it rations a computer that thousands of machines run in unison." },
        { t: "Gas is a refundable deposit to prove you're serious", ok: false, why: "It's spent, not deposited — payment for computation performed. Each operation costs gas so heavy programs pay their way and endless loops run out of fuel." },
      ] },
  ]);

  addCheck("wallets", [
    { ask: "Where, exactly, are your coins?",
      opts: [
        { t: "On the chain — the wallet holds only the keys that control them", ok: true, why: "The balance is an entry in the shared ledger, replicated everywhere. Your wallet holds the secret that can sign it away — keys, never coins." },
        { t: "Inside the wallet app on your phone", ok: false, why: "The most expensive misunderstanding in crypto. The coins are entries on the chain itself; the app holds only your keys. Delete the app and the coins sit exactly where they were." },
        { t: "Nowhere until you withdraw them to cash", ok: false, why: "They fully exist — as entries in a ledger thousands of computers agree on. What your wallet contributes is the key that proves those entries answer to you." },
      ] },
    { ask: "Your phone — wallet app and all — falls in the sea. Your crypto is…",
      opts: [
        { t: "Safe — the seed phrase re-derives every key on any new device", ok: true, why: "The coins never left the chain, and derivation is deterministic: same words in, same keys out, forever. The phrase on paper is the wallet; the phone was only a window." },
        { t: "At the bottom of the sea with the phone", ok: false, why: "The coins were never in the phone — they're on the chain. Type your seed phrase into any wallet and the same keys are re-derived, exactly as before." },
        { t: "Recoverable once the wallet company restores your account", ok: false, why: "There's no account and no company holding one — that's the point of self-custody. Recovery is the seed phrase re-deriving your keys; without it, no one can help." },
      ] },
    { ask: "You keep your coins on an exchange, in an account with your name on it. Who actually controls them?",
      opts: [
        { t: "The exchange — it holds the keys; you hold a promise", ok: true, why: "Custody follows the keys, not the login. Your balance is a claim on the exchange's books — honoured until it freezes withdrawals or fails, as FTX did." },
        { t: "You — the account is in your name", ok: false, why: "The name on the login changes nothing: the exchange signs, so the exchange controls. ‘Not your keys, not your coins’ is precisely this situation." },
        { t: "No one — coins on a chain have no controller", ok: false, why: "Whoever holds the key controls the coins — and here that's the exchange. On-chain assets always answer to a key; the only question is whose hand it's in." },
      ] },
  ]);

  addCheck("layer2", [
    { ask: "Why is the base chain so slow — 7 to 15 transactions a second?",
      opts: [
        { t: "By design — every node re-checks every transaction, and that redundancy is the security", ok: true, why: "Thousands of independent verifications per transaction is the whole defence. Speed it up by checking less and you're quietly selling the security." },
        { t: "The code is old and just needs optimising", ok: false, why: "No optimisation closes the gap, because the slowness is bought deliberately: every node verifies everything. Layer 2 works around that constraint instead of breaking it." },
        { t: "There aren't enough servers yet", ok: false, why: "Adding nodes adds no speed — each one still re-checks every transaction. That total redundancy is the security, which is why scaling has to happen a layer up." },
      ] },
    { ask: "How does a rollup actually deliver more transactions per second?",
      opts: [
        { t: "It executes them off-chain, then posts a compressed summary and proof back to the main chain", ok: true, why: "The heavy work moves off-chain; only a tiny, checkable summary touches the expensive base layer. Thousands of payments settle in one block's worth of space." },
        { t: "It's a separate, faster blockchain you simply trust instead", ok: false, why: "That describes a sidechain — different security, your own risk. A rollup posts its data and proofs back to the main chain, so the base layer still underwrites every transaction." },
        { t: "It skips verification to save time", ok: false, why: "Nothing goes unverified — the batch is either proven valid up front (zk) or open to fraud challenges (optimistic). The saving comes from doing the work off-chain, not from skipping it." },
      ] },
    { ask: "Where does a rollup's security ultimately come from?",
      opts: [
        { t: "The base chain — data and proofs posted to Layer 1 mean cheating can be caught and proven", ok: true, why: "The rollup inherits Layer 1's security precisely because its data lands there: anyone can reconstruct its state and check or challenge the summary. The operator has nowhere to hide." },
        { t: "The good reputation of the rollup's operator", ok: false, why: "Reputation is exactly what the design refuses to rely on. Data and proofs posted to Layer 1 make cheating provable by anyone — trust the base chain, not the company." },
        { t: "Its own separate army of miners", ok: false, why: "A rollup has no miners of its own — that's what keeps it cheap. It borrows the base chain's security by posting its data and proofs there for anyone to verify." },
      ] },
  ]);

  addCheck("zk", [
    { ask: "What does a zero-knowledge proof let Peggy do?",
      opts: [
        { t: "Convince Victor a statement is true while revealing nothing else — not even the secret", ok: true, why: "Truth without disclosure: Victor ends up certain, yet learns only that the claim holds. The secret itself never crosses the table." },
        { t: "Encrypt her secret so Victor can't read it", ok: false, why: "Encryption hides data; it convinces no one of anything. A zero-knowledge proof does the opposite job — it makes Victor certain a claim is true while disclosing nothing." },
        { t: "Hide her identity from the network completely", ok: false, why: "Anonymity is a different problem. The proof hides the contents of a claim — Victor learns it's true and nothing more. Who is speaking is a separate question." },
      ] },
    { ask: "In the cave game, a cheater survives one round half the time. Why does Victor still end up certain?",
      opts: [
        { t: "Each round is a fresh 50% chance of exposure — twenty rounds leave a bluffer roughly one-in-a-million odds", ok: true, why: "The halving compounds: ½ × ½ × ½… Confidence is never absolute after any single round, but it grows exponentially — soon indistinguishable from certainty." },
        { t: "After enough rounds, Victor works out the secret word himself", ok: false, why: "Victor never learns the word — that's the zero-knowledge part. What grows is his statistical certainty: a cheater's survival odds halve every round until bluffing is effectively impossible." },
        { t: "One passed round is proof enough", ok: false, why: "One round proves little — a cheater passes it half the time by luck. Certainty comes from repetition: each round halves a bluffer's odds, and the halvings multiply." },
      ] },
    { ask: "A zk-rollup settles thousands of transactions with one proof. Does that mean your transactions are hidden?",
      opts: [
        { t: "Usually not — the ‘zk’ buys a tiny validity proof; most zk-rollups publish their transaction data", ok: true, why: "In rollups the maths is used for compactness, not secrecy: one small proof that the whole batch was valid. The data itself generally lands on the main chain for anyone to read." },
        { t: "Yes — zero-knowledge means nobody can see what happened", ok: false, why: "A natural guess, but no: most zk-rollups publish all their transaction data to the main chain. The zero-knowledge maths compresses proof of validity — privacy needs a different design, like Zcash." },
        { t: "Yes — hiding the data is what makes them cheap", ok: false, why: "The saving comes from verification, not secrecy: one tiny proof replaces re-executing thousands of transactions. The data is still published — compressed, but public." },
      ] },
  ]);
})();
