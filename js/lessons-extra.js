/* ============================================================
   lessons-extra.js: checkpoint quizzes and the three lessons that
   complete the story: incentives (why mine?), gossip (the network
   itself), and safety (practical literacy). Loads after lessons.js
   and extends window.LESSONS in place.
   ============================================================ */
import { LESSONS as L } from './lessons.js';
import { STORE } from './store.js';
import { sha256 } from './sha256.js';

export const QUIZ = (function () {
  "use strict";
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const short = (s, a = 8, b = 6) => s && s.length > a + b + 1 ? s.slice(0, a) + "…" + s.slice(-b) : (s || "");
  const _rmq = matchMedia && matchMedia("(prefers-reduced-motion: reduce)");
  let RM = _rmq && _rmq.matches;
  if (_rmq && _rmq.addEventListener) _rmq.addEventListener("change", e => { RM = e.matches; });
  const P = (t) => `<p>${t}</p>`;

  /* ---------- checkpoint quiz primitive ----------
     q: { ask, opts: [{t, ok, why}] } (one correct option).
     Skippable, progress dots, a scored reveal at the end. Formal, not
     cutesy: mark, explain, tally. */
  function quiz(host, questions, opts) {
    opts = opts || {};
    let qi = 0, answered = false, score = 0;
    const marks = new Array(questions.length).fill(null); // 'right' | 'wrong' | null
    const wrap = el("div", "quiz");
    host.appendChild(wrap);
    const dots = (showCur = true) => `<div class="quiz-dots">${questions.map((_, i) => `<i class="qd${marks[i] ? " " + marks[i] : ""}${showCur && i === qi ? " cur" : ""}"></i>`).join("")}</div>`;
    const restart = () => { qi = 0; score = 0; marks.fill(null); drawQ(); };

    function drawQ() {
      const q = questions[qi];
      if (!q._shuffled) { q._shuffled = true; for (let i = q.opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q.opts[i], q.opts[j]] = [q.opts[j], q.opts[i]]; } }
      wrap.className = "quiz fadein";
      wrap.innerHTML = `<div class="quiz-head"><span class="quiz-tag">${opts.tag || "Checkpoint"}</span>${dots()}<button class="quiz-skip" id="qskip">skip ›</button></div>
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
        <p class="quiz-skipmsg">No problem. It's here whenever you want to test yourself.</p>
        <div class="quiz-foot"><button class="btn" id="qtake">Take it anyway</button></div>`;
      wrap.querySelector("#qtake").onclick = restart;
    }

    function result() {
      const total = questions.length, pct = score / total;
      if (opts.onDone) opts.onDone(score, total);
      const tier = pct === 1 ? ["Nailed it.", "Every one correct. You have this cold."]
        : pct >= 0.5 ? ["Halfway there.", "Some stuck, some slipped. Take another look at the ones you missed before moving on."]
        : ["Worth a re-read.", "A couple slipped. The “go deeper” panel below will shore them up."];
      wrap.className = "quiz result fadein";
      wrap.innerHTML = `<div class="quiz-result">
        <div class="qr-score"><span class="qr-n">${RM ? score : 0}</span><span class="qr-d">/ ${total}</span></div>
        ${dots(false)}
        <h3>${tier[0]}</h3><p>${tier[1]}</p>
        <div class="quiz-foot"><button class="btn" id="qretake">Retake checkpoint</button></div></div>`;
      wrap.querySelector("#qretake").onclick = restart;
      if (!RM && score > 0) { 
        if (pct === 1 && window.APP && window.APP.confetti) window.APP.confetti(wrap.querySelector(".qr-score"));
        const n = wrap.querySelector(".qr-n"); let c = 0; const t = setInterval(() => { c++; n.textContent = c; if (c >= score) clearInterval(t); }, 200); 
      }
    }
    drawQ();
  }

  /* ===================== TRANSACTION: the atomic unit ===================== */
  L.tx = { world: "chain", title: "Inside a transaction", oneliner: "The core unit that moves value", icon: "⇄",
    hero: "You just signed a payment. That signed bundle has a proper name: a <b>transaction</b>. It is the only thing a blockchain ever really moves. Before it can be packed into a block, look at what it is made of, and where it waits its turn.",
    beats: [
      { n: "01", h: "What a transaction is actually made of", cap: "It isn't a coin changing hands. It is a tiny <b>signed record</b>. Nudge the amount and the signature re-seals to match it. Then tamper with it, and watch the seal break.",
        build(s) {
          const FROM = "0x" + sha256("you-wallet-v1").slice(-16), TO = "0x" + sha256("bob-wallet-v1").slice(-16);
          let amt = 5, nonce = 12, sig = null, tampered = false;
          const compute = () => sha256(FROM + TO + amt + nonce + "your-secret-key");
          const sign = () => { sig = compute(); tampered = false; };
          const valid = () => sig === compute();
          sign();
          const rows = () => [
            ["from", short(FROM, 8, 6), "your address (where the coins leave)"],
            ["to", short(TO, 8, 6), "Bob's address (where they land)"],
            ["amount", `${amt} coins`, "how much value this one record moves"],
            ["fee", `0.3 coins`, "a tip that makes a miner want to include you"],
            ["nonce", `#${nonce}`, "a counter, so this exact payment can't be replayed twice"],
          ];
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>one transaction · you → Bob</div>
            <div class="txp" id="txp"></div>
            <div class="txsig" id="txsig"></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn" id="dec">− amount</button><button class="btn" id="inc">+ amount</button><button class="btn danger" id="tam">Tamper after signing</button><button class="btn" id="rst">Reset</button></div>
            <div class="note" id="msg" style="text-align:center;margin-top:10px">The signature covers <b>every field above</b>. Change any of them and it stops matching.</div>`;
          s.appendChild(wrap);
          function draw() {
            wrap.querySelector("#txp").innerHTML = rows().map(([k, v, note]) => `<div class="txrow"><div class="txrow-top"><span class="txk">${k}</span><span class="txv">${v}</span></div><span class="txn">${note}</span></div>`).join("");
            const ok = valid();
            wrap.querySelector("#txsig").innerHTML = `<div class="txsig-in ${ok ? "ok" : "bad"}"><div class="txrow-top"><span class="txk">signature</span><span class="txv">${short(sig, 12, 10)}</span></div><span class="txn">${ok ? "✓ seals these exact fields (only your secret key could have produced it" : "✕ the amount changed after signing, so the signature no longer matches. Every node rejects it as a forgery."}</span></div>`;
          }
          const reseal = (d) => { amt = Math.max(1, amt + d); nonce++; sign(); draw(); wrap.querySelector("#msg").innerHTML = `You changed the amount and <b>re-signed</b>, creating a fresh, valid transaction. This is the normal case.`; };
          wrap.querySelector("#inc").onclick = () => reseal(1);
          wrap.querySelector("#dec").onclick = () => reseal(-1);
          wrap.querySelector("#tam").onclick = () => { amt += 1000; draw(); wrap.querySelector("#msg").innerHTML = `<span style="color:var(--red)">An attacker bumped 5 → ${amt} but couldn't re-sign without your key.</span> The stored signature was made over the old amount, so it fails. The tampering is caught instantly.`; };
          wrap.querySelector("#rst").onclick = () => { amt = 5; nonce = 12; sign(); draw(); wrap.querySelector("#msg").innerHTML = `The signature covers <b>every field above</b>. Change any of them and it stops matching.`; };
          draw();
        } },
      { n: "02", h: "Where it waits: the mempool", cap: "A broadcast transaction doesn't drop straight into the chain. It lands in the <b>mempool</b> (a shared waiting room every node keeps) and sits there until a miner picks it up. Blocks are small, so miners take the <b>highest fees first</b>.",
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
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the mempool. everyone's pending transactions</div>
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
              : `<div class="mpempty">empty: every pending transaction has been mined</div>`;
            wrap.querySelector("#mps").innerHTML = Array.from({ length: BLK }, (_, i) => {
              const c = lastBlock && lastBlock[i];
              return `<div class="mpslot${c ? " full" + (c.mine ? " mine" : "") : ""}">${c ? `<span class="who">${c.who}</span><span class="fee">${c.fee.toFixed(1)}</span>` : "empty"}</div>`;
            }).join("");
            wrap.querySelector("#bc").disabled = broadcast || done;
            wrap.querySelector("#raise").disabled = !broadcast || done || mining;
            wrap.querySelector("#mine").disabled = done || mining || full().length === 0;
          }
          wrap.querySelector("#bc").onclick = () => { if (broadcast || done) return; broadcast = true; draw(); wrap.querySelector("#msg").innerHTML = `Your transaction joined the pool at fee <b>${yourFee.toFixed(1)}</b>. Now it competes with everyone else's for a spot in the next block.`; };
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
                ? `<span style="color:var(--green)">Your transaction made the block (confirmed.</span> It paid a competitive fee, so the miner picked it up.`
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
              { t: "A small signed record that moves value from one address to another", ok: true, why: "That is it: from, to, amount, fee, nonce, and a signature over all of them. Blocks are just bundles of these." },
              { t: "A coin object that physically travels between wallets", ok: false, why: "Nothing physical moves. A transaction is a signed record; balances are just the running total of everyone's records." },
              { t: "A password that unlocks your account", ok: false, why: "There are no accounts or passwords. A transaction is a signed record; your private key is what signs it." },
            ] },
          { ask: "Your transaction has been sitting in the mempool for a while, unconfirmed. The most likely reason?",
            opts: [
              { t: "Your fee is too low, so miners keep picking higher-fee transactions first", ok: true, why: "Block space is limited and miners are paid by fees, so they take the highest bids first. Raise the fee to jump the queue." },
              { t: "The network deleted it", ok: false, why: "It isn't deleted. It waits in the pool. Miners simply prioritise higher fees when block space is scarce." },
              { t: "You need to sign it again", ok: false, why: "It's already validly signed and waiting. What it lacks is a fee high enough to beat the competition for a block slot." },
            ] },
        ]); } },
    ],
    deeper: P("A transaction is the blockchain's atomic unit: a signed instruction, not a moving object. Bitcoin models it as <b>inputs and outputs</b> (you consume whole previous outputs and create new ones, known as the “UTXO” model); Ethereum uses running <b>account balances</b> instead. Either way, nodes first check the signature and the rules, then hold it in the <b>mempool</b> until a miner includes it. The <b>nonce</b> stops replay. The same signed payment can't be submitted twice. and the <b>fee</b> is a live auction for scarce block space, which is why fees spike when the network is busy. Nothing is final until it's in a block, and buried under a few more.") };

  /* ===================== INCENTIVES: why anyone mines ===================== */
  L.incentives = { world: "chain", title: "Mining rewards", oneliner: "How mining rewards incentivise honesty", icon: "¤",
    hero: "Mining burns real electricity on quintillions of useless guesses. So why does anyone do it? Because the block itself pays the winner, and that payment is what keeps the whole network honest.",
    beats: [
      { n: "01", h: "The block pays its own miner", cap: "Every block's first entry is special: the <b>coinbase</b>, a payment to the winning miner created out of thin air, plus every <b>fee</b> attached to the transactions inside. Pick transactions from the pool and mine. Greedy is allowed.",
        build(s) {
          const POOL = [
            { t: "Alice → Bob: 5", fee: 0.8 }, { t: "Carol → Dan: 12", fee: 0.5 },
            { t: "Eve → Finn: 3", fee: 0.2 }, { t: "Gail → Hank: 40", fee: 1.4 },
            { t: "Ivy → Jo: 7", fee: 0.1 }, { t: "Ken → Lee: 2", fee: 0.6 },
          ];
          const SUBSIDY = 3.125, CAP = 3;
          let picked = [], mined = false;
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>the fee market. your block fits ${CAP} transactions</div>
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
              <div class="payrow"><span>block subsidy: new coins, from nowhere</span><b>${SUBSIDY}</b></div>
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
              ? `<span style="color:var(--green)">You mined the most profitable block possible. This is exactly what real miners' software does automatically.</span>`
              : `Sealed for <b>${(SUBSIDY + yours).toFixed(3)}</b> coins. The greediest pick paid <b>${(SUBSIDY + bestFee).toFixed(3)}</b>. Real miners always sort by fee.`;
          };
          wrap.querySelector("#rst").onclick = () => { picked = []; mined = false; wrap.querySelector("#msg").textContent = "Miners pick the highest-paying transactions first. That is why fees rise when the network is busy."; draw(); };
          draw();
        } },
      { n: "02", h: "The reward halves, forever", cap: "Bitcoin's subsidy started at 50 coins and <b>halves</b> every four years, which is why there will only ever be 21 million. Drag through the decades and watch new supply dry up while fees take over the job of paying for security.",
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
              y < 2030 ? "The subsidy is already small. Fees matter more every cycle." :
              y < 2050 ? "New coins have slowed to a trickle. <b>Fees now carry the security budget.</b>" :
              "Near zero forever. If fees can't pay for enough mining, security itself gets cheaper to attack (an open question.";
          }
          wrap.querySelector("#yr").oninput = upd; upd();
        } },
      { n: "03", h: "Check yourself", cap: "Two questions before moving on.",
        build(s) { quiz(s, [
          { ask: "Why do miners spend real electricity on quintillions of guesses?",
            opts: [
              { t: "The winning block pays them new coins plus fees", ok: true, why: "The coinbase subsidy and the fees inside the block are the entire business model of mining." },
              { t: "The network forces every computer to mine", ok: false, why: "Mining is voluntary. Miners do it because the winning block pays: new coins plus fees." },
              { t: "Guessing keeps their hardware warm", ok: false, why: "The heat is a cost, not the goal. Miners are paid by the block itself: new coins plus fees." },
            ] },
          { ask: "When Bitcoin's subsidy eventually reaches zero, what pays for security?",
            opts: [
              { t: "Transaction fees", ok: true, why: "Fees are designed to take over as the subsidy halves away. Whether they'll be enough is a genuinely open question." },
              { t: "Nothing. Mining stops", ok: false, why: "Fees remain. Every transaction still bids a fee, and those fees go to whoever mines the block." },
              { t: "A central fund tops miners up", ok: false, why: "There is no central anything. That is the point. Fees paid by users are the long-term plan." },
            ] },
        ]); } },
    ],
    deeper: P("The reward is not a bonus bolted on. It <b>is</b> the security model. Honest mining pays steadily; attacking the chain means forfeiting those rewards and burning electricity on a losing race. Satoshi's insight was economic, not cryptographic: make honesty the most profitable strategy and strangers will secure each other's money out of pure self-interest. The <b>halving</b> (every 210,000 blocks) enforces the 21-million cap, and the open question economists argue about: when the subsidy is gone, will fees alone fund enough mining to keep attacks unprofitable?") + P("Satoshi's own words, on why even an attacker with majority power should choose honesty:") + "<blockquote>“He ought to find it more profitable to play by the rules, such rules that favour him with more new coins than everyone else combined, than to undermine the system and the validity of his own wealth.” - <a href='https://bitcoin.org/bitcoin.pdf' target='_blank' rel='noopener'>Satoshi Nakamoto, the Bitcoin whitepaper (2008), §6</a></blockquote>" };

  /* ===================== GOSSIP: the network itself ===================== */
  L.gossip = { world: "consensus", title: "The network", oneliner: "How information spreads without a centre", icon: "◍",
    hero: "There is no server. When you broadcast a payment, you tell a few computers, they tell a few more, and in seconds the whole planet knows. Watch it ripple, and see where forks really come from.",
    beats: [
      { n: "01", h: "Gossip, hop by hop", cap: "Every node knows only its neighbours. Click <b>any node</b> to broadcast a transaction from it and watch the news spread like a rumour. There is no coordinator, no master list of who to tell.",
        build(s) {
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>a peer-to-peer network (click a node</div><div class="netbox"><svg id="net" viewBox="0 0 640 340"></svg></div><div class="note" id="gmsg" style="text-align:center;margin-top:10px">Each hop takes real time. That delay is the seed of every fork.</div>`;
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
            c.onclick = () => { if (busy) return; busy = true; ripple(i, "heard", () => { busy = false; wrap.querySelector("#gmsg").innerHTML = `From node ${i + 1} to all ${pts.length} in a few hops. <b>No one was in charge of delivery.</b>`; }); }; });
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
      { n: "02", h: "Two truths, briefly", cap: "Now the key scene: two miners on <b>opposite sides of the world</b> seal a block at nearly the same moment. Both spread outward. Every node believes whichever block <b>reached it first</b>. The network genuinely splits purely because news takes time to cross the planet.",
        build(s) {
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>a tie, spreading from both ends</div><div class="netbox"><svg id="net2" viewBox="0 0 640 340"></svg></div>
            <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn primary" id="race">Both miners find a block</button><button class="btn" id="rr">Reset</button></div>
            <div class="race-legend"><span><i class="sw a"></i>heard miner A's block first</span><span><i class="sw b"></i>heard miner B's block first</span></div>
            <div class="note" id="g2msg" style="text-align:center;margin-top:8px">This split is a <b>fork</b> (the subject of the next lesson.</div>`;
          s.appendChild(wrap);
          const svg = wrap.querySelector("#net2"), NS = "http://www.w3.org/2000/svg";
          const pts = [[45,80],[150,50],[280,80],[410,55],[540,80],[600,150],[80,160],[210,170],[340,160],[470,180],[45,250],[170,280],[300,260],[430,290],[560,260],[250,120]];
          const edges = []; pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && Math.hypot(a[0]-b[0], a[1]-b[1]) < 150) edges.push([i, j]); }));
          const nbr = pts.map(() => []); edges.forEach(([a, b]) => { nbr[a].push(b); nbr[b].push(a); });
          let dots = [], busy = false;
          edges.forEach(([a, b]) => { const ln = document.createElementNS(NS, "line"); ln.setAttribute("x1", pts[a][0]); ln.setAttribute("y1", pts[a][1]); ln.setAttribute("x2", pts[b][0]); ln.setAttribute("y2", pts[b][1]); ln.setAttribute("class", "netedge"); svg.appendChild(ln); });
          pts.forEach((p, i) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 11); c.setAttribute("class", "netnode"); svg.appendChild(c); dots.push(c); });
          const A = 0, B = 14; // far corners
          function reset() { dots.forEach(d => d.setAttribute("class", "netnode")); wrap.querySelector("#g2msg").innerHTML = "This split is a <b>fork</b> (the subject of the next lesson."; }
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
                wrap.querySelector("#g2msg").innerHTML = `<b>${ca}</b> nodes back miner A's block, <b>${pts.length - ca}</b> back miner B's. Both sides honest, both convinced. Only the <b>next</b> block can break the tie.`; }
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
              { t: "Each node passes it on to its handful of peers, who pass it on again", ok: true, why: "That's the gossip protocol: no coordinator, no master list. A few hops and the whole planet has it." },
              { t: "It uploads to Bitcoin's head office, which distributes it", ok: false, why: "There is no head office. Nodes only know their own neighbours and relay whatever checks out. News spreads like a rumour." },
              { t: "Miners phone each other to stay in sync", ok: false, why: "Nobody coordinates directly. Each node simply forwards valid data to its peers; that alone floods the network in seconds." },
            ] },
        ]); } },
    ],
    deeper: P("Real nodes connect to a handful of peers and relay whatever checks out, known as the <b>gossip protocol</b>. A transaction crosses the globe in a couple of seconds; a block takes a few more because nodes verify before relaying. That delay fixes a design constant: if blocks came every two seconds, ties would be constant and the chain would fray into forks. Bitcoin's ten-minute rhythm makes the network's propagation delay a rounding error. It also explains why each node's <b>mempool</b> (its waiting room of unconfirmed transactions) is slightly different from its neighbour's: everyone hears the news in a slightly different order.") };

  /* ===================== SAFETY: practical literacy ===================== */
  L.safety = { world: "frontier", title: "Staying safe", oneliner: "Recognising scams and protecting your funds", icon: "‼",
    hero: "Everything you've learned protects the chain. Nothing protects you from being talked out of your own keys. Scams steal more crypto than hacks ever have. The only defence is pattern-recognition, so let's drill the patterns.",
    beats: [
      { n: "01", h: "Scam or normal? You decide", cap: "Each card is a real situation. Call it. The pattern matters more than the example.",
        build(s) {
          const CARDS = [
            { t: "“Support” DMs you: “your wallet is compromised. Send us your 12-word recovery phrase and we'll secure it.”", scam: true,
              why: "Nobody legitimate ever asks for a seed phrase. Whoever holds those words <b>is</b> the wallet. This is the single most common crypto theft." },
            { t: "During setup, your wallet app asks you to write 12 words on paper and keep them offline.", scam: false,
              why: "That is normal self-custody. The red flag is never the phrase existing. It is anyone <b>asking to see it</b>." },
            { t: "An investment platform guarantees 2% daily returns, “risk-free, powered by AI trading.”", scam: true,
              why: "2% daily is ~137,000% a year. Guaranteed returns at that scale are mathematically a Ponzi: early exits are paid with later deposits." },
            { t: "A famous person's account posts: “send 1 coin, receive 2 back. Giveaway, 30 minutes only!”", scam: true,
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
            ["Your keys mean no bank can freeze you", "Your keys mean no bank can save you. One leaked phrase, total loss"],
            ["Anyone can launch a token, permissionlessly", "Anyone includes people building rug-pulls"],
            ["Transactions are pseudonymous", "Stolen coins vanish behind addresses with no name attached"],
          ];
          const wrap = el("div", "fcard");
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>every feature has a shadow. Tap to flip</div>` +
            rows.map((r, i) => `<button class="flipRow" data-i="${i}"><span class="side good">✓ ${r[0]}</span><span class="side dark">✕ ${r[1]}</span></button>`).join("") +
            `<div class="note" style="margin-top:10px;text-align:center">This is why "there's no customer support hotline" is both the pitch and the warning.</div>`;
          s.appendChild(wrap);
          wrap.querySelectorAll(".flipRow").forEach(b => b.onclick = () => b.classList.toggle("flipped"));
        } },
    ],
    deeper: P("Three rules cover almost everything. <b>One:</b> the seed phrase is never typed anywhere, never photographed, never told to anyone (no exceptions, and every exception someone offers you is the scam. <b>Two:</b> guaranteed returns do not exist; anyone promising them is paying old investors with new deposits until the music stops. <b>Three:</b> irreversibility means prevention is the whole game. Verify addresses and sites <i>before</i> sending, because there is no after. In 2024 alone, scams took multiples of what protocol hacks did. The chain is hard to attack; people are not.") };

  /* ===================== checkpoint injections into existing lessons ===================== */
  function addCheck(id, questions) {
    if (!L[id]) return;
    L[id].beats.push({ n: String(L[id].beats.length + 1).padStart(2, "0"), h: "Check yourself",
      cap: "Quick checkpoint before moving on.", build(s) { quiz(s, questions); } });
  }

  addCheck("hashing", [
    { ask: "You change one letter of a document. What happens to its SHA-256 fingerprint?",
      opts: [
        { t: "It changes completely. About half the bits flip", ok: true, why: "The avalanche effect. There is no 'small change' to a hash; any edit scrambles it entirely." },
        { t: "It changes slightly, near the letter you edited", ok: false, why: "Hashes don't work locally. One flipped letter scrambles the whole 256-bit output. That's the avalanche effect you just saw." },
        { t: "Nothing, unless the file is small", ok: false, why: "Any change, any size: the fingerprint scrambles completely. That's what makes tampering visible." },
      ] },
    { ask: "Given only a hash, how do you get the original data back?",
      opts: [
        { t: "You can't. Hashing destroys information", ok: true, why: "Infinitely many inputs share each output, so there is nothing to run backwards. Guessing is the only 'attack', and the space is 2²⁵⁶." },
        { t: "Run SHA-256 in reverse", ok: false, why: "There is no reverse. Hashing throws information away. That one-way property is the entire point." },
        { t: "Ask a fast enough computer", ok: false, why: "Speed doesn't help: reversing SHA-256 by guessing would outlast the age of the universe." },
      ] },
  ]);

  addCheck("keys", [
    { ask: "Someone learns your public key and address. What can they do?",
      opts: [
        { t: "Watch your balance and history, but never spend", ok: true, why: "Public means public: an address exposes its full balance and every transaction, in and out. What it can never do is spend. Going backwards to the private key is the discrete-log problem: practically impossible." },
        { t: "Spend your coins", ok: false, why: "Spending requires a signature, and only the private key can produce one. The public key can't be run backwards." },
        { t: "Change your past transactions", ok: false, why: "Past transactions are sealed in the chain; and without your private key, no new signature can be forged either." },
      ] },
    { ask: "Why is it safe to post your public address on your website so people can pay you?",
      opts: [
        { t: "The address lets people pay you but never spend. Only your private key can sign", ok: true, why: "Public key and address come one-way from the private key. Receiving is public; spending needs the secret only you hold." },
        { t: "The network hides the address after the first payment", ok: false, why: "Addresses stay public and reusable forever. Safety comes from the one-way maths, not from hiding anything." },
        { t: "It isn't safe. You should keep your address secret", ok: false, why: "The address is meant to be shared. That is how people pay you. The private key is the only thing you ever guard." },
      ] },
  ]);

  addCheck("chainlink", [
    { ask: "You secretly edit a transaction in block #47 of a 100-block chain. What breaks?",
      opts: [
        { t: "Every block from #48 onward. Their links stop matching", ok: true, why: "Block #48's 'prev' field no longer matches #47's new hash, and so on up the chain. The edit is visible instantly, everywhere." },
        { t: "Only block #47", ok: false, why: "Block #48 stored #47's old fingerprint. The mismatch cascades through every later block. That cascade is the chain's whole defence." },
        { t: "Nothing, if the edit is small", ok: false, why: "Any edit avalanches #47's hash, and every later block's 'prev' link stops matching. Small doesn't exist here." },
      ] },
    { ask: "What actually links one block to the block before it?",
      opts: [
        { t: "Each block stores the previous block's fingerprint in its own header", ok: true, why: "That shared hash is the link. Edit an old block and its fingerprint changes, so the next block's stored copy no longer matches." },
        { t: "The blocks are saved next to each other on disk", ok: false, why: "Physical order means nothing. The link is cryptographic. Each block records the exact hash of the one before it." },
        { t: "A central index maps block numbers to positions", ok: false, why: "There is no central index. The chain is nothing but each block carrying the previous block's hash." },
      ] },
  ]);

  addCheck("forks", [
    { ask: "Your payment has 1 confirmation. The seller of a house asks you to wait for more. Why?",
      opts: [
        { t: "A recent block can still be orphaned by a competing branch", ok: true, why: "Finality is probabilistic: each block stacked on top makes reversal exponentially harder. Big payments deserve deep burial." },
        { t: "The bank hasn't approved it yet", ok: false, why: "There is no bank. The risk is a reorg (a competing branch replacing recent blocks) which more confirmations make vanishingly unlikely." },
        { t: "Blocks expire if not renewed", ok: false, why: "Blocks don't expire. The concern is a reorg replacing recent blocks. Confirmations bury your payment deeper." },
      ] },
    { ask: "Two miners publish a block at the same height in the same second. What decides the winner?",
      opts: [
        { t: "Whichever branch the next block extends. The chain with more work wins", ok: true, why: "The tie is temporary. The first branch to get another block on top has more accumulated work, and the network abandons the other." },
        { t: "The block with the earlier timestamp", ok: false, why: "Timestamps can't be trusted or globally ordered. The rule is objective: the chain with the most work (usually the longer one) wins." },
        { t: "A vote among all the miners", ok: false, why: "No one votes. Miners build on the chain they saw first, and whichever branch grows longer first becomes canonical." },
      ] },
  ]);

  addCheck("attack", [
    { ask: "An attacker controls 60% of all mining power. Which of these can they do?",
      opts: [
        { t: "Reverse their own recent payments", ok: true, why: "Majority hashpower can out-race the honest chain and double-spend, but it still can't forge signatures or steal keys it doesn't hold." },
        { t: "Steal coins from any wallet", ok: false, why: "Never. Spending needs a valid signature, and hashpower doesn't crack private keys. Majority power reverses recent history; it doesn't forge ownership." },
        { t: "Print unlimited new coins", ok: false, why: "Every node checks every block against the rules; a block minting extra coins is rejected no matter who mined it." },
      ] },
    { ask: "An attacker has only 30% of the hashpower. As the victim waits for more confirmations, the odds of a successful reversal…",
      opts: [
        { t: "Fall exponentially. Each confirmation makes catching up far less likely", ok: true, why: "Below 50% the attacker loses ground on average, so the chance of ever catching up decays fast with every block stacked on top." },
        { t: "Stay the same however long you wait", ok: false, why: "They don't. With a minority of the power the attacker falls behind each block, so waiting for confirmations crushes the odds." },
        { t: "Rise. Waiting actually helps the attacker", ok: false, why: "The opposite. Below 50%, more confirmations bury the payment deeper and make reversal exponentially less likely." },
      ] },
  ]);

  addCheck("whatis", [
    { ask: "In one line: what is a blockchain?",
      opts: [
        { t: "A shared record, chained by fingerprints, copied to everyone", ok: true, why: "Blocks of records, linked by hashes, replicated across a network. Every other lesson is just how each of those parts works." },
        { t: "A faster kind of database", ok: false, why: "It's actually far slower than a database. The point isn't speed, it's a shared record nobody can quietly rewrite." },
        { t: "A company that processes payments", ok: false, why: "There is no company and no centre. It is just a record kept identically by thousands of computers." },
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
        { t: "Its own hash: one fingerprint computed over everything inside", ok: true, why: "The seal is nothing but a hash of the block's contents. Change any transaction and the fingerprint no longer matches. The seal is the contents." },
        { t: "Encryption. The contents are locked so no one can read them", ok: false, why: "Nothing is encrypted; a block's contents are public. The seal is a hash. Anyone can read the data, but no one can change it without the fingerprint giving them away." },
        { t: "The miner's password", ok: false, why: "There are no passwords anywhere in the system. The seal is the block's own hash, computed over everything inside. It answers to the data, not to any person." },
      ] },
    { ask: "You quietly edit one transaction inside a sealed block. What gives you away?",
      opts: [
        { t: "The block's fingerprint no longer matches its contents. Anyone re-hashing it sees the break", ok: true, why: "The seal was computed over the old contents. One re-hash exposes the mismatch. Tampering isn't impossible, it's instantly detectable." },
        { t: "Nothing. A sealed block physically cannot be edited", ok: false, why: "You can edit your own copy freely. It is just data. What you can't do is edit it undetectably. The stored seal no longer matches the new contents, and one re-hash exposes it." },
        { t: "The block re-seals itself around the change automatically", ok: false, why: "Nothing updates itself. The old seal stays put, the contents now disagree with it, and anyone who re-hashes the block sees the break at once." },
      ] },
    { ask: "Building a block takes a millisecond on any laptop. So where does a block's cost actually come from?",
      opts: [
        { t: "From adding it to the chain: the mining work, not the assembly", ok: true, why: "Assembling a block is free; anyone can do it. The expense is the Proof-of-Work race to append it. That is what the nonce and reward lessons build next." },
        { t: "From the computing power needed to bundle the transactions", ok: false, why: "Bundling is trivial. A laptop does it in a millisecond. The cost lives entirely in the mining that appends the block to the chain." },
        { t: "From a licence fee blocks must pay to the network", ok: false, why: "There are no licences and no one to pay a fee to. The cost is physical: the electricity burned finding a nonce that seals the block onto the chain." },
      ] },
  ]);

  addCheck("merkle", [
    { ask: "Your transaction sits in a block with a million others. What do you need to prove it's really in there?",
      opts: [
        { t: "About 20 sibling hashes: one per level of the tree", ok: true, why: "The proof is one short branch: your transaction plus log₂(n) siblings, re-hashed up to the root. A million transactions, ~20 hashes." },
        { t: "The whole block, so you can check every transaction", ok: false, why: "That's exactly what the tree spares you. You need only the branch from your transaction to the root. ~20 hashes for a million transactions, not the block itself." },
        { t: "Just the Merkle root. it already contains your transaction", ok: false, why: "The root alone proves nothing about any single transaction. You need the sibling hashes along your path, so re-hashing lands you on that root." },
      ] },
    { ask: "You verify a Merkle proof for your payment. What do you learn about the other transactions in the block?",
      opts: [
        { t: "Nothing but a few sibling hashes. their contents stay unseen", ok: true, why: "A proof reveals only fingerprints along your path, never the block's contents. That's why light wallets can verify a payment without downloading anything else." },
        { t: "Everything. the proof unpacks the whole block", ok: false, why: "The proof carries only sibling hashes, and a hash can't be run backwards. You learn your payment is in the block and nothing at all about the rest." },
        { t: "Their senders and amounts, since the siblings are raw transactions", ok: false, why: "The siblings are hashes, not transactions. irreversible fingerprints. The proof shows your payment belongs, while every other record stays private to you." },
      ] },
    { ask: "An untrusted server hands your phone wallet a forged proof. Why doesn't the lie work?",
      opts: [
        { t: "Fake siblings hash up to the wrong root, so the proof fails against the header", ok: true, why: "You re-hash the branch yourself and compare with the root already in the block header. Any forged step lands on a different root. You never trusted the server, only the maths." },
        { t: "Servers that lie get banned from the network", ok: false, why: "No one polices servers, and no one needs to. The forged branch simply hashes to the wrong root, so your wallet rejects it on the spot. Trust the maths, not the source." },
        { t: "Proofs are signed by miners, and forgers can't sign", ok: false, why: "No signature is involved. The proof checks itself: re-hash the branch and it either lands on the header's Merkle root or it doesn't. A forgery can't survive that." },
      ] },
  ]);

  addCheck("nonce", [
    { ask: "While hunting for a valid block, what is the miner allowed to change?",
      opts: [
        { t: "Only the nonce. Every other field is frozen", ok: true, why: "The data, the prev link, the merkle root, the time are all fixed. The nonce is the one dial, and mining is nothing but turning it." },
        { t: "The transactions, to nudge the hash towards zeros", ok: false, why: "Change a transaction and you're mining a different block, and hashes can't be nudged anyway. The only legitimate dial is the nonce." },
        { t: "The difficulty target, to make its own job easier", ok: false, why: "The target is set by the protocol for everyone at once. No miner touches it. All a miner can turn is the nonce." },
      ] },
    { ask: "Mining is often described as ‘solving complex maths problems’. What is a miner actually doing?",
      opts: [
        { t: "Guessing: re-rolling one number and re-hashing, hoping to land under the target", ok: true, why: "There is no equation and no cleverness. Hash output is unpredictable, so brute-force re-rolling is the only strategy. Quintillions of guesses, pure chance." },
        { t: "Solving equations too hard for ordinary computers", ok: false, why: "There's nothing to solve. A hash can't be steered, so miners just increment the nonce and re-hash, a lottery, not a puzzle." },
        { t: "Decrypting the transactions inside the block", ok: false, why: "Nothing is encrypted, so there's nothing to decrypt. Mining is guessing nonces until the block's hash happens to fall in the target zone." },
      ] },
    { ask: "Finding a winning nonce takes quintillions of guesses. How much work is it for everyone else to check it?",
      opts: [
        { t: "One hash. Verification is instant, and that asymmetry powers everything", ok: true, why: "Hash the block once and see the leading zeros for yourself. Staggeringly expensive to produce, one hash to verify. That lopsidedness is what makes Proof of Work usable." },
        { t: "The same quintillions. Checkers must redo the search", ok: false, why: "Only the search is expensive. Verifying takes a single hash of the finished block. That produce-hard, check-easy asymmetry is the whole point." },
        { t: "None. The network takes the winning miner's word for it", ok: false, why: "No one is trusted, ever. Every node re-hashes the block itself. It just happens that checking costs one hash while finding cost quintillions." },
      ] },
  ]);

  addCheck("pos", [
    { ask: "A validator is caught signing two conflicting blocks. What does it lose?",
      opts: [
        { t: "A slice of its staked coins (burned) plus its place in the validator set", ok: true, why: "Slashing destroys the stake itself, not just income. The bond is real money at risk; that threat is the entire security model." },
        { t: "Only its future rewards. The staked coins themselves are safe", ok: false, why: "That's the expensive misconception. Slashing burns the staked coins. the capital, not just the income stream, and ejects the validator. If only rewards were at risk, cheating would be nearly free." },
        { t: "Nothing at first. Slashing only follows repeat offences", ok: false, why: "There are no warnings. One provable double-sign triggers the burn and ejection immediately. The protocol punishes the act, not a pattern." },
      ] },
    { ask: "One validator cheats alone; separately, a third of all validators cheat together. How do the penalties compare?",
      opts: [
        { t: "The penalty scales with how many are slashed together. A coordinated attack can burn everything", ok: true, why: "That's the correlation penalty: a lone fault costs a little, but the more stake slashed at once, the bigger every cheater's burn, up to the entire stake. Exactly what makes an organised attack suicidal." },
        { t: "It's the same fine either way. Cheating is cheating", ok: false, why: "The penalty deliberately isn't flat. It scales with the total stake slashed around the same time, so lone accidents stay cheap while coordinated attacks approach total loss." },
        { t: "Only the organiser is slashed; followers keep their stake", ok: false, why: "Every cheating validator is slashed, and the correlation penalty makes each burn bigger the more of them there are. Joining an attack multiplies your own loss." },
      ] },
    { ask: "Why can't an attacker just spin up a thousand fake validators and outvote everyone?",
      opts: [
        { t: "Each validator needs its own real stake. A thousand validators cost a thousand bonds", ok: true, why: "Identities are free; capital isn't. It's the same Sybil defence as mining, with money at risk instead of electricity burned." },
        { t: "The network verifies each validator's real-world identity", ok: false, why: "No one checks identities. The system is permissionless. What stops the swarm is that every validator must post its own stake, so fake identities cost real capital." },
        { t: "The protocol allows only one validator per computer", ok: false, why: "One machine can happily run many validators. The limit is economic, not technical: each one needs its own staked bond, so influence costs capital." },
      ] },
  ]);

  addCheck("contracts", [
    { ask: "What is a smart contract, really?",
      opts: [
        { t: "A program stored on the chain that every node runs identically", ok: true, why: "Deterministic code, executed in lockstep by thousands of computers that all agree on the result. Neither ‘smart’ nor a ‘contract’, just an unstoppable program." },
        { t: "A legal agreement uploaded to the blockchain", ok: false, why: "No lawyers involved. It's a program: code that holds funds and moves them by its own rules, which every node runs and agrees on." },
        { t: "An AI that negotiates deals between users", ok: false, why: "Nothing intelligent about it. That is rather the point. It's plain deterministic code that does exactly what it says, every time, with no judgement." },
      ] },
    { ask: "A serious bug is found in a deployed contract holding user funds. What can its developers do, by default?",
      opts: [
        { t: "Nothing. Deployed code can't be patched, and the flaw is live", ok: true, why: "Immutable code means immutable bugs; that's why exploits have cost billions. (Some teams deploy behind an upgradeable proxy (which fixes patching by reintroducing a trusted party.)" },
        { t: "Push an update, the way any app does", ok: false, why: "There's no update channel. Deployed code is part of the chain's history. Immutable code means immutable bugs, and no admin can pause the drain." },
        { t: "Ask the miners to vote the bug away", ok: false, why: "Miners order transactions; they don't edit contracts. Rewriting deployed code would mean rewriting the chain itself, the very thing the whole design prevents." },
      ] },
    { ask: "Why does every operation in a contract cost gas?",
      opts: [
        { t: "Thousands of nodes run your code. Gas prices each step, rationing the shared computer and killing infinite loops", ok: true, why: "You're renting the world's most replicated computer. Pricing every operation keeps you honest about its cost. A loop that can't pay simply halts." },
        { t: "Gas is the profit of the company that owns the blockchain", ok: false, why: "No company owns the chain. Gas pays the validators who actually execute your code, and it rations a computer that thousands of machines run in unison." },
        { t: "Gas is a refundable deposit to prove you're serious", ok: false, why: "It's spent, not deposited. Payment for computation performed. Each operation costs gas so heavy programs pay their way and endless loops run out of fuel." },
      ] },
  ]);

  addCheck("wallets", [
    { ask: "Where, exactly, are your coins?",
      opts: [
        { t: "On the chain. The wallet holds only the keys that control them", ok: true, why: "The balance is an entry in the shared ledger, replicated everywhere. Your wallet holds the secret that can sign it away: keys, never coins." },
        { t: "Inside the wallet app on your phone", ok: false, why: "The most expensive misunderstanding in crypto. The coins are entries on the chain itself; the app holds only your keys. Delete the app and the coins sit exactly where they were." },
        { t: "Nowhere until you withdraw them to cash", ok: false, why: "They fully exist as entries in a ledger thousands of computers agree on. What your wallet contributes is the key that proves those entries answer to you." },
      ] },
    { ask: "Your phone (wallet app and all) falls in the sea. Your crypto is…",
      opts: [
        { t: "Safe. The seed phrase re-derives every key on any new device", ok: true, why: "The coins never left the chain, and derivation is deterministic: same words in, same keys out, forever. The phrase on paper is the wallet; the phone was only a window." },
        { t: "At the bottom of the sea with the phone", ok: false, why: "The coins were never in the phone. They are on the chain. Type your seed phrase into any wallet and the same keys are re-derived, exactly as before." },
        { t: "Recoverable once the wallet company restores your account", ok: false, why: "There's no account and no company holding one. That is the point of self-custody. Recovery is the seed phrase re-deriving your keys; without it, no one can help." },
      ] },
    { ask: "You keep your coins on an exchange, in an account with your name on it. Who actually controls them?",
      opts: [
        { t: "The exchange. It holds the keys; you hold a promise", ok: true, why: "Custody follows the keys, not the login. Your balance is a claim on the exchange's books, honoured until it freezes withdrawals or fails, as FTX did." },
        { t: "You. The account is in your name", ok: false, why: "The name on the login changes nothing: the exchange signs, so the exchange controls. ‘Not your keys, not your coins’ is precisely this situation." },
        { t: "No one. Coins on a chain have no controller", ok: false, why: "Whoever holds the key controls the coins, and here that's the exchange. On-chain assets always answer to a key; the only question is whose hand it's in." },
      ] },
  ]);

  addCheck("layer2", [
    { ask: "Why is the base chain so slow: 7 to 15 transactions a second?",
      opts: [
        { t: "By design. Every node re-checks every transaction, and that redundancy is the security", ok: true, why: "Thousands of independent verifications per transaction is the whole defence. Speed it up by checking less and you're quietly selling the security." },
        { t: "The code is old and just needs optimising", ok: false, why: "No optimisation closes the gap, because the slowness is bought deliberately: every node verifies everything. Layer 2 works around that constraint instead of breaking it." },
        { t: "There aren't enough servers yet", ok: false, why: "Adding nodes adds no speed. Each one still re-checks every transaction. That total redundancy is the security, which is why scaling has to happen a layer up." },
      ] },
    { ask: "How does a rollup actually deliver more transactions per second?",
      opts: [
        { t: "It executes them off-chain, then posts a compressed summary and proof back to the main chain", ok: true, why: "The heavy work moves off-chain; only a tiny, checkable summary touches the expensive base layer. Thousands of payments settle in one block's worth of space." },
        { t: "It's a separate, faster blockchain you simply trust instead", ok: false, why: "That describes a sidechain: different security, your own risk. A rollup posts its data and proofs back to the main chain, so the base layer still underwrites every transaction." },
        { t: "It skips verification to save time", ok: false, why: "Nothing goes unverified. The batch is either proven valid up front (zk) or open to fraud challenges (optimistic). The saving comes from doing the work off-chain, not from skipping it." },
      ] },
    { ask: "Where does a rollup's security ultimately come from?",
      opts: [
        { t: "The base chain. Data and proofs posted to Layer 1 mean cheating can be caught and proven", ok: true, why: "The rollup inherits Layer 1's security precisely because its data lands there: anyone can reconstruct its state and check or challenge the summary. The operator has nowhere to hide." },
        { t: "The good reputation of the rollup's operator", ok: false, why: "Reputation is exactly what the design refuses to rely on. Data and proofs posted to Layer 1 make cheating provable by anyone. Trust the base chain, not the company." },
        { t: "Its own separate army of miners", ok: false, why: "A rollup has no miners of its own. That is what keeps it cheap. It borrows the base chain's security by posting its data and proofs there for anyone to verify." },
      ] },
  ]);

  addCheck("zk", [
    { ask: "What does a zero-knowledge proof let Peggy do?",
      opts: [
        { t: "Convince Victor a statement is true while revealing nothing else, not even the secret", ok: true, why: "Truth without disclosure: Victor ends up certain, yet learns only that the claim holds. The secret itself never crosses the table." },
        { t: "Encrypt her secret so Victor can't read it", ok: false, why: "Encryption hides data; it convinces no one of anything. A zero-knowledge proof does the opposite job. It makes Victor certain a claim is true while disclosing nothing." },
        { t: "Hide her identity from the network completely", ok: false, why: "Anonymity is a different problem. The proof hides the contents of a claim. Victor learns it's true and nothing more. Who is speaking is a separate question." },
      ] },
    { ask: "In the cave game, a cheater survives one round half the time. Why does Victor still end up certain?",
      opts: [
        { t: "Each round is a fresh 50% chance of exposure. Twenty rounds leave a bluffer roughly one-in-a-million odds", ok: true, why: "The halving compounds: ½ × ½ × ½… Confidence is never absolute after any single round, but it grows exponentially, soon indistinguishable from certainty." },
        { t: "After enough rounds, Victor works out the secret word himself", ok: false, why: "Victor never learns the word. That is the zero-knowledge part. What grows is his statistical certainty: a cheater's survival odds halve every round until bluffing is effectively impossible." },
        { t: "One passed round is proof enough", ok: false, why: "One round proves little. A cheater passes it half the time by luck. Certainty comes from repetition: each round halves a bluffer's odds, and the halvings multiply." },
      ] },
    { ask: "A zk-rollup settles thousands of transactions with one proof. Does that mean your transactions are hidden?",
      opts: [
        { t: "Usually not. The ‘zk’ buys a tiny validity proof; most zk-rollups publish their transaction data", ok: true, why: "In rollups the maths is used for compactness, not secrecy: one small proof that the whole batch was valid. The data itself generally lands on the main chain for anyone to read." },
        { t: "Yes. Zero-knowledge means nobody can see what happened", ok: false, why: "A natural guess, but no: most zk-rollups publish all their transaction data to the main chain. The zero-knowledge maths compresses proof of validity. Privacy needs a different design, like Zcash." },
        { t: "Yes. Hiding the data is what makes them cheap", ok: false, why: "The saving comes from verification, not secrecy: one tiny proof replaces re-executing thousands of transactions. The data is still published: compressed, but public." },
      ] },
  ]);

  /* expose the quiz primitive for chapter exit gates (views.js) */
  // export not needed here, exported at the top


  /* ============================================================
     SYBIL: why "one computer, one vote" cannot work
     ============================================================ */
  L.sybil = { world: "consensus", title: "The Sybil machine", oneliner: "Why the network cannot simply vote", icon: "⚇",
    hero: "The obvious way for strangers to agree is to vote. Here is why that fails instantly on the internet, and what mining quietly replaced it with.",
    beats: [
      { n: "01", h: "Try consensus by vote", cap: "The network is deciding whether Eve's double-spend is valid. Twelve honest nodes vote no. You are Eve, and on the internet, <b>identities are free</b>. See what that does to a vote.",
        build(s) {
          const wrap = el("div", "fcard"); let fakes = 0;
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>proposal: "Eve's double-spend is valid" · one node, one vote</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:center">
              <div><div class="note" style="margin-bottom:6px;color:var(--green)">honest nodes: NO</div><div class="metric"><span class="n" style="color:var(--green)">12</span></div></div>
              <div><div class="note" style="margin-bottom:6px;color:var(--red)">your nodes: YES</div><div class="metric"><span class="n" id="syF" style="color:var(--red)">1</span></div></div>
            </div>
            <div class="verdict yes" id="syV" style="margin-top:14px">Proposal rejected, 12 votes to 1.</div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn danger" id="sySpawn">Spawn 1,000 fake nodes</button><button class="btn" id="syRst">Reset</button></div>
            <div class="note" id="syM" style="text-align:center;margin-top:10px">A "node" is just a program. Starting another copy costs nothing.</div>`;
          s.appendChild(wrap);
          const draw = () => { wrap.querySelector("#syF").textContent = (1 + fakes).toLocaleString(); const v = wrap.querySelector("#syV");
            if (fakes > 11) { v.className = "verdict no"; v.textContent = `Proposal PASSES, ${(1 + fakes).toLocaleString()} votes to 12. Your double-spend is now "valid".`; wrap.querySelector("#syM").innerHTML = `That took one laptop and a for-loop. <b>Any system where identities are free to create cannot be governed by counting identities.</b> This failure mode is called a Sybil attack.`; }
            else { v.className = "verdict yes"; v.textContent = "Proposal rejected, 12 votes to 1."; } };
          wrap.querySelector("#sySpawn").onclick = () => {
            let count = 0;
            wrap.querySelector("#sySpawn").disabled = true;
            const interval = setInterval(() => {
              count += 47;
              if (count >= 1000) { fakes = 1000; clearInterval(interval); draw(); wrap.querySelector("#sySpawn").disabled = false; }
              else { fakes = count; draw(); }
            }, 16);
          };
          wrap.querySelector("#syRst").onclick = () => { fakes = 0; wrap.querySelector("#syM").innerHTML = `A "node" is just a program. Starting another copy costs nothing.`; draw(); };
          draw();
        } },
      { n: "02", h: "Now weight the vote by work", cap: "Same network, same fakes, but now a vote only counts in proportion to the <b>hashes</b> behind it. Your thousand names still share one processor. Try to win now.",
        build(s) {
          const wrap = el("div", "fcard"); let rigs = 0; const HONEST = 12; // GH/s
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>same proposal · votes weighted by hashpower</div>
            <div id="syBars"></div>
            <div class="srow" style="margin-top:14px"><span class="nm">buy real rigs</span><input type="range" id="syR" min="0" max="16" value="0"><span class="v" id="syRv">0</span></div>
            <div class="verdict yes" id="syV2" style="margin-top:12px"></div>
            <div class="note" id="syM2" style="text-align:center;margin-top:10px">1,000 fake identities · one shared laptop · 0.1 GH/s total.</div>`;
          s.appendChild(wrap);
          const draw = () => { const you = 0.1 + rigs; const tot = you + HONEST;
            wrap.querySelector("#syRv").textContent = rigs;
            wrap.querySelector("#syBars").innerHTML = `
              <div class="srow" style="gap:8px"><span class="nm" style="width:64px;color:var(--green)">honest</span><div style="flex:1;height:16px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i style="display:block;height:100%;width:${HONEST / tot * 100}%;background:var(--green)"></i></div><span class="v" style="width:64px;color:var(--green)">${HONEST} GH/s</span></div>
              <div class="srow" style="gap:8px;margin-top:6px"><span class="nm" style="width:64px;color:var(--red)">you</span><div style="flex:1;height:16px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i style="display:block;height:100%;width:${you / tot * 100}%;background:var(--red)"></i></div><span class="v" style="width:64px;color:var(--red)">${you.toFixed(1)} GH/s</span></div>`;
            const v = wrap.querySelector("#syV2");
            if (you > HONEST) { v.className = "verdict no"; v.textContent = "You finally out-vote the network after buying more hardware than everyone else combined."; wrap.querySelector("#syM2").innerHTML = `Winning now costs <b>real money</b>: roughly ${rigs} rigs' worth of hardware and electricity. That cost <i>is</i> the defence. "One CPU, one vote" (the whitepaper's phrase) means votes are priced in physics, not names. Proof of stake prices them in capital instead, same trick.`; }
            else { v.className = "verdict yes"; v.textContent = `Your ${(1000 + (rigs ? 0 : 0)).toLocaleString()} names cast ${(you / tot * 100).toFixed(1)}% of the vote. Proposal rejected.`; wrap.querySelector("#syM2").innerHTML = rigs ? `More rigs help, but every step is paid for. Fakes stopped being free.` : `1,000 fake identities · one shared laptop · 0.1 GH/s total. Names stopped mattering the moment votes cost work.`; } };
          wrap.querySelector("#syR").oninput = e => { rigs = +e.target.value; draw(); }; draw();
        } },
    ],
    deeper: P("The name comes from <i>Sybil</i>, a 1973 case study of multiple personalities; the attack is faking many identities to swamp a reputation or voting system. Every open network faces it: review sites, social media, DNS votes. Satoshi's insight was not inventing a vote; it was replacing <b>one identity, one vote</b> with <b>one unit of scarce resource, one vote</b>. Proof of work prices identity in electricity; proof of stake prices it in locked capital. Both make the thousand-fake-nodes trick cost a thousand real fortunes. The rule generalises: any permissionless system that counts <i>anything free</i> is already broken."),
    bridge: "Fake a thousand names and you still own one processor. Votes priced in work can't be inflated. But work-weighted voting creates its own drama: two honest miners can win <i>at the same moment</i>. What happens when the chain briefly points two ways?" };

  /* ============================================================
     AMM: swap with no seller; be the liquidity; oracle feeds
     ============================================================ */
  L.amm = { world: "progmoney", title: "The automated market", oneliner: "Trading against a formula, not a seller", icon: "∿",
    hero: "An exchange with no order book, no counterparty and no opening hours: a pool of two tokens and one line of algebra. You trade against the maths.",
    beats: [
      { n: "01", h: "The pool prices your trade", cap: "The pool holds two tokens and keeps their product constant: <code>x · y = k</code>. Your trade moves along that curve, and the <b>bigger</b> the trade, the <b>worse</b> your price gets. Slide and watch the penalty grow.",
        build(s) {
          const wrap = el("div", "fcard"); let X = 1000, Y = 1000, amt = 50; // X coin, Y usd
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>liquidity pool · constant product</div>
            <div class="statline"><div class="s"><span class="n" id="amX">1,000</span><span class="l">COIN in pool</span></div><div class="s"><span class="n" id="amY">1,000</span><span class="l">USD in pool</span></div><div class="s"><span class="n" id="amP">1.00</span><span class="l">spot price</span></div></div>
            <div class="srow" style="margin:16px 0 10px"><span class="nm">spend USD</span><input type="range" id="amA" min="10" max="600" step="10" value="50"><span class="v" id="amAv">50</span></div>
            <div class="kvs"><div class="kv"><span class="k">COIN you receive</span><span class="v" id="amOut"></span></div><div class="kv"><span class="k">effective price paid</span><span class="v" id="amEff"></span></div><div class="kv"><span class="k">slippage vs spot</span><span class="v" id="amSl"></span></div></div>
            <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn gold" id="amGo">Execute swap →</button><button class="btn" id="amR">Reset pool</button></div>
            <div class="note" id="amM" style="text-align:center;margin-top:10px">No one is selling to you. The pool itself is the counterparty, and the curve is its price list.</div>`;
          s.appendChild(wrap);
          const fmtN = n => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
          const calc = () => { const k = X * Y; const out = X - k / (Y + amt); const eff = amt / out; const spot = Y / X; const sl = (eff / spot - 1) * 100; return { out, eff, spot, sl }; };
          const draw = () => { const c = calc();
            wrap.querySelector("#amX").textContent = fmtN(X); wrap.querySelector("#amY").textContent = fmtN(Y);
            wrap.querySelector("#amP").textContent = (Y / X).toFixed(2); wrap.querySelector("#amAv").textContent = amt;
            wrap.querySelector("#amOut").textContent = fmtN(c.out) + " COIN"; wrap.querySelector("#amEff").textContent = "$" + c.eff.toFixed(3);
            const slEl = wrap.querySelector("#amSl"); slEl.textContent = "+" + c.sl.toFixed(1) + "%"; slEl.style.color = c.sl > 5 ? "var(--red)" : "var(--green)"; };
          wrap.querySelector("#amA").oninput = e => { amt = +e.target.value; draw(); };
          wrap.querySelector("#amGo").onclick = () => { const c = calc(); X -= c.out; Y += amt; draw(); wrap.querySelector("#amM").innerHTML = `Swapped <b>$${amt}</b> for <b>${fmtN(c.out)} COIN</b> at $${c.eff.toFixed(3)} each. Note the spot price moved. Your own trade pushed it. Trade again the same way and the price keeps worsening: that is the curve defending the pool from being emptied.`; };
          wrap.querySelector("#amR").onclick = () => { X = 1000; Y = 1000; amt = 50; wrap.querySelector("#amA").value = 50; draw(); wrap.querySelector("#amM").innerHTML = `No one is selling to you. The pool itself is the counterparty, and the curve is its price list.`; };
          draw();
        } },
      { n: "02", h: "Be the pool, and meet impermanent loss", cap: "The pool's tokens come from people like you. Deposit both sides, then let the market price move, and compare what your share is worth against having simply <b>held</b> the tokens.",
        build(s) {
          const wrap = el("div", "fcard"); let r = 1; // price ratio vs deposit time
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>your deposit: 500 COIN + $500 · pool share 100%</div>
            <div class="srow"><span class="nm">COIN price now</span><input type="range" id="ilR" min="-8" max="8" value="0"><span class="v" id="ilRv">$1.00</span></div>
            <div class="statline" style="margin-top:16px"><div class="s"><span class="n" id="ilLP">$1,000</span><span class="l">your pool share</span></div><div class="s"><span class="n" id="ilH">$1,000</span><span class="l">if you had held</span></div><div class="s"><span class="n" id="ilD" style="color:var(--red)">0.0%</span><span class="l">impermanent loss</span></div></div>
            <div class="note" id="ilM" style="text-align:center;margin-top:12px">Arbitrage constantly rebalances the pool toward the market price, selling your winners for you on the way up.</div>`;
          s.appendChild(wrap);
          const draw = () => { const price = Math.pow(2, r / 4); // 0.25x..4x
            const hold = 500 * price + 500;
            const lp = 1000 * Math.sqrt(price); // 2*sqrt(k') with k' scaled
            const il = (lp / hold - 1) * 100;
            wrap.querySelector("#ilRv").textContent = "$" + price.toFixed(2);
            wrap.querySelector("#ilLP").textContent = "$" + Math.round(lp).toLocaleString();
            wrap.querySelector("#ilH").textContent = "$" + Math.round(hold).toLocaleString();
            const d = wrap.querySelector("#ilD"); d.textContent = il.toFixed(1) + "%"; d.style.color = il < -2 ? "var(--red)" : "var(--ink-3)";
            wrap.querySelector("#ilM").innerHTML = Math.abs(r) < 1 ? `Arbitrage constantly rebalances the pool toward the market price, selling your winners for you on the way up.` : `The pool sold COIN as it rose (or bought as it fell), so it always underperforms just holding. The gap is <b>impermanent loss</b>. "Impermanent" because it vanishes if the price returns, permanent the moment you withdraw. Trading fees exist to pay you for bearing exactly this.`; };
          wrap.querySelector("#ilR").oninput = e => { r = +e.target.value; draw(); }; draw();
        } },
      { n: "03", h: "Where does the machine get its facts?", cap: "A lending contract must know the market price, but contracts cannot browse the web. They ask <b>oracles</b>. Bribe one and see why serious protocols never trust a single source.",
        build(s) {
          const wrap = el("div", "fcard"); let lie = false, mode = "one";
          const feeds = [1.00, 1.01, 0.99, 1.00, 1.02];
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>five price feeds · one lending contract</div>
            <div id="orF" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(86px,1fr));gap:8px"></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn danger" id="orLie">Bribe oracle #3</button><button class="btn" id="orMode">Contract reads: <b id="orMl">one feed</b></button><button class="btn" id="orRst">Reset</button></div>
            <div class="verdict yes" id="orV" style="margin-top:12px"></div>`;
          s.appendChild(wrap);
          const draw = () => { const cur = feeds.map((v, i) => (lie && i === 2) ? 9.90 : v);
            wrap.querySelector("#orF").innerHTML = cur.map((v, i) => `<div class="pos-card${lie && i === 2 ? " slashed" : ""}"><b>oracle ${i + 1}</b><div class="stk" style="font-size:16px;${lie && i === 2 ? "color:var(--red)" : ""}">$${v.toFixed(2)}</div></div>`).join("");
            const used = mode === "one" ? cur[2] : cur.slice().sort((a, b) => a - b)[2];
            wrap.querySelector("#orMl").textContent = mode === "one" ? "one feed" : "median of five";
            const v = wrap.querySelector("#orV");
            if (used > 2) { v.className = "verdict no"; v.innerHTML = `Contract believes COIN = $${used.toFixed(2)} → attacker borrows against fake collateral and drains the vault.`; }
            else { v.className = "verdict yes"; v.innerHTML = lie && mode === "med" ? `Median holds at $${used.toFixed(2)}. the lie is simply outvoted. One dishonest source among many changes nothing.` : `Contract reads COIN = $${used.toFixed(2)}. All quiet.`; } };
          wrap.querySelector("#orLie").onclick = () => { lie = true; draw(); };
          wrap.querySelector("#orMode").onclick = () => { mode = mode === "one" ? "med" : "one"; draw(); };
          wrap.querySelector("#orRst").onclick = () => { lie = false; mode = "one"; draw(); };
          draw();
        } },
    ],
    deeper: P("The constant-product formula is Uniswap's, and it has a beautiful property: the pool can never be emptied by trading, because each successive coin costs more than the last. the price goes vertical as inventory runs out. Impermanent loss has an exact closed form, <code>2√r/(1+r) − 1</code> for a price ratio <i>r</i>: a 2× move costs ~5.7%, a 4× move ~20%. Fees are the counterweight; a busy pool can out-earn its loss. The oracle demo is the third echo of this course's oldest idea. one keeper of the truth is a target, many keepers with a median is a system. Real oracle networks (Chainlink and kin) add staking and slashing on top, so lying also costs the liar money."),
    bridge: "Contracts, tokens, and now markets. a whole financial system running on the machine you built. Every piece of it, though, is only yours through a <b>key</b>. Time to talk about where that key lives, and how people actually lose everything." };

  L.mev = { world: "progmoney", title: "The Invisible Tax (MEV)", oneliner: "Extract risk-free profit by reordering the mempool", icon: "⇿", deep: true,
    hero: "You are the block producer. You have dictatorial power over the order of transactions. Watch how that power turns a naive user's trade into your risk-free profit.",
    beats: [
      { n: "01", h: "Sandwich the trade", cap: "The pool holds 10,000 COIN and 10,000 USD (spot price $1.00). A victim is about to buy a massive $4,000 of COIN, which will spike the price. Order the mempool to front-run their buy with your own, then back-run them by selling it back.",
        build(s) {
          const wrap = el("div", "fcard");
          let X = 10000, Y = 10000, aUsd = 0, aCoin = 0;
          let blockTxs = [];
          const avail = [
            { id: "atkB", t: "Your Front-run Buy", d: "Swap $1,000 for COIN", c: "atkB" },
            { id: "vic", t: "Victim's Trade", d: "Swap $4,000 for COIN", c: "vic" },
            { id: "atkS", t: "Your Back-run Sell", d: "Sell all your COIN for USD", c: "atkS" }
          ];
          let isPrivate = false;
          
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>maximal extractable value</div>
            <div class="statline"><div class="s"><span class="n" id="mvX">10,000</span><span class="l">COIN in pool</span></div><div class="s"><span class="n" id="mvY">10,000</span><span class="l">USD in pool</span></div><div class="s"><span class="n" id="mvP">$1.00</span><span class="l">spot price</span></div><div class="s"><span class="n" id="mvPnl">$0</span><span class="l">your profit</span></div></div>
            
            <div style="margin-top:20px;display:flex;gap:12px;align-items:center"><label style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="mvPriv" style="width:16px;height:16px;accent-color:var(--plum)"> Victim uses Private Relay</label></div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px">
              <div><div class="lx" style="font-size:11px;font-weight:700;color:var(--ink-3);margin-bottom:8px">MEMPOOL (CLICK TO ADD)</div><div id="mvMem" style="display:flex;flex-direction:column;gap:8px;min-height:160px"></div></div>
              <div><div class="lx" style="font-size:11px;font-weight:700;color:var(--ink-3);margin-bottom:8px">YOUR BLOCK (EXECUTION ORDER)</div><div id="mvBlk" style="display:flex;flex-direction:column;gap:8px;min-height:160px;padding:8px;border:1px dashed var(--line);border-radius:10px;background:var(--surface-3)"></div></div>
            </div>
            
            <div class="btn-row" style="justify-content:center;margin-top:20px"><button class="btn gold" id="mvGo">Mine Block &amp; Execute</button><button class="btn" id="mvRst">Reset</button></div>
            <div class="verdict" id="mvV" style="margin-top:12px;display:none"></div>`;
          s.appendChild(wrap);
          
          const fmtN = n => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
          const txHtml = (t, i) => `<div class="pos-card" style="cursor:pointer;background:var(--surface);border:1px solid ${t.id === 'vic' ? 'var(--gold)' : 'var(--plum)'};padding:10px;border-radius:8px" data-idx="${i}"><b>${t.t}</b><div class="stk" style="font-size:12px">${t.d}</div></div>`;
          
          const draw = () => {
            wrap.querySelector("#mvX").textContent = fmtN(X); wrap.querySelector("#mvY").textContent = fmtN(Y);
            wrap.querySelector("#mvP").textContent = "$" + (Y / X).toFixed(2);
            const pEl = wrap.querySelector("#mvPnl"); pEl.textContent = "$" + Math.round(aUsd).toLocaleString(); pEl.style.color = aUsd > 0 ? "var(--green)" : "var(--ink)";
            
            const mpool = avail.filter(t => !blockTxs.includes(t.id) && !(isPrivate && t.id === 'vic'));
            wrap.querySelector("#mvMem").innerHTML = mpool.map((t, i) => txHtml(t, t.id)).join("");
            wrap.querySelector("#mvBlk").innerHTML = blockTxs.map(id => txHtml(avail.find(x => x.id === id), id)).join("") + (blockTxs.length === 0 ? `<div style="text-align:center;color:var(--ink-4);font-size:12px;margin-top:40px">Empty block</div>` : "");
            
            wrap.querySelectorAll("#mvMem .pos-card").forEach(el => el.onclick = () => { blockTxs.push(el.dataset.idx); draw(); });
            wrap.querySelectorAll("#mvBlk .pos-card").forEach(el => el.onclick = () => { blockTxs = blockTxs.filter(id => id !== el.dataset.idx); draw(); });
          };
          
          wrap.querySelector("#mvPriv").onchange = e => { isPrivate = e.target.checked; blockTxs = blockTxs.filter(id => id !== 'vic'); draw(); };
          
          wrap.querySelector("#mvGo").onclick = () => {
            if (X !== 10000) return; // already ran
            let hist = [];
            const swapUsdForCoin = (usdIn) => { const out = X - (X * Y) / (Y + usdIn); X -= out; Y += usdIn; return out; };
            const swapCoinForUsd = (coinIn) => { const out = Y - (X * Y) / (X + coinIn); Y -= out; X += coinIn; return out; };
            
            if (isPrivate) { swapUsdForCoin(4000); hist.push("Builder executed private Victim Tx first."); }
            
            for (const id of blockTxs) {
              if (id === 'atkB') { const got = swapUsdForCoin(1000); aUsd -= 1000; aCoin += got; hist.push(`You bought ${got.toFixed(1)} COIN.`); }
              else if (id === 'vic' && !isPrivate) { swapUsdForCoin(4000); hist.push("Victim bought COIN, pushing price up."); }
              else if (id === 'atkS') { const got = swapCoinForUsd(aCoin); aUsd += got; aCoin = 0; hist.push(`You sold all COIN for $${got.toFixed(1)}.`); }
            }
            
            draw();
            const v = wrap.querySelector("#mvV"); v.style.display = "block";
            if (aUsd > 0) { v.className = "verdict yes"; v.innerHTML = `You extracted <b>$${Math.round(aUsd)}</b> in risk-free profit. You bought low, the victim's massive trade pushed the price up, and you sold high. The victim paid for your profit through worse execution. This is a sandwich attack.`; }
            else if (isPrivate) { v.className = "verdict no"; v.innerHTML = `Your attack failed. The victim bypassed the public mempool and sent their trade directly to a trusted builder. You could not front-run them.`; }
            else { v.className = "verdict no"; v.innerHTML = `Your sequence netted $${Math.round(aUsd)}. To extract profit, you must sandwich the victim: Buy first (front-run), let them buy (pushing price up), then sell (back-run).`; }
          };
          
          wrap.querySelector("#mvRst").onclick = () => { X = 10000; Y = 10000; aUsd = 0; aCoin = 0; blockTxs = []; wrap.querySelector("#mvV").style.display = "none"; draw(); };
          draw();
        } }
    ],
    deeper: P("Maximal Extractable Value (MEV) is the profit a miner or block producer can make by including, excluding, or reordering transactions in the blocks they produce. Because they have dictatorial control over the exact sequence of events, they can insert their own trades immediately before and after yours. In a Sandwich Attack, they see your large buy order pending, buy the asset first to push the price up, let your order execute at the worsened price, and immediately sell the asset back for a profit. The only defense is a 'Private Relay' (like Flashbots), where you submit your transaction directly to a trusted builder who promises not to front-run you, skipping the public mempool entirely."),
    bridge: "The invisible tax of the mempool is real, and dodging it means trusting a central builder, the very thing the chain was supposed to avoid. This tension between decentralisation, security, and scale is exactly what the final engineering chapters address."
  };

  /* ============================================================
     HISTORY: the disasters that proved the rules
     ============================================================ */
  L.history = { world: "history", title: "Five disasters", oneliner: "Each catastrophe proved one rule you now know", icon: "✕",
    hero: "This course kept saying things like 'not your keys, not your coins' and 'immutable bugs'. None of those rules came from theory. Flip each card to see the bill.",
    beats: [
      { n: "01", h: "Flip the cards", cap: "Front: the event, as the world saw it. Back: the exact principle from this course that it proved, and what it cost to learn. Every one of these maps to a lesson you have already done.",
        build(s) {
          const wrap = el("div", "fcard");
          const cards = [
            ["2010 · The pizza", "A developer pays 10,000 BTC for two pizzas: the first real-world price for a blockchain asset.",
              "Money is whatever a stranger will accept for goods: <b>The ledger</b>. A network with no users is worthless at any hashrate; the pizza made the ledger real. (Those coins later peaked above $600m. but on the day, two pizzas was the honest price.)"],
            ["2014 · Mt. Gox", "The exchange handling ~70% of all Bitcoin trades collapses; 850,000 BTC belonging to customers is gone.",
              "<b>Not your keys, not your coins</b>. Wallets &amp; custody. Customers held a promise from a company, not coins on a chain. The chain itself was never touched; the <i>custodian</i> was the single point of failure, exactly like the frozen account in lesson two."],
            ["2016 · The DAO", "A crowdfunded contract holding $150m of ETH is drained through a reentrancy bug (the send-before-subtract mistake.",
              "<b>Immutable code, immutable bugs</b>. Smart contracts. The code ran exactly as written, so the drain was 'legal' by the machine's rules. Ethereum's community forked the chain to undo it, proving the deeper rule: immutability is a <i>social</i> promise, and the split (Ethereum vs Ethereum Classic) is still visible today."],
            ["2022 · Terra / Luna", "An 'algorithmic' stablecoin with no full reserve loses its peg; $40bn evaporates in a week.",
              "<b>A peg is only as strong as what backs it</b>. Money &amp; the state. The defending mechanism (mint Luna to buy UST) became the killing mechanism once confidence broke: defending the peg hyperinflated the collateral. A death spiral is the design working as specified."],
            ["2022 · FTX", "A top-three exchange freezes withdrawals; customer deposits had been quietly lent to its own trading firm.",
              "<b>Trusted third parties are security holes</b>. the course's very first problem, wearing a new logo. Every rule broken was a chapter of this course: custody (keys), transparency (the public ledger), and the freeze in lesson two, replayed at $8bn scale."],
          ];
          wrap.innerHTML = `<div class="flabel"><span class="pin"></span>tap a card to flip it</div>` +
            cards.map(c => `<button class="flipRow" type="button"><span class="side good"><b class="mono" style="font-size:11px;letter-spacing:.06em">${c[0]}</b><br>${c[1]}</span><span class="side dark">${c[2]}</span></button>`).join("");
          s.appendChild(wrap);
          wrap.querySelectorAll(".flipRow").forEach(b => b.onclick = () => b.classList.toggle("flipped"));
        } },
    ],
    deeper: P("A pattern worth noticing: not one of these was a break in the cryptography. SHA-256 has never been reversed; ECDSA has never been forged at scale. Every headline loss was a failure at the <i>edges</i>: custodians holding other people's keys, contracts encoding a bug, economic designs assuming confidence is permanent, and plain fraud. That asymmetry is the course's quiet thesis: the maths is the strongest part of the machine. The people, incentives and institutions around it are where it breaks, which is why the safety lesson was about psychology, not mathematics."),
    bridge: "Five fortunes paid to prove rules you now get for the price of a course. One thing left: watch every piece you built (keys, blocks, gossip, consensus) run together as a single living machine." };

  /* ============================================================
     new beats appended to existing lessons (before the plus layer
     adds its checkpoints, so quizzes stay last)
     ============================================================ */

  /* nonce: the difficulty thermostat */
  L.nonce.beats.push({ n: "04", h: "The thermostat", cap: "Miners join and leave constantly, yet blocks keep arriving every ~10 minutes. The network <b>retargets</b>: measure recent block times, adjust the difficulty. Drag the hashrate around and try to make blocks permanently fast.",
    build(s) {
      const wrap = el("div", "fcard"); let hash = 100, diff = 100, live = true;
      wrap.innerHTML = `<div class="srow"><span class="nm">network hashrate</span><input type="range" id="thH" min="25" max="800" value="100"><span class="v" id="thHv">100%</span></div>
        <div class="statline" style="margin:16px 0"><div class="s"><span class="n" id="thD">100%</span><span class="l">difficulty</span></div><div class="s"><span class="n" id="thT" style="color:var(--green)">10.0</span><span class="l">min / block</span></div></div>
        <div class="log" id="thL"><div class="info">difficulty retarget log</div></div>
        <div class="note" id="thM" style="text-align:center;margin-top:10px">Crank the hashrate. Blocks speed up briefly.</div>`;
      s.appendChild(wrap);
      const log = (h, c) => { const l = wrap.querySelector("#thL"); l.appendChild(el("div", c, h)); l.scrollTop = l.scrollHeight; };
      const draw = () => { const bt = 10 * diff / hash; wrap.querySelector("#thHv").textContent = hash + "%"; wrap.querySelector("#thD").textContent = Math.round(diff) + "%";
        const t = wrap.querySelector("#thT"); t.textContent = bt.toFixed(1); t.style.color = bt < 8 ? "var(--gold-text)" : bt > 12.5 ? "var(--red)" : "var(--green)"; return bt; };
      wrap.querySelector("#thH").oninput = e => { hash = +e.target.value; draw(); };
      const tick = () => { if (!document.contains(wrap)) { live = false; return; }
        const bt = 10 * diff / hash;
        if (Math.abs(bt - 10) > 0.8) { const old = diff; diff = Math.min(Math.max(hash, diff / 4), diff * 4); // clamp like Bitcoin's 4x rule
          log(`retarget: blocks at ${bt.toFixed(1)} min → difficulty ${old > diff ? "eases" : "rises"} to ${Math.round(diff)}%`, old > diff ? "ok" : "warn");
          wrap.querySelector("#thM").innerHTML = `The thermostat caught it. Whatever the hashrate does, difficulty follows it, and block time walks back to ~10 minutes. <b>You cannot make the chain permanently faster by mining harder</b>. You can only make it more expensive to attack.`; }
        draw(); setTimeout(tick, 1800); };
      draw(); setTimeout(tick, 1800);
    } });

  /* incentives: solo mining vs pools */
  L.incentives.beats.push({ n: "04", h: "Solo, or join a pool?", cap: "With 0.1% of the network you win a block. worth ~3 coins, about once a month, maybe. A <b>pool</b> shares wins pro-rata for the same expected pay. Fast-forward three months both ways and feel the difference.",
    build(s) {
      const wrap = el("div", "fcard"); let day = 0, solo = 0, pool = 0, soloWins = 0;
      wrap.innerHTML = `<div class="ledgrid">
          <div class="ledrow"><span class="led-ic" aria-hidden="true">⛏</span><span class="led-name">Solo · 0.1% hashrate</span><span class="led-bal" id="pmS">0.0</span><span class="led-u">COINS</span></div>
          <div class="ledrow"><span class="led-ic" aria-hidden="true">🤝</span><span class="led-name">In a 25% pool · same 0.1%</span><span class="led-bal" id="pmP">0.0</span><span class="led-u">COINS</span></div>
        </div>
        <div class="statline" style="margin:14px 0 0"><div class="s"><span class="n" id="pmD">0</span><span class="l">days</span></div><div class="s"><span class="n" id="pmW">0</span><span class="l">solo blocks won</span></div></div>
        <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn primary" id="pmGo">Fast-forward 30 days</button><button class="btn" id="pmR">Reset</button></div>
        <div class="note" id="pmM" style="text-align:center;margin-top:10px">144 blocks a day network-wide. Same expected income: very different months.</div>`;
      s.appendChild(wrap);
      const draw = () => { wrap.querySelector("#pmS").textContent = solo.toFixed(1); wrap.querySelector("#pmP").textContent = pool.toFixed(1);
        wrap.querySelector("#pmD").textContent = day; wrap.querySelector("#pmW").textContent = soloWins; };
      wrap.querySelector("#pmGo").onclick = () => {
        for (let d = 0; d < 30; d++) { day++;
          for (let b = 0; b < 144; b++) { if (Math.random() < 0.001) { solo += 3; soloWins++; } }
          pool += 144 * 0.25 * (0.001 / 0.25) * 3; } // pool wins 25% of blocks, pays your 0.4% share of them
        draw();
        wrap.querySelector("#pmM").innerHTML = soloWins === 0 && day >= 60 ? `<b>${day} days, zero solo blocks.</b> The pool member ate every day. Same expected value. The pool sells you <i>smoothness</i> for a small fee. The catch: pools aggregate hashpower, and a pool drifting past 50% is exactly the attacker from the last lesson.` : `Solo pay arrives in rare 3-coin lumps; pool pay drips daily. Over years they converge. Variance, not expectation, is what the pool removes. But note who now <i>directs</i> that hashpower: pools are how mining centralises.`;
      };
      wrap.querySelector("#pmR").onclick = () => { day = 0; solo = 0; pool = 0; soloWins = 0; draw(); wrap.querySelector("#pmM").innerHTML = `144 blocks a day network-wide. Same expected income: very different months.`; };
      draw();
    } });

  /* attack: the double-spend heist, played for money */
  L.attack.beats.push({ n: "03", h: "Run the heist yourself", cap: "Pay a merchant 10 coins, then secretly mine a fork where the payment never happened. The merchant ships after <b>3 confirmations</b>. Every secret block costs you 1.5 coins of electricity. Get rich, or find out why nobody does this at 30%.",
    build(s) {
      const wrap = el("div", "fcard"); let q = 30, running = false, pnl = 0, runs = 0, wins = 0;
      wrap.innerHTML = `<div class="srow"><span class="nm">your hashrate</span><input type="range" id="hsQ" min="10" max="48" value="30"><span class="v" id="hsQv">30%</span></div>
        <div id="hsRace" style="margin:12px 0"></div>
        <div class="statline"><div class="s"><span class="n" id="hsPnl">0.0</span><span class="l">total profit (coins)</span></div><div class="s"><span class="n" id="hsRuns">0</span><span class="l">heists</span></div><div class="s"><span class="n" id="hsWins">0</span><span class="l">succeeded</span></div></div>
        <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn danger" id="hsGo">Run the heist</button><button class="btn" id="hsR">Reset the books</button></div>
        <div class="note" id="hsM" style="text-align:center;margin-top:10px">Success pays +10 (goods kept, payment erased). Every secret block mined costs 1.5.</div>`;
      s.appendChild(wrap);
      wrap.querySelector("#hsRace").innerHTML = `<div class="srow" style="gap:8px"><span class="nm" style="width:64px;color:var(--green)">honest</span><div style="flex:1;height:14px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i id="hsH" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:24px;color:var(--green)" id="hsHn">0</span></div>
        <div class="srow" style="gap:8px;margin-top:5px"><span class="nm" style="width:64px;color:var(--red)">secret</span><div style="flex:1;height:14px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i id="hsE" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:24px;color:var(--red)" id="hsEn">0</span></div>`;
      const draw = () => { wrap.querySelector("#hsPnl").textContent = pnl.toFixed(1); wrap.querySelector("#hsPnl").style.color = pnl < 0 ? "var(--red)" : "var(--green)";
        wrap.querySelector("#hsRuns").textContent = runs; wrap.querySelector("#hsWins").textContent = wins; };
      wrap.querySelector("#hsQ").oninput = e => { q = +e.target.value; wrap.querySelector("#hsQv").textContent = q + "%"; };
      wrap.querySelector("#hsR").onclick = () => { if (running) return; pnl = 0; runs = 0; wins = 0; draw(); wrap.querySelector("#hsM").innerHTML = `Success pays +10 (goods kept, payment erased). Every secret block mined costs 1.5.`; };
      wrap.querySelector("#hsGo").onclick = () => { if (running) return; running = true; runs++;
        const qf = q / 100; let h = 3, e = 0, cost = 0, t = 0; // merchant already has 3 confirmations
        const step = () => { if (!document.contains(wrap)) { running = false; return; }
          t++; if (Math.random() < qf) { e++; cost += 1.5; } else h++;
          const sc = Math.max(h, e, 8);
          wrap.querySelector("#hsH").style.width = h / sc * 100 + "%"; wrap.querySelector("#hsE").style.width = e / sc * 100 + "%";
          wrap.querySelector("#hsHn").textContent = h; wrap.querySelector("#hsEn").textContent = e;
          if (e > h) { wins++; pnl += 10 - cost; running = false; draw();
            wrap.querySelector("#hsM").innerHTML = `<span style="color:var(--red)">Heist succeeded</span>. Fork revealed, payment erased, goods kept. Net this run: <b>+${(10 - cost).toFixed(1)}</b>. Run it again, one win proves nothing.`; return; }
          if (h - e > 10 || t > 90) { pnl -= cost; running = false; draw();
            wrap.querySelector("#hsM").innerHTML = `<span style="color:var(--green)">The honest chain pulled away.</span> You quietly abandon the fork, losing <b>−${cost.toFixed(1)}</b> in electricity with nothing to show. ${pnl < -15 ? "Look at the running total. <b>This is the security model</b>: the attack is not impossible, it is a losing business." : "Watch the running total across a few more heists."}`; return; }
          setTimeout(step, 60); };
        step(); };
      draw();
    } });

  /* contracts: order the withdraw lines (the DAO bug, earned) */
  L.contracts.beats.push({ n: "03", h: "You write the withdraw function", cap: "Three lines: check the balance, send the money, subtract the balance. The only decision is whether to <b>send</b> or <b>subtract</b> first. Choose. One order is a bank, the other is a heist.",
    build(s) {
      const wrap = el("div", "fcard"); let busy = false;
      wrap.innerHTML = `<pre class="sc-screen" style="white-space:pre-wrap"><span style="color:#79e0c0">function</span> withdraw(amt) {
  <span style="color:#ffd479">require</span>(balance[msg.sender] >= amt);
  <span style="color:#c89bb0" id="cwA">?  // line A: msg.sender.send(amt)</span>
  <span style="color:#c89bb0" id="cwB">?  // line B: balance[msg.sender] -= amt</span>
}</pre>
        <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn" id="cwSend">Send first, subtract after</button><button class="btn" id="cwSub">Subtract first, send after</button><button class="btn" id="cwRst">Reset</button></div>
        <div class="log" id="cwL" style="margin-top:12px"><div class="info">the attacker's contract calls withdraw(100)…</div></div>`;
      s.appendChild(wrap);
      const log = (h, c) => { const l = wrap.querySelector("#cwL"); l.appendChild(el("div", c, h)); l.scrollTop = l.scrollHeight; };
      const reset = () => { wrap.querySelector("#cwL").innerHTML = `<div class="info">the attacker's contract calls withdraw(100)…</div>`; };
      wrap.querySelector("#cwRst").onclick = () => { busy = false; reset(); };
      wrap.querySelector("#cwSend").onclick = () => { if (busy) return; busy = true; reset(); let vault = 1000, i = 0;
        const step = () => { if (!document.contains(wrap) || !busy) return;
          if (vault <= 0) { log("vault: 0. drained before a single subtraction ran", "bad"); log("This is reentrancy, the DAO bug, $150m, 2016. 'send' handed control to the attacker's code <i>while the balance still said 100</i>, so it just called withdraw() again. And again.", "warn"); busy = false; return; }
          log(`require passes (balance still 100) → send(100)… attacker's code runs → it calls withdraw(100) again ${i ? "(re-entering, depth " + (i + 1) + ")" : ""}`, i ? "bad" : "");
          vault -= 100; i++; setTimeout(step, 380); };
        step(); };
      wrap.querySelector("#cwSub").onclick = () => { if (busy) return; busy = true; reset();
        setTimeout(() => { log("require passes → balance[attacker] -= 100 → balance is now 0", "ok");
          log("send(100)… attacker's code runs → it calls withdraw(100) again", "");
          log("require(balance >= 100) FAILS. balance already 0 → REVERT. One withdrawal, as designed.", "ok");
          log("Same three lines. 'Checks, effects, interactions'. update your own state before you talk to a stranger.", "info"); busy = false; }, 200); };
    } });

  /* tokens. beat 2 rebuilt: ownership means a signature, not a tap */
  L.tokens.beats[1] = { n: "02", h: "One of a kind. and provably yours", cap: "An NFT is a ledger row that maps one token ID to one <b>address</b>. Mint it, then watch two transfer attempts: one signed with your key, one with Mallory's. Ownership is not a picture. it is a signature check.",
    build(s) {
      const wrap = el("div", "fcard"); let owner = null;
      const you = "0x" + sha256("you-key").slice(-12), mal = "0x" + sha256("mallory-key").slice(-12);
      wrap.innerHTML = `<div class="flabel"><span class="pin"></span>ACME Gallery · token #7</div>
        <div class="bfields"><div class="bfield"><div class="k">token</div><div class="v">#7 · "Marigold Study"</div></div><div class="bfield" id="ownF"><div class="k">owner on the ledger</div><div class="v vi" id="ownV">- unminted -</div></div></div>
        <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn gold" id="nfMint">Mint to your address</button><button class="btn" id="nfYou" disabled>Transfer. signed with YOUR key</button><button class="btn danger" id="nfMal" disabled>Mallory tries to take it</button></div>
        <div class="sig-state" id="nfSt" style="margin-top:12px">Your address: <b class="mono">${short(you, 8, 4)}</b> · Mallory's: <b class="mono">${short(mal, 8, 4)}</b></div>`;
      s.appendChild(wrap);
      const st = (t, c) => { const e = wrap.querySelector("#nfSt"); e.innerHTML = t; e.className = "sig-state" + (c ? " " + c : ""); };
      wrap.querySelector("#nfMint").onclick = () => { owner = you; wrap.querySelector("#ownV").textContent = short(you, 8, 4);
        wrap.querySelector("#nfYou").disabled = false; wrap.querySelector("#nfMal").disabled = false;
        st(`Minted. The contract's ledger now reads <b class="mono">#7 → ${short(you, 8, 4)}</b>. No file moved. a row was written.`, "ok"); };
      wrap.querySelector("#nfYou").onclick = () => { if (owner !== you) { st("You no longer own it. the ledger says so.", "bad"); return; }
        owner = "0x" + sha256("friend").slice(-12); wrap.querySelector("#ownV").textContent = short(owner, 8, 4);
        st(`transfer(#7) · signature verifies against the <b>owner's</b> address → row updated to ${short(owner, 8, 4)}. Scarcity survived the transfer: still exactly one #7.`, "ok"); };
      wrap.querySelector("#nfMal").onclick = () => st(`transfer(#7) from Mallory · her signature verifies against <b class="mono">${short(mal, 8, 4)}</b>. but the ledger says #7 belongs to someone else → <b>REVERT</b>. Right-clicking the image copies pixels; it cannot write this row.`, "bad");
    } };


  /* ============================================================
     final pass: gas (contracts), UTXO (tx), be-the-validator (pos),
     and the capstone. build your own coin
     ============================================================ */

  /* contracts. the fuel meter */
  L.contracts.beats.push({ n: "04", h: "Every step burns fuel", cap: "Code on a shared world computer can't be free. an infinite loop would freeze every node forever. So each operation burns <b>gas</b>, paid up front. Give the program a budget and run it. Too little, and everything it did is undone.",
    build(s) {
      const wrap = el("div", "fcard"); let budget = 40;
      const STEPS = [["check the signature", 8], ["load Ava's balance", 6], ["subtract 5 coins", 7], ["add 5 to Ben", 7], ["write the receipt", 9]];
      const total = STEPS.reduce((a, x) => a + x[1], 0);
      wrap.innerHTML = `<div class="srow"><span class="nm">gas budget</span><input type="range" id="gsB" min="10" max="60" value="40"><span class="v" id="gsBv">40</span></div>
        <div style="margin:14px 0"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span class="note">fuel tank</span><span class="mono" id="gsLeft">40</span></div><div style="height:16px;background:var(--surface-3);border-radius:99px;overflow:hidden;border:1px solid var(--line);margin-top:4px"><i id="gsF" style="display:block;height:100%;width:100%;background:var(--gold);transition:width .3s"></i></div></div>
        <div class="log" id="gsL"><div class="info">program: pay Ben 5 coins (needs ${total} gas)</div></div>
        <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn gold" id="gsGo">Run the program</button></div>`;
      s.appendChild(wrap); let running = false;
      const log = (h, c) => { const l = wrap.querySelector("#gsL"); l.appendChild(el("div", c, h)); l.scrollTop = l.scrollHeight; };
      wrap.querySelector("#gsB").oninput = e => { if (running) return; budget = +e.target.value; wrap.querySelector("#gsBv").textContent = budget; wrap.querySelector("#gsLeft").textContent = budget; wrap.querySelector("#gsF").style.width = "100%"; };
      wrap.querySelector("#gsGo").onclick = () => { if (running) return; running = true;
        wrap.querySelector("#gsL").innerHTML = `<div class="info">program: pay Ben 5 coins (needs ${total} gas)</div>`;
        let left = budget, i = 0;
        const step = () => { if (!document.contains(wrap)) return;
          if (i >= STEPS.length) { log(`done. ${left} gas refunded. The payment stands.`, "ok"); running = false; return; }
          const [name, cost] = STEPS[i];
          if (left < cost) { log(`step ${i + 1}: ${name}. needs ${cost}, tank has ${left} → <b>OUT OF GAS</b>`, "bad");
            log("REVERT: every step above is undone, as if nothing ran. (You still pay for the gas burned. the nodes did the work.)", "bad");
            log("Same rule as the vending machine: all or nothing. Gas is why a buggy loop can't freeze the chain. it just runs out of money.", "info");
            wrap.querySelector("#gsF").style.background = "var(--red)"; running = false; return; }
          left -= cost; i++;
          wrap.querySelector("#gsLeft").textContent = left; wrap.querySelector("#gsF").style.width = (left / budget * 100) + "%"; wrap.querySelector("#gsF").style.background = "var(--gold)";
          log(`step ${i}: ${name} · −${cost} gas`, "");
          setTimeout(step, 420); };
        step(); };
    } });

  /* tx. UTXO vs account: where did the change come from? */
  L.tx.beats.push({ n: "04", h: "Paying 7 with a 10-coin note", cap: "Two ways a chain can do bookkeeping. <b>Account</b> style is a balance that goes up and down (Ethereum). <b>UTXO</b> style is cash: you hold whole \u201cnotes\u201d, spend one entirely, and the <b>change comes back as a new note</b> (Bitcoin). Pay Ben 7 both ways.",
    build(s) {
      const wrap = el("div", "fcard"); let mode = "utxo", spent = false;
      wrap.innerHTML = `<div class="btn-row" style="justify-content:center"><button class="btn" id="uMode">Style: <b id="uMl">UTXO (Bitcoin)</b></button><button class="btn gold" id="uPay">Pay Ben 7 coins</button><button class="btn" id="uRst">Reset</button></div>
        <div id="uStage" style="margin-top:14px"></div>
        <div class="note" id="uM" style="text-align:center;margin-top:10px">You hold one 10-coin note.</div>`;
      s.appendChild(wrap);
      const note = (amt, who, cls) => `<div class="pos-card" style="min-width:96px${cls === "gone" ? ";opacity:.35;text-decoration:line-through" : cls === "new" ? ";border-color:var(--green)" : ""}"><b>${who}</b><div class="stk" style="font-size:18px">${amt}</div><div class="note" style="font-size:10.5px">${cls === "gone" ? "spent. destroyed" : cls === "new" ? "new note" : "note"}</div></div>`;
      const draw = () => {
        const st = wrap.querySelector("#uStage");
        if (mode === "acct") {
          st.innerHTML = `<div class="ledgrid"><div class="ledrow"><span class="led-ic" aria-hidden="true">🧑</span><span class="led-name">You</span><span class="led-bal">${spent ? 3 : 10}</span><span class="led-u">COINS</span></div><div class="ledrow"><span class="led-ic" aria-hidden="true">🧔</span><span class="led-name">Ben</span><span class="led-bal">${spent ? 7 : 0}</span><span class="led-u">COINS</span></div></div>`;
          wrap.querySelector("#uM").innerHTML = spent ? `One number went down, another went up. the ledger from lesson one. Simple, but every payment needs a counter (the account nonce) so it can't be replayed.` : `A balance per person. Pay, and the numbers just move.`;
        } else {
          st.innerHTML = `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${spent ? note(10, "yours", "gone") + note(7, "→ Ben", "new") + note(3, "→ you (change)", "new") : note(10, "yours", "")}</div>`;
          wrap.querySelector("#uM").innerHTML = spent ? `The 10-note is <b>destroyed</b>, and two new notes are minted: 7 for Ben, <b>3 back to you as change</b>. exactly like handing over a tenner. This is why Bitcoin explorers show payments \u201cto yourself\u201d: that's your change returning.` : `You hold one 10-coin note. Notes are spent whole. no tearing a corner off.`;
        }
      };
      wrap.querySelector("#uMode").onclick = () => { mode = mode === "utxo" ? "acct" : "utxo"; wrap.querySelector("#uMl").textContent = mode === "utxo" ? "UTXO (Bitcoin)" : "Account (Ethereum)"; draw(); };
      wrap.querySelector("#uPay").onclick = () => { spent = true; draw(); };
      wrap.querySelector("#uRst").onclick = () => { spent = false; draw(); };
      draw();
    } });

  /* pos. you are the validator */
  L.pos.beats.push({ n: "03", h: "Your turn: stake it", cap: "Put your own coins on the line. Run 20 epochs and collect rewards in proportion to your stake. Then a briber shows up with an offer. Take it if you like. it's your money.",
    build(s) {
      const wrap = el("div", "fcard"); let stake = 32, earned = 0, epochs = 0, out = false, busy = false;
      wrap.innerHTML = `<div class="srow"><span class="nm">your stake</span><input type="range" id="vsS" min="8" max="96" step="8" value="32"><span class="v" id="vsSv">32Ξ</span></div>
        <div class="statline" style="margin:14px 0"><div class="s"><span class="n" id="vsE">0</span><span class="l">epochs run</span></div><div class="s"><span class="n" id="vsR" style="color:var(--green)">0.0</span><span class="l">rewards earned</span></div><div class="s"><span class="n" id="vsT">32.0</span><span class="l">total holdings</span></div></div>
        <div class="btn-row" style="justify-content:center"><button class="btn primary" id="vsRun">Run 20 epochs</button><button class="btn danger" id="vsBribe">Accept the bribe: +5Ξ to double-sign</button><button class="btn" id="vsRst">Reset</button></div>
        <div class="sig-state" id="vsM" style="margin-top:12px">The network has 320Ξ staked in total. Your odds of proposing each block = your share of it.</div>`;
      s.appendChild(wrap);
      const st = (t, c) => { const e = wrap.querySelector("#vsM"); e.innerHTML = t; e.className = "sig-state" + (c ? " " + c : ""); };
      const draw = () => { wrap.querySelector("#vsSv").textContent = stake + "Ξ"; wrap.querySelector("#vsE").textContent = epochs;
        wrap.querySelector("#vsR").textContent = earned.toFixed(1); wrap.querySelector("#vsT").textContent = out ? (stake / 2 + earned + 5).toFixed(1) : (stake + earned).toFixed(1); };
      wrap.querySelector("#vsS").oninput = e => { if (epochs || out) return; stake = +e.target.value; draw(); };
      wrap.querySelector("#vsRun").onclick = () => { if (busy || out) return; busy = true; let n = 0;
        const tick = () => { if (!document.contains(wrap)) return;
          n++; epochs++; for (let b = 0; b < 8; b++) if (Math.random() < stake / 320) earned += 0.1;
          draw(); if (n < 20) setTimeout(tick, 60); else { busy = false; st(`Steady drip: with ${stake}Ξ of 320Ξ staked you propose ~${Math.round(stake / 320 * 100)}% of blocks. Boring. which is the point. Honest validating is a savings account.`, "ok"); } };
        tick(); };
      wrap.querySelector("#vsBribe").onclick = () => { if (out) return; out = true;
        const burned = stake / 2; draw();
        st(`You double-signed for a 5Ξ bribe. The proof is public. anyone can submit it. <b>Slashed ${burned.toFixed(0)}Ξ</b> (half your stake) and ejected from the validator set: no more rewards, ever. Net: ${(5 - burned).toFixed(0)}Ξ. The bribe was never going to be worth more than the bond. that's the whole design.`, "bad"); };
      wrap.querySelector("#vsRst").onclick = () => { stake = 32; earned = 0; epochs = 0; out = false; busy = false; wrap.querySelector("#vsS").value = 32; draw(); st("The network has 320Ξ staked in total. Your odds of proposing each block = your share of it.", ""); };
      draw();
    } });

  /* ============================================================
     CAPSTONE II. build your own coin
     ============================================================ */
  L.coin = { world: "capstone", title: "Build your own coin", oneliner: "Name it, mine it, defend it. yours", icon: "◆",
    hero: "You have watched the machine run. Now assemble one from scratch: name a coin, mine its genesis block, sign its first payment, and hold the chain together while someone attacks it. Everything here is real hashes.",
    beats: [
      { n: "01", h: "Name it, then mine block zero", cap: "Every chain starts with a <b>genesis block</b>. mined like any other, but linking back to nothing. Name your coin, set the block reward, and spin the nonce for real. Each block you mine pays the reward to you, and after five blocks the reward <b>halves</b>.",
        build(s) {
          const wrap = el("div", "fcard"); let chain = [], reward = 10, mining = false;
          const name = () => (wrap.querySelector("#cnN").value.trim() || "MyCoin").slice(0, 14);
          wrap.innerHTML = `<div class="btn-row" style="align-items:center"><span class="note">coin name</span><input class="in" id="cnN" value="MyCoin" maxlength="14" style="width:140px"><span class="note">block reward</span><input class="in mono" id="cnR" value="10" style="width:56px"></div>
            <div class="statline" style="margin:16px 0"><div class="s"><span class="n" id="cnH">0</span><span class="l">blocks</span></div><div class="s"><span class="n" id="cnS">0</span><span class="l">total supply</span></div><div class="s"><span class="n" id="cnB" style="color:var(--green)">0</span><span class="l">your balance</span></div><div class="s"><span class="n" id="cnRw">10</span><span class="l">current reward</span></div></div>
            <div class="mchain" id="cnC" style="min-height:50px"></div>
            <div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn gold" id="cnGo">⛏ Mine the genesis block</button><button class="btn" id="cnRst">Start over</button></div>
            <div class="note" id="cnM" style="text-align:center;margin-top:10px">The name goes into the genesis block's data. hashed into everything that follows.</div>`;
          s.appendChild(wrap);
          const drawChain = (fresh) => { wrap.querySelector("#cnC").innerHTML = chain.map((b, i) => `${i > 0 ? '<span class="mlink2"></span>' : ""}<div class="mblk2${fresh && i === chain.length - 1 ? " fresh" : ""}"><span class="mb-n">#${b.n}</span><span class="mb-h mono">${short(b.hash, 4, 3)}</span></div>`).join("");
            const supply = chain.reduce((a, b) => a + b.pay, 0);
            wrap.querySelector("#cnH").textContent = chain.length; wrap.querySelector("#cnS").textContent = supply;
            wrap.querySelector("#cnB").textContent = supply; wrap.querySelector("#cnRw").textContent = reward; };
          wrap.querySelector("#cnGo").onclick = () => { if (mining) return; mining = true;
            const btn = wrap.querySelector("#cnGo"); btn.disabled = true;
            const prev = chain.length ? chain[chain.length - 1].hash : "0".repeat(12);
            const body = (chain.length === 0 ? "genesis of " + name() : name() + " block " + chain.length) + "|reward " + reward + " to you|" + prev;
            let nonce = 0;
            const spin = () => { if (!document.contains(wrap)) return;
              const t0 = performance.now();
              while (performance.now() - t0 < 35) { if (sha256(body + nonce).startsWith("000")) {
                chain.push({ n: chain.length, hash: sha256(body + nonce), pay: reward });
                const msgs = [`<b>${name()}</b> exists. Block #0 mined after ${nonce.toLocaleString()} guesses. reward paid to the only address that exists: yours.`,
                  `Block #${chain.length - 1} locks onto ${short(prev, 6, 4)}. Your past is already hardening.`];
                wrap.querySelector("#cnM").innerHTML = chain.length === 5 ? `<b style="color:var(--gold-text)">Halving.</b> Five blocks in, the reward drops ${reward} → ${reward / 2 >> 0}. Scarcity is a schedule you just wrote. same trick as Bitcoin's 21 million cap.` : msgs[Math.min(chain.length - 1, 1)];
                if (chain.length === 5) reward = reward / 2 >> 0 || 1;
                btn.textContent = "⛏ Mine the next block"; btn.disabled = false; mining = false;
                drawChain(true); wrap.querySelector("#cnC").scrollLeft = 1e6; return; }
                nonce++; }
              wrap.querySelector("#cnM").innerHTML = `spinning the nonce… ${nonce.toLocaleString()} guesses`; setTimeout(spin, 0); };
            spin(); };
          wrap.querySelector("#cnR").onchange = e => { if (!chain.length) { reward = Math.max(1, Math.min(50, parseInt(e.target.value) || 10)); drawChain(); } };
          wrap.querySelector("#cnRst").onclick = () => { chain = []; reward = Math.max(1, Math.min(50, parseInt(wrap.querySelector("#cnR").value) || 10)); mining = false; const b = wrap.querySelector("#cnGo"); b.textContent = "⛏ Mine the genesis block"; b.disabled = false; drawChain(); wrap.querySelector("#cnM").innerHTML = "The name goes into the genesis block's data. hashed into everything that follows."; };
          drawChain();
        } },
      { n: "02", h: "Its first real payment", cap: "A coin no one can receive is a diary. Two wallets appear on your chain. Ava and Ben. Pay Ava, and your chain checks the signature exactly the way you learned in chapter 02. Then let Ben try to forge one.",
        build(s) {
          const wrap = el("div", "fcard");
          const key = { you: sha256("you"), ava: sha256("ava"), ben: sha256("ben") };
          const addr = k => "0x" + sha256(k).slice(-10);
          wrap.innerHTML = `<div class="bfields"><div class="bfield"><div class="k">Ava's address</div><div class="v vi">${addr(key.ava)}</div></div><div class="bfield"><div class="k">Ben's address</div><div class="v vi">${addr(key.ben)}</div></div></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px"><button class="btn gold" id="cpPay">Sign &amp; send: you → Ava, 5</button><button class="btn danger" id="cpForge">Ben forges: "Ava → Ben, 5"</button></div>
            <div class="log" id="cpL" style="margin-top:12px"><div class="info">your chain's mempool</div></div>`;
          s.appendChild(wrap);
          const log = (h, c) => { const l = wrap.querySelector("#cpL"); l.appendChild(el("div", c, h)); l.scrollTop = l.scrollHeight; };
          wrap.querySelector("#cpPay").onclick = () => { const msg = "you→ava:5", sig = sha256(key.you + msg);
            log(`tx "you → Ava, 5" · sig ${short(sig, 8, 4)}`);
            log(`verify: sig matches sender's key → <b>VALID</b>. queued for the next block. Ava now truly owns 5 ${""}coins on your chain.`, "ok"); };
          wrap.querySelector("#cpForge").onclick = () => { const msg = "ava→ben:5", sig = sha256(key.ben + msg);
            log(`tx "Ava → Ben, 5" · signed with <i>Ben's</i> key · sig ${short(sig, 8, 4)}`, "warn");
            log(`verify: signature does not match <b>Ava's</b> key → REJECTED. Your chain just defended Ava without knowing her, trusting anyone, or asking you. You built that.`, "bad"); };
        } },
      { n: "03", h: "Now survive an attack", cap: "Your coin is worth something now, so someone wants to rewrite it. An attacker with 30% of your network's hashpower forks from block #1 and races your honest chain. You don't need to do anything. <b>that's the point</b>. Watch your machine defend itself.",
        build(s) {
          const wrap = el("div", "fcard"); let running = false, survived = 0;
          wrap.innerHTML = `<div id="atkR"></div>
            <div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn danger" id="atkGo">A 30% attacker forks your chain</button></div>
            <div class="sig-state" id="atkM" style="margin-top:12px">Everything you built this course. the links, the work, the incentives. is about to be tested at once.</div>`;
          s.appendChild(wrap);
          wrap.querySelector("#atkR").innerHTML = `<div class="srow" style="gap:8px"><span class="nm" style="width:82px;color:var(--green)">your chain</span><div style="flex:1;height:14px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i id="atkH" style="display:block;height:100%;width:0;background:var(--green)"></i></div><span class="v" style="width:24px;color:var(--green)" id="atkHn">0</span></div>
            <div class="srow" style="gap:8px;margin-top:5px"><span class="nm" style="width:82px;color:var(--red)">attacker</span><div style="flex:1;height:14px;background:var(--surface-3);border-radius:7px;overflow:hidden;border:1px solid var(--line)"><i id="atkE" style="display:block;height:100%;width:0;background:var(--red)"></i></div><span class="v" style="width:24px;color:var(--red)" id="atkEn">0</span></div>`;
          wrap.querySelector("#atkGo").onclick = () => { if (running) return; running = true;
            let h = 2, e = 0, t = 0;
            const step = () => { if (!document.contains(wrap)) return;
              t++; Math.random() < 0.3 ? e++ : h++;
              const sc = Math.max(h, e, 10);
              wrap.querySelector("#atkH").style.width = h / sc * 100 + "%"; wrap.querySelector("#atkE").style.width = e / sc * 100 + "%";
              wrap.querySelector("#atkHn").textContent = h; wrap.querySelector("#atkEn").textContent = e;
              if (e > h) { running = false; const m = wrap.querySelector("#atkM"); m.className = "sig-state bad"; m.innerHTML = `The attacker got lucky and overtook you. it happens, rarely, at 30%. Run it again: over many attempts the maths from the 51% lesson always collects.`; return; }
              if (h - e > 9) { survived++; running = false; const m = wrap.querySelector("#atkM"); m.className = "sig-state ok";
                m.innerHTML = `<b>Your chain pulled away${survived > 1 ? ". again (" + survived + " attacks survived)" : ""}.</b> You did nothing, and that was enough: every honest block made the rewrite more expensive, exactly as designed. This is the whole course in one picture. keys prove, hashes lock, work prices, incentives defend. <b>It's your machine now.</b>`; return; }
              setTimeout(step, 55); };
            step(); };
        } },
    ],
    deeper: P("Everything in this lesson used the same primitives as the real thing, only smaller: SHA-256 with a 3-zero target instead of ~19, a halving every 5 blocks instead of 210,000, one machine instead of a planet's worth. Nothing conceptual was simplified. a genesis block, coinbase rewards, signature-gated transfers and longest-chain defence are the entire skeleton of Bitcoin. The gap between your coin and a real one is not ideas; it is <i>other people</i>: miners who aren't you, users who disagree, attackers with budgets. A blockchain, in the end, is a machine for surviving other people."),
    bridge: "That's the course. Strangers keeping one honest record with no one in charge. money no state can freeze, or the most controllable money in history, depending entirely on who holds the keys. Same machine, opposite directions. You now know exactly why." };

})();
