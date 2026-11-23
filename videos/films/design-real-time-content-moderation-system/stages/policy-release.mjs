import { exampleTexts } from '../fixtures.mjs';
import { exampleDecision } from '../model.mjs';

const cases = [...exampleTexts, 'weekly study group notes'].map((body, i) => ({
  body,
  expected: i === 0 ? 'BLOCK' : 'ALLOW',
}));
export function drawPolicyRelease(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const live = state.beat > 0 || focus.progress('release-specific') === 1;
  const candidate = state.beat > 0 || focus.progress('release-broad') === 1;
  focus.target('release-records', () => {
    label('Regression case', 140, 310, 34, C.muted);
    label('Expected', 920, 310, 34, C.muted);
    label('v43 · phrase', 1210, 310, 34, C.blue);
    label('Draft · word', 1520, 310, 34, C.yellow);
    cases.forEach(({ body, expected }, i) => {
      const y = 420 + 135 * i;
      label(body, 140, y, 35);
      label(expected, 920, y, 34);
      api.line(ctx, 140, y + 40, 1780, y + 40, C.muted, 1);
      for (const [broad, x, ready] of [
        [false, 1210, live],
        [true, 1520, candidate],
      ]) {
        const action = exampleDecision(body, broad);
        label(ready ? action : '…', x, y, 36, ready && action !== expected ? C.pink : C.ink);
      }
    });
  });
  focus.target('release-switch', () => {
    const failures = cases.filter(({ body, expected }) => exampleDecision(body, true) !== expected);
    api.rect(ctx, 140, 812, 1640, 130, C.panel, candidate && failures.length ? C.pink : C.blue, 10);
    label('Active   v43', 180, 897, 43, C.blue);
    const message =
      candidate && failures.length
        ? 'Draft on hold   /   ' + failures.length + ' failed case'
        : 'Evaluating the draft';
    label(message, 911, 897, 41, candidate && failures.length ? C.pink : C.ink);
  });
}
export default {
  id: 'policy-release',
  draw: drawPolicyRelease,
  cues: [
    'release-specific',
    'release-broad',
    'release-three',
    'release-gates',
    'release-slices',
    'release-local',
  ],
};
