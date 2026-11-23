// Observation evidence, separate from the planet/star classification answer.
export const lightPredictions = { darker: '행성이 어두워질 거예요.', same: '행성이 그대로 밝을 거예요.' };
export const freshLightTrial = () => ({ prediction: '', observations: [], blocked: false });
export function normalizeLightTrial(raw) {
  // Only saves from before this activity use null; do not invent observations for them.
  if (raw === null) return null;
  const trial = freshLightTrial();
  if (!Object.hasOwn(lightPredictions, raw?.prediction)) return trial;
  trial.prediction = raw.prediction;
  if (Array.isArray(raw?.observations) && raw.observations.includes('covered')) {
    trial.observations.push('covered');
    if (raw.observations.includes('uncovered')) trial.observations.push('uncovered');
  }
  trial.blocked = trial.observations.length > 0 && raw.blocked === true;
  return trial;
}
export const lightTrialReady = trial => trial === null || !!trial?.prediction &&
  trial.observations.includes('covered') && trial.observations.includes('uncovered');
export function predictLight(trial, prediction) {
  if (!trial || trial.observations.length || !Object.hasOwn(lightPredictions, prediction)) return false;
  trial.prediction = prediction;
  return true;
}
export function observeLight(trial, blocked) {
  if (!trial?.prediction) return false;
  trial.blocked = blocked;
  const observation = blocked ? 'covered' : 'uncovered';
  if ((blocked || trial.observations.includes('covered')) && !trial.observations.includes(observation)) trial.observations.push(observation);
  return true;
}
