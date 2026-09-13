# 문서 안내

문서는 역할별로 읽는다. 새 PC나 새 AI에서는 `AGENTS.md` → `INTENT.md` → 현재 인수인계 → PRD의 관련 절만 먼저 읽는다. 현재 요구사항은 PRD, 진행 상태는 인수인계, 과거 검증은 해당 버전의 보고서를 기준으로 한다. 모든 과거 보고서를 새 세션마다 읽지 않는다.

## 1. 프로젝트 기준과 작업 시작

| 문서 | 책임 |
|---|---|
| [프로젝트 소개](../README.md) | 서비스 소개와 문서 진입점 |
| [협업 규칙](../AGENTS.md) | 기술 제약·승인 원칙. 별도 승인 없이 수정하지 않음 |
| [교육 철학](../INTENT.md) | 교육적 목적과 판단 기준 |
| [기능 명세](../PRD.md) | 요구사항·계획·구현 상태의 단일 기준 |
| [현재 인수인계](HANDOFF.md) | 작업 브랜치·진행 상태·다음 행동 |
| [새 PC·새 AI 시작 프롬프트](START_NEXT_SESSION.md) | 한 AI가 작업 전체를 이어받는 교대 절차 |
| [개발 안내](DEVELOPMENT.md) | 로컬 실행·검사·Git·환경 설정 |
| [UX 후속 작업](UX_BACKLOG.md) | 아직 적용하지 않은 화면 전환 개선 |
| [대문·AI 튜터 구현·검토 기록](HOME_VIEWPORT_TUTOR_PLAN.md) | 첫 화면 높이 맞춤·모바일 이동·우측 접힘 탭의 구현 및 검증 이력 |

## 2. 기능별 구현·검증 근거

아래는 특정 변경의 기록이다. 검사 통과와 배포 상태는 문서에 적힌 날짜·버전에 한정되며 새 변경에 자동으로 승계되지 않는다.

| 기능 | 상세 문서 |
|---|---|
| 실제 게스트 로그인·발표반 접근 제한 | [게스트 로그인](GUEST_LOGIN_BRANCH.md) |
| 학생·교사 인증, 명부·평가 연결 | [로그인·평가](HACKATHON_LOGIN_RELEASE.md) |
| 역할별 클래스룸 | [클래스룸](CLASSROOM_PORTAL_RELEASE.md) |
| 세 활동의 퀴즈·실습 기록 | [활동 기록](ALL_UNIT_RECORDS_RELEASE.md) |
| 캠퍼스·수업 페이지 | [지도 배포](PLAYGROUND_RELEASE.md), [독립 검토](PLAYGROUND_REVIEW.md) |
| 캠퍼스 설계·픽셀 자산의 제작 이유 | [초기 지도 계획](HACKATHON_PLAYGROUND_PLAN.md), [픽셀 시안과 후속 구현](PIXEL_PLAYGROUND_DIRECTION.md) |
| 초기 플랫폼 구조 | [구조 검토](PLATFORM_STRUCTURE_REVIEW.md) |
| 해커톤 환경 분리 당시 확인 | [환경 점검](HACKATHON_ENVIRONMENT.md) |

현재 설계가 필요하면 먼저 PRD의 최신 관련 절을 읽는다. 예전 계획의 모달·중앙 출발·샘플 체험 등을 다시 적용하지 않는다.

## 3. 과거 서비스·기반 기능 이력

원인 조사나 이전 설계 확인이 필요할 때만 읽는다. 아래 문서의 이전 저장소·main 브랜치·Firebase 대상을 현재 작업 지시로 사용하지 않는다. 미해결 항목도 기록 시점 기준이므로 최신 코드와 대조한다.

- [이전 배포](DEPLOYMENT.md), [이전 DB 구조](DATABASE.md), [이전 운영 준비](OPERATIONS.md)
- [초기 구현 검토](IMPLEMENTATION_REVIEW.md), [초기 UI 검토](UI_REVIEW.md), [작업 공간 검토](WORKSPACE_UI_REVIEW.md)
- [수행평가 UI](ASSESSMENT_UI_REVIEW.md), [자유 설계 평가](ASSESSMENT_OPEN_DESIGN_REVIEW.md), [교사 제어](TEACHER_CONTROLS_REVIEW.md)
- [과거 PRD 보존본](PRD_HISTORY_2026-09-12.md), [감사 보고서](../audit/AUDIT_REPORT.md), [이전 관리 연결](../audit/ENVIRONMENT_STATUS.md)

## 유지 방법

- 요구사항 변경은 PRD의 관련 절에, 다음 작업은 인수인계에 기록한다. 같은 명세를 여러 파일에 복제하지 않는다.
- 보고서는 검증 환경·버전·근거·미확인 항목을 남긴다. 과거 사실을 현재 완료 표현으로 덮어쓰지 않는다.
- 완료된 일회성 AI 지시서는 고유한 결정·검증 근거를 정식 문서로 옮긴 뒤 삭제 승인을 받는다. 이번에 승인된 7개 파일은 제거했고 원문은 Git 이력에서 복원할 수 있다.
- 새 문서는 이 안내의 적절한 분류에 연결한다. 파일을 옮기거나 삭제할 때 문서 링크를 함께 확인한다.
- 교과서·학생 비밀번호·서비스 계정 키·개인 인증 파일은 문서나 Git에 포함하지 않는다.
- 현재 상태는 `HANDOFF.md` 한곳에서만 관리한다. 완료된 작업의 상세 근거는 기능별 보고서로 옮기고 현재 인수인계에 과거 진행 목록을 계속 누적하지 않는다.
- AI나 PC를 교체할 때 대화 요약보다 원격 커밋을 우선한다. 한 작업을 여러 AI가 동시에 나누지 않고, 새 AI 하나가 마지막 원격 커밋부터 남은 책임 전체를 맡는다.
