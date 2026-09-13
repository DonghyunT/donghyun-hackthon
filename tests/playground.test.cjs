const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('robot sprite keeps standard and Chrome-compatible directional masks', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'playground.css'), 'utf8');
  for (const direction of ['down', 'left', 'right', 'up']) {
    const rule = css.match(new RegExp(`\\.pg-avatar\\[data-direction=${direction}\\] \\.pg-robot-sprite\\{([^}]*)\\}`))?.[1] || '';
    assert.match(rule, new RegExp(`mask-image:url\\(assets/robot-mask-${direction}\\.svg\\)`));
    assert.match(rule, new RegExp(`-webkit-mask-image:url\\(assets/robot-mask-${direction}\\.svg\\)`));
  }
  assert.match(css, /\.pg-avatar \.pg-robot-sprite\{[^}]*-webkit-mask-size:100% 100%;[^}]*-webkit-mask-repeat:no-repeat;/);
});

// Lightweight DOM harness: run the real controller and exercise user events,
// without browser screenshots, Firebase, or copying its movement calculation.
function campus(saved = {}, options = {}) {
  const handlers = new Map(), frames = new Map(), observers = [], timers = [];
  const storage = new Map(Object.entries(saved));
  let sequence = 0, now = 100, locked = false, pending = false;
  const document = { hidden: false, readyState: 'complete' };
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.dataset = {};
      this.events = {}; this.attributes = {}; this.open = false; this.textContent = ''; this.isConnected = true;
      const classes = new Set();
      this.classList = {
        contains: c => classes.has(c), add: (...cs) => cs.forEach(c => classes.add(c)),
        remove: (...cs) => cs.forEach(c => classes.delete(c)),
        toggle: (c, force = !classes.has(c)) => { force ? classes.add(c) : classes.delete(c); return force; }
      };
      Object.defineProperty(this, 'className', { set: v => v.split(/\s+/).filter(Boolean).forEach(c => classes.add(c)) });
    }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(k, v) { this.attributes[k] = v; }
    addEventListener(k, fn) { (this.events[k] ||= []).push(fn); }
    dispatch(k, e = {}) { e.target ||= this; e.currentTarget = this; (this.events[k] || []).forEach(fn => fn(e)); }
    focus() { const old = document.activeElement; document.activeElement = this; if (old && old !== this) old.dispatch('blur'); }
    querySelectorAll(selector) { return descend(this).filter(n => n.classList.contains(selector.slice(1))); }
    showModal() { this.open = true; this.focus(); }
    close() { this.open = false; this.dispatch('close'); }
    remove() { this.isConnected = false; }
  }
  function descend(node) { return node.children.flatMap(child => [child, ...descend(child)]); }
  const body = new Element('body'), root = new Element('main'), mount = new Element('div'), fallback = new Element('nav'), course = new Element('main');
  root.id = 'view-roadmap'; mount.id = 'playground-mount'; fallback.id = 'playground-fallback';
  course.id = 'view-course'; course.classList.add('hidden');
  root.append(mount, fallback); body.append(root, course); document.body = body; document.activeElement = body;
  document.createElement = tag => new Element(tag);
  document.getElementById = id => [body, ...descend(body)].find(n => n.id === id);
  document.addEventListener = (name, fn) => { handlers.set('document:' + name, fn); };
  const media = { matches: !!options.systemReduced, addEventListener(name, fn) { this.listener = fn; } };
  const context = {
    window: null, document, sessionStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    performance: { now: () => now }, requestAnimationFrame: fn => { frames.set(++sequence, fn); return sequence; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} },
    matchMedia: () => media,
    isAssessmentLocked: () => locked,
    UNIT_META: Object.fromEntries(['unit1', 'unit2', 'unit3'].map(id => [id, { name: id, description: id }])),
    hideMainViews: () => { context.playground.leave(); root.classList.add('hidden'); course.classList.add('hidden'); },
    updateActiveNavigation: () => {}, disableStudioMode: () => {}, scrollTo: () => {}, closeMegaMenu: () => {},
    switchUnit: id => { if (locked || pending) return; context.lastUnit = id; context.hideMainViews(); if (id === 'roadmap') root.classList.remove('hidden'); },
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}
  };
  Object.defineProperty(context, 'teacherSessionPending', { get: () => pending });
  context.window = context;
  context.addEventListener = (name, fn) => { handlers.set('window:' + name, fn); };
  vm.createContext(context);
  for (const file of ['js/data/curriculum.js', 'js/core/playground.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  function advance(count = 1) { for (let i = 0; i < count; i++) { now += 1000 / 60; const queue = [...frames.values()]; frames.clear(); queue.forEach(fn => fn(now)); } }
  advance();
  const map = document.getElementById('playground-map');
  const avatar = root.querySelectorAll('.pg-avatar')[0];
  function key(name, target = map) { let prevented = false; map.dispatch('keydown', { key: name, target, preventDefault() { prevented = true; } }); return prevented; }
  function release(name) { handlers.get('window:keyup')({ key: name }); }
  function move(name, ticks) { map.focus(); key(name); advance(ticks); release(name); }
  return { context, root, map, course, avatar, storage, frames, advance, key, release, move,
    finishIntro: () => timers.forEach(fn => fn()),
    systemMotion: reduced => { media.matches = reduced; media.listener?.({ matches: reduced }); },
    element: tag => new Element(tag), fire: name => handlers.get(name)?.(),
    lock: value => { locked = value; }, pending: value => { pending = value; },
    hide: () => { root.classList.add('hidden'); observers.forEach(fn => fn()); },
    point: () => [Number(avatar.dataset.x), Number(avatar.dataset.y)] };
}

test('campus catalog has five unique domains, 25 topics, and only three existing activity routes', () => {
  const c = campus(), domains = c.context.PLAYGROUND_CURRICULUM;
  assert.equal(new Set(domains.map(d => d.id)).size, 5);
  assert.equal(domains.flatMap(d => d.topics).length, 25);
  assert.equal(domains.flatMap(d => d.activities).map(a => a.unitId).join(','), 'unit1,unit2,unit3');
  for (const d of domains) {
    c.context.playground.openDomain(d.id, c.map);
    assert.equal(c.course.classList.contains('hidden'), false); assert.equal(c.course.dataset.domain, d.id);
    assert.equal(c.course.querySelectorAll('.pg-topic-copy').length, d.topics.length);
    assert.equal(c.root.classList.contains('hidden'), true);
    c.context.switchUnit('roadmap');
  }
});

test('all five doors are reachable from the bottom entrance by arrows and Enter', () => {
  const routes = {
    algorithm: [['ArrowUp', 104]], computing: [['ArrowUp', 73], ['ArrowLeft', 70]], data: [['ArrowUp', 73], ['ArrowRight', 70]],
    ai: [['ArrowUp', 15], ['ArrowLeft', 60]], culture: [['ArrowUp', 15], ['ArrowRight', 60]]
  };
  for (const [id, route] of Object.entries(routes)) {
    const c = campus(); route.forEach(([key, ticks]) => c.move(key, ticks)); c.key('Enter');
    assert.equal(c.course.classList.contains('hidden'), false, `${id} opens at ${c.point()}`);
    assert.equal(c.course.dataset.domain, id); assert.equal(c.frames.size, 0);
  }
});

test('touch direction pad moves immediately, dismisses its cue, and stops on release', () => {
  const c = campus(), up = c.root.querySelectorAll('.dpad-up')[0];
  const hint = c.root.querySelectorAll('.pg-first-hint')[0];
  let prevented = false;
  up.dispatch('pointerdown', { pointerId: 1, preventDefault() { prevented = true; } });
  c.advance(5); up.dispatch('pointerup', { pointerId: 1 });
  assert.equal(prevented, true); assert.ok(c.point()[1] < 570);
  assert.equal(hint.isConnected, false); assert.equal(c.storage.get('playground-moved-v1'), '1');
  const stopped = c.point(); c.advance(10); assert.deepEqual(c.point(), stopped); assert.equal(c.frames.size, 0);
});

test('direction pad keyboard activation shares movement and respects assessment lock', () => {
  const c = campus(), right = c.root.querySelectorAll('.dpad-right')[0];
  right.dispatch('click', { detail: 0 }); assert.ok(c.point()[0] > 500);
  const moved = c.point(); c.lock(true); right.dispatch('click', { detail: 0 });
  assert.deepEqual(c.point(), moved);
});

test('direction pad pointer cancellation cannot leave movement running', () => {
  const c = campus(), left = c.root.querySelectorAll('.dpad-left')[0];
  left.dispatch('pointerdown', { pointerId: 2, preventDefault() {} }); c.advance(3);
  left.dispatch('pointercancel', { pointerId: 2 }); const cancelled = c.point();
  c.advance(10); assert.deepEqual(c.point(), cancelled); assert.equal(c.frames.size, 0);
});

test('building collisions and outer borders stop movement while release leaves no loop', () => {
  const c = campus(); c.move('ArrowUp', 200);
  assert.ok(c.point()[1] > 140 && c.point()[1] < 210, 'stops in front of algorithm building');
  c.move('ArrowDown', 110); c.move('ArrowLeft', 250); assert.ok(c.point()[0] >= 0 && c.point()[0] < 50, 'left boundary');
  assert.equal(c.frames.size, 0); assert.equal(c.avatar.classList.contains('is-walking'), false);
});

test('blur, hidden view, lock, and leave clear held keys and stop animation frames', () => {
  for (const action of [c => c.fire('window:blur'), c => c.hide(), c => { c.lock(true); c.advance(); }, c => c.context.playground.leave()]) {
    const c = campus(); c.key('ArrowRight'); c.advance(3); action(c); const position = c.point();
    c.advance(20); assert.deepEqual(c.point(), position); assert.equal(c.frames.size, 0);
    assert.equal(c.avatar.classList.contains('is-walking'), false);
  }
});

test('input keys and assessment or teacher locks cannot move or open a domain', () => {
  const c = campus(), input = c.element('input');
  assert.equal(c.key('ArrowRight', input), false); c.advance(10); assert.deepEqual(c.point(), [500, 580]);
  for (const lock of [c.lock, c.pending]) {
    lock(true); assert.equal(c.key('ArrowRight'), false); c.context.playground.openDomain('algorithm');
    assert.equal(c.course.classList.contains('hidden'), true); lock(false);
  }
});

test('position survives a new page controller, corrupt or solid-building positions fall back safely', () => {
  const c = campus(); c.move('ArrowRight', 20);
  const resumed = campus(Object.fromEntries(c.storage)); assert.deepEqual(resumed.point(), c.point());
  for (const raw of ['not-json', '{"x":500,"y":110}', '{"x":-999,"y":900}', '{"x":"500","y":580}']) {
    assert.deepEqual(campus({ 'playground-position-v2': raw }).point(), [500, 580]);
  }
});

test('reduced motion keeps direct navigation and movement but removes walking animation', () => {
  const c = campus({}, { systemReduced: true });
  assert.equal(c.root.classList.contains('pg-reduced-motion'), true);
  c.key('ArrowRight'); c.advance(10);
  assert.ok(c.point()[0] > 500); assert.equal(c.avatar.classList.contains('is-walking'), false);
  c.release('ArrowRight'); c.context.playground.openDomain('data'); assert.equal(c.course.classList.contains('hidden'), false);
});

test('OS motion reduction is automatic without an extra settings button', () => {
  const c = campus({ 'playground-motion-v1': 'normal' }, { systemReduced: true });
  assert.equal(c.root.querySelectorAll('.pg-motion').length, 0);
  assert.equal(c.root.classList.contains('pg-reduced-motion'), true);
  c.systemMotion(false);
  assert.equal(c.root.classList.contains('pg-reduced-motion'), false);
  c.systemMotion(true); assert.equal(c.root.classList.contains('pg-reduced-motion'), true);
});

test('first arrival animation class is removed after its brief introduction', () => {
  const c = campus(); assert.equal(c.root.classList.contains('pg-intro'), true);
  c.finishIntro(); assert.equal(c.root.classList.contains('pg-intro'), false);
  c.context.playground.leave(); assert.equal(c.root.classList.contains('pg-intro'), false);
  const resumed = campus(Object.fromEntries(c.storage)); assert.equal(resumed.root.classList.contains('pg-intro'), false);
});

test('full-page course returns to the same map position and keyboard focus', () => {
  const c = campus(); c.move('ArrowRight', 12); const position = c.point();
  c.context.playground.openDomain('data');
  assert.equal(c.course.classList.contains('hidden'), false);
  assert.equal(c.course.tagName, 'MAIN');
  const back = c.course.querySelectorAll('.pg-course-back')[0]; back.dispatch('click');
  assert.equal(c.root.classList.contains('hidden'), false);
  assert.equal(c.course.classList.contains('hidden'), true);
  assert.deepEqual(c.point(), position);
  c.key('ArrowRight'); c.advance(3); c.release('ArrowRight');
  assert.ok(c.point()[0] > position[0], 'returning immediately allows arrows again');
});

test('full-page activity actions use existing routes and obey locks', () => {
  for (const id of ['unit1', 'unit2', 'unit3']) {
    const c = campus(); c.context.playground.openDomain('algorithm');
    const action = c.course.querySelectorAll('.pg-activity-links')[0].children.find(n => n.dataset.activity === id);
    c.lock(true); action.dispatch('click'); assert.equal(c.context.lastUnit, undefined);
    c.lock(false); action.dispatch('click'); assert.equal(c.context.lastUnit, id);
    assert.equal(c.course.classList.contains('hidden'), true); assert.equal(c.frames.size, 0);
  }
  assert.deepEqual(campus({ 'playground-position-v1': '{"x":500,"y":340}' }).point(), [500, 580]);
});
