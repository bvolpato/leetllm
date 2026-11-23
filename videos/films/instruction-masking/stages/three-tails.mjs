import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import { instructionF, instructionRow, instructionT } from '../defaults.mjs';
export function drawThreeTails(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['three-tails'] ?? [], () =>
    instructionF(ctx, api, 'three-tails-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    instructionT(ctx, api, 'One unchanged system + user prefix', 180, 315, 35, themeColors.blue);
    instructionRow(ctx, api, ['<S>', 'P14', '<E>', '<U>', 'age18?', '<E>'], 180, 370, {
      step: 250,
      w: 230,
      size: 34,
      color: themeColors.blue,
    });
    const tails = [
      ['training', ['<A>', 'Open', 'ticket', '<E>'], 'im-train-tail'],
      ['fresh generation', ['<A>', '?'], 'im-generate-tail'],
      ['assistant prefill', ['<A>', '{"rotation…":'], 'im-prefill-tail'],
    ];
    tails.forEach(([name, values, id], i) => {
      const y = 540 + i * 135;
      instructionT(ctx, api, name, 180, y + 40, 30, themeColors.muted);
      instructionF(ctx, api, id, () => {
        if (cueProgress2(id, 0) > 0) {
          instructionRow(ctx, api, values, 680, y, {
            step: 255,
            w: 235,
            h: 65,
            color: i === 0 ? themeColors.green : themeColors.yellow,
            size: 30,
          });
          if (i === 2)
            instructionT(ctx, api, 'message stays open', 1320, y + 44, 28, themeColors.muted);
        }
      });
    });
    if (beat === 1 || beat === 2) {
      instructionT(
        ctx,
        api,
        'new assistant = true   AND   continue final = true',
        960,
        945,
        33,
        themeColors.yellow,
        'center',
      );
      if (beat === 2 && resultComplete('three-tails-conflict-result', 2))
        instructionT(
          ctx,
          api,
          'REJECT incompatible tail ownership',
          960,
          1000,
          33,
          themeColors.pink,
          'center',
        );
    } else if (beat === 3)
      instructionF(ctx, api, 'im-json-validation', () =>
        instructionT(
          ctx,
          api,
          resultComplete('im-json-validation', 3)
            ? 'Parse the completed JSON. Check its fields against the schema and its values against the policy.'
            : 'The model continues the open JSON field',
          960,
          960,
          32,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'three-tails',
  draw: drawThreeTails,
  cues: [
    'three-tails-b1',
    'im-train-tail',
    'im-generate-tail',
    'im-prefill-tail',
    'three-tails-b2',
    'three-tails-conflict-result',
    'three-tails-b3',
    'im-json-validation',
  ],
};
