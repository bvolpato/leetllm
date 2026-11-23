import { complete, exactCue, pyP } from '../construction.mjs';
import { footer, pyMark, rail, text } from '../defaults.mjs';
export function drawValueTypes(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = pyP(state, 'value-types');
  pyMark(api, 'value-types', () => {
    if (currentBeat === 0) {
      const values = [
        ['dict', '{"expected":"blocked"}'],
        ['list', '[row101, row102, row103]'],
        ['tuple', '(matches, total, fraction)'],
        ['str', '"blocked"'],
        ['int', '2'],
        ['float', '2 / 3'],
        ['bool', 'False'],
        ['NoneType', 'None'],
      ];
      values.forEach(([type, value], i) => {
        const col = i % 2,
          row = Math.floor(i / 2),
          x = 175 + col * 820,
          y = 300 + row * 145,
          shown = i < Math.max(1, Math.ceil(progress * 8));
        text(ctx, api, type, x, y + 40, 32, api.C.blue, 'left', true);
        rail(
          ctx,
          api,
          x + 180,
          y,
          580,
          shown ? value : '…',
          shown ? api.C.cyan : api.C.muted,
          90,
          27,
        );
      });
    } else if (currentBeat === 1) {
      const values = [
        ['"7"', 'str'],
        ['7', 'int'],
        ['7.0', 'float'],
      ];
      values.forEach(([v, t], i) => {
        rail(
          ctx,
          api,
          260 + i * 530,
          330,
          400,
          v + ' · ' + t,
          i === 0 ? api.C.blue : api.C.cyan,
          120,
          42,
        );
      });
      if (complete(state, 'py-types-equal')) {
        text(ctx, api, '7 == 7.0 → True', 1200, 560, 38, api.C.green, 'center', true);
        text(ctx, api, '"7" == 7 → False', 1200, 630, 38, api.C.pink, 'center', true);
      }
      const r = exactCue(state, 'py-types-rebind');
      rail(ctx, api, 240, 730, 620, 'row["prediction"] = " ESCALATED "', api.C.blue, 90, 27);
      rail(
        ctx,
        api,
        1050,
        730,
        620,
        r === 1 ? 'prediction = "escalated"' : 'prediction = " ESCALATED "',
        api.C.cyan,
        90,
        29,
      );
      text(ctx, api, 'Original field', 550, 895, 29, api.C.muted, 'center');
      text(ctx, api, 'Rebound local name', 1360, 895, 29, api.C.muted, 'center');
    } else {
      const converted = complete(state, 'py-types-coerce'),
        internal = complete(state, 'py-types-internal');
      rail(ctx, api, 240, 330, 550, 'prediction = 7 · int', api.C.blue, 100, 35);
      text(ctx, api, 'str(7)', 960, 395, 40, api.C.yellow, 'center', true);
      rail(
        ctx,
        api,
        1130,
        330,
        550,
        converted ? '"7" · str' : 'conversion pending',
        api.C.cyan,
        100,
        35,
      );
      if (converted)
        text(
          ctx,
          api,
          'The producer’s label contract is still broken.',
          960,
          540,
          37,
          api.C.pink,
          'center',
        );
      rail(ctx, api, 240, 680, 550, '" BLOCK ED "', api.C.blue, 100, 38);
      text(ctx, api, 'strip().lower()', 960, 745, 30, api.C.yellow, 'center', true);
      rail(
        ctx,
        api,
        1130,
        680,
        550,
        internal ? '"block ed"' : 'new string pending',
        api.C.cyan,
        100,
        35,
      );
      if (internal)
        text(ctx, api, 'The internal space remains.', 1400, 870, 31, api.C.muted, 'center');
    }
  });
  footer(
    ctx,
    api,
    'A conversion changes a representation; the schema decides whether it is allowed.',
  );
}
export default {
  id: 'value-types',
  draw: drawValueTypes,
  cues: [
    'py-value-types-0',
    'py-types-none',
    'py-value-types-1',
    'py-types-equal',
    'py-types-rebind',
    'py-value-types-2',
    'py-types-coerce',
    'py-types-internal',
  ],
};
