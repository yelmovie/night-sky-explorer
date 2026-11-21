#!/bin/zsh
# 구글 플로우(Veo)로 그림 한 장 → 8초 영상 한 개. 사용: flow.sh <i1|i2|i3|f1|f2|f3>
cd "/Volumes/T7 Shield/iscreammedia_sc34/13 nightsky/.tmp/intro-video-20261121"
k=$1; name=$( [[ $k == i* ]] && echo "intro-${k#i}" || echo "final-${k#f}" )
B="/Volumes/T7 Shield/iscreammedia_sc34/13 nightsky/references/film-20261121"
still="$B/stills/$name.png"; out="$B/clips/$name.mp4"
[ -s "$still" ] || { echo "no still $still"; exit 3; }
[ -s "$out" ] && { echo "skip $name"; exit 0; }
vp=$(python3 -c "import json;print(json.load(open('prompts.json'))['v-$k'])")
task="구글 플로우(https://labs.google/fx/tools/flow)에서 영상 한 개를 만들어 줘. 이미 로그인된 내 계정(PRO)을 쓰고, 다른 프로젝트·다른 작업은 건드리지 마.
1) '별빛 관측 연구소 영상 20261121'이라는 프로젝트가 있으면 열고, 없으면 새로 만들어.
2) 이 그림 파일을 첫 장면(Frames to Video / 이미지로 시작)으로 올려: $still
3) 모델은 Veo 3.1 Quality를 쓰되, 남은 크레딧이 600 아래면 Veo 3.1 Fast를 써. 화면비 16:9(가로), 결과 1개, 길이 8초.
4) 프롬프트는 아래 영어 글을 그대로 넣고, 끝에 'No subtitles, captions, or any written text.'를 한 줄 더 붙여.
---
$vp
---
5) 만들어지면 영상을 받아서(가장 높은 화질 mp4, 업스케일은 하지 마) 이 경로로 복사해: $out
6) 끝나면 알려 줘: 쓴 모델, 쓴 크레딧과 남은 크레딧, 받은 파일이 처음 저장된 내장 경로(어사이드 세션 폴더 안의 정확한 경로), 복사한 경로. 생성이 실패하거나 정책 거절이 나면 다시 시도하지 말고 그 메시지를 그대로 알려 줘."
aside --permission full-access --timeout 40m --json "$task"
