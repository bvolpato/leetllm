import { pages } from '../fixtures.mjs';
import { compareRun, legacyRuns } from '../manual.mjs';
import { inspectFor } from '../model.mjs';

const [clause] = inspectFor('expires');
const job = new Date(legacyRuns.jobs[1] + 'T00:00:00Z');
const month = job.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toUpperCase();
const day = String(job.getUTCDate()).padStart(2, '0');

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const opened =
    focus.progress('reopen-manual', state.beat === 1 ? api.phase(state.beatP, 0, 0.06) : 0) > 0;
  const judged =
    focus.progress('late-job', state.beat === 1 ? api.phase(state.beatP, 0.15, 0.28) : 0) === 1;
  const copied = focus.progress(
    'pass-clause',
    state.beat === 1 ? api.phase(state.beatP, 0.64, 0.86) : 0,
  );
  focus.target('scheduled-job', () => {
    api.rect(ctx, 162, 244, 528, 478, C.ink, undefined, 18);
    api.rect(ctx, 162, 244, 528, 105, C.cyan, undefined, 16);
    for (const x of [228, 624]) {
      api.rect(ctx, x - 11, 218, 22, 55, C.muted, undefined, 10);
    }
    api.text(ctx, month, 426, 318, 40, C.bg, 'center');
    api.text(ctx, day, 426, 568, 202, C.bg, 'center', 'serif');
    api.text(
      ctx,
      judged ? compareRun(legacyRuns.jobs[1], clause.value) : 'Migration job',
      426,
      650,
      44,
      C.bg,
      'center',
    );
    api.text(ctx, 'Audit logging ON', 426, 794, 42, C.cyan, 'center');
  });

  if (!opened) {
    focus.target('summary', () => {
      api.rect(ctx, 849, 252, 880, 540, C.panel, C.blue, 10);
      api.text(ctx, 'Migration summary', 911, 353, 58, C.ink, 'left', 'serif');
      api.line(ctx, 911, 394, 1667, 394, C.muted, 2);
      api.text(ctx, 'Legacy token use requires', 911, 494, 48, C.ink);
      api.text(ctx, 'audit logging.', 911, 558, 48, C.blue);
    });
    focus.target('expiry-field', () => {
      const looking = focus.progress(
        'missing-date',
        state.beat > 0 ? 1 : api.phase(state.beatP, 0.72, 0.9),
      );
      api.text(ctx, 'Expiry', 911, 705, 43, C.ink);
      api.line(ctx, 1106, 713, 1642, 713, C.muted, 2);
      api.text(ctx, '?', 1369, 689, 60, looking ? C.yellow : C.muted, 'center');
    });
    return;
  }

  focus.target('manual', () => {
    for (let offset = 28; offset >= 0; offset -= 14)
      api.rect(ctx, 849 + offset, 245 + offset, 880, 446, C.panel, C.blue, 10);
    api.text(ctx, 'Original manual', 910, 345, 57, C.ink, 'left', 'serif');
    api.text(
      ctx,
      'v12  /  p' + (pages.indexOf(clause) + 1) + ' of ' + pages.length,
      1657,
      345,
      32,
      C.blue,
      'right',
    );
    api.line(ctx, 910, 388, 1667, 388, C.muted, 2);
    api.text(ctx, 'This exception expires', 910, 478, 45, C.ink);
    api.text(ctx, clause.value, 910, 567, 70, C.yellow);
  });
  focus.target('child-passage', () => {
    if (copied === 0) return;
    api.rect(ctx, 162, 850, 1567, 139, C.panel, C.cyan, 10);
    api.text(ctx, 'Child request', 216, 937, 42, C.cyan);
    const x = api.lerp(908, 650, copied);
    const y = api.lerp(580, 866, copied);
    api.rect(ctx, x, y, 803, 107, C.panel, C.blue, 7);
    api.text(ctx, clause.text, x + 24, y + 44, 34, C.ink);
    api.text(ctx, clause.id, x + 24, y + 86, 29, C.blue);
  });
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'october-run',
    'summary-check',
    'missing-date',
    'reopen-manual',
    'late-job',
    'pass-clause',
  ],
};
