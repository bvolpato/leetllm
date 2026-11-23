import { transformedLaw } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';
import { wordOdds } from '../word-odds.mjs';

export function drawServingLaws(ctx, scene, state, api) {
  const { C } = api;
  const f = transformedLaw();
  const drop = movement(state, 0, 'drop-dusk', 0.16, 0.27);
  const normalized = heard(state, 0, 'sd-target-law', 0.81);
  const weights = [f.raw[0], f.raw[1], f.raw[2] * (1 - drop)];
  const label = (s, x, y, size, color, align = 'left') => api.text(ctx, s, x, y, size, color, align);
  api.focus.target('sd-serving-laws-mechanism', () => {
    label(normalized ? 'Target after top-2 filtering' : 'Target before normalization',
      145, 280, 43, C.blue);
    wordOdds(ctx, api, {words: ['noon', 'dawn', 'dusk'], p: normalized ? f.target : weights,
      q: f.proposal, y: 437, digits: 3, targetLabel: normalized ? 'Target' : 'Weight'});
    let note = 'The draft samples from all three words';
    if (drop >= 1) note = 'Target weights left: 0.55 + 0.30 = ' + f.retained.toFixed(2);
    if (normalized) note = 'Normalized target: noon 11/17     dawn 6/17     dusk 0';
    label(note, 960, 757, 36, C.ink, 'center');
    if ((state.beat ?? 0) === 1) {
      const result = (i, key) => {
        const raw = Math.min(1, f.raw[i] / f.proposal[i]);
        const verdict = heard(state, 1, key, i === 1 ? 0.38 : 0.77);
        return 'raw ' + raw.toFixed(3) + '  →  served ' + (verdict ? f.acceptance[i].toFixed(3) : '?');
      };
      label('Dawn acceptance', 160, 878, 31, C.blue);
      label(result(1, 'sd-policy-one'), 160, 960, 42, C.ink);
      label('Dusk acceptance', 1000, 878, 31, C.blue);
      label(result(2, 'sd-policy-zero'), 1000, 960, 42, C.ink);
    }
  });
}
export default {
  id: 'serving-laws', draw: drawServingLaws,
  cues: ['sd-serving-laws-b0', 'drop-dusk', 'sd-target-law', 'sd-serving-laws-b1', 'sd-policy-one', 'sd-policy-zero'],
};
