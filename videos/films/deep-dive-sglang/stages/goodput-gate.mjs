import { phase } from '../arithmetic.mjs';
import { sgComplete } from '../construction.mjs';
import { box, extensionText, footer, rectangle, title } from '../defaults.mjs';
export function drawGoodputGate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('goodput-gate-mechanism', () => {
    title(ctx, api, 'Qualified completions / full duration · qualifying fraction / all offered');
    const a = currentBeat > 1 || (currentBeat === 1 && sgComplete(state, 'goodput-a')),
      z = currentBeat > 1 || (currentBeat === 1 && sgComplete(state, 'goodput-b')),
      selected = currentBeat > 1 || (currentBeat === 1 && sgComplete(state, 'goodput-select'));
    const cohort = (x, y, count, qualified, label, show) => {
      extensionText(ctx, api, label, x + 350, y - 35, 32, themeColors.blue, 'center');
      const cols = 10,
        cw = 58,
        ch = 25;
      for (let i = 0; i < count; i++)
        rectangle(
          ctx,
          api,
          x + (i % cols) * cw,
          y + Math.floor(i / cols) * (ch + 5),
          cw - 5,
          ch,
          themeColors.panel,
          i < qualified ? themeColors.green : themeColors.pink,
          2,
        );
      extensionText(
        ctx,
        api,
        qualified + ' / ' + count + ' supplied qualifying attempts',
        x + 280,
        y + Math.ceil(count / cols) * 30 + 60,
        28,
        themeColors.ink,
        'center',
      );
      if (show)
        extensionText(
          ctx,
          api,
          (qualified / 10).toFixed(1) + ' /s · ' + ((qualified / count) * 100).toFixed(1) + '%',
          x + 280,
          930,
          37,
          qualified / count >= 0.9 ? themeColors.green : themeColors.pink,
          'center',
        );
    };
    cohort(230, 440, 100, 92, '10 offered requests/s', a);
    cohort(1120, 440, 120, 105, '12 offered requests/s', z);
    if (selected)
      box(
        ctx,
        api,
        '90% gate: highest tested passing rate = 10 /s',
        390,
        310,
        1140,
        55,
        themeColors.green,
        29,
      );
    footer(
      ctx,
      api,
      'Ten-second supplied trials · rejected / failed / cancelled / late work stays in denominator',
    );
  });
}
export default {
  id: 'goodput-gate',
  draw: drawGoodputGate,
  cues: [
    'sg-goodput-gate-beat-0',
    'sg-goodput-gate-beat-1',
    'sg-goodput-a',
    'sg-goodput-b',
    'sg-goodput-select',
    'sg-goodput-gate-beat-2',
  ],
};
