import { FINANCE, RIVER, V } from '../fixtures.mjs';
import { equation, focusTarget, text, vector } from '../defaults.mjs';
import { lerpArray } from 'vizmatic';
export function drawContext(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = (i) => (currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9));
  {
    const a = teaching.axes({
      x: 160,
      y: 450,
      width: 1100,
      height: 410,
      equalUnits: true,
      xDomain: [0, 1.1],
      yDomain: [0, 1.1],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'toy coordinate 1',
      yLabel: 'toy coordinate 2',
      fontSize: 26,
    });
    text(
      ctx,
      api,
      'Same bank ID 0 · sentence-owned clues',
      700,
      285,
      29,
      themeColors.ink,
      'center',
    );
    const clueWords = currentBeat === 0 ? ['river', 'water'] : ['deposit', 'money'],
      clueColors =
        currentBeat === 0
          ? [themeColors.yellow, themeColors.cyan]
          : [themeColors.muted, themeColors.yellow];
    clueWords.forEach((word, i) =>
      components.card({
        label: word,
        x: 380 + i * 330,
        y: 320,
        width: 230,
        height: 70,
        fill: themeColors.panel,
        stroke: clueColors[i],
        textColor: clueColors[i],
        fontSize: 29,
        padding: 10,
      }),
    );
    vector(ctx, api, a, V.bank, '#8d9cb966');
    vector(ctx, api, a, lerpArray(V.bank, RIVER, q(0)), themeColors.cyan);
    vector(ctx, api, a, lerpArray(V.bank, FINANCE, q(1)), themeColors.green);
    const finance = currentBeat > 0,
      amount = finance ? q(1) : q(0),
      parts = finance
        ? [V.bank.map((v) => -0.5 * v), V.money.map((v) => 0.5 * v)]
        : [V.bank.map((v) => -0.5 * v), V.river.map((v) => 0.4 * v), V.water.map((v) => 0.1 * v)];
    let at = [...V.bank];
    parts.forEach((part, i) => {
      const next = at.map((v, j) => v + amount * part[j]),
        start = a.point(...at),
        end = a.point(...next);
      api.arrow(
        ctx,
        start.x,
        start.y,
        end.x,
        end.y,
        [themeColors.pink, themeColors.yellow, themeColors.cyan][i],
        4,
      );
      at = next;
    });
    focusTarget(
      ctx,
      api,
      'context-object-finance-financial-occurrence-river-bank-occurrence-11',
      () =>
        text(
          ctx,
          api,
          finance ? 'Financial occurrence' : 'River-bank occurrence',
          1510,
          360,
          32,
          finance ? themeColors.green : themeColors.cyan,
          'center',
        ),
    );
    focusTarget(ctx, api, 'context-object-target-weighted-mix-12', () =>
      text(ctx, api, 'Target weighted mix', 1510, 430, 25, themeColors.muted, 'center'),
    );
    focusTarget(
      ctx,
      api,
      'context-equation-finance-string-raw-0-5-mathrm-bank-0-5-mathrm-mone-13',
      () =>
        equation(
          ctx,
          api,
          finance
            ? String.raw`0.5\,\mathrm{bank}+0.5\,\mathrm{money}`
            : String.raw`0.5\,\mathrm{bank}+0.4\,\mathrm{river}+0.1\,\mathrm{water}`,
          1510,
          490,
          30,
          themeColors.yellow,
          'center',
        ),
    );
    text(
      ctx,
      api,
      `Current [${at.map((v) => v.toFixed(3)).join(', ')}]`,
      1510,
      620,
      30,
      themeColors.ink,
      'center',
    );
    text(
      ctx,
      api,
      `Pink leg: ${(-0.5 * amount).toFixed(2)} × lookup`,
      1510,
      715,
      27,
      themeColors.pink,
      'center',
    );
    text(
      ctx,
      api,
      `Yellow leg: +${((finance ? 0.5 : 0.4) * amount).toFixed(2)} × ${finance ? 'money' : 'river'}`,
      1510,
      785,
      27,
      themeColors.yellow,
      'center',
    );
    if (!finance)
      text(
        ctx,
        api,
        `Cyan leg: +${(0.1 * amount).toFixed(2)} × water`,
        1510,
        855,
        27,
        themeColors.cyan,
        'center',
      );
    focusTarget(
      ctx,
      api,
      'context-equation-string-raw-h-i-text-lookup-text-context-update-18',
      () =>
        equation(
          ctx,
          api,
          String.raw`h_i=\text{lookup}+\text{context update}`,
          960,
          1030,
          42,
          themeColors.ink,
          'center',
        ),
    );
  }
}
export default {
  id: 'context',
  draw: drawContext,
  cues: [
    'context-beat-1-focus-1',
    'context-beat-2-focus-1',
    'context-beat-2-focus-2',
    'context-beat-3-focus-1',
    'context-beat-3-focus-2',
  ],
};
