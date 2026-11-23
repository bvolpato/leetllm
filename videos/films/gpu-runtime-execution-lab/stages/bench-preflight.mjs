import { sampleRuntimeChapter } from '../construction.mjs';
import {
  runtimeNote,
  runtimeRow,
  runtimeRule,
  runtimeText,
  runtimeTile,
  runtimeTitle,
} from '../defaults.mjs';
export function drawBenchPreflight(ctx, scene, state, api) {
  return api.focus.target('gr-bench-preflight-mechanism', () =>
    paintBenchPreflight(ctx, scene, state, api),
  );
}
function paintBenchPreflight(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('bench-preflight', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(
      ctx,
      api,
      currentBeat === 1
        ? 'Change contents at retained addresses before timing'
        : 'Prepare and bind the actual benchmark inputs',
    );
    if (currentBeat === 1) {
      const one = resultComplete(1, 1),
        restore = resultComplete(1, 2),
        values = restore
          ? ['source', 'source', 'source', 'source']
          : one
            ? [1, 1, 1, 1]
            : [0, 0, 0, 0];
      runtimeText(ctx, api, 'Retained source A', 160, 430, 30, themeColors.blue);
      runtimeRow(ctx, api, values, 380);
      runtimeText(ctx, api, 'One element after (2x+1)²', 160, 630, 29, themeColors.cyan);
      runtimeRow(
        ctx,
        api,
        restore
          ? ['reference', 'reference', 'reference', 'reference']
          : one
            ? [9, 9, 9, 9]
            : [1, 1, 1, 1],
        580,
        {
          color: themeColors.cyan,
        },
      );
      runtimeRule(
        ctx,
        api,
        restore
          ? 'Restore actual source · check completed sum against double precision'
          : 'Same address · new contents expose stale replay',
        870,
        themeColors.yellow,
        34,
      );
    } else {
      const items =
        currentBeat === 0
          ? ['context', 'buffers', 'warm path', 'prime events', 'selected setup']
          : [
              'source checksum',
              'shape + strides',
              'dtype + device',
              'software versions',
              'addresses + tolerance',
            ];
      items.forEach((v, i) =>
        runtimeTile(
          ctx,
          api,
          v,
          170 + (i % 3) * 550,
          390 + Math.floor(i / 3) * 240,
          480,
          i < Math.floor(cueProgress(currentBeat, currentBeat === 0 ? 2 : 0) * 5)
            ? themeColors.green
            : themeColors.blue,
          110,
          29,
        ),
      );
      runtimeRule(
        ctx,
        api,
        currentBeat === 0
          ? 'Separate preparation, setup and repeated replay'
          : 'Attach these bindings to the measured result',
        940,
        themeColors.cyan,
        33,
      );
    }
    runtimeNote(ctx, api, 'Downloadable program · fresh checks precede every mode’s timing');
    return;
  }
}
export default {
  id: 'bench-preflight',
  draw: drawBenchPreflight,
  cues: [
    'gr-bench-preflight-b0-operation',
    'gr-bench-preflight-b0-s0',
    'gr-bench-preflight-b0-s1',
    'gr-bench-preflight-b0-s2',
    'gr-bench-preflight-b0-s3',
    'gr-bench-preflight-b0-s4',
    'gr-bench-preflight-b1-operation',
    'gr-bench-preflight-b1-s0',
    'gr-bench-preflight-b1-s1',
    'gr-bench-preflight-b1-s2',
    'gr-bench-preflight-b1-s3',
    'gr-bench-preflight-b2-operation',
    'gr-bench-preflight-b2-s0',
    'gr-bench-preflight-b2-s1',
    'gr-bench-preflight-b2-s2',
  ],
};
