import { ROUTING } from '../fixtures.mjs';
import { line, math, packet, rect, text, traced } from '../defaults.mjs';
export function drawTopTwo(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const fade = api.components.fade;
  {
    const mask = api.focus.progress('select-top-two', stage(0, 0.15, 0.72)),
      normalize = api.focus.progress('normalize-selected-gates', stage(1, 0.02, 0.35));
    api.focus.target('top-two-expert-probabilities-rounded', () =>
      text(ctx, api, 'EXPERT PROBABILITIES (ROUNDED)', 520, 285, 30, themeColors.muted, 'center'),
    );
    api.focus.target('top-two-selected-blend', () =>
      text(ctx, api, 'SELECTED BLEND', 1430, 285, 30, themeColors.muted, 'center'),
    );
    for (let i = 0; i < 4; i += 1) {
      const chosen = ROUTING.selected.includes(i),
        y = 345 + i * 128;
      api.focus.target(chosen ? 'winning-expert-probabilities' : 'other-expert-probabilities', () =>
        fade(chosen ? 1 : 1 - 0.6 * mask, () => {
          text(ctx, api, `E${i + 1}`, 170, y + 43, 34, colors[i]);
          rect(ctx, api, 250, y, ROUTING.probabilities[i] * 850, 60, colors[i], undefined, 7);
          text(
            ctx,
            api,
            ROUTING.probabilities[i].toFixed(3),
            800,
            y + 43,
            34,
            colors[i],
            'right',
            'mono',
          );
        }),
      );
      if (chosen) {
        const j = ROUTING.selected.indexOf(i);
        fade(mask, () => {
          const points = [
            {
              x: 850,
              y: y + 30,
            },
            {
              x: 1000,
              y: y + 30,
            },
            {
              x: 1080,
              y: 500 + j * 50,
            },
            {
              x: 1152,
              y: 500 + j * 50,
            },
          ];
          traced(ctx, api, points, mask, colors[i], 4);
          packet(ctx, api, points, normalize, colors[i], 12);
        });
      }
    }
    const y = 475,
      totalWidth = 580;
    const currentMass = api.lerp(ROUTING.selectedMass, 1, normalize);
    let x = 1160;
    api.focus.target('selected-gate-blend', () => {
      for (const [j, expert] of ROUTING.selected.entries()) {
        const width = totalWidth * ROUTING.weights[j] * currentMass;
        fade(mask, () => {
          rect(ctx, api, x, y, width, 100, colors[expert], themeColors.bg, 5);
          text(ctx, api, `E${expert + 1}`, x + width / 2, y + 65, 37, themeColors.bg, 'center');
        });
        x += width;
      }
      line(ctx, api, 1160, 600, 1740, 600, themeColors.muted, 2);
      for (const tick of [0, 1]) {
        line(ctx, api, 1160 + tick * 580, 590, 1160 + tick * 580, 610, themeColors.muted, 2);
        text(ctx, api, tick, 1160 + tick * 580, 655, 30, themeColors.muted, 'center');
      }
      fade(mask, () =>
        text(
          ctx,
          api,
          `mass ≈ ${currentMass.toFixed(3)}`,
          1450,
          740,
          38,
          themeColors.ink,
          'center',
          'mono',
        ),
      );
    });
    api.focus.reveal('normalize-selected-gates', () =>
      api.focus.target('gate-renormalization-rule', () => {
        math(
          ctx,
          api,
          String.raw`\tilde p_i=\frac{p_i}{p_1+p_3}`,
          1450,
          840,
          48,
          themeColors.ink,
          'center',
        );
      }),
    );
    if (!state.cues || state.cues['unit-gate-readout']?.phase === 'after')
      api.focus.target('selected-gate-blend', () => {
        text(
          ctx,
          api,
          `E1 ≈ ${ROUTING.weights[0].toFixed(6)} · E3 ≈ ${ROUTING.weights[1].toFixed(6)}`,
          1450,
          940,
          27,
          themeColors.ink,
          'center',
          'mono',
        );
      });
  }
}
export default {
  id: 'top-two',
  draw: drawTopTwo,
  cues: [
    'select-top-two',
    'unselected-stored',
    'normalize-selected-gates',
    'unit-gate-blend',
    'unit-gate-readout',
    'follow-selected-colors',
  ],
};
