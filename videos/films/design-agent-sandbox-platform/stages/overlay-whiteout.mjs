import { clamp, motion } from '../arithmetic.mjs';
import { drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawOverlayWhiteout(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-overlay-whiteout-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-overlay-whiteout-' + name);
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
  api.focus.target('sp-overlay-whiteout-mechanism', () => {
    const fresh = currentBeat === 2 && resultComplete('fresh', 2),
      copy = currentBeat > 1 || (currentBeat === 1 && resultComplete('copy', 1)),
      white = !fresh && (currentBeat > 1 || (currentBeat === 1 && resultComplete('whiteout', 1)));
    const names = ['lower · immutable', 'upper · private', 'work · private', 'merged · user view'];
    names.forEach((n, i) => {
      const x = 170 + i * 420;
      drawRectangle(
        ctx,
        api,
        x,
        330,
        350,
        480,
        i === 0 ? themeColors.blue : i === 3 ? themeColors.green : themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        n,
        x + 20,
        380,
        26,
        i === 0 ? themeColors.blue : i === 3 ? themeColors.green : themeColors.yellow,
      );
    });
    drawText(ctx, api, 'config.txt', 190, 470, 26, themeColors.blue, 'left', 'mono');
    drawText(ctx, api, 'clean lower bytes', 190, 525, 25, themeColors.blue);
    if (!fresh && copy) {
      drawText(
        ctx,
        api,
        white ? 'whiteout config.txt' : 'config.txt = A bytes',
        610,
        470,
        24,
        white ? themeColors.pink : themeColors.yellow,
        'left',
        'mono',
      );
      drawText(ctx, api, 'output.csv', 610, 580, 25, themeColors.yellow, 'left', 'mono');
    }
    drawText(ctx, api, 'overlay operations', 1030, 480, 24, themeColors.muted);
    drawText(ctx, api, 'not user-visible', 1030, 540, 24, themeColors.muted);
    drawText(
      ctx,
      api,
      white ? 'config.txt absent' : !fresh && copy ? 'config.txt = A bytes' : 'config.txt = clean',
      1450,
      470,
      24,
      white ? themeColors.pink : themeColors.green,
      'left',
      'mono',
    );
    if (!fresh && copy)
      drawText(ctx, api, 'output.csv visible', 1450, 580, 24, themeColors.green, 'left', 'mono');
    if (currentBeat === 2) {
      drawText(
        ctx,
        api,
        fresh
          ? 'New upper / work; old output absent'
          : 'Retire old generation before backing disposal',
        200,
        900,
        32,
        fresh ? themeColors.green : themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Host owns backing storage; guest owns mounts. Whiteout leaves lower bytes intact.',
    );
  });
}
export default {
  id: 'overlay-whiteout',
  draw: drawOverlayWhiteout,
  cues: [
    'sp-overlay-whiteout-0',
    'sp-overlay-whiteout-mount',
    'sp-overlay-whiteout-1',
    'sp-overlay-whiteout-copy',
    'sp-overlay-whiteout-whiteout',
    'sp-overlay-whiteout-2',
    'sp-overlay-whiteout-fresh',
  ],
};
