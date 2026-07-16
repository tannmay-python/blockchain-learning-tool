const fs = require('fs');

global.window = {};
global.document = {
  documentElement: { dataset: {} },
  getElementById: (id) => {
    if (id === 'starfield') return { getContext: () => ({ setTransform:()=>{}, clearRect:()=>{}, fillStyle:'', beginPath:()=>{}, arc:()=>{}, fill:()=>{} }), width: 0, height: 0 };
    return { innerHTML: '', classList: { add:()=>{}, remove:()=>{} }, offsetWidth: 0, querySelectorAll: () => ({ forEach: () => {} }) };
  },
  querySelectorAll: () => ({ forEach: () => {} }),
  createElement: () => ({}),
  addEventListener: () => {},
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.location = { hash: '#/chapter/foundations' };
global.matchMedia = () => ({ matches: false });
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.innerWidth = 1000;
global.innerHeight = 1000;
global.devicePixelRatio = 2;
global.requestAnimationFrame = () => {};

eval(fs.readFileSync('js/store.js', 'utf8'));
eval(fs.readFileSync('js/views.js', 'utf8'));
eval(fs.readFileSync('js/lessons.js', 'utf8'));
eval(fs.readFileSync('js/lessons-extra.js', 'utf8'));
eval(fs.readFileSync('js/app.js', 'utf8'));

// Try rendering chapterGate
try {
  window.VIEWS.chapterGate('foundations');
  console.log("SUCCESS");
} catch(e) {
  console.error("ERROR:", e);
}
