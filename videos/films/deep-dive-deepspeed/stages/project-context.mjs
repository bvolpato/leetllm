import { complete, sentence } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterText,
  drawChapterValues,
} from '../defaults.mjs';
export function drawProjectContext(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'project-context', beat, index),
    resultComplete = (beat, index) => complete(state, 'project-context', beat, index);
  api.focus.target('project-context-construction', () => {
    drawProjectContext();
  });
  function drawProjectContext() {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Source evidence has a date and a document scope',
        960,
        285,
        37,
        themeColors.yellow,
        'center',
      );
      const entries = [
        ['Origins', 'Original ZeRO authors at Microsoft'],
        ['Governance', 'Technical Steering Committee / LF AI & Data'],
        ['Code', 'Apache-2.0'],
        ['Contribution', 'DCO sign-off; separate documentation license'],
      ];
      entries.forEach((row, i) => {
        drawChapterValues(
          ctx,
          api,
          row[0],
          [row[1]],
          350 + i * 150,
          i === 2 ? themeColors.cyan : themeColors.blue,
        );
      });
    } else {
      drawChapterText(
        ctx,
        api,
        'Supplied incident · earliest rank error before peer timeout',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      const fields = [
        ['Commit', 'c455031…'],
        ['Resolved config', 'stage 3; actual group sizes retained'],
        ['Reproducer', 'one module; same parameter-use order'],
        ['Topology', '4 data ranks; fixed test inputs'],
      ];
      fields.forEach((row, i) => {
        drawChapterText(ctx, api, row[0], 150, 390 + i * 100, 29, themeColors.blue);
        drawChapterText(ctx, api, row[1], 650, 390 + i * 100, 29, themeColors.ink);
      });
      const reveal = sentenceProgress(1, 2);
      if (reveal > 0) {
        drawChapterCard(
          ctx,
          api,
          'R2 · 1.2 s · first parameter-use exception',
          160,
          790,
          770,
          themeColors.pink,
          105,
          28,
        );
        drawChapterCard(
          ctx,
          api,
          'Peers · 1.8 s · collective timeout',
          1020,
          790,
          740,
          themeColors.yellow,
          105,
          29,
        );
        api.arrow(ctx, 930, 840, 1015, 840, themeColors.muted, 3);
      }
      drawChapterFooter(
        ctx,
        api,
        'Reproduce the first exception before attributing the later collective symptom',
        1010,
        themeColors.cyan,
      );
    }
  }
}
export default {
  id: 'project-context',
  draw: drawProjectContext,
  cues: [
    'ds-project-context-b0-s0',
    'ds-project-context-b0-s1',
    'ds-project-context-b0-s2',
    'ds-project-context-b0-s3',
    'ds-project-context-b1-s0',
    'ds-project-context-b1-s1',
    'ds-project-context-b1-s2',
    'ds-project-context-b1-s3',
  ],
};
