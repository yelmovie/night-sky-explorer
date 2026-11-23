# Audio provenance and release review

## New sound effects
- `src/theme-effects.js` is original procedural Web Audio code authored for this task. No third-party recordings, samples, audio service, or microphone.
- Theme: starlight chimes. No external sample license dependency; this is not an absolute legal warranty.
- User interaction unlock, mute/effects settings, narration priority, hidden-tab and page-exit stop are respected. Existing settings persistence is preserved.

## Preserved existing assets
- Existing Kenney Interface Sounds retained, with CC0 text available in project source/cache license files. The license expressly permits personal, educational, and commercial use. https://kenney.nl/assets/interface-sounds / https://creativecommons.org/publicdomain/zero/1.0/
- Runtime effects now use procedural synthesis without download/decode latency. Existing procedural music retained.

## NPC narration

> 2026-11-18: 아래 Supertonic/Momo 기록은 예전 기록이다. 현재 재생하는 대사 음성은 모두 ElevenLabs `eleven_v4`(유료 요금제, 상업 이용 가능) `el-*.mp3`이며 줄별 출처는 `docs/VOICE-FILL-20261118.json`에 있다.
- Existing Korean F1 welcome narration preserved; no new generation, recording, or recognition.
- Original source metadata: `18710060-3e91-445e-bc87-fac02a4c54b8.json`, model `momo-voice`, Korean `ko`, voice `F1`, generated 2026-11-07T22:01:48.592Z. The metadata identifies Supertonic 3 / OpenRAIL-M. Its script exactly matches the runtime caption.
- Source WAV and distributed AAC durations are recorded below. Matching script and duration support the conversion lineage; lossy AAC cannot share the WAV hash.
- Official terms: https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE . Section 6 does not claim rights to generated output, subject to use restrictions. This is licensed educational narration, NOT public domain or an unconditional copyright-free claim.
- License snapshot: `SUPERTONIC3-LICENSE.txt`.

| File | SHA-256 | Duration seconds |
|---|---|---|
| 18710060-3e91-445e-bc87-fac02a4c54b8.wav | d4bc66052528e258546873d1eb10b219ed9838449c7d9b035d09f94a86e990d9 | 10.866939 |
| npc-welcome.m4a | fbfa60cdc59539f9e8addc5cb1f0c4dee07821fbad292edefd492acc68c7299e | 10.866939 |

## Current verification
- Unit suite and production build passed. Real Chrome AAC playback, manual stop, mute, hidden-tab event, navigation, missing-file fallback, and touch controls passed in `scripts/qa-welcome-voice.mjs` (project 13). No subjective speaker listening performed.


## 2026-11-23 로컬 수정 브랜치 — 달 방향 모형 안내

- 추가 파일: `public/assets/audio/voices/local-model-phase-scope.mp3` (기존 ElevenLabs 파일과 영상은 보존).
- 동일 화면 문구와 합성 입력: “오른쪽에서 왼쪽으로 보이는 순서는 화면 방향을 고정한 학습 모형의 순서예요.”
- 이 맥에 설치된 macOS Speech Synthesis `Yuna (한국어(한국))`, 속도 170으로 기기 내 AIFF 합성 후 FFmpeg로 MP3 변환. 외부 음성 API·학생 음성·마이크를 사용하지 않았다.
- 로컬 파일 출처·SHA256은 `docs/VOICE-LOCAL-20261123.json`. 기존 인물 음성과 음색이 다르며, 이번 작업에서 외부 배포·납품은 하지 않았다. 기존 음원의 이용허락을 이 새 파일에 적용한 것으로 표시하지 않는다.

## 2026-11-23 공개용 안내

- `audio/voices/el-model-phase-scope.mp3`는 기존 달토끼 기록원 루미와 같은 `Aria – Bright & Youthful Korean` 음성(ID `O2KReOFLpoR65nz6C9Se`)으로 생성했다. ElevenLabs Creator 유료 플랜의 Eleven v4를 사용했다.
- 화면 문구와 일치하는 한국어 전사, 음량, SHA-256과 [서비스 이용 조건](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)은 `docs/VOICE-LOCAL-20261123.json`에 기록했다.
- 앞의 macOS Yuna 파일은 최초 검수 이력으로 보존하며 `dist/.assetsignore`로 Workers 업로드에서 제외한다.
