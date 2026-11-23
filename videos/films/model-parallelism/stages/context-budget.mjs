import { mpClamp } from '../arithmetic.mjs';
import {
  formatParallelNumber,
  parallelBar,
  parallelFooter,
  parallelLine,
  parallelText,
} from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawContextBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-context-budget-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q,
    resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-context-budget-mechanism', () => {
    const bytes = 2 * 80 * 1e6 * 8 * 128 * 2,
      GiB = 2 ** 30,
      total = bytes / GiB,
      share = total / 4,
      device = 80e9 / GiB;
    parallelText(ctx, api, 'Chosen full-history dimensions', 170, 300, 33);
    const terms = [
      'K + V: 2',
      '80 full-attention layers',
      '1,000,000 positions',
      '8 KV heads',
      '128 values / head',
      '2 bytes / value',
    ];
    const count = Math.floor(Q('dimensions', 1) * terms.length + 1e-9);
    terms.forEach((v, i) =>
      parallelText(
        ctx,
        api,
        (i < count ? '× ' : '  ') + v,
        190 + (i % 3) * 550,
        400 + Math.floor(i / 3) * 100,
        29,
        i < count ? themeColors.cyan : themeColors.muted,
      ),
    );
    if (resultComplete('full', 1))
      parallelText(
        ctx,
        api,
        `raw payload = ${formatParallelNumber(ctx, api, total, 1)} GiB`,
        960,
        650,
        36,
        themeColors.blue,
        'center',
      );
    if (Q('four', 1) > 0) {
      for (let rank = 0; rank < 4; rank++) {
        const x = 180 + rank * 425;
        parallelBar(ctx, api, share, 85, x, 755, 335, 65, themeColors.cyan);
        parallelText(ctx, api, 'rank ' + rank, x + 167, 720, 28, themeColors.muted, 'center');
        parallelText(
          ctx,
          api,
          resultComplete('four', 1) ? formatParallelNumber(ctx, api, share, 1) + ' GiB' : '?',
          x + 167,
          865,
          30,
          themeColors.cyan,
          'center',
        );
        if (resultComplete('device', 2)) {
          const boundary = x + (335 * device) / 85;
          parallelLine(ctx, api, boundary, 735, boundary, 840, themeColors.pink);
          parallelText(
            ctx,
            api,
            formatParallelNumber(ctx, api, device, 1) + ' GiB device',
            x + 167,
            930,
            26,
            themeColors.pink,
            'center',
          );
        }
      }
    }
    parallelFooter(
      ctx,
      api,
      resultComplete('fails', 2)
        ? 'Every ideal KV share exceeds the device budget before weights or workspace.'
        : 'Budget the history for a sequence length the checkpoint supports.',
    );
  });
}
export default {
  id: 'context-budget',
  draw: drawContextBudget,
  cues: [
    'mp-context-budget-0',
    'mp-context-budget-training',
    'mp-context-budget-1',
    'mp-context-budget-dimensions',
    'mp-context-budget-full',
    'mp-context-budget-four',
    'mp-context-budget-2',
    'mp-context-budget-device',
    'mp-context-budget-fails',
  ],
};
