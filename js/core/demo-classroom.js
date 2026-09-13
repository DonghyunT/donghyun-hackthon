/* Server-issued Firebase guest identity; all actions use the real classroom screens. */
(function (root) {
  'use strict';
  let pending = false;
  function blocked() {
    return pending || (typeof isAssessmentLocked === 'function' && isAssessmentLocked()) ||
      (typeof teacherSessionPending !== 'undefined' && teacherSessionPending);
  }
  async function open(role) {
    if (blocked()) return;
    const dialog = document.getElementById('login-dialog');
    const entry = dialog?.querySelector('.demo-login-entry');
    const status = entry?.querySelector('[role="status"]');
    const buttons = entry?.querySelectorAll('button') || [];
    pending = true;
    buttons.forEach(button => { button.disabled = true; });
    if (status) status.textContent = '발표용 계정으로 로그인하고 있습니다…';
    try {
      await root.learningAuth.signInGuest(role);
      root.learningUI.intent = null;
      if (status) status.textContent = '';
      dialog?.close();
      root.classroomPortal?.stop();
      if (typeof stopLiveEvalDashboard === 'function') stopLiveEvalDashboard();
      await root.learningUI.refreshIdentity();
      await root.classroomPortal.open();
    } catch (error) {
      if (dialog?.open && status) status.textContent = error.message || '게스트 로그인에 실패했습니다. 다시 시도해 주세요.';
      else root.learningUI?.status(error.message || '클래스룸을 불러오지 못했습니다.', true);
    } finally {
      pending = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  }
  root.demoClassroom = {
    open,
    attachLogin(dialog) {
      if (dialog.querySelector('.demo-login-entry')) return;
      const entry = document.createElement('section'); entry.className = 'demo-login-entry';
      entry.innerHTML = '<h3>발표용 게스트 로그인</h3><p>발표용 학급에서 실제 수업·기록·평가 기능을 사용합니다. 공동 계정에 저장되므로 이름 등 개인정보는 입력하지 마세요.</p><div><button type="button" data-role="student">학생 게스트 로그인</button><button type="button" data-role="teacher">교사 게스트 로그인</button></div><p role="status" aria-live="polite"></p>';
      entry.querySelectorAll('button').forEach(button => { button.onclick = () => open(button.dataset.role); });
      dialog.querySelector('.login-heading').insertAdjacentElement('afterend',entry);
    }
  };
}(window));
