# -*- coding: utf-8 -*-
"""플로우 크레딧이 없어 영상을 못 만든 컷을 GPT 장면 그림 + ffmpeg 카메라 움직임으로 8초 영상으로 만든다.
16:9로 자른 뒤 3840x2160으로 키워 zoompan(부드러운 가속·감속)으로 1280x720 30fps를 뽑는다. 소리는 무음 트랙.
사용: python3 kb.py i2 i3 f1 f2 f3   → references/film-20261121/clips-kb/<이름>.mp4
"""
import subprocess, sys
from pathlib import Path
B = Path('/Volumes/T7 Shield/iscreammedia_sc34/13 nightsky/references/film-20261121')
OUT = B / 'clips-kb'; OUT.mkdir(exist_ok=True)
N = 240  # 8초 x 30fps
# (z시작, z끝, 중심x 시작, 중심x 끝, 중심y 시작, 중심y 끝, 추가 효과)
MOVES = {
    'i1': (1.00, 1.12, .62, .64, .45, .42, ''),
    'i2': (1.16, 1.20, .78, .24, .55, .58, ",eq=brightness='0.025*sin(2*PI*t*1.4)':eval=frame"),   # 오른쪽 장치에서 왼쪽 별빛 가림이로
    'i3': (1.00, 1.14, .50, .50, .52, .60, ''),                                                     # 두 캐릭터 쪽으로 다가감
    'f1': (1.14, 1.10, .50, .50, .70, .30, ''),                                                     # 캐릭터에서 카드로 올려다봄
    'f2': (1.22, 1.00, .50, .50, .66, .50, ",eq=brightness='0.06*min(t/5,1)':eval=frame"),          # 코어에서 열리는 돔으로, 점점 밝게
    'f3': (1.18, 1.00, .55, .50, .62, .50, ''),                                                     # 셋에서 하늘 전체로 물러남
}
def name(k): return ('intro-' if k[0] == 'i' else 'final-') + k[1:]
def main(keys):
    for k in keys:
        z0, z1, x0, x1, y0, y1, fx = MOVES[k]
        src = B / 'stills' / f'{name(k)}.png'; out = OUT / f'{name(k)}.mp4'
        e = f'(on/{N - 1})*(on/{N - 1})*(3-2*(on/{N - 1}))'  # 부드럽게 시작·끝
        z = f'{z0}+({z1}-{z0})*{e}'
        cx = f'({x0}+({x1}-{x0})*{e})'; cy = f'({y0}+({y1}-{y0})*{e})'
        x = f"max(0,min(iw-iw/zoom,{cx}*iw-iw/zoom/2))"; y = f"max(0,min(ih-ih/zoom,{cy}*ih-ih/zoom/2))"
        vf = (f"crop=1536:864:0:80,scale=3840:2160:flags=lanczos,"
              f"zoompan=z='{z}':x='{x}':y='{y}':d={N}:s=1280x720:fps=30{fx},format=yuv420p")
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-loop', '1', '-i', str(src), '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                        '-vf', vf, '-frames:v', str(N), '-t', '8', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'aac', '-shortest', str(out)], check=True)
        print('ok', out)
if __name__ == '__main__':
    main(sys.argv[1:])
