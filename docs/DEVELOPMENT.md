# 개발과 검토 절차

현재 작업은 [인수인계](HANDOFF.md), 기능 요구는 [PRD](../PRD.md), 상세 문서 선택은 [문서 안내](INDEX.md)를 따른다. 과거 서비스의 main 배포 안내를 현재 프로젝트에 적용하지 않는다.

## 다른 PC에서 시작

Git과 Node.js가 필요하다. 기존 검증 환경은 Node.js 24였으며 다른 버전은 관련 검사를 실행해 확인한다. 저장소가 없는 경우 원하는 상위 폴더에서 실행한다.

~~~powershell
git clone https://github.com/DonghyunT/donghyun-hackthon.git
cd donghyun-hackthon
git status
git fetch origin
~~~

진행 중 작업을 이어받는 경우 인수인계에 적힌 원격 브랜치와 마지막 커밋이 실제로 존재하는지 확인한 뒤 선택한다. 새 작업의 운영 기준은 `feature/hackathon`이다. 전환 전 미커밋·미추적 파일을 보존하고 기존 브랜치를 강제 초기화하지 않는다. 원격 최신 상태와 비교한 뒤 필요한 경우에만 `pull --ff-only`로 갱신한다.

새 PC에서 새 작업을 시작하는 기본 흐름은 다음과 같다.

~~~powershell
git fetch origin --prune
git status --short --branch
git log --oneline --decorate -5 origin/feature/hackathon
git switch feature/hackathon
git pull --ff-only origin feature/hackathon
git switch -c codex/<작업-이름>
~~~

진행 중인 원격 작업 브랜치를 이어받을 때는 마지막 두 줄 대신 다음처럼 사용한다.

~~~powershell
git switch <인수인계에-적힌-브랜치>
git pull --ff-only origin <인수인계에-적힌-브랜치>
~~~

한 브랜치에 두 PC나 두 AI가 동시에 쓰지 않는다. PC 또는 AI를 교체할 때 기존 작업자는 먼저 안전한 변경을 커밋·푸시하고 인수인계를 갱신한 뒤 편집을 멈춘다. 새 AI는 남은 구현·검토·검증 전체를 맡는다.

문서 변경도 운영 브랜치에 병합되기 전에는 작업 브랜치에만 있을 수 있다. 이어받을 브랜치와 병합 상태는 인수인계에서 확인하되, 원격 Git 로그와 다르면 원격 상태를 사실로 삼고 문서를 고친다.

## 로컬 실행과 검사

프런트엔드는 별도 npm 설치·번들 빌드가 필요 없다. 프로젝트 루트에서 실행한다.

~~~powershell
node tools/preview.cjs
~~~

http://127.0.0.1:4173/?demo=1 로 접속한다. 이 미리보기는 Firebase 초기화를 차단하며 실제 로그인·운영 저장·AI 검증을 대신하지 않는다. 서버는 Ctrl+C로 종료한다.

별도 터미널에서 문법·자산 참조와 변경에 관련된 검사를 실행한다. 아래 두 번째 명령은 전체 Node 검사가 필요한 경우의 예다.

~~~powershell
node tools/check.cjs
node --test tests/*.test.cjs
~~~

브라우저 자동 검사에는 해당 도구의 Playwright·브라우저 설정이 필요하다. 기존 PC 경로를 사용하는 도구는 PLAYWRIGHT_MODULE과 BROWSER_EXE를 확인한다. UI·실제 인증·저장 등 필요한 흐름만 브라우저로 확인하고 캡처는 최소화한다. 문서만 바꿨다면 링크·내용·변경 범위를 확인하며 앱 검사나 배포는 필요 없다.

## 변경부터 배포까지

1. 사용자 요청, PRD, 재현 근거와 Git 상태를 확인한다.
2. 별도 codex/ 작업 브랜치에서 목적에 맞는 변경을 한다.
3. 관련 검사와 실제 사용 흐름을 확인하고 미검증 항목을 남긴다.
4. PRD의 관련 상태와 인수인계를 갱신하고 변경을 커밋·푸시한 상태까지 구분해 보고한다.
5. 이번 변경에 대한 명시적 병합·배포 승인 후 해커톤 운영 브랜치 feature/hackathon에 반영한다. 이미 받은 동일 변경의 승인은 다시 요청하지 않는다.

운영 브랜치 push는 Vercel 자동 배포를 실행할 수 있다. Preview도 운영 Firebase와 자동 분리되지 않는다. Firestore 규칙·인증·환경 변수 변경은 Git과 별개로 운영에 영향을 주므로 해당 범위의 승인과 검증을 확인한다.

## Git으로 옮겨지지 않는 것

- GitHub·Vercel·Firebase CLI 인증과 MCP 연결은 새 PC에서 별도로 확인한다. 새 프로젝트나 DB를 자동 생성하지 않는다.
- .vercel/, .env*, js/data/config.js와 개인 인증 파일은 Git에 포함하지 않는다. 이전 PC의 인증 폴더를 통째로 복사하거나 비밀값을 대화에 붙이지 않는다.
- 서버 환경 변수는 Vercel에 남아 있다. 로컬 UI 작업만을 위해 내려받을 필요는 없다.
- schoolbooks/는 로컬 교과서 참고용이며 외부 업로드·배포하지 않는다. scratch/private-access/의 비밀 자료도 Git으로 이동하지 않는다.
- 서버 학생 자료는 Firebase에 남는다. 창 종료·clone·pull이 서버 자료를 삭제하거나 복사하는 것은 아니다.

## PC나 AI를 바꾸기 전 마감

1. `git status --short --branch`로 수정·미추적 파일을 분류한다.
2. 안전한 작업만 현재 작업 브랜치에 커밋하고 원격에 푸시한다.
3. `PRD.md`에는 요구사항의 계획·구현·검증 상태를, `docs/HANDOFF.md`에는 이어받을 브랜치·커밋·다음 행동을 기록한다.
4. 운영 병합·배포·Firebase 변경 여부를 명시한다. 푸시만 한 작업을 배포 완료로 쓰지 않는다.
5. 비밀 파일과 PC 전용 설정은 Git에 넣지 않고 새 PC에서 별도로 준비해야 한다고 기록한다.

커밋하거나 푸시하지 않은 변경은 다른 PC에서 복구할 수 없다. 임시 코드가 필요하면 비밀이 없는지 확인한 뒤 정식 작업 파일로 커밋하고, 단순 생성 스크립트나 폐기 후보는 인수인계에만 이름과 처리 상태를 남긴다.

게스트 서버 설정과 실제 검증 범위는 [게스트 로그인 기록](GUEST_LOGIN_BRANCH.md)을 따른다. 과거 시스템의 설계·검사 근거는 [문서 안내의 이력 분류](INDEX.md)에서 찾는다.
