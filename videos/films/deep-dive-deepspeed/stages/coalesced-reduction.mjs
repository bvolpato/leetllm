import { complete, sentence } from '../construction.mjs';
import { drawChapterFooter, drawChapterGrid, drawChapterText } from '../defaults.mjs';
export function drawCoalescedReduction(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'coalesced-reduction', beat, index),
    resultComplete = (beat, index) => complete(state, 'coalesced-reduction', beat, index);
  api.focus.target('coalesced-reduction-construction', () => {
    const contributions = [1, 3, -2, 2],
      count =
        currentBeat === 0
          ? Math.floor(sentenceProgress(0, 0) * 4)
          : currentBeat === 1
            ? Math.floor(sentenceProgress(1, 1) * 4)
            : 4;
    drawChapterText(
      ctx,
      api,
      'Supplied equal microbatch window · 4 backward calls',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    drawChapterGrid(
      ctx,
      api,
      [contributions.map((v, i) => (i < count ? 'g = ' + v : 'pending'))],
      180,
      370,
      1560,
      100,
      themeColors.blue,
      35,
    );
    const events = currentBeat === 0 ? count : currentBeat === 1 ? (count === 4 ? 1 : 0) : 1;
    drawChapterGrid(
      ctx,
      api,
      [
        contributions.map((_, i) =>
          currentBeat === 0 && i < count
            ? 'reduce'
            : currentBeat > 0 && i === 3 && count === 4
              ? 'one reduction'
              : '',
        ),
      ],
      180,
      540,
      1560,
      95,
      themeColors.cyan,
      30,
    );
    drawChapterText(
      ctx,
      api,
      'Communication events: ' + events,
      540,
      755,
      37,
      themeColors.cyan,
      'center',
    );
    drawChapterText(
      ctx,
      api,
      'Adam updates: ' + (count === 4 ? 1 : 0),
      1390,
      755,
      37,
      count === 4 ? themeColors.green : themeColors.muted,
      'center',
    );
    const fullLive = currentBeat > 0 && count < 4;
    drawChapterText(
      ctx,
      api,
      'Local gradient storage · four equal slices',
      150,
      865,
      28,
      themeColors.muted,
    );
    drawChapterGrid(
      ctx,
      api,
      [[0, 1, 2, 3].map((i) => (fullLive || i === 0 ? 'allocated' : 'released'))],
      800,
      805,
      920,
      80,
      fullLive ? themeColors.pink : themeColors.cyan,
      27,
    );
    if (currentBeat > 0)
      drawChapterFooter(
        ctx,
        api,
        'Supported coalesced scope peaks at the full local gradient before reduction',
        1020,
        themeColors.pink,
      );
    else
      drawChapterFooter(
        ctx,
        api,
        'A postponed optimizer update does not imply postponed reductions',
        1020,
      );
    if (currentBeat === 2)
      drawChapterText(
        ctx,
        api,
        'Same objective: (1 + 3 − 2 + 2)/4 = 1 → same scalar Adam update',
        960,
        945,
        32,
        themeColors.green,
        'center',
      );
  });
}
export default {
  id: 'coalesced-reduction',
  draw: drawCoalescedReduction,
  cues: [
    'ds-coalesced-reduction-b0-s0',
    'ds-coalesced-reduction-b0-s1',
    'ds-coalesced-reduction-b0-s2',
    'ds-coalesced-reduction-b1-s0',
    'ds-coalesced-reduction-b1-s1',
    'ds-coalesced-reduction-b1-s2',
    'ds-coalesced-reduction-b2-s0',
    'ds-coalesced-reduction-b2-s1',
    'ds-coalesced-reduction-b2-s2',
  ],
};
