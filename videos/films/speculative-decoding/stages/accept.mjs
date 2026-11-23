import { decomposition } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';
import { P, Q } from '../fixtures.mjs';
import { acceptanceTestSnapshot } from '../model.mjs';

export function drawAccept(ctx, scene, state, api) {
  const { C } = api;
  const dog = 1;
  const first = acceptanceTestSnapshot(2, 1, 0.2);
  const replay = acceptanceTestSnapshot(2, 1, 0.8);
  const cutoff = heard(state, 1, 'acceptance-ratio', 0.36);
  const firstDraw = movement(state, 2, 'first-draw', 0.10, 0.28);
  const change = movement(state, 2, 'second-draw', 0.55, 0.79);
  const verdict = heard(state, 3, 'second-result', 0.12);
  const left = 195, width = 1530;
  api.focus.target('dog-shares', () => {
    api.text(ctx, 'dog', left, 351, 70, C.ink);
    [[Q[dog], 'Draft', C.cyan], [P[dog], 'Target', C.blue]].forEach(([value, label, color], row) => {
      const y = 266 + row * 98;
      api.text(ctx, label, 495, y + 40, 35, color);
      const units = Math.round(value * 10);
      for (let i = 0; i < units; i++)
        api.rect(ctx, 650 + i * 100, y, 86, 54, color, undefined, 4);
      api.text(ctx, value.toFixed(2), 1200, y + 43, 43, C.ink);
    });
    if (heard(state, 1, 'cap-one', 0.82))
      api.text(ctx, 'α = min(1, p / q)', 1730, 497, 35, C.muted, 'right');
    if (heard(state, 3, 'accepted-share', 0.75))
      api.text(ctx, '0.50 × 0.60 = ' + decomposition().overlap[dog].toFixed(2), 660, 516, 35, C.cyan);
  });
  api.focus.target('draw-ruler', () => {
    const xAt = (amount) => left + width * amount;
    const y = 748;
    api.text(ctx, 'Acceptance draw', left, 639, 37, C.ink);
    api.rect(ctx, left, y, width, 35, C.panel, C.muted, 2);
    if (cutoff) {
      api.rect(ctx, left, y, first.alpha * width, 35, C.cyan, undefined, 2);
      const x = xAt(first.alpha);
      api.line(ctx, x, y - 28, x, y + 44, C.blue, 4);
      api.text(ctx, 'Keep below ' + first.alpha.toFixed(2), x, y - 58, 36, C.blue, 'center');
    }
    for (let i = 0; i <= 10; i++) {
      const x = xAt(i / 10);
      api.line(ctx, x, y + 39, x, y + 55, C.muted, 2);
      if (i % 2 === 0) api.text(ctx, (i / 10).toFixed(1), x, y + 108, 34, C.muted, 'center');
    }
    if (firstDraw > 0) {
      const value = first.u + (replay.u - first.u) * change;
      const x = xAt(value);
      api.circle(ctx, x, y + 17, 14, C.yellow, C.bg, 3);
      api.line(ctx, x, y - 8, x, y - 32, C.yellow, 4);
      const label = change === 0 ? 'Draw ' + first.u.toFixed(2)
        : change >= 1 ? 'Draw ' + replay.u.toFixed(2) : '';
      if (label) api.text(ctx, label, x, y - 58, 36, C.yellow, 'center');
    }
    let readout = 'What fraction of dog proposals should pass?';
    if (cutoff) readout = '0.30 ÷ 0.50 = ' + first.alpha.toFixed(2);
    if (heard(state, 2, 'first-result', 0.42) && change === 0) readout = first.accepted ? 'Keep dog' : 'Reject dog';
    if (change > 0) readout = 'Does this dog pass?';
    if (verdict) readout = replay.accepted ? 'Keep dog' : 'Reject dog';
    api.text(ctx, readout, 960, 989, 45, verdict ? C.pink : C.ink, 'center');
  });
}
export default {
  id: 'accept', draw: drawAccept,
  cues: ['dog-inputs', 'dog-question', 'acceptance-ratio', 'cap-one', 'first-draw',
    'first-result', 'second-draw', 'draw-question', 'second-result', 'accepted-share'],
};
