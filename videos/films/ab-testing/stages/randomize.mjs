import { abClamp } from '../arithmetic.mjs';
import { abExtendedScenes, assignmentTrace } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionNote,
  drawExpansionPath,
  withExpansionFocus,
  withFocus,
  writeEquation,
  writeExpansionText,
  writeText,
} from '../defaults.mjs';
export function drawRandomize(ctx, scene, state, api) {
  if (drawABExpansion(ctx, scene, state, api)) return;
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const R = (id, fallback, draw) =>
    state.cues?.[id] && api.focus ? api.focus.reveal(id, draw) : fallback ? draw() : undefined;
  {
    const trace = assignmentTrace(state, (id, fallback) =>
      api.focus ? api.focus.progress(id, fallback) : fallback,
    );
    const color = trace.arm ? themeColors.pink : themeColors.blue;
    withFocus(ctx, api, 'incident-identity', () => {
      writeText(ctx, api, 'Incident identity', 350, 310, 30, themeColors.yellow, 'center');
      api.components.card({
        label: trace.incident,
        x: 190,
        y: 380,
        width: 320,
        height: 110,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
        textColor: themeColors.yellow,
        fontSize: 38,
      });
    });
    R('randomize-hash', trace.hashVisible, () =>
      withFocus(ctx, api, 'experiment-hash', () => {
        writeText(ctx, api, 'Fixed experiment hash', 950, 310, 30, themeColors.cyan, 'center');
        api.components.card({
          label: `SHA-256 → byte ${trace.hashByte}`,
          x: 720,
          y: 380,
          width: 460,
          height: 110,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          textColor: themeColors.cyan,
          fontSize: 32,
        });
        writeEquation(ctx, api, String.raw`226\bmod 2=0`, 950, 570, 38, themeColors.cyan, 'center');
        api.line(ctx, 530, 435, 700, 435, themeColors.cyan, 4);
        const x = api.lerp(535, 695, trace.hashProgress);
        api.circle(ctx, x, 435, 9, themeColors.yellow);
      }),
    );
    R('randomize-arm', trace.armVisible, () =>
      withFocus(ctx, api, 'stored-assignment', () => {
        writeText(ctx, api, 'Stored once', 1530, 310, 30, color, 'center');
        api.components.card({
          label: `${trace.incident} · CONTROL`,
          x: 1300,
          y: 380,
          width: 460,
          height: 110,
          fill: themeColors.panel,
          stroke: color,
          textColor: color,
          fontSize: 31,
        });
        writeText(ctx, api, 'raw query', 1530, 555, 32, color, 'center');
        api.line(ctx, 1200, 435, 1280, 435, color, 4);
        api.circle(ctx, api.lerp(1205, 1275, trace.armProgress), 435, 9, color);
      }),
    );
    R('randomize-inherit', trace.messageVisible, () =>
      withFocus(ctx, api, 'inherited-assignment', () => {
        const x = api.lerp(190, 1300, trace.messageProgress);
        api.components.card({
          label: `${trace.incident} / message 2`,
          x,
          y: 700,
          width: 460,
          height: 100,
          fill: themeColors.panel,
          stroke: color,
          textColor: color,
          fontSize: 30,
        });
        writeText(ctx, api, 'Look up the stored policy', 950, 665, 30, themeColors.ink, 'center');
        if (trace.messageProgress > 0.98) {
          api.line(ctx, 1530, 680, 1530, 590, color, 4);
          writeText(ctx, api, 'CONTROL · raw query', 1530, 865, 30, color, 'center');
        }
      }),
    );
    if (currentBeat > 0)
      withFocus(ctx, api, 'incident-unit', () =>
        writeText(
          ctx,
          api,
          '1 incident · 1 assignment · later messages inherit it',
          960,
          970,
          31,
          themeColors.ink,
          'center',
        ),
      );
  }
}
function drawABExpansion(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('randomize') && !(beat > 0)) return false;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'inherited-assignment', () => {
    const bad = beat === 1;
    writeExpansionText(
      ctx,
      api,
      bad
        ? 'A message-level reassignment mixes incident exposure'
        : 'Restore one stored policy for the entire incident',
      960,
      280,
      35,
      bad ? themeColors.pink : themeColors.cyan,
      'center',
    );
    withExpansionFocus(ctx, api, 'stored-assignment', () =>
      drawExpansionCell(
        ctx,
        api,
        'inc-17\nfirst message → CONTROL',
        200,
        430,
        600,
        150,
        themeColors.blue,
        34,
      ),
    );
    if (!bad)
      withExpansionFocus(ctx, api, 'experiment-hash', () =>
        writeExpansionText(
          ctx,
          api,
          'inc-17 → locked byte 226 → CONTROL',
          960,
          350,
          29,
          themeColors.blue,
          'center',
        ),
      );
    const x = 1050,
      follow = bad ? 'later message → TREATMENT' : 'later message → CONTROL';
    drawExpansionCell(
      ctx,
      api,
      'inc-17\n' + follow,
      x,
      430,
      650,
      150,
      bad ? themeColors.pink : themeColors.blue,
      34,
    );
    drawExpansionPath(
      ctx,
      api,
      [
        {
          x: 510,
          y: 600,
        },
        {
          x: 510,
          y: 630,
        },
        {
          x: 1370,
          y: 630,
        },
        {
          x: 1370,
          y: 600,
        },
      ],
      bad ? themeColors.pink : themeColors.cyan,
      4,
    );
    const travel = abClamp(q * 1.4);
    drawExpansionCell(
      ctx,
      api,
      'CONTROL answer\ninc-17',
      510 + 860 * travel - 150,
      655,
      300,
      90,
      themeColors.blue,
      28,
    );
    withExpansionFocus(ctx, api, 'incident-unit', () =>
      writeExpansionText(
        ctx,
        api,
        bad
          ? 'Earlier answer can change the next message and its outcome'
          : 'Same immutable incident ID → look up its stored arm',
        960,
        840,
        34,
        bad ? themeColors.pink : themeColors.cyan,
        'center',
      ),
    );
    drawExpansionNote(
      ctx,
      api,
      'Shared staff and compute can still create interference between otherwise stable incident units.',
    );
  });
  return true;
}
export default {
  id: 'randomize',
  draw: drawRandomize,
  cues: [
    'randomize-unit',
    'randomize-hash',
    'randomize-arm',
    'randomize-inherit',
    'randomize-beat-2-focus-1',
    'randomize-beat-2-focus-2',
    'randomize-beat-3-focus-1',
    'randomize-beat-3-focus-2',
  ],
};
