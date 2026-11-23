import { sum } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { drawExtensionsEquation, drawExtensionsFocus, drawExtensionsText } from '../defaults.mjs';
import assert from 'node:assert/strict';
export function drawEnergyCutoff(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const sigma = [6, 3, 1],
      energy = sigma.map((x) => x * x),
      total = sum(energy),
      k =
        currentBeat === 0
          ? 0
          : currentBeat === 1 && event(state, 1, 'retain-first') < 1
            ? 0
            : currentBeat === 1 && event(state, 1, 'retain-second') < 1
              ? 1
              : 2,
      retained = sum(energy.slice(0, k)),
      ratio = retained / total;
    assert.equal(total, 46);
    assert.equal(sum(energy.slice(0, 2)), 45);
    assert.equal(Math.sqrt(sum(energy.slice(2))), 1);
    drawExtensionsText(
      ctx,
      api,
      'Toy spectrum · singular strengths become squared areas',
      960,
      295,
      32,
      themeColors.muted,
    );
    const discussDiscard = currentBeat === 2 && event(state, 2, 'task-relevance') > 0;
    sigma.forEach((value, i) => {
      const x = 260 + i * 570,
        unit = 48,
        top = 730 - value * unit,
        seen =
          currentBeat === 0
            ? Math.max(
                0,
                Math.min(
                  energy[i],
                  Math.floor(46 * event(state, 0, 'square-areas')) - sum(energy.slice(0, i)),
                ),
              )
            : energy[i];
      for (let row = 0; row < value; row++)
        for (let col = 0; col < value; col++)
          api.rect(
            ctx,
            x + col * unit,
            top + row * unit,
            unit - 4,
            unit - 4,
            i < k
              ? themeColors.cyan
              : currentBeat === 0 && row * value + col < seen
                ? themeColors.blue
                : discussDiscard && i === 2 ? themeColors.pink : themeColors.panel,
            i < k ? themeColors.cyan : themeColors.muted,
            1,
          );
      drawExtensionsText(
        ctx,
        api,
        'σ' + (i + 1) + ' = ' + value,
        x + (value * unit) / 2,
        top - 35,
        33,
        i < k ? themeColors.cyan : themeColors.muted,
      );
      drawExtensionsText(
        ctx,
        api,
        value + '² = ' + (seen === energy[i] ? energy[i] : '?'),
        x + (value * unit) / 2,
        790,
        38,
        i < k ? themeColors.cyan : themeColors.muted,
      );
    });
    const start = 220,
      width = 1470,
      top = 865;
    let left = start;
    energy.forEach((value, i) => {
      const w = (width * value) / total;
      api.rect(
        ctx,
        left,
        top,
        w,
        55,
        i < k ? themeColors.cyan : discussDiscard && i === 2 ? themeColors.pink : themeColors.panel,
        themeColors.muted,
        1,
      );
      left += w;
    });
    const limit = start + 0.95 * width;
    api.line(ctx, limit, top - 20, limit, top + 85, themeColors.yellow, 4);
    drawExtensionsText(ctx, api, '95%', limit, top - 45, 30, themeColors.yellow);
    drawExtensionsFocus(ctx, api, 'energy-receipt', () => {
      if (currentBeat === 0)
        drawExtensionsEquation(
          ctx,
          api,
          `E_{seen}=${Math.floor(46 * event(state, 0, 'square-areas'))}`,
          960,
          1000,
          46,
          themeColors.muted,
        );
      else if (discussDiscard)
        drawExtensionsText(ctx, api, 'Discarded: 1 of 46 energy units. Does routing need this direction?', 960, 1000, 36, themeColors.pink);
      else if (k)
        drawExtensionsEquation(
          ctx,
          api,
          `E_{retained}=${retained}/${total}=${ratio.toFixed(4)}`,
          960,
          1000,
          46,
          themeColors.green,
        );
      else
        drawExtensionsText(
          ctx,
          api,
          'First retained fraction: ?',
          960,
          1000,
          36,
          themeColors.yellow,
        );
    });
    drawExtensionsText(
      ctx,
      api,
      currentBeat > 1 || (currentBeat === 1 && event(state, 1, 'rank-answer') === 1)
        ? 'Smallest passing rank: 2'
        : 'What smallest rank reaches 95%?',
      960,
      370,
      40,
      themeColors.yellow,
    );
    return;
  }
  return;
}
export default {
  id: 'energy-cutoff',
  draw: drawEnergyCutoff,
  cues: [
    'predict-rank',
    'square-areas',
    'retain-second',
    'retain-first',
    'rank-answer',
    'task-relevance',
  ],
};
