import { cue } from '../arithmetic.mjs';
import { eventOrder } from '../model.mjs';

const deploy = [105, 135];
const wide = [90, 270];
const verified = [170, 190];

export function drawEvidenceTime(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  const at = (id, i, from, to) => cue(state, id, i, from, to);
  const x = (s) => 340 + (s - 60) * 6.25;
  const change = at('clock-verified', 2, 0.05, 0.35);
  const rise = wide.map((n, i) => n + change * (verified[i] - n));
  const sample1 = at('clock-first-placement', 1, 0.14, 0.43);
  const sample2 = at('clock-other-placement', 1, 0.48, 0.74);
  api.focus.target('clock-evidence', () => {
    api.text(ctx, 'C17   /   inclusive seconds after 14:00 UTC', 128, 270, 36, C.ink);
    const interval = (label, bounds, row, color) => {
      api.text(ctx, label, 130, row + 14, 36, color);
      api.line(ctx, x(bounds[0]), row, x(bounds[1]), row, color, 18);
      for (const v of bounds) {
        api.circle(ctx, x(v), row, 12, color, C.panel, 2);
        api.text(ctx, String(Math.round(v)), x(v), row - 38, 34, color, 'center');
      }
    };
    interval('Deploy', deploy, 448, C.yellow);
    interval('Chart rise', rise, 666, C.blue);
    api.line(ctx, x(60), 790, x(290), 790, C.muted, 2);
    for (const second of [60, 90, 120, 150, 180, 210, 240, 270]) {
      api.line(ctx, x(second), 790, x(second), 802, C.muted, 2);
      api.text(ctx, String(second), x(second), 846, 27, C.muted, 'center');
    }
    if (beat === 1) {
      const dot = (s, y, label, col) => {
        api.circle(ctx, x(s), y, 14, C.panel, col, 5);
        api.text(ctx, label, x(s), y + 66, 30, C.ink, 'center');
      };
      dot(120, 448, '120', C.yellow);
      if (sample1 > 0) dot(100, 666, '100', C.blue);
      if (sample2 > 0) dot(180, 666, '180', C.blue);
    }
    const order = eventOrder(deploy, rise);
    const gap = verified[0] - deploy[1];
    if (change === 1 && beat >= 2) {
      const y = 554;
      api.line(ctx, x(deploy[1]), y, x(verified[0]), y, C.green, 4);
      for (const end of [deploy[1], verified[0]])
        api.line(ctx, x(end), y - 12, x(end), y + 12, C.green, 3);
      api.text(ctx, `${gap} s`, (x(deploy[1]) + x(verified[0])) / 2, y - 17, 32, C.green, 'center');
    }
    let message = 'Could the rise have happened before the deploy?';
    if (beat === 1)
      message =
        sample2 === 1
          ? 'Both placements fit. Order unresolved.'
          : 'Possible times for the same observations';
    if (beat === 2)
      message =
        change === 1 && order === 'after'
          ? 'Latest deploy 135  <  earliest rise 170'
          : 'Verified chart reading on the same clock';
    if (beat >= 3) message = '14:22   “That started before the rollback.”';
    api.text(ctx, message, 960, 960, 43, beat === 2 ? C.green : C.ink, 'center');
  });
}
export default {
  id: 'evidence-time',
  draw: drawEvidenceTime,
  cues: [
    'clock-wide',
    'clock-first-placement',
    'clock-other-placement',
    'clock-verified',
    'clock-utterance',
  ],
};
