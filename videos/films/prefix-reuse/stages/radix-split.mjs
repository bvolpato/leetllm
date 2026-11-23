import { fullBlockPrefix, clamp } from '../arithmetic.mjs';
import { drawText, footer, frame, line, mark, pill, tokenRail } from '../defaults.mjs';
export function drawRadixSplit(ctx, scene, state, api) {
  return api.focus.target('radix-split-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    const cueComplete = (id) => cueProgress(id) === 1;
    {
      if (currentBeat < 2) {
        const split = currentBeat > 0 ? 1 : cueProgress('radix-branch'),
          matched = currentBeat > 0 || cueVisible('radix-match');
        drawText(ctx, api, 'Exact token paths · state follows the shared history', 150, 270, 32);
        const root = [220, 540],
          joint = [870, 540];
        api.circle(ctx, ...root, 12, themeColors.blue);
        line(ctx, api, ...root, ...joint, themeColors.blue, 5);
        [11, 12].forEach((v, i) =>
          pill(
            ctx,
            api,
            v,
            390 + i * 170,
            490,
            120,
            matched ? themeColors.green : themeColors.blue,
          ),
        );
        const upperY = 540 - 180 * split,
          lowerY = 720;
        let upperEnd = joint;
        [13, 14].forEach((v, i) => {
          const x = 1120 + i * 170;
          const y = joint[1] + ((upperY - joint[1]) * (x + 60 - joint[0])) / (1590 - joint[0]);
          line(ctx, api, ...upperEnd, x, y, themeColors.blue, 5);
          pill(ctx, api, v, x, y - 33, 120, themeColors.blue);
          upperEnd = [x + 120, y];
        });
        line(ctx, api, ...upperEnd, 1590, upperY, themeColors.blue, 5);
        if (split > 0) {
          api.circle(ctx, ...joint, 12, themeColors.green);
          const tokenY = joint[1] + ((lowerY - joint[1]) * (1350 - joint[0])) / (1590 - joint[0]);
          line(ctx, api, ...joint, 1290, tokenY, themeColors.pink, 5 * split);
          pill(ctx, api, 99, 1290, tokenY - 33, 120, themeColors.pink);
          line(ctx, api, 1410, tokenY, 1590, lowerY, themeColors.pink, 5 * split);
        }
        mark(ctx, api, 'radix-match', () => {
          if (matched)
            drawText(ctx, api, '11, 12 · shared state', 600, 430, 28, themeColors.green, 'center');
        });
        mark(ctx, api, 'radix-branch', () => {
          if (split > 0.5)
            drawText(
              ctx,
              api,
              'Divergence retains one shared ancestor',
              960,
              850,
              32,
              themeColors.green,
              'center',
            );
        });
        if (currentBeat > 0) {
          mark(ctx, api, 'radix-protect', () => {
            if (cueVisible('radix-protect')) {
              pill(ctx, api, 'refs 1 · protected', 370, 745, 450, themeColors.blue);
              api.circle(ctx, 870, 540, 25, null, themeColors.blue, 3);
            }
          });
          mark(ctx, api, 'radix-evict', () => {
            if (cueVisible('radix-evict')) {
              line(ctx, api, 1525, 690, 1640, 750, themeColors.pink, 4);
              line(ctx, api, 1525, 750, 1640, 690, themeColors.pink, 4);
              drawText(
                ctx,
                api,
                'refs 0 · eligible leaf',
                1430,
                820,
                26,
                themeColors.pink,
                'center',
              );
            }
          });
        }
        footer(
          ctx,
          api,
          'Token IDs are literal teaching inputs; production granularity depends on the backend.',
        );
      } else {
        const rounded = cueComplete('radix-round'),
          reused = fullBlockPrefix(6005, 16);
        mark(ctx, api, 'radix-scale', () =>
          drawText(ctx, api, '6,005 exact shared positions', 180, 300, 36, themeColors.blue),
        );
        tokenRail(ctx, api, 180, 410, 1520, [6005], 6016, [themeColors.blue], 90);
        drawText(
          ctx,
          api,
          rounded ? '375 complete blocks × 16' : 'Count complete 16-token blocks',
          180,
          650,
          32,
          themeColors.muted,
        );
        const insetX = 1030;
        drawText(ctx, api, 'Last block · enlarged', insetX, 630, 27, themeColors.muted);
        for (let i = 0; i < 16; i++)
          frame(
            ctx,
            api,
            insetX + i * 40,
            680,
            35,
            62,
            i < 5 ? themeColors.blue : themeColors.muted,
            i < 5 ? themeColors.blue : themeColors.panel,
          );
        mark(ctx, api, 'radix-round', () => {
          if (rounded) {
            drawText(
              ctx,
              api,
              reused.toLocaleString('en-US') + ' reusable at full blocks',
              180,
              830,
              35,
              themeColors.green,
            );
            if (cueComplete('radix-remainder'))
              drawText(
                ctx,
                api,
                '5 shared tokens remain outside',
                1030,
                830,
                28,
                themeColors.yellow,
              );
          } else drawText(ctx, api, 'Full-block reuse pending', 180, 830, 32, themeColors.muted);
        });
        footer(ctx, api, 'The full-block endpoint is floor(common / block size) × block size.');
      }
    }
  });
}
export default {
  id: 'radix-split',
  draw: drawRadixSplit,
  cues: [
    'radix-match',
    'radix-branch',
    'radix-protect',
    'radix-evict',
    'radix-scale',
    'radix-round',
    'radix-remainder',
  ],
};
