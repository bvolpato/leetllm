import { spoken } from '../construction.mjs';
import { SFT_CHECKPOINTS } from '../fixtures.mjs';
import { sftCheckpointGate } from '../model.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('selection-rows', () => {
    const { C } = api;
    const stricter = spoken(state, 'raise-floor', 2, 0.33);
    const floor = stricter ? 1 : 0.98;
    const showWinner = stricter
      ? spoken(state, 'selection-alternate', 3, 0.25)
      : state.beat < 2 && spoken(state, 'selection-winner', 1, 0.2);
    const winner = sftCheckpointGate(SFT_CHECKPOINTS, floor);
    const xs = [325, 720, 1140, 1560];
    text(
      ctx,
      api,
      'Format must pass on at least ' + Math.round(floor * 100) + '% of validation cases',
      960,
      306,
      44,
      C.yellow,
      'center',
    );
    ['Step', 'Format pass', 'Policy pass', 'Reference loss'].forEach((v, i) =>
      text(ctx, api, v, xs[i], 426, 34, C.muted, 'center'),
    );
    api.line(ctx, 140, 463, 1780, 463, C.muted, 2);
    SFT_CHECKPOINTS.forEach((row, i) => {
      const y = 552 + i * 128;
      const eligible = row.format >= floor;
      const selected = showWinner && row.step === winner?.step;
      const col = selected ? C.green : showWinner && !eligible ? C.muted : C.ink;
      if (selected) api.line(ctx, 162, y - 45, 162, y + 12, C.green, 8);
      [
        row.step,
        Math.round(row.format * 100) + '%',
        Math.round(row.policy * 100) + '%',
        row.loss.toFixed(2),
      ].forEach((v, j) => {
        text(ctx, api, String(v), xs[j], y, 48, col, 'center');
      });
    });
    const verdict = showWinner
      ? 'Select step ' +
        winner.step +
        (stricter ? '  ·  only eligible row' : '  ·  highest eligible policy rate')
      : 'Among eligible rows, which has the highest policy pass rate?';
    text(ctx, api, verdict, 960, 957, 39, showWinner ? C.green : C.ink, 'center');
  });
}

export default {
  id: 'checkpoint-selection',
  draw: draw,
  cues: ['selection-gate', 'selection-winner', 'raise-floor', 'selection-alternate'],
};
