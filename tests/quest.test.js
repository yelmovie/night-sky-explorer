import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { freshState, restore, track, completeStage } from '../src/state.js';
import { inquiryStyle, evidenceFact, restorePercent, npcConversation, introPanel, npc } from '../src/quest.js';
import { cloudyClose, planetSolved } from '../src/bonus.js';
import { classificationFeedback } from '../src/learning-flow.js';
import { bodies, planets } from '../src/data.js';
import { phase } from '../src/drawing.js';

test('큰 대화는 원문·화자 ID와 두 캐릭터의 유효 상반신을 유지한다', () => {
  for (const [step, who, lineId, text] of [[1, 'fox', 'intro-fox', npc.start], [2, 'rabbit', 'intro-lumi', npc.keeper]]) {
    const { body } = introPanel(step, '연구원');
    assert.ok(body.includes(text));
    assert.ok(body.includes(`data-line-id="${lineId}"`));
    assert.ok(body.includes(`data-speaker="${who}"`));
    assert.equal((body.match(/class="dialogue-character is-active"/g) || []).length, 1);
    assert.equal((body.match(/class="dialogue-character is-listening"/g) || []).length, 1);
  }
  const fallback = npcConversation('rabbit', '없는 자세도 루미로 표시해요.', { pose: 'missing' });
  assert.match(fallback, /is-active" data-character="rabbit" data-pose="neutral"/);
  assert.match(fallback, /assets\/dialogue\/rabbit\.webp/);
});

test('대화 시트 두 프레임은 투명 여백과 같은 앵커를 갖는다', async () => {
  for (const who of ['fox', 'rabbit']) {
    const file = fileURLToPath(new URL(`../public/assets/dialogue/${who}.webp`, import.meta.url));
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width, 2 * info.height);
    for (const frame of [0, 1]) {
      let visible=0, bottom=0;
      for(let y=0;y<info.height;y++)for(let x=0;x<info.height;x++){
        const a=data[(y*info.width+x+frame*info.height)*4+3];
        if(x<7||x>info.height-8)assert.equal(a,0,`${who} 프레임 경계`);
        if(a>100){visible++;bottom=y;}
      }
      assert.ok(visible>30000);
      assert.ok(bottom>=info.height-3);
    }
  }
});
test('탐구 스타일은 행동 기록으로 정해지고 기록이 없어도 하나를 보여 준다', () => {
  assert.equal(inquiryStyle({}).name, '꼼꼼한 관찰자');
  assert.equal(inquiryStyle({ observations: 40, reviews: 1, retries: 1, hints: 4 }).key, 'observer');
  assert.equal(inquiryStyle({ observations: 12, reviews: 14, retries: 1, hints: 4 }).key, 'analyst');
  assert.equal(inquiryStyle({ observations: 12, reviews: 2, retries: 12, hints: 4 }).key, 'persistent');
  assert.equal(inquiryStyle({ observations: 24, reviews: 2, retries: 1, hints: 0 }).key, 'independent');
  assert.equal(inquiryStyle({ observations: 'x', reviews: -5 }).key, 'observer');
});

test('행동 기록은 정해진 항목만 늘리고 상한을 넘지 않는다', () => {
  const s = freshState();
  track(s, 'hints'); track(s, 'hints'); track(s, 'unknown');
  assert.equal(s.stats.hints, 2);
  assert.equal(Object.hasOwn(s.stats, 'unknown'), false);
  s.stats.retries = 9999; track(s, 'retries');
  assert.equal(s.stats.retries, 9999);
});

test('새 필드가 없는 이전 저장도 기본값으로 열리고 잘못된 값은 바로잡는다', () => {
  const old = freshState();
  delete old.stats; delete old.bonus; delete old.intro; delete old.core.reportSeen;
  const s = restore(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(s.stats, { observations: 0, reviews: 0, retries: 0, hints: 0 });
  assert.deepEqual(s.bonus, { cloudy: '', planet: '' });
  assert.equal(s.intro, false);
  assert.equal(s.core.reportSeen, false);
  const broken = freshState();
  broken.stats = { observations: -4, reviews: 1e9, retries: 'many', hints: 2.6 };
  broken.bonus = { cloudy: 'yes', planet: 'done' };
  const fixed = restore(JSON.parse(JSON.stringify(broken)));
  assert.deepEqual(fixed.stats, { observations: 0, reviews: 9999, retries: 0, hints: 3 });
  assert.deepEqual(fixed.bonus, { cloudy: '', planet: 'done' });
});

test('연구소 복구율은 실제 기록 다섯 개와 코어 재가동이 모두 있어야 100%다', () => {
  const s = freshState();
  assert.equal(restorePercent(s), 0);
  s.evidence = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
  assert.equal(restorePercent(s), 90);
  s.core.restored = true;
  assert.equal(restorePercent(s), 100);
  s.evidence = { 1: {} };
  assert.equal(restorePercent(s), 18);
});

test('기록 요약은 학생 기록에서 읽고, v1 기록이나 빈 기록에서도 깨지지 않는다', () => {
  assert.equal(evidenceFact(1, null), '');
  assert.match(evidenceFact(1, { photo: { zoom: 2 }, spots: [] }), /관측사진 1장/);
  assert.match(evidenceFact(2, { captures: [3, 10, 21] }), /3개 시점 · 한 날짜/);
  assert.match(evidenceFact(3, { records: { mars: {}, earth: {} } }), /행성 2개/);
  assert.match(evidenceFact(4, { viewed: ['sun', 'venus'], answers: {} }), /천체 2개/);
  assert.match(evidenceFact(5, { cases: { a: { lines: [[1, 2]] }, b: { lines: [[1, 2], [2, 3]] } } }), /선 3개/);
  assert.match(evidenceFact(5, { lines: [[1, 2]] }), /선 1개/);
});

test('보너스 퀘스트는 근거에 맞는 예상만 인정한다', () => {
  const actual = phase(7);
  assert.equal(cloudyClose({ side: actual.side, amount: actual.amount }), true);
  assert.equal(cloudyClose({ side: actual.side, amount: actual.amount + 25 }), false);
  assert.equal(cloudyClose({ side: actual.side === 'right' ? 'left' : 'right', amount: actual.amount }), false);
  const uranus = planets.find(planet => planet.id === 'uranus'), neptune = planets.find(planet => planet.id === 'neptune');
  assert.equal(planetSolved({ feature: uranus.feature, name: 'uranus' }), true);
  assert.equal(planetSolved({ feature: neptune.feature, name: 'uranus' }), false);
  assert.equal(planetSolved({ feature: uranus.feature, name: 'neptune' }), false);
});

test('보너스 퀘스트 결과는 미션 완료와 인증서 조건을 바꾸지 않는다', () => {
  const s = freshState();
  s.bonus = { cloudy: 'done', planet: 'done' };
  assert.equal(completeStage(s, 1), false);
  assert.equal(restorePercent(s), 0);
});

test('판정은 맞았지만 근거가 겉모습뿐이면 근거를 다시 보게 한다', () => {
  const venus = bodies.find(body => body.id === 'venus');
  const shallow = classificationFeedback(venus, { kind: 'planet', reason: 'bright' });
  assert.equal(shallow.correct, false);
  assert.match(shallow.text, /판정은 맞았지만/);
  const flipped = classificationFeedback(venus, { kind: 'star', reason: venus.evidence });
  assert.match(flipped.text, /근거는 정확해/);
});
