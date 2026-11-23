import { sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer, table } from '../defaults.mjs';
export function drawConfigMutation(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('config-mutation', state),
    currentBeat = modelState.b;
  {
    const { C } = api,
      id = 'config-mutation';
    {
      chapterText(ctx, api, 'Prompt template 17 remains identical', 960, 280, 35, C.blue, 'center');
      const nodes = [
        chip(ctx, api, 'Held object', 150, 390, 480, C.blue, 105),
        chip(ctx, api, 'Registry version 17', 725, 390, 500, C.cyan, 105),
        chip(ctx, api, 'Explicit fresh load', 1320, 390, 470, C.green, 105),
      ];
      [modelState.held, modelState.registry, modelState.fresh].forEach((value, i) =>
        chapterText(
          ctx,
          api,
          value === null ? 'not loaded' : 'temperature ' + value.toFixed(1),
          [390, 975, 1555][i],
          615,
          31,
          value === 0.8 ? C.pink : i === 0 ? C.blue : C.cyan,
          'center',
        ),
      );
      if (currentBeat === 0) flow(ctx, api, nodes[1], nodes[2], modelState.load);
      if (currentBeat === 1) {
        table(
          ctx,
          api,
          170,
          765,
          [750, 850],
          [
            ['Earlier retained config', 'Fresh current config'],
            ['{prompt:17, temp:.2}', '{prompt:17, temp:.8}'],
          ],
          [C.muted, C.cyan],
        );
      }
      if (currentBeat === 2) {
        chip(ctx, api, 'Version cache: no default expiry', 160, 775, 740, C.muted, 105);
        chip(ctx, api, 'Alias cache: default 60 seconds', 1030, 775, 740, C.yellow, 105);
      }
      footer(ctx, api, 'Keep the temperature each worker loaded with its request.');
    }
  }
}
export default {
  id: 'config-mutation',
  draw: drawConfigMutation,
  cues: [
    'mf-config-mutation-0',
    'mf-sentence-config-mutation-0-0',
    'mf-sentence-config-mutation-0-1',
    'mf-sentence-config-mutation-0-2',
    'mf-sentence-config-mutation-0-3',
    'mf-config-mutation-1',
    'mf-sentence-config-mutation-1-0',
    'mf-sentence-config-mutation-1-1',
    'mf-sentence-config-mutation-1-2',
    'mf-sentence-config-mutation-1-3',
    'mf-config-mutation-2',
    'mf-sentence-config-mutation-2-0',
    'mf-sentence-config-mutation-2-1',
    'mf-sentence-config-mutation-2-2',
    'mf-sentence-config-mutation-2-3',
  ],
};
