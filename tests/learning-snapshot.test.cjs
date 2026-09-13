const test = require('node:test');
const assert = require('node:assert');
const { buildAbstractionSnapshot } = require('../js/core/learning-snapshot.js');
const fs = require('node:fs');
const vm = require('node:vm');

function browserContext() {
  const context = vm.createContext({ console });
  vm.runInContext(`
    globalThis.window = globalThis;
    const UNIT_QUIZ_DATA = {abstraction: {questions: [{id: 1, options: ['A', 'B']}]}};
    let userQuizAnswers = {abstraction: {1: {choiceIdx: 1}}};
    let registeredConditions = ['조건'], currentPoolTags = ['남김', '버림'], currentTrashTags = ['버림'];
    let locked = false;
    function isAssessmentLocked() { return locked; }
  `, context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/core/learning-snapshot.js'), 'utf8'), context);
  return context;
}

test('captureAbstraction - 실제 페이지의 const/let 전역 상태 수집', () => {
  const context = browserContext();
  assert.strictEqual(context.UNIT_QUIZ_DATA, undefined);
  const snapshot = JSON.parse(JSON.stringify(context.learningSnapshot.captureAbstraction()));
  assert.deepStrictEqual(snapshot.quiz.answers, [{questionId: 1, choiceIndex: 1}]);
  assert.deepStrictEqual(snapshot.practice.conditions, ['조건']);
  assert.deepStrictEqual(snapshot.practice.keptInformation, ['남김']);
  assert.deepStrictEqual(snapshot.practice.discardedInformation, ['버림']);
});

test('captureAbstraction - 평가 전체 잠금과 실습 작업공간 잠금', () => {
  const context = browserContext();
  vm.runInContext('locked = true', context);
  assert.strictEqual(context.learningSnapshot.captureAbstraction(), null);
  vm.runInContext('locked = false; window.assessmentWorkspace = {active: true}', context);
  assert.strictEqual(context.learningSnapshot.captureAbstraction(), null);
});

test('buildAbstractionSnapshot - 미응답, 부분 실습 보존', (t) => {
  const input = {
    quizQuestions: [{ id: 1, options: ['A', 'B'] }, { id: 2, options: ['C', 'D'] }],
    quizAnswers: { 1: { choiceIdx: 0 } },
    practiceCurrentState: "현재 상태 입력값",
    practiceGoalState: "",
    practiceConditions: ["조건1"],
    practiceConditionDraft: "작성 중인 조건",
    practicePoolTags: ["정보1", "정보2"],
    practiceTrashTags: []
  };

  const snapshot = buildAbstractionSnapshot(input);

  assert.strictEqual(snapshot.unitKey, "abstraction");
  assert.deepStrictEqual(snapshot.quiz.answers, [
    { questionId: 1, choiceIndex: 0 },
    { questionId: 2, choiceIndex: null }
  ]);
  assert.strictEqual(snapshot.practice.currentState, "현재 상태 입력값");
  assert.strictEqual(snapshot.practice.goalState, "");
  assert.deepStrictEqual(snapshot.practice.conditions, ["조건1"]);
  assert.strictEqual(snapshot.practice.conditionDraft, "작성 중인 조건");
  assert.deepStrictEqual(snapshot.practice.keptInformation, ["정보1", "정보2"]);
  assert.deepStrictEqual(snapshot.practice.discardedInformation, []);
});

test('buildAbstractionSnapshot - 선택 답안과 버린 정보 분리 및 잘못된 입력 처리', (t) => {
  const input = {
    quizQuestions: [{ id: 1, options: ['A', 'B'] }, { id: 2, options: ['C', 'D'] }, { id: 3, options: ['E'] }],
    quizAnswers: {
      1: { choiceIdx: -1 }, // 유효하지 않음
      2: { choiceIdx: 2 }, // 보기 범위를 벗어남
      3: { choiceIdx: "0" } // 타입 오류
    },
    practicePoolTags: ["정보1", "정보2", "정보3"],
    practiceTrashTags: ["정보2"]
  };

  const snapshot = buildAbstractionSnapshot(input);

  assert.deepStrictEqual(snapshot.quiz.answers, [
    { questionId: 1, choiceIndex: null },
    { questionId: 2, choiceIndex: null },
    { questionId: 3, choiceIndex: null }
  ]);

  assert.deepStrictEqual(snapshot.practice.keptInformation, ["정보1", "정보3"]);
  assert.deepStrictEqual(snapshot.practice.discardedInformation, ["정보2"]);
});

test('buildAbstractionSnapshot - 원본 수정 뒤 스냅샷 불변', (t) => {
  const originalConditions = ["조건1"];
  const originalTrash = ["버린 정보"];

  const input = {
    practiceConditions: originalConditions,
    practiceTrashTags: originalTrash
  };

  const snapshot = buildAbstractionSnapshot(input);

  // 원본 수정
  originalConditions.push("조건2");
  originalTrash.push("버린 정보2");

  // 스냅샷은 불변해야 함
  assert.deepStrictEqual(snapshot.practice.conditions, ["조건1"]);
  assert.deepStrictEqual(snapshot.practice.discardedInformation, ["버린 정보"]);
});
