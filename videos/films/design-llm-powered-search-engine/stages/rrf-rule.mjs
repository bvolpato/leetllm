import { clamp, motion, rrfContributions, sum } from '../arithmetic.mjs';
import { chapterFooter, chapterRect, chapterText } from '../defaults.mjs';
export function drawRrfRule(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-rrf-rule-' + name];
    if (state.cues && !q) throw Error('Undeclared or absent current-scene cue se-rrf-rule-' + name);
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
  api.focus.target('se-rrf-rule-mechanism', () => {
    const lists = [
        ['Policy', 'Policy', 'Exception'],
        ['Exception', 'Policy'],
      ],
      dedup = done('dedup', 0) || currentBeat > 0,
      shown = dedup ? lists.map((x) => [...new Set(x)]) : lists;
    chapterText(
      ctx,
      api,
      'One contribution per identity in each branch',
      150,
      285,
      33,
      themeColors.ink,
    );
    shown.forEach((list, i) => {
      chapterText(
        ctx,
        api,
        i ? 'Dense' : 'Lexical',
        160,
        405 + i * 155,
        30,
        i ? themeColors.cyan : themeColors.blue,
      );
      list.forEach((name, j) => {
        chapterRect(
          ctx,
          api,
          475 + j * 395,
          350 + i * 155,
          350,
          100,
          themeColors.panel,
          name === 'Policy' ? themeColors.blue : themeColors.green,
        );
        chapterText(
          ctx,
          api,
          dedup ? name + ' · rank ' + (j + 1) : name,
          650 + j * 395,
          412 + i * 155,
          27,
          themeColors.ink,
          'center',
        );
      });
    });
    const rows = rrfContributions(lists),
      n = currentBeat === 0 ? 0 : Math.ceil(prog('1', 1) * rows.length),
      active = rows.slice(0, n);
    ['Policy', 'Exception'].forEach((name, i) => {
      const x = 180 + i * 820;
      let left = x;
      for (const row of active.filter((x) => x.id === name)) {
        const w = (row.value / 0.04) * 650;
        chapterRect(ctx, api, left, 745, w, 65, row.branch ? themeColors.cyan : themeColors.blue);
        left += w;
      }
      chapterText(
        ctx,
        api,
        name,
        x,
        700,
        30,
        name === 'Policy' ? themeColors.blue : themeColors.green,
      );
      if (done('sum', 1) || currentBeat > 1)
        chapterText(
          ctx,
          api,
          rows
            .filter((r) => r.id === name)
            .map((r) => '1/' + (60 + r.rank))
            .join(' + ') +
            ' = ' +
            sum(rows.filter((r) => r.id === name).map((r) => r.value)).toFixed(7),
          x,
          895,
          34,
          themeColors.yellow,
        );
    });
    if (done('tie', 1) || currentBeat > 1)
      chapterText(
        ctx,
        api,
        'Equal score → identity order: Exception, Policy',
        960,
        960,
        29,
        themeColors.yellow,
        'center',
      );
    chapterFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'k = 60 is a study choice to evaluate; raw lexical and cosine scores are not added.'
        : 'Suppress repeated Policy before assigning its branch ranks.',
    );
  });
}
export default {
  id: 'rrf-rule',
  draw: drawRrfRule,
  cues: [
    'se-rrf-rule-0',
    'se-rrf-rule-dedup',
    'se-rrf-rule-1',
    'se-rrf-rule-sum',
    'se-rrf-rule-tie',
    'se-rrf-rule-2',
  ],
};
