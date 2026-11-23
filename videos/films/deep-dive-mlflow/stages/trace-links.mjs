import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer, table } from '../defaults.mjs';
export function drawTraceLinks(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleMlflowChapter('trace-links', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('trace-links', state, beat, sentence);
  {
    const first = components.panel({
        x: 150,
        y: 350,
        width: 700,
        height: 300,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 20,
      }),
      linked = chip(ctx, api, 'Separate root T105', 1100, 640, 660, themeColors.cyan, 100);
    chapterText(ctx, api, 'Trace T104 · root', 500, 435, 31, themeColors.blue, 'center');
    chip(ctx, api, 'retrieve → pack → generate', 230, 530, 540, themeColors.blue);
    flow(ctx, api, first, linked, teaching2(0, 1), themeColors.yellow);
    chapterText(ctx, api, 'span link', 1100, 530, 28, themeColors.yellow);
    if (currentBeat > 0) {
      const pack = chip(
        ctx,
        api,
        'Manual span: selected DOC IDs',
        170,
        800,
        680,
        themeColors.green,
        100,
      );
      flow(ctx, api, first, pack, teaching2(1, 2), themeColors.green);
    }
    if (currentBeat === 2) {
      table(
        ctx,
        api,
        1080,
        795,
        [300, 380],
        [
          ['Evidence', 'Recorded'],
          ['status / IDs', 'known semantics'],
        ],
      );
      chapterText(
        ctx,
        api,
        'Missing span? Check instrumentation, sampling and export.',
        960,
        300,
        35,
        themeColors.yellow,
        'center',
      );
    }
    footer(ctx, api, 'Follow the link to the related request. Each root keeps its own clock.');
  }
}
export default {
  id: 'trace-links',
  draw: drawTraceLinks,
  cues: [
    'mf-trace-links-0',
    'mf-sentence-trace-links-0-0',
    'mf-sentence-trace-links-0-1',
    'mf-sentence-trace-links-0-2',
    'mf-sentence-trace-links-0-3',
    'mf-trace-links-1',
    'mf-sentence-trace-links-1-0',
    'mf-sentence-trace-links-1-1',
    'mf-sentence-trace-links-1-2',
    'mf-sentence-trace-links-1-3',
    'mf-trace-links-2',
    'mf-sentence-trace-links-2-0',
    'mf-sentence-trace-links-2-1',
    'mf-sentence-trace-links-2-2',
    'mf-sentence-trace-links-2-3',
  ],
};
