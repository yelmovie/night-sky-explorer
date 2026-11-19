# 화면 문장 줄바꿈 균형 (2026-11-19)

과학34 공통 지침 `_shared/LINEBREAK-BALANCE-20261119.md`대로 진행했다.

## 측정 방법

- 도구: `_scratch/linebreak-audit-20261119/measure.js`를 장면마다 직접 돌리는 `.tmp/linebreak-20261119/sweep.mjs`
- 장면: 첫 화면, 인트로 이야기 3장면(NPC 대화), 지도, 연구 키트(펼침), 설정(펼침), 이야기 다시 보기, 초기화 확인, s1a~s5b 각 활동(빈 기록·완성 기록), 활동별 힌트 1~3단계, s1b~s5b 보상 대화(펼침), 코어 보고서(펼침), 코어, 결과
- 크기: 1280×800, 1920×1080(+ 수정 후 1024×768)
- 대사 타자 효과: `.tmp/linebreak-20261119/typing.mjs`가 치는 중 글자 위치를 완성 문장 위치와 글자마다 비교

## 결과

| | 1280×800 | 1920×1080 | 1024×768 |
|---|---|---|---|
| 전(운영 7b12811 배포본) | 32 | 26 | – |
| 공통 규칙만 | 8 | 8 | – |
| 최종(5e99d1c) | 8 | 7 | 10 |
| 최종 중 실제 문제 | 0 | 0 | 1 → 0(c51614c, 아래 「남은 것」) |

최종에 남은 블록은 아래 오탐·판단 통과뿐이다.

- 오탐(화면에 안 보이는 `sr-only` 글): s1a `#focus-status`, s1b `.surface-targets.sr-only` 칩 4개(「왼쪽 위」 등), 코어 보정 링 `label.range-label`(「보정 링」)
- 오탐(일부러 넣은 `<br>`): 첫 화면 제목 「너의 관측으로 / 연구소의 불빛을 켜요.」
- 판단 통과: s3a 특징 카드 「두꺼운 구름으로 / 덮인 모습」(뜻 단위로 끊기고 끝줄 59%, 스크린샷 확인)
- 대사 타자 효과: 1280·1920·1024에서 치는 중 글자 위치 불일치 0

## 고친 곳

| 파일 | 내용 |
|---|---|
| `index.html` | `src/korean-linebreak.css`를 다른 스타일보다 먼저 연결 |
| `src/korean-linebreak.css` | 공통 파일 그대로 + 프로젝트 보정 |
| ↳ `.npc-scene-dialog .dialogue-typing { text-wrap: inherit }`, `.dialogue-typing-rest { visibility: hidden }` | 타자 중 글도 완성 문장과 같은 balance 줄바꿈 |
| ↳ `.learning-v2 .drag-tip { text-wrap: balance }` | s2a 「…손을 떼면 그 / 모습이 담겨요.」(1920) |
| ↳ `.learning-v2 .body-fact p { text-wrap: balance }` | s4a 오른쪽 안내 「…근원을 볼 / 수 있어요.」 |
| `src/npc-dialogue.js` | 타자 효과가 아직 안 나온 글자를 투명 스팬으로 미리 깔아 둠(타이밍·음성 동기화는 그대로) |

공통 규칙만으로 고쳐진 곳: 힌트 대화 끝줄 외톨이 9곳, 인트로 사건 안내, 키트·코어 보고서 NPC 한 줄, 보상 대화 펼침 글, 활동 안내(`.discovery-route p`), 행성 특징 카드, 별·행성 카드 설명, 결과 보너스 카드, 코어 재생 안내, 첫 화면 환영 문단.

문구·대사 내용은 바꾸지 않았다.

## 남은 것

- ~~1024×768 s4a 토성 카드 「밤하늘에서는 / 작고 노르스름한 / 빛의 / 점으로 보여.」~~ → 고침(2026-11-20, 커밋 `c51614c`): `src/flow-refresh.css`에 `@media (min-width: 701px) and (max-width: 1150px)` 조건으로 s4a 카드 좌우 여백 8→3px, 카드 사이 10→6px. 글 폭 128→141px, 「밤하늘에서는 / 작고 노르스름한 / 빛의 점으로 보여.」 세 줄. 같은 화면 8장 모두 넘침·겹침 없음, 1280·1920은 카드 크기·줄 모양 그대로(전후 비교), 3개 크기 스윕에서 새 문제 없음. Version ID `542f0c4a-2e85-4bf5-a85f-4a6f89de01c2`, `cmp.sh` `assets/index-Chui-hDM.css` 06b8cd4590de274e MATCH, index MATCH
- 캔버스 지도 글·개념 영상 자막은 측정 대상 밖.

## 운영 배포

- 커밋 `5e99d1c` 푸시, `run-lock.sh lbk-deploy-1 deploy.sh 13 "13 nightsky" worker-own night-sky-explorer`
- Version ID `ca6455b8-acab-4de8-a2bb-bf25da0f2df0`
- `cmp.sh`: `assets/index-BdPvMpeP.css` build=b19b20b322c7bf0d live 동일 MATCH, index MATCH / `assets/index-BFFz7qWb.js` d8345f454e5bfa63 동일
- 운영 측정(1280×800, 배포 뒤): 문제 블록 8개 = 위 오탐 7개 + 판단 통과 1개, 실제 문제 0
- 추가 수정(2026-11-20, 지침 8절): `src/reward-cards.css` `.rc-locked` 컨테이너 규칙 4줄 → 보관함 잠긴 카드 문구가 1280·1920은 한 줄, 1024는 「악당을 / 물리치면 / 열려요」 세 줄, 카드 넘침 없음(로컬 빌드 측정·스크린샷). 커밋 `71f332b`, Version ID `ce9dfa01-8f27-49ff-8cea-0bd316785d75`, `cmp.sh` `assets/map-screen-DzQpF8Br.css` e2edc3e5b3611fa4 MATCH, index MATCH
