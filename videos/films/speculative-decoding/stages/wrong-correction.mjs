import { correctionCounterexample } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';
import { massLedger } from '../mass-ledger.mjs';

export function drawWrongCorrection(ctx, scene, state, api) {
  const { C } = api;
  const f = correctionCounterexample();
  const wrong = movement(state, 1, 'wrong-allocation', 0.02, 0.18);
  const repair = movement(state, 2, 'repair-flow', 0.32, 0.59);
  const added = f.wrongExtra.map((amount, i) => wrong * amount * (1 - repair) + f.deficit[i] * repair);
  const fixed = heard(state, 2, 'repair-flow', 0.59);
  const redrawn = heard(state, 1, 'wrong-allocation', 0.18);
  const settled = fixed || (redrawn && repair === 0);
  const words = ['noon', 'dawn', 'dusk'];
  api.focus.target('train-ledger', () => {
    massLedger(ctx, api, {
      words, target: f.p, overlap: f.overlap, loose: [0, 0, 0], added, settled,
      legend: fixed ? 'Replacement from the missing share' : 'Replacement by drawing from the whole target',
      emphasis: fixed ? 1 : 0,
    });
    let formula = 'Rejection probability ' + f.z.toFixed(2) + '     ·     Will noon stay at 40%?';
    if (redrawn) formula = 'noon     0.40 accepted + 0.20 × 0.40 from rejection = 0.48';
    if (repair > 0) formula = fixed
      ? 'dawn     0.30 accepted + 0.20 × 1.00 from rejection = 0.50'
      : 'Keep the accepted shares in place';
    api.text(ctx, formula, 960, 980, 37, fixed ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'wrong-correction', draw: drawWrongCorrection,
  cues: ['train-overlap', 'redraw-question', 'wrong-allocation', 'wrong-dawn',
    'repair-rule', 'repair-flow', 'repair-result'],
};
