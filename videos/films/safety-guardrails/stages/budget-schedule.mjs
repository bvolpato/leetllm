import { guardCue, safetyBudget } from '../model.mjs';

const localCheck = 15,
  redact = 6,
  remote = 11;
const finish = Math.max(localCheck, redact + remote);

export function paintBudgetSchedule(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    const budget = safetyBudget();
    const segments = budget.stages.filter((s) => s.required);
    const colors = [C.blue, C.cyan, C.yellow, C.green];
    const total = budget.responseTotal;
    let x = 145;
    text(ctx, 'Example text-response budget', 145, 327, 42, C.ink);
    api.focus.target('budget-sum', () => {
      segments.forEach((s, i) => {
        const w = (1620 * s.ms) / total;
        rect(ctx, x, 415, w - 2, 116, colors[i], undefined, 0);
        x += w;
        const lx = [145, 500, 1010, 1510][i];
        text(ctx, s.name, lx, 664, 30, colors[i]);
        text(ctx, s.ms.toLocaleString('en-US') + ' ms', lx, 735, 44, C.ink);
      });
      const totalDone = guardCue(state, 'budget-schedule-sum', 0) === 1;
      text(
        ctx,
        totalDone ? total.toLocaleString('en-US') + ' ms allocated' : 'Total allocation',
        1760,
        338,
        38,
        C.ink,
        'right',
      );
    });
    api.focus.target('budget-scope', () =>
      text(ctx, 'Measure end-to-end p95 on complete requests.', 960, 930, 35, C.muted, 'center'),
    );
    return;
  }

  const x = (ms) => 445 + ms * 62;
  const rows = [
    ['Local input check', 0, localCheck, C.blue],
    ['Local redaction', 0, redact, C.cyan],
    ['Remote review', redact, redact + remote, C.green],
  ];
  const approved = guardCue(state, 'budget-redacted', 2, 0.03, 0.36);
  const localDone = guardCue(state, 'budget-local-done', 2, 0.38, 0.62);
  const reviewed = guardCue(state, 'budget-answer', 2, 0.68, 0.90);
  const elapsed = redact * approved + (localCheck - redact) * localDone + (finish - localCheck) * reviewed;
  text(ctx, 'Input checks for INC-2048', 125, 270, 42, C.ink);
  text(ctx, 'Example durations in milliseconds', 1770, 270, 30, C.muted, 'right');
  for (const ms of [0, 5, 10, 15, 20]) {
    line(ctx, x(ms), 368, x(ms), 385, C.muted, 3);
    text(ctx, String(ms), x(ms), 352, 35, C.muted, 'center');
  }
  rows.forEach(([label, start, end, color], i) => {
    const y = 420 + 136 * i;
    api.focus.target(i === 2 ? 'remote-lane' : 'local-lanes', () => {
      text(ctx, label, 125, y + 50, 32, C.ink);
      const waiting = i === 2 && approved < 1;
      const left = waiting ? x(0) : x(start);
      const width = x(end) - x(start);
      if (waiting) {
        text(
          ctx,
          'Needs the redacted copy   ·   ' + remote + ' ms of work',
          left,
          y + 50,
          35,
          C.yellow,
        );
        return;
      }
      rect(ctx, left, y, width, 64, C.panel, color, 4);
      const worked = Math.max(0, Math.min(end, elapsed) - start);
      if (worked > 0) rect(ctx, left, y, worked * 62, 64, color, undefined, 4);
      text(ctx, String(end - start) + ' ms', x(end) + 25, y + 49, 32, color);
    });
  });
  api.focus.target('budget-clock', () => {
    const answer = guardCue(state, 'budget-answer', 2) === 1;
    text(
      ctx,
      answer
        ? 'All checks complete at max(' + localCheck + ', ' + redact + ' + ' + remote + ') = ' + finish + ' ms'
        : beat === 1
          ? 'When can remote review start? When are all three checks done?'
          : 'Elapsed: ' + Math.round(elapsed) + ' ms',
      960,
      943,
      37,
      answer ? C.green : C.ink,
      'center',
    );
  });
}
export { paintBudgetSchedule as drawBudgetSchedule };
export default {
  id: 'budget-schedule',
  draw: paintBudgetSchedule,
  cues: [
    'budget-schedule-sum',
    'budget-schedule-scope',
    'budget-local',
    'budget-remote',
    'budget-predict',
    'budget-redacted',
    'budget-local-done',
    'budget-answer',
  ],
};
