import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText } from '../defaults.mjs';
export function drawTypedInputs(ctx, scene, state, api) {
  const frameState = visionFrame('typed-inputs', state);
  return api.focus.target('dv-typed-inputs-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const numeric = currentBeat === 1,
        separate = currentBeat === 2;
      const label = numeric ? 'Damage probability' : separate ? 'Human label' : 'Quality label';
      const input = numeric ? 'true' : separate ? 'confirmed damage' : 'unusable';
      const rejection = numeric
        ? resultComplete('numeric-boolean', 1)
        : resultComplete('unknown-label', 0);
      visionCard(ctx, api, label, 150, 350, 490, 100, themeColors.blue);
      visionCard(
        ctx,
        api,
        input,
        150,
        500,
        490,
        115,
        numeric ? themeColors.pink : themeColors.yellow,
      );
      const validator = visionCard(
        ctx,
        api,
        numeric
          ? 'Literal numeric type + [0,1]'
          : separate
            ? 'Offline evaluation channel'
            : 'Preserve unknown label',
        850,
        425,
        450,
        125,
        themeColors.cyan,
      );
      api.arrow(ctx, 670, 475, 820, 475, themeColors.cyan, 3);
      if (separate) {
        const output = visionCard(
          ctx,
          api,
          'Supplied model output',
          150,
          730,
          490,
          100,
          themeColors.yellow,
        );
        const routeBox = visionCard(ctx, api, 'Router', 1430, 690, 300, 110, themeColors.green);
        api.arrow(
          ctx,
          output.x + output.width + 30,
          785,
          routeBox.x - 30,
          745,
          themeColors.yellow,
          3,
        );
        visionText(
          ctx,
          api,
          'Labels never choose this route',
          1120,
          880,
          31,
          themeColors.ink,
          'center',
        );
        visionText(ctx, api, 'Later outcome join', 1560, 445, 29, themeColors.cyan, 'center');
      } else {
        visionCard(
          ctx,
          api,
          rejection ? (numeric ? 'Reject Boolean' : 'Damage unknown') : 'Validation pending',
          1430,
          425,
          330,
          125,
          rejection ? (numeric ? themeColors.pink : themeColors.green) : themeColors.muted,
        );
        visionText(
          ctx,
          api,
          numeric
            ? 'Python bool is integer-like; the contract excludes it.'
            : 'Missing or unusable judgment does not mean clear.',
          960,
          815,
          31,
          themeColors.ink,
          'center',
        );
      }
      visionNote(
        ctx,
        api,
        'Input validation, routing outputs and offline human labels retain distinct types and roles.',
      );
    }
  });
}
export default {
  id: 'typed-inputs',
  draw: drawTypedInputs,
  cues: [
    'dv-typed-inputs-0',
    'dv-typed-inputs-operation-0',
    'dv-unknown-label',
    'dv-typed-inputs-1',
    'dv-typed-inputs-operation-1',
    'dv-numeric-boolean',
    'dv-typed-inputs-2',
    'dv-typed-inputs-operation-2',
    'dv-label-channel',
  ],
};
