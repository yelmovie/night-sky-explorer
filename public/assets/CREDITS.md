# 도구·자료·라이선스 기록

## 2026-11-18 캐릭터 음성 통일 (ElevenLabs)

지금 게임에서 재생하는 대사 음성은 모두 ElevenLabs 유료 요금제(상업 이용 가능)의 `eleven_v4`로 만든 AI 생성 음성(`audio/voices/el-*.mp3`)이다. 별여우 연구관은 `Hun 훈`, 달토끼 기록원 루미(내레이션 포함)는 `Aria – Bright & Youthful Korean`, 지도 악당 별빛 가림이는 `oki - casual and fun` 라이브러리 음성을 쓴다. 실제 인물의 목소리를 복제하지 않았다. 줄마다 대사·생성 ID·받아쓰기 검수·음량·SHA-256은 `docs/VOICE-FILL-20261118.json`에 있다. 아래 2026-11-10 Momo/Qwen3-TTS 음성과 2026-11-17 로컬 복제 음성은 더 이상 재생하지 않는다.

## 2026-11-12 학습 그림·음성 수정

달 관측 화면에는 OpenAI 기본 image_gen으로 생성한 `generated/moon-surface-v4.webp`를 적용했다. 밝고 어두운 지대와 충돌 구덩이를 비교하는 학습용 그림이다. 위상 계산과 별 좌표는 코드로 제어한다. 원본, 프롬프트와 SHA-256은 `docs/reviews/RELEASE-REVIEW-20261112.md`에 기록했다.

`audio/voices/hint-s2a-v2.mp3`는 현재의 날짜 선택 후 기록 버튼 조작에 맞춰 ElevenLabs의 `eleven_v4`, 라이브러리의 `Soo - Warm Korean Teacher` 음성으로 생성했다. 제공자·선택한 테이크·대사·해시·자동 전사 결과는 `docs/VOICE-PROVENANCE-20261112.json`을 따른다. 해당 음성에는 제공자의 이용 조건이 적용된다. 생성 당시 ElevenLabs Starter 유료 요금제를 구독 중이었다(상업 이용 가능, 2026-11-18 사용자 확인).

아래의 날짜별 기록은 각 시점의 작업 범위를 설명한다. 현재 공개 배포와 검증 결과는 2026-11-12 최종 검토 문서에 정리했다.

## 2026-10-28 개념 그림 개선

OpenAI built-in `image_gen`으로 달 표면, 태양, 별빛, 코어 보정 장치 외관을 각각 독립된 투명 PNG로 생성했다. 학습용 재현 그림이며 실제 관측사진·검증된 표면 지도가 아니다. 원본과 최종 프롬프트·SHA256·서비스 파일 규격은 `references/generated/concepts-v3/manifest.json`에 보존했다.

| 서비스 파일 | 크기 | 적용 |
|---|---|---|
| `generated/moon-surface-v3.webp` | 1024×1024, 투명 | 달 관측·표면 비교·위상·연구 노트·결과·개념영상 |
| `generated/sun-v3.webp` | 640×640, 투명 | 태양계 순서·별/행성 자료·빛 반사 실험·결과·개념영상 |
| `generated/starlight-v3.webp` | 256×256, 투명 | 별 자료·정확한 좌표의 별 지도·기록·개념영상 |
| `generated/core-dial-v3.webp` | 640×640, 투명 | 코어 보정 장치의 외관 |

네 WebP 합계 575,520B. 위상 마스크, 별 좌표·등급별 크기, 광선 방향·차단 상태, 바늘·목표 각도, 글자·버튼은 코드로 제어한다. 달의 표면 무늬는 위상이 바뀌어도 좌우로 뒤집히지 않는다. 개념영상의 행성 그림은 기존 생성 행성 에셋을 재사용한다. 기존 13개 원본은 보존했다.

기록일: 2026-10-22. 로컬 고도화 MVP의 출처와 확인 상태다. **상업 배포 권리 검토 완료를 뜻하지 않는다.** 외부 공개 배포는 현재 요청 범위가 아니다.

## 도구·라이선스 검토

| 도구·자료 | 범위 | 확인 근거·조건 | 상태·남은 일 |
|---|---|---|---|
| Three.js 0.180.0 | 선택 행성 실제 3D | `node_modules/three/LICENSE`: MIT, three.js authors | 로컬 원문 확인. 납품물 저작권·허락 고지 유지 필요 |
| Vite 7.1.12 | 개발·정적 빌드 | `node_modules/vite/LICENSE.md`: core MIT | 로컬 원문 확인. 의존성 고지는 실제 산출물 기준 확인 |
| 기존 사용자 AI이미지4종 | 배경·로고·달토끼·별여우 | 사용자 제공. 서비스·요금제·원생성일·외부 배포권 기록 미제공 | **원출처 권리 확인 필요.** 제공을 상업 사용 허가로 간주하지 않음 |
| built-in imagegen 새13종 | 지도1·보행2·행성8·프레임1·돔1 | `references/generated/manifest.json`: 2026-10-22, OpenAI built-in image_gen. PNG13개·서비스 WebP13개 존재와 크기 확인 | 생성 파일 보존 완료. 실제 화면 적용·보행 시트 품질은 검증 기록 참조. 계정별 생성 당시 이용 조건은 별도 확인 |
| Google Fonts Jua | 제목·짧은 안내 self-host | `fonts/jua-korean-400.woff2`, `jua-latin-400.woff2`, `Jua-OFL.txt` 존재. Copyright 2017 Woowahan Brothers Corp., SIL OFL1.1 | OFL 원문·저작자 고지 동봉 확인. 폰트 파일은 수정하지 않음 |
| HYG v4.1 발췌 | `src/stars.json` 13별·좌표 투영 | David Nash/Astronomy Nexus, CC BY-SA 4.0. 기존 출처 `docs/SOURCES.md` | 아래 해당 데이터·변환 범위에만 적용. 전체 에셋으로 확장하지 않음 |
| 직접 작성 SVG·Canvas·모형 | 공통 아이콘·달 위상·표면·별 좌표·행성 모형 | 프로젝트 코드. 지도·보행·행성 기본 그림은 아래 생성물과 구분 | 실제 과학 도형·글자·좌표는 코드로 표시 |
| 소리 | 화면 효과음은 `src/theme-effects.js` 자체 Web Audio 합성. 지도 악당 전투 효과음 7종은 CC0 녹음(아래 2026-11-17 절). Kenney Interface Sounds 6종(`audio/*.ogg`)은 폴더에 남아 있으나 2026-11-09부터 코드에서 재생하지 않음 | Kenney: 공식 배포 페이지와 동봉 CC0 원문 확인, `audio/Kenney-CC0.txt` | 로컬 파일 재생, BGM·효과음 개별 설정 |
| 배경음 2곡 (Suno 생성) | audio/bgm/main-theme.mp3 (시작·지도·활동 반복), audio/bgm/final-theme.mp3 (엔딩·인증서·지도 피날레 창) | 2026-11-17 사용자가 Suno로 생성해 제공. 프롬프트는 `_shared/music-prompts-10-16.html` | 원본은 references/suno 보관(Git 미포함). 상업 이용 근거: 생성 당시 Suno Premier 유료 요금제(2026-11-18 사용자 확인) |
| 개념영상5편 | 직접 작성 SVG → sharp → FFmpeg 7.1 (개발 도구) | MP4 H.264 + WebM VP9 + 끝 장면 WebP, 각10초1280×720, 무음 | FFmpeg 실행 파일은 배포물에 포함하지 않음. 도형은 자체 코드, 달 모형은 기존 코드 재사용 |
| sharp 0.34.5 | 생성 PNG의 WebP 서비스 변환·알파 경계 측정 | `node_modules/sharp/LICENSE`: Apache2.0 | 개발 도구. 원본은 유지하고 서비스 파일만 변환 |
| Remotion | 사용하지 않음 | 현행 package.json에 없고 도입 계획 없음 | 관련 렌더 영상·결과물을 새로 포함하지 않음 |

라이선스 불명인 기존 이미지와 AI 상업 조건은 미확인으로 남는다. 로컬 MVP 진행과 외부 납품 가능 판정은 구분하며 공개 납품 전 확인·교체·적절한 허가 중 하나로 해결한다.

## 2026-10-22 개념영상·효과음 추가

효과음 원저작자: Kenney. [공식 Interface Sounds 배포 페이지](https://kenney.nl/assets/interface-sounds), Creative Commons Zero(CC0 1.0). 2026-10-22 공식 ZIP을 내려받아 `License.txt`를 `audio/Kenney-CC0.txt`로 동봉했다. 개인·교육·상업 프로젝트에 사용 가능하다는 원문을 확인했다. 출처를 표기하며 음원을 재판매하지 않는다.

| 서비스 파일 | 원본 파일 | 연결 |
|---|---|---|
| audio/click.ogg | click_003.ogg | 버튼·선택 |
| audio/capture.ogg | switch_002.ogg | 관측사진 기록 |
| audio/place.ogg | drop_002.ogg | 행성·이름표 끌어놓기, 별 선긋기 |
| audio/discover.ogg | glass_001.ogg | 별 관찰·행성 근거 기록 |
| audio/success.ogg | confirmation_002.ogg | 연구 완료·코어 복구 |
| audio/hint.ogg | question_001.ogg | 루미 힌트 |

개념영상: `concepts/stage-{1..5}.{mp4,webm,webp}`, 재생 자막 `src/concepts.js`, 제작 코드 `scripts/render-concepts.mjs`. 영상은 개념 도형이며 실제 관측 영상이 아니다. 프레임에는 문자를 굽지 않고 화면 자막으로 표시한다. 첫 두 달 모형은 프로젝트 기존 SVG 코드이며 다섯 번째 별 패턴은 설명용 배치(카탈로그 데이터가 아님)다. 게임의 실제 별 지도 HYG 라이선스와 구분한다.

## 기존 제공 이미지

| 서비스 파일 | 보존 원본 | 이용 |
|---|---|---|
| `observatory.png` | `references/images/backgrounds/chatgpt_generated_31.png` | 2D배경 |
| `logo.png` | `references/images/branding/chatgpt_generated_41.png` | 로고 |
| `rabbit.png` | `references/images/characters/chatgpt_generated_42.png` | 달토끼NPC |
| `fox.png` | `references/images/characters/chatgpt_generated_43.png` | 별여우NPC |

원본은 수정하지 않고 서비스 복사본·표시 영역을 쓴다. 파일명에 AI생성 표시가 있으나 정확한 서비스·계정·요금제 증빙은 미확인이다. 전체48원본의 경로·SHA256은 `references/manifest.json`을 따른다.

## 새 생성물 실물 기록

원본은 `references/generated`, 서비스 파일은 `public/assets/generated`에 있다. 파일별 원본 SHA256·생성일·도구·크기·서비스 경로는 `references/generated/manifest.json`에 기록돼 있다. 서비스 WebP13종 합계는 5,456,042B(2026-10-22 최초 감사 시점)다. `scripts/prepare-generated.mjs`는 원본을 유지한 채 WebP로 변환하고 보행 셀의 알파 경계·발 기준점을 기록한다. 행성·배경은 학습용 재현 그림이며 실제 촬영사진·검증된 표면 지도가 아니다.

| 서비스 파일 | 규격 | 용도 |
|---|---|---|
| `generated/world.webp` | 1672×941 | 사선 픽셀 연구소 지도 |
| `generated/student.webp`, `rabbit-walk.webp` | 각1254×1254, 투명 | 학생·달토끼 보행 시트 |
| `generated/mercury.webp`, `venus.webp`, `earth.webp`, `mars.webp` | 각1254×1254, 투명 | 암석 행성 기본 그림 |
| `generated/jupiter.webp`, `saturn.webp`, `uranus.webp`, `neptune.webp` | 각1254×1254, 투명 | 큰 행성 기본 그림 |
| `generated/telescope-frame.webp` | 1254×1254, 투명 | 망원경 장비 외관 |
| `generated/dome-restored.webp` | 1672×941 | 복구 보상 장면 |

최초 보행 manifest의 경계 접촉 셀(student12/16, rabbit16/16)은 잘림 위험 신호로 검증 문서에 남긴다. 자동 경고만으로 정상 보행을 판정하지 않으며, 실제 화면 확인 또는 후속 교체 결과를 우선한다.

## 별 좌표: CC BY-SA 4.0 범위

출처: David Nash / Astronomy Nexus, [HYG Database v4.1](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md). 라이선스: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

`src/stars.json`은 카시오페이아 주요 5별·북두칠성 7별·북극성의 HIP·적경·적위·등급 등을 발췌하고 한국어 표시명을 더한 자료다. J2000 좌표를 북극 중심 평면으로 투영한다. 해당 발췌·변환 데이터와 좌표 투영 자료에 CC BY-SA 4.0을 유지한다. 이미지·로고·코드 전체를 같은 라이선스로 재허락하지 않는다. 북두칠성은 큰곰자리 일부이고 연결선은 사람이 만든 학습용 패턴이다.

## 과학·폰트·고지

교육 내용 참고는 NASA Science 행성·태양계·달위상·태양 자료다. URL·자료 한계·변환은 `docs/SOURCES.md`를 따른다. NASA 촬영 이미지를 썼다는 뜻이 아니다.

Jua의 한국어368,172B·라틴16,620B WOFF2와 OFL1.1 원문4,474B를 함께 self-host한다. 명칭이 비슷한 다른 주아체의 약관으로 대신하지 않는다.

ⓒ 2026 옐샘 & 아이스크림미디어. 프로젝트 자체 제작 부분의 권리 표기다.

외부 제공 이미지·폰트·데이터·라이브러리의 권리는 각 권리자에게 있다. 각 자료의 공개 라이선스·이용 조건을 따르며 확인되지 않은 권리를 이 문서가 부여하지 않는다.

## 나눔스퀘어 네오 UI 글꼴 (2026-11-10)

네이버 공식 배포 원본 WOFF2 Regular/Bold를 수정 없이 함께 제공한다.
- 공식 안내: https://campaign.naver.com/nanumsquare_neo/
- 원본: https://campaign.naver.com/nanumsquare_neo/download/NaverNanumSquareNeo.zip
- 라이선스: SIL Open Font License 1.1. 전체 저작권 안내·전문은 `fonts/NanumSquareNeo-OFL.txt`.
- 기존 영상·삽화에 포함된 글자는 영상 제작 당시 글꼴을 유지한다.

## 캐릭터 대사 음성 29개 (2026-11-10)

별여우 연구관과 루미의 대사를 로컬 Momo / Qwen3-TTS VoiceDesign으로 생성했다. 실제 인물의 목소리를 복제하지 않았다. 모델·프리셋·대사·오디오 SHA-256 및 객관적 검수 결과는 `docs/VOICE-PROVENANCE-20261110.json`에 기록했다. 모델 라이선스 표기는 Apache-2.0이며, 출력물의 독립적인 권리 보증을 뜻하지 않는다. ASR와 신호 검사는 통과했으나 사람이 실제로 듣고 자연스러움을 평가한 청감 검수는 미확인이다. 기존 안내 음성 원본은 보존했다.

## 첫 화면 캐릭터 최적화 (2026-11-11)

`home-fox.webp`는 기존 제공 캐릭터 시트 `fox.webp`의 첫 프레임을 추출한 파일이다. 원본 시트는 보존하며 같은 그림의 한 장만 전송한다. 원본의 이용 조건을 그대로 따른다.

## 「달빛 길 따라가기」 무대 그림 9장 (2026-11-17)

`generated/run-stage/`의 WebP 9장(`night-ridge`, `night-grass`, `night-path`, `stone-wall`, `door`, `stream`, `observatory`, `props`, `start-card`)은 `gpt-imagegen` 스킬(ChatGPT 앱의 Codex CLI 내장 이미지 도구)로 한 장씩 생성한 PNG를 `scripts/prepare-run-stage-art.mjs`로 가공한 것이다. 일부는 이 프로젝트의 `references/generated/world.png`와 `rabbit.png`를 참고 그림으로 주었다. 달·날짜 글자·하늘의 별은 그림에 넣지 않았고 코드로 그린다. 프롬프트와 원본 경로는 `docs/RUN-STAGE-3D-PLAN-20261117.md`의 「이미지 생성 기록」에 있다. 생성 당시 계정의 이용 조건을 따르며, 이 문서가 별도 권리를 부여하지 않는다.

## 지도 악당 전투 효과음 7종 (2026-11-17)

`audio/sfx/`의 MP3 7개는 과학34 공용 효과음 라이브러리(`_shared/sfx-library-20261117`, `manifest.json`에서 라이선스 재확인 표시)에서 골라 복사했다. 모두 **CC0 1.0**(https://creativecommons.org/publicdomain/zero/1.0/)이며 원본 페이지에서 2026-11-17 라이선스를 다시 확인한 파일이다. 라이브러리 가공은 앞뒤 무음 제거·짧은 페이드·음량 맞춤(-18 LUFS 목표)·모노 MP3 변환이고 피치·속도는 바꾸지 않았다. 게임에서는 `src/sound.js`의 `mapCues`가 음량을 낮추고, 2타만 재생 속도 0.89로 조금 낮게 낸다. CC0라 표기 의무는 없지만 출처를 남긴다.

| 서비스 파일 | 원본 · 제작자 | 원본 페이지 | 연결 |
|---|---|---|---|
| `audio/sfx/twinkle-02.mp3` | anime.wav · 1urker | https://freesound.org/people/1urker/sounds/457306 | 공격 버튼을 누를 때(별빛 공격) |
| `audio/sfx/bell-ding-03.mp3` | sqeeeek_bell_ting1.wav · sqeeeek | https://freesound.org/people/sqeeeek/sounds/237106 | 1·2타 명중 |
| `audio/sfx/hit-heavy-02.mp3` | Loud Pillow Hit 2.wav · saturdaysoundguy | https://freesound.org/people/saturdaysoundguy/sounds/388035 | 3타 명중 |
| `audio/sfx/villain-exit-01.mp3` | classic dizzy take slide whistle.wav · martian | https://freesound.org/people/martian/sounds/403002 | 악당 퇴장 |
| `audio/sfx/villain-appear-02.mp3` | Mouth Pop 1 · michorvath | https://freesound.org/people/michorvath/sounds/269501 | 악당이 지도에 처음 보일 때(페이지당 악당마다 한 번) |
| `audio/sfx/hurt-bump-01.mp3` | LowHit_01.wav · Faulkin | https://freesound.org/people/Faulkin/sounds/336495 | 별탐험가·루미가 악당에 닿을 때(둘 다 닿아도 한 번) |
| `audio/sfx/reward-01.mp3` | Fantasy_ui_Button_3.wav · ZenithInfinitiveStudios | https://freesound.org/people/ZenithInfinitiveStudios/sounds/376745 | 다섯 악당 모두 격퇴 직후(파이널 배경음이 시작되기 전에 끝남). 2026-11-18부터 마지막 악당의 성취 카드가 뜰 때는 카드의 컬렉션 완성 징글이 대신하고, 카드 공개 소리로도 쓴다 |

음소거·효과음 끄기·탭 숨김·인물 목소리 재생 중에는 나지 않는다(기존 효과음 규칙과 같음).

## 성취 카드 5장과 효과음 (2026-11-18)

지도 악당(별빛 가림이)을 세 번 맞혀 물리치면 받는 성취 카드의 그림과 소리.

- 그림 `reward-cards/card-{1..5}-{1..5}.webp`(640×960), `reward-cards/thumb-{1..5}-{1..5}.webp`(96×144): 2026-11-18 ChatGPT 앱의 Codex 내장 이미지 도구(GPT 이미지)로 이 프로젝트를 위해 생성했다. 지도의 학생 연구원(`generated/student.webp`, `map-encounters/hero-redraw.png`)·달토끼 루미(`rabbit.webp`)와 각 시설의 배경 그림(`rooms/`)을 화풍 참고로 붙였다. 글자 없이 생성했고 테두리·별·이름은 코드(`src/reward-cards.js`, `src/reward-cards.css`)로 올린다. 원본 PNG는 `_scratch/reward-cards-20261118/gen/13/`에 있다(Git 미포함). 학습용 장면 그림이며 과학 사실의 증거로 쓰지 않는다. 생성 당시 계정의 이용 조건을 따르며, 이 문서가 별도 권리를 부여하지 않는다.
- 소리: 과학34 공용 효과음 라이브러리(`_shared/sfx-library-20261117`)에서 그대로 복사했다(가공은 라이브러리에서 한 무음 제거·짧은 페이드·음량 맞춤뿐). 모두 **CC0 1.0**이며 라이브러리 작성 때(2026-11-17) 원본 페이지에서 라이선스를 다시 확인한 파일이다. `src/sound.js`의 `mapCues`(`card…`)가 음량을 정한다.

| 서비스 파일 | 원본 · 제작자 | 원본 페이지 | 연결 |
|---|---|---|---|
| `audio/sfx/wind-whoosh-03.mp3` | Slow Swosh 40 · qubodup | https://freesound.org/people/qubodup/sounds/60027 | 카드가 날아올 때·보관함 칸으로 날아갈 때 |
| `audio/sfx/reward-01.mp3` | Fantasy_ui_Button_3.wav · ZenithInfinitiveStudios | https://freesound.org/people/ZenithInfinitiveStudios/sounds/376745 | 카드 공개(브론즈·실버·골드). 위 전투 효과음과 같은 파일 |
| `audio/sfx/reward-03.mp3` | Achievement Happy Beeps Jingle · CogFireStudios | https://freesound.org/people/CogFireStudios/sounds/619838 | 카드 공개(홀로·레전드, 긴 징글) |
| `audio/sfx/pickup-01.mp3` | item-pickup-v1.wav · DeltaCode | https://freesound.org/people/DeltaCode/sounds/678384 | 카드가 보관함 칸에 들어갈 때 |
| `audio/sfx/victory-jingle-01.mp3` | Game Success Fanfare Short · el_boss | https://freesound.org/people/el_boss/sounds/677858 | 다섯 장을 모두 모았을 때(지도 파이널 창이 열리면 멈춤) |

카드 소리도 다른 효과음처럼 음소거·효과음 끄기·탭 숨김·인물 목소리 재생 중에는 나지 않는다. 그래서 카드는 악당의 퇴장 대사가 끝난 뒤에 뜬다.

## 발자국·스테이지 열림·달빛 길 효과음 (2026-11-19)

- 소리: 과학34 공용 효과음 라이브러리(`_shared/sfx-library-20261117`, `manifest.json`·`CREDITS.md`)에서 그대로 복사했다(가공은 라이브러리에서 한 앞뒤 무음 제거·짧은 페이드·음량 맞춤·모노 MP3 변환뿐, 피치·속도 변경 없음). 모두 **CC0 1.0**(https://creativecommons.org/publicdomain/zero/1.0/)이며 라이브러리 작성 때(2026-11-17) 원본 페이지에서 라이선스를 다시 확인한 파일이다. 음량·재생 속도는 `src/sound.js`의 `stepCue`·`mapCues`(`open`, `openSparkle`, `jump`, `splash`)가 정한다. CC0라 표기 의무는 없지만 출처를 남긴다.

| 서비스 파일 | 원본 · 제작자 | 원본 페이지 | 연결 |
|---|---|---|---|
| `audio/sfx/step-01.mp3` | Footstep on Stone · sgossner | https://freesound.org/people/sgossner/sounds/197778 | 지도·달빛 길 발자국(번갈아 재생, 재생 속도 ×1.1 ±6%) |
| `audio/sfx/step-02.mp3` | concrete footstep 4 · Yoyodaman234 | https://freesound.org/people/Yoyodaman234/sounds/166506 | 지도·달빛 길 발자국 |
| `audio/sfx/open-01.mp3` | maximize_008 · Kenney (Interface Sounds 1.0) | https://kenney.nl/assets/interface-sounds | 지도에 새 관측소·중앙 코어가 처음 열릴 때 |
| `audio/sfx/twinkle-03.mp3` | Fantasy_ui_Button_2.wav · ZenithInfinitiveStudios | https://freesound.org/people/ZenithInfinitiveStudios/sounds/376746 | 열림 소리 0.12초 뒤 작은 종 반짝임 |
| `audio/sfx/water-splash-02.mp3` | water splash 2.wav · VacekH | https://freesound.org/people/VacekH/sounds/189499 | 달빛 길에서 개울에 빠질 때 |
| `audio/sfx/wind-whoosh-03.mp3` | Slow Swosh 40 · qubodup | https://freesound.org/people/qubodup/sounds/60027 | 달빛 길 점프(카드 소리와 같은 파일) |
| `audio/sfx/hurt-bump-01.mp3` | LowHit_01.wav · Faulkin | https://freesound.org/people/Faulkin/sounds/336495 | 달빛 길에서 닫힌 문에 부딪힐 때(지도 접촉음과 같은 파일) |

발자국은 다른 소리를 끊지 않고 다른 소리에 끊기지도 않으며, 효과음 끄기·음소거·탭 숨김을 따르고 인물 목소리 중에는 절반 크기로 난다.
