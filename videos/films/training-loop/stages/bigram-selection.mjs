import { text } from '../defaults.mjs';
import { LOOP_BIGRAM } from '../model.mjs';
import { finished, progressDuring } from '../scene-clock.mjs';

export function drawBigramSelection(ctx, scene, state, api) {
  const { C, teaching } = api;
  const best = LOOP_BIGRAM.history[LOOP_BIGRAM.bestStep];
  const last = LOOP_BIGRAM.history.at(-1);
  const early = progressDuring(state, 'bigram-early', 0, 0.51, 0.65);
  const late = progressDuring(state, 'bigram-late', 0, 0.78, 0.97);
  const current = Math.round(best.step * early + (last.step - best.step) * late);
  const picked = finished(state, 'bigram-pick', 2, 0.12);
  api.focus.target('bigram-chart', () => {
    text(ctx, api, 'Mean loss   ·   nats per character pair', 205, 264, 34, C.ink);
    const plot = teaching.axes({
      x: 205,
      y: 325,
      width: 1080,
      height: 500,
      xDomain: [0, last.step],
      yDomain: [0.9, 3.15],
      xTicks: [0, 500, 1000],
      yTicks: [1, 2, 3],
      fontSize: 28,
      color: C.muted,
    });
    const visible = LOOP_BIGRAM.history.slice(0, current + 1);
    for (const [key, color] of [
      ['train', C.cyan],
      ['validation', C.pink],
    ]) {
      if (visible.length > 1)
        teaching.curve({
          plot,
          points: visible.map((row) => ({ x: row.step, y: row[key] })),
          color,
          width: 5,
        });
      const tip = plot.point(current, visible.at(-1)[key]);
      api.circle(ctx, tip.x, tip.y, 7, color);
    }
    for (const row of [best, last]) {
      if (current < row.step) continue;
      const point = plot.point(row.step, row.validation);
      api.circle(ctx, point.x, point.y, 11, picked && row === best ? C.yellow : C.pink, C.bg, 2);
    }
    text(ctx, api, 'Optimizer update', 747, 914, 32, C.muted, 'center');
  });
  api.focus.target('bigram-choice', () => {
    text(ctx, api, 'Validation', 1440, 364, 40, C.pink);
    for (const [i, row] of [best, last].entries()) {
      const y = 452 + 150 * i;
      const color = picked && row === best ? C.yellow : C.ink;
      text(ctx, api, 'Update ' + row.step, 1440, y, 31, C.muted);
      text(
        ctx,
        api,
        current >= row.step ? row.validation.toFixed(3) : '·',
        1440,
        y + 66,
        57,
        color,
      );
    }
    text(ctx, api, 'Training', 1440, 808, 32, C.cyan);
    text(
      ctx,
      api,
      LOOP_BIGRAM.history[current].train.toFixed(3) + ' at ' + current,
      1440,
      858,
      30,
      C.ink,
    );
    const unseen = finished(state, 'bigram-unseen', 2, 0.79);
    const label =
      state.beat === 3
        ? 'Sample from update 111    “theac. ure se leusthe thesd …”'
        : unseen
          ? LOOP_BIGRAM.unseen +
            ' of ' +
            LOOP_BIGRAM.validationPairs +
            ' held-out pairs never appeared in training'
          : picked
            ? 'Copy the character table at update ' + best.step
            : state.beat === 1
              ? 'Which update do you copy for the held-out text?'
              : 'Same training text and validation text at every update';
    text(ctx, api, label, 960, 1010, 35, picked ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'bigram-selection',
  draw: drawBigramSelection,
  cues: [
    'bigram-early',
    'bigram-late',
    'bigram-compare',
    'bigram-pick',
    'bigram-unseen',
    'bigram-sample',
  ],
};
