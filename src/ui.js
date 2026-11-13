import { esc, icon } from './drawing.js';
import { conceptArt } from './concept-assets.js';
import { planets } from './data.js';
export { esc, icon };
export const button=(label,action,cls='secondary',attrs='')=>`<button class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
export const learnButton=(label,action,cls='secondary',attrs='')=>`<button class="btn ${cls}" data-learning="${action}" ${attrs}>${label}</button>`;
export const range=(name,id,min,max,value,step=1,unit='')=>`<label class="range-label" for="${id}"><span>${name}</span><output id="${id}-value">${value}${unit}</output></label><input type="range" id="${id}" aria-label="${name}" min="${min}" max="${max}" value="${value}" step="${step}">`;
export const imageFor=id=>`/assets/generated/${id}.webp`;
export const planetImage=(id,alt='',cls='')=>`<img class="planet-image ${cls}" src="${imageFor(id)}" alt="${esc(alt)}" draggable="false">`;
export const celestialImage=(kind,alt='',cls='')=>`<img class="celestial-art ${cls}" src="${conceptArt[kind].src}" alt="${esc(alt)}" width="${conceptArt[kind].width}" height="${conceptArt[kind].height}" draggable="false" decoding="async">`;
export function token(id) {
  if (!id) return '<span class="slot-plus">+</span>';
  return `${id === 'sun' ? celestialImage('sun', '', 'sun-token') : planetImage(id, '')}<strong>${id === 'sun' ? '태양' : planets.find(planet => planet.id === id)?.name}</strong>`;
}
export const field=(label,id,value,placeholder='')=>`<label class="field-label" for="${id}">${label}</label><textarea id="${id}" maxlength="240" placeholder="${placeholder}">${esc(value)}</textarea>`;
