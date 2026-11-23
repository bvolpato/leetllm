import { perRank } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawTradeoff(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.93);
  const colors = {
    weights: themeColors.blue,
    gradients: themeColors.pink,
    optimizer: themeColors.yellow,
  };
  {
    text(
      ctx,
      api,
      'Persistent state per rank · authored memory units',
      960,
      375,
      29,
      themeColors.muted,
      'center',
    );
    const stages = [0, 1, 2, 3];
    stages.forEach((stage, i) => {
      const state = Object.values(perRank(stage)).reduce((sum, value) => sum + value, 0);
      const x = 230 + i * 370;
      text(ctx, api, `Stage ${stage}`, x + 145, 425, 27, themeColors.ink, 'center');
      api.focus.target('state-memory', () =>
        api.rect(ctx, x, 445, 290, 28, themeColors.panel, themeColors.muted, 8),
      );
      api.focus.target('state-memory', () =>
        api.rect(ctx, x, 445, (290 * state) / 8, 28, themeColors.blue, themeColors.blue, 8),
      );
      text(ctx, api, `${state} units`, x + 145, 512, 25, themeColors.blue, 'center');
    });
    const forwardReveal = phaseForBeat(0),
      prefetchReveal = phaseForBeat(1),
      backwardReveal = phaseForBeat(2);
    const drawLane = (label, y, operations, reveal, fill) => {
      text(ctx, api, label, 145, y + 25, 25, fill, 'left');
      operations.forEach(([x0, x1, name]) => {
        const width = x1 - x0;
        api.rect(ctx, x0, y, width, 38, themeColors.panel, fill, 7);
        const visible = width * api.clamp(reveal, 0, 1);
        if (visible > 1) api.rect(ctx, x0, y, visible, 38, fill, fill, 7);
        if (reveal > 0.94)
          text(ctx, api, name, x0 + width / 2, y + 27, 21, themeColors.bg, 'center');
      });
    };
    text(
      ctx,
      api,
      'One wrapped-unit schedule · next gather overlaps current compute',
      1085,
      575,
      28,
      themeColors.ink,
      'center',
    );
    api.focus.target('collective-schedule', () =>
      drawLane(
        'Forward all-gather',
        620,
        [
          [440, 510, 'U1'],
          [620, 690, 'U2'],
          [800, 870, 'U3'],
        ],
        prefetchReveal,
        themeColors.cyan,
      ),
    );
    api.focus.target('collective-schedule', () =>
      drawLane(
        'Forward compute',
        662,
        [
          [510, 690, 'unit 1'],
          [690, 870, 'unit 2'],
          [870, 1050, 'unit 3'],
        ],
        forwardReveal,
        themeColors.green,
      ),
    );
    api.focus.target('collective-schedule', () =>
      drawLane(
        'Backward all-gather',
        704,
        [
          [1070, 1130, 'U3'],
          [1250, 1310, 'U2'],
          [1430, 1490, 'U1'],
        ],
        backwardReveal,
        themeColors.cyan,
      ),
    );
    api.focus.target('collective-schedule', () =>
      drawLane(
        'Backward compute',
        746,
        [
          [1130, 1310, 'unit 3'],
          [1310, 1490, 'unit 2'],
          [1490, 1670, 'unit 1'],
        ],
        backwardReveal,
        themeColors.blue,
      ),
    );
    api.focus.target('collective-schedule', () =>
      drawLane(
        'Reduce-scatter',
        788,
        [
          [1310, 1380, 'U3'],
          [1490, 1560, 'U2'],
          [1670, 1740, 'U1'],
        ],
        backwardReveal,
        themeColors.pink,
      ),
    );
    api.arrow(ctx, 440, 865, 1740, 865, themeColors.muted, 2);
    const playhead =
      currentBeat < 2
        ? 440 + 610 * (currentBeat === 0 ? phaseForBeat(0) : phaseForBeat(1))
        : 1070 + 670 * phaseForBeat(2);
    api.circle(ctx, playhead, 865, 11, themeColors.yellow);
    text(ctx, api, 'step time', 1090, 915, 25, themeColors.muted, 'center');
    text(
      ctx,
      api,
      'Prefetch scheduling can hide part of the transfer; profile real collective time and volume',
      960,
      965,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'tradeoff',
  draw: drawTradeoff,
  cues: ['tradeoff-b1-1', 'tradeoff-b2-1', 'tradeoff-b3-1'],
};
