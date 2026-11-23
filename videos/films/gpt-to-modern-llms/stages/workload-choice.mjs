import { phraseEnded, phraseProgress } from '../arithmetic.mjs';
import { checkReply, chooseRun, largerWorker, live, overnight, runs } from '../workload.mjs';
import { referenceLabel } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

export function drawWorkloadChoice(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  if (b < 2) {
    const reveal = b === 1 && phraseEnded(state, 'wrong-category', 0.3);
    text(ctx, api, 'Review note', 230, 300, 35, C.muted);
    text(ctx, api, '“Stale guide”', 230, 415, 68);
    text(ctx, api, 'Trusted label', 230, 560, 33, C.muted);
    text(ctx, api, referenceLabel, 230, 655, 75, C.blue);
    text(ctx, api, 'Complete reply', 1020, 560, 33, C.muted);
    api.focus.target('test-reply', () => text(ctx, api, 'Bug', 1020, 655, 75, C.yellow));
    const result = checkReply('Bug');
    text(ctx, api, result.allowed ? 'Format passes' : 'Format fails', 1020, 763, 43, C.ink);
    api.focus.target('verified-count', () =>
      text(
        ctx,
        api,
        reveal
          ? 'Verified successes   + ' + Number(result.correct && result.allowed)
          : 'Verified successes   + ?',
        960,
        940,
        54,
        reveal ? C.pink : C.yellow,
        'center',
      ),
    );
    return;
  }

  const extended = b === 4 ? phraseProgress(state, 'extend-deadline', 0.14, 0.49) : Number(b > 4);
  const expanded = b === 6 ? phraseProgress(state, 'larger-worker', 0.14, 0.49) : Number(b > 6);
  const limits = {
    p95: Math.round(live.p95 + (overnight.p95 - live.p95) * extended),
    gb: live.gb + (largerWorker.gb - live.gb) * expanded,
  };
  const resultCue = { 3: 'live-result', 5: 'night-result', 7: 'final-result' }[b];
  const reveal = resultCue && phraseEnded(state, resultCue, 0.35);
  text(
    ctx,
    api,
    'Same 100 held-out notes  ·  invented measurements  ·  both licenses permit use',
    960,
    267,
    32,
    C.muted,
    'center',
  );
  text(ctx, api, 'Verified', 425, 397, 36, C.ink, 'center');
  const axes = [
    {
      x: 685,
      max: 1600,
      limit: limits.p95,
      unit: 'ms',
      name: 'Complete-response p95',
      field: 'p95',
      id: 'deadline',
    },
    {
      x: 1250,
      max: 20,
      limit: limits.gb,
      unit: 'GB',
      name: 'Total memory',
      field: 'gb',
      id: 'memory-cap',
    },
  ];
  for (const axis of axes) {
    const { x, max, limit, unit, name, field, id } = axis;
    const width = 420;
    text(ctx, api, name, x + width / 2, 397, 36, C.ink, 'center');
    runs.forEach((run, i) => {
      const y = 555 + i * 170;
      const end = x + (width * run[field]) / max;
      api.rect(ctx, x, y, end - x, 30, i ? C.cyan : C.blue, null, 2);
      text(ctx, api, run[field] + ' ' + unit, x, y - 17, 36, C.ink);
    });
    api.focus.target(id, () => {
      const at = x + (width * limit) / max;
      api.line(ctx, at, 483, at, 789, C.yellow, 4);
      text(ctx, api, '≤ ' + Number(limit.toFixed(1)) + ' ' + unit, at, 465, 30, C.yellow, 'center');
    });
  }
  runs.forEach((run, i) => {
    const y = 580 + i * 170;
    text(ctx, api, run.id, 192, y, 70, i ? C.cyan : C.blue);
    text(ctx, api, run.verified + ' / 100', 425, y, 51, C.ink, 'center');
  });
  const policy = b <= 3 ? 'Live' : b <= 5 ? 'Nightly' : 'Nightly · larger worker';
  api.focus.target('decision', () =>
    text(
      ctx,
      api,
      policy + '     /     ' + (reveal ? 'Choose ' + chooseRun(limits).id : 'Choose a run'),
      960,
      933,
      53,
      reveal ? C.green : C.ink,
      'center',
    ),
  );
}
export default {
  id: 'workload-choice',
  draw: drawWorkloadChoice,
  cues: [
    'valid-field',
    'wrong-category',
    'live-test',
    'live-result',
    'extend-deadline',
    'night-result',
    'larger-worker',
    'final-result',
  ],
};
