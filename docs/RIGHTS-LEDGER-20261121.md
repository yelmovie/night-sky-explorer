# 13 별빛 관측 연구소 · 권리 장부 (2026-11-21)

운영 업로드에 실제로 들어가는 그림·영상·음악·효과음·음성·글꼴을 한 줄씩(파일이 많으면 묶음으로) 정리했다. 업로드 범위는 `public/` 전체와 빌드된 JS·CSS에서 `scripts/clean-build-metadata.mjs`의 `unusedOriginals`(업로드 제외)를 뺀 것이다.

근거는 기록에 적힌 것만 썼다: `public/assets/CREDITS.md`, `public/assets/audio/Kenney-CC0.txt`, `public/assets/fonts/*OFL*`, 저장소 `docs/`, `references/`, git 커밋 메시지, `../_shared/` 공용 문서. 공용 문서가 가리키는 `../_scratch/` 작업 기록과 이 저장소 `.tmp/`의 생성 스크립트·로그도 「생성 로그」로 인용했다(둘 다 Git 밖이라 지워질 수 있다). 2026-11-21 보강: `../_shared/CODEX-IMAGE-RECORDS-20261121.md`의 방법대로 이 맥의 Codex 세션 기록(`~/.codex/sessions`, 2026-11-05~16)과 Claude Code 대화 기록(2026-11-16~19)을 읽기만 해서 대조했다(색인 `../_shared/codex-image-records-20261121/`). 그 문서의 사용자 말(「이미지는 다 코덱스로 만들었어」 등)은 10번 세션에서 나온 말이라 이 장부에는 쓰지 않았다. 기록이 없으면 추측하지 않고 「출처 미확인」으로 적었다.

- **확인됨**: 만든 도구·날짜와 프롬프트·생성 로그·라이선스 원문 중 하나 이상이 기록에 있다.
- **근거 약함**: 커밋 메시지나 포괄 문구만 있고 파일별 기록이 없다.
- **출처 미확인**: 누가 무엇으로 만들었는지 기록이 없거나, 출처 미확인 그림을 잘라 쓰거나 합성한 파일이다.
- 「확인됨」은 기록이 있다는 뜻이지 상업 배포 권리를 법적으로 보증한다는 뜻이 아니다. 생성 서비스의 요금제 증빙은 맨 아래 「사용자가 줘야 하는 자료」에 모았다.

## 요약

| 상태 | 줄 수 | 해당 줄 |
|---|---:|---|
| 확인됨 | 30 | I1–I7, I9–I19, V1–V3, M1, S1–S2, A1–A4, F1–F2 (I1–I5·I7·V1은 2026-11-21 사용자 확인, V3은 2026-11-21 생성 기록) |
| 근거 약함 | 1 | I8 `favicon.svg`(직접 작성 SVG라 사용자 확인 범위 밖, 그대로 둠) |
| 출처 미확인 | 0 | 2026-11-21 사용자 확인 전에는 7줄(I1–I5, I7, V1) |
| **합계** | **31** | |

업로드되는 파일 수: 그림 60(아래 I1–I19), 영상 묶음 16(mp4 5·webm 5·끝 장면 webp 5·지도 파이널 mp4 1), 배경음 2, 효과음 16, 음성 143, 글꼴 2(+라이선스 원문 2).

이번 정리에서 새로 발견한 것:

1. **옛 음성 29개가 업로드에 그대로 들어간다.** `audio/voices/`의 `el-`가 붙지 않은 `welcome.mp3`·`intro-fox.mp3`·`hint-s1a.mp3` 등 29개(2026-11-10 Momo 음성)는 `src/`에서 부르는 곳이 없는데 `unusedOriginals`에 없다(제외 목록에는 `hint-*-v2/v3` 세 개만 있다). 출처 기록과 해시는 맞다(A4). 업로드 제외 대상에 넣을지는 별도 결정이 필요하다.
2. 개념영상 5편(V1)은 출처 미확인인 `fox.png`·`rabbit.png` 포즈 시트를 잘라 넣었다(`films/build.mjs` 2·26행). 루미·별여우 그림의 권리가 풀리기 전에는 영상도 같은 상태다.
3. 장별 배경(I16)과 기록 배지·인증서 틀·경보 장면(I17)의 프롬프트·생성 로그는 저장소 `.tmp/`에만 있다. 성취 카드(I18)·지도 전투 인물(I19)·지도 파이널 영상(V2)의 기록은 `../_scratch/`에만 있다. 지워지기 전에 `docs/`로 옮겨 두는 게 좋다.
4. 성취 카드(I18), 달빛 길 시작 카드(I15 `start-card.webp`)는 참고 그림으로 출처 미확인인 루미 원본(`rabbit.webp`/`rabbit.png`)을 붙여 만들었다. 생성 기록은 확인됐지만 캐릭터 디자인 권리는 I4에 기댄다.
5. 음성 143개 전부 출처 JSON의 SHA-256과 현재 파일이 일치한다(2026-11-21 대조: VOICE-FILL 105/105, NPC-DIALOGUE 8/8, CINEMA-VOICE 1/1, VOICE-PROVENANCE-20261110 29/29). 배경음 2곡은 `references/suno/` 원본과 바이트가 같다.
6. **(2026-11-21 보강) 대화 초상(I6)의 생성 기록을 찾았다.** Codex 세션 `rollout-2026-11-12T21-49-36-01a1cfce…`에서 2026-11-12 21:53(KST) `image_gen`으로 만든 2×2 시트(`exec-131a80cc…`)를 `../_scratch/npc-10-13-20261112/raw/13.png`로 옮기고 `pack.mjs`로 잘랐다. `pack.mjs`를 메모리에서 다시 돌린 결과가 지금 `dialogue/fox.webp`·`rabbit.webp`와 SHA-256까지 같다. 다만 참고 그림이 `home-fox.webp`(I5)·`rabbit.webp`(I4)라 캐릭터 디자인 권리는 I3·I4에 기댄다. I1–I4 원본은 2026-10-14 이전에 받은 것이라 이 맥의 생성 기록(11-05부터)으로는 확인할 수 없었다(10월 Codex 세션 5개와 13번 Claude Code 대화에도 `chatgpt_generated`·출처 언급 없음). I5·I7·V1은 그 원본을 잘라 쓰거나 합성했으므로 그대로 둔다.
7. **(2026-11-21 09:25 사용자 확인)** 조율 세션이 사용자에게 「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제로 만든 게 맞아?」라고 묻고 「전부 맞아」라는 답을 받았다(`../_shared/CODEX-IMAGE-RECORDS-20261121.md` 「16곳 전체 확인」). 그 쓰는 법대로 생성 로그가 없는 사용자 원본 4장(I1–I4)을 「확인됨(사용자 확인)」으로, 그 그림을 잘라 쓰거나 합성한 I5·I7을 승계로 바꿨다. 저장소에 다른 출처를 가리키는 증거는 없었다(원본 이름 `chatgpt_generated_*`도 같은 쪽). **어긋난 곳 하나:** 개념영상(V1)은 저장소 기록(`films/build.mjs`, `films/REVIEW.md`, 커밋 `5bae5a8`·`500c3e3`·`7ff790b`)으로는 제미나이가 아니라 HyperFrames로 직접 렌더한 영상이다. 그래서 만든 도구는 증거대로 두고, 안에 든 그림만 사용자 확인을 승계해 「확인됨」으로 적었다. I8 `favicon.svg`는 직접 쓴 SVG라 이 확인의 범위가 아니어서 「근거 약함」 그대로다.

## 그림

| 줄 | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| I1 | `assets/observatory.webp` (1672×941, 홈·공통 배경) | Codex(GPT 이미지) — 사용자가 만들어 준 원본 `chatgpt_generated_31.png`. 파일 이름(ChatGPT 생성)과 사용자 확인이 어긋나지 않음 | 2026-10-14 이전(이 맥의 생성 기록은 11-05부터라 로그 없음). 2026-11-09 PNG→WebP 변환(`347bf30`). 사용자 확인 2026-11-21 09:25(조율 세션 질문 「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제로 만든 게 맞아?」 → 「전부 맞아」), `../_shared/CODEX-IMAGE-RECORDS-20261121.md` 「16곳 전체 확인」 | ChatGPT 유료 요금제(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(「기존 제공 이미지」), `references/manifest.json`, `references/images/backgrounds/chatgpt_generated_31.png` | 확인됨(사용자 확인) |
| I2 | `assets/logo.webp` (1200×400, 홈 로고) | Codex(GPT 이미지) — 사용자가 만들어 준 원본 `chatgpt_generated_41.png`. 파일 이름(ChatGPT 생성)과 사용자 확인이 어긋나지 않음 | 2026-10-14 이전(이 맥의 생성 기록은 11-05부터라 로그 없음). 2026-11-09 PNG→WebP 변환(`347bf30`). 사용자 확인 2026-11-21 09:25(조율 세션 질문 「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제로 만든 게 맞아?」 → 「전부 맞아」), `../_shared/CODEX-IMAGE-RECORDS-20261121.md` 「16곳 전체 확인」 | ChatGPT 유료 요금제(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(「기존 제공 이미지」), `references/manifest.json`, `references/images/branding/chatgpt_generated_41.png` | 확인됨(사용자 확인) |
| I3 | `assets/fox.webp` (1672×941, 별여우 포즈 시트 5×2) | Codex(GPT 이미지) — 사용자가 만들어 준 원본 `chatgpt_generated_43.png`. 파일 이름(ChatGPT 생성)과 사용자 확인이 어긋나지 않음 | 2026-10-14 이전(이 맥의 생성 기록은 11-05부터라 로그 없음). 2026-11-09 PNG→WebP 변환(`347bf30`). 사용자 확인 2026-11-21 09:25(조율 세션 질문 「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제로 만든 게 맞아?」 → 「전부 맞아」), `../_shared/CODEX-IMAGE-RECORDS-20261121.md` 「16곳 전체 확인」 | ChatGPT 유료 요금제(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(「기존 제공 이미지」), `references/manifest.json`, `references/images/characters/chatgpt_generated_43.png` | 확인됨(사용자 확인) |
| I4 | `assets/rabbit.webp` (1672×941, 루미 포즈 시트 5×2) | Codex(GPT 이미지) — 사용자가 만들어 준 원본 `chatgpt_generated_42.png`. 파일 이름(ChatGPT 생성)과 사용자 확인이 어긋나지 않음 | 2026-10-14 이전(이 맥의 생성 기록은 11-05부터라 로그 없음). 2026-11-09 PNG→WebP 변환(`347bf30`). 사용자 확인 2026-11-21 09:25(조율 세션 질문 「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제로 만든 게 맞아?」 → 「전부 맞아」), `../_shared/CODEX-IMAGE-RECORDS-20261121.md` 「16곳 전체 확인」 | ChatGPT 유료 요금제(사용자 확인). 요금제 화면 캡처는 납품 증빙으로 따로 남김 | `public/assets/CREDITS.md`(「기존 제공 이미지」), `references/manifest.json`, `references/images/characters/chatgpt_generated_42.png` | 확인됨(사용자 확인) |
| I5 | `assets/home-fox.webp` (334×470, 홈 별여우) | `fox.webp` 첫 칸을 잘라낸 파일 | 2026-11-11(CREDITS), 커밋 `11b72bf`(2026-11-12) | 원본(I3) 조건을 그대로 따름 | `public/assets/CREDITS.md`(「첫 화면 캐릭터 최적화」) | 확인됨(I3 승계, 사용자 확인) |
| I6 | `assets/dialogue/fox.webp`, `rabbit.webp` (각 1024×512, 입 닫힘·열림 2칸) | Codex 내장 이미지 도구(GPT 이미지, `image_gen`)로 만든 2열×2행 투명 시트 한 장을 `pack.mjs`가 잘라 칸당 512² WebP로 만듦. 참고 그림으로 `home-fox.webp`(I5)·`rabbit.webp`(I4)를 붙임 | 2026-11-12 21:53 KST(12:53:44Z), Codex 세션 `rollout-2026-11-12T21-49-36-01a1cfce…`의 `image_gen.generation` `exec-131a80cc…`(「Use case: illustration-story. Deliverable: one production-ready educational adventure game dialogue portrait spritesheet」). 같은 세션에서 `../_scratch/npc-10-13-20261112/raw/13.png`(1254²)로 복사 → `pack.mjs`로 분리. 2026-11-21 `pack.mjs`를 메모리에서 다시 돌려 두 파일 SHA-256 일치 확인. 커밋 `3b8a072`(2026-11-13) | 생성 당시 OpenAI 계정 이용 조건(요금제 기록 없음). 캐릭터 디자인은 I3·I4 조건 | `../_scratch/npc-10-13-20261112/HANDOFF.md`(10행), `raw/13.png`, `pack.mjs`(10행), `../_scratch/npc-dialogue-plan-20261112/HANDOFF-5-16.md`(39행), `../_shared/codex-image-records-20261121/index.jsonl`(81행) | 확인됨(캐릭터 디자인은 I3·I4에 기댐) |
| I7 | `og.jpg` (1200×630, 공유 썸네일) | 관측소 배경(I1)과 로고(I2)를 합성. 새 생성 없음 | 커밋 `053c819`(2026-11-10) 메시지 | I1·I2 조건을 따름 | git log `053c819` | 확인됨(I1·I2 승계, 사용자 확인) |
| I8 | `favicon.svg` (64×64 SVG 별 하나) | 직접 작성 SVG로 보임. CREDITS의 「직접 작성 SVG·Canvas」 줄이 아이콘 전반을 말하지만 파일 이름은 없음 | 커밋 `f2df05a`(2026-10-28) | 프로젝트 자체 제작(표기 「기획·제작: 옐샘 & ⓒ 아이스크림미디어」) | `public/assets/CREDITS.md`(도구·라이선스 검토 표), git log | 근거 약함 |
| I9 | `generated/world.webp` (1672×941, 지도) | OpenAI built-in image_gen(Codex) | 2026-10-22. 원본 `references/generated/world.png`, SHA-256·크기 manifest, 지도 프롬프트 | 생성 당시 OpenAI 계정 이용 조건(요금제 기록 없음) | `references/generated/manifest.json`, `docs/ASSET_PRODUCTION_V2.md`(「지도 프롬프트」), `docs/SOURCES.md` | 확인됨 |
| I10 | `generated/student.webp`, `rabbit-walk.webp` (각 1254², 보행 시트) + `sprites.json`(코드가 만든 칸 좌표 데이터) | OpenAI built-in image_gen | 2026-10-22, 원본·manifest·「보행 시트 프롬프트」. `rabbit-walk`는 2026-11-10 교체(`6bd1a3c`) | 위와 같음 | 위 manifest, `docs/ASSET_PRODUCTION_V2.md`, `scripts/prepare-generated.mjs` | 확인됨 |
| I11 | `generated/{mercury,venus,earth,mars,jupiter,saturn,uranus,neptune}.webp` (각 1254²) | OpenAI built-in image_gen | 2026-10-22, 원본·manifest·「행성 생성 공통 프롬프트」 | 위와 같음. 학습용 재현 그림(실제 사진 아님) | 위 manifest, `docs/ASSET_PRODUCTION_V2.md`, `docs/planet-generation-prompts.json`, `docs/3D_ASSET_PROMPTS.md` | 확인됨 |
| I12 | `generated/telescope-frame.webp` (1254²), `dome-restored.webp` (1672×941) | OpenAI built-in image_gen | 2026-10-22, 원본·manifest·「망원경 프레임」「복구된 돔」 프롬프트 | 위와 같음 | 위 manifest, `docs/ASSET_PRODUCTION_V2.md` | 확인됨 |
| I13 | `generated/sun-v3.webp`, `starlight-v3.webp`, `core-dial-v3.webp` | OpenAI built-in image_gen | 2026-10-28, 원본 PNG·프롬프트 원문·SHA-256 | 위와 같음 | `references/generated/concepts-v3/manifest.json`, `public/assets/CREDITS.md`(2026-10-28 절) | 확인됨 |
| I14 | `generated/moon-surface-v4.webp` (1024², 투명) | OpenAI 기본 image_gen | 2026-11-12, 원본 `asset-bank/original/moon-surface-v4.png`, 원본·적용본 SHA-256, 프롬프트 원문 | 위와 같음 | `docs/reviews/RELEASE-REVIEW-20261112.md`(69–74행), `public/assets/CREDITS.md`(2026-11-12 절) | 확인됨 |
| I15 | `generated/run-stage/` 9장(`night-ridge`, `night-grass`, `night-path`, `stone-wall`, `door`, `stream`, `observatory`, `props`, `start-card`) | `gpt-imagegen` 스킬(ChatGPT 앱 Codex CLI 내장 이미지 도구) | 2026-11-17, 원본 `asset-bank/original/run-stage-20261117/`, 장별 프롬프트·참고 그림 표. `start-card`는 참고 그림으로 `public/assets/rabbit.png`(I4 원본)를 붙임 | 생성 당시 계정 이용 조건 | `docs/RUN-STAGE-3D-PLAN-20261117.md`(「이미지 생성·적용 목록」, 192–210행), `public/assets/CREDITS.md`(2026-11-17 절), 커밋 `bd1736d` | 확인됨 |
| I16 | `rooms/ch1-moon-deck`, `ch2-time-archive`, `ch3-planet-lab`, `ch4-starlight-deck`, `ch5-north-overlook` (.webp, 각 1672×941) | `gpt-imagegen` 스킬(Codex 이미지 도구). 참고 그림 변수는 있으나 실제로 넘기지 않음 | 2026-11-16 23:56–11-17 00:02 생성, 로그에 5장 저장·실패 0. 원본 `references/generated/stage-rooms-20261116/` | 생성 당시 계정 이용 조건 | `.tmp/gen-rooms.sh`(프롬프트), `.tmp/gen-rooms.log`, `HANDOFF.md`(121행), 커밋 `6886cee`(「Five generated chapter backgrounds」) | 확인됨(기록이 Git 밖 `.tmp`에만 있음) |
| I17 | `ui/badge-{moon,time,planet,light,sky}.webp`(각 160²), `ui/cert-frame.webp`(1400×876), `ui/alert-scene.webp`(1200×675) | `gpt-imagegen` 스킬(Codex 이미지 도구) | 2026-11-17 00:39–00:48 생성, 로그에 7장 저장·실패 0. 원본 `references/generated/ui-art-20261117/` | 생성 당시 계정 이용 조건 | `.tmp/gen-ui.sh`(프롬프트), `.tmp/gen-ui.log`, `.tmp/convert-ui.mjs`, `HANDOFF.md`(121행), 커밋 `47e7485`(「GPT art」) | 확인됨(기록이 Git 밖 `.tmp`에만 있음) |
| I18 | `reward-cards/card-{1..5}-{1..5}.webp`(640×960), `thumb-*.webp`(96×144) 10개 | ChatGPT 앱 Codex 내장 이미지 도구(`gpt-imagegen`) | 2026-11-18. 원본 `../_scratch/reward-cards-20261118/gen/13/`. 참고 그림: `generated/student.webp`, `map-encounters/hero-redraw.png`, `rabbit.webp`(I4), `rooms/` | 생성 당시 계정 이용 조건 | `public/assets/CREDITS.md`(2026-11-18 절), `../_scratch/reward-cards-20261118/specs/13.json`, `queue.mjs`, `queue.log`, 커밋 `0b92ae6` | 확인됨(캐릭터 디자인은 I4에 기댐) |
| I19 | `map-encounters/hero-redraw.png`, `ally-redraw.png`, `villain-redraw.png` (각 672×112, 112px 6칸) | Codex 기본 이미지 도구 | 2026-11-14. 공통 프롬프트 원문과 「13은 관측원·달토끼·별 투사기 레퍼런스」 기록 | 생성 당시 계정 이용 조건 | `../_shared/MAP-VILLAINS-HANDOFF-20261114.md`(131–133행)이 가리키는 `../_scratch/redraw-12-15-20261114/README.md`(3·16행), 커밋 `520d583` | 확인됨(기록이 저장소 밖) |

## 영상

| 줄 | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| V1 | `concepts/stage-{1..5}.mp4`·`.webm`·끝 장면 `.webp` (15개, 1280×720, 16초, 소리 있음) | HyperFrames로 렌더(`films/`). 그림은 게임 에셋 재사용: 달·태양·별빛·행성(I11·I13·I14) + **`fox.png`·`rabbit.png` 포즈 시트를 잘라 넣음**. 소리는 Kenney CC0 효과음 5종(`.ogg`, 업로드 제외 파일이지만 영상 소리에 들어감). 2026-11-19 자막을 Jua 글꼴로 화면에 입힘 | 2026-11-09 교체(`5bae5a8`), 11-14 재렌더(`500c3e3`), 11-19 자막 입힘(`7ff790b`) | 루미·별여우 그림은 I3·I4 조건. 소리 CC0, 글꼴 OFL 1.1(렌더된 글자 사용 허용) | `films/build.mjs`(2·26·36·37행), `films/REVIEW.md`, `docs/concept-captions-20261118/stage-*.ass`(Fontname Jua), `../_shared/FULLSCREEN-CAPTION-CONCEPTS-20261118.md`, CREDITS(2026-10-22 절) | 확인됨(자체 렌더. 포함된 루미·별여우 그림은 I3·I4 사용자 확인 승계). 만든 도구는 저장소 기록대로 HyperFrames이고 제미나이가 아니다(아래 7번) |
| V2 | `map-encounters/map-finale.mp4` (640×360, 6초, 무음) | 실제 지도 공격 장면 캡처(`../_scratch/live-map-contact-review/originals/13-attack.png`) 한 장에 FFmpeg로 확대·글자(drawtext)를 얹음. 화면 속 그림은 I9·I10·I19 | 2026-11-14(`33c7ee8`), 같은 날 글꼴을 나눔스퀘어 네오로 다시 만듦(`7a8745c`) | 화면 속 그림·글꼴 조건을 따름 | `../_scratch/stage-villain-dialogue/movies.py`(5–16행), git log | 확인됨(기록이 저장소 밖) |
| V3 | `films/intro.{webm,mp4,webp}`, `films/final.{webm,mp4,webp}` (인트로 27.8초·엔딩 26.0초, 1280×720, 대사·자막 포함, 2026-11-21) | 장면 그림 6장: Codex 내장 이미지 도구(GPT 이미지, `gpt-imagegen`). 인트로 1컷: Google Flow · Veo 3.1 Fast(그림→영상, 주 계정). 엔딩 2컷: Gemini 앱 동영상 만들기(Veo, 보조 계정 1, 화면 표시 PRO, 사용자 확인 2026-11-21: 유료, 16:39). 인트로 3컷: Gemini 앱 동영상 만들기(Veo, 보조 계정 3, 2026-11-21 20:14, 채팅 `de28979c62cf54a2`, 요금제 표시는 따로 확인 못 함). 나머지 3컷(인트로 2·엔딩 1·엔딩 3): 같은 그림에 ffmpeg 카메라 움직임(Flow 크레딧 부족, Gemini 시도는 오류이거나 별자리가 틀려 쓰지 않음, 시도 기록 `docs/films-20261121/provenance.json` geminiAttempts). 새 대사 4줄: ElevenLabs API(eleven_v4, 기존 Aria·oki·Hun 목소리), 엔딩 대사는 기존 `el-movie-2·4`·`el-ending` 재사용. 자막: Jua(OFL). 영상 소리는 대사만, 배경 음악은 앱의 Suno 곡(M1)을 앱이 재생. 끝 화면에 앱 제목 로고(I2)·별빛 그림(I14) 사용 | 2026-11-21 11:30–11:41 그림 생성, 11:33–11:39 Flow(Aside 세션 `AhMpD7yBVh8uUMTY`), ElevenLabs requestId `wFzxmjRvxusY5H8Jw7c6`·`sbW0CdFQt7vmQjgjU1DW`·`H6WCAAbLdTPGzcflWCBH`·`J8HVcImsi15SrW0JH1gT` | ChatGPT·Google Flow·ElevenLabs 유료 요금제(2026-11-21 사용자 확인 「전부 맞아」, ElevenLabs Creator). Flow 영상에는 계정 지역 설정상 필수인 작은 「Veo」 표시가 오른쪽 아래에 있다(지우지 않음). 캐릭터 디자인은 I3·I4 | `docs/films-20261121/provenance.json`(파일별 SHA-256·생성 시각·프롬프트 키), `prompts.json`, `voice-api-log.jsonl`, `compose.py`·`kb.py`·`burn-*.json`, 원본 `references/film-20261121/` | 확인됨 |

## 음악

| 줄 | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| M1 | `audio/bgm/main-theme.mp3`, `final-theme.mp3` | Suno(사용자가 생성해 제공) | 2026-11-17. 프롬프트는 공용 HTML의 13번 항목(Main Theme·Final). 원본 `references/suno/main_theme.mp3`·`final.mp3`와 바이트 일치(2026-11-21 `cmp`) | 생성 당시 Suno **Premier 유료 요금제**(2026-11-18 사용자 확인) | `public/assets/CREDITS.md`(도구 표 「배경음 2곡」), `../_shared/music-prompts-10-16.html`(175–183행), `../_shared/BGM-APPLY-BRIEF-20261117.md`, `../_shared/voice-provenance-20261118.md`(요금제 표), 커밋 `e874e74` | 확인됨 |

## 효과음

| 줄 | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| S1 | `audio/sfx/` 15개: `twinkle-02`, `twinkle-03`, `bell-ding-03`, `hit-heavy-02`, `villain-exit-01`, `villain-appear-02`, `hurt-bump-01`, `reward-01`, `reward-03`, `wind-whoosh-03`, `pickup-01`, `victory-jingle-01`, `step-01`, `step-02`, `water-splash-02` (.mp3) | Freesound 제작자별 원본(CREDITS 표에 파일마다 원본 이름·제작자·주소) → 과학34 공용 효과음 라이브러리에서 무음 제거·페이드·음량 맞춤 | 2026-11-17 라이브러리 작성 때 원본 페이지에서 라이선스 재확인. 적용 2026-11-18(`7297c06`, `0b92ae6`), 11-19(`39487a9`) | **CC0 1.0**(표기 의무 없음, 출처는 남김) | `public/assets/CREDITS.md`(2026-11-17·11-18·11-19 절), `../_shared/sfx-library-20261117/manifest.json`(`license_policy`: CC0·PDM만), `../_shared/sfx-library-20261117/CREDITS.md`, `../_shared/SFX-APPLY-BRIEF-20261117.md` | 확인됨 |
| S2 | `audio/sfx/open-01.mp3` | Kenney Interface Sounds 1.0 `maximize_008` → 같은 공용 라이브러리 가공 | 2026-11-19(`39487a9`) | **CC0 1.0** | `public/assets/CREDITS.md`(2026-11-19 절), `public/assets/audio/Kenney-CC0.txt`(업로드됨) | 확인됨 |

참고: 버튼·발견 등 화면 효과음은 파일이 아니라 `src/theme-effects.js`의 Web Audio 합성 코드다(`docs/AUDIO-PROVENANCE.md`). 장부 대상 파일이 아니라 줄로 세지 않았다.

## 음성

| 줄 | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| A1 | `audio/voices/el-*.mp3` 105개(change·concept·goal·hint·info·intro-alert·kit·map·movie·report·retry·task·villain) | ElevenLabs `eleven_v4`, 라이브러리 음성 `Hun 훈`(별여우)·`Aria – Bright & Youthful Korean`(루미)·`oki - casual and fun`(별빛 가림이). 실제 인물 복제 없음 | 2026-11-18. 줄마다 대사·생성 ID·받아쓰기·음량·SHA-256. SHA 105/105 일치 | **Creator 유료 요금제**(상업 이용 가능, 2026-11-18 계정 조회·사용자 확인) | `docs/VOICE-FILL-20261118.json`, `public/assets/CREDITS.md`(2026-11-18 절), `../_shared/voice-provenance-20261118.md`(요금제 표, 「13번」 115–120행), `../_shared/VOICE-FILL-BRIEF-20261118.md` | 확인됨 |
| A2 | `el-welcome`, `el-intro-fox`, `el-intro-lumi`, `el-reward-1..5` (.mp3, 8개) | ElevenLabs `eleven_v4`, `Hun 훈`·`Aria` | 2026-11-12~13(`3b8a072`). 줄마다 생성 ID·SHA-256. SHA 8/8 일치 | 생성 당시 **Starter 유료 요금제** | `docs/NPC-DIALOGUE-20261112.json`, `../_shared/voice-provenance-20261118.md` | 확인됨 |
| A3 | `el-ending.mp3` | ElevenLabs `eleven_v4`, `Hun 훈` | 2026-11-13. 생성 ID·SHA-256·LUFS. SHA 일치 | 생성 당시 Starter 유료 요금제 | `docs/CINEMA-VOICE-20261113.json` | 확인됨 |
| A4 | `welcome`, `intro-fox`, `intro-lumi`, `map-1..3`, `hint-s1a..s5b`(10), `retry-*`(3), `reward-1..5`, `kit-*`(3), `report`, `ending` (.mp3, 29개) — **앱이 재생하지 않지만 업로드됨** | 로컬 Momo / Qwen3-TTS-12Hz-1.7B-VoiceDesign(프리셋 05·02). 실제 인물 복제 없음 | 2026-11-10. 줄마다 대사·프리셋·시드·SHA-256. SHA 29/29 일치 | 모델 라이선스 Apache-2.0(출력물 권리 보증 아님, CREDITS 명시). 모델 라이선스 원문 사본은 저장소에 없음 | `docs/VOICE-PROVENANCE-20261110.json`, `public/assets/CREDITS.md`(2026-11-10 절), `docs/VOICE-FILL-20261118.json`(`replacedFiles`: 코드에서 더 이상 쓰지 않음) | 확인됨 |

## 글꼴

| 줄 | 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 경로 | 상태 |
|---|---|---|---|---|---|---|
| F1 | `fonts/NanumSquareNeoTTF-bRg.woff2`, `NanumSquareNeoTTF-cBd.woff2` + `NanumSquareNeo-OFL.txt` | 네이버 공식 배포 원본(수정 없음) | 2026-11-10 받음, 원문 확인일 기록 | **SIL OFL 1.1**(글꼴 자체 판매 금지, 동봉 재배포 허용) | `public/assets/fonts/NanumSquareNeo-OFL.txt`, `public/assets/CREDITS.md`(「나눔스퀘어 네오 UI 글꼴」), `src/styles.css`(2–3행) | 확인됨 |
| F2 | Jua(배달의민족 주아): 글꼴 파일은 업로드 제외, **`fonts/Jua-OFL.txt`는 업로드되고 개념영상 자막 글자(V1)에 렌더돼 들어감** | Woowahan Brothers, Google Fonts 배포 | 2026-10-22 원문 동봉 | **SIL OFL 1.1**(렌더된 글자·영상 사용 허용) | `public/assets/fonts/Jua-OFL.txt`, `public/assets/CREDITS.md`(도구 표·「과학·폰트·고지」), `docs/concept-captions-20261118/stage-*.ass` | 확인됨 |

## 화면 CSS가 부르는 그림 대조

`src/`의 `url(`·`src=`가 부르는 그림은 모두 위 줄에 들어 있다: `observatory.webp`(classroom·flow-refresh·polish·quest·styles.css → I1), `fox.webp`·`rabbit.webp`(classroom·quest·styles.css → I3·I4), `home-fox.webp`(scenery-surfaces.css → I5), `rooms/ch1~5`(flow-refresh.css → I16), `ui/cert-frame.webp`(design-refresh.css → I17), `dialogue/${id}.webp`(quest.js → I6), 글꼴 2종(styles.css → F1). 나머지 `url(#…)`은 SVG 내부 참조다.

## 업로드 제외 (장부 대상 아님)

`scripts/clean-build-metadata.mjs`의 `unusedOriginals`가 `.assetsignore`로 빼는 파일. 운영에서 404이고 앱도 부르지 않는다. 출처는 참고로만 적는다.

| 파일 | 출처 기록 |
|---|---|
| `assets/observatory.png`, `logo.png`, `rabbit.png`, `fox.png` | I1–I4의 원본 크기 PNG(사용자 제공, 2026-11-21 사용자 확인으로 Codex 생성). 개념영상 제작(`films/build.mjs`)과 달빛 길 시작 카드 참고 그림으로 쓰였다 |
| `assets/fonts/jua-korean-400.woff2`, `jua-latin-400.woff2` | Jua, SIL OFL 1.1(`Jua-OFL.txt`) |
| `assets/audio/*.ogg` 6개(`click`, `capture`, `place`, `discover`, `success`, `hint`) | Kenney Interface Sounds, CC0(`Kenney-CC0.txt`, CREDITS 2026-10-22 절). 2026-11-09부터 앱에서 재생 안 함. 개념영상 소리에는 들어 있음(V1) |
| `assets/audio/npc-welcome.m4a` | Momo `momo-voice`(Supertonic 3, OpenRAIL-M), `docs/AUDIO-PROVENANCE.md`, `docs/SUPERTONIC3-LICENSE.txt` |
| `assets/audio/voices/hint-s1a-v2.mp3`, `hint-s2a-v3.mp3` | 로컬 Qwen3-TTS 0.6B Base 참조 복제(참조 음성은 ElevenLabs Soo), `docs/VOICE-PROVENANCE-20261117.json` |
| `assets/audio/voices/hint-s2a-v2.mp3` | ElevenLabs `eleven_v4` Soo, `docs/VOICE-PROVENANCE-20261112.json` |
| `assets/generated/moon-surface-v3.webp` | OpenAI image_gen, `references/generated/concepts-v3/manifest.json` |
| `assets/map-encounters/ally.png`, `hero.png`, `villain-left.png` | 다시 그리기 전 지도 인물(2026-11-14 `4a36502`). 파일별 생성 기록은 찾지 못함 |

업로드되는 문서 파일 `assets/CREDITS.md`, `audio/Kenney-CC0.txt`, `fonts/*-OFL.txt`는 고지용 원문이라 줄로 세지 않았다(F1·F2·S2에서 근거로 인용).

## 사용자가 줘야 하는 자료

1. ~~**사용자 제공 그림 4종(I1–I4)의 원출처 증빙**~~ — 2026-11-21 사용자 확인(Codex·유료 요금제)으로 장부는 채웠다. 남는 것은 3번 요금제 증빙(그때 날짜의 구독 화면)뿐이다. (원래 요청: — `references/images/`의 `chatgpt_generated_31`(관측소 배경), `_41`(로고), `_42`(루미), `_43`(별여우)을 만든 서비스(ChatGPT 등)·계정·생성 날짜와 그때 요금제 화면, 또는 대화 링크·생성 기록 캡처. 외주·지원받은 그림이면 계약서나 납품 메일(이용 범위·권리 귀속 조항 포함). 이것이 풀리면 I5·I7·V1과 참고 그림으로 쓴 I6 대화 초상·I15 `start-card`·I18의 캐릭터 디자인 문제도 함께 풀린다(점검표 F12).)
2. ~~**대화 초상(I6) 제작 경위**~~ — 2026-11-21 Codex 세션 기록으로 확인해 더 필요 없다(I6 줄).
3. **OpenAI(ChatGPT·Codex) 요금제 증빙**(납품 때 붙이는 증빙, 장부를 채우는 데는 필요 없음) — 그림 생성 날짜별 구독 화면이나 영수증: 2026-10-14 이전(I1–I4), 2026-10-22(I9–I12, Windows 쪽 Codex 계정), 10-28(I13), 11-12(I6·I14), 11-14(I19), 11-16~17(I15–I17), 11-18(I18).
4. **ElevenLabs 결제 증빙** — 11-12~13 생성분(A2·A3)의 Starter, 11-18 생성분(A1)의 Creator 구독·결제 화면이나 영수증. 라이브러리 음성(Hun 훈·Aria·oki) 사용 조건 화면이 있으면 함께.
5. **Suno Premier 증빙** — 2026-11-17 두 곡(M1) 생성 시점의 구독 화면이나 영수증, 두 곡의 Suno 곡 페이지 링크.
6. **(선택) Qwen3-TTS 모델 라이선스 원문** — A4 29개를 계속 업로드한다면 모델 카드의 Apache-2.0 원문 사본. 업로드 제외 목록에 넣는다면 필요 없다.
7. **(선택) Freesound 원본 페이지 캡처** — S1 15개는 공용 라이브러리가 CC0 재확인을 기록했지만, 납품처가 원본 화면 증빙을 요구하면 페이지별 캡처.
