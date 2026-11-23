import { raceTrace } from '../model.mjs';
import { cueStep, shortInvoice, shortKey } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

export function drawRace(ctx, scene, state, api) {
  const { C } = api;
  const atomic = state.beat >= 2;
  const ops = atomic
    ? [
        ['race-contend', 2, 0.15, 0.28],
        ['race-wait', 2, 0.28, 0.45],
        ['race-accept', 2, 0.55, 0.69],
        ['race-reuse', 3, 0.08, 0.28],
      ]
    : [
        ['race-read-a', 0, 0.1, 0.22],
        ['race-read-b', 0, 0.28, 0.42],
        ['race-first-write', 0, 0.54, 0.7],
        ['race-second-write', 1, 0.08, 0.32],
      ];
  const steps = ops.map(([id, beat, start, end]) => cueStep(state, id, beat, start, end));
  const completed = steps.filter((p) => p === 1).length;
  const trace = raceTrace(atomic, completed);
  const workers = ['A', 'B'];

  text(
    ctx,
    api,
    atomic ? 'Unique key enforced by storage' : 'Each worker checks, then writes',
    120,
    276,
    43,
    atomic ? C.cyan : C.ink,
  );
  text(ctx, api, 'Event key   78291', 120, 353, 35, C.blue);
  text(ctx, api, atomic ? 'Request at storage' : 'Read saved by worker', 380, 470, 34, C.muted);
  text(ctx, api, 'Returned ID', 845, 470, 34, C.muted);
  workers.forEach((worker, i) => {
    const y = 588 + 174 * i;
    api.line(ctx, 120, y - 74, 1100, y - 74, C.muted, 1);
    api.focus.target('worker-' + worker.toLowerCase(), () => {
      text(ctx, api, 'Worker ' + worker, 120, y, 40, C.ink);
      const seen = completed > i;
      const outcome = completed > i + 2;
      const pending = atomic ? (i === 1 ? 'waiting on key' : 'insert key') : 'empty';
      const op = !seen ? 'ready' : atomic && outcome ? (i ? 'conflict' : 'inserted') : pending;
      text(ctx, api, op, 380, y, 43, seen ? C.blue : C.muted);
      const invoice = outcome ? shortInvoice(trace.rows[atomic ? 0 : i].id) : '?';
      text(ctx, api, invoice, 845, y, 49, outcome ? C.ink : C.muted);
    });
    const p = steps[i + 2];
    if (p > 0) {
      const ledgerY = 560 + (atomic ? 0 : i * 95);
      const bend = 1105 + i * 35;
      const route = [
        { x: 983, y: y - 15 },
        { x: bend, y: y - 15 },
        { x: bend, y: ledgerY },
        { x: 1182, y: ledgerY },
      ];
      const tip = api.trace(ctx, route, p, i ? C.cyan : C.blue, 3);
      if (tip) api.circle(ctx, tip.x, tip.y, p < 1 ? 8 : 5, i ? C.cyan : C.blue);
    }
  });
  api.focus.target('race-ledger', () => {
    api.rect(ctx, 1190, 375, 610, 468, C.panel, undefined, 12);
    text(ctx, api, 'Invoice ledger', 1235, 460, 44, C.ink);
    trace.rows.forEach((row, i) => {
      const y = 575 + i * 95;
      api.line(ctx, 1235, y - 65, 1755, y - 65, C.muted, 1);
      text(ctx, api, shortKey(row.event), 1235, y, 42, C.blue);
      text(ctx, api, shortInvoice(row.id), 1605, y, 49, C.ink);
    });
    text(ctx, api, 'Stored invoices: ' + trace.count, 1235, 796, 37, C.ink);
  });
  const prompt = atomic
    ? 'When B resumes, which invoice can it return?'
    : 'What will B do with its earlier read?';
  const outcome = atomic
    ? 'Both returns point to the same row.'
    : 'B used its earlier read. The same key now has two rows.';
  const question = completed === 3;
  api.focus.target('race-decision', () =>
    text(
      ctx,
      api,
      completed === 4
        ? outcome
        : question
          ? prompt
          : atomic
            ? 'One storage transaction binds the key to its invoice.'
            : 'The workers keep their own read results.',
      120,
      967,
      39,
      question ? C.yellow : C.ink,
    ),
  );
}

export default {
  id: 'race',
  draw: drawRace,
  cues: [
    'race-read-a',
    'race-read-b',
    'race-first-write',
    'race-second-write',
    'race-contend',
    'race-wait',
    'race-accept',
    'race-reuse',
  ],
};
