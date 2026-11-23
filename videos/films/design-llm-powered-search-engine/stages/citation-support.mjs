import { clamp, motion } from '../arithmetic.mjs';
import {
  chapterArrow,
  chapterParagraph,
  chapterRect,
  chapterSource,
  chapterText,
} from '../defaults.mjs';
export function drawCitationSupport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-citation-support-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-citation-support-' + name);
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
  const done = (name, index) => cue(name, index).done;
  api.focus.target('se-citation-support-mechanism', () => {
    if (currentBeat === 0) {
      const jobs = ['Resolution', 'Support', 'Coverage'],
        texts = [
          'Does the ID locate this permitted span?',
          'Does that span support this exact claim?',
          'Are all required claims and conditions covered?',
        ];
      jobs.forEach((name, i) => {
        const y = 350 + i * 180;
        chapterRect(
          ctx,
          api,
          170,
          y,
          1560,
          135,
          themeColors.panel,
          [themeColors.blue, themeColors.green, themeColors.yellow][i],
        );
        chapterText(
          ctx,
          api,
          name,
          200,
          y + 48,
          32,
          [themeColors.blue, themeColors.green, themeColors.yellow][i],
        );
        chapterParagraph(ctx, api, texts[i], 580, y + 78, 1100, 29);
      });
    } else if (currentBeat === 1) {
      const neg = done('negation', 1),
        para = done('paraphrase', 1);
      chapterSource(
        ctx,
        api,
        'Claim',
        'Security approval is required.',
        170,
        300,
        1560,
        themeColors.blue,
      );
      chapterSource(
        ctx,
        api,
        'Source A',
        neg ? 'Security approval is NOT required.' : 'Security approval is required.',
        170,
        565,
        740,
        neg ? themeColors.pink : themeColors.green,
      );
      chapterSource(
        ctx,
        api,
        'Source B',
        'Authorization from the security team is mandatory.',
        1000,
        565,
        730,
        themeColors.green,
      );
      if (done('acceptance', 1))
        chapterText(
          ctx,
          api,
          'Word check accepts the contradiction',
          190,
          875,
          27,
          themeColors.pink,
        );
      if (para)
        chapterText(
          ctx,
          api,
          'Word check rejects the paraphrase',
          1020,
          875,
          27,
          themeColors.yellow,
        );
    } else {
      chapterText(ctx, api, 'Held-out human labels', 180, 300, 33, themeColors.blue);
      const rows = [
        ['missing condition', 'false acceptance'],
        ['valid paraphrase', 'false rejection'],
        ['uncertain case', 'abstention'],
      ];
      rows.forEach(([name, result], i) => {
        const y = 420 + i * 160;
        chapterRect(ctx, api, 180, y, 680, 105, themeColors.panel, themeColors.blue);
        chapterText(ctx, api, name, 215, y + 66, 30);
        chapterArrow(ctx, api, 900, y + 52, 1030, y + 52, themeColors.yellow);
        chapterRect(ctx, api, 1080, y, 650, 105, themeColors.panel, themeColors.yellow);
        chapterText(ctx, api, result, 1120, y + 66, 30, themeColors.yellow);
      });
    }
  });
}
export default {
  id: 'citation-support',
  draw: drawCitationSupport,
  cues: [
    'se-citation-support-0',
    'se-citation-support-coverage',
    'se-citation-support-1',
    'se-citation-support-negation',
    'se-citation-support-acceptance',
    'se-citation-support-paraphrase',
    'se-citation-support-2',
    'se-citation-support-assessment',
  ],
};
