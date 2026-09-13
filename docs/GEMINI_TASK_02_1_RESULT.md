# Gemini 작업 2-1 결과 보고서

## 변경 파일
* `js/core/learning-snapshot.js` (신규): 스냅샷 순수 생성 함수 및 상태 수집 함수 구현
* `tests/learning-snapshot.test.cjs` (신규): Node.js `node:test` 기반 검증 로직 구현
* `index.html`: `js/core/learning-snapshot.js` 스크립트 연결 추가
* `PRD.md`: 9.6 항목에 작업 2-1 진행 상황 기록

## 함수 사용 예
```javascript
// 브라우저 환경에서 현재 실습 상태 캡처
const snapshot = window.learningSnapshot.captureAbstraction();
console.log(JSON.stringify(snapshot, null, 2));
```

## 예시 객체
```json
{
  "schemaVersion": 1,
  "unitKey": "abstraction",
  "activityId": "abstraction-core",
  "contentVersion": "abstraction-v1",
  "quiz": {
    "answers": [
      {
        "questionId": 1,
        "choiceIndex": 2
      },
      {
        "questionId": 2,
        "choiceIndex": null
      },
      {
        "questionId": 3,
        "choiceIndex": null
      },
      {
        "questionId": 4,
        "choiceIndex": null
      }
    ]
  },
  "practice": {
    "currentState": "비 오는 날 아침, 현재 시각은 8시 10분",
    "goalState": "8시 40분까지 학교에 지각하지 않고 도착",
    "conditions": [],
    "conditionDraft": "",
    "keptInformation": [
      "현재 시각: 8시 10분",
      "학교까지 버스로 20분",
      "등교 목표 시각: 8시 40분"
    ],
    "discardedInformation": [
      "오늘 신은 양말 색깔",
      "어젯밤 꾼 꿈 내용",
      "가방에 달린 키링 종류"
    ]
  }
}
```

## 검사 결과
- **Node.js 테스트 통과**: `node tools/check.cjs` (Syntax OK) 및 `node --test tests/learning-snapshot.test.cjs` 통과 (테스트 3개, 모두 Pass).
  - 미응답/부분 실습 보존 확인
  - 잘못된 입력 처리 및 타입 거름망 동작 확인
  - 원본 참조 배열 수정 시 스냅샷 불변성 확인
- **수행평가 잠금 처리**: `window.assessmentWorkspace.active === true` 인 경우 캡처를 거부하도록 조건 구현 완료.

## 미확인 사항 (다음 단계 목표)
- 서버 연동, 실제 학생 데이터(이름, 코드 등) 부착 기능 미구현
- 학생용 UI (제출 버튼 등) 및 교사용 대시보드 화면 미구현
- 인증 과정 등 백엔드 기능 미연동

## Codex 검토 및 보완 — 2026-09-13

대상: `037ed92` 이후 `codex/student-learning-records` 로컬 수정본. 위 예시 객체는 사용 예시이며 운영 제출 결과가 아니다.

- 브라우저의 const/let 전역을 window 속성으로 읽어 퀴즈·조건·정보 태그가 누락되는 오류를 회귀 검사로 재현하고 직접 전역 참조로 수정했다.
- 기존 `isAssessmentLocked()`도 확인하여 평가 1·2부와 복구 대기를 포함해 캡처를 거부한다. 정상적인 잠금 거부는 console.error를 발생시키지 않는다. 보기 정의가 없으면 선택 번호를 유효한 답안으로 인정하지 않는다.
- 관련 Node 검사 5개와 `node tools/check.cjs`(46 scripts) 통과. 로컬 Edge 1280×900에서 실제 페이지 전역과 DOM을 읽어 4문항·부분 실습·등록 전 조건·정보 분리·복사 독립성 및 4가지 평가 잠금 상태를 확인했다. JS 및 콘솔 오류 0건.
- 실행 근거: `scratch/snapshot-check.cjs`, 화면 `scratch/snapshot-review.png`. 화면 디자인 변경은 없으며 전체 UI 회귀 검사는 반복하지 않았다. Firebase를 차단한 로컬 시연 검사로 서버 인증·저장 검증은 아니다.
- 로컬 수정 상태이며 커밋·푸시·배포하지 않았다. 다음은 `GEMINI_TASK_02_2_STUDENT_AUTH.md`의 로그인 서비스만 구현한다.
