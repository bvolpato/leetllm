import { BLENDED_OUTPUT, ROUTING } from '../fixtures.mjs';
import { circle, line, link, math, node, text } from '../defaults.mjs';
export function drawWeightedOutput(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const fade = api.components.fade;
  {
    const scaleA = api.focus.progress('weight-first-expert', stage(1, 0.21, 0.49)),
      scaleB = api.focus.progress('weight-third-expert', stage(1, 0.52, 0.7));
    const add = api.focus.progress('join-weighted-arrows', stage(2, 0.01, 0.15)),
      result = state.cues
        ? state.cues['combined-vector']?.phase === 'after'
          ? 1
          : 0
        : api.focus.progress('combined-vector', stage(2, 0.18, 0.3));
    const origin = {
        x: 830,
        y: 820,
      },
      unit = 155;
    const weightedA = [2 * api.lerp(1, ROUTING.weights[0], scaleA), 0];
    const weightedB = [0, 3 * api.lerp(1, ROUTING.weights[1], scaleB)];
    const a = {
      x: origin.x + unit * weightedA[0],
      y: origin.y,
    };
    const bOrigin = {
      x: api.lerp(origin.x, a.x, add),
      y: origin.y,
    };
    const b = {
      x: bOrigin.x,
      y: bOrigin.y - unit * weightedB[1],
    };
    api.focus.target('weighted-output-tiny-linear-expert-example', () =>
      text(ctx, api, 'TINY LINEAR EXPERT EXAMPLE', 410, 285, 29, themeColors.muted, 'center'),
    );
    const input = {
      x: 180,
      y: 415,
      width: 190,
      height: 120,
    };
    const first = {
        x: 505,
        y: 350,
        width: 200,
        height: 100,
      },
      third = {
        x: 505,
        y: 590,
        width: 200,
        height: 100,
      };
    link(ctx, api, input, first, themeColors.blue, 4);
    link(ctx, api, input, third, themeColors.yellow, 4);
    api.focus.target('same-token-input', () =>
      node(ctx, api, input, 'same x', themeColors.cyan, 32),
    );
    api.focus.target('first-expert-output', () => {
      node(ctx, api, first, 'E1', themeColors.blue, 38);
      math(ctx, api, String.raw`[2,0]`, 605, 500, 42, themeColors.blue, 'center');
    });
    api.focus.target('third-expert-output', () => {
      node(ctx, api, third, 'E3', themeColors.yellow, 38);
      math(ctx, api, String.raw`[0,3]`, 605, 742, 42, themeColors.yellow, 'center');
    });
    api.focus.reveal('weight-first-expert', () =>
      api.focus.target('first-expert-output', () =>
        text(
          ctx,
          api,
          `gate ≈ ${ROUTING.weights[0].toFixed(6)}`,
          605,
          555,
          27,
          themeColors.blue,
          'center',
          'mono',
        ),
      ),
    );
    api.focus.reveal('weight-third-expert', () =>
      api.focus.target('third-expert-output', () =>
        text(
          ctx,
          api,
          `gate ≈ ${ROUTING.weights[1].toFixed(6)}`,
          605,
          805,
          27,
          themeColors.yellow,
          'center',
          'mono',
        ),
      ),
    );
    for (let i = 0; i <= 4; i += 1) {
      const x = origin.x + unit * i,
        y = origin.y - unit * i;
      if (x < 1600) line(ctx, api, x, 315, x, 845, '#8d9cb922', 1);
      if (y > 300) line(ctx, api, 810, y, 1600, y, '#8d9cb922', 1);
    }
    line(ctx, api, 810, origin.y, 1640, origin.y, themeColors.muted, 3);
    line(ctx, api, origin.x, 850, origin.x, 295, themeColors.muted, 3);
    api.focus.target('first-expert-output', () =>
      api.arrow(ctx, origin.x, origin.y, a.x, a.y, themeColors.blue, 7),
    );
    api.focus.target('third-expert-output', () =>
      api.arrow(ctx, bOrigin.x, bOrigin.y, b.x, b.y, themeColors.yellow, 7),
    );
    api.focus.target('combined-expert-output', () =>
      fade(result, () => api.arrow(ctx, origin.x, origin.y, b.x, b.y, themeColors.cyan, 7)),
    );
    circle(ctx, api, origin.x, origin.y, 7, themeColors.ink);
    api.focus.target('first-expert-output', () =>
      text(
        ctx,
        api,
        `≈ ${weightedA[0].toFixed(3)}`,
        (origin.x + a.x) / 2,
        origin.y + 65,
        34,
        themeColors.blue,
        'center',
        'mono',
      ),
    );
    api.focus.target('third-expert-output', () =>
      text(
        ctx,
        api,
        `≈ ${weightedB[1].toFixed(3)}`,
        b.x + 55,
        b.y - 25,
        34,
        themeColors.yellow,
        'left',
        'mono',
      ),
    );
    api.focus.target('combined-expert-output', () => {
      text(ctx, api, 'combined output', 1460, 490, 30, themeColors.muted, 'center');
      fade(result, () => {
        const output = `≈ [${BLENDED_OUTPUT.map((value) => value.toFixed(3)).join(', ')}]`;
        text(ctx, api, output, 1460, 430, 40, themeColors.cyan, 'center', 'mono');
      });
    });
    api.focus.reveal('combined-vector', () =>
      api.focus.target('mixture-rule', () =>
        math(
          ctx,
          api,
          String.raw`y=\tilde p_1 E_1(x)+\tilde p_3 E_3(x)`,
          960,
          970,
          46,
          themeColors.ink,
          'center',
        ),
      ),
    );
  }
}
export default {
  id: 'weighted-output',
  draw: drawWeightedOutput,
  cues: [
    'same-expert-input',
    'unweighted-expert-results',
    'weight-first-expert',
    'weight-third-expert',
    'join-weighted-arrows',
    'combined-vector',
  ],
};
