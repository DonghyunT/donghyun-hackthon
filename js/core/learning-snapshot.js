/**
 * 전달받은 값만으로 추상화 단원의 학습 스냅샷을 생성하는 순수 함수
 * @param {Object} input - 퀴즈 및 실습 데이터
 * @returns {Object} 스냅샷 객체
 */
function buildAbstractionSnapshot(input) {
  const {
    quizQuestions = [],
    quizAnswers = {},
    practiceCurrentState = "",
    practiceGoalState = "",
    practiceConditions = [],
    practiceConditionDraft = "",
    practicePoolTags = [],
    practiceTrashTags = []
  } = input;

  // 퀴즈 답안 배열 구성
  const answers = quizQuestions.map(q => {
    let choiceIndex = null;
    if (quizAnswers[q.id] && typeof quizAnswers[q.id].choiceIdx === 'number') {
      const idx = quizAnswers[q.id].choiceIdx;
      // 유효한 보기 번호인지 검사
      if (Number.isInteger(idx) && idx >= 0 && Array.isArray(q.options) && idx < q.options.length) {
        choiceIndex = idx;
      }
    }
    return {
      questionId: q.id,
      choiceIndex: choiceIndex
    };
  });

  // 실습 정보 태그 분류
  const keptInformation = practicePoolTags.filter(tag => !practiceTrashTags.includes(tag));
  const discardedInformation = [...practiceTrashTags];

  return {
    schemaVersion: 1,
    unitKey: "abstraction",
    activityId: "abstraction-core",
    contentVersion: "abstraction-v1", // 현재 문항 묶음을 가리킴
    quiz: {
      answers: answers
    },
    practice: {
      currentState: practiceCurrentState || "",
      goalState: practiceGoalState || "",
      conditions: [...practiceConditions],
      conditionDraft: practiceConditionDraft || "",
      keptInformation: keptInformation,
      discardedInformation: discardedInformation
    }
  };
}

/**
 * 현재 브라우저 상태를 읽어 buildAbstractionSnapshot 호출
 * @returns {Object|null} 스냅샷 객체
 */
function captureAbstraction() {
  // 수행평가 잠금 시 호출 거부
  if ((typeof isAssessmentLocked === 'function' && isAssessmentLocked()) ||
      (typeof window !== 'undefined' && window.assessmentWorkspace?.active)) {
    return null;
  }

  // 기존 스크립트의 const/let 전역은 window 속성이 아니므로 직접 참조한다.
  const quizQuestions = (typeof UNIT_QUIZ_DATA !== 'undefined' && UNIT_QUIZ_DATA.abstraction?.questions) || [];
  const quizAnswers = (typeof userQuizAnswers !== 'undefined' && userQuizAnswers.abstraction) || {};

  let practiceCurrentState = "";
  let practiceGoalState = "";
  let practiceConditionDraft = "";

  if (typeof document !== 'undefined') {
    const inpCurrent = document.getElementById('inp-current');
    const inpGoal = document.getElementById('inp-goal');
    const inpNewCondition = document.getElementById('inp-new-condition');

    if (inpCurrent) practiceCurrentState = inpCurrent.value;
    if (inpGoal) practiceGoalState = inpGoal.value;
    if (inpNewCondition) practiceConditionDraft = inpNewCondition.value;
  }

  const practiceConditions = (typeof registeredConditions !== 'undefined' && registeredConditions) || [];
  const practicePoolTags = (typeof currentPoolTags !== 'undefined' && currentPoolTags) || [];
  const practiceTrashTags = (typeof currentTrashTags !== 'undefined' && currentTrashTags) || [];

  return buildAbstractionSnapshot({
    quizQuestions,
    quizAnswers,
    practiceCurrentState,
    practiceGoalState,
    practiceConditions,
    practiceConditionDraft,
    practicePoolTags,
    practiceTrashTags
  });
}

// Node.js 환경 및 브라우저 환경 전역 노출
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildAbstractionSnapshot,
    captureAbstraction
  };
}
if (typeof window !== 'undefined') {
  window.learningSnapshot = {
    buildAbstractionSnapshot,
    captureAbstraction
  };
}
