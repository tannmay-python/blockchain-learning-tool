/* ============================================================
   lessons-v2.js: the restructure pass.

   Three jobs, in order:
   1. SPLIT the two overlong lessons so no lesson runs past four beats.
   2. ADD the lessons the old shape was missing (who runs the network,
      how final "final" is, seed phrases, gas, regulation).
   3. GROW the one-beat stubs (tour, mev, history) into real lessons.

   Loads last, mutates LESSONS in place, same as lessons-plus.js.
   ============================================================ */
import { LESSONS as L } from './lessons.js';
import './lessons-plus.js';
import './lessons-coin.js'; // capstone sandbox; must land before the renumber below

(function () {
  "use strict";
  if (!L) return;

  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const P = (t) => `<p>${t}</p>`;
  const pct = (x) => (x * 100).toFixed(x < 0.01 ? 2 : 0) + "%";

  /* a labelled card, the house shell for every interactive below */
  const card = (host, label, inner) => {
    const w = el("div", "fcard");
    w.innerHTML = `<div class="flabel"><span class="pin"></span>${label}</div>${inner}`;
    host.appendChild(w);
    return w;
  };
  /* a row of pick-one buttons; calls back with the chosen index */
  const chooser = (host, opts, onPick) => {
    const row = el("div", "btn-row");
    row.style.justifyContent = "center";
    row.innerHTML = opts.map((o, i) => `<button class="btn${i === 0 ? " primary" : ""}" data-c="${i}">${o}</button>`).join("");
    host.appendChild(row);
    const sync = (i) => row.querySelectorAll("button").forEach((b, k) => b.classList.toggle("primary", k === i));
    row.querySelectorAll("button").forEach(b => b.onclick = () => { const i = +b.dataset.c; sync(i); onPick(i); });
    return row;
  };

  /* ============================================================
     1. SPLITS — pull the tail beats off the two overlong lessons
     ============================================================ */

  /* nonce ran 5 beats: the puzzle, then difficulty retargeting.
     The retarget half becomes its own lesson. */
  const thermostat = L.nonce.beats.splice(4, 1);

  /* contracts ran 5: what a contract is, then gas. Same treatment, and
     the "check yourself" quiz moves to the end where it belongs. */
  const fuel = L.contracts.beats.splice(4, 1);
  const cQuiz = L.contracts.beats.splice(2, 1);
  L.contracts.beats.push(cQuiz[0]);

  /* wallets opened on the seed phrase, which deserves its own lesson */
  const phrase = L.wallets.beats.splice(0, 1);

  /* ============================================================
     2. NEW LESSONS
     ============================================================ */

  /* ---- 01.3 Who runs the network -------------------------------- */
  L.nodes = {
    world: "foundations", title: "Who runs it?", oneliner: "Wallets, full nodes, and miners", icon: "▣",
    hero: "\"The network\" sounds like one thing. It is really three different jobs, run by different machines with different powers: wallets, full nodes, and miners.",
    beats: [
      { n: "01", h: "Three jobs on one network", cap: "Everyone on the network is doing one of three jobs. They hold different amounts of data, and they can do very different things. Pick a role and see exactly what it can and cannot do.",
        build(s) {
          const ROLES = [
            { k: "Wallet", ic: "❖", holds: "Your keys. Nothing else.", size: "a few kilobytes",
              can: ["Sign payments with your key", "Ask someone else what your balance is"],
              cant: ["Check whether the chain is honest", "See a payment before it is public"],
              note: "A wallet trusts somebody else's copy of the chain. That is the trade you make for it fitting on a phone." },
            { k: "Full node", ic: "▣", holds: "Every block, every transaction, ever.", size: "hundreds of gigabytes",
              can: ["Verify every rule for itself", "Reject an invalid block instantly", "Serve the chain to wallets"],
              cant: ["Create new blocks", "Force anyone to accept its view"],
              note: "A full node takes nobody's word for anything: it checks every signature and every seal itself." },
            { k: "Miner", ic: "⛏", holds: "Every block, plus a lot of hardware.", size: "gigabytes, and megawatts",
              can: ["Propose the next block", "Choose which transactions to include", "Reorder the queue for profit"],
              cant: ["Break a signature rule and be accepted", "Spend coins it does not own"],
              note: "Miners decide the <b>order</b> of history. They do not decide the <b>rules</b>: full nodes throw out a miner that cheats, hashpower or no hashpower." },
          ];
          const w = card(s, "pick a role on the network", `<div id="rolebody"></div>`);
          const body = w.querySelector("#rolebody");
          const draw = (i) => {
            const r = ROLES[i];
            body.innerHTML = `
              <div style="text-align:center;padding:6px 0 14px">
                <div style="font-size:42px;line-height:1">${r.ic}</div>
                <div style="font-family:var(--disp);font-weight:600;font-size:24px;color:var(--plum);margin-top:6px">${r.k}</div>
                <div class="mono" style="font-size:12px;color:var(--ink-4);margin-top:4px">holds ${r.size}</div>
              </div>
              <div class="kvs"><div class="k">stores</div><div class="v">${r.holds}</div></div>
              <div style="display:grid;gap:8px;margin-top:14px">
                ${r.can.map(c => `<div class="sig-state good">✓ ${c}</div>`).join("")}
                ${r.cant.map(c => `<div class="sig-state bad">✕ ${c}</div>`).join("")}
              </div>
              <p class="note" style="margin-top:14px">${r.note}</p>`;
          };
          chooser(body.parentElement, ROLES.map(r => r.k), draw);
          draw(0);
        } },

      { n: "02", h: "Run a node for ten seconds", cap: "A full node just runs a fixed checklist. A block arrives, three checks run, and it gets accepted or rejected. Break any rule and watch it refuse the block: no committee, no appeal.",
        build(s) {
          let rules = { link: true, seal: true, sig: true };
          const w = card(s, "an incoming block, and your checklist", `
            <div id="checks" style="display:grid;gap:10px"></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px">
              <button class="btn danger" data-b="link">Break the link</button>
              <button class="btn danger" data-b="seal">Break the seal</button>
              <button class="btn danger" data-b="sig">Forge a signature</button>
              <button class="btn" id="fix">Repair all</button>
            </div>
            <div class="sig-state" id="verdict" style="margin-top:14px"></div>`);
          const LABEL = {
            link: ["Points at the block I already have", "Points at a block I have never seen"],
            seal: ["Proof of work is valid, hash starts with the required zeros", "Hash does not meet the difficulty target"],
            sig: ["Every transaction is signed by its owner", "One transaction carries a signature that does not verify"],
          };
          const draw = () => {
            w.querySelector("#checks").innerHTML = Object.keys(rules).map(k =>
              `<div class="sig-state ${rules[k] ? "good" : "bad"}">${rules[k] ? "✓" : "✕"} ${LABEL[k][rules[k] ? 0 : 1]}</div>`).join("");
            const ok = Object.values(rules).every(Boolean);
            const v = w.querySelector("#verdict");
            v.className = "sig-state " + (ok ? "good" : "bad");
            v.innerHTML = ok
              ? "<b>Accepted.</b> Added to my chain, and passed on to my peers."
              : "<b>Rejected.</b> Dropped on the floor, and not passed on. As far as this node is concerned, that block never existed.";
          };
          w.querySelectorAll("button[data-b]").forEach(b => b.onclick = () => { rules[b.dataset.b] = !rules[b.dataset.b]; draw(); });
          w.querySelector("#fix").onclick = () => { rules = { link: true, seal: true, sig: true }; draw(); };
          draw();
        } },

      { n: "03", h: "What you give up by not running one", cap: "Most people never run a full node. That is a reasonable choice, and it has a price. Slide between the two and watch what you are trusting somebody else to tell you the truth about.",
        build(s) {
          const w = card(s, "how much do you verify yourself?", `
            <input type="range" min="0" max="100" value="0" id="tr" style="width:100%">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-3);margin-top:6px">
              <span>ask someone (wallet)</span><span>check everything (full node)</span>
            </div>
            <div id="out" style="margin-top:16px"></div>`);
          const draw = (v) => {
            const t = v / 100;
            const trust = Math.round((1 - t) * 100);
            w.querySelector("#out").innerHTML = `
              <div class="kvs"><div class="k">taken on trust</div><div class="v ${trust > 50 ? "vi" : ""}">${trust}%</div></div>
              <div class="kvs"><div class="k">disk needed</div><div class="v">${t < .5 ? "~5 MB" : "~600 GB"}</div></div>
              <div class="kvs"><div class="k">if your provider lies about your balance</div><div class="v">${t < .5 ? "you believe it" : "you catch it"}</div></div>
              <p class="note" style="margin-top:12px">${t < .5
                ? "A light wallet asks a server \"am I rich?\" and believes the answer. In practice this is usually fine, and it is also exactly the middleman the whole system was built to remove."
                : "A full node is the only way to be certain. You check the maths yourself."}</p>`;
          };
          w.querySelector("#tr").oninput = (e) => draw(+e.target.value);
          draw(0);
        } },
    ],
    deeper: P("Miners have hashpower, so it's tempting to assume miners are in charge. They are not. A miner who mints itself a million coins produces a block that every full node rejects on sight, and a rejected block earns nothing. That's exactly why the 2017 Bitcoin block-size fight was settled by node operators, who simply refused to run the software that changed the rules, despite mining pools holding the raw hashpower."),
  };

  /* ---- 06.2 Finality -------------------------------------------- */
  L.finality = {
    world: "attacks", title: "How final is final?", oneliner: "Confirmations, reorgs, and when to ship", icon: "◷",
    hero: "The longest chain wins, and that has an uncomfortable consequence: a payment that looks settled can still be undone if someone builds a longer chain. Finality isn't a yes-or-no state, it's a probability that climbs with every block.",
    beats: [
      { n: "01", h: "Confirmations raise the cost of reversal", cap: "Every block stacked on top of yours makes reversing it harder. Drag through the confirmations and watch the cost of a reversal climb, which is why a coffee and a car call for very different waits.",
        build(s) {
          const w = card(s, "confirmations, and what they buy you", `
            <input type="range" min="0" max="12" value="0" id="cf" style="width:100%">
            <div class="xchain" id="blocks" style="margin:14px 0"></div>
            <div id="out"></div>`);
          const POLICY = [
            [0, "nothing", "A payment nobody has mined yet, so there is nothing on any chain yet to reverse."],
            [1, "a coffee", "One block. Cheap to reverse, but nobody burns a block to steal a flat white."],
            [3, "a laptop", "Three blocks is the common merchant default for ordinary goods."],
            [6, "a car", "Six is the old Bitcoin convention: about an hour, and priced out of casual attack."],
            [12, "a house", "Exchanges and large settlements wait this long, and sometimes longer."],
          ];
          const draw = (n) => {
            w.querySelector("#blocks").innerHTML = Array.from({ length: 13 }, (_, i) =>
              `<div class="xblock" style="min-width:26px;padding:0;opacity:${i < n ? 1 : .18};transition:opacity .2s">
                 <div class="xtop"></div><div class="xpad" style="padding:8px 4px;text-align:center;font-size:10px" class="mono">${i === 0 ? "yours" : i}</div>
               </div>`).join("");
            /* an attacker with 20% of the hashpower: odds of catching up n blocks */
            const q = 0.2, odds = Math.pow(q / (1 - q), n);
            const p = POLICY.filter(x => x[0] <= n).pop();
            w.querySelector("#out").innerHTML = `
              <div class="kvs"><div class="k">confirmations</div><div class="v">${n}</div></div>
              <div class="kvs"><div class="k">time waited</div><div class="v">~${n * 10} min</div></div>
              <div class="kvs"><div class="k">odds a 20% attacker undoes it</div><div class="v ${odds > 0.05 ? "" : "vi"}">${n === 0 ? "certain" : pct(Math.min(1, odds))}</div></div>
              <p class="note" style="margin-top:12px">Safe enough for <b>${p[1]}</b>. ${p[2]}</p>`;
          };
          w.querySelector("#cf").oninput = (e) => draw(+e.target.value);
          draw(0);
        } },

      { n: "02", h: "Watch one get undone", cap: "Here is your payment, two blocks deep and looking settled. Then a longer chain, mined in secret, arrives and takes over, and your block simply stops being part of history.",
        build(s) {
          const w = card(s, "your payment, and a rival chain", `
            <div id="stage" style="min-height:120px"></div>
            <div class="btn-row" style="justify-content:center;margin-top:12px">
              <button class="btn danger" id="go">Reveal the secret chain</button>
              <button class="btn" id="rs">Reset</button>
            </div>
            <div class="sig-state" id="msg" style="margin-top:12px">Your payment sits in block #1, with two blocks on top. The shop has shipped.</div>`);
          const render = (state) => {
            const rows = [
              { lab: "the chain everyone can see", blocks: ["#0", "#1 ⟵ you", "#2", "#3"], bad: state === "reorg" },
              ...(state === "reorg" ? [{ lab: "the attacker's chain, longer", blocks: ["#0", "#1 ✕", "#2", "#3", "#4"], win: true }] : []),
            ];
            w.querySelector("#stage").innerHTML = rows.map(r => `
              <div style="margin-bottom:12px;opacity:${r.bad ? .35 : 1};transition:opacity .4s">
                <div class="mono" style="font-size:11px;color:var(--ink-4);margin-bottom:6px">${r.lab}${r.bad ? " (orphaned)" : ""}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">${r.blocks.map(b =>
                  `<div style="font-family:var(--mono);font-size:11px;padding:8px 10px;border-radius:9px;border:1px solid ${r.win ? "var(--red)" : "var(--line-2)"};background:var(--surface-2)">${b}</div>`).join("")}</div>
              </div>`).join("");
          };
          w.querySelector("#go").onclick = () => {
            render("reorg");
            const m = w.querySelector("#msg");
            m.className = "sig-state bad";
            m.innerHTML = "<b>Reorganised.</b> The longer chain wins, so block #1 is discarded and your payment with it. The shop shipped the goods against a payment that no longer exists. Every extra confirmation makes this cost the attacker another block.";
          };
          w.querySelector("#rs").onclick = () => { render("ok"); const m = w.querySelector("#msg"); m.className = "sig-state"; m.innerHTML = "Your payment sits in block #1, with two blocks on top. The shop has shipped."; };
          render("ok");
        } },

      { n: "03", h: "The other kind of final", cap: "Proof of Work only ever gives you <b>probability</b>. Proof of Stake chains can do something different: once enough validators have voted, reversing a block means destroying their own money. Compare the two.",
        build(s) {
          const w = card(s, "two definitions of settled", `
            <div style="display:grid;gap:12px" id="cmp"></div>`);
          w.querySelector("#cmp").innerHTML = [
            { t: "Proof of Work", s: "probabilistic", d: "No block is ever <i>impossible</i> to reverse. It just gets exponentially more expensive. You choose a confirmation count that makes an attack cost more than your goods are worth.", c: "var(--gold)" },
            { t: "Proof of Stake", s: "economic finality", d: "After two rounds of validator votes a block is <b>finalised</b>. Reversing it requires validators to sign two conflicting histories, which is detectable, and the protocol destroys their stake for it.", c: "var(--plum)" },
          ].map(x => `
            <div style="border:1px solid var(--line);border-left:4px solid ${x.c};border-radius:12px;padding:14px 16px;background:var(--surface-2)">
              <div style="font-family:var(--disp);font-weight:600;font-size:18px;color:var(--plum)">${x.t}</div>
              <div class="mono" style="font-size:11px;color:var(--ink-4);letter-spacing:.08em;text-transform:uppercase;margin:4px 0 8px">${x.s}</div>
              <p class="note" style="margin:0">${x.d}</p>
            </div>`).join("");
        } },
    ],
    deeper: P("The exponential in beat one is Satoshi's, from section 11 of the Bitcoin paper: an attacker holding a fraction <b>q</b> of the hashpower catches up from <b>n</b> blocks behind with probability roughly (q/(1-q))<sup>n</sup> when q &lt; 0.5. At 20% and six blocks, that works out to under a thousandth of a percent, which is why six became the folk convention. As q approaches 0.5, the ratio approaches 1, the exponent stops helping, and no number of confirmations closes the gap. That's what the 51% threshold actually means."),
  };

  /* ---- 07.2 Seed phrases ---------------------------------------- */
  L.seed = {
    world: "keysworld", title: "Twelve words", oneliner: "How a seed phrase backs up a fortune", icon: "✎",
    hero: "A wallet mostly holds a single number, written down as a handful of ordinary English words. Every key you will ever own unfolds from that one number, deterministically, forever.",
    beats: phrase.concat([
      { n: "02", h: "Lose a word and find out", cap: "The words come from a fixed list of 2048, and the last word encodes a <b>checksum</b> of all the others. That makes a typo obvious, makes one missing word recoverable, and turns three missing words into a lost cause.",
        build(s) {
          const WORDS = ["ridge", "cactus", "velvet", "orbit", "salmon", "timber", "gossip", "anchor", "puzzle", "meadow", "lantern", "crisp"];
          let lost = 0;
          const w = card(s, "your recovery phrase", `
            <div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px"></div>
            <div class="btn-row" style="justify-content:center;margin-top:14px">
              <button class="btn danger" id="lose">Lose a word</button>
              <button class="btn" id="rs">Start over</button>
            </div>
            <div class="sig-state good" id="msg" style="margin-top:14px"></div>`);
          const draw = () => {
            w.querySelector("#grid").innerHTML = WORDS.map((word, i) => {
              const gone = i >= WORDS.length - lost;
              return `<div style="font-family:var(--mono);font-size:12px;padding:9px 10px;border-radius:9px;text-align:center;border:1px ${gone ? "dashed var(--red)" : "solid var(--line-2)"};background:${gone ? "var(--red-soft)" : "var(--surface-2)"};color:${gone ? "var(--red)" : "var(--ink)"}">
                <span style="color:var(--ink-4);font-size:10px">${i + 1}</span> ${gone ? "?????" : word}</div>`;
            }).join("");
            /* 2048 candidates per missing word, minus what the checksum rules out */
            const guesses = Math.pow(2048, lost) / (lost ? 16 : 1);
            const m = w.querySelector("#msg");
            if (lost === 0) { m.className = "sig-state good"; m.innerHTML = "<b>Complete.</b> These twelve words are the entire wallet. Anyone holding them holds the money."; }
            else if (lost === 1) { m.className = "sig-state good"; m.innerHTML = `<b>Still recoverable.</b> One word missing leaves about <b>${Math.round(guesses)}</b> candidates, and the checksum throws out all but a handful. Wallet software does this for you in seconds.`; }
            else if (lost === 2) { m.className = "sig-state"; m.innerHTML = `<b>Painful, but possible.</b> Roughly <b>${Math.round(guesses).toLocaleString()}</b> combinations to test. A laptop will grind through it.`; }
            else { m.className = "sig-state bad"; m.innerHTML = `<b>Gone.</b> About <b>${guesses.toExponential(1)}</b> combinations. There is no support line to call. This is what people mean when they say the money is simply lost.`; }
          };
          w.querySelector("#lose").onclick = () => { if (lost < WORDS.length) lost++; draw(); };
          w.querySelector("#rs").onclick = () => { lost = 0; draw(); };
          draw();
        } },

      { n: "03", h: "Where do you keep it?", cap: "The phrase is the money, so backing it up and hiding it are the same problem pulling in opposite directions. Every option below is a real thing people do. Weigh them against the two ways you actually lose coins.",
        build(s) {
          const OPT = [
            { t: "A screenshot on your phone", theft: 5, loss: 1, v: "Synced to a cloud account protected by a password you reuse. This is the single most common way people are robbed." },
            { t: "Written on paper, in a drawer", theft: 3, loss: 3, v: "Fine against hackers, useless against a house fire, a flood, or a tidy-minded relative." },
            { t: "Stamped into steel, in a safe", theft: 2, loss: 1, v: "Survives fire and water. Costs a little money and an afternoon: what serious holders actually use." },
            { t: "Split in three, two needed", theft: 1, loss: 2, v: "Shamir-style splitting: no single location can be robbed, but you now have three things to keep track of, and losing two is fatal." },
            { t: "Memorised, nowhere else", theft: 1, loss: 5, v: "Nobody can steal a thought. Unfortunately you will forget it, and there is no recovery from a forgotten phrase." },
          ];
          const bar = (n, col) => `<span style="display:inline-flex;gap:3px;vertical-align:middle">${Array.from({ length: 5 }, (_, i) =>
            `<i style="width:9px;height:9px;border-radius:2px;background:${i < n ? col : "var(--surface-3)"}"></i>`).join("")}</span>`;
          const w = card(s, "five ways to hold twelve words", `<div style="display:grid;gap:10px" id="o"></div>`);
          w.querySelector("#o").innerHTML = OPT.map(o => `
            <div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--surface-2)">
              <div style="font-weight:600;font-size:14px">${o.t}</div>
              <div style="display:flex;gap:18px;margin:8px 0;font-size:11px;color:var(--ink-3)">
                <span>stolen ${bar(o.theft, "var(--red)")}</span><span>lost ${bar(o.loss, "var(--gold-2)")}</span>
              </div>
              <p class="note" style="margin:0;font-size:12.5px">${o.v}</p>
            </div>`).join("");
        } },
    ]),
    deeper: P("The scheme is BIP-39, and the maths is tidier than it looks. Your wallet picks 128 bits of entropy, appends a 4-bit checksum taken from the SHA-256 of that entropy, and slices the 132 bits into twelve 11-bit chunks. Each chunk indexes a fixed 2048-word list, which is why the words are always ordinary and never quite random-sounding. Those bits then seed BIP-32, a tree of keys derived by repeated hashing, so a single phrase regenerates every address you have ever used, in order, on any wallet software, forever. Nothing about the wallet is stored anywhere else: whoever holds those twelve words can rebuild every key from scratch."),
  };

  /* ---- 08.2 Gas -------------------------------------------------- */
  L.gas = {
    world: "progmoney", title: "Gas", oneliner: "Paying for a computer nobody owns", icon: "⌁",
    hero: "A contract runs on thousands of machines at once, and none of their owners agreed to work for you for free. So every single operation costs <b>gas</b>, paid up front, and an infinite loop simply runs out of money instead of freezing the world.",
    beats: fuel.concat([
      { n: "02", h: "Bid for a seat in the block", cap: "Block space is an auction, not a queue. You name a fee, and the miner fills the block with the best-paying transactions first. Set your bid and watch where you land when the network is quiet, and when everyone is panicking.",
        build(s) {
          let bid = 20, load = 0;
          const w = card(s, "your bid against the mempool", `
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
              <span style="font-size:12px;color:var(--ink-3);min-width:74px">your fee</span>
              <input type="range" min="1" max="120" value="20" id="bid" style="flex:1;min-width:150px">
              <span class="mono" id="bidv" style="font-size:12px;min-width:64px;text-align:right">20 gwei</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <span style="font-size:12px;color:var(--ink-3);min-width:74px">network</span>
              <input type="range" min="0" max="2" value="0" id="load" style="flex:1;min-width:150px">
              <span class="mono" id="loadv" style="font-size:12px;min-width:64px;text-align:right">quiet</span>
            </div>
            <div id="mp" style="margin:16px 0;display:grid;gap:4px"></div>
            <div class="sig-state" id="msg"></div>`);
          const LOADS = [
            { k: "quiet", base: 8, spread: 14, n: 9 },
            { k: "busy", base: 30, spread: 40, n: 9 },
            { k: "NFT mint", base: 90, spread: 160, n: 9 },
          ];
          const draw = () => {
            const cfg = LOADS[load];
            /* a deterministic spread of rival bids, so the picture is stable while you drag */
            const rivals = Array.from({ length: cfg.n }, (_, i) => Math.round(cfg.base + cfg.spread * Math.pow(i / cfg.n, 1.6)));
            const all = rivals.concat([bid]).sort((a, b) => b - a);
            const SEATS = 5;
            const rank = all.indexOf(bid);
            const inBlock = rank < SEATS;
            w.querySelector("#mp").innerHTML = all.slice(0, 9).map((f, i) => {
              const mine = f === bid && all.indexOf(f) === i;
              const seat = i < SEATS;
              return `<div style="display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;
                        padding:5px 9px;border-radius:7px;
                        border:1px ${mine ? "solid var(--plum)" : "solid transparent"};
                        background:${seat ? "var(--gold-tint)" : "var(--surface-2)"};
                        opacity:${seat ? 1 : .55}">
                        <span style="width:52px;color:var(--ink-4)">${seat ? "in block" : "waiting"}</span>
                        <span style="flex:1">${f} gwei</span>
                        ${mine ? '<span style="color:var(--plum);font-weight:700">you</span>' : ""}
                      </div>`;
            }).join("");
            const m = w.querySelector("#msg");
            m.className = "sig-state " + (inBlock ? "good" : "bad");
            m.innerHTML = inBlock
              ? `<b>Included.</b> You outbid the queue and land in the next block, roughly 12 seconds away. You pay ${bid} gwei whether the network needed it or not.`
              : `<b>Still waiting.</b> Five seats, and ${rank} people bid more than you, so your transaction sits in the mempool until the network calms down or you raise your bid.`;
          };
          w.querySelector("#bid").oninput = (e) => { bid = +e.target.value; w.querySelector("#bidv").textContent = bid + " gwei"; draw(); };
          w.querySelector("#load").oninput = (e) => { load = +e.target.value; w.querySelector("#loadv").textContent = LOADS[load].k; draw(); };
          draw();
        } },
    ]),
    deeper: P("Gas separates two things that feel like one: <b>how much work</b> an operation costs, and <b>how much you pay</b> for it. The work is fixed by the protocol, in gas units, identical on every machine: a storage write costs 20,000 gas whether the network is idle or on fire. The price of a gas unit is what floats, set by an auction for the limited space in each block. Ethereum's EIP-1559 later split that price into a <b>base fee</b> that the protocol burns and adjusts automatically, plus a <b>tip</b> that goes to the proposer, which is why fees became far more predictable without ever becoming free."),
  };

  /* ---- 10.3 Regulation ------------------------------------------- */
  L.regulation = {
    world: "state", title: "Regulating a protocol", oneliner: "Where the law can actually reach", icon: "§",
    hero: "You cannot serve a court order on a hash function, but almost nobody touches a blockchain directly: they touch an exchange, an app, a bank. Regulation works by finding the places where the decentralised thing meets an entity with an address and a bank account.",
    beats: [
      { n: "01", h: "Find the pressure points", cap: "Here is the stack, from raw protocol to the person holding the phone. Click each layer and see how much leverage a regulator actually has over it. The answer changes sharply as you move up.",
        build(s) {
          const LAYERS = [
            { t: "The protocol", grip: 0, d: "Open-source rules running on machines in every jurisdiction at once. There is no company, no office and no server to seize. Banning the maths has never worked anywhere it has been tried." },
            { t: "Node operators & miners", grip: 1, d: "Real people using real electricity in real places. China's 2021 mining ban moved an estimated half of the world's Bitcoin hashrate in a matter of months. The chain did not stop, it just moved house." },
            { t: "Wallet & app developers", grip: 2, d: "Publishing code is largely speech, but running an interface, holding keys, or taking a fee starts to look like operating a business. It's the genuinely contested frontier right now." },
            { t: "Exchanges & custodians", grip: 4, d: "Holds customer money, needs banking, needs licences. This is where nearly all real regulation lands: KYC checks, reporting, capital rules, audits." },
            { t: "Banks & payment rails", grip: 5, d: "The oldest and tightest chokepoint. Cut an exchange off from the banking system and it does not matter how decentralised the chain underneath is." },
          ];
          const w = card(s, "the stack, and the law's grip on each layer", `<div id="ls" style="display:grid;gap:8px"></div><div id="det" style="margin-top:14px"></div>`);
          const draw = (sel) => {
            w.querySelector("#ls").innerHTML = LAYERS.map((l, i) => `
              <button data-l="${i}" style="text-align:left;width:100%;cursor:pointer;font-family:var(--sans);
                border:1px solid ${i === sel ? "var(--plum)" : "var(--line)"};border-radius:11px;padding:11px 13px;
                background:${i === sel ? "var(--plum-soft)" : "var(--surface-2)"};display:flex;align-items:center;gap:12px">
                <span style="flex:1;font-weight:${i === sel ? 600 : 500};font-size:13.5px;color:var(--ink)">${l.t}</span>
                <span style="display:inline-flex;gap:3px">${Array.from({ length: 5 }, (_, k) =>
                  `<i style="width:8px;height:14px;border-radius:2px;background:${k < l.grip ? "var(--plum)" : "var(--surface-3)"}"></i>`).join("")}</span>
              </button>`).join("");
            w.querySelector("#det").innerHTML = `<p class="note" style="margin:0"><b>${LAYERS[sel].t}.</b> ${LAYERS[sel].d}</p>`;
            w.querySelectorAll("button[data-l]").forEach(b => b.onclick = () => draw(+b.dataset.l));
          };
          draw(4);
        } },

      { n: "02", h: "The travel rule, in practice", cap: "Send money between two regulated exchanges and identity travels with it. Send it to a wallet you control and the trail stops at the edge. Move the same payment along different routes and watch what the regulator can see.",
        build(s) {
          const ROUTES = [
            { t: "Exchange → Exchange", seen: 3, d: "Both ends are licensed. Names, addresses and amounts are collected on both sides and shared under the travel rule. This looks a lot like a bank wire." },
            { t: "Exchange → your own wallet", seen: 2, d: "The withdrawal is recorded against your verified identity. After that the coins move on a public ledger under a pseudonym that is now firmly linked to you." },
            { t: "Wallet → Wallet", seen: 1, d: "No intermediary, so nobody files a report. But every hop is permanently public, and chain-analysis firms are very good at connecting a pseudonym to the moment it last touched a regulated venue." },
            { t: "Cash, in person", seen: 0, d: "The genuinely opaque option, and also the one that does not scale, requires trust in a stranger, and is illegal above modest thresholds in most countries." },
          ];
          const w = card(s, "pick a route for the same 10,000", `<div id="out"></div>`);
          const body = el("div", ""); w.appendChild(body);
          const draw = (i) => {
            const r = ROUTES[i];
            w.querySelector("#out").innerHTML = `
              <div style="text-align:center;margin:6px 0 14px">
                <div style="font-family:var(--disp);font-size:20px;font-weight:600;color:var(--plum)">${r.t}</div>
              </div>
              <div class="kvs"><div class="k">identity visible to a regulator</div><div class="v">${["none", "the pseudonym only", "one verified name", "both verified names"][r.seen]}</div></div>
              <div class="kvs"><div class="k">permanent public record</div><div class="v">${i === 3 ? "no" : "yes, forever"}</div></div>
              <p class="note" style="margin-top:12px">${r.d}</p>`;
          };
          chooser(body, ROUTES.map(r => r.t.replace(" → ", " → ")), draw);
          draw(0);
        } },

      { n: "03", h: "There is no free lunch here", cap: "Every rule buys something and costs something. Drag the dial from a fully private ledger to a fully traceable one, and read what you have just bought, and what you gave up for it.",
        build(s) {
          const w = card(s, "the actual policy tradeoff", `
            <input type="range" min="0" max="100" value="50" id="d" style="width:100%">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-3);margin-top:6px">
              <span>total privacy</span><span>total traceability</span>
            </div>
            <div id="out" style="margin-top:16px"></div>`);
          const draw = (v) => {
            const t = v / 100;
            const gain = t < .33 ? "Dissidents, journalists and ordinary people keep financial privacy from their own governments."
              : t < .67 ? "Serious crime is traceable through the regulated edges, while day-to-day payments stay reasonably private."
              : "Almost every payment is attributable. Fraud, sanctions evasion and ransomware become genuinely hard to run at scale.";
            const cost = t < .33 ? "Ransomware, sanctions evasion and large-scale fraud settle comfortably, and victims have little recourse."
              : t < .67 ? "The edges do the work, so the rules only bind people who already use regulated services."
              : "The same infrastructure that catches criminals catches everyone. A future government inherits a complete record of what every citizen ever paid for.";
            w.querySelector("#out").innerHTML = `
              <div class="sig-state good" style="margin-bottom:10px"><b>You gain.</b> ${gain}</div>
              <div class="sig-state bad"><b>You pay.</b> ${cost}</div>
              <p class="note" style="margin-top:12px">There is no setting on this dial that is simply correct, which is why this is a political question rather than a technical one, and why Brussels, Washington, Beijing and Delhi are answering it differently.</p>`;
          };
          w.querySelector("#d").oninput = (e) => draw(+e.target.value);
          draw(50);
        } },
    ],
    deeper: P("The pattern above is well known: regulators go after the <b>on-ramps and off-ramps</b>, the points where the system touches banks and identity. It is why the EU's MiCA regime and the FATF travel rule both define obligations for \"virtual asset service providers\", an entity-shaped category, and say almost nothing about the protocols themselves. It also explains the shape of the hardest open questions, which are precisely the cases where no entity exists: a decentralised exchange that is only a contract, a privacy tool that is only a library, a stablecoin issuer that has redomiciled offshore. India's own approach has run along the same grain: tax and reporting duties on exchanges, not any attempt to reach the chain itself."),
  };

  /* ============================================================
     3. GROW THE ONE-BEAT LESSONS
     ============================================================ */

  /* ---- tour: the five-step walk needed a why and a what-if ------- */
  L.tour.beats.push(
    { n: "02", h: "Where the time actually goes", cap: "The whole trip takes about ten minutes, but it is not spent evenly: almost all of it is one step, and knowing which one explains why blockchain payments feel the way they do.",
      build(s) {
        const STEPS = [
          { t: "You sign it", ms: 2, d: "Local maths on your own device." },
          { t: "It reaches the network", ms: 900, d: "Gossiped machine to machine across the world." },
          { t: "It waits in the pool", ms: 240000, d: "The long one. Sitting with everyone else's payments until a miner picks it up." },
          { t: "A block is sealed", ms: 320000, d: "Miners race. On average this lands every ten minutes, but any single attempt is pure luck." },
          { t: "Everyone updates", ms: 1200, d: "The new block spreads the same way the payment did." },
        ];
        const total = STEPS.reduce((a, x) => a + x.ms, 0);
        const w = card(s, "one payment, by time spent", `<div style="display:grid;gap:9px" id="b"></div>
          <p class="note" style="margin-top:12px">Signing is instant. Verifying is instant. <b>Waiting your turn is the entire delay</b>, and it exists because block space is scarce on purpose.</p>`);
        w.querySelector("#b").innerHTML = STEPS.map(x => `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:500">${x.t}</span>
              <span class="mono" style="color:var(--ink-4)">${x.ms < 1000 ? x.ms + " ms" : Math.round(x.ms / 1000) + " s"}</span>
            </div>
            <div style="height:9px;border-radius:99px;background:var(--surface-3);overflow:hidden">
              <i style="display:block;height:100%;border-radius:99px;width:${Math.max(1.5, x.ms / total * 100)}%;background:linear-gradient(90deg,var(--plum),var(--gold))"></i>
            </div>
            <div class="note" style="font-size:12px;margin-top:4px">${x.d}</div>
          </div>`).join("");
      } },

    { n: "03", h: "What breaks at each step", cap: "Each of the five steps has its own failure, and each one is a later chapter in this course. Click a step to see what goes wrong there, and which later chapter deals with it.",
      build(s) {
        const F = [
          { t: "You sign it", f: "Someone else signs for you", d: "Only possible if they have your key. Which is why the whole custody chapter exists.", w: "Chapter 07" },
          { t: "It reaches the network", f: "The message is censored or dropped", d: "Gossip routes around it: every peer forwards to every other peer, so silencing it means silencing nearly everyone.", w: "Chapter 05" },
          { t: "It waits in the pool", f: "A miner reorders the queue around you", d: "Entirely legal, entirely invisible, and quietly profitable. This is MEV.", w: "Chapter 09" },
          { t: "A block is sealed", f: "Somebody mines a fake block", d: "The seal has to satisfy proof of work, and every node checks it. Faking it costs more than it earns.", w: "Chapter 04" },
          { t: "Everyone updates", f: "Two blocks arrive at once", d: "The chain forks briefly, then the longer branch wins and the other is discarded.", w: "Chapter 05" },
        ];
        const w = card(s, "five steps, five failure modes", `<div id="ss" style="display:grid;gap:7px"></div><div id="d" style="margin-top:14px"></div>`);
        const draw = (sel) => {
          w.querySelector("#ss").innerHTML = F.map((x, i) => `
            <button data-f="${i}" style="text-align:left;width:100%;cursor:pointer;font-family:var(--sans);font-size:13px;
              border:1px solid ${i === sel ? "var(--plum)" : "var(--line)"};border-radius:10px;padding:10px 12px;
              background:${i === sel ? "var(--plum-soft)" : "var(--surface-2)"};color:var(--ink)">
              <span class="mono" style="color:var(--ink-4);font-size:11px">0${i + 1}</span> &nbsp;${x.t}</button>`).join("");
          const x = F[sel];
          w.querySelector("#d").innerHTML = `
            <div class="sig-state bad" style="margin-bottom:10px"><b>Fails when:</b> ${x.f}</div>
            <p class="note" style="margin:0">${x.d}</p>
            <div class="mono" style="font-size:11px;color:var(--ink-4);margin-top:8px">covered in ${x.w}</div>`;
          w.querySelectorAll("button[data-f]").forEach(b => b.onclick = () => draw(+b.dataset.f));
        };
        draw(0);
      } },
  );

  /* ---- history: one card-flip beat was not a chapter ------------- */
  L.history.beats.push(
    { n: "02", h: "Which rule did each one break?", cap: "Every disaster below broke a rule you have already learned. Match the failure to the lesson it violated: none of them were failures of the chain itself.",
      build(s) {
        const CASES = [
          { t: "Mt. Gox, 2014", lost: "850,000 BTC", rule: "Not your keys, not your coins", d: "An exchange held everyone's keys and quietly leaked them for years. The Bitcoin protocol worked perfectly throughout." },
          { t: "The DAO, 2016", lost: "3.6M ETH", rule: "Immutable code, immutable bugs", d: "A recursive-withdrawal bug drained a contract that could not be patched. Ethereum forked to undo it, and the argument split the chain in two." },
          { t: "Terra / Luna, 2022", lost: "$40bn", rule: "A peg is a promise, not a law", d: "A stablecoin backed by its own sister token. When confidence went, the mechanism minted its way into a death spiral in three days." },
          { t: "FTX, 2022", lost: "$8bn", rule: "Not your keys, not your coins", d: "Customer deposits lent to an affiliated trading firm. An old-fashioned fraud, wearing new clothes." },
          { t: "Ronin bridge, 2022", lost: "$625m", rule: "Decentralised until you check", d: "A sidechain bridge secured by nine validators, five of which one company controlled. Compromise five keys and the bridge is yours." },
        ];
        let open = 0;
        const w = card(s, "five failures, five rules", `<div id="cs" style="display:grid;gap:8px"></div>`);
        const draw = () => {
          w.querySelector("#cs").innerHTML = CASES.map((c, i) => `
            <div style="border:1px solid ${i === open ? "var(--plum)" : "var(--line)"};border-radius:12px;overflow:hidden;background:var(--surface-2)">
              <button data-c="${i}" style="width:100%;text-align:left;cursor:pointer;font-family:var(--sans);border:0;background:transparent;padding:12px 14px;display:flex;align-items:center;gap:12px">
                <span style="flex:1;font-weight:600;font-size:13.5px;color:var(--ink)">${c.t}</span>
                <span class="mono" style="font-size:11.5px;color:var(--red)">${c.lost}</span>
              </button>
              ${i === open ? `<div style="padding:0 14px 13px">
                <div class="sig-state bad" style="margin-bottom:9px">Broke: <b>${c.rule}</b></div>
                <p class="note" style="margin:0;font-size:12.5px">${c.d}</p></div>` : ""}
            </div>`).join("");
          w.querySelectorAll("button[data-c]").forEach(b => b.onclick = () => { open = +b.dataset.c; draw(); });
        };
        draw();
      } },

    { n: "03", h: "The chain, or the company?", cap: "Sort them yourself. Every headline said \"crypto collapsed,\" but almost none of these were the chain itself failing.",
      build(s) {
        const ITEMS = [
          { t: "Mt. Gox", a: "company" }, { t: "The DAO", a: "chain" }, { t: "Terra / Luna", a: "design" },
          { t: "FTX", a: "company" }, { t: "Ronin bridge", a: "design" }, { t: "Celsius", a: "company" },
        ];
        let picks = {};
        const LAB = { company: "A company failed", chain: "The chain itself", design: "The design was wrong" };
        const w = card(s, "sort the six", `<div id="items" style="display:grid;gap:9px"></div>
          <div class="sig-state" id="score" style="margin-top:14px"></div>`);
        const draw = () => {
          w.querySelector("#items").innerHTML = ITEMS.map((it, i) => `
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 11px;border:1px solid var(--line);border-radius:11px;background:var(--surface-2)">
              <span style="flex:1;min-width:110px;font-size:13px;font-weight:500">${it.t}</span>
              ${Object.keys(LAB).map(k => `<button data-i="${i}" data-k="${k}" style="cursor:pointer;font-family:var(--sans);font-size:11px;padding:5px 9px;border-radius:8px;
                border:1px solid ${picks[i] === k ? (k === it.a ? "var(--green)" : "var(--red)") : "var(--line-2)"};
                background:${picks[i] === k ? (k === it.a ? "var(--green-soft)" : "var(--red-soft)") : "transparent"};
                color:var(--ink)">${LAB[k]}</button>`).join("")}
            </div>`).join("");
          const done = Object.keys(picks).length, right = ITEMS.filter((it, i) => picks[i] === it.a).length;
          const sc = w.querySelector("#score");
          sc.className = "sig-state " + (done === ITEMS.length ? (right === ITEMS.length ? "good" : "bad") : "");
          sc.innerHTML = done < ITEMS.length
            ? `${done} of ${ITEMS.length} sorted.`
            : right === ITEMS.length
              ? "<b>All six.</b> Exactly one of these, The DAO, was a failure on the chain, and even that was a bug in one contract, not in Ethereum itself. Everything else was a company or an economic design."
              : `<b>${right} of ${ITEMS.length}.</b> Look again at the ones in red: check whether the protocol did something it wasn't supposed to, or a human promised something they couldn't keep.`;
          w.querySelectorAll("button[data-i]").forEach(b => b.onclick = () => { picks[+b.dataset.i] = b.dataset.k; draw(); });
        };
        draw();
      } },
  );

  /* ---- mev: the sandwich needed the auction behind it ------------ */
  L.mev.beats.push(
    { n: "02", h: "The auction you never see", cap: "Sandwiching needs your transaction to land in exactly the right slot, so searchers bid for position. That bidding war happens in private, milliseconds before each block. Run it and see where the profit ends up.",
      build(s) {
        let searchers = 3;
        const w = card(s, "bidding for the right to sandwich you", `
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--ink-3)">searchers competing</span>
            <input type="range" min="1" max="12" value="3" id="n" style="flex:1;min-width:140px">
            <span class="mono" id="nv" style="font-size:12px">3</span>
          </div>
          <div id="out"></div>`);
        const draw = () => {
          const profit = 100;
          /* competition bids the profit away: the winner keeps a thinner and thinner slice */
          const keep = profit / (searchers + 1), toBlock = profit - keep;
          w.querySelector("#out").innerHTML = `
            <div class="kvs"><div class="k">value extracted from you</div><div class="v">$${profit}</div></div>
            <div class="kvs"><div class="k">kept by the winning searcher</div><div class="v">$${keep.toFixed(2)}</div></div>
            <div class="kvs"><div class="k">paid to the block producer as a bribe</div><div class="v vi">$${toBlock.toFixed(2)}</div></div>
            <div style="height:11px;border-radius:99px;overflow:hidden;display:flex;margin:14px 0 10px">
              <i style="height:100%;width:${keep}%;background:var(--gold)"></i>
              <i style="height:100%;width:${toBlock}%;background:var(--plum)"></i>
            </div>
            <p class="note" style="margin:0">${searchers < 3
              ? "With almost no competition the searcher keeps nearly everything. This is the early, lucrative era of MEV."
              : "As searchers pile in they bid against each other, and the profit flows through to whoever orders the block. Your loss does not shrink, it just moves from the searcher's pocket to the block producer's."}</p>`;
        };
        w.querySelector("#n").oninput = (e) => { searchers = +e.target.value; w.querySelector("#nv").textContent = searchers; draw(); };
        draw();
      } },
  );

  /* ---- difficulty: the retarget half of the old nonce lesson ----- */
  L.difficulty = {
    world: "mining", title: "The difficulty thermostat", oneliner: "Why blocks arrive every ten minutes, forever", icon: "◐",
    hero: "Miners join and leave constantly, and hashpower has grown by a factor of trillions since 2009, yet blocks still arrive about every ten minutes. Something holds that steady: a rule that re-checks the pace every 2016 blocks and adjusts.",
    beats: thermostat.concat([
      { n: "02", h: "Do the retarget yourself", cap: "Every 2016 blocks the network compares how long that batch <b>should</b> have taken with how long it actually took, and scales the difficulty by the ratio. That is the entire algorithm. Try it.",
        build(s) {
          let days = 14;
          const w = card(s, "2016 blocks, and the correction that follows", `
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
              <span style="font-size:12px;color:var(--ink-3);min-width:120px">that batch took</span>
              <input type="range" min="5" max="28" value="14" step="0.5" id="d" style="flex:1;min-width:150px">
              <span class="mono" id="dv" style="font-size:12px;min-width:64px;text-align:right">14 days</span>
            </div>
            <div id="out"></div>`);
          const draw = () => {
            const target = 14, ratio = target / days;
            /* Bitcoin clamps each retarget to a factor of 4 in either direction */
            const clamped = Math.max(0.25, Math.min(4, ratio));
            const pctChange = (clamped - 1) * 100;
            w.querySelector("#out").innerHTML = `
              <div class="kvs"><div class="k">target</div><div class="v">14 days (2016 × 10 min)</div></div>
              <div class="kvs"><div class="k">actual</div><div class="v">${days} days</div></div>
              <div class="kvs"><div class="k">so miners were</div><div class="v">${days < target ? "faster than expected" : days > target ? "slower than expected" : "exactly on time"}</div></div>
              <div class="kvs"><div class="k">difficulty changes by</div><div class="v vi">${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(1)}%</div></div>
              <p class="note" style="margin-top:12px">${days < target
                ? "Blocks came too fast, so the puzzle gets harder and the average slides back toward ten minutes."
                : days > target
                  ? "Blocks came too slowly, so the puzzle gets easier. This is what rescued the chain when China evicted half the world's miners in 2021: two painful weeks of slow blocks, then one large downward retarget brought it back to normal."
                  : "Perfectly on schedule. No change."}
                ${Math.abs(ratio - clamped) > 0.001 ? " <b>The adjustment is capped at 4× per retarget</b>, so this one is clamped." : ""}</p>`;
          };
          w.querySelector("#d").oninput = (e) => { days = +e.target.value; w.querySelector("#dv").textContent = days + " days"; draw(); };
          draw();
        } },
    ]),
    deeper: P("The thermostat makes the ten-minute target a <b>property of the protocol</b>, not of the hardware underneath it. It also quietly sets the security budget: difficulty rises until mining costs roughly match mining rewards, so the electricity burned defending the chain scales with the block reward. That is why the long-run security question for Bitcoin is really a question about fees: once the subsidy halves away to nothing, fees alone have to fund the network's security."),
  };

  /* ---- wallets: lost its opening beat to `seed`, gains a better one */
  L.wallets.beats.unshift({
    n: "01", h: "Hot, cold, and the space between", cap: "\"Wallet\" covers five quite different things, and the only real variable is how far your key sits from the internet. Every step toward safety costs convenience, and none of the five options give you both.",
    build(s) {
      const KINDS = [
        { t: "Exchange account", key: "Someone else's", risk: 5, use: 5, d: "You don't hold a key at all: you hold an IOU from a company, the same arrangement Mt. Gox and FTX customers had." },
        { t: "Phone wallet", key: "On an internet-connected device", risk: 3, use: 5, d: "Genuinely yours, but reachable by any malware that gets onto the phone. Fine for spending money." },
        { t: "Hardware wallet", key: "On a chip that never sees the internet", risk: 2, use: 3, d: "The key signs inside the device and never leaves it. A compromised computer can show you a bad address, so you confirm on the device's own screen." },
        { t: "Multisig", key: "Split across 2 or 3 devices", risk: 1, use: 2, d: "Two of three keys are needed to move anything. One stolen key is not enough, and one lost key is not fatal. This is how institutions hold coins." },
        { t: "Paper, offline", key: "Written down, in a safe", risk: 2, use: 1, d: "Unhackable and inconvenient. To spend, you have to bring it back online, which is the moment of maximum risk." },
      ];
      const dots = (n, col) => `<span style="display:inline-flex;gap:3px;vertical-align:middle">${Array.from({ length: 5 }, (_, i) =>
        `<i style="width:8px;height:8px;border-radius:50%;background:${i < n ? col : "var(--surface-3)"}"></i>`).join("")}</span>`;
      const w = card(s, "five wallets, one trade-off", `<div id="k" style="display:grid;gap:10px"></div>`);
      w.querySelector("#k").innerHTML = KINDS.map(k => `
        <div style="border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--surface-2)">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline">
            <span style="font-weight:600;font-size:14px">${k.t}</span>
            <span class="mono" style="font-size:11px;color:var(--ink-4)">key: ${k.key}</span>
          </div>
          <div style="display:flex;gap:18px;margin:8px 0;font-size:11px;color:var(--ink-3)">
            <span>risk ${dots(k.risk, "var(--red)")}</span><span>convenience ${dots(k.use, "var(--green)")}</span>
          </div>
          <p class="note" style="margin:0;font-size:12.5px">${k.d}</p>
        </div>`).join("");
    } });

  /* ============================================================
     4. RENUMBER — beats moved around, so the "01/02/03" labels
        in the margin need to match their new positions.
     ============================================================ */
  Object.keys(L).forEach(id => {
    const l = L[id];
    if (!l || !Array.isArray(l.beats)) return;
    l.beats.forEach((b, i) => { b.n = String(i + 1).padStart(2, "0"); });
  });
})();
