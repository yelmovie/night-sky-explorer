# 별빛 관측 연구소 MVP 인계

## 2026-11-18 성취 카드(지도 악당 격퇴 보상) — 완료

지도 악당(별빛 가림이)을 세 번 맞혀 물리치면 성취 카드가 화면 가운데로 돌며 나타나고, 「카드 보관함에 넣기」를 누르면 지도 오른쪽 위 소리 버튼 앞 5칸으로 들어간다. 5장을 모으면 「컬렉션 완성!」, 칸을 누르면 보관함이 열린다. 공통 지침은 `../_shared/reward-cards/INTEGRATION.md`.

- **파일**: 공통 모듈 `src/reward-cards.js`·`src/reward-cards.css`(`../_shared/reward-cards` 복사본, 고치지 않는다), 이 프로젝트의 연결 `src/map-reward-cards.js`(카드 이름·보유 계산·띄우는 시점), 지도 묶음에 싣는 `src/map-screen.js`, 호출부 `src/world.js`(`onMapHits`, `blocked`, inert 대기)·`src/application.js`(`controls()`의 칸, `awardRewardCards`), 소리 `src/sound.js`(`mapCues`의 `card…` 5개, `stopCues`), 좁은 폰 헤더 `src/responsive.css`, 테스트 `tests/map-reward-cards.test.js`.
- **저장**: 새 필드 없음. `mapHits[id] === 3`에서 보유를 계산한다(id는 장 번호 `'1'`~`'5'`).
- **순서**: 카드는 악당의 퇴장(0.76초)과 퇴장 대사 음성이 끝난 뒤에 뜬다(목소리 중에는 효과음이 나지 않기 때문, 최대 8초 대기). 그 사이 지도를 떠나면 연출 없이 칸만 채워진다. 카드가 열린 동안 `#app`이 inert라 지도·악당·이동이 멈춘다. 다섯 악당 피날레는 기존 발동 조건 그대로이고(새 경로 없음), 마지막 카드가 기다리는 동안에는 `rewardCardDue()`가 악당 모듈의 `blocked()`를 참으로 만들어 카드를 닫은 뒤에 열린다. 마지막 악당의 격퇴 차임은 카드 완성 징글이 대신하고, 피날레 창이 열리면 징글을 끊는다.
- **확인한 것**: `npm test` 144개 통과, `npm run build` 통과. 빌드본을 시스템 Chrome(헤드리스, 1280×800)으로 열어 1·2타 저장, 접촉 반응, 3타 뒤 카드 → 칸 채움 → 새로고침 뒤 유지·재등장 없음, 카드가 열린 동안 방향키·WASD·포인터로 지도가 움직이지 않음, 5/5 축하 뒤에만 피날레, 마지막 3타 직후 설정창을 열었다 닫아도 카드가 먼저, 1024×768 헤더 한 줄, 폰 세로(360·390)에서 칸이 둘째 줄로 내려감, 동작 줄이기, 콘솔 오류 없음을 확인했다. 스크린샷·스크립트는 `.tmp/reward-cards/`(Git 미포함).
- **운영 배포(2026-11-18)**: 커밋 `0b92ae6`(`main` 푸시됨), Cloudflare Worker `night-sky-explorer` 버전 `078697f5-654f-4665-ac8f-bc907be8b85c`. 운영 주소 https://night-sky-explorer.yelsam.workers.dev/ 에서 `assets/reward-cards/card-5-5.webp`(`829ee639…`)·`thumb-1-1.webp`·`assets/audio/sfx/victory-jingle-01.mp3`(`0c28c5d2…`)·`assets/index-DSSIsDuf.js`(`670045fd…`)·`assets/map-screen-CIn5L5Tl.js`(`f16be135…`)의 SHA-256이 배포 빌드와 같았고, 운영 주소에서도 3타 → 카드 → 칸 → 새로고침 유지와 「마지막 3타 직후 설정창」 순서를 헤드리스 Chrome으로 다시 통과했다.
- **확인하지 못한 것**: 실제 기기에서 소리를 귀로 듣는 확인(헤드리스에서는 어떤 효과음 파일이 재생됐는지만 확인했다), 실제 태블릿 터치.
- **공통 모듈에서 본 것(고치지 않음)**: 보관함에서 카드를 크게 본 뒤 Esc로 닫으면 포커스가 보관함 밖으로 나가, Esc를 한 번 더 눌러도 보관함이 닫히지 않는다(✕ 버튼이나 바깥 누르기는 된다).

## 2026-11-17 선택 보너스 「달빛 길 따라가기」(3D 달리기) — 완료

**2차(그림 고도화)까지 끝나 운영에 있다.** 커밋 `bd1736d`, Worker 버전 `29ec50ce-e455-408d-a67c-c2291507340e`. 그림 9장 적용, 시작 카드는 16:9 그림 전체 표시, 첫 시작 카드 그림은 하늘에 별이 있어 다시 만들었다. `npm test` 137개·`npm run build`·`verify-quest.mjs`·`verify-moon-path.mjs`(빌드 미리보기와 운영 주소) 통과, 운영 파일 해시가 로컬 빌드와 같다. 이 프로젝트의 내장 임시 원본은 남아 있지 않다. 자세한 결과는 [계획 문서](docs/RUN-STAGE-3D-PLAN-20261117.md) 끝 「구현 결과」에 있다. 남은 것은 실물 태블릿 성능·학생 사용 확인뿐이다. 아래는 2차 시작 전 인계 내용(기록용)이다.

새 세션이 이어서 할 일은 **그림 고도화 2차를 마무리해 커밋·배포하고 「구현 결과」를 기록하는 것**이다. 1차 버전은 이미 운영에 있다. 계획과 확정 내용은 [달리기 스테이지 문서](docs/RUN-STAGE-3D-PLAN-20261117.md), 공통 순서는 `../_shared/RUN-STAGE-3D-IMPLEMENT-GUIDE-20261117.md`에 있다.

### 완료한 작업

- 세 번째 선택 보너스 「달빛 길 따라가기」를 넣었다. 루미가 밤 언덕길을 달리며 3→7→10→17→21→25일째 달이 걸린 문을 차례로 지난다. 문의 달은 `phase()`·`moonSVG()`로 그리고, 판정은 `judgeDoor()`(`src/moon-path.js`)만 한다.
- 완료는 `state.bonus.path = "done"`으로 남는다. 저장 키(`starlight-lab:v1`)와 미션 완료 조건은 그대로다. `path` 키가 없는 옛 저장도 열린다.
- WebGL이 안 되는 기기, 동작 줄이기 설정, 같은 문에서 세 번 막힌 경우에는 같은 규칙의 달 카드 고르기로 진행한다.
- **1차 배포 완료**: 커밋 `6926e6b`(`main` 푸시됨), Cloudflare Worker `night-sky-explorer` 버전 `d6bb8ba9-5637-4130-bc08-29cfae577f50`. 운영 주소에서 `scripts/verify-moon-path.mjs` 다섯 항목이 통과했고 `index-DLWffUZC.js`·`moon-run-stage-DWidAswG.js`의 해시가 로컬 빌드와 같았다.
- 화면 점검에서 고친 것(1차 커밋에 들어 있음): 도착 화면 달이 모두 보름달로 보이던 문제(SVG id 중복), 점프가 디딤돌을 넘어가던 문제(공중 최고 속도 고정, 점프 거리 2.5m), 지나온 문이 루미를 가리던 문제(문 전체 투명 처리), 다음 문의 달이 미리 겹쳐 보이던 문제, 개울 위 그림자, 폰 가로 화면 배치.

### 지금 작업 트리에 있는 것 (커밋 전)

사용자 요청(2026-11-17): "GPT 이미지 생성을 연결해 구현한 화면을 고도화, 배경을 아기자기하고 예쁘게, 겹치거나 잘리거나 물리적으로 이상한 곳 확인·수정."

| 파일 | 상태 | 내용 |
|---|---|---|
| `src/moon-run-stage.js` | 수정 | 날짜 표지판을 마주 보는 문에서만 보이게, 출발 지점 학생 위치, 소품 칸 비율(3:4) |
| `src/moon-path-ui.js` · `src/moon-run.css` | 수정 | 시작 카드 그림 자리(`start-card.webp`, 없으면 그림 없이 표시) |
| `scripts/verify-moon-path.mjs` | 수정 | `public/assets/generated/run-stage/`의 그림이 모두 열리는지 확인 추가 |
| `scripts/prepare-run-stage-art.mjs` | 새 파일 | 원본 PNG → 실행용 WebP 가공(타일 512px, 배경 하늘 투명 처리, 소품 4칸 정렬) |
| `public/assets/generated/run-stage/` | 새 폴더 | `night-ridge.webp`(41KB), `night-grass.webp`(60KB), `night-path.webp`(30KB) |

이 상태로 화면 캡처(1280×800, 코스 5지점)는 확인했다. **이 수정들 뒤에 `npm test`·`npm run build`·`scripts/verify-moon-path.mjs` 전체는 다시 돌리지 않았다.**

### 이미지 생성 상태

- 9장 중 3장 완료: `backdrop`, `grass`, `path`. 원본은 `asset-bank/original/run-stage-20261117/`(저장소 밖).
- 남은 6장: `observatory`, `props`(소나무·둥근 나무·덤불·등불 4칸), `door`, `wall`, `water`, `intro`. 무대 코드는 이 파일들이 생기면 바로 쓰고, 없으면 코드로 그린 모습을 쓴다(파일 이름은 `prepare-run-stage-art.mjs` 참조).
- **백그라운드에서 생성이 돌고 있을 수 있다.** `.tmp/run-stage/gen-all.sh`가 공용 잠금(`../_shared/run-stage-lock.sh image`)을 기다렸다가 세 장씩 만든다. 먼저 `pgrep -fl "run-stage/gen-all.sh"`와 `.tmp/run-stage/gen-images.log`를 확인한다. 돌고 있으면 새로 띄우지 않는다(같은 그림을 두 번 만들게 된다). 끝났거나 죽었으면 `nohup ./.tmp/run-stage/gen-all.sh >> .tmp/run-stage/gen-images.log 2>&1 &`로 다시 띄운다. 이미 있는 그림은 건너뛴다.
- 잠금은 달리기 스테이지 세션들이 함께 쓴다. 한 세션이 여러 장을 연달아 만들면 다른 세션은 그동안 차례가 오지 않는다(이 세션은 처음 50분 동안 한 장도 못 만들었다).
- **내장 임시 원본 3개가 아직 남아 있다.** 그림이 최종 화면에서 확인되면 한 장씩 `../_shared/run-stage-lock.sh image "/Volumes/T7 Shield/AI-Skills/custom/gpt-imagegen/scripts/gpt-image.sh" -c "<asset-bank 경로>.png"`로 지운다. 새로 생기는 6장도 같다. `-l`에는 다른 세션 그림도 보이니 이 프로젝트 것만 정리한다.
- 프롬프트 표 초안: `.tmp/run-stage/image-record.md`. 「구현 결과」를 쓸 때 계획 문서에 붙인다.

### 테스트·빌드 결과

| 명령 | 결과 | 시점 |
|---|---|---|
| `npm test` | 137개 통과 | 1차 커밋 직전 |
| `npm run build` | 성공(`moon-run-stage` 22.6KB, three 공유 청크 498KB는 기존 행성 뷰어와 같이 씀) | 1차 커밋 직후 |
| `scripts/verify-quest.mjs`(빌드 미리보기) | 기존 보너스 2종·엔딩 통과, 오류 없음 | 1차 커밋 직전 |
| `scripts/verify-moon-path.mjs`(로컬 dev, 빌드 미리보기, 운영 주소) | 5항목 통과: 키보드 1280×800 완주, 두 손가락 터치 1024×768 완주, 카드 방식, WebGL 없음, 옛 저장 | 1차 |
| 위 명령 전체 | **미실행** — 그림 적용 수정 뒤 | 2차 |
| 실물 태블릿·학생 사용 | 미실행 | - |

브라우저 스크립트 실행 값(이 맥에서 쓴 것): `PLAYWRIGHT_MODULE="/Volumes/T7 Shield/iscreammedia_sc34/_scratch/resume-five-20261114.IehEWIss/8/node_modules/playwright-core/index.mjs"`, `BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, `TEST_URL=http://127.0.0.1:5183`, `TMPDIR`은 `.tmp/run-stage/tmp`. 구간별 화면 캡처는 `.tmp/run-stage/tour.mjs`(`MARKS`, `TEST_SIZES`, `SHOT_DIR`)와 `.tmp/run-stage/sheet.mjs`로 만든다.

### 확정된 결정

- 문 구성: 연습(3·7일째)은 정답+밝은 쪽 반대, 적용(10·17일째)은 정답+크기 다른 달, 도전(21·25일째)은 셋 다. 크기가 다른 달은 같은 쪽이 밝은 다른 날짜(3→8, 7→11, 10→5, 17→22, 21→26, 25→20일)이고 차이는 30%p 이상(테스트로 고정).
- 문의 달은 캔버스 텍스처가 아니라 `moonSVG()` DOM을 3D 좌표에 겹친다. 벽에 가려지지 않으므로 마주 보는 문 하나만 보여 준다.
- 캐릭터는 지도용 걷기 시트(`rabbit-walk.webp`, `student.webp`)를 그대로 쓴다. 캐릭터 동작 그림은 새로 만들지 않는다.
- 달, 날짜 글자, 별은 생성 그림에 넣지 않고 코드로 그린다. 원경 그림에도 달이 없다.
- 무대는 지구의 언덕이고 점프는 평범한 높이다.

### 다음에 할 일

1. 이미지 생성 상태를 확인하고 남은 6장을 받는다. 한 장씩 직접 열어 글자·로고·달이 없는지, 투명 배경(관측소·소품)이 실제로 투명한지, `props`가 네 개로 떨어져 있는지 본다. `props`가 네 개로 안 나뉘면 가공 스크립트가 오류를 낸다(다시 생성).
2. `node scripts/prepare-run-stage-art.mjs` → dev 서버(`.claude/launch.json`의 `nightsky-dev`, 5183)에서 `tour.mjs`로 구간별 화면을 본다. 볼 것: 나무가 문·달·버튼을 가리지 않는지, 관측소 크기와 문 위치가 도착 표시와 맞는지, 문짝·돌담 무늬가 늘어나지 않는지, 개울물 흐름, 시작 카드 그림.
3. 수정이 끝나면 `npm test`, `npm run build`, `verify-quest.mjs`, `verify-moon-path.mjs`(1280×800·1024×768)를 다시 돌린다.
4. 내장 임시 원본을 정리하고, `public/assets/CREDITS.md`에 그림 출처를 적고, 계획 문서 끝에 「구현 결과」와 이미지 기록을 붙인다. `graphify update .`도 실행한다.
5. 이번 작업 파일만 커밋·푸시하고 배포한다. 배포 명령(프로젝트 폴더에서): `HOME="/Volumes/T7 Shield/DevCaches/tools/wrangler-home" node "/Volumes/T7 Shield/DevCaches/tools/wrangler-4.154.0/node_modules/wrangler/bin/wrangler.js" deploy`. `TMPDIR`·`XDG_CACHE_HOME`·`WRANGLER_LOG_PATH`는 `.tmp/` 아래로 준다. 커밋 전후와 배포 전에 `find . -name '._*' -not -path './node_modules/*' -delete`.
6. 운영 주소에서 `TEST_URL=https://night-sky-explorer.yelsam.workers.dev`로 `verify-moon-path.mjs`를 돌리고 파일 해시를 대조한다.

### 남은 문제

| 등급 | 문제 | 재현 방법 | 상태 |
|---|---|---|---|
| 낮음 | 지나온 문은 투명해지지만 충돌은 남아 있다. 뒤로 되돌아가면 안 보이는 벽에 닿는다 | 문을 지난 뒤 뒤로 걷기 | 한 방향 코스라 그대로 둠 |
| 낮음 | 폰 가로(844×390)에서 제목 줄 글자 크기 줄이기가 적용되지 않는다 | 해당 크기로 보너스 열기 | 달·버튼은 가려지지 않음 |
| 확인 필요 | 나무 스프라이트 약 90개가 추가됐을 때의 태블릿 성능 | `props.webp` 적용 뒤 실기기 | 미측정 |

### 건드리면 안 되는 것

- `.claude/`, `.tmp/`, `output/`, `output-dist-before-publish-1794173279/`, `graphify-out/`, `docs/MAP-VILLAIN-HANDOFF-20261114.md`는 커밋에 넣지 않는다(이 작업 이전부터 추적 안 된 파일).
- `_shared/`와 다른 프로젝트 폴더는 읽기만 한다. 이미지 생성과 정리는 공용 잠금으로 한 장씩만 한다.
- 기존 보너스 두 개의 동작과 `state.bonus`의 기존 키, 저장 키는 바꾸지 않는다.
- `src/main.js`는 쓰지 않는 옛 진입 파일이다. 진입은 `src/application.js`다.

## 2026-11-16~17 흐름·상호작용·디자인 고도화

누르기만 반복되던 흐름을 줄이고, 장마다 다른 손동작과 장소 배경을 넣었다. 운영 주소는 그대로이고 매 단계 커밋·푸시·Cloudflare 배포 후 운영 빌드 파일명을 대조했다.

| 영역 | 바뀐 것 |
|---|---|
| 개념 패스 방지 | 학생 대신 관찰을 끝내던 '자동 관찰' 재생을 학습 화면에서 뺐다(`observation-player.js`는 남아 있지만 쓰지 않음). |
| 클릭 줄이기 | 묶음이 끝나면 다음 묶음으로 자동 전환, 달 6일 기록은 날짜 한 번 탭, 천체 8개 한 판, s4b 판별 탭 하나로 통합. |
| 글쓰기 → 문장 고르기 | s1b·s2b·s5b의 6번 타이핑을 학생 자료로 판정하는 문장 카드로 바꿈(`src/reflection-chips.js`). 틀린 문장은 저장되지 않고 이유 힌트만 준다. |
| 장마다 다른 손동작 | s1a 달 끌기, s2a 시간 막대 끌다 관측일에 붙이기, s3a 구름 닦아 행성 드러내기, s3b 궤도선에 끌어 놓기, s4a 가림판을 빛 길에 끌기, s5 별 잇기(`src/stage-gestures.js`). |
| 생성 이미지 | 장별 배경 5장(`public/assets/rooms`), 관측 기록 배지 5개·인증서 틀·경보 장면(`public/assets/ui`). 원본은 `references/generated/stage-rooms-20261116`, `ui-art-20261117`. |
| 디자인 | 실험 영역을 방 위 반투명 무대로, 안내는 알약 모양 한 줄, 팝업·버튼 토큰 통일(`src/design-refresh.css`), 보너스 드롭다운 → 카드, 같은 안내 중복 제거. |
| 음성 | s1a·s2a 힌트를 로컬 Qwen3-TTS 0.6B Base로 다시 만듦(ElevenLabs 크레딧 부족). 기록은 `docs/VOICE-PROVENANCE-20261117.json`. |

확인: `npm test` 128개, `scripts/verify-playthrough.mjs` 20개(드래그·닦기·가림판 포함), `scripts/verify-quest.mjs`, 1280×800·1024×600 화면 캡처 가로 넘침 없음. 실물 태블릿 터치와 학생 반응은 확인하지 않았다.

## 현재 상태 · 2026-11-12

5장 10개 학습 화면, 지도 복구, 29개 안내 음성, 5편 개념영상, 기록 보호, 코어·인증서가 구현되어 공개 운영 중이다. 최신 앱 소스는 `b93f505`이며 2026-11-12 납품 전 점검에서 세로 태블릿 배치, 달 관찰 표시, 영상 장면 이동, 성취기준 연결, 핵심 개념·다음 행동 안내와 달 표면 그림을 보강했다. 행성 성분별 묶기는 선택 탐구로 조정했다. 공개 파일 94개와 배포 빌드의 SHA-256 일치를 확인했다.

공개 주소는 [별빛 관측 연구소](https://night-sky-explorer.yelsam.workers.dev/)다. Cloudflare 활성 버전은 `cc5f3654-389d-4d56-bf43-6bb6b979825c`이며 2026-11-12 01시07분 KST에 배포했다.

최신 검증과 잔여 확인 사항은 [최종 검토](docs/reviews/RELEASE-REVIEW-20261112.md)와 [점수표](docs/reviews/SCORE-20261112.md)를 따른다. 아래에는 초기 MVP 인계 원문을 보존한다.

---

목표: D:\iscreammedia_sc34\13 nightsky에서 초4 과학 게임 MVP 구현. 사용자가 새 채팅에서 구현 진행을 요청했으므로 추가 시작 확인 없이 진행.

확정 사항:
- 메인은 2D. 자연 속 스테이지 선택 맵만 사선 시점 2.5D 픽셀 RPG이며 캐릭터가 이동해 장소에 진입.
- 장소 내부는 기존 시안 계열 2D. 3장 행성 조사 대상만 실제 3D 회전·확대. 태양계 배치는 2D.
- 5장×2학습 화면: 달 포착·표면 비교→여러 날 달 기록·예측 검증→행성 조사·태양계 구성→별/행성 비교·근거 판별→북극성 주변 관찰·패턴 비교.
- 다섯 관측 기록을 중앙 코어에 연결해 연구소 복구, 개인 결과 제공.
- 모든 화면 좌상단 홈·이전, 우상단 소리·설정. 관리자 전체 해금은 단일 선택이며 실제 완료 기록과 분리.
- 달토끼·별여우 NPC 유지. 이동 주인공은 미정으로 학생 아바타를 기본 가정.

완료: 원본 48개 분류·해시 검증, ZIP 해제 및 중복 확인, 이미지 43장 검토, 시나리오·3D 프롬프트 저장. 실행 코드와 새 PRD/TRD는 아직 없음.

다음: 논의안 기준 간결한 PRD/TRD 작성→전체 학습 흐름·맵·행성 뷰어·저장/이어하기 구현→브라우저 핵심 동작·빌드 검증. 기존 에셋 활용, 불필요한 확장 금지.

관련 파일: README.md, docs/SCENARIO_DISCUSSION.md, docs/3D_ASSET_PROMPTS.md, references/README.md, references/documents/의 심화 v2, references/images/, references/manifest.json.

주의: 구 PRD/TRD의 화면 번호·3D 정책은 최신 결정으로 대체. 공유 대화 원문은 접근 실패. 이미지 28의 은하=스피카 등 과학 오류를 복제하지 말 것. 모든 생성물·캐시·임시는 D: 사용, C: 복제 금지. 반말로 간결히 소통.
