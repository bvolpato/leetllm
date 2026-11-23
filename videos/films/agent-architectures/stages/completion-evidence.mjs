import { cueAmount, cueDone } from '../defaults.mjs';

const reads = ['CI', 'Migration', 'Replay'];

function run(ctx, api, y, release, outcomes, answer, limit) {
  const { C } = api;
  api.text(ctx, release, 145, y + 16, 42, C.ink, 'left', 'mono');
  outcomes.forEach((outcome, i) => {
    const x = 470 + 325 * i;
    if (i < outcomes.length - 1) api.line(ctx, x + 25, y, x + 297, y, C.muted, 3);
    api.circle(ctx, x, y, 24, C.bg, outcome ? C.cyan : C.muted, 5);
    if (outcome) api.circle(ctx, x, y, 11, C.cyan);
    api.text(ctx, reads[i], x, y - 65, 34, C.ink, 'center');
    if (outcome) api.text(ctx, outcome, x, y + 84, 29, C.cyan, 'center');
  });
  if (answer) {
    api.arrow(ctx, 470 + 325 * (outcomes.length - 1) + 48, y, 1410, y, C.green, 4);
    api.text(ctx, answer, 1460, y + 14, 34, C.green);
  }
  if (limit) {
    api.line(ctx, 962, y - 90, 962, y + 110, C.pink, 5);
    api.text(ctx, '2-turn limit', 960, y + 176, 31, C.pink, 'center');
  }
}

export function drawCompletionEvidence(ctx, scene, state, api) {
  const { C } = api;
  const forged = state.beat === 2 || state.beat === 3;
  if (forged) {
    api.focus.target('claim', () => {
      api.text(ctx, 'First-turn answer   /   “Schema bug”', 145, 313, 46, C.ink);
      api.text(ctx, 'Cited in answer', 150, 489, 36, C.muted);
      if (cueAmount(state, 'invest-cites') > 0)
        reads.forEach((s, i) => api.text(ctx, s, 755 + i * 380, 489, 43, C.blue, 'center'));
    });
    api.focus.target('observed', () => {
      api.text(ctx, 'Observed by host', 150, 683, 36, C.muted);
      reads.forEach((s, i) => {
        const x = 755 + i * 380;
        api.rect(ctx, x - 132, 608, 264, 107, C.bg, C.muted, 9);
        api.text(ctx, 'empty', x, 674, 36, C.muted, 'center');
      });
      const rejected = cueDone(state, 'invest-reject');
      api.text(
        ctx,
        rejected
          ? 'Answer rejected   /   0 of 3 required reads'
          : 'Can the host accept this answer?',
        960,
        930,
        44,
        rejected ? C.pink : C.yellow,
        'center',
      );
    });
    return;
  }
  const turns = state.beat === 4;
  const limited = turns && cueDone(state, 'invest-limit');
  api.text(
    ctx,
    turns ? 'Decision turns on R1842' : 'Read-only investigation   /   two releases',
    145,
    287,
    37,
    C.muted,
  );
  const facts = [
    cueDone(state, 'invest-fact') && 'Migration failed',
    cueDone(state, 'invest-file') && 'Unguarded add',
    cueDone(state, 'invest-replay') && !limited && 'Duplicate column',
  ];
  const aAnswer = turns
    ? !limited && cueDone(state, 'invest-fourth')
    : cueDone(state, 'invest-schema');
  api.focus.target('run-a', () => {
    run(ctx, api, 500, 'R1842', facts, aAnswer ? 'Schema bug' : '', limited);
    if (turns)
      api.text(
        ctx,
        limited
          ? cueDone(state, 'invest-stop')
            ? 'Allowance exhausted before replay'
            : 'Budget   /   two turns'
          : aAnswer
            ? '3 reads + 1 answer = 4 decision turns'
            : 'One decision per turn',
        960,
        883,
        38,
        limited ? C.pink : C.ink,
        'center',
      );
  });
  if (!turns && state.beat > 0)
    api.focus.target('run-b', () => {
      run(
        ctx,
        api,
        815,
        'R1843',
        [cueDone(state, 'invest-runner') && 'Runner unavailable'],
        cueDone(state, 'invest-outage') ? 'Runner outage' : '',
        false,
      );
    });
}
export default {
  id: 'completion-evidence',
  draw: drawCompletionEvidence,
  cues: [
    'invest-ci',
    'invest-fact',
    'invest-file',
    'invest-replay',
    'invest-schema',
    'invest-runner',
    'invest-outage',
    'invest-cites',
    'invest-question',
    'invest-reject',
    'invest-three',
    'invest-fourth',
    'invest-limit',
    'invest-stop',
  ],
};
