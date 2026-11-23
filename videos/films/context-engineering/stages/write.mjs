import { PACKET_CONTEXT_TARGETS } from '../fixtures.mjs';
import { boundedContext, contextProgress } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import {
  drawPacketFocus,
  drawPacketFooter,
  drawPacketFrame,
  drawPacketRow,
  drawPacketText,
  movePacketRow,
  movePacketVia,
} from '../defaults.mjs';
export function drawWrite(ctx, scene, state, api) {
  const modelState = sampleModel('write', state),
    currentBeat = modelState.step;
  if (paintWrite(ctx, scene, state, api)) return;
}
function paintWrite(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = boundedContext(state.beatP ?? 0),
    model = sampleModel('write', state);
  const cueProgress = (id, beat = currentBeat) => {
      const windows = {
        'ce-core-source-fields': [0.08, 0.3],
        'ce-core-lock-negative': [0.32, 0.62],
        'ce-core-drop-lock': [0.65, 0.95],
      };
      return contextProgress(state, id, beat, ...(windows[id] ?? [0.08, 0.88]));
    },
    resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) === 1;
  const paintPacket = () => {
    drawPacketFrame(ctx, api, currentBeat === 1 ? 'PARSED NOTE RECORDS' : 'ACTIVE REQUEST');
    if (currentBeat === 0) {
      drawPacketRow(
        ctx,
        api,
        'trace-17',
        'trace R17 · time 100 · status 403',
        150,
        390,
        themeColors.blue,
      );
      drawPacketRow(
        ctx,
        api,
        'lock-check',
        'same R17 / time 100 · locked=false',
        150,
        540,
        themeColors.yellow,
      );
      if (cueProgress('ce-core-source-fields', 0) > 0)
        movePacketVia(
          ctx,
          api,
          'observation',
          'authentication callback error · source trace-17',
          [1080, 390],
          cueProgress('ce-core-source-fields', 0),
          themeColors.blue,
        );
      if (cueProgress('ce-core-lock-negative', 0) > 0)
        movePacketVia(
          ctx,
          api,
          'checked negative',
          'migration lock absent for R17 at100',
          [1080, 540],
          cueProgress('ce-core-lock-negative', 0),
          themeColors.green,
        );
      const drop = cueProgress('ce-core-drop-lock', 0);
      movePacketRow(
        ctx,
        api,
        'old lock explanation',
        drop === 1 ? 'outside active request' : 'disproven candidate claim',
        [1080, 850],
        [150, 850],
        drop,
        themeColors.pink,
        650,
      );
    } else if (currentBeat === 1) {
      const q = cueProgress('ce-core-write-store', 1),
        serialized = JSON.stringify(model.verified),
        parsed = JSON.parse(serialized);
      drawPacketRow(
        ctx,
        api,
        'notes.json',
        'two source-bound records; archive retained',
        150,
        410,
        themeColors.blue,
        650,
        110,
      );
      parsed.forEach((note, i) => {
        drawPacketText(
          ctx,
          api,
          note.source + ': ' + note.finding,
          150,
          595 + i * 55,
          24,
          themeColors.blue,
        );
        const amount = boundedContext(q * 2 - i);
        if (amount > 0)
          movePacketVia(
            ctx,
            api,
            note.source,
            'same finding after JSON round trip',
            [1080, 430 + i * 170],
            amount,
            themeColors.green,
          );
      });
      drawPacketText(
        ctx,
        api,
        'actual UTF-8 note bytes: ' + Buffer.byteLength(serialized, 'utf8'),
        150,
        820,
        30,
        themeColors.cyan,
      );
      if (resultComplete('ce-core-archive', 1))
        drawPacketRow(
          ctx,
          api,
          'retained archive',
          'original trace remains available for later detail',
          150,
          880,
          themeColors.muted,
          1580,
          80,
        );
    } else {
      const q = cueProgress('ce-core-reload', 2);
      drawPacketRow(
        ctx,
        api,
        'external note store',
        'records outside this call until selected',
        150,
        410,
        themeColors.blue,
      );
      model.reloaded.forEach((note, i) =>
        movePacketRow(
          ctx,
          api,
          note.source,
          note.finding,
          [150, 570 + i * 150],
          [1080, 450 + i * 150],
          boundedContext(q * 2 - i),
          themeColors.green,
          650,
        ),
      );
      drawPacketText(
        ctx,
        api,
        'Reloaded text occupies model input again',
        150,
        900,
        34,
        themeColors.yellow,
      );
      drawPacketText(
        ctx,
        api,
        'Keep source revision, observation time and uncertainty',
        150,
        970,
        28,
        themeColors.cyan,
      );
    }
    drawPacketFooter(
      ctx,
      api,
      'Copy a selected source view into the call; storing the archive does not make its contents free input.',
    );
  };
  let staged = paintPacket;
  for (const id of PACKET_CONTEXT_TARGETS['write'] ?? []) {
    const next = staged;
    staged = () => drawPacketFocus(ctx, api, id, next);
  }
  drawPacketFocus(ctx, api, 'ce-core-write', staged);
  return true;
}
export default {
  id: 'write',
  draw: drawWrite,
  cues: [
    'write-beat-1-focus-1',
    'write-beat-1-focus-2',
    'ce-core-source-fields',
    'ce-core-lock-negative',
    'ce-core-drop-lock',
    'write-beat-2-focus-1',
    'write-beat-2-focus-2',
    'ce-core-write-store',
    'ce-core-archive',
    'write-beat-3-focus-1',
    'ce-core-reload',
  ],
};
