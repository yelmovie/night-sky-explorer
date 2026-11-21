# 13 남은 네 컷 · 보조 계정 3(u/3) Gemini 시도 기록 (2026-11-21)

컷마다 세 번까지. 받은 후보는 `references/film-20261121/clips-cand/`, 확인해서 통과한 것만 `clips/`로 옮긴다.

| 컷 | 시도 | 프롬프트 키 | 결과 | 확인 |
|---|---|---|---|---|
| 엔딩 3 | 1 (19:10) | v-f3c (별자리 고정·카메라만) | 영상 없음: "I'm having a hard time fulfilling your request" | 임시 판 유지 |
| 인트로 2 | 1 (19:10) | v-i2 | 영상 없음: "I'm experiencing unusually high traffic" (요청 몰림) | 임시 판 유지 |
| 엔딩 1 | 1 (19:39) | v-f1 | 영상 없음: "I seem to be encountering an error" | 임시 판 유지 |
| 인트로 3 | 1 (19:39) | v-i3 | 영상 없음: "I seem to be encountering an error" | 임시 판 유지 |
| 엔딩 3 | 2 (19:58) | v-f3c | 영상 없음: 영상 도구 없이 글 답만("I am unable to generate or output video files directly") | 임시 판 유지 |
| 인트로 2 | 2 (19:58) | v-i2 | 영상 없음: "Sorry, something went wrong" | 임시 판 유지 |
| 엔딩 1 | 2 (20:14) | v-f1 | 영상 없음: "I seem to be encountering an error" | 임시 판 유지 |
| 인트로 3 | 2 (20:14) | v-i3 | **받음** 10.0초 1280×720 → `clips-cand/intro-3-a2.mp4` | **통과**: 여우·토끼 모습 그대로, 글자 없음, 슬롯이 하나씩 빛남, 창밖 달 보름달 그대로. `clips/intro-3.mp4`로 적용(앞 8초 사용) |
| (정정) | 3차 첫 실행 (20:26·20:35) | v-f3s·v-i2s·v-f1s | 15초 안에 채팅 주소가 안 바뀌어 「제출 안 됨」으로 보였지만, 나중에 채팅 목록을 보니 실제로는 보내졌다: 엔딩 3·인트로 2는 "experiencing unusually high traffic … at full capacity"(몰림), 엔딩 1은 "I encountered an error doing what you asked" | 영상 없음. 엔딩 3·인트로 2는 결과적으로 네 번 보냄 |
| 엔딩 3 | 3 (20:37) | v-f3s (짧은 판, 카메라만) | 영상 없음: "I seem to be encountering an error" | **세 번 다 실패 → 임시 판 유지** |
| 인트로 2 | 3 (20:37) | v-i2s (짧은 판) | 영상 없음: "I encountered an error doing what you asked" | **세 번 다 실패 → 임시 판 유지** |
| 엔딩 1 | 3 (20:47) | v-f1s (짧은 판) | 영상 없음: "I'm having a hard time fulfilling your request" | **세 번 다 실패 → 임시 판 유지** |

## 결과 (20:55)

- 실제 영상 장면: 3 / 6 (인트로 1 Flow, 인트로 3 Gemini u/3, 엔딩 2 Gemini). 남은 임시 판(그림+카메라 움직임): 인트로 2, 엔딩 1, 엔딩 3.
- u/3 사용량은 끝까지 0~1%였다. 실패는 한도가 아니라 Gemini 쪽 몰림·오류 응답이다.
- 남은 세 컷은 사용자 결정(조율 세션 전달, "그렇게 해줘~")대로 내일 2026-11-22 이른 아침에 컷마다 두 번까지 다시 시도하기로 했다. 사용자 승인으로 예약 작업 `nightsky-film-retry-0630`(06:30 한 번)을 걸었다.

## 2026-11-22 이른 아침 재시도 (예약 작업 `nightsky-film-retry-0630`, 컷마다 두 번까지)

사용량(06:30): 보조 계정 1 0%, 보조 계정 2 42%, 보조 계정 3 0%(주간 0%) → 보조 계정 3 사용.

| 컷 | 시도·시각 | 계정 | 프롬프트 키 | 결과·오류 문구 | 확인 |
|---|---|---|---|---|---|
| 엔딩 3 | 4 (06:31) | 보조 계정 3 | v-f3c | 영상 없음: "I encountered an error doing what you asked. Could you try again?" | 임시 판 유지 |
| 인트로 2 | 4 (06:31) | 보조 계정 3 | v-i2 | **받음** 10.0초 1280×720 → `clips-cand/intro-2-a4.mp4` (채팅 `b37a057eef0d4f6a`). 채팅에는 오류 문구도 함께 보였지만 영상이 있었다. 수신기가 시도 번호 1~3만 받게 돼 있어 처음엔 저장이 안 됐고, 1~5로 고친 뒤 같은 채팅에서 다시 받았다(새로 만들지 않음) | **통과**: 악당 모습 그대로, 글자 없음, 장치·달 그대로. 덮개를 닫고 걸어 나오다 6.5초쯤 망원경 위로 뛰어 왼쪽으로 나감(변형 없음). `clips/intro-2.mp4`로 적용(앞 8초 사용) |
| 엔딩 1 | 4 (06:45) | 보조 계정 3 | v-f1 | 영상 없음: "I'm having a hard time fulfilling your request. Can I help you with something else instead?" | 임시 판 유지 |
| 엔딩 3 | 5 (06:45) | 보조 계정 3 | v-f3s | 영상 없음: "I seem to be encountering an error. Can I try something else for you?" | **두 번 다 실패 → 임시 판 유지** |
| 엔딩 1 | 5 (06:59) | 보조 계정 3 | v-f1s | 영상 없음: "Sorry, something went wrong. Please try your request again." | **두 번 다 실패 → 임시 판 유지** |

### 결과 (07:07)

- 실제 영상 장면: 4 / 6 (인트로 1 Flow, 인트로 2·3 Gemini 보조 계정 3, 엔딩 2 Gemini 보조 계정 1). 남은 임시 판: 엔딩 1, 엔딩 3.
- 사용량은 끝까지 0%였다. 실패는 한도가 아니라 Gemini 오류 응답이다.
- 배포: 앱 `f0c6ca8`, 운영 Worker `0e4d936c-5118-47d9-b8e2-bb46b6bf397a`. 운영 intro.webm·mp4·webp 해시와 index가 로컬 빌드와 같음, 영상 Range 206, `film-check2.mjs` 운영 15항목 PASS.
