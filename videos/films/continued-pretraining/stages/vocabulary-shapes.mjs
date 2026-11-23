import { bounded } from '../arithmetic.mjs';
import { CENTROID_INPUTS } from '../fixtures.mjs';
import { centroidCoordinates } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRect,
  drawExtensionTable,
  drawExtensionText,
} from '../defaults.mjs';
export function drawVocabularyShapes(ctx, scene, state, api) {
  const supported = new Set([
    'schedule',
    'replay',
    'intro',
    'incident-controls',
    'prompt-gradient',
    'scored-objective',
    'fertility-cost',
    'vocabulary-shapes',
    'vocabulary-denominator',
    'grouped-holdout',
    'manifest-gate',
    'normalized-overlap',
    'packed-remainder',
    'optimizer-restart',
    'exact-schedule',
    'dapt-tapt',
    'fixed-budget',
    'target-weighting',
    'byte-normalization',
    'corpus-reduction',
    'retained-outcomes',
    'select',
    'selection-and-stopping',
    'objective-and-parameters',
    'earned-adaptation',
  ]);
  if (!supported.has('vocabulary-shapes')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue vocabulary-shapes/' + id);
      return cue
        ? cue.phase === 'before'
          ? 0
          : cue.phase === 'after'
            ? 1
            : bounded(cue.progress)
        : state.beat < beat
          ? 0
          : state.beat > beat
            ? 1
            : bounded((progress - 0.12) / 0.76);
    },
    resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construct = () => {
    if (currentBeat === 0) {
      drawExtensionHeading(ctx, api, 'Preserve old IDs in both vocabulary-indexed tables');
      drawExtensionF(ctx, api, 'cpt-vocab-tables', () => {
        for (const [side, x] of [
          ['input lookup', 210],
          ['output head', 1080],
        ]) {
          drawExtensionText(ctx, api, side, x, 375, 34, themeColors.blue);
          for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 8; c++)
              drawExtensionRect(
                ctx,
                api,
                x + c * 65,
                420 + r * 65,
                55,
                52,
                r < 5
                  ? themeColors.blue
                  : resultComplete('cpt-vocab-resize', 0)
                    ? themeColors.yellow
                    : themeColors.panel,
                r < 5 ? themeColors.blue : themeColors.yellow,
              );
            drawExtensionText(
              ctx,
              api,
              r < 5 ? 'ID ' + r : 'new ID 5',
              x + 570,
              455 + r * 65,
              27,
              r < 5 ? themeColors.blue : themeColors.yellow,
            );
          }
          drawExtensionText(
            ctx,
            api,
            cueProgress('cpt-vocab-resize', 0) > 0 ? '(V+1) × d = 6 × 8' : 'V × d = 5 × 8',
            x,
            900,
            34,
            themeColors.yellow,
          );
        }
      });
    } else if (currentBeat === 1) {
      drawExtensionHeading(ctx, api, 'One new input row · centroid of auth, time, out');
      drawExtensionF(ctx, api, 'cpt-vocab-centroid', () => {
        const q = cueProgress('cpt-vocab-centroid', 1),
          n = Math.min(8, Math.floor(q * 8 + 1e-8)),
          mean = centroidCoordinates();
        ['auth / ID0', 'time / ID1', 'out / ID2', 'new / ID5'].forEach((name, r) => {
          drawExtensionText(
            ctx,
            api,
            name,
            180,
            r === 3 ? 890 : 465 + r * 115,
            29,
            r === 3 ? themeColors.green : themeColors.blue,
          );
          for (let k = 0; k < 8; k++) {
            const x = 440 + k * 155,
              y = r === 3 ? 825 : 405 + r * 115,
              col =
                r === 3
                  ? k < n
                    ? themeColors.green
                    : themeColors.muted
                  : k === Math.min(n, 7) && q > 0
                    ? themeColors.yellow
                    : themeColors.blue;
            drawExtensionCell(
              ctx,
              api,
              r < 3 ? CENTROID_INPUTS[r][k].toFixed(3) : k < n ? mean[k].toFixed(3) : '?',
              x,
              y,
              130,
              80,
              col,
              28,
            );
            if (r === 2 && k < n)
              drawExtensionLine(ctx, api, x + 65, y + 90, x + 65, 805, themeColors.green, 3);
          }
        });
        drawExtensionText(
          ctx,
          api,
          'Each column contributes one average to the new row.',
          180,
          965,
          28,
          themeColors.muted,
        );
      });
    } else {
      drawExtensionHeading(ctx, api, 'Initialization candidates need final task evidence');
      drawExtensionF(ctx, api, 'cpt-vocab-evidence', () => {
        drawExtensionTable(
          ctx,
          api,
          ['parameter table', 'initialization choice', 'required evidence'],
          [
            ['input embeddings', 'candidate input methods', 'short adaptation + retention'],
            ['output head', 'separate output methods', 'norm calibration + training'],
          ],
          180,
          440,
          1550,
          175,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-vocab-evidence', 2)
            ? 'Compare the starting loss and the final task scores.'
            : 'Hindi adaptation with Nemotron  ·  Joshi et al., 2026',
          180,
          865,
          36,
          themeColors.yellow,
        );
      });
    }
    drawExtensionFoot(
      ctx,
      api,
      currentBeat === 1
        ? 'Input table: five rows become six, each eight numbers wide.'
        : 'Initialize separate tables individually. Preserve shared weights when the tables are tied.',
    );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('vocabulary-shapes-construction')),
    )
  )
    drawExtensionF(ctx, api, 'vocabulary-shapes-construction', construct);
  else construct();
  return;
}
export default {
  id: 'vocabulary-shapes',
  draw: drawVocabularyShapes,
  cues: [
    'vocabulary-shapes-b1',
    'cpt-vocab-resize',
    'vocabulary-shapes-b2',
    'cpt-vocab-centroid',
    'vocabulary-shapes-b3',
    'cpt-vocab-evidence',
  ],
};
