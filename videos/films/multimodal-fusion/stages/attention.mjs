import { TEXT_STATE, VISUAL_KEYS, VISUAL_VALUES } from '../fixtures.mjs';
import { cue } from '../arithmetic.mjs';
import { attentionConstruction } from '../construction.mjs';
import { drawOriginalCard, drawOriginalEquation, text as drawOriginalText } from '../defaults.mjs';
export function drawAttention(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress2 = api.clamp(state.beatP ?? 0);
  {
    const calc = attentionConstruction(beat, progress2, state.cues),
      colors = [themeColors.blue, themeColors.green, themeColors.pink],
      subs = ['₁', '₂', '₃'];
    const vector = (values) => '[' + values.map((v) => v.toFixed(3)).join(', ') + ']';
    drawOriginalText(
      ctx,
      api,
      beat === 1 ? 'How much does each slot contribute to the first coordinate?' : 'One text query reads three visual memory slots',
      960,
      275,
      34,
      themeColors.ink,
      'center',
    );
    api.focus.target('attention-query', () =>
      drawOriginalText(
        ctx,
        api,
        'Q = h = [0.20, 0.10, 0.70]',
        960,
        340,
        31,
        themeColors.yellow,
        'center',
      ),
    );
    if (beat === 0) {
      ['Visual key', 'Q · K products', 'Scaled score'].forEach((label, i) =>
        drawOriginalText(
          ctx,
          api,
          label,
          [380, 955, 1535][i],
          405,
          27,
          themeColors.muted,
          'center',
        ),
      );
      VISUAL_KEYS.forEach((key, i) => {
        const y = 475 + i * 135;
        api.focus.target('attention-key-vectors', () =>
          drawOriginalCard(
            ctx,
            api,
            'K' + subs[i] + ' ' + vector(key),
            140,
            y - 20,
            465,
            76,
            colors[i],
            26,
          ),
        );
        api.focus.target('attention-dot-construction', () => {
          const terms = calc.products[i].map((v, j) =>
            calc.productProgress[i][j] === 1 ? v.toFixed(3) : '…',
          );
          drawOriginalText(ctx, api, terms.join(' + '), 955, y, 27, colors[i], 'center');
          drawOriginalText(
            ctx,
            api,
            (calc.productProgress[i].every((v) => v === 1) ? 'Dot = ' : 'Partial dot = ') +
              calc.dot[i].toFixed(3),
            955,
            y + 49,
            25,
            themeColors.muted,
            'center',
          );
        });
        api.focus.target('attention-scaled-scores', () => {
          api.rect(
            ctx,
            1360,
            y - 10,
            Math.max(1, calc.scaled[i] * 480),
            34,
            colors[i],
            undefined,
            0,
          );
          teaching.changeCue(
            {
              x: 1335,
              y: y + 30,
              width: 400,
              height: 58,
              from: calc.raw[i],
              to: calc.raw[i] / Math.sqrt(3),
              progress: calc.divide,
              color: colors[i],
            },
            (cue) =>
              drawOriginalText(
                ctx,
                api,
                calc.divide === 0
                  ? 'Await scaling'
                  : (calc.divide === 1
                      ? '÷ √3 = '
                      : '÷ ' + (1 + calc.divide * (Math.sqrt(3) - 1)).toFixed(3) + ' = ') +
                      calc.scaled[i].toFixed(3),
                1535,
                y + 69,
                27,
                cue.color,
                'center',
              ),
          );
        });
      });
      api.focus.target('attention-score-formula', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`s_i=\frac{\sum_{j=1}^{3}Q_jK_{ij}}{\sqrt{3}}`,
          960,
          935,
          38,
          themeColors.ink,
        ),
      );
    } else if (beat === 1) {
      const normalizer = calc.exps.reduce((a, b) => a + b, 0);
      const normalized = calc.normalize === 1;
      const finished = calc.contributions.every((row) => row.fraction >= 1 - 1e-12);
      api.focus.target('attention-softmax-operation', () => {
        const title = normalized ? 'Weight × first value' : 'Exponentiate each score, then divide by their sum';
        drawOriginalText(ctx, api, title, 944, 406, 35, themeColors.ink, 'center');
      });
      VISUAL_VALUES.forEach((value, i) => {
        const y = 500 + 120 * i;
        api.focus.target('attention-value-vectors', () => {
          drawOriginalText(ctx, api, 'Slot ' + (i + 1), 170, y + 6, 39, colors[i]);
          drawOriginalText(ctx, api, vector(value), 390, y + 5, 32, colors[i]);
        });
        const part = calc.contributions[i];
        api.focus.target('attention-softmax-operation', () => {
          if (normalized) return;
          const numerator = Math.exp(calc.logits[i] * calc.expProgress);
          const divisor = 1 + (normalizer - 1) * calc.normalize;
          drawOriginalText(ctx, api, numerator.toFixed(3) + ' ÷ ' + divisor.toFixed(3), 950, y + 6, 39, colors[i], 'center');
        });
        api.focus.target('attention-weighted-values', () => {
          if (!normalized) return;
          const result = part.fraction >= 1 - 1e-12 ? part.values[0].toFixed(3) : '…';
          drawOriginalText(ctx, api, calc.weights[i].toFixed(3) + ' × ' + value[0].toFixed(3) + ' = ' + result, 950, y + 6, 40, colors[i], 'center');
          if (part.values[0] > 0) api.rect(ctx, 1260, y + 38, part.values[0] * 650, 24, colors[i], undefined, 0);
        });
      });
      api.focus.target('attention-attended-sum', () => {
        const sumLabel = finished ? 'First coordinate = ' + calc.attended[0].toFixed(3)
          : calc.contributions.some((row) => row.fraction > 0) ? 'Adding the three contributions' : 'First coordinate = ?';
        drawOriginalText(ctx, api, sumLabel,
          960, 887, 44, themeColors.ink, 'center');
        let cursor = 565;
        calc.contributions.forEach((row, i) => {
          const width = row.values[0] * 2400;
          if (width > 0) api.rect(ctx, cursor, 918, width, 43, colors[i], undefined, 0);
          cursor += width;
        });
      });
      if (cue(state, 'attention-largest-share', 1, 0.78, 0.94) > 0 && finished) {
        const rows = calc.contributions.map((row) => row.values[0]);
        const winner = rows.indexOf(Math.max(...rows));
        api.focus.target('attention-weighted-values', () =>
          drawOriginalText(ctx, api, `Slot ${winner + 1} supplies ${rows[winner].toFixed(3)} of ${calc.attended[0].toFixed(3)}`,
            960, 1025, 35, colors[winner], 'center'));
      }
    } else {
      drawOriginalText(
        ctx,
        api,
        'Attended A = ' + vector(calc.attended),
        960,
        405,
        29,
        themeColors.cyan,
        'center',
      );
      api.focus.target('attention-residual-formula', () =>
        drawOriginalEquation(ctx, api, String.raw`h'=h+\tanh(g)A`, 960, 485, 39, themeColors.ink),
      );
      api.focus.target('attention-residual-coordinates', () =>
        TEXT_STATE.forEach((base, i) => {
          const x = 225 + i * 535,
            y = 635,
            added = calc.gateStrength * calc.attended[i],
            scale = 430;
          drawOriginalText(
            ctx,
            api,
            'Coordinate ' + (i + 1),
            x + 200,
            580,
            28,
            themeColors.muted,
            'center',
          );
          api.rect(ctx, x, y, base * scale, 75, themeColors.blue, undefined, 0);
          if (added > 0)
            api.rect(ctx, x + base * scale, y, added * scale, 75, themeColors.green, undefined, 0);
          drawOriginalText(
            ctx,
            api,
            'Base ' + base.toFixed(3) + ' + visual ' + added.toFixed(3),
            x + 200,
            760,
            27,
            themeColors.ink,
            'center',
          );
          drawOriginalText(
            ctx,
            api,
            'h′' + subs[i] + ' = ' + calc.fused[i].toFixed(3),
            x + 200,
            820,
            31,
            themeColors.cyan,
            'center',
          );
        }),
      );
      api.focus.target('attention-learned-gate-value', () =>
        teaching.changeCue(
          {
            x: 400,
            y: 880,
            width: 1120,
            height: 78,
            from: 0,
            to: 0.35,
            progress: calc.gateProgress,
            color: themeColors.green,
          },
          (cue) =>
            drawOriginalText(
              ctx,
              api,
              'g = ' + cue.value.toFixed(3) + ' · tanh(g) = ' + calc.gateStrength.toFixed(3),
              960,
              935,
              32,
              cue.color,
              'center',
            ),
        ),
      );
    }
  }
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'attention-query-keys',
    'attention-query-scores',
    'attention-scale-scores',
    'attention-softmax-normalize',
    'attention-weight-values',
    'attention-largest-share',
    'attention-zero-gate',
    'attention-learned-gate',
  ],
};
