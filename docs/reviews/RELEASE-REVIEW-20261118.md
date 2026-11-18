# 배포 검토 보고서 — 별빛 관측 연구소 (13 nightsky)

> 작성일: 2026-11-19 새벽(작업명 20261118), 07시 운영 반영 · 브랜치: main · 운영 커밋: `87a8283` (이번 작업 `6dfd553` + 기록 `4b6fb0d` + 운영 smoke 뒤 글자 보정) · 배포 대상: Cloudflare Workers `night-sky-explorer` (https://night-sky-explorer.yelsam.workers.dev)
> 범위: 2026-11-18 밤 「놀이 화면 비율·중복 조작 버튼 정리」 작업 뒤 A~G 전체 판정. 이번에 다시 실행하지 않은 항목은 2026-11-12 보고서(`RELEASE-REVIEW-20261112.md`)·11-17~18 3초 규칙 작업 기록을 인용하고 그렇게 적었다.

## 최종 판정

**조건부 배포 가능**

### 왜 이 판정인가

- FAIL 0건. 핵심 경로(B3·B9·B10·B14) 확인됨 — 실제 완주 스크립트(`verify-playthrough` 20개 단언)가 다섯 기록 → 코어 복구 → 인증서 → 새로고침 보존까지 통과.
- A영역은 이번 작업이 학습 문구·판정을 바꾸지 않아 11-12 확인 결과를 인용한다. 교사 현장 검수(A12)가 아직이라 `WARNING`.
- `NOT TESTED`가 B·C·D·G에 7개(40분 수업, 대비 정밀, 가장자리 제스처, 텍스트 200%, 학교 기기 FPS, 폰트 용량, 인쇄 실물) — 5개 이상이라 규칙상 조건부. 실물 학교 태블릿 터치도 확인 못 함.

### 배포 전 처리할 조건

1. 없음 — 2026-11-19 07시 운영 배포 완료(`87a8283`, `cmp.sh` JS·CSS·index 모두 MATCH, 운영 smoke 통과 — G11).

### 배포 후 확인할 것

1. 운영 주소에서 s4a 가림판 탭·Enter, 정보 팝업 닫기 1개, 결과 화면 지도 버튼 1개(운영 smoke — 아래 G11).
2. 교사 실물 태블릿에서 가림판을 손가락으로 톡 눌러 켜고 끄기(터치 실기는 이번에 못 봄).

---

## 요약

| 영역 | PASS | WARNING | FAIL | NOT TESTED | N/A |
|---|---|---|---|---|---|
| A 교육적 품질 | 14 | 2 | 0 | 0 | 1 |
| B 기능 | 16 | 2 | 0 | 1 | 0 |
| C 태블릿·UI | 18 | 3 | 0 | 3 | 1 |
| D 성능 | 6 | 5 | 0 | 2 | 1 |
| E 코드 품질 | 9 | 3 | 0 | 0 | 2 |
| F 데이터·안전 | 13 | 1 | 0 | 0 | 1 |
| G 배포 | 17 | 0 | 0 | 1 | 2 |
| **합계** | 93 | 16 | 0 | 7 | 8 |

## 실행 환경 (실측)

| 항목 | 값 |
|---|---|
| package manager | npm (`package-lock.json` 하나) |
| 실행 명령 | `npm run dev`(5183), `npm test`, `npm run build`(+postbuild) |
| 배포 | `_scratch/deploy-20261118/deploy.sh 13 "13 nightsky" worker-own night-sky-explorer` (저장소 `wrangler.jsonc`, `main: worker/media-range.js`, assets `./dist`) |

| 명령 | 결과 |
|---|---|
| install | 기존 `node_modules` 사용(이번에 설치 안 함) |
| lint | **정의 안 됨** (NOT APPLICABLE) |
| typecheck | **정의 안 됨** (바닐라 JS, NOT APPLICABLE) |
| test | PASS — 146개 통과, 실패 0 |
| build | PASS — vite build + postbuild(사이드카 283개 정리) |

브라우저 확인: 함(헤드리스 Chrome, Playwright, 로컬 dev 서버). 결과는 `.tmp/layout-balance-20261118/`.

| 스크립트 | 결과 |
|---|---|
| `measure.mjs`(이번 작업용) 14화면 × 3해상도 | 콘솔·페이지 오류 0, 놀이 영역 수치 `docs/LAYOUT-BALANCE-20261118.md` |
| `verify-playthrough` | PASS 20/20, errors [] |
| `verify-moon-path` | PASS 4/4 (카드 모드, WebGL 없음 대체, 옛 저장값, 오류 0) |
| `verify-quest` | PASS (보너스·엔딩·인증서·동작 줄이기) |
| `verify-record-safety` | PASS (교사 시연 격리, 초기화 확인, 손상 저장값 보호, 36 화면×해상도, 오류 0) |
| `verify-responsive` 44장면 × 1280·1024·1920·915 | 176건 중 7건 11개 지적 — 전부 915×412 폰 가로(아래 C3·C5), 이번 변경 화면과 무관 |
| `verify-responsive` QA_EXTRAS(팝업) 13 × 4 | 52건 중 3건 8개 — 설정 팝업 접힌 `details` 안 제목(오탐, 아래), 915×412 홈 음성 글·복구 작업대 |
| `verify-concept-art` (TEST_FOCUS=s4a) | s4a 배치·빛 차단 클릭(`[data-shield]`) 3해상도 통과. 마지막 「생성 그림 전부 표시」 단언만 실패 — s4a만 열어 달 표면 그림이 표시되지 않은 범위 지정 탓(오탐) |
| `verify-stage-fit`, `verify-observation-playback` | **낡은 스크립트** — 11-12 이후 제거된 자동 재생 버튼(`#play-time`, `observation-player.js`는 어디서도 import 안 함)을 찾는다. `missing-playback-controls` 29건/해상도와 `#play-time` 시간 초과는 이번 변경과 무관. 보고만 한다 |

---

## A. 교육적 품질 — 이번 작업이 학습 문구·판정·진행을 바꾸지 않음. 11-12 확인 인용

| # | 판정 | 증거 | 비고 |
|---|---|---|---|
| A1 | PASS | 이전 확인됨 | 10개 활동 ↔ 4과13-01~03 매핑(11-12 표) |
| A2 | PASS | 이전 확인됨 | `curriculum.js` 성취기준 코드, 교육부 고시·경기도 안내 대조 |
| A3 | PASS | 이전 확인됨 | 관찰 → 예상 → 근거 → 설명 |
| A4 | PASS | 이전 확인됨 | s4b 근거 선택, s2b 예상·비교 |
| A5 | PASS | 확인됨 | 완주 스크립트의 오답 문구(행성 특징·잘못된 채널) |
| A6 | PASS | 이전 확인됨 | |
| A7 | PASS | 확인됨 | 성취 카드·복구는 기록 완료에 붙음 |
| A8 | PASS | 확인됨 | 「연타 근거 입력」 단언 통과 |
| A9 | PASS | 이전 확인됨 | 힌트는 다음 조작을 안내 |
| A10 | PASS | 확인됨 | 오답 뒤 같은 화면 유지 |
| A11 | PASS | 확인됨 | `curriculum.test.js` |
| A12 | WARNING | — | 교사 현장 검수 전 |
| A13 | NOT APPLICABLE | — | 사회·다문화 소재 없음 |
| A14 | PASS | 이전 확인됨 | 「반사」 쉬운 말 정의 |
| A15 | PASS | 이전 확인됨 | |
| A16 | PASS | 확인됨 | 끌기·문지르기·막대·탭·선 잇기·고르기 |
| A17 | WARNING | 추정 | 5단원이 쉬운 편(관찰 6개) — 11-12와 같음 |

## B. 기능

| # | 판정 | 증거 | 비고 |
|---|---|---|---|
| B1 | PASS | 확인됨 | 홈 「탐구 이어 하기」 |
| B2 | PASS | 확인됨 | 힌트 팝업 열기·닫기(닫기 1개, Esc) |
| B3 | PASS | 확인됨 | 완주 스크립트 |
| B4·B5 | PASS | 확인됨 | |
| B6 | PASS | 확인됨 | 활동 안에서 다시 고르기 |
| B7 | PASS | 확인됨 | |
| B8 | PASS | 확인됨 | 보상·성취 카드 |
| B9 | PASS | 확인됨 | 「Partial observations survive reload」 |
| B10 | PASS | 확인됨 | 이어 하기 |
| B11 | PASS | 확인됨 | 초기화 확인 단계(record-safety) |
| B12 | PASS | 확인됨 | 인증서 |
| B13 | PASS | 이전 확인됨 | |
| B14 | PASS | 확인됨 | 활동 중 새로고침 → 같은 화면 |
| B15 | WARNING | 확인됨 | 비활성 「다음 활동으로」 옆 별도 이유 문구는 없음(위 h1 지시가 대신) — 11-17 결정 유지 |
| B16 | NOT TESTED | — | 실제 학생 40분 수업 |
| B17 | PASS | 확인됨 | 기록 1회 저장 단언 |
| B18 | PASS | 확인됨 | |
| B19 | WARNING | 추정 | 가림판은 pointerup에서 확정. 탭(이동 6 미만) = 켜고 끄기, 끌기 = 놓은 자리로 판정. 실물 손가락 떨림 미확인 |

## C. 태블릿·UI

| # | 판정 | 증거 | 비고 |
|---|---|---|---|
| C1 | PASS | 확인됨 | 1280×800 놀이 영역 높이 79%·면적 77% |
| C2 | PASS | 확인됨 | 1024×768 78.5%·76% |
| C3 | WARNING | 확인됨 | 915×412(0.86배 축소)에서 s2b 문장 칩·s3a 「참고 자료」 실측 38px. 1280 이상은 44px 이상 |
| C4 | PASS | 확인됨 | responsive 스윕 covered-control 0(915 복구 작업대 제외) |
| C5 | WARNING | 확인됨 | 915×412 홈 안내 음성 글 아래 잘림(이번 변경 밖) |
| C6 | PASS | 확인됨 | |
| C7 | PASS | 이전 확인됨 | 세로 레이아웃 |
| C8 | PASS | 확인됨 | 동작 줄이기 |
| C9 | NOT TESTED | — | 전 화면 정밀 대비 |
| C10 | PASS | 확인됨 | 오른쪽 위 소리 |
| C11 | PASS | 확인됨 | 가림판 Tab 초점 + Enter/Space로 켜고 끄기, 초점 유지(새로 추가) |
| C12 | PASS | 확인됨 | 정보 팝업 닫기 방식 통일(아래 닫기 하나) |
| C13 | PASS | 이전 확인됨 | |
| C14 | PASS | 확인됨 | 11-18 조사 수정 |
| C15 | PASS | 확인됨 | 버튼 이모지 없음(✓ 기호만) |
| C16 | PASS | 확인됨 | |
| C17 | PASS | 확인됨 | horizontal-overflow 0 |
| C18 | PASS | 확인됨 | 팝업 닫는 길: 아래 닫기 + Esc(2개). 전체 화면 창은 X 유지 |
| C19 | NOT TESTED | — | 실기 가장자리 제스처 |
| C20 | PASS | 확인됨 | 운영 smoke(1280·1920 × 8화면)에서 코어 화면 「마지막 탐구 · 중앙 관측 코어 재가동」이 1280에서 16px로 잡혀(18px 규칙이 1920 전용 미디어쿼리 안에만 있었음) `src/polish.css`에 코어 라벨 18px를 모든 크기로 넣고(`87a8283`) 재배포 뒤 0건. 1024×768에서도 한 줄·스크롤 없음 |
| C21 | PASS | 확인됨 | keep-all |
| C22 | NOT APPLICABLE | — | Phaser 없음 |
| C23 | PASS | 확인됨 | 활동·결과 화면 primary 1개(결과 화면 2 → 1) |
| C24 | WARNING | 추정 | 지도 캔버스 일부 연출은 JS 쪽 reduced 확인 범위 밖 |
| C25 | NOT TESTED | — | 텍스트 200% |

설정 팝업의 clipped-text 5건은 「교사용 가이드」 등 **닫힌 `details` 안 다시 접힌 제목**을 스윕이 보이는 것으로 센 오탐이다(스크린샷 `responsive-extras/home-filled-round0-settings-1920x1080.png`에서 겹침·잘림 없음).

## D. 성능

| # | 판정 | 증거 | 비고 |
|---|---|---|---|
| D1 | PASS | 확인됨 | 운영 실측(07시, 새 브라우저 3회): 시작 버튼까지 1.40~1.77초(두 차례 6회), 첫 화면 전송 1.29MB(요청 8개, 개념영상 미리 받기 0) |
| D2 | WARNING | 이전 확인됨 | 1MB 넘는 그림 일부 |
| D3 | WARNING | 이전 확인됨 | 개념영상 |
| D4 | NOT APPLICABLE | — | GLB 없음(three 절차 모형) |
| D5·D6 | WARNING | 추정 | `_unused/`, `asset-bank/`은 배포 제외(.assetsignore) |
| D7 | PASS | 확인됨 | 의존성 three 하나 |
| D8 | PASS | 확인됨 | 가림판 리스너는 AbortController signal |
| D9 | NOT TESTED | — | 학교 기기 FPS |
| D10 | PASS | 이전 확인됨 | |
| D11 | WARNING | 확인됨 | 서비스워커 없음 → 오프라인 재방문 안 됨 |
| D12 | PASS | 확인됨 | 런타임 외부 요청 없음(외부 주소는 교사 안내 링크뿐) |
| D13 | PASS | 이전 확인됨 | |
| D14 | NOT TESTED | — | 이번에 폰트 용량 재측정 안 함 |

## E. 코드 품질

| # | 판정 | 비고 |
|---|---|---|
| E1·E2 | WARNING | 큰 CSS 층(polish·flow-refresh·design-refresh), 안 쓰는 옛 `src/main.js` — 11-12와 같음 |
| E3 | PASS | |
| E4 | NOT APPLICABLE | JS |
| E5 | PASS | 확인됨 — 측정·완주 중 콘솔 오류 0 |
| E6–E8 | PASS | |
| E9 | PASS | 클라이언트 번들에 비밀값 없음 |
| E10 | PASS | lock 하나 |
| E11 | PASS | 빌드 통과 |
| E12 | PASS | 146/146 |
| E13 | NOT APPLICABLE | EventBus 없음 |
| E14 | WARNING | 낡은 검증 스크립트 2개(`verify-stage-fit`의 재생 검사, `verify-observation-playback`)가 제거된 기능을 검사 — 정리 필요 |

## F. 데이터·안전 — 이번 작업이 저장 구조를 바꾸지 않음

| # | 판정 | 비고 |
|---|---|---|
| F1·F2 | PASS | 별명(선택)만 저장. 인증서 학년·반·이름은 저장 안 함(record-safety 확인) |
| F3 | PASS | 외부 전송 없음 |
| F4–F7 | PASS | `starlight-lab:v1`, `version: 2`, v1 읽기 |
| F8 | PASS | 초기화 확인 + 복구용 보관 |
| F9 | PASS | 교사 안내의 출처 링크만 |
| F10·F11 | PASS | 이전 확인 |
| F12 | WARNING | 사용자 제공 원본 그림 외부 배포 증빙 |
| F13 | NOT APPLICABLE | 키 없음 |
| F14·F15 | PASS | record-safety 「conflict/corrupt original protection」 |

## G. 배포

| # | 판정 | 비고 |
|---|---|---|
| G1–G4 | PASS | Worker assets, 루트 경로 |
| G5 | NOT APPLICABLE | 환경변수 없음 |
| G6 | PASS | `not_found_handling: none` + 앱 라우팅 |
| G7–G9 | PASS | 11-18 썸네일 교체 |
| G10 | PASS | `deploy.sh`가 푸시된 `origin/main`만 빌드 |
| G11 | PASS | 확인됨 | 운영 smoke 13항목(`.tmp/layout-balance-20261118/smoke.mjs`): 첫 화면 용량·로딩, 18px 하한, s4a 별도 토글 없음·가림판 탭·Enter(초점 유지), 키트·힌트 팝업 닫기 1개, Esc 닫기, 결과 화면 지도 버튼 1개·primary 1개, s3b 새로고침 유지, 콘솔 오류 0. `cmp.sh`: `learning-*.js`·`index-*.css`·`index.html` MATCH. (01~07시 SSD `access()` 멈춤으로 배포가 늦어졌고, 사용자가 macOS 권한 창을 처리한 뒤 진행) |
| G12 | PASS | 로그인 없음 |
| G13 | PASS | 남의 미커밋(`src/classroom.css`, `src/concepts.js`, `public/assets/concepts/*`, 개념 자막 문서) 보존, 이번 파일만 골라 커밋 |
| G14 | PASS | README 명령과 scripts 일치 |
| G15·G16 | PASS | `.assetsignore`, `references`·`docs` 배포 제외 |
| G17 | NOT APPLICABLE | 미리보기 주소 없음 |
| G18 | PASS | 11-18 썸네일 |
| G19 | NOT TESTED | 인증서 실물 인쇄 |
| G20 | PASS | 롤백 대상: 직전 운영 커밋 `e876efe` |
| (실기) | NOT TESTED | 학교 태블릿 실물 |

## 이번에 고친 것 (이번 범위)

- s4a 가림판: 같은 일을 하던 「태양빛 가리기 / 가림판 치우기」 버튼 삭제 → 가림판 탭·끌기·Enter/Space.
- 결과 화면: 중복된 아래 「탐구 지도로」(두 번째 primary) 삭제.
- 정보 팝업: 아래 닫기 버튼이 있으면 머리의 X를 빼서 닫는 길을 하나로.
- 검증 스크립트의 `light-toggle` 참조를 `[data-shield]`로, 달빛 길 스크립트의 보너스 팝업 닫기를 아래 닫기로.

## 이번 범위 밖 — 보고만

- 915×412 폰 가로의 38px 버튼·홈 음성 글 잘림·지도 복구 작업대 가림(11-12부터 있던 폰 가로 축소 배율 문제).
- 낡은 검증 스크립트 2개 정리.
- 코어 화면 1920 좌우 10.9% 여백(`classroom.css` 고정 폭 — 동시 작업 파일).
