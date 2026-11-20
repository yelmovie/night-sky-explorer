# 배포 검토 보고서 — 별빛 관측 연구소 (13 nightsky) · 최신 커밋 배포본 재점검

> 점검: 2026-11-20 09:55~13시 · 지침 `_shared/FINAL-RECHECK-20261120.md` 13번 줄 · 운영 https://night-sky-explorer.yelsam.workers.dev
> 기준 커밋: 시작 `c51614c`(Worker `542f0c4a`, `prodcmp` index·9파일 MATCH) → 점검 중 다른 세션이 `fd1f1a0`·`1580145`(시작 화면 제작·저작권 표기) 배포(`770cf321`, MATCH) → 이번 수정 `4148152` 배포 **Worker `98194bdd-e653-468a-bed2-e825ac57e6c8`**, `cmp.sh` 앱 JS·CSS·index MATCH.
> 지난 점검: `RELEASE-REVIEW-20261118.md`(11-20 01시 갱신, 문서 커밋 `5f261c4`, 84/100). 그 뒤 코드 커밋: `5e99d1c` 줄바꿈 균형, `71f332b` 잠긴 카드 문구, `2df4139` 소리 3차, `c51614c` s4a 카드 글 폭, `fd1f1a0`·`1580145` 제작 표기, `4148152` 이번 수정.
> 방법: 지난 판정을 옮기지 않고 이번에 운영 주소(일부는 같은 커밋 로컬)에서 실제로 돌린 것만 PASS로 적었다. 다시 못 본 것은 NOT TESTED. 로그·스크린숏: `.tmp/final-recheck-20261120/`.

## 최종 판정

**조건부 배포 가능**

- FAIL 0. 핵심 경로(B3·B9·B10·B14)는 운영 주소에서 다시 확인됨(완주 20단언, 새로고침 유지, 기록 안전 36장면×뷰포트).
- `NOT TESTED` 11개(A6·B13·B16·C9·C13·C19·C25·D9·D10·E6·G19) — 5개 이상이라 규칙상 조건부. A영역에 NOT TESTED(A6 난이도)·WARNING(A12 교사 검수)이 있어 `배포 가능`은 줄 수 없다.
- 이번에 고친 것: 힌트·연구 키트 창의 음성 상태 글 「소리를 켜면 들을 수 있어요.」 14px → 18px 이상(C20). 낡은 검사 스크립트 2개 갱신(E14 일부).

### 지난 점검 대비 달라진 판정

| 항목 | 11-20 01시 | 지금 | 이유 |
|---|---|---|---|
| C20 글자 하한 | PASS | WARNING | 팝업 음성 상태 글 14px는 `4148152`로 고침. 새로 들어온 홈 제작·저작권 표기(`1580145`) 11~13px가 남음 |
| E3 안 쓰는 import | PASS | WARNING | 이번에 정적 검색: 9개(`learning.js` 4, `application.js` 3, `moon-stages.js` 2) |
| E14 낡은 검사 | PASS | WARNING | `verify-stage-fit`·`verify-education`은 고쳐 통과, `verify-classroom`(열림 애니메이션 중 측정)·`verify-narration`(옛 배경음 0 규칙)·`verify-duck`(즉시 복귀 기대)는 아직 옛 기대값 |
| D13 애니메이션 정적 검색 | PASS | WARNING | `backdrop-filter` 19곳·filter 애니메이션 1곳, 실측 없음(규칙상 WARNING 상한) |
| D5 중복 asset | WARNING | PASS | 배포 폴더 해시 중복 0 |
| C7 세로 전환 | PASS(이전) | PASS | 375×812 홈·s1a 가로 넘침 없음(이번 실측) |
| A6·B13·C13·D10·E6 | PASS(이전 확인) | NOT TESTED | 이번에 다시 보지 않음(학생 관찰·브라우저 뒤로 가기·색약 대비·저사양 목록·하드코딩 검색) |

## 요약

| 영역 | PASS | WARNING | FAIL | NOT TESTED | N/A |
|---|---|---|---|---|---|
| A 교육적 품질 | 13 | 2 | 0 | 1 | 1 |
| B 기능 | 15 | 2 | 0 | 2 | 0 |
| C 태블릿·UI | 19 | 1 | 0 | 4 | 1 |
| D 성능 | 7 | 4 | 0 | 2 | 1 |
| E 코드 품질 | 7 | 3 | 0 | 1 | 2 |
| F 데이터·안전 | 13 | 1 | 0 | 0 | 1 |
| G 배포 | 17 | 0 | 0 | 1 | 2 |
| **합계** | 91 | 13 | 0 | 11 | 8 |

(G1–G4는 4행, F1·F2·F4–F7은 낱개로 셌다.)

## 실행 환경과 명령 (실측)

| 무엇 | 결과 |
|---|---|
| `git status` | 시작 때 깨끗(로컬 = `origin/main`). 점검 중 다른 세션의 `src/application.js`·`src/design-refresh.css` 미커밋을 보고 손대지 않음 → 그 세션이 `1580145`로 커밋·배포 |
| `npm test` | 159/159 통과(수정 전후 모두) |
| `npm run build` | 통과(`fc-build-1`, 2.0초). 운영과 같은 빌드는 `_scratch/deploy-20261118/wt/13`(해시 MATCH) |
| lint·typecheck | `package.json`에 없음 → NOT APPLICABLE |
| 운영 smoke(`smoke.mjs`) | 13/13: 첫 화면 1.29MB·요청 8개·개념영상 미리받기 0, 시작 버튼까지 1.05~1.63초, 1280·1920 × 8화면 18px 미만 0, s4a 가림판 탭·Enter, 팝업 닫기 1개·Esc, 결과 지도 버튼 1개·primary 1개, 새로고침 s3b 유지, 콘솔 오류 0 |
| 설정 창(`settings-live.mjs`) | 5/5: 위 X 없음, 닫기 1개, 「닫기」가 「연구 기록 초기화」 오른쪽, Esc로 닫힘 |
| `verify-playthrough` | 20단언 통과(인트로 1회, 다섯 기록·코어·인증서·새로고침, 키보드·터치 끌기, 연타 1회 저장) |
| `verify-record-safety` | 교사 격리·초기화 확인·손상/충돌 원본 보호, 36장면×뷰포트, 오류 0 |
| `verify-quest`·`verify-moon-path` | 통과(영상 건너뛰기·Esc, 동작 줄이기, WebGL 없음 대체, 옛 저장) |
| `verify-responsive` 44장면 × 1280·1024·1920·915 | 176건 지적 0 |
| `verify-responsive` 팝업(QA_EXTRAS) 13 × 4 | 52건 중 1건 5개 — 설정 창 1920에서 접힌 `details` 안 제목(오탐, 스크린숏 `extras/home-filled-round0-settings-1920x1080.png`에서 잘림·겹침 없음) |
| `verify-stage-fit`(목표 4크기) | 1280·1024·1920 지적 0(s4a 다시 돌림 포함). 915×412는 한 화면 계약(스크롤 없음) 기준으로 153건 — 폰 가로에서 도구 칸이 스크롤된다. 스크롤 접근을 보는 `verify-responsive` 915는 0 |
| 놀이 영역 비율(`measure.mjs`) | 11-18과 같음: 활동 1280 높이 79%·면적 77%, 1024 78.5%·76%, 1920 82.6%·81%(s5a 77.8%·76.6%), 지도 100%, 코어 1920 66%·빈 띠 10.9%, 결과 1920 빈 띠 14.6%. 활동 화면 primary 1개 |
| `verify-education` | 4단언 통과(10쪽 성취기준·개념·현재 조작 1개, 날짜 한 번 눌러 기록, 다음 자료 안내, 행성 조사 완료·새로고침) — 옛 「날짜 고르고 따로 기록」 흐름을 기대하던 스크립트를 지금 흐름에 맞춰 고침 |
| 소리 3차(`verify3.mjs`, 운영) | 44 중 43 통과. 남은 1개(개념영상 자막 음성 중 영상 0.3)는 영상이 아직 재생 전(t=0)인 표본 2개가 0.355·0.311 — 재생 중(t>0) 표본은 모두 0.3, 자막 음성 끝나면 1로 복귀·0.2초 전환 통과. 들리는 결함 아님 |
| 첫 입력 전 재생(`first-input.mjs`, 운영) | 처음·홈·지도 모두 입력 전 재생 시도 0, 첫 입력 뒤 배경음 재생 |
| 소리 1·2차 회귀(`verify2`, `verify-duck`, 운영) | 발자국 간격 280~320ms·두 파일 번갈아·손 떼면 그침·효과음 끄면 0·달빛 길 통과. 실패 3개는 11-20 소리 3차 운영 회귀(`reg-prod-v2`·`reg-prod-duck`)와 같은 결과: 걷기 시작 첫 두 발자국이 약 130ms 간격(아래 B19 참고), 줄임이 즉시가 아니라 0.2~0.6초에 걸쳐 바뀌는 것(현재 규칙)을 옛 검사가 즉시로 기대 |

## A. 교육적 품질

| # | 판정 | 증거 | 근거 |
|---|---|---|---|
| A1 | PASS | 확인됨 | `verify-education` 10쪽 성취기준 표시 + `curriculum.test.js` |
| A2 | PASS | 확인됨 | `curriculum.test.js`(성취기준 코드) |
| A3 | PASS | 확인됨 | 완주: 관찰 → 예상 → 비교(처음 예상 보존) → 근거 |
| A4 | PASS | 확인됨 | 완주: s4b 근거 입력, s2b 예상·비교 |
| A5 | PASS | 확인됨 | 완주: 행성 특징 오답 수정 가능, 잘못된 주장 뒤 바로잡기 |
| A6 | NOT TESTED | — | 학생 관찰 없이 난이도를 다시 판단하지 않음 |
| A7 | PASS | 확인됨 | 성취 카드·복구가 실제 기록에 붙음(완주) |
| A8 | PASS | 확인됨 | 「rapid reason input」 단언 |
| A9 | PASS | 확인됨 | 힌트 창 스크린숏: 다음 조작 위치 안내(정답 노출 없음) |
| A10 | PASS | 확인됨 | 오답 뒤 같은 화면 유지(완주) |
| A11 | PASS | 확인됨 | `curriculum.test.js` |
| A12 | WARNING | — | 교사 현장 검수 전 |
| A13 | NOT APPLICABLE | — | 사회·다문화 소재 없음 |
| A14 | PASS | 확인됨 | 「반사는 빛이 물체에 닿아 되돌아오는 거예요.」 등 쉬운 정의(s4a 스크린숏) |
| A15 | PASS | 확인됨(코드 읽기) | 오답 문구 「자료와 다시 비교해 봐」 등 탓하지 않는 어조 |
| A16 | PASS | 확인됨 | 끌기(터치 포함)·키보드 배치·다이얼 돌리기·별 잇기·가림판 탭 |
| A17 | WARNING | 추정 | 5단원이 쉬운 편(관찰 6개) — 내용 판단이라 그대로 |

## B. 기능

| # | 판정 | 증거 | 근거 |
|---|---|---|---|
| B1 | PASS | 확인됨 | 완주·smoke 시작 버튼 |
| B2 | PASS | 확인됨 | 힌트 창 닫기 1개·Esc(smoke) |
| B3 | PASS | 확인됨 | 완주 5단계 |
| B4 | PASS | 확인됨 | 정답 기록 1회 저장·진행 |
| B5 | PASS | 확인됨 | 오답 수정 가능 |
| B6 | PASS | 확인됨 | 활동 안에서 다시 고르기 |
| B7 | PASS | 확인됨 | 다섯 기록 진행도 |
| B8 | PASS | 확인됨 | 보상·성취 카드 |
| B9 | PASS | 확인됨 | 「Partial observations survive reload」 |
| B10 | PASS | 확인됨 | 이어 하기 |
| B11 | PASS | 확인됨 | 초기화 확인 단계(record-safety) |
| B12 | PASS | 확인됨 | 인증서(완주·quest) |
| B13 | NOT TESTED | — | 브라우저 뒤로 가기는 이번에 따로 밟지 않음 |
| B14 | PASS | 확인됨 | 운영 smoke 새로고침 s3b 유지 |
| B15 | WARNING | 확인됨 | 비활성 「다음 활동으로」 옆 이유 문구 없음(위 지시가 대신) — 11-17 결정 유지 |
| B16 | NOT TESTED | — | 실제 학생 40분 수업 |
| B17 | PASS | 확인됨 | 「records once」 단언 |
| B18 | PASS | 확인됨 | 조작·피드백 동기(완주) |
| B19 | WARNING | 확인됨 | 지도 걷기를 다시 시작할 때 첫 두 발자국이 약 130ms 간격(이후 300ms). 운영·로컬 모두 재현, 11-20 소리 3차 회귀와 같음. 원인을 확정하지 못해 고치지 않음(`world.js` 걸음 박자 보정 가설은 로컬 검증에서 틀려 되돌림). 가림판 실물 손가락 떨림도 미확인 |

## C. 태블릿·UI

| # | 판정 | 증거 | 근거 |
|---|---|---|---|
| C1 | PASS | 확인됨 | 1280×800 놀이 영역 높이 79%·면적 77% |
| C2 | PASS | 확인됨 | 1024×768 78.5%·76% |
| C3 | PASS | 확인됨 | 4크기 스윕 small-touch-control 0(스크롤 칸 안은 보이게 한 뒤 측정) |
| C4 | PASS | 확인됨 | covered-control 0(4크기) |
| C5 | PASS | 확인됨 | clipped-text 0(4크기, 팝업 오탐 5건 제외 — 위 표) |
| C6 | PASS | 확인됨 | 화면 밖 조작 0 |
| C7 | PASS | 확인됨 | 375×812 홈·s1a 가로 넘침 없음, 막지 않고 세로 배치 |
| C8 | PASS | 확인됨 | 동작 줄이기로 장면 진행(quest), 지도 걷기 프레임 OS 설정 반영(코드) |
| C9 | NOT TESTED | — | 전 화면 정밀 대비 |
| C10 | PASS | 확인됨 | 헤더 소리 버튼: 셋 다 꺼짐 → 「소리 켜기」, 다시 누르면 전체 끔(소리 3차) |
| C11 | PASS | 확인됨 | 가림판 Enter·초점 유지, 키보드 배치(완주) |
| C12 | PASS | 확인됨 | 정보 팝업 아래 닫기 하나, 설정 창 X 없음 |
| C13 | NOT TESTED | — | 색 단독 구분 이번에 다시 보지 않음 |
| C14 | PASS | 확인됨 | 조사 단위 테스트(`progression`·`state`·`upgrade`) 통과 |
| C15 | PASS | 확인됨 | 스크린숏 범위에서 버튼 이모지 없음(✓ 기호만) |
| C16 | PASS | 확인됨 | 915×412 활동 제목 한 줄(힌트 스크린숏), 겹침 0 |
| C17 | PASS | 확인됨 | horizontal-overflow 0 |
| C18 | PASS | 확인됨 | 팝업 닫는 길 아래 닫기 + Esc, 설정 창 가운데(1280에서 위아래 여백 24px, 6화면) |
| C19 | NOT TESTED | — | 실기 가장자리 제스처 |
| C20 | WARNING | 확인됨 | 팝업 안 음성 상태 글 14px는 이번에 18px+로 고침(`4148152`, 운영 확인). 남은 것: 다른 세션이 `1580145`로 넣은 홈 오른쪽 아래 제작·저작권 표기 「기획·제작: 옐샘 & ⓒ 아이스크림미디어」가 1280에서 11px, 1920에서 13px — 16곳 공통 표기라 이 프로젝트만 바꾸지 않고 보고 |
| C21 | PASS | 확인됨 | 줄바꿈 균형: 4크기 clipped-text 0, s4a 토성 카드 외톨이 줄 없음(1024), 잠긴 카드 「악당을 / 물리치면 / 열려요」 |
| C22 | NOT APPLICABLE | — | Phaser 없음 |
| C23 | PASS | 확인됨 | 활동·결과 primary 1개(smoke·measure) |
| C24 | PASS | 추정(코드) | 지도 걷기 프레임 `stillFrames`(앱 설정 + OS 동작 줄이기) |
| C25 | NOT TESTED | — | 텍스트 200% |

## D. 성능

| # | 판정 | 증거 | 근거 |
|---|---|---|---|
| D1 | PASS | 확인됨 | 운영 새 브라우저 3회: 시작 버튼까지 1.05~1.63초, 첫 화면 1.29MB |
| D2 | PASS | 확인됨 | 1MB 넘는 PNG 원본은 업로드 제외(운영 404), 쓰는 WebP만 |
| D3 | WARNING | 확인됨 | 개념영상 `assets/concepts` 8.3MB(누를 때만 받음, 첫 화면 0) |
| D4 | NOT APPLICABLE | — | GLB 없음 |
| D5 | PASS | 확인됨 | 배포 폴더 해시 중복 0 |
| D6 | WARNING | 추정 | 참조 안 되는 파일 전수 검색은 안 함(알려진 원본 PNG·Jua는 업로드 제외) |
| D7 | PASS | 확인됨 | 실행 의존성 `three` 하나 |
| D8 | PASS | 추정(코드) | 리스너 정리 `AbortController`/`signal`(`application.js` 14·`world.js` 8곳) |
| D9 | NOT TESTED | — | 학교 기기 FPS |
| D10 | NOT TESTED | — | 저사양 위험 목록 이번에 다시 정리 안 함 |
| D11 | WARNING | 확인됨 | 서비스워커 없음 → 오프라인 재방문 안 됨 |
| D12 | PASS | 확인됨 | 런타임 외부 요청 없음(외부 주소는 교육부·경기도 안내 링크뿐) |
| D13 | WARNING | 추정 | `backdrop-filter` 19곳, filter 애니메이션 1곳(실측 없음) |
| D14 | PASS | 확인됨 | 글꼴 나눔스퀘어 네오 2개 772KB, `font-display: swap` |

## E. 코드 품질

| # | 판정 | 근거 |
|---|---|---|
| E1·E2 | WARNING | 큰 CSS 층(`styles.css` 3201줄, polish·flow-refresh·design-refresh). `observation-player.js`는 테스트만 씀 |
| E3 | WARNING | 안 쓰는 import 9개(정적 검색) |
| E4 | NOT APPLICABLE | JS |
| E5 | PASS | smoke·완주·소리 점검 중 콘솔·페이지 오류 0 |
| E6 | NOT TESTED | 하드코딩 검색 안 함 |
| E7 | PASS | 깨진 그림 0(스윕), 운영 404 없음(smoke) |
| E8 | PASS | 운영(대소문자 구분 정적 서버)에서 전 화면 로드 |
| E9 | PASS | 번들·소스에 비밀값 패턴 없음 |
| E10 | PASS | `package-lock.json` 하나 |
| E11 | PASS | 빌드 통과 |
| E12 | PASS | 159/159 |
| E13 | NOT APPLICABLE | EventBus 없음 |
| E14 | WARNING | 위 「달라진 판정」 표 |

## F. 데이터·안전

| # | 판정 | 근거 |
|---|---|---|
| F1·F2 | PASS | 별명(선택)만 저장, 인증서 학년·반·이름은 저장 안 함(record-safety) |
| F3 | PASS | 외부 전송 없음(소스 검색) |
| F4–F7 | PASS | `starlight-lab:v1`, `version: 2`, v1 이전 읽기(`state.js`), 키 충돌 없음 |
| F8 | PASS | 초기화 확인 + 복구용 보관(record-safety) |
| F9 | PASS | 외부 링크는 교육부·경기도 안내 |
| F10 | PASS | `CREDITS.md`: 그림은 생성 도구·코드 제작 기록, 교과서·상용 그림 없음 |
| F11 | PASS | 나눔스퀘어 네오 OFL 원문 동봉(`font-assets.test.js`) |
| F12 | WARNING | 사용자 제공 원본 그림 외부 배포 증빙(문서 확인 항목) |
| F13 | NOT APPLICABLE | 키 없음 |
| F14·F15 | PASS | 손상·충돌 원본 보호(record-safety) |

## G. 배포

| # | 판정 | 근거 |
|---|---|---|
| G1–G4 | PASS | Worker assets, 루트 경로, `deploy.sh`로 `origin/main` 빌드 |
| G5 | NOT APPLICABLE | 환경변수 없음 |
| G6 | PASS | `not_found_handling: none`, 앱은 한 주소(모르는 경로 404 정상) |
| G7 | PASS | `og.jpg` 200(131KB) |
| G8 | PASS | 제목·description |
| G9 | PASS | `favicon.svg` 200 |
| G10 | PASS | `prodcmp`·`cmp.sh` MATCH |
| G11 | PASS | 운영 smoke: 수정 전 13/13, 수정 뒤 12/13(남은 1개는 C20 제작 표기 글자 크기) |
| G12 | PASS | 로그인 없음 |
| G13 | PASS | 다른 세션 미커밋(`application.js`·`design-refresh.css`, 그 뒤 `1580145`) 섞지 않고 경로 지정 커밋 |
| G14 | PASS | README 명령(dev·build·preview·concepts:render) = scripts |
| G15·G16 | PASS | `.assetsignore`(원본 PNG·Jua·`._*`), `docs`·`references` 배포 제외 |
| G17 | NOT APPLICABLE | 미리보기 주소 없음 |
| G18 | PASS | 카톡 썸네일 `og.jpg` |
| G19 | NOT TESTED | 인증서 실물 인쇄 |
| G20 | PASS | 롤백 대상: 직전 운영 Worker `770cf321`(`1580145`) |

## 이번에 고친 것

| 커밋 | 내용 | 확인 |
|---|---|---|
| `4148152` | 힌트·연구 키트 창 음성 상태 글 14px → `--classroom-small`(18px+). `verify-stage-fit`(s4 탭 없음·SVG 가림판 탭·입체 보기 뒤 확대), `verify-education`(날짜 한 번 눌러 기록) 갱신 | 테스트 159/159, 로컬 팝업 4크기 지적 0(오탐 5 제외)·915/1024 스크린숏 한 줄, 배포 `98194bdd` cmp MATCH, 운영 재확인 아래 |

## 운영 재확인 (`98194bdd` 배포 뒤)

수정 배포(`98194bdd`) 뒤 같은 운영 주소에서 다시 돌렸다(`fc-browser-3`).

| 무엇 | 결과 |
|---|---|
| 팝업 글자 18px 미만(힌트·설정·연구 키트) | 0 — 음성 상태 글 수정 반영 |
| 운영 smoke | 12/13. 실패 1개: 홈 제작·저작권 표기 1280 11px·1920 13px(다른 세션 `1580145`, C20 WARNING). 나머지(첫 화면 용량·로딩, 가림판, 팝업 닫기, 결과 버튼, 새로고침, 콘솔 오류 0) 통과 |
| 설정 창 | 5/5, 6화면에서 가운데(위아래 24px) |
| `verify-responsive` 홈·지도·s1a·s4a × 4크기 | 40건 지적 0 |
| 팝업 스윕(홈·지도·s1a) × 4크기 | 36건 중 1건 5개 — 설정 창 접힌 제목 오탐(위와 같음) |
| 세로 375×812 | 홈·s1a 가로 넘침 없음 |

## 미검증·남은 것

- 실기기: 학교 태블릿 손가락 터치(가림판), 가장자리 제스처, FPS, 인증서 인쇄, 40분 수업, 교사 검수.
- 걷기 시작 첫 두 발자국 간격(B19): 원인 미확정이라 그대로. 다음 손볼 때 `world.js` 다시 마운트·`onStep` 호출 위치부터 본다.
- 안 쓰는 import 9개, 낡은 검사 3개(`verify-classroom`·`verify-narration`·`verify-duck`), 큰 CSS 층, 서비스워커 없음, 개념영상 용량.
- 홈 제작·저작권 표기 11~13px(C20): 16곳 공통 결정이라 표기 크기는 그 작업에서 함께 정할 일.
- 성취 카드 보관함 잠긴 카드 글(「악당을 물리치면 열려요」)은 공용 카드 부품(`reward-cards.css`)의 작은 글씨로 보임 — 이번에 크기를 재지 못했고, 공용 부품이라 고치지 않음.
