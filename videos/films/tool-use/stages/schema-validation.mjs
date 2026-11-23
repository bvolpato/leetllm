import { cueBegun } from '../arithmetic.mjs';
import { validArgs } from '../model.mjs';
import { card, codeCard, foot, visualFocus } from '../defaults.mjs';
export function drawSchemaValidation(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  const route = (a, b, color = themeColors.cyan, progress = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      gap: 15,
      width: 3,
    });
    components.particle({
      points: [r.from, r.to],
      progress,
      fill: color,
      radius: 8,
    });
  };
  {
    visualFocus(ctx, api, 'schema-contract', () =>
      codeCard(
        ctx,
        api,
        ['book_id: string · minLength: 1 · additionalProperties: false'],
        170,
        280,
        1580,
        themeColors.cyan,
        80,
        27,
      ),
    );
    const examples = [
      {
        id: 'valid',
        args: {
          book_id: 'B7',
        },
        visible: true,
      },
      {
        id: 'numeric',
        args: {
          book_id: 7,
        },
        visible:
          beat > 1 ||
          (beat === 1 && cueBegun(state.cues, 'schema-validation-beat-2-focus-1', true)),
      },
      {
        id: 'extra-field',
        args: {
          book_id: 'B7',
          place_hold: true,
        },
        visible:
          beat > 1 || (beat === 1 && cueBegun(state.cues, 'schema-extra-field', progress2 > 0.3)),
      },
    ];
    examples.forEach((row, i) => {
      if (!row.visible) return;
      const accepted = validArgs(row.args);
      visualFocus(ctx, api, 'schema-' + row.id, () => {
        const a = codeCard(
            ctx,
            api,
            [JSON.stringify(row.args)],
            150,
            410 + i * 145,
            1000,
            accepted ? themeColors.green : themeColors.pink,
            95,
            27,
          ),
          z = card(
            ctx,
            api,
            accepted
              ? 'Shape accepted'
              : i === 1
                ? 'Reject: expected string'
                : 'Reject: extra field',
            1380,
            410 + i * 145,
            410,
            accepted ? themeColors.green : themeColors.pink,
            95,
            27,
          );
        route(a, z, accepted ? themeColors.green : themeColors.pink, 1);
      });
    });
    if (beat === 2)
      visualFocus(ctx, api, 'schema-resource-meaning', () =>
        card(
          ctx,
          api,
          'String shape accepted → resolve resource\nMissing B404: not found · another account: policy denial',
          270,
          880,
          1380,
          themeColors.yellow,
          110,
          29,
        ),
      );
    else foot(ctx, api, 'Shape checks admit one narrow lookup contract');
  }
}
export default {
  id: 'schema-validation',
  draw: drawSchemaValidation,
  cues: [
    'schema-validation-beat-1-focus-1',
    'schema-validation-beat-2-focus-1',
    'schema-extra-field',
    'schema-validation-beat-3-focus-1',
  ],
};
