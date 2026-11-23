import { clamp, motion } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawCleanTemplate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-clean-template-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-clean-template-' + name);
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
  api.focus.target('sp-clean-template-mechanism', () => {
    const sealed = resultComplete('seal', 0),
      auth = resultComplete('auth', 1);
    drawRectangle(ctx, api, 160, 300, 1600, 115, themeColors.blue);
    drawText(ctx, api, 'Boot kernel → runtime → supervisor', 200, 375, 35, themeColors.blue);
    drawText(ctx, api, 'No tenant inputs / customer keys / jobs', 200, 470, 31, themeColors.pink);
    ['memory backing', 'versioned machine state', 'matching disk backing'].forEach((n, i) => {
      const x = 170 + i * 550;
      drawRectangle(ctx, api, x, 560, 490, 170, sealed ? themeColors.cyan : themeColors.muted);
      drawText(ctx, api, n, x + 25, 625, 28);
      drawText(
        ctx,
        api,
        sealed ? 'sealed artifact' : 'not yet sealed',
        x + 25,
        685,
        28,
        sealed ? themeColors.cyan : themeColors.muted,
      );
    });
    if (currentBeat === 1) {
      drawText(
        ctx,
        api,
        auth
          ? 'Authenticated provenance + integrity required'
          : 'Checksum covers accidental corruption',
        210,
        850,
        32,
        auth ? themeColors.green : themeColors.yellow,
      );
    }
    if (currentBeat === 2) {
      drawCell(ctx, api, 'Snapshot load', 'returned', 180, 805, 590, themeColors.blue);
      drawCell(
        ctx,
        api,
        'User admission',
        'HELD · required checks missing',
        930,
        805,
        800,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Backing remains immutable and available until every restored mapping is retired.',
    );
  });
}
export default {
  id: 'clean-template',
  draw: drawCleanTemplate,
  cues: [
    'sp-clean-template-0',
    'sp-clean-template-seal',
    'sp-clean-template-1',
    'sp-clean-template-auth',
    'sp-clean-template-2',
    'sp-clean-template-held',
  ],
};
