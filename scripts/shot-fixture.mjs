// Completed-mission fixture shared by QA scripts. Drafts pass the real completion rules.
import { freshState, completeStage } from '../src/state.js';
import { planets, bodies, solarOrder, patternRegions } from '../src/data.js';

export function completedState(count) {
  const s = freshState(), d = s.drafts;
  Object.assign(s, { started: true, intro: true });
  d.moon.photos = [{ x: 0, y: 0, zoom: 1.5, focus: 72 }, { x: 0, y: 0, zoom: 2.2, focus: 72 }];
  d.moon.comparisons = [{ spots: [{ x: 26, y: 27 }, { x: 67, y: 29 }], observation: '밝은 곳과 어두운 곳의 색이 달라요.' }, { spots: [{ x: 32, y: 68 }, { x: 69, y: 65 }], observation: '둥근 구덩이가 많은 곳이 있어요.' }];
  d.phases.captures = [3, 7, 10, 17, 21, 25];
  for (const [day, side] of [[14, 'right'], [24, 'left']]) Object.assign(d.phases.predictions[day], { amount: 60, side, original: { amount: 60, side }, revealed: true, overlay: true, reflection: '밝은 부분이 생각보다 더 컸어요.' });
  for (const planet of planets) { d.planets.records[planet.id] = { feature: planet.feature, candidate: planet.id }; d.planets.groups[planet.id] = planet.group; }
  d.planets.order = [...solarOrder];
  d.classification.viewed = bodies.map(body => body.id);
  for (const body of bodies) d.classification.answers[body.id] = { kind: body.kind, reason: body.evidence };
  for (const [id, region] of Object.entries(patternRegions)) {
    d.pattern.observed.push(...region.stars);
    const lines = region.stars.slice(0, 4).map((star, index, list) => [star, list[index + 1]]).slice(0, 3);
    Object.assign(d.pattern.cases[id], { lines, original: lines, compared: true, showReference: true, reflection: '기준선과 한 곳이 달랐어요.' });
  }
  for (let n = 1; n <= count; n++) if (!completeStage(s, n)) throw Error('fixture stage ' + n);
  Object.assign(s.stats, { observations: 34, reviews: 7, retries: 3, hints: 2 });
  return s;
}
