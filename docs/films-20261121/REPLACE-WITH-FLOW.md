# 남은 5컷을 구글 플로우 영상으로 바꾸기 (사용자 결정 2026-11-21: 「크레딧 생기면 교체」)

지금 인트로 2·3컷과 엔딩 1~3컷은 GPT 장면 그림에 ffmpeg 카메라 움직임을 넣은 판(`references/film-20261121/clips-kb/`)이다. 구글 플로우 크레딧이 다시 생기면(매월 재설정 또는 사용자가 충전) 아래 순서로 바꾼다. 충전·결제는 사용자만 한다.

1. 크레딧 확인: 한 컷에 Veo 3.1 Fast 20크레딧, 5컷 100크레딧. 다른 프로젝트도 같은 계정을 쓰니 시작 직전에 잔액을 본다.
2. 컷마다 하나씩(동시에 돌리지 않음): `flow.sh i2`, `i3`, `f1`, `f2`, `f3`. 이 스크립트는 `.tmp/intro-video-20261121/`에서 돌리며(`prompts.json`이 같은 폴더에 있어야 함), 결과를 `references/film-20261121/clips/<이름>.mp4`로 받는다. 어사이드 세션 폴더(내장)에 생긴 업로드·다운로드 사본은 SSD 사본과 SHA-256이 같은지 본 뒤 지운다(사용자 허락: 이 작업의 임시 사본만).
3. 받은 영상을 직접 열어 캐릭터가 바뀌지 않았는지, 화면에 깨진 글자가 없는지 본다. 이상하면 그 컷은 카메라 움직임 판을 그대로 둔다.
4. 합성: `python3 compose.py intro`, `python3 compose.py final`(플로우 영상이 있으면 그것을, 없으면 `clips-kb`를 자동으로 쓴다) → `burn.py burn-intro.json`, `burn-final.json` → 웹용 2패스 인코딩(VP9 340k + Opus 40k, H.264 360k + AAC 48k) → `public/assets/films/`. 폴더 합계는 5MB 아래로 유지한다.
5. 확인: `.tmp/intro-video-20261121/film-check.mjs`(세 화면 크기), `film-end.mjs`(끝까지 재생·건너뛰기), `npm test`, 빌드 → 경로 지정 커밋 → 푸시 → 운영 배포 → `prodcmp 13` MATCH → 운영에서 다시 확인.
6. `provenance.json`의 clips 항목과 권리 장부 V3 줄을 새 세션 ID·시각으로 고친다. 플로우 영상의 필수 「Veo」 표시는 지우지 않는다.
