// 편별 데이터와 그림. 글은 앱 자막(src/concepts.js)과 같은 내용, 그림은 게임 에셋과 앱의 과학 함수에서 온다.
// 달 위상: src/drawing.js phase()/moonSVG() (북반구, 차오를 때 오른쪽이 밝음)
// 별 위치: src/drawing.js projectedStars (HYG v4.1 좌표). 북극성을 중심으로 하늘 전체를 90° 돌려 가로로 놓았다(하늘이 도는 방향 그대로, 뒤집지 않음).
import { CUES, DURATION, labels, esc } from './kit/kit.mjs';
import { moonSVG, phase, projectedStars } from '../src/drawing.js';
import { referenceLines, planets } from '../src/data.js';

const [, B, C, D] = CUES;
const fadeOut = (sel, t) => `tl.to(${JSON.stringify(sel)},{opacity:0,y:-28,duration:.3,ease:'power3.in'},${t});`;
const moonArt = (day, size, id) => { const p = phase(day); return moonSVG(p.amount, p.side, '', `id="${id}" width="${size}" height="${size}"`, { moonHref: 'assets/img/moon.webp' }); };
const planetImg = (id, size, x, y, extra = '') => `<img id="${extra || 'p-' + id}" src="assets/img/${id}.webp" alt="" style="position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px">`;

export const films = [
  {
    id: 1, title: '같은 달, 더 자세히 보기', place: '달 관측대', cast: 'rabbit', askPose: 'scope',
    question: '배율을 높이면 달이 더 커질까?',
    captions: ['배율을 높이면 달이 더 커지는 걸까요?', '같은 달을 1배와 2배로 찍어 비교해요.', '어두운 곳, 밝은 곳, 둥근 구덩이가 자세히 보여요.', '달이 커진 것이 아니라, 원래 있던 무늬가 자세히 보이는 거예요.'],
    steps: ['질문', '배율 비교', '표면의 특징', '같은 달'],
    terms: ['배율', '어두운 곳', '밝은 곳', '구덩이', '무늬', '달'],
    answer: '달은 그대로, <b>무늬</b>가 또렷해져요',
    proofs: [{ text: '배율: 크게 보는 정도', x: 260, y: 420 }, { text: '달의 크기는 그대로', x: 260, y: 520, cls: 'gold' }],
    reaction: '무늬가 보여!',
    scenes(film) {
      // 2. 관측 재현: 같은 망원경 창에서 1배 → 2배, 사진 두 장.
      film.clip('replay', B, C - B, `<div id="r-win" class="window" style="left:150px;top:190px;width:1000px;height:760px">
  <div style="position:absolute;left:200px;top:80px;width:600px;height:600px;border-radius:50%;overflow:hidden;background:#0b1630;border:12px solid #d3922a">
    <img id="r-moon" src="assets/img/moon.webp" alt="" style="position:absolute;left:30px;top:30px;width:540px;height:540px">
    <div style="position:absolute;left:285px;top:250px;width:6px;height:76px;background:#9fc3d6;opacity:.6"></div><div style="position:absolute;left:250px;top:285px;width:76px;height:6px;background:#9fc3d6;opacity:.6"></div>
  </div>
  <div id="r-x1" class="tag gold" style="left:40px;top:36px">배율 1배</div>
  <div id="r-x2" class="tag gold" style="left:40px;top:36px">배율 2배</div>
</div>
<div id="r-p1" class="photo" style="left:1250px;top:190px;width:500px"><div class="shot" style="height:250px"><img src="assets/img/moon.webp" alt="" style="position:absolute;left:180px;top:55px;width:140px;height:140px"></div><div class="cap">1배 사진</div></div>
<div id="r-p2" class="photo" style="left:1250px;top:580px;width:500px"><div class="shot" style="height:250px"><img src="assets/img/moon.webp" alt="" style="position:absolute;left:110px;top:-15px;width:280px;height:280px"></div><div class="cap">2배 사진</div></div>`);
      film.tl(`tl.fromTo('#r-win',{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:'expo.out'},${B + .15});`,
        `tl.fromTo('#r-moon',{scale:.5},{scale:.5,duration:.01},${B + .1});`,
        `tl.fromTo('#r-x1',{opacity:0},{opacity:1,duration:.2},${B + .45});`,
        `tl.fromTo('#r-x2',{opacity:0},{opacity:0,duration:.01},${B});`,
        `tl.fromTo('#r-p1',{opacity:0,y:-70,rotation:-4},{opacity:1,y:0,rotation:-2,duration:.45,ease:'back.out(1.5)'},${B + 1.0});`,
        `tl.to('#r-moon',{scale:1.18,duration:1.0,ease:'power2.inOut'},${B + 1.65});`,
        `tl.to('#r-x1',{opacity:0,duration:.15},${B + 2.5});tl.to('#r-x2',{opacity:1,duration:.2},${B + 2.55});`,
        `tl.fromTo('#r-p2',{opacity:0,y:-70,rotation:4},{opacity:1,y:0,rotation:2,duration:.45,ease:'back.out(1.5)'},${B + 3.0});`,
        fadeOut(['#r-win', '#r-p1', '#r-p2'], C - .42));
      film.sound('capture', B + 1.0); film.sound('capture', B + 3.0, .65);
      // 3. 확대 + 이름표: 같은 달 그림 위 실제 무늬 자리.
      const L = 580, T = 190, S = 760, at = (px, py) => [L + px * S, T + py * S];
      const [mx, my] = at(.60, .32), [cx, cy] = at(.33, .40), [hx, hy] = at(.50, .80);
      film.clip('zoom', C, D - C, `<img id="z-moon" src="assets/img/moon.webp" alt="" style="position:absolute;left:${L}px;top:${T}px;width:${S}px;height:${S}px">
${labels(film, [{ x: mx, y: my, tx: 1600, ty: 380, text: '어두운 곳' }, { x: cx, y: cy, tx: 330, ty: 500, text: '둥근 구덩이' }, { x: hx, y: hy, tx: 1580, ty: 860, text: '밝은 곳', cls: 'gold' }], 'z', C + .9, .8)}`);
      film.tl(`tl.fromTo('#z-moon',{scale:.62,opacity:0},{scale:1,opacity:1,duration:.6,ease:'expo.out'},${C + .05});`,
        fadeOut(['#z-moon', '#z0', '#z1', '#z2', '.leader'], D - .4));
    },
  },
  {
    id: 2, title: '여러 날의 달을 이어 보면', place: '시간 기록소', cast: 'rabbit', askPose: 'think',
    question: '달 모양은 날마다 어떻게 바뀔까?',
    captions: ['여러 날 관찰한 달은 어떻게 달라질까요?', '처음에는 오른쪽이 밝고, 밝은 부분이 점점 커져요.', '보름달 뒤에는 왼쪽이 밝고, 밝은 부분이 작아져요.', '달 모양은 약 30일마다 같은 순서로 바뀌어서 다음 모습을 예상할 수 있어요.'],
    steps: ['질문', '차오르는 달', '줄어드는 달', '되풀이'],
    terms: ['오른쪽', '왼쪽', '밝은 부분', '보름달', '30일', '예상'],
    answer: '약 <b>30일</b>마다 되풀이돼요',
    proofs: [{ text: '같은 순서로 바뀌어요', x: 260, y: 420 }, { text: '다음 모습을 예상할 수 있어요', x: 260, y: 520, cls: 'gold' }],
    reaction: '다음은 초승달!',
    scenes(film) {
      const days = [3, 7, 15, 22, 27], names = ['초승달', '상현달', '보름달', '하현달', '그믐달'];
      const left = 120, top = 190, gap = 336, x0 = 168;
      // 한 기록판이 2·3장면 내내 그대로 있고, 달만 날짜 순서로 놓인다.
      film.clip('strip', B, D - B, `<div id="s-win" class="window" style="left:${left}px;top:${top}px;width:1680px;height:600px">
${days.map((d, i) => `<div id="s-m${i}" style="position:absolute;left:${x0 + gap * i - 115}px;top:60px;width:230px;height:230px">${moonArt(d, 230, 's-svg' + i)}</div>
<div id="s-d${i}" class="tag small" style="left:${x0 + gap * i}px;top:320px">${d}일째</div>`).join('\n')}
<svg class="leader" style="width:1680px;height:600px" viewBox="0 0 1680 600"><path id="s-grow" d="M90 430 H 920" stroke="#d3922a" stroke-width="10" stroke-linecap="round" fill="none"/><path id="s-shrink" d="M920 430 H 1600" stroke="#7fc7bf" stroke-width="10" stroke-linecap="round" fill="none"/></svg>
<div id="s-grow-tag" class="tag gold" style="left:505px;top:470px">오른쪽이 밝고 커져요</div>
<div id="s-shrink-tag" class="tag teal" style="left:1260px;top:470px">왼쪽이 밝고 작아져요</div>
</div>
${names.map((n, i) => `<div id="s-n${i}" class="tag" style="left:${left + 6 + x0 + gap * i}px;top:850px">${n}</div>`).join('\n')}`);
      film.tl(`tl.fromTo('#s-win',{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:'expo.out'},${B + .15});`,
        ...days.map((_, i) => `tl.fromTo('#s-m${i}',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.4,ease:'back.out(1.6)'},${i < 3 ? B + .7 + i * .7 : C + .2 + (i - 3) * .7});tl.fromTo('#s-d${i}',{opacity:0,scale:.6,xPercent:-50},{opacity:1,scale:1,xPercent:-50,duration:.4,ease:'back.out(1.6)'},${i < 3 ? B + .75 + i * .7 : C + .25 + (i - 3) * .7});`),
        `tl.fromTo('#s-grow',{opacity:0},{opacity:1,duration:.01},${B + 2.85});tl.fromTo('#s-grow',{attr:{d:'M90 430 H 92'}},{attr:{d:'M90 430 H 920'},duration:.6,ease:'power2.out'},${B + 2.85});`,
        `tl.fromTo('#s-grow-tag',{opacity:0,y:20,xPercent:-50},{opacity:1,y:0,xPercent:-50,duration:.35,ease:'expo.out'},${B + 3.1});`,
        `tl.fromTo('#s-shrink',{opacity:0},{opacity:1,duration:.01},${C + 1.6});tl.fromTo('#s-shrink',{attr:{d:'M920 430 H 922'}},{attr:{d:'M920 430 H 1600'},duration:.5,ease:'power2.out'},${C + 1.6});`,
        `tl.fromTo('#s-shrink-tag',{opacity:0,y:20,xPercent:-50},{opacity:1,y:0,xPercent:-50,duration:.35,ease:'expo.out'},${C + 1.8});`,
        ...names.map((_, i) => `tl.fromTo('#s-n${i}',{opacity:0,y:24,xPercent:-50},{opacity:1,y:0,xPercent:-50,duration:.3,ease:'expo.out'},${C + 2.4 + i * .12});`),
        fadeOut(['#s-win', ...names.map((_, i) => '#s-n' + i)], D - .42));
      film.sound('place', B + .7); film.sound('place', B + 1.4, .6); film.sound('place', B + 2.1, .7); film.sound('discover', B + 3.1, .7);
      film.sound('place', C + .2, .7); film.sound('place', C + .9, .6); film.sound('discover', C + 1.8, .7); film.sound('discover', C + 2.4, .6);
    },
  },
  {
    id: 3, title: '태양과 여덟 행성', place: '행성 연구실', cast: 'fox', askPose: 'think',
    question: '태양 둘레에는 무엇이 있을까?',
    captions: ['태양 둘레에는 어떤 천체들이 있을까요?', '태양에서 가까운 순서로 여덟 행성이 있어요. 지구도 행성이에요.', '표면, 줄무늬, 고리처럼 행성마다 특징이 달라요.', '태양과 그 둘레를 도는 행성 등을 태양계라고 해요. 크기와 거리는 모형이에요.'],
    steps: ['질문', '가까운 순서', '행성의 특징', '태양계'],
    terms: ['태양', '행성', '태양계', '줄무늬', '고리', '모형'],
    answer: '태양과 행성 등 = <b>태양계</b>',
    proofs: [{ text: '행성 8개: 수성부터 해왕성까지', x: 260, y: 420 }, { text: '크기와 거리는 모형이에요', x: 260, y: 520, cls: 'gold' }],
    reaction: '지구도 행성이야!',
    scenes(film) {
      const sizes = { mercury: 70, venus: 92, earth: 96, mars: 80, jupiter: 160, saturn: 200, uranus: 118, neptune: 112 };
      const xs = [430, 565, 700, 830, 990, 1185, 1375, 1530];
      film.clip('order', B, C - B, `<div id="o-win" class="window" style="left:120px;top:200px;width:1680px;height:600px">
  <img id="o-sun" src="assets/img/sun.webp" alt="" style="position:absolute;left:-230px;top:20px;width:560px;height:560px">
  <div class="tag small gold" style="left:40px;top:500px">태양</div>
  ${planets.map((p, i) => `<div id="o-p${i}">${planetImg(p.id, sizes[p.id], xs[i], 290, 'o-img' + i)}<div class="tag small" style="left:${xs[i]}px;top:420px;transform:translateX(-50%)">${p.name}</div></div>`).join('\n  ')}
  <svg class="leader" style="width:1680px;height:600px" viewBox="0 0 1680 600"><path id="o-arrow" d="M400 530 H 1600 M1572 512 L1600 530 L1572 548" stroke="#d3922a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
  <div id="o-tag" class="tag gold" style="left:1000px;top:40px">태양에서 가까운 순서</div>
</div>
<div id="o-note" class="note" style="left:1060px;top:830px">크기와 거리는 실제 비율이 아니에요</div>`);
      film.tl(`tl.fromTo('#o-win',{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:'expo.out'},${B + .15});`,
        ...planets.map((_, i) => `tl.fromTo('#o-p${i}',{opacity:0,x:-40},{opacity:1,x:0,duration:.35,ease:'expo.out'},${B + .6 + i * .26});`),
        `tl.fromTo('#o-arrow',{strokeDasharray:'1300 1300',strokeDashoffset:1300},{strokeDashoffset:0,duration:.7,ease:'power2.inOut'},${B + 2.8});`,
        `tl.fromTo('#o-tag',{opacity:0,y:-20,xPercent:-50},{opacity:1,y:0,xPercent:-50,duration:.35,ease:'expo.out'},${B + 3.0});`,
        `tl.fromTo('#o-note',{opacity:0},{opacity:1,duration:.3},${B + 1.2});`,
        fadeOut(['#o-win', '#o-note'], C - .42));
      film.sound('place', B + .6); film.sound('place', B + 1.9, .6); film.sound('discover', B + 3.0, .7);
      const cards = [['earth', 420], ['jupiter', 960], ['saturn', 1500]];
      film.clip('feature', C, D - C, `${cards.map(([id, x], i) => `<div id="f-c${i}">${planetImg(id, id === 'saturn' ? 440 : 360, x, 540, 'f-img' + i)}<div class="tag" style="left:${x}px;top:270px;transform:translateX(-50%)">${planets.find(p => p.id === id).name}</div></div>`).join('\n')}
${labels(film, [{ x: 420, y: 560, tx: 420, ty: 850, text: '바다·육지·구름' }, { x: 990, y: 500, tx: 960, ty: 850, text: '줄무늬', cls: 'gold' }, { x: 1690, y: 560, tx: 1520, ty: 850, text: '고리', cls: 'teal' }], 'f', C + 1.0, .75)}`);
      film.tl(...cards.map((_, i) => `tl.fromTo('#f-c${i}',{opacity:0,scale:.7},{opacity:1,scale:1,duration:.45,ease:'back.out(1.4)'},${C + .1 + i * .15});`),
        fadeOut(['#f-c0', '#f-c1', '#f-c2', '#f0', '#f1', '#f2', '.leader'], D - .4));
      film.sound('place', C + .1, .7);
    },
  },
  {
    id: 4, title: '빛은 어디에서 올까?', place: '빛의 실험실', cast: 'rabbit', askPose: 'think',
    question: '밝게 보이면 모두 별일까?',
    captions: ['밤하늘에서 밝게 보이면 모두 별일까요?', '태양빛을 가리면 행성도 어둡게 보여요.', '태양 같은 별은 스스로 빛을 내고, 행성은 태양빛을 반사해요.', '밝기나 색이 아니라, 빛이 어디에서 오는지로 판단해요.'],
    steps: ['질문', '빛 가리기', '빛의 근원', '판단 근거'],
    terms: ['별', '스스로 빛', '행성', '반사', '빛'],
    answer: '<b>빛의 근원</b>으로 구별해요',
    proofs: [{ text: '별: 스스로 빛을 내요', x: 260, y: 420, cls: 'gold' }, { text: '행성: 태양빛을 반사해요', x: 260, y: 520, cls: 'teal' }],
    reaction: '금성은 행성이구나!',
    scenes(film) {
      // 한 실험대가 2·3장면 내내 그대로. 가림판으로 빛을 막았다가 치운 뒤, 빛의 길에 이름을 붙인다.
      film.clip('light', B, D - B, `<div id="l-win" class="window" style="left:120px;top:190px;width:1680px;height:640px">
  <svg class="leader" style="width:1680px;height:640px" viewBox="0 0 1680 640">
    <path id="l-beam" d="M330 250 L1160 280 L1160 370 L330 390 Z" fill="#f2c66a" opacity=".32"/>
    <path id="l-in" d="M350 320 H 1120 M1094 302 L1120 320 L1094 338" stroke="#e6a93a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path id="l-out" d="M1260 420 L 1480 540 M1450 540 L1480 540 L1466 512" stroke="#7fd0c4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <g id="l-eye" transform="translate(1540 560)"><path d="M-60 0 Q0 -46 60 0 Q0 46 -60 0 Z" fill="#fffdf6" stroke="#1c2a4a" stroke-width="6"/><circle r="17" fill="#1c2a4a"/></g>
  </svg>
  <img id="l-sun" src="assets/img/sun.webp" alt="" style="position:absolute;left:40px;top:130px;width:380px;height:380px">
  <div style="position:absolute;left:1110px;top:170px;width:300px;height:300px">
    <img id="l-venus" src="assets/img/venus.webp" alt="" style="position:absolute;inset:0;width:300px;height:300px">
    <div id="l-night" style="position:absolute;inset:4px;border-radius:50%;background:linear-gradient(90deg,rgba(11,20,44,0) 46%,rgba(11,20,44,.72) 58%)"></div>
    <div id="l-dark" style="position:absolute;inset:2px;border-radius:50%;background:#0b142c"></div>
  </div>
  <div class="tag small gold" style="left:175px;top:530px">태양</div>
  <div class="tag small" style="left:1205px;top:490px">금성</div>
  <div id="l-board" style="position:absolute;left:690px;top:120px;width:70px;height:400px;border-radius:14px;background:#55617d;border:6px solid #1c2a4a"></div>
  <div id="l-board-tag" class="tag small" style="left:640px;top:540px">가림판</div>
  <div id="l-dim-tag" class="tag teal" style="left:1260px;top:40px">행성이 어두워져요</div>
</div>
${labels(film, [{ x: 350, y: 510, tx: 470, ty: 900, text: '스스로 빛을 내요', cls: 'gold' }, { x: 1340, y: 460, tx: 1150, ty: 900, text: '태양빛을 반사해요', cls: 'teal' }], 'l', C + 1.25, .9)}`);
      film.tl(`tl.fromTo('#l-win',{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:'expo.out'},${B + .15});`,
        `tl.fromTo('#l-dark',{opacity:0},{opacity:0,duration:.01},${B});`,
        `tl.fromTo('#l-in',{opacity:0},{opacity:0,duration:.01},${B});tl.fromTo('#l-out',{opacity:0},{opacity:0,duration:.01},${B});tl.fromTo('#l-eye',{opacity:0},{opacity:0,duration:.01},${B});`,
        `tl.fromTo('#l-board',{y:-560},{y:-560,duration:.01},${B});tl.fromTo('#l-board-tag',{opacity:0},{opacity:0,duration:.01},${B});tl.fromTo('#l-dim-tag',{opacity:0,xPercent:-50},{opacity:0,xPercent:-50,duration:.01},${B});`,
        `tl.to('#l-board',{y:0,duration:.5,ease:'power3.out'},${B + 1.2});tl.to('#l-board-tag',{opacity:1,duration:.2},${B + 1.5});`,
        `tl.to('#l-beam',{attr:{d:'M330 250 L690 262 L690 382 L330 390 Z'},duration:.35,ease:'power2.out'},${B + 1.5});tl.to('#l-dark',{opacity:.78,duration:.4,ease:'power2.out'},${B + 1.6});`,
        `tl.fromTo('#l-dim-tag',{opacity:0,y:-16,xPercent:-50},{opacity:1,y:0,xPercent:-50,duration:.3,ease:'expo.out'},${B + 1.95});`,
        `tl.to('#l-board',{y:-560,duration:.45,ease:'power3.in'},${B + 3.45});tl.to('#l-board-tag',{opacity:0,duration:.15},${B + 3.4});tl.to('#l-dim-tag',{opacity:0,duration:.2},${B + 3.4});`,
        `tl.to('#l-beam',{attr:{d:'M330 250 L1160 280 L1160 370 L330 390 Z'},duration:.4,ease:'power2.out'},${B + 3.85});tl.to('#l-dark',{opacity:0,duration:.4,ease:'power2.out'},${B + 3.9});`,
        `tl.to('#l-in',{opacity:1,duration:.05},${C + .3});tl.fromTo('#l-in',{strokeDasharray:'850 850',strokeDashoffset:850},{strokeDashoffset:0,duration:.5,ease:'power2.inOut'},${C + .3});`,
        `tl.to('#l-eye',{opacity:1,duration:.3},${C + .7});tl.to('#l-out',{opacity:1,duration:.05},${C + .9});tl.fromTo('#l-out',{strokeDasharray:'320 320',strokeDashoffset:320},{strokeDashoffset:0,duration:.35,ease:'power2.out'},${C + .9});`,
        fadeOut(['#l-win', '#l0', '#l1', '.leader'], D - .42));
      film.sound('capture', B + 1.2); film.sound('place', B + 3.45, .6); film.sound('discover', C + .3, .7);
    },
  },
  {
    id: 5, title: '같은 별, 다양한 패턴', place: '북쪽 전망대', cast: 'fox', askPose: 'map',
    question: '북극성 주변 별은 어떻게 찾을까?',
    captions: ['북극성 주변의 별들은 어떻게 알아볼까요?', '밝은 별들을 선으로 이으면 모양이 보여요.', '북두칠성과 카시오페이아자리 사이에 북극성이 있어요.', '선은 사람이 이어 그린 표현이에요. 별의 배열을 보고 패턴을 찾아요.'],
    steps: ['질문', '별 잇기', '북극성 주변', '사람이 그은 선'],
    terms: ['북극성', '북두칠성', '카시오페이아자리', '선', '배열', '패턴'],
    answer: '선은 <b>사람이 그린 것</b>이에요',
    proofs: [{ text: '별의 자리는 그대로', x: 260, y: 420 }, { text: '북극성은 두 별자리 사이', x: 260, y: 520, cls: 'gold' }],
    reaction: '북극성 찾았다!',
    scenes(film) {
      const WL = 260, WT = 160, polaris = projectedStars.find(s => s.id === 'Polaris');
      const s = 4.0, cx = 686, cy = 330;
      // 북극성 기준 90° 반시계 회전: (dx, dy) → (dy, -dx). 거울 뒤집기 없음.
      const pos = Object.fromEntries(projectedStars.map(st => [st.id, [cx + (st.y - polaris.y) * s, cy - (st.x - polaris.x) * s]]));
      const size = st => Math.round((78 - (st.mag - 1.7) * 18) * 2.6), core = st => (9.5 - (st.mag - 1.7) * 2.2).toFixed(1);
      const line = ([a, b], i, cls) => `<line id="${cls}${i}" x1="${pos[a][0]}" y1="${pos[a][1]}" x2="${pos[b][0]}" y2="${pos[b][1]}"/>`;
      const alt = [['Caph', 'Cih'], ['Schedar', 'Ruchbah'], ['Cih', 'Segin']];
      const abs = id => [WL + 6 + pos[id][0], WT + 6 + pos[id][1]];
      const [px, py] = abs('Polaris');
      film.clip('sky', B, D - B, `<div id="k-win" class="window" style="left:${WL}px;top:${WT}px;width:1400px;height:780px">
  <svg class="leader" style="width:1400px;height:780px" viewBox="0 0 1400 780">
    <g stroke="#9fd8cf" stroke-width="6" stroke-linecap="round">${referenceLines.map((l, i) => line(l, i, 'k-l')).join('')}</g>
    <g stroke="#f2c66a" stroke-width="6" stroke-linecap="round" stroke-dasharray="14 14">${alt.map((l, i) => line(l, i, 'k-a')).join('')}</g>
    <g fill="#fffdf6">${projectedStars.map((st, i) => `<circle id="k-c${i}" cx="${pos[st.id][0]}" cy="${pos[st.id][1]}" r="${core(st)}"/>`).join('')}</g>
    <circle id="k-ring" cx="${pos.Polaris[0]}" cy="${pos.Polaris[1]}" r="58" fill="none" stroke="#f2c66a" stroke-width="6"/>
  </svg>
  ${projectedStars.map((st, i) => `<img id="k-s${i}" src="assets/img/star.webp" alt="" style="position:absolute;left:${pos[st.id][0] - size(st) / 2}px;top:${pos[st.id][1] - size(st) / 2}px;width:${size(st)}px;height:${size(st)}px">`).join('')}
  <div id="k-alt-tag" class="tag gold" style="left:700px;top:36px">다르게 이어도 별은 그대로</div>
</div>
${labels(film, [{ x: abs('Merak')[0], y: abs('Merak')[1] - 30, tx: 1580, ty: 280, text: '북두칠성' }, { x: abs('Caph')[0], y: abs('Caph')[1] + 30, tx: 480, ty: 620, text: '카시오페이아자리' }, { x: px, y: py + 62, tx: px, ty: 700, text: '북극성', cls: 'gold', sound: false }], 'k', C + .4, .6)}`);
      const len = ([a, b]) => Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]).toFixed(1);
      film.tl(`tl.fromTo('#k-win',{opacity:0,y:60},{opacity:1,y:0,duration:.5,ease:'expo.out'},${B + .15});`,
        ...projectedStars.map((_, i) => `tl.fromTo(['#k-s${i}','#k-c${i}'],{opacity:0},{opacity:1,duration:.3,ease:'power2.out'},${(B + .6 + i * .07).toFixed(2)});`),
        ...referenceLines.map((l, i) => `tl.fromTo('#k-l${i}',{strokeDasharray:'${len(l)} ${len(l)}',strokeDashoffset:${len(l)}},{strokeDashoffset:0,duration:.25,ease:'none'},${(B + (i < 4 ? 3.0 + i * .2 : 1.6 + (i - 4) * .2)).toFixed(2)});`),
        `tl.fromTo('#k-ring',{opacity:0,scale:.5,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:.35,ease:'back.out(1.8)'},${C + 1.55});`,
        ...alt.map((l, i) => `tl.fromTo('#k-a${i}',{opacity:0},{opacity:1,duration:.25},${(C + 1.9 + i * .12).toFixed(2)});`),
        `tl.fromTo('#k-alt-tag',{opacity:0,y:20,xPercent:-50},{opacity:1,y:0,xPercent:-50,duration:.35,ease:'expo.out'},${C + 2.0});`,
        fadeOut(['#k-win', '#k0', '#k1', '#k2', '.leader'], D - .42));
      film.sound('discover', B + .6, .6); film.sound('place', B + 1.6, .6); film.sound('place', B + 3.0, .5); film.sound('place', C + 1.9, .6);
    },
  },
];

export { CUES, DURATION, esc };
