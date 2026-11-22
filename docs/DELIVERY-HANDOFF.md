# 13 별빛 관측 연구소 · 납품 안내

기존 인계 문서: [`../HANDOFF.md`](../HANDOFF.md)(날짜별 작업 기록). 이 문서는 납품 때 필요한 것만 모았습니다.

## 1. 한눈에

- 프로젝트 이름: 별빛 관측 연구소(13 nightsky)
- 운영 주소: https://night-sky-explorer.yelsam.workers.dev
- 저장소: https://github.com/yelmovie/night-sky-explorer (브랜치 `main`)
- 현재 앱 코드 커밋: `3c77582`(2026-11-22, 인증서 손기입·PNG 저장·숫자 요약 제거·제목 강조).

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

- `0e39b58` 2026-11-22 지도 악당을 다 물리쳐도 지도 피날레 영상을 띄우지 않음(악당은 성취 카드만, 파이널 영상은 코어 복구 때 한 번). Worker 버전 `5f93ba21`
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

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 9개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 13`로 다시 대조합니다.


## 최신 인증서·운영 확인 (2026-11-22)

- 앱 코드 `3c77582`, 기존 운영 Worker 버전 `999919dc-0862-466d-aabb-2fd0416d23b0`입니다. 배포 기준 커밋 `76101b5`에는 해당 앱과 출처·문서 갱신이 포함됩니다.
- 공식 주소 `https://night-sky-explorer.yelsam.workers.dev/`의 index와 실제 참조 코드·스타일 및 인증서 핵심 파일 3개를 현재 검증 빌드와 SHA256으로 다시 대조하여 모두 일치함을 확인했습니다. 앱이 이미 최신이어서 운영 버전은 유지했습니다.
- 학교·학년·반·번호·이름은 출력 후 손으로 적는 빈칸입니다. A4 가로 인쇄/PDF와 2400×1697 PNG를 지원하며, 진행 숫자 요약은 표시하지 않고 제목 굵기·획은 PNG에도 적용됩니다. 기존 세 화면·PDF·PNG 검증 근거는 각 인증서 작업 기록에 있습니다.
- 교사·실기기·수업 검수와 사용자 제공 권리 증빙은 기존 미확인 상태를 유지합니다.
