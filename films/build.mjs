// films.data.mjs + kit/ → films/stage-N/ (HyperFrames 프로젝트: index.html + assets).
// 그림은 게임에 이미 있는 에셋을 잘라 쓴다: 루미(rabbit.png)·별여우(fox.png) 포즈 시트 5×2칸,
// 달 표면·태양·별빛·행성 WebP, Jua 글꼴, Kenney CC0 효과음.
// 실행: node films/build.mjs  → 그다음 node films/render.mjs
import { mkdir, copyFile, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { films } from './films.data.mjs';
import { createFilm, askScene, answerScene, page, DURATION, esc } from './kit/kit.mjs';

const sharp = createRequire(import.meta.url)('sharp');
sharp.cache(false); sharp.concurrency(1);
const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '..', 'public', 'assets');
const css = await readFile(join(here, 'kit', 'kit.css'), 'utf8');

// 포즈 시트에서 한 포즈만 잘라 낸다. 아래 줄은 6포즈라 칸 나눔 대신 실제 그림 경계(px)를 쓴다.
const POSES = {
  rabbit: { scope: [1337, 0, 335, 470], think: [298, 470, 264, 471], react: [350, 0, 316, 445] },
  fox: { think: [1316, 0, 356, 470], map: [1050, 0, 262, 470], react: [356, 470, 310, 471] },
};
const NAMES = { rabbit: '루미', fox: '별여우' };

async function pose(cast, [left, top, width, height], out) {
  const cell = await sharp(join(pub, `${cast}.png`)).extract({ left, top, width, height }).png().toBuffer();
  await sharp(cell).trim({ threshold: 1 }).webp({ quality: 90, alphaQuality: 95 }).toFile(out);
}

for (const f of films) {
  const dir = join(here, `stage-${f.id}`), img = join(dir, 'assets', 'img');
  await mkdir(img, { recursive: true });
  await mkdir(join(dir, 'assets', 'fonts'), { recursive: true });
  await mkdir(join(dir, 'assets', 'sfx'), { recursive: true });
  for (const font of ['jua-korean-400.woff2', 'jua-latin-400.woff2', 'Jua-OFL.txt']) await copyFile(join(pub, 'fonts', font), join(dir, 'assets', 'fonts', font));
  for (const s of ['capture', 'discover', 'hint', 'place', 'success']) await copyFile(join(pub, 'audio', `${s}.ogg`), join(dir, 'assets', 'sfx', `${s}.ogg`));
  await copyFile(join(pub, 'audio', 'Kenney-CC0.txt'), join(dir, 'assets', 'sfx', 'Kenney-CC0.txt'));
  await pose(f.cast, POSES[f.cast][f.askPose], join(img, `${f.cast}-ask.webp`));
  await pose(f.cast, POSES[f.cast].react, join(img, `${f.cast}-react.webp`));
  const art = { moon: 'moon-surface-v3', sun: 'sun-v3', star: 'starlight-v3', earth: 'earth', venus: 'venus', jupiter: 'jupiter', saturn: 'saturn', mercury: 'mercury', mars: 'mars', uranus: 'uranus', neptune: 'neptune' };
  for (const [name, src] of Object.entries(art)) await sharp(join(pub, 'generated', `${src}.webp`)).resize({ width: name === 'star' ? 256 : 768, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 95 }).toFile(join(img, `${name}.webp`));

  const film = createFilm();
  film.clip('paper', 0, DURATION, '<div class="margin-line"></div>', 'full paper');
  film.clip('header', 0, DURATION, `<div id="head-tag" class="head">${NAMES[f.cast]}의 관측 노트 · ${esc(f.place)}</div>`);
  film.tl(`tl.fromTo('#head-tag',{opacity:0,y:-20},{opacity:1,y:0,duration:.5,ease:'expo.out'},.05);`);
  askScene(film, f);
  f.scenes(film);
  answerScene(film, f);
  const html = page(f, film, css);
  await writeFile(join(dir, 'index.html'), html);
  // 이 편이 쓰지 않는 그림·효과음은 지운다(저장소에 필요한 것만 남김).
  for (const sub of ['img', 'sfx']) for (const name of await readdir(join(dir, 'assets', sub)))
    if (!name.endsWith('.txt') && !html.includes(`assets/${sub}/${name}`)) await rm(join(dir, 'assets', sub, name));
  await writeFile(join(dir, 'hyperframes.json'), JSON.stringify({ $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' }, media: { autoProxy: true }, authoringSkill: 'hyperframes' }, null, 2) + '\n');
  await writeFile(join(dir, 'meta.json'), JSON.stringify({ id: `stage-${f.id}`, name: `개념영상 ${f.id} · ${f.title}` }, null, 2) + '\n');
  console.log(`stage-${f.id}: ${film.clips.length} clips, ${film.sounds.length} sounds`);
}
