/* Small, local-only campus navigation. No student tracking or network requests. */
(function () {
  'use strict';
  const POSITION_KEY = 'playground-position-v1';
  const MOTION_KEY = 'playground-motion-v1';
  const SEEN_KEY = 'playground-seen-v1';
  const WIDTH = 1000, HEIGHT = 620, SPEED = 210;
  let root, map, avatar, panel, enterButton, help, motionButton, domains;
  let x = 500, y = 340, frame = 0, previous = 0, near = null, opener = null;
  let reduced = false, systemMotion, observer;
  const keys = new Set();
  const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  function read(key) { try { return sessionStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { sessionStorage.setItem(key, value); } catch (_) { /* Private mode still supports navigation. */ } }
  function allowed() {
    return !(typeof isAssessmentLocked === 'function' && isAssessmentLocked()) &&
      !(typeof teacherSessionPending !== 'undefined' && teacherSessionPending);
  }
  function visible() { return root && !root.classList.contains('hidden') && !document.hidden; }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(className, text, action) {
    const node = element('button', className, text); node.type = 'button';
    node.addEventListener('click', action); return node;
  }
  function stop() {
    keys.clear();
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previous = 0;
    avatar?.classList.remove('is-walking');
    if (map) write(POSITION_KEY, JSON.stringify({ x, y }));
  }
  function leave() {
    stop();
    if (panel?.open) panel.close();
  }
  // Buildings are solid; the wide plaza and paths remain freely walkable.
  function walkable(nx, ny) {
    return nx >= 34 && nx <= WIDTH - 34 && ny >= 65 && ny <= HEIGHT - 24 &&
      !domains.some(d => nx > d.x - 77 && nx < d.x + 77 && ny > d.y - 63 && ny < d.y + 42);
  }
  function update() {
    avatar.style.left = (x / WIDTH * 100) + '%';
    avatar.style.top = (y / HEIGHT * 100) + '%';
    avatar.dataset.x = String(Math.round(x)); avatar.dataset.y = String(Math.round(y));
    let closest = null, distance = 70;
    for (const d of domains) {
      const current = Math.hypot(x - d.x, y - (d.y + 70));
      if (current < distance) { distance = current; closest = d; }
    }
    if (near?.id !== closest?.id) {
      near = closest;
      root.querySelectorAll('.pg-building').forEach(b => b.classList.toggle('is-near', b.dataset.domain === near?.id));
      enterButton.disabled = !near;
      enterButton.textContent = near ? near.place + ' 들어가기 ↵' : '건물 앞으로 이동해 보세요';
      help.textContent = near ? near.place + ' 앞이에요. Enter로 들어갈 수 있어요.' : '방향키로 이동 · Enter로 입장 · 건물을 눌러도 바로 들어가요';
    }
  }
  function tick(time) {
    frame = 0;
    if (!visible() || !allowed() || panel.open || document.activeElement !== map || keys.size === 0) { stop(); return; }
    const dt = previous ? Math.min((time - previous) / 1000, 0.035) : 1 / 60;
    previous = time;
    let dx = 0, dy = 0;
    keys.forEach(key => { dx += arrows[key][0]; dy += arrows[key][1]; });
    const length = Math.hypot(dx, dy);
    if (length) {
      dx = dx / length * SPEED * dt; dy = dy / length * SPEED * dt;
      if (walkable(x + dx, y)) x += dx;
      if (walkable(x, y + dy)) y += dy;
      if (dx !== 0) avatar.classList.toggle('face-left', dx < 0);
    }
    avatar.classList.toggle('is-walking', length > 0 && !reduced);
    update();
    frame = requestAnimationFrame(tick);
  }
  function setMotion(value, persist) {
    // Device accessibility settings take precedence over decorative animation.
    reduced = value || systemMotion.matches;
    root.classList.toggle('pg-reduced-motion', reduced);
    panel.classList.toggle('pg-reduced-motion', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.disabled = systemMotion.matches;
    motionButton.textContent = systemMotion.matches ? '기기 설정: 움직임 줄이기' : reduced ? '움직임 줄이기 켜짐' : '움직임 줄이기';
    if (reduced) avatar.classList.remove('is-walking');
    if (persist) write(MOTION_KEY, value ? 'reduce' : 'normal');
  }
  function openDomain(id, source) {
    if (!visible() || !allowed()) return;
    const domain = domains.find(d => d.id === id);
    if (!domain) return;
    stop(); opener = source || map;
    panel.replaceChildren();
    const heading = element('div', 'pg-panel-heading');
    const titles = element('div');
    titles.append(element('p', 'pg-eyebrow', domain.name));
    const title = element('h2', '', domain.place); title.id = 'pg-panel-title'; titles.append(title);
    heading.append(titles, button('pg-panel-close', '닫기 ×', () => panel.close()));
    panel.append(heading, element('p', 'pg-panel-description', domain.description));
    const question = element('div', 'pg-question');
    question.append(element('span', '', '함께 생각해 볼까요?'), element('p', '', domain.question));
    panel.append(question);
    if (domain.activities.length) {
      panel.append(element('h3', 'pg-section-label', '지금 시작할 수 있는 활동'));
      const activities = element('div', 'pg-activity-links');
      domain.activities.forEach(activity => {
        const meta = typeof UNIT_META !== 'undefined' ? UNIT_META[activity.unitId] : null;
        if (!meta) return;
        const launch = button('', '', () => {
          if (!allowed()) return;
          panel.close();
          switchUnit(activity.unitId);
          const titleNode = document.getElementById('overview-title');
          if (titleNode) { titleNode.tabIndex = -1; titleNode.focus({ preventScroll: true }); }
        });
        launch.dataset.activity = activity.unitId;
        launch.append(element('strong', '', meta.name), element('span', '', meta.description), element('small', '', '활동 시작 →'));
        activities.append(launch);
      });
      panel.append(activities);
    }
    panel.append(element('h3', 'pg-section-label', '이곳에서 배울 내용'));
    const topics = element('div', 'pg-topic-list');
    domain.topics.forEach((topic, index) => {
      const details = element('details');
      if (index === 0 && !domain.activities.length) details.open = true;
      const summary = element('summary', '', topic.title);
      const copy = element('div', 'pg-topic-copy');
      copy.append(element('p', '', topic.description), element('p', 'pg-topic-question', topic.question));
      details.append(summary, copy); topics.append(details);
    });
    panel.append(topics);
    panel.append(element('p', 'pg-panel-footer', domain.activities.length ?
      '위의 세 활동에서 퀴즈와 실습을 해 볼 수 있어요. 나머지 주제의 실습은 준비 중이에요.' :
      '지금은 주제를 살펴볼 수 있어요. 퀴즈와 실습은 준비 중이에요.'));
    panel.dataset.domain = domain.id;
    if (!panel.open) panel.showModal();
    panel.scrollTop = 0;
  }
  function init() {
    root = document.getElementById('view-roadmap');
    domains = window.PLAYGROUND_CURRICULUM;
    if (!root || !Array.isArray(domains) || domains.length !== 5) return;
    const art = window.PlaygroundArt;
    const shell = element('section', 'pg-map-shell');
    shell.setAttribute('aria-label', '다섯 수업 건물이 있는 정보 놀이터');
    map = element('div', 'pg-map'); map.id = 'playground-map'; map.tabIndex = 0;
    map.setAttribute('role', 'group');
    map.setAttribute('aria-label', '정보 놀이터 지도. 방향키로 이동하고 Enter로 입장합니다. Tab으로 건물을 바로 선택할 수도 있습니다.');
    map.setAttribute('aria-describedby', 'pg-help');
    const background = element('div', 'pg-map-art');
    background.setAttribute('aria-hidden', 'true');
    if (art) background.innerHTML = art.map();
    map.append(background);
    const buildings = element('div', 'pg-buildings');
    domains.forEach(d => {
      const building = button('pg-building', '', event => openDomain(d.id, event.currentTarget));
      building.dataset.domain = d.id;
      building.style.left = (d.x / WIDTH * 100) + '%';
      building.style.top = (d.y / HEIGHT * 100) + '%';
      building.setAttribute('aria-label', d.place + ' · ' + d.name + ' 들어가기');
      const drawing = element('span', 'pg-building-art'); drawing.setAttribute('aria-hidden', 'true');
      if (art) drawing.innerHTML = art.building(d.id);
      const label = element('span', 'pg-building-label');
      label.append(element('strong', '', d.place), element('span', '', d.name));
      building.append(drawing, label); buildings.append(building);
    });
    map.append(buildings);
    avatar = element('div', 'pg-avatar'); avatar.setAttribute('aria-hidden', 'true');
    if (art) avatar.innerHTML = art.avatar();
    map.append(avatar);
    const welcome = element('span', 'pg-welcome', '오늘은 어떤 발견을 해 볼까?');
    welcome.setAttribute('aria-hidden', 'true'); map.append(welcome);
    shell.append(map);
    const toolbar = element('div', 'pg-map-toolbar');
    help = element('p', 'pg-help', '방향키로 이동 · Enter로 입장 · 건물을 눌러도 바로 들어가요');
    help.id = 'pg-help'; help.setAttribute('role', 'status');
    enterButton = button('pg-enter', '건물 앞으로 이동해 보세요', () => { if (near) openDomain(near.id, map); });
    enterButton.disabled = true;
    motionButton = button('pg-motion', '움직임 줄이기', () => setMotion(!reduced, true));
    toolbar.append(help, enterButton, motionButton); shell.append(toolbar);
    const shortcuts = element('nav', 'pg-shortcuts'); shortcuts.setAttribute('aria-label', '수업 바로 고르기');
    domains.forEach(d => shortcuts.append(button('', d.name + ' →', event => openDomain(d.id, event.currentTarget))));
    const mount = document.getElementById('playground-mount');
    mount.replaceChildren(shell, shortcuts);
    panel = element('dialog', 'pg-panel'); panel.id = 'playground-panel';
    panel.setAttribute('aria-labelledby', 'pg-panel-title');
    document.body.append(panel);
    panel.addEventListener('close', () => {
      stop();
      if (visible() && opener?.isConnected) opener.focus({ preventScroll: true });
    });
    panel.addEventListener('click', event => {
      const bounds = panel.getBoundingClientRect();
      if (event.target === panel && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) panel.close();
    });
    try {
      const saved = JSON.parse(read(POSITION_KEY));
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) && walkable(saved.x, saved.y)) { x = saved.x; y = saved.y; }
    } catch (_) { /* A stale position does not block entry. */ }
    systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
    setMotion(read(MOTION_KEY) ? read(MOTION_KEY) === 'reduce' : systemMotion.matches, false);
    systemMotion.addEventListener('change', () => setMotion(read(MOTION_KEY) === 'reduce', false));
    root.classList.toggle('pg-intro', !read(SEEN_KEY)); write(SEEN_KEY, '1');
    // Remove the entrance class so returning from a lesson cannot replay it.
    setTimeout(() => root.classList.remove('pg-intro'), 650);
    map.addEventListener('pointerdown', event => {
      if (!event.target.closest('button')) map.focus({ preventScroll: true });
    });
    map.addEventListener('keydown', event => {
      if (event.target !== map || !allowed() || panel.open || event.altKey || event.ctrlKey || event.metaKey) return;
      if (arrows[event.key]) {
        event.preventDefault(); keys.add(event.key);
        if (!frame) tick(performance.now());
      } else if (event.key === 'Enter' && near) {
        event.preventDefault(); openDomain(near.id, map);
      }
    });
    window.addEventListener('keyup', event => {
      if (!arrows[event.key]) return;
      keys.delete(event.key); if (!keys.size) stop();
    });
    map.addEventListener('blur', stop);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    observer = new MutationObserver(() => { if (!visible()) leave(); });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    update();
    document.getElementById('playground-fallback')?.remove();
    // The header, login or an assessment can take focus first; never steal it.
    requestAnimationFrame(() => {
      if (visible() && allowed() && document.activeElement === document.body) map.focus({ preventScroll: true });
    });
  }
  window.playground = Object.freeze({ openDomain, leave });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
