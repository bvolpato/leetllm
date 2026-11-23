import { completionCue } from '../construction.mjs';
import { completionFooter, completionHeading, completionText } from '../defaults.mjs';
export function drawSpeculationGate(ctx, scene, state, api) {
  api.focus.target('cc-speculation-gate-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
      done = (id) => completionCue(state, id) >= 1;
    {
      completionHeading(ctx, api, 'Which requests benefit from drafting?');
      const plot = api.teaching.axes({
        x: 400,
        y: 420,
        width: 1050,
        height: 470,
        xDomain: [0, 5],
        yDomain: [-15, 55],
        xTicks: [0, 1, 2, 3, 4, 5],
        yTicks: [-10, 0, 10, 30, 50],
        fontSize: 25,
      });
      const gateX = plot.point(2, 0).x,
        gateY = plot.point(0, 10).y;
      api.line(ctx, gateX, 420, gateX, 890, themeColors.yellow, 2);
      api.line(ctx, 400, gateY, 1450, gateY, themeColors.yellow, 2);
      const show = done('cc-spec-selection');
      [
        {
          id: 'Python imports',
          x: 3.8,
          y: 42,
          ready: done('cc-spec-python'),
        },
        {
          id: 'SQL',
          x: 1.1,
          y: -7,
          ready: done('cc-spec-sql'),
        },
      ].forEach((v, i) => {
        if (v.ready || currentBeat > 0) {
          const z = plot.point(v.x, v.y);
          api.circle(
            ctx,
            z.x,
            z.y,
            12,
            show ? (i ? themeColors.pink : themeColors.green) : themeColors.cyan,
          );
          completionText(
            ctx,
            api,
            v.id,
            z.x + (i ? 25 : -180),
            z.y - 35,
            29,
            show ? (i ? themeColors.pink : themeColors.green) : themeColors.cyan,
          );
        }
      });
      completionText(
        ctx,
        api,
        'Mean accepted draft length',
        960,
        975,
        29,
        themeColors.muted,
        'center',
      );
      completionText(ctx, api, 'Latency gain (ms)', 190, 360, 28, themeColors.muted);
      completionFooter(
        ctx,
        api,
        currentBeat
          ? 'Replay the candidate under load and measure quality and tail latency'
          : 'Mean accepted length ≥ 2   ·   latency saved ≥ 10 ms',
      );
    }
    return true;
  });
}
export default {
  id: 'speculation-gate',
  draw: drawSpeculationGate,
  cues: [
    'cc-speculation-gate-0',
    'cc-spec-python',
    'cc-spec-sql',
    'cc-spec-selection',
    'cc-speculation-gate-1',
  ],
};
