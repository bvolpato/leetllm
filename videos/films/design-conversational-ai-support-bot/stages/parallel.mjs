import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawParallel(ctx, scene, state, api) {
  if (drawParallelContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('parallel', state),
    currentBeat = modelState.b;
  if (state.cues) {
  }
  {
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Serial read fixture'
        : currentBeat === 1
          ? 'Parallel read fixture'
          : 'Parallel fixture · invoice timeout',
      960,
      285,
      40,
      themeColors.yellow,
      'center',
    );
    [
      'Policy read',
      'Invoice read',
      currentBeat === 2 ? 'Supervisor holds join' : 'Supervisor merge',
    ].forEach((name, i) =>
      api.focus.target('read-operations', () =>
        card(
          ctx,
          api,
          name,
          160 + i * 580,
          380,
          490,
          currentBeat === 2 && i > 0
            ? themeColors.pink
            : [themeColors.blue, themeColors.cyan, themeColors.green][i],
          85,
        ),
      ),
    );
    const plot = api.focus.target('read-schedule', () =>
      teaching.timeline({
        x: 180,
        y: 530,
        width: 1560,
        height: 330,
        domain: [0, 6],
        time: modelState.time,
        lanes: [
          {
            id: 'policy',
            label: 'Policy',
          },
          {
            id: 'invoice',
            label: 'Invoice',
          },
          {
            id: 'merge',
            label: currentBeat === 2 ? 'Hold' : 'Merge',
          },
        ],
        intervals: modelState.schedule.map((value) => ({
          ...value,
          color:
            currentBeat === 2 && value.lane !== 'policy'
              ? themeColors.pink
              : value.lane === 'merge'
                ? themeColors.green
                : themeColors.blue,
        })),
        ticks: [0, 2, 3, 4, 6],
        labelWidth: 230,
        fontSize: 29,
        color: themeColors.muted,
        trackColor: themeColors.panel,
      }),
    );
    void plot;
    text(
      ctx,
      api,
      `Elapsed ${modelState.time.toFixed(1)} · supplied path ${modelState.duration} time units`,
      960,
      910,
      34,
      themeColors.yellow,
      'center',
    );
    api.focus.target('join-outcome', () =>
      text(
        ctx,
        api,
        modelState.ready
          ? 'Both successful receipts match current state · join eligible'
          : modelState.timedOut
            ? 'Invoice timeout receipt · action held'
            : 'Waiting for complete matching evidence',
        960,
        1010,
        30,
        modelState.ready ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
  }
}
function drawParallelContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C } = api;
  return true;
}
export default {
  id: 'parallel',
  draw: drawParallel,
  cues: ['serial-reads', 'parallel-reads', 'wait-slower', 'timeout-reads', 'read-timeout'],
};
