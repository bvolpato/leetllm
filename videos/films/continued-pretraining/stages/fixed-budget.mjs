import { bounded, interpolate } from '../arithmetic.mjs';
import { shuffleOwners } from '../model.mjs';
import {
  drawExtensionCell,
  drawExtensionF,
  drawExtensionFoot,
  drawExtensionHeading,
  drawExtensionOwnedStrip,
  drawExtensionRow,
  drawExtensionText,
} from '../defaults.mjs';
export function drawFixedBudget(ctx, scene, state, api) {
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
  if (!supported.has('fixed-budget')) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
      const cue = state.cues?.[id];
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared cue fixed-budget/' + id);
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
    if (currentBeat <= 1) {
      drawExtensionHeading(ctx, api, 'Same budget for both windows: 2 million tokens');
      const proposed = cueProgress('cpt-budget-quarter', 0) > 0;
      const result = cueProgress('budget-domain-result', 1);
      drawExtensionF(ctx, api, 'cpt-budget-strip', () => {
        const window = (y, replay, fieldLabel) => {
          const width = 1460;
          const fields = 1 - replay;
          api.text(ctx, fieldLabel, 230, y - 32, 45, themeColors.blue);
          api.text(
            ctx,
            `Replay   ${(2 * replay).toFixed(2)}M`,
            1690,
            y - 32,
            45,
            themeColors.yellow,
            'right',
          );
          api.rect(ctx, 230, y, width * fields, 67, themeColors.blue, undefined, 0);
          api.rect(
            ctx,
            230 + width * fields,
            y,
            width * replay,
            67,
            themeColors.yellow,
            undefined,
            0,
          );
        };
        window(478, 0.05, 'Field notes   1.90M');
        if (proposed) {
          const replay = interpolate(0.05, 0.25, cueProgress('cpt-budget-quarter', 0));
          window(720, replay, result >= 1 ? 'Field notes   1.50M' : 'Field notes   ?');
          api.text(
            ctx,
            result >= 1
              ? '400,000 tokens moved from field notes to replay.'
              : 'How much room is left for field notes?',
            960,
            918,
            40,
            themeColors.ink,
            'center',
          );
        }
      });
    } else if (currentBeat === 2) {
      drawExtensionHeading(ctx, api, 'One window · 15 domain and 5 replay blocks');
      const q = cueProgress('cpt-budget-shuffle', 2);
      drawExtensionF(ctx, api, 'cpt-budget-owners', () => {
        drawExtensionText(ctx, api, 'selected source blocks', 180, 390, 28, themeColors.muted);
        drawExtensionText(ctx, api, 'Shuffle order with seed 7', 1040, 390, 28, themeColors.muted);
        for (const a of shuffleOwners(q))
          drawExtensionCell(
            ctx,
            api,
            (a.id < 15 ? 'D' : 'R') + (a.id < 15 ? a.id + 1 : a.id - 14),
            a.x,
            a.y,
            90,
            50,
            a.id < 15 ? themeColors.blue : themeColors.yellow,
            26,
          );
        if (q === 1)
          drawExtensionText(
            ctx,
            api,
            'One selected window; a real loader must advance both source cursors',
            180,
            970,
            28,
            themeColors.green,
          );
      });
    } else if (currentBeat === 3) {
      drawExtensionHeading(ctx, api, 'round(0.25 × 10) = round(2.5)');
      drawExtensionF(ctx, api, 'cpt-budget-round', () => {
        drawExtensionRow(
          ctx,
          api,
          Array.from(
            {
              length: 10,
            },
            (_, i) =>
              !resultComplete('cpt-budget-round', 3) ? '?' : i < 2 ? 'R' + (i + 1) : 'D' + (i - 1),
          ),
          180,
          480,
          160,
          140,
          (i) =>
            !resultComplete('cpt-budget-round', 3)
              ? themeColors.muted
              : i < 2
                ? themeColors.yellow
                : themeColors.blue,
          30,
        );
        drawExtensionText(
          ctx,
          api,
          resultComplete('cpt-budget-round', 3)
            ? 'Ties to even → 2 replay blocks → 20% replay'
            : 'Predict the realized share from integer selection',
          180,
          760,
          37,
          themeColors.yellow,
        );
        drawExtensionText(
          ctx,
          api,
          'Carry the remaining 0.5 into the next window.',
          180,
          920,
          31,
          themeColors.cyan,
        );
      });
    } else {
      drawExtensionHeading(
        ctx,
        api,
        'Historical inventory and consumed training tokens use different denominators',
      );
      drawExtensionOwnedStrip(
        ctx,
        api,
        [
          {
            mass: 0.51,
            label: 'financial 51%',
            color: themeColors.blue,
          },
          {
            mass: 0.49,
            label: 'public 49%',
            color: themeColors.yellow,
          },
        ],
        230,
        440,
      );
      drawExtensionText(ctx, api, 'Available   ≈ 709B tokens', 230, 720, 39, themeColors.blue);
      drawExtensionText(ctx, api, 'Consumed   569B tokens', 230, 880, 39, themeColors.cyan);
      drawExtensionText(
        ctx,
        api,
        'BloombergGPT: trained from scratch',
        1080,
        880,
        30,
        themeColors.muted,
      );
    }
    if (currentBeat === 2) drawExtensionFoot(ctx, api, 'D = domain block     R = replay block');
    if (currentBeat === 3)
      drawExtensionFoot(
        ctx,
        api,
        'Compare token budgets with the same model, lengths, masks and execution.',
      );
  };
  if (
    scene.beats?.some((b) =>
      b.visual_cues?.some((c) => c.targets?.includes('fixed-budget-construction')),
    )
  )
    drawExtensionF(ctx, api, 'fixed-budget-construction', construct);
  else construct();
  return;
}
export default {
  id: 'fixed-budget',
  draw: drawFixedBudget,
  cues: [
    'fixed-budget-b1',
    'cpt-budget-quarter',
    'budget-domain-result',
    'fixed-budget-b2',
    'cpt-budget-shuffle',
    'fixed-budget-b3',
    'cpt-budget-round',
    'fixed-budget-inventory',
  ],
};
