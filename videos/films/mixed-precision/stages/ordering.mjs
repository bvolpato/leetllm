import { accumulationState } from '../model.mjs';
import { completed, operation, partProgress } from '../construction.mjs';
import { card, equation, text, valueBox, movingValue } from '../defaults.mjs';
function drawUnequalTokens(ctx, scene, state, api) {
  if ((state.beat ?? 0) < 3) return false;
  const { C } = api;
  api.focus.target('ordering-extension-4', () => {
    text(
      ctx,
      api,
      'Keep all four token contributions in one denominator',
      960,
      280,
      37,
      C.cyan,
      'center',
    );
    const group = operation(state, 'unequal-group');
    const arrived = Math.floor(group * 3);
    [2, -2, -2, -2].forEach((value, i) => {
      const x = 230 + i * 390;
      valueBox(
        ctx,
        api,
        (value > 0 ? '+' : '−') + Math.abs(value),
        x,
        375,
        260,
        i ? C.pink : C.blue,
        42,
      );
      text(ctx, api, i ? 'Group B' : 'Group A', x + 130, 350, 26, C.muted, 'center');
      const amount = i ? partProgress(group, i - 1, 3) : operation(state, 'unequal-first');
      api.arrow(ctx, x + 130, 485, i ? 1250 : 450, 590, C.muted, 3);
      movingValue(ctx, api, [x + 130, 485], [i ? 1250 : 450, 590], amount, i ? C.pink : C.blue);
    });
    valueBox(
      ctx,
      api,
      completed(state, 'unequal-first') ? 'A sum = +2 · count 1' : 'A accumulation pending',
      180,
      600,
      620,
      completed(state, 'unequal-first') ? C.blue : C.muted,
      29,
    );
    valueBox(
      ctx,
      api,
      completed(state, 'unequal-group')
        ? 'B sum = −6 · count 3'
        : `B partial sum ${-2 * arrived} · ${arrived}/3 arrived`,
      1100,
      600,
      620,
      C.pink,
      29,
    );
    const mean = operation(state, 'unequal-mean');
    api.arrow(ctx, 490, 710, 960, 770, C.green, 3);
    api.arrow(ctx, 1410, 710, 960, 770, C.green, 3);
    movingValue(ctx, api, [490, 710], [960, 770], mean, C.green);
    movingValue(ctx, api, [1410, 710], [960, 770], mean, C.green);
    valueBox(
      ctx,
      api,
      completed(state, 'unequal-mean')
        ? 'Full-token mean: (+2 − 6) / (1 + 3) = −1'
        : 'Combine sums and valid-token counts',
      300,
      790,
      1320,
      completed(state, 'unequal-mean') ? C.green : C.muted,
      32,
    );
    text(
      ctx,
      api,
      completed(state, 'unequal-means')
        ? 'Mean of group means: (2 + (−6 / 3)) / 2 = 0 · wrong token weighting'
        : 'Compare the group-average shortcut only after the full-token reduction',
      960,
      970,
      30,
      completed(state, 'unequal-means') ? C.pink : C.muted,
      'center',
    );
    text(
      ctx,
      api,
      'Short final window: use its actual count. All masked: skip before division.',
      960,
      1040,
      27,
      C.muted,
      'center',
    );
  });
  return true;
}
export function drawOrdering(ctx, scene, state, api) {
  if (drawUnequalTokens(ctx, scene, state, api)) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const current = accumulationState(currentBeat, progress, state.cues),
      vector = (v) => '[' + v.map((x) => Number(x.toFixed(3))).join(', ') + ']';
    if (currentBeat === 0) {
      const scale = 1024;
      const norm = 0.02;
      const limit = 1;
      const scaled = scale * norm;
      const proper = Math.min(scaled / scale, limit);
      const premature = Math.min(scaled, limit) / scale;
      const wrong = operation(state, 'clip-too-early');
      const right = operation(state, 'clip-in-units');
      text(
        ctx,
        api,
        'Scaled norm   ' + scaled + '      ÷      Loss scale   ' + scale,
        960,
        276,
        47,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Clip limit = 1 in original gradient units',
        960,
        354,
        34,
        themeColors.ink,
        'center',
      );
      const start = 545,
        end = 1650;
      const rows = [
        {
          name: 'Clip first',
          id: 'early-clip',
          y: 540,
          p: wrong,
          color: themeColors.pink,
          result: premature,
          math: 'min(20.48, 1) ÷ 1024',
          label: '1/1024 ≈ ' + premature.toFixed(6),
        },
        {
          name: 'Unscale first',
          id: 'true-clip',
          y: 815,
          p: right,
          color: themeColors.cyan,
          result: proper,
          math: 'min(20.48 ÷ 1024, 1)',
          label: String(proper),
        },
      ];
      for (const row of rows) {
        api.focus.target(row.id, () => {
          text(ctx, api, row.name, 130, row.y + 12, 39, row.color);
          text(
            ctx,
            api,
            row.math + ' = ' + (row.p === 1 ? row.label : '?'),
            start,
            row.y - 72,
            41,
            row.p === 1 ? row.color : themeColors.ink,
          );
          api.line(ctx, start, row.y, end, row.y, themeColors.muted, 3);
          api.line(ctx, start, row.y - 12, start, row.y + 12, themeColors.muted, 3);
          api.line(ctx, end, row.y - 12, end, row.y + 12, themeColors.muted, 3);
          text(ctx, api, '0', start, row.y + 57, 29, themeColors.muted, 'center');
          text(ctx, api, '0.02', end, row.y + 57, 29, themeColors.muted, 'center');
          if (row.p > 0) {
            const x = start + (end - start) * (1 + row.p * (row.result / norm - 1));
            api.line(ctx, start, row.y, x, row.y, row.color, 8);
            api.circle(ctx, x, row.y, 11, row.color);
          }
        });
      }
      text(
        ctx,
        api,
        'Length shows the norm the optimizer receives',
        960,
        990,
        31,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        'One optimizer window · fixed scale 256',
        960,
        280,
        38,
        themeColors.ink,
        'center',
      );
      current.contributions.forEach((g, i) => {
        const done = i < current.completed,
          x = 180 + i * 550;
        api.focus.target('microbatch-gradients', () =>
          card(
            ctx,
            api,
            'Microbatch ' + (i + 1) + ': ' + vector(g),
            x,
            365,
            500,
            done ? themeColors.cyan : themeColors.muted,
          ),
        );
        if (done) {
          text(
            ctx,
            api,
            '× 256 → ' + vector(g.map((v) => v * 256)),
            x + 250,
            510,
            27,
            themeColors.cyan,
            'center',
          );
          api.arrow(ctx, x + 250, 540, 960, 620, themeColors.cyan, 3);
        }
      });
      api.focus.target('accumulation-buffer', () =>
        card(
          ctx,
          api,
          'FP32 buffer   ' + vector(current.scaled),
          560,
          650,
          800,
          themeColors.yellow,
        ),
      );
      if (current.unscaleVisible) {
        card(
          ctx,
          api,
          'Unscale once: ' + vector(current.unscaled),
          560,
          785,
          800,
          themeColors.green,
        );
        api.arrow(ctx, 960, 750, 960, 770, themeColors.green, 3);
      }
      text(
        ctx,
        api,
        current.stepVisible
          ? 'Finite → clip if needed → optimizer step'
          : current.finiteVisible
            ? 'Finite check passes'
            : current.unscaleVisible
              ? 'All three contributions arrived before unscale'
              : 'Each completed microbatch adds to this identified buffer',
        960,
        980,
        30,
        current.finiteVisible ? themeColors.green : themeColors.muted,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Normalize over the complete active-token window',
        960,
        285,
        37,
        themeColors.ink,
        'center',
      );
      const counts = [2, 1, 3],
        sums = [1, 1, 3];
      counts.forEach((count, i) => {
        api.focus.target('token-counts', () =>
          card(
            ctx,
            api,
            'Batch ' + (i + 1) + ' · ' + count + ' active token' + (count === 1 ? '' : 's'),
            180 + i * 550,
            390,
            500,
            themeColors.cyan,
          ),
        );
        text(ctx, api, 'Loss sum ' + sums[i], 430 + i * 550, 535, 31, themeColors.cyan, 'center');
      });
      api.focus.target('normalized-loss', () =>
        equation(
          ctx,
          api,
          current.normalize >= 1
            ? 'L=(1+1+3)/(2+1+3)=5/6'
            : 'L=\\frac{\\sum_i\\text{loss sum}_i}{\\sum_i\\text{active tokens}_i}',
          960,
          690,
          50,
          themeColors.yellow,
          'center',
        ),
      );
      if (current.amplify === 1)
        equation(
          ctx,
          api,
          'SL=256\\cdot\\frac56\\approx' + Number(((256 * 5) / 6).toFixed(3)),
          960,
          830,
          49,
          themeColors.green,
          'center',
        );
      text(
        ctx,
        api,
        'Checkpoint: scaler state + optimizer state + data progress',
        960,
        980,
        31,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'ordering',
  draw: drawOrdering,
  cues: [
    'clip-too-early',
    'clip-in-units',
    'first-batch',
    'second-batch',
    'third-batch',
    'window-unscale',
    'window-finite',
    'window-step',
    'ordering-b3-1',
    'ordering-b3-2',
    'ordering-extension-4',
    'unequal-first',
    'unequal-group',
    'unequal-mean',
    'unequal-means',
  ],
};
