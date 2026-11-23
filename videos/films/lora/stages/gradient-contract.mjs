import { adapterGradients } from '../model.mjs';
import { resultAfter } from '../construction.mjs';
import { num, point } from '../geometry.mjs';
import { text, rect, arrow, matrix } from '../defaults.mjs';
export function drawGradientContract(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('gradient-contract-mechanism', () => {
      if (beat === 0) {
        const zP = api.focus.progress('gradient-z', stage(0, 0.05, 0.2));
        const bP = api.focus.progress('gradient-b-outer', stage(0, 0.2, 0.4));
        const aP = api.focus.progress('gradient-a-outer', stage(0, 0.4, 0.65));
        const x = [2, 1],
          A = [[1, -0.5]],
          B = [[0.5], [1]],
          g = [1, -2];
        const grads = adapterGradients({
          A,
          B,
          x,
          g,
          scale: 2,
        });
        text(ctx, api, 'SUPPLIED SHAPES · s = 2', 190, 280, 29, themeColors.muted);
        text(ctx, api, 'x', 230, 355, 30, themeColors.cyan);
        matrix(
          ctx,
          api,
          x.map((v) => [v]),
          210,
          395,
          80,
          themeColors.cyan,
        );
        text(ctx, api, 'A', 460, 355, 30, themeColors.yellow);
        matrix(ctx, api, A, 420, 395, 80, themeColors.yellow);
        text(
          ctx,
          api,
          zP >= 0.999 ? `z = ${num(grads.z[0])}` : 'z = Ax',
          770,
          450,
          35,
          themeColors.yellow,
          'left',
          'mono',
        );
        text(ctx, api, 'incoming g', 1130, 355, 29, themeColors.pink);
        matrix(
          ctx,
          api,
          g.map((v) => [v]),
          1150,
          395,
          80,
          themeColors.pink,
        );
        text(ctx, api, 'B', 1450, 355, 30, themeColors.cyan);
        matrix(ctx, api, B, 1450, 395, 80, themeColors.cyan);
        if (bP > 0) {
          arrow(ctx, api, point(810, 485), point(810, 590), themeColors.yellow, 4);
          text(ctx, api, '∂L/∂B = s g zᵀ', 540, 665, 35, themeColors.yellow, 'left', 'mono');
          matrix(ctx, api, grads.gradB, 875, 615, 74, themeColors.yellow, {
            reveal: bP,
          });
        }
        if (aP > 0) {
          text(ctx, api, 'Bᵀg = −1.5', 1180, 690, 31, themeColors.pink, 'left', 'mono');
          text(ctx, api, '∂L/∂A = s (Bᵀg) xᵀ', 190, 875, 35, themeColors.cyan, 'left', 'mono');
          matrix(ctx, api, grads.gradA, 850, 815, 74, themeColors.cyan, {
            reveal: aP,
          });
        }
        text(
          ctx,
          api,
          'Outer products follow the actual forward path; optimizer decay is separate.',
          960,
          990,
          29,
          themeColors.muted,
          'center',
        );
      } else {
        const next = beat === 2,
          A = 1,
          B = next ? 0.1 : 0,
          x = 1,
          output = A * B * x,
          g = output - 1;
        const gReady = earned(next ? 'gradient-next-error' : 'gradient-first-b', beat, 0.15, 0.4);
        const aReady = next && resultAfter(state, 'gradient-next-a', 2);
        const stepReady = !next && earned('gradient-first-step', 1, 0.7, 0.9);
        text(
          ctx,
          api,
          'ACTUAL SCALAR SGD TRACE · half squared error · η = 0.1',
          190,
          285,
          29,
          themeColors.muted,
        );
        const positions = [190, 610, 1030, 1450];
        ['x = 1', 'A = 1', `B = ${num(B)}`, gReady ? `h = ${num(output)}` : 'h = ?'].forEach(
          (s, i) => {
            rect(
              ctx,
              api,
              positions[i],
              380,
              280,
              110,
              themeColors.panel,
              i === 2 ? themeColors.yellow : themeColors.blue,
            );
            text(
              ctx,
              api,
              s,
              positions[i] + 140,
              450,
              40,
              i === 2 ? themeColors.yellow : themeColors.blue,
              'center',
              'mono',
            );
            if (i < 3)
              arrow(
                ctx,
                api,
                point(positions[i] + 295, 435),
                point(positions[i + 1] - 15, 435),
                themeColors.muted,
                3,
              );
          },
        );
        text(ctx, api, 'target = 1', 1450, 550, 31, themeColors.pink);
        if (gReady) {
          text(ctx, api, `error g = ${num(g)}`, 1030, 650, 36, themeColors.pink, 'left', 'mono');
          arrow(ctx, api, point(1435, 660), point(1115, 660), themeColors.pink, 4);
          text(
            ctx,
            api,
            `∂L/∂B = ${num(g * A * x)}`,
            600,
            750,
            38,
            themeColors.yellow,
            'left',
            'mono',
          );
        }
        text(
          ctx,
          api,
          aReady ? `∂L/∂A = ${num(B * g * x)}` : next ? '∂L/∂A: pending' : '∂L/∂A = 0',
          190,
          650,
          38,
          aReady ? themeColors.cyan : themeColors.muted,
          'left',
          'mono',
        );
        if (stepReady)
          text(
            ctx,
            api,
            'B ← 0 − 0.1 × (−1) = 0.1',
            600,
            875,
            37,
            themeColors.green,
            'left',
            'mono',
          );
        if (next && earned('gradient-null-cases', 2, 0.55, 0.85)) {
          const cases = ['Ax = 0 → B waits', 'A = B = 0 → both wait', 'A = 0, B ≠ 0 → A can move'];
          cases.forEach((s, i) =>
            text(
              ctx,
              api,
              s,
              190 + i * 540,
              900,
              28,
              i === 2 ? themeColors.green : themeColors.muted,
            ),
          );
          text(
            ctx,
            api,
            'Batch contributions can cancel; nonzero A and B generally change the initial output.',
            190,
            980,
            28,
            themeColors.muted,
          );
        }
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'gradient-contract',
  draw: drawGradientContract,
  cues: [
    'gradient-contract-1',
    'gradient-z',
    'gradient-b-outer',
    'gradient-a-outer',
    'gradient-contract-2',
    'gradient-first-b',
    'gradient-first-step',
    'gradient-contract-3',
    'gradient-next-error',
    'gradient-next-a',
    'gradient-null-cases',
  ],
};
