import { text } from '../defaults.mjs';
import { oneTrainingStep } from '../model.mjs';
import { signed } from '../route-ruler.mjs';
import { finished } from '../scene-clock.mjs';

const clean = oneTrainingStep();

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const replay = state.beat === 1;
  const updated = finished(state, 'transfer-subtract', 0, 0.85);
  api.focus.target('transfer-column', () => {
    text(ctx, api, 'Urgency weight   ·   same two training tickets', 170, 287, 44, C.ink);
    const xs = [675, 1100, 1530];
    const labels = ['Before backward', 'After backward', 'After SGD'];
    labels.forEach((label, j) => text(ctx, api, label, xs[j], 424, 31, C.muted, 'center'));
    const columns = ['.grad', '.grad', 'weight'];
    for (const [i, route] of ['Standard', 'Escalate'].entries()) {
      const y = 580 + i * 186;
      text(ctx, api, route, 185, y, 45, i ? C.green : C.blue);
      api.line(ctx, 180, y + 54, 1740, y + 54, C.muted, 2);
      const values = replay
        ? ['?', '?', '?']
        : ['empty', signed(clean.gradient[i][0]), updated ? signed(clean.updated[i][0]) : '·'];
      values.forEach((v, j) =>
        text(ctx, api, v, xs[j], y, 52, j === 2 ? C.green : C.yellow, 'center'),
      );
    }
    columns.forEach((column, j) => text(ctx, api, column, xs[j], 873, 30, C.muted, 'center'));
    text(
      ctx,
      api,
      replay
        ? 'Fresh contribution = buffer after backward − buffer before backward'
        : 'One step from zero weights   ·   learning rate 0.2',
      960,
      982,
      37,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['transfer-read', 'transfer-subtract', 'transfer-inspect'],
};
