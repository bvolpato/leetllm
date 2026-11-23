import { clamp, motion } from '../arithmetic.mjs';
import { chapterFooter, chapterMeter, chapterRect, chapterText } from '../defaults.mjs';
export function drawMiniatureRun(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-miniature-run-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-miniature-run-' + name);
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
  api.focus.target('se-miniature-run-mechanism', () => {
    const entries = [
      ['policy@1', 'obsolete', themeColors.pink],
      ['policy@2', 'current + allowed', themeColors.blue],
      ['exception@1', 'current + allowed', themeColors.green],
      ['roadmap@1', 'workspace-b', themeColors.pink],
    ];
    chapterText(ctx, api, 'Actual corpus and current authority', 160, 285, 33, themeColors.blue);
    entries.forEach(([name, status, color], i) => {
      const y = 350 + i * 105;
      chapterRect(ctx, api, 170, y, 730, 80, themeColors.panel, color);
      chapterText(ctx, api, name, 195, y + 52, 29, color);
      chapterText(ctx, api, status, 485, y + 52, 26, color);
    });
    if (done('eligible', 0) || currentBeat > 0) {
      chapterText(ctx, api, 'Eligible ranking', 1110, 380, 30, themeColors.muted);
      chapterText(ctx, api, 'exception@1 → policy@2', 1060, 470, 32, themeColors.green);
    }
    if (currentBeat > 0) {
      const q = prog('wordsum', 1);
      chapterMeter(
        ctx,
        api,
        'Exception: 15 words',
        15,
        40,
        1050,
        580,
        550,
        themeColors.green,
        q > 0,
      );
      chapterMeter(ctx, api, 'Policy: 12 words', 12, 40, 1050, 725, 550, themeColors.blue, q > 0);
      if (done('wordsum', 1) || currentBeat > 1)
        chapterText(ctx, api, '27 / 40 words', 1070, 925, 34, themeColors.yellow);
    }
    if (currentBeat === 2) {
      const checks = ['current access', 'digest', 'start 0', 'full end', 'exact text'],
        n = Math.ceil(prog('checks', 2) * 5);
      checks.forEach((x, i) =>
        chapterText(
          ctx,
          api,
          (i < n ? '✓ ' : '○ ') + x,
          180 + i * 320,
          850,
          25,
          i < n ? themeColors.green : themeColors.muted,
        ),
      );
      if (done('publish', 2))
        chapterText(
          ctx,
          api,
          'Publish both complete quotations',
          960,
          955,
          32,
          themeColors.green,
          'center',
        );
    }
    chapterFooter(
      ctx,
      api,
      'Word-budget fixture; target-tokenizer sizing and semantic support remain separate.',
    );
  });
}
export default {
  id: 'miniature-run',
  draw: drawMiniatureRun,
  cues: [
    'se-miniature-run-0',
    'se-miniature-run-eligible',
    'se-miniature-run-1',
    'se-miniature-run-wordsum',
    'se-miniature-run-quote',
    'se-miniature-run-2',
    'se-miniature-run-checks',
    'se-miniature-run-publish',
  ],
};
