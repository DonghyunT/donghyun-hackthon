# 해커톤 개발·배포 환경 점검

확인일: 2026-09-13. 작업 폴더: `D:\hack_thon`.

## 후속 점검: 해커톤 전용 연결로 변경

이 절은 같은 날 아래 최초 점검 이후 사용자가 Antigravity에서 진행한 변경을 확인한 최신 기록이다. 아래 최초 점검의 기존 저장소·Vercel·Firebase 연결 정보를 현재 해커톤 작업 대상으로 사용하지 않는다.

* origin: `https://github.com/DonghyunT/donghyun-hackthon.git`. 브랜치 `feature/hackathon`. 처음 `484b326`의 원격 일치를 확인했고 점검 중 후속 `f43a5a2`가 반영되었다.
* Vercel: 별도 프로젝트 `donghyun-hackthon`, `https://donghyun-hackthon.vercel.app/`. CLI Production Ready, HTTP 200. 사용자 제공 Vercel 화면의 Production 브랜치는 `feature/hackathon`이다.
* 화면: Edge 1440×900에서 새 도메인 홈 표시·페이지 JS 오류 0. 이 확인에서는 POST 등 쓰기 요청을 차단했다. 이전 사이트도 별도 HTTP 200 응답을 확인했다.
* Firebase: 새 프로젝트 `donghyun-hackthon`은 ACTIVE이며 `(default)` Firestore, 서울 리전 `asia-northeast3` 메타데이터 조회 성공. 점검 초반에는 새 도메인도 기존 DB 설정을 제공했지만 후속 배포 후 브라우저의 `FIREBASE_CONFIG.projectId`가 `donghyun-hackthon`인 것을 확인했다.
* 최초 발견한 서버 설정 문제(후속 수정 완료): 새 Vercel에 `FIREBASE_PROJECT_ID`가 없어 API의 기존 `donghyun-algo` 기본값이 적용될 수 있었다. 아래 후속 작업에서 환경 변수를 등록·반영했다.
* 최초 발견한 관리 도구 문제(후속 로컬 수정 완료): `tools/firebase-admin.cjs`의 기존 프로젝트 하드코딩을 아래 후속 작업에서 새 프로젝트로 변경했다.
* 새 Firebase의 로그인 공급자·허용 도메인·보안 규칙·교사 역할·실제 저장·AI 응답은 이번 확인 범위에 포함되지 않는다. 기존 Firebase에서 통과했던 검증을 새 프로젝트의 검증 결과로 옮기지 않는다.
* 이번 Codex 작업은 읽기 전용 확인과 PRD·인수인계·점검서 갱신이다. 앱 코드·환경 변수·운영 DB·배포는 변경하지 않았다. 실제 인프라 변경과 배포는 사용자가 진행한 Antigravity 작업이다.

### 후속 수정: 사용자 요청으로 두 대상 문제 해결

2026-09-13 사용자가 위 두 문제의 수정을 명시적으로 요청했다. 이 항목은 앞선 읽기 전용 점검 이후 Codex가 실제로 수행한 변경이다.

* 새 Vercel 프로젝트 `prj_2O0qOyxdhxRL5uEOTPiM6dnrH6sx`에 `FIREBASE_PROJECT_ID=donghyun-hackthon`을 Config 변수로 등록했다. Production·Preview·Development 전체 적용을 확인했다. CLI 목록은 값을 암호화하고 ID를 생략하므로, 공식 프로젝트 환경 변수 조회 API로 ID를 확인한 뒤 해당 비밀이 아닌 변수 하나를 단일 조회해 정확한 값을 검증했다. AI 비밀 키를 조회·출력·저장하지 않았다.
* 새 도메인의 당시 최신 배포를 소스로 Production 재배포했다. 새 배포 ID `dpl_B8p1y5DcK2FcMEmmjb5i8YNMXFv3`, URL `https://donghyun-hackthon-83lbie26q-donghyun2.vercel.app`. Ready 상태와 `donghyun-hackthon.vercel.app` 별칭을 확인했다. 로컬 미커밋 파일을 업로드하거나 GitHub에 push한 것은 아니다.
* `tools/firebase-admin.cjs`의 `PROJECT`를 `donghyun-hackthon`으로 수정했다. `.firebaserc`와 일치, 생성되는 Firestore 루트·문서 이름의 새 대상 일치, 수정 도구로 새 DB 메타데이터 조회 성공을 확인했다. 로컬 코드 변경은 아직 커밋·푸시하지 않았다.
* `node tools/check.cjs`의 스크립트 43개 문법·로컬 HTML 자산 연결 검사 통과. 운영 API의 무인증 요청 차단을 점검했다. 이 검증은 실제 인증된 학생·교사 요청, 데이터 쓰기, 유료 AI 호출의 성공 확인과 다르다.
* 기존 Vercel·Firebase 프로젝트와 학생 데이터·보안 규칙은 변경하지 않았다. Preview·Development에도 변수는 등록했지만 이번 재배포 대상은 Production만이다.

## 최초 점검 기록 — 기존 서비스 연결 당시

## 결론

개발·로컬 검증·GitHub 관리·Vercel 배포·Firebase 관리에 필요한 실행 도구와 기존 계정 접근을 확인했다. 새로 로그인하거나 MCP를 모두 설치해야 개발을 시작할 수 있는 상태는 아니다. 실제 변경 배포와 운영 데이터 쓰기는 이번 점검에서 실행하지 않았다.

협업 역할은 사용자·Codex가 방향과 PRD·작업 지시·검토를 맡고, Antigravity의 Gemini가 앱 코딩을 맡는 방식이다. 이 점검은 자동 모델 간 협업을 설치하거나 실행한 작업이 아니다.

## 확인 결과

| 영역 | 실측 결과 | 범위·제한 |
|---|---|---|
| Git | 2.55.0.windows.3, 원격 HEAD와 로컬 기준 커밋 `aa49897` 일치 | 원격 조회 시점 기준 |
| Git 폴더 쓰기 | 권한 제한 밖에서 고유한 임시 빈 파일 생성·삭제 성공 | Codex 샌드박스의 `.git` 쓰기 제한은 별개이며 작업 시 실행 승인이 필요할 수 있음 |
| GitHub | 기존 자격 증명으로 저장소 조회 성공, `admin`·`push` 권한 확인 | 실제 push·PR 생성은 하지 않음 |
| GitHub 자동 검사 | `aa49897`의 Verify branch 성공, Vercel 상태 success | 기존 커밋 결과 |
| Node.js | 24.19.0 | 전역 npm 패키지 디렉터리는 없음 |
| 정적 검사 | JS/CJS 43개 문법·HTML 로컬 자산 연결 통과 | `node tools/check.cjs` |
| 기본 테스트 | 핵심 로직·API·평가·회차 테스트 21개 통과 | 실제 Firebase·AI 호출을 대체한 로컬 검사 |
| 브라우저 | Edge·Chrome 및 Playwright 설치 확인. Edge 1440×900에서 홈 로드·순서도 백지 단계 진입 성공 | 최초 시도는 앱 전역 객체가 없어 실패. 추가 진단을 넣은 재시도에서는 모든 로컬 스크립트 HTTP 200, 요청 실패·JS·콘솔 오류 0. 최초 실패 원인은 확정하지 않음 |
| 로컬 격리 | `tools/preview.cjs`, `demo=1`, Firebase 초기화 차단 확인 | 운영 로그인·AI·DB 저장 검증과 다름 |
| Vercel | CLI 59.16.0으로 계정·프로젝트·배포 조회 성공 | 현재 폴더에 `.vercel/project.json`은 없음. 명시적 프로젝트 지정은 가능 |
| 운영 사이트 | `https://algorithm-studio-ten.vercel.app/` HTTP 200, Production Ready | 기존 운영 서비스이며 이번 해커톤의 신규 배포가 아님 |
| 서버 API | 운영 배포 조회에서 `api/chat`·`api/assessment` 존재 확인 | 실제 유료 AI 요청은 하지 않음 |
| 환경 변수 | Production에 `AI_DAILY_LIMIT`, `FIREBASE_PROJECT_ID`, `UPSTAGE_API_KEY` 이름 확인 | 비밀 값 미출력·미저장. `UPSTAGE_API_KEY`는 Preview에도 적용됨 |
| Firebase | CLI 15.30.0, 기존 로그인으로 `donghyun-algo` 프로젝트 조회 성공 | 별도 로그인 불필요한 상태로 관찰됨 |
| Firestore | `(default)` DB 메타데이터 조회 성공, `asia-northeast3`, 배포 규칙과 로컬 규칙 일치 | 학생 답안 열람·수정·삭제, 규칙 배포는 하지 않음 |
| Antigravity | 데스크톱 앱·IDE 설치 확인 | IDE 내 현재 대화·도구 상태를 직접 조작한 것은 아님 |
| Firebase MCP | 설정 발견. 같은 설치 모듈로 별도 MCP 서버를 열어 `firebase_get_environment` 호출 성공 | `D:\hack_thon`·`donghyun-algo` 인식 확인. IDE의 현재 세션 연결은 별도 |

## MCP와 CLI 구분

Antigravity 공통 설정 `C:\Users\안동현\.gemini\config\mcp_config.json`에는 `firebase-mcp-server`가 등록되어 있다. 등록된 명령은 `npx`와 `firebase-tools@latest`를 사용하는 방식이다. 해당 공통 설정에서 GitHub·Vercel MCP 등록은 발견하지 못했다. 이 결과가 모든 IDE 세션에 해당 도구가 없다는 증명은 아니다.

현재 Codex 대화에는 GitHub·Vercel·Firebase 전용 MCP 도구가 노출되지 않았다. 이번 실제 조회는 기존 Git 자격 증명, 로컬 CLI, Firebase MCP의 별도 점검 연결로 수행했다. MCP 설정 등록과 도구 호출 성공은 구분한다.

`gh`, `vercel`, `firebase`, `agy`는 현재 Codex 프로세스의 PATH에서 찾지 못했다. 다만 Vercel·Firebase CLI는 기존 npm 실행 캐시에 있어 아래 경로로 정상 실행했다. 캐시 경로는 다른 PC나 캐시 삭제 후에는 유지되지 않는다. 전역 설치·PATH 수정은 이번에 하지 않았다.

## Antigravity에서 사용할 실행 경로

작업 디렉터리를 먼저 `D:\hack_thon`으로 지정한다. 프로젝트 내 폴더 이름에는 한글이 없지만 사용자 프로필 아래 도구 경로에는 여전히 한글이 있으므로 따옴표로 감싼다. 이번 CLI 조회에서 한글 경로 오류는 재현되지 않았다.

```powershell
# 일반 로컬 시연: 운영 Firebase 초기화를 차단함
node tools/preview.cjs
# http://127.0.0.1:4173/index.html?demo=1

# 기본 검사
node tools/check.cjs
node --test tests/core.test.cjs tests/api.test.cjs tests/assessment-api.test.cjs tests/rounds.test.cjs

# 기존 설치를 활용한 읽기 전용 계정·프로젝트 확인
node 'C:\Users\안동현\AppData\Local\npm-cache\_npx\69f9afb961c37556\node_modules\vercel\dist\vc.js' whoami
node 'C:\Users\안동현\AppData\Local\npm-cache\_npx\69f9afb961c37556\node_modules\vercel\dist\vc.js' project inspect algorithm-studio
node 'C:\Users\안동현\AppData\Local\npm-cache\_npx\ba4f1959e38407b5\node_modules\firebase-tools\lib\bin\firebase.js' projects:list --json --non-interactive
```

GitHub는 `git`의 기존 인증이 유효하다. GitHub CLI `gh` 설치는 확인되지 않았다. PR·저장소 API 작업은 기존 인증을 안전하게 사용하거나 별도 도구를 준비한다. 비밀 값을 프롬프트·문서에 복사하지 않는다.

기존 브라우저 테스트의 기본 Playwright 경로와 Edge 실행 경로도 현재 PC에 존재한다. `tools/firebase-admin.cjs`를 사용할 경우 `FIREBASE_TOOLS_LIB`는 위 Firebase 패키지의 `lib` 디렉터리를 지정해야 한다. 관리 도구는 개별 명령의 읽기·쓰기 범위를 먼저 확인한다.

## 다음 작업과 남은 범위

1. 점검 시작 브랜치는 `main`이었고 점검 종료 시 `feature/hackathon`으로 바뀌어 있었다. 점검 과정에서는 브랜치를 만들거나 전환하지 않았다. 다른 작업에서 바뀐 현재 브랜치를 보존하며 구현 직전에 다시 확인한다.
2. 기존 미커밋 `PRD.md` 변경과 새 `docs/HACKATHON_HANDOFF.md`를 보존했다. 그 인수인계 문서의 바탕화면 경로는 이전 위치이다. 이번에는 이 점검서와 Git 무시 대상 `scratch/`의 임시 점검 스크립트·화면만 추가했다.
3. 현재 GitHub 원격·Vercel 프로젝트·Firebase 기본 프로젝트는 기존 운영 서비스에 연결된다. 해커톤을 기존 서비스 확장으로 배포할지, 별도 서비스·데이터 환경으로 분리할지는 배포 전에 사용자와 확정한다. Preview가 자동으로 별도 Firebase DB를 사용한다고 가정하지 않는다.
4. 현재 폴더의 Vercel 로컬 연결, 새 배포 생성, 실제 학생·교사 공동 사용, 실제 AI 응답·비용·학급 동시 사용은 미검증이다. Firebase 쓰기·배포 권한을 확인하려고 운영 데이터를 변경하지 않았다.
5. 임시 로컬 서버와 화면 없는 브라우저, 점검용 MCP 서버는 종료했다. Git 폴더 쓰기 점검용 파일도 삭제했다. 운영 배포·DB·보안 규칙은 변경하지 않았다.

공식 참고: Antigravity 설치본의 `agy-customizations/docs/mcp_servers.md`, 설치된 Firebase CLI `mcp --help`, Vercel CLI `env ls --help`. 실제 확인 결과는 위 범위에 한정한다.
