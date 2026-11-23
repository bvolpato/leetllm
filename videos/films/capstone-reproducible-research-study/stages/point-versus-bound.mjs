import { researchEvent } from '../construction.mjs';
import { drawInterval, ledger, reportedInterval, signed, summary } from '../evidence.mjs';

const worked = summary(ledger);
const [low, high] = reportedInterval.map((value) => 100 * value);

export function drawPointVersusBound(ctx, scene, state, api) {
  const { C } = api;
  const event = (b, s) => researchEvent(scene.id, state, b, s);
  const stronger = state.beat > 0;
  const pass = event(0, 1) === 1;
  const compared = event(1, 1) === 1;
  api.focus.target('rs-point-versus-bound-mechanism', () => {
    api.text(
      ctx,
      'Early success gain   /   90% paired interval in percentage points',
      145,
      268,
      38,
      C.ink,
    );
    const mark = (value) => 220 + ((value + 5) * 1480) / 30;
    api.text(ctx, 'Lower end', mark(low), 470, 36, C.cyan, 'center');
    api.text(ctx, 'Mean', mark(worked.points), 470, 36, C.yellow, 'center');
    api.text(ctx, 'Upper end', mark(high), 470, 36, C.cyan, 'center');
    api.text(ctx, signed(worked.points, 1), mark(worked.points), 615, 43, C.yellow, 'center');
    drawInterval(ctx, api, {
      x: 220,
      y: 650,
      width: 1480,
      domain: [-5, 25],
      ticks: [-5, 0, 5, 10, 15, 20, 25],
      interval: [low, high],
      point: worked.points,
      guide: 10,
    });
    const left = 220 + (1480 * ((stronger ? 10 : 0) + 5)) / 30;
    const right = 220 + (1480 * (low + 5)) / 30;
    api.line(ctx, left, 775, right, 775, C.cyan, 5);
    api.circle(ctx, left, 775, 8, C.ink);
    api.circle(ctx, right, 775, 8, C.cyan);
    const verdict = stronger
      ? compared
        ? 'The interval includes gains below ten points.'
        : 'Does the whole interval clear ten points?'
      : pass
        ? 'Mean ≥ 10 and lower end > 0. The early rule passes.'
        : 'Compare the mean to ten and the lower end to zero.';
    api.text(ctx, verdict, 960, 898, 40, C.ink, 'center');
    if (state.beat >= 2)
      api.text(
        ctx,
        'All 24 pairs retained   /   Resampling arms separately gives a wider interval here.',
        960,
        982,
        29,
        C.muted,
        'center',
      );
  });
}
export default { id: 'point-versus-bound', draw: drawPointVersusBound };
