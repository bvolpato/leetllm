import { edgeSharedWeight } from '../arithmetic.mjs';
import { edgeState } from '../model.mjs';
import {
  drawEdgeCard,
  drawEdgeL,
  drawEdgeRectangle,
  drawEdgeRow,
  drawEdgeText,
} from '../defaults.mjs';
export function drawSmallArchitecture(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('small-architecture', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-small-architecture-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Use the same embedding tensor at both ends'
        : currentBeat === 1
          ? 'Reusing stored weights still runs two block applications'
          : 'Keep historical timings attached to their actual experiment',
    );
    if (currentBeat === 0) {
      const tied = progress('sharing');
      const emb = drawEdgeCard(ctx, api, 'Embedding E', 650, 400, 600, themeColors.blue, 150);
      drawEdgeCard(ctx, api, 'input token lookup', 150, 675, 500, themeColors.cyan);
      drawEdgeCard(ctx, api, 'output projection Eᵀ', 1250, 675, 500, themeColors.green);
      drawEdgeL(ctx, api, 650, 700, 950, 550, themeColors.blue, 4);
      drawEdgeL(ctx, api, 1250, 700, 950, 550, themeColors.green, 4);
      drawEdgeText(
        ctx,
        api,
        tied >= 1 ? '~135M → ~119M stored parameters' : 'one shared tensor',
        960,
        850,
        33,
        themeColors.yellow,
        'center',
      );
      if (done('depth'))
        drawEdgeRow(
          ctx,
          api,
          ['saved storage', 'reallocate depth', 'task accuracy recovered in study'],
          150,
          925,
          1600,
          70,
          themeColors.green,
        );
    }
    if (currentBeat === 1) {
      const reuse = progress('twice'),
        first = reuse >= 0.45,
        second = done('twice');
      const shared = edgeSharedWeight();
      shared.weights.forEach((r, i) =>
        drawEdgeRow(ctx, api, r, 700, 335 + i * 90, 520, 70, themeColors.blue),
      );
      drawEdgeText(
        ctx,
        api,
        'Illustrative block W = 0.5 I; one stored 2×2 tensor',
        960,
        855,
        29,
        themeColors.blue,
        'center',
      );
      const values = [
        'x₀ = [2, 4]',
        first ? `x₁ = [${shared.states[1].join(', ')}]` : 'first application pending',
        second ? `x₂ = [${shared.states[2].join(', ')}]` : 'second application pending',
      ];
      drawEdgeRow(ctx, api, values, 150, 650, 1600, 110, themeColors.cyan);
      drawEdgeL(ctx, api, 960, 495, 950, 650, themeColors.blue, 4);
      drawEdgeL(ctx, api, 960, 495, 1490, 650, themeColors.blue, 4);
      drawEdgeText(
        ctx,
        api,
        'One stored W · two computations · two attention-state updates',
        960,
        955,
        31,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      drawEdgeRow(
        ctx,
        api,
        ['iPhone 13', 'FP16 / MPS', '50 iterations'],
        150,
        370,
        1600,
        100,
        themeColors.cyan,
      );
      const ready = done('timings');
      [
        ['MobileLLM', 15.6],
        ['layer shared', 16],
      ].forEach(([name, v], i) => {
        drawEdgeText(ctx, api, name, 150, 590 + i * 180, 32, themeColors.blue);
        drawEdgeRectangle(
          ctx,
          api,
          550,
          540 + i * 180,
          (ready ? 1 : q) * v * 65,
          100,
          i ? themeColors.green : themeColors.blue,
        );
        if (ready)
          drawEdgeText(ctx, api, `${v.toFixed(1)} ms`, 1650, 595 + i * 180, 32, themeColors.ink);
      });
    }
    note('Historical source observation; no handheld sustained-rate or battery measurement');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'small-architecture',
  draw: drawSmallArchitecture,
  cues: [
    'edge-small-architecture-op-0',
    'edge-small-architecture-sharing',
    'edge-small-architecture-depth',
    'edge-small-architecture-op-1',
    'edge-small-architecture-twice',
    'edge-small-architecture-op-2',
    'edge-small-architecture-timings',
  ],
};
