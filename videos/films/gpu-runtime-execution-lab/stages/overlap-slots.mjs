import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeTile, runtimeTitle, runtimeTrace } from '../defaults.mjs';
export function drawOverlapSlots(ctx, scene, state, api) {
  return api.focus.target('gr-overlap-slots-mechanism', () =>
    paintOverlapSlots(ctx, scene, state, api),
  );
}
function paintOverlapSlots(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('overlap-slots', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Move the next batch without overwriting the current reader');
    const p = currentBeat === 0 ? cueProgress(0, 1) : cueProgress(1, 1),
      lanes = ['Copy slot A', 'Compute A', 'Copy slot B', 'Compute B'];
    runtimeTrace(ctx, api, {
      lanes,
      intervals: [
        {
          id: 'ca',
          lane: lanes[0],
          start: 0,
          end: 3,
          color: themeColors.blue,
        },
        {
          id: 'ka',
          lane: lanes[1],
          start: 3,
          end: 8,
          color: themeColors.cyan,
        },
        {
          id: 'cb',
          lane: lanes[2],
          start: 3,
          end: 6,
          color: themeColors.blue,
        },
        {
          id: 'kb',
          lane: lanes[3],
          start: 8,
          end: 11,
          color: themeColors.cyan,
        },
      ],
      domain: [0, 12],
      clock: 12 * p,
      height: 420,
    });
    runtimeTile(
      ctx,
      api,
      'A · retain until kernel + reader finish',
      190,
      870,
      720,
      themeColors.yellow,
      80,
      29,
    );
    runtimeTile(
      ctx,
      api,
      'B · independent live allocation',
      1010,
      870,
      720,
      themeColors.blue,
      80,
      29,
    );
    runtimeNote(
      ctx,
      api,
      'Proposed overlap · requires pinned host storage, copy capability and sufficient resources',
    );
    return;
  }
}
export default {
  id: 'overlap-slots',
  draw: drawOverlapSlots,
  cues: [
    'gr-overlap-slots-b0-operation',
    'gr-overlap-slots-b0-s0',
    'gr-overlap-slots-b0-s1',
    'gr-overlap-slots-b0-s2',
    'gr-overlap-slots-b0-s3',
    'gr-overlap-slots-b1-operation',
    'gr-overlap-slots-b1-s0',
    'gr-overlap-slots-b1-s1',
    'gr-overlap-slots-b1-s2',
    'gr-overlap-slots-b1-s3',
    'gr-overlap-slots-b1-s4',
    'gr-overlap-slots-b2-operation',
    'gr-overlap-slots-b2-s0',
    'gr-overlap-slots-b2-s1',
    'gr-overlap-slots-b2-s2',
    'gr-overlap-slots-b2-s3',
  ],
};
