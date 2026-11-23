import { done } from '../construction.mjs';
import {
  chapterCard,
  chapterHeading,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawSourceTour(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      resultComplete = (bi, si) => done(state, 'source-tour', bi, si);
    {
      chapterHeading(ctx, api, 'Where to look in the NCCL source');
      const entries = [
        ['init.cc / bootstrap.cc', 'Rank and peer setup'],
        ['graph/topo.cc / search.cc', 'Candidate route topology'],
        ['graph/tuning.cc', 'Supported plan selection'],
        ['collectives.cc / enqueue.cc', 'Validate and construct work'],
        ['device/primitives*', 'Move and reduce values'],
        ['transport/* / proxy.cc', 'Connections and progress'],
      ];
      const reveal =
        currentBeat === 0
          ? resultComplete(0, 2)
            ? 3
            : resultComplete(0, 1)
              ? 1
              : 0
          : currentBeat === 1
            ? 3 +
              Number(resultComplete(1, 0)) +
              Number(resultComplete(1, 1)) +
              Number(resultComplete(1, 2))
            : 6;
      entries.forEach(([file, role], i) => {
        const x = i < 3 ? 180 : 1030,
          y = 365 + (i % 3) * 175;
        const proxy = i === 5 && currentBeat === 1 && resultComplete(1, 2);
        const color = proxy
          ? themeColors.yellow
          : i < reveal
            ? themeColors.cyan
            : themeColors.muted;
        chapterRectangle(ctx, api, x, y, 710, 125, themeColors.panel, color);
        chapterText(ctx, api, proxy ? 'src/proxy.cc' : file, x + 25, y + 43, 27, color);
        chapterText(
          ctx,
          api,
          proxy ? 'Host proxy advances the transfer' : i < reveal ? role : '',
          x + 25,
          y + 91,
          27,
          themeColors.ink,
        );
      });
      if (currentBeat === 2) {
        chapterCard(
          ctx,
          api,
          'Host entry · collective / enqueue',
          180,
          925,
          710,
          75,
          themeColors.blue,
        );
        chapterCard(
          ctx,
          api,
          'Device entry · device APIs / gin',
          1030,
          925,
          710,
          75,
          themeColors.pink,
        );
      } else
        chapterText(
          ctx,
          api,
          'NCCL source   ·   5067397c',
          960,
          970,
          29,
          themeColors.yellow,
          'center',
        );
      if (currentBeat === 2) chapterNote(ctx, api, 'Debug and RAS report failures and progress');
    }
  });
}
export default {
  id: 'source-tour',
  draw: drawSourceTour,
  cues: [
    'nc-source-tour-b0-s0',
    'nc-source-tour-b0-s1',
    'nc-source-tour-b0-s2',
    'nc-source-tour-b0-s3',
    'nc-source-tour-b1-s0',
    'nc-source-tour-b1-s1',
    'nc-source-tour-b1-s2',
    'nc-source-tour-b1-s3',
    'nc-source-tour-b2-s0',
    'nc-source-tour-b2-s1',
    'nc-source-tour-b2-s2',
  ],
};
