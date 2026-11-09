// 공용 장면 부품. 편마다 같은 순서(질문 → 관측 재현 → 확대·이름표 → 결론 + 캐릭터 반응)를
// 같은 자리·같은 움직임으로 찍고, 편별 그림만 films.data.mjs가 채운다.
export const W = 1920, H = 1080, FPS = 30;
// 장면 경계 = 앱 자막·장면 버튼 시각(src/concepts.js). 테스트가 둘의 일치를 확인한다.
export const CUES = [0, 3.6, 8, 12.2];
export const DURATION = 16;

// 효과음 길이(ffprobe). 슬롯을 소리 길이에 맞춘다.
const LEN = { capture: 0.61, discover: 0.27, hint: 0.49, place: 0.19, success: 0.53 };
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = n => +(+n).toFixed(3);

export function createFilm() {
  const clips = [], tweens = [], sounds = [];
  let z = 1;
  return {
    clips, tweens, sounds,
    // A timed layer; tweens animate its children only (never the .clip itself).
    clip(id, start, duration, html, cls = 'full') {
      clips.push(`<div id="${id}" class="clip ${cls}" data-start="${r(start)}" data-duration="${r(duration)}" data-track-index="${z}" style="z-index:${z++}">${html}</div>`);
    },
    tl(...lines) { tweens.push(...lines); },
    // Sound lands one frame after the picture it belongs to.
    sound(name, t, volume = .75) { sounds.push({ name, t: r(t + 1 / FPS), volume }); },
  };
}

// 1. 질문: 캐릭터가 들어와 묻는다.
export function askScene(film, f) {
  const [s1, s2] = CUES;
  film.clip('ask', s1, s2 - s1, `<img id="ask-char" class="char" src="assets/img/${f.cast}-ask.webp" alt="" style="left:170px;top:${1080 - 760}px;height:720px">
<div id="ask-bubble" class="bubble" style="left:760px;top:330px;max-width:1040px">${esc(f.question)}</div>`);
  film.tl(`tl.fromTo('#ask-char',{x:-520},{x:0,duration:.55,ease:'expo.out'},.15);`,
    `tl.fromTo('#ask-char',{scaleY:1},{scaleY:.94,duration:.12,ease:'power2.out'},.68);tl.to('#ask-char',{scaleY:1,duration:.28,ease:'back.out(1.6)'},.8);`,
    `tl.fromTo('#ask-bubble',{opacity:0,scale:.84},{opacity:1,scale:1,duration:.42,ease:'back.out(1.6)'},.78);`,
    `tl.to('#ask-char',{x:-560,duration:.32,ease:'power3.in'},${s2 - .42});tl.to('#ask-bubble',{opacity:0,y:-24,duration:.26,ease:'power3.in'},${s2 - .38});`);
  film.sound('hint', .78);
}

// 3. 이름표: 점에서 선이 뻗고, 이름표가 그 끝에 내려앉는다.
export function labels(film, list, prefix, at, gap = .55) {
  return list.map((l, j) => {
    const t = at + j * gap, id = `${prefix}${j}`;
    film.tl(`tl.fromTo('#${id}-dot',{opacity:0,scale:0,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:.22,ease:'back.out(2)'},${r(t)});`,
      `tl.fromTo('#${id}-line',{attr:{x2:${l.x},y2:${l.y}}},{attr:{x2:${l.tx},y2:${l.ty}},duration:.24,ease:'power2.out'},${r(t + .08)});`,
      `tl.fromTo('#${id}',{opacity:0,scale:.72,xPercent:-50,yPercent:-50},{opacity:1,scale:1,xPercent:-50,yPercent:-50,duration:.3,ease:'back.out(1.8)'},${r(t + .26)});`);
    if (l.sound !== false) film.sound(j % 2 ? 'place' : 'discover', t + .26, .7);
    return `<svg class="leader" viewBox="0 0 1920 1080"><line id="${id}-line" x1="${l.x}" y1="${l.y}" x2="${l.tx}" y2="${l.ty}" stroke="#1c2a4a" stroke-width="5" stroke-linecap="round"/><circle id="${id}-dot" cx="${l.x}" cy="${l.y}" r="14" fill="#d3922a" stroke="#1c2a4a" stroke-width="4"/></svg>
<div id="${id}" class="tag ${l.cls || ''}" style="left:${l.tx}px;top:${l.ty}px">${esc(l.text)}</div>`;
  }).join('\n');
}

// 4. 결론 한 줄 + 캐릭터 반응. 마지막 프레임이 포스터가 된다.
export function answerScene(film, f) {
  const s4 = CUES[3];
  film.clip('answer', s4, DURATION - s4, `<div id="answer-text" class="answer">${f.answer}</div>
<div id="answer-rule" class="rule" style="top:300px"></div>
${f.proofs.map((p, i) => `<div id="proof${i}" class="tag ${p.cls || ''}" style="left:${p.x}px;top:${p.y}px">${esc(p.text)}</div>`).join('\n')}
${f.answerArt || ''}
<img id="react-char" class="char" src="assets/img/${f.cast}-react.webp" alt="" style="left:1420px;top:${1080 - 620}px;height:600px">
<div id="react-bubble" class="bubble small" style="right:520px;top:560px">${esc(f.reaction)}</div>`);
  film.tl(`tl.fromTo('#answer-text',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.2,ease:'power4.out'},${r(s4 + .3)});`,
    `tl.fromTo('#answer-rule',{scaleX:0},{scaleX:1,duration:.5,ease:'power2.inOut'},${r(s4 + .6)});`,
    ...f.proofs.map((p, i) => `tl.fromTo('#proof${i}',{opacity:0,y:40},{opacity:1,y:0,duration:.45,ease:'expo.out'},${r(s4 + .8 + i * .25)});`),
    ...(f.answerTweens || []).map(line => line.replaceAll('@', String(s4))),
    `tl.fromTo('#react-char',{y:680},{y:0,duration:.55,ease:'back.out(1.3)'},${r(s4 + 1.05)});`,
    `tl.fromTo('#react-char',{scaleY:1},{scaleY:.93,duration:.12,ease:'power2.out'},${r(s4 + 1.6)});tl.to('#react-char',{scaleY:1,duration:.26,ease:'back.out(1.6)'},${r(s4 + 1.72)});`,
    `tl.fromTo('#react-bubble',{opacity:0,scale:.8},{opacity:1,scale:1,duration:.38,ease:'back.out(1.7)'},${r(s4 + 1.6)});`);
  film.sound('success', s4 + .3, .8);
  film.sound('hint', s4 + 1.6, .6);
}

export function page(f, film, css) {
  const audio = film.sounds.map((s, i) => `<audio id="sfx${i}" class="clip" src="assets/sfx/${s.name}.ogg" data-start="${s.t}" data-duration="${LEN[s.name]}" data-track-index="${60 + i}" data-volume="${s.volume}"></audio>`).join('\n    ');
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>${esc(f.title)} · 개념영상 ${f.id}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
${css}
${f.css || ''}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="1920" data-height="1080" data-fps="${FPS}">
      ${film.clips.join('\n      ')}
    ${audio}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${film.tweens.join('\n      ')}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
}
