(function (root) {
  'use strict';
  let mode = null, selectedClass = null, submitted = false;
  const started = new Set();
  const names = ['문제 추상화', '알고리즘 설계', '순서도 연구소'];
  function blocked() {
    return (typeof isAssessmentLocked === 'function' && isAssessmentLocked()) ||
      (typeof teacherSessionPending !== 'undefined' && teacherSessionPending);
  }
  function view() {
    let el = document.getElementById('view-demo');
    if (!el) {
      el = document.createElement('main'); el.id = 'view-demo'; el.className = 'demo-classroom hidden';
      document.getElementById('view-roadmap').insertAdjacentElement('afterend', el);
    }
    return el;
  }
  function shell(title) {
    return '<div class="demo-notice"><strong>발표용 체험 · 샘플 데이터</strong><span>실제 로그인이나 저장 없이 화면을 둘러봅니다.</span></div>' +
      '<div class="demo-heading"><div><p>정보 놀이터 클래스룸</p><h1 tabindex="-1">' + title + '</h1></div><button type="button" data-demo="exit">체험 끝내기</button></div>' +
      '<div class="demo-role"><button type="button" data-demo="student" aria-pressed="' + (mode === 'student') + '">학생 체험</button><button type="button" data-demo="teacher" aria-pressed="' + (mode === 'teacher') + '">교사 체험</button></div>';
  }
  function records() {
    return '<div class="demo-records">' + names.map((name, i) => '<details><summary><span>' + name + '</span><small>제출 완료 · 예시</small></summary><p>' + [
      '현재 상태: 준비물을 자주 잊어요. 목표 상태: 빠짐없이 챙겨요. 필요한 정보: 시간표와 준비물 목록.',
      '명령어 레시피: 빵 놓기 → 치즈 올리기 → 빵 덮기. 순서를 바꾸며 결과를 확인했어요.',
      '순서도: 시작 → 준비물 확인 → 빠진 것이 있나요? → 챙기기 → 종료.'
    ][i] + '</p></details>').join('') + '</div>';
  }
  function render(focus = true) {
    const el = view();
    let html = shell(mode === 'teacher' ? '우리 반 클래스룸' : '내 클래스룸');
    if (mode === 'student') {
      html += '<p class="demo-description">체험 학생의 학습 기록과 수행평가 제출 상태입니다.</p><section><h2>나의 기록</h2>' + records() + '</section>' +
        '<section><h2>수행평가</h2><div class="demo-assessment"><div><h3>알고리즘 수행평가 · 예시</h3><p>' + (submitted ? '제출 완료 · 체험 화면에서만 반영됩니다.' : '문제 한 개를 풀며 제출 흐름을 체험해 보세요.') + '</p></div>' +
        '<button type="button" data-demo="assessment"' + (submitted ? ' disabled' : '') + '>' + (submitted ? '제출 완료' : '수행평가 체험') + '</button></div><div id="demo-assessment-form"></div></section>';
    } else if (!selectedClass) {
      html += '<p class="demo-description">학급을 선택하면 학생별 기록과 평가 실시 화면을 볼 수 있습니다. 모든 이름과 기록은 가상 예시입니다.</p><div class="demo-classes">' +
        Array.from({ length: 11 }, (_, i) => '<button type="button" data-demo="class" data-class="' + (i + 1) + '"><strong>2학년 ' + (i + 1) + '반</strong><span>학생 28명 · 샘플</span></button>').join('') + '</div>';
    } else {
      html += '<button type="button" data-demo="classes">← 전체 학급</button><section><div class="demo-heading"><h2>2학년 ' + selectedClass + '반</h2><button type="button" data-demo="start"' + (started.has(selectedClass) ? ' disabled' : '') + '>' + (started.has(selectedClass) ? '시연 진행 중' : '수행평가 시연 시작') + '</button></div>' +
        '<p role="status">' + (started.has(selectedClass) ? '샘플 평가를 시작했습니다. 실제 학급에는 영향을 주지 않습니다.' : '학생을 펼치면 샘플 학습 기록을 확인할 수 있습니다.') + '</p><div class="demo-students">' +
        Array.from({ length: 28 }, (_, i) => '<details><summary><span>' + (i + 1) + '번 · 체험 학생 ' + String(i + 1).padStart(2, '0') + '</span><small>' + (i < 21 ? '기록 3개' : '기록 없음') + ' · 예시</small></summary>' + (i < 21 ? records() : '<p>아직 제출한 기록이 없는 경우의 예시입니다.</p>') + '</details>').join('') + '</div></section>';
    }
    el.innerHTML = html; el.classList.remove('hidden');
    el.onclick = event => {
      const button = event.target.closest('[data-demo]'); if (!button || blocked()) return;
      const action = button.dataset.demo;
      if (action === 'exit') { mode = null; selectedClass = null; submitted = false; started.clear(); el.classList.add('hidden'); switchUnit('roadmap'); return; }
      if (action === 'student' || action === 'teacher') { mode = action; selectedClass = null; render(); }
      if (action === 'class') { selectedClass = Number(button.dataset.class); render(); }
      if (action === 'classes') { selectedClass = null; render(); }
      if (action === 'start') { started.add(selectedClass); render(false); }
      if (action === 'assessment') {
        document.getElementById('demo-assessment-form').innerHTML = '<form class="demo-question"><h3>샘플 문제</h3><p>같은 동작을 여러 번 실행할 때 사용하는 구조는 무엇일까요?</p><label><input required type="radio" name="answer" value="sequence"> 순차 구조</label><label><input required type="radio" name="answer" value="repeat"> 반복 구조</label><label><input required type="radio" name="answer" value="select"> 선택 구조</label><p>체험용 문제입니다. 정답·점수는 공개하지 않으며 서버에 저장하지 않습니다.</p><button type="submit">샘플 답안 제출</button></form>';
        document.querySelector('#demo-assessment-form form').onsubmit = event => { event.preventDefault(); if (blocked()) return; submitted = true; render(false); };
        document.querySelector('#demo-assessment-form input').focus();
      }
    };
    if (focus) el.querySelector('h1').focus({ preventScroll: true });
  }
  function open(role) {
    if (blocked()) return;
    if (root.learningUI) { root.learningUI.intent = null; root.learningUI.generation++; root.learningUI.teacherGeneration++; }
    document.getElementById('login-dialog')?.close();
    root.classroomPortal?.stop();
    if (typeof stopLiveEvalDashboard === 'function') stopLiveEvalDashboard();
    if (typeof disableStudioMode === 'function') disableStudioMode();
    hideMainViews(); closeMegaMenu(); document.body.classList.remove('reading-mode');
    mode = role === 'teacher' ? 'teacher' : 'student'; selectedClass = null; render(); window.scrollTo(0, 0);
  }
  root.demoClassroom = {
    open,
    attachLogin(dialog) {
      if (dialog.querySelector('.demo-login-entry')) return;
      const entry = document.createElement('section'); entry.className = 'demo-login-entry';
      entry.innerHTML = '<h3>계정 없이 발표용 화면 둘러보기</h3><p>샘플 데이터로 학생과 교사 화면을 체험합니다.</p><div><button type="button" data-role="student">학생 체험</button><button type="button" data-role="teacher">교사 체험</button></div>';
      entry.querySelectorAll('button').forEach(button => { button.onclick = () => open(button.dataset.role); }); dialog.append(entry);
    }
  };
}(window));
