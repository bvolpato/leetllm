import { chapterText, cellText, dot, line } from './defaults.mjs';
import { APRIL_SCORED_ROWS, COSTS } from './fixtures.mjs';
import { evaluateAprilThreshold, selectedApril } from './model.mjs';

export const storedCutoff = selectedApril.threshold;
export const reportCutoff = Number(storedCutoff.toFixed(6));
export const copiedApril = evaluateAprilThreshold(reportCutoff);
export const tiedJobs = APRIL_SCORED_ROWS.filter((job) => job.score === storedCutoff);

// Magnify the same piece of score space in both replays. Only the policy marker moves.
export function drawBoundaryReplay(
  ctx,
  api,
  {
    progress,
    showPolicy,
    showActions,
    outcomes,
    awaitingOutcomes,
    charges,
    prompt,
    jobsVisible = tiedJobs.length,
  },
) {
  const { C } = api;
  const low = 0.0626668;
  const high = 0.06266705;
  const position = (score) => 480 + ((score - low) / (high - low)) * 900;
  const cutoff = storedCutoff + progress * (reportCutoff - storedCutoff);
  const marker = position(cutoff);
  chapterText(ctx, api, 'April  /  four priority jobs', 150, 270, 35);
  chapterText(ctx, api, 'Alert when score ≥ cutoff', 1760, 270, 33, C.yellow, 'right');
  chapterText(ctx, api, 'Job', 150, 370, 28, C.muted);
  chapterText(ctx, api, 'Score (magnified)   ' + storedCutoff, 480, 370, 32, C.cyan);
  chapterText(
    ctx,
    api,
    charges ? 'Deadline / cost units' : awaitingOutcomes ? 'Deadline' : 'Operator',
    1460,
    370,
    28,
    C.muted,
  );
  const rowY = (i) => 456 + i * 89;
  if (showPolicy) api.rect(ctx, marker, 404, position(high) - marker, 369, C.panel, undefined, 0);
  const jobs = tiedJobs.slice(0, jobsVisible);
  for (const [i, job] of jobs.entries()) {
    const y = rowY(i);
    chapterText(ctx, api, '#' + job.id, 150, y + 12, 38, C.ink);
    line(ctx, api, position(low), y, position(high), y, C.muted, 2);
  }
  api.focus.target('policy-marker', () => {
    if (showPolicy) {
      line(ctx, api, marker, 410, marker, 786, C.yellow, 5);
      const caption =
        progress === 0 ? 'Stored cutoff' : progress === 1 ? 'Report cutoff' : 'Cutoff';
      cellText(ctx, api, caption, marker, 842, C.yellow, 31);
      cellText(
        ctx,
        api,
        progress === 0 ? String(storedCutoff) : progress === 1 ? String(reportCutoff) : '',
        marker,
        889,
        C.yellow,
        31,
      );
    }
  });
  api.focus.target('tied-scores', () => {
    for (const [i, job] of jobs.entries()) dot(ctx, api, position(job.score), rowY(i), C.cyan, 13);
  });
  api.focus.target('dispatch-result', () => {
    for (const [i, job] of jobs.entries()) {
      const alert = job.score >= cutoff;
      const cost = alert ? (job.label ? 0 : COSTS.falseAlarm) : job.label ? COSTS.priorityMiss : 0;
      let label = outcomes
        ? job.label
          ? 'missed'
          : 'on time'
        : showActions
          ? alert
            ? 'alert'
            : 'quiet'
          : '?';
      if (charges) label += '   ' + cost;
      const color = outcomes
        ? job.label
          ? C.pink
          : C.ink
        : showActions && alert
          ? C.yellow
          : C.muted;
      chapterText(ctx, api, label, 1460, rowY(i) + 12, 37, color);
    }
  });
  if (prompt) cellText(ctx, api, prompt, 960, 995, C.ink, 36);
}
