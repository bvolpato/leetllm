import { SERVING_COHORT } from '../fixtures.mjs';
import { limit } from '../construction.mjs';
import { servingRequestMetrics } from '../model.mjs';
import { box, constructionText, footer, line, title } from '../defaults.mjs';
export function drawScorerContract(ctx, scene, state, api) {
  api.focus.target('scorer-contract-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(
        ctx,
        api,
        currentBeat === 0
          ? 'The quality flag in each event record'
          : currentBeat === 1
            ? 'Strict accounting checks every offered identity'
            : 'Protocol success and qualification have different counts',
      );
      if (currentBeat < 2) {
        const records =
          currentBeat === 0
            ? ['quality pass: true', 'quality pass: "true"', 'quality pass: 1']
            : [
                'known unique ID',
                'duplicate ID',
                'missing r06 terminal',
                'NaN timestamp',
                'send before schedule',
              ];
        const cue = state.cues?.['scorer-contract-beat-0'];
        const showVerdict = currentBeat > 0 || (cue ? cue.phase === 'after' : progress >= 0.24);
        records.forEach((v, i) => {
          const y = 390 + i * 105;
          const color = showVerdict
            ? i === 0
              ? themeColors.green
              : themeColors.red
            : themeColors.blue;
          box(ctx, api, v, 250, y, 850, 80, color, 30);
          if (!showVerdict) return;
          constructionText(ctx, api, i === 0 ? 'accepted' : 'rejected', 1250, y + 50, 28, color);
        });
      } else {
        const heads = [
            'ID',
            'terminal',
            'nonempty',
            'quality',
            'TTFT ≤300',
            'TPOT ≤80',
            'qualified',
          ],
          xs = [205, 390, 650, 875, 1090, 1350, 1610];
        heads.forEach((v, i) => constructionText(ctx, api, v, xs[i], 385, 25, themeColors.muted));
        SERVING_COHORT.forEach((r, i) => {
          const m = servingRequestMetrics(r),
            y = 455 + i * 70;
          [
            r.id,
            r.status,
            String(r.tokens.length),
            r.quality ? 'true' : 'false',
            m.ttft,
            m.tpot === null ? 'n/a' : m.tpot,
            m.qualified ? 'yes' : 'no',
          ].forEach((v, j) =>
            constructionText(
              ctx,
              api,
              String(v),
              xs[j],
              y,
              26,
              j === 6
                ? m.qualified
                  ? themeColors.green
                  : themeColors.red
                : j === 0
                  ? themeColors.blue
                  : themeColors.ink,
            ),
          );
          line(ctx, api, 190, y + 25, 1735, y + 25, themeColors.border, 1);
        });
        box(
          ctx,
          api,
          currentBeat === 3
            ? 'success-only latency population = 5; offered denominator = 6'
            : '3 qualify · 5 protocol successes · 6 offered',
          300,
          905,
          1320,
          75,
          themeColors.yellow,
          30,
        );
      }
      footer(
        ctx,
        api,
        currentBeat === 3
          ? 'File hashes identify the inputs. A load sweep measures capacity.'
          : 'not sent / timeout / error / rejected / cancelled remain offered work',
      );
    }
    return true;
  });
}
export default {
  id: 'scorer-contract',
  draw: drawScorerContract,
  cues: [
    'scorer-contract-beat-0',
    'scorer-contract-beat-1',
    'scorer-contract-beat-2',
    'scorer-contract-beat-3',
  ],
};
