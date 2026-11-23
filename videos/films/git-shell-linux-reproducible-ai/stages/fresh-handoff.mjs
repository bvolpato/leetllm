import { freshRows } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { freshHandoffFrame } from '../model.mjs';
import { caption, freshRowsLane, mark, text, transfer } from '../defaults.mjs';
export function drawFreshHandoff(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    modelState = freshHandoffFrame(state);
  if (currentBeat === 0) {
    mark(api, 'fresh-gate-input', () =>
      freshRowsLane(ctx, api, 'New fixture', freshRows, 180, api.C.blue),
    );
    mark(api, 'fresh-gate-result', () => {
      text(ctx, api, 'Five normalized matches · seven records', 1250, 360, 33, api.C.ink, 'center');
      const left = cueProgress(state, 'fresh-integer-left', 0),
        right = cueProgress(state, 'fresh-integer-right', 0);
      text(
        ctx,
        api,
        left === 1 ? '5 × 3 = 15' : '5 × 3 = ?',
        1250,
        500,
        57,
        api.C.green,
        'center',
        true,
      );
      text(
        ctx,
        api,
        right === 1 ? '7 × 2 = 14' : '7 × 2 = ?',
        1250,
        630,
        57,
        api.C.cyan,
        'center',
        true,
      );
      if (modelState.initialReceipt) {
        text(ctx, api, '15 ≥ 14 → PASS', 1250, 790, 49, api.C.green, 'center');
        if (cueProgress(state, 'fresh-rounded-rate', 0) === 1)
          text(ctx, api, '5/7 ≈ 0.714', 1250, 880, 38, api.C.green, 'center', true);
      }
      caption(ctx, api, 'Use the exact integer comparison before the rounded display');
    });
  } else {
    mark(api, currentBeat === 1 ? 'fresh-snapshot-input' : 'fresh-repair-input', () => {
      freshRowsLane(
        ctx,
        api,
        'Working copy',
        modelState.working,
        180,
        api.C.blue,
        currentBeat === 1 ? modelState.localReceipt : null,
      );
      freshRowsLane(ctx, api, 'Selected snapshot', modelState.index, 750, api.C.yellow);
      transfer(
        ctx,
        api,
        modelState.restage > 0 ? '7-row repair' : '8-row snapshot',
        [200, 835],
        [770, 835],
        modelState.restage > 0 ? modelState.restage : modelState.stage,
        api.C.yellow,
        350,
      );
      if (modelState.repair > 0 && modelState.repair < 1)
        api.line(
          ctx,
          295,
          723 + modelState.repair * 18,
          575,
          723 + modelState.repair * 18,
          api.C.yellow,
          5,
        );
    });
    mark(api, currentBeat === 1 ? 'fresh-snapshot-question' : 'fresh-repair-result', () => {
      freshRowsLane(
        ctx,
        api,
        'Clean clone',
        modelState.cloneRows,
        1320,
        api.C.cyan,
        modelState.cloneReceipt,
      );
      transfer(
        ctx,
        api,
        'recorded contents',
        [770, 835],
        [1340, 835],
        modelState.clone,
        api.C.cyan,
        350,
      );
    });
    mark(api, 'fresh-snapshot-result', () => {
      if (modelState.cloneReceipt)
        text(
          ctx,
          api,
          currentBeat === 1
            ? '5 × 3 = 15 < 8 × 2 = 16 · 0.625 · exit 1'
            : '5 × 3 = 15 ≥ 7 × 2 = 14 · 0.714 · exit 0 · clean status',
          960,
          960,
          32,
          currentBeat === 1 ? api.C.pink : api.C.green,
          'center',
        );
      else
        text(
          ctx,
          api,
          currentBeat === 1
            ? 'Which file does the clone receive?'
            : 'Rebuild setup, then observe the complete receipt',
          960,
          960,
          34,
          api.C.muted,
          'center',
        );
    });
  }
}
export default {
  id: 'fresh-handoff',
  draw: drawFreshHandoff,
  cues: [
    'fresh-gate-question',
    'fresh-gate-pass',
    'fresh-integer-left',
    'fresh-integer-right',
    'fresh-rounded-rate',
    'fresh-stage-eight',
    'fresh-clone-question',
    'fresh-clone-fails',
    'fresh-append-eight',
    'fresh-working-repair',
    'fresh-working-pass',
    'fresh-clone-input',
    'fresh-repair',
    'fresh-final-receipt',
  ],
};
