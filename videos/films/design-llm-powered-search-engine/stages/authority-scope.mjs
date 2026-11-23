import { clamp, motion } from '../arithmetic.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterLine,
  chapterMeter,
  chapterRect,
  chapterText,
} from '../defaults.mjs';
export function drawAuthorityScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-authority-scope-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-authority-scope-' + name);
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
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-authority-scope-mechanism', () => {
    const destinations = ['raw query', 'rewrite', 'parent fetch', 'reranker', 'preview', 'cache'],
      n = Math.max(1, Math.ceil(prog('0', 0) * 6));
    chapterText(
      ctx,
      api,
      'Authenticated workspace-a / engineering',
      180,
      300,
      33,
      themeColors.blue,
    );
    chapterLine(ctx, api, [180, 370], [1740, 370], themeColors.blue);
    destinations.forEach((name, i) => {
      const x = 190 + i * 270;
      chapterRect(
        ctx,
        api,
        x,
        440,
        235,
        150,
        themeColors.panel,
        i < n ? themeColors.blue : themeColors.muted,
      );
      chapterText(
        ctx,
        api,
        name,
        x + 118,
        485,
        25,
        i < n ? themeColors.blue : themeColors.muted,
        'center',
      );
      if (i < n) {
        chapterArrow(ctx, api, x + 118, 380, x + 118, 420, themeColors.blue);
        chapterText(ctx, api, 'workspace-a', x + 118, 535, 23, themeColors.cyan, 'center');
        chapterText(ctx, api, 'engineering', x + 118, 570, 23, themeColors.cyan, 'center');
      }
    });
    if (currentBeat === 1) {
      const q = prog('recheck', 1),
        x = 180 + 500 * q;
      chapterRect(ctx, api, 1050, 670, 660, 210, themeColors.panel, themeColors.yellow);
      chapterText(ctx, api, 'Current policy', 1080, 715, 30, themeColors.yellow);
      chapterText(
        ctx,
        api,
        q > 0.6 ? 'engineering grant: revoked' : 'engineering grant: present',
        1080,
        780,
        29,
        q > 0.6 ? themeColors.pink : themeColors.green,
      );
      chapterRect(ctx, api, x, 720, 270, 90, themeColors.panel, themeColors.blue);
      chapterText(ctx, api, 'policy@2', x + 135, 775, 29, themeColors.blue, 'center');
      chapterLine(ctx, api, [1005, 670], [1005, 900], themeColors.yellow);
      chapterText(ctx, api, 'Trusted check', 1005, 950, 27, themeColors.yellow, 'center');
      if (done('recheck', 1))
        chapterText(ctx, api, 'No text crosses', 1350, 845, 27, themeColors.pink, 'center');
    }
    if (currentBeat === 2) {
      const scoped = Math.log(1 + (2 - 1 + 0.5) / (1 + 0.5)),
        global = Math.log(1 + (4 - 1 + 0.5) / (1 + 0.5));
      chapterText(
        ctx,
        api,
        'Term: approval · appears in 1 document in either corpus',
        180,
        685,
        29,
        themeColors.ink,
      );
      chapterMeter(
        ctx,
        api,
        'Eligible N = 2 · illustrative IDF',
        Number(scoped.toFixed(6)),
        1.3,
        180,
        770,
        600,
        themeColors.blue,
      );
      chapterMeter(
        ctx,
        api,
        'Global N = 4 · illustrative IDF',
        Number(global.toFixed(6)),
        1.3,
        1050,
        770,
        600,
        themeColors.yellow,
      );
      chapterText(ctx, api, 'ln(1 + (N − df + .5) / (df + .5))', 180, 945, 29, themeColors.muted);
    }
    chapterFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Local scoring arithmetic illustrates the side channel; no Elastic benchmark or isolation proof.'
        : 'Every branch retains the same trusted principal; a proposed query cannot add membership.',
    );
  });
}
export default {
  id: 'authority-scope',
  draw: drawAuthorityScope,
  cues: [
    'se-authority-scope-0',
    'se-authority-scope-1',
    'se-authority-scope-recheck',
    'se-authority-scope-2',
    'se-authority-scope-statistics',
  ],
};
