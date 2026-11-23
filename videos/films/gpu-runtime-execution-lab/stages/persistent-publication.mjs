import { clamp } from '../arithmetic.mjs';
import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeRule, runtimeTile, runtimeTitle, runtimeWire } from '../defaults.mjs';
export function drawPersistentPublication(ctx, scene, state, api) {
  return api.focus.target('gr-persistent-publication-mechanism', () =>
    paintPersistentPublication(ctx, scene, state, api),
  );
}
function paintPersistentPublication(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('persistent-publication', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Publish payload before claiming it · release after the reader');
    const stages = ['FREE', 'PUBLISHED', 'CLAIMED', 'COMPLETED', 'READER DONE', 'FREE'];
    let p, index, slot, caption;
    if (currentBeat === 0) {
      p = (cueProgress(0, 0) * 2) / 5;
      index = Math.min(2, Math.floor(p * 5));
      slot = index === 0 ? 'Slot S0 · empty' : 'Slot S0 · G1 · R1 · ' + stages[index];
      caption =
        index < 1
          ? 'Write R1 payload before publishing G1'
          : 'Release publication → acquire → worker reads R1';
    } else if (currentBeat === 1) {
      p = cueProgress(1, 1);
      index = Math.min(5, Math.floor(p * 5));
      if (cueProgress(1, 2) > 0.08 && cueProgress(1, 3) === 0) {
        index = 3;
        p = 3 / 5;
        caption = 'Inspect completion: R1 remains owned while its reader waits';
      } else
        caption =
          index < 3
            ? 'R1 payload and sole worker retain the slot'
            : index === 3
              ? 'GPU complete · CPU reader still owns R1'
              : index === 4
                ? 'Reader finished · release is now permitted'
                : 'R1 released · no live request owns S0';
      slot =
        index === 0 || index === 5
          ? 'Slot S0 · empty · last generation G1'
          : 'Slot S0 · G1 · R1 · ' + stages[index];
      if (resultComplete(1, 3)) {
        index = 1;
        p = 1 / 5;
        slot = 'Slot S0 · G2 · R2 · PUBLISHED';
        caption = 'Late completion G1 rejected · current owner remains G2 / R2';
      }
    } else {
      p = 3 / 5;
      index = 3;
      slot = 'All four slots owned · R6 remains pending';
      caption =
        cueProgress(2, 1) > 0
          ? 'Cancellation waits for producer, worker and reader reconciliation'
          : 'Backpressure preserves the current owners';
    }
    stages.forEach((v, i) =>
      runtimeTile(
        ctx,
        api,
        v,
        135 + i * 280,
        400,
        250,
        i === index ? themeColors.yellow : i < index ? themeColors.green : themeColors.muted,
        96,
        25,
      ),
    );
    for (let i = 0; i < 5; i++)
      runtimeWire(
        ctx,
        api,
        385 + i * 280,
        448,
        415 + i * 280,
        448,
        clamp(p * 5 - i),
        themeColors.cyan,
      );
    runtimeTile(ctx, api, slot, 360, 635, 1200, themeColors.blue, 100, 32);
    runtimeTile(
      ctx,
      api,
      index === 3
        ? 'Reader pending · do not recycle'
        : index === 4
          ? 'Reader receipt retained'
          : 'Generation identity retained',
      560,
      795,
      800,
      index === 3 ? themeColors.yellow : themeColors.cyan,
      80,
      30,
    );
    runtimeRule(ctx, api, caption, 955, themeColors.cyan, 28);
    runtimeNote(
      ctx,
      api,
      'Shared CPU/GPU queue · publish with release, claim with acquire at the required scope',
    );
    return;
  }
}
export default {
  id: 'persistent-publication',
  draw: drawPersistentPublication,
  cues: [
    'gr-persistent-publication-b0-operation',
    'gr-persistent-publication-b0-s0',
    'gr-persistent-publication-b0-s1',
    'gr-persistent-publication-b0-s2',
    'gr-persistent-publication-b1-operation',
    'gr-persistent-publication-b1-s0',
    'gr-persistent-publication-b1-s1',
    'gr-persistent-publication-b1-s2',
    'gr-persistent-publication-b1-s3',
    'gr-persistent-publication-b2-operation',
    'gr-persistent-publication-b2-s0',
    'gr-persistent-publication-b2-s1',
    'gr-persistent-publication-b2-s2',
    'gr-persistent-publication-b2-s3',
  ],
};
