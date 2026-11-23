import { decodeRepetition } from '../arithmetic.mjs';
import { coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawSignAware(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-sign-aware-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-sign-aware-mechanism', () => {
    coreTitle(ctx, api, 'Transform each distinct seen token using its raw sign');
    const raw = [2.4, -0.5, 0.7],
      out = decodeRepetition(raw, [0, 0, 1], 1.2);
    coreVector(ctx, api, raw, ['seen ID 0', 'seen ID 1', 'unseen ID 2'], 230, 390, 1460);
    coreText(
      ctx,
      api,
      'history: [0, 0, 1] → unique seen set {0, 1}',
      960,
      320,
      27,
      themeColors.muted,
    );
    ['÷ 1.2', '× 1.2', 'unchanged'].forEach((x, i) => {
      coreText(ctx, api, x, 465 + i * 487, 615, 35, themeColors.cyan);
      api.arrow(ctx, 465 + i * 487, 655, 465 + i * 487, 725, themeColors.cyan, 3);
    });
    coreVector(ctx, api, done('sign-values') ? out : [null, null, null], null, 230, 800, 1460);
    coreFoot(
      ctx,
      api,
      currentBeat === 1
        ? 'Penalty > 1 penalizes seen logits; values below 1 reward them. The configured history may include the prompt.'
        : 'Repeated history IDs do not apply this unique-ID transform twice.',
    );
    return;
  });
}
export default {
  id: 'sign-aware',
  draw: drawSignAware,
  cues: ['dec-sign-aware-1', 'dec-sign-values', 'dec-sign-aware-2', 'dec-sign-aware-3'],
};
