const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('AI tutor button starts with an accessible closed state', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const button = html.match(/<button[^>]+id="tutor-fab-btn"[^>]*>/)?.[0] || '';
  assert.match(button, /aria-controls="tutor-chat-window"/);
  assert.match(button, /aria-expanded="false"/);
  assert.match(button, /aria-label="AI 튜터 열기"/);
});

test('AI tutor closed label is fully hidden until hover, focus, or open state', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'studio-ui.css'), 'utf8');
  assert.match(css, /\.chatbot-peek-tab\s*>\s*span\s*{[^}]*opacity:\s*0;[^}]*visibility:\s*hidden;/s);
  assert.match(css, /\.chatbot-peek-tab:hover\s*>\s*span,[\s\S]*\.chatbot-peek-tab:focus-visible\s*>\s*span,[\s\S]*\.chatbot-peek-tab\.chat-open\s*>\s*span\s*{[^}]*opacity:\s*1;[^}]*visibility:\s*visible;/s);
});

test('AI tutor toggle preserves its nodes and updates open and closed semantics', () => {
  const classes = new Set(['hidden']);
  const win = { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } };
  const icon = { className: 'fa-solid fa-comment-dots text-lg' };
  const text = { textContent: 'AI 튜터' };
  const attributes = {};
  const fabClasses = new Set();
  const fab = {
    setAttribute: (name, value) => { attributes[name] = value; },
    querySelector: selector => selector === 'i' ? icon : text,
    classList: { add: value => fabClasses.add(value), remove: value => fabClasses.delete(value) }
  };
  let focused = false;
  const input = { value: '', focus: () => { focused = true; } };
  const document = { getElementById: id => ({ 'tutor-chat-window': win, 'tutor-fab-btn': fab, 'tutor-input': input })[id] };
  const context = { document, callSolarAI: async () => '' };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/core/ai-tutor.js'), 'utf8'), context);

  context.toggleTutorChat();
  assert.equal(classes.has('hidden'), false); assert.equal(attributes['aria-expanded'], 'true');
  assert.equal(attributes['aria-label'], 'AI 튜터 닫기'); assert.equal(text.textContent, '닫기');
  assert.match(icon.className, /fa-xmark/); assert.equal(fabClasses.has('chat-open'), true); assert.equal(focused, true);

  context.toggleTutorChat();
  assert.equal(classes.has('hidden'), true); assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(attributes['aria-label'], 'AI 튜터 열기'); assert.equal(text.textContent, 'AI 튜터');
  assert.match(icon.className, /fa-comment-dots/); assert.equal(fabClasses.has('chat-open'), false);
});
