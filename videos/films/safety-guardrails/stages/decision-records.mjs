import { guardCue, requiredCheck } from '../model.mjs';

const runs = [
  { trace: 'R51', verdict: 'pass', timing: 18, draft: 'Tests passed.' },
  { trace: 'R52', verdict: 'timeout', timing: 50, draft: 'Tests passed.' },
];

export function paintDecisionRecords(ctx, scene, state, api) {
  const { C, text, rect, line } = api;
  const beat = state.beat ?? 0;
  const reveal = (id, b, start, end) => guardCue(state, id, b, start, end);
  text(ctx, 'Private draft', 285, 283, 35, C.muted);
  text(ctx, 'Required output check', 1000, 283, 35, C.muted, 'center');
  text(ctx, 'Chat', 1580, 283, 35, C.ink, 'center');
  runs.forEach((run, i) => {
    if (i === 1 && beat === 0) return;
    const y = 393 + i * 214;
    const resolved = requiredCheck(run.verdict);
    const pass = resolved.release && reveal('record-first', 0, 0.70, 0.81) === 1;
    const timeout = i === 1 && reveal('record-timeout', 1) === 1;
    const progress = pass ? reveal('record-deliver', 0, 0.84, 0.95) : 0;
    const fallback = i === 1 && reveal('record-fallback', 2) === 1;
    const gateX = 1000,
      itemWidth = 320;
    api.focus.target(i === 0 ? 'trace-pass' : 'trace-timeout', () => {
      text(ctx, run.trace, 125, y + 34, 35, C.blue);
      line(ctx, gateX, y - 39, gateX, y - 10, C.muted, 5);
      line(ctx, gateX, y + 77, gateX, y + 106, C.muted, 5);
      if (!pass) line(ctx, gateX, y - 10, gateX, y + 77, timeout ? C.yellow : C.muted, 5);
      const x = 280 + (1415 - 280) * progress;
      rect(ctx, x, y - 11, itemWidth, 85, C.panel, progress === 1 ? C.green : C.blue, 9);
      text(ctx, run.draft, x + itemWidth / 2, y + 44, 36, C.ink, 'center');
      text(
        ctx,
        timeout
          ? 'Timed out at ' + run.timing + ' ms'
          : pass
            ? 'Passed in ' + run.timing + ' ms'
            : 'Review pending',
        gateX,
        y + 157,
        29,
        timeout ? C.yellow : C.muted,
        'center',
      );
      if (fallback) {
        rect(ctx, 1240, y - 11, 545, 85, C.panel, C.green, 9);
        text(ctx, 'Review unavailable. Try again.', 1512, y + 43, 30, C.green, 'center');
      } else if (!pass) text(ctx, 'Awaiting delivery', 1580, y + 44, 30, C.muted, 'center');
    });
  });
  api.focus.target('decision-event', () => {
    const record = reveal('record-save', 3) > 0;
    line(ctx, 125, 825, 1790, 825, C.muted, 2);
    if (record) {
      text(ctx, 'R52    /    policy-7    /    output-review v2', 130, 891, 36, C.cyan);
      text(
        ctx,
        '50 ms    ·    timeout    ·    private draft held    ·    fallback sent',
        130,
        966,
        39,
        C.ink,
      );
    } else {
      text(
        ctx,
        beat === 1 ? 'What should R52 send to the caller?' : 'Same question. Same generated draft.',
        960,
        929,
        39,
        C.ink,
        'center',
      );
    }
  });
}
export const paintDecisionRecordsLegacy = paintDecisionRecords;
export { paintDecisionRecords as drawDecisionRecords };
export default {
  id: 'decision-records',
  draw: paintDecisionRecords,
  cues: [
    'record-first',
    'record-deliver',
    'record-timeout',
    'record-ask',
    'record-fallback',
    'record-save',
  ],
};
