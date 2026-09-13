# Firestore 운영 구조

> 최종 갱신: 2026-09-14 · 프로젝트 `donghyun-hackthon` · 기본 데이터베이스 `(default)`.  
> 과거 프로젝트(`donghyun-algo`)에서 해커톤 전용 서비스(`donghyun-hackthon`)로 분리 완료된 최신 운영 데이터베이스 구조입니다.  
> 작업 규칙은 [AGENTS.md](../AGENTS.md), 현재 작업 상태는 [인수인계](HANDOFF.md), 기능 요구사항은 [PRD.md](../PRD.md)를 단일 기준으로 삼습니다.

---

## 1. 최신 Firestore 컬렉션 구조 요약

현재 시스템은 **수업 및 학습 기록 축(`learning_classes`)**과 **실시간 수행평가 관제 축(`classrooms`)**의 2대 축으로 운영됩니다.

```text
donghyun-hackthon (Firestore default)
├── learning_classes/                    [축 1] 수업 및 학습 기록 컬렉션
│   └── {classId}                        2-1 ~ 2-11 (정규 학급), 2-12 (발표용 학급)
│       └── students/
│           └── {studentNum}             01 ~ 28 (두 자리 번호 문서): uid, name, classId, studentNum, enabled
│               └── submissions/         학생별 원본 제출물 (불변 스냅샷)
│                   └── {UUID}           단원별 퀴즈 답안, 실습 원본(JSON), 제출 시각
│
├── classrooms/                          [축 2] 실시간 수행평가 운영 컬렉션
│   └── {classId}                        2-1 ~ 2-11, 2-12: schoolYear, status, attemptId, deadlineMs, questionVersion
│       ├── students/
│       │   └── {studentNum}             01 ~ 28: name, ownerUid, attemptId, answers(Part1~3), status, review
│       └── archives/
│           └── {UUID}                   이전 평가 회차 보관: kind, archivedAt, 당시 session, students(01~28)
│
├── teachers/                            [축 3] 교사 역할 관리 (RBAC)
│   └── {Firebase Auth UID}              enabled (bool), classIds (게스트 교사는 ['2-12'] 한정)
│
└── ai_usage/                            [축 4] 공통 일일 AI 사용량 제어
    └── {UTC 기준 일자 번호}              count: 여러 서버 인스턴스가 공유하는 AI 호출 횟수 카운터
```

---

## 2. 세부 컬렉션 명세

### 2.1 `learning_classes` — 학생 명부 및 차시별 활동 원본

* **학급 식별**: 2학년 1~11반(`2-1` ~ `2-11`, 각 28명, 총 308명) 및 발표/시연용 학급(`2-12`).
* **학생 명부 문서 (`students/{studentNum}`)**:
  * 경로: `learning_classes/{classId}/students/{studentNum}` (예: `01` ~ `28`)
  * 필드:
    * `uid`: Firebase Auth 사용자 고유 식별자
    * `classId`: 학급 코드 (예: `'2-1'`)
    * `studentNum`: 출석 번호 (1 ~ 28)
    * `name`: 학생 이름
    * `enabled`: 계정 활성화 여부 (`true`)
* **제출물 문서 (`submissions/{submissionId}`)**:
  * 경로: `learning_classes/{classId}/students/{studentNum}/submissions/{submissionId}` (UUID v4)
  * 용도: 문제 추상화, 알고리즘 설계, 순서도 연구소 등 차시 활동의 퀴즈 및 실습 원본을 제출 시점 상태로 불변 보관.
  * 필드 (`schemaVersion: 2`):
    * `schemaVersion`: 스키마 버전 (`2`)
    * `unitKey`: 단원 식별자 (`'abstraction'`, `'algorithm'`, `'flowchart'`)
    * `activityKind`: 활동 종류 (`'quiz'`, `'practice'`)
    * `activityId`: 활동 고유 ID (예: `'flowchart-practice'`)
    * `contentVersion`: 콘텐츠 버전 (예: `'flowchart-v1'`)
    * `ownerUid`: 제출 학생 UID
    * `classId`: 학급 코드
    * `studentNum`: 번호 (int)
    * `submittedAt`: 서버 타임스탬프 (`request.time`)
    * `quiz`: 퀴즈 제출 시 4문항 답안 배열 (`choiceIndex`, `questionId`)
    * `practice`: 실습 제출 시 단계(`stage`) 및 작업 결과 원본 JSON 문자열(`contentJson`, 최대 100KB)
  * **보안 및 불변성**: 생성(`create`)만 허용되며 수정(`update`)과 삭제(`delete`)는 규칙 수준에서 완전히 차단됩니다. 학생 본인과 해당 학급 담당 교사만 열람할 수 있습니다.

### 2.2 `classrooms` — 실시간 수행평가 및 회차 운영

* **학급 관제 문서 (`classrooms/{classId}`)**:
  * `schoolYear`: 학년도 (현재 2026)
  * `status`: 평가 상태 (`'waiting'`, `'in_progress'`, `'ended'`)
  * `attemptId`: 현재 평가 회차 고유 식별자 (UUID)
  * `deadlineMs`: 평가 종료 마감 시각 (Epoch 밀리초)
  * `questionVersion`: 문항 버전 (현재 자유 설계는 `3`, 이전 고정 주제는 `1`, `2`)
* **응시생 답안 문서 (`students/{studentNum}`)**:
  * 경로: `classrooms/{classId}/students/{studentNum}`
  * `name`, `ownerUid`, `attemptId`: 수험자 식별
  * `status`: 응시 상태 (`'joined'`, `'in_progress'`, `'submitted'`)
  * `answers`:
    * `part1`: 객관식 10문항 답안
    * `part2`: 단답형 6문항 답안
    * `part3`: 자유 설계 (현재·목표 상태 `plan`, 자연어 카드 배열, 캔버스 기호 및 직각 연결선)
  * `review`:
    * `proposal`: Solar AI의 4대 루브릭(각 10점, 총 40점) 초벌 제안, 근거, 불확실성
    * `confirmed`: 교사가 답안과 AI 제안을 검토 후 확정한 항목별 점수, 확정 시각, 교사 UID
* **회차 보관 (`archives/{UUID}`)**:
  * 새 회차 준비 시 기존 학생들의 답안과 교사 확정 점수를 하나의 트랜잭션으로 `archives` 하위 `students`에 스냅샷으로 백업한 후, 현재 `students` 좌석 문서를 초기화합니다.

### 2.3 `teachers` — 교사 역할 기반 접근 제어 (RBAC)

* **경로**: `teachers/{Firebase Auth UID}`
* **필드**:
  * `enabled`: 활성화 여부 (`true`)
  * `guest`: 게스트 교사 여부 (선택적)
  * `classIds`: 관할 학급 배열 (예: 일반 교사는 전체 학급, 게스트 교사는 `['2-12']`로 한정)
* **보안**: 클라이언트에서 직접 생성/수정할 수 없으며 관리자 도구(`tools/firebase-admin.cjs`)를 통해서만 등록됩니다.

### 2.4 `ai_usage` — 일일 AI 쿼터 제어

* **경로**: `ai_usage/{UTC 기준 일자 번호}`
* **필드**: `count` (단조 증가 정수)
* **작동**: Vercel Serverless Function(`api/chat.js`, `api/assessment.js`)이 Upstage Solar API를 호출하기 직전에 Firestore 트랜잭션으로 카운터를 증가시킵니다. 일일 제한(`AI_DAILY_LIMIT=300`) 도달 시 상류 호출을 차단하여 교사의 비용을 안전하게 보호합니다.

---

## 3. 보안 규칙 ([firestore.rules](../firestore.rules)) 핵심 보장

1. **학생 격리**: 학생은 자신의 UID와 일치하는 본인 번호 문서 및 본인의 `submissions`만 접근 가능합니다. 타인의 답안 열람이나 조작은 규칙에서 거부됩니다.
2. **게스트 격리**: 발표용 게스트 토큰(`guest: true`)은 토큰 클레임과 보안 규칙 수준에서 오직 `2-12` 학급만 읽고 쓸 수 있으며, 정규 1~11반의 실제 학생 데이터에 접근할 수 없습니다.
3. **평가 무결성**:
   * 평가가 종료되거나 학생이 '제출 완료'한 이후에는 답안 수정이 거부됩니다.
   * 교사 채점 영역인 `review` 필드는 학생이 임의로 생성하거나 변경할 수 없습니다.
