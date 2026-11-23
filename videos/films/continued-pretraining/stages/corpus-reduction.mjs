import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRow,
  drawExtensionText,
} from '../defaults.mjs';
export function drawCorpusReduction(ctx, scene, state, api) {
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
  if (!supported.has('corpus-reduction')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue corpus-reduction/' + id);
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
      drawExtensionHeading(ctx, api, 'Two documents, one corpus perplexity');
      drawExtensionF(ctx, api, 'cpt-corpus-reduction', () => {
        drawExtensionRow(
          ctx,
          api,
          ['D1 · 60 nats / 20 targets', 'D2 · 160 nats / 40 targets'],
          180,
          440,
          810,
          740,
          themeColors.blue,
          34,
        );
        drawExtensionLine(ctx, api, 550, 560, 960, 665, themeColors.blue);
        drawExtensionLine(ctx, api, 1360, 560, 960, 665, themeColors.blue);
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-corpus-mean', 0)
            ? `mean = 220 / 60     PPL = ${Math.exp(220 / 60).toFixed(3)}`
            : 'sum losses and counts before exponentiating',
          960,
          790,
          38,
          themeColors.green,
          'center',
        );
      });
    } else if (currentBeat === 1) {
      drawExtensionHeading(ctx, api, 'Averaging exponentials changes the operation');
      drawExtensionF(ctx, api, 'cpt-corpus-comparison', () => {
        drawExtensionText(
          ctx,
          api,
          `exp(60/20) = ${Math.exp(3).toFixed(3)}`,
          180,
          450,
          36,
          themeColors.blue,
        );
        drawExtensionText(
          ctx,
          api,
          `exp(160/40) = ${Math.exp(4).toFixed(3)}`,
          180,
          585,
          36,
          themeColors.cyan,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-corpus-wrong', 1)
            ? `wrong mean PPL = ${((Math.exp(3) + Math.exp(4)) / 2).toFixed(3)}`
            : 'average after exp: ?',
          180,
          760,
          36,
          themeColors.pink,
        );
      });
      drawExtensionF(ctx, api, 'cpt-corpus-lanes', () => {
        drawExtensionText(
          ctx,
          api,
          'Held-out text at two checkpoints',
          1050,
          420,
          30,
          themeColors.muted,
        );
        drawExtensionText(ctx, api, 'Domain PPL   33.12 → 20.09', 1050, 610, 34, themeColors.green);
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-corpus-lanes', 1)
            ? 'General PPL   14.88 → 15.49'
            : 'general fit: separate lane',
          1050,
          790,
          34,
          themeColors.pink,
        );
      });
    } else {
      drawExtensionHeading(ctx, api, 'Which tokens belong to the identifier?');
      api.text(ctx, 'AUTH_TIMEOUT', 180, 446, 63, themeColors.ink, 'left', 'mono');
      const pieces = ['AUTH', '_', 'T', 'I', 'M', 'E', 'O', 'U', 'T'];
      const span = cueProgress('corpus-reduction-b3', 2);
      pieces.forEach((piece, i) => {
        const x = 180 + i * 170;
        const color = (i + 1) / pieces.length <= span ? themeColors.cyan : themeColors.muted;
        api.rect(ctx, x, 525, 146, 90, themeColors.panel, color, 8);
        api.text(ctx, piece, x + 73, 588, 44, color, 'center', 'mono');
      });
      if (span >= 1)
        api.text(
          ctx,
          'Identifier loss = sum of the losses on these nine pieces',
          180,
          715,
          40,
          themeColors.cyan,
        );
      if (cueProgress('corpus-incident-task', 2, 0.7, 0.8) > 0)
        api.text(
          ctx,
          'Incident task: how should the engineer retry token reissue?',
          180,
          905,
          42,
          themeColors.ink,
        );
    }
    if (currentBeat < 2)
      drawExtensionFoot(ctx, api, 'Same tokenizer and scoring rules for both documents');
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('corpus-reduction-construction')),
    )
  )
    drawExtensionF(ctx, api, 'corpus-reduction-construction', construct);
  else construct();
  return;
}
export default {
  id: 'corpus-reduction',
  draw: drawCorpusReduction,
  cues: [
    'corpus-reduction-b1',
    'cpt-corpus-mean',
    'corpus-reduction-b2',
    'cpt-corpus-wrong',
    'cpt-corpus-lanes',
    'corpus-reduction-b3',
    'corpus-incident-task',
  ],
};
