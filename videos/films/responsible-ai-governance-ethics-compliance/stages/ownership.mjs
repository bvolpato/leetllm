import { ids } from '../fixtures.mjs';
import { governancePermission } from '../construction.mjs';
import { riskErrors, sampleModel } from '../model.mjs';
import {
  drawGovernanceBodyCard,
  drawGovernanceBodyText,
  drawGovernanceBodyVisualFocus,
  drawGovernanceExpansionBox,
  drawGovernanceExpansionDocument,
  drawGovernanceExpansionFooter,
  drawGovernanceExpansionLines,
  drawGovernanceExpansionText,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  if (drawGovernanceExpansion(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('ownership', state),
    currentBeat = modelState.b;
  if (currentBeat === 1 && !governancePermission(state, 'residual-estimate')) {
    modelState.residual = null;
    modelState.residualScore = null;
    modelState.row = {
      ...modelState.row,
      residual: null,
    };
    modelState.errors = riskErrors(modelState.row);
  }
  {
    drawGovernanceBodyVisualFocus(
      ctx,
      api,
      'ownership-object-reviewer-estimates-ordinal-scales-from-1-to-5-11',
      () =>
        drawGovernanceBodyText(
          ctx,
          api,
          'Reviewer estimates · ordinal scales from 1 to 5',
          960,
          285,
          38,
          themeColors.yellow,
          'center',
        ),
    );
    drawGovernanceBodyVisualFocus(ctx, api, 'ownership-risk-grid', () =>
      teaching.grid({
        x: 240,
        y: 390,
        width: 520,
        height: 400,
        rows: 5,
        columns: 5,
        labels: Array.from(
          {
            length: 5,
          },
          (_, r) =>
            Array.from(
              {
                length: 5,
              },
              (_, column) => (r + 1) * (column + 1),
            ),
        ),
        fontSize: 30,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: [
          {
            row: 3,
            column: 4,
            fill: themeColors.panel,
            stroke: themeColors.pink,
          },
          ...(modelState.residual
            ? [
                {
                  row: modelState.residual.likelihood - 1,
                  column: modelState.residual.impact - 1,
                  fill: themeColors.panel,
                  stroke: themeColors.green,
                },
              ]
            : []),
        ],
      }),
    );
    drawGovernanceBodyText(
      ctx,
      api,
      `Inherent: 4 × 5 = ${modelState.inherentScore}`,
      950,
      430,
      35,
      themeColors.pink,
    );
    drawGovernanceBodyText(
      ctx,
      api,
      modelState.residual
        ? `Residual estimate: ${modelState.residual.likelihood} × ${modelState.residual.impact} = ${modelState.residualScore}`
        : 'Residual estimate: Pending assessment',
      950,
      530,
      34,
      modelState.residual ? themeColors.green : themeColors.muted,
    );
    drawGovernanceBodyVisualFocus(ctx, api, 'ownership-object-owner-13', () =>
      drawGovernanceBodyCard(
        ctx,
        api,
        `Owner: ${modelState.row.owner}`,
        930,
        590,
        780,
        themeColors.blue,
        85,
      ),
    );
    drawGovernanceBodyText(
      ctx,
      api,
      `Evidence references: ${modelState.row.evidence.length}`,
      950,
      745,
      32,
      themeColors.cyan,
    );
    drawGovernanceBodyVisualFocus(ctx, api, 'ownership-object-review-authorization-g7-15', () =>
      drawGovernanceBodyCard(
        ctx,
        api,
        `Review ${modelState.row.reviewDate} · authorization G7`,
        930,
        790,
        780,
        themeColors.cyan,
        80,
      ),
    );
    drawGovernanceBodyText(
      ctx,
      api,
      modelState.errors.length
        ? `Review held: ${modelState.errors.join(', ')} missing`
        : 'Complete owned row · ready for review',
      960,
      930,
      40,
      modelState.errors.length ? themeColors.pink : themeColors.green,
      'center',
    );
    {
    }
  }
}

export function drawOwnership(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}

// Permissions describe completed spoken claims. Intermediate diagrams remain observable.
function drawGovernanceExpansion(ctx, scene, state, api) {
  const baseIds = new Set(ids),
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (baseIds.has('ownership') && currentBeat < 3) return false;
  const { C: themeColors } = api,
    q = api.phase(progress, 0.08, 0.65);
  const focusId = baseIds.has('ownership')
    ? `${'ownership'}-extension-${currentBeat + 1}`
    : 'ownership-mechanism';
  // Every new cue points at the actual mechanism's bounding geometry.
  return api.focus.target(focusId, () => {
    {
      drawGovernanceExpansionDocument(
        ctx,
        api,
        180,
        300,
        760,
        500,
        'Risk row · assessed2026-11-06',
      );
      drawGovernanceExpansionLines(
        ctx,
        api,
        [
          'Owner: release owner',
          'Control: authorize exact proposal',
          'Evidence: attack report + replay',
          'Residual: reviewer estimate',
          'Review by:2026-11-06',
        ],
        220,
        420,
        31,
        themeColors.ink,
        68,
      );
      const row = {
        owner: 'Release owner',
        control: 'Gate',
        evidence: ['Report'],
        residual: 'Medium',
        reviewDate: '2026-11-06',
      };
      const y = api.lerp(760, 690, q);
      api.line(ctx, 975, 760, 1070, 760, themeColors.pink, 4);
      drawGovernanceExpansionBox(
        ctx,
        api,
        governancePermission(state, 'due-today')
          ? 'Due today → review held'
          : 'Compare review and assessment dates',
        1110,
        y,
        610,
        96,
        governancePermission(state, 'due-today') ? themeColors.pink : themeColors.muted,
      );
      drawGovernanceExpansionBox(
        ctx,
        api,
        'ISO review date after assessment',
        1110,
        440,
        610,
        96,
        themeColors.cyan,
      );
      drawGovernanceExpansionText(
        ctx,
        api,
        'Truth of evidence still needs review',
        1415,
        940,
        30,
        themeColors.yellow,
        'center',
      );
      drawGovernanceExpansionFooter(
        ctx,
        api,
        governancePermission(state, 'due-today')
          ? `Date predicate: due ≤ as-of · ${riskErrors(row).join(', ')} · changes can trigger earlier review`
          : 'A valid date and truthful evidence are separate review questions',
      );
    }
    return true;
  });
}
export default {
  id: 'ownership',
  draw: drawOwnership,
  cues: [
    'ownership-beat-1-focus-1',
    'ownership-beat-2-focus-1',
    'gov-residual-estimate',
    'ownership-beat-3-focus-1',
    'ownership-beat-3-focus-2',
    'ownership-extension-4',
    'gov-due-today',
  ],
};
