import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { done } from '../construction.mjs';
import { instructionF, instructionFoot, instructionRow, instructionT } from '../defaults.mjs';
export function drawRoleValidation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['role-validation'] ?? [], () =>
    instructionF(ctx, api, 'role-validation-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      instructionT(
        ctx,
        api,
        'Completed SFT mode · optional S then alternating U,A',
        180,
        310,
        35,
        themeColors.ink,
      );
      const rows = [['S', 'U', 'A', 'U', 'A'], ['U', 'U', 'A'], ['S'], ['U']];
      rows.forEach((r, i) => {
        const y = 390 + i * 130;
        instructionRow(ctx, api, r, 280, y, {
          step: 180,
          w: 155,
          size: 34,
          color: i === 0 ? themeColors.blue : themeColors.muted,
        });
        instructionT(
          ctx,
          api,
          i === 0
            ? resultComplete('im-role-complete')
              ? 'structurally complete'
              : 'inspect last role'
            : resultComplete('im-role-errors')
              ? 'reject'
              : 'inspect role order',
          1320,
          y + 45,
          33,
          i === 0 ? themeColors.green : themeColors.pink,
        );
      });
    } else if (beat === 1) {
      instructionT(
        ctx,
        api,
        'Same messages · different requested mode',
        180,
        320,
        36,
        themeColors.ink,
      );
      instructionRow(ctx, api, ['S', 'U', 'A', 'U'], 280, 440, {
        step: 300,
        w: 260,
        size: 40,
        color: themeColors.blue,
      });
      instructionF(ctx, api, 'im-generation-mode', () =>
        instructionT(
          ctx,
          api,
          resultComplete('im-generation-mode', 1)
            ? 'Fresh generation accepts final U; completed SFT rejects it'
            : 'The final assistant answer has not been supplied',
          280,
          730,
          35,
          resultComplete('im-generation-mode', 1) ? themeColors.green : themeColors.muted,
        ),
      );
    } else {
      instructionRow(ctx, api, ['U', 'A'], 250, 400, {
        step: 600,
        w: 530,
        size: 40,
        color: themeColors.green,
      });
      instructionF(ctx, api, 'im-false-content', () => {
        instructionT(ctx, api, 'structure: valid', 250, 645, 39, themeColors.green);
        instructionT(
          ctx,
          api,
          'claim: “No ticket is required after 18 days”',
          250,
          770,
          36,
          themeColors.pink,
        );
        instructionT(ctx, api, 'evidence support: reject', 250, 900, 39, themeColors.pink);
      });
    }
    instructionFoot(
      ctx,
      api,
      'This lab’s text-only schema does not define tool, multimodal or completion-only schemas',
    );
  }
}
export default {
  id: 'role-validation',
  draw: drawRoleValidation,
  cues: [
    'role-validation-b1',
    'im-role-errors',
    'im-role-complete',
    'role-validation-b2',
    'im-generation-mode',
    'role-validation-b3',
    'im-false-content',
  ],
};
