# 밤하늘 음성 통합

29개 대사의 원본·모델·해시·객관적 검수는 `VOICE-PROVENANCE-20261110.json`에 기록했다. 각 파일의 대사 식별자는 `src/voice-lines.js`와 동일하다.

- 환영 1, 도입 2, 지도 힌트 3, 활동별 힌트 10
- 오답 3, 탐구 보상 5, 연구 키트 3, 최종 보고서 1, 엔딩 1

공통 제어는 한 대사씩 재생하고 화면/대화창 종료, 음소거와 숨긴 탭에서 중단한다. 음성 중에는 배경음·절차적 효과음을 억제한다. 브라우저의 자동재생 차단 또는 파일 실패는 글로 계속 진행할 수 있으며 다시 듣기 버튼을 제공한다. 오답의 짧은 듣기/멈춤 버튼은 화면 하단 도움말에 있고 스크린리더 이름과 상태 안내를 유지한다.

검사 명령:
- `npm test`
- `npm run build`
- `PLAYWRIGHT_MODULE=<installed Playwright index.mjs> BROWSER_EXECUTABLE=<Chrome> TEST_URL=<preview or deployed URL> VOICE_QA_DIR=<report directory> node scripts/verify-narration.mjs`
- 같은 브라우저 환경 변수로 `node scripts/verify-playthrough.mjs` 및 `node scripts/verify-responsive.mjs`

29개 화면별 실제 재생·종료, 빠른 전환/중복 방지, 오류 복구, 실제 학습 흐름과 작은 화면 검증을 분리해 수행했다. 자세한 범위는 `reviews/PLAY-REVIEW-20261110.md`를 참고한다. 사람이 실제로 듣고 음질·억양을 평가한 검수와 물리 태블릿 시험은 하지 않았다.
