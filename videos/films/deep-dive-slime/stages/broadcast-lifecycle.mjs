import { lerp } from '../arithmetic.mjs';
import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
  drawSlimeWire,
} from '../defaults.mjs';
export function drawBroadcastLifecycle(ctx, scene, state, api) {
  return api.focus.target('sl-broadcast-lifecycle-mechanism', () =>
    paintBroadcastLifecycle(ctx, scene, state, api),
  );
}
function paintBroadcastLifecycle(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('broadcast-lifecycle', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Gather the same tensor before broadcasting its chunks');
    const pieces = ['T0/E0', 'T1/E0', 'T0/E1', 'T1/E1'];
    pieces.forEach((v, i) => {
      const startX = 190 + i * 390,
        x = lerp(startX, 650 + i * 155, modelState.gather),
        y = lerp(400, 570, modelState.gather);
      drawSlimeTile(ctx, api, v, x, y, 135, i < 2 ? themeColors.blue : themeColors.cyan, 90, 28);
    });
    drawSlimeText(
      ctx,
      api,
      modelState.gather >= 1 ? 'engine-format tensor' : 'source TP / EP shards',
      960,
      modelState.gather >= 1 ? 520 : 355,
      32,
      themeColors.yellow,
      'center',
    );
    if (modelState.gather >= 1) {
      drawSlimeWire(ctx, api, 960, 660, 960, 770, modelState.broadcast, themeColors.green);
      drawSlimeTile(
        ctx,
        api,
        modelState.interrupted
          ? 'restarted engine · weights absent'
          : modelState.resume >= 1
            ? 'engine · resumed'
            : modelState.postprocess >= 1
              ? 'engine · postprocessed'
              : 'engine · paused / receiving',
        470,
        790,
        1000,
        modelState.resume >= 1 && !modelState.interrupted ? themeColors.green : themeColors.yellow,
        90,
        31,
      );
    }
    if (currentBeat === 2)
      drawSlimeTile(
        ctx,
        api,
        modelState.rebuilt >= 1
          ? 'Send the weights again or load a retained checkpoint.'
          : 'The engine lost the weights held in memory.',
        470,
        365,
        1110,
        themeColors.pink,
        90,
        30,
      );
    drawSlimeRule(
      ctx,
      api,
      currentBeat === 2
        ? 'A restart changes the recovery plan'
        : 'pause → flush → gather → locked broadcast → postprocess → resume',
      950,
      themeColors.cyan,
      29,
    );
    return;
  }
}
export default {
  id: 'broadcast-lifecycle',
  draw: drawBroadcastLifecycle,
  cues: [
    'sl-broadcast-lifecycle-b0-operation',
    'sl-broadcast-lifecycle-b0-s0',
    'sl-broadcast-lifecycle-b0-s1',
    'sl-broadcast-lifecycle-b0-s2',
    'sl-broadcast-lifecycle-b1-operation',
    'sl-broadcast-lifecycle-b1-s0',
    'sl-broadcast-lifecycle-b1-s1',
    'sl-broadcast-lifecycle-b1-s2',
    'sl-broadcast-lifecycle-b1-s3',
    'sl-broadcast-lifecycle-b2-operation',
    'sl-broadcast-lifecycle-b2-s0',
    'sl-broadcast-lifecycle-b2-s1',
    'sl-broadcast-lifecycle-b2-s2',
    'sl-broadcast-lifecycle-b2-s3',
  ],
};
