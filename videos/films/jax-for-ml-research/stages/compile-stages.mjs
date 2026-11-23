import { drawArrow, drawBox, drawText, footer, mark } from '../defaults.mjs';
export function drawCompileStages(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-compile-stages-b' + currentBeat);
  const paint = () => {
    drawText(
      ctx,
      api,
      'One stable callable · abstract input [4] float32',
      960,
      270,
      34,
      themeColors.yellow,
    );
    const stages = [
        ['Python function', 210, 370, themeColors.blue],
        ['Jaxpr', 760, 370, themeColors.cyan],
        ['StableHLO', 1310, 370, themeColors.yellow],
      ],
      known = [
        true,
        resultComplete('compile-jaxpr') || currentBeat > 0,
        resultComplete('compile-lowered') || currentBeat > 0,
      ];
    for (const [i, [s, x, y, col]] of stages.entries()) {
      drawBox(
        ctx,
        api,
        known[i] ? s : 'staging pending',
        x,
        y,
        400,
        100,
        known[i] ? col : themeColors.muted,
      );
      if (i < 2) drawArrow(ctx, api, x + 420, y + 50, x + 530, y + 50, themeColors.muted);
    }
    if (resultComplete('compile-executable') || currentBeat > 0)
      drawBox(ctx, api, 'CPU executable A', 710, 650, 500, 105, themeColors.green);
    else drawBox(ctx, api, 'Executable pending', 710, 650, 500, 105, themeColors.muted);
    if (currentBeat === 0)
      drawText(
        ctx,
        api,
        'Trace captures compatible numerical primitives',
        960,
        900,
        33,
        themeColors.cyan,
      );
    else {
      drawBox(ctx, api, 'new values / same contract', 180, 850, 620, 85, themeColors.blue);
      drawBox(ctx, api, 'cached executable A', 1110, 850, 620, 85, themeColors.green);
      drawArrow(ctx, api, 830, 892, 1080, 892, themeColors.green);
      drawText(
        ctx,
        api,
        'tree · shape · dtype · weak typing · static settings · placement',
        960,
        300,
        27,
        themeColors.muted,
      );
    }
    footer(
      ctx,
      api,
      'Python file reads and list growth occur at tracing boundaries, not on every cached device execution',
    );
  };
  mark(ctx, api, 'jx-compile-stages-mechanism', paint);
}
export default {
  id: 'compile-stages',
  draw: drawCompileStages,
  cues: [
    'jx-compile-stages-b0',
    'compile-jaxpr',
    'compile-lowered',
    'compile-executable',
    'jx-compile-stages-b1',
  ],
};
