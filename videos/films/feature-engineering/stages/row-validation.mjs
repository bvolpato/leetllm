import { featureFrame, featureVector } from '../model.mjs';

const source = { pool: 'a100-pool', queued: 42, heartbeat: 0.5, backlog: 18, priority: false };

export function drawRowValidation(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const t = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  api.focus.target('row-contract', () => {
    if (f.b === 0) {
      t('Incoming heartbeat', 182, 319, 36, C.cyan);
      t('Instant used at 09:00 UTC', 1030, 319, 36, C.cyan);
      const timestamps = [
        ['04:30 −04:00', '08:30 UTC'],
        ['08:30 +00:00', '08:30 UTC'],
        ['08:30', 'Offset missing'],
      ];
      timestamps.forEach(([stamp, value], i) => {
        const y = 467 + i * 153;
        const valid = i < 2;
        t(stamp, 185, y, 55);
        api.arrow(ctx, 680, y - 17, 929, y - 17, C.muted, 3);
        const reveal = valid ? f.started('validation-offset', 0) : f.started('validation-naive', 0);
        t(reveal ? value : '?', 1040, y, 49, valid ? C.cyan : C.pink);
      });
      t('May 1, 2026', 185, 936, 30, C.muted);
      return;
    }
    const changed = f.started('validation-blank', 2);
    const empty = f.started('validation-zero', 2);
    const backlog = empty ? 0 : changed ? null : source.backlog;
    const vector = featureVector({ ...source, backlog });
    t('J-204   /   named output', 146, 255, 37);
    t('Source backlog', 1744, 255, 33, C.muted, 'right');
    t(backlog === null ? 'null' : String(backlog) + ' jobs', 1744, 327, 51, C.yellow, 'right');
    const fields = [
      ['runner_pool', source.pool],
      ['queued_minutes', vector[3]],
      ['hours_since_last_heartbeat', vector[4]],
      ['queue_backlog', vector[5]],
      ['queue_backlog_missing', vector[6]],
      ['priority_job', vector[7]],
    ];
    fields.forEach(([name, value], i) => {
      const y = 358 + 96 * i;
      const selected = changed && (i === 3 || i === 4);
      api.text(ctx, name, 207, y + 25, 34, selected ? C.yellow : C.ink, 'left', 'mono');
      api.line(ctx, 790, y + 12, 905, y + 12, C.muted, 2);
      t(String(value), 980, y + 25, 43, selected ? C.yellow : C.cyan);
    });
    api.text(ctx, 'finished_at     post_sla_escalation', 207, 994, 29, C.muted, 'left', 'mono');
    t('Outside the input row', 1070, 994, 30, C.muted);
  });
}

export default {
  id: 'row-validation',
  draw: drawRowValidation,
  cues: [
    'validation-offset',
    'validation-naive',
    'validation-fields',
    'validation-blank',
    'validation-zero',
  ],
};
