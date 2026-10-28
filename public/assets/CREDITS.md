# 도구·자료·라이선스 기록

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
| 소리 | `src/sound.js` 자체 Web Audio 합성 BGM + Kenney Interface Sounds 효과음6종 | 공식 배포 페이지와 동봉 CC0 원문 확인, `audio/Kenney-CC0.txt` | 로컬 파일 재생, BGM·효과음 개별 설정, 영상 중 음악 정지 |
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
