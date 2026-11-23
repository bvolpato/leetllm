import { phase } from '../arithmetic.mjs';
import { sgBegun, sgProgress } from '../construction.mjs';
import { arrow, box, cells, clock, extensionText, footer, title } from '../defaults.mjs';
export function drawReplicaLocality(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('replica-locality-mechanism', () => {
    title(
      ctx,
      api,
      currentBeat === 0
        ? 'Move the same compatible request; change only its replica'
        : 'Locality policy and online fairness need separate evidence',
    );
    if (currentBeat === 0) {
      box(ctx, api, 'Replica A', 200, 390, 640, 100, themeColors.blue);
      box(ctx, api, 'Replica B', 1080, 390, 640, 100, themeColors.pink);
      cells(ctx, api, ['12', '13', '14', '15'], 240, 560, 560, 85, themeColors.cyan);
      cells(ctx, api, ['empty', 'empty', 'empty', 'empty'], 1120, 560, 560, 85, themeColors.muted);
      const move = sgProgress(state, 'route-cold', q);
      box(ctx, api, 'R42', 430 + 880 * move, 745, 180, 70, themeColors.yellow);
      extensionText(ctx, api, 'warm hit', 520, 690, 32, themeColors.green, 'center');
      extensionText(
        ctx,
        api,
        move >= 1 ? 'cold miss' : 'local lookup',
        1400,
        690,
        32,
        move >= 1 ? themeColors.pink : themeColors.muted,
        'center',
      );
    } else if (!sgBegun(state, 'tier', q > 0.7)) {
      clock(
        ctx,
        api,
        [
          {
            id: 'hot',
            label: 'long matched prefix',
          },
          {
            id: 'cold',
            label: 'unrelated request',
          },
        ],
        [
          {
            id: 'h1',
            lane: 'hot',
            start: 0,
            end: 2,
            color: themeColors.cyan,
          },
          {
            id: 'h2',
            lane: 'hot',
            start: 2,
            end: 4,
            color: themeColors.cyan,
          },
          {
            id: 'h3',
            lane: 'hot',
            start: 4,
            end: 6,
            color: themeColors.cyan,
          },
          {
            id: 'u',
            lane: 'cold',
            start: 6,
            end: 8,
            color: themeColors.pink,
          },
        ],
        [0, 8],
        8,
        420,
        310,
        [0, 2, 4, 6, 8],
      );
      extensionText(
        ctx,
        api,
        'Repeated hot arrivals can delay unrelated work',
        960,
        840,
        36,
        themeColors.pink,
        'center',
      );
    } else {
      const yy = [390, 570, 750];
      ['GPU resident KV', 'host tier', 'storage tier'].forEach((v, i) => {
        box(ctx, api, v, 490, yy[i], 940, 90, i === 0 ? themeColors.cyan : themeColors.blue);
        if (i < 2) arrow(ctx, api, 960, yy[i] + 98, 960, yy[i + 1] - 8);
      });
      extensionText(
        ctx,
        api,
        'Same key · additional byte movement and readiness',
        960,
        920,
        31,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat) footer(ctx, api, 'A warm request can move ahead of a cold request.');
  });
}
export default {
  id: 'replica-locality',
  draw: drawReplicaLocality,
  cues: ['sg-replica-locality-beat-0', 'sg-route-cold', 'sg-replica-locality-beat-1', 'sg-tier'],
};
