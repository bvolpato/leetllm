import { clamp, motion } from '../arithmetic.mjs';
import { checkedClocks } from '../model.mjs';
import { chapterFooter, chapterLine, chapterRect, chapterText } from '../defaults.mjs';
export function drawClockArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-clock-arithmetic-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-clock-arithmetic-' + name);
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
  api.focus.target('se-clock-arithmetic-mechanism', () => {
    const v = checkedClocks(),
      dependent = done('dependent', 1) || currentBeat > 1;
    chapterText(
      ctx,
      api,
      'One supplied request · dependency clock',
      160,
      285,
      33,
      themeColors.blue,
    );
    const ops = [
        ['plan', 0, 40, themeColors.blue],
        ['retrieve', dependent ? 40 : 0, dependent ? 300 : 260, themeColors.cyan],
        ['rerank', dependent ? 300 : 260, dependent ? 390 : 350, themeColors.blue],
        ['pack', dependent ? 390 : 350, dependent ? 410 : 370, themeColors.yellow],
        ['first token', dependent ? 410 : 370, dependent ? 840 : 800, themeColors.cyan],
        ['complete claim', dependent ? 840 : 800, dependent ? 940 : 900, themeColors.blue],
        ['check', dependent ? 940 : 900, dependent ? 1020 : 980, themeColors.green],
      ],
      ready = currentBeat === 0 ? prog('overlap', 0) : prog('1', 1),
      end = dependent
        ? 1020
        : currentBeat === 0
          ? 260 * ready
          : currentBeat === 1
            ? done('checked', 1)
              ? 980
              : prog('checked', 1) > 0
                ? 900 + 80 * prog('checked', 1)
                : done('draft', 1)
                  ? 800
                  : 260 + 540 * ready
            : 980;
    const domain = 1040,
      x0 = 380,
      w = 1320;
    for (let i = 0; i < ops.length; i++) {
      const [name, start, stop, color] = ops[i],
        y = 345 + i * 73;
      chapterText(ctx, api, name, 160, y + 35, 27, themeColors.muted);
      chapterLine(ctx, api, [x0, y + 50], [x0 + w, y + 50], themeColors.muted);
      const reached = Math.min(stop, end);
      if (reached > start)
        chapterRect(
          ctx,
          api,
          x0 + (w * start) / domain,
          y + 9,
          (w * (reached - start)) / domain,
          40,
          color,
        );
    }
    if ((currentBeat === 1 && done('draft', 1)) || currentBeat > 1)
      chapterText(
        ctx,
        api,
        'Draft: ' + (dependent ? 840 : v.draft) + ' ms',
        180,
        920,
        32,
        themeColors.cyan,
      );
    if ((currentBeat === 1 && done('checked', 1)) || currentBeat > 1)
      chapterText(
        ctx,
        api,
        'Checked claim: ' +
          (dependent
            ? checkedClocks({
                dependent: true,
              }).checked
            : v.checked) +
          ' ms',
        1030,
        920,
        32,
        themeColors.green,
      );
    chapterFooter(
      ctx,
      api,
      dependent
        ? 'Rewrite dependence adds the same 40 ms to draft, claim completion and check.'
        : 'Independent planning and raw retrieval overlap: max(40,260).',
    );
  });
}
export default {
  id: 'clock-arithmetic',
  draw: drawClockArithmetic,
  cues: [
    'se-clock-arithmetic-0',
    'se-clock-arithmetic-overlap',
    'se-clock-arithmetic-1',
    'se-clock-arithmetic-draft',
    'se-clock-arithmetic-checked',
    'se-clock-arithmetic-dependent',
    'se-clock-arithmetic-2',
  ],
};
