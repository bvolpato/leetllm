import { phase } from '../arithmetic.mjs';
import { speculativeCostState } from '../model.mjs';
import { cells, clock, extensionText, footer, title } from '../defaults.mjs';
export function drawSpeculativeEconomics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('speculative-economics-mechanism', () => {
    const cost = speculativeCostState(state),
      advances = cost.advanced;
    title(ctx, api, 'Count the whole cycle before comparing equal output progress');
    if (currentBeat === 0) {
      cells(
        ctx,
        api,
        ['draft inputs', 'target verification', 'commit prefix', 'pending replacement KV'],
        220,
        430,
        1480,
        110,
        themeColors.cyan,
      );
      extensionText(
        ctx,
        api,
        'Model / features / MTP / n-gram proposals need their own verification rule',
        960,
        740,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      const intervals = [];
      if (cost.givens)
        intervals.push(
          {
            id: 'd',
            lane: 'cycle',
            start: 0,
            end: 3,
            color: themeColors.pink,
          },
          {
            id: 'v',
            lane: 'cycle',
            start: 3,
            end: 12,
            color: themeColors.cyan,
          },
          {
            id: 'c',
            lane: 'cycle',
            start: 12,
            end: 13,
            color: themeColors.green,
          },
        );
      if (cost.showOrdinary && advances !== null)
        intervals.push(
          ...Array.from(
            {
              length: advances,
            },
            (_, i) => ({
              id: 't' + i,
              lane: 'ordinary',
              start: i * 4,
              end: (i + 1) * 4,
              color: themeColors.blue,
            }),
          ),
        );
      clock(
        ctx,
        api,
        [
          {
            id: 'ordinary',
            label: 'ordinary target',
          },
          {
            id: 'cycle',
            label: 'draft cycle',
          },
        ],
        intervals,
        [0, 24],
        cost.showOrdinary ? 24 : cost.showCycle ? 13 : 0,
        390,
        290,
        [0, 4, 8, 12, 16, 20, 24],
      );
      extensionText(
        ctx,
        api,
        cost.givens
          ? 'target step 4 · draft 3 · verify 9 · commit 1 ms'
          : 'Supplied target / draft / verify / commit costs',
        960,
        785,
        32,
        themeColors.cyan,
        'center',
      );
      extensionText(
        ctx,
        api,
        cost.showCycle ? '3 + 9 + 1 = 13 ms / cycle' : 'Cycle total: ?',
        960,
        865,
        38,
        themeColors.cyan,
        'center',
      );
      extensionText(
        ctx,
        api,
        advances === null
          ? 'Advanced tokens: ?'
          : advances +
              ' advanced tokens' +
              (cost.showOrdinary ? ' · ordinary ' + advances * 4 + ' ms' : ''),
        960,
        940,
        35,
        advances === null ? themeColors.muted : cost.failed ? themeColors.pink : themeColors.green,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Example step times in milliseconds',
    );
  });
}
export default {
  id: 'speculative-economics',
  draw: drawSpeculativeEconomics,
  cues: [
    'sg-speculative-economics-beat-0',
    'sg-speculative-economics-beat-1',
    'sg-spec-cost',
    'sg-spec-zero',
    'sg-spec-zero-input',
    'sg-spec-thirteen',
    'sg-spec-twentyfour',
    'sg-speculative-economics-beat-2',
  ],
};
