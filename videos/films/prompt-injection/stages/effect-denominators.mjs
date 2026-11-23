import { cueBegun, wilsonBounds } from '../arithmetic.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawEffectDenominators(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);
  if (!begun('rates-report')) {
    const write = begun('trace-write');
    const disclosure = begun('trace-disclosure');
    const other = begun('trace-other');
    const effects = [Number(write) + Number(disclosure), 0];
    const unsafeTraces = effects.filter((count) => count > 0).length;
    const scored = after('trace-answer');

    text('Teaching traces   /   Tool doubles', 125, 285, 32, C.blue);
    for (const [index, id] of ['A', 'B'].entries()) {
      const shown = index === 0 || other;
      if (!shown) continue;
      const y = 465 + index * 212;
      api.focus.target('trace-' + id.toLowerCase(), () => {
        text('Trace ' + id, 130, y + 6, 43);
        api.line(ctx, 375, y, 1410, y, C.muted, 3);
        const events =
          index === 0
            ? [
                ['Write recorded', write, C.pink],
                ['Private field released', disclosure, C.pink],
              ]
            : [['Write denied', true, C.blue]];
        events.forEach(([label, visible, color], i) => {
          if (!visible) return;
          const x = 480 + 455 * i;
          api.circle(ctx, x, y, 13, color);
          text(label, x - 64, y - 46, 31, color);
        });
        text(
          effects[index] + (effects[index] === 1 ? ' effect' : ' effects'),
          1490,
          y + 8,
          37,
          C.ink,
        );
      });
    }
    api.focus.target('trace-score', () => {
      api.line(ctx, 125, 814, 1785, 814, C.muted, 2);
      if (scored) text(unsafeTraces + ' unsafe trace   /   2 attack traces', 130, 935, 52, C.cyan);
      else if (begun('trace-question'))
        text('How many traces go in the unsafe count?', 130, 935, 48, C.yellow);
      else text('Forbidden effects recorded   ' + effects.reduce((a, b) => a + b, 0), 130, 935, 42);
    });
    return;
  }

  const groups = [
    { id: 'asr', label: 'Attack traces', k: 10, n: 100, what: 'unsafe', ink: C.pink },
    { id: 'frr', label: 'Benign requests', k: 40, n: 1000, what: 'blocked', ink: C.yellow },
  ];
  text('Supplied evaluation counts', 130, 279, 32, C.blue);
  for (const [i, { id, label, k, n, what, ink }] of groups.entries()) {
    const y = 424 + 248 * i;
    api.focus.target('rate-' + id, () => {
      if (i === 1 && !begun('rates-benign')) return;
      text(label, 130, y, 43);
      text(
        k + ' ' + what + '   /   ' + n.toLocaleString('en-US') + ' evaluated',
        130,
        y + 74,
        35,
        ink,
      );
      const rate = k / n;
      text((100 * rate).toFixed(0) + '%', 922, y + 46, 68, ink);
      api.line(ctx, 125, y + 127, 1780, y + 127, C.muted, 2);
      if (after('rates-intervals')) {
        const [low, high] = wilsonBounds(k, n).map((p) => (100 * p).toFixed(1) + '%');
        text(low + ' to ' + high, 1245, y + 33, 40, ink);
        text('95% Wilson interval', 1245, y + 88, 28, C.muted);
      }
    });
  }
}
export default {
  id: 'effect-denominators',
  draw: drawEffectDenominators,
  cues: [
    'trace-intro',
    'trace-write',
    'trace-disclosure',
    'trace-other',
    'trace-question',
    'trace-answer',
    'rates-report',
    'rates-benign',
    'rates-intervals',
  ],
};
