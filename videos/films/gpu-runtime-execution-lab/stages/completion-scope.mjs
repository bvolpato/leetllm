import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeText, runtimeTile, runtimeTitle, runtimeTrace } from '../defaults.mjs';
export function drawCompletionScope(ctx, scene, state, api) {
  return api.focus.target('gr-completion-scope-mechanism', () =>
    paintCompletionScope(ctx, scene, state, api),
  );
}
function paintCompletionScope(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('completion-scope', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Choose the completion boundary required by the reader');
    const lanes = ['host calls', 'stream A', 'stream B'],
      rows = [
        {
          id: 'host',
          lane: lanes[0],
          start: 0,
          end: 4,
          color: themeColors.blue,
        },
        {
          id: 'a',
          lane: lanes[1],
          start: 0,
          end: 7,
          color: themeColors.cyan,
        },
        {
          id: 'a2',
          lane: lanes[1],
          start: 7,
          end: 10,
          color: themeColors.cyan,
        },
        {
          id: 'b',
          lane: lanes[2],
          start: 1,
          end: 12,
          color: themeColors.pink,
        },
      ];
    const clock =
      currentBeat === 0
        ? 4 * cueProgress(0, 0) + 6 * cueProgress(0, 2) + 2 * cueProgress(0, 3)
        : currentBeat === 1
          ? 4 + 8 * cueProgress(1, 1)
          : 12;
    runtimeTrace(ctx, api, {
      lanes,
      intervals: rows,
      domain: [0, 12],
      clock,
      height: 380,
    });
    [
      ['API return', 4, themeColors.blue],
      ['A completion event', 10, themeColors.cyan],
      ['Device/context scope', 12, themeColors.pink],
    ].forEach(([name, end, color], i) => {
      const x = 220 + i * 550;
      runtimeTile(ctx, api, name, x, 835, 450, color, 75, 27);
      runtimeText(
        ctx,
        api,
        clock >= end ? 'Completed observation' : 'Pending completion',
        x + 225,
        965,
        28,
        clock >= end ? themeColors.green : themeColors.yellow,
        'center',
      );
    });
    runtimeNote(
      ctx,
      api,
      currentBeat === 1
        ? 'An event query may stay not ready while host work continues'
        : 'Logical ticks · host return at 4, sum ready at 10, both streams complete at 12',
    );
    return;
  }
}
export default {
  id: 'completion-scope',
  draw: drawCompletionScope,
  cues: [
    'gr-completion-scope-b0-operation',
    'gr-completion-scope-b0-s0',
    'gr-completion-scope-b0-s1',
    'gr-completion-scope-b0-s2',
    'gr-completion-scope-b0-s3',
    'gr-completion-scope-b1-operation',
    'gr-completion-scope-b1-s0',
    'gr-completion-scope-b1-s1',
    'gr-completion-scope-b1-s2',
    'gr-completion-scope-b2-operation',
    'gr-completion-scope-b2-s0',
    'gr-completion-scope-b2-s1',
    'gr-completion-scope-b2-s2',
    'gr-completion-scope-b2-s3',
  ],
};
