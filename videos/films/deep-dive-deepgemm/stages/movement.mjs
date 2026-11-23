import { deepGemmSentenceProgress, sampleDeepGemmVisual } from '../construction.mjs';
import { drawBox, drawLink, drawText } from '../defaults.mjs';
import { sentenceCues } from '../fixtures.mjs';

export function drawMovement(ctx, scene, state, api) {
  const m = sampleDeepGemmVisual(scene.id, state);
  const g = (b, i) => deepGemmSentenceProgress(scene.id, state, b, i);
  const { C, focus } = api;
  const card = (label, x, y, width, color) => drawBox(ctx, api, label, x, y, width, 100, color, 30);
  drawText(ctx, api, 'SM100  /  One block-scaled tile', 130, 242, 36, C.blue);
  const global = focus.target('movement-global-a-b', () =>
    card('Global A and B', 100, 359, 342, C.blue),
  );
  const operands = focus.target('movement-s-operands-shared-a-b-ready-shared-a-b-waiting', () =>
    card(
      m.operands ? 'Shared A and B · ready' : 'Shared A and B',
      553,
      359,
      408,
      m.operands ? C.cyan : C.muted,
    ),
  );
  const globalScales = card('Global scales', 100, 567, 342, C.pink);
  const sharedScales = card(
    m.scalesShared ? 'Shared scales · ready' : 'Shared scales',
    553,
    567,
    408,
    C.pink,
  );
  const issued = g(1, 1) >= 1;
  const multiply = focus.target('movement-instruction', () =>
    card(issued ? 'tcgen05 · issued' : 'Multiply', 1090, 359, 342, m.ready ? C.yellow : C.muted),
  );
  const accumulator = focus.target('movement-output-handoff', () =>
    card(
      m.complete ? 'TMEM sum · ready' : 'TMEM accumulator',
      1515,
      359,
      314,
      m.complete ? C.green : C.yellow,
    ),
  );
  const scaleSlot = focus.target('movement-scale-transfer', () =>
    focus.target('movement-scale-slot', () =>
      card(
        m.scalesTensor ? 'TMEM scales · ready' : 'TMEM scales · empty',
        1060,
        567,
        405,
        m.scalesTensor ? C.pink : C.muted,
      ),
    ),
  );
  if (m.load > 0) {
    drawLink(ctx, api, global, operands, m.load, C.cyan);
    drawLink(ctx, api, globalScales, sharedScales, m.load, C.pink);
  }
  if (m.scale > 0) drawLink(ctx, api, sharedScales, scaleSlot, m.scale, C.pink);
  if (m.ready) {
    drawLink(ctx, api, operands, multiply, 1, C.cyan);
    drawLink(ctx, api, scaleSlot, multiply, 1, C.pink);
    if (g(1, 1) > 0) drawLink(ctx, api, multiply, accumulator, g(1, 1), C.yellow);
  }

  if (m.b === 0 && g(0, 2) > 0) {
    focus.target('movement-copy-descriptors', () => {
      drawText(ctx, api, 'Toy copy rule  /  Inner stride must equal 1', 130, 760, 30, C.yellow);
      [m.layouts.base, m.layouts.transpose].forEach((view, i) => {
        const x = 130 + 856 * i;
        const outcome = view.accepted ? 'PASS' : 'FAIL';
        const showOutcome =
          i === 0 ||
          (state.cues ? state.cues['movement-beat-1-focus-2'].phase === 'after' : g(0, 3) >= 1);
        card(
          (i ? 'Transpose' : 'Base view') +
            '   [' +
            view.shape.join(', ') +
            ']   ·   strides [' +
            view.strides.join(', ') +
            ']',
          x,
          797,
          790,
          C.muted,
        );
        drawText(
          ctx,
          api,
          'inner stride ' + view.strides[1] + (showOutcome ? '    ' + outcome : ''),
          x + 395,
          946,
          29,
          showOutcome ? (view.accepted ? C.green : C.pink) : C.muted,
          'center',
        );
      });
    });
  }
  if (m.b === 2) {
    focus.target('movement-output-handoff', () => {
      card(
        m.outputReleased ? 'Output received' : 'Output waiting',
        1515,
        714,
        314,
        m.outputReleased ? C.green : C.muted,
      );
      if (m.releaseProgress > 0) {
        const points = [
          { x: 1843, y: 409 },
          { x: 1870, y: 409 },
          { x: 1870, y: 764 },
          { x: 1843, y: 764 },
        ];
        api.path(ctx, points.slice(0, 3), { color: C.green, width: 3 });
        api.arrow(ctx, 1870, 764, 1843, 764, C.green, 3);
        if (!m.outputReleased)
          api.components.particle({
            points,
            progress: m.releaseProgress,
            radius: 6,
            fill: C.green,
          });
      }
    });
  }
  const status =
    m.b === 0
      ? g(0, 4) > 0
        ? 'Can this tile issue its multiply yet?'
        : ''
      : m.outputReleased
        ? 'The output stage can convert or store the result'
        : m.complete
          ? 'The completed sum is available to the output stage'
          : issued
            ? 'The epilogue waits for matrix completion'
            : m.ready
              ? 'Shared operands and TMEM scales are ready'
              : 'The scale copy is the outstanding dependency';
  if (status) drawText(ctx, api, status, 960, m.b === 0 ? 1025 : 955, 37, C.yellow, 'center');
}
export default {
  id: 'movement',
  draw: drawMovement,
  cues: [...sentenceCues('movement'), 'movement-beat-1-focus-2'],
};
