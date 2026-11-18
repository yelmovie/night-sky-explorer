# 별빛 관측 연구소

관찰·예상·비교·수정으로 다섯 기록을 만들고 연구소를 복구하는 교육게임이야. 기존 실행 가능한 MVP의 **v2 고도화 기준**은 [UPGRADE_SPEC](docs/UPGRADE_SPEC.md)·[PRD v2](docs/PRD.md)·[TRD v2](docs/TRD.md)야. 실제 통과는 [검증 기록](docs/VALIDATION.md)에서 확인해 줘. 아래 목표 목록을 검증 완료로 읽으면 안 돼.

## 실행

macOS에서는 외장 SSD의 프로젝트에서 실행해. Node.js 20.19+ 또는 22.12+를 사용하고, 임시 폴더와 npm 캐시도 쓰기 가능한 외장 SSD에 지정해.

```sh
export TMPDIR="/Volumes/T7 Shield/DevTemp"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export npm_config_cache="/Volumes/T7 Shield/DevTemp/npm-cache"
npm ci
npm run dev
```

`npm run build`는 현재 프로젝트의 `dist/`를 만들고 `npm run preview`로 확인해. 설치·빌드 전에 SSD가 연결됐는지 확인해. 아래 Windows 예시는 Windows 전용이야.

Windows에서 `start.cmd`를 실행한 뒤 [연구소 열기](http://localhost:5183/)로 접속해. 프로젝트에서 Vite를 실행하며 TEMP/TMP는 `D:\DevTemp`, npm 캐시는 프로젝트 `.cache/npm`으로 지정돼. Node.js 20.19+ 또는 22.12+가 필요해.

```powershell
$env:TEMP='D:/DevTemp'
$env:TMP='D:/DevTemp'
$env:npm_config_cache='D:/iscreammedia_sc34/13 nightsky/.cache/npm'
npm install
npm run dev
```

D: 임시 폴더 존재·쓰기 권한을 먼저 확인해. 결과·다운로드·생성 원본·캐시·임시는 D:에 유지해. 5183포트를 사용 중이면 기존 연구소 서버를 확인해 종료한 뒤 실행해. 파일을 더블클릭하지 말고 웹서버로 열어 줘.

| 명령 | 결과 |
|---|---|
| `npm test` | 상태·완료·저장 관련 테스트 |
| `npm run build` | 현재 프로젝트 `dist/`에 정적 빌드 |
| `npm run preview` | [빌드 미리보기](http://localhost:4173/) |

## v2 범위

출발 → 학생 연구원과 달토끼가 길을 걷는 지도 → 5장×2학습 → 실제 결과5개 → 중앙 코어 → 개인 결과야. 지도만 사선2.5D 픽셀 RPG, 메인·시설 내부·결과는2D야. 3장 기본은8행성 그림이며 선택 도구에서만 실제3D를 열어.

| 장 | v2 필수 활동 |
|---|---|
| 달 | 다른 배율 사진2 + 두 비교 카드마다 표면2곳·설명 |
| 달 변화 | 전반·후반6시점 + 14/24일 각각 예상·공개·겹침·수정·설명 |
| 행성 | 지정6행성 조사 + 태양/8행성 순서·암석/가스/얼음 묶기 |
| 별·행성 | 8자료 비교 + 8천체 주장·빛의 근원 근거 연결 |
| 별 배열 | 두 영역6별 + 영역별 자유2선 이상·기준 비교·설명 |

한 번에 한 과제를 안내하고 장마다 선택 도전 하나를 더해. 시설·길·표식은 실제 기록·비교·도전에 연결하고 속도·클릭량으로 주지 않아. 공통 UI는 그림 위 왼쪽 위 홈·이전, 오른쪽 위 소리·설정 네 아이콘이야.

설정은 BGM·효과음·BGM음량 → 이야기 → 완료 후 엔딩·인증서 → 앱정보 → 학생 → 교사 → 저작권/출처 → 확인초기화·닫기야. 교사 가이드의 **관리자 전체 해금 하나**는 접근만 열고 실제 완료·보상·인증서를 만들지 않아. 예시는 메모리에만 둬.

## 기록·확인 범위

별명·활동은 현재 브라우저에만 저장해. `localhost`/`127.0.0.1`과 서로 다른 포트는 저장 공간이 달라. 브라우저 데이터를 지우면 기록도 사라져. 저장 거부 시 경고하고 세션을 유지하도록 설계해.

기존 v1 저장 키는 `starlight-lab:v1`이야. **이관은 기존 원본·증거를 보존하고 새 과제를 임의 완료시키지 않는 계약**으로 구현·검증해야 해. 실제 이관·전체 흐름·태블릿·소리·이미지 통과는 검증 문서 최신 결과가 기준이야. 실행하지 않은 항목을 완료로 표시하지 않아.

새13이미지와 Jua self-host는 v2 계획이야. 실제 생성·적용·권리는 [CREDITS](public/assets/CREDITS.md)에 기록해. 기존 사용자 AI이미지 외부 배포권과 AI요금제 상업 조건은 확인이 필요해. 외부 공개 배포는 범위 밖이야.

## 2026-10-22 학습 경험 개선

실행 진입점은 `src/application.js`이며 기존 `learning.js`·`world.js`의 v2 활동을 연결했어. 루미가 사람 연구원을 따라 걷고, 각 활동에서 진행 상황과 단계별 힌트를 제공해. 태블릿에서는 망원경 드래그·시간 재생·행성/이름표 끌어놓기·별 선긋기와 버튼 조작을 함께 사용할 수 있어.

각 관측 완료 창의 **개념영상 16초 보기 (선택)**에서 관련 영상을 열어. 설정의 **완료한 개념영상 모아 보기**와 연구 노트에서도 다시 볼 수 있어. 다섯 편 모두 MP4·WebM·끝 장면 포스터를 로컬에 포함했으며 영상이 안 열리면 그림과 자막으로 대체해. 영상 중에는 배경 음악을 1/4로 줄여.

배경 음악은 사용자가 Suno로 만든 2곡이야. `public/assets/audio/bgm/main-theme.mp3`는 시작 화면 첫 탭부터 홈·지도·활동 내내 반복하고, `final-theme.mp3`는 엔딩·인증서 화면과 지도 악당을 모두 물리친 뒤 열리는 지도 피날레 창(영상은 무음)에서 한 번 나와. 인물 목소리·내레이션·개념영상 중에는 1/4로 줄어. 원본은 `references/suno`(Git 미포함), 상업 이용 근거(생성 당시 Suno 유료 요금제)는 확인이 필요해.

`RENDER_DIR=<외장 SSD 폴더> npm run concepts:render`로 영상을 다시 만들 수 있어(HyperFrames CLI·FFmpeg 필요, 원본은 `films/`). 효과음 설정이 켜져 있을 때만 영상 효과음이 나와. [영상 설계](docs/CONCEPT_STORYBOARD.md) · [검증 기록](docs/VALIDATION.md) · [효과음 CC0 원문](public/assets/audio/Kenney-CC0.txt).

## 2026-10-30 심화 설계 v2 퀘스트 흐름

[심화 통합 설계 v2](references/documents/별빛_관측_연구소_심화_통합_설계_v2.md)에 맞춰 10개 학습 화면은 그대로 두고 **사건 도입 → 미션별 EVIDENCE·연구소 변화 → 연구 키트 → 최종 보고서 → 최종 미션(채널 연결 + 손으로 돌리는 보정 링) → 엔딩 영상 → 별빛 관측 연구원 인증서 → 보너스 퀘스트**를 더했어. 인증서의 학년·반·번호·이름은 출력 직전에만 적고 저장하지 않아. 자세한 변경과 검증은 [검증 기록](docs/VALIDATION.md) 맨 위 항목에 있어.

브라우저 검증 스크립트는 `PLAYWRIGHT_MODULE`(playwright-core `index.mjs`), `BROWSER_EXECUTABLE`(Chrome/Edge 실행 파일), `TEST_URL`을 지정해 실행해. `scripts/verify-playthrough.mjs`(실제 조작 완주), `scripts/verify-quest.mjs`(보너스·엔딩), `scripts/shot-scenes.mjs`(화면 캡처, `TEST_SIZES=1280x800,1024x600`)가 있어.

## 2026-11-17 선택 보너스 「달빛 길 따라가기」

코어 복구 뒤의 선택 보너스가 세 개가 됐어. 세 번째는 루미가 밤 언덕길을 달리며 3→7→10→17→21→25일째 달이 걸린 문을 차례로 지나는 3D 달리기야(`src/moon-path.js` 규칙, `src/moon-run-stage.js` 무대, `src/moon-path-ui.js` 화면). 문의 달은 기존 `phase()`·`moonSVG()`로 그리고, 미션 완료와 인증서 조건은 바꾸지 않아. 3D가 안 되는 기기와 동작 줄이기 설정에서는 같은 규칙의 달 카드 고르기로 진행해. 계획과 구현 결과는 [달리기 스테이지 문서](docs/RUN-STAGE-3D-PLAN-20261117.md)에 있어. `scripts/verify-moon-path.mjs`가 키보드와 화면 버튼으로 끝까지 달려 확인해.

## 2026-11-18 성취 카드

지도 악당(별빛 가림이)을 세 번 맞혀 물리치면 퇴장 대사가 끝난 뒤 화면 가운데로 카드가 돌며 나타나고(목소리 중에는 효과음이 나지 않아서 기다려), 「카드 보관함에 넣기」를 누르면 지도 오른쪽 위 소리 버튼 앞 5칸으로 들어가. 시설 순서대로 별 1~5개(브론즈·실버·골드·홀로·레전드)이고 5장을 모으면 「컬렉션 완성!」, 칸을 누르면 보관함이 열려. 보유 여부는 기존 격퇴 기록(`mapHits`의 3)에서 계산해서 저장 필드는 그대로야. 그래서 이미 물리친 악당의 카드는 처음부터 채워져 보이고 연출은 다시 나오지 않아.

카드가 열린 동안 `#app`이 inert라 지도·악당·이동(키보드 포함)이 멈추고, 다섯 악당 피날레 창은 카드를 닫은 뒤에 기존 조건 그대로 열려(새 피날레 경로는 없어). 마지막 악당의 카드가 목소리나 설정창 때문에 늦어져도 카드가 먼저 나오도록, 악당의 말풍선이 사라진 때부터 카드가 칸에 들어갈 때까지는 악당 모듈의 `blocked()`가 참이야(`src/world.js`의 `rewardCardDue()`). 마지막 악당의 격퇴 차임은 카드의 완성 징글이 대신하고, 피날레 곡이 시작되면 징글은 멈춰.

공통 모듈 `src/reward-cards.js`·`src/reward-cards.css`는 `../_shared/reward-cards`의 복사본이라 고치지 않아. 이 프로젝트의 설정·연결은 `src/map-reward-cards.js`(카드 이름·보유 계산·띄우는 시점)에 있고 지도 화면 묶음(`src/map-screen.js`)과 함께 불러와. 그림은 `public/assets/reward-cards/`, 효과음은 `public/assets/audio/sfx/`의 5개(`src/sound.js`의 `card…` 항목), 출처는 [CREDITS](public/assets/CREDITS.md)에 있어.

## 2026-11-18 놀이 화면 비율·중복 버튼 정리

놀이 영역 비율을 세 해상도로 쟀더니 활동 10개(1280×800 높이 79%·면적 77%, 1920×1080 82.6%·81%)와 지도(100%)는 이미 기준(높이 70%·면적 55% 이상)을 넘어서 배치는 그대로 뒀어. 대신 같은 일을 하는 조작을 정리했어. s4a 빛 실험의 「태양빛 가리기」 버튼을 없애고 가림판 자체를 누르거나 끌거나 Enter/Space로 켜고 끄게 했고, 결과 화면 맨 아래 「탐구 지도로」(위쪽 「다시 관측하기」와 같은 동작)를 뺐고, 아래에 닫기 버튼이 있는 정보 팝업은 머리의 X를 빼서 닫는 길을 하나로 했어(개념영상·달빛 길·엔딩은 X 유지, Esc는 그대로). 진단·수치는 [LAYOUT-BALANCE-20261118](docs/LAYOUT-BALANCE-20261118.md), 최종 점검은 [RELEASE-REVIEW-20261118](docs/reviews/RELEASE-REVIEW-20261118.md)·[SCORE-20261118](docs/reviews/SCORE-20261118.md).

**운영 배포 대기(2026-11-19 02시):** 커밋 `6dfd553`은 main에 푸시됐지만 운영은 아직 `e876efe`야. 그날 밤 SSD에서 `access()` 호출이 멈춰 git·빌드(esbuild)가 돌지 않아서 GitHub API로 푸시만 했어. SSD가 풀리면 `git fetch` 뒤 `git reset origin/main`(작업 트리 보존)으로 로컬을 맞추고, `_scratch/deploy-20261118/deploy.sh 13 "13 nightsky" worker-own night-sky-explorer` → `cmp.sh 13 https://night-sky-explorer.yelsam.workers.dev 'data-shield'`로 반영을 확인해.

## 문서·원본

- [디자인 기준](docs/DESIGN.md) · [공통 SVG아이콘](docs/icon-prompts.md)
- [과학 출처](docs/SOURCES.md) · [초기 3D행성 프롬프트](docs/3D_ASSET_PROMPTS.md)
- [기존 장별 시나리오](docs/SCENARIO_DISCUSSION.md): v2 활동 수는 PRD를 우선해.
- [참고자료 안내](references/README.md) · [원본48개 경로/SHA256](references/manifest.json)
- [삭제 검토 후보](_unused/DELETE-CANDIDATES.md): 실제 삭제·이동은 하지 않았어.

제공 PRD/TRD·ZIP·시안을 references에 보존해. 새 생성 원본은 `references/generated`, 서비스 파일은 `public/assets/generated`야. 과학 좌표·위상·글자·UI는 코드로 표시하고 그림을 실제 관측사진으로 소개하지 않아.
