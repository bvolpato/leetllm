import { cueBegun, cueProgress, wilsonBounds } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawUncertaintyGate(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    drawPromptText(ctx, api, s, x, y, size, color, align);
  const left = 760;
  const right = 1760;
  const scale = (rate) => left + ((right - left) * rate) / 0.2;
  const z = 1.96;
  const samples = [
    { n: 250, y: 491, reveal: 'bound-large' },
    { n: 20, y: 685, reveal: 'bound-small' },
  ];

  api.focus.target('bound-ruler', () => {
    text('Upper endpoint of the 95% Wilson interval', left, 286, 35);
    api.line(ctx, left, 379, right, 379, C.muted, 3);
    for (const rate of [0, 0.05, 0.1, 0.15, 0.2]) {
      const x = scale(rate);
      api.line(ctx, x, 370, x, 389, C.muted, 2);
      text(Math.round(100 * rate) + '%', x, 346, 29, C.muted, 'center');
    }
    const threshold = scale(0.02);
    api.line(ctx, threshold, 385, threshold, 751, C.yellow, 3);
    text('2% policy limit', threshold, 807, 29, C.yellow, 'center');
  });
  for (const { n, y, reveal } of samples) {
    if (n === 20 && !begun('bound-input')) continue;
    api.focus.target(n === 250 ? 'bound-250' : 'bound-20', () => {
      text('0 unsafe   /   ' + n + ' traces', 126, y, 42);
      if (begun('bound-formula')) {
        text('1.96² / (' + n + ' + 1.96²)', 128, y + 64, 33, C.blue);
      }
      api.circle(ctx, left, y, 8, C.cyan);
      const endpoint = wilsonBounds(0, n, z)[1];
      const p = cueProgress(state.cues, reveal, 0);
      if (p > 0) {
        const x = scale(p * endpoint);
        api.line(ctx, left, y, x, y, C.cyan, 8);
        api.circle(ctx, x, y, 12, C.cyan);
        if (after(reveal))
          text((100 * endpoint).toFixed(2) + '%', x - 12, y - 23, 38, C.cyan, 'right');
      }
    });
  }
  api.focus.target('bound-footer', () => {
    api.line(ctx, 125, 866, 1790, 866, C.muted, 2);
    const message = begun('bound-empty')
      ? 'Separate case with 0 trials   /   Rate undefined   ·   Gate fallback = 1'
      : after('bound-small')
        ? 'The smaller sample crosses the 2% limit.'
        : begun('bound-guess')
          ? 'Does the 20-trace sample clear the same 2% limit?'
          : 'Both the calculation and the policy use the upper endpoint.';
    text(message, 130, 953, 37, C.ink);
  });
}
export default {
  id: 'uncertainty-gate',
  draw: drawUncertaintyGate,
  cues: [
    'bound-start',
    'bound-formula',
    'bound-large',
    'bound-input',
    'bound-guess',
    'bound-small',
    'bound-empty',
    'bound-assumptions',
  ],
};
