# CLI Speed Typing — 소스 보존 및 이전 검토

작성일: 2026-11-05

## 소스 출처와 구성
- ChatGPT Site의 최신 내보낸 커밋: `3cb04c4cd27bce3ec494a05e8f20095b2121a7a6`
- 실제 작업물: 정적 사이트, 루트의 `README.md`, `test.cjs`, `.openai/hosting.json`, `dist/` 아래 HTML, CSS, JavaScript 및 `pixel.ttf`, 글꼴 라이선스.
- 패키지 의존성 manifest/lock 파일이 없고, 런타임 npm 패키지 또는 번들러를 쓰지 않음. `app.js`에서 `engine.js`를 불러오고, CSS/HTML과 자체 폰트를 상대 경로로 사용.
- 빌드 시 생성되는 정적 산출물: `dist/`. `.openai/hosting.json`은 Sites 프로젝트 ID와 정적 경로(`dist`)를 지정.
- 서버 함수/API, 데이터베이스, 인증 제공자 연동, 서버 환경 변수 선언을 찾지 못함. 계정/친구 랭킹/실제 리더/공식 서버 타이머 기능은 포함되지 않음.
- 데이터는 샘플 문구를 `app.js` 안에 둠. 외부 이미지 디렉터리 없음; 토폴로지 장비는 인라인 SVG, 픽셀 글꼴은 `dist/pixel.ttf`.

## 비공개 자료 및 공개 안전성
검사 범위는 현재 내보낸 파일과 작업 트리이며 Git 전체 과거 이력이 아님.
- `.env*`, PEM/key 파일, 자격증명 파일, 별도의 데이터셋 파일은 없음.
- 소스 문자열과 파일명에서 전형적인 API 키/비밀키/토큰/암호 형식이나 강의안 파생 데이터셋 파일은 찾지 못함. 앱의 12개 타이핑 항목은 README가 명시한 가상 인터페이스 문구.
- **공개 전 제거 권장:** `.openai/hosting.json`에 사이트 내부 `project_id`가 기록되어 있음. 통상 인증 비밀은 아니지만 공개 저장소에 둘 이유가 없으므로 GitHub용 사본에서는 `.openai/`를 빼거나 해당 파일을 제외.
- `dist/` 전체는 공개 웹 배포용으로 빌드된 브라우저 자산이므로, 변경 후에는 강의안에서 파생된 명령 데이터가 들어가지 않았는지 다시 검사할 것.
- 이전에 제외한 개인 자료가 Git의 미포함 이력이나 다른 업로드 폴더에 존재할 가능성은 현재 ZIP 스캔으로 판정하지 않음. 이 ZIP은 `.git` 이력을 포함하지 않아 과거 이력 비밀정보 노출을 막음.

## Vercel 이전 호환성
- 현재 형태는 정적 HTML 앱이므로 Vercel의 정적 배포로 옮길 수 있음. Vercel 프로젝트의 Root Directory를 저장소 루트, Output Directory를 `dist`로 지정하고 Build Command는 비워두거나 정적 파일 서버로 설정하면 됨.
- `index.html`, `style.css`, `app.js`, `engine.js`, `pixel.ttf` 상대 경로 구성은 그대로 제공 가능.
- Sites 전용 `.openai/hosting.json`은 Vercel 설정으로 읽히지 않음. Vercel 공개 저장소 사본에서는 제거하고 Vercel 프로젝트 설정으로 Output Directory를 지정.
- 현재 서버 기능/API가 없어서 Sites Worker 기능을 이전해야 하는 부분은 확인되지 않음. 추후 서버 검증, 안전한 친구별 랭킹, 인증, 비공개 CLI 문항을 만들 경우 정적 클라이언트만으로 구현하면 비밀 자료를 숨기거나 부정 방지를 보장할 수 없으므로 서버/API와 환경 변수 저장이 별도로 필요.
- LocalStorage의 최고 점수와 테마는 브라우저별 로컬 값으로만 남음. Vercel로 이동해도 자동으로 사용자 계정/랭킹 데이터가 되지 않음.
- Vercel 대상의 실제 빌드/배포/도메인 연결은 이 준비 작업에서 수행하지 않음.

## 준비 산출물
- `CLI-Speed-Typing-source-preservation.zip`: 최신 Sites 저장 트리의 전체 프로젝트 파일, `.git` 메타데이터 제외. 사이트 ID manifest 포함.
- `CLI-Speed-Typing-public-review.zip`: 소스 동일, Sites 내부 manifest만 제외한 GitHub 공개 검토용 사본. 이 사본도 GitHub에 업로드하지 않았음.
- 이 보고서는 검사 결과와 Vercel 설정 권고를 기록하며, 실제 소스 프로젝트에는 추가하지 않음.

GitHub 저장소 `jennajiminkim/CLI-Speed-Typing`은 검사 당시 기본 브랜치가 `main`, 크기 0인 빈 저장소로 보임. 이 작업에서는 어떠한 파일도 GitHub에 쓰지 않았고 Vercel 배포도 하지 않음.
