import { clip } from '../arithmetic.mjs';
import { arrow, box, cueProgress, cueVisible, footer, rankingText } from '../defaults.mjs';
export function drawExperimentContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  api.focus.target('experiment-contract-mechanism', () => {
    const { C } = api,
      b = state.beat ?? 0;
    {
      rankingText(ctx, api, 'One shopper owns one stable arm', 150, 270, 35);
      const shoppers = [
        ['SHOP-100', 'control', C.blue],
        ['SHOP-200', 'treatment', C.cyan],
      ];
      shoppers.forEach(([id, arm, color], i) => {
        const y = 390 + i * 230;
        box(ctx, api, id, 180, y, 400, 85, color, 32);
        if (cueVisible(ctx, api, 'assignment-hash') || b > 0) {
          arrow(
            ctx,
            api,
            620,
            y + 42,
            860,
            y + 42,
            color,
            b > 0 ? 1 : cueProgress(ctx, api, 'assignment-hash'),
          );
          box(ctx, api, 'experiment+shopper hash → ' + arm, 920, y, 800, 85, color, 29);
        }
        if (cueVisible(ctx, api, 'assignment-stable') || b > 0)
          for (let j = 0; j < 3; j++) {
            const progress = b > 0 ? 1 : clip(3 * cueProgress(ctx, api, 'assignment-stable') - j);
            if (progress > 0) {
              box(ctx, api, 'search ' + (j + 1), 210 + j * 185, y + 110, 160, 65, color, 25);
              arrow(ctx, api, 290 + j * 185, y + 100, 290 + j * 185, y + 88, color, progress);
            }
          }
      });
      if (b === 1 && cueVisible(ctx, api, 'assignment-unit')) {
        shoppers.forEach(([, , color], i) => {
          const y = 390 + i * 230;
          api.rect(ctx, 160, y - 15, 600, 205, null, color, 0);
          rankingText(ctx, api, 'one assigned unit', 1250, y + 165, 27, color, 'center');
          arrow(
            ctx,
            api,
            790,
            y + 130,
            1020,
            y + 130,
            color,
            cueProgress(ctx, api, 'assignment-unit'),
          );
        });
      }
      if (b === 1 && cueVisible(ctx, api, 'assignment-unit'))
        rankingText(
          ctx,
          api,
          'Two assigned units shown; repeated rows are not new units',
          960,
          925,
          33,
          C.yellow,
          'center',
        );
      if (b === 1 && cueVisible(ctx, api, 'assignment-srm'))
        footer(
          ctx,
          api,
          'Plan power,follow-up,stopping and sample-ratio/missing-log checks before exposure.',
        );
      if (b === 2 && cueVisible(ctx, api, 'experiment-stop'))
        box(
          ctx,
          api,
          'Safety / returns / latency / seller rules keep their own stops',
          220,
          905,
          1480,
          80,
          C.pink,
          29,
        );
      if (b === 2 && cueVisible(ctx, api, 'experiment-recovery'))
        footer(
          ctx,
          api,
          'Prior model+compatible features+traffic control+current eligibility must be verified during recovery.',
        );
    }
  });
}
export default {
  id: 'experiment-contract',
  draw: drawExperimentContract,
  cues: [
    'assignment-hash',
    'assignment-stable',
    'assignment-unit',
    'assignment-srm',
    'experiment-stop',
    'experiment-recovery',
  ],
};
