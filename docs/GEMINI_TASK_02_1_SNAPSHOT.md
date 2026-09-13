# Gemini 작업 2-1 — 제출할 내용만 모으기

상태: 구현 지시서 · 작업 폴더: `D:\hack_thon`

## 목표

문제 추상화 단원의 현재 퀴즈 답안과 실습 입력을 하나의 독립된 데이터 객체로 모으는 함수를 구현한다. **이번 작업은 이 함수와 연결·검증까지만 한다.** 학생 로그인, Firebase 저장, 제출 버튼, 기록 화면, 교사 화면은 후속 작업이다.

현재 `codex/student-learning-records`의 미커밋 이름·홈 문구·문서 변경을 보존한다. `AGENTS.md`를 준수하고 `PRD.md` 9.5·9.6을 확인한다. 전체 설계 문서 `GEMINI_TASK_02_LEARNING_RECORDS.md`를 한 번에 구현하지 않는다.

## 읽을 코드

* `js/labs/lab-quiz.js`: `UNIT_QUIZ_DATA.abstraction.questions`, `userQuizAnswers.abstraction`. 선택 답안은 `choiceIdx`에 있다.
* `js/labs/lab-abstraction.js`: `registeredConditions`, `currentPoolTags`, `currentTrashTags`와 `inp-current`, `inp-goal`, `inp-new-condition` 입력값.
* `js/core/session-drafts.js`: 현행 초안의 구조를 참고한다. 이 파일의 저장·복구 동작은 바꾸지 않는다.

## 만들어야 할 인터페이스

새 파일 `js/core/learning-snapshot.js`에 두 함수를 둔다.

1. `buildAbstractionSnapshot(input)`: DOM에 접근하지 않고 전달받은 값만으로 아래 객체를 만든다. Node 검사에서도 호출할 수 있게 내보낸다.
2. `captureAbstraction()`: 현재 화면과 기존 상태에서 값을 읽어 위 함수를 호출한다. 브라우저에서는 `window.learningSnapshot.captureAbstraction()`으로 호출할 수 있게 한다.

반환 형식:

```json
{
  "schemaVersion": 1,
  "unitKey": "abstraction",
  "activityId": "abstraction-core",
  "contentVersion": "abstraction-v1",
  "quiz": {
    "answers": [
      { "questionId": 1, "choiceIndex": null },
      { "questionId": 2, "choiceIndex": null },
      { "questionId": 3, "choiceIndex": null },
      { "questionId": 4, "choiceIndex": null }
    ]
  },
  "practice": {
    "currentState": "",
    "goalState": "",
    "conditions": [],
    "conditionDraft": "",
    "keptInformation": [],
    "discardedInformation": []
  }
}
```

* 현행 네 문항의 ID를 사용한다. 답하지 않은 문항은 `null`, 선택한 답은 0부터 시작하는 보기 번호로 둔다. 알려지지 않은 문항이나 유효하지 않은 보기 번호는 정상 답안처럼 받아들이지 않는다.
* `isCorrect`나 학생이 주장하는 점수는 반환하지 않는다. 정답 수와 공식 점수는 후속 단계에서 해당 문항 버전의 기준으로 계산한다. `contentVersion`은 현재 문항 묶음을 가리키며 문항을 바꿀 때 같은 버전을 재사용하지 않는다.
* 현재·목표 상태와 조건 입력은 원문을 보존한다. 아직 추가 버튼을 누르지 않은 조건 입력은 `conditionDraft`로 별도 보존한다.
* 남긴 정보는 `currentPoolTags` 중 `currentTrashTags`에 없는 항목, 버린 정보는 `currentTrashTags`이다.
* 빈 입력·부분 풀이·오답도 객체를 만들 수 있어야 한다. 이 함수에서 제출 자격이나 과정점수를 판정하지 않는다.
* 배열·객체를 복사한다. 함수를 호출한 뒤 학생이 화면을 수정해도 이미 만든 객체의 내용이 달라지면 안 된다. 기존 전역 상태를 변경하지 않는다.
* AI가 만든 `currentGeneratedPlans`, AI 대화, 개인 코드, 이름·학급·번호·UID를 넣지 않는다. 소유자와 서버 제출 시각은 인증·저장 단계에서 추가한다.
* `captureAbstraction()`은 수행평가 진행·복구·공유 편집기 사용 중에는 실행을 거부한다. 로그인·저장·AI 호출이나 화면 전환을 부수 효과로 일으키지 않는다.

## 변경 범위

* 새로 만들기: `js/core/learning-snapshot.js`, `tests/learning-snapshot.test.cjs`.
* 수정: `index.html`의 스크립트 연결만 추가. 기존 학습 상태가 준비된 뒤 함수를 사용할 수 있게 한다.
* 문서: PRD 9.6에 이번 함수의 실제 구현 상태만 추가하고 `docs/GEMINI_TASK_02_1_RESULT.md`에 결과를 기록한다.

인증·Firestore 규칙·API·기존 퀴즈 동작·실습 동작·디자인은 수정하지 않는다. 다른 파일이 꼭 필요하면 이유와 최소 범위를 먼저 설명하고 관련 없는 정리를 섞지 않는다. 새 패키지를 설치하지 않는다.

## 완료 확인

`node tools/check.cjs`와 `node --test tests/learning-snapshot.test.cjs`를 실행한다. 검사는 ① 미응답·부분 실습 보존 ② 선택 답안과 버린 정보 분리 및 잘못된 입력 처리 ③ 원본 수정 뒤 스냅샷 불변을 확인한다.

기존 로컬 미리보기의 `?demo=1`에서 실제 퀴즈 답과 실습 입력을 바꾼 뒤 함수를 호출해 값이 일치하는지 확인한다. 수행평가 잠금 시 호출 거부와 새 콘솔 오류 유무도 확인한다. UI 배치 변경이 없으므로 전체 화면 회귀 검사와 모든 창 폭 검사는 이번 완료 조건에 포함하지 않는다.

결과 문서에는 변경 파일, 함수 사용 예, 개인정보를 포함하지 않는 예시 객체 하나, 검사 결과와 미확인 사항만 적는다. **여기서 작업을 끝내고 로그인·저장 단계로 자동 진행하지 않는다.** 커밋·푸시·배포는 하지 않는다.
