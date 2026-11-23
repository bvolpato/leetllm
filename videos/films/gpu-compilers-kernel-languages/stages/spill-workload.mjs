import {
  arrow,
  bar,
  box,
  codeText,
  cueProgress,
  detailEquation,
  detailText,
  focusTarget,
  footer,
  line,
  visible,
} from '../defaults.mjs';
export function drawSpillWorkload(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const resultComplete = (id) => cueProgress(ctx, api, id) === 1;
  {
    if (currentBeat === 0) {
      focusTarget(ctx, api, 'spill-loop', () => {
        detailText(ctx, api, 'One thread · one supplied loop', 150, 300, 32, themeColors.yellow);
        box(ctx, api, 180, 430, 430, 240, themeColors.cyan);
        detailText(ctx, api, 'register value', 395, 490, 32, themeColors.cyan, 'center');
        box(ctx, api, 1230, 430, 470, 240, themeColors.pink);
        detailText(ctx, api, 'local address', 1465, 490, 32, themeColors.pink, 'center');
        if (visible(ctx, api, 'spill-accesses')) {
          arrow(ctx, api, 640, 535, 1200, 535, themeColors.blue);
          detailText(ctx, api, 'store 4B', 920, 500, 31, themeColors.blue, 'center');
          arrow(ctx, api, 1200, 630, 640, 630, themeColors.green);
          detailText(ctx, api, 'load 4B', 920, 695, 31, themeColors.green, 'center');
        }
        const n = visible(ctx, api, 'spill-iterations')
          ? Math.floor(20 * cueProgress(ctx, api, 'spill-iterations'))
          : 0;
        if (n > 0) {
          detailText(ctx, api, `Completed loop iterations: ${n} / 20`, 150, 800, 31);
          bar(ctx, api, 180, 850, 1500, 38, n, 20, themeColors.cyan);
        }
      });
      focusTarget(ctx, api, 'spill-total', () => {
        if (resultComplete('spill-total'))
          detailEquation(
            ctx,
            api,
            String.raw`(4+4)\times20=160\ \mathrm{requested\ bytes/thread}`,
            960,
            950,
            40,
            themeColors.yellow,
          );
        else if (visible(ctx, api, 'spill-total'))
          detailText(
            ctx,
            api,
            'Requested byte total pending',
            960,
            950,
            30,
            themeColors.muted,
            'center',
          );
      });
      footer(
        ctx,
        api,
        'A local access can be served from cache.',
      );
    } else if (currentBeat === 1)
      focusTarget(ctx, api, 'spill-report', () => {
        detailText(ctx, api, 'Static allocation report', 170, 330, 33, themeColors.cyan);
        detailText(ctx, api, 'Generated loop execution', 1050, 330, 33, themeColors.yellow);
        line(ctx, api, 930, 300, 930, 750, themeColors.muted, 2);
        codeText(ctx, api, 'spill store width: 4B', 170, 450, 28);
        codeText(ctx, api, 'spill load width: 4B', 170, 520, 28);
        if (visible(ctx, api, 'static-dynamic')) {
          detailText(ctx, api, '20 iterations', 1050, 450, 36, themeColors.yellow);
          detailText(ctx, api, '160 requested bytes/thread', 1050, 540, 31, themeColors.yellow);
        }
        if (visible(ctx, api, 'launch-maximum')) {
          box(ctx, api, 190, 780, 1500, 130, themeColors.pink);
          detailText(
            ctx,
            api,
            'A launch above the declared block size limit fails.',
            940,
            835,
            30,
            themeColors.pink,
            'center',
          );
          detailText(
            ctx,
            api,
            'ABI minima and instruction constraints still apply.',
            940,
            884,
            27,
            themeColors.muted,
            'center',
          );
        }
      });
    else
      focusTarget(ctx, api, 'spill-storage', () => {
        detailText(
          ctx,
          api,
          'Opt-in whole-program shared-memory spilling · CUDA 13+',
          150,
          290,
          31,
          themeColors.yellow,
        );
        box(ctx, api, 150, 420, 420, 150, themeColors.cyan);
        detailText(ctx, api, 'register pressure', 360, 505, 32, themeColors.cyan, 'center');
        box(ctx, api, 810, 400, 650, 220, themeColors.blue);
        detailText(ctx, api, 'shared-memory budget', 1135, 455, 31, themeColors.blue, 'center');
        if (visible(ctx, api, 'shared-spill')) {
          arrow(ctx, api, 590, 490, 780, 490, themeColors.blue);
          api.rect(
            ctx,
            840,
            505,
            320 * cueProgress(ctx, api, 'shared-spill'),
            75,
            themeColors.blue,
            null,
            0,
            4,
          );
          detailText(ctx, api, 'spill storage', 1000, 670, 28, themeColors.blue, 'center');
          arrow(ctx, api, 1480, 490, 1730, 490, themeColors.pink);
          detailText(ctx, api, 'local fallback', 1585, 660, 29, themeColors.pink, 'center');
        }
        if (visible(ctx, api, 'shared-residency')) {
          detailText(
            ctx,
            api,
            'Spill bytes and resident-block storage compete for the same budget.',
            960,
            785,
            30,
            themeColors.yellow,
            'center',
          );
          detailText(
            ctx,
            api,
            'Documented exclusions: dynamic shared memory; warp register reallocation.',
            960,
            880,
            27,
            themeColors.muted,
            'center',
          );
        }
      });
  }
}
export default {
  id: 'spill-workload',
  draw: drawSpillWorkload,
  cues: [
    'spill-accesses',
    'spill-iterations',
    'spill-total',
    'static-dynamic',
    'launch-maximum',
    'shared-spill',
    'shared-residency',
  ],
};
