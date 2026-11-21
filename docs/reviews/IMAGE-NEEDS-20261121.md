# 13 별빛 관측 연구소 · 새 그림이 필요한 곳 (2026-11-21)

새 그림을 그려야 하는 자리만 모았다. 출처 상태는 `docs/RIGHTS-LEDGER-20261121.md`의 줄 번호(I1 등)를 따른다. 크기는 `sips`로 잰 실제 픽셀과 `src/` CSS의 표시 크기를 비교했다. 읽기만 했고 그림·코드는 바꾸지 않았다.

## 요약

| 묶음 | 줄 수 | 새로 그릴 것 | 내용 |
|---|---:|---:|---|
| (가) 출처 미확인 그림 | 6 | 4 | 관측소 배경, 로고, 별여우 시트, 루미 시트. 나머지 2개(홈 별여우, 공유 썸네일)는 새 그림에서 잘라내거나 다시 합성. 대화 초상 2장은 2026-11-21 Codex 생성 기록으로 출처가 확인돼(장부 I6) 빠졌고, 캐릭터를 새로 그리면 「연쇄 교체 후보」로 함께 다시 만든다 |
| (나) 화풍·해상도가 튀거나 임시인 그림 | 2 | 0(추가) | 홈 별여우·대화 초상이 표시 크기보다 작음. 홈 별여우는 (가)와 같은 파일, 대화 초상은 (가)의 「연쇄 교체 후보」라 새 캐릭터 시트를 만들면 함께 풀린다. 임시 그림은 찾지 못함 |
| (다) 점검표 개선에 필요한 소품·배경 | 0 | 0 | 없음. A17은 새 그림 없이 데이터·코드로 가능, B15는 글자만 필요 |

**먼저 할 일:** (가)는 사용자 제공 원본 4장(`references/images/` 31·41·42·43번)의 권리 증빙(점검표 F12)이 오면 새로 그릴 필요가 없다. 증빙을 받을 수 없을 때만 아래 크기로 새로 만든다. 별여우·루미는 캐릭터 디자인 자체가 바뀌므로, 같은 캐릭터를 참고 그림으로 쓴 파일(아래 「연쇄 교체 후보」)도 함께 다시 만들어야 화면이 어긋나지 않는다.

## (가) 출처 미확인 그림 — 6줄 (새로 그릴 것 4)

| 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍 맞출 참고 그림 | 왜 필요한지 |
|---|---|---|---|---|
| 홈 배경, 활동 화면 공통 배경(`classroom.css` 8행, `flow-refresh.css` 4행, `polish.css` 434·456행, `quest.css` 159행, `styles.css` 360행) | `public/assets/observatory.webp` 1672×941 (I1) | 1920×1080 이상, 16:9, 불투명. 왼쪽·가운데는 글자 카드가 올라가므로 어둡고 단순하게 | `public/assets/rooms/ch5-north-overlook.webp`, `public/assets/generated/dome-restored.webp`(같은 남색·금색 연구소 화풍) | 출처 미확인. 지금 파일은 1920 전자칠판에서 1.15배 늘어남 |
| 홈 제목 로고(`application.js` 81행, 표시 최대 570×190) | `public/assets/logo.webp` 1200×400 (I2) | 1200×400, 3:1, 투명 배경. 「별빛 관측 연구소」 글자는 그림에 굽지 말고 나눔스퀘어 네오로 얹고, 그림은 테두리·별 장식만 생성 | `public/assets/ui/badge-moon.webp`, `public/assets/ui/cert-frame.webp`(놋쇠·별 장식) | 출처 미확인. 생성 그림 속 한글은 틀릴 수 있어 글자는 코드로 |
| 별여우 연구관 포즈: 대화 칸 `.npc-full` 168×233(`styles.css` 440–449행), NPC 동그라미 76px(`quest.css` 24·27행), 홈 캐릭터 | `public/assets/fox.webp` 1672×941, 5×2칸(칸 334×470) (I3) | 지금 코드 그대로 쓰려면 1672×941, 5열×2행, 칸 334×470(투명), 칸마다 발끝·크기 맞춤. 홈용 한 장은 아래 줄처럼 따로 크게 | 디자인을 유지하려면 현재 `fox.webp`(권리 확인 뒤), 새로 만들면 `public/assets/rooms/`·`ui/` 팔레트와 `public/assets/reward-cards/card-1-1.webp`의 붓 느낌 | 출처 미확인. 캐릭터 디자인 교체가 되므로 증빙을 먼저 확인 |
| 달토끼 기록원 루미 포즈: 힌트 칸 140×190(`classroom.css` 44행), 작은 초상 78×90(40행), 대화 칸 | `public/assets/rabbit.webp` 1672×941, 5×2칸 (I4) | 위와 같음(1672×941, 5×2, 칸 334×470, 투명) | 위와 같음 | 출처 미확인. 개념영상·성취 카드·시작 카드·대화 초상이 이 디자인을 참고함 |
| 홈 화면 오른쪽 아래 별여우(`scenery-surfaces.css` 21–23행, 표시 폭 `min(28vw, 420px)`, 비율 0.71) | `public/assets/home-fox.webp` 334×470 (I5) | 840×1183(0.71, 420px를 2배 화면에서 선명하게), 투명. 새 별여우 시트와 같은 자세 | 새 `fox.webp` | 출처 미확인(I3에서 잘라냄). (나)의 해상도 부족과 같은 파일 |
| 링크 공유 썸네일(`index.html` og:image) | `public/og.jpg` 1200×630 (I7) | 1200×630 JPG. 새로 생성하지 않고 새 관측소 배경 + 새 로고로 다시 합성 | 새 `observatory.webp`·`logo.webp` | 출처 미확인 그림 둘을 합성한 파일 |

### 연쇄 교체 후보 (권리 문제가 아니라 디자인을 맞추기 위함)

루미·별여우를 새 디자인으로 바꾸면 아래도 다시 만들어야 같은 캐릭터로 보인다. 새 그림 수에는 넣지 않았다.

- `public/assets/concepts/stage-{1..5}.{mp4,webm,webp}`: `films/build.mjs`가 `fox.png`·`rabbit.png` 칸을 잘라 넣는다. 새 시트로 `npm run concepts:render`를 다시 돌리고 자막 입히기(`docs/concept-captions-20261118/`)를 다시 해야 한다.
- `public/assets/reward-cards/` 10개: 루미가 나오는 장면을 `rabbit.webp` 참고로 생성했다(`../_scratch/reward-cards-20261118/specs/13.json`).
- `public/assets/generated/run-stage/start-card.webp`: 참고 그림이 `rabbit.png`였다(`docs/RUN-STAGE-3D-PLAN-20261117.md`).
- `public/assets/map-encounters/ally-redraw.png`: 지도 동료 달토끼.
- `public/assets/dialogue/fox.webp`·`rabbit.webp`(대화창 초상, 장부 I6): 출처는 확인됐지만 `home-fox.webp`·`rabbit.webp`를 참고 그림으로 붙여 생성했다(Codex 세션 `rollout-2026-11-12T21-49-36-01a1cfce…`, `../_scratch/npc-10-13-20261112/raw/13.png`). 다시 만들면 1536×768(2:1, 칸당 768², 왼쪽 입 닫힘·오른쪽 입 열림, 투명), 두 칸은 입만 다르고 위치가 같게.
- `public/assets/generated/rabbit-walk.webp`: 지도 보행 루미. 생성 기록에 참고 그림 정보는 없지만 같은 캐릭터라 맞춰야 한다.

## (나) 화풍·해상도가 튀거나 임시인 그림 — 2줄 (추가로 그릴 것 0)

| 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍 맞출 참고 그림 | 왜 필요한지 |
|---|---|---|---|---|
| 홈 오른쪽 아래 별여우 | `public/assets/home-fox.webp` 334×470 | 840×1183(0.71) | 새 `fox.webp` | 1280에서 358px, 1920에서 420px 폭으로 표시해 1.07~1.26배 늘어나고, 2배 화면 태블릿에서는 2.1~2.5배라 흐림. (가)와 같은 파일 |
| 대화창 초상 2장 | `public/assets/dialogue/fox.webp`, `rabbit.webp` 칸당 512×512 | 1536×768(칸당 768²) | 새 포즈 시트 | 최대 380px로 표시해 2배 화면에서 760px가 필요. 출처는 확인됨(I6). 캐릭터를 바꾸면 (가) 「연쇄 교체 후보」로 다시 만든다. 지금 캐릭터를 유지하면 생성 원본 `../_scratch/npc-10-13-20261112/raw/13.png`(1254², 칸 약 627px)에서 `pack.mjs`의 크기만 키워 다시 자를 수 있다(760px에는 조금 모자람) |

확인했지만 새 그림이 필요 없는 것:

- `logo.webp` 1200×400 → 최대 570×190 표시, 2배 여유.
- 기록 배지 `ui/badge-*.webp` 160² → 40~44px 표시, 3.6배 여유.
- 성취 카드 썸네일 `reward-cards/thumb-*.webp` 96×144 → 보관함 칸 26×38px.
- 지도 `generated/world.webp` 1672×941 → 1920에서 약 1.55배 확대되지만 사선 픽셀 지도이고 `world.js` 123행에서 `imageSmoothingEnabled=false`로 그려 뭉개지지 않는다. 지도만 픽셀, 나머지는 2D 일러스트인 것은 `references/README.md`에서 정한 화풍이다. 달빛 길(`run-stage/`)의 픽셀풍 일러스트도 계획서대로다.
- `ui/alert-scene.webp` 1200×675 → 최대 820px 대화창, `generated/dome-restored.webp`·`rooms/*` 1672×941 → 배경, 눈에 띄는 화풍 차이 없음(남색·금색 연구소 그림으로 같음).
- `favicon.svg`는 벡터라 크기 문제 없음.
- 임시·자리표시 그림: `src/`와 `docs/`에서 「임시 그림」·placeholder 그림 표시를 찾지 못했다.

## (다) 점검표 개선에 필요한 소품·배경 — 없음

`docs/reviews/SCORE-100-TODO-20261120.md`의 남은 줄 가운데 그림이 필요한 것은 없다.

| 항목 | 새 그림 | 이유 |
|---|---|---|
| A17 5단원 별 관찰 난이도(관찰 대상·조작을 늘리는 안) | 필요 없음 | s5a·s5b 별 지도는 그림이 아니라 코드다. `src/space-stages.js` 75–89행이 `src/drawing.js`의 `starChart()`를 부르고, 별 위치는 `src/stars.json`(HYG 13별) 좌표를 투영해 SVG로 그리며, 별 하나하나는 `generated/starlight-v3.webp`(256²) 한 장을 재사용한다. 연결선·기준선도 SVG다. 관찰 별이나 별 무리를 늘리면 `stars.json`에 HYG 자료를 더하고(CC BY-SA 4.0 범위 유지) `src/data.js`의 `patternRegions`를 늘리면 된다. 5단원 장면 배경은 이미 `rooms/ch5-north-overlook.webp`가 있다. 방위·지평선 기준 조작을 넣더라도 밤 능선 그림 `generated/run-stage/night-ridge.webp`(2048×437, 투명)를 재사용할 수 있다 |
| B15 비활성 「다음 활동으로」 옆 짧은 이유 문구 | 필요 없음(글자만) | 버튼은 `src/progression.js` 22행이 만드는 글자 버튼이고 `disabled` 상태만 있다. 이유 문구는 버튼 옆 한 줄 글자(예: 「관찰을 6개 채우면 열려요」)라 그림이 아니다. 아이콘을 붙이고 싶으면 `src/drawing.js`의 기존 SVG 아이콘을 쓰면 된다 |
| 그 밖(C20 표기 글자 크기, E1·E2 CSS 정리, D11 오프라인, D3 개념영상 재인코딩) | 필요 없음 | 글자·코드·인코딩 작업이다. D3을 하더라도 그림을 새로 만들지 않는다 |
| F12 사용자 제공 원본 그림 권리 증빙 | (가)와 같음 | 증빙이 오면 (가)의 새 그림 4장이 필요 없어진다 |
