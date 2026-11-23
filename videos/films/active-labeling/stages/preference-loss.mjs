import { preferenceFixture } from '../model.mjs';
import {
  cueComplete,
  cueVisible,
  detailEquation,
  detailFooter,
  detailHeading,
  detailRectangle,
  detailRow,
  detailTarget,
  detailText,
} from '../defaults.mjs';
export function drawPreferenceLoss(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      detailHeading(ctx, api, 'One ranking supplies six distinct comparisons');
      const built = cueVisible(ctx, api, 'six-pairs'),
        diff = cueVisible(ctx, api, 'reward-difference'),
        prob = cueComplete(ctx, api, 'reward-probability');
      const names = [
        'A · approval + citation',
        'B · approval only',
        'C · vague policy',
        'D · unsupported claim',
      ];
      names.forEach((s, i) =>
        detailRow(
          ctx,
          api,
          s,
          140,
          350 + i * 125,
          650,
          i < 2 ? themeColors.green : themeColors.muted,
        ),
      );
      const pairs = [
        ['A', 'B'],
        ['A', 'C'],
        ['A', 'D'],
        ['B', 'C'],
        ['B', 'D'],
        ['C', 'D'],
      ];
      detailTarget(ctx, api, 'ranking-pairs', () => {
        if (built)
          pairs.forEach(([a, z], i) => {
            const x = 900 + (i % 3) * 270,
              y = 355 + Math.floor(i / 3) * 115;
            detailRectangle(ctx, api, x, y, 220, 75, themeColors.cyan);
            detailText(ctx, api, a + ' ≻ ' + z, x + 110, y + 50, 30, themeColors.cyan, 'center');
          });
      });
      detailTarget(ctx, api, 'reward-difference', () => {
        if (diff) {
          detailEquation(ctx, api, 'r_w-r_l=2-0=2', 1300, 705, 42, themeColors.yellow);
          detailEquation(
            ctx,
            api,
            String.raw`P(w\succ l)=\frac{1}{1+e^{-(r_w-r_l)}}`,
            1300,
            805,
            39,
            themeColors.ink,
          );
        }
      });
      detailTarget(ctx, api, 'reward-probability', () => {
        if (prob) {
          detailText(
            ctx,
            api,
            'P = ' + (1 / (1 + Math.exp(-2))).toFixed(3),
            1300,
            905,
            40,
            themeColors.green,
            'center',
          );
          detailText(
            ctx,
            api,
            'Common reward shifts preserve the difference',
            1300,
            970,
            26,
            themeColors.muted,
            'center',
          );
        } else
          detailText(
            ctx,
            api,
            'Comparison probability pending',
            1300,
            905,
            29,
            themeColors.muted,
            'center',
          );
      });
      detailFooter(
        ctx,
        api,
        'The comparison says which answer wins; acceptable-target policy remains separate.',
      );
    } else if (currentBeat === 1) {
      detailHeading(ctx, api, 'From the reward’s optimal policy to a trainable relative reward');
      const ratios = cueVisible(ctx, api, 'policy-ratios'),
        cancel = cueVisible(ctx, api, 'cancel-partition'),
        canceled = cueComplete(ctx, api, 'cancel-partition');
      if (!ratios) detailText(ctx, api, 'Same prompt x', 960, 350, 30, themeColors.muted, 'center');
      ['Winner', 'Loser'].forEach((name, i) =>
        detailText(
          ctx,
          api,
          name,
          180,
          450 + i * 150,
          31,
          i ? themeColors.pink : themeColors.green,
        ),
      );
      detailTarget(ctx, api, 'policy-ratios', () => {
        if (ratios) {
          detailEquation(
            ctx,
            api,
            String.raw`\pi_r^*\text{ is the optimal policy for reward }r`,
            960,
            350,
            30,
            themeColors.blue,
          );
          ['Winner', 'Loser'].forEach((_, i) => {
            const y = 450 + i * 150;
            detailEquation(
              ctx,
              api,
              i
                ? String.raw`r_l=\beta\log\frac{\pi_r^*(y_l\mid x)}{\pi_{ref}(y_l\mid x)}+\beta\log Z(x)`
                : String.raw`r_w=\beta\log\frac{\pi_r^*(y_w\mid x)}{\pi_{ref}(y_w\mid x)}+\beta\log Z(x)`,
              1080,
              y,
              40,
              i ? themeColors.pink : themeColors.green,
            );
          });
        }
      });
      detailTarget(ctx, api, 'cancel-partition', () => {
        if (ratios && cancel) {
          detailEquation(
            ctx,
            api,
            String.raw`\beta\log Z(x)-\beta\log Z(x)` + (canceled ? '=0' : ''),
            960,
            700,
            34,
            themeColors.yellow,
          );
          if (canceled)
            detailEquation(
              ctx,
              api,
              String.raw`r_w-r_l=\beta\left[\log\frac{\pi_r^*(y_w\mid x)}{\pi_{ref}(y_w\mid x)}-\log\frac{\pi_r^*(y_l\mid x)}{\pi_{ref}(y_l\mid x)}\right]`,
              960,
              790,
              34,
              themeColors.yellow,
            );
        }
      });
      if (ratios && canceled) {
        detailText(
          ctx,
          api,
          'DPO parameterizes the relative reward with a trainable policy',
          960,
          860,
          28,
          themeColors.blue,
          'center',
        );
        detailEquation(
          ctx,
          api,
          String.raw`\Delta_\theta=\beta\left[\log\frac{\pi_\theta(y_w\mid x)}{\pi_{ref}(y_w\mid x)}-\log\frac{\pi_\theta(y_l\mid x)}{\pi_{ref}(y_l\mid x)}\right]`,
          960,
          945,
          34,
          themeColors.blue,
        );
      }
      detailFooter(
        ctx,
        api,
        'β > 0 · the reference assigns positive probability to both compared completions.',
      );
    } else {
      const f = preferenceFixture(),
        inputs = cueVisible(ctx, api, 'loss-inputs'),
        ratiosReady = cueComplete(ctx, api, 'loss-ratios'),
        marginReady = cueComplete(ctx, api, 'loss-margin'),
        answer = cueComplete(ctx, api, 'loss-result'),
        limit = cueVisible(ctx, api, 'relative-limit');
      detailHeading(ctx, api, 'Compute the supplied pair’s direct preference loss');
      const rows = [
        ['Winner', '0.4', '0.2', '2', '+0.693147'],
        ['Loser', '0.1', '0.2', '0.5', '−0.693147'],
      ];
      ['Completion', 'Policy', 'Reference', 'Ratio', 'Natural log'].forEach((s, i) =>
        detailText(
          ctx,
          api,
          s,
          [200, 600, 920, 1250, 1590][i],
          365,
          28,
          themeColors.muted,
          'center',
        ),
      );
      detailTarget(ctx, api, 'loss-inputs', () => {
        if (inputs)
          rows.forEach((r, i) =>
            r.forEach((s, j) => {
              if (j < 3)
                detailText(
                  ctx,
                  api,
                  s,
                  [200, 600, 920, 1250, 1590][j],
                  480 + i * 145,
                  j ? 36 : 31,
                  i ? themeColors.pink : themeColors.green,
                  'center',
                );
              else if (ratiosReady)
                detailTarget(ctx, api, 'loss-ratios', () =>
                  detailText(
                    ctx,
                    api,
                    s,
                    [200, 600, 920, 1250, 1590][j],
                    480 + i * 145,
                    36,
                    i ? themeColors.pink : themeColors.green,
                    'center',
                  ),
                );
            }),
          );
      });
      if (inputs) {
        if (!ratiosReady)
          detailTarget(ctx, api, 'loss-ratios', () =>
            detailText(ctx, api, 'Log ratios pending', 1440, 640, 28, themeColors.muted, 'center'),
          );
        detailTarget(ctx, api, 'loss-margin', () => {
          if (marginReady)
            detailEquation(
              ctx,
              api,
              String.raw`\Delta=0.5\,[\log 2-\log 0.5]=\log 2`,
              960,
              760,
              44,
              themeColors.yellow,
            );
          else
            detailText(
              ctx,
              api,
              'Scaled log-ratio difference pending',
              960,
              760,
              29,
              themeColors.muted,
              'center',
            );
        });
        detailTarget(ctx, api, 'loss-result', () => {
          if (answer) {
            detailEquation(
              ctx,
              api,
              String.raw`\sigma(\Delta)=\frac{2}{3}\quad\Rightarrow\quad-\log\sigma(\Delta)=0.405465`,
              960,
              870,
              46,
              themeColors.green,
            );
          } else
            detailText(
              ctx,
              api,
              'Pair probability and negative log loss pending',
              960,
              870,
              29,
              themeColors.muted,
              'center',
            );
        });
      }
      detailTarget(ctx, api, 'relative-limit', () => {
        if (limit)
          detailFooter(
            ctx,
            api,
            'Relative winner ≠ approved target; apply the both-bad export rule.',
          );
      });
      void f;
    }
  }
  return;
}
export default {
  id: 'preference-loss',
  draw: drawPreferenceLoss,
  cues: [
    'six-pairs',
    'reward-difference',
    'reward-probability',
    'policy-ratios',
    'cancel-partition',
    'loss-inputs',
    'loss-result',
    'relative-limit',
    'loss-ratios',
    'loss-margin',
  ],
};
