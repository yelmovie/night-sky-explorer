# 13 별빛 관측 연구소 · 3D 달리기 스테이지 계획 · 2026-11-17

**현재 단계: 구현·배포.** 아래 본문은 계획 당시의 내용이고, 달라진 결정은 끝의 「계획 확정」과 「구현 결과」에 있다. 공통 규격은 [공통 계획](../../_shared/RUN-STAGE-3D-PLAN-20261117.md)에 있다.

## 한 줄 요약

코어 복구 뒤의 선택 보너스에 「달빛 길 따라가기」를 덧붙인다. 달토끼 루미가 밤 언덕길을 달리며, 갈림길마다 다음 날짜의 달 모양이 걸린 문을 골라 지나간다.

## 처음 추천에서 빠졌던 이유와 이번 방향

처음에는 이 프로젝트를 권하지 않았다. 달리기와 점프를 달 위에서 하면 "달에서는 높이 뛴다"는 중력 이야기가 되는데, 이 단원(달·태양계·별, 4과13-01~03)의 범위 밖이기 때문이다.

그래서 다음과 같이 잡았다.

- 무대는 달 위가 아니라 **지구의 관측 언덕**이다. 점프는 평범한 높이다.
- 다루는 내용은 **여러 날 동안 달의 모양이 달라지는 순서**다. 2장에서 학생이 직접 기록한 내용을 다시 쓰는 것이다.
- 필수 흐름은 건드리지 않고 선택 보너스로 넣는다.

## 넣을 자리

- 화면 순서는 `s1a`·`s1b` 달 표면 → `s2a`·`s2b` 달 변화 → `s3a`·`s3b` 행성 → `s4a`·`s4b` 별·행성 → `s5a`·`s5b` 별 배열 → 코어 → 결과다.
- 보너스는 지금 두 개다(`src/bonus.js`): 「구름 낀 날의 관측 기록」, 「새로운 행성 관측 의뢰」. 코드 주석에 "Optional bonus quests after the core is restored. They never change mission completion."이라고 적혀 있다. 여기에 세 번째로 넣는다.
- 관련 파일: `src/bonus.js`(`bonusQuests`, `openBonus`), `src/application.js`(보너스 열기 267행 부근, 목록 112·170행 부근), `src/drawing.js`(`phase`, `moonSVG`, `dayMoon`).
- 현재 진입 파일은 `src/application.js`다. `src/main.js`에도 비슷한 호출이 있지만 지금 쓰는 진입 파일이 아니므로 고치지 않는다.

### 다른 후보를 고르지 않은 이유

- **2장 `s2a`(필수, 달 여섯 시점 기록):** 이미 탐험 경로 형태라 옮기기 쉽지만, 학생이 날짜를 고르고 직접 기록하는 것이 학습의 중심이라 달리기로 바꾸지 않는다.
- **3장 행성 순서:** `src/curriculum.js`에 "행성 크기·거리·성분 암기를 평가하지 않아요"라고 적혀 있다. 행성을 순서대로 모으는 게임은 암기를 겨루는 것이 되어 맞지 않는다.

## 하는 일

1. 출발 전에 자기가 2장에서 기록한 달 사진들을 다시 본다.
2. 루미가 언덕길을 달린다. 길에는 등불 발판이 놓여 있고 작은 틈은 뛰어넘는다.
3. 갈림길에 문이 두세 개 서 있고, 문마다 달 모양이 걸려 있다. 길가 표지에 "3일째 다음은 7일째"처럼 날짜가 나온다.
4. 그 날짜의 달 모양이 걸린 문으로 지나간다. 순서는 3 → 7 → 10 → 17 → 21 → 25일째다(`src/discovery-route.js`의 여섯 시점).
5. 다른 문으로 가면 문이 열리지 않고 루미가 뒤로 한 걸음 물러난다. 힌트는 기존 보너스의 방식대로 "어느 쪽이 밝은지", "밝은 부분이 앞 날짜보다 큰지 작은지"를 순서대로 알려 준다.
6. 여섯 문을 지나면 관측소에 도착하고 보상 카드를 받는다.

## 과학 개념과 조작

| 개념 | 달리기에서 하는 일 |
|---|---|
| 달의 모양은 여러 날에 걸쳐 조금씩 달라진다 | 날짜 순서대로 달 모양 문을 고른다 |
| 밝은 부분이 오른쪽부터 차올랐다가 왼쪽이 남으며 줄어든다 | 문에 걸린 달의 밝은 쪽과 크기를 비교한다 |

### 지켜야 할 제한

- `src/curriculum.js` 2장: "달 변화의 원인은 필수 평가하지 않으며 날짜는 실제 관측 예보가 아니에요." 달이 왜 그렇게 보이는지는 묻지 않는다.
- 화면 문구 "우리나라에서 본 모양을 단순하게 나타냈어요 · 학습용 날짜"를 달리기 화면에도 둔다.
- 문에 걸리는 달은 생성한 그림이 아니라 기존 `phase(day)`와 `moonSVG()`로 그린다. 그림으로 만들면 밝은 쪽이나 크기가 틀릴 수 있다.
- 달 위를 걷거나 높이 뛰는 표현, 우주복, 무중력 표현을 넣지 않는다.
- 보너스는 미션 완료에 영향을 주지 않는다. 이 규칙을 그대로 지킨다.

## 연결과 저장

- 저장 키는 localStorage `starlight-lab:v1`(내부 version 2)이다. 보너스 상태는 `state.bonus`에 있고 지금은 `{cloudy, planet}`으로 초기화된다.
- 세 번째 키(예: `path`)를 추가하면 초기화와 저장 정규화 코드도 함께 고쳐야 한다. 기존 저장에 이 키가 없어도 그대로 열려야 한다.
- 대체 화면: 선택 보너스이므로, 3D를 쓸 수 없으면 보너스 목록에서 이 항목에 "이 기기에서는 열 수 없어요"를 보여 주고 나머지는 그대로 둔다.

## 이미지 생성·적용 목록

지도는 사선 2.5D 픽셀이고 나머지 화면은 2D 일러스트다. 달리기 그림은 일러스트로 맞춘다. 참고 그림은 `public/assets/rabbit.webp`(루미), `public/assets/fox.webp`(별여우), 지도 스프라이트 목록 `public/assets/generated/sprites.json`이다.

| 번호 | 그림 | 종류 | 적용 위치 |
|---|---|---|---|
| 1 | 루미 대기 | 캐릭터 동작 줄 | 서 있을 때 |
| 2 | 루미 달리기 | 캐릭터 동작 줄 | 이동 |
| 3 | 루미 점프 | 캐릭터 동작 줄 | 점프 |
| 4 | 루미 물러나기 | 캐릭터 동작 줄 | 다른 문으로 갔을 때 |
| 5 | 루미 기뻐하기 | 캐릭터 동작 줄 | 문 통과, 도착 |
| 6 | 학생 연구원 응원 | 캐릭터 동작 줄 | 출발과 도착 지점 |
| 7 | 문틀(달이 들어갈 자리를 비운 것) | 소품 | 갈림길의 문 |
| 8 | 등불 발판 | 소품 | 길 위 |
| 9 | 날짜 표지대(글자 없이) | 소품 | 갈림길 앞 |
| 10 | 밤 언덕 풀밭 무늬 | 바닥 무늬 | 길 |
| 11 | 밤 원경(먼 산 능선, 가까운 나무) | 원경 2장 | 배경 |
| 12 | 관측소 | 소품 | 도착 지점 |
| 13 | 시작 카드 그림 | 시작 카드 | 보너스 들어갈 때 |

밤하늘의 별은 코드로 점을 찍어 만든다. 문 안의 달과 날짜 글자도 코드로 그린다. 원경 그림에 달을 그려 넣지 않는다(문에 걸린 달과 헷갈린다). 생성 원본은 `asset-bank/original/run-stage-20261117/`에, 실행 파일은 `public/assets/generated/run-stage/`에 둔다. 예상 14장.

## 기술, 검증, 배포

- Three.js는 npm `three` 0.180.0이 이미 있다. 지금은 `src/planet.js`(행성 돌려 보기)만 쓰고 `src/learning.js` 132행 부근에서 필요할 때 불러온다. 같은 방식을 쓴다.
- 방향판은 `src/map-controls.js`의 `bindDirectionPad`를 다시 쓴다.
- 검증 명령: `npm test`, `npm run build`(빌드 뒤 `clean-build-metadata`가 이어서 돈다). 타입검사 스크립트와 서비스워커는 없다.
- 운영 주소는 https://night-sky-explorer.yelsam.workers.dev/ 이다. Cloudflare Workers이고 `wrangler.jsonc`의 이름은 `night-sky-explorer`다. package.json에 배포 스크립트가 없으므로 `wrangler deploy`를 직접 실행한다.

## 작업 순서

1. 보너스 키 추가, 초기화·저장 정규화 수정과 테스트(기존 저장이 그대로 열리는지)
2. 규칙 연결: 갈림길마다 정답 날짜와 헷갈리는 날짜를 정하는 함수와 테스트. 문에 걸 달은 `phase()`로 만든다
3. 기본 도형으로 여섯 갈림길을 만들어 끝까지 해 보기
4. 이미지 생성·적용
5. 3D를 쓸 수 없는 경우, 보너스 목록 표시, 새로고침 후 이어 하기 확인
6. 검증 명령 → 커밋·푸시 → 운영 배포 → 운영 주소 확인

## 시작 전에 확인할 것

- 정확한 학년 표기를 확인하지 못했다(성취기준 코드는 3~4학년군).
- 헷갈리는 문을 어떻게 고를지 정한다. 밝은 쪽이 반대인 달, 크기가 다른 달 중 하나씩 두는 방식을 권한다. 14일째와 17일째처럼 차이가 작은 날짜를 나란히 두면 태블릿 화면에서 구별이 어려울 수 있다.
- 추적되지 않은 `.claude/`, `.tmp/`, `output/`, `output-dist-before-publish-1794173279/`, `graphify-out/`, `docs/MAP-VILLAIN-HANDOFF-20261114.md`는 이번 작업과 섞지 않는다.
- 운영 시트 G·H열의 주소와 저장소를 대조한다.

## 계획 확정 · 2026-11-17 (구현 세션)

「시작 전에 확인할 것」을 코드로 확인하고 아래처럼 정했다. 위 본문에서 달라진 곳은 여기가 우선이다.

### 코드와 대조해 확인한 것

- `src/state.js`의 `freshState()`에 `bonus.path`를 더하면 된다. 저장은 `clean(freshState(), raw)`로 병합하므로 키가 없는 옛 저장은 `path: ""`로 열리고, 정규화는 `Object.keys(s.bonus)`를 돌아 `"done"`이 아닌 값을 비운다.
- 보너스 목록(`src/application.js`의 `resultsView()`)과 연구 키트의 보상 표시는 `Object.entries(bonusQuests)`로 그리므로 `bonusQuests.path`만 넣으면 카드가 생긴다.
- `openBonus`에 `reduced`(동작 줄이기 여부)를 추가로 넘긴다. 3D 자원은 `<dialog>`의 `close` 이벤트에서 해제한다.
- `bindDirectionPad`는 화면 방향판의 누름만 알려 주므로 키보드는 `mapKeyDirection`으로 직접 받는다.
- 루미와 학생 연구원은 지도용 걷기 시트(`public/assets/generated/rabbit-walk.webp`·`student.webp`, 4×4칸: 앞·왼쪽·오른쪽·뒤)를 그대로 쓴다. 뒤에서 따라가는 카메라라서 뒷모습 줄이 필요했고 이 시트에 있다. 본문의 「이미지 목록」 1~6번(동작 줄)은 새로 만들지 않는다.
- 학년 표기는 이 작업에서 화면에 쓰지 않으므로 확인하지 않았다.

### 코스 설계표

카메라는 루미 뒤 위쪽에 고정이고 길은 화면 안쪽으로 한 방향이다(`src/moon-run-course.js`, 길이 약 115m, 달리기만 약 31초).

| 구간 | 문(거리) | 문 구성 | 새로 쓰는 것 | 길 |
|---|---|---|---|---|
| 연습 | 3일째(16m), 7일째(32m) | 정답 + 밝은 쪽이 반대인 달 | 어느 쪽이 밝은가 | 평지, 개울 2개 |
| 적용 | 10일째(52m), 17일째(67m) | 정답 + 크기가 다른 달 | 밝은 부분이 앞 날짜보다 큰가 작은가 | 턱 1개, 디딤돌 1개가 놓인 개울, 개울 1개 |
| 도전 | 21일째(90m), 25일째(106m) | 정답 + 반대쪽 + 크기 다른 달 | 둘 다 | 턱 1개, 디딤돌 2개가 놓인 개울, 개울 1개 |

- 문 구성을 구간마다 다르게 둔 이유: 공통 계획의 "한 구간에 새로 쓰는 개념은 하나"를 지키려고 연습·적용 구간은 헷갈리는 문을 한 종류만 세웠다.
- 크기가 다른 달은 같은 쪽이 밝은 다른 날짜의 달이다: 3→8일, 7→11일, 10→5일, 17→22일, 21→26일, 25→20일. 밝은 부분 차이가 모두 35%p 이상이고, 테스트가 30%p 이상을 고정한다(14·17일째 같은 근접 쌍 방지).
- 문 위치는 시작할 때마다 섞는다. 정답 판정은 `phase(day)`와 같은 쪽·같은 크기인지뿐이다(`judgeDoor`).
- 힌트 순서: 첫 번째는 무엇을 볼지 묻고(밝은 쪽 → 크기), 두 번째는 그 날짜의 사실을 알려 주고, 세 번째에는 알맞은 문에 등불이 켜지고 「걷지 않고 문 고르기」 버튼이 나온다.
- 떨어지면(개울) 마지막으로 선 바닥의 앞쪽 끝으로 돌아온다. 열린 문은 그대로 열려 있다. 목숨·시간 제한은 없다.
- 점프 거리는 2.5m로 고정했다(공중에서 더 빨라지지 않게 최고 속도를 묶음). 개울 틈은 1.0~1.3m, 턱은 0.45m다.

### 본문과 다르게 정한 것

- **대체 화면**: "이 기기에서는 열 수 없어요" 대신 같은 규칙으로 달 카드를 눌러 고르는 방식을 넣었다. 동작 줄이기 설정에서는 이 방식을 먼저 권하고, WebGL이 안 되거나 3D 연결이 끊기면 자동으로 이 방식으로 이어 간다. 이유: 공통 지침의 대체 화면 규칙(WebGL 실패·동작 줄이기)을 지키면서 보너스가 닫히지 않게 하려는 것.
- **문의 달**: 캔버스 텍스처로 굽지 않고 `moonSVG()` DOM을 3D 좌표에 맞춰 화면 위에 겹친다(`css2d_label` 방식). 이유: 2장에서 본 것과 똑같은 달을 쓰고, SVG 안의 그림이 텍스처로 구울 때 빠지는 브라우저 차이를 피하려는 것. 벽에 가려지지 않으므로 루미가 마주 보는 문 하나의 달만 보여 준다.
- **날짜 표지**: 문 양끝 길 밖에 세운 높은 표지판(코드로 그린 글자)과 화면 위 「다음 문 · N일째 달」로 보여 준다.
- **지나온 문**: 루미가 지나가면 문 전체가 투명해진다. 뒤에서 따라오는 카메라와 루미 사이를 벽이 가리기 때문이다.

### 구현 작업 목록

1. `src/state.js` `bonus.path`, `tests/quest.test.js` 기대값, `tests/moon-path.test.js`
2. `src/moon-path.js`(규칙: 문 구성, 판정, 힌트, 완료 기록) · `src/moon-run-course.js`(길 배치)
3. `src/moon-run-stage.js`(three.js 무대·캐릭터·카메라, 늦게 불러옴) · `src/moon-path-ui.js`(시작 카드, 화면 겹침, 입력, 카드 방식, 보상) · `src/moon-run.css`
4. `src/bonus.js`(`bonusQuests.path`, `openBonus` 분기) · `src/application.js`(`reduced` 전달, CSS 불러오기)
5. `scripts/verify-moon-path.mjs`(키보드·두 손가락 터치 완주, 카드 방식, WebGL 없음, 옛 저장)

## 구현 결과 · 2026-11-17

세 번째 선택 보너스 「달빛 길 따라가기」를 넣었다. 루미가 밤 언덕길을 달려 3→7→10→17→21→25일째 달이 걸린 문을 차례로 지나 관측소에 도착한다. 판정은 `judgeDoor()`(`src/moon-path.js`), 문의 달은 `phase()`·`moonSVG()`, 완료는 `state.bonus.path = "done"`이다. 저장 키와 미션 완료 조건은 그대로다.

### 1차 (커밋 `6926e6b`, Worker 버전 `d6bb8ba9-5637-4130-bc08-29cfae577f50`)

기본 도형 무대, 화면 버튼·키보드·두 손가락 입력, 체크포인트, 카드 고르기 대체 화면(WebGL 없음·동작 줄이기·같은 문 세 번 막힘), 옛 저장 호환. 바뀐 파일과 확인 내용은 `HANDOFF.md`의 같은 날짜 절에 있다.

### 2차 · 그림 고도화

| 파일 | 내용 |
|---|---|
| `public/assets/generated/run-stage/*.webp` | 생성 그림 9장(합계 약 1.5MB): 원경, 풀밭, 흙길, 돌담, 문짝, 개울, 관측소, 소품 4칸, 시작 카드 |
| `scripts/prepare-run-stage-art.mjs` | 원본 PNG → WebP 가공(타일 512px, 원경 하늘 투명, 소품 4칸 정렬). 소품 칸을 자를 때 sharp가 두 번째 `extract()`를 리사이즈 뒤 자르기로 처리해 실패하던 것을 고침 |
| `src/moon-run-stage.js` | 날짜 표지판은 마주 보는 문에서만 보임, 출발 지점 학생 위치, 소품 칸 비율 3:4 |
| `src/moon-path-ui.js` · `src/moon-run.css` | 시작 카드 그림(16:9 전체를 카드 높이에 맞춰 표시, 불러오지 못하면 그림 없이 표시, 폰 가로에서는 숨김) |
| `scripts/verify-moon-path.mjs` | `run-stage/`의 그림이 모두 `image/webp`로 열리는지 확인(macOS `._*` 파일은 제외) |
| `public/assets/CREDITS.md` | 그림 출처 |

화면 점검(로컬 dev, 1280×800 코스 20지점 + 도착, 1024×768 6지점, 시작 카드 두 크기):
- 나무·등불이 문·달·버튼을 가리지 않는다. 관측소는 길 끝 도착 표시 바로 뒤에 서고 문과 계단이 길과 맞는다. 문짝·돌담 무늬는 늘어나 보이지 않는다. 개울은 무늬가 입혀졌다.
- 고친 것: 시작 카드가 넓은 띠로 잘려 관측소와 루미 얼굴이 함께 보이지 않던 것 → 그림 전체를 16:9로 보여 주게 바꿈. 1024×768에서도 출발 버튼 아래가 화면 안에 들어온다(버튼 아래 742px/768px).
- 그대로 둔 것: 개울의 디딤돌 위 등불 기둥은 코스 설계(「Lantern stepping stones」, 뛸 곳 표시)대로다. 개울 가장자리의 세로 면은 무늬 없는 어두운 색이다.

검증(2차 수정 뒤):

| 명령 | 결과 |
|---|---|
| `npm test` | 137개 통과 |
| `npm run build` | 성공(`moon-run-stage` 22.6KB, three 공유 청크 498KB는 기존과 같음) |
| `scripts/verify-quest.mjs`(빌드 미리보기 4173) | 기존 보너스 2종·재시도 기록·엔딩 영상·동작 줄이기 통과, 오류 없음 |
| `scripts/verify-moon-path.mjs`(빌드 미리보기 4173) | 6항목 통과: 키보드 1280×800 완주, 두 손가락 터치 1024×768 완주, 카드 방식, WebGL 없음, 옛 저장, 콘솔 오류 없음. 그림 9장 응답 확인 포함 |

확인하지 못한 것: 실물 태블릿·전자칠판에서의 성능(나무 스프라이트 약 90개 추가)과 학생 사용. 브라우저 확인은 헤드리스 Chrome(SwiftShader)에서만 했다.

### 이미지 생성 기록

`gpt-imagegen` 스킬(Codex 내장 이미지 도구)로 한 장씩 만들었다. 원본은 `asset-bank/original/run-stage-20261117/<이름>.png`(저장소 밖, `.gitignore`), 실행 파일은 `public/assets/generated/run-stage/`이고 `node scripts/prepare-run-stage-art.mjs`로 가공한다. 실행 파일이 없으면 그 부분은 코드로 그린 모습으로 나온다.

모든 프롬프트 끝에 붙인 공통 문장: `Cozy storybook pixel-art inspired game art with soft painterly pixels, night-time palette of deep navy, teal and forest green with warm golden lantern glow. no text, no letters, no logo, no moon.`

달, 날짜 글자, 별은 그림에 넣지 않았다. 문의 달은 `moonSVG()`, 표지판 글자는 캔버스 글자, 별은 점으로 코드에서 그린다. 캐릭터는 기존 지도용 걷기 시트를 쓴다.

| 원본 | 실행 파일 | 쓰는 곳 | 참고 그림 | 프롬프트 |
|---|---|---|---|---|
| `backdrop.png` | `night-ridge.webp` | 먼 언덕과 숲(하늘 부분은 투명하게 지워 코드로 찍은 별이 보이게 함) | `references/generated/world.png` | Wide panoramic far background for a 3D game horizon, in the style of the reference image: rolling night hills layered in depth, dense pine and round-tree forests, a few tiny cozy cottages with warm lit windows, small lantern dots and a glinting river. The top 45 percent of the image is a completely plain flat dark navy sky, colour #0b1630, with nothing in it: no stars, no clouds. The farthest ridges are soft silhouettes that fade into that navy sky. The bottom edge is dark forest. Landscape orientation. |
| `grass.png` | `night-grass.webp` | 길과 언덕의 풀밭 무늬 | `references/generated/world.png` | Seamless tileable top-down texture of a night meadow for a game floor: short teal-green grass with small scattered clusters of tiny white and pale yellow flowers and clover leaves, even flat lighting, no objects, no path, no border, no vignette. Square image whose left-right and top-bottom edges tile seamlessly. |
| `path.png` | `night-path.webp` | 가운데 흙길 무늬 | `references/generated/world.png` | Seamless tileable top-down texture of a sandy dirt footpath for a game floor: packed warm beige sand with small flat pebbles and a few tiny grass tufts, under a cool moonlit night tint, even flat lighting, no objects, no border, no vignette. Square image whose edges tile seamlessly. |
| `observatory.png` | `observatory.webp` | 도착 지점의 관측소 | `references/generated/world.png` | A single small cute observatory building as a game prop, straight front view at eye level, in the style of the reference image: a round stone tower with an arched wooden door, warm lit windows, small stone steps, flower pots and two glowing lanterns beside the door, topped by a deep blue dome with gold trim and an open slit with a brass telescope pointing up to the sky. Centered, the whole building visible with a small margin, flat bottom edge. transparent background. |
| `props.png` | `props.webp` | 소나무·둥근 나무·꽃 덤불·등불 기둥(4칸) | `references/generated/world.png` | Sprite sheet of exactly four separate game props in one single row, evenly spaced with clear empty gaps between them, each fully visible, front view, all bottoms aligned on the same baseline, in the style of the reference image: first a tall pine tree, second a round leafy tree, third a low flowering bush with tiny white and pink flowers, fourth a wooden lantern post with one glowing warm lantern. transparent background. |
| `door.png` | `door.webp` | 문짝 앞면 | 없음 | A single closed rectangular double wooden door as a game texture, perfectly straight front orthographic view, filling the whole square image edge to edge: deep teal-blue painted wooden planks, golden hinges, golden trim, two small golden star-shaped knockers, slightly worn and cozy. No wall around it, no arch, no perspective, even lighting. |
| `wall.png` | `stone-wall.webp` | 문 옆 돌담과 디딤돌 | `references/generated/world.png` | Seamless tileable front-view texture of a cozy old garden stone wall for a game: rounded blue-grey stones of different sizes with thin mortar lines, a little moss and a few small ivy leaves, even flat lighting, no objects, no border, no vignette. Square image whose edges tile seamlessly. |
| `water.png` | `stream.webp` | 개울물 | 없음 | Seamless tileable top-down texture of a gentle shallow stream at night for a game: deep blue-teal water with soft curved ripples and a few tiny pale sparkles, even flat lighting, no rocks, no banks, no border, no vignette. Square image whose edges tile seamlessly. |
| `intro.png` | `start-card.webp` | 시작 카드 그림(16:9 전체를 카드 높이에 맞춰 보여 줌) | `public/assets/rabbit.png`, `references/generated/world.png` | Wide landscape illustration for a game start card: the rabbit character from the first reference image (cream rabbit with long floppy ears, navy beret, navy cape) runs happily up a winding lantern-lit dirt path on a grassy night hill toward a small observatory with a blue dome and gold trim on the hilltop. Seen from behind in three-quarter view. Pine trees, round trees and tiny flowers beside the path. The sky is a completely plain smooth dark navy gradient with nothing in it: no stars, no sparkles, no milky way, no moon, no clouds. Painted in the style of the second reference image. (공통 문장 끝에 `no stars.`를 더함) |

첫 `intro.png`는 하늘에 별과 은하수가 그려져 「별은 생성 그림에 넣지 않는다」 규칙에 어긋나서 쓰지 않았다(`asset-bank/original/run-stage-20261117/intro-rejected-starry.png`로 보관, 내장 원본은 바로 지움). 위 프롬프트로 다시 만든 그림을 썼다.

그림에 남은 별 모양은 장식뿐이다: 문짝의 별 모양 문고리(프롬프트에서 요청), 루미 베레모의 초승달 배지와 망토 무늬(기존 캐릭터 의상). 하늘의 별·문의 달·날짜 글자는 모두 코드로 그린다.
