import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeBrace,
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeTile,
  drawSlimeTitle,
} from '../defaults.mjs';
export function drawRetainedServing(ctx, scene, state, api) {
  return api.focus.target('sl-retained-serving-mechanism', () =>
    paintRetainedServing(ctx, scene, state, api),
  );
}
function paintRetainedServing(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('retained-serving', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Serving survival preserves data; trainer recovery needs state');
    drawSlimeTile(
      ctx,
      api,
      modelState.failure >= 1 ? 'training attempt · failed' : 'training attempt · running',
      170,
      370,
      670,
      modelState.failure >= 1 ? themeColors.pink : themeColors.blue,
      100,
      31,
    );
    drawSlimeTile(
      ctx,
      api,
      modelState.rayLost ? 'Ray cluster lost · separate recovery' : 'named serving cluster · alive',
      1040,
      370,
      700,
      modelState.rayLost ? themeColors.pink : themeColors.green,
      100,
      31,
    );
    const names = ['model', 'optimizer*', 'scheduler', 'RNG', 'retained batches'];
    names.forEach((v, i) =>
      drawSlimeTile(
        ctx,
        api,
        v,
        150 + i * 350,
        605,
        310,
        i < modelState.slots ? themeColors.cyan : themeColors.muted,
        90,
        28,
      ),
    );
    if (currentBeat === 2) {
      const split = modelState.repartition >= 1 ? 1 : 2;
      [0, 1, 2, 3].forEach((i) =>
        drawSlimeTile(
          ctx,
          api,
          'batch ' + (11 + i),
          330 + i * 360,
          775,
          280,
          i < split ? themeColors.blue : themeColors.cyan,
          82,
          28,
        ),
      );
      drawSlimeBrace(
        ctx,
        api,
        330,
        330 + split * 360 - 80,
        880,
        'trainer partition A',
        themeColors.blue,
      );
      drawSlimeBrace(
        ctx,
        api,
        330 + split * 360,
        1690,
        880,
        'trainer partition B',
        themeColors.cyan,
      );
    } else
      drawSlimeRule(
        ctx,
        api,
        currentBeat === 0
          ? 'Pinned restart path and dated detached-cluster guide are distinct'
          : '* Stateful optimizer required; guide documents a separate stateless-Adam exception',
        925,
        themeColors.yellow,
        29,
      );
    drawSlimeNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Compatible same-session reattachment · repartitioning need not be bitwise identical'
        : 'Recovery guide checked 10 Oct 2026 in the article · resubmit training explicitly',
    );
    return;
  }
}
export default {
  id: 'retained-serving',
  draw: drawRetainedServing,
  cues: [
    'sl-retained-serving-b0-operation',
    'sl-retained-serving-b0-s0',
    'sl-retained-serving-b0-s1',
    'sl-retained-serving-b0-s2',
    'sl-retained-serving-b0-s3',
    'sl-retained-serving-b0-s4',
    'sl-retained-serving-b1-operation',
    'sl-retained-serving-b1-s0',
    'sl-retained-serving-b1-s1',
    'sl-retained-serving-b1-s2',
    'sl-retained-serving-b1-s3',
    'sl-retained-serving-b2-operation',
    'sl-retained-serving-b2-s0',
    'sl-retained-serving-b2-s1',
    'sl-retained-serving-b2-s2',
    'sl-retained-serving-b2-s3',
  ],
};
