import { ids } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import {
  drawGovernanceBodyCard,
  drawGovernanceBodyText,
  drawGovernanceBodyVisualFocus,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  if (drawGovernanceExpansion(ctx, scene, state, api)) return;
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('audit', state),
    currentBeat = modelState.b;
  {
    const selected =
      currentBeat === 0
        ? Math.min(2, Math.floor(modelState.q * 3))
        : currentBeat === 1
          ? modelState.recomputedCount === 0
            ? 1
            : Math.min(2, modelState.recomputedCount - 1)
          : 2;
    drawGovernanceBodyText(
      ctx,
      api,
      'Case C17 · follow the digest into the next event',
      960,
      270,
      33,
      themeColors.ink,
      'center',
    );
    const inputs = [],
      outputs = [];
    drawGovernanceBodyVisualFocus(ctx, api, 'audit-simulation-21', () =>
      modelState.current.forEach((value, i) => {
        const x = 140 + i * 575,
          color = modelState.nodeChecks[i] ? themeColors.cyan : themeColors.pink,
          active = i === selected;
        components.fade(active ? 1 : 0.4, () => {
          drawGovernanceBodyCard(
            ctx,
            api,
            value.event,
            x,
            330,
            480,
            active
              ? themeColors.yellow
              : i === 1 && currentBeat > 0
                ? themeColors.pink
                : themeColors.blue,
            75,
          );
          drawGovernanceBodyText(
            ctx,
            api,
            value.value,
            x + 240,
            455,
            25,
            themeColors.ink,
            'center',
          );
          inputs.push(
            drawGovernanceBodyCard(
              ctx,
              api,
              'previous: ' + value.previous.slice(0, 12),
              x,
              510,
              480,
              color,
              70,
            ),
          );
          const hashOp = drawGovernanceBodyCard(
            ctx,
            api,
            'SHA-256(event, previous)',
            x,
            640,
            480,
            color,
            70,
          );
          outputs.push(
            drawGovernanceBodyCard(ctx, api, value.hash.slice(0, 16), x, 770, 480, color, 70),
          );
          api.connect(ctx, inputs[i], hashOp, {
            color,
            gap: 12,
          });
          api.connect(ctx, hashOp, outputs[i], {
            color,
            gap: 12,
          });
        });
      }),
    );
    drawGovernanceBodyVisualFocus(ctx, api, 'audit-simulation-27', () => {
      for (let i = 0; i < 2; i++) {
        const x = 620 + i * 575,
          mid = x + 50,
          end = 715 + i * 575,
          color =
            modelState.current[i + 1].previous === modelState.current[i].hash
              ? themeColors.cyan
              : themeColors.pink;
        api.path(
          ctx,
          [
            {
              x: x + 8,
              y: 805,
            },
            {
              x: mid,
              y: 805,
            },
            {
              x: mid,
              y: 545,
            },
            {
              x: end - 20,
              y: 545,
            },
          ],
          {
            color,
            width: i === selected ? 5 : 2,
          },
        );
        api.arrow(ctx, mid, 545, end - 10, 545, color, 3);
      }
    });
    const protectedHead = drawGovernanceBodyCard(
      ctx,
      api,
      'Protected head: ' + modelState.anchor.slice(0, 16),
      1150,
      925,
      650,
      themeColors.yellow,
      75,
    );
    components.fade(selected === 2 ? 1 : 0.4, () =>
      api.connect(ctx, outputs[2], protectedHead, {
        color: modelState.anchorMatches ? themeColors.green : themeColors.pink,
        gap: 16,
      }),
    );
    drawGovernanceBodyText(
      ctx,
      api,
      'Internal checks: ' + modelState.internallyValid,
      520,
      950,
      32,
      modelState.internallyValid ? themeColors.green : themeColors.pink,
      'center',
    );
    drawGovernanceBodyText(
      ctx,
      api,
      currentBeat === 0
        ? 'Original event chain'
        : 'Recomputed ' + modelState.recomputedCount + '/3 digests',
      520,
      1025,
      28,
      themeColors.muted,
      'center',
    );
    drawGovernanceBodyText(
      ctx,
      api,
      'Protected anchor matches: ' + modelState.anchorMatches,
      1475,
      1040,
      30,
      modelState.anchorMatches ? themeColors.green : themeColors.pink,
      'center',
    );
  }
}

export function drawAudit(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}

// Permissions describe completed spoken claims. Intermediate diagrams remain observable.
function drawGovernanceExpansion(ctx, scene, state, api) {
  const baseIds = new Set(ids),
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (baseIds.has('audit') && currentBeat < 3) return false;
  const q = api.phase(progress, 0.08, 0.65);
  const focusId = baseIds.has('audit')
    ? `${'audit'}-extension-${currentBeat + 1}`
    : 'audit-mechanism';
  // Every new cue points at the actual mechanism's bounding geometry.
  return api.focus.target(focusId, () => {
    return false;
    return true;
  });
}
export default {
  id: 'audit',
  draw: drawAudit,
  cues: [
    'audit-beat-1-focus-1',
    'audit-beat-1-focus-2',
    'audit-beat-2-focus-1',
    'audit-beat-3-focus-1',
    'audit-beat-3-focus-2',
  ],
};
