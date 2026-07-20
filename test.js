/* test.js — no-framework checks, run with: node test.js
   1. SHA-256 against NIST test vectors (the README's claim, made real)
   2. Curriculum invariants: STORE.ORDER ↔ LESSONS stay in sync
   3. Smoke test: every chapter gate renders with the full production script stack */
const assert = require('assert');
const fs = require('fs');

/* ---- minimal DOM stubs ---- */
const ctx2d = () => ({ setTransform() {}, clearRect() {}, fillStyle: '', strokeStyle: '', lineWidth: 1, beginPath() {}, arc() {}, fill() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {}, moveTo() {}, lineTo() {}, stroke() {} });
const stubEl = () => ({ innerHTML: '', width: 0, height: 0, style: {}, offsetWidth: 0, dataset: {},
  classList: { add() {}, remove() {}, toggle() {} }, getContext: ctx2d,
  querySelector: () => null, querySelectorAll: () => ({ forEach() {} }),
  appendChild() {}, setAttribute() {}, addEventListener() {}, focus() {} });

global.window = {};
global.document = {
  documentElement: { dataset: {} },
  getElementById: () => stubEl(),
  querySelector: () => null,
  querySelectorAll: () => ({ forEach() {} }),
  createElement: stubEl,
  addEventListener() {},
  contains: () => false,
};
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.location = { hash: '#/chapter/foundations' };
global.matchMedia = () => ({ matches: false });
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.scrollTo = () => {};
global.innerWidth = 1000;
global.innerHeight = 1000;
global.devicePixelRatio = 2;
global.requestAnimationFrame = () => {};
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };

/* ---- load the production script stack, in index.html order ---- */
for (const f of ['sha256', 'store', 'lessons', 'lessons-extra', 'lessons-plus', 'views', 'app']) {
  eval(fs.readFileSync('js/' + f + '.js', 'utf8'));
}

let failures = 0;
const check = (name, fn) => { try { fn(); console.log('PASS  ' + name); } catch (e) { failures++; console.error('FAIL  ' + name + ' — ' + e.message); } };

/* ---- 1. SHA-256 NIST vectors ---- */
const sha256 = window.sha256;
check('sha256: empty string', () =>
  assert.strictEqual(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));
check('sha256: "abc"', () =>
  assert.strictEqual(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
check('sha256: two-block message', () =>
  assert.strictEqual(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'));
check('sha256: long input (padding path)', () =>
  assert.strictEqual(sha256('a'.repeat(1000)).length, 64));

/* ---- 2. curriculum invariants ---- */
const S = window.STORE, L = window.LESSONS;
check('every ORDER id has a lesson', () =>
  S.ORDER.forEach(id => assert(L[id], 'missing lesson: ' + id)));
check('every lesson is in ORDER', () =>
  Object.keys(L).forEach(id => assert(S.ORDER.includes(id), 'lesson not in curriculum: ' + id)));
check('every lesson has title, hero, ≥1 beat', () =>
  S.ORDER.forEach(id => { assert(L[id].title, id + ': no title'); assert(L[id].hero, id + ': no hero'); assert(Array.isArray(L[id].beats) && L[id].beats.length >= 1, id + ': no beats'); }));
check('every beat has a build function', () =>
  S.ORDER.forEach(id => L[id].beats.forEach((b, i) => assert(typeof b.build === 'function', id + ' beat ' + i + ': no build'))));

/* ---- 3. chapter gates render against the production stack ---- */
check('all chapter gates render', () =>
  S.WORLDS.forEach(w => window.VIEWS.chapterGate(w.id)));

if (failures) { console.error('\n' + failures + ' test(s) failed'); process.exit(1); }
console.log('\nALL TESTS PASS');
