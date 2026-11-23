import { expertCapacityReceipt, newChapterModel } from '../model.mjs';
import { chapterGrid, chapterLine, chapterText, chapterTitle } from '../defaults.mjs';
export function drawExpertCapacity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('expert-capacity', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-expert-capacity-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'The same 8 token IDs still create 16 assignments'
        : 'Dropping one assignment does not erase its source token',
    );
    const r = expertCapacityReceipt(),
      dropped = done('drop-assignment') && !currentBeat;
    chapterGrid(
      ctx,
      api,
      [
        Array.from(
          {
            length: 8,
          },
          (_, i) => 'T' + i,
        ),
        r.assignments.map((pair) => pair.map((e) => 'E' + e).join('/')),
      ],
      160,
      385,
      1600,
      170,
      themeColors.blue,
      27,
    );
    r.experts.forEach((e, i) => {
      const count = r.counts[i],
        x = 250 + i * 430,
        h = 45 * count;
      api.rect(ctx, x, 930 - h, 240, h, i ? themeColors.cyan : themeColors.pink);
      if (dropped && count > 4) {
        chapterLine(ctx, api, x - 15, 930 - 4 * 45, x + 255, 930 - 4 * 45, themeColors.yellow, 4);
        chapterText(
          ctx,
          api,
          count - 4 + ' dropped',
          x + 120,
          600,
          27,
          themeColors.yellow,
          'center',
        );
      }
      chapterText(
        ctx,
        api,
        'E' + e + ': ' + count,
        x + 120,
        980,
        29,
        i ? themeColors.cyan : themeColors.pink,
        'center',
      );
    });
    if (dropped)
      chapterText(
        ctx,
        api,
        'T4…T7 keep their other selected expert path',
        960,
        315,
        28,
        themeColors.yellow,
        'center',
      );
  });
  return true;
}
export default {
  id: 'expert-capacity',
  draw: drawExpertCapacity,
  cues: ['mg-expert-capacity-b0', 'mg-drop-assignment', 'mg-expert-capacity-b1', 'mg-hot-expert'],
};
