import { speculativeExpectation } from '../arithmetic.mjs';
import { capacityEvent } from '../construction.mjs';
import { drawCenteredText, drawFooter } from '../defaults.mjs';
export function drawSpeculativeRate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('speculative-rate-mechanism', () => {
    const bad = currentBeat === 2,
      verify = currentBeat === 1 && begun('verify', 1) ? 2 : 1,
      m = speculativeExpectation(4, bad ? 0.3 : 0.8, bad ? 0.15 : 0.1, verify);
    drawCenteredText(
      ctx,
      api,
      'IID survival model · γ=4 · α=' + m.alpha + ' · c=' + m.c + ' · v=' + m.v,
      960,
      300,
      33,
      themeColors.yellow,
    );
    const p =
      currentBeat === 0
        ? ev('formula', 0)
        : currentBeat === 1
          ? ev('expected', 1)
          : ev('expectedbad', 2);
    m.masses.forEach((mass, i) => {
      const x = 230 + i * 295,
        y = 790;
      api.rect(
        ctx,
        x,
        y - 380 * mass * p,
        170,
        380 * mass * p,
        i ? themeColors.cyan : themeColors.green,
        undefined,
        0,
      );
      drawCenteredText(
        ctx,
        api,
        'α' + ['⁰', '¹', '²', '³', '⁴'][i],
        x + 85,
        850,
        29,
        themeColors.muted,
      );
      if (p === 1)
        drawCenteredText(
          ctx,
          api,
          mass.toFixed(4),
          x + 85,
          y - 380 * mass - 35,
          28,
          themeColors.cyan,
        );
    });
    if (p === 1)
      drawCenteredText(
        ctx,
        api,
        'E[tokens] = ' + m.expected.toFixed(4),
        960,
        920,
        34,
        themeColors.green,
      );
    const result =
      currentBeat === 1
        ? done(verify === 2 ? 'verify' : 'cheap', 1)
        : currentBeat === 2
          ? done('slow', 2)
          : false;
    if (result)
      drawCenteredText(
        ctx,
        api,
        'cycle ' +
          m.cost.toFixed(2) +
          ' → rate ' +
          m.rate.toFixed(3) +
          '×' +
          (bad ? ' · time/token +' + ((m.timePerToken - 1) * 100).toFixed(1) + '%' : ''),
        960,
        980,
        34,
        bad ? themeColors.pink : themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      'Break-even: expected tokens per cycle = cycle time in ordinary decode steps',
    );
  });
}
export default {
  id: 'speculative-rate',
  draw: drawSpeculativeRate,
  cues: [
    'ic-speculative-rate-formula',
    'ic-speculative-rate-expected',
    'ic-speculative-rate-cheap',
    'ic-speculative-rate-verify',
    'ic-speculative-rate-expectedbad',
    'ic-speculative-rate-slow',
  ],
};
