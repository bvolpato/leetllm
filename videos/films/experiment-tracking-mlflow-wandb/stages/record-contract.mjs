import { CASES } from '../fixtures.mjs';
import { evaluate } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawRecordContract(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  if (!state.beat) {
    const checked = evaluate('first repair', [CASES[0], CASES[2]]);
    api.focus.target('record', () => {
      api.text(ctx, 'First repair   /   two-request replay', 135, 278, 45, C.ink);
      const entries = [
        ['Parameter', 'Rule accepts release records'],
        ['Metric', 'Unnecessary abstentions   ' + checked.unnecessary],
        ['Artifact', 'Report with both returned routes'],
        ['Tag', 'Incident   /   request 205'],
      ];
      entries.forEach(([label, value], i) => {
        const y = 418 + i * 129;
        api.text(ctx, label, 135, y, 36, C.cyan);
        api.text(ctx, value, 630, y, 42, C.ink);
      });
    });
    return;
  }
  api.focus.target('parameter', () => {
    api.text(ctx, 'Chosen parameter   /   temperature', 135, 275, 39, C.ink);
    api.text(ctx, 'First value   0.0', 135, 388, 43, C.cyan);
    if (at('conflict') > 0)
      api.text(ctx, 'Log 0.7 in the same run   →   rejected', 740, 388, 40, C.pink);
  });
  api.focus.target('history', () => {
    api.text(ctx, 'Example metric history   /   training loss', 135, 559, 38, C.ink);
    const count = Math.floor(at('append-loss') * 2) + 1;
    [0.8, 0.55, 0.4].slice(0, count).forEach((loss, i) => {
      const x = 135 + i * 498;
      api.text(ctx, 'Step ' + i, x, 665, 32, C.muted);
      api.text(ctx, loss.toFixed(2), x, 756, 57, C.ink);
    });
    api.text(
      ctx,
      'Retain the effective settings, source revision and trial ID.',
      135,
      957,
      36,
      C.muted,
    );
  });
}
export default {
  id: 'record-contract',
  draw: drawRecordContract,
  cues: ['replay-run', 'measure-outcome', 'conflict', 'append-loss'],
};
