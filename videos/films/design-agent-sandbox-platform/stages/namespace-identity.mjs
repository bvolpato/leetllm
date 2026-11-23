import { clamp, mix, motion } from '../arithmetic.mjs';
import { drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawNamespaceIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-namespace-identity-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-namespace-identity-' + name);
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
    cueProgress = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-namespace-identity-mechanism', () => {
    const q = currentBeat === 0 ? 0 : currentBeat === 1 ? cueProgress('separate', 1) : 1,
      separate = q > 0;
    drawRectangle(ctx, api, 170, 315, separate ? 720 : 1560, 470, themeColors.blue);
    drawText(
      ctx,
      api,
      separate ? 'namespace A' : 'one shared network namespace',
      205,
      365,
      31,
      themeColors.blue,
    );
    if (separate) {
      drawRectangle(ctx, api, 1030, 315, 700, 470, themeColors.pink);
      drawText(ctx, api, 'namespace B', 1065, 365, 31, themeColors.pink);
    }
    const xs = [260, mix(1070, 1160, q)];
    xs.forEach((x, i) => {
      drawRectangle(ctx, api, x, 440, 420, 240, i ? themeColors.pink : themeColors.cyan);
      drawText(ctx, api, 'TAP tap0', x + 30, 510, 32, i ? themeColors.pink : themeColors.cyan);
      drawText(ctx, api, 'guest 172.16.0.2', x + 30, 575, 29);
      drawText(ctx, api, 'MAC / guest settings', x + 30, 640, 26, themeColors.muted);
    });
    if (!separate && currentBeat === 0 && resultComplete('conflict', 0))
      drawText(
        ctx,
        api,
        'Two tap0 owners collide in one namespace',
        210,
        860,
        34,
        themeColors.pink,
      );
    if (currentBeat === 2) {
      drawText(
        ctx,
        api,
        'Local repetition ≠ global routing or egress authority',
        210,
        860,
        31,
        themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        resultComplete('control', 2)
          ? 'Old connection closed → fresh g4 control session'
          : 'Old restored control connection is unusable',
        210,
        930,
        30,
        themeColors.green,
      );
    } else
      drawFooter(
        ctx,
        api,
        separate
          ? 'Separate namespaces permit repeated local names; routes and filters remain explicit.'
          : 'TAP is a host object; guest address and MAC are separate state.',
      );
  });
}
export default {
  id: 'namespace-identity',
  draw: drawNamespaceIdentity,
  cues: [
    'sp-namespace-identity-0',
    'sp-namespace-identity-conflict',
    'sp-namespace-identity-1',
    'sp-namespace-identity-separate',
    'sp-namespace-identity-2',
    'sp-namespace-identity-control',
  ],
};
