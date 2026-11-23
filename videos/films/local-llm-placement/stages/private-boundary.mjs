import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionRectangle,
  constructionText,
} from '../defaults.mjs';
export function drawPrivateBoundary(ctx, scene, state, api) {
  api.focus.target('pl-private-boundary-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['private-boundary'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['private-boundary'][beat]
      )
        throw Error('Invalid placement sentence private-boundary/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'private-boundary'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['private-boundary'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      const destinations = [
        ['Local process', 250, 510],
        ['On-prem server', 850, 510],
        ['External service', 1450, 510],
      ];
      constructionText(ctx, api, 'Internal-only incident-data policy', 150, 280, 34, C.yellow);
      destinations.forEach(([v, x, y], i) =>
        constructionCell(ctx, api, v, x - 80, y, 440, 110, i === 2 ? C.pink : C.cyan),
      );
      constructionLine(ctx, api, 1260, 350, 1260, 850, C.yellow);
      constructionText(ctx, api, 'Approved boundary', 460, 390, 31, C.yellow);
      constructionText(ctx, api, 'Outside', 1450, 390, 31, C.pink);
      const move = op(0, 1);
      if (b === 0 && move > 0) {
        const x = 470 + move * 1130;
        constructionRectangle(ctx, api, x, 690, 55, 55, C.pink, true);
        constructionText(ctx, api, 'Forwarding path', 900, 840, 30, C.pink, 'center');
      }
      if (b === 0 && done(0, 3))
        constructionText(
          ctx,
          api,
          'Air gap requires tested separation + controlled artifact transfer',
          150,
          940,
          31,
          C.green,
        );
      if (b === 1) {
        constructionText(
          ctx,
          api,
          'Applicable agreements + safeguards depend on the actual use',
          150,
          840,
          31,
          C.muted,
        );
        constructionText(
          ctx,
          api,
          'This example applies the stricter internal-only product policy',
          150,
          925,
          32,
          C.yellow,
        );
      }
    }
  });
}
export default {
  id: 'private-boundary',
  draw: drawPrivateBoundary,
  cues: [
    'pl-private-boundary-0-0',
    'pl-private-boundary-0-1',
    'pl-private-boundary-0-2',
    'pl-private-boundary-0-3',
    'pl-private-boundary-0-4',
    'pl-private-boundary-1-0',
    'pl-private-boundary-1-1',
    'pl-private-boundary-1-2',
    'pl-private-boundary-1-3',
  ],
};
