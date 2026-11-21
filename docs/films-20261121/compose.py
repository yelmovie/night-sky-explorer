# -*- coding: utf-8 -*-
"""13 별빛 관측 연구소 인트로·엔딩 영상 합성 (2026-11-21, 최종 마무리판).
장면 3개(Veo 영상이 있으면 그것, 없으면 그림+카메라 움직임) → 1280x720 30fps → 0.4초 교차 페이드
→ 인트로 끝: 앱 제목 로고(public/assets/logo.webp)가 떠오르고 첫 화면 문구로 초대
→ 엔딩 끝: 앱 별빛 그림(starlight-v3.webp)이 반짝이고 「탐구 완료」 도장 + 「관측 시스템 복구 100%」
→ 소리: 대사(일레븐랩스)만. 영상 생성기 소리는 쓰지 않는다. 배경 음악은 앱이 설정에 따라 튼다(인트로 주제 음악, 엔딩 마무리 음악).
자막은 burn.py로 따로 입힌다. 사용: python3 compose.py intro|final
"""
import subprocess, sys
from pathlib import Path

ROOT = Path('/Volumes/T7 Shield/iscreammedia_sc34/13 nightsky')
WORK = ROOT / '.tmp/intro-video-20261121'
CLIPS = ROOT / 'references/film-20261121/clips'
FONT = '/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/fonts/Jua-Regular.ttf'
VOICES = ROOT / 'public/assets/audio/voices'
LOGO = ROOT / 'public/assets/logo.webp'
STAR = ROOT / 'public/assets/generated/starlight-v3.webp'
XF, CLIP = 0.4, 8.0

PARTS = {
    'intro': {
        'clips': ['intro-1', 'intro-2', 'intro-3'],
        'voices': [(WORK / 'voice/norm/film-intro-1.mp3', 0.8), (WORK / 'voice/norm/film-intro-2a.mp3', 7.8),
                   (WORK / 'voice/norm/film-intro-2b.mp3', 12.8), (WORK / 'voice/norm/film-intro-3.mp3', 16.6)],
        'tail': 4.6,          # 마지막 장면 뒤 제목 카드
        'end_card': 21.9,     # 제목 로고가 떠오르기 시작하는 시각
    },
    'final': {
        'clips': ['final-1', 'final-2', 'final-3'],
        'voices': [(VOICES / 'el-movie-2.mp3', 0.8), (VOICES / 'el-movie-4.mp3', 8.0), (VOICES / 'el-ending.mp3', 15.4)],
        'tail': 2.8,
        'end_card': 20.8,     # 반짝임·「탐구 완료」 도장 시작
    },
}

def run(cmd):
    subprocess.run([str(c) for c in cmd], check=True)

def clip_path(n):
    c = CLIPS / f'{n}.mp4'
    return c if c.exists() else CLIPS.parent / 'clips-kb' / f'{n}.mp4'

def ease_in(t0, d=0.8):
    return f"if(lt(t,{t0}),0,if(lt(t,{t0}+{d}),(t-{t0})/{d},1))"

def main(part):
    p = PARTS[part]
    clips = [clip_path(n) for n in p['clips']]
    print('clips', [str(c).split('film-20261121/')[1] for c in clips])
    body = CLIP * 3 - XF * 2
    total = body + p['tail']
    T = p['end_card']
    out = WORK / f'src-{part}.mp4'
    inputs = []
    for c in clips: inputs += ['-i', c]
    for v, _ in p['voices']: inputs += ['-i', v]
    nv = len(p['voices'])
    extra = 3 + nv
    inputs += ['-loop', '1', '-i', LOGO, '-loop', '1', '-i', STAR]
    f = []
    for i in range(3):
        # 마지막 장면은 끝 카드 길이만큼 마지막 화면을 붙잡아 늘린다(교차 페이드 뒤 tpad는 먹지 않는다).
        length = CLIP + (p['tail'] if i == 2 else 0)
        f.append(f'[{i}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,setsar=1,trim=0:{CLIP},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={p["tail"] + 1 if i == 2 else 1},trim=0:{length},setpts=PTS-STARTPTS[v{i}]')
    f.append(f'[v0][v1]xfade=transition=fade:duration={XF}:offset={CLIP - XF}[x1]')
    f.append(f'[x1][v2]xfade=transition=fade:duration={XF}:offset={2 * CLIP - 2 * XF}[x2]')
    f.append('[x2]null[x3]')
    if part == 'intro':
        # 끝 장면을 살짝 어둡게 한 뒤 제목 로고가 아래에서 떠오르고, 첫 화면 문구로 초대한다.
        f.append(f"[x3]eq=brightness='-0.10*{ease_in(T, 0.8)}':eval=frame[dim]")
        f.append(f"[{extra}:v]scale=760:-1,format=rgba,fade=t=in:st={T}:d=0.9:alpha=1,setpts=PTS-STARTPTS[logo]")
        f.append(f"[dim][logo]overlay=x=(W-w)/2:y='H*0.20-(1-{ease_in(T, 0.9)})*30':shortest=1[lg]")
        alpha = ease_in(T + 1.0, 0.7)
        f.append(f"[lg]drawtext=fontfile='{FONT}':expansion=none:text='너의 관측으로 연구소의 불빛을 켜요.':fontsize=44:fontcolor=0xFFE9B0:x=(w-text_w)/2:y='h*0.62-(1-{alpha})*16':alpha='{alpha}':shadowcolor=0x0B1428@0.9:shadowx=0:shadowy=3:borderw=3:bordercolor=0x0B1428@0.6[tt]")
        last = '[tt]'
    else:
        # 별빛 반짝임 9개가 차례로 반짝이고, 「탐구 완료」가 도장처럼 찍힌 뒤 「관측 시스템 복구 100%」.
        spots = [(110, 50, 160), (1030, 50, 180), (250, 240, 120), (950, 250, 140), (590, 10, 130), (40, 360, 110), (1130, 380, 130), (410, 140, 100), (800, 160, 110)]
        f.append(f"[{extra + 1}:v]format=rgba,split={len(spots)}" + ''.join(f'[s{i}]' for i in range(len(spots))))
        chain = '[x3]'
        for i, (x, y, size) in enumerate(spots):
            t0 = T + 0.15 * i
            f.append(f"[s{i}]scale={size}:{size},fade=t=in:st={t0}:d=0.35:alpha=1,fade=t=out:st={t0 + 1.4}:d=1.0:alpha=1,setpts=PTS-STARTPTS[sp{i}]")
            f.append(f"{chain}[sp{i}]overlay=x={x}:y={y}:shortest=1[c{i}]")
            chain = f'[c{i}]'
        stamp_t = T + 0.4
        a1 = ease_in(stamp_t, 0.35)
        # 도장: 크게 나타났다 제 크기로(글자 크기 대신 위치를 아주 살짝 흔들어 찍히는 느낌)
        f.append(f"{chain}drawtext=fontfile='{FONT}':expansion=none:text='탐구 완료':fontsize=96:fontcolor=0xFFE3A1:x=(w-text_w)/2:y='h*0.13+if(between(t,{stamp_t},{stamp_t}+0.35),-12*sin((t-{stamp_t})*28),0)':alpha='{a1}':shadowcolor=0x0B1428@0.9:shadowx=0:shadowy=4:borderw=4:bordercolor=0x7A4E12@0.85[t0]")
        a2 = ease_in(stamp_t + 0.6, 0.6)
        f.append(f"[t0]drawtext=fontfile='{FONT}':expansion=none:text='관측 시스템 복구 100%':fontsize=40:fontcolor=0xEEF1F8:x=(w-text_w)/2:y='h*0.30-(1-{a2})*14':alpha='{a2}':shadowcolor=0x0B1428@0.9:shadowx=0:shadowy=3:borderw=3:bordercolor=0x0B1428@0.6[t1]")
        last = '[t1]'
    f.append(f'{last}fade=t=in:st=0:d=0.5,fade=t=out:st={total - 0.6}:d=0.6,format=yuv420p,trim=0:{total}[vout]')
    mix = []
    for j, (_, t) in enumerate(p['voices']):
        ms = int(t * 1000)
        f.append(f'[{3 + j}:a]aresample=44100,adelay={ms}|{ms},apad,atrim=0:{total}[vo{j}]')
        mix.append(f'[vo{j}]')
    f.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,alimiter=limit=0.89,aformat=channel_layouts=stereo[aout]")
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(f), '-map', '[vout]', '-map', '[aout]',
         '-t', f'{total:.2f}', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'aac', '-b:a', '160k', out])
    print('ok', out, round(total, 2))

if __name__ == '__main__':
    main(sys.argv[1])
