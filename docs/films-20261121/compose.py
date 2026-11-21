# -*- coding: utf-8 -*-
"""13 별빛 관측 연구소 인트로·엔딩 영상 합성 (2026-11-21).
플로우(Veo) 8초 클립 3개 → 1280x720 30fps로 맞춤 → 교차 페이드(0.7초)로 이음 → 제목 모션(drawtext, Jua)
→ 클립 분위기 소리(낮게) + 일레븐랩스 대사 믹스 → 자막 없는 판(src). 자막은 burn.py로 따로 입힌다.
사용: python3 compose.py intro|final
"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path('/Volumes/T7 Shield/iscreammedia_sc34/13 nightsky')
WORK = ROOT / '.tmp/intro-video-20261121'
CLIPS = ROOT / 'references/film-20261121/clips'
FONT = '/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/fonts/Jua-Regular.ttf'
VOICES = ROOT / 'public/assets/audio/voices'
XF, CLIP = 0.7, 8.0

PARTS = {
    'intro': {
        'clips': ['intro-1', 'intro-2', 'intro-3'],
        # (대사 파일, 시작 초)
        'voices': [(WORK / 'voice/norm/film-intro-1.mp3', 0.9), (WORK / 'voice/norm/film-intro-2a.mp3', 7.5),
                   (WORK / 'voice/norm/film-intro-2b.mp3', 12.5), (WORK / 'voice/norm/film-intro-3.mp3', 16.4)],
        'title': [('별빛 관측 연구소', 78, 1.0, 5.6, 0.30), ('밤하늘 관측 기록을 지켜라', 34, 1.6, 5.6, 0.42)],
        'tail': 0.6,
    },
    'final': {
        'clips': ['final-1', 'final-2', 'final-3'],
        'voices': [(VOICES / 'el-movie-2.mp3', 0.9), (VOICES / 'el-movie-4.mp3', 8.2), (VOICES / 'el-ending.mp3', 15.2)],
        'title': [('탐구 완료', 84, 15.6, 22.6, 0.26), ('관측 시스템 복구 100%', 36, 16.2, 22.6, 0.40)],
        'tail': 1.2,
    },
}

def run(cmd):
    print(' '.join(str(c) for c in cmd)[:300]); subprocess.run([str(c) for c in cmd], check=True)

def main(part):
    p = PARTS[part]
    # 플로우(Veo) 영상이 있으면 그것을, 없으면 그림 + 카메라 움직임 판(clips-kb)을 쓴다.
    clips = [CLIPS / f'{n}.mp4' if (CLIPS / f'{n}.mp4').exists() else CLIPS.parent / 'clips-kb' / f'{n}.mp4' for n in p['clips']]
    print('clips', [str(c).split('film-20261121/')[1] for c in clips])
    for c in clips:
        if not c.exists(): sys.exit(f'missing clip {c}')
    total = CLIP * 3 - XF * 2 + p['tail']
    out = WORK / f'src-{part}.mp4'
    inputs = []
    for c in clips: inputs += ['-i', c]
    for v, _ in p['voices']: inputs += ['-i', v]
    f = []
    for i in range(3):
        # 길이를 8초로 맞추고(짧으면 마지막 장면을 늘림) 1280x720 30fps로
        f.append(f'[{i}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=2,trim=0:{CLIP},setpts=PTS-STARTPTS[v{i}]')
        f.append(f'[{i}:a]aresample=44100,apad,atrim=0:{CLIP},asetpts=PTS-STARTPTS,volume=0.35[a{i}]')
    f.append(f'[v0][v1]xfade=transition=fade:duration={XF}:offset={CLIP - XF}[x1]')
    f.append(f'[x1][v2]xfade=transition=fade:duration={XF}:offset={2 * CLIP - 2 * XF}[x2]')
    f.append(f'[x2]tpad=stop_mode=clone:stop_duration={p["tail"]}[x3]')
    # 제목 모션: 아래에서 살짝 떠오르며 나타났다가 사라짐 + 그림자
    chain = '[x3]'
    for k, (text, size, t0, t1, ypos) in enumerate(p['title']):
        alpha = f"if(lt(t,{t0}),0,if(lt(t,{t0}+0.8),(t-{t0})/0.8,if(lt(t,{t1}-0.8),1,if(lt(t,{t1}),({t1}-t)/0.8,0))))"
        y = f"h*{ypos}-if(lt(t,{t0}+0.8),(1-(t-{t0})/0.8)*18,0)"
        color = '0xFFE3A1' if k == 0 else '0xEEF1F8'
        f.append(f"{chain}drawtext=fontfile='{FONT}':expansion=none:text='{text}':fontsize={size}:fontcolor={color}:x=(w-text_w)/2:y='{y}':alpha='{alpha}':shadowcolor=0x0B1428@0.85:shadowx=0:shadowy=3:borderw=2:bordercolor=0x0B1428@0.55[t{k}]")
        chain = f'[t{k}]'
    f.append(f'{chain}fade=t=in:st=0:d=0.6,fade=t=out:st={total - 0.7}:d=0.7,format=yuv420p[vout]')
    f.append(f'[a0][a1]acrossfade=d={XF}[ax1]')
    f.append(f'[ax1][a2]acrossfade=d={XF}[ax2]')
    f.append(f'[ax2]apad,atrim=0:{total}[amb]')
    mix = ['[amb]']
    for j, (_, t) in enumerate(p['voices']):
        ms = int(t * 1000)
        f.append(f'[{3 + j}:a]aresample=44100,adelay={ms}|{ms},apad,atrim=0:{total}[vo{j}]')
        mix.append(f'[vo{j}]')
    f.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,afade=t=in:st=0:d=0.5,afade=t=out:st={total - 0.8}:d=0.8,alimiter=limit=0.89[aout]")
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(f), '-map', '[vout]', '-map', '[aout]',
         '-t', f'{total:.2f}', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'aac', '-b:a', '160k', '-ac', '2', out])
    print('ok', out, total)

if __name__ == '__main__':
    main(sys.argv[1])
