import { mix, phase } from './arithmetic.mjs';
import { policySnapshot } from './model.mjs';
import { cell, focus, packet, queueField, route, text } from './defaults.mjs';

export function drawPolicy(ctx, state, api, improved) {
  const { C } = api;
  const snap = policySnapshot(state.beat ?? 0, state.beatP ?? 0, state.cues, improved);
  const memberTarget = improved ? 'improved-membership' : 'policy-membership';
  const receiptTarget = improved ? 'improved-receipt' : 'policy-receipt';
  const left = 245, scale = 2.32, capacityX = left + 200 * scale;
  text(ctx, api, 'Review queue', left, 233, 37, C.ink, 'left');
  text(ctx, api, '200 slots', capacityX, 233, 37, C.yellow);
  const setting = improved ? (snap.progress > 0 ? 'Improved detector' : 'Starting strict queue') : 'Same detector';
  text(ctx, api, setting, 1690, 233, 36, C.muted, 'right');
  api.rect(ctx, left, 271, scale * 600, 50, C.panel, undefined, 2);
  api.rect(ctx, left, 271, snap.tp * scale, 50, C.red, undefined, 2);
  api.rect(ctx, left + snap.tp * scale, 271, snap.fp * scale, 50, C.blue, undefined, 2);
  api.line(ctx, capacityX, 248, capacityX, 330, C.yellow, 4);

  queueField(ctx, api, memberTarget, () => {
    for (const row of snap.rows) {
      const target = cell(row);
      if (row.kept) packet(ctx, api, row, target);
      else if (improved && row.abusive && row.progress > 0) {
        packet(ctx, api, row, {
          x: mix(25, target.x, phase(row.progress, 0, 0.55)),
          y: mix(715, target.y, phase(row.progress, 0.55, 1)),
        });
      } else if (!improved && row.progress < 1) {
        const at = row.abusive
          ? {
              x: mix(target.x, 490, phase(row.progress, 0.65, 1)),
              y: mix(target.y, 715, phase(row.progress, 0, 0.65)),
            }
          : route(target, { x: 1420, y: 715 }, row.progress, true);
        packet(ctx, api, row, at);
      }
    }
  });
  focus(api, receiptTarget, () => {
    if (improved && snap.progress > 0 && !snap.receiptReady) {
      text(ctx, api, '99 clean flags', 250, 864, 42, C.blue, 'left');
      text(ctx, api, 'How many abusive signups are still outside review?', 960, 976, 41, C.ink);
      return;
    }
    const addedMisses = 95 - snap.tp, releasedClean = 495 - snap.fp;
    text(ctx, api, addedMisses + ' added misses', 250, 843, 37, C.red, 'left');
    text(ctx, api, releasedClean + ' clean released', 1680, 843, 37, C.blue, 'right');
    text(ctx, api, 'Queue: ' + snap.total + ' · abusive: ' + snap.tp + ' · clean: ' + snap.fp, 250, 938, 43, C.ink, 'left');
    text(ctx, api, 'Total abuse missed: ' + snap.missed, 1680, 938, 40, C.red, 'right');
    if (snap.receiptReady && (improved || snap.chosen)) {
      const verdict = improved ? '194 ≤ 200 · 5 missed · improved detector' : '179 ≤ 200 · strict fits · 20 missed';
      text(ctx, api, verdict, 960, 1020, 41, C.yellow);
    }
  });
}
