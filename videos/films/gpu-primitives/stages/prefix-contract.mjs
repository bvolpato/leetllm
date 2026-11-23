import { ARTICLE_INPUT, ARTICLE_PREFIX } from '../fixtures.mjs';
import { drawExtendedBox as box, text } from '../defaults.mjs';
import { cue, number, signed } from '../score-trace.mjs';

export function drawPrefixContract(ctx, scene, state, api) {
  const { C } = api;
  const before = cue(state, 'prefix-contract-step-1', 0, 0.35, 0.55);
  const through = cue(state, 'prefix-inclusive', 0, 0.58, 0.75);
  const following = cue(state, 'prefix-full', 1, 0.35, 0.54) > 0;
  api.focus.target('prefix-boundaries', () => {
    const row = (y, name, values, active, color) => {
      text(ctx, api, name, 130, y + 56, 36, color, 'left');
      values.forEach((value, i) => {
        const selected =
          state.beat === 1 && (i === 5 || (following && i === 6 && name === 'Before'));
        const x = 380 + 176 * i;
        box(ctx, api, active ? value : '…', x, y, 146, 85, selected ? C.yellow : color, 41);
      });
    };
    row(346, 'Play', ARTICLE_INPUT.map(signed), true, C.blue);
    row(506, 'Before', ARTICLE_PREFIX.map(number), before >= 1, C.cyan);
    row(
      666,
      'Through',
      ARTICLE_INPUT.map((v, i) => number(ARTICLE_PREFIX[i] + v)),
      through >= 1,
      C.green,
    );
    if (state.beat === 1)
      api.focus.target('prefix-alignment', () => {
        text(ctx, api, '12 before     − 9 points     = 3 through', 960, 916, 49, C.yellow);
      });
    if (state.beat === 2)
      api.focus.target('prefix-identity', () => {
        text(ctx, api, 'Empty sum   0         Empty argmax   no source index', 960, 916, 41, C.ink);
      });
  });
}
export default {
  id: 'prefix-contract',
  draw: drawPrefixContract,
  cues: [
    'prefix-inputs',
    'prefix-contract-step-1',
    'prefix-inclusive',
    'prefix-contract-step-2',
    'prefix-full',
    'prefix-contract-step-3',
  ],
};
