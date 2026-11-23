import { reviewExercise } from '../construction.mjs';
import { cueClock, footer } from '../routing.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const e = reviewExercise();
  if (state.beat === 0) {
    const p = e.rows[0];
    api.text(ctx, 'Production writes   ' + e.effects, 1805, 316, 33, C.muted, 'right');
    if (cue('transfer-mean-wait').phase === 'before') {
      const x = (t) => 185 + t * 150;
      const marker = (t, label) => {
        api.text(ctx, label, x(t), 478, 35, C.ink, 'center');
        api.circle(ctx, x(t), 557, 13, C.ink);
        api.text(ctx, t + ' s', x(t), 645, 39, C.ink, 'center');
      };
      api.text(ctx, 'P1 · review exercise', 115, 316, 49, C.ink, 'left', 'serif');
      api.line(ctx, x(p.submitted), 557, x(p.decided), 557, C.muted, 3);
      const queue = cue('transfer-b1-1');
      const review = cue('reviewer-response');
      api.focus.target('p1-queue-cells', () => {
        marker(p.submitted, 'Queued');
        if (review.phase === 'before') marker(p.started, 'Opened');
        if (queue.phase !== 'before') {
          const mid = (x(p.submitted) + x(p.started)) / 2;
          api.line(
            ctx,
            x(p.submitted),
            557,
            x(p.submitted + (p.started - p.submitted) * queue.progress),
            557,
            C.blue,
            10,
          );
          api.text(ctx, 'Queue wait', mid, 748, 35, C.blue, 'center');
          api.text(
            ctx,
            `P1: ${p.started}s − ${p.submitted}s = ${p.started - p.submitted}s`,
            mid,
            823,
            43,
            C.blue,
            'center',
          );
        }
      });
      api.focus.target('p1-review-cells', () => {
        marker(p.decided, 'Decided');
        if (review.phase !== 'before') {
          marker(p.started, 'Opened');
          const mid = (x(p.started) + x(p.decided)) / 2;
          api.line(
            ctx,
            x(p.started),
            557,
            x(p.started + (p.decided - p.started) * review.progress),
            557,
            C.yellow,
            10,
          );
          api.text(ctx, 'Reviewer time', mid, 748, 35, C.yellow, 'center');
          api.text(
            ctx,
            `P1: ${p.decided}s − ${p.started}s = ${p.decided - p.started}s`,
            mid,
            823,
            43,
            C.yellow,
            'center',
          );
        }
      });
    } else {
      api.text(ctx, 'Across the practice packets', 115, 316, 49, C.ink, 'left', 'serif');
      const column = (i) => 565 + i * 142;
      e.rows.forEach((row, i) => api.text(ctx, row.id, column(i), 469, 34, C.ink, 'center'));
      api.text(ctx, 'Mean', 1580, 469, 36, C.ink, 'center');
      api.line(ctx, 115, 511, 1800, 511, C.muted, 2);
      for (const [label, y, from, to, sum, count, mean, id, target, color] of [
        [
          'Queue wait',
          620,
          'submitted',
          'started',
          e.waitSum,
          e.reviewed.length,
          e.waitMean,
          'transfer-mean-wait',
          'queue-mean',
          C.blue,
        ],
        [
          'Reviewer time',
          760,
          'started',
          'decided',
          e.responseSum,
          e.decisions.length,
          e.responseMean,
          'transfer-mean-review',
          'review-mean',
          C.yellow,
        ],
      ]) {
        if (cue(id).phase === 'before') continue;
        api.focus.target(target, () => {
          api.text(ctx, label, 115, y, 38, color);
          e.rows.forEach((row, i) => {
            const eligible = row[to] !== null && row[to] <= e.now;
            api.text(
              ctx,
              eligible ? row[to] - row[from] + ' s' : 'n/a',
              column(i),
              y,
              36,
              eligible ? color : C.muted,
              'center',
            );
          });
          const value = done(id) ? mean.toFixed(1) + 's' : '?';
          api.text(ctx, `${sum} / ${count} = ${value}`, 1580, y, 43, color, 'center');
        });
      }
      footer(ctx, api, 'P4 expired unopened. Five packets have both intervals.', C.muted);
    }
    return;
  }

  const caught = done('transfer-caught');
  api.focus.target('cohort', () => {
    api.text(ctx, 'Snapshot at ' + e.now + ' s', 115, 270, 34, C.muted);
    const head = ['Packet', 'Known condition', 'Reviewer’s decision'];
    const xs = [115, 440, 920];
    head.forEach((h, i) => api.text(ctx, h, xs[i], 365, 33, C.muted));
    e.rows.forEach((p, i) => {
      const y = 453 + i * 80;
      const missed = done('transfer-missed') && p.seeded && p.decision === 'approve';
      const color = missed ? C.pink : C.ink;
      api.text(ctx, p.id, xs[0], y, 37, color);
      api.text(ctx, p.seeded ? 'Seeded defect' : 'Clean', xs[1], y, 34, color);
      const decision =
        p.decision === null ? 'Expired unopened' : p.decision === 'approve' ? 'Approve' : 'Reject';
      api.text(ctx, decision, xs[2], y, 34, color);
      if (caught && p.seeded && (missed || p.decision === 'reject'))
        api.text(ctx, missed ? 'Missed' : 'Caught', 1460, y, 35, missed ? C.pink : C.green);
    });
  });
  api.focus.target('result', () => {
    if (caught)
      footer(
        ctx,
        api,
        e.caught.length + ' of ' + e.seeded.length + ' seeded defects caught',
        C.green,
      );
    else if (cue('transfer-ask').phase !== 'before')
      footer(ctx, api, 'Did the reviewers catch every planted defect?', C.yellow);
    else if (done('transfer-rate'))
      footer(
        ctx,
        api,
        `${e.approved.length} approvals / ${e.decisions.length} decisions   ·   Mean wait ${e.waitMean.toFixed(1)} s   ·   Mean review ${e.responseMean.toFixed(1)} s`,
      );
    else footer(ctx, api, e.rows.length + ' practice packets · zero production writes', C.muted);
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-b1-1',
    'reviewer-response',
    'transfer-mean-wait',
    'transfer-mean-review',
    'approval-rate',
    'transfer-expire',
    'transfer-rate',
    'transfer-ask',
    'transfer-caught',
    'transfer-missed',
  ],
};
