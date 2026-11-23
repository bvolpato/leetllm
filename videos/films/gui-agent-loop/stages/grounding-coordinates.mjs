import { coordinateStage } from '../construction.mjs';
import {
  cueProgress,
  line,
  readoutCell,
  retainedDrawCard,
  retainedDrawText,
  taskHeader,
  text,
} from '../defaults.mjs';
import { coordinatePipeline } from '../model.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 2,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const coord = coordinatePipeline();
    const trace = coordinateStage(beat, progress2);
    const left = components.panel(
      {
        x: 135,
        y: 325,
        width: 790,
        height: 500,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 22,
      },
      () => {
        retainedDrawText(ctx, api, 'OBSERVED IMAGE', 530, 378, 28, themeColors.blue, 'center');
        const x = 210,
          y = 430,
          scale = 1.6;
        api.rect(ctx, x, y, 384 * scale, 232 * scale, themeColors.muted);
        api.rect(
          ctx,
          x + 32 * scale,
          y + 16 * scale,
          320 * scale,
          200 * scale,
          themeColors.bg,
          themeColors.cyan,
          0,
          2,
        );
        retainedDrawText(
          ctx,
          api,
          'Image padding',
          x + 180 * scale,
          y + 11 * scale,
          17,
          themeColors.ink,
          'center',
        );
        api.rect(
          ctx,
          x + 117 * scale,
          y + 48 * scale,
          110 * scale,
          36 * scale,
          themeColors.panel,
          themeColors.yellow,
          6,
          2,
        );
        retainedDrawText(
          ctx,
          api,
          'Open',
          x + 183 * scale,
          y + 75 * scale,
          24,
          themeColors.yellow,
          'center',
        );
        const targetX = x + coord.point.modelX * scale,
          targetY = y + coord.point.modelY * scale;
        api.focus.target('observed-point', () =>
          api.circle(ctx, targetX, targetY, 12, themeColors.yellow),
        );
        api.line(ctx, targetX - 20, targetY, targetX + 20, targetY, themeColors.yellow, 2);
        api.line(ctx, targetX, targetY - 20, targetX, targetY + 20, themeColors.yellow, 2);
        retainedDrawText(
          ctx,
          api,
          '(132, 66)',
          targetX,
          targetY + 80,
          27,
          themeColors.yellow,
          'center',
        );
        retainedDrawText(
          ctx,
          api,
          'Rendered crop 320 × 200',
          525,
          741,
          26,
          themeColors.cyan,
          'center',
        );
      },
    );
    const right = components.panel(
      {
        x: 1045,
        y: 325,
        width: 740,
        height: 500,
        fill: themeColors.panel,
        stroke: beat < 2 ? themeColors.yellow : themeColors.green,
        padding: 22,
      },
      () => {
        retainedDrawText(
          ctx,
          api,
          beat < 2 ? 'RESTORE CROP AND ORIGIN' : 'CSS VIEWPORT',
          1415,
          378,
          28,
          beat < 2 ? themeColors.yellow : themeColors.green,
          'center',
        );
        const x = 1155,
          y = 440;
        api.rect(ctx, x, y, 500, 300, themeColors.bg, themeColors.muted, 0, 2);
        api.rect(ctx, x + 50, y + 25, 320, 200, undefined, themeColors.cyan, 0, 2);
        api.rect(ctx, x + 135, y + 57, 110, 36, themeColors.panel, themeColors.yellow, 6, 2);
        retainedDrawText(ctx, api, 'Open', x + 201, y + 84, 20, themeColors.yellow, 'center');
        retainedDrawText(
          ctx,
          api,
          beat < 2 ? 'Screenshot 1000 × 600' : 'Viewport 500 × 300',
          x + 250,
          y + 265,
          25,
          themeColors.cyan,
          'center',
        );
        if (beat > 0) {
          const targetX = x + (beat < 2 ? trace.current.x / 2 : trace.current.x),
            targetY = y + (beat < 2 ? trace.current.y / 2 : trace.current.y);
          api.focus.target('native-point', () =>
            api.circle(
              ctx,
              targetX,
              targetY,
              12,
              beat < 2 ? themeColors.yellow : themeColors.green,
            ),
          );
          api.line(ctx, x, targetY, targetX - 20, targetY, themeColors.muted, 2);
          api.line(ctx, targetX, y, targetX, targetY - 20, themeColors.muted, 2);
          retainedDrawText(
            ctx,
            api,
            `${trace.current.label}: (${trace.current.x}, ${trace.current.y})`,
            1415,
            785,
            26,
            beat < 2 ? themeColors.yellow : themeColors.green,
            'center',
          );
        }
      },
    );
    route(
      left,
      right,
      beat < 2 ? themeColors.yellow : themeColors.green,
      beat === 0 ? 0 : q,
      beat === 0 ? 0 : 1,
    );
    const operators = [
      'Model point',
      '− image padding',
      '× inverse resize',
      '+ crop origin',
      '÷ device scale',
    ];
    trace.stages.slice(0, trace.index + 1).forEach((stage, i) => {
      const color =
        i === trace.index
          ? themeColors.yellow
          : i < trace.index
            ? themeColors.cyan
            : themeColors.muted;
      retainedDrawText(ctx, api, operators[i], 285 + i * 335, 870, 23, color, 'center');
      api.focus.target('coordinate-transforms', () =>
        retainedDrawCard(
          ctx,
          api,
          `(${stage.x}, ${stage.y})`,
          140 + i * 335,
          900,
          290,
          color,
          60,
          27,
        ),
      );
    });
  }
}
export function drawGroundingCoordinates(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const completed = (id, f) =>
    state.cues?.[id]?.phase === 'after' || (!state.cues?.[id] && cueProgress(ctx, api, id, f) >= 1);
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    taskHeader(ctx, api);
    const stages = coordinateStage(2, 1).stages,
      ids = ['coordinate-unpad', 'coordinate-scale', 'coordinate-origin', 'coordinate-css'],
      shown = ids.reduce(
        (n, id, i) => (completed(id, q(3, 0.12 + i * 0.2, 0.22 + i * 0.2)) ? i + 2 : n),
        1,
      );
    text(
      ctx,
      api,
      'Supplied 640×400 crop rendered 320×200 · origin (100,50) · DPR 2',
      960,
      355,
      31,
      themeColors.yellow,
      'center',
    );
    const ops = [
      'observed model point',
      'subtract padding (32,16)',
      'restore crop scale ×2',
      'add native origin (100,50)',
      'divide native coordinates by 2',
    ];
    stages.forEach((s, i) => {
      const y = 440 + i * 116,
        col =
          i >= shown ? themeColors.muted : i === shown - 1 ? themeColors.yellow : themeColors.blue;
      text(
        ctx,
        api,
        ops[i],
        180,
        y + 40,
        30,
        i === shown - 1 ? themeColors.yellow : themeColors.muted,
      );
      readoutCell(
        ctx,
        api,
        i < shown ? '(' + s.x + ', ' + s.y + ')' : 'pending',
        1260,
        y,
        400,
        col,
        85,
      );
      line(ctx, api, 920, y + 42, 1225, y + 42, themeColors.muted, 3);
    });
  };
  api.focus.target('grounding-coordinates-construction', body);
}
export default {
  id: 'grounding-coordinates',
  draw: drawGroundingCoordinates,
  cues: [
    'grounding-coordinates-b1-1',
    'grounding-coordinates-b2-1',
    'grounding-coordinates-b2-2',
    'grounding-coordinates-b3-1',
    'grounding-coordinates-construct-3',
    'coordinate-unpad',
    'coordinate-scale',
    'coordinate-origin',
    'coordinate-css',
  ],
};
