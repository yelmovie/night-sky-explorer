#!/bin/zsh
# 합성 → 자막 → 웹용 2패스 인코딩 → 포스터. 사용: finish.sh (빌드 차로 안에서)
set -e
cd "/Volumes/T7 Shield/iscreammedia_sc34/13 nightsky"; W=.tmp/intro-video-20261121; F=public/assets/films
parts=("$@"); (( ${#parts} )) || parts=(intro final)
for p in $parts; do
  python3 $W/compose.py $p | grep -v "^ffmpeg"
  ~/.local/share/uv/tools/earshot/bin/python "/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/burn.py" $W/burn-$p.json | tail -1
  ffmpeg -nostdin -v error -y -i $W/cap-$p.mp4 -c:v libvpx-vp9 -b:v 290k -crf 44 -row-mt 1 -cpu-used 2 -pass 1 -passlogfile $W/vp9-$p -an -f null /dev/null
  ffmpeg -nostdin -v error -y -i $W/cap-$p.mp4 -c:v libvpx-vp9 -b:v 290k -crf 44 -row-mt 1 -cpu-used 2 -pass 2 -passlogfile $W/vp9-$p -c:a libopus -b:a 40k $F/$p.webm
  ffmpeg -nostdin -v error -y -i $W/cap-$p.mp4 -c:v libx264 -profile:v main -pix_fmt yuv420p -b:v 300k -maxrate 450k -bufsize 900k -preset slow -tune animation -pass 1 -passlogfile $W/x264-$p -an -f null /dev/null
  ffmpeg -nostdin -v error -y -i $W/cap-$p.mp4 -c:v libx264 -profile:v main -pix_fmt yuv420p -b:v 300k -maxrate 450k -bufsize 900k -preset slow -tune animation -pass 2 -passlogfile $W/x264-$p -c:a aac -b:a 48k -movflags +faststart $F/$p.mp4
  ffmpeg -nostdin -v error -y -ss 3 -i $W/cap-$p.mp4 -frames:v 1 $W/poster-$p.png
  node -e "require('sharp')('$W/poster-$p.png').webp({quality:72}).toFile('$F/$p.webp').then(()=>console.log('poster $p'))"
done
find $F -name '._*' -delete; ls -l $F | awk '{s+=$5; print $5, $9} END {print "total", s}'
