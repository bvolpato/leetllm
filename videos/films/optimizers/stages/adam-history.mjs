import { PRESCRIBED } from '../fixtures.mjs';
import { clamp, fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawHistoryMechanismsMath,
  drawHistoryMechanismsTarget,
  drawHistoryMechanismsText,
} from '../defaults.mjs';
function compareHistory(ctx, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const q = (id, b, from, to) => cueProgress(state, id, b, from, to);
  const second = q('hist-second', 0, 0.33, 0.44);
  const fourth = q('hist-four', 1, 0.53, 0.72);
  const t = fourth > 0 ? (fourth < 0.5 ? 3 : 4) : second > 0 ? 2 : 1;
  const r = PRESCRIBED[t - 1];
  api.text(
    ctx,
    'Supplied gradients    ·    β₁ = 0.9    ·    β₂ = 0.999    ·    η = 0.01',
    170,
    235,
    33,
    C.muted,
  );
  api.focus.target('hist-second', () =>
    api.focus.target('hist-four', () => {
      for (const [i, sample] of PRESCRIBED.entries()) {
        const x = 320 + 430 * i;
        const active = i + 1 === t;
        api.text(ctx, 'Input ' + (i + 1), x, 332, 29, C.muted, 'center');
        api.text(
          ctx,
          '(' + sample.gradient.join(', ') + ')',
          x,
          397,
          42,
          active ? C.cyan : C.muted,
          'center',
        );
        if (active) api.line(ctx, x - 120, 423, x + 120, 423, C.cyan, 4);
      }
    }),
  );
  if (beat === 0) {
    const reveal = t === 1 ? q('hist-first', 0, 0.08, 0.24) : q('hist-second-sum', 0, 0.47, 0.68);
    api.focus.target('hist-first', () =>
      api.focus.target('hist-second-sum', () => {
        for (const [i, stored] of [r.mean[0], r.square[0]].entries()) {
          const y = 582 + 172 * i;
          const old = i ? r.oldSquare[0] : r.oldMean[0];
          const color = i ? C.yellow : C.cyan;
          const amount = old + (stored - old) * reveal;
          api.text(ctx, i ? 'Squared memory  v' : 'Signed memory  m', 180, y + 13, 41, color);
          api.line(ctx, 760, y, 1630, y, C.muted, 3);
          api.circle(ctx, 760 + old * 47, y, 10, C.bg, C.muted, 3);
          api.line(ctx, 760, y, 760 + amount * 47, y, color, 7);
          api.circle(ctx, 760 + amount * 47, y, 10, color);
          if (reveal === 1)
            api.text(ctx, fmt(stored, 3), 760 + stored * 47, y - 32, 39, color, 'center');
        }
      }),
    );
    if (t === 2) api.text(ctx, 'Will Adam turn when RMSProp turns?', 960, 962, 46, C.ink, 'center');
    return;
  }
  if (fourth === 0) {
    const origin = 1005;
    api.focus.target('hist-directions', () => {
      api.text(ctx, 'Change in parameter a', origin, 511, 35, C.muted, 'center');
      for (const [i, [name, update, color]] of [
        ['RMSProp', r.rmsUpdate[0], C.yellow],
        ['Adam', r.adamUpdate[0], C.cyan],
      ].entries()) {
        const p = i ? q('hist-directions', 1, 0.25, 0.4) : q('hist-rms-direction', 1, 0.08, 0.23);
        const y = 630 + i * 174;
        api.text(ctx, name, 180, y + 13, 44, color);
        api.line(ctx, 590, y, 1720, y, C.muted, 3);
        api.line(ctx, origin, y - 16, origin, y + 16, C.ink, 3);
        const tip = origin - update * p * 32000;
        if (p > 0) api.arrow(ctx, origin, y, tip, y, color, 7);
        if (p === 1)
          api.text(
            ctx,
            'Δa ≈ ' + (-update > 0 ? '+' : '') + fmt(-update, 5),
            tip,
            y - 46,
            36,
            color,
            'center',
          );
      }
      api.text(ctx, '0', origin, 877, 31, C.muted, 'center');
    });
    return;
  }
  api.focus.target('hist-four', () =>
    api.text(
      ctx,
      'a     m = ' + fmt(r.mean[0]) + '       v ≈ ' + fmt(r.square[0]),
      180,
      515,
      38,
      C.ink,
    ),
  );
  for (const [j, id] of ['hist-update', 'hist-shallow'].entries()) {
    const p = q(id, 1, j ? 0.81 : 0.71, j ? 0.89 : 0.8);
    const y = 657 + 142 * j,
      x = 680;
    const color = j ? C.green : C.cyan;
    api.focus.target(id, () => {
      api.text(ctx, (j ? 'b' : 'a') + '  ·  subtracted step', 180, y + 10, 36, color);
      api.line(ctx, x, y, x + 990, y, C.muted, 2);
      if (p > 0) api.line(ctx, x, y, x + r.adamUpdate[j] * 99000 * p, y, color, 7);
      if (p === 1)
        api.text(
          ctx,
          '≈ ' + fmt(r.adamUpdate[j], 5),
          x + r.adamUpdate[j] * 99000,
          y - 28,
          36,
          color,
          'center',
        );
    });
  }
  api.focus.target('hist-variance', () =>
    api.text(ctx, 'v averages squared gradients', 960, 970, 38, C.yellow, 'center'),
  );
}

export function drawAdamHistory(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  if (currentBeat < 2) return compareHistory(ctx, state, api);
  drawHistoryMechanismsText(
    ctx,
    api,
    themeColors,
    'ZERO-START CHECK · separate repeated-gradient example',
    170,
    240,
    29,
    themeColors.muted,
  );
  drawHistoryMechanismsText(
    ctx,
    api,
    themeColors,
    'g = 4 · η = 0.01 · β₁ = 0.9 · β₂ = 0.999',
    240,
    345,
    34,
    themeColors.cyan,
  );
  const p = phase('observed-weights', 2),
    weights = [2, 1, 0].map((age) => (1 - 0.9) * 0.9 ** age);
  drawHistoryMechanismsTarget(ctx, api, 'observed-weights', () => {
    drawHistoryMechanismsText(
      ctx,
      api,
      themeColors,
      'Weights of the three observations, enlarged',
      240,
      470,
      34,
      themeColors.ink,
    );
    api.text(ctx, 'Of total weight', 240, 757, 30, themeColors.ink);
    api.rect(ctx, 490, 728, 470, 34, themeColors.panel, themeColors.muted, 3);
    api.text(ctx, '1', 978, 757, 29, themeColors.muted);
    let x = 260;
    let totalX = 490;
    for (const [i, weight] of weights.entries()) {
      const amount = clamp(p * 3 - i),
        width = weight * 2600;
      if (amount > 0) {
        ctx.save();
        try {
          ctx.globalAlpha *= amount;
          api.rect(
            ctx,
            totalX,
            728,
            weight * 470,
            34,
            [themeColors.muted, themeColors.cyan, themeColors.yellow][i],
            undefined,
            2,
          );
          api.rect(
            ctx,
            x,
            540,
            width,
            70,
            [themeColors.muted, themeColors.cyan, themeColors.yellow][i],
            undefined,
            2,
          );
        } finally {
          ctx.restore();
        }
      }
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'g' + (i + 1) + ' × ' + fmt(weight),
        x,
        665,
        27,
        [themeColors.muted, themeColors.cyan, themeColors.yellow][i],
      );
      x += width;
      totalX += weight * 470;
    }
  });
  drawHistoryMechanismsTarget(ctx, api, 'weight-denominator', () => {
    if (phase('weight-denominator', 2) === 1) {
      drawHistoryMechanismsMath(
        ctx,
        api,
        themeColors,
        '\\sum \\text{observed weights}=1-\\beta^t',
        1150,
        535,
        37,
        themeColors.green,
      );
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'At t = 3: 0.271',
        1150,
        625,
        34,
        themeColors.green,
      );
      drawHistoryMechanismsMath(
        ctx,
        api,
        themeColors,
        '\\hat m_t=\\frac{m_t}{1-\\beta^t}',
        1150,
        730,
        43,
        themeColors.green,
      );
    } else
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'Observed-weight denominator = ?',
        1150,
        580,
        30,
        themeColors.muted,
      );
  });
  drawHistoryMechanismsTarget(ctx, api, 'uncorrected-step', () => {
    drawHistoryMechanismsText(
      ctx,
      api,
      themeColors,
      phase('uncorrected-step', 2) === 1
        ? 'Raw-buffer first step ≈ 0.03162'
        : 'Raw-buffer first step = ?',
      240,
      865,
      33,
      themeColors.cyan,
    );
  });
  drawHistoryMechanismsTarget(ctx, api, 'corrected-step', () => {
    if (phase('corrected-step', 2) === 1) {
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'Corrected first step ≈ 0.01',
        1150,
        865,
        33,
        themeColors.green,
      );
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'Separate comparison: first update t = 1',
        240,
        975,
        30,
        themeColors.muted,
      );
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'Correct startup weights; retain changing-history lag.',
        960,
        1040,
        30,
        themeColors.ink,
        'center',
      );
    } else
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'Corrected first step = ?',
        1150,
        865,
        33,
        themeColors.green,
      );
  });
}
export default {
  id: 'adam-history',
  draw: drawAdamHistory,
  cues: [
    'hist-first',
    'hist-second',
    'hist-second-sum',
    'hist-rms-direction',
    'hist-directions',
    'hist-four',
    'hist-update',
    'hist-shallow',
    'hist-variance',
    'observed-weights',
    'weight-denominator',
    'uncorrected-step',
    'corrected-step',
  ],
};
