import { cue } from '../case-file.mjs';
import { drawHostAdmission } from './paging-and-admission/host-admission.mjs';

export function drawPagingAndAdmission(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 2) return drawHostAdmission(ctx, scene, state, api);
  if (state.beat === 3) {
    const warned = cue(api, 'queue-warning') >= 1;
    const flush = cue(api, 'queue-flush') >= 1;
    const pressure = flush ? 100 : warned ? 70 : 40;
    api.focus.target('pressure', () => {
      api.text(
        ctx,
        'Prompt occupancy in the paper’s example',
        118,
        323,
        47,
        C.ink,
        'left',
        'serif',
      );
      api.text(ctx, pressure + '%', 120, 584, 118, C.ink, 'left', 'mono');
      const x = 120,
        width = 1650;
      api.rect(ctx, x, 651, width, 88, C.panel, null, 0);
      api.rect(ctx, x, 651, (width * pressure) / 100, 88, flush ? C.yellow : C.cyan, null, 0);
      for (const [pct, tag] of [
        [70, 'Warning'],
        [100, 'Flush'],
      ]) {
        const tx = x + (width * pct) / 100;
        api.line(ctx, tx, 755, tx, 792, C.muted, 2);
        api.text(ctx, pct + '%  ' + tag, tx, 852, 37, C.muted, pct === 100 ? 'right' : 'center');
      }
    });
    return;
  }
  const copied = cue(api, 'archive-insert');
  const fold = cue(api, 'evict-turns');
  const evicted = fold >= 1;
  const queue = [
    evicted ? 'Summary of request and replay' : 'Previous summary',
    'Ada’s initial request',
    'Replay 78291',
    'Inspection result',
    'Ada’s latest turn',
  ];
  const occupied = evicted ? queue.length - 2 : queue.length;
  api.focus.target('queue', () => {
    api.text(ctx, 'Active prompt', 115, 277, 47, C.ink, 'left', 'serif');
    api.text(ctx, 'System instructions + writable working block', 115, 347, 34, C.cyan);
    queue.forEach((row, i) => {
      const older = i === 1 || i === 2;
      const opacity = older ? 1 - api.phase(fold, 0, 0.35) : 1;
      if (opacity <= 0) return;
      const slot = i > 2 ? i - 2 * api.ease(api.phase(fold, 0.35, 1)) : i;
      const y = 385 + slot * 85;
      const isReplay = row === 'Replay 78291';
      ctx.save();
      ctx.globalAlpha *= opacity;
      api.rect(ctx, 115, y, 844, 67, isReplay ? '#302d22' : C.panel, null, 4);
      api.text(
        ctx,
        String(evicted && i > 2 ? i - 1 : i + 1),
        140,
        y + 47,
        30,
        C.muted,
        'left',
        'mono',
      );
      api.text(ctx, row, 225, y + 48, 34, isReplay || (i === 0 && evicted) ? C.yellow : C.ink);
      ctx.restore();
    });
    api.text(ctx, occupied + ' occupied queue entries', 115, 892, 42, C.ink);
    if (evicted) api.text(ctx, 'Check the token budget for the answer.', 115, 959, 32, C.cyan);
  });
  api.focus.target('archive', () => {
    api.text(ctx, 'External archive', 1090, 277, 47, C.ink, 'left', 'serif');
    api.line(ctx, 1090, 348, 1785, 348, C.muted, 2);
    api.text(ctx, copied >= 1 ? '1 retained record' : '0 retained records', 1090, 449, 36, C.muted);
    if (copied > 0) {
      api.rect(ctx, 1090, 537, 688 * copied, 95, '#302d22', null, 0);
      if (copied >= 1) api.text(ctx, 'Replay 78291', 1120, 603, 43, C.yellow);
    }
    if (state.beat === 0 && copied >= 1)
      api.text(ctx, 'How many entries are still in the prompt?', 1090, 758, 33, C.yellow);
  });
}
export default {
  id: 'paging-and-admission',
  draw: drawPagingAndAdmission,
  cues: [
    'archive-insert',
    'evict-turns',
    'check-preference',
    'write-admitted',
    'write-blocked',
    'queue-warning',
    'queue-flush',
  ],
};
