import { observationCue } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawMetadataBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'metadata-boundary', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'Follow one request ID');
      withTarget(ctx, api, 'copier-boundary', () => {
        drawChapterCard(
          ctx,
          api,
          'Input record',
          ['request ID: reader@example.test', 'raw payload ref: none'],
          140,
          355,
          760,
          themeColors.blue,
          175,
        );
        drawChapterCard(
          ctx,
          api,
          'Durable record',
          resultComplete(0, 3) ? 'request ID: reader@example.test' : 'copies structured fields',
          1000,
          355,
          760,
          themeColors.yellow,
          175,
        );
        if (resultComplete(0, 3))
          drawChapterText(
            ctx,
            api,
            'Email text remains in the copied identifier',
            140,
            660,
            32,
            themeColors.pink,
          );
        if (progress(0, 5) > 0) {
          drawChapterCard(
            ctx,
            api,
            'Exporter with registry checks',
            'registry rejects unapproved request ID',
            140,
            795,
            1620,
            themeColors.pink,
            135,
          );
        }
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'One record, three copies');
      withTarget(ctx, api, 'export-boundary', () => {
        const labels = ['source buffer', 'debug log', 'other exporter'];
        labels.forEach((label, i) =>
          drawChapterCard(
            ctx,
            api,
            label,
            [
              i === 0 && resultComplete(1, 2) ? 'email removed' : 'email present',
              'credential / private meaning remain',
            ],
            140 + i * 550,
            380,
            500,
            i === 0 ? themeColors.blue : themeColors.pink,
            190,
            26,
          ),
        );
        if (resultComplete(1, 3))
          drawChapterText(
            ctx,
            api,
            'The debug log and exporter still hold the address.',
            140,
            760,
            32,
            themeColors.pink,
          );
        if (resultComplete(1, 4))
          drawChapterCard(
            ctx,
            api,
            'Collection boundary',
            'deliberate allowlist + instrumentation / Collector policy',
            140,
            865,
            1620,
            themeColors.green,
            115,
          );
      });
    } else {
      drawHeading(ctx, api, 'How long can you replay this request?');
      withTarget(ctx, api, 'retention-boundary', () => {
        drawChapterCard(
          ctx,
          api,
          'Approved artifact identifier',
          'source 17 · opaque reference',
          140,
          385,
          760,
          themeColors.blue,
          155,
        );
        drawChapterCard(
          ctx,
          api,
          'Referenced content',
          resultComplete(2, 5) ? 'expired / unavailable' : 'authorized storage · scoped expiry',
          1000,
          385,
          760,
          resultComplete(2, 5) ? themeColors.pink : themeColors.green,
          155,
        );
        drawLine(ctx, api, 940, 460, 970, 460, themeColors.blue);
        if (progress(2, 2) > 0)
          drawTable(
            ctx,
            api,
            ['Before capture', 'Required control'],
            [
              ['scope + expiry', 'explicit authorization'],
              ['isolated content storage', 'access + deletion policy'],
              ['sampling decision', 'does not confer permission'],
            ],
            140,
            650,
            [700, 920],
            90,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'metadata-boundary',
  draw: drawMetadataBoundary,
  cues: [
    'ob-metadata-boundary-1-1',
    'ob-metadata-boundary-1-2',
    'ob-metadata-boundary-1-3',
    'ob-metadata-boundary-1-4',
    'ob-metadata-boundary-1-5',
    'ob-metadata-boundary-2-1',
    'ob-metadata-boundary-2-2',
    'ob-metadata-boundary-2-3',
    'ob-metadata-boundary-2-4',
    'ob-metadata-boundary-3-1',
    'ob-metadata-boundary-3-2',
    'ob-metadata-boundary-3-3',
    'ob-metadata-boundary-3-4',
    'ob-metadata-boundary-3-5',
  ],
};
