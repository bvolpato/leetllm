import { sampleRuntimeChapter } from '../construction.mjs';
import {
  runtimeNote,
  runtimeRule,
  runtimeText,
  runtimeTile,
  runtimeTitle,
  runtimeTrace,
  runtimeWire,
} from '../defaults.mjs';
export function drawDefaultStreams(ctx, scene, state, api) {
  return api.focus.target('gr-default-streams-mechanism', () =>
    paintDefaultStreams(ctx, scene, state, api),
  );
}
function paintDefaultStreams(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('default-streams', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Implicit legacy edges change the earliest legal start');
    if (currentBeat < 2) {
      const labels = [
        currentBeat === 1 && cueProgress(1, 1) > 0 ? 'Per-thread default' : 'Earlier blocking A',
        'Legacy L',
        'Later blocking B',
      ];
      labels.forEach((v, i) =>
        runtimeTile(
          ctx,
          api,
          v,
          180 + i * 560,
          440,
          440,
          i === 1 ? themeColors.cyan : themeColors.blue,
          105,
          31,
        ),
      );
      runtimeWire(ctx, api, 620, 492, 740, 492, cueProgress(0, 0), themeColors.blue);
      runtimeWire(ctx, api, 1180, 492, 1300, 492, cueProgress(0, 1), themeColors.cyan);
      runtimeTile(
        ctx,
        api,
        'Nonblocking N',
        740,
        720,
        440,
        currentBeat === 1 ? themeColors.green : themeColors.muted,
        95,
        31,
      );
      runtimeText(
        ctx,
        api,
        currentBeat === 1 ? 'No implicit legacy dependency' : 'Separate stream property',
        960,
        865,
        30,
        currentBeat === 1 ? themeColors.green : themeColors.muted,
        'center',
      );
      runtimeRule(
        ctx,
        api,
        currentBeat === 1 && resultComplete(1, 2)
          ? 'Thread-local default still participates when legacy L is used'
          : 'Blocking A → legacy L → blocking B',
        955,
        themeColors.yellow,
        30,
      );
    } else {
      const lanes = ['Blocking A', 'Legacy L', 'Blocking B', 'Nonblocking N'],
        intervals = [
          {
            id: 'a',
            lane: lanes[0],
            start: 0,
            end: 3,
            color: themeColors.blue,
          },
          {
            id: 'l',
            lane: lanes[1],
            start: 3,
            end: 5,
            color: themeColors.cyan,
          },
          {
            id: 'b',
            lane: lanes[2],
            start: 5,
            end: 6,
            color: themeColors.blue,
          },
          {
            id: 'n',
            lane: lanes[3],
            start: 1,
            end: 3,
            color: themeColors.green,
          },
        ];
      runtimeTrace(ctx, api, {
        lanes,
        intervals: intervals.filter((_, i) => resultComplete(2, i)),
        domain: [0, 6],
        clock: 6,
        height: 420,
      });
      runtimeRule(
        ctx,
        api,
        resultComplete(2, 1)
          ? 'L: max(request 1, A finish 3) → 3–5'
          : 'Legacy L waits for earlier blocking A',
        890,
        themeColors.cyan,
        31,
      );
      runtimeRule(
        ctx,
        api,
        resultComplete(2, 2)
          ? 'B: max(request 2, L finish 5) → 5–6'
          : 'Later blocking B retains the legacy dependency',
        955,
        themeColors.blue,
        31,
      );
    }
    runtimeNote(
      ctx,
      api,
      'Logical ticks · same CUDA context · concurrency still depends on resources',
    );
    return;
  }
}
export default {
  id: 'default-streams',
  draw: drawDefaultStreams,
  cues: [
    'gr-default-streams-b0-operation',
    'gr-default-streams-b0-s0',
    'gr-default-streams-b0-s1',
    'gr-default-streams-b0-s2',
    'gr-default-streams-b0-s3',
    'gr-default-streams-b1-operation',
    'gr-default-streams-b1-s0',
    'gr-default-streams-b1-s1',
    'gr-default-streams-b1-s2',
    'gr-default-streams-b2-operation',
    'gr-default-streams-b2-s0',
    'gr-default-streams-b2-s1',
    'gr-default-streams-b2-s2',
    'gr-default-streams-b2-s3',
  ],
};
