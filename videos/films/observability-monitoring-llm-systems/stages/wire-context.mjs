import { observationCue } from '../construction.mjs';
import {
  drawCells,
  drawChapterCard,
  drawChapterText,
  drawHeading,
  drawLine,
  drawRectangle,
  drawTable,
  withTarget,
} from '../defaults.mjs';
export function drawWireContext(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = (beat, n) => observationCue(state, 'wire-context', beat, n),
    resultComplete = (beat, n) => progress(beat, n) === 1;
  {
    if (currentBeat === 0) {
      drawHeading(ctx, api, 'One trace identity · separate operation identities');
      withTarget(ctx, api, 'context-carrier', () => {
        drawChapterCard(
          ctx,
          api,
          'Caller span',
          ['trace: T1 · span: S1', 'tool name: lookup'],
          140,
          360,
          650,
          themeColors.blue,
          170,
        );
        drawChapterCard(
          ctx,
          api,
          'Worker child',
          ['trace: T1 · span: S2', 'parent: S1 · tool name: lookup'],
          1110,
          360,
          650,
          themeColors.cyan,
          170,
        );
        const q = progress(0, 2);
        if (q > 0) {
          drawLine(ctx, api, 825, 440, 1070, 440, themeColors.cyan);
          drawRectangle(ctx, api, 825 + 230 * q, 428, 18, 24, themeColors.cyan, null);
          drawChapterText(
            ctx,
            api,
            'carrier: current trace + caller span',
            140,
            650,
            30,
            themeColors.cyan,
          );
        }
        if (resultComplete(0, 4))
          drawChapterCard(
            ctx,
            api,
            'Without propagated context',
            ['trace: T2 · unrelated root', 'caller link missing'],
            530,
            760,
            860,
            themeColors.pink,
            170,
          );
      });
    } else if (currentBeat === 1) {
      drawHeading(ctx, api, 'W3C traceparent fields · logical byte widths');
      withTarget(ctx, api, 'traceparent-fields', () => {
        drawCells(
          ctx,
          api,
          ['version', 'trace ID:16 bytes', 'parent ID:8 bytes', 'flags'],
          140,
          380,
          1620,
          115,
          [themeColors.muted, themeColors.blue, themeColors.cyan, themeColors.yellow],
        );
        if (resultComplete(1, 2))
          drawChapterText(
            ctx,
            api,
            'All-zero trace or parent ID → invalid',
            140,
            650,
            32,
            themeColors.pink,
          );
        if (progress(1, 3) > 0) {
          drawChapterCard(
            ctx,
            api,
            'Receiver identity',
            ['same trace T1 · new span S2', 'parent S1'],
            140,
            745,
            760,
            themeColors.cyan,
            160,
          );
          drawChapterCard(
            ctx,
            api,
            'Sampled flag',
            'recording recommendation',
            1000,
            745,
            760,
            themeColors.yellow,
            160,
          );
        }
        if (resultComplete(1, 4))
          drawChapterText(
            ctx,
            api,
            'Flags carry no tool-execution authority',
            140,
            978,
            30,
            themeColors.pink,
          );
      });
    } else {
      drawHeading(ctx, api, 'Which span owns the next operation?');
      withTarget(ctx, api, 'tracer-scope', () => {
        const phase = Math.min(3, Math.floor(progress(2, 2) * 4));
        drawTable(
          ctx,
          api,
          ['Operation', 'Current parent'],
          [
            ['root span 1', phase === 0 ? 'active' : 'retained'],
            ['nested span 2', phase === 1 ? 'active · parent 1' : 'parent 1'],
            ['exception exits nested', phase >= 2 ? 'parent restored to 1' : 'pending'],
          ],
          140,
          345,
          [900, 720],
          135,
        );
        if (resultComplete(2, 3))
          drawChapterText(
            ctx,
            api,
            'Next local operation  →  parent span 1',
            140,
            930,
            31,
            themeColors.yellow,
          );
      });
    }
  }
  return true;
}
export default {
  id: 'wire-context',
  draw: drawWireContext,
  cues: [
    'ob-wire-context-1-1',
    'ob-wire-context-1-2',
    'ob-wire-context-1-3',
    'ob-wire-context-1-4',
    'ob-wire-context-2-1',
    'ob-wire-context-2-2',
    'ob-wire-context-2-3',
    'ob-wire-context-2-4',
    'ob-wire-context-3-1',
    'ob-wire-context-3-2',
    'ob-wire-context-3-3',
    'ob-wire-context-3-4',
    'ob-wire-context-3-5',
  ],
};
