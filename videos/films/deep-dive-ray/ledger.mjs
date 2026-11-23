import { rayApplyBatch } from './model.mjs';
import { rayFeature } from './arithmetic.mjs';
import { panel, text } from './defaults.mjs';

export const documents = ['cache', 'router', 'trace'];
export const results = documents.map(rayFeature);
const empty = { count: 0, records: {} };
export const recorded = rayApplyBatch(empty, 'B17', documents.length).ledger;
export const eighteen = rayApplyBatch(recorded, 'B18', 2);
export const nineteen = rayApplyBatch(eighteen.ledger, 'B19', 1);
export const replay = rayApplyBatch(nineteen.ledger, 'B18', 2);
export const fortyOne = rayApplyBatch(empty, 'B41', 5);
export const fortyTwo = rayApplyBatch(fortyOne.ledger, 'B42', 3);
export const replayFortyOne = rayApplyBatch(fortyTwo.ledger, 'B41', 5);

// The measured phrase controls travel. A committed value appears after its phrase.
export function motion(state, id, beat) {
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  const cue = state.cues?.[id];
  if (!cue) return state.cues ? 0 : Math.min(1, (state.beatP ?? 0) / 0.8);
  return cue.phase === 'after' ? 1 : cue.phase === 'during' ? cue.progress : 0;
}

export function passed(state, id, beat) {
  if (state.beat !== beat) return state.beat > beat;
  return state.cues ? state.cues[id]?.phase === 'after' : motion(state, id, beat) === 1;
}

export function drawWordRows(ctx, api, x, y, w, routerFocus = false) {
  const { C } = api;
  text(ctx, api, 'Driver’s handles', x, y, 43, C.ink);
  text(ctx, api, 'Task result', x + w, y, 32, C.green, 'right');
  for (const [i, word] of documents.entries()) {
    const rowY = y + 94 + i * 108;
    const drawRow = () => {
      api.line(ctx, x, rowY + 25, x + w, rowY + 25, C.muted, 2);
      text(ctx, api, String.fromCharCode(65 + i), x + 10, rowY, 34, C.cyan);
      text(ctx, api, word, x + 91, rowY, 40, C.ink);
      text(ctx, api, '(' + results[i].join(', ') + ')', x + w - 10, rowY, 42, C.green, 'right');
    };
    if (routerFocus && word === 'router') api.focus.target('router-row', drawRow);
    else drawRow();
  }
}

// Keep the current count and each historical reply on different ruled lines.
export function drawLedger(ctx, api, { x, y, w, ledger, selected, rowTarget, restoredBatch }) {
  const { C } = api;
  panel(ctx, api, x, y, w, 520, C.green);
  api.line(ctx, x + 42, y + 18, x + 42, y + 501, C.muted, 2);
  for (const dy of [78, 254, 430]) api.circle(ctx, x + 21, y + dy, 6, C.muted);
  text(ctx, api, 'Durable ledger', x + 72, y + 60, 39, C.ink);
  text(ctx, api, 'Published count ' + ledger.count, x + 72, y + 145, 49, C.green);
  text(ctx, api, 'Batch → original reply', x + 72, y + 224, 30, C.muted);
  Object.entries(ledger.records).forEach(([id, result], index) => {
    const lineY = y + 250 + 78 * index;
    const drawRow = () => {
      const color = selected === id ? C.yellow : C.ink;
      api.line(ctx, x + 64, lineY, x + w - 42, lineY, C.muted, 1.5);
      const prefix = id === restoredBatch ? 'Restored ledger · ' : '';
      text(ctx, api, prefix + id + ' →' + result, x + 76, lineY + 52, 40, color);
    };
    if (rowTarget && selected === id) api.focus.target(rowTarget, drawRow);
    else drawRow();
  });
}
