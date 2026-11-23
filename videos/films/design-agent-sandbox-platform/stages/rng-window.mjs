import { clamp, motion, sandboxReadiness } from '../arithmetic.mjs';
import { drawArrow, drawCell, drawFooter, drawText } from '../defaults.mjs';
export function drawRngWindow(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-rng-window-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-rng-window-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-rng-window-mechanism', () => {
    if (currentBeat < 2) {
      const notified = currentBeat > 0 || resultComplete('notify', 0),
        kernel = currentBeat > 0 || resultComplete('kernel', 0),
        app = currentBeat === 1 && resultComplete('app', 1);
      drawCell(
        ctx,
        api,
        'VMGenID',
        notified ? 'new generation' : 'saved generation',
        180,
        340,
        700,
        themeColors.cyan,
      );
      drawCell(
        ctx,
        api,
        'Guest kernel RNG',
        kernel ? 'reseed handled' : 'driver handling pending',
        1010,
        340,
        700,
        kernel ? themeColors.green : themeColors.yellow,
      );
      drawArrow(ctx, api, 890, 390, 980, 390, themeColors.cyan);
      const names = [
        'app PRNG state',
        'pre-generated token',
        'application identifier',
        'saved boot identifier',
      ];
      names.forEach((n, i) =>
        drawCell(
          ctx,
          api,
          n,
          app ? 'copied value still present' : 'saved template value',
          180 + (i % 2) * 830,
          585 + Math.floor(i / 2) * 180,
          700,
          app ? themeColors.pink : themeColors.blue,
        ),
      );
      if (!kernel && notified)
        drawText(
          ctx,
          api,
          'Race window: CPUs resumed before guest handling completes',
          200,
          930,
          29,
          themeColors.pink,
        );
    } else {
      const gate = sandboxReadiness(
        ['clock', 'kernel randomness', 'application state', 'network', 'control']
          .slice(0, resultComplete('five', 2) ? 5 : 4)
          .map((name) => ({
            name,
            generation: 4,
            status: 'Pass',
          })),
      );
      gate.names.forEach((name, i) => {
        const x = 170 + (i % 3) * 550,
          y = 390 + Math.floor(i / 3) * 220;
        drawCell(
          ctx,
          api,
          name,
          gate.checks[i] ? 'Pass / g4' : 'missing',
          x,
          y,
          490,
          gate.checks[i] ? themeColors.green : themeColors.pink,
        );
      });
      drawText(
        ctx,
        api,
        gate.ready ? 'Five observations → READY' : 'User code HELD',
        190,
        930,
        39,
        gate.ready ? themeColors.green : themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Four overview groups and five actual Python names are explicitly separate contracts.',
    );
  });
}
export default {
  id: 'rng-window',
  draw: drawRngWindow,
  cues: [
    'sp-rng-window-0',
    'sp-rng-window-notify',
    'sp-rng-window-kernel',
    'sp-rng-window-1',
    'sp-rng-window-app',
    'sp-rng-window-2',
    'sp-rng-window-five',
  ],
};
