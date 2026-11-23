import { bounded } from '../arithmetic.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionLine,
  drawExtensionRect,
  drawExtensionRow,
  drawExtensionTable,
  drawExtensionText,
} from '../defaults.mjs';
export function drawDaptTapt(ctx, scene, state, api) {
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
  if (!supported.has('dapt-tapt')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue dapt-tapt/' + id);
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
      drawExtensionHeading(ctx, api, 'Domain text available for next-token training');
      drawExtensionF(ctx, api, 'cpt-data-scope', () => {
        drawExtensionRect(ctx, api, 210, 390, 1450, 470, themeColors.panel, themeColors.blue);
        drawExtensionText(ctx, api, 'Payment service documents', 250, 455, 34, themeColors.blue);
        const tasks = cueProgress('cpt-scope-tapt', 0);
        ['Retry runbook', 'Token API docs', 'Release notes'].forEach((v, i) =>
          drawExtensionCell(ctx, api, v, 270 + i * 450, 515, 390, 80, themeColors.blue, 30),
        );
        drawExtensionText(ctx, api, 'Incoming incident reports', 270, 670, 32, themeColors.yellow);
        drawExtensionText(ctx, api, '“Token reissue timed out.”', 270, 758, 37, themeColors.ink);
        drawExtensionText(ctx, api, '“The worker pool is full.”', 945, 758, 37, themeColors.ink);
        if (tasks > 0)
          drawExtensionLine(ctx, api, 270, 793, 270 + 1280 * tasks, 793, themeColors.yellow, 6);
        if (tasks >= 1)
          drawExtensionText(
            ctx,
            api,
            'Task-adaptive pretraining reads these reports.',
            960,
            929,
            36,
            themeColors.yellow,
            'center',
          );
      });
    } else if (currentBeat === 1) {
      drawExtensionHeading(ctx, api, 'Keep the comparison on the complete assistant');
      drawExtensionF(ctx, api, 'cpt-scope-controls', () => {
        drawExtensionRow(
          ctx,
          api,
          ['base → SFT', 'base → reports → same SFT'],
          180,
          430,
          810,
          740,
          themeColors.blue,
          31,
        );
        drawExtensionRow(
          ctx,
          api,
          ['same incident tasks', 'same prompting and scoring'],
          180,
          650,
          810,
          740,
          themeColors.green,
          30,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-scope-evaluate', 1)
            ? 'Compare final task outcomes + retained abilities'
            : 'First check next-token loss on unseen reports.',
          180,
          905,
          31,
          themeColors.yellow,
        );
      });
    } else {
      drawExtensionHeading(ctx, api, 'Change the responsible input under matched controls');
      drawExtensionTable(
        ctx,
        api,
        ['What went wrong?', 'What to change', 'What to hold fixed'],
        [
          ['Old retry limit', 'Supply current runbook', 'Base weights'],
          ['Missing required steps', 'Template or demonstrations', 'Test incidents'],
          ['One reply is preferred', 'Train on ranked replies', 'Test incidents'],
        ],
        180,
        430,
        1560,
        150,
      );
    }
    if (currentBeat === 0)
      drawExtensionFoot(ctx, api, 'Don’t Stop Pretraining  ·  Gururangan et al., 2020');
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('dapt-tapt-construction')),
    )
  )
    drawExtensionF(ctx, api, 'dapt-tapt-construction', construct);
  else construct();
  return;
}
export default {
  id: 'dapt-tapt',
  draw: drawDaptTapt,
  cues: ['dapt-tapt-b1', 'cpt-scope-tapt', 'dapt-tapt-b2', 'cpt-scope-evaluate', 'dapt-tapt-b3'],
};
