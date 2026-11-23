import { cosine, maskedMean } from '../arithmetic.mjs';
import { FINANCE, RIVER, V } from '../fixtures.mjs';
import { focusTarget, rowMatrix, text } from '../defaults.mjs';
import { normalizeVector } from 'vizmatic';
export function drawContrast(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = (i) => (currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9));
  {
    const vectors = [V.bank, RIVER, FINANCE],
      names = ['lookup', 'river use', 'finance use'],
      colors = [themeColors.blue, themeColors.cyan, themeColors.green];
    focusTarget(ctx, api, 'contrast-object-similarity-to-river-19', () =>
      text(
        ctx,
        api,
        'Same stored row · different occurrence directions',
        960,
        275,
        33,
        themeColors.ink,
        'center',
      ),
    );
    ((paint) =>
      currentBeat < 2
        ? paint()
        : focusTarget(ctx, api, 'contrast-object-distribution-contrast-21', paint))(() => {
      if (currentBeat < 2) {
        const cue = state.cues?.['contrast-beat-1-focus-1'],
          amount =
            currentBeat > 0
              ? 1
              : cue
                ? cue.phase === 'before'
                  ? 0
                  : cue.phase === 'after'
                    ? 1
                    : (cue.progress ?? 0)
                : api.phase(progress, 0, 0.12);
        [V.river, V.money].forEach((clue, column) =>
          focusTarget(ctx, api, 'contrast-object-distribution-contrast-21', () => {
            const unit = normalizeVector(clue),
              left = 100 + column * 900,
              origin = {
                x: left + 170,
                y: 805,
              },
              scale = 285;
            api.line(ctx, origin.x, origin.y - 340, origin.x, origin.y + 30, themeColors.muted, 2);
            api.line(ctx, origin.x - 25, origin.y, origin.x + 340, origin.y, themeColors.muted, 2);
            api.arrow(
              ctx,
              origin.x,
              origin.y,
              origin.x + unit[0] * scale,
              origin.y - unit[1] * scale,
              themeColors.yellow,
              6,
            );
            text(
              ctx,
              api,
              column === 0 ? 'Unit river clue' : 'Unit money clue',
              left + 350,
              345,
              31,
              themeColors.yellow,
              'center',
            );
            vectors.forEach((v, i) => {
              const u = normalizeVector(v),
                dot = cosine(v, clue),
                tip = {
                  x: origin.x + u[0] * scale,
                  y: origin.y - u[1] * scale,
                },
                project = {
                  x: origin.x + unit[0] * dot * scale,
                  y: origin.y - unit[1] * dot * scale,
                };
              api.arrow(ctx, origin.x, origin.y, tip.x, tip.y, colors[i], 4);
              api.line(ctx, tip.x, tip.y, project.x, project.y, colors[i], 2);
              text(ctx, api, names[i], left + 460, 450 + i * 145, 29, colors[i]);
              api.rect(ctx, left + 460, 475 + i * 145, 260 * dot * amount, 25, colors[i], 4);
              if (amount === 1)
                text(ctx, api, dot.toFixed(3), left + 820, 500 + i * 145, 28, colors[i], 'right');
            });
          }),
        );
        if (currentBeat === 1) {
          components.card({
            label: 'bank · ID 0 · [0.50, 0.50]',
            x: 180,
            y: 945,
            width: 720,
            height: 70,
            fill: themeColors.panel,
            stroke: themeColors.blue,
            textColor: themeColors.blue,
            fontSize: 29,
            padding: 10,
          });
          text(
            ctx,
            api,
            'One stored row · two forward-pass occurrence states',
            1350,
            995,
            27,
            themeColors.muted,
            'center',
          );
        }
      } else {
        text(
          ctx,
          api,
          'Authored subword split: banking → bank + ing',
          960,
          360,
          32,
          themeColors.ink,
          'center',
        );
        const tokens = [
          {
            name: 'bank',
            v: V.bank,
            color: themeColors.blue,
          },
          {
            name: 'ing',
            v: V.water,
            color: themeColors.cyan,
          },
        ];
        tokens.forEach((v, i) => {
          components.card({
            label: v.name,
            x: 380 + i * 880,
            y: 445,
            width: 260,
            height: 85,
            fill: themeColors.panel,
            stroke: v.color,
            textColor: v.color,
            fontSize: 36,
            padding: 12,
          });
          rowMatrix(ctx, api, [v.v], 380 + i * 880, 575, v.color);
        });
        const amount = q(2),
          mean = maskedMean(
            tokens.map((v) => v.v),
            [1, 1],
          );
        api.arrow(ctx, 640, 775, 850, 850, themeColors.blue, 4);
        api.arrow(ctx, 1260, 775, 1070, 850, themeColors.cyan, 4);
        if (amount > 0) {
          text(
            ctx,
            api,
            amount === 1 ? 'Mean of both subtoken states' : 'Building the scaled mean',
            960,
            745,
            30,
            themeColors.yellow,
            'center',
          );
          rowMatrix(ctx, api, [mean.map((v) => v * amount)], 830, 890, themeColors.green);
        }
      }
    });
  }
}
export default {
  id: 'contrast',
  draw: drawContrast,
  cues: [
    'contrast-beat-1-focus-1',
    'contrast-beat-1-focus-2',
    'contrast-beat-2-focus-1',
    'contrast-beat-3-focus-1',
  ],
};
