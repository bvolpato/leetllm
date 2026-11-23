import { visionPreln } from '../arithmetic.mjs';
import { visionBound, visionCueStarted } from '../construction.mjs';
import { arrow, card, detailText, footer, line, title, vectorLabel } from '../defaults.mjs';
export function drawPrelnBlock(ctx, scene, state, api) {
  api.focus.target('preln-block-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = visionBound(state.beatP ?? 0);
    const beg = (name, fallback = progress > 0.4) => visionCueStarted(state.cues, name, fallback);
    {
      const r = visionPreln(),
        showResidual =
          currentBeat > 1 || (currentBeat === 1 && beg('preln-first-residual', progress > 0.15)),
        showNorm =
          currentBeat > 1 || (currentBeat === 1 && beg('preln-normalize', progress > 0.35)),
        showExpand = currentBeat > 1 || (currentBeat === 1 && beg('preln-expand', progress > 0.5)),
        showGelu = currentBeat > 1 || (currentBeat === 1 && beg('preln-gelu', progress > 0.65)),
        showFinal = currentBeat > 1 || (currentBeat === 1 && beg('preln-final', progress > 0.8));
      title(ctx, api, 'The residual path retains its state while each branch computes an update');
      card(ctx, api, 'input [2,4]', 190, 365, 370, 90, themeColors.blue, 32);
      card(ctx, api, 'attention update [0.5,−0.5]', 800, 365, 860, 90, themeColors.cyan, 31);
      arrow(ctx, api, 570, 410, 760, 410);
      card(
        ctx,
        api,
        showResidual ? vectorLabel(ctx, api, r.residual) : 'retained input + attention',
        190,
        565,
        650,
        90,
        themeColors.blue,
        32,
      );
      line(ctx, api, 375, 460, 375, 550, themeColors.blue, 4);
      if (showNorm)
        card(
          ctx,
          api,
          'LN ' + vectorLabel(ctx, api, r.norm),
          1040,
          550,
          660,
          90,
          themeColors.yellow,
          30,
        );
      if (showExpand)
        card(
          ctx,
          api,
          'W1 ' + vectorLabel(ctx, api, r.expanded),
          860,
          690,
          850,
          85,
          themeColors.pink,
          27,
        );
      if (showGelu)
        card(
          ctx,
          api,
          'GELU ' + vectorLabel(ctx, api, r.gelu),
          860,
          810,
          850,
          85,
          themeColors.pink,
          27,
        );
      if (showFinal)
        card(
          ctx,
          api,
          'retain residual + W2 update = ' + vectorLabel(ctx, api, r.output),
          190,
          910,
          1510,
          75,
          themeColors.green,
          31,
        );
      if (currentBeat === 0) {
        detailText(
          ctx,
          api,
          'LN → attention → add original state',
          960,
          760,
          34,
          themeColors.cyan,
          'center',
        );
        detailText(
          ctx,
          api,
          'LN → MLP → add the new residual state',
          960,
          860,
          34,
          themeColors.pink,
          'center',
        );
      }
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Real ViT-B: 12 blocks · width 768 · 12 heads × 64 · MLP 768→3072→768'
          : 'Supplied two-coordinate arithmetic; W1 repeats coordinates, W2 averages corresponding duplicates',
      );
    }
    return true;
  });
}
export default {
  id: 'preln-block',
  draw: drawPrelnBlock,
  cues: [
    'preln-block-beat-0',
    'preln-block-beat-1',
    'preln-first-residual',
    'preln-normalize',
    'preln-expand',
    'preln-gelu',
    'preln-final',
    'preln-block-beat-2',
  ],
};
