import { sampleModel } from '../model.mjs';
import { drawCard, legacyText } from '../defaults.mjs';
export function drawTree(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('tree', state),
    { b: currentBeat, q } = modelState;
  {
    const invalid = currentBeat
      ? q < 0.5
        ? 'gradient tree mismatch'
        : 'gradient shape mismatch'
      : null;
    legacyText(ctx, api, 'Parameter paths', 200, 300, 37, themeColors.blue);
    legacyText(ctx, api, 'Gradient paths', 1110, 300, 37, themeColors.cyan);
    const a = drawCard(ctx, api, 'params', 200, 385, 520, themeColors.blue),
      d = drawCard(ctx, api, 'grads', 1110, 385, 520, themeColors.cyan);
    const left = [
      api.focus.target('weight-path', () =>
        drawCard(ctx, api, 'weight · shape [2]', 100, 650, 390, themeColors.blue),
      ),
      api.focus.target('bias-path', () =>
        drawCard(ctx, api, 'bias · shape []', 570, 815, 390, themeColors.blue),
      ),
    ];
    const right = [
      api.focus.target('schema-check', () =>
        api.focus.target('gradient-path', () =>
          drawCard(
            ctx,
            api,
            invalid === 'gradient tree mismatch'
              ? 'kernel · shape [2]'
              : invalid
                ? 'weight · shape []'
                : 'weight · shape [2]',
            1030,
            650,
            390,
            invalid ? themeColors.pink : themeColors.cyan,
          ),
        ),
      ),
      api.focus.target('bias-path', () =>
        drawCard(ctx, api, 'bias · shape []', 1500, 815, 370, themeColors.cyan),
      ),
    ];
    for (const target of left)
      teaching.transfer({
        source: {
          shape: a,
          opacity: 1,
        },
        target: {
          shape: target,
          opacity: 1,
        },
        color: themeColors.blue,
        progress: q,
        particle: {
          radius: 6,
        },
      });
    for (const target of right)
      teaching.transfer({
        source: {
          shape: d,
          opacity: 1,
        },
        target: {
          shape: target,
          opacity: 1,
        },
        color: themeColors.cyan,
        progress: q,
        particle: {
          radius: 6,
        },
      });
    api.focus.target('schema-check', () =>
      legacyText(
        ctx,
        api,
        invalid || 'Match structure AND exact leaf shapes',
        960,
        1000,
        36,
        invalid ? themeColors.pink : themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'tree',
  draw: drawTree,
  cues: ['tree-b1-1', 'tree-b1-2', 'tree-b2-1', 'tree-b2-2'],
};
