import { clamp, motion } from '../arithmetic.mjs';
import {
  chapterFooter,
  chapterParagraph,
  chapterRect,
  chapterSource,
  chapterText,
} from '../defaults.mjs';
export function drawContextCompression(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-context-compression-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-context-compression-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress;
  api.focus.target('se-context-compression-mechanism', () => {
    const tokens = ['instructions', 'question', 'wrappers', 'evidence', 'answer reserve'],
      widths = [180, 180, 170, 680, 270];
    let x = 180;
    tokens.forEach((name, i) => {
      chapterRect(
        ctx,
        api,
        x,
        350,
        widths[i],
        115,
        i === 3 ? themeColors.panel : themeColors.blue,
        themeColors.muted,
      );
      chapterParagraph(
        ctx,
        api,
        name,
        x + 12,
        395,
        widths[i] - 24,
        24,
        i === 3 ? themeColors.ink : themeColors.bg,
      );
      x += widths[i] + 8;
    });
    chapterText(
      ctx,
      api,
      'One tokenizer contract for the complete prompt',
      160,
      285,
      33,
      themeColors.ink,
    );
    if (currentBeat === 0) {
      for (let i = 0; i < 3; i++)
        chapterSource(
          ctx,
          api,
          'Repeated policy ' + (i + 1),
          '30 days after notice',
          180 + i * 540,
          600,
          475,
          themeColors.blue,
        );
      chapterText(ctx, api, 'Exception slot missing', 180, 920, 32, themeColors.pink);
    } else if (currentBeat === 1) {
      const q = prog('position', 1);
      chapterRect(ctx, api, 180, 650, 1510, 110, themeColors.panel, themeColors.muted);
      const px = 500 + 850 * q;
      chapterRect(ctx, api, px, 660, 280, 90, themeColors.green);
      chapterText(ctx, api, 'Exception', px + 140, 718, 28, themeColors.bg, 'center');
      chapterText(ctx, api, 'Test positions on the chosen model', 180, 900, 32, themeColors.yellow);
    } else {
      const q = prog('compress', 2);
      chapterSource(
        ctx,
        api,
        'Original retained source',
        '60 days ONLY WITH SECURITY APPROVAL',
        180,
        590,
        740,
        themeColors.green,
      );
      chapterSource(
        ctx,
        api,
        'Compressed representation',
        q < 1 ? '60 days with approval' : '60 days ONLY WITH SECURITY APPROVAL',
        1030,
        590,
        660,
        q < 1 ? themeColors.yellow : themeColors.green,
      );
      chapterText(ctx, api, 'Original span mapping must survive', 180, 925, 31, themeColors.yellow);
    }
    chapterFooter(
      ctx,
      api,
      'Position experiments and model compression do not replace original evidence.',
    );
  });
}
export default {
  id: 'context-compression',
  draw: drawContextCompression,
  cues: [
    'se-context-compression-0',
    'se-context-compression-1',
    'se-context-compression-position',
    'se-context-compression-2',
    'se-context-compression-compress',
  ],
};
