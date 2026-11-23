import { sampleRuntimeChapter } from '../construction.mjs';
import {
  runtimeNote,
  runtimeRow,
  runtimeRule,
  runtimeText,
  runtimeTile,
  runtimeTitle,
  runtimeWire,
} from '../defaults.mjs';
export function drawEventGenerations(ctx, scene, state, api) {
  return api.focus.target('gr-event-generations-mechanism', () =>
    paintEventGenerations(ctx, scene, state, api),
  );
}
function paintEventGenerations(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('event-generations', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(
      ctx,
      api,
      currentBeat === 2
        ? 'A later record cannot change the completed old output'
        : 'Keep each wait attached to the generation it observed',
    );
    if (currentBeat < 2) {
      const e1 = resultComplete(1, 0),
        e2 = resultComplete(1, 1),
        w2 = resultComplete(1, 3);
      runtimeTile(ctx, api, 'One event handle E', 750, 355, 420, themeColors.yellow);
      const ys = [545, 745];
      ys.forEach((y, i) => {
        runtimeTile(
          ctx,
          api,
          i
            ? e2
              ? 'E2 · producer ends 9'
              : 'Second record pending'
            : e1
              ? 'E1 · producer ends 3'
              : 'First record pending',
          180,
          y,
          480,
          i ? themeColors.pink : themeColors.blue,
        );
        runtimeTile(
          ctx,
          api,
          i ? 'Wait W2' : 'Wait W1',
          1270,
          y,
          470,
          i ? themeColors.pink : themeColors.blue,
        );
        runtimeWire(
          ctx,
          api,
          660,
          y + 40,
          1270,
          y + 40,
          i ? cueProgress(1, 3) : cueProgress(1, 1),
          i ? themeColors.pink : themeColors.blue,
        );
      });
      runtimeRule(
        ctx,
        api,
        w2
          ? 'W1 → E1 @ 3     W2 → E2 @ 9'
          : e2
            ? 'Handle now E2 · submitted W1 still retains E1'
            : e1
              ? 'First record establishes E1'
              : 'No future rerecording redirects an existing wait',
        940,
        themeColors.cyan,
        31,
      );
    } else {
      const filled = resultComplete(2, 1),
        fresh = resultComplete(2, 2);
      runtimeText(ctx, api, 'Source allocation A', 155, 405, 29, themeColors.blue);
      runtimeRow(ctx, api, filled ? [1, 1, 1, 1] : [0, 0, 0, 0], 355);
      runtimeText(ctx, api, 'Old completed output O0', 155, 610, 29, themeColors.pink);
      runtimeRow(ctx, api, [0, 0, 0, 0], 560, {
        color: themeColors.pink,
      });
      runtimeText(ctx, api, 'New recorded-wait copy O1', 155, 815, 28, themeColors.green);
      runtimeRow(
        ctx,
        api,
        fresh ? [1, 1, 1, 1] : ['pending', 'pending', 'pending', 'pending'],
        765,
        {
          color: themeColors.green,
        },
      );
      runtimeRule(
        ctx,
        api,
        fresh
          ? 'Old O0 = zeros · new O1 = ones'
          : 'The old empty-event wait remains an empty dependency',
        950,
        themeColors.yellow,
        31,
      );
    }
    runtimeNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Actual small CUDA probe · retained old output inspected after later fill'
        : 'E1 and E2 are logical recording identities on the same event handle',
    );
    return;
  }
}
export default {
  id: 'event-generations',
  draw: drawEventGenerations,
  cues: [
    'gr-event-generations-b0-operation',
    'gr-event-generations-b0-s0',
    'gr-event-generations-b0-s1',
    'gr-event-generations-b0-s2',
    'gr-event-generations-b1-operation',
    'gr-event-generations-b1-s0',
    'gr-event-generations-b1-s1',
    'gr-event-generations-b1-s2',
    'gr-event-generations-b1-s3',
    'gr-event-generations-b1-s4',
    'gr-event-generations-b2-operation',
    'gr-event-generations-b2-s0',
    'gr-event-generations-b2-s1',
    'gr-event-generations-b2-s2',
    'gr-event-generations-b2-s3',
  ],
};
