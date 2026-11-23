import { softPreferenceStep } from '../arithmetic.mjs';
import { voice } from '../construction.mjs';

export function drawReward(ctx, scene, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const update = softPreferenceStep();
  if (state.beat === 3) {
    t('Reward model    /    fixed scores for this example', 135, 292, 38, C.muted);
    const arrive = voice(state, 'reward-fresh', 3);
    api.focus.target('policy-samples', () => {
      ['A', 'B', 'A'].forEach((id, i) => {
        const y = 451 + i * 143;
        t('Sample ' + (i + 1), 135, y, 39, C.muted);
        t('Answer ' + id, 545, y, 48, id === 'A' ? C.green : C.pink);
        if (i < Math.ceil(3 * arrive))
          t('Score    ' + (id === 'A' ? update.margin : 0).toFixed(2), 1150, y, 48, C.yellow);
      });
    });
    api.focus.target('reference-penalty', () =>
      t(
        'Policy objective    =    expected score  −  reference drift penalty',
        135,
        966,
        39,
        C.cyan,
      ),
    );
    return;
  }

  const target = voice(state, 'reward-target', 1) > 0;
  const grad = voice(state, 'reward-gradient', 2) > 0;
  const step = voice(state, 'reward-step', 2);
  const margin = update.margin * step;
  const p = 1 / (1 + Math.exp(-margin));
  const xAt = (value) => 210 + 1460 * value;

  t('Reward model’s probability that A wins', 135, 295, 47);
  api.focus.target('probability-scale', () => {
    api.line(ctx, xAt(0), 519, xAt(1), 519, C.muted, 4);
    for (const v of [0, 0.5, 1]) {
      api.line(ctx, xAt(v), 534, xAt(v), 550, C.muted, 2);
      t(v.toFixed(1), xAt(v), 602, 32, C.muted, 'center');
    }
    api.circle(ctx, xAt(p), 519, 18, C.cyan);
    t('Prediction  ' + p.toFixed(3), xAt(p), 464, 41, C.cyan, 'center');
  });
  api.focus.target('soft-target', () => {
    if (!target) return;
    const x = xAt(update.target);
    api.line(ctx, x, 459, x, 547, C.yellow, 5);
    t('Judge  ' + update.target.toFixed(2), x, 410, 38, C.yellow, 'center');
  });
  api.focus.target('margin-gradient', () => {
    t('Derivative  =  prediction − target', 135, 751, 36, C.muted);
    if (grad)
      t('0.50 − 0.80 = ' + update.gradient.toFixed(2).replace('-', '−'), 135, 849, 51, C.yellow);
  });
  api.focus.target('margin-step', () => {
    t('Margin   /   score A − score B', 982, 751, 36, C.muted);
    t(
      target && state.beat === 1 ? 'Rise or fall from zero?' : margin.toFixed(2),
      982,
      849,
      target && state.beat === 1 ? 48 : 66,
      C.green,
    );
    if (step > 0) t('0 − 0.50 × (−0.30)', 982, 928, 37);
  });
}
export default {
  id: 'reward',
  draw: drawReward,
  cues: [
    'reward-even',
    'reward-target',
    'reward-question',
    'reward-gradient',
    'reward-step',
    'reward-result',
    'reward-fresh',
    'reward-reference',
  ],
};
