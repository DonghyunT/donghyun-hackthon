# 정보 수업 1차 구조 점검

확인일: 2026-09-13 · 기준: `f43a5a2` 이후 `codex/platform-structure`의 구현
사용자 요청: 구현 결과 간단 점검 후 해커톤 저장소 병합·배포

## 변경과 보완

수업 홈에서 세 단원의 개요를 거쳐 기존 개념·퀴즈·실습으로 이동한다. 나의 기록은 준비 중 안내이며 수행평가와 교사 인증·학급 운영을 유지한다. 서비스 제목은 교수평기 올인원으로 맞췄다.

실제 Edge에서 다음 문제를 재현하고 수정했다.

* 기록 또는 단원 개요 → 교사용 진입 시 두 메인 화면이 함께 표시됨: 메인 화면 숨기기를 공통화했다.
* 390px에서 개념·퀴즈·실습의 개요 복귀 버튼이 사라짐: 좁은 화면에서도 버튼을 사용할 수 있게 했다.
* 단원 학습 중 현재 메뉴가 표시되지 않음: 수업 메뉴 선택 상태를 유지한다. 교사 로그인 취소 시 기존 페이지·선택 상태를 유지한다.
* 단원 내부 함수로 교사 화면을 벗어날 때 구독이 남을 수 있음: 해당 경로도 기존 해제 함수를 호출한다.

전체 메뉴의 접근 버튼을 복원하고 기존 키보드 열기·닫기 경로를 유지했다. 새 구조에 맞춰 기존 브라우저 검사의 진입 경로를 갱신하고 새 화면 중첩·모바일 복귀·로그인 실패·구독 해제 검사를 추가했다. 자동 검사에서 네트워크 유휴가 페이지 로딩 완료보다 먼저 보고된 사례가 있어 새 탭·새로고침은 `load`를 기다리게 했다.

## 검증

* 문법·참조: 43개 스크립트와 로컬 HTML 자원 통과.
* 기본/API 검사: 21개 통과.
* 탐색·학생 평가 브라우저 검사: 25개 통과, 페이지 오류·콘솔 오류 0.
* 전용 수행평가 UI 검사: 10개 통과, 페이지 오류·콘솔 오류 0.
* 환경: Windows / Edge headless / 로컬 모의 Firebase·AI. 상단은 320~1920px와 경계 폭, 주요 화면은 1440·1024·768·390px를 확인했다. 실제 교사 Google 로그인·운영 DB 쓰기·유료 AI·학급 동시 접속은 검사 범위에 포함되지 않는다.

나의 기록의 저장·조회, 새 과정점수 계산, 차시 배정은 미구현이다. 홈 목록과 단원 메타데이터의 단일 원본 정리는 후속 작업이다.

근거: [탐색·평가 결과](../tests/results/platform-structure/browser.json), [수행평가 UI 결과](../tests/results/platform-structure/assessment-ui.json), [수업 홈](../tests/results/platform-structure/home.png), [390px 단원 개요](../tests/results/platform-structure/overview-390.png).

## 병합·배포

배포 대상은 `DonghyunT/donghyun-hackthon`의 `feature/hackathon`, Vercel `donghyun-hackthon`이다. Vercel API에서 연결 저장소와 Production 브랜치를 재확인했다.

* 제품 커밋: `f656439` (`codex/platform-structure`)
* 병합·원격 푸시: `74b1f114e272f2e72e796d6af1ce259b040b49e2` (`feature/hackathon`)
* Production Ready: `dpl_DPNuCaJkPDhbK28CmMoNJxuBywuU`
* 배포 주소: `https://donghyun-hackthon-98w6jj1gj-donghyun2.vercel.app`
* 서비스 주소: [교수평기 올인원](https://donghyun-hackthon.vercel.app/)

2026-09-13 12:30 KST, 서비스 주소에서 변경된 HTML·CSS·탐색·클래스룸 파일 4개의 내용을 로컬 제품과 비교했다. 네 화면 폭에서 홈 → 단원 개요 → 개념 → 개요 복귀와 기록 준비 중·평가 로비 진입을 확인했고 페이지·콘솔 오류는 없었다. [운영 확인 근거](../tests/results/platform-structure/live.json)를 확인한다. 쓰기 요청을 차단한 읽기 전용 확인이며 실제 학생 입장·제출·교사 로그인은 실행하지 않았다.

기존 서비스·기존 DB·main 브랜치는 변경하지 않았다. 앞서 수정했던 새 Firebase 관리 도구 대상도 이번 커밋에 포함했다. 이 배포 결과를 기록하는 후속 문서 커밋은 제품 파일을 변경하지 않는다.
