import { cueAmount, cueDone } from '../defaults.mjs';

// Observed turns from bounded-react.py. The fixed policy proposes each of its
// three reads in order. Both policies use the same investigate() host.
const cases = {
  R1842: [
    ['CI', 'Migration', 'Replay', 'Answer'],
    ['CI', 'Migration', 'Replay', 'Answer'],
  ],
  R1843: [
    ['CI', 'Migration denied'],
    ['CI', 'Answer'],
  ],
};

export function drawArchitectureEvaluation(ctx, scene, state, api) {
  const { C } = api;
  const outage = cueDone(state, 'eval-outage');
  const release = outage ? 'R1843' : 'R1842';
  const turns = cases[release];
  const finished = cueDone(state, 'eval-count');
  api.focus.target('runs', () => {
    api.text(
      ctx,
      release + (outage ? '   /   runner unavailable' : '   /   migration failure'),
      140,
      268,
      42,
      C.ink,
    );
    api.text(ctx, 'Host budget   /   4 decision turns', 1765, 268, 32, C.muted, 'right');
    if (outage) api.text(ctx, 'Allowed read   /   CI only', 140, 337, 31, C.yellow);
    for (let turn = 0; turn < 4; turn++)
      api.text(ctx, 'Turn ' + (turn + 1), 630 + 350 * turn, 415, 29, C.muted, 'center');
    ['Fixed checklist', 'Early exit'].forEach((policy, i) => {
      const y = 550 + 200 * i;
      api.text(ctx, policy, 140, y + 13, 40, C.ink);
      api.text(ctx, i ? 'Answer on runner outage' : 'CI, migration, replay', 140, y + 70, 28, C.muted);
      const count = outage
        ? Number(cueDone(state, 'eval-first-read')) +
          Number(cueDone(state, i ? 'eval-answer' : 'eval-denied'))
        : Math.ceil(3 * cueAmount(state, 'eval-three')) +
          Number(cueDone(state, 'eval-migration-answer'));
      for (const [j, action] of turns[i].entries()) {
        if (j >= count) break;
        const x = 630 + j * 350;
        const color =
          action === 'Answer' ? C.green : action === 'Migration denied' ? C.pink : C.cyan;
        if (j > 0) api.line(ctx, x - 325, y, x - 25, y, C.muted, 3);
        api.circle(ctx, x, y, 21, C.bg, color, 5);
        if (action === 'Migration denied') {
          api.line(ctx, x - 11, y - 11, x + 11, y + 11, color, 4);
          api.line(ctx, x + 11, y - 11, x - 11, y + 11, color, 4);
        } else api.circle(ctx, x, y, 9, color);
        api.text(ctx, action, x, y + 80, 34, color, 'center');
      }
    });
  });
  api.focus.target('result', () => {
    const label = finished
      ? '1 completed read each   /   only the early exit returned a supported answer'
      : cueAmount(state, 'eval-ask') > 0
        ? 'Both policies have the CI result. Which can finish?'
        : outage
          ? 'The host checks each proposed read.'
          : 'Same tasks, tools and four-turn limit for both policies';
    api.text(ctx, label, 960, 976, 38, finished ? C.ink : C.yellow, 'center');
  });
}
export default {
  id: 'architecture-evaluation',
  draw: drawArchitectureEvaluation,
  cues: [
    'eval-policies',
    'eval-three',
    'eval-migration-answer',
    'eval-outage',
    'eval-first-read',
    'eval-ask',
    'eval-answer',
    'eval-denied',
    'eval-count',
    'eval-matched',
  ],
};
