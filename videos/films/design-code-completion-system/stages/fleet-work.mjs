import { prefillCohortWork } from '../arithmetic.mjs';
import { completionCue } from '../construction.mjs';
import {
  completionBox,
  completionCode,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawFleetWork(ctx, scene, state, api) {
  api.focus.target('cc-fleet-work-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
      done = (id) => completionCue(state, id) >= 1;
    {
      completionHeading(
        ctx,
        api,
        'Peak-hour GPU work for prompt prefill',
      );
      if (currentBeat === 0) {
        completionBox(
          ctx,
          api,
          '5,000 active editors × 0.4 RPS',
          250,
          380,
          1420,
          100,
          themeColors.blue,
        );
        if (done('cc-raw2000'))
          completionText(
            ctx,
            api,
            '2,000 raw requests/s',
            960,
            590,
            44,
            themeColors.cyan,
            'center',
          );
        if (done('cc-admit800')) {
          api.rect(ctx, 320, 710, 768, 90, themeColors.panel, themeColors.pink, 2, 4);
          api.rect(ctx, 1088, 710, 512, 90, themeColors.panel, themeColors.green, 2, 4);
          completionText(
            ctx,
            api,
            '60% pre-admission cancellations',
            700,
            860,
            31,
            themeColors.pink,
            'center',
          );
          completionText(ctx, api, '800 admitted/s', 1350, 860, 31, themeColors.green, 'center');
        }
      } else {
        const mode = 0,
          lengths = mode === 0 ? [2048, 2048] : mode === 1 ? [3072, 1024] : [1024, 3072],
          f = prefillCohortWork(...lengths),
          reveal = done('cc-prefill1024k') || currentBeat > 1;
        completionText(ctx, api, '400 hits/s', 300, 440, 35, themeColors.blue);
        completionText(ctx, api, '400 misses/s', 300, 660, 35, themeColors.pink);
        [
          [lengths[0], 0.25, f.hit, themeColors.blue],
          [lengths[1], 1, f.miss, themeColors.pink],
        ].forEach(([length, remain, total, col], i) => {
          completionCode(ctx, api, `400 × ${length} × ${remain}`, 720, 440 + i * 220, 34, col);
          if (reveal)
            completionText(
              ctx,
              api,
              '= ' + total.toLocaleString('en-US') + ' tokens/s',
              1340,
              440 + i * 220,
              33,
              col,
            );
        });
        if (reveal) {
          completionText(
            ctx,
            api,
            f.total.toLocaleString('en-US') + ' remaining prefill tokens/s',
            960,
            830,
            41,
            themeColors.green,
            'center',
          );
          if (done('cc-gpu52'))
            completionText(
              ctx,
              api,
              `ceil(${f.total.toLocaleString('en-US')} / 20,000) = ${f.gpus} worksheet GPUs`,
              960,
              940,
              36,
              themeColors.yellow,
              'center',
            );
        }
      }
      completionFooter(
        ctx,
        api,
        'Decode, late-cancelled work, KV, imbalance, failover and headroom are excluded',
      );
    }
    return true;
  });
}
export default {
  id: 'fleet-work',
  draw: drawFleetWork,
  cues: [
    'cc-fleet-work-0',
    'cc-raw2000',
    'cc-admit800',
    'cc-fleet-work-1',
    'cc-prefill1024k',
    'cc-fleet-work-2',
    'cc-gpu52',
  ],
};
