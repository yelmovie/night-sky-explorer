# 13 별빛 관측 연구소 · 납품 안내

기존 인계 문서: [`../HANDOFF.md`](../HANDOFF.md)(날짜별 작업 기록). 이 문서는 납품 때 필요한 것만 모았습니다.

## 1. 한눈에

- 프로젝트 이름: 별빛 관측 연구소(13 nightsky)
- 운영 주소: https://night-sky-explorer.yelsam.workers.dev
- 저장소: https://github.com/yelmovie/night-sky-explorer (브랜치 `main`)
- 현재 앱 커밋: `d319d4c`(2026-11-22, 앱 소스 마지막 변경). 문서 커밋 `e871927`이 최신입니다.

## 2. 폴더 구조

- 배포됨: `dist/`(빌드 결과, `public/`의 에셋과 `src/` 번들). 업로드 제외 목록은 `scripts/clean-build-metadata.mjs`의 `unusedOriginals`입니다.
- `src/`: 앱 소스(`application.js`가 진입점). `public/`: 정적 에셋(그림·음성·영상·글꼴), `public/sw.js` 서비스워커.
- `worker/media-range.js`: 영상 탐색(Range) 처리 Worker.
- 보관용(배포 안 됨): `films/`(개념영상 원본), `asset-bank/`, `references/`, `docs/`, `scripts/`, `tests/`.

## 3. 실행·빌드·검사 명령

`package.json`에서 확인한 것입니다. Node.js 20.19+ 또는 22.12+가 필요합니다(README).

- `npm ci`: 의존성 설치
- `npm run dev`: 127.0.0.1:5183 개발 서버
- `npm run build`: `dist/` 생성(`postbuild`로 `scripts/clean-build-metadata.mjs` 실행)
- `npm run preview`: 127.0.0.1:4173 미리보기
- `npm test`: `node --test tests/*.test.js`
- `npm run concepts:render`: 개념영상 다시 만들기(HyperFrames CLI·FFmpeg 필요)
- 브라우저 검증 스크립트는 `scripts/verify-*.mjs`이며 `PLAYWRIGHT_MODULE`, `BROWSER_EXECUTABLE`, `TEST_URL` 환경 값이 필요합니다(README).

## 4. 배포

- 호스팅: Cloudflare Workers(정적 에셋 + Worker). 이름 `night-sky-explorer`, 설정 `wrangler.jsonc`.
- 배포 명령(프로젝트 폴더, `HANDOFF.md`에 기록된 방식): wrangler 4.154.0의 `deploy`. 임시·캐시·로그 경로는 `.tmp/` 아래로 지정합니다.
- Range 처리: `worker/media-range.js`가 `/assets/concepts/stage-1~5`, `/assets/map-encounters/map-finale`, `/assets/films/intro·final`의 mp4·webm 요청을 받아 탐색(206)을 지원합니다. `wrangler.jsonc`의 `run_worker_first`가 이 경로를 Worker로 보냅니다.
- 푸시로 자동 배포되는 워크플로는 없습니다(`.github/` 없음). 배포는 직접 실행합니다.

## 5. 다른 호스팅으로 옮길 때

- 정적 파일 폴더: `npm run build`가 만드는 `dist/` 전체. `dist/.assetsignore`에 적힌 파일은 올리지 않습니다.
- 서비스워커 `sw.js`는 배포 빌드에서만 등록됩니다. 같은 출처 루트에 있어야 합니다.
- 영상 Range: 호스팅이 바이트 범위 요청(206)을 지원해야 합니다. 지원하지 않으면 Workers의 `media-range.js`와 같은 처리를 넣어야 합니다.
- 환경 값·비밀 키는 앱이 쓰지 않습니다(확인한 범위: `package.json`, `wrangler.jsonc`).

## 6. 버전과 변경 이력

- `d319d4c` 2026-11-22 엔딩 3 실제 영상(Veo) 교체
- `e8bc811` 2026-11-22 엔딩 1 실제 영상 교체
- `f0c6ca8` 2026-11-22 인트로 2 실제 영상 교체
- `4d0d72c` 2026-11-21 인트로 3 실제 영상 교체
- `80e79ef` 2026-11-21 달빛 길 도착점 천문대 Meshy 3D 모형
- `acad851`, `d8b40e4` 2026-11-21 코드 구조 정리(CSS 분리, 긴 줄 나눔)
- `1488b62` 2026-11-21 인트로·엔딩 영상 최종 마무리
- `510f679` 2026-11-21 인트로·엔딩 영상 Range 처리
- `c07774c` 2026-11-21 북극성 찾기, 잠긴 버튼 이유 문구, 놀이 영역 확대
- 인트로·엔딩 이야기 영상 여섯 장면이 모두 실제 영상(Veo)입니다.

## 7. 권리·출처

[`RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md)에 31개 줄(2026-11-22 점검에서 I20 추가로 32줄)을 정리했습니다. 그림은 Codex, 영상은 Google Flow·Gemini(Veo), 음악은 Suno, 음성은 ElevenLabs 등입니다. 「출처 미확인」은 0줄, 「근거 약함」은 `favicon.svg` 1줄입니다. 요금제 증빙(OpenAI, ElevenLabs, Suno, Meshy)은 사용자 자료 대기입니다.

## 8. 알려진 한계와 남은 일

`docs/reviews/SCORE-20261121.md` 기준 93점(실기기 제외 98점)입니다. 남은 감점은 다음과 같습니다.

- A12 교사 현장 검수(`docs/TEACHER-REVIEW-20261121.md`)
- E1·E2 큰 CSS 층 구조 정리(다음 단계)
- 실기기·수업 확인: A6 학생 난이도, B16 40분 수업, C19 가장자리 제스처, D10 저사양 프레임, D13 blur
- 업로드에 남은 옛 음성 29개(A4)의 제외 여부는 별도 결정입니다.
